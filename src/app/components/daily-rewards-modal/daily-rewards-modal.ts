import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { GameStateService } from '../../services/game-state';
import { SoundService } from '../../services/sound';
import { MatIconModule } from '@angular/material/icon';
import confetti from 'canvas-confetti';

@Component({
  selector: 'app-daily-rewards-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div class="bg-[#1b140e] border-2 border-amber-500/60 rounded-2xl max-w-2xl w-full p-6 shadow-2xl text-stone-200 space-y-6">
        
        <!-- Header -->
        <div class="flex items-center justify-between pb-3 border-b border-stone-800">
          <div>
            <h2 class="font-cinzel text-2xl font-black text-amber-300 flex items-center gap-2">
              <mat-icon class="text-amber-400">calendar_month</mat-icon>
              Calendrier de Fidélité & Roue Royale
            </h2>
            <p class="text-stone-400 text-xs mt-0.5">Connectez-vous chaque jour pour amasser des richesses d'Aetheria.</p>
          </div>
          <button (click)="modalClose.emit()" class="text-stone-400 hover:text-stone-100">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <!-- 7-Day Streak Calendar Grid -->
        <div>
          <div class="flex justify-between items-center text-xs font-cinzel text-stone-300 font-bold mb-3">
            <span>Série de Connexion : Jour {{ gameState.dailyStreak() }} / 7</span>
            <span class="text-amber-400 font-mono">Réinitialisation à minuit</span>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
            @for (day of gameState.dailyCalendar; track day.day) {
              @let isCurrent = day.day === gameState.dailyStreak();
              @let isPast = day.day < gameState.dailyStreak();

              <div
                class="medieval-btn p-3 rounded-xl border flex flex-col items-center justify-between text-center min-h-[110px]"
                [class.bg-amber-950/60_border-amber-400_shadow-md]="isCurrent"
                [class.bg-stone-950/70_border-stone-800]="!isCurrent"
                [class.opacity-60]="isPast">
                
                <div class="text-[10px] font-cinzel font-bold text-stone-400">Jour {{ day.day }}</div>
                
                <div class="my-1">
                  <mat-icon class="text-2xl" [class.text-amber-400]="isCurrent || isPast" [class.text-stone-500]="!isCurrent && !isPast">
                    {{ day.icon }}
                  </mat-icon>
                </div>

                <div class="text-[10px] font-cinzel font-bold text-amber-200 line-clamp-2">{{ day.reward }}</div>

                <div class="mt-1">
                  @if (isPast || (isCurrent && gameState.hasClaimedDailyToday())) {
                    <span class="text-[9px] text-emerald-400 font-semibold flex items-center justify-center gap-0.5">
                      <mat-icon class="text-[10px]">check</mat-icon> Reçu
                    </span>
                  } @else if (isCurrent && !gameState.hasClaimedDailyToday()) {
                    <button
                      (click)="claimDaily()"
                      class="medieval-btn px-2 py-0.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-cinzel font-black text-[9px] rounded">
                      Réclamer
                    </button>
                  } @else {
                    <span class="text-[9px] text-stone-600">Verrouillé</span>
                  }
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Wheel of Fortune Mini Game Section -->
        <div class="bg-stone-950/80 border border-stone-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl bg-amber-900/50 border border-amber-400 flex items-center justify-center text-amber-300" [class.animate-spin]="isSpinning()">
              <mat-icon class="text-2xl">casino</mat-icon>
            </div>
            <div>
              <h3 class="font-cinzel font-bold text-sm text-amber-300">Roue de la Fortune d'Aether</h3>
              <p class="text-[11px] text-stone-400">1 tour gratuit disponible chaque jour !</p>
            </div>
          </div>

          <button
            (click)="spinWheel()"
            [disabled]="isSpinning() || hasSpunWheel()"
            class="medieval-btn px-6 py-2.5 rounded-xl font-cinzel font-bold text-xs border transition-all flex items-center gap-2"
            [class.bg-amber-500_hover:bg-amber-400_text-stone-950_border-amber-300]="!hasSpunWheel() && !isSpinning()"
            [class.bg-stone-800_text-stone-500_border-stone-700_opacity-50]="hasSpunWheel() || isSpinning()">
            <mat-icon class="text-sm">rotate_right</mat-icon>
            {{ isSpinning() ? 'Tirage en cours...' : hasSpunWheel() ? 'Tour Effectué' : 'Lancer la Roue' }}
          </button>
        </div>

      </div>
    </div>
  `,
})
export class DailyRewardsModal {
  readonly gameState = inject(GameStateService);
  readonly sound = inject(SoundService);
  readonly modalClose = output<void>();

  readonly isSpinning = signal<boolean>(false);
  readonly hasSpunWheel = signal<boolean>(false);

  claimDaily() {
    this.gameState.claimDailyReward();
    try {
      confetti({ particleCount: 80, spread: 50 });
    } catch {
      // Ignored in non-browser context
    }
  }

  spinWheel() {
    if (this.hasSpunWheel() || this.isSpinning()) return;
    this.isSpinning.set(true);
    this.sound.playCardDraw();

    setTimeout(() => {
      this.isSpinning.set(false);
      this.hasSpunWheel.set(true);
      const prizes = [
        { name: '400 Pièces d\'Or', gold: 400, gems: 0 },
        { name: '50 Gemmes d\'Aether', gold: 0, gems: 50 },
        { name: '30 Éclats de Forge', gold: 0, gems: 0, shards: 30 },
        { name: 'Grand Trésor : 1000 Or & 100 Gemmes', gold: 1000, gems: 100 },
      ];
      const win = prizes[Math.floor(Math.random() * prizes.length)];
      if (win.gold) this.gameState.addGold(win.gold);
      if (win.gems) this.gameState.addGems(win.gems);
      if (win.shards) this.gameState.addShards(win.shards);

      this.sound.playVictory();
      try {
        confetti({ particleCount: 100, spread: 60 });
      } catch {
        // Ignored in non-browser context
      }
      alert(`Félicitations ! La Roue s'arrête sur : ${win.name} !`);
    }, 2000);
  }
}
