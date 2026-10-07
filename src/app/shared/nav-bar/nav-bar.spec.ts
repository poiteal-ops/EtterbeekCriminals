import { Component } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { NavBar } from './nav-bar';

@Component({ template: '' })
class TestPage {}

describe('NavBar', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NavBar],
      providers: [
        provideHttpClient(),
        provideRouter([
          { path: 'a-day-with-bestie', component: TestPage },
          { path: ':lang/a-day-with-bestie', component: TestPage },
        ]),
      ],
    });
  });

  it('marks the Stories dropdown active on a locale-prefixed story route', async () => {
    const fixture = TestBed.createComponent(NavBar);
    const router = TestBed.inject(Router);
    fixture.detectChanges();

    await router.navigateByUrl('/fr/a-day-with-bestie');
    fixture.detectChanges();

    expect(fixture.componentInstance['storiesActive']()).toBe(true);
  });

  it('exposes the Conspiracy Board route through the locale-aware navigation', () => {
    const fixture = TestBed.createComponent(NavBar);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('a[href="/conspiracy-board"]')?.textContent).toContain('CONSPIRACY');
  });
});
