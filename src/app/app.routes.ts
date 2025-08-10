import { Routes } from '@angular/router';
import { ComicViewerComponent } from './components/components/comic-viewer/comic-viewer.component';
import { NovelViewerComponent } from './components/components/novel-viewer/novel-viewer.component';
import { ComicLibraryComponent } from './components/comic-library/comic-library.component';

export const routes: Routes = [
  { path: '', component: ComicLibraryComponent },
  { path: 'library', component: ComicLibraryComponent },
  { path: 'comic/:comicId/chapter/:chapterNumber/page/:pageNumber', component: ComicViewerComponent },
  { path: 'comic/:comicId/chapter/:chapterNumber', component: ComicViewerComponent },
  { path: 'comic/:comicId', component: ComicViewerComponent },
  { path: 'viewer', component: ComicViewerComponent }, // Para modo demo
  { path: 'novel', component: NovelViewerComponent },
  { path: '**', redirectTo: '/' }
];
