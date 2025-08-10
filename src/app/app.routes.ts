import { Routes } from '@angular/router';
import { provideRouter } from '@angular/router';
import { ComicViewerComponent } from './components/components/comic-viewer/comic-viewer.component';
import { NovelViewerComponent } from './components/components/novel-viewer/novel-viewer.component';


export const routes: Routes = [
  { path: '', redirectTo: '/comics', pathMatch: 'full' },
  { path: 'comics', component: ComicViewerComponent },
  { path: 'novel', component: NovelViewerComponent },
];

export const appRouting = provideRouter(routes);
