import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { InteractiveStoryService, InteractiveStoryState, Choice } from '../../services/interactive-story.service';

@Component({
    selector: 'app-interactive-story',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './interactive-story.component.html',
    styleUrls: ['./interactive-story.component.scss']
})
export class InteractiveStoryComponent implements OnInit, OnDestroy {
    @Input() storyId: string = '';
    @Input() storyPath?: string;

    private destroy$ = new Subject<void>();

    // Component state
    isLoading = true;
    error: string | null = null;
    storyState: InteractiveStoryState | null = null;
    storyHistory: string[] = [];

    constructor(private interactiveStoryService: InteractiveStoryService) { }

    ngOnInit(): void {
        // Subscribe to story state changes
        this.interactiveStoryService.storyState$
            .pipe(takeUntil(this.destroy$))
            .subscribe(state => {
                this.storyState = state;
                if (state && state.currentText) {
                    // Add new text to history if it's not already there
                    if (!this.storyHistory.includes(state.currentText)) {
                        this.storyHistory.push(state.currentText);
                    }
                }
            });

        // Initialize the story
        this.initializeStory();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    async initializeStory(): Promise<void> {
        if (!this.storyId) {
            this.error = 'Story ID is required';
            this.isLoading = false;
            return;
        }

        this.isLoading = true;
        this.error = null;

        try {
            if (this.storyPath) {
                // Load story from path
                await this.interactiveStoryService.initializeStory(this.storyId, this.storyPath);
            } else {
                // Use demo story for testing
                await this.initializeDemoStory();
            }
        } catch (error) {
            console.error('Error initializing story:', error);
            this.error = 'Failed to load interactive story';
        } finally {
            this.isLoading = false;
        }
    }

    async initializeDemoStory(): Promise<void> {
        // Use the new demo story initialization from the service
        try {
            await this.interactiveStoryService.initializeDemoStory(this.storyId);
        } catch (error) {
            console.error('Error initializing demo story:', error);
            throw error;
        }
    }

    onChoiceSelected(choice: Choice): void {
        if (!this.storyState) return;

        // Add the choice to history
        this.storyHistory.push(`> ${choice.text}`);

        // Use the service to progress the story
        this.interactiveStoryService.makeChoice(choice.index);
    }

    continueStory(): void {
        this.interactiveStoryService.continueStory();
    }

    restartStory(): void {
        this.storyHistory = [];
        this.interactiveStoryService.resetStory(this.storyId);
        this.initializeStory();
    }

    saveProgress(): void {
        this.interactiveStoryService.saveProgress(this.storyId);
    }

    getFormattedText(text: string): string {
        // Basic text formatting - in a real app you might want markdown support
        return text.replace(/\n/g, '<br>');
    }

    hasChoices(): boolean {
        return this.storyState ? this.storyState.choices.length > 0 : false;
    }

    canContinue(): boolean {
        return this.storyState ? this.storyState.canContinue : false;
    }

    isComplete(): boolean {
        return this.storyState ? this.storyState.isComplete : false;
    }

    getStoryProgress(): number {
        // Simple progress calculation based on history length
        // In a real app, you'd have more sophisticated progress tracking
        return Math.min(100, this.storyHistory.length * 10);
    }
}
