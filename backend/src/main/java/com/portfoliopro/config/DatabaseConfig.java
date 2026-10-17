package com.portfoliopro.config;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.boot.flyway.autoconfigure.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;

import javax.sql.DataSource;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

@Configuration
public class DatabaseConfig {

    @Bean
    @Profile("local")
    FlywayMigrationStrategy localFlywayMigrationStrategy() {
        return flyway -> {
            flyway.repair();
            flyway.migrate();
        };
    }

    @Bean
    DataSource dataSource(Environment environment) {
        String dsn = environment.getProperty("DATABASE_URL");
        if (dsn == null || dsn.isBlank()) {
            dsn = environment.getProperty("DRIZZLE_DATABASE_URL");
        }
        if (dsn == null || dsn.isBlank()) {
            if (java.util.Arrays.asList(environment.getActiveProfiles()).contains("local")) {
                return localDataSource();
            }
            throw new IllegalStateException("DATABASE_URL is required for PortfolioPro.");
        }

        try {
            int queryIndex = dsn.indexOf('?');
            String address = queryIndex < 0 ? dsn : dsn.substring(0, queryIndex);
            URI uri = URI.create(address);
            if (!"mysql".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null) {
                throw new IllegalArgumentException("Expected a mysql:// database URL.");
            }

            String rawUserInfo = uri.getRawUserInfo();
            int separator = rawUserInfo == null ? -1 : rawUserInfo.indexOf(':');
            if (separator < 1) {
                throw new IllegalArgumentException("Database URL must contain username and password.");
            }
            String username = decodeUriPart(rawUserInfo.substring(0, separator));
            String password = decodeUriPart(rawUserInfo.substring(separator + 1));
            String rawPath = uri.getRawPath();
            if (rawPath == null || rawPath.length() < 2 || rawPath.substring(1).contains("/")) {
                throw new IllegalArgumentException("Database URL must name one database.");
            }
            String database = decodeUriPart(rawPath.substring(1));
            String host = uri.getHost().contains(":") ? "[" + uri.getHost() + "]" : uri.getHost();
            int port = uri.getPort() > 0 ? uri.getPort() : 3306;
            boolean localProfile = java.util.Arrays.asList(environment.getActiveProfiles()).contains("local");
            String sslMode = sslModeFor(uri.getHost(), localProfile);
            String jdbcUrl = "jdbc:mysql://" + host + ":" + port + "/" + database
                    + "?sslMode=" + sslMode + "&serverTimezone=UTC";

            HikariDataSource dataSource = new HikariDataSource();
            dataSource.setPoolName("PortfolioProMySQL");
            dataSource.setDriverClassName("com.mysql.cj.jdbc.Driver");
            dataSource.setJdbcUrl(jdbcUrl);
            dataSource.setUsername(username);
            dataSource.setPassword(password);
            dataSource.setMaximumPoolSize(5);
            dataSource.setMinimumIdle(0);
            dataSource.setConnectionTimeout(15_000);
            dataSource.setInitializationFailTimeout(15_000);
            return dataSource;
        } catch (RuntimeException error) {
            if (error instanceof IllegalStateException) {
                throw error;
            }
            throw new IllegalStateException("DATABASE_URL is not a valid MySQL connection URL.");
        }
    }

    private static String decodeUriPart(String value) {
        return URLDecoder.decode(value.replace("+", "%2B"), StandardCharsets.UTF_8);
    }

    static String sslModeFor(String host, boolean localProfile) {
        String normalizedHost = host.toLowerCase(java.util.Locale.ROOT);
        boolean loopback = normalizedHost.equals("localhost")
                || normalizedHost.equals("127.0.0.1")
                || normalizedHost.equals("::1")
                || normalizedHost.equals("[::1]");
        return localProfile && loopback ? "DISABLED" : "REQUIRED";
    }

    private static DataSource localDataSource() {
        HikariDataSource dataSource = new HikariDataSource();
        dataSource.setPoolName("PortfolioProLocalH2");
        dataSource.setDriverClassName("org.h2.Driver");
        dataSource.setJdbcUrl("jdbc:h2:file:./data/portfoliopro-local;MODE=MySQL;DATABASE_TO_LOWER=TRUE");
        dataSource.setUsername("sa");
        dataSource.setPassword("");
        dataSource.setMaximumPoolSize(5);
        dataSource.setMinimumIdle(0);
        dataSource.setConnectionTimeout(15_000);
        dataSource.setInitializationFailTimeout(15_000);
        return dataSource;
    }
}
