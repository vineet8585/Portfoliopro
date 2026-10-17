package com.portfoliopro.market.dto;

import java.util.List;

public record HistoryResponseDto(
        String symbol,
        String range,
        String dataLabel,
        List<PricePointDto> points) {
}
