package com.portfoliopro.market.dto;

public record MarketAssetDto(
        String symbol,
        String name,
        double price,
        double change,
        double changePct,
        String sector,
        String exchange,
        String color,
        String description) {
}
