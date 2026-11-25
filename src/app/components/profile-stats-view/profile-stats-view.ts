import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { GameStateService } from '../../services/game-state';
import { SoundService } from '../../services/sound';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-profile-stats-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    @let stats = gameState.playerStats();

    <div class="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      
      <!-- Profile Header Showcase Card -->
      <div class="bg-[#120f0c] border border-[#3a2f23] rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        
        <div class="flex items-center gap-5">
          <!-- Dynamic Animated Avatar with Frame -->
          <div class="w-20 h-20 rounded-2xl bg-[#0d0b09] border-2 border-[#8b6b43] shadow-xl flex items-center justify-center relative">
            <mat-icon class="text-4xl text-[#c5a880]">{{ getAvatarIcon() }}</mat-icon>
            <div class="absolute -bottom-2.5 bg-[#8b2b2b] text-white font-cinzel font-bold text-[10px] px-2 py-0.5 rounded-full border border-[#ff4d4d] shadow">
              NIV. {{ gameState.playerLevel() }}
            </div>
          </div>

          <div>
            <div class="flex items-center gap-2">
              <input
                type="text"
                [value]="gameState.username()"
                (input)="onUsernameInput($event)"
                class="font-cinzel-dec text-xl md:text-2xl font-black text-[#c5a880] bg-transparent border-b border-transparent hover:border-[#8b6b43] focus:border-[#d4af37] focus:outline-none px-1 rounded transition-colors" />
              <mat-icon class="text-[#8b6b43] text-sm">edit</mat-icon>
            </div>

            <!-- Title Selector Dropdown -->
            <div class="flex items-center gap-2 mt-1">
              <mat-icon class="text-[#d4af37] text-sm">military_tech</mat-icon>
              <select
                [value]="gameState.currentTitle()"
                (change)="onTitleSelect($event)"
                class="bg-[#1a1612] border border-[#3a2f23] rounded-lg px-2.5 py-1 text-xs text-[#e0dcc7] font-cinzel font-semibold focus:outline-none focus:border-[#8b6b43]">
                @for (t of gameState.titles(); track t) {
                  <option [value]="t">{{ t }}</option>
                }
              </select>
            </div>

            <div class="flex items-center gap-3 mt-2 text-xs font-mono text-[#8b6b43]">
              <span>Division : <strong class="text-[#d4af37]">{{ gameState.divisionName() }}</strong></span>
              <span>•</span>
              <span>Elo : <strong class="text-[#e0dcc7]">{{ gameState.elo() }}</strong></span>
            </div>
          </div>
        </div>

        <!-- Cloud Sync & Backup Box -->
        <div class="bg-[#1a1612] p-4 rounded-xl border border-[#3a2f23] space-y-2 self-start md:self-auto min-w-[260px]">
          <div class="flex items-center justify-between text-xs font-cinzel text-[#8b6b43]">
            <span class="flex items-center gap-1">
              <mat-icon class="text-[#4d94ff] text-xs">cloud_sync</mat-icon> Sauvegarde Cloud
            </span>
            <span class="text-emerald-400 font-mono text-[10px]">{{ gameState.lastCloudSync() }}</span>
          </div>

          <div class="font-mono text-xs text-[#c5a880] bg-[#0d0b09] px-2 py-1 rounded border border-[#3a2f23] truncate">
            ID: {{ gameState.cloudSyncId() }}
          </div>

          <div class="flex items-center gap-2 pt-1">
            <button
              (click)="exportSaveCode()"
              class="medieval-btn flex-1 py-1.5 bg-[#0d0b09] hover:bg-[#120f0c] text-[#e0dcc7] font-cinzel text-[10px] font-bold rounded-lg border border-[#3a2f23]">
              {{ copiedFeedback() ? 'Copié !' : 'Copier le Code' }}
            </button>
            <button
              (click)="showImportModal.set(true)"
              class="medieval-btn flex-1 py-1.5 bg-[#0d0b09] hover:bg-[#120f0c] text-[#e0dcc7] font-cinzel text-[10px] font-bold rounded-lg border border-[#3a2f23]">
              Restaurer
            </button>
          </div>
        </div>

      </div>

      <!-- PERFORMANCE STATISTICS GRID -->
      <div class="space-y-3">
        <h2 class="font-cinzel text-base font-bold text-[#c5a880] flex items-center gap-2">
          <mat-icon class="text-[#d4af37]">query_stats</mat-icon>
          Statistiques de Combat & Historique d'Aetheria
        </h2>

        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <div class="bg-[#120f0c] border border-[#3a2f23] rounded-2xl p-4 shadow-xl space-y-1">
            <div class="text-[11px] font-cinzel text-[#8b6b43] uppercase">Matchs Disputés</div>
            <div class="font-mono font-black text-2xl text-[#e0dcc7]">{{ stats.totalMatches }}</div>
            <div class="text-[10px] text-[#6b5a45] font-mono">{{ stats.wins }}V - {{ stats.losses }}D</div>
          </div>

          <div class="bg-[#120f0c] border border-[#3a2f23] rounded-2xl p-4 shadow-xl space-y-1">
            <div class="text-[11px] font-cinzel text-[#8b6b43] uppercase">Taux de Victoire</div>
            <div class="font-mono font-black text-2xl text-emerald-400">{{ gameState.winRate() }}%</div>
            <div class="text-[10px] text-[#6b5a45] font-mono">Performance globale</div>
          </div>

          <div class="bg-[#120f0c] border border-[#3a2f23] rounded-2xl p-4 shadow-xl space-y-1">
            <div class="text-[11px] font-cinzel text-[#8b6b43] uppercase">Série Maximale</div>
            <div class="font-mono font-black text-2xl text-[#d4af37] flex items-center gap-1.5">
              <span>{{ stats.highestWinStreak }}</span>
              <mat-icon class="text-xl text-amber-400">local_fire_department</mat-icon>
            </div>
            <div class="text-[10px] text-[#6b5a45] font-mono">En cours : {{ stats.currentWinStreak }}</div>
          </div>

          <div class="bg-[#120f0c] border border-[#3a2f23] rounded-2xl p-4 shadow-xl space-y-1">
            <div class="text-[11px] font-cinzel text-[#8b6b43] uppercase">Dégâts Totaux</div>
            <div class="font-mono font-black text-2xl text-rose-400">{{ stats.totalDamageDealt }}</div>
            <div class="text-[10px] text-[#6b5a45] font-mono">Dégâts infligés</div>
          </div>

          <div class="bg-[#120f0c] border border-[#3a2f23] rounded-2xl p-4 shadow-xl space-y-1">
            <div class="text-[11px] font-cinzel text-[#8b6b43] uppercase">Cartes Jouées</div>
            <div class="font-mono font-black text-2xl text-[#4d94ff]">{{ stats.cardsPlayed }}</div>
            <div class="text-[10px] text-[#6b5a45] font-mono">Sorts et créatures</div>
          </div>

          <div class="bg-[#120f0c] border border-[#3a2f23] rounded-2xl p-4 shadow-xl space-y-1">
            <div class="text-[11px] font-cinzel text-[#8b6b43] uppercase">Cartes Forgées</div>
            <div class="font-mono font-black text-2xl text-[#c5a880]">{{ stats.cardsUpgraded }}</div>
            <div class="text-[10px] text-[#6b5a45] font-mono">Niveaux & étoiles</div>
          </div>

          <div class="bg-[#120f0c] border border-[#3a2f23] rounded-2xl p-4 shadow-xl space-y-1">
            <div class="text-[11px] font-cinzel text-[#8b6b43] uppercase">Élixirs Consommés</div>
            <div class="font-mono font-black text-2xl text-purple-400">{{ stats.potionsConsumed }}</div>
            <div class="text-[10px] text-[#6b5a45] font-mono">Buffs de combat</div>
          </div>

          <div class="bg-[#120f0c] border border-[#3a2f23] rounded-2xl p-4 shadow-xl space-y-1">
            <div class="text-[11px] font-cinzel text-[#8b6b43] uppercase">Coffres Ouverts</div>
            <div class="font-mono font-black text-2xl text-[#d4af37]">{{ stats.packsOpened }}</div>
            <div class="text-[10px] text-[#6b5a45] font-mono">Trésors déverrouillés</div>
          </div>

          <div class="bg-[#120f0c] border border-[#d4af37]/60 rounded-2xl p-4 shadow-xl space-y-1 col-span-2 sm:col-span-3 lg:col-span-4 bg-gradient-to-r from-[#18130e] to-[#120f0c]">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <mat-icon class="text-[#d4af37]">auto_awesome</mat-icon>
                <span class="text-xs font-cinzel font-bold text-[#c5a880]">Sanctuaire des Reliques & Multiplicateur d'EXP</span>
              </div>
              <span class="text-xs font-mono font-bold text-[#38bdf8]">+{{ gameState.totalRelicXpBoostPct() }}% EXP Active</span>
            </div>
            <div class="flex items-center gap-3 pt-2 text-xs text-[#8b6b43]">
              <span>{{ gameState.equippedRelics().length }} / 3 Reliques Enchâssées</span>
              <span>•</span>
              <span class="text-[#a78bfa]">+{{ gameState.totalRelicSeasonXpBoostPct() }}% XP de Passe</span>
              <span>•</span>
              <span class="text-[#fbbf24]">+{{ gameState.totalRelicGoldBoostPct() }}% Butin d'Or</span>
            </div>
          </div>

          <div class="bg-[#120f0c] border border-[#8b6b43]/70 rounded-2xl p-4 shadow-xl col-span-2 sm:col-span-3 lg:col-span-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <mat-icon class="text-[#d4af37]">emoji_events</mat-icon>
                <span class="text-xs font-cinzel font-bold text-[#c5a880]">Hauts Faits &amp; Succès · {{ gameState.achievementHonorRank() }}</span>
              </div>
              <div class="flex flex-wrap items-center gap-2 text-xs font-mono tabular-nums text-[#8b6b43]">
                <span class="text-[#e0dcc7] font-bold">{{ gameState.achievementsUnlockedCount() }} / {{ gameState.achievementsTotalCount() }} débloqués</span>
                <span>·</span>
                <span class="text-[#d4af37]">{{ gameState.achievementPointsEarned() }} / {{ gameState.achievementPointsTotal() }} pts</span>
                @if (gameState.achievementsClaimableCount() > 0) {
                  <span>·</span>
                  <span class="text-[#4dff88] font-bold">{{ gameState.achievementsClaimableCount() }} récompense(s) prête(s)</span>
                }
              </div>
            </div>
            <button
              type="button"
              (click)="navigateToAchievements.emit()"
              class="medieval-btn px-4 py-2 rounded-xl bg-[#1a1612] hover:bg-[#251f18] border border-[#d4af37]/70 text-[#d4af37] font-cinzel font-bold text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0">
              <mat-icon class="text-sm">emoji_events</mat-icon>
              <span>Ouvrir les Succès</span>
            </button>
          </div>
        </div>
      </div>

      <!-- IMPORT MODAL -->
      @if (showImportModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div class="bg-[#120f0c] border border-[#3a2f23] rounded-2xl max-w-md w-full p-6 shadow-2xl text-[#e0dcc7] space-y-4">
            <div class="flex items-center justify-between pb-2 border-b border-[#3a2f23]">
              <h3 class="font-cinzel text-base font-bold text-[#c5a880] flex items-center gap-2">
                <mat-icon class="text-[#4d94ff]">cloud_download</mat-icon>
                Restaurer la Sauvegarde
              </h3>
              <button (click)="showImportModal.set(false)" class="text-[#8b6b43] hover:text-[#e0dcc7]">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <p class="text-xs text-[#8b6b43]">Collez votre code de sauvegarde Aetheria JSON :</p>

            <textarea
              #importInput
              rows="4"
              class="w-full bg-[#1a1612] border border-[#3a2f23] rounded-xl p-3 text-xs text-[#e0dcc7] font-mono focus:outline-none focus:border-[#8b6b43]"
              placeholder="Collez le code de sauvegarde ici..."></textarea>

            <div class="flex justify-end gap-2 pt-2">
              <button
                (click)="showImportModal.set(false)"
                class="medieval-btn px-4 py-2 bg-[#0d0b09] hover:bg-[#120f0c] text-[#8b6b43] font-cinzel text-xs rounded-xl border border-[#3a2f23]">
                Annuler
              </button>
              <button
                (click)="applyImport(importInput.value)"
                class="crimson-btn px-5 py-2 text-white font-cinzel font-bold text-xs rounded-xl border border-[#ff4d4d]">
                Restaurer
              </button>
            </div>
          </div>
        </div>
      }

    </div>
  `,
})
export class ProfileStatsView {
  readonly gameState = inject(GameStateService);
  readonly sound = inject(SoundService);
  readonly navigateToAchievements = output<void>();
  readonly showImportModal = signal<boolean>(false);
  readonly copiedFeedback = signal<boolean>(false);

  getAvatarIcon(): string {
    const avatar = this.gameState.avatarId();
    if (avatar === 'paladin_avatar') return 'military_tech';
    if (avatar === 'mage_avatar') return 'auto_awesome';
    return 'shield_moon';
  }

  onUsernameInput(event: Event) {
    const newVal = (event.target as HTMLInputElement).value;
    if (newVal.trim()) {
      this.gameState.username.set(newVal.trim());
      this.gameState.triggerAutoSave();
    }
  }

  onTitleSelect(event: Event) {
    const newVal = (event.target as HTMLSelectElement).value;
    this.gameState.currentTitle.set(newVal);
    this.gameState.triggerAutoSave();
    this.sound.playClick();
  }

  async exportSaveCode() {
    const code = this.gameState.exportBackupCode();
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
        this.copiedFeedback.set(true);
        setTimeout(() => this.copiedFeedback.set(false), 2000);
      }
    } catch {
      // Clipboard blocked in restricted iframe context
    }
    this.sound.playClick();
  }

  applyImport(code: string) {
    if (code.trim()) {
      const ok = this.gameState.importBackupCode(code.trim());
      if (ok) {
        this.sound.playVictory();
      }
      this.showImportModal.set(false);
    }
  }
}
