import { provideHttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { App } from './app';
import { MarketDataStore } from './core/state/market-data.store';

@Component({ standalone: true, template: 'Test route' })
class MockRouteComponent {}

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideHttpClient(),
        provideRouter([{ path: '**', component: MockRouteComponent }]),
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    vi.spyOn(TestBed.inject(MarketDataStore), 'load').mockImplementation(() => {});
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the PortfolioPro identity and section navigation', () => {
    vi.spyOn(TestBed.inject(MarketDataStore), 'load').mockImplementation(() => {});
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('PortfolioPro');
    expect(compiled.querySelectorAll('.nav-link')).toHaveLength(6);
  });
});
