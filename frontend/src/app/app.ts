import { Component, ElementRef, HostListener, OnInit, signal, ViewChild } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from './core/auth/auth.service';
import { MarketDataStore } from './core/state/market-data.store';
import { PaperPortfolioStore } from './core/state/paper-portfolio.store';
import { OrderTicketComponent } from './shared/order-ticket/order-ticket.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, OrderTicketComponent],
  templateUrl: './shell.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  @ViewChild('symbolSearch') symbolSearch?: ElementRef<HTMLInputElement>;

  readonly navigation = [
    { path: '/overview', label: 'Overview', code: 'OV' },
    { path: '/portfolio', label: 'Portfolio', code: 'PF' },
    { path: '/markets', label: 'Markets', code: 'MK' },
    { path: '/analysis', label: 'Analysis', code: 'AN' },
    { path: '/risk', label: 'Risk', code: 'RK' },
    { path: '/orders', label: 'Orders', code: 'OR' },
  ];
  searchTerm = '';
  readonly authScreen = signal(false);

  constructor(
    private readonly router: Router,
    readonly auth: AuthService,
    readonly market: MarketDataStore,
    readonly portfolio: PaperPortfolioStore,
  ) {
    this.authScreen.set(this.router.url.startsWith('/login'));
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe((event) => {
      this.authScreen.set((event as NavigationEnd).urlAfterRedirects.startsWith('/login'));
    });
  }

  ngOnInit(): void {
    this.market.load();
  }

  onSearchInput(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
  }

  goToSearch(): void {
    const query = this.searchTerm.trim();
    this.router.navigate(['/markets'], { queryParams: query ? { q: query } : {} });
  }

  openTicket(): void {
    this.portfolio.openTicket('NVDA', 'Buy');
  }

  signOut(): void {
    void this.auth.logout();
  }

  money(value: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value);
  }

  @HostListener('document:keydown', ['$event'])
  onShortcut(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.symbolSearch?.nativeElement.focus();
    }
  }
}
