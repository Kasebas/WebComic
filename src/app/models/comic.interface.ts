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
  type: 'choice' | 'clickable' | 'animation' | 'sound' | 'interactive_story' | 'link' | 'page_jump';
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  action?: string;
  data?: any;
  // New properties for enhanced interactivity
  storyId?: string;  // For interactive_story type
  url?: string;      // For link type
  targetPage?: number; // For page_jump type
  title?: string;
  description?: string;
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
  zoomLevel: number;
  fullscreen: boolean;
  autoProgress: boolean;
}

export interface ReadingSettings {
  currentZoom: number;
  isFullscreen: boolean;
  readingDirection: 'ltr' | 'rtl';
  fitMode: 'width' | 'height' | 'original';
}
