import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, type Observable } from 'rxjs';
import {
  parseFundamentals,
  parseHistory,
  parseMarketAssets,
  type ChartRange,
  type FundamentalsSnapshot,
  type HistoryResponse,
  type MarketAsset,
} from './market-api.models';

@Injectable({ providedIn: 'root' })
export class MarketApiService {
  constructor(private readonly http: HttpClient) {}

  assets(): Observable<MarketAsset[]> {
    return this.http.get<unknown>('/api/market/assets').pipe(map(parseMarketAssets));
  }

  history(symbol: string, range: ChartRange): Observable<HistoryResponse> {
    const safeSymbol = encodeURIComponent(symbol.toUpperCase());
    return this.http
      .get<unknown>(`/api/market/assets/${safeSymbol}/history`, { params: { range } })
      .pipe(map(parseHistory));
  }

  fundamentals(symbol: string): Observable<FundamentalsSnapshot> {
    const safeSymbol = encodeURIComponent(symbol.toUpperCase());
    return this.http
      .get<unknown>(`/api/market/assets/${safeSymbol}/fundamentals`)
      .pipe(map(parseFundamentals));
  }
}
