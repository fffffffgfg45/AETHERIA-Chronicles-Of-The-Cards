import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DailyMissionsService } from '../../services/daily-missions';
import { GameStateService } from '../../services/game-state';
import { SoundService } from '../../services/sound';
import { DailyTacticalMission } from '../../models/game.model';

@Component({
  selector: 'app-daily-missions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="w-full max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      <!-- Top Tactical Briefing Banner -->
      <div class="relative overflow-hidden bg-[#120f0c] border border-[#3a2f23] rounded-2xl p-5 md:p-7 shadow-2xl">
        <!-- Ambient decorative background glow -->
        <div class="absolute -top-24 -right-24 w-72 h-72 bg-[#d4af37]/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -bottom-24 -left-24 w-72 h-72 bg-[#8b2b2b]/15 rounded-full blur-3xl pointer-events-none"></div>

        <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5 border-b border-[#3a2f23]/80 pb-6">
          <div class="space-y-1.5">
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/40 text-[#d4af37] text-[10px] font-mono uppercase tracking-widest flex items-center gap-1">
                <mat-icon class="text-xs">military_tech</mat-icon>
                Ordres Stratégiques Quotidiens
              </span>
              <span class="text-[11px] font-mono text-[#8b6b43]">
                Cycle : {{ missionsService.getTodayKey() }}
              </span>
            </div>

            <h2 class="font-cinzel text-2xl md:text-3xl font-black text-[#e0dcc7] tracking-wide flex items-center gap-2.5">
              <span class="text-[#d4af37]">Missions Tactiques</span> du Jour
            </h2>

            <p class="text-xs text-[#a39783] max-w-2xl leading-relaxed">
              Trois objectifs militaires forgés procéduralement chaque jour pour tester vos compétences sur le champ de bataille. 
              Complétez chaque étape pour réclamer vos sacs d'or d'Aetheria.
            </p>
          </div>

          <!-- Header Right: Countdown & Total Gold Vault -->
          <div class="flex flex-row md:flex-col items-start md:items-end justify-between md:justify-center gap-3 shrink-0">
            <!-- Reset Countdown Clock -->
            <div class="flex items-center gap-2 px-3 py-1.5 bg-[#1a1612] border border-[#3a2f23] rounded-xl text-xs font-mono shadow-inner" title="Réinitialisation automatique des 3 ordres à minuit">
              <mat-icon class="text-sm text-[#d4af37] animate-pulse">timer</mat-icon>
              <div class="flex flex-col text-left md:text-right">
                <span class="text-[9px] uppercase tracking-wider text-[#8b6b43]">Prochaine Relève</span>
                <span class="text-[#e0dcc7] font-bold">{{ missionsService.timeRemaining() }}</span>
              </div>
            </div>

            <!-- Total Potential Rewards Pill -->
            <div class="flex items-center gap-2 px-3 py-1.5 bg-[#d4af37]/10 border border-[#d4af37]/40 rounded-xl text-xs font-mono text-[#d4af37]">
              <mat-icon class="text-sm">savings</mat-icon>
              <span>Total Récompenses : <strong>{{ missionsService.totalPotentialGold() }} Or</strong></span>
            </div>
          </div>
        </div>

        <!-- Secondary Status & Quick Controls Bar -->
        <div class="relative z-10 pt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <!-- Progress summary counters -->
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-1.5 text-[#e0dcc7]">
              <mat-icon class="text-sm text-emerald-400">task_alt</mat-icon>
              <span>Objectifs Remplis :</span>
              <strong class="text-emerald-400 font-mono">{{ missionsService.completedCount() }} / 3</strong>
            </div>

            <div class="flex items-center gap-1.5 text-[#e0dcc7]">
              <mat-icon class="text-sm text-[#d4af37]">payments</mat-icon>
              <span>Or Réclamé :</span>
              <strong class="text-[#d4af37] font-mono">{{ missionsService.claimedCount() }} / 3</strong>
            </div>
          </div>

          <!-- Action buttons (Reroll / Test simulation / Close) -->
          <div class="flex items-center gap-2 ml-auto">
            <button
              (click)="missionsService.rerollOrSimulateNewDay()"
              class="medieval-btn px-3 py-1.5 bg-[#1a1612] hover:bg-[#251f18] text-[#c5a880] hover:text-[#d4af37] rounded-lg border border-[#3a2f23] hover:border-[#8b6b43] text-[11px] font-cinzel font-bold flex items-center gap-1.5 transition-colors"
              title="Générer une nouvelle configuration procédurale pour tester différents objectifs">
              <mat-icon class="text-xs">casino</mat-icon>
              <span>Nouvelle Rotation (Test)</span>
            </button>

            @if (canClose()) {
              <button
                (click)="modalClose.emit()"
                class="medieval-btn px-3 py-1.5 bg-[#1a1612] hover:bg-[#2e1818] text-[#e0dcc7] hover:text-[#ff9999] rounded-lg border border-[#3a2f23] text-[11px] font-cinzel font-bold flex items-center gap-1">
                <mat-icon class="text-xs">close</mat-icon>
                <span>Fermer</span>
              </button>
            }
          </div>
        </div>
      </div>

      <!-- The 3 Procedurally Generated Mission Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
        @for (mission of missionsService.missions(); track mission.id; let idx = $index) {
          <div
            class="relative flex flex-col justify-between rounded-2xl border transition-all duration-300 p-5 shadow-xl group overflow-hidden bg-[#120f0c]"
            [class.border-[#8b6b43]]="mission.isCompleted && !mission.isClaimed"
            [class.bg-[#15120e]]="mission.isCompleted && !mission.isClaimed"
            [class.shadow-[0_0_20px_rgba(212,175,55,0.15)]]="mission.isCompleted && !mission.isClaimed"
            [class.border-emerald-500/40]="mission.isClaimed"
            [class.opacity-85]="mission.isClaimed"
            [class.border-[#3a2f23]]="!mission.isCompleted && !mission.isClaimed">

            <!-- Completed banner glow -->
            @if (mission.isCompleted && !mission.isClaimed) {
              <div class="absolute top-0 right-0 w-32 h-32 bg-[#d4af37]/15 rounded-full blur-2xl pointer-events-none"></div>
            }

            <div class="space-y-4">
              <!-- Top Row: Slot Number & Difficulty Badge -->
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-1.5">
                  <span class="w-5 h-5 rounded-full bg-[#1a1612] border border-[#3a2f23] flex items-center justify-center text-[10px] font-mono text-[#8b6b43]">
                    {{ idx + 1 }}
                  </span>
                  <span class="text-[10px] font-mono uppercase tracking-widest text-[#8b6b43]">
                    {{ getCategoryLabel(mission.category) }}
                  </span>
                </div>

                <!-- Difficulty Tag -->
                <span
                  class="px-2 py-0.5 rounded text-[10px] font-cinzel font-bold border uppercase tracking-wider"
                  [class.text-sky-300]="mission.difficulty === 'Standard'"
                  [class.bg-sky-950/40]="mission.difficulty === 'Standard'"
                  [class.border-sky-700/50]="mission.difficulty === 'Standard'"
                  [class.text-amber-300]="mission.difficulty === 'Vétéran'"
                  [class.bg-amber-950/40]="mission.difficulty === 'Vétéran'"
                  [class.border-amber-700/50]="mission.difficulty === 'Vétéran'"
                  [class.text-purple-300]="mission.difficulty === 'Héroïque'"
                  [class.bg-purple-950/40]="mission.difficulty === 'Héroïque'"
                  [class.border-purple-700/50]="mission.difficulty === 'Héroïque'">
                  {{ mission.difficulty }}
                </span>
              </div>

              <!-- Mission Icon & Title -->
              <div class="flex items-start gap-3">
                <div
                  class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border shadow-inner transition-transform group-hover:scale-105"
                  [class.bg-[#d4af37]/20]="mission.isCompleted"
                  [class.border-[#d4af37]]="mission.isCompleted"
                  [class.text-[#d4af37]]="mission.isCompleted"
                  [class.bg-[#1a1612]]="!mission.isCompleted"
                  [class.border-[#3a2f23]]="!mission.isCompleted"
                  [class.text-[#c5a880]]="!mission.isCompleted">
                  <mat-icon class="text-2xl">{{ mission.icon }}</mat-icon>
                </div>

                <div class="space-y-0.5">
                  <h3 class="font-cinzel text-base font-bold text-[#e0dcc7] group-hover:text-[#d4af37] transition-colors leading-tight">
                    {{ mission.title }}
                  </h3>
                  <div class="text-[11px] font-mono text-[#d4af37] font-bold flex items-center gap-1">
                    <mat-icon class="text-xs text-[#d4af37]">monetization_on</mat-icon>
                    <span>+{{ mission.rewardGold }} Pièces d'Or</span>
                  </div>
                </div>
              </div>

              <!-- Objective Narrative -->
              <div class="bg-[#181410] border border-[#3a2f23]/60 rounded-xl p-3 text-xs space-y-2">
                <p class="text-[#d8d2be] leading-relaxed font-medium">
                  {{ mission.tacticalObjective }}
                </p>

                <!-- Tactical Strategy Advice -->
                <div class="pt-2 border-t border-[#3a2f23]/60 flex items-start gap-1.5 text-[11px] text-[#8b7d6a] italic">
                  <mat-icon class="text-xs text-[#c5a880] shrink-0 mt-0.5">lightbulb</mat-icon>
                  <span>{{ mission.tacticalTip }}</span>
                </div>
              </div>

              <!-- Progress Bar -->
              <div class="space-y-1.5">
                <div class="flex items-center justify-between text-[11px] font-mono">
                  <span class="text-[#8b6b43]">Progression :</span>
                  <span
                    class="font-bold"
                    [class.text-emerald-400]="mission.isCompleted"
                    [class.text-[#e0dcc7]]="!mission.isCompleted">
                    {{ mission.current }} / {{ mission.target }} {{ mission.unitLabel }}
                  </span>
                </div>

                <!-- Progress track -->
                <div class="w-full h-2.5 bg-[#0a0a0c] border border-[#3a2f23] rounded-full overflow-hidden p-0.5">
                  <div
                    class="h-full rounded-full transition-all duration-500"
                    [class.bg-gradient-to-r]="true"
                    [class.from-emerald-500]="mission.isCompleted"
                    [class.to-emerald-400]="mission.isCompleted"
                    [class.from-[#8b6b43]]="!mission.isCompleted"
                    [class.to-[#d4af37]]="!mission.isCompleted"
                    [style.width.%]="getProgressPercent(mission)">
                  </div>
                </div>
              </div>
            </div>

            <!-- Bottom Actions Area -->
            <div class="mt-5 pt-3 border-t border-[#3a2f23] space-y-2">
              @if (mission.isClaimed) {
                <div class="w-full py-2.5 px-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-cinzel font-bold flex items-center justify-center gap-1.5">
                  <mat-icon class="text-sm text-emerald-400">check_circle</mat-icon>
                  <span>Or Réclamé (+{{ mission.rewardGold }})</span>
                </div>
              } @else if (mission.isCompleted) {
                <button
                  (click)="missionsService.claimMission(mission.id)"
                  class="medieval-btn w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b38f28] hover:from-[#e5c158] hover:to-[#c59f34] text-[#0a0a0c] font-cinzel font-black text-xs tracking-wide shadow-[0_0_15px_rgba(212,175,55,0.4)] flex items-center justify-center gap-2 animate-bounce hover:animate-none">
                  <mat-icon class="text-sm">savings</mat-icon>
                  <span>Réclamer {{ mission.rewardGold }} Or</span>
                </button>
              } @else {
                <div class="flex items-center gap-2">
                  <!-- Simulation test step button for immediate user verification -->
                  <button
                    (click)="missionsService.advanceMission(mission.id, 1)"
                    class="medieval-btn flex-1 py-2 px-2.5 bg-[#1a1612] hover:bg-[#251f18] text-[#c5a880] hover:text-[#d4af37] rounded-xl border border-[#3a2f23] hover:border-[#8b6b43] text-[11px] font-cinzel font-bold flex items-center justify-center gap-1"
                    title="Avancer l'objectif d'un pas pour tester la validation et l'encaissement de l'or">
                    <mat-icon class="text-xs">add_circle</mat-icon>
                    <span>+1 Pas (Test)</span>
                  </button>

                  <button
                    (click)="startArenaDuel()"
                    class="medieval-btn flex-1 py-2 px-2.5 bg-[#2a1a16] hover:bg-[#3d241e] text-[#e0dcc7] rounded-xl border border-[#8b2b2b]/60 text-[11px] font-cinzel font-bold flex items-center justify-center gap-1"
                    title="Rejoindre l'Arène pour combattre et valider vos objectifs">
                    <mat-icon class="text-xs text-[#ff4d4d]">swords</mat-icon>
                    <span>En Arène</span>
                  </button>
                </div>
              }
            </div>

          </div>
        }
      </div>

      <!-- Grand Tactical Completion Chest (Unlocks when all 3 daily missions are claimed) -->
      <div
        class="relative overflow-hidden rounded-2xl border transition-all duration-300 p-5 md:p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-5 bg-[#120f0c]"
        [class.border-[#d4af37]]="missionsService.allMissionsClaimed() && !missionsService.hasClaimedGrandChest()"
        [class.shadow-[0_0_25px_rgba(212,175,55,0.25)]]="missionsService.allMissionsClaimed() && !missionsService.hasClaimedGrandChest()"
        [class.border-emerald-500/40]="missionsService.hasClaimedGrandChest()"
        [class.border-[#3a2f23]]="!missionsService.allMissionsClaimed()">

        <div class="flex items-center gap-4">
          <div
            class="w-14 h-14 rounded-2xl border flex items-center justify-center text-3xl shrink-0 shadow-lg"
            [class.bg-[#d4af37]/20]="missionsService.allMissionsClaimed() && !missionsService.hasClaimedGrandChest()"
            [class.border-[#d4af37]]="missionsService.allMissionsClaimed() && !missionsService.hasClaimedGrandChest()"
            [class.text-[#d4af37]]="missionsService.allMissionsClaimed() && !missionsService.hasClaimedGrandChest()"
            [class.animate-pulse]="missionsService.allMissionsClaimed() && !missionsService.hasClaimedGrandChest()"
            [class.bg-emerald-950/40]="missionsService.hasClaimedGrandChest()"
            [class.border-emerald-500]="missionsService.hasClaimedGrandChest()"
            [class.text-emerald-400]="missionsService.hasClaimedGrandChest()"
            [class.bg-[#1a1612]]="!missionsService.allMissionsClaimed()"
            [class.border-[#3a2f23]]="!missionsService.allMissionsClaimed()"
            [class.text-[#6b5a45]]="!missionsService.allMissionsClaimed()">
            <mat-icon class="text-3xl">
              {{ missionsService.hasClaimedGrandChest() ? 'check_circle' : 'workspace_premium' }}
            </mat-icon>
          </div>

          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <h3 class="font-cinzel text-lg md:text-xl font-black text-[#e0dcc7]">
                Grand Coffre de Maîtrise Tactique
              </h3>
              <span class="px-2 py-0.5 rounded-full bg-[#d4af37]/20 text-[#d4af37] font-mono text-[10px] font-bold border border-[#d4af37]/40">
                +{{ missionsService.grandChestGoldBonus }} Or Bonus
              </span>
            </div>
            <p class="text-xs text-[#a39783] max-w-xl">
              @if (missionsService.hasClaimedGrandChest()) {
                Félicitations ! Vous avez accompli l'intégralité de vos ordres tactiques du jour et empoché le trésor souverain.
              } @else if (missionsService.allMissionsClaimed()) {
                Les 3 missions tactiques ont été complétées et réclamées avec honneur ! Votre coffre bonus d'or est prêt.
              } @else {
                Terminez et réclamez les trois missions procédurales de ce cycle pour ouvrir ce coffre d'or légendaire ({{ missionsService.claimedCount() }} / 3).
              }
            </p>
          </div>
        </div>

        <div class="shrink-0 w-full md:w-auto">
          @if (missionsService.hasClaimedGrandChest()) {
            <div class="px-5 py-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 font-cinzel font-bold text-xs flex items-center justify-center gap-1.5">
              <mat-icon class="text-sm text-emerald-400">verified</mat-icon>
              <span>Bonus Réclamé</span>
            </div>
          } @else if (missionsService.allMissionsClaimed()) {
            <button
              (click)="missionsService.claimGrandChest()"
              class="medieval-btn w-full md:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f59e0b] to-[#d4af37] hover:brightness-110 text-[#0a0a0c] font-cinzel font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(212,175,55,0.5)] flex items-center justify-center gap-2 animate-bounce hover:animate-none">
              <mat-icon class="text-sm">lock_open</mat-icon>
              <span>Ouvrir le Grand Coffre (+{{ missionsService.grandChestGoldBonus }} Or)</span>
            </button>
          } @else {
            <div class="px-4 py-2 rounded-xl bg-[#1a1612] border border-[#3a2f23] text-[#6b5a45] font-cinzel text-xs flex items-center justify-center gap-2">
              <mat-icon class="text-sm">lock</mat-icon>
              <span>{{ 3 - missionsService.claimedCount() }} mission(s) restante(s)</span>
            </div>
          }
        </div>

      </div>

    </div>
  `,
})
export class DailyMissionsComponent {
  readonly missionsService = inject(DailyMissionsService);
  readonly gameState = inject(GameStateService);
  readonly sound = inject(SoundService);

  readonly canClose = signal<boolean>(true);
  readonly modalClose = output<void>();
  readonly navigateToArena = output<void>();

  getProgressPercent(mission: DailyTacticalMission): number {
    if (!mission.target || mission.target <= 0) return 0;
    return Math.min(100, Math.round((mission.current / mission.target) * 100));
  }

  getCategoryLabel(category: string): string {
    switch (category) {
      case 'tactics':
        return 'Tactique & Sorts';
      case 'combat':
        return 'Contrôle & Assaut';
      case 'survival':
        return 'Triomphe & Survie';
      default:
        return 'Objectif';
    }
  }

  startArenaDuel() {
    this.sound.playClick();
    this.navigateToArena.emit();
    this.modalClose.emit();
  }
}
