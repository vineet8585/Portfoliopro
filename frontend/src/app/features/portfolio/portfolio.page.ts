import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { ChartRange } from '../../core/api/market-api.models';
import { PaperPortfolioStore } from '../../core/state/paper-portfolio.store';
import { MarketChartComponent } from '../../shared/chart/market-chart.component';
import { formatCurrency, formatPercent, formatSignedCurrency, makePortfolioHistory } from '../../shared/finance.utils';

@Component({
  selector: 'pp-portfolio-page',
  standalone: true,
  imports: [RouterLink, MarketChartComponent],
  template: `
    <div class="page-heading-row"><div><span class="eyebrow">YOUR WORKSPACE / PORTFOLIO</span><h1>Portfolio</h1><p>Positions and performance in your local paper account.</p></div><div class="page-actions"><a class="button button-secondary" routerLink="/risk">Review risk</a><button type="button" class="button button-primary" (click)="portfolio.openTicket()"><span>+</span> New paper order</button></div></div>
    <div class="demo-banner"><span class="banner-mark">i</span><div><strong>LOCAL PAPER ACCOUNT</strong><span>Holdings, cash, watchlist and simulated orders are stored in this browser only.</span></div><span class="banner-origin">NO BROKER CONNECTED</span></div>

    <section class="metric-grid three-metrics" aria-label="Portfolio summary">
      <article class="metric-card"><div class="metric-label"><span>Total account value</span><span class="metric-code">USD</span></div><strong class="metric-value">{{ money(portfolio.totalValue()) }}</strong><div class="metric-foot"><span>Cash and illustrative market value</span></div></article>
      <article class="metric-card"><div class="metric-label"><span>Invested market value</span><span class="metric-code">MV</span></div><strong class="metric-value">{{ money(portfolio.marketValue()) }}</strong><div class="metric-foot"><span>{{ portfolio.positions().length }} open paper positions</span></div></article>
      <article class="metric-card"><div class="metric-label"><span>Unrealized P&amp;L</span><span class="metric-code">P/L</span></div><strong class="metric-value" [class.positive]="portfolio.unrealizedPnl() >= 0" [class.negative]="portfolio.unrealizedPnl() < 0">{{ signedMoney(portfolio.unrealizedPnl()) }}</strong><div class="metric-foot"><span>Compared with sample cost basis</span></div></article>
    </section>

    <section class="panel portfolio-chart-panel"><header class="panel-head"><div><span class="eyebrow">SYNTHETIC ACCOUNT SERIES</span><h2>Portfolio value</h2></div><div class="chart-total"><strong>{{ money(portfolio.totalValue()) }}</strong><span>Current paper balance</span></div></header>
      <div class="chart-toolbar"><div class="range-tabs" aria-label="Portfolio history range">@for (item of ranges; track item) { <button type="button" [class.active]="range() === item" (click)="range.set(item)">{{ item }}</button> }</div><span class="change-chip" [class.positive-chip]="portfolio.dayChange() >= 0" [class.negative-chip]="portfolio.dayChange() < 0">Sample day {{ percent(portfolio.dayChangePct()) }}</span></div>
      <pp-market-chart [points]="series()" label="Synthetic paper account value" /><div class="chart-footnote"><span>This chart is illustrative and is not investment performance.</span><span>Paper account only</span></div>
    </section>

    <section class="panel positions-panel"><header class="panel-head"><div><span class="eyebrow">POSITIONS</span><h2>Your holdings</h2></div><div class="panel-head-actions"><span class="pill-soft">{{ portfolio.positions().length }} SYMBOLS</span><a class="subtle-link" routerLink="/markets">Browse sample market <span>↗</span></a></div></header>
      <div class="table-scroll"><table class="data-table positions-table"><thead><tr><th>INSTRUMENT</th><th class="align-right">SHARES</th><th class="align-right">LAST SAMPLE</th><th class="align-right">AVG. COST</th><th class="align-right">MARKET VALUE</th><th class="align-right">UNREALIZED P&amp;L</th><th class="align-right">ACCOUNT WEIGHT</th><th class="align-right">ACTION</th></tr></thead><tbody>
        @for (position of portfolio.positionsSummary().slice().sort(byMarketValue); track position.symbol) {
          <tr><td><div class="asset-cell"><span class="asset-token" [style.--asset-color]="position.asset.color">{{ position.symbol.slice(0, 1) }}</span><span><strong>{{ position.symbol }}</strong><small>{{ position.asset.name }}</small></span></div></td><td class="align-right number-cell">{{ position.shares }}</td><td class="align-right number-cell">{{ money(position.asset.price) }}</td><td class="align-right number-cell">{{ money(position.averageCost) }}</td><td class="align-right number-cell">{{ money(position.marketValue) }}</td><td class="align-right number-cell" [class.positive]="position.unrealizedPnl >= 0" [class.negative]="position.unrealizedPnl < 0">{{ signedMoney(position.unrealizedPnl) }}</td><td class="align-right number-cell">{{ weight(position.marketValue) }}</td><td class="align-right"><button class="table-action" type="button" [disabled]="portfolio.availableShares(position.symbol) < 1" (click)="portfolio.openTicket(position.symbol, 'Sell')">Sell</button></td></tr>
        }
        @if (portfolio.positions().length === 0) { <tr><td colspan="8" class="empty-cell">No paper positions yet. Place a simulated order from Markets.</td></tr> }
      </tbody></table></div>
      <div class="panel-bottom-link"><span>Current values use illustrative sample quotes; trading and P&amp;L are simulated.</span><a routerLink="/orders">Review order activity →</a></div>
    </section>
  `,
})
export class PortfolioPageComponent {
  readonly portfolio = inject(PaperPortfolioStore);
  readonly ranges: ChartRange[] = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];
  readonly range = signal<ChartRange>('1M');
  readonly series = computed(() => makePortfolioHistory(this.portfolio.totalValue(), this.range()));

  money(value: number): string { return formatCurrency(value); }
  signedMoney(value: number): string { return formatSignedCurrency(value); }
  percent(value: number): string { return formatPercent(value); }
  weight(value: number): string { return `${this.portfolio.totalValue() ? (value / this.portfolio.totalValue() * 100).toFixed(1) : '0.0'}%`; }
  byMarketValue(a: { marketValue: number }, b: { marketValue: number }): number { return b.marketValue - a.marketValue; }
}
