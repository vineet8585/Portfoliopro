package com.portfoliopro.market;

import com.portfoliopro.market.dto.MarketAssetDto;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class MarketHistoryServiceTest {
    private final MarketHistoryService service = new MarketHistoryService();
    private final MarketAssetDto asset = new MarketAssetDto(
            "NVDA", "NVIDIA Corporation", 138.85, 3.92, 2.91,
            "Semiconductors", "NASDAQ", "#91B9FF", "Illustrative sample asset");

    @Test
    void createsSyntheticSeriesEndingAtTheDisplayedQuote() {
        var response = service.build(asset, "1M");
        assertEquals("NVDA", response.symbol());
        assertEquals("1M", response.range());
        assertTrue(response.dataLabel().contains("not live"));
        assertEquals(72, response.points().size());
        assertEquals(asset.price(), response.points().getLast().value(), 0.000001);
        assertTrue(response.points().stream().allMatch(point -> point.rsi() >= 0 && point.rsi() <= 100));
        assertTrue(response.points().stream().allMatch(point -> point.upper() >= point.average()
                && point.lower() <= point.average()));
    }

    @Test
    void acceptsCaseInsensitiveRangeNames() {
        var response = service.build(asset, "1w");
        assertEquals("1W", response.range());
    }

    @Test
    void rejectsUnsupportedRanges() {
        var error = assertThrows(ResponseStatusException.class, () -> service.build(asset, "15M"));
        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
    }
}
