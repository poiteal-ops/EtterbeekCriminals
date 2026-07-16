import { Routes } from '@angular/router';

import { About } from './pages/about/about';
import { Blog } from './pages/blog/blog';
import { Couch } from './pages/couch/couch';
import { Home } from './pages/home/home';
import { Pigeon } from './pages/pigeon/pigeon';
import { Shop } from './pages/shop/shop';
import { Story } from './pages/story/story';
import { TrainRide } from './pages/train-ride/train-ride';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'about', component: About },
  { path: 'story', component: Story },
  { path: 'pigeon', component: Pigeon },
  { path: 'couch', component: Couch },
  { path: 'train-ride', component: TrainRide },
  { path: 'blog', component: Blog },
  { path: 'shop', component: Shop },
  { path: '**', redirectTo: '' },
];
