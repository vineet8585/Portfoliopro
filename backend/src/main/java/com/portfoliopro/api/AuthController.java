package com.portfoliopro.api;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final String SESSION_COOKIE = "pp_session";

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthService.User> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest servletRequest) {
        AuthService.Session session = authService.register(request.name(), request.email(), request.password());
        return ResponseEntity.created(java.net.URI.create("/api/auth/me"))
                .header(HttpHeaders.SET_COOKIE, sessionCookie(session.token(), servletRequest).toString())
                .body(session.user());
    }

    @PostMapping("/login")
    public ResponseEntity<AuthService.User> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest servletRequest) {
        AuthService.Session session = authService.login(request.email(), request.password());
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, sessionCookie(session.token(), servletRequest).toString())
                .body(session.user());
    }

    @GetMapping("/me")
    public ResponseEntity<AuthService.User> currentUser(
            @CookieValue(name = SESSION_COOKIE, required = false) String token) {
        AuthService.User user = authService.currentUser(token);
        return user == null ? ResponseEntity.noContent().build() : ResponseEntity.ok(user);
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, Boolean>> logout(
            @CookieValue(name = SESSION_COOKIE, required = false) String token,
            HttpServletRequest servletRequest) {
        authService.logout(token);
        ResponseCookie expiredCookie = ResponseCookie.from(SESSION_COOKIE, "")
                .httpOnly(true)
                .secure(servletRequest.isSecure())
                .sameSite("Lax")
                .path("/")
                .maxAge(Duration.ZERO)
                .build();
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, expiredCookie.toString())
                .body(Map.of("success", true));
    }

    private static ResponseCookie sessionCookie(String token, HttpServletRequest request) {
        return ResponseCookie.from(SESSION_COOKIE, token)
                .httpOnly(true)
                .secure(request.isSecure())
                .sameSite("Lax")
                .path("/")
                .maxAge(Duration.ofDays(14))
                .build();
    }

    public record RegisterRequest(
            @NotBlank
            @Size(max = 100) String name,
            @NotBlank
            @Email
            @Size(max = 191) String email,
            @NotBlank
            @Size(min = 8, max = 128) String password) {

    }

    public record LoginRequest(
            @NotBlank
            @Email
            @Size(max = 191) String email,
            @NotBlank
            @Size(max = 128) String password) {

    }
}
