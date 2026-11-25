import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, output, signal } from '@angular/core';
import { GameStateService } from '../../services/game-state';
import { BattleEngineService } from '../../services/battle-engine';
import { SoundService } from '../../services/sound';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-ranked-arena-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div class="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      
      <!-- Top Ranked Banner -->
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-[#120f0c] border border-[#3a2f23] rounded-2xl p-6 shadow-2xl relative overflow-visible">
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#1a1612] border-2 border-[#8b6b43] flex items-center justify-center shadow-lg shrink-0">
            <mat-icon class="text-4xl text-[#d4af37]">workspace_premium</mat-icon>
          </div>

          <div>
            <div class="text-[10px] font-cinzel text-[#8b6b43] uppercase tracking-widest">Ligue Compétitive Royale</div>
            <h1 class="font-cinzel-dec text-2xl md:text-3xl font-black text-[#e0dcc7]">
              Division : <span class="text-[#c5a880]">{{ gameState.divisionName() }}</span>
            </h1>
            <div class="flex flex-wrap items-center gap-3 mt-1 text-xs text-[#8b6b43] font-mono tabular-nums">
              <span class="text-[#d4af37] font-bold">{{ gameState.elo() }} Elo</span>
              <span>•</span>
              <span class="text-emerald-400 font-semibold">{{ gameState.winRate() }}% Taux</span>
              <span>•</span>
              <span class="text-[#e0dcc7] inline-flex items-center gap-1">
                <span>Série : {{ gameState.playerStats().currentWinStreak }}</span>
                <mat-icon class="text-sm text-amber-400">local_fire_department</mat-icon>
              </span>
            </div>
          </div>
        </div>

        <!-- Compteur Visuel de Victoires + Bouton Duel Classé -->
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <!-- Compteur Visuel de Victoires dans l'En-Tête -->
          <div
            class="relative px-5 py-3 rounded-2xl border-2 border-[#8b6b43]/80 bg-gradient-to-br from-[#1f1810] via-[#14100b] to-[#1a140d] shadow-xl flex items-center gap-3.5 overflow-visible transition-all duration-300"
            [class.victory-counter-gold-gain]="victoryGainActive()">

            <!-- Shimmer & Ring Effects on Golden Gain -->
            @if (victoryGainActive()) {
              <div class="victory-gold-ring"></div>
              <div class="overflow-hidden absolute inset-0 rounded-2xl pointer-events-none">
                <div class="victory-gain-shimmer"></div>
              </div>

              <!-- Golden Rising Sparkles -->
              <span class="victory-gold-spark" style="left: 18%; bottom: 20%; --vx: -18px; --vy: -42px;"></span>
              <span class="victory-gold-spark" style="left: 48%; bottom: 18%; --vx: 8px; --vy: -52px; animation-delay: 0.12s;"></span>
              <span class="victory-gold-spark" style="left: 78%; bottom: 24%; --vx: 22px; --vy: -46px; animation-delay: 0.22s;"></span>
              <span class="victory-gold-spark" style="left: 34%; bottom: 30%; --vx: -8px; --vy: -38px; animation-delay: 0.34s;"></span>

              <!-- Floating +1 Victoire Golden Badge -->
              <div class="victory-gain-badge absolute -top-4 right-3 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#fef08a] via-[#fbbf24] to-[#f59e0b] text-[#1a1106] font-cinzel font-black text-[11px] tracking-wider shadow-[0_0_20px_rgba(251,191,36,0.9)] border border-[#fef9c3] flex items-center gap-1 whitespace-nowrap z-20">
                <mat-icon class="text-xs">auto_awesome</mat-icon>
                <span>+1 VICTOIRE !</span>
              </div>
            }

            <!-- Trophy Crest -->
            <div
              class="w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 transition-transform duration-300"
              [class.bg-[#3a280a]]="victoryGainActive()"
              [class.border-[#fde047]]="victoryGainActive()"
              [class.scale-110]="victoryGainActive()"
              [class.bg-[#120f0c]]="!victoryGainActive()"
              [class.border-[#d4af37]/60]="!victoryGainActive()">
              <mat-icon
                class="text-2xl transition-colors"
                [class.text-[#fef08a]]="victoryGainActive()"
                [class.text-[#d4af37]]="!victoryGainActive()">
                emoji_events
              </mat-icon>
            </div>

            <!-- Victory Numerals & Ranked Breakdown -->
            <div class="min-w-0">
              <div class="text-[10px] font-cinzel font-bold uppercase tracking-widest text-[#c5a880] flex items-center gap-1.5">
                <span>Compteur de Victoires</span>
              </div>
              <div class="flex items-baseline gap-2.5">
                <span
                  class="font-cinzel-dec text-2xl sm:text-3xl font-black tabular-nums transition-colors"
                  [class.text-[#fef08a]]="victoryGainActive()"
                  [class.text-[#ffd700]]="!victoryGainActive()">
                  {{ gameState.playerStats().wins }}
                </span>
                <span class="text-[11px] font-mono font-bold text-[#8b6b43] tabular-nums">
                  ({{ gameState.playerStats().rankedWins || 0 }} Classées)
                </span>
              </div>
            </div>
          </div>

          <!-- Launch Ranked Matchmaking Button -->
          <button
            type="button"
            (click)="startRankedDuel()"
            class="crimson-btn px-7 py-4 text-white font-cinzel font-bold text-sm md:text-base rounded-2xl border border-[#ff4d4d] shadow-xl flex items-center justify-center gap-3 whitespace-nowrap cursor-pointer">
            <mat-icon class="text-2xl text-white">swords</mat-icon>
            <span>LANCER UN DUEL CLASSÉ</span>
          </button>
        </div>
      </div>

      <!-- Rank Tier Hierarchy Bar -->
      <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        @let tiers = [
          { name: 'Bronze', elo: '<1200', color: 'text-[#8b6b43]', icon: 'shield' },
          { name: 'Argent', elo: '1200+', color: 'text-slate-300', icon: 'shield' },
          { name: 'Or', elo: '1400+', color: 'text-[#d4af37]', icon: 'military_tech' },
          { name: 'Platine', elo: '1600+', color: 'text-teal-300', icon: 'military_tech' },
          { name: 'Diamant', elo: '1800+', color: 'text-[#4d94ff]', icon: 'diamond' },
          { name: 'Maître', elo: '2000+', color: 'text-purple-400', icon: 'auto_awesome' },
          { name: 'Grand Maître', elo: '2200+', color: 'text-[#ff4d4d]', icon: 'flare' },
          { name: 'Légende', elo: '2400+', color: 'text-[#d4af37]', icon: 'workspace_premium' }
        ];

        @for (t of tiers; track t.name) {
          <div
            class="p-2.5 rounded-xl border text-center transition-all"
            [class.bg-[#1a1612]]="gameState.divisionName().includes(t.name)"
            [class.border-[#d4af37]]="gameState.divisionName().includes(t.name)"
            [class.bg-[#0d0b09]]="!gameState.divisionName().includes(t.name)"
            [class.border-[#3a2f23]]="!gameState.divisionName().includes(t.name)">
            <mat-icon class="text-xl" [class]="t.color">{{ t.icon }}</mat-icon>
            <div class="font-cinzel text-xs font-bold text-[#e0dcc7]">{{ t.name }}</div>
            <div class="text-[10px] text-[#6b5a45] font-mono">{{ t.elo }}</div>
          </div>
        }
      </div>

      <!-- Global Real-Time Leaderboard Table -->
      <div class="bg-[#120f0c] border border-[#3a2f23] rounded-2xl p-6 shadow-xl space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-[#3a2f23]">
          <div>
            <h3 class="font-cinzel text-xl font-bold text-[#c5a880] flex items-center gap-2">
              <mat-icon class="text-[#d4af37]">leaderboard</mat-icon>
              Classement Mondial en Direct
            </h3>
            <p class="text-xs text-[#8b6b43]">Les plus grands stratèges et champions d'Aetheria.</p>
          </div>
          
          <div class="flex items-center gap-1 text-xs text-emerald-400 font-mono">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            Synchronisé en direct
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-[#1a1612] text-[#8b6b43] font-cinzel uppercase border-b border-[#3a2f23]">
              <tr>
                <th class="p-3">Rang</th>
                <th class="p-3">Champion</th>
                <th class="p-3">Guilde</th>
                <th class="p-3">Division</th>
                <th class="p-3">Elo</th>
                <th class="p-3">Bilan (V/D)</th>
                <th class="p-3">Statut</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#3a2f23]/60">
              @for (p of gameState.leaderboard(); track p.rank) {
                <tr
                  class="hover:bg-[#1a1612]/60 transition-colors"
                  [class.bg-[#1a1612]]="p.username === gameState.username()">
                  
                  <td class="p-3 font-mono font-bold text-sm">
                    @if (p.rank === 1) {
                      <span class="text-[#d4af37] inline-flex items-center gap-1.5 font-black">
                        <img
                          src="/src/assets/images/trophy_rank_gold_1795189809836.jpg"
                          alt="Trophée Or #1"
                          class="w-6 h-6 rounded-lg object-cover border border-[#d4af37]/80 shadow"
                          referrerpolicy="no-referrer" />
                        <span>#1</span>
                      </span>
                    } @else if (p.rank === 2) {
                      <span class="text-slate-300 inline-flex items-center gap-1.5 font-black">
                        <img
                          src="/src/assets/images/trophy_rank_silver_1795189810920.jpg"
                          alt="Trophée Argent #2"
                          class="w-6 h-6 rounded-lg object-cover border border-slate-300/70 shadow"
                          referrerpolicy="no-referrer" />
                        <span>#2</span>
                      </span>
                    } @else if (p.rank === 3) {
                      <span class="text-[#c5a880] inline-flex items-center gap-1.5 font-black">
                        <img
                          src="/src/assets/images/trophy_rank_bronze_1795189810328.jpg"
                          alt="Trophée Bronze #3"
                          class="w-6 h-6 rounded-lg object-cover border border-[#c5a880]/70 shadow"
                          referrerpolicy="no-referrer" />
                        <span>#3</span>
                      </span>
                    } @else {
                      <span class="text-[#8b6b43]">#{{ p.rank }}</span>
                    }
                  </td>

                  <td class="p-3">
                    <div class="flex items-center gap-2.5">
                      <div class="w-8 h-8 rounded-lg bg-[#0d0b09] border border-[#3a2f23] flex items-center justify-center" [style.borderColor]="p.frameColor">
                        <mat-icon class="text-base text-[#c5a880]">{{ p.avatarIcon }}</mat-icon>
                      </div>
                      <div>
                        <div class="font-cinzel font-bold text-[#e0dcc7]">{{ p.username }}</div>
                        <div class="text-[10px] text-[#6b5a45]">{{ p.title }}</div>
                      </div>
                    </div>
                  </td>

                  <td class="p-3 font-mono text-[#d4af37] font-semibold">{{ p.guildTag }}</td>

                  <td class="p-3 font-cinzel font-semibold text-[#e0dcc7]">{{ p.tierName }}</td>

                  <td class="p-3 font-mono font-bold text-[#d4af37] text-sm">{{ p.elo }}</td>

                  <td class="p-3 font-mono text-[#e0dcc7]">
                    <span class="text-emerald-400">{{ p.wins }}V</span> / <span class="text-[#ff4d4d]">{{ p.losses }}D</span>
                  </td>

                  <td class="p-3">
                    @if (p.isOnline) {
                      <span class="px-2 py-0.5 rounded-full bg-[#0d2618] border border-emerald-500/40 text-emerald-400 font-mono text-[10px]">
                        En ligne
                      </span>
                    } @else {
                      <span class="text-[10px] text-[#6b5a45] font-mono">Hors ligne</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

      </div>

    </div>
  `,
})
export class RankedArenaView {
  readonly gameState = inject(GameStateService);
  readonly battleEngine = inject(BattleEngineService);
  readonly sound = inject(SoundService);
  private readonly destroyRef = inject(DestroyRef);

  readonly duelStarted = output<void>();
  readonly victoryGainActive = signal<boolean>(false);

  private celebrateTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      if (this.gameState.pendingRankedVictoryCelebration()) {
        this.triggerGoldenVictoryAnimation();
        this.gameState.consumeRankedVictoryCelebration();
      }
    });

    this.destroyRef.onDestroy(() => {
      if (this.celebrateTimer) {
        clearTimeout(this.celebrateTimer);
        this.celebrateTimer = null;
      }
    });
  }

  private triggerGoldenVictoryAnimation() {
    if (this.celebrateTimer) {
      clearTimeout(this.celebrateTimer);
    }
    this.victoryGainActive.set(true);
    this.sound.playCoins();
    this.celebrateTimer = setTimeout(() => {
      this.victoryGainActive.set(false);
      this.celebrateTimer = null;
    }, 2800);
  }

  startRankedDuel() {
    this.battleEngine.startMatchmaking('ranked');
    this.duelStarted.emit();
  }
}
