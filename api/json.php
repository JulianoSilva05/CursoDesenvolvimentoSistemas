<?php
/**
 * API única em JSON (POST). action no corpo. Persistência: MySQL (ver api/config.example.php).
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

try {
    require_once __DIR__ . '/db.php';
    require_once __DIR__ . '/repository.php';
} catch (Throwable $e) {
    senai_json_error('Servidor: ' . $e->getMessage(), 503);
}

$pdo = senai_pdo();
$repo = new SenaiRepository($pdo);
$repo->cleanupAdminTokens();

$auth = senai_bearer_token();

try {
    switch ($action) {
    case 'public_turmas':
        senai_json_response(['ok' => true, 'turmas' => $repo->listTurmasPublic()]);

    case 'admin_login': {
        $email = trim((string) ($data['email'] ?? ''));
        $password = (string) ($data['password'] ?? '');
        if ($email === '' || $password === '') {
            senai_json_error('Email e senha obrigatórios', 400);
        }
        senai_json_response($repo->adminLogin($email, $password));
    }

    case 'admin_students': {
        $repo->requireAdminToken($auth);
        senai_json_response($repo->adminStudentsList());
    }

    case 'admin_save_discipline_slots': {
        $repo->requireAdminToken($auth);
        senai_json_response($repo->adminSaveDisciplineSlots($data['slots'] ?? []));
    }

    case 'admin_grade_activity': {
        $repo->requireAdminToken($auth);
        $tid = (int) ($data['turmaId'] ?? 0);
        senai_json_response(
            $repo->adminGradeActivity(
                $tid,
                (string) ($data['matricula'] ?? ''),
                (string) ($data['activityId'] ?? ''),
                (float) ($data['awardedPoints'] ?? 0)
            )
        );
    }

    case 'admin_reset_infractions': {
        $repo->requireAdminToken($auth);
        $tid = (int) ($data['turmaId'] ?? 0);
        senai_json_response($repo->adminResetInfractions($tid, (string) ($data['matricula'] ?? '')));
    }

    case 'admin_notice': {
        $repo->requireAdminToken($auth);
        $matricula = trim((string) ($data['matricula'] ?? ''));
        $message = trim((string) ($data['message'] ?? ''));
        $tid = isset($data['turmaId']) ? (int) $data['turmaId'] : null;
        if ($tid !== null && $tid < 1) {
            $tid = null;
        }
        senai_json_response($repo->adminNotice($matricula, $message, $tid));
    }

    case 'admin_password': {
        $repo->requireAdminToken($auth);
        $repo->adminPassword((string) ($data['oldPassword'] ?? ''), (string) ($data['newPassword'] ?? ''));
        senai_json_response(['ok' => true]);
    }

    case 'admin_professor_unlock': {
        $repo->requireAdminToken($auth);
        $repo->adminProfessorUnlock((string) ($data['code'] ?? ''));
        senai_json_response(['ok' => true]);
    }

    case 'admin_list_workspaces': {
        $repo->requireAdminToken($auth);
        senai_json_response($repo->adminListWorkspaces());
    }

    case 'admin_workspace_comment': {
        $repo->requireAdminToken($auth);
        $tid = (int) ($data['turmaId'] ?? 0);
        $repo->adminWorkspaceComment(
            $tid,
            (string) ($data['matricula'] ?? ''),
            trim((string) ($data['storageKey'] ?? '')),
            (string) ($data['professorComment'] ?? '')
        );
        senai_json_response(['ok' => true]);
    }

    case 'admin_list_turmas': {
        $repo->requireAdminToken($auth);
        senai_json_response(['ok' => true, 'turmas' => $repo->adminListTurmas()]);
    }

    case 'admin_turma_save': {
        $repo->requireAdminToken($auth);
        $id = isset($data['id']) ? (int) $data['id'] : null;
        if ($id !== null && $id < 1) {
            $id = null;
        }
        $ativo = array_key_exists('ativo', $data) ? (bool) $data['ativo'] : true;
        senai_json_response($repo->adminTurmaSave($id, (string) ($data['nome'] ?? ''), $ativo));
    }

    case 'admin_turma_delete': {
        $repo->requireAdminToken($auth);
        $repo->adminTurmaDelete((int) ($data['id'] ?? 0));
        senai_json_response(['ok' => true]);
    }

    case 'student_session': {
        $tid = (int) ($data['turmaId'] ?? 0);
        if ($tid < 1) {
            senai_json_error('Selecione uma turma válida', 400);
        }
        senai_json_response(
            $repo->studentSession($tid, trim((string) ($data['name'] ?? '')), (string) ($data['matricula'] ?? ''))
        );
    }

    case 'student_heartbeat': {
        $tid = (int) ($data['turmaId'] ?? 0);
        if ($tid < 1) {
            senai_json_error('turmaId obrigatório', 400);
        }
        senai_json_response(
            $repo->studentHeartbeat(
                $tid,
                (string) ($data['matricula'] ?? ''),
                (string) ($data['sessionId'] ?? ''),
                (string) ($data['path'] ?? ''),
                (string) ($data['title'] ?? '')
            )
        );
    }

    case 'student_notices_read': {
        $tid = (int) ($data['turmaId'] ?? 0);
        if ($tid < 1) {
            senai_json_error('turmaId obrigatório', 400);
        }
        $repo->studentNoticesRead($tid, (string) ($data['matricula'] ?? ''), is_array($data['ids'] ?? null) ? $data['ids'] : []);
        senai_json_response(['ok' => true]);
    }

    case 'student_infraction': {
        $tid = (int) ($data['turmaId'] ?? 0);
        if ($tid < 1) {
            senai_json_error('turmaId obrigatório', 400);
        }
        senai_json_response(
            $repo->studentInfraction(
                $tid,
                (string) ($data['matricula'] ?? ''),
                (string) ($data['sessionId'] ?? ''),
                (string) ($data['reason'] ?? '')
            )
        );
    }

    case 'student_activity': {
        $tid = (int) ($data['turmaId'] ?? 0);
        if ($tid < 1) {
            senai_json_error('turmaId obrigatório', 400);
        }
        senai_json_response(
            $repo->studentActivity(
                $tid,
                (string) ($data['matricula'] ?? ''),
                (string) ($data['sessionId'] ?? ''),
                (string) ($data['lessonTitle'] ?? ''),
                (string) ($data['discipline'] ?? ''),
                isset($data['workspaceKey']) ? (string) $data['workspaceKey'] : null
            )
        );
    }

    case 'student_workspace_save': {
        $tid = (int) ($data['turmaId'] ?? 0);
        if ($tid < 1) {
            senai_json_error('turmaId obrigatório', 400);
        }
        senai_json_response(
            $repo->studentWorkspaceSave(
                $tid,
                (string) ($data['matricula'] ?? ''),
                (string) ($data['sessionId'] ?? ''),
                (string) ($data['path'] ?? ''),
                (string) ($data['pageTitle'] ?? ''),
                (string) ($data['inputId'] ?? ''),
                (string) ($data['activityLabel'] ?? ''),
                (string) ($data['discipline'] ?? ''),
                (string) ($data['code'] ?? '')
            )
        );
    }

    case 'student_workspace_load_many': {
        $tid = (int) ($data['turmaId'] ?? 0);
        if ($tid < 1) {
            senai_json_error('turmaId obrigatório', 400);
        }
        senai_json_response(
            $repo->studentWorkspaceLoadMany(
                $tid,
                (string) ($data['matricula'] ?? ''),
                (string) ($data['sessionId'] ?? ''),
                is_array($data['items'] ?? null) ? $data['items'] : []
            )
        );
    }

    case 'student_unlock':
        senai_json_response(['ok' => $repo->studentUnlock((string) ($data['code'] ?? ''))]);

    default:
        senai_json_error('Ação desconhecida', 400);
    }
} catch (Throwable $e) {
    $detail = $e->getMessage();
    if ($e instanceof PDOException) {
        senai_json_error('Erro no banco de dados: ' . $detail, 500);
    }
    senai_json_error('Erro no servidor: ' . $detail, 500);
}
