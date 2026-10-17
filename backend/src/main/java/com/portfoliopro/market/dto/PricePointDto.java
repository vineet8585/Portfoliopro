package com.portfoliopro.market.dto;

import java.time.Instant;

public record PricePointDto(
        String label,
        Instant timestamp,
        double value,
        double average,
        double upper,
        double lower,
        long volume,
        double rsi,
        double macd) {
}
