import { Component, computed, input } from '@angular/core';
import { CibChartCopy } from '../../i18n/content/cib-content.model';

// Purely presentational bar chart. It renders whatever it is given — it must
// never import cib-selectors.ts or own any filter/aggregation state. Bucket
// labels are expected to already be translated by the caller.

export interface CibChartBucket {
  readonly key: string;
  readonly label: string;
  readonly count: number;
}

export type CibChartOrientation = 'horizontal' | 'vertical';

interface RenderBar extends CibChartBucket {
  readonly position: number; // 0-100, along the category axis
  readonly size: number; // 0-100, this bar's share of the category axis
  readonly valuePct: number; // 0-100, this bar's share of `maximum`
  readonly barTop: number; // vertical orientation: rect y (SVG y grows downward)
}

@Component({
  selector: 'app-cib-chart',
  templateUrl: './cib-chart.html',
  styleUrl: './cib-chart.scss',
})
export class CibChart {
  readonly copy = input.required<CibChartCopy>();
  readonly buckets = input.required<readonly CibChartBucket[]>();
  readonly maximum = input.required<number>();
  readonly title = input.required<string>();
  readonly description = input.required<string>();
  readonly orientation = input.required<CibChartOrientation>();

  // Never divide by zero — an all-zero bucket set (no matching incidents)
  // still renders a labelled, zero-height/width chart rather than NaN bars.
  private readonly scaleMax = computed(() => Math.max(this.maximum(), 1));

  protected readonly bars = computed<readonly RenderBar[]>(() => {
    const list = this.buckets();
    const n = list.length;
    if (n === 0) return [];
    const max = this.scaleMax();
    return list.map((bucket, i) => {
      const valuePct = (bucket.count / max) * 100;
      const barTop = 100 - (valuePct / 100) * 85;
      return {
        ...bucket,
        position: (i * 100) / n,
        size: 100 / n,
        valuePct,
        barTop,
      };
    });
  });

  // Four anchored ticks fit the narrowest panel without dropping any bars.
  // Endpoints remain visible; full bucket labels/counts stay in the table.
  protected readonly axisTicks = computed(() => {
    const bars = this.bars();
    const count = Math.min(bars.length, 4);
    return Array.from({ length: count }, (_, i) => {
      const index = count === 1 ? 0 : Math.round(i * (bars.length - 1) / (count - 1));
      return bars[index];
    });
  });

  protected readonly peakBucket = computed<CibChartBucket | null>(() => {
    const list = this.buckets();
    if (list.length === 0) return null;
    return list.reduce((peak, bucket) => (bucket.count > peak.count ? bucket : peak), list[0]);
  });

  protected readonly summaryText = computed(() => {
    const peak = this.peakBucket();
    if (!peak || peak.count === 0) {
      return this.copy().emptySummary;
    }
    return this.copy().peakSummary.replace('{label}', peak.label).replace('{count}', String(peak.count));
  });
}
