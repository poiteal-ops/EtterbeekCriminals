import { ADayWithBestie } from './pages/a-day-with-bestie/a-day-with-bestie';
import { routes } from './app.routes';

describe('application routes', () => {
  it('registers A Day With Bestie in the shared page routes', () => {
    const pageRoutes = routes[0].children ?? [];

    expect(pageRoutes).toContainEqual({ path: 'a-day-with-bestie', component: ADayWithBestie });
    expect(routes[1].children).toBe(pageRoutes);
  });
});
