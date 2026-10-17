import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MarketDataStore } from '../../core/state/market-data.store';
import { PaperPortfolioStore } from '../../core/state/paper-portfolio.store';
import { formatCurrency, formatPercent, formatSignedCurrency } from '../../shared/finance.utils';

@Component({
  selector: 'pp-markets-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="page-heading-row"><div><span class="eyebrow">YOUR WORKSPACE / MARKETS</span><h1>Markets</h1><p>Explore an illustrative sample universe and practice in paper mode.</p></div><div class="page-actions"><span class="pill-soft"><span class="status-dot"></span> SAMPLE QUOTES</span><button type="button" class="button button-primary" (click)="portfolio.openTicket(selectedAsset().symbol)"><span>+</span> Trade selected</button></div></div>
    <div class="demo-banner"><span class="banner-mark">i</span><div><strong>LIVE DEMO FEED</strong><span>Prices refresh in real time with a simulated market pulse and daily moves to keep the workspace feeling active.</span></div><span class="banner-origin">{{ market.usingFallback() ? 'LOCAL SAMPLE' : 'MYSQL SAMPLE' }}</span></div>

    <div class="market-summary-grid"><article class="market-summary-card"><span class="eyebrow">SAMPLE UNIVERSE</span><strong>{{ market.assets().length }}</strong><small>listed instruments</small></article><article class="market-summary-card"><span class="eyebrow">TOP SAMPLE GAINER</span><strong class="positive">{{ topGainer().symbol }} <span>{{ percent(topGainer().changePct) }}</span></strong><small>{{ topGainer().name }}</small></article><article class="market-summary-card"><span class="eyebrow">TOP SAMPLE DECLINER</span><strong class="negative">{{ topDecliner().symbol }} <span>{{ percent(topDecliner().changePct) }}</span></strong><small>{{ topDecliner().name }}</small></article><article class="market-summary-card"><span class="eyebrow">PAPER BUYING POWER</span><strong>{{ money(portfolio.buyingPower()) }}</strong><small>Held in this browser</small></article></div>

    <div class="markets-layout">
      <section class="panel market-list-panel"><header class="panel-head"><div><span class="eyebrow">INSTRUMENT DIRECTORY</span><h2>Sample market</h2></div><span class="pill-soft">{{ filteredAssets().length }} RESULTS</span></header>
        <div class="market-filters"><label class="filter-search"><span aria-hidden="true">⌕</span><input type="search" placeholder="Filter by symbol or company" [ngModel]="query()" (ngModelChange)="query.set($event)" aria-label="Filter assets by symbol or company" /></label><label class="select-filter"><span class="sr-only">Filter by sector</span><select [ngModel]="sector()" (ngModelChange)="sector.set($event)"><option value="All">All sectors</option>@for (item of sectors(); track item) { <option [value]="item">{{ item }}</option> }</select></label></div>
        <div class="table-scroll"><table class="data-table market-table"><thead><tr><th>INSTRUMENT</th><th>SECTOR</th><th class="align-right">SAMPLE PRICE</th><th class="align-right">DAY MOVE</th><th class="align-right">WATCH</th><th class="align-right">TRADE</th></tr></thead><tbody>
          @for (asset of filteredAssets(); track asset.symbol) { <tr [class.selected-row]="selectedSymbol() === asset.symbol" (click)="selectedSymbol.set(asset.symbol)"><td><button type="button" class="asset-cell asset-cell-button" (click)="$event.stopPropagation(); selectedSymbol.set(asset.symbol)"><span class="asset-token" [style.--asset-color]="asset.color">{{ asset.symbol.slice(0, 1) }}</span><span><strong>{{ asset.symbol }}</strong><small>{{ asset.name }}</small></span></button></td><td><span class="sector-label">{{ asset.sector }}</span></td><td class="align-right number-cell">{{ money(asset.price) }}</td><td class="align-right"><span class="table-change" [class.positive]="asset.changePct >= 0" [class.negative]="asset.changePct < 0">{{ signedMoney(asset.change) }} <small>({{ percent(asset.changePct) }})</small></span></td><td class="align-right"><button type="button" class="watch-button" [class.watching]="portfolio.hasWatchlistSymbol(asset.symbol)" [attr.aria-pressed]="portfolio.hasWatchlistSymbol(asset.symbol)" [attr.aria-label]="(portfolio.hasWatchlistSymbol(asset.symbol) ? 'Remove ' : 'Add ') + asset.symbol + ' ' + (portfolio.hasWatchlistSymbol(asset.symbol) ? 'from' : 'to') + ' watchlist'" (click)="$event.stopPropagation(); portfolio.toggleWatchlist(asset.symbol)">{{ portfolio.hasWatchlistSymbol(asset.symbol) ? '★' : '☆' }}</button></td><td class="align-right"><button type="button" class="table-action" (click)="$event.stopPropagation(); portfolio.openTicket(asset.symbol, 'Buy')">Buy</button></td></tr> }
          @if (filteredAssets().length === 0) { <tr><td colspan="6" class="empty-cell">No sample instruments match. Try a different symbol or sector.</td></tr> }
        </tbody></table></div>
        <div class="panel-bottom-link"><span>Watchlist changes are saved locally on this device.</span><span>All prices are samples</span></div>
      </section>

      <aside class="panel quote-detail-panel"><span class="eyebrow">SELECTED INSTRUMENT</span><div class="quote-detail-title"><span class="asset-token large-token" [style.--asset-color]="selectedAsset().color">{{ selectedAsset().symbol.slice(0, 1) }}</span><div><h2>{{ selectedAsset().symbol }}</h2><span>{{ selectedAsset().name }}</span></div></div><strong class="quote-price">{{ money(selectedAsset().price) }}</strong><div class="quote-move" [class.positive]="selectedAsset().changePct >= 0" [class.negative]="selectedAsset().changePct < 0">{{ signedMoney(selectedAsset().change) }} <span>({{ percent(selectedAsset().changePct) }})</span><small>illustrative daily move</small></div><div class="quote-divider"></div><p class="quote-description">{{ selectedAsset().description }}</p><div class="quote-facts"><div><span>Sector</span><strong>{{ selectedAsset().sector }}</strong></div><div><span>Listing</span><strong>{{ selectedAsset().exchange }}</strong></div><div><span>Data status</span><strong class="amber-text">Synthetic sample</strong></div></div><div class="quote-actions"><button class="button button-primary button-wide" type="button" (click)="portfolio.openTicket(selectedAsset().symbol, 'Buy')">New paper order</button><a class="button button-secondary button-wide" routerLink="/analysis" [queryParams]="{ symbol: selectedAsset().symbol }">Open analysis</a></div><p class="tiny-disclaimer">No real-time connection. Not a solicitation or investment recommendation.</p></aside>
    </div>
  `,
})
export class MarketsPageComponent implements OnInit {
  readonly market = inject(MarketDataStore);
  readonly portfolio = inject(PaperPortfolioStore);
  private readonly route = inject(ActivatedRoute);
  readonly query = signal('');
  readonly sector = signal('All');
  readonly selectedSymbol = signal('NVDA');
  readonly sectors = computed(() => [...new Set(this.market.assets().map((asset) => asset.sector))].sort());
  readonly filteredAssets = computed(() => {
    const query = this.query().trim().toLowerCase();
    return this.market.assets().filter((asset) => {
      const matchesQuery = !query || `${asset.symbol} ${asset.name} ${asset.sector}`.toLowerCase().includes(query);
      const matchesSector = this.sector() === 'All' || asset.sector === this.sector();
      return matchesQuery && matchesSector;
    });
  });

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const query = params.get('q') ?? '';
      this.query.set(query);
      const exact = this.market.assets().find((asset) => asset.symbol.toLowerCase() === query.toLowerCase());
      if (exact) this.selectedSymbol.set(exact.symbol);
    });
  }

  selectedAsset() { return this.market.asset(this.selectedSymbol()); }
  topGainer() { return [...this.market.assets()].sort((a, b) => b.changePct - a.changePct)[0]; }
  topDecliner() { return [...this.market.assets()].sort((a, b) => a.changePct - b.changePct)[0]; }
  money(value: number): string { return formatCurrency(value); }
  signedMoney(value: number): string { return formatSignedCurrency(value); }
  percent(value: number): string { return formatPercent(value); }
}
