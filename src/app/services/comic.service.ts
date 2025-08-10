import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Comic, Chapter, Page, ReadingProgress, UserPreferences } from '../models/comic.interface';

@Injectable({
  providedIn: 'root'
})
export class ComicService {
  private comics: Comic[] = [];
  private comicsSubject = new BehaviorSubject<Comic[]>([]);
  private readingProgressMap = new Map<string, ReadingProgress>();
  private userPreferences: UserPreferences = {
    readingMode: 'single',
    autoplay: false,
    animationSpeed: 500,
    fontSize: 16,
    theme: 'light'
  };

  constructor() {
    this.loadMockData();
  }

  // Observables
  getComics(): Observable<Comic[]> {
    return this.comicsSubject.asObservable();
  }

  getComicById(id: string): Observable<Comic | undefined> {
    const comic = this.comics.find(c => c.id === id);
    return of(comic);
  }

  getChapterById(comicId: string, chapterId: string): Observable<Chapter | undefined> {
    const comic = this.comics.find(c => c.id === comicId);
    const chapter = comic?.chapters.find(ch => ch.id === chapterId);
    return of(chapter);
  }

  getChapterByNumber(comicId: string, chapterNumber: number): Observable<Chapter | undefined> {
    const comic = this.comics.find(c => c.id === comicId);
    const chapter = comic?.chapters.find(ch => ch.chapterNumber === chapterNumber);
    return of(chapter);
  }

  // Reading Progress
  getReadingProgress(comicId: string): ReadingProgress | null {
    return this.readingProgressMap.get(comicId) || null;
  }

  updateReadingProgress(progress: ReadingProgress): void {
    this.readingProgressMap.set(progress.comicId, progress);
    this.saveProgressToLocalStorage();
  }

  // User Preferences
  getUserPreferences(): UserPreferences {
    return { ...this.userPreferences };
  }

  updateUserPreferences(preferences: Partial<UserPreferences>): void {
    this.userPreferences = { ...this.userPreferences, ...preferences };
    this.savePreferencesToLocalStorage();
  }

  // Search and Filter
  searchComics(query: string): Observable<Comic[]> {
    const filteredComics = this.comics.filter(comic =>
      comic.title.toLowerCase().includes(query.toLowerCase()) ||
      comic.author.toLowerCase().includes(query.toLowerCase()) ||
      comic.description.toLowerCase().includes(query.toLowerCase())
    );
    return of(filteredComics);
  }

  getComicsByGenre(genre: string): Observable<Comic[]> {
    const filteredComics = this.comics.filter(comic =>
      comic.genres.includes(genre)
    );
    return of(filteredComics);
  }

  // Private methods
  private loadMockData(): void {
    this.comics = [
      {
        id: 'comic-1',
        title: 'Aventuras Espaciales',
        author: 'Juan Pérez',
        description: 'Una emocionante aventura en el espacio con elementos interactivos.',
        coverImage: 'assets/comics/comic-1/cover.jpg',
        genres: ['Sci-Fi', 'Aventura'],
        status: 'ongoing',
        rating: 4.5,
        totalChapters: 3,
        lastUpdated: new Date('2024-08-01'),
        chapters: [
          {
            id: 'ch-1-1',
            comicId: 'comic-1',
            chapterNumber: 1,
            title: 'El Despertar',
            description: 'Nuestro héroe despierta en una nave espacial.',
            pages: this.generatePages('ch-1-1', 3),
            publishDate: new Date('2024-07-01'),
            isInteractive: false
          },
          {
            id: 'ch-1-2',
            comicId: 'comic-1',
            chapterNumber: 2,
            title: 'Primera Misión',
            description: 'La primera misión interactiva comienza.',
            pages: this.generatePages('ch-1-2', 4),
            publishDate: new Date('2024-07-15'),
            isInteractive: true
          },
          {
            id: 'ch-1-3',
            comicId: 'comic-1',
            chapterNumber: 3,
            title: 'El Encuentro',
            description: 'Un encuentro que cambiará todo.',
            pages: this.generatePages('ch-1-3', 5),
            publishDate: new Date('2024-08-01'),
            isInteractive: true
          }
        ]
      },
      {
        id: 'comic-2',
        title: 'Misterios Urbanos',
        author: 'María González',
        description: 'Historias de misterio en la gran ciudad.',
        coverImage: 'assets/comics/comic-2/cover.jpg',
        genres: ['Misterio', 'Drama'],
        status: 'completed',
        rating: 4.2,
        totalChapters: 2,
        lastUpdated: new Date('2024-07-20'),
        chapters: [
          {
            id: 'ch-2-1',
            comicId: 'comic-2',
            chapterNumber: 1,
            title: 'La Desaparición',
            description: 'Alguien ha desaparecido en la ciudad.',
            pages: this.generatePages('ch-2-1', 6),
            publishDate: new Date('2024-07-10'),
            isInteractive: false
          },
          {
            id: 'ch-2-2',
            comicId: 'comic-2',
            chapterNumber: 2,
            title: 'La Verdad',
            description: 'La verdad sale a la luz.',
            pages: this.generatePages('ch-2-2', 4),
            publishDate: new Date('2024-07-20'),
            isInteractive: false
          }
        ]
      }
    ];

    this.comicsSubject.next(this.comics);
    this.loadProgressFromLocalStorage();
    this.loadPreferencesFromLocalStorage();
  }

  private generatePages(chapterId: string, count: number): Page[] {
    const pages: Page[] = [];
    for (let i = 1; i <= count; i++) {
      pages.push({
        id: `${chapterId}-page-${i}`,
        chapterId: chapterId,
        pageNumber: i,
        imageUrl: `assets/comics/${chapterId.split('-')[1]}-${chapterId.split('-')[2]}/page${i}.jpg`,
        altText: `Página ${i} del capítulo`
      });
    }
    return pages;
  }

  private saveProgressToLocalStorage(): void {
    const progressArray = Array.from(this.readingProgressMap.entries());
    localStorage.setItem('webcomic-progress', JSON.stringify(progressArray));
  }

  private loadProgressFromLocalStorage(): void {
    const saved = localStorage.getItem('webcomic-progress');
    if (saved) {
      const progressArray = JSON.parse(saved);
      this.readingProgressMap = new Map(progressArray);
    }
  }

  private savePreferencesToLocalStorage(): void {
    localStorage.setItem('webcomic-preferences', JSON.stringify(this.userPreferences));
  }

  private loadPreferencesFromLocalStorage(): void {
    const saved = localStorage.getItem('webcomic-preferences');
    if (saved) {
      this.userPreferences = { ...this.userPreferences, ...JSON.parse(saved) };
    }
  }
}
