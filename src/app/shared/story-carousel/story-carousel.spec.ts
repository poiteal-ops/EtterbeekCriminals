import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { StoryCarousel } from './story-carousel';

describe('StoryCarousel', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      imports: [StoryCarousel],
      providers: [provideHttpClient(), provideRouter([])],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts on the first story', () => {
    const fixture = TestBed.createComponent(StoryCarousel);
    fixture.detectChanges();

    expect(fixture.componentInstance['currentIndex']()).toBe(0);
  });

  it('advances to the next story after 15 seconds', () => {
    const fixture = TestBed.createComponent(StoryCarousel);
    fixture.detectChanges();

    vi.advanceTimersByTime(15000);
    vi.advanceTimersByTime(300);

    expect(fixture.componentInstance['currentIndex']()).toBe(1);
  });

  it('wraps back to the first story after the last one', () => {
    const fixture = TestBed.createComponent(StoryCarousel);
    fixture.detectChanges();
    const total = fixture.componentInstance['translation'].t().adventures.length;

    for (let i = 0; i < total; i++) {
      vi.advanceTimersByTime(15000);
      vi.advanceTimersByTime(300);
    }

    expect(fixture.componentInstance['currentIndex']()).toBe(0);
  });

  it('does not advance while paused', () => {
    const fixture = TestBed.createComponent(StoryCarousel);
    fixture.detectChanges();
    fixture.componentInstance['pause']();

    vi.advanceTimersByTime(15000);
    vi.advanceTimersByTime(300);

    expect(fixture.componentInstance['currentIndex']()).toBe(0);
  });

  it('resumes advancing after resume() is called', () => {
    const fixture = TestBed.createComponent(StoryCarousel);
    fixture.detectChanges();
    fixture.componentInstance['pause']();
    fixture.componentInstance['resume']();

    vi.advanceTimersByTime(15000);
    vi.advanceTimersByTime(300);

    expect(fixture.componentInstance['currentIndex']()).toBe(1);
  });

  it('selectStory jumps directly to the given index', () => {
    const fixture = TestBed.createComponent(StoryCarousel);
    fixture.detectChanges();

    fixture.componentInstance['selectStory'](2);
    vi.advanceTimersByTime(300);

    expect(fixture.componentInstance['currentIndex']()).toBe(2);
  });

  it('selectStory restarts the 15s timer instead of stacking with the old one', () => {
    const fixture = TestBed.createComponent(StoryCarousel);
    fixture.detectChanges();

    vi.advanceTimersByTime(10000);
    fixture.componentInstance['selectStory'](2);
    vi.advanceTimersByTime(300);

    // Only 10s left on a stacked old timer would fire here if selectStory hadn't reset it.
    vi.advanceTimersByTime(10000);
    expect(fixture.componentInstance['currentIndex']()).toBe(2);

    vi.advanceTimersByTime(5000);
    vi.advanceTimersByTime(300);
    expect(fixture.componentInstance['currentIndex']()).toBe(3);
  });
});
