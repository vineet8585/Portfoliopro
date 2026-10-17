package com.portfoliopro.market;

import com.portfoliopro.market.dto.FundamentalsDto;
import com.portfoliopro.market.dto.MarketAssetDto;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Repository
public class MarketRepository {
    private static final String ASSET_COLUMNS = "symbol, name, price, day_change, day_change_pct, sector, exchange_code, color, description";
    private final JdbcTemplate jdbcTemplate;

    public MarketRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<MarketAssetDto> findAllAssets() {
        return jdbcTemplate.query(
                "SELECT " + ASSET_COLUMNS + " FROM pp_market_asset ORDER BY sort_order",
                (rs, rowNumber) -> mapAsset(rs));
    }

    public Optional<MarketAssetDto> findAsset(String symbol) {
        List<MarketAssetDto> result = jdbcTemplate.query(
                "SELECT " + ASSET_COLUMNS + " FROM pp_market_asset WHERE symbol = ?",
                (rs, rowNumber) -> mapAsset(rs),
                symbol.toUpperCase(Locale.ROOT));
        return result.stream().findFirst();
    }

    public Optional<FundamentalsDto> findFundamentals(String symbol) {
        List<FundamentalsDto> result = jdbcTemplate.query(
                "SELECT symbol, market_cap_display, pe_ratio, revenue_growth_pct, gross_margin_pct, "
                        + "operating_margin_pct, dividend_yield_pct FROM pp_fundamentals_snapshot WHERE symbol = ?",
                (rs, rowNumber) -> new FundamentalsDto(
                        rs.getString("symbol"),
                        rs.getString("market_cap_display"),
                        nullableDouble(rs, "pe_ratio"),
                        nullableDouble(rs, "revenue_growth_pct"),
                        nullableDouble(rs, "gross_margin_pct"),
                        nullableDouble(rs, "operating_margin_pct"),
                        nullableDouble(rs, "dividend_yield_pct"),
                        "Illustrative sample snapshot — not issuer-reported or current"),
                symbol.toUpperCase(Locale.ROOT));
        return result.stream().findFirst();
    }

    private static MarketAssetDto mapAsset(ResultSet rs) throws SQLException {
        return new MarketAssetDto(
                rs.getString("symbol"),
                rs.getString("name"),
                rs.getBigDecimal("price").doubleValue(),
                rs.getBigDecimal("day_change").doubleValue(),
                rs.getBigDecimal("day_change_pct").doubleValue(),
                rs.getString("sector"),
                rs.getString("exchange_code"),
                rs.getString("color"),
                rs.getString("description"));
    }

    private static Double nullableDouble(ResultSet rs, String column) throws SQLException {
        var value = rs.getBigDecimal(column);
        return value == null ? null : value.doubleValue();
    }
}
