import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { TutorialService } from '../../services/tutorial';
import { GameStateService } from '../../services/game-state';
import { BattleEngineService } from '../../services/battle-engine';
import { SoundService } from '../../services/sound';
import { MatIconModule } from '@angular/material/icon';
import { NavView } from '../../app';

@Component({
  selector: 'app-tutorial-overlay',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    @let step = tutorial.currentStep();
    @let chapter = tutorial.currentChapter();
    @let isLastStep = tutorial.currentGlobalStepNumber() === tutorial.totalStepsCount();

    <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-modal-pop">
      
      <!-- Modal Card Container with Golden Antique Filigree -->
      <div class="relative w-full max-w-4xl bg-[#120f0c] border-2 border-[#8b6b43] rounded-3xl p-5 sm:p-8 shadow-[0_0_60px_rgba(0,0,0,0.9),0_0_30px_rgba(212,175,55,0.15)] flex flex-col justify-between max-h-[92vh] overflow-y-auto">
        
        <!-- Ambient Decorative Corners -->
        <div class="absolute -top-3 -left-3 w-8 h-8 border-t-2 border-l-2 border-[#d4af37] rounded-tl-xl pointer-events-none"></div>
        <div class="absolute -top-3 -right-3 w-8 h-8 border-t-2 border-r-2 border-[#d4af37] rounded-tr-xl pointer-events-none"></div>
        <div class="absolute -bottom-3 -left-3 w-8 h-8 border-b-2 border-l-2 border-[#d4af37] rounded-bl-xl pointer-events-none"></div>
        <div class="absolute -bottom-3 -right-3 w-8 h-8 border-b-2 border-r-2 border-[#d4af37] rounded-br-xl pointer-events-none"></div>

        <!-- Header: Chapters Navigation & Close Button -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#3a2f23] pb-4 mb-4">
          
          <!-- Chapter Selector Tabs -->
          <div class="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            @for (chap of tutorial.chapters(); track chap.id; let idx = $index) {
              <button
                (click)="tutorial.selectChapter(idx)"
                class="medieval-btn px-3 py-1.5 rounded-xl border text-xs font-cinzel font-bold flex items-center gap-1.5 whitespace-nowrap transition-all"
                [class.bg-[#8b2b2b]_text-white_border-[#ff4d4d]_shadow-[0_0_15px_rgba(139,43,43,0.35)]]="tutorial.currentChapterIndex() === idx"
                [class.bg-[#1a1612]_text-[#8b6b43]_border-[#3a2f23]_hover:text-[#c5a880]]="tutorial.currentChapterIndex() !== idx">
                <mat-icon class="text-sm" [class.text-[#d4af37]]="tutorial.currentChapterIndex() === idx">{{ chap.icon }}</mat-icon>
                <span>Chapitre {{ chap.number }}</span>
              </button>
            }
          </div>

          <!-- Progress and Close -->
          <div class="flex items-center justify-between sm:justify-end gap-3">
            <div class="text-right">
              <span class="text-[11px] font-mono text-[#c5a880] font-bold">
                Étape {{ tutorial.currentGlobalStepNumber() }} / {{ tutorial.totalStepsCount() }}
              </span>
              <div class="w-24 sm:w-32 h-1.5 bg-[#1a1612] rounded-full overflow-hidden border border-[#3a2f23] mt-0.5">
                <div
                  class="h-full bg-gradient-to-r from-[#c5a880] to-[#d4af37] transition-all duration-300 rounded-full"
                  [style.width.%]="tutorial.progressPercentage()"></div>
              </div>
            </div>

            <button
              (click)="tutorial.closeTutorial()"
              class="medieval-btn p-1.5 bg-[#1a1612] hover:bg-[#251f18] text-[#8b6b43] hover:text-[#c5a880] rounded-xl border border-[#3a2f23]"
              title="Fermer le guide">
              <mat-icon class="text-lg">close</mat-icon>
            </button>
          </div>
        </div>

        <!-- Main Body: Speaker Portrait + Interactive Speech Bubble -->
        <div class="grid grid-cols-1 md:grid-cols-12 gap-6 items-center my-auto py-2">
          
          <!-- Speaker Column (Archimage Oakhaven) -->
          <div class="md:col-span-4 flex flex-col items-center text-center">
            
            <!-- Mentor Portrait with Animated Glowing Ring -->
            <div class="relative mb-3 group">
              <div class="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-[#1a1612] border-2 border-[#d4af37] p-1 shadow-[0_0_25px_rgba(212,175,55,0.25)] flex items-center justify-center relative overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-t from-[#8b2b2b]/30 to-transparent pointer-events-none"></div>
                <mat-icon class="text-6xl sm:text-7xl text-[#d4af37] animate-pulse">auto_stories</mat-icon>
                
                <!-- Floating Academy Crest Badge -->
                <div class="absolute bottom-1 right-1 w-7 h-7 bg-[#120f0c] border border-[#d4af37] rounded-full flex items-center justify-center text-xs text-[#d4af37] shadow">
                  ✦
                </div>
              </div>
              
              <!-- Shimmer light sweep -->
              <div class="absolute -top-1 -right-1 w-3 h-3 bg-[#d4af37] rounded-full animate-ping"></div>
            </div>

            <h3 class="font-cinzel text-base sm:text-lg font-bold text-[#c5a880]">
              {{ step.speakerName }}
            </h3>
            <p class="text-[11px] font-mono text-[#8b6b43] tracking-wide uppercase">
              {{ step.speakerTitle }}
            </p>

            <!-- Chapter Context Pill -->
            <div class="mt-3 px-3 py-1 bg-[#1a1612] border border-[#3a2f23] rounded-full text-[11px] font-cinzel text-[#d4af37] flex items-center gap-1">
              <mat-icon class="text-xs">{{ chapter.icon }}</mat-icon>
              <span>{{ chapter.title }}</span>
            </div>
          </div>

          <!-- Speech Bubble Content Column -->
          <div class="md:col-span-8 flex flex-col space-y-4">
            
            <!-- Speech Bubble Card -->
            <div class="relative bg-[#1a1612] border border-[#8b6b43]/50 rounded-2xl p-4 sm:p-6 shadow-inner">
              
              <!-- Triangular Speech Pointer (visible on desktop) -->
              <div class="hidden md:block absolute top-8 -left-3 w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-r-[12px] border-r-[#8b6b43]/50"></div>
              <div class="hidden md:block absolute top-8 -left-2.5 w-0 h-0 border-t-[9px] border-t-transparent border-b-[9px] border-b-transparent border-r-[11px] border-r-[#1a1612]"></div>

              <!-- Step Title -->
              <div class="flex items-center gap-2 mb-3">
                <span class="w-6 h-6 rounded-full bg-[#8b2b2b] text-white font-mono text-xs font-bold flex items-center justify-center shadow">
                  {{ tutorial.currentStepIndex() + 1 }}
                </span>
                <h2 class="font-cinzel text-lg sm:text-xl font-bold text-[#e0dcc7]">
                  {{ step.title }}
                </h2>
              </div>

              <!-- Main Dialogue / Explanation with animated entrance -->
              <p class="text-[#e0dcc7] font-body text-sm sm:text-base leading-relaxed whitespace-pre-line border-b border-[#3a2f23] pb-3 mb-3">
                « {{ step.dialogue }} »
              </p>

              <!-- Tactical Tip Box with glowing gold border -->
              <div class="bg-[#120f0c] border border-[#d4af37]/40 rounded-xl p-3 sm:p-3.5 flex items-start gap-2.5 shadow">
                <mat-icon class="text-[#d4af37] text-lg sm:text-xl shrink-0 mt-0.5 animate-bounce">tips_and_updates</mat-icon>
                <div class="text-xs">
                  <span class="font-cinzel font-bold text-[#d4af37] block mb-0.5">Conseil Stratégique :</span>
                  <span class="text-[#c5a880]">{{ step.practicalTip }}</span>
                </div>
              </div>

              <!-- Key Concepts Badges -->
              @if (step.keyConcepts && step.keyConcepts.length > 0) {
                <div class="flex flex-wrap items-center gap-1.5 mt-3 pt-2">
                  <span class="text-[10px] font-mono text-[#8b6b43] uppercase tracking-wider mr-1">Retenez :</span>
                  @for (concept of step.keyConcepts; track concept) {
                    <span class="px-2 py-0.5 bg-[#251f18] border border-[#3a2f23] rounded-md text-[11px] font-cinzel text-[#e0dcc7] font-medium flex items-center gap-1">
                      <span class="text-[#d4af37] text-[9px]">✦</span>
                      {{ concept }}
                    </span>
                  }
                </div>
              }

            </div>

          </div>

        </div>

        <!-- Footer: Action Navigation Bar -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#3a2f23] pt-4 mt-4">
          
          <!-- Previous button & jump dots -->
          <div class="flex items-center gap-2">
            <button
              (click)="tutorial.prevStep()"
              [disabled]="tutorial.currentGlobalStepNumber() === 1"
              class="medieval-btn px-4 py-2 bg-[#1a1612] hover:bg-[#251f18] disabled:opacity-40 disabled:pointer-events-none text-[#c5a880] rounded-xl border border-[#3a2f23] font-cinzel text-xs font-bold flex items-center gap-1">
              <mat-icon class="text-sm">arrow_back</mat-icon>
              <span>Précédent</span>
            </button>

            <!-- Step Dots for current chapter -->
            <div class="hidden sm:flex items-center gap-1 px-2">
              @for (st of chapter.steps; track st.id; let sIdx = $index) {
                <button
                  (click)="tutorial.selectStep(sIdx)"
                  class="w-2.5 h-2.5 rounded-full transition-all"
                  [class.bg-[#d4af37]_w-5]="tutorial.currentStepIndex() === sIdx"
                  [class.bg-[#3a2f23]_hover:bg-[#8b6b43]]="tutorial.currentStepIndex() !== sIdx"
                  [title]="st.title"></button>
              }
            </div>
          </div>

          <!-- Right Action Buttons -->
          <div class="flex flex-wrap items-center gap-2.5 justify-end">
            
            <!-- Quick View Switchers during specific chapters -->
            @if (step.topic === 'deckbuilding') {
              <button
                (click)="goToView('deckbuilder')"
                class="medieval-btn px-3.5 py-2 bg-[#1a1612] hover:bg-[#251f18] text-[#c5a880] rounded-xl border border-[#8b6b43] font-cinzel text-xs font-bold flex items-center gap-1.5">
                <mat-icon class="text-sm text-[#d4af37]">menu_book</mat-icon>
                <span>Ouvrir le Grimoire</span>
              </button>
            }

            @if (!isLastStep) {
              <button
                (click)="tutorial.nextStep()"
                class="crimson-btn px-6 py-2.5 rounded-xl font-cinzel text-xs font-bold flex items-center gap-2 shadow-lg">
                <span>{{ step.highlightActionLabel || 'Étape Suivante' }}</span>
                <mat-icon class="text-sm">arrow_forward</mat-icon>
              </button>
            } @else {
              <!-- Final Step: Claim Reward & Launch Training Battle -->
              <button
                (click)="finishAndLaunchTraining()"
                class="crimson-btn px-6 py-2.5 rounded-xl font-cinzel text-xs font-black tracking-wide flex items-center gap-2 shadow-[0_0_25px_rgba(255,77,77,0.5)] animate-pulse">
                <mat-icon class="text-sm text-[#d4af37]">military_tech</mat-icon>
                <span>Réclamer les 500 Or & Lancer le Duel d'Initiation !</span>
              </button>
            }

          </div>

        </div>

      </div>

    </div>
  `,
})
export class TutorialOverlay {
  readonly tutorial = inject(TutorialService);
  readonly gameState = inject(GameStateService);
  readonly battleEngine = inject(BattleEngineService);
  readonly sound = inject(SoundService);

  readonly navigateView = output<NavView>();

  goToView(view: NavView) {
    this.navigateView.emit(view);
    this.tutorial.closeTutorial();
  }

  finishAndLaunchTraining() {
    this.tutorial.completeTutorial();
    this.tutorial.closeTutorial();
    this.navigateView.emit('arena');
    this.battleEngine.startMatchmaking('ai_training');
  }
}
