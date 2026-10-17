package com.portfoliopro.market;

import com.portfoliopro.market.dto.HistoryResponseDto;
import com.portfoliopro.market.dto.MarketAssetDto;
import com.portfoliopro.market.dto.PricePointDto;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class MarketHistoryService {
    private static final Set<String> RANGES = Set.of("1D", "1W", "1M", "3M", "1Y", "ALL");
    private static final int SAMPLE_COUNT = 72;
    private static final DateTimeFormatter TIME_LABEL = DateTimeFormatter.ofPattern("H:mm", Locale.US)
            .withZone(ZoneId.of("America/New_York"));
    private static final DateTimeFormatter DATE_LABEL = DateTimeFormatter.ofPattern("MMM d", Locale.US)
            .withZone(ZoneId.of("America/New_York"));

    public HistoryResponseDto build(MarketAssetDto asset, String requestedRange) {
        String range = requestedRange == null ? "1D" : requestedRange.toUpperCase(Locale.ROOT);
        if (!RANGES.contains(range)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported history range.");
        }

        long spanSeconds = switch (range) {
            case "1D" -> Duration.ofHours(7).toSeconds();
            case "1W" -> Duration.ofDays(7).toSeconds();
            case "1M" -> Duration.ofDays(30).toSeconds();
            case "3M" -> Duration.ofDays(90).toSeconds();
            case "1Y" -> Duration.ofDays(365).toSeconds();
            default -> Duration.ofDays(1825).toSeconds();
        };
        int seed = Math.floorMod(asset.symbol().hashCode(), 17);
        double base = asset.price();
        List<Double> closes = new ArrayList<>(SAMPLE_COUNT);
        for (int index = 0; index < SAMPLE_COUNT; index++) {
            double progress = index / (double) (SAMPLE_COUNT - 1);
            double wave = (Math.sin(index * 0.39 + seed) * 0.012
                    + Math.cos(index * 0.17 + seed / 2.0) * 0.008) * Math.sin(Math.PI * progress);
            double trend = -0.045 + progress * 0.045;
            closes.add(index == SAMPLE_COUNT - 1 ? base : base * (1.0 + trend + wave));
        }

        double[] ema12 = ema(closes, 12);
        double[] ema26 = ema(closes, 26);
        Instant now = Instant.now();
        List<PricePointDto> points = new ArrayList<>(SAMPLE_COUNT);
        for (int index = 0; index < SAMPLE_COUNT; index++) {
            int windowStart = Math.max(0, index - 19);
            double average = mean(closes, windowStart, index);
            double variance = variance(closes, windowStart, index, average);
            double spread = 2.0 * Math.sqrt(variance);
            double progress = index / (double) (SAMPLE_COUNT - 1);
            Instant timestamp = now.minusSeconds(Math.round((1.0 - progress) * spanSeconds));
            String label = range.equals("1D") ? TIME_LABEL.format(timestamp) : DATE_LABEL.format(timestamp);
            long volume = 20L + Math.round((Math.sin(index * 0.63 + seed) + 1.2) * 42.0);
            points.add(new PricePointDto(
                    label,
                    timestamp,
                    closes.get(index),
                    average,
                    average + spread,
                    average - spread,
                    volume,
                    rsi(closes, index),
                    ema12[index] - ema26[index]));
        }
        return new HistoryResponseDto(
                asset.symbol(),
                range,
                "Illustrative synthetic history — not live market data",
                List.copyOf(points));
    }

    private static double[] ema(List<Double> values, int period) {
        double[] result = new double[values.size()];
        double multiplier = 2.0 / (period + 1.0);
        result[0] = values.get(0);
        for (int index = 1; index < values.size(); index++) {
            result[index] = (values.get(index) - result[index - 1]) * multiplier + result[index - 1];
        }
        return result;
    }

    private static double mean(List<Double> values, int start, int end) {
        double total = 0.0;
        for (int index = start; index <= end; index++) total += values.get(index);
        return total / (end - start + 1);
    }

    private static double variance(List<Double> values, int start, int end, double mean) {
        double total = 0.0;
        for (int index = start; index <= end; index++) {
            double difference = values.get(index) - mean;
            total += difference * difference;
        }
        return total / (end - start + 1);
    }

    private static double rsi(List<Double> values, int end) {
        int firstChange = Math.max(1, end - 13);
        if (end - firstChange + 1 < 2) return 50.0;
        double gains = 0.0;
        double losses = 0.0;
        int observations = 0;
        for (int index = firstChange; index <= end; index++) {
            double difference = values.get(index) - values.get(index - 1);
            if (difference > 0) gains += difference;
            else losses -= difference;
            observations++;
        }
        if (observations == 0) return 50.0;
        double averageGain = gains / observations;
        double averageLoss = losses / observations;
        if (averageLoss == 0.0) return averageGain == 0.0 ? 50.0 : 100.0;
        double relativeStrength = averageGain / averageLoss;
        return 100.0 - (100.0 / (1.0 + relativeStrength));
    }
}
