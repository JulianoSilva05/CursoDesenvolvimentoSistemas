-- =============================================================================
-- SENAI Curso — MySQL (turmas + alunos por turma). Motor: InnoDB, utf8mb4.
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS senai_notices;
DROP TABLE IF EXISTS senai_workspaces;
DROP TABLE IF EXISTS senai_activities;
DROP TABLE IF EXISTS senai_students;
DROP TABLE IF EXISTS senai_admin_tokens;
DROP TABLE IF EXISTS senai_discipline_slots;
DROP TABLE IF EXISTS senai_turmas;
DROP TABLE IF EXISTS senai_config;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE senai_config (
    id TINYINT UNSIGNED NOT NULL DEFAULT 1 PRIMARY KEY,
    admin_email VARCHAR(255) NOT NULL,
    admin_password_hash VARCHAR(255) NOT NULL,
    professor_unlock_code VARCHAR(64) NOT NULL DEFAULT '',
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO senai_config (id, admin_email, admin_password_hash, professor_unlock_code) VALUES
(1, 'julianoqm@gmail.com', '$2y$10$REPLACE_WITH_BCRYPT_FROM_PHP_PASSWORD_HASH', '05061989');

CREATE TABLE senai_discipline_slots (
    discipline VARCHAR(64) NOT NULL PRIMARY KEY,
    slot_count INT UNSIGNED NOT NULL DEFAULT 10
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO senai_discipline_slots (discipline, slot_count) VALUES
('_default', 10),
('DesenvolvimentoDeSistemas', 20),
('PHP', 12),
('Java', 15),
('Python', 10),
('BancoDeDados', 12),
('IoT', 10),
('Testes', 12),
('Curso', 10),
('Geral', 10);

CREATE TABLE senai_admin_tokens (
    token CHAR(64) NOT NULL PRIMARY KEY,
    created_at INT UNSIGNED NOT NULL,
    INDEX idx_admin_tokens_ttl (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE senai_turmas (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(128) NOT NULL,
    ativo TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO senai_turmas (id, nome, ativo) VALUES (1, 'Turma exemplo', 1);

CREATE TABLE senai_students (
    turma_id INT UNSIGNED NOT NULL,
    matricula VARCHAR(32) NOT NULL,
    name VARCHAR(255) NOT NULL DEFAULT '',
    points INT NOT NULL DEFAULT 0,
    infraction_count INT UNSIGNED NOT NULL DEFAULT 0,
    session_id VARCHAR(64) NOT NULL DEFAULT '',
    last_seen BIGINT UNSIGNED NOT NULL DEFAULT 0,
    current_path VARCHAR(1024) NOT NULL DEFAULT '',
    current_title VARCHAR(512) NOT NULL DEFAULT '',
    last_infraction_reason VARCHAR(255) NOT NULL DEFAULT '',
    pending_reset_infractions TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (turma_id, matricula),
    INDEX idx_students_last_seen (last_seen),
    INDEX idx_students_session (session_id),
    CONSTRAINT fk_students_turma FOREIGN KEY (turma_id) REFERENCES senai_turmas (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE senai_activities (
    id CHAR(16) NOT NULL PRIMARY KEY,
    turma_id INT UNSIGNED NOT NULL,
    matricula VARCHAR(32) NOT NULL,
    lesson_title VARCHAR(512) NOT NULL DEFAULT '',
    discipline VARCHAR(64) NOT NULL DEFAULT 'Geral',
    submitted_at DATETIME(3) NULL,
    max_points DECIMAL(10,2) NOT NULL DEFAULT 0,
    awarded_points DECIMAL(10,2) NULL,
    status ENUM('pending', 'graded') NOT NULL DEFAULT 'pending',
    workspace_key CHAR(64) NULL,
    INDEX idx_act_tm (turma_id, matricula),
    CONSTRAINT fk_act_student FOREIGN KEY (turma_id, matricula) REFERENCES senai_students (turma_id, matricula) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE senai_workspaces (
    turma_id INT UNSIGNED NOT NULL,
    matricula VARCHAR(32) NOT NULL,
    storage_key CHAR(64) NOT NULL,
    path VARCHAR(1024) NOT NULL DEFAULT '',
    page_title VARCHAR(512) NOT NULL DEFAULT '',
    input_id VARCHAR(128) NOT NULL DEFAULT '',
    activity_label VARCHAR(512) NOT NULL DEFAULT '',
    discipline VARCHAR(64) NOT NULL DEFAULT '',
    code LONGTEXT NOT NULL,
    updated_at VARCHAR(64) NOT NULL DEFAULT '',
    professor_comment TEXT NULL,
    professor_comment_at VARCHAR(64) NULL DEFAULT '',
    PRIMARY KEY (turma_id, matricula, storage_key),
    CONSTRAINT fk_ws_student FOREIGN KEY (turma_id, matricula) REFERENCES senai_students (turma_id, matricula) ON DELETE CASCADE,
    INDEX idx_ws_updated (updated_at(32))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE senai_notices (
    notice_id VARCHAR(32) NOT NULL,
    turma_id INT UNSIGNED NOT NULL,
    matricula VARCHAR(32) NOT NULL,
    body TEXT NOT NULL,
    created_at BIGINT UNSIGNED NOT NULL,
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (turma_id, matricula, notice_id),
    CONSTRAINT fk_not_student FOREIGN KEY (turma_id, matricula) REFERENCES senai_students (turma_id, matricula) ON DELETE CASCADE,
    INDEX idx_not_unread (turma_id, matricula, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
