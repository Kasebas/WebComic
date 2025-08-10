import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, OnDestroy, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, combineLatest } from 'rxjs';
import { register } from 'swiper/element/bundle';
import { SwiperOptions } from 'swiper';
import { Comic, Chapter, Page, ReadingProgress, ReadingSettings, UserPreferences } from '../../../models/comic.interface';
import { ComicService } from '../../../services/comic.service';
import { ReadingSettingsService } from '../../../services/reading-settings.service';
import { InteractiveStoryComponent } from '../../interactive-story/interactive-story.component';

register();

// Comic Viewer Component - Enhanced with advanced reading features
@Component({
  selector: 'app-comic-viewer',
  standalone: true,
  imports: [CommonModule, InteractiveStoryComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './comic-viewer.component.html',
  styleUrls: ['./comic-viewer.component.scss']
})
export class ComicViewerComponent implements OnInit, OnDestroy {
  @ViewChild('swiperContainer', { static: false }) swiperContainer!: ElementRef;
  @ViewChild('comicViewer', { static: false }) comicViewer!: ElementRef;

  private destroy$ = new Subject<void>();

  comic: Comic | null = null;
  currentChapter: Chapter | null = null;
  currentPageIndex = 0;
  isLoading = true;
  showControls = true;
  controlsTimeout: any;

  // Interactive story state
  showInteractiveStory = false;
  currentStoryId: string | null = null;

  // Reading settings
  readingSettings: ReadingSettings = {
    currentZoom: 100,
    isFullscreen: false,
    readingDirection: 'ltr',
    fitMode: 'width'
  };

  userPreferences: UserPreferences = {
    readingMode: 'single',
    autoplay: false,
    animationSpeed: 300,
    fontSize: 16,
    theme: 'light',
    zoomLevel: 100,
    fullscreen: false,
    autoProgress: false
  };

  swiperConfig: SwiperOptions = {
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },
    pagination: {
      el: '.swiper-pagination',
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
    speed: 300,
    on: {
      slideChange: (swiper) => {
        this.currentPageIndex = swiper.activeIndex;
        this.updateReadingProgress();
        this.resetControlsTimeout();
      }
    }
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private comicService: ComicService,
    private readingSettingsService: ReadingSettingsService
  ) { }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        this.previousPage();
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.nextPage();
        break;
      case 'f':
      case 'F':
        event.preventDefault();
        this.toggleFullscreen();
        break;
      case '+':
      case '=':
        event.preventDefault();
        this.zoomIn();
        break;
      case '-':
        event.preventDefault();
        this.zoomOut();
        break;
      case '0':
        event.preventDefault();
        this.resetZoom();
        break;
      case 'Escape':
        if (this.readingSettings.isFullscreen) {
          this.toggleFullscreen();
        }
        break;
    }
  }

  @HostListener('mousemove')
  onMouseMove(): void {
    this.showControls = true;
    this.resetControlsTimeout();
  }

  ngOnInit(): void {
    // Cargar configuraciones
    combineLatest([
      this.readingSettingsService.readingSettings$,
      this.readingSettingsService.preferences$
    ]).pipe(
      takeUntil(this.destroy$)
    ).subscribe(([settings, preferences]) => {
      this.readingSettings = settings;
      this.userPreferences = preferences;
      this.updateSwiperConfig();
    });

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

    this.resetControlsTimeout();
  }

  ngOnDestroy(): void {
    if (this.controlsTimeout) {
      clearTimeout(this.controlsTimeout);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  private resetControlsTimeout(): void {
    if (this.controlsTimeout) {
      clearTimeout(this.controlsTimeout);
    }
    this.controlsTimeout = setTimeout(() => {
      this.showControls = false;
    }, 3000);
  }

  private updateSwiperConfig(): void {
    this.swiperConfig = {
      ...this.swiperConfig,
      speed: this.userPreferences.animationSpeed,
      direction: this.userPreferences.readingMode === 'scroll' ? 'vertical' : 'horizontal'
    };
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

  // Navigation methods
  nextPage(): void {
    if (this.isLastPage()) {
      this.goToNextChapter();
    } else {
      this.goToPage(this.currentPageIndex + 1);
    }
  }

  previousPage(): void {
    if (this.isFirstPage()) {
      this.goToPreviousChapter();
    } else {
      this.goToPage(this.currentPageIndex - 1);
    }
  }

  goToPage(pageIndex: number): void {
    if (!this.currentChapter) return;

    pageIndex = Math.max(0, Math.min(this.currentChapter.pages.length - 1, pageIndex));
    this.currentPageIndex = pageIndex;
    this.updateReadingProgress();
    this.updateURL();

    // Update swiper if available
    const swiper = this.swiperContainer?.nativeElement?.swiper;
    if (swiper) {
      swiper.slideTo(pageIndex);
    }
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

  // Reading controls
  toggleFullscreen(): void {
    this.readingSettingsService.toggleFullscreen();

    if (!document.fullscreenElement) {
      this.comicViewer?.nativeElement?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  zoomIn(): void {
    this.readingSettingsService.zoomIn();
  }

  zoomOut(): void {
    this.readingSettingsService.zoomOut();
  }

  resetZoom(): void {
    this.readingSettingsService.resetZoom();
  }

  setReadingMode(mode: 'single' | 'double' | 'scroll'): void {
    this.readingSettingsService.updatePreferences({ readingMode: mode });
  }

  setFitMode(mode: 'width' | 'height' | 'original'): void {
    this.readingSettingsService.setFitMode(mode);
  }

  toggleControls(): void {
    this.showControls = !this.showControls;
    if (this.showControls) {
      this.resetControlsTimeout();
    }
  }

  backToLibrary(): void {
    this.router.navigate(['/']);
  }

  // Utility methods
  onSlideChange(event: any): void {
    if (event.detail && event.detail[0]) {
      this.currentPageIndex = event.detail[0].activeIndex;
      this.updateReadingProgress();
      this.updateURL();
    }
  }

  onImageLoad(): void {
    // Handle image load event if needed
  }

  onImageError(event: any): void {
    console.error('Error loading image:', event);
  }

  onInteractiveElementClick(element: any): void {
    // Handle interactive element clicks
    console.log('Interactive element clicked:', element);

    if (element.type === 'interactive_story' && element.storyId) {
      this.currentStoryId = element.storyId;
      this.showInteractiveStory = true;
      this.showControls = false; // Hide comic controls during story
    } else if (element.type === 'link' && element.url) {
      // Handle external links
      window.open(element.url, '_blank');
    } else if (element.type === 'page_jump' && element.targetPage) {
      // Handle page jumps within the comic
      this.jumpToPage(element.targetPage);
    }
  }

  closeInteractiveStory(): void {
    this.showInteractiveStory = false;
    this.currentStoryId = null;
    this.showControls = true; // Restore comic controls
  }

  private jumpToPage(pageNumber: number): void {
    if (this.swiperContainer?.nativeElement) {
      const swiper = this.swiperContainer.nativeElement.swiper;
      const targetIndex = Math.max(0, Math.min(pageNumber - 1, this.getTotalPages() - 1));
      swiper.slideTo(targetIndex);
    }
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

  // Status check methods
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

  getImageStyle(): any {
    const zoom = this.readingSettings.currentZoom;
    const fitMode = this.readingSettings.fitMode;

    let style: any = {
      transform: `scale(${zoom / 100})`,
      'transform-origin': 'center center'
    };

    switch (fitMode) {
      case 'width':
        style.width = '100%';
        style.height = 'auto';
        break;
      case 'height':
        style.height = '100vh';
        style.width = 'auto';
        break;
      case 'original':
        style.width = 'auto';
        style.height = 'auto';
        break;
    }

    return style;
  }
}
