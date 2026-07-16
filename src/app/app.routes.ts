import { Routes } from '@angular/router';

import { localeCanMatch } from './i18n/locale-match.guard';
import { localeResolver } from './i18n/locale.resolver';
import { About } from './pages/about/about';
import { Blog } from './pages/blog/blog';
import { Couch } from './pages/couch/couch';
import { Home } from './pages/home/home';
import { Pigeon } from './pages/pigeon/pigeon';
import { Shop } from './pages/shop/shop';
import { ShopItemPage } from './pages/shop-item/shop-item';
import { Story } from './pages/story/story';
import { TrainRide } from './pages/train-ride/train-ride';

const pageRoutes: Routes = [
  { path: '', component: Home },
  { path: 'about', component: About },
  { path: 'story', component: Story },
  { path: 'pigeon', component: Pigeon },
  { path: 'couch', component: Couch },
  { path: 'train-ride', component: TrainRide },
  { path: 'blog', component: Blog },
  { path: 'shop', component: Shop },
  { path: 'shop/:slug', component: ShopItemPage },
];

export const routes: Routes = [
  { path: '', resolve: { locale: localeResolver }, children: pageRoutes },
  { path: ':lang', canMatch: [localeCanMatch], resolve: { locale: localeResolver }, children: pageRoutes },
  { path: '**', redirectTo: '' },
];
