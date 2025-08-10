import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, Subject, debounceTime, distinctUntilChanged, takeUntil, map, combineLatest, startWith } from 'rxjs';
import { Comic, ReadingProgress } from '../../models/comic.interface';
import { ComicService } from '../../services/comic.service';

@Component({
  selector: 'app-comic-library',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './comic-library.component.html',
  styleUrl: './comic-library.component.scss'
})
export class ComicLibraryComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  comics$: Observable<Comic[]>;
  filteredComics$!: Observable<Comic[]>;
  recentlyRead$!: Observable<Comic[]>;
  favorites$!: Observable<Comic[]>;
  continueReading$!: Observable<Comic[]>;

  searchQuery = '';
  selectedGenre = '';
  selectedStatus = '';
  sortBy = 'title';
  viewMode: 'grid' | 'list' = 'grid';
  showFilters = false;

  genres: string[] = [];
  statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'ongoing', label: 'En curso' },
    { value: 'completed', label: 'Completado' },
    { value: 'hiatus', label: 'En pausa' }
  ];

  sortOptions = [
    { value: 'title', label: 'Título' },
    { value: 'lastUpdated', label: 'Última actualización' },
    { value: 'rating', label: 'Calificación' },
    { value: 'totalChapters', label: 'Capítulos' }
  ];

  activeTab: 'all' | 'recent' | 'favorites' | 'continue' = 'all';

  constructor(
    private comicService: ComicService,
    private router: Router
  ) {
    this.comics$ = this.comicService.getComics();

    // Initialize observables
    this.initializeObservables();
  }

  ngOnInit(): void {
    // Setup search with debounce
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      this.searchQuery = query;
      this.updateFilters();
    });

    // Load genres when comics are loaded
    this.comics$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(comics => {
      this.extractGenres(comics);
    });

    // Load view mode from localStorage
    const savedViewMode = localStorage.getItem('comic-library-view-mode');
    if (savedViewMode === 'grid' || savedViewMode === 'list') {
      this.viewMode = savedViewMode;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeObservables(): void {
    // Filtered comics based on search, genre, and status
    this.filteredComics$ = combineLatest([
      this.comics$,
      this.searchSubject.pipe(startWith('')),
    ]).pipe(
      map(([comics, searchQuery]) => {
        let filtered = comics;

        // Apply search filter
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          filtered = filtered.filter(comic =>
            comic.title.toLowerCase().includes(query) ||
            comic.author.toLowerCase().includes(query) ||
            comic.description.toLowerCase().includes(query) ||
            comic.genres.some(genre => genre.toLowerCase().includes(query))
          );
        }

        // Apply genre filter
        if (this.selectedGenre) {
          filtered = filtered.filter(comic =>
            comic.genres.includes(this.selectedGenre)
          );
        }

        // Apply status filter
        if (this.selectedStatus) {
          filtered = filtered.filter(comic =>
            comic.status === this.selectedStatus
          );
        }

        // Apply sorting
        return this.sortComics(filtered);
      })
    );

    // Recently read comics
    this.recentlyRead$ = this.comics$.pipe(
      map(comics => {
        const progressList = this.comicService.getAllReadingProgress();
        const recentComics = progressList
          .sort((a: ReadingProgress, b: ReadingProgress) => new Date(b.lastReadDate).getTime() - new Date(a.lastReadDate).getTime())
          .slice(0, 6)
          .map((progress: ReadingProgress) => comics.find(comic => comic.id === progress.comicId))
          .filter((comic): comic is Comic => comic !== undefined);

        return recentComics;
      })
    );

    // Favorite comics (mock implementation - you can add a favorites service)
    this.favorites$ = this.comics$.pipe(
      map(comics => {
        const favoriteIds = this.getFavoriteIds();
        return comics.filter(comic => favoriteIds.includes(comic.id));
      })
    );

    // Continue reading comics
    this.continueReading$ = this.comics$.pipe(
      map(comics => {
        const progressList = this.comicService.getAllReadingProgress();
        const continueComics = progressList
          .filter((progress: ReadingProgress) => !progress.isCompleted)
          .sort((a: ReadingProgress, b: ReadingProgress) => new Date(b.lastReadDate).getTime() - new Date(a.lastReadDate).getTime())
          .slice(0, 8)
          .map((progress: ReadingProgress) => comics.find(comic => comic.id === progress.comicId))
          .filter((comic): comic is Comic => comic !== undefined);

        return continueComics;
      })
    );
  }

  // Tab management
  setActiveTab(tab: 'all' | 'recent' | 'favorites' | 'continue'): void {
    this.activeTab = tab;
  }

  // Search functionality
  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchSubject.next(target.value);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchSubject.next('');
  }

  // Filter functionality
  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  onGenreChange(): void {
    this.updateFilters();
  }

  onStatusChange(): void {
    this.updateFilters();
  }

  onSortChange(): void {
    this.updateFilters();
  }

  clearFilters(): void {
    this.selectedGenre = '';
    this.selectedStatus = '';
    this.sortBy = 'title';
    this.updateFilters();
  }

  private updateFilters(): void {
    // Trigger filter update by emitting current search query
    this.searchSubject.next(this.searchQuery);
  }

  // View mode
  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
    localStorage.setItem('comic-library-view-mode', mode);
  }

  // Comic interaction
  onComicSelect(comic: Comic): void {
    const progress = this.comicService.getReadingProgress(comic.id);

    if (progress && !progress.isCompleted) {
      // Continue reading from where left off
      this.router.navigate(['/comic', comic.id, 'chapter', progress.currentChapter, 'page', progress.currentPage]);
    } else {
      // Start from beginning
      this.router.navigate(['/comic', comic.id, 'chapter', 1, 'page', 1]);
    }
  }

  readFromBeginning(comic: Comic, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/comic', comic.id, 'chapter', 1, 'page', 1]);
  }

  continueReading(comic: Comic, event: Event): void {
    event.stopPropagation();
    const progress = this.comicService.getReadingProgress(comic.id);
    if (progress) {
      this.router.navigate(['/comic', comic.id, 'chapter', progress.currentChapter, 'page', progress.currentPage]);
    } else {
      this.onComicSelect(comic);
    }
  }

  toggleFavorite(comic: Comic, event: Event): void {
    event.stopPropagation();
    const favorites = this.getFavoriteIds();
    const index = favorites.indexOf(comic.id);

    if (index > -1) {
      favorites.splice(index, 1);
    } else {
      favorites.push(comic.id);
    }

    this.saveFavoriteIds(favorites);
  }

  isFavorite(comic: Comic): boolean {
    return this.getFavoriteIds().includes(comic.id);
  }

  // Progress and status
  getReadingProgress(comicId: string): ReadingProgress | null {
    return this.comicService.getReadingProgress(comicId);
  }

  getProgressPercentage(comic: Comic): number {
    const progress = this.getReadingProgress(comic.id);
    if (!progress) return 0;

    const totalPages = comic.chapters.reduce((sum, chapter) => sum + chapter.pages.length, 0);
    let currentPageIndex = 0;

    for (let i = 0; i < progress.currentChapter - 1; i++) {
      currentPageIndex += comic.chapters[i]?.pages.length || 0;
    }
    currentPageIndex += progress.currentPage - 1;

    return totalPages > 0 ? Math.round((currentPageIndex / totalPages) * 100) : 0;
  }

  hasProgress(comic: Comic): boolean {
    const progress = this.getReadingProgress(comic.id);
    return progress !== null && (progress.currentChapter > 1 || progress.currentPage > 1);
  }

  isCompleted(comic: Comic): boolean {
    const progress = this.getReadingProgress(comic.id);
    return progress?.isCompleted || false;
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'ongoing': return '#4CAF50';
      case 'completed': return '#2196F3';
      case 'hiatus': return '#FF9800';
      default: return '#9E9E9E';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'ongoing': return 'En curso';
      case 'completed': return 'Completado';
      case 'hiatus': return 'En pausa';
      default: return 'Desconocido';
    }
  }

  // Utility methods
  private sortComics(comics: Comic[]): Comic[] {
    return comics.sort((a, b) => {
      switch (this.sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'lastUpdated':
          return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
        case 'rating':
          return b.rating - a.rating;
        case 'totalChapters':
          return b.totalChapters - a.totalChapters;
        default:
          return 0;
      }
    });
  }

  private extractGenres(comics: Comic[]): void {
    const genreSet = new Set<string>();
    comics.forEach(comic => {
      comic.genres.forEach(genre => genreSet.add(genre));
    });
    this.genres = Array.from(genreSet).sort();
  }

  private getFavoriteIds(): string[] {
    const stored = localStorage.getItem('comic-favorites');
    return stored ? JSON.parse(stored) : [];
  }

  private saveFavoriteIds(favorites: string[]): void {
    localStorage.setItem('comic-favorites', JSON.stringify(favorites));
  }

  // Demo method to add some sample comics if none exist
  addSampleComics(): void {
    // This is just for demonstration - you'd normally load comics from a real source
    console.log('Adding sample comics...');
  }
}
