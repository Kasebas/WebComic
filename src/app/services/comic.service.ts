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
    theme: 'light',
    zoomLevel: 100,
    fullscreen: false,
    autoProgress: false
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

  getAllReadingProgress(): ReadingProgress[] {
    return Array.from(this.readingProgressMap.values());
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
        coverImage: 'assets/covers/comic-1.svg',
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
        title: 'Misterios y Fantasía',
        author: 'María González',
        description: 'Historias que combinan misterio detectivesco con aventuras fantásticas.',
        coverImage: 'assets/covers/comic-2.svg',
        genres: ['Misterio', 'Fantasía'],
        status: 'completed',
        rating: 4.2,
        totalChapters: 2,
        lastUpdated: new Date('2024-07-20'),
        chapters: [
          {
            id: 'ch-2-1',
            comicId: 'comic-2',
            chapterNumber: 1,
            title: 'El Científico Perdido',
            description: 'Un brillante investigador ha desaparecido misteriosamente del laboratorio.',
            pages: this.generatePages('ch-2-1', 6),
            publishDate: new Date('2024-07-10'),
            isInteractive: true
          },
          {
            id: 'ch-2-2',
            comicId: 'comic-2',
            chapterNumber: 2,
            title: 'La Torre Sombría',
            description: 'Una aventura épica para rescatar a la princesa.',
            pages: this.generatePages('ch-2-2', 4),
            publishDate: new Date('2024-07-20'),
            isInteractive: true
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
      const page: Page = {
        id: `${chapterId}-page-${i}`,
        chapterId: chapterId,
        pageNumber: i,
        imageUrl: `assets/comics/${chapterId}/page${i}.svg`,
        altText: `Página ${i} del capítulo`
      };

      // Add interactive elements for specific pages
      if (chapterId === 'ch-1-2' && i === 2) {
        // Interactive story element on page 2 of chapter 2
        page.interactiveElements = [
          {
            id: 'story-choice-1',
            type: 'interactive_story',
            position: { x: 60, y: 70, width: 30, height: 20 },
            storyId: 'space-adventure-mission-1',
            title: 'Tomar una decisión',
            description: 'Tu elección afectará el curso de la historia'
          }
        ];
      } else if (chapterId === 'ch-1-3' && i === 3) {
        // Interactive story element on page 3 of chapter 3
        page.interactiveElements = [
          {
            id: 'story-choice-2',
            type: 'interactive_story',
            position: { x: 20, y: 60, width: 25, height: 15 },
            storyId: 'space-adventure-encounter',
            title: 'El encuentro crítico',
            description: 'Una decisión que cambiará el destino'
          }
        ];
      } else if (chapterId === 'ch-2-1' && i === 4) {
        // Mystery story element for demonstration
        page.interactiveElements = [
          {
            id: 'mystery-story-1',
            type: 'interactive_story',
            position: { x: 75, y: 80, width: 20, height: 10 },
            storyId: 'mystery-investigation',
            title: 'Investigar el misterio',
            description: 'Resuelve el caso del científico desaparecido'
          }
        ];
      } else if (chapterId === 'ch-2-2' && i === 2) {
        // Fantasy adventure story element
        page.interactiveElements = [
          {
            id: 'fantasy-story-1',
            type: 'interactive_story',
            position: { x: 40, y: 30, width: 35, height: 25 },
            storyId: 'fantasy-adventure',
            title: 'Embárcate en una aventura',
            description: 'Rescata a la princesa de la Torre Sombría'
          }
        ];
      } else if (chapterId === 'ch-1-1' && i === 3) {
        // Link element for demonstration
        page.interactiveElements = [
          {
            id: 'external-link-1',
            type: 'link',
            position: { x: 75, y: 80, width: 20, height: 10 },
            url: 'https://github.com/inkle/ink',
            title: 'Más sobre InkJS',
            description: 'Aprende más sobre el motor de narrativa interactiva'
          }
        ];
      }

      pages.push(page);
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
