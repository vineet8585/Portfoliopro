import { Component, Input } from '@angular/core';
import type { ChartPoint } from '../../core/api/market-api.models';

@Component({
  selector: 'pp-market-chart',
  standalone: true,
  template: `
    <div class="chart-wrap" [class.compact-chart]="compact">
      <svg class="chart-svg" viewBox="0 0 820 260" role="img" [attr.aria-label]="label">
        <g class="chart-grid">
          <line x1="42" y1="28" x2="808" y2="28" />
          <line x1="42" y1="78" x2="808" y2="78" />
          <line x1="42" y1="128" x2="808" y2="128" />
          <line x1="42" y1="178" x2="808" y2="178" />
          <line x1="42" y1="218" x2="808" y2="218" />
        </g>
        @if (showVolume) {
          <g class="volume-bars">
            @for (point of points; track $index; let i = $index) {
              <rect [attr.x]="volumeX(i)" [attr.y]="volumeY(point.volume ?? 0)" [attr.width]="barWidth()" [attr.height]="volumeHeight(point.volume ?? 0)" rx="1" />
            }
          </g>
        }
        @if (showBands && points.length > 1) {
          <path class="band-area" [attr.d]="bandAreaPath()" />
          <path class="band-line" [attr.d]="seriesPath('upper')" />
          <path class="band-line" [attr.d]="seriesPath('lower')" />
        }
        @if (points.length > 1) {
          <path class="chart-area" [attr.d]="areaPath()" />
          @if (showAverage) { <path class="chart-average" [attr.d]="seriesPath('average')" /> }
          <path class="chart-line" [attr.d]="seriesPath('value')" />
          <circle class="chart-last-dot" [attr.cx]="x(points.length - 1)" [attr.cy]="y(points[points.length - 1].value)" r="4" />
        }
      </svg>
      @if (points.length > 1) {
        <div class="chart-axis-labels"><span>{{ points[0].label }}</span><span>{{ points[points.length - 1].label }}</span></div>
      }
    </div>
  `,
})
export class MarketChartComponent {
  @Input() points: ChartPoint[] = [];
  @Input() label = 'Illustrative sample price chart';
  @Input() showBands = false;
  @Input() showAverage = false;
  @Input() showVolume = false;
  @Input() compact = false;

  private readonly left = 42;
  private readonly right = 808;
  private readonly top = 16;
  private readonly bottom = 218;

  x(index: number): number {
    return this.left + (index / Math.max(1, this.points.length - 1)) * (this.right - this.left);
  }

  y(value: number): number {
    const { minimum, maximum } = this.bounds();
    return this.top + ((maximum - value) / Math.max(0.000001, maximum - minimum)) * (this.bottom - this.top);
  }

  seriesPath(field: 'value' | 'average' | 'upper' | 'lower'): string {
    const valid = this.points
      .map((point, index) => ({ point, index, value: point[field] }))
      .filter((item): item is { point: ChartPoint; index: number; value: number } => typeof item.value === 'number' && Number.isFinite(item.value));
    return valid.map((item, index) => `${index === 0 ? 'M' : 'L'} ${this.x(item.index).toFixed(1)} ${this.y(item.value).toFixed(1)}`).join(' ');
  }

  areaPath(): string {
    if (this.points.length < 2) return '';
    const line = this.seriesPath('value');
    return `${line} L ${this.x(this.points.length - 1).toFixed(1)} ${this.bottom} L ${this.x(0).toFixed(1)} ${this.bottom} Z`;
  }

  bandAreaPath(): string {
    const upper = this.points.map((point, index) => ({ point, index })).filter(({ point }) => typeof point.upper === 'number');
    const lower = this.points.map((point, index) => ({ point, index })).filter(({ point }) => typeof point.lower === 'number').reverse();
    if (upper.length < 2 || lower.length < 2) return '';
    const topPath = upper.map(({ point, index }, i) => `${i === 0 ? 'M' : 'L'} ${this.x(index).toFixed(1)} ${this.y(point.upper as number).toFixed(1)}`).join(' ');
    const bottomPath = lower.map(({ point, index }) => `L ${this.x(index).toFixed(1)} ${this.y(point.lower as number).toFixed(1)}`).join(' ');
    return `${topPath} ${bottomPath} Z`;
  }

  barWidth(): number {
    return Math.max(1.5, (this.right - this.left) / Math.max(1, this.points.length) * 0.6);
  }

  volumeX(index: number): number {
    return this.x(index) - this.barWidth() / 2;
  }

  volumeHeight(volume: number): number {
    const max = Math.max(1, ...this.points.map((point) => point.volume ?? 0));
    return Math.max(1, (volume / max) * 27);
  }

  volumeY(volume: number): number {
    return this.bottom - this.volumeHeight(volume);
  }

  private bounds(): { minimum: number; maximum: number } {
    const values = this.points.flatMap((point) => [
      point.value,
      ...(this.showAverage && typeof point.average === 'number' ? [point.average] : []),
      ...(this.showBands && typeof point.upper === 'number' ? [point.upper] : []),
      ...(this.showBands && typeof point.lower === 'number' ? [point.lower] : []),
    ]).filter(Number.isFinite);
    const minimum = values.length ? Math.min(...values) : 0;
    const maximum = values.length ? Math.max(...values) : 1;
    const pad = Math.max(0.01, (maximum - minimum) * 0.12);
    return { minimum: minimum - pad, maximum: maximum + pad };
  }
}
