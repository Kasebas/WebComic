import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ReadingSettings, UserPreferences } from '../models/comic.interface';

@Injectable({
    providedIn: 'root'
})
export class ReadingSettingsService {
    private readonly STORAGE_KEY = 'webcomic-preferences';

    private defaultPreferences: UserPreferences = {
        readingMode: 'single',
        autoplay: false,
        animationSpeed: 300,
        fontSize: 16,
        theme: 'light',
        zoomLevel: 100,
        fullscreen: false,
        autoProgress: false
    };

    private defaultReadingSettings: ReadingSettings = {
        currentZoom: 100,
        isFullscreen: false,
        readingDirection: 'ltr',
        fitMode: 'width'
    };

    private preferencesSubject = new BehaviorSubject<UserPreferences>(this.defaultPreferences);
    private readingSettingsSubject = new BehaviorSubject<ReadingSettings>(this.defaultReadingSettings);

    public preferences$ = this.preferencesSubject.asObservable();
    public readingSettings$ = this.readingSettingsSubject.asObservable();

    constructor() {
        this.loadPreferences();
    }

    getPreferences(): UserPreferences {
        return this.preferencesSubject.value;
    }

    getReadingSettings(): ReadingSettings {
        return this.readingSettingsSubject.value;
    }

    updatePreferences(preferences: Partial<UserPreferences>): void {
        const current = this.preferencesSubject.value;
        const updated = { ...current, ...preferences };
        this.preferencesSubject.next(updated);
        this.savePreferences(updated);
    }

    updateReadingSettings(settings: Partial<ReadingSettings>): void {
        const current = this.readingSettingsSubject.value;
        const updated = { ...current, ...settings };
        this.readingSettingsSubject.next(updated);
    }

    toggleFullscreen(): void {
        const current = this.readingSettingsSubject.value;
        this.updateReadingSettings({ isFullscreen: !current.isFullscreen });
    }

    setZoom(zoomLevel: number): void {
        this.updateReadingSettings({ currentZoom: Math.max(25, Math.min(400, zoomLevel)) });
    }

    zoomIn(): void {
        const current = this.readingSettingsSubject.value;
        this.setZoom(current.currentZoom + 25);
    }

    zoomOut(): void {
        const current = this.readingSettingsSubject.value;
        this.setZoom(current.currentZoom - 25);
    }

    resetZoom(): void {
        this.setZoom(100);
    }

    setFitMode(mode: 'width' | 'height' | 'original'): void {
        this.updateReadingSettings({ fitMode: mode });
    }

    private loadPreferences(): void {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                const preferences = JSON.parse(stored);
                this.preferencesSubject.next({ ...this.defaultPreferences, ...preferences });
            }
        } catch (error) {
            console.warn('Error loading preferences:', error);
        }
    }

    private savePreferences(preferences: UserPreferences): void {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(preferences));
        } catch (error) {
            console.warn('Error saving preferences:', error);
        }
    }
}
