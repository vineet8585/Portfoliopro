import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type { ChartRange, FundamentalsSnapshot, HistoryResponse, PricePoint } from '../../core/api/market-api.models';
import { MarketDataStore } from '../../core/state/market-data.store';
import { PaperPortfolioStore } from '../../core/state/paper-portfolio.store';
import { MarketChartComponent } from '../../shared/chart/market-chart.component';
import { formatCurrency, formatPercent } from '../../shared/finance.utils';

@Component({
  selector: 'pp-analysis-page',
  standalone: true,
  imports: [FormsModule, RouterLink, MarketChartComponent],
  template: `
    <div class="page-heading-row"><div><span class="eyebrow">YOUR WORKSPACE / RESEARCH</span><h1>Analysis</h1><p>Technical indicators and illustrative company fundamentals.</p></div><div class="page-actions"><span class="pill-soft"><span class="status-dot"></span> SAMPLE SNAPSHOT</span><button class="button button-primary" type="button" (click)="portfolio.openTicket(symbol())">Trade in paper mode</button></div></div>
    <div class="demo-banner"><span class="banner-mark">i</span><div><strong>RESEARCH EXAMPLE — NOT ADVICE</strong><span>History, indicators, valuation and growth values are generated or illustrative samples, not current issuer data.</span></div><span class="banner-origin">NOT LIVE</span></div>

    <section class="panel analysis-controls"><label class="field analysis-select"><span>Instrument</span><select [ngModel]="symbol()" (ngModelChange)="setSymbol($event)">@for (asset of market.assets(); track asset.symbol) { <option [value]="asset.symbol">{{ asset.symbol }} · {{ asset.name }}</option> }</select></label><div class="analysis-quote"><span class="eyebrow">SAMPLE QUOTE</span><strong>{{ money(asset.price) }}</strong><span [class.positive]="asset.changePct >= 0" [class.negative]="asset.changePct < 0">{{ percent(asset.changePct) }} sample day</span></div><div class="analysis-select-note"><span class="small-dot amber-dot"></span> Price and company facts are not current market inputs.</div></section>

    <section class="panel analysis-chart-panel"><header class="panel-head"><div><span class="eyebrow">{{ symbol() }} · TECHNICAL VIEW</span><h2>Illustrative price history</h2></div><a class="subtle-link" routerLink="/markets">Market directory <span>↗</span></a></header>
      <div class="chart-toolbar"><div class="range-tabs" aria-label="Analysis history range">@for (item of ranges; track item) { <button type="button" [class.active]="range() === item" (click)="setRange(item)">{{ item }}</button> }</div><button type="button" class="overlay-toggle" [class.active]="showBands()" [attr.aria-pressed]="showBands()" (click)="showBands.update((value) => !value)"><span class="toggle-check">{{ showBands() ? '✓' : '' }}</span> Bollinger band</button></div>
      <pp-market-chart [points]="history()?.points ?? []" [label]="symbol() + ' synthetic chart'" [showBands]="showBands()" [showAverage]="true" [showVolume]="true" />
      <div class="chart-footnote"><span>{{ history()?.dataLabel ?? 'Loading synthetic sample series…' }}</span><span>SMA20 · 2σ band · sample volume</span></div>
    </section>

    <div class="indicator-grid"><article class="indicator-card"><span class="eyebrow">RELATIVE STRENGTH · RSI (14)</span><div class="indicator-main"><strong>{{ latest()?.rsi?.toFixed(1) ?? '—' }}</strong><span [class.positive]="(latest()?.rsi ?? 50) >= 50" [class.negative]="(latest()?.rsi ?? 50) < 30">{{ rsiReading() }}</span></div><div class="indicator-track"><span [style.width.%]="latest()?.rsi ?? 50"></span></div><div class="indicator-scale"><span>0</span><span>Illustrative 30 / 70 bands</span><span>100</span></div></article><article class="indicator-card"><span class="eyebrow">MACD · 12 / 26</span><div class="indicator-main"><strong [class.positive]="(latest()?.macd ?? 0) >= 0" [class.negative]="(latest()?.macd ?? 0) < 0">{{ signedNumber(latest()?.macd ?? 0) }}</strong><span>sample value</span></div><div class="macd-zero-line"><span [style.left.%]="macdPosition()"></span></div><div class="indicator-scale"><span>negative</span><span>MACD line, derived from synthetic history</span><span>positive</span></div></article><article class="indicator-card"><span class="eyebrow">MOVING AVERAGE · SMA (20)</span><div class="indicator-main"><strong>{{ money(latest()?.average ?? asset.price) }}</strong><span>{{ latest() && latest()!.value >= latest()!.average ? 'Sample close above SMA' : 'Sample close below SMA' }}</span></div><div class="indicator-caption">Calculated from the illustrative price series.</div></article></div>

    <section class="panel fundamentals-panel"><header class="panel-head"><div><span class="eyebrow">{{ symbol() }} · COMPANY SNAPSHOT</span><h2>Fundamentals</h2></div><span class="pill-soft">ILLUSTRATIVE VALUES</span></header>
      <div class="fundamental-grid"><div class="fundamental-cell"><span>Market capitalization</span><strong>{{ fundamentals()?.marketCap ?? '—' }}</strong></div><div class="fundamental-cell"><span>Price / earnings</span><strong>{{ nullable(fundamentals()?.peRatio, '×') }}</strong></div><div class="fundamental-cell"><span>Revenue growth</span><strong>{{ nullable(fundamentals()?.revenueGrowthPct, '%') }}</strong></div><div class="fundamental-cell"><span>Gross margin</span><strong>{{ nullable(fundamentals()?.grossMarginPct, '%') }}</strong></div><div class="fundamental-cell"><span>Operating margin</span><strong>{{ nullable(fundamentals()?.operatingMarginPct, '%') }}</strong></div><div class="fundamental-cell"><span>Dividend yield</span><strong>{{ nullable(fundamentals()?.dividendYieldPct, '%') }}</strong></div></div>
      <div class="fundamentals-note"><span class="notice-dot"></span><span>{{ fundamentals()?.snapshotLabel ?? 'Illustrative sample snapshot — not issuer-reported or current' }}</span><span>Not investment advice</span></div>
    </section>
  `,
})
export class AnalysisPageComponent implements OnInit {
  readonly market = inject(MarketDataStore);
  readonly portfolio = inject(PaperPortfolioStore);
  private readonly route = inject(ActivatedRoute);
  readonly ranges: ChartRange[] = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];
  readonly symbol = signal('NVDA');
  readonly range = signal<ChartRange>('3M');
  readonly showBands = signal(true);
  readonly history = signal<HistoryResponse | null>(null);
  readonly fundamentals = signal<FundamentalsSnapshot | null>(null);

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const requested = (params.get('symbol') ?? 'NVDA').toUpperCase();
      this.symbol.set(this.market.asset(requested).symbol);
      this.loadData();
    });
  }

  get asset() { return this.market.asset(this.symbol()); }
  latest(): PricePoint | undefined { return this.history()?.points.at(-1); }

  setSymbol(symbol: string): void {
    this.symbol.set(symbol);
    this.loadData();
  }

  setRange(range: ChartRange): void {
    this.range.set(range);
    this.loadData();
  }

  private loadData(): void {
    const selectedSymbol = this.symbol();
    this.history.set(null);
    this.fundamentals.set(null);
    this.market.history(selectedSymbol, this.range()).subscribe((response) => this.history.set(response));
    this.market.fundamentals(selectedSymbol).subscribe((snapshot) => this.fundamentals.set(snapshot));
  }

  rsiReading(): string {
    const value = this.latest()?.rsi ?? 50;
    if (value >= 70) return 'Upper range';
    if (value <= 30) return 'Lower range';
    return 'Middle range';
  }

  macdPosition(): number {
    const value = this.latest()?.macd ?? 0;
    return Math.max(5, Math.min(95, 50 + value / Math.max(1, this.asset.price) * 3200));
  }

  money(value: number): string { return formatCurrency(value); }
  percent(value: number): string { return formatPercent(value); }
  signedNumber(value: number): string { return `${value >= 0 ? '+' : '−'}${Math.abs(value).toFixed(2)}`; }
  nullable(value: number | null | undefined, suffix: string): string { return value === null || value === undefined ? '—' : `${value.toFixed(2)}${suffix}`; }
}
