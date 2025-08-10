import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ComicViewerComponent } from './components/components/comic-viewer/comic-viewer.component';
import { NovelViewerComponent } from './components/components/novel-viewer/novel-viewer.component';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, ComicViewerComponent, NovelViewerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'webcomic';
}
