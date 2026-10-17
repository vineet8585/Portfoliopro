import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { ChartRange } from '../../core/api/market-api.models';
import { MarketDataStore } from '../../core/state/market-data.store';
import { PaperPortfolioStore } from '../../core/state/paper-portfolio.store';
import { MarketChartComponent } from '../../shared/chart/market-chart.component';
import { formatCompactCurrency, formatCurrency, formatPercent, formatSignedCurrency, makePortfolioHistory } from '../../shared/finance.utils';

@Component({
  selector: 'pp-overview-page',
  standalone: true,
  imports: [RouterLink, MarketChartComponent],
  template: `
    <div class="page-heading-row">
      <div><span class="eyebrow">YOUR WORKSPACE / OVERVIEW</span><h1>Portfolio overview</h1><p>A clear view of your illustrative paper account.</p></div>
      <div class="page-actions"><a class="button button-secondary" routerLink="/markets">Explore markets</a><button type="button" class="button button-primary" (click)="portfolio.openTicket()"><span>+</span> New paper order</button></div>
    </div>

    <div class="demo-banner"><span class="banner-mark">i</span><div><strong>SIMULATED MARKET DATA</strong><span>Quotes, chart history and fundamentals are illustrative samples — not live data. Orders stay in this browser.</span></div><span class="banner-origin">MYSQL SAMPLE CATALOG</span></div>

    <section class="metric-grid" aria-label="Paper account summary">
      <article class="metric-card"><div class="metric-label"><span>Account value</span><span class="metric-code">AC</span></div><strong class="metric-value">{{ money(portfolio.totalValue()) }}</strong><div class="metric-foot"><span class="small-dot mint-dot"></span><span>Cash + sample holdings</span></div></article>
      <article class="metric-card"><div class="metric-label"><span>Sample day change</span><span class="metric-code">24H</span></div><strong class="metric-value" [class.positive]="portfolio.dayChange() >= 0" [class.negative]="portfolio.dayChange() < 0">{{ signedMoney(portfolio.dayChange()) }}</strong><div class="metric-foot"><span class="change-chip" [class.positive-chip]="portfolio.dayChange() >= 0" [class.negative-chip]="portfolio.dayChange() < 0">{{ percent(portfolio.dayChangePct()) }}</span><span>vs prior sample close</span></div></article>
      <article class="metric-card"><div class="metric-label"><span>Invested value</span><span class="metric-code">MV</span></div><strong class="metric-value">{{ money(portfolio.marketValue()) }}</strong><div class="metric-foot"><span class="small-dot blue-dot"></span><span>{{ portfolio.positions().length }} paper positions</span></div></article>
      <article class="metric-card"><div class="metric-label"><span>Paper buying power</span><span class="metric-code">USD</span></div><strong class="metric-value">{{ money(portfolio.buyingPower()) }}</strong><div class="metric-foot"><span class="small-dot amber-dot"></span><span>{{ openOrders() }} open limit orders</span></div></article>
    </section>

    <div class="overview-grid">
      <section class="panel performance-panel">
        <header class="panel-head">
          <div><span class="eyebrow">PAPER ACCOUNT</span><h2>Portfolio value</h2></div>
          <div class="chart-total"><strong>{{ money(portfolio.totalValue()) }}</strong><span>Illustrative balance</span></div>
        </header>
        <div class="chart-toolbar"><div class="range-tabs" aria-label="Portfolio chart range">
          @for (item of ranges; track item) { <button type="button" [class.active]="range() === item" (click)="range.set(item)">{{ item }}</button> }
        </div><span class="chart-tag"><span class="legend-line"></span>Account value · illustrative</span></div>
        <pp-market-chart [points]="portfolioSeries()" [label]="'Illustrative paper account value over ' + range()" />
        <div class="chart-footnote"><span>Sample history is synthetic and rebased to this paper account.</span><span>Not a performance record</span></div>
      </section>

      <section class="panel allocation-panel">
        <header class="panel-head"><div><span class="eyebrow">PORTFOLIO MIX</span><h2>Allocation</h2></div><a class="subtle-link" routerLink="/risk">Risk view <span>↗</span></a></header>
        <div class="allocation-visual"><div class="donut-chart" [style.background]="allocationBackground()"><div class="donut-hole"><strong>{{ investedPct() }}%</strong><span>invested</span></div></div>
          <div class="allocation-legend">
            @for (item of portfolio.allocationBySector().slice(0, 5); track item.sector) { <div class="legend-item"><span class="legend-swatch" [style.background]="sectorColor(item.sector)"></span><span class="legend-name">{{ item.sector }}</span><strong>{{ percent(item.weightPct, 0) }}</strong></div> }
            <div class="legend-item cash-legend"><span class="legend-swatch"></span><span class="legend-name">Cash</span><strong>{{ cashPct() }}%</strong></div>
          </div>
        </div>
        <div class="panel-bottom-link"><span>Allocation uses illustrative sample prices.</span><a routerLink="/portfolio">View holdings →</a></div>
      </section>

      <section class="panel watchlist-panel">
        <header class="panel-head"><div><span class="eyebrow">YOUR SHORTLIST</span><h2>Watchlist</h2></div><a class="subtle-link" routerLink="/markets">All markets <span>↗</span></a></header>
        <div class="compact-table-wrap"><table class="data-table compact-table"><thead><tr><th>ASSET</th><th>PRICE</th><th class="align-right">CHANGE</th></tr></thead><tbody>
          @for (asset of watchlistAssets(); track asset.symbol) { <tr><td><div class="asset-cell"><span class="asset-token" [style.--asset-color]="asset.color">{{ asset.symbol.slice(0, 1) }}</span><span><strong>{{ asset.symbol }}</strong><small>{{ asset.name }}</small></span></div></td><td class="number-cell">{{ money(asset.price) }}</td><td class="align-right"><span class="table-change" [class.positive]="asset.changePct >= 0" [class.negative]="asset.changePct < 0">{{ percent(asset.changePct) }}</span></td></tr> }
          @if (watchlistAssets().length === 0) { <tr><td colspan="3" class="empty-cell">Your watchlist is empty. Add instruments from Markets.</td></tr> }
        </tbody></table></div>
        <div class="panel-bottom-link"><span>List saved only on this device.</span><a routerLink="/markets">Manage watchlist →</a></div>
      </section>

      <section class="panel movers-panel">
        <header class="panel-head"><div><span class="eyebrow">SAMPLE QUOTE SNAPSHOT</span><h2>Market movers</h2></div><span class="pill-soft">NOT LIVE</span></header>
        <div class="mover-list">
          @for (asset of movers(); track asset.symbol) { <div class="mover-row"><span class="asset-token small-token" [style.--asset-color]="asset.color">{{ asset.symbol.slice(0, 1) }}</span><span class="mover-name"><strong>{{ asset.symbol }}</strong><small>{{ asset.sector }}</small></span><span class="mover-price">{{ money(asset.price) }}<small [class.positive]="asset.changePct >= 0" [class.negative]="asset.changePct < 0">{{ percent(asset.changePct) }}</small></span></div> }
        </div>
        <div class="panel-bottom-link"><span>Sample movements are not current quotes.</span><a routerLink="/markets">Open markets →</a></div>
      </section>

      <section class="panel holdings-preview-panel">
        <header class="panel-head"><div><span class="eyebrow">PAPER POSITIONS</span><h2>Largest holdings</h2></div><a class="subtle-link" routerLink="/portfolio">Full portfolio <span>↗</span></a></header>
        <div class="compact-table-wrap"><table class="data-table compact-table"><thead><tr><th>ASSET</th><th>SHARES</th><th>MARKET VALUE</th><th class="align-right">UNREALIZED</th></tr></thead><tbody>
          @for (position of portfolio.positionsSummary().slice().sort(byMarketValue).slice(0, 4); track position.symbol) { <tr><td><div class="asset-cell"><span class="asset-token" [style.--asset-color]="position.asset.color">{{ position.symbol.slice(0, 1) }}</span><span><strong>{{ position.symbol }}</strong><small>{{ position.asset.name }}</small></span></div></td><td class="number-cell">{{ position.shares }}</td><td class="number-cell">{{ compactMoney(position.marketValue) }}</td><td class="align-right number-cell" [class.positive]="position.unrealizedPnl >= 0" [class.negative]="position.unrealizedPnl < 0">{{ signedMoney(position.unrealizedPnl) }}</td></tr> }
        </tbody></table></div>
        <div class="panel-bottom-link"><span>Positions and order history live in local browser storage.</span><a routerLink="/portfolio">Review positions →</a></div>
      </section>

      <section class="panel activity-panel">
        <header class="panel-head"><div><span class="eyebrow">LOCAL ORDER LOG</span><h2>Recent activity</h2></div><a class="subtle-link" routerLink="/orders">All orders <span>↗</span></a></header>
        <div class="activity-list">
          @for (order of portfolio.orders().slice(0, 4); track order.id) { <div class="activity-row"><span class="activity-side" [class.buy-side]="order.side === 'Buy'" [class.sell-side]="order.side === 'Sell'">{{ order.side === 'Buy' ? 'B' : 'S' }}</span><span class="activity-copy"><strong>{{ order.side }} {{ order.shares }} {{ order.symbol }}</strong><small>{{ order.type }} · {{ order.id }} · {{ time(order.submittedAt) }}</small></span><span class="status-badge" [class.status-open]="order.status === 'Open'" [class.status-filled]="order.status === 'Filled'" [class.status-cancelled]="order.status === 'Cancelled'">{{ order.status }}</span></div> }
        </div>
        <div class="panel-bottom-link"><span>Every order is simulated; no broker is connected.</span><a routerLink="/orders">Open activity →</a></div>
      </section>
    </div>
  `,
})
export class OverviewPageComponent {
  readonly market = inject(MarketDataStore);
  readonly portfolio = inject(PaperPortfolioStore);
  readonly ranges: ChartRange[] = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];
  readonly range = signal<ChartRange>('1W');
  readonly portfolioSeries = computed(() => makePortfolioHistory(this.portfolio.totalValue(), this.range()));
  readonly watchlistAssets = computed(() => this.portfolio.watchlist().map((symbol) => this.market.asset(symbol)));
  readonly movers = computed(() => [...this.market.assets()].sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct)).slice(0, 4));

  openOrders(): number { return this.portfolio.orders().filter((order) => order.status === 'Open').length; }
  investedPct(): string { return this.portfolio.totalValue() ? ((this.portfolio.marketValue() / this.portfolio.totalValue()) * 100).toFixed(0) : '0'; }
  cashPct(): string { return this.portfolio.totalValue() ? ((this.portfolio.cash() / this.portfolio.totalValue()) * 100).toFixed(0) : '0'; }
  money(value: number): string { return formatCurrency(value); }
  compactMoney(value: number): string { return formatCompactCurrency(value); }
  signedMoney(value: number): string { return formatSignedCurrency(value); }
  percent(value: number, digits = 2): string { return formatPercent(value, digits); }
  time(value: string): string { return new Date(value).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }); }
  byMarketValue(a: { marketValue: number }, b: { marketValue: number }): number { return b.marketValue - a.marketValue; }

  sectorColor(sector: string): string {
    const asset = this.market.assets().find((item) => item.sector === sector);
    return asset?.color ?? '#75E2B5';
  }

  allocationBackground(): string {
    const total = this.portfolio.marketValue();
    if (total <= 0) return 'conic-gradient(#33414c 0 100%)';
    let cursor = 0;
    const stops = this.portfolio.allocationBySector().map((item) => {
      const start = cursor;
      cursor += item.weightPct;
      return `${this.sectorColor(item.sector)} ${start.toFixed(2)}% ${cursor.toFixed(2)}%`;
    });
    const cashStart = cursor;
    return `conic-gradient(${[...stops, `#34434e ${cashStart.toFixed(2)}% 100%`].join(', ')})`;
  }
}
