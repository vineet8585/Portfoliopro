package com.portfoliopro.config;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class DatabaseConfigTest {

    @Test
    void disablesTlsOnlyForLoopbackMysqlInLocalProfile() {
        assertEquals("DISABLED", DatabaseConfig.sslModeFor("127.0.0.1", true));
        assertEquals("DISABLED", DatabaseConfig.sslModeFor("localhost", true));
        assertEquals("REQUIRED", DatabaseConfig.sslModeFor("db.example.com", true));
        assertEquals("REQUIRED", DatabaseConfig.sslModeFor("127.0.0.1", false));
    }
}
