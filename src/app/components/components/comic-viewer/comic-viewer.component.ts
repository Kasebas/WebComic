import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { register } from 'swiper/element/bundle';
import { SwiperOptions } from 'swiper';

register();

@Component({
  selector: 'app-comic-viewer',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './comic-viewer.component.html',
  styleUrls: ['./comic-viewer.component.scss']
})

export class ComicViewerComponent {
  comicPages: string[] = [];
  swiperConfig: SwiperOptions = {
    navigation: true,
    pagination: { clickable: true }
  };

  constructor() {
    this.loadComicPages();
  }

  loadComicPages() {
    const totalPages = 10; // Cambia esto según la cantidad de imágenes
    for (let i = 1; i <= totalPages; i++) {
      this.comicPages.push(`assets/comics/page${i}.jpg`);
    }
  }
}
