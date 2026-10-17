package com.portfoliopro.market;

import com.portfoliopro.market.dto.FundamentalsDto;
import com.portfoliopro.market.dto.HistoryResponseDto;
import com.portfoliopro.market.dto.MarketAssetDto;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api/market")
public class MarketController {
    private final MarketRepository repository;
    private final MarketHistoryService historyService;

    public MarketController(MarketRepository repository, MarketHistoryService historyService) {
        this.repository = repository;
        this.historyService = historyService;
    }

    @GetMapping("/assets")
    public List<MarketAssetDto> assets() {
        return repository.findAllAssets();
    }

    @GetMapping("/assets/{symbol}/history")
    public HistoryResponseDto history(
            @PathVariable String symbol,
            @RequestParam(defaultValue = "1D") String range) {
        MarketAssetDto asset = findAsset(symbol);
        return historyService.build(asset, range);
    }

    @GetMapping("/assets/{symbol}/fundamentals")
    public FundamentalsDto fundamentals(@PathVariable String symbol) {
        return repository.findFundamentals(symbol.toUpperCase(Locale.ROOT))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Unknown sample symbol."));
    }

    private MarketAssetDto findAsset(String symbol) {
        return repository.findAsset(symbol)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Unknown sample symbol."));
    }
}
