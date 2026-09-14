import { TestBed } from '@angular/core/testing';
import { EN_CONTENT } from '../../i18n/content/en.content';
import { CibChart, CibChartBucket, CibChartOrientation } from './cib-chart';

function render(buckets: CibChartBucket[], orientation: CibChartOrientation = 'vertical') {
  const fixture = TestBed.createComponent(CibChart);
  fixture.componentRef.setInput('copy', EN_CONTENT.cib.chart);
  fixture.componentRef.setInput('buckets', buckets);
  fixture.componentRef.setInput('maximum', 4);
  fixture.componentRef.setInput('title', 'Activity');
  fixture.componentRef.setInput('description', 'Recorded incidents');
  fixture.componentRef.setInput('orientation', orientation);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('CIB chart label rendering', () => {
  it('keeps long category labels and counts out of non-uniform SVG scaling', () => {
    const element = render([{ key: 'damage', label: 'SACHBESCHÄDIGUNG', count: 4 }], 'horizontal');
    const label = element.querySelector('.tick-label')!;
    expect(label.textContent).toBe('SACHBESCHÄDIGUNG');
    expect(label.closest('svg')).toBeNull();
    expect(element.querySelector('.value-label')?.closest('svg')).toBeNull();
    expect(element.querySelector('.value-label')?.textContent).toBe('4');
  });

  it('thins a dense time axis while preserving both endpoints and every bar/table row', () => {
    const element = render(Array.from({ length: 28 }, (_, i) => ({ key: String(i), label: `${i + 1} août`, count: i % 5 })));
    const ticks = [...element.querySelectorAll('.tick-label')];
    expect(ticks.length).toBeLessThanOrEqual(4);
    expect(ticks.length).toBeGreaterThan(1);
    expect(ticks[0].textContent).toBe('1 août');
    expect(ticks.at(-1)?.textContent).toBe('28 août');
    expect(ticks.every((tick) => !tick.closest('svg'))).toBe(true);
    expect(element.querySelectorAll('rect.bar')).toHaveLength(28);
    expect(element.querySelectorAll('tbody tr')).toHaveLength(28);
  });

  it('renders short and empty time axes without duplicate ticks or invalid geometry', () => {
    const element = render([{ key: '0', label: '00:00', count: 0 }, { key: '1', label: '01:00', count: 0 }]);
    expect([...element.querySelectorAll('.tick-label')].map((tick) => tick.textContent)).toEqual(['00:00', '01:00']);
    expect(element.innerHTML).not.toContain('NaN');
    expect(render([]).querySelectorAll('.tick-label')).toHaveLength(0);
  });
});
