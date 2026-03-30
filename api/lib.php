<?php
/**
 * Estado em JSON (sem MySQL). Pasta data/ bloqueada para acesso HTTP direto.
 */
declare(strict_types=1);

/** Pontos máximos por disciplina vindos de atividades avaliadas (soma das notas ≤ isto). */
const SENAI_DISCIPLINE_ACTIVITY_CAP = 30;
const SENAI_ACTIVITY_POINTS = 30;
const SENAI_INFRINGEMENT_POINTS = 5;
const SENAI_TOKEN_TTL = 86400 * 2;

/** @return array<string, int> */
function senai_default_discipline_slots(): array
{
    return [
        '_default' => 10,
        'DesenvolvimentoDeSistemas' => 20,
        'PHP' => 12,
        'Java' => 15,
        'Python' => 10,
        'BancoDeDados' => 12,
        'IoT' => 10,
        'Testes' => 12,
        'Curso' => 10,
        'Geral' => 10,
    ];
}

function senai_slots_for_discipline(array $disciplineSlots, string $discipline): int
{
    $d = trim($discipline) !== '' ? trim($discipline) : 'Geral';
    $n = (int) ($disciplineSlots[$d] ?? $disciplineSlots['_default'] ?? 10);
    return $n < 1 ? 1 : $n;
}

function senai_activity_max_points_for_slots(array $disciplineSlots, string $discipline): float
{
    $n = senai_slots_for_discipline($disciplineSlots, $discipline);

    return round(SENAI_DISCIPLINE_ACTIVITY_CAP / $n, 2);
}

/**
 * Soma das notas por disciplina (cada disciplina limitada a SENAI_DISCIPLINE_ACTIVITY_CAP), menos infrações.
 */
function senai_recalc_student_points(array &$student, array $disciplineSlots): void
{
    $byD = [];
    foreach ($student['activitiesSubmitted'] ?? [] as $a) {
        if (!is_array($a)) {
            continue;
        }
        $d = (string) ($a['discipline'] ?? 'Geral');
        if ($d === '') {
            $d = 'Geral';
        }
        if (!isset($byD[$d])) {
            $byD[$d] = 0.0;
        }
        if (isset($a['awardedPoints']) && is_numeric($a['awardedPoints'])) {
            $byD[$d] += (float) $a['awardedPoints'];
        }
    }
    $activityTotal = 0.0;
    foreach ($byD as $sum) {
        $activityTotal += min((float) SENAI_DISCIPLINE_ACTIVITY_CAP, $sum);
    }
    $inf = (int) ($student['infractionCount'] ?? 0);
    $student['points'] = max(0, (int) round($activityTotal - $inf * SENAI_INFRINGEMENT_POINTS));
}

/**
 * @return list<array{discipline:string,max:float,earned:float,earnedDisplay:float,pendingCount:int,perActivityMax:float}>
 */
function senai_discipline_grades_for_student(array $student, array $disciplineSlots): array
{
    $agg = [];
    foreach ($student['activitiesSubmitted'] ?? [] as $a) {
        if (!is_array($a)) {
            continue;
        }
        $d = (string) ($a['discipline'] ?? 'Geral');
        if ($d === '') {
            $d = 'Geral';
        }
        if (!isset($agg[$d])) {
            $per = senai_activity_max_points_for_slots($disciplineSlots, $d);
            $agg[$d] = [
                'discipline' => $d,
                'max' => (float) SENAI_DISCIPLINE_ACTIVITY_CAP,
                'perActivityMax' => $per,
                'earned' => 0.0,
                'pendingCount' => 0,
            ];
        }
        if (!array_key_exists('awardedPoints', $a) || $a['awardedPoints'] === null) {
            $agg[$d]['pendingCount']++;
        } else {
            $agg[$d]['earned'] += (float) $a['awardedPoints'];
        }
    }
    $out = [];
    foreach ($agg as $g) {
        $capped = min((float) SENAI_DISCIPLINE_ACTIVITY_CAP, $g['earned']);
        $out[] = [
            'discipline' => $g['discipline'],
            'max' => $g['max'],
            'perActivityMax' => $g['perActivityMax'],
            'earned' => $capped,
            'earnedDisplay' => round($capped, 2),
            'pendingCount' => $g['pendingCount'],
        ];
    }

    return $out;
}

/** Normaliza state.json (slots, migração de atividades). Retorna true se alterou e deve gravar. */
function senai_state_normalize(array &$state): bool
{
    $dirty = false;
    if (!isset($state['disciplineSlots']) || !is_array($state['disciplineSlots'])) {
        $state['disciplineSlots'] = senai_default_discipline_slots();
        $dirty = true;
    } else {
        foreach (senai_default_discipline_slots() as $k => $v) {
            if (!isset($state['disciplineSlots'][$k])) {
                $state['disciplineSlots'][$k] = $v;
                $dirty = true;
            }
        }
    }
    $slots = $state['disciplineSlots'];
    foreach ($state['students'] ?? [] as $mat => &$st) {
        if (!is_array($st)) {
            continue;
        }
        if (!isset($st['activitiesSubmitted']) || !is_array($st['activitiesSubmitted'])) {
            $st['activitiesSubmitted'] = [];
        }
        if (!isset($st['activityWorkspaces']) || !is_array($st['activityWorkspaces'])) {
            $st['activityWorkspaces'] = [];
            $dirty = true;
        }
        foreach ($st['activitiesSubmitted'] as &$act) {
            if (!is_array($act)) {
                continue;
            }
            $aid = isset($act['id']) ? trim((string) $act['id']) : '';
            // IDs inválidos (vazio, só zeros, tipo numérico 0 no JSON, etc.) geram novo ID estável no servidor.
            if ($aid === '' || !preg_match('/^[0-9a-f]{16}$/i', $aid)) {
                $act['id'] = bin2hex(random_bytes(8));
                $dirty = true;
            } else {
                $act['id'] = $aid;
            }
            $disc = (string) ($act['discipline'] ?? 'Geral');
            $mp = senai_activity_max_points_for_slots($slots, $disc);
            if (!array_key_exists('awardedPoints', $act)) {
                $act['maxPoints'] = $mp;
                $act['awardedPoints'] = $mp;
                $act['status'] = 'graded';
                $dirty = true;
            } else {
                if (!isset($act['maxPoints'])) {
                    $act['maxPoints'] = $mp;
                    $dirty = true;
                }
                if ($act['awardedPoints'] === null) {
                    $act['status'] = $act['status'] ?? 'pending';
                } else {
                    $act['status'] = 'graded';
                }
            }
        }
        unset($act);
        $prevPts = $st['points'] ?? null;
        senai_recalc_student_points($st, $slots);
        if ($prevPts !== ($st['points'] ?? null)) {
            $dirty = true;
        }
    }
    unset($st);

    return $dirty;
}

function senai_norm_workspace_path(string $p): string
{
    return strtolower(str_replace('\\', '/', trim($p)));
}

/** Chave estável por aula + campo (mesmo algoritmo no cliente: SHA-256 hex de path\\npageTitle\\ninputId). */
function senai_workspace_storage_key(string $path, string $pageTitle, string $inputId): string
{
    $path = senai_norm_workspace_path($path);
    $pageTitle = trim($pageTitle);
    $inputId = trim($inputId);

    return hash('sha256', $path . "\n" . $pageTitle . "\n" . $inputId);
}

function senai_ensure_student_workspace_bucket(array &$student): void
{
    if (!isset($student['activityWorkspaces']) || !is_array($student['activityWorkspaces'])) {
        $student['activityWorkspaces'] = [];
    }
}

function senai_data_dir(): string
{
    return __DIR__ . '/data';
}

function senai_state_file(): string
{
    return senai_data_dir() . '/state.json';
}

function senai_json_response(array $data, int $code = 200): void
{
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function senai_json_error(string $msg, int $code = 400): void
{
    senai_json_response(['error' => $msg], $code);
}

function senai_load_state(): array
{
    $dir = senai_data_dir();
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
    $path = senai_state_file();
    if (!is_file($path)) {
        $initial = [
            'adminEmail' => 'julianoqm@gmail.com',
            'adminPasswordHash' => password_hash('Juli@no', PASSWORD_DEFAULT),
            'professorUnlockCode' => '05061989',
            'students' => [],
            'adminTokens' => [],
            'disciplineSlots' => senai_default_discipline_slots(),
        ];
        senai_save_state($initial);

        return $initial;
    }
    $fp = fopen($path, 'rb');
    if (!$fp) {
        senai_json_error('Não foi possível ler o estado', 500);
    }
    flock($fp, LOCK_SH);
    $raw = stream_get_contents($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        senai_json_error('state.json inválido', 500);
    }
    if (!isset($data['students']) || !is_array($data['students'])) {
        $data['students'] = [];
    }
    if (!isset($data['adminTokens']) || !is_array($data['adminTokens'])) {
        $data['adminTokens'] = [];
    }
    $dirtyNorm = senai_state_normalize($data);
    if ($dirtyNorm) {
        senai_save_state($data);
    }

    return $data;
}

function senai_save_state(array $state): void
{
    $path = senai_state_file();
    $tmp = $path . '.tmp';
    $fp = fopen($tmp, 'wb');
    if (!$fp) {
        senai_json_error('Não foi possível gravar o estado', 500);
    }
    flock($fp, LOCK_EX);
    fwrite($fp, json_encode($state, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
    rename($tmp, $path);
}

function senai_norm_matricula(string $m): string
{
    return strtoupper(trim($m));
}

function senai_bearer_token(): ?string
{
    $h = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (preg_match('/Bearer\s+(\S+)/i', $h, $m)) {
        return trim($m[1]);
    }
    return null;
}

function senai_cleanup_tokens(array &$state): void
{
    $now = time();
    foreach ($state['adminTokens'] as $tok => $created) {
        if (!is_int($created) && !is_numeric($created)) {
            unset($state['adminTokens'][$tok]);
            continue;
        }
        if ($now - (int) $created > SENAI_TOKEN_TTL) {
            unset($state['adminTokens'][$tok]);
        }
    }
}

function senai_require_admin(array &$state): void
{
    $tok = senai_bearer_token();
    if (!$tok || !isset($state['adminTokens'][$tok])) {
        senai_json_error('Não autorizado', 401);
    }
    senai_cleanup_tokens($state);
    if (!isset($state['adminTokens'][$tok])) {
        senai_json_error('Sessão expirada', 401);
    }
}
