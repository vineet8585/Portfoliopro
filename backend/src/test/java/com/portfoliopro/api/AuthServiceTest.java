package com.portfoliopro.api;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AuthServiceTest {

    @Test
    void passwordHashCanBeVerifiedWithoutStoringThePassword() {
        String password = "MarketPractice!42";
        String encoded = AuthService.hashPassword(password);

        assertNotEquals(password, encoded);
        assertTrue(AuthService.verifyPassword(password, encoded));
    }

    @Test
    void passwordVerificationRejectsWrongPasswordsAndMalformedHashes() {
        String encoded = AuthService.hashPassword("MarketPractice!42");

        assertFalse(AuthService.verifyPassword("NotThePassword!42", encoded));
        assertFalse(AuthService.verifyPassword("MarketPractice!42", "invalid"));
    }
}
