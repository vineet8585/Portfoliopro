package com.portfoliopro.api;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Service
public class AuthService {

    private static final int PASSWORD_ITERATIONS = 310_000;
    private static final int PASSWORD_KEY_BITS = 256;
    private static final int PASSWORD_SALT_BYTES = 16;
    private static final int SESSION_TOKEN_BYTES = 32;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final String PASSWORD_ALGORITHM = "PBKDF2WithHmacSHA256";

    private final JdbcTemplate jdbcTemplate;

    public AuthService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional
    public Session register(String fullName, String email, String password) {
        String normalizedEmail = normalizeEmail(email);
        String normalizedName = fullName.trim();
        try {
            jdbcTemplate.update(
                    "INSERT INTO pp_user (full_name, email, password_hash) VALUES (?, ?, ?)",
                    normalizedName, normalizedEmail, hashPassword(password));
        } catch (DuplicateKeyException error) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists.");
        }

        User user = findByEmail(normalizedEmail).orElseThrow().user();
        return createSession(user);
    }

    @Transactional
    public Session login(String email, String password) {
        UserWithPassword account = findByEmail(normalizeEmail(email))
                .orElseThrow(AuthService::invalidCredentials);
        if (!verifyPassword(password, account.passwordHash())) {
            throw invalidCredentials();
        }
        return createSession(account.user());
    }

    public User currentUser(String token) {
        if (token == null || token.isBlank()) {
            return null;
        }
        List<User> users = jdbcTemplate.query(
                "SELECT u.id, u.full_name, u.email, u.created_at "
                + "FROM pp_user_session s JOIN pp_user u ON u.id = s.user_id "
                + "WHERE s.token_hash = ? AND s.expires_at > ?",
                (result, row) -> new User(
                        result.getLong("id"),
                        result.getString("full_name"),
                        result.getString("email"),
                        result.getTimestamp("created_at").toInstant()),
                hashToken(token), Timestamp.from(Instant.now()));
        return users.stream().findFirst().orElse(null);
    }

    public void logout(String token) {
        if (token != null && !token.isBlank()) {
            jdbcTemplate.update("DELETE FROM pp_user_session WHERE token_hash = ?", hashToken(token));
        }
    }

    static String hashPassword(String password) {
        byte[] salt = new byte[PASSWORD_SALT_BYTES];
        SECURE_RANDOM.nextBytes(salt);
        byte[] derived = derivePassword(password, salt, PASSWORD_ITERATIONS);
        return "pbkdf2_sha256$" + PASSWORD_ITERATIONS + "$"
                + Base64.getEncoder().withoutPadding().encodeToString(salt) + "$"
                + Base64.getEncoder().withoutPadding().encodeToString(derived);
    }

    static boolean verifyPassword(String password, String encoded) {
        try {
            String[] parts = encoded.split("\\$", -1);
            if (parts.length != 4 || !"pbkdf2_sha256".equals(parts[0])) {
                return false;
            }
            int iterations = Integer.parseInt(parts[1]);
            byte[] salt = Base64.getDecoder().decode(parts[2]);
            byte[] expected = Base64.getDecoder().decode(parts[3]);
            byte[] actual = derivePassword(password, salt, iterations);
            return MessageDigest.isEqual(expected, actual);
        } catch (IllegalArgumentException error) {
            return false;
        }
    }

    private Session createSession(User user) {
        byte[] tokenBytes = new byte[SESSION_TOKEN_BYTES];
        SECURE_RANDOM.nextBytes(tokenBytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);
        Instant expiresAt = Instant.now().plus(14, ChronoUnit.DAYS);
        jdbcTemplate.update(
                "INSERT INTO pp_user_session (token_hash, user_id, expires_at) VALUES (?, ?, ?)",
                hashToken(token), user.id(), Timestamp.from(expiresAt));
        jdbcTemplate.update("DELETE FROM pp_user_session WHERE expires_at <= ?", Timestamp.from(Instant.now()));
        return new Session(user, token, expiresAt);
    }

    private Optional<UserWithPassword> findByEmail(String email) {
        List<UserWithPassword> users = jdbcTemplate.query(
                "SELECT id, full_name, email, password_hash, created_at FROM pp_user WHERE email = ?",
                (result, row) -> new UserWithPassword(
                        new User(
                                result.getLong("id"),
                                result.getString("full_name"),
                                result.getString("email"),
                                result.getTimestamp("created_at").toInstant()),
                        result.getString("password_hash")),
                email);
        return users.stream().findFirst();
    }

    private static ResponseStatusException invalidCredentials() {
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email or password is incorrect.");
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private static String hashToken(String token) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(token.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException error) {
            throw new IllegalStateException("SHA-256 is unavailable.", error);
        }
    }

    private static byte[] derivePassword(String password, byte[] salt, int iterations) {
        PBEKeySpec spec = new PBEKeySpec(password.toCharArray(), salt, iterations, PASSWORD_KEY_BITS);
        try {
            return SecretKeyFactory.getInstance(PASSWORD_ALGORITHM).generateSecret(spec).getEncoded();
        } catch (GeneralSecurityException error) {
            throw new IllegalStateException("Password hashing is unavailable.", error);
        } finally {
            spec.clearPassword();
        }
    }

    public record User(long id, String name, String email, Instant createdAt) {

    }

    public record Session(User user, String token, Instant expiresAt) {

    }

    private record UserWithPassword(User user, String passwordHash) {

    }
}
