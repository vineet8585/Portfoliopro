import { Injectable, OnDestroy, signal } from '@angular/core';
import { catchError, type Observable, of } from 'rxjs';
import type { ChartRange, FundamentalsSnapshot, HistoryResponse, MarketAsset } from '../api/market-api.models';
import { MarketApiService } from '../api/market-api.service';
import { DEMO_ASSETS, DEMO_FUNDAMENTALS, makeDemoHistory } from '../data/demo-market';

@Injectable({ providedIn: 'root' })
export class MarketDataStore implements OnDestroy {
  readonly assets = signal<MarketAsset[]>(DEMO_ASSETS);
  readonly loading = signal(false);
  readonly usingFallback = signal(true);
  readonly errorMessage = signal<string | null>(null);

  private liveTicker: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly api: MarketApiService) {
    this.startLiveTicker();
  }

  ngOnDestroy(): void {
    if (this.liveTicker) {
      clearInterval(this.liveTicker);
      this.liveTicker = null;
    }
  }

  private startLiveTicker(): void {
    if (this.liveTicker !== null || typeof window === 'undefined') {
      return;
    }

    this.liveTicker = window.setInterval(() => {
      if (this.loading()) {
        return;
      }

      this.assets.set(this.assets().map((asset) => this.bumpAsset(asset)));
    }, 4500);
  }

  private bumpAsset(asset: MarketAsset): MarketAsset {
    const previousClose = Math.max(asset.price / (1 + asset.changePct / 100), 1);
    const drift = (Math.random() - 0.5) * 1.4;
    const nextMovePct = Number(Math.min(7.5, Math.max(-7.5, asset.changePct + drift)).toFixed(2));
    const nextPrice = Number((previousClose * (1 + nextMovePct / 100)).toFixed(2));
    const nextChange = Number((nextPrice - previousClose).toFixed(2));

    return {
      ...asset,
      price: nextPrice,
      change: nextChange,
      changePct: nextMovePct,
    };
  }

  load(): void {
    this.loading.set(true);
    this.api.assets().subscribe({
      next: (assets) => {
        this.assets.set(assets);
        this.usingFallback.set(false);
        this.errorMessage.set(null);
        this.loading.set(false);
      },
      error: () => {
        this.assets.set(DEMO_ASSETS);
        this.usingFallback.set(true);
        this.errorMessage.set('Market API unavailable — showing local illustrative samples.');
        this.loading.set(false);
      },
    });
  }

  asset(symbol: string): MarketAsset {
    const normalized = symbol.toUpperCase();
    return this.assets().find((item) => item.symbol === normalized)
      ?? DEMO_ASSETS.find((item) => item.symbol === normalized)
      ?? DEMO_ASSETS[0];
  }

  history(symbol: string, range: ChartRange): Observable<HistoryResponse> {
    return this.api.history(symbol, range).pipe(
      catchError(() => of(makeDemoHistory(this.asset(symbol), range))),
    );
  }

  fundamentals(symbol: string): Observable<FundamentalsSnapshot> {
    return this.api.fundamentals(symbol).pipe(
      catchError(() => of(DEMO_FUNDAMENTALS[symbol.toUpperCase()] ?? DEMO_FUNDAMENTALS['NVDA'])),
    );
  }
}
