package com.portfoliopro.market.dto;

public record FundamentalsDto(
        String symbol,
        String marketCap,
        Double peRatio,
        Double revenueGrowthPct,
        Double grossMarginPct,
        Double operatingMarginPct,
        Double dividendYieldPct,
        String snapshotLabel) {
}
