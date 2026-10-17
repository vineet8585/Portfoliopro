import { Component, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { OrderSide, OrderType, PaperOrder } from '../../core/api/market-api.models';
import { MarketDataStore } from '../../core/state/market-data.store';
import { PaperPortfolioStore } from '../../core/state/paper-portfolio.store';
import { formatCurrency, formatTimestamp } from '../finance.utils';

@Component({
  selector: 'pp-order-ticket',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="modal-backdrop" (click)="close()" (keydown.escape)="close()">
      <section class="order-modal" role="dialog" aria-modal="true" aria-labelledby="ticket-title" (click)="$event.stopPropagation()">
        <header class="modal-head">
          <div><span class="eyebrow">PAPER TRADING · SIMULATION ONLY</span><h2 id="ticket-title">Order ticket</h2></div>
          <button type="button" class="icon-button" aria-label="Close order ticket" (click)="close()">×</button>
        </header>

        @if (receipt) {
          <div class="order-receipt">
            <div class="receipt-mark">✓</div>
            <span class="eyebrow">SIMULATED ORDER ACCEPTED</span>
            <h3>{{ receipt.side }} {{ receipt.shares }} {{ receipt.symbol }}</h3>
            <p>{{ successMessage }}</p>
            <div class="receipt-row"><span>Reference</span><strong>{{ receipt.id }}</strong></div>
            <div class="receipt-row"><span>Order</span><strong>{{ receipt.type }} · {{ receipt.status }}</strong></div>
            <div class="receipt-row"><span>Illustrative price</span><strong>{{ money(receipt.price) }}</strong></div>
            <div class="receipt-row"><span>Value</span><strong>{{ money(receipt.price * receipt.shares) }}</strong></div>
            <button type="button" class="button button-primary button-wide" (click)="close()">Done</button>
          </div>
        } @else {
          <div class="ticket-safety"><strong>No broker connection.</strong> This order changes only the paper account saved in this browser.</div>
          @if (errorMessage) { <div class="inline-error" role="alert">{{ errorMessage }}</div> }
          @if (!reviewing) {
            <form class="ticket-form" (ngSubmit)="review()">
              <div class="form-grid">
                <label class="field"><span>Side</span><select name="side" [(ngModel)]="side"><option value="Buy">Buy</option><option value="Sell">Sell</option></select></label>
                <label class="field"><span>Order type</span><select name="type" [(ngModel)]="type"><option value="Market">Market</option><option value="Limit">Limit</option></select></label>
              </div>
              <label class="field"><span>Instrument</span>
                <select name="symbol" [(ngModel)]="symbol" (ngModelChange)="syncLimitPrice()">
                  @for (asset of market.assets(); track asset.symbol) { <option [value]="asset.symbol">{{ asset.symbol }} · {{ asset.name }}</option> }
                </select>
              </label>
              <div class="form-grid">
                <label class="field"><span>Whole shares</span><input name="shares" type="number" min="1" step="1" required [(ngModel)]="shares" /></label>
                @if (type === 'Limit') {
                  <label class="field"><span>Limit price</span><input name="limitPrice" type="number" min="0.01" step="0.01" required [(ngModel)]="limitPrice" /></label>
                } @else {
                  <div class="field"><span>Illustrative quote</span><div class="field-static">{{ money(asset.price) }}</div></div>
                }
              </div>
              <div class="ticket-quote"><span>{{ asset.name }} · {{ asset.exchange }}</span><strong>{{ money(asset.price) }}</strong></div>
              <div class="ticket-summary"><span>Estimated order value</span><strong>{{ money(estimate) }}</strong></div>
              @if (side === 'Buy') { <div class="ticket-summary subtle-summary"><span>Paper buying power</span><span>{{ money(portfolio.buyingPower()) }}</span></div> }
              @if (side === 'Sell') { <div class="ticket-summary subtle-summary"><span>Available paper shares</span><span>{{ portfolio.availableShares(symbol) }}</span></div> }
              <button type="submit" class="button button-primary button-wide">Review paper order</button>
            </form>
          } @else {
            <div class="review-card">
              <span class="eyebrow">REVIEW BEFORE SIMULATION</span>
              <div class="review-symbol"><span class="asset-token" [style.--asset-color]="asset.color">{{ symbol.slice(0, 1) }}</span><div><strong>{{ symbol }}</strong><small>{{ asset.name }}</small></div></div>
              <div class="receipt-row"><span>Action</span><strong>{{ side }} {{ shares }} shares</strong></div>
              <div class="receipt-row"><span>Order type</span><strong>{{ type }}{{ type === 'Limit' ? ' · ' + money(limitPrice) : '' }}</strong></div>
              <div class="receipt-row"><span>Estimated fill</span><strong>{{ money(estimate) }}</strong></div>
              <div class="review-note">{{ type === 'Market' ? 'This paper market order will fill immediately at the illustrative quote.' : 'A non-marketable paper limit order remains open and reserves local demo buying power or shares.' }}</div>
              <div class="review-actions"><button type="button" class="button button-secondary" (click)="reviewing = false">Edit</button><button type="button" class="button button-primary" (click)="confirm()">Confirm paper order</button></div>
            </div>
          }
          <footer class="ticket-footer">Sample quotes are illustrative, not live. No order is transmitted to a brokerage.</footer>
        }
      </section>
    </div>
  `,
})
export class OrderTicketComponent {
  side: OrderSide = 'Buy';
  type: OrderType = 'Market';
  symbol = 'NVDA';
  shares = 10;
  limitPrice = 0;
  reviewing = false;
  errorMessage = '';
  successMessage = '';
  receipt: PaperOrder | null = null;

  constructor(readonly market: MarketDataStore, readonly portfolio: PaperPortfolioStore) {
    this.symbol = portfolio.ticketSymbol();
    this.side = portfolio.ticketSide();
    this.syncLimitPrice();
  }

  get asset() { return this.market.asset(this.symbol); }
  get estimate(): number {
    const price = this.type === 'Limit' && !this.marketable ? Number(this.limitPrice) : this.asset.price;
    return Number.isFinite(this.shares * price) ? this.shares * price : 0;
  }

  get marketable(): boolean {
    if (this.type === 'Market') return true;
    return this.side === 'Buy' ? Number(this.limitPrice) >= this.asset.price : Number(this.limitPrice) <= this.asset.price;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void { this.close(); }

  syncLimitPrice(): void {
    const quote = this.market.asset(this.symbol).price;
    this.limitPrice = Number((this.side === 'Buy' ? quote * 0.99 : quote * 1.01).toFixed(2));
    this.errorMessage = '';
  }

  review(): void {
    this.errorMessage = '';
    if (!Number.isInteger(Number(this.shares)) || Number(this.shares) <= 0) {
      this.errorMessage = 'Enter a whole-share quantity greater than zero.';
      return;
    }
    if (this.type === 'Limit' && (!Number.isFinite(Number(this.limitPrice)) || Number(this.limitPrice) <= 0)) {
      this.errorMessage = 'Enter a valid limit price.';
      return;
    }
    if (this.side === 'Sell' && Number(this.shares) > this.portfolio.availableShares(this.symbol)) {
      this.errorMessage = 'Not enough unreserved shares in this paper portfolio.';
      return;
    }
    if (this.side === 'Buy' && this.marketable && this.estimate > this.portfolio.cash()) {
      this.errorMessage = 'Not enough demo cash for this simulated order.';
      return;
    }
    if (this.side === 'Buy' && !this.marketable && this.estimate > this.portfolio.buyingPower()) {
      this.errorMessage = 'Not enough demo buying power to reserve this limit order.';
      return;
    }
    this.reviewing = true;
  }

  confirm(): void {
    const result = this.portfolio.submitOrder({
      symbol: this.symbol,
      side: this.side,
      type: this.type,
      shares: Number(this.shares),
      limitPrice: Number(this.limitPrice),
    });
    if (!result.ok || !result.order) {
      this.errorMessage = result.message;
      this.reviewing = false;
      return;
    }
    this.receipt = result.order;
    this.successMessage = result.message;
  }

  money(value: number): string { return formatCurrency(value); }
  time(value: string): string { return formatTimestamp(value); }
  close(): void { this.portfolio.closeTicket(); }
}
