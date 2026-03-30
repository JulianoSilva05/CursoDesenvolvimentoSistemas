<?php
/**
 * API única em JSON (POST). action no corpo.
 * Hospedagem somente PHP: sem Node, sem MySQL — só arquivo data/state.json
 */
declare(strict_types=1);

require_once __DIR__ . '/lib.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    senai_json_error('Use POST com JSON', 405);
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) {
    senai_json_error('JSON inválido', 400);
}

$action = $data['action'] ?? '';
unset($data['action']);

$state = senai_load_state();
$tokenCountBefore = count($state['adminTokens']);
senai_cleanup_tokens($state);
if (count($state['adminTokens']) !== $tokenCountBefore) {
    senai_save_state($state);
}

switch ($action) {
    case 'admin_login': {
        $email = trim((string) ($data['email'] ?? ''));
        $password = (string) ($data['password'] ?? '');
        if ($email === '' || $password === '') {
            senai_json_error('Email e senha obrigatórios', 400);
        }
        if (strcasecmp($email, (string) $state['adminEmail']) !== 0) {
            senai_json_error('Credenciais inválidas', 401);
        }
        if (!password_verify($password, (string) $state['adminPasswordHash'])) {
            senai_json_error('Credenciais inválidas', 401);
        }
        $token = bin2hex(random_bytes(32));
        $state['adminTokens'][$token] = time();
        senai_save_state($state);
        senai_json_response(['ok' => true, 'token' => $token, 'email' => $state['adminEmail']]);
    }

    case 'admin_students': {
        senai_require_admin($state);
        $now = (int) (microtime(true) * 1000);
        $list = [];
        foreach ($state['students'] as $matricula => $s) {
            $last = (int) ($s['lastSeen'] ?? 0);
            $list[] = [
                'matricula' => $matricula,
                'name' => $s['name'] ?? '',
                'points' => $s['points'] ?? 0,
                'infractionCount' => $s['infractionCount'] ?? 0,
                'currentPath' => $s['currentPath'] ?? '',
                'currentTitle' => $s['currentTitle'] ?? '',
                'lastSeen' => $last,
                'online' => ($now - $last) < 45000,
                'sessionId' => $s['sessionId'] ?? '',
                'activitiesSubmitted' => $s['activitiesSubmitted'] ?? [],
            ];
        }
        $slots = $state['disciplineSlots'] ?? senai_default_discipline_slots();
        senai_json_response([
            'professorUnlockCodeSet' => !empty($state['professorUnlockCode']),
            'students' => $list,
            'disciplineSlots' => $slots,
            'config' => [
                'activityCapPerDiscipline' => SENAI_DISCIPLINE_ACTIVITY_CAP,
                'activityPoints' => SENAI_ACTIVITY_POINTS,
                'infractionPoints' => SENAI_INFRINGEMENT_POINTS,
            ],
        ]);
    }

    case 'admin_save_discipline_slots': {
        senai_require_admin($state);
        $slotsIn = $data['slots'] ?? null;
        if (!is_array($slotsIn)) {
            senai_json_error('Envie slots como objeto { disciplina: número de atividades }', 400);
        }
        if (!isset($state['disciplineSlots']) || !is_array($state['disciplineSlots'])) {
            $state['disciplineSlots'] = senai_default_discipline_slots();
        }
        foreach ($slotsIn as $k => $v) {
            $key = is_string($k) ? trim($k) : (string) $k;
            if ($key === '') {
                continue;
            }
            $n = (int) $v;
            $state['disciplineSlots'][$key] = $n < 1 ? 1 : $n;
        }
        $slots = $state['disciplineSlots'];
        foreach ($state['students'] ?? [] as &$st) {
            if (!is_array($st)) {
                continue;
            }
            foreach ($st['activitiesSubmitted'] ?? [] as &$act) {
                if (!is_array($act)) {
                    continue;
                }
                if (!array_key_exists('awardedPoints', $act) || $act['awardedPoints'] === null) {
                    $disc = trim((string) ($act['discipline'] ?? 'Geral'));
                    if ($disc === '') {
                        $disc = 'Geral';
                    }
                    $act['maxPoints'] = senai_activity_max_points_for_slots($slots, $disc);
                }
            }
            unset($act);
            senai_recalc_student_points($st, $slots);
        }
        unset($st);
        senai_save_state($state);
        senai_json_response(['ok' => true, 'disciplineSlots' => $state['disciplineSlots']]);
    }

    case 'admin_grade_activity': {
        senai_require_admin($state);
        $m = senai_norm_matricula((string) ($data['matricula'] ?? ''));
        $activityId = trim((string) ($data['activityId'] ?? ''));
        if ($m === '' || $activityId === '' || !isset($data['awardedPoints'])) {
            senai_json_error('matricula, activityId e awardedPoints obrigatórios', 400);
        }
        if (!isset($state['students'][$m])) {
            senai_json_error('Aluno não encontrado', 404);
        }
        $awarded = (float) $data['awardedPoints'];
        $s = &$state['students'][$m];
        $slots = $state['disciplineSlots'] ?? senai_default_discipline_slots();
        $found = false;
        foreach ($s['activitiesSubmitted'] ?? [] as &$act) {
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
            $found = true;
            break;
        }
        unset($act);
        if (!$found) {
            senai_json_error('Atividade não encontrada', 404);
        }
        senai_recalc_student_points($s, $slots);
        senai_save_state($state);
        senai_json_response(['ok' => true, 'points' => $s['points']]);
    }

    case 'admin_reset_infractions': {
        senai_require_admin($state);
        $m = senai_norm_matricula((string) ($data['matricula'] ?? ''));
        if ($m === '' || !isset($state['students'][$m])) {
            senai_json_error('Aluno não encontrado', 404);
        }
        $state['students'][$m]['infractionCount'] = 0;
        $state['students'][$m]['pendingResetInfractions'] = true;
        senai_save_state($state);
        senai_json_response(['ok' => true, 'matricula' => $m]);
    }

    case 'admin_notice': {
        senai_require_admin($state);
        $matricula = trim((string) ($data['matricula'] ?? ''));
        $message = trim((string) ($data['message'] ?? ''));
        if ($message === '') {
            senai_json_error('Mensagem vazia', 400);
        }
        $id = bin2hex(random_bytes(8));
        $notice = ['id' => $id, 'text' => $message, 'createdAt' => (int) round(microtime(true) * 1000), 'read' => false];
        $targets = [];
        if (strcasecmp($matricula, 'all') === 0) {
            $targets = array_keys($state['students']);
        } else {
            $targets = [senai_norm_matricula($matricula)];
        }
        if ($targets === [] || $targets === ['']) {
            senai_json_error('Matrícula inválida ou use all', 400);
        }
        $n = 0;
        foreach ($targets as $key) {
            $k = senai_norm_matricula($key);
            if ($k === '' || !isset($state['students'][$k])) {
                continue;
            }
            if (!isset($state['students'][$k]['notices']) || !is_array($state['students'][$k]['notices'])) {
                $state['students'][$k]['notices'] = [];
            }
            $state['students'][$k]['notices'][] = $notice;
            $n++;
        }
        senai_save_state($state);
        senai_json_response(['ok' => true, 'sentTo' => $n, 'id' => $id]);
    }

    case 'admin_password': {
        senai_require_admin($state);
        $old = (string) ($data['oldPassword'] ?? '');
        $new = (string) ($data['newPassword'] ?? '');
        if ($old === '' || strlen($new) < 6) {
            senai_json_error('Senhas inválidas (nova mín. 6 caracteres)', 400);
        }
        if (!password_verify($old, (string) $state['adminPasswordHash'])) {
            senai_json_error('Senha atual incorreta', 401);
        }
        $state['adminPasswordHash'] = password_hash($new, PASSWORD_DEFAULT);
        $state['adminTokens'] = [];
        senai_save_state($state);
        senai_json_response(['ok' => true]);
    }

    case 'admin_professor_unlock': {
        senai_require_admin($state);
        $code = trim((string) ($data['code'] ?? ''));
        if ($code === '') {
            senai_json_error('Código obrigatório', 400);
        }
        $state['professorUnlockCode'] = $code;
        senai_save_state($state);
        senai_json_response(['ok' => true]);
    }

    case 'admin_list_workspaces': {
        senai_require_admin($state);
        $list = [];
        foreach ($state['students'] ?? [] as $mat => $st) {
            if (!is_array($st)) {
                continue;
            }
            foreach ($st['activityWorkspaces'] ?? [] as $key => $ws) {
                if (!is_array($ws)) {
                    continue;
                }
                $code = (string) ($ws['code'] ?? '');
                $preview = strlen($code) > 200 ? substr($code, 0, 200) . '…' : $code;
                $list[] = [
                    'storageKey' => $key,
                    'matricula' => $mat,
                    'name' => $st['name'] ?? '',
                    'path' => $ws['path'] ?? '',
                    'pageTitle' => $ws['pageTitle'] ?? '',
                    'inputId' => $ws['inputId'] ?? '',
                    'activityLabel' => $ws['activityLabel'] ?? '',
                    'discipline' => $ws['discipline'] ?? '',
                    'updatedAt' => $ws['updatedAt'] ?? '',
                    'codePreview' => $preview,
                    'codeLength' => strlen($code),
                    'professorComment' => (string) ($ws['professorComment'] ?? ''),
                    'professorCommentAt' => $ws['professorCommentAt'] ?? '',
                ];
            }
        }
        usort($list, static function ($a, $b) {
            return strcmp((string) ($b['updatedAt'] ?? ''), (string) ($a['updatedAt'] ?? ''));
        });
        senai_json_response(['workspaces' => $list]);
    }

    case 'admin_workspace_comment': {
        senai_require_admin($state);
        $m = senai_norm_matricula((string) ($data['matricula'] ?? ''));
        $storageKey = trim((string) ($data['storageKey'] ?? ''));
        $comment = (string) ($data['professorComment'] ?? '');
        if ($m === '' || $storageKey === '') {
            senai_json_error('matricula e storageKey obrigatórios', 400);
        }
        if (!isset($state['students'][$m]['activityWorkspaces'][$storageKey])) {
            senai_json_error('Rascunho não encontrado', 404);
        }
        $state['students'][$m]['activityWorkspaces'][$storageKey]['professorComment'] = $comment;
        $state['students'][$m]['activityWorkspaces'][$storageKey]['professorCommentAt'] = gmdate('c');
        senai_save_state($state);
        senai_json_response(['ok' => true]);
    }

    case 'student_session': {
        $name = trim((string) ($data['name'] ?? ''));
        $matricula = senai_norm_matricula((string) ($data['matricula'] ?? ''));
        if (strlen($name) < 3 || strlen($matricula) < 2) {
            senai_json_error('Nome (mín. 3) e matrícula (mín. 2) obrigatórios', 400);
        }
        $sessionId = bin2hex(random_bytes(16));
        if (!isset($state['students'][$matricula])) {
            $state['students'][$matricula] = [
                'name' => $name,
                'points' => 0,
                'infractionCount' => 0,
                'activitiesSubmitted' => [],
                'activityWorkspaces' => [],
                'notices' => [],
            ];
        } else {
            $state['students'][$matricula]['name'] = $name;
        }
        $state['students'][$matricula]['sessionId'] = $sessionId;
        $state['students'][$matricula]['lastSeen'] = (int) round(microtime(true) * 1000);
        senai_save_state($state);
        $st = $state['students'][$matricula];
        $slots = $state['disciplineSlots'] ?? senai_default_discipline_slots();
        senai_json_response([
            'ok' => true,
            'sessionId' => $sessionId,
            'points' => $st['points'] ?? 0,
            'infractionCount' => $st['infractionCount'] ?? 0,
            'disciplineGrades' => senai_discipline_grades_for_student($st, $slots),
            'disciplineActivityCap' => SENAI_DISCIPLINE_ACTIVITY_CAP,
        ]);
    }

    case 'student_heartbeat': {
        $m = senai_norm_matricula((string) ($data['matricula'] ?? ''));
        $sessionId = (string) ($data['sessionId'] ?? '');
        if ($m === '' || !isset($state['students'][$m])) {
            senai_json_error('Sessão inválida', 404);
        }
        $s = &$state['students'][$m];
        if ($sessionId !== '' && ($s['sessionId'] ?? '') !== $sessionId) {
            senai_json_error('Sessão expirada', 401);
        }
        $s['lastSeen'] = (int) round(microtime(true) * 1000);
        $s['currentPath'] = (string) ($data['path'] ?? '');
        $s['currentTitle'] = (string) ($data['title'] ?? '');
        $notices = [];
        foreach ($s['notices'] ?? [] as $n) {
            if (empty($n['read'])) {
                $notices[] = $n;
            }
        }
        $reset = !empty($s['pendingResetInfractions']);
        if ($reset) {
            $s['pendingResetInfractions'] = false;
        }
        senai_save_state($state);
        $slots = $state['disciplineSlots'] ?? senai_default_discipline_slots();
        senai_json_response([
            'points' => $s['points'] ?? 0,
            'infractionCount' => $s['infractionCount'] ?? 0,
            'notices' => $notices,
            'resetInfractionsLocal' => $reset,
            'activityPoints' => SENAI_ACTIVITY_POINTS,
            'infractionPoints' => SENAI_INFRINGEMENT_POINTS,
            'disciplineGrades' => senai_discipline_grades_for_student($s, $slots),
            'disciplineActivityCap' => SENAI_DISCIPLINE_ACTIVITY_CAP,
        ]);
    }

    case 'student_notices_read': {
        $m = senai_norm_matricula((string) ($data['matricula'] ?? ''));
        $ids = $data['ids'] ?? [];
        if ($m === '' || !isset($state['students'][$m])) {
            senai_json_error('Aluno não encontrado', 404);
        }
        $idSet = array_flip(array_map('strval', is_array($ids) ? $ids : []));
        foreach ($state['students'][$m]['notices'] ?? [] as &$n) {
            if (isset($idSet[$n['id'] ?? ''])) {
                $n['read'] = true;
            }
        }
        unset($n);
        senai_save_state($state);
        senai_json_response(['ok' => true]);
    }

    case 'student_infraction': {
        $m = senai_norm_matricula((string) ($data['matricula'] ?? ''));
        $sessionId = (string) ($data['sessionId'] ?? '');
        if ($m === '' || !isset($state['students'][$m])) {
            senai_json_error('Aluno não encontrado', 404);
        }
        $s = &$state['students'][$m];
        if ($sessionId !== '' && ($s['sessionId'] ?? '') !== $sessionId) {
            senai_json_error('Sessão inválida', 401);
        }
        $s['infractionCount'] = (int) ($s['infractionCount'] ?? 0) + 1;
        $s['lastInfractionReason'] = (string) ($data['reason'] ?? '');
        $s['lastSeen'] = (int) round(microtime(true) * 1000);
        $slots = $state['disciplineSlots'] ?? senai_default_discipline_slots();
        senai_recalc_student_points($s, $slots);
        senai_save_state($state);
        senai_json_response([
            'ok' => true,
            'points' => $s['points'],
            'infractionCount' => $s['infractionCount'],
            'lostPoints' => SENAI_INFRINGEMENT_POINTS,
            'disciplineGrades' => senai_discipline_grades_for_student($s, $slots),
        ]);
    }

    case 'student_activity': {
        $m = senai_norm_matricula((string) ($data['matricula'] ?? ''));
        $sessionId = (string) ($data['sessionId'] ?? '');
        if ($m === '' || !isset($state['students'][$m])) {
            senai_json_error('Aluno não encontrado', 404);
        }
        $s = &$state['students'][$m];
        if ($sessionId !== '' && ($s['sessionId'] ?? '') !== $sessionId) {
            senai_json_error('Sessão inválida', 401);
        }
        $slots = $state['disciplineSlots'] ?? senai_default_discipline_slots();
        $discipline = trim((string) ($data['discipline'] ?? ''));
        if ($discipline === '') {
            $discipline = 'Geral';
        }
        $maxPoints = senai_activity_max_points_for_slots($slots, $discipline);
        if (!isset($s['activitiesSubmitted']) || !is_array($s['activitiesSubmitted'])) {
            $s['activitiesSubmitted'] = [];
        }
        $id = bin2hex(random_bytes(8));
        $wk = trim((string) ($data['workspaceKey'] ?? ''));
        $s['activitiesSubmitted'][] = [
            'id' => $id,
            'lessonTitle' => (string) ($data['lessonTitle'] ?? ''),
            'discipline' => $discipline,
            'at' => gmdate('c'),
            'maxPoints' => $maxPoints,
            'awardedPoints' => null,
            'status' => 'pending',
            'workspaceKey' => $wk !== '' ? $wk : null,
        ];
        $s['lastSeen'] = (int) round(microtime(true) * 1000);
        senai_recalc_student_points($s, $slots);
        senai_save_state($state);
        senai_json_response([
            'ok' => true,
            'points' => $s['points'],
            'activityId' => $id,
            'maxPoints' => $maxPoints,
            'pending' => true,
            'disciplineGrades' => senai_discipline_grades_for_student($s, $slots),
            'disciplineActivityCap' => SENAI_DISCIPLINE_ACTIVITY_CAP,
        ]);
    }

    case 'student_workspace_save': {
        $m = senai_norm_matricula((string) ($data['matricula'] ?? ''));
        $sessionId = (string) ($data['sessionId'] ?? '');
        if ($m === '' || !isset($state['students'][$m])) {
            senai_json_error('Aluno não encontrado', 404);
        }
        $s = &$state['students'][$m];
        if ($sessionId !== '' && ($s['sessionId'] ?? '') !== $sessionId) {
            senai_json_error('Sessão expirada', 401);
        }
        $path = (string) ($data['path'] ?? '');
        $pageTitle = (string) ($data['pageTitle'] ?? '');
        $inputId = (string) ($data['inputId'] ?? '');
        if (trim($inputId) === '') {
            senai_json_error('inputId obrigatório', 400);
        }
        $key = senai_workspace_storage_key($path, $pageTitle, $inputId);
        $code = (string) ($data['code'] ?? '');
        if (strlen($code) > 400000) {
            senai_json_error('Código muito grande (máx. 400000 caracteres)', 400);
        }
        senai_ensure_student_workspace_bucket($s);
        $prev = $s['activityWorkspaces'][$key] ?? [];
        if (!is_array($prev)) {
            $prev = [];
        }
        $s['activityWorkspaces'][$key] = [
            'path' => senai_norm_workspace_path($path),
            'pageTitle' => trim($pageTitle),
            'inputId' => trim($inputId),
            'activityLabel' => trim((string) ($data['activityLabel'] ?? '')),
            'discipline' => trim((string) ($data['discipline'] ?? '')),
            'code' => $code,
            'updatedAt' => gmdate('c'),
            'professorComment' => (string) ($prev['professorComment'] ?? ''),
            'professorCommentAt' => $prev['professorCommentAt'] ?? '',
        ];
        $s['lastSeen'] = (int) round(microtime(true) * 1000);
        senai_save_state($state);
        senai_json_response(['ok' => true, 'storageKey' => $key, 'updatedAt' => $s['activityWorkspaces'][$key]['updatedAt']]);
    }

    case 'student_workspace_load_many': {
        $m = senai_norm_matricula((string) ($data['matricula'] ?? ''));
        $sessionId = (string) ($data['sessionId'] ?? '');
        if ($m === '' || !isset($state['students'][$m])) {
            senai_json_error('Aluno não encontrado', 404);
        }
        $s = &$state['students'][$m];
        if ($sessionId !== '' && ($s['sessionId'] ?? '') !== $sessionId) {
            senai_json_error('Sessão expirada', 401);
        }
        $items = $data['items'] ?? [];
        if (!is_array($items)) {
            senai_json_error('items deve ser array', 400);
        }
        senai_ensure_student_workspace_bucket($s);
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
            $ws = $s['activityWorkspaces'][$key] ?? null;
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
        senai_json_response(['ok' => true, 'workspaces' => $out]);
    }

    case 'student_unlock': {
        $code = (string) ($data['code'] ?? '');
        $ok = $code !== '' && $code === (string) ($state['professorUnlockCode'] ?? '');
        senai_json_response(['ok' => $ok]);
    }

    default:
        senai_json_error('Ação desconhecida', 400);
}
