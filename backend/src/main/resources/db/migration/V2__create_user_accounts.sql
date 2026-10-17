CREATE TABLE IF NOT EXISTS pp_user (
    id BIGINT NOT NULL AUTO_INCREMENT,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(191) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uk_pp_user_email UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS pp_user_session (
    token_hash CHAR(64) NOT NULL,
    user_id BIGINT NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (token_hash),
    INDEX idx_pp_user_session_user (user_id),
    INDEX idx_pp_user_session_expiration (expires_at),
    CONSTRAINT fk_pp_user_session_user FOREIGN KEY (user_id) REFERENCES pp_user (id) ON DELETE CASCADE
);