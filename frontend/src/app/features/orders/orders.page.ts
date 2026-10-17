import { Component, computed, inject, signal } from '@angular/core';
import type { OrderStatus } from '../../core/api/market-api.models';
import { MarketDataStore } from '../../core/state/market-data.store';
import { PaperPortfolioStore } from '../../core/state/paper-portfolio.store';
import { formatCurrency, formatTimestamp } from '../../shared/finance.utils';

type OrderFilter = 'All' | OrderStatus;

@Component({
  selector: 'pp-orders-page',
  standalone: true,
  template: `
    <div class="page-heading-row"><div><span class="eyebrow">YOUR WORKSPACE / ACTIVITY</span><h1>Orders</h1><p>Track simulated fills and local open limit orders.</p></div><div class="page-actions"><span class="pill-soft"><span class="status-dot"></span> PAPER MODE</span><button type="button" class="button button-primary" (click)="portfolio.openTicket()"><span>+</span> New paper order</button></div></div>
    <div class="demo-banner"><span class="banner-mark">i</span><div><strong>ORDER LOG IS LOCAL</strong><span>Entries are kept in this browser's storage. They are not routed to any broker or exchange.</span></div><span class="banner-origin">NO LIVE EXECUTION</span></div>
    <section class="metric-grid three-metrics" aria-label="Paper order totals"><article class="metric-card"><div class="metric-label"><span>Total entries</span><span class="metric-code">ALL</span></div><strong class="metric-value">{{ portfolio.orders().length }}</strong><div class="metric-foot"><span>Sample and locally simulated</span></div></article><article class="metric-card"><div class="metric-label"><span>Open limit orders</span><span class="metric-code">OPEN</span></div><strong class="metric-value">{{ count('Open') }}</strong><div class="metric-foot"><span>Reserves are local only</span></div></article><article class="metric-card"><div class="metric-label"><span>Paper buying power</span><span class="metric-code">USD</span></div><strong class="metric-value">{{ money(portfolio.buyingPower()) }}</strong><div class="metric-foot"><span>After open buy-limit reservations</span></div></article></section>

    <section class="panel order-history-panel"><header class="panel-head"><div><span class="eyebrow">LOCAL ACTIVITY</span><h2>Order history</h2></div><div class="panel-head-actions"><span class="pill-soft">{{ filteredOrders().length }} ENTRIES</span></div></header>
      <div class="order-filters" role="group" aria-label="Filter orders">@for (item of filters; track item) { <button type="button" [class.active]="filter() === item" (click)="filter.set(item)">{{ item }}<span>{{ count(item) }}</span></button> }</div>
      <div class="table-scroll"><table class="data-table orders-table"><thead><tr><th>REFERENCE</th><th>INSTRUMENT</th><th>SIDE / TYPE</th><th class="align-right">QUANTITY</th><th class="align-right">ILLUSTRATIVE PRICE</th><th>SUBMITTED</th><th>STATUS</th><th class="align-right">ACTION</th></tr></thead><tbody>
        @for (order of filteredOrders(); track order.id) { <tr><td><span class="order-reference">{{ order.id }}</span></td><td><div class="asset-cell"><span class="asset-token small-token" [style.--asset-color]="market.asset(order.symbol).color">{{ order.symbol.slice(0, 1) }}</span><strong>{{ order.symbol }}</strong></div></td><td><span class="side-type" [class.positive]="order.side === 'Buy'" [class.negative]="order.side === 'Sell'">{{ order.side }}</span><small class="type-subtext">{{ order.type }}</small></td><td class="align-right number-cell">{{ order.shares }}</td><td class="align-right number-cell">{{ money(order.price) }}</td><td class="date-cell">{{ time(order.submittedAt) }}</td><td><span class="status-badge" [class.status-open]="order.status === 'Open'" [class.status-filled]="order.status === 'Filled'" [class.status-cancelled]="order.status === 'Cancelled'">{{ order.status }}</span></td><td class="align-right"><button type="button" class="table-action cancel-action" [disabled]="order.status !== 'Open'" (click)="portfolio.cancelOrder(order.id)">{{ order.status === 'Open' ? 'Cancel' : '—' }}</button></td></tr> }
        @if (filteredOrders().length === 0) { <tr><td colspan="8" class="empty-cell">No {{ filter().toLowerCase() }} paper orders.</td></tr> }
      </tbody></table></div>
      <div class="panel-bottom-link"><span>Market orders fill immediately at a static illustrative quote. Limit orders may stay open.</span><span>Simulation only</span></div>
    </section>

    <section class="order-help panel"><span class="help-icon">i</span><div><strong>Paper order behavior</strong><p>Market orders and marketable limits update this browser's cash and positions. Non-marketable limit orders stay open. Cancelling an open order releases local reservations. No order is sent to a broker.</p></div></section>
  `,
})
export class OrdersPageComponent {
  readonly market = inject(MarketDataStore);
  readonly portfolio = inject(PaperPortfolioStore);
  readonly filters: OrderFilter[] = ['All', 'Open', 'Filled', 'Cancelled'];
  readonly filter = signal<OrderFilter>('All');
  readonly filteredOrders = computed(() => {
    const orders = this.portfolio.orders();
    const selected = this.filter();
    return orders.filter((order) => selected === 'All' || order.status === selected)
      .slice().sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  });

  count(status: OrderFilter): number { return status === 'All' ? this.portfolio.orders().length : this.portfolio.orders().filter((order) => order.status === status).length; }
  money(value: number): string { return formatCurrency(value); }
  time(value: string): string { return formatTimestamp(value); }
}
