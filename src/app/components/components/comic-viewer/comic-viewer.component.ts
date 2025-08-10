import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { register } from 'swiper/element/bundle';
import { SwiperOptions } from 'swiper';
import { Comic, Chapter, Page, ReadingProgress } from '../../../models/comic.interface';
import { ComicService } from '../../../services/comic.service';

register();

@Component({
  selector: 'app-comic-viewer',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './comic-viewer.component.html',
  styleUrls: ['./comic-viewer.component.scss']
})
export class ComicViewerComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  comic: Comic | null = null;
  currentChapter: Chapter | null = null;
  currentPageIndex = 0;
  isLoading = true;
  
  swiperConfig: SwiperOptions = {
    navigation: true,
    pagination: { 
      clickable: true,
      type: 'progressbar'
    },
    keyboard: {
      enabled: true
    },
    mousewheel: {
      forceToAxis: true
    },
    effect: 'fade',
    fadeEffect: {
      crossFade: true
    },
    speed: 300
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private comicService: ComicService
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      const comicId = params['comicId'];
      const chapterNumber = parseInt(params['chapterNumber']) || 1;
      const pageNumber = parseInt(params['pageNumber']) || 1;
      
      if (comicId) {
        this.loadComic(comicId, chapterNumber, pageNumber);
      } else {
        // Modo demo con las imágenes existentes
        this.loadDemoComic();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadComic(comicId: string, chapterNumber: number, pageNumber: number): void {
    this.isLoading = true;
    
    this.comicService.getComicById(comicId).pipe(
      takeUntil(this.destroy$)
    ).subscribe(comic => {
      if (comic) {
        this.comic = comic;
        this.loadChapter(chapterNumber, pageNumber);
      } else {
        console.error('Comic not found');
        this.router.navigate(['/']);
      }
    });
  }

  private loadChapter(chapterNumber: number, pageNumber: number): void {
    if (!this.comic) return;
    
    this.currentChapter = this.comic.chapters.find(ch => ch.chapterNumber === chapterNumber) || this.comic.chapters[0];
    this.currentPageIndex = Math.max(0, pageNumber - 1);
    this.isLoading = false;
    
    // Actualizar progreso de lectura
    this.updateReadingProgress();
  }

  private loadDemoComic(): void {
    // Crear un cómic demo con las imágenes existentes
    this.comic = {
      id: 'demo',
      title: 'Demo Comic',
      author: 'Demo Author',
      description: 'Comic de demostración',
      coverImage: 'assets/comics/page1.jpg',
      genres: ['Demo'],
      status: 'ongoing',
      rating: 5,
      totalChapters: 1,
      lastUpdated: new Date(),
      chapters: [{
        id: 'demo-ch1',
        comicId: 'demo',
        chapterNumber: 1,
        title: 'Capítulo Demo',
        description: 'Capítulo de demostración',
        pages: [
          { id: 'demo-p1', chapterId: 'demo-ch1', pageNumber: 1, imageUrl: 'assets/comics/page1.jpg', altText: 'Página 1' },
          { id: 'demo-p2', chapterId: 'demo-ch1', pageNumber: 2, imageUrl: 'assets/comics/page2.jpg', altText: 'Página 2' },
          { id: 'demo-p3', chapterId: 'demo-ch1', pageNumber: 3, imageUrl: 'assets/comics/page3.jpg', altText: 'Página 3' }
        ],
        publishDate: new Date(),
        isInteractive: false
      }]
    };
    
    this.currentChapter = this.comic.chapters[0];
    this.currentPageIndex = 0;
    this.isLoading = false;
  }

  onSlideChange(event: any): void {
    if (event.detail && event.detail[0]) {
      this.currentPageIndex = event.detail[0].activeIndex;
      this.updateReadingProgress();
      this.updateURL();
    }
  }

  goToPage(pageIndex: number): void {
    this.currentPageIndex = pageIndex;
    this.updateReadingProgress();
    this.updateURL();
  }

  goToNextChapter(): void {
    if (!this.comic || !this.currentChapter) return;
    
    const nextChapter = this.comic.chapters.find(ch => ch.chapterNumber === this.currentChapter!.chapterNumber + 1);
    if (nextChapter) {
      this.router.navigate(['/comic', this.comic.id, 'chapter', nextChapter.chapterNumber, 'page', 1]);
    }
  }

  goToPreviousChapter(): void {
    if (!this.comic || !this.currentChapter) return;
    
    const prevChapter = this.comic.chapters.find(ch => ch.chapterNumber === this.currentChapter!.chapterNumber - 1);
    if (prevChapter) {
      this.router.navigate(['/comic', this.comic.id, 'chapter', prevChapter.chapterNumber, 'page', prevChapter.pages.length]);
    }
  }

  backToLibrary(): void {
    this.router.navigate(['/']);
  }

  private updateReadingProgress(): void {
    if (!this.comic || !this.currentChapter) return;
    
    const progress: ReadingProgress = {
      comicId: this.comic.id,
      currentChapter: this.currentChapter.chapterNumber,
      currentPage: this.currentPageIndex + 1,
      lastReadDate: new Date(),
      isCompleted: this.isLastPage() && this.isLastChapter()
    };
    
    this.comicService.updateReadingProgress(progress);
  }

  private updateURL(): void {
    if (!this.comic || !this.currentChapter) return;
    
    this.router.navigate(['/comic', this.comic.id, 'chapter', this.currentChapter.chapterNumber, 'page', this.currentPageIndex + 1], {
      replaceUrl: true
    });
  }

  isLastPage(): boolean {
    return this.currentChapter ? this.currentPageIndex >= this.currentChapter.pages.length - 1 : false;
  }

  isFirstPage(): boolean {
    return this.currentPageIndex <= 0;
  }

  isLastChapter(): boolean {
    if (!this.comic || !this.currentChapter) return false;
    return this.currentChapter.chapterNumber >= Math.max(...this.comic.chapters.map(ch => ch.chapterNumber));
  }

  isFirstChapter(): boolean {
    if (!this.comic || !this.currentChapter) return false;
    return this.currentChapter.chapterNumber <= Math.min(...this.comic.chapters.map(ch => ch.chapterNumber));
  }

  getCurrentPageNumber(): number {
    return this.currentPageIndex + 1;
  }

  getTotalPages(): number {
    return this.currentChapter?.pages.length || 0;
  }
}
