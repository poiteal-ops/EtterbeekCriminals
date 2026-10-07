import { ADayWithBestie } from './pages/a-day-with-bestie/a-day-with-bestie';
import { KandeNadege } from './pages/kande-nadege/kande-nadege';
import { routes } from './app.routes';

describe('application routes', () => {
  it('registers A Day With Bestie in the shared page routes', () => {
    const pageRoutes = routes[0].children ?? [];

    expect(pageRoutes).toContainEqual({ path: 'a-day-with-bestie', component: ADayWithBestie });
    expect(routes[1].children).toBe(pageRoutes);
  });

  it('registers Kande Nadege in the shared page routes', () => {
    const pageRoutes = routes[0].children ?? [];

    expect(pageRoutes).toContainEqual({ path: 'kande-nadege', component: KandeNadege });
    expect(routes[1].children).toBe(pageRoutes);
  });

  it('registers the game as a lazy page for both English and localized routes', () => {
    const pageRoutes = routes[0].children ?? [];
    const game = pageRoutes.find((route) => route.path === 'game');
    expect(typeof game?.loadComponent).toBe('function');
    expect(routes[1].children).toBe(pageRoutes);
  });
});
