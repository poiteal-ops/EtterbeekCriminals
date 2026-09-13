import { Component, computed, input } from '@angular/core';

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
  readonly tickMod: number; // i % 4, used by CSS to thin ticks at narrow widths
  readonly barTop: number; // vertical orientation: rect y (SVG y grows downward)
  readonly valueLabelY: number; // vertical orientation: value label y, clamped so it never floats off-chart
}

@Component({
  selector: 'app-cib-chart',
  templateUrl: './cib-chart.html',
  styleUrl: './cib-chart.scss',
})
export class CibChart {
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
        tickMod: i % 4,
        barTop,
        valueLabelY: Math.max(barTop - 3, 8),
      };
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
      return 'No incidents recorded for the current filters.';
    }
    const unit = peak.count === 1 ? 'incident' : 'incidents';
    return `Peak: ${peak.label} (${peak.count} ${unit}).`;
  });
}
