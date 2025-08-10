export interface Comic {
  id: string;
  title: string;
  author: string;
  description: string;
  coverImage: string;
  genres: string[];
  status: 'ongoing' | 'completed' | 'hiatus';
  rating: number;
  totalChapters: number;
  lastUpdated: Date;
  chapters: Chapter[];
}

export interface Chapter {
  id: string;
  comicId: string;
  chapterNumber: number;
  title: string;
  description?: string;
  pages: Page[];
  publishDate: Date;
  isInteractive?: boolean;
}

export interface Page {
  id: string;
  chapterId: string;
  pageNumber: number;
  imageUrl: string;
  altText?: string;
  interactiveElements?: InteractiveElement[];
}

export interface InteractiveElement {
  id: string;
  type: 'choice' | 'clickable' | 'animation' | 'sound';
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  action: string;
  data?: any;
}

export interface ReadingProgress {
  comicId: string;
  currentChapter: number;
  currentPage: number;
  lastReadDate: Date;
  isCompleted: boolean;
}

export interface UserPreferences {
  readingMode: 'single' | 'double' | 'scroll';
  autoplay: boolean;
  animationSpeed: number;
  fontSize: number;
  theme: 'light' | 'dark';
}
