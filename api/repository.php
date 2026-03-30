<?php
declare(strict_types=1);

require_once __DIR__ . '/lib.php';

final class SenaiRepository
{
    public function __construct(private PDO $pdo) {}

    public function cleanupAdminTokens(): void
    {
        $cut = time() - SENAI_TOKEN_TTL;
        $this->pdo->prepare('DELETE FROM senai_admin_tokens WHERE created_at < ?')->execute([$cut]);
    }

    public function requireAdminToken(?string $token): void
    {
        if (!$token || strlen($token) !== 64 || !ctype_xdigit($token)) {
            senai_json_error('Não autorizado', 401);
        }
        $this->cleanupAdminTokens();
        $st = $this->pdo->prepare('SELECT 1 FROM senai_admin_tokens WHERE token = ? LIMIT 1');
        $st->execute([$token]);
        if (!$st->fetch()) {
            senai_json_error('Não autorizado', 401);
        }
    }

    /** @return array<string,int> */
    public function fetchDisciplineSlots(): array
    {
        $rows = $this->pdo->query('SELECT discipline, slot_count FROM senai_discipline_slots')->fetchAll();
        $out = [];
        foreach ($rows as $r) {
            $out[(string) $r['discipline']] = (int) $r['slot_count'];
        }
        foreach (senai_default_discipline_slots() as $k => $v) {
            if (!isset($out[$k])) {
                $out[$k] = $v;
            }
        }

        return $out;
    }

    private function persistSlots(array $slots): void
    {
        $ins = $this->pdo->prepare(
            'INSERT INTO senai_discipline_slots (discipline, slot_count) VALUES (?,?) ON DUPLICATE KEY UPDATE slot_count=VALUES(slot_count)'
        );
        foreach ($slots as $k => $v) {
            $ins->execute([(string) $k, max(1, (int) $v)]);
        }
    }

    private function activityRowToArray(array $a): array
    {
        $sub = $a['submitted_at'] ?? null;
        $at = gmdate('c');
        if ($sub !== null && $sub !== '') {
            $ts = strtotime((string) $sub);
            if ($ts !== false) {
                $at = gmdate('c', $ts);
            }
        }
        $awarded = $a['awarded_points'];

        return [
            'id' => (string) $a['id'],
            'lessonTitle' => (string) $a['lesson_title'],
            'discipline' => (string) $a['discipline'],
            'at' => $at,
            'maxPoints' => (float) $a['max_points'],
            'awardedPoints' => $awarded === null ? null : (float) $awarded,
            'status' => (string) $a['status'],
            'workspaceKey' => isset($a['workspace_key']) && $a['workspace_key'] !== '' && $a['workspace_key'] !== null
                ? (string) $a['workspace_key']
                : null,
        ];
    }

    /** @return array<string,mixed>|null */
    public function loadStudentArray(int $turmaId, string $matricula): ?array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM senai_students WHERE turma_id = ? AND matricula = ?');
        $stmt->execute([$turmaId, $matricula]);
        $row = $stmt->fetch();
        if (!$row) {
            return null;
        }

        $acts = $this->pdo->prepare(
            'SELECT * FROM senai_activities WHERE turma_id = ? AND matricula = ? ORDER BY submitted_at ASC, id ASC'
        );
        $acts->execute([$turmaId, $matricula]);
        $activitiesSubmitted = [];
        foreach ($acts->fetchAll() as $a) {
            $activitiesSubmitted[] = $this->activityRowToArray($a);
        }

        $wsStmt = $this->pdo->prepare('SELECT * FROM senai_workspaces WHERE turma_id = ? AND matricula = ?');
        $wsStmt->execute([$turmaId, $matricula]);
        $activityWorkspaces = [];
        foreach ($wsStmt->fetchAll() as $w) {
            $key = (string) $w['storage_key'];
            $activityWorkspaces[$key] = [
                'path' => (string) $w['path'],
                'pageTitle' => (string) $w['page_title'],
                'inputId' => (string) $w['input_id'],
                'activityLabel' => (string) $w['activity_label'],
                'discipline' => (string) $w['discipline'],
                'code' => (string) $w['code'],
                'updatedAt' => (string) $w['updated_at'],
                'professorComment' => (string) ($w['professor_comment'] ?? ''),
                'professorCommentAt' => $w['professor_comment_at'] ?? '',
            ];
        }

        $nStmt = $this->pdo->prepare('SELECT * FROM senai_notices WHERE turma_id = ? AND matricula = ? ORDER BY created_at ASC');
        $nStmt->execute([$turmaId, $matricula]);
        $notices = [];
        foreach ($nStmt->fetchAll() as $n) {
            $notices[] = [
                'id' => (string) $n['notice_id'],
                'text' => (string) $n['body'],
                'createdAt' => (int) $n['created_at'],
                'read' => (bool) $n['is_read'],
            ];
        }

        return [
            'name' => (string) $row['name'],
            'points' => (int) $row['points'],
            'infractionCount' => (int) $row['infraction_count'],
            'sessionId' => (string) $row['session_id'],
            'lastSeen' => (int) $row['last_seen'],
            'currentPath' => (string) $row['current_path'],
            'currentTitle' => (string) $row['current_title'],
            'lastInfractionReason' => (string) $row['last_infraction_reason'],
            'pendingResetInfractions' => (bool) $row['pending_reset_infractions'],
            'activitiesSubmitted' => $activitiesSubmitted,
            'activityWorkspaces' => $activityWorkspaces,
            'notices' => $notices,
        ];
    }

    public function saveStudentPoints(int $turmaId, string $matricula, int $points): void
    {
        $u = $this->pdo->prepare('UPDATE senai_students SET points = ? WHERE turma_id = ? AND matricula = ?');
        $u->execute([$points, $turmaId, $matricula]);
    }

    /**
     * Recalcula pontos a partir do array em memória e persiste.
     */
    public function recalcAndSavePoints(int $turmaId, string $matricula, array &$student, array $slots): void
    {
        senai_recalc_student_points($student, $slots);
        $this->saveStudentPoints($turmaId, $matricula, (int) ($student['points'] ?? 0));
    }

    public function adminLogin(string $email, string $password): array
    {
        $st = $this->pdo->query('SELECT admin_email, admin_password_hash FROM senai_config WHERE id = 1 LIMIT 1');
        $row = $st->fetch();
        if (!$row) {
            senai_json_error('Configuração ausente', 500);
        }
        if (strcasecmp($email, (string) $row['admin_email']) !== 0) {
            senai_json_error('Credenciais inválidas', 401);
        }
        if (!password_verify($password, (string) $row['admin_password_hash'])) {
            senai_json_error('Credenciais inválidas', 401);
        }
        $token = bin2hex(random_bytes(32));
        $this->pdo->prepare('INSERT INTO senai_admin_tokens (token, created_at) VALUES (?, ?)')->execute([$token, time()]);

        return ['ok' => true, 'token' => $token, 'email' => $row['admin_email']];
    }

    public function adminStudentsList(): array
    {
        $slots = $this->fetchDisciplineSlots();
        $st = $this->pdo->query(
            'SELECT s.*, t.nome AS turma_nome FROM senai_students s INNER JOIN senai_turmas t ON t.id = s.turma_id ORDER BY t.nome, s.matricula'
        );
        $now = (int) (microtime(true) * 1000);
        $list = [];
        foreach ($st->fetchAll() as $row) {
            $tid = (int) $row['turma_id'];
            $m = (string) $row['matricula'];
            $bundle = $this->loadStudentArray($tid, $m);
            if (!$bundle) {
                continue;
            }
            $list[] = [
                'turmaId' => $tid,
                'turmaNome' => (string) $row['turma_nome'],
                'matricula' => $m,
                'name' => $bundle['name'] ?? '',
                'points' => $bundle['points'] ?? 0,
                'infractionCount' => $bundle['infractionCount'] ?? 0,
                'currentPath' => $bundle['currentPath'] ?? '',
                'currentTitle' => $bundle['currentTitle'] ?? '',
                'lastSeen' => (int) ($bundle['lastSeen'] ?? 0),
                'online' => ($now - (int) ($bundle['lastSeen'] ?? 0)) < 45000,
                'sessionId' => $bundle['sessionId'] ?? '',
                'activitiesSubmitted' => $bundle['activitiesSubmitted'] ?? [],
            ];
        }

        $cfg = $this->pdo->query('SELECT professor_unlock_code FROM senai_config WHERE id = 1')->fetch();

        return [
            'professorUnlockCodeSet' => !empty($cfg['professor_unlock_code'] ?? ''),
            'students' => $list,
            'disciplineSlots' => $slots,
            'config' => [
                'activityCapPerDiscipline' => SENAI_DISCIPLINE_ACTIVITY_CAP,
                'activityPoints' => SENAI_ACTIVITY_POINTS,
                'infractionPoints' => SENAI_INFRINGEMENT_POINTS,
            ],
        ];
    }

    public function adminSaveDisciplineSlots(array $slotsIn): array
    {
        if (!is_array($slotsIn)) {
            senai_json_error('Envie slots como objeto { disciplina: número de atividades }', 400);
        }
        $slots = $this->fetchDisciplineSlots();
        foreach ($slotsIn as $k => $v) {
            $key = is_string($k) ? trim($k) : (string) $k;
            if ($key === '') {
                continue;
            }
            $n = (int) $v;
            $slots[$key] = $n < 1 ? 1 : $n;
        }
        $this->persistSlots($slots);

        $ids = $this->pdo->query('SELECT turma_id, matricula FROM senai_students')->fetchAll();
        foreach ($ids as $id) {
            $tid = (int) $id['turma_id'];
            $m = (string) $id['matricula'];
            $student = $this->loadStudentArray($tid, $m);
            if (!$student) {
                continue;
            }
            foreach ($student['activitiesSubmitted'] ?? [] as &$act) {
                if (!is_array($act)) {
                    continue;
                }
                if (!array_key_exists('awardedPoints', $act) || $act['awardedPoints'] === null) {
                    $disc = trim((string) ($act['discipline'] ?? 'Geral'));
                    if ($disc === '') {
                        $disc = 'Geral';
                    }
                    $act['maxPoints'] = senai_activity_max_points_for_slots($slots, $disc);
                    $this->pdo->prepare('UPDATE senai_activities SET max_points = ? WHERE id = ? AND turma_id = ? AND matricula = ?')->execute([
                        $act['maxPoints'],
                        $act['id'],
                        $tid,
                        $m,
                    ]);
                }
            }
            unset($act);
            $this->recalcAndSavePoints($tid, $m, $student, $slots);
        }

        return ['ok' => true, 'disciplineSlots' => $this->fetchDisciplineSlots()];
    }

    public function adminGradeActivity(int $turmaId, string $matricula, string $activityId, float $awarded): array
    {
        $m = senai_norm_matricula($matricula);
        $activityId = trim($activityId);
        if ($m === '' || $activityId === '') {
            senai_json_error('matricula, turmaId e activityId obrigatórios', 400);
        }
        $student = $this->loadStudentArray($turmaId, $m);
        if (!$student) {
            senai_json_error('Aluno não encontrado', 404);
        }
        $slots = $this->fetchDisciplineSlots();
        $found = false;
        foreach ($student['activitiesSubmitted'] ?? [] as &$act) {
            if (!is_array($act)) {
                continue;
            }
            if (trim((string) ($act['id'] ?? '')) !== $activityId) {
                continue;
            }
            $disc = (string) ($act['discipline'] ?? 'Geral');
            $max = (float) ($act['maxPoints'] ?? senai_activity_max_points_for_slots($slots, $disc));
            $act['maxPoints'] = $max;
            $act['awardedPoints'] = max(0.0, min($max, $awarded));
            $act['status'] = 'graded';
            $this->pdo->prepare(
                'UPDATE senai_activities SET max_points = ?, awarded_points = ?, status = ? WHERE id = ? AND turma_id = ? AND matricula = ?'
            )->execute([$max, $act['awardedPoints'], 'graded', $activityId, $turmaId, $m]);
            $found = true;
            break;
        }
        unset($act);
        if (!$found) {
            senai_json_error('Atividade não encontrada', 404);
        }
        $this->recalcAndSavePoints($turmaId, $m, $student, $slots);

        return ['ok' => true, 'points' => $student['points']];
    }

    public function adminResetInfractions(int $turmaId, string $matricula): array
    {
        $m = senai_norm_matricula($matricula);
        if ($m === '') {
            senai_json_error('Matrícula inválida', 400);
        }
        $student = $this->loadStudentArray($turmaId, $m);
        if (!$student) {
            senai_json_error('Aluno não encontrado', 404);
        }
        $this->pdo->prepare(
            'UPDATE senai_students SET infraction_count = 0, pending_reset_infractions = 1 WHERE turma_id = ? AND matricula = ?'
        )->execute([$turmaId, $m]);

        return ['ok' => true, 'matricula' => $m];
    }

    public function adminNotice(string $matricula, string $message, ?int $turmaIdForOne): array
    {
        $message = trim($message);
        if ($message === '') {
            senai_json_error('Mensagem vazia', 400);
        }
        $id = bin2hex(random_bytes(8));
        $createdAt = (int) round(microtime(true) * 1000);
        $ins = $this->pdo->prepare(
            'INSERT INTO senai_notices (notice_id, turma_id, matricula, body, created_at, is_read) VALUES (?,?,?,?,?,0)'
        );

        if (strcasecmp($matricula, 'all') === 0) {
            $pairs = $this->pdo->query('SELECT turma_id, matricula FROM senai_students')->fetchAll();
            $n = 0;
            foreach ($pairs as $p) {
                $ins->execute([$id, (int) $p['turma_id'], (string) $p['matricula'], $message, $createdAt]);
                ++$n;
            }

            return ['ok' => true, 'sentTo' => $n, 'id' => $id];
        }

        $m = senai_norm_matricula($matricula);
        if ($m === '' || $turmaIdForOne === null || $turmaIdForOne < 1) {
            senai_json_error('Para um aluno informe matrícula e turmaId', 400);
        }
        $student = $this->loadStudentArray($turmaIdForOne, $m);
        if (!$student) {
            senai_json_error('Aluno não encontrado nesta turma', 404);
        }
        $ins->execute([$id, $turmaIdForOne, $m, $message, $createdAt]);

        return ['ok' => true, 'sentTo' => 1, 'id' => $id];
    }

    public function adminPassword(string $old, string $new): void
    {
        if ($old === '' || strlen($new) < 6) {
            senai_json_error('Senhas inválidas (nova mín. 6 caracteres)', 400);
        }
        $st = $this->pdo->query('SELECT admin_password_hash FROM senai_config WHERE id = 1')->fetch();
        if (!$st || !password_verify($old, (string) $st['admin_password_hash'])) {
            senai_json_error('Senha atual incorreta', 401);
        }
        $hash = password_hash($new, PASSWORD_DEFAULT);
        $this->pdo->prepare('UPDATE senai_config SET admin_password_hash = ? WHERE id = 1')->execute([$hash]);
        $this->pdo->exec('DELETE FROM senai_admin_tokens');
    }

    public function adminProfessorUnlock(string $code): void
    {
        $code = trim($code);
        if ($code === '') {
            senai_json_error('Código obrigatório', 400);
        }
        $this->pdo->prepare('UPDATE senai_config SET professor_unlock_code = ? WHERE id = 1')->execute([$code]);
    }

    public function adminListWorkspaces(): array
    {
        $sql =
            'SELECT w.*, s.name AS student_name FROM senai_workspaces w INNER JOIN senai_students s ON s.turma_id = w.turma_id AND s.matricula = w.matricula ORDER BY w.updated_at DESC';
        $rows = $this->pdo->query($sql)->fetchAll();
        $list = [];
        foreach ($rows as $ws) {
            $code = (string) ($ws['code'] ?? '');
            $preview = strlen($code) > 200 ? substr($code, 0, 200) . '…' : $code;
            $list[] = [
                'turmaId' => (int) $ws['turma_id'],
                'storageKey' => (string) $ws['storage_key'],
                'matricula' => (string) $ws['matricula'],
                'name' => (string) ($ws['student_name'] ?? ''),
                'path' => $ws['path'] ?? '',
                'pageTitle' => $ws['page_title'] ?? '',
                'inputId' => $ws['input_id'] ?? '',
                'activityLabel' => $ws['activity_label'] ?? '',
                'discipline' => $ws['discipline'] ?? '',
                'updatedAt' => $ws['updated_at'] ?? '',
                'codePreview' => $preview,
                'codeLength' => strlen($code),
                'professorComment' => (string) ($ws['professor_comment'] ?? ''),
                'professorCommentAt' => $ws['professor_comment_at'] ?? '',
            ];
        }

        return ['workspaces' => $list];
    }

    public function adminWorkspaceComment(int $turmaId, string $matricula, string $storageKey, string $comment): void
    {
        $m = senai_norm_matricula($matricula);
        if ($m === '' || $storageKey === '') {
            senai_json_error('matricula, turmaId e storageKey obrigatórios', 400);
        }
        $u = $this->pdo->prepare(
            'UPDATE senai_workspaces SET professor_comment = ?, professor_comment_at = ? WHERE turma_id = ? AND matricula = ? AND storage_key = ?'
        );
        $u->execute([$comment, gmdate('c'), $turmaId, $m, $storageKey]);
        if ($u->rowCount() === 0) {
            senai_json_error('Rascunho não encontrado', 404);
        }
    }

    public function listTurmasPublic(): array
    {
        $st = $this->pdo->query('SELECT id, nome FROM senai_turmas WHERE ativo = 1 ORDER BY nome ASC');

        return $st->fetchAll();
    }

    /** @return list<array{id:int,nome:string,ativo:int}> */
    public function adminListTurmas(): array
    {
        return $this->pdo->query('SELECT id, nome, ativo FROM senai_turmas ORDER BY nome ASC')->fetchAll();
    }

    public function adminTurmaSave(?int $id, string $nome, bool $ativo): array
    {
        $nome = trim($nome);
        if ($nome === '') {
            senai_json_error('Nome da turma obrigatório', 400);
        }
        if ($id === null || $id < 1) {
            $this->pdo->prepare('INSERT INTO senai_turmas (nome, ativo) VALUES (?, ?)')->execute([$nome, $ativo ? 1 : 0]);
            $newId = (int) $this->pdo->lastInsertId();

            return ['ok' => true, 'id' => $newId];
        }
        $this->pdo->prepare('UPDATE senai_turmas SET nome = ?, ativo = ? WHERE id = ?')->execute([$nome, $ativo ? 1 : 0, $id]);

        return ['ok' => true, 'id' => $id];
    }

    public function adminTurmaDelete(int $id): void
    {
        if ($id < 1) {
            senai_json_error('Turma inválida', 400);
        }
        $this->pdo->prepare('DELETE FROM senai_turmas WHERE id = ?')->execute([$id]);
    }

    public function studentSession(int $turmaId, string $name, string $matricula): array
    {
        $name = trim($name);
        $matricula = senai_norm_matricula($matricula);
        if (strlen($name) < 3 || strlen($matricula) < 2) {
            senai_json_error('Nome (mín. 3) e matrícula (mín. 2) obrigatórios', 400);
        }
        $chk = $this->pdo->prepare('SELECT id FROM senai_turmas WHERE id = ? AND ativo = 1');
        $chk->execute([$turmaId]);
        if (!$chk->fetch()) {
            senai_json_error('Turma inválida ou inativa', 400);
        }
        $sessionId = bin2hex(random_bytes(16));
        $now = (int) round(microtime(true) * 1000);

        $exists = $this->pdo->prepare('SELECT 1 FROM senai_students WHERE turma_id = ? AND matricula = ?');
        $exists->execute([$turmaId, $matricula]);
        if (!$exists->fetch()) {
            $this->pdo->prepare(
                'INSERT INTO senai_students (turma_id, matricula, name, points, infraction_count, session_id, last_seen, current_path, current_title, last_infraction_reason, pending_reset_infractions) VALUES (?,?,?,?,0,?,?,\'\',\'\',\'\',0)'
            )->execute([$turmaId, $matricula, $name, 0, $sessionId, $now]);
        } else {
            $this->pdo->prepare('UPDATE senai_students SET name = ?, session_id = ?, last_seen = ? WHERE turma_id = ? AND matricula = ?')->execute([
                $name,
                $sessionId,
                $now,
                $turmaId,
                $matricula,
            ]);
        }

        $st = $this->loadStudentArray($turmaId, $matricula);
        if (!$st) {
            senai_json_error('Erro ao criar sessão', 500);
        }
        $slots = $this->fetchDisciplineSlots();

        return [
            'ok' => true,
            'sessionId' => $sessionId,
            'turmaId' => $turmaId,
            'points' => $st['points'] ?? 0,
            'infractionCount' => $st['infractionCount'] ?? 0,
            'disciplineGrades' => senai_discipline_grades_for_student($st, $slots),
            'disciplineActivityCap' => SENAI_DISCIPLINE_ACTIVITY_CAP,
        ];
    }

    public function studentHeartbeat(int $turmaId, string $matricula, string $sessionId, string $path, string $title): array
    {
        $m = senai_norm_matricula($matricula);
        $student = $this->loadStudentArray($turmaId, $m);
        if (!$student) {
            senai_json_error('Sessão inválida', 404);
        }
        if ($sessionId !== '' && ($student['sessionId'] ?? '') !== $sessionId) {
            senai_json_error('Sessão expirada', 401);
        }
        $now = (int) round(microtime(true) * 1000);
        $this->pdo->prepare(
            'UPDATE senai_students SET last_seen = ?, current_path = ?, current_title = ? WHERE turma_id = ? AND matricula = ?'
        )->execute([$now, $path, $title, $turmaId, $m]);

        $student = $this->loadStudentArray($turmaId, $m);
        if (!$student) {
            senai_json_error('Sessão inválida', 404);
        }
        $notices = [];
        foreach ($student['notices'] ?? [] as $n) {
            if (empty($n['read'])) {
                $notices[] = $n;
            }
        }
        $reset = !empty($student['pendingResetInfractions']);
        if ($reset) {
            $this->pdo->prepare('UPDATE senai_students SET pending_reset_infractions = 0 WHERE turma_id = ? AND matricula = ?')->execute([
                $turmaId,
                $m,
            ]);
        }
        $slots = $this->fetchDisciplineSlots();

        return [
            'points' => $student['points'] ?? 0,
            'infractionCount' => $student['infractionCount'] ?? 0,
            'notices' => $notices,
            'resetInfractionsLocal' => $reset,
            'activityPoints' => SENAI_ACTIVITY_POINTS,
            'infractionPoints' => SENAI_INFRINGEMENT_POINTS,
            'disciplineGrades' => senai_discipline_grades_for_student($student, $slots),
            'disciplineActivityCap' => SENAI_DISCIPLINE_ACTIVITY_CAP,
        ];
    }

    public function studentNoticesRead(int $turmaId, string $matricula, array $ids): void
    {
        $m = senai_norm_matricula($matricula);
        $student = $this->loadStudentArray($turmaId, $m);
        if (!$student) {
            senai_json_error('Aluno não encontrado', 404);
        }
        $idSet = array_flip(array_map('strval', $ids));
        foreach ($student['notices'] ?? [] as &$n) {
            if (isset($idSet[$n['id'] ?? ''])) {
                $n['read'] = true;
                $this->pdo->prepare('UPDATE senai_notices SET is_read = 1 WHERE turma_id = ? AND matricula = ? AND notice_id = ?')->execute([
                    $turmaId,
                    $m,
                    (string) ($n['id'] ?? ''),
                ]);
            }
        }
        unset($n);
    }

    public function studentInfraction(int $turmaId, string $matricula, string $sessionId, string $reason): array
    {
        $m = senai_norm_matricula($matricula);
        $student = $this->loadStudentArray($turmaId, $m);
        if (!$student) {
            senai_json_error('Aluno não encontrado', 404);
        }
        if ($sessionId !== '' && ($student['sessionId'] ?? '') !== $sessionId) {
            senai_json_error('Sessão inválida', 401);
        }
        $student['infractionCount'] = (int) ($student['infractionCount'] ?? 0) + 1;
        $student['lastInfractionReason'] = $reason;
        $now = (int) round(microtime(true) * 1000);
        $this->pdo->prepare(
            'UPDATE senai_students SET infraction_count = ?, last_infraction_reason = ?, last_seen = ? WHERE turma_id = ? AND matricula = ?'
        )->execute([$student['infractionCount'], $reason, $now, $turmaId, $m]);
        $slots = $this->fetchDisciplineSlots();
        $this->recalcAndSavePoints($turmaId, $m, $student, $slots);

        return [
            'ok' => true,
            'points' => $student['points'],
            'infractionCount' => $student['infractionCount'],
            'lostPoints' => SENAI_INFRINGEMENT_POINTS,
            'disciplineGrades' => senai_discipline_grades_for_student($student, $slots),
        ];
    }

    public function studentActivity(int $turmaId, string $matricula, string $sessionId, string $lessonTitle, string $discipline, ?string $workspaceKey): array
    {
        $m = senai_norm_matricula($matricula);
        $student = $this->loadStudentArray($turmaId, $m);
        if (!$student) {
            senai_json_error('Aluno não encontrado', 404);
        }
        if ($sessionId !== '' && ($student['sessionId'] ?? '') !== $sessionId) {
            senai_json_error('Sessão inválida', 401);
        }
        $slots = $this->fetchDisciplineSlots();
        $discipline = trim($discipline);
        if ($discipline === '') {
            $discipline = 'Geral';
        }
        $maxPoints = senai_activity_max_points_for_slots($slots, $discipline);
        $id = bin2hex(random_bytes(8));
        $wk = $workspaceKey !== null ? trim($workspaceKey) : '';
        $subAt = gmdate('Y-m-d H:i:s');
        $this->pdo->prepare(
            'INSERT INTO senai_activities (id, turma_id, matricula, lesson_title, discipline, submitted_at, max_points, awarded_points, status, workspace_key) VALUES (?,?,?,?,?,?,?,?,?,?)'
        )->execute([
            $id,
            $turmaId,
            $m,
            $lessonTitle,
            $discipline,
            $subAt,
            $maxPoints,
            null,
            'pending',
            $wk !== '' ? $wk : null,
        ]);
        $now = (int) round(microtime(true) * 1000);
        $this->pdo->prepare('UPDATE senai_students SET last_seen = ? WHERE turma_id = ? AND matricula = ?')->execute([$now, $turmaId, $m]);

        $student = $this->loadStudentArray($turmaId, $m);
        if (!$student) {
            senai_json_error('Erro ao registrar atividade', 500);
        }
        $this->recalcAndSavePoints($turmaId, $m, $student, $slots);

        return [
            'ok' => true,
            'points' => $student['points'],
            'activityId' => $id,
            'maxPoints' => $maxPoints,
            'pending' => true,
            'disciplineGrades' => senai_discipline_grades_for_student($student, $slots),
            'disciplineActivityCap' => SENAI_DISCIPLINE_ACTIVITY_CAP,
        ];
    }

    public function studentWorkspaceSave(
        int $turmaId,
        string $matricula,
        string $sessionId,
        string $path,
        string $pageTitle,
        string $inputId,
        string $activityLabel,
        string $discipline,
        string $code
    ): array {
        $m = senai_norm_matricula($matricula);
        $student = $this->loadStudentArray($turmaId, $m);
        if (!$student) {
            senai_json_error('Aluno não encontrado', 404);
        }
        if ($sessionId !== '' && ($student['sessionId'] ?? '') !== $sessionId) {
            senai_json_error('Sessão expirada', 401);
        }
        if (trim($inputId) === '') {
            senai_json_error('inputId obrigatório', 400);
        }
        if (strlen($code) > 400000) {
            senai_json_error('Código muito grande (máx. 400000 caracteres)', 400);
        }
        $key = senai_workspace_storage_key($path, $pageTitle, $inputId);
        senai_ensure_student_workspace_bucket($student);
        $prev = $student['activityWorkspaces'][$key] ?? [];
        if (!is_array($prev)) {
            $prev = [];
        }
        $row = [
            'path' => senai_norm_workspace_path($path),
            'pageTitle' => trim($pageTitle),
            'inputId' => trim($inputId),
            'activityLabel' => trim($activityLabel),
            'discipline' => trim($discipline),
            'code' => $code,
            'updatedAt' => gmdate('c'),
            'professorComment' => (string) ($prev['professorComment'] ?? ''),
            'professorCommentAt' => $prev['professorCommentAt'] ?? '',
        ];
        $this->pdo->prepare(
            'INSERT INTO senai_workspaces (turma_id, matricula, storage_key, path, page_title, input_id, activity_label, discipline, code, updated_at, professor_comment, professor_comment_at)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
             ON DUPLICATE KEY UPDATE path=VALUES(path), page_title=VALUES(page_title), input_id=VALUES(input_id), activity_label=VALUES(activity_label), discipline=VALUES(discipline), code=VALUES(code), updated_at=VALUES(updated_at), professor_comment=VALUES(professor_comment), professor_comment_at=VALUES(professor_comment_at)'
        )->execute([
            $turmaId,
            $m,
            $key,
            $row['path'],
            $row['pageTitle'],
            $row['inputId'],
            $row['activityLabel'],
            $row['discipline'],
            $row['code'],
            $row['updatedAt'],
            $row['professorComment'] !== '' ? $row['professorComment'] : null,
            $row['professorCommentAt'] !== '' ? $row['professorCommentAt'] : null,
        ]);
        $now = (int) round(microtime(true) * 1000);
        $this->pdo->prepare('UPDATE senai_students SET last_seen = ? WHERE turma_id = ? AND matricula = ?')->execute([$now, $turmaId, $m]);

        return ['ok' => true, 'storageKey' => $key, 'updatedAt' => $row['updatedAt']];
    }

    public function studentWorkspaceLoadMany(int $turmaId, string $matricula, string $sessionId, array $items): array
    {
        $m = senai_norm_matricula($matricula);
        $student = $this->loadStudentArray($turmaId, $m);
        if (!$student) {
            senai_json_error('Aluno não encontrado', 404);
        }
        if ($sessionId !== '' && ($student['sessionId'] ?? '') !== $sessionId) {
            senai_json_error('Sessão expirada', 401);
        }
        senai_ensure_student_workspace_bucket($student);
        $out = [];
        foreach ($items as $it) {
            if (!is_array($it)) {
                continue;
            }
            $path = (string) ($it['path'] ?? '');
            $pageTitle = (string) ($it['pageTitle'] ?? '');
            $inputId = (string) ($it['inputId'] ?? '');
            if (trim($inputId) === '') {
                continue;
            }
            $key = senai_workspace_storage_key($path, $pageTitle, $inputId);
            $ws = $student['activityWorkspaces'][$key] ?? null;
            if (!is_array($ws)) {
                $out[$key] = null;
            } else {
                $out[$key] = [
                    'code' => (string) ($ws['code'] ?? ''),
                    'professorComment' => (string) ($ws['professorComment'] ?? ''),
                    'professorCommentAt' => $ws['professorCommentAt'] ?? '',
                    'updatedAt' => $ws['updatedAt'] ?? '',
                ];
            }
        }

        return ['ok' => true, 'workspaces' => $out];
    }

    public function studentUnlock(string $code): bool
    {
        $st = $this->pdo->query('SELECT professor_unlock_code FROM senai_config WHERE id = 1')->fetch();

        return $code !== '' && $code === (string) ($st['professor_unlock_code'] ?? '');
    }
}
