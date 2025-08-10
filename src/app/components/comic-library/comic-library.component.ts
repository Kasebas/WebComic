import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { Comic, ReadingProgress } from '../../models/comic.interface';
import { ComicService } from '../../services/comic.service';

@Component({
  selector: 'app-comic-library',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './comic-library.component.html',
  styleUrl: './comic-library.component.scss'
})
export class ComicLibraryComponent implements OnInit {
  comics$: Observable<Comic[]>;
  searchQuery = '';
  selectedGenre = '';
  genres: string[] = [];

  constructor(
    private comicService: ComicService,
    private router: Router
  ) {
    this.comics$ = this.comicService.getComics();
  }

  ngOnInit(): void {
    this.comics$.subscribe(comics => {
      this.extractGenres(comics);
    });
  }

  onComicSelect(comic: Comic): void {
    const progress = this.comicService.getReadingProgress(comic.id);
    
    if (progress) {
      // Continuar leyendo desde donde se quedó
      this.router.navigate(['/comic', comic.id, 'chapter', progress.currentChapter, 'page', progress.currentPage]);
    } else {
      // Empezar desde el primer capítulo
      this.router.navigate(['/comic', comic.id, 'chapter', 1, 'page', 1]);
    }
  }

  onSearch(): void {
    if (this.searchQuery.trim()) {
      this.comics$ = this.comicService.searchComics(this.searchQuery);
    } else {
      this.comics$ = this.comicService.getComics();
    }
  }

  onGenreFilter(): void {
    if (this.selectedGenre) {
      this.comics$ = this.comicService.getComicsByGenre(this.selectedGenre);
    } else {
      this.comics$ = this.comicService.getComics();
    }
  }

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

  private extractGenres(comics: Comic[]): void {
    const genreSet = new Set<string>();
    comics.forEach(comic => {
      comic.genres.forEach(genre => genreSet.add(genre));
    });
    this.genres = Array.from(genreSet).sort();
  }
}
