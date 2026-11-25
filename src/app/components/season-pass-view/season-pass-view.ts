import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { GameStateService } from '../../services/game-state';
import { SoundService } from '../../services/sound';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-season-pass-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div class="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      
      <!-- Season Hero Banner -->
      <div class="relative overflow-hidden bg-[#120f0c] border border-[#3a2f23] rounded-2xl p-6 shadow-2xl space-y-4">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div class="inline-flex items-center gap-1.5 px-3 py-1 bg-[#1a1612] border border-[#8b6b43] rounded-full text-[#d4af37] font-cinzel text-xs font-bold mb-2">
              <mat-icon class="text-xs text-[#ff4d4d] animate-pulse">local_fire_department</mat-icon>
              Passe de Saison • Saison {{ gameState.seasonNumber() }}
            </div>
            <h1 class="font-cinzel-dec text-2xl md:text-3xl font-black text-[#c5a880]">{{ gameState.seasonName() }}</h1>
            <p class="text-[#8b6b43] text-xs md:text-sm font-serif mt-1 max-w-xl">
              Progressez à travers les 50 paliers légendaires pour débloquer des skins mythiques, des titres prestigieux, des dos de cartes et l'Avatar Divin Suprême.
            </p>
          </div>

          <div class="flex flex-col sm:flex-row items-center gap-3">
            @if (!gameState.isSeasonPassPremium()) {
              <button
                (click)="buyPremiumPass()"
                class="crimson-btn px-5 py-2.5 font-cinzel font-bold text-xs md:text-sm rounded-xl border border-[#ff4d4d] shadow-lg flex items-center gap-2">
                <mat-icon class="text-white">workspace_premium</mat-icon>
                <span>Débloquer le Passe Royal (500</span>
                <img
                  src="/src/assets/images/vault_gems_treasure_1795188690343.jpg"
                  alt="Gemmes"
                  class="w-4 h-4 rounded object-cover border border-[#60a5fa]/60 shrink-0"
                  referrerpolicy="no-referrer" />
                <span>)</span>
              </button>
            } @else {
              <div class="px-4 py-2 bg-[#1a1612] border border-[#d4af37] text-[#d4af37] font-cinzel font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                <mat-icon class="text-[#d4af37]">verified</mat-icon>
                Passe Royal Activé
              </div>
            }

            @if (hasUnclaimedRewards()) {
              <button
                (click)="claimAll()"
                class="px-4 py-2 bg-[#8b2b2b] hover:bg-[#a33232] text-white border border-[#ff4d4d] font-cinzel font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-lg transition-all active:scale-95 animate-pulse">
                <mat-icon class="text-sm">redeem</mat-icon>
                Tout Réclamer
              </button>
            }

            <div class="px-3.5 py-2 bg-[#1a1612] border border-[#3a2f23] rounded-xl text-[#8b6b43] text-xs font-mono">
              Fin de saison : <span class="text-[#d4af37] font-bold">{{ gameState.seasonEndsInDays() }} jours</span>
            </div>
          </div>
        </div>

        <!-- Season XP Progress Bar -->
        <div class="space-y-1.5 pt-2 relative z-10">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs font-cinzel text-[#c5a880] font-bold">
            <div class="flex items-center gap-2">
              <span>Palier Actuel : {{ gameState.seasonTier() }} / {{ totalTiers() }}</span>
              <span class="px-2 py-0.5 bg-[#1a1612] border border-[#8b6b43] rounded-full text-[10px] text-[#d4af37]">
                {{ getProgressPercent() }}% Complété
              </span>
            </div>
            <div class="flex items-center gap-3">
              <span class="font-mono text-[#d4af37]">{{ gameState.seasonXp() }} XP Saisonnière</span>
              @if (nextTierXpRemaining() > 0) {
                <span class="text-[10px] text-[#8b6b43] font-mono">
                  (Prochain palier dans {{ nextTierXpRemaining() }} XP)
                </span>
              } @else {
                <span class="text-[10px] text-emerald-400 font-mono font-bold">★ Palier Max Atteint !</span>
              }
            </div>
          </div>

          <div class="w-full bg-[#0d0b09] rounded-full h-3.5 border border-[#3a2f23] overflow-hidden relative shadow-inner">
            <div
              class="bg-gradient-to-r from-[#8b2b2b] via-[#c5a880] to-[#d4af37] h-full transition-all duration-500 rounded-full"
              [style.width.%]="(gameState.seasonTier() / totalTiers()) * 100"></div>
          </div>
        </div>
      </div>

      <!-- Main Dual Grid: Reward Roadmap (Left) & Daily Quests (Right) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">

        <!-- Left: Battle Pass Reward Roadmap (8 cols) -->
        <div class="lg:col-span-8 space-y-4">
          <div class="bg-[#120f0c] border border-[#3a2f23] rounded-2xl p-5 shadow-xl space-y-4">
            
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#3a2f23]">
              <div class="flex items-center gap-2">
                <mat-icon class="text-[#d4af37]">auto_awesome_motion</mat-icon>
                <h3 class="font-cinzel text-base font-bold text-[#c5a880]">
                  Chemin des 50 Récompenses
                </h3>
              </div>
              <span class="text-xs text-[#8b6b43] font-mono">
                Gratuit (Gris/Bronze) • Passe Royal (Doré)
              </span>
            </div>

            <!-- Tier Range Filters & Jump Buttons -->
            <div class="flex items-center gap-1.5 overflow-x-auto pb-2 text-xs font-cinzel">
              @for (tab of tierRangeTabs; track tab.id) {
                <button
                  (click)="selectedRange.set(tab.id); sound.playClick()"
                  class="px-3 py-1.5 rounded-lg border whitespace-nowrap transition-all duration-150 font-bold shrink-0"
                  [class.bg-[#8b2b2b]]="selectedRange() === tab.id"
                  [class.border-[#ff4d4d]]="selectedRange() === tab.id"
                  [class.text-white]="selectedRange() === tab.id"
                  [class.bg-[#1a1612]]="selectedRange() !== tab.id"
                  [class.border-[#3a2f23]]="selectedRange() !== tab.id"
                  [class.text-[#8b6b43]]="selectedRange() !== tab.id">
                  {{ tab.label }}
                </button>
              }
            </div>

            <!-- Tiers List -->
            <div class="space-y-3 max-h-[620px] overflow-y-auto pr-1">
              @for (tier of displayedTiers(); track tier.tier) {
                @let isUnlocked = gameState.seasonTier() >= tier.tier;
                @let isMilestone = tier.tier % 10 === 0 || tier.tier === 25 || tier.tier === 50;

                <div
                  class="p-3.5 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-4 transition-all"
                  [class.bg-[#1a1612]]="isUnlocked && !isMilestone"
                  [class.border-[#d4af37]]="isUnlocked && !isMilestone"
                  [class.bg-[#231a0e]]="isUnlocked && isMilestone"
                  [class.border-[#f59e0b]]="isUnlocked && isMilestone"
                  [class.shadow-[0_0_15px_rgba(245,158,11,0.2)]]="isUnlocked && isMilestone"
                  [class.bg-[#0d0b09]]="!isUnlocked"
                  [class.border-[#3a2f23]]="!isUnlocked && !isMilestone"
                  [class.border-[#5c401e]]="!isUnlocked && isMilestone"
                  [class.opacity-60]="!isUnlocked">
                  
                  <!-- Tier Number & Milestone Badge -->
                  <div class="flex items-center gap-3 w-full md:w-auto shrink-0">
                    <div
                      class="w-11 h-11 rounded-xl flex flex-col items-center justify-center font-cinzel font-black text-sm border shadow relative"
                      [class.bg-[#8b2b2b]]="isUnlocked"
                      [class.border-[#ff4d4d]]="isUnlocked"
                      [class.text-white]="isUnlocked"
                      [class.bg-[#120f0c]]="!isUnlocked"
                      [class.border-[#3a2f23]]="!isUnlocked"
                      [class.text-[#6b5a45]]="!isUnlocked">
                      <span>{{ tier.tier }}</span>
                      @if (isMilestone) {
                        <span class="text-[8px] text-[#d4af37] font-bold">★</span>
                      }
                    </div>

                    <div>
                      <div class="font-cinzel text-xs font-bold text-[#e0dcc7] flex items-center gap-1.5">
                        <span>Palier {{ tier.tier }}</span>
                        @if (isMilestone) {
                          <span class="px-1.5 py-0.2 bg-[#3a2f23] border border-[#d4af37] text-[#d4af37] rounded text-[9px] uppercase font-bold">
                            Majeur
                          </span>
                        }
                      </div>
                      <div class="text-[10px] text-[#8b6b43] font-mono">{{ tier.xpRequired }} XP Requis</div>
                    </div>
                  </div>

                  <!-- Free & Premium Rewards -->
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full md:w-2/3">
                    
                    <!-- Free Box (Clickable to claim if unlocked & unclaimed) -->
                    <div
                      tabindex="0"
                      role="button"
                      (click)="claimReward(tier.tier, 'free')"
                      (keydown.enter)="claimReward(tier.tier, 'free')"
                      (keydown.space)="claimReward(tier.tier, 'free')"
                      class="p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all select-none"
                      [class.bg-[#120f0c]]="!tier.isFreeClaimed"
                      [class.border-[#3a2f23]]="!tier.isFreeClaimed"
                      [class.bg-[#101912]]="tier.isFreeClaimed"
                      [class.border-emerald-700]="tier.isFreeClaimed"
                      [class.cursor-pointer]="isUnlocked && !tier.isFreeClaimed"
                      [class.hover:border-[#c5a880]]="isUnlocked && !tier.isFreeClaimed"
                      [class.animate-pulse]="isUnlocked && !tier.isFreeClaimed">
                      
                      <div class="flex items-center gap-2 truncate">
                        <mat-icon class="text-[#c5a880] text-xl shrink-0">{{ tier.freeReward.icon }}</mat-icon>
                        <div class="truncate">
                          <div class="text-[9px] text-[#6b5a45] font-cinzel uppercase">Gratuit</div>
                          <div class="font-cinzel font-bold text-xs text-[#e0dcc7] truncate" [title]="tier.freeReward.name">
                            {{ tier.freeReward.name }}
                          </div>
                        </div>
                      </div>

                      <div class="shrink-0">
                        @if (tier.isFreeClaimed) {
                          <span class="text-[9px] text-emerald-400 font-bold flex items-center gap-0.5">
                            <mat-icon class="text-xs">check_circle</mat-icon>
                          </span>
                        } @else if (isUnlocked) {
                          <span class="px-2 py-0.5 bg-[#8b2b2b] text-white border border-[#ff4d4d] rounded text-[9px] font-cinzel font-bold uppercase shadow">
                            Réclamer
                          </span>
                        } @else {
                          <mat-icon class="text-xs text-[#6b5a45]">lock</mat-icon>
                        }
                      </div>
                    </div>

                    <!-- Premium Box (Clickable to claim if premium active & unlocked) -->
                    <div
                      tabindex="0"
                      role="button"
                      (click)="claimReward(tier.tier, 'premium')"
                      (keydown.enter)="claimReward(tier.tier, 'premium')"
                      (keydown.space)="claimReward(tier.tier, 'premium')"
                      class="p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all select-none"
                      [class.bg-[#1a1612]]="!tier.isPremiumClaimed"
                      [class.border-[#8b6b43]]="!tier.isPremiumClaimed"
                      [class.bg-[#1f1910]]="tier.isPremiumClaimed"
                      [class.border-emerald-600]="tier.isPremiumClaimed"
                      [class.cursor-pointer]="isUnlocked && gameState.isSeasonPassPremium() && !tier.isPremiumClaimed"
                      [class.hover:border-[#d4af37]]="isUnlocked && gameState.isSeasonPassPremium() && !tier.isPremiumClaimed"
                      [class.animate-pulse]="isUnlocked && gameState.isSeasonPassPremium() && !tier.isPremiumClaimed">
                      
                      <div class="flex items-center gap-2 truncate">
                        <mat-icon class="text-[#d4af37] text-xl shrink-0">{{ tier.premiumReward.icon }}</mat-icon>
                        <div class="truncate">
                          <div class="text-[9px] text-[#d4af37] font-cinzel uppercase font-semibold">Passe Royal</div>
                          <div class="font-cinzel font-bold text-xs text-[#c5a880] truncate" [title]="tier.premiumReward.name">
                            {{ tier.premiumReward.name }}
                          </div>
                        </div>
                      </div>

                      <div class="shrink-0">
                        @if (tier.isPremiumClaimed) {
                          <span class="text-[9px] text-emerald-400 font-bold flex items-center gap-0.5">
                            <mat-icon class="text-xs">check_circle</mat-icon>
                          </span>
                        } @else if (isUnlocked && gameState.isSeasonPassPremium()) {
                          <span class="px-2 py-0.5 bg-[#d4af37] text-[#120f0c] border border-[#f59e0b] rounded text-[9px] font-cinzel font-black uppercase shadow">
                            Réclamer
                          </span>
                        } @else if (isUnlocked && !gameState.isSeasonPassPremium()) {
                          <span class="text-[9px] text-[#8b6b43] font-cinzel font-semibold flex items-center gap-0.5">
                            <mat-icon class="text-xs text-[#d4af37]">workspace_premium</mat-icon> Requis
                          </span>
                        } @else {
                          <mat-icon class="text-xs text-[#6b5a45]">lock</mat-icon>
                        }
                      </div>
                    </div>

                  </div>
                </div>
              }
            </div>

          </div>
        </div>

        <!-- Right: Daily Quests Tracker & Rewards Summary (4 cols) -->
        <div class="lg:col-span-4 space-y-4">
          
          <!-- Missions Quotidiennes -->
          <div class="bg-[#120f0c] border border-[#3a2f23] rounded-2xl p-5 shadow-xl space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-[#3a2f23]">
              <h3 class="font-cinzel text-base font-bold text-[#c5a880] flex items-center gap-2">
                <mat-icon class="text-[#d4af37]">task_alt</mat-icon>
                Missions Quotidiennes
              </h3>
              <span class="text-xs text-[#6b5a45] font-mono">Reset 24h</span>
            </div>

            <div class="space-y-3">
              @for (quest of gameState.dailyQuests(); track quest.id) {
                <div class="p-3.5 bg-[#1a1612] border border-[#3a2f23] rounded-xl space-y-2.5">
                  <div class="flex items-start justify-between gap-2">
                    <div class="flex items-center gap-2">
                      <mat-icon class="text-[#c5a880] text-base">{{ quest.icon }}</mat-icon>
                      <span class="font-cinzel font-bold text-xs text-[#e0dcc7]">{{ quest.title }}</span>
                    </div>
                    
                    <span class="font-mono text-[11px] text-[#d4af37] font-bold">
                      {{ quest.current }} / {{ quest.target }}
                    </span>
                  </div>

                  <p class="text-[11px] text-[#8b6b43]">{{ quest.description }}</p>

                  <!-- Quest Progress Bar -->
                  <div class="w-full bg-[#0d0b09] rounded-full h-1.5 border border-[#3a2f23] overflow-hidden">
                    <div
                      class="bg-[#8b6b43] h-full"
                      [style.width.%]="(quest.current / quest.target) * 100"></div>
                  </div>

                  <!-- Claim button -->
                  <div class="flex items-center justify-between pt-1">
                    <div class="flex items-center gap-2 text-[10px] font-mono text-[#8b6b43]">
                      <span>+{{ quest.rewardGold }} Or</span>
                      <span>•</span>
                      <span>+{{ quest.rewardXp }} XP</span>
                    </div>

                    @if (quest.isCompleted && !quest.isClaimed) {
                      <button
                        (click)="gameState.claimQuestReward(quest.id)"
                        class="crimson-btn px-2.5 py-1 text-white font-cinzel font-bold text-[10px] rounded border border-[#ff4d4d] shadow">
                        Réclamer
                      </button>
                    } @else if (quest.isClaimed) {
                      <span class="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5">
                        <mat-icon class="text-xs">check</mat-icon> Récupéré
                      </span>
                    } @else {
                      <span class="text-[10px] text-[#6b5a45] font-semibold">En cours</span>
                    }
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Season Grand Rewards Highlights -->
          <div class="bg-[#120f0c] border border-[#3a2f23] rounded-2xl p-5 shadow-xl space-y-3">
            <h4 class="font-cinzel text-sm font-bold text-[#c5a880] flex items-center gap-2 border-b border-[#3a2f23] pb-2">
              <mat-icon class="text-[#d4af37]">stars</mat-icon>
              Grandes Récompenses Suprêmes
            </h4>

            <div class="space-y-2 text-xs">
              <div class="p-2.5 bg-[#1a1612] rounded-xl border border-[#3a2f23] flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="font-mono text-[#d4af37] font-bold">P. 10</span>
                  <span class="text-[#e0dcc7] font-cinzel">Titre: Maître des Dragons</span>
                </div>
                <mat-icon class="text-sm text-[#c5a880]">military_tech</mat-icon>
              </div>

              <div class="p-2.5 bg-[#1a1612] rounded-xl border border-[#3a2f23] flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="font-mono text-[#d4af37] font-bold">P. 25</span>
                  <span class="text-[#e0dcc7] font-cinzel">Carte Titan d'Aetheria</span>
                </div>
                <mat-icon class="text-sm text-[#4d94ff]">shield</mat-icon>
              </div>

              <div class="p-2.5 bg-[#1a1612] rounded-xl border border-[#3a2f23] flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="font-mono text-[#d4af37] font-bold">P. 40</span>
                  <span class="text-[#e0dcc7] font-cinzel">Skin Archonte de Lumière</span>
                </div>
                <mat-icon class="text-sm text-[#d4af37]">flare</mat-icon>
              </div>

              <div class="p-2.5 bg-[#241708] rounded-xl border border-[#d4af37] flex items-center justify-between shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                <div class="flex items-center gap-2">
                  <span class="font-mono text-[#d4af37] font-black text-sm">P. 50</span>
                  <span class="text-[#d4af37] font-cinzel font-bold">Skin Empereur Dragon & Titre Dieu</span>
                </div>
                <mat-icon class="text-sm text-[#d4af37]">workspace_premium</mat-icon>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  `,
})
export class SeasonPassView {
  readonly gameState = inject(GameStateService);
  readonly sound = inject(SoundService);

  readonly selectedRange = signal<string>('all');

  readonly tierRangeTabs = [
    { id: 'all', label: 'Tous (1-50)' },
    { id: '1-10', label: 'Paliers 1-10' },
    { id: '11-20', label: 'Paliers 11-20' },
    { id: '21-30', label: 'Paliers 21-30' },
    { id: '31-40', label: 'Paliers 31-40' },
    { id: '41-50', label: 'Paliers 41-50' },
    { id: 'milestones', label: 'Paliers Majeurs ★' },
    { id: 'unclaimed', label: 'À Réclamer' },
  ];

  readonly totalTiers = computed(() => this.gameState.battlePassTiers().length);

  readonly displayedTiers = computed(() => {
    const all = this.gameState.battlePassTiers();
    const range = this.selectedRange();
    const curTier = this.gameState.seasonTier();
    const isPrem = this.gameState.isSeasonPassPremium();

    switch (range) {
      case '1-10':
        return all.filter(t => t.tier >= 1 && t.tier <= 10);
      case '11-20':
        return all.filter(t => t.tier >= 11 && t.tier <= 20);
      case '21-30':
        return all.filter(t => t.tier >= 21 && t.tier <= 30);
      case '31-40':
        return all.filter(t => t.tier >= 31 && t.tier <= 40);
      case '41-50':
        return all.filter(t => t.tier >= 41 && t.tier <= 50);
      case 'milestones':
        return all.filter(t => t.tier % 10 === 0 || t.tier === 25 || t.tier === 50);
      case 'unclaimed':
        return all.filter(t => {
          if (t.tier > curTier) return false;
          const freeUnclaimed = !t.isFreeClaimed;
          const premUnclaimed = isPrem && !t.isPremiumClaimed;
          return freeUnclaimed || premUnclaimed;
        });
      default:
        return all;
    }
  });

  readonly hasUnclaimedRewards = computed(() => {
    const curTier = this.gameState.seasonTier();
    const isPrem = this.gameState.isSeasonPassPremium();
    return this.gameState.battlePassTiers().some(t => {
      if (t.tier > curTier) return false;
      return !t.isFreeClaimed || (isPrem && !t.isPremiumClaimed);
    });
  });

  getProgressPercent(): number {
    return Math.min(100, Math.round((this.gameState.seasonTier() / this.totalTiers()) * 100));
  }

  nextTierXpRemaining(): number {
    const curTier = this.gameState.seasonTier();
    const tiers = this.gameState.battlePassTiers();
    if (curTier >= tiers.length) return 0;
    const nextTierObj = tiers[curTier];
    if (!nextTierObj) return 0;
    return Math.max(0, nextTierObj.xpRequired - this.gameState.seasonXp());
  }

  buyPremiumPass() {
    if (this.gameState.gems() < 500) {
      return;
    }
    this.gameState.addGems(-500);
    this.gameState.isSeasonPassPremium.set(true);
    this.sound.playVictory();
  }

  claimReward(tierNumber: number, type: 'free' | 'premium') {
    const success = this.gameState.claimBattlePassReward(tierNumber, type);
    if (success) {
      this.sound.playVictory();
    }
  }

  claimAll() {
    const count = this.gameState.claimAllBattlePassRewards();
    if (count > 0) {
      this.sound.playVictory();
    }
  }
}
