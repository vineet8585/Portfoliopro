import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MarketDataStore } from '../../core/state/market-data.store';
import { PaperPortfolioStore } from '../../core/state/paper-portfolio.store';
import { formatCurrency, formatPercent } from '../../shared/finance.utils';

@Component({
  selector: 'pp-risk-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page-heading-row"><div><span class="eyebrow">YOUR WORKSPACE / EXPOSURE</span><h1>Risk &amp; exposure</h1><p>A simple concentration lens for this simulated account.</p></div><div class="page-actions"><span class="pill-soft">ILLUSTRATIVE METRICS</span><a class="button button-secondary" routerLink="/portfolio">View portfolio</a></div></div>
    <div class="demo-banner risk-banner"><span class="banner-mark">!</span><div><strong>NOT A RISK MODEL</strong><span>Sample prices are not live. These arithmetic summaries are not VaR, stress-tested forecasts, investment advice, or a guarantee of future risk.</span></div><span class="banner-origin">PAPER ACCOUNT</span></div>

    <section class="metric-grid three-metrics" aria-label="Illustrative portfolio exposure summary"><article class="metric-card"><div class="metric-label"><span>Largest position</span><span class="metric-code">TOP 1</span></div><strong class="metric-value">{{ topPosition()?.symbol ?? '—' }} <span class="metric-inline">{{ weight(topPosition()?.marketValue ?? 0) }}</span></strong><div class="metric-foot"><span>{{ topPosition()?.asset?.name ?? 'No sample positions' }}</span></div></article><article class="metric-card"><div class="metric-label"><span>Invested exposure</span><span class="metric-code">EQUITY</span></div><strong class="metric-value">{{ weight(portfolio.marketValue()) }}</strong><div class="metric-foot"><span>Share of total paper account value</span></div></article><article class="metric-card"><div class="metric-label"><span>Cash buffer</span><span class="metric-code">CASH</span></div><strong class="metric-value">{{ money(portfolio.cash()) }}</strong><div class="metric-foot"><span>{{ weight(portfolio.cash()) }} of account value</span></div></article></section>

    <div class="risk-grid"><section class="panel concentration-panel"><header class="panel-head"><div><span class="eyebrow">NAME CONCENTRATION</span><h2>Position weights</h2></div><span class="pill-soft">BY SAMPLE VALUE</span></header>
      <div class="concentration-summary"><div class="hhi-gauge"><strong>{{ hhi() }}</strong><span>HHI · illustrative</span></div><p>Herfindahl-Hirschman Index calculated from invested position values. This simple concentration statistic is not a complete portfolio-risk score.</p></div>
      <div class="exposure-list">@for (position of portfolio.positionsSummary().slice().sort(byMarketValue); track position.symbol) { <div class="exposure-row"><div class="exposure-label"><span class="asset-token small-token" [style.--asset-color]="position.asset.color">{{ position.symbol.slice(0, 1) }}</span><strong>{{ position.symbol }}</strong><span>{{ position.asset.sector }}</span><b>{{ weight(position.marketValue) }}</b></div><div class="exposure-track"><span [style.width.%]="weightNumber(position.marketValue)" [style.background]="position.asset.color"></span></div></div> }</div>
      @if (portfolio.positions().length === 0) { <div class="empty-cell">No invested positions in this paper account.</div> }
    </section>

    <section class="panel sector-panel"><header class="panel-head"><div><span class="eyebrow">SECTOR ALLOCATION</span><h2>Exposure by sector</h2></div><span class="pill-soft">INVESTED ONLY</span></header>
      <div class="sector-list">@for (sector of portfolio.allocationBySector(); track sector.sector) { <div class="sector-row"><div class="sector-name-line"><span class="legend-swatch" [style.background]="sectorColor(sector.sector)"></span><strong>{{ sector.sector }}</strong><span>{{ percent(sector.weightPct, 1) }} of invested</span></div><div class="sector-value-line"><span class="exposure-track"><span [style.width.%]="sector.weightPct" [style.background]="sectorColor(sector.sector)"></span></span><strong>{{ money(sector.value) }}</strong></div></div> }</div>
      <div class="cash-exposure-row"><span><span class="legend-swatch cash-swatch"></span> Cash</span><strong>{{ money(portfolio.cash()) }}</strong><span>{{ weight(portfolio.cash()) }} of account</span></div>
      @if (portfolio.allocationBySector().length === 0) { <div class="empty-cell">No invested sector exposure.</div> }
    </section>

    <section class="panel scenario-panel"><header class="panel-head"><div><span class="eyebrow">TRANSPARENT WHAT-IF</span><h2>Illustrative price shock</h2></div><span class="pill-soft">NOT A FORECAST</span></header><p class="panel-intro">Simple arithmetic on current sample equity value, holding quantities constant. Cash is excluded; no probability is implied.</p>
      <div class="scenario-list">@for (scenario of scenarios; track scenario.dropPct) { <div class="scenario-row"><span class="scenario-name">{{ scenario.label }}</span><div class="scenario-track"><span [style.width.%]="scenario.dropPct * 3" ></span></div><strong class="negative">−{{ money(portfolio.marketValue() * scenario.dropPct / 100) }}</strong></div> }</div>
      <div class="scenario-foot">A hypothetical {{ scenarios[0].dropPct }}% sample price decline is not an expected loss, risk estimate, or trading recommendation.</div>
    </section>

    <section class="panel risk-notes-panel"><header class="panel-head"><div><span class="eyebrow">HOW TO READ THIS PAGE</span><h2>Scope &amp; limits</h2></div></header><ul class="risk-notes"><li><strong>Inputs</strong><span>Browser-local positions and seeded illustrative quotes.</span></li><li><strong>Concentration</strong><span>Share of sample invested value by name and sector; HHI is a descriptive summary only.</span></li><li><strong>Excluded</strong><span>Volatility forecasts, beta, covariance, liquidity, options, leverage, tax, and issuer/market news.</span></li><li><strong>Use</strong><span>For UI demonstration only. Not investment, legal, or tax advice.</span></li></ul></section></div>
  `,
})
export class RiskPageComponent {
  readonly market = inject(MarketDataStore);
  readonly portfolio = inject(PaperPortfolioStore);
  readonly scenarios = [
    { dropPct: 10, label: '−10% sample price move' },
    { dropPct: 20, label: '−20% sample price move' },
    { dropPct: 30, label: '−30% sample price move' },
  ];
  readonly hhi = computed(() => {
    const invested = this.portfolio.marketValue();
    if (invested <= 0) return '0';
    const score = this.portfolio.positionsSummary().reduce((sum, position) => sum + (position.marketValue / invested) ** 2, 0) * 10_000;
    return score.toFixed(0);
  });

  topPosition() { return this.portfolio.positionsSummary().slice().sort((a, b) => b.marketValue - a.marketValue)[0]; }
  money(value: number): string { return formatCurrency(value); }
  percent(value: number, digits = 1): string { return formatPercent(value, digits); }
  weight(value: number): string { return `${this.portfolio.totalValue() > 0 ? (value / this.portfolio.totalValue() * 100).toFixed(1) : '0.0'}%`; }
  weightNumber(value: number): number { return this.portfolio.totalValue() > 0 ? value / this.portfolio.totalValue() * 100 : 0; }
  byMarketValue(a: { marketValue: number }, b: { marketValue: number }): number { return b.marketValue - a.marketValue; }
  sectorColor(sector: string): string { return this.market.assets().find((asset) => asset.sector === sector)?.color ?? '#75E2B5'; }
}
