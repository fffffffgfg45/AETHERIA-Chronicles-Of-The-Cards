import { Injectable, signal, computed, inject } from '@angular/core';
import { TUTORIAL_CHAPTERS } from '../data/tutorial-database';
import { TutorialChapter, TutorialStep } from '../models/game.model';
import { SoundService } from './sound';
import { GameStateService } from './game-state';

@Injectable({
  providedIn: 'root',
})
export class TutorialService {
  private sound = inject(SoundService);
  private gameState = inject(GameStateService);

  readonly chapters = signal<TutorialChapter[]>(TUTORIAL_CHAPTERS);
  readonly currentChapterIndex = signal<number>(0);
  readonly currentStepIndex = signal<number>(0);
  
  // Visibility signals
  readonly isOverlayOpen = signal<boolean>(false);
  readonly isMiniBubbleVisible = signal<boolean>(false);
  readonly isCompleted = signal<boolean>(false);
  readonly isRewardClaimed = signal<boolean>(false);

  // In-Game Live Tooltip state (for highlighted elements during live matches / deckbuilder)
  readonly activeLiveTip = signal<{
    text: string;
    title: string;
    icon: string;
    position: 'top' | 'bottom' | 'left' | 'right';
  } | null>(null);

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const savedCompleted = localStorage.getItem('aetheria_tutorial_completed');
        if (savedCompleted === 'true') {
          this.isCompleted.set(true);
        }
        const savedClaimed = localStorage.getItem('aetheria_tutorial_claimed');
        if (savedClaimed === 'true') {
          this.isRewardClaimed.set(true);
        }
      } catch (e) {
        console.warn('Could not read tutorial state', e);
      }
    }
  }

  readonly currentChapter = computed<TutorialChapter>(() => {
    const list = this.chapters();
    const idx = Math.max(0, Math.min(list.length - 1, this.currentChapterIndex()));
    return list[idx] || list[0];
  });

  readonly currentStep = computed<TutorialStep>(() => {
    const chapter = this.currentChapter();
    const stepIdx = Math.max(0, Math.min(chapter.steps.length - 1, this.currentStepIndex()));
    return chapter.steps[stepIdx] || chapter.steps[0];
  });

  readonly totalStepsCount = computed<number>(() => {
    return this.chapters().reduce((acc, chap) => acc + chap.steps.length, 0);
  });

  readonly currentGlobalStepNumber = computed<number>(() => {
    let count = 0;
    const chapters = this.chapters();
    const cIdx = this.currentChapterIndex();
    const sIdx = this.currentStepIndex();
    for (let i = 0; i < cIdx; i++) {
      count += chapters[i].steps.length;
    }
    return count + sIdx + 1;
  });

  readonly progressPercentage = computed<number>(() => {
    const total = this.totalStepsCount();
    if (total === 0) return 0;
    return Math.round((this.currentGlobalStepNumber() / total) * 100);
  });

  openTutorial(chapterIndex = 0, stepIndex = 0) {
    this.currentChapterIndex.set(chapterIndex);
    this.currentStepIndex.set(stepIndex);
    this.isOverlayOpen.set(true);
    this.sound.playTutorialChime();
  }

  startCombatTutorial() {
    this.openTutorial(0, 0);
  }

  startDeckbuildingTutorial() {
    this.openTutorial(1, 0);
  }

  nextStep() {
    const chap = this.currentChapter();
    if (this.currentStepIndex() < chap.steps.length - 1) {
      this.currentStepIndex.update(idx => idx + 1);
      this.sound.playPageTurn();
    } else if (this.currentChapterIndex() < this.chapters().length - 1) {
      this.currentChapterIndex.update(c => c + 1);
      this.currentStepIndex.set(0);
      this.sound.playTutorialChime();
    } else {
      // Completed all steps!
      this.completeTutorial();
    }
  }

  prevStep() {
    if (this.currentStepIndex() > 0) {
      this.currentStepIndex.update(idx => idx - 1);
      this.sound.playPageTurn();
    } else if (this.currentChapterIndex() > 0) {
      this.currentChapterIndex.update(c => c - 1);
      const prevChap = this.chapters()[this.currentChapterIndex()];
      this.currentStepIndex.set(prevChap.steps.length - 1);
      this.sound.playPageTurn();
    }
  }

  selectChapter(chapterIndex: number) {
    this.currentChapterIndex.set(chapterIndex);
    this.currentStepIndex.set(0);
    this.sound.playClick();
  }

  selectStep(stepIndex: number) {
    this.currentStepIndex.set(stepIndex);
    this.sound.playClick();
  }

  closeTutorial() {
    this.isOverlayOpen.set(false);
    this.sound.playClick();
  }

  completeTutorial() {
    this.isCompleted.set(true);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('aetheria_tutorial_completed', 'true');
      } catch (e) {
        console.warn(e);
      }
    }
    this.claimReward();
  }

  claimReward() {
    if (this.isRewardClaimed()) return;
    this.isRewardClaimed.set(true);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('aetheria_tutorial_claimed', 'true');
      } catch (e) {
        console.warn(e);
      }
    }

    // Award rewards
    this.gameState.addGold(500);
    this.gameState.addGems(80);
    this.gameState.addShards(50);
    
    // Add title if not present
    if (!this.gameState.titles().includes('Initié d\'Aetheria')) {
      this.gameState.titles.update(titles => ['Initié d\'Aetheria', ...titles]);
      this.gameState.currentTitle.set('Initié d\'Aetheria');
    }

    this.sound.playVictory();
  }

  // Live in-game context tooltip
  showLiveTip(title: string, text: string, icon = 'info', position: 'top' | 'bottom' | 'left' | 'right' = 'top') {
    this.activeLiveTip.set({ title, text, icon, position });
    this.sound.playClick();
  }

  clearLiveTip() {
    this.activeLiveTip.set(null);
  }
}
