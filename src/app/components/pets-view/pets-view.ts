import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { GameStateService } from '../../services/game-state';
import { SoundService } from '../../services/sound';
import { CardRarity } from '../../models/game.model';

@Component({
  selector: 'app-pets-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-6 space-y-6">
      
      <!-- HERO HEADER -->
      <div class="bg-[#120f0c] border border-[#3a2f23] rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div class="absolute -right-12 -top-12 w-64 h-64 bg-[#d4af37]/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-cinzel font-bold bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/40 tracking-wider">
                SYSTÈME DE COMPAGNONS
              </span>
              <span class="text-xs text-[#8b6b43] font-mono">• Multiplicateur de Dégâts Actif</span>
            </div>
            <h1 class="font-cinzel text-3xl md:text-4xl font-black text-[#e0dcc7] tracking-tight">
              Ménagerie & Animaux de Compagnie
            </h1>
            <p class="text-sm text-[#a89b88] max-w-3xl leading-relaxed">
              Vos fidèles familiers vous accompagnent dans l'Arène ! Chaque animal de compagnie déploie une bénédiction
              qui <strong class="text-[#d4af37]">multiplie tous vos dégâts</strong> (sorts, attaques de créatures et ultimes)
              en fonction de sa <strong class="text-[#d4af37]">rareté</strong> et de son <strong class="text-[#d4af37]">niveau d'harmonie</strong>.
            </p>
          </div>

          <!-- Active Pet Quick Summary Box -->
          @if (gameState.equippedPet(); as activePet) {
            <div class="bg-[#1a1612] border-2 rounded-2xl p-4 min-w-[260px] shadow-xl flex items-center gap-4 transition-all"
              [style.border-color]="getRarityBorderColor(activePet.rarity)">
              <div class="w-18 h-18 rounded-xl flex items-center justify-center text-3xl shadow-inner relative overflow-hidden border"
                [style.border-color]="getRarityBorderColor(activePet.rarity)"
                [style.background]="getRarityGradient(activePet.rarity)">
                @if (activePet.imageUrl) {
                  <img
                    [src]="activePet.imageUrl"
                    [alt]="activePet.name"
                    class="w-full h-full object-cover"
                    referrerpolicy="no-referrer" />
                } @else {
                  <mat-icon class="text-3xl text-[#e0dcc7]">{{ activePet.icon }}</mat-icon>
                }
                <span class="absolute bottom-0.5 right-0.5 px-1.5 py-0.2 bg-black/85 rounded text-[9px] font-mono text-[#d4af37] border border-[#d4af37]/40 z-10">
                  Niv.{{ activePet.level }}
                </span>
              </div>
              <div class="space-y-1">
                <div class="flex items-center gap-1.5">
                  <span class="font-cinzel font-bold text-sm text-[#e0dcc7]">{{ activePet.name }}</span>
                  <span class="px-1.5 py-0.2 text-[9px] font-bold rounded uppercase"
                    [style.background]="getRarityBadgeBg(activePet.rarity)"
                    [style.color]="getRarityBadgeColor(activePet.rarity)">
                    {{ activePet.rarity }}
                  </span>
                </div>
                <div class="font-mono text-sm font-black text-[#4dff88] flex items-center gap-1">
                  <span>Dégâts x{{ activePet.totalMultiplier.toFixed(2) }}</span>
                  <span class="text-xs text-[#d4af37]">(+{{ gameState.activePetBonusPct() }}%)</span>
                </div>
                <p class="text-[10px] text-[#8b6b43] italic truncate max-w-[170px]">{{ activePet.specialSkillDesc }}</p>
              </div>
            </div>
          } @else {
            <div class="bg-[#1a1612] border border-dashed border-[#8b6b43]/50 rounded-2xl p-4 min-w-[260px] flex items-center gap-3 text-center justify-center">
              <mat-icon class="text-2xl text-[#8b6b43]">pets</mat-icon>
              <div class="text-left">
                <div class="text-xs font-cinzel font-bold text-[#e0dcc7]">Aucun Compagnon Équipé</div>
                <div class="text-[10px] text-[#8b6b43]">Vos attaques infligent des dégâts normaux (x1.00)</div>
              </div>
            </div>
          }
        </div>

        <!-- Rarity Multiplier Scale Reference Strip -->
        <div class="mt-6 pt-4 border-t border-[#3a2f23] grid grid-cols-2 sm:grid-cols-5 gap-2">
          <div class="bg-[#1a1612] px-3 py-2 rounded-xl border border-white/10 flex flex-col items-center text-center">
            <span class="text-[10px] uppercase font-bold text-gray-400">Commun</span>
            <span class="font-mono text-xs font-bold text-gray-200">Base x1.15</span>
            <span class="text-[10px] text-[#8b6b43]">+15% Dégâts</span>
          </div>
          <div class="bg-[#1a1612] px-3 py-2 rounded-xl border border-[#3b82f6]/30 flex flex-col items-center text-center">
            <span class="text-[10px] uppercase font-bold text-[#60a5fa]">Rare</span>
            <span class="font-mono text-xs font-bold text-[#93c5fd]">Base x1.30</span>
            <span class="text-[10px] text-[#60a5fa]">+30% Dégâts</span>
          </div>
          <div class="bg-[#1a1612] px-3 py-2 rounded-xl border border-[#a855f7]/30 flex flex-col items-center text-center">
            <span class="text-[10px] uppercase font-bold text-[#c084fc]">Épique</span>
            <span class="font-mono text-xs font-bold text-[#d8b4fe]">Base x1.50</span>
            <span class="text-[10px] text-[#c084fc]">+50% Dégâts</span>
          </div>
          <div class="bg-[#1a1612] px-3 py-2 rounded-xl border border-[#f59e0b]/40 flex flex-col items-center text-center shadow-[0_0_12px_rgba(245,158,11,0.15)]">
            <span class="text-[10px] uppercase font-bold text-[#fbbf24]">Légendaire</span>
            <span class="font-mono text-xs font-bold text-[#fde047]">Base x1.80</span>
            <span class="text-[10px] text-[#fbbf24]">+80% Dégâts</span>
          </div>
          <div class="bg-[#1a1612] px-3 py-2 rounded-xl border border-[#ef4444]/40 flex flex-col items-center text-center shadow-[0_0_15px_rgba(239,68,68,0.2)]">
            <span class="text-[10px] uppercase font-bold text-[#f87171]">Mythique</span>
            <span class="font-mono text-xs font-bold text-[#fca5a5]">Base x2.25</span>
            <span class="text-[10px] text-[#f87171]">+125% Dégâts</span>
          </div>
        </div>
      </div>

      <!-- FILTER TABS -->
      <div class="flex items-center justify-between gap-4 flex-wrap">
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            (click)="selectedRarityFilter.set('all')"
            class="px-3.5 py-1.5 rounded-xl font-cinzel text-xs font-bold transition-all whitespace-nowrap border"
            [class.bg-[#d4af37]_text-black_border-[#d4af37]_shadow-md]="selectedRarityFilter() === 'all'"
            [class.bg-[#120f0c]_text-[#8b6b43]_border-[#3a2f23]_hover:text-[#e0dcc7]]="selectedRarityFilter() !== 'all'">
            Tous ({{ gameState.pets().length }})
          </button>
          <button
            (click)="selectedRarityFilter.set('common')"
            class="px-3.5 py-1.5 rounded-xl font-cinzel text-xs font-bold transition-all whitespace-nowrap border"
            [class.bg-gray-300_text-black_border-white_shadow-md]="selectedRarityFilter() === 'common'"
            [class.bg-[#120f0c]_text-[#8b6b43]_border-[#3a2f23]_hover:text-[#e0dcc7]]="selectedRarityFilter() !== 'common'">
            Communs
          </button>
          <button
            (click)="selectedRarityFilter.set('rare')"
            class="px-3.5 py-1.5 rounded-xl font-cinzel text-xs font-bold transition-all whitespace-nowrap border"
            [class.bg-blue-600_text-white_border-blue-400_shadow-md]="selectedRarityFilter() === 'rare'"
            [class.bg-[#120f0c]_text-[#8b6b43]_border-[#3a2f23]_hover:text-[#e0dcc7]]="selectedRarityFilter() !== 'rare'">
            Rares
          </button>
          <button
            (click)="selectedRarityFilter.set('epic')"
            class="px-3.5 py-1.5 rounded-xl font-cinzel text-xs font-bold transition-all whitespace-nowrap border"
            [class.bg-purple-700_text-white_border-purple-400_shadow-md]="selectedRarityFilter() === 'epic'"
            [class.bg-[#120f0c]_text-[#8b6b43]_border-[#3a2f23]_hover:text-[#e0dcc7]]="selectedRarityFilter() !== 'epic'">
            Épiques
          </button>
          <button
            (click)="selectedRarityFilter.set('legendary')"
            class="px-3.5 py-1.5 rounded-xl font-cinzel text-xs font-bold transition-all whitespace-nowrap border"
            [class.bg-amber-600_text-black_border-amber-400_shadow-md]="selectedRarityFilter() === 'legendary'"
            [class.bg-[#120f0c]_text-[#8b6b43]_border-[#3a2f23]_hover:text-[#e0dcc7]]="selectedRarityFilter() !== 'legendary'">
            Légendaires
          </button>
          <button
            (click)="selectedRarityFilter.set('mythic')"
            class="px-3.5 py-1.5 rounded-xl font-cinzel text-xs font-bold transition-all whitespace-nowrap border"
            [class.bg-red-700_text-white_border-red-400_shadow-md]="selectedRarityFilter() === 'mythic'"
            [class.bg-[#120f0c]_text-[#8b6b43]_border-[#3a2f23]_hover:text-[#e0dcc7]]="selectedRarityFilter() !== 'mythic'">
            Mythiques
          </button>
        </div>

        <!-- Currencies Quick Pill -->
        <div class="flex items-center gap-2.5">
          <div class="currency-pill-gold flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono">
            <mat-icon class="text-sm text-[#ffd700] currency-gold-shine">monetization_on</mat-icon>
            <span class="text-[#ffd700] font-bold tabular-nums">{{ gameState.gold() }} Or</span>
          </div>
          <div class="currency-pill-gem flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono">
            <mat-icon class="text-sm text-[#60a5fa] currency-gem-shine">diamond</mat-icon>
            <span class="text-[#93c5fd] font-bold tabular-nums">{{ gameState.gems() }} Gemmes</span>
          </div>
        </div>
      </div>

      <!-- PETS CATALOG GRID -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        @for (pet of filteredPets(); track pet.id) {
          <div
            class="bg-[#120f0c] border-2 rounded-2xl p-5 flex flex-col justify-between shadow-xl transition-all duration-200 relative overflow-hidden"
            [style.border-color]="getRarityBorderColor(pet.rarity)"
            [class.ring-2]="pet.isEquipped && pet.isUnlocked"
            [class.ring-[#d4af37]]="pet.isEquipped && pet.isUnlocked"
            [class.shadow-[0_0_20px_rgba(212,175,55,0.25)]]="pet.isEquipped && pet.isUnlocked">
            
            <!-- Top Card Header: Icon, Name, Multiplier Pill -->
            <div class="space-y-3">
              <div class="flex items-start justify-between gap-3">
                <div class="flex items-center gap-3">
                  <div
                    class="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg border-2 overflow-hidden shrink-0 relative group"
                    [style.border-color]="getRarityBorderColor(pet.rarity)"
                    [style.background]="getRarityGradient(pet.rarity)">
                    @if (pet.imageUrl) {
                      <img
                        [src]="pet.imageUrl"
                        [alt]="pet.name"
                        class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        [class.grayscale]="!pet.isUnlocked"
                        [class.opacity-70]="!pet.isUnlocked"
                        referrerpolicy="no-referrer" />
                    } @else {
                      <mat-icon class="text-3xl text-[#e0dcc7]">{{ pet.icon }}</mat-icon>
                    }
                    @if (!pet.isUnlocked) {
                      <div class="absolute inset-0 bg-black/35 flex items-center justify-center">
                        <mat-icon class="text-lg text-[#d4af37]/90">lock</mat-icon>
                      </div>
                    }
                  </div>
                  <div>
                    <div class="flex items-center gap-1.5 flex-wrap">
                      <h3 class="font-cinzel font-bold text-base text-[#e0dcc7]">{{ pet.name }}</h3>
                      @if (pet.isEquipped && pet.isUnlocked) {
                        <span class="px-1.5 py-0.5 bg-[#d4af37] text-black font-cinzel font-black text-[9px] rounded uppercase shadow">
                          ÉQUIPÉ
                        </span>
                      }
                    </div>
                    <div class="flex items-center gap-2 mt-0.5">
                      <span class="text-[10px] font-bold uppercase tracking-wider"
                        [style.color]="getRarityTextColor(pet.rarity)">
                        {{ pet.rarity }}
                      </span>
                      <span class="text-[10px] text-[#8b6b43] font-mono">• {{ pet.species }}</span>
                    </div>
                  </div>
                </div>

                <!-- Element Pill -->
                <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#1a1612] text-[#c5a880] border border-[#3a2f23] uppercase">
                  {{ pet.element }}
                </span>
              </div>

              <!-- DAMAGE MULTIPLIER SHOWCASE BANNER -->
              <div class="bg-[#1a1612] border border-[#3a2f23] rounded-xl p-3 flex items-center justify-between">
                <div>
                  <span class="text-[10px] uppercase font-cinzel font-bold text-[#8b6b43] block">Multiplicateur Actif</span>
                  <span class="font-mono text-xl font-black" [style.color]="getRarityTextColor(pet.rarity)">
                    x{{ pet.totalMultiplier.toFixed(2) }}
                  </span>
                </div>
                <div class="text-right">
                  <span class="text-[10px] uppercase font-cinzel font-bold text-[#8b6b43] block">Bonus de Combat</span>
                  <span class="font-mono text-sm font-bold text-[#4dff88]">
                    +{{ Math.round((pet.totalMultiplier - 1) * 100) }}% Dégâts
                  </span>
                </div>
              </div>

              <!-- Lore & Ability -->
              <p class="text-xs text-[#a89b88] leading-relaxed line-clamp-2">
                {{ pet.description }}
              </p>

              <div class="bg-[#0a0a0c] border border-[#262018] rounded-lg p-2.5 space-y-1">
                <div class="flex items-center gap-1 text-[11px] font-cinzel font-bold text-[#d4af37]">
                  <mat-icon class="text-xs text-[#d4af37]">flash_on</mat-icon>
                  <span>Aura : {{ pet.specialSkillName }}</span>
                </div>
                <p class="text-[11px] text-[#8b6b43] leading-snug">
                  {{ pet.specialSkillDesc }}
                </p>
              </div>

              <!-- Affinity Leveling Progress (Only for unlocked pets) -->
              @if (pet.isUnlocked) {
                <div class="space-y-1 pt-1">
                  <div class="flex items-center justify-between text-[10px] font-mono">
                    <span class="text-[#c5a880] font-bold">Niveau d'Affinité {{ pet.level }} / 10</span>
                    <span class="text-[#8b6b43]">
                      @if (pet.level >= 10) {
                        Harmonie Maximale
                      } @else {
                        {{ pet.affinity }} / {{ pet.affinityRequired }} EXP
                      }
                    </span>
                  </div>
                  <div class="w-full h-2 bg-[#1a1612] rounded-full border border-[#3a2f23] overflow-hidden">
                    <div
                      class="h-full bg-gradient-to-r from-[#d4af37] to-[#f59e0b] rounded-full transition-all duration-300"
                      [style.width.%]="pet.level >= 10 ? 100 : (pet.affinity / pet.affinityRequired) * 100"></div>
                  </div>
                </div>
              }
            </div>

            <!-- ACTION BUTTONS / UPGRADES -->
            <div class="mt-4 pt-3 border-t border-[#3a2f23] space-y-2">
              @if (pet.isUnlocked) {
                <!-- Training Controls (Nourrir / Élever) -->
                @if (pet.level < 10) {
                  <div class="grid grid-cols-2 gap-2">
                    <button
                      (click)="feedPet(pet.id, 'gold')"
                      class="medieval-btn px-2.5 py-1.5 bg-[#1a1612] hover:bg-[#262018] text-[#e0dcc7] rounded-lg border border-[#3a2f23] text-xs font-cinzel font-semibold flex items-center justify-center gap-1 transition-all"
                      [disabled]="gameState.gold() < pet.goldUpgradeCost"
                      [class.opacity-40]="gameState.gold() < pet.goldUpgradeCost">
                      <mat-icon class="text-xs text-[#d4af37]">restaurant</mat-icon>
                      <span>Nourrir ({{ pet.goldUpgradeCost }} Or)</span>
                    </button>
                    <button
                      (click)="feedPet(pet.id, 'gems')"
                      class="medieval-btn px-2.5 py-1.5 bg-[#1a1612] hover:bg-[#262018] text-[#e0dcc7] rounded-lg border border-[#3a2f23] text-xs font-cinzel font-semibold flex items-center justify-center gap-1 transition-all"
                      [disabled]="gameState.gems() < pet.gemUpgradeCost"
                      [class.opacity-40]="gameState.gems() < pet.gemUpgradeCost">
                      <mat-icon class="text-xs text-[#60a5fa]">diamond</mat-icon>
                      <span>Essence ({{ pet.gemUpgradeCost }} Gemmes)</span>
                    </button>
                  </div>
                }

                <!-- Equip / Unequip Toggle Button -->
                @if (pet.isEquipped) {
                  <button
                    (click)="unequipPet(pet.id)"
                    class="w-full py-2 bg-[#241515] hover:bg-[#381a1a] text-[#ff9999] border border-[#5c2424] rounded-xl font-cinzel font-bold text-xs flex items-center justify-center gap-1.5 transition-all">
                    <mat-icon class="text-sm">close</mat-icon>
                    <span>Renvoyer à la Ménagerie</span>
                  </button>
                } @else {
                  <button
                    (click)="equipPet(pet.id)"
                    class="w-full py-2 bg-gradient-to-r from-[#d4af37] to-[#f59e0b] hover:from-[#e5bd47] hover:to-[#fbbf24] text-black border border-[#d4af37] rounded-xl font-cinzel font-black text-xs flex items-center justify-center gap-1.5 shadow-lg transition-all">
                    <mat-icon class="text-sm">pets</mat-icon>
                    <span>Équiper pour le Combat</span>
                  </button>
                }
              } @else {
                <!-- Unlock / Adopt Buttons -->
                <div class="space-y-1.5">
                  <div class="text-[11px] text-center text-[#8b6b43] font-cinzel">Apprivoiser ce Compagnon</div>
                  <div class="grid grid-cols-2 gap-2">
                    @if (pet.unlockCostGold) {
                      <button
                        (click)="unlockPet(pet.id, 'gold')"
                        class="w-full py-2 bg-[#1a1612] hover:bg-[#262018] text-[#d4af37] border border-[#d4af37]/40 rounded-xl font-cinzel font-bold text-xs flex items-center justify-center gap-1 transition-all"
                        [disabled]="gameState.gold() < pet.unlockCostGold"
                        [class.opacity-50]="gameState.gold() < pet.unlockCostGold">
                        <mat-icon class="text-xs">savings</mat-icon>
                        <span>{{ pet.unlockCostGold }} Or</span>
                      </button>
                    }
                    @if (pet.unlockCostGems) {
                      <button
                        (click)="unlockPet(pet.id, 'gems')"
                        class="w-full py-2 bg-[#1a1612] hover:bg-[#262018] text-[#60a5fa] border border-[#60a5fa]/40 rounded-xl font-cinzel font-bold text-xs flex items-center justify-center gap-1 transition-all"
                        [disabled]="gameState.gems() < pet.unlockCostGems"
                        [class.opacity-50]="gameState.gems() < pet.unlockCostGems">
                        <mat-icon class="text-xs">diamond</mat-icon>
                        <span>{{ pet.unlockCostGems }} Gemmes</span>
                      </button>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        }
      </div>

    </div>
  `,
})
export class PetsView {
  readonly gameState = inject(GameStateService);
  readonly sound = inject(SoundService);
  protected readonly Math = Math;

  readonly selectedRarityFilter = signal<'all' | CardRarity>('all');

  readonly filteredPets = computed(() => {
    const list = this.gameState.pets();
    const filter = this.selectedRarityFilter();
    if (filter === 'all') return list;
    return list.filter(p => p.rarity === filter);
  });

  equipPet(petId: string) {
    this.gameState.equipPet(petId);
  }

  unequipPet(petId: string) {
    this.gameState.unequipPet(petId);
  }

  unlockPet(petId: string, currency: 'gold' | 'gems') {
    this.gameState.unlockPet(petId, currency);
  }

  feedPet(petId: string, resource: 'gold' | 'gems') {
    this.gameState.feedAndTrainPet(petId, resource);
  }

  getRarityBorderColor(rarity: CardRarity): string {
    switch (rarity) {
      case 'mythic':
        return '#ef4444';
      case 'legendary':
        return '#f59e0b';
      case 'epic':
        return '#a855f7';
      case 'rare':
        return '#3b82f6';
      default:
        return '#4b5563';
    }
  }

  getRarityTextColor(rarity: CardRarity): string {
    switch (rarity) {
      case 'mythic':
        return '#f87171';
      case 'legendary':
        return '#fbbf24';
      case 'epic':
        return '#c084fc';
      case 'rare':
        return '#60a5fa';
      default:
        return '#9ca3af';
    }
  }

  getRarityGradient(rarity: CardRarity): string {
    switch (rarity) {
      case 'mythic':
        return 'linear-gradient(135deg, #7f1d1d 0%, #450a0a 100%)';
      case 'legendary':
        return 'linear-gradient(135deg, #78350f 0%, #451a03 100%)';
      case 'epic':
        return 'linear-gradient(135deg, #581c87 0%, #3b0764 100%)';
      case 'rare':
        return 'linear-gradient(135deg, #1e3a8a 0%, #172554 100%)';
      default:
        return 'linear-gradient(135deg, #374151 0%, #1f2937 100%)';
    }
  }

  getRarityBadgeBg(rarity: CardRarity): string {
    switch (rarity) {
      case 'mythic':
        return '#ef444420';
      case 'legendary':
        return '#f59e0b20';
      case 'epic':
        return '#a855f720';
      case 'rare':
        return '#3b82f620';
      default:
        return '#9ca3af20';
    }
  }

  getRarityBadgeColor(rarity: CardRarity): string {
    switch (rarity) {
      case 'mythic':
        return '#ef4444';
      case 'legendary':
        return '#f59e0b';
      case 'epic':
        return '#a855f7';
      case 'rare':
        return '#3b82f6';
      default:
        return '#9ca3af';
    }
  }
}
