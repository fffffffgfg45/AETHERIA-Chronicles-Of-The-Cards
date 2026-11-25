import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { GameStateService } from '../../services/game-state';
import { SoundService } from '../../services/sound';
import { Card, CardRarity, Hero } from '../../models/game.model';
import { MatIconModule } from '@angular/material/icon';
import confetti from 'canvas-confetti';

interface PackType {
  id: string;
  name: string;
  priceGold?: number;
  priceGems?: number;
  cardCount: number;
  minRarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  icon: string;
  imageUrl?: string;
  color: string;
  description: string;
}

interface GemBundle {
  id: string;
  gems: number;
  priceEuro: string;
  bonusPercentage?: number;
  badge?: string;
  icon: string;
  imageUrl?: string;
  bonusGold?: number;
  bonusShards?: number;
}

type ShopTab = 'heroes' | 'resources' | 'relics' | 'boosters' | 'gem_vault' | 'cosmetics';

@Component({
  selector: 'app-shop-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div class="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      
      <!-- Shop Header Banner -->
      <div class="relative overflow-hidden bg-[#120f0c] border border-[#8b6b43]/50 rounded-2xl p-5 md:p-6 shadow-xl">
        <img
          src="/src/assets/images/shop_bazaar_banner_1795188690692.jpg"
          alt="Grand Bazar & Boutique Royale d'Aetheria"
          class="absolute inset-0 w-full h-full object-cover opacity-55"
          referrerpolicy="no-referrer" />
        <div class="absolute inset-0 bg-gradient-to-r from-[#0d0a07]/95 via-[#120f0c]/80 to-[#120f0c]/55 pointer-events-none"></div>

        <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 class="font-cinzel-dec text-2xl md:text-3xl font-black text-[#f3ead8] drop-shadow flex items-center gap-2.5">
              <mat-icon class="text-[#d4af37] text-3xl">store</mat-icon>
              Grand Bazar & Boutique Royale d'Aetheria
            </h1>
            <p class="text-[#c5a880] text-xs font-serif mt-1 max-w-2xl">
              Débloquez de nouveaux héros légendaires, approvisionnez votre laboratoire en potions et accélérateurs, et enrichissez vos grimoires.
            </p>
          </div>

          <!-- Currencies Bar -->
          <div class="flex flex-wrap items-center gap-2.5 bg-[#120f0c]/90 px-3 py-2 rounded-xl border border-[#3a2f23] self-start md:self-auto backdrop-blur-sm">
            <div class="currency-pill-gold flex items-center gap-1.5 font-mono tabular-nums font-bold text-xs md:text-sm">
              <span class="currency-gold-coin text-xs">✦</span>
              <span class="currency-gold-shine font-extrabold">{{ gameState.gold() }} Or</span>
            </div>
            <div class="currency-pill-gem flex items-center gap-1.5 font-mono tabular-nums font-bold text-xs md:text-sm">
              <span class="currency-gem-facet text-xs">⬥</span>
              <span class="currency-gem-shine font-extrabold">{{ gameState.gems() }} Gemmes</span>
            </div>
            <div class="flex items-center gap-1 font-mono tabular-nums font-bold text-[#c084fc] text-xs md:text-sm px-2 py-0.5 rounded-lg bg-[#241236]/50 border border-[#a855f7]/35">
              <mat-icon class="text-xs">bolt</mat-icon>
              <span>{{ gameState.shards() }} Éclats</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Fair-Play & Ethics Guarantee Banner -->
      <div class="p-3.5 bg-[#0d0b09] border border-[#8b6b43]/40 rounded-2xl flex items-center gap-3.5 shadow-md">
        <div class="w-10 h-10 rounded-xl bg-[#1a1612] border border-[#d4af37]/60 flex items-center justify-center shrink-0">
          <mat-icon class="text-[#d4af37] text-xl">balance</mat-icon>
        </div>
        <div class="flex-1 text-xs">
          <div class="font-cinzel font-bold text-[#e0dcc7] flex items-center gap-1.5">
            <span>Charte Éthique & Équilibre Compétitif</span>
            <span class="text-[10px] bg-[#1a1612] px-2 py-0.5 rounded text-emerald-400 font-mono border border-emerald-500/30">100% Fair-Play</span>
          </div>
          <p class="text-[#8b6b43] text-[11px] mt-0.5">
            Tous les héros, cartes et compétences peuvent être obtenus gratuitement par le jeu régulier. Les achats permettent de débloquer du contenu plus rapidement et d'acquérir des parures cosmétiques exclusives sans aucun avantage statistique démesuré en partie classée.
          </p>
        </div>
      </div>

      <!-- Shop Navigation Tabs -->
      <div class="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          (click)="activeTab.set('heroes')"
          class="medieval-btn px-4 py-2 rounded-xl border text-xs font-cinzel font-bold transition-all flex items-center gap-2 shrink-0"
          [class.bg-[#1a1612]]="activeTab() === 'heroes'"
          [class.border-[#d4af37]]="activeTab() === 'heroes'"
          [class.text-[#d4af37]]="activeTab() === 'heroes'"
          [class.bg-[#0d0b09]]="activeTab() !== 'heroes'"
          [class.border-[#3a2f23]]="activeTab() !== 'heroes'"
          [class.text-[#8b6b43]]="activeTab() !== 'heroes'">
          <mat-icon class="text-sm">shield_moon</mat-icon>
          Héros & Champions
        </button>

        <button
          (click)="activeTab.set('resources')"
          class="medieval-btn px-4 py-2 rounded-xl border text-xs font-cinzel font-bold transition-all flex items-center gap-2 shrink-0"
          [class.bg-[#1a1612]]="activeTab() === 'resources'"
          [class.border-[#d4af37]]="activeTab() === 'resources'"
          [class.text-[#d4af37]]="activeTab() === 'resources'"
          [class.bg-[#0d0b09]]="activeTab() !== 'resources'"
          [class.border-[#3a2f23]]="activeTab() !== 'resources'"
          [class.text-[#8b6b43]]="activeTab() !== 'resources'">
          <mat-icon class="text-sm">science</mat-icon>
          Potions & Ressources
        </button>

        <button
          (click)="activeTab.set('relics')"
          class="medieval-btn px-4 py-2 rounded-xl border text-xs font-cinzel font-bold transition-all flex items-center gap-2 shrink-0"
          [class.bg-[#1a1612]]="activeTab() === 'relics'"
          [class.border-[#d4af37]]="activeTab() === 'relics'"
          [class.text-[#d4af37]]="activeTab() === 'relics'"
          [class.bg-[#0d0b09]]="activeTab() !== 'relics'"
          [class.border-[#3a2f23]]="activeTab() !== 'relics'"
          [class.text-[#8b6b43]]="activeTab() !== 'relics'">
          <mat-icon class="text-sm">auto_awesome</mat-icon>
          Coffres de Reliques
        </button>

        <button
          (click)="activeTab.set('boosters')"
          class="medieval-btn px-4 py-2 rounded-xl border text-xs font-cinzel font-bold transition-all flex items-center gap-2 shrink-0"
          [class.bg-[#1a1612]]="activeTab() === 'boosters'"
          [class.border-[#d4af37]]="activeTab() === 'boosters'"
          [class.text-[#d4af37]]="activeTab() === 'boosters'"
          [class.bg-[#0d0b09]]="activeTab() !== 'boosters'"
          [class.border-[#3a2f23]]="activeTab() !== 'boosters'"
          [class.text-[#8b6b43]]="activeTab() !== 'boosters'">
          <mat-icon class="text-sm">inventory_2</mat-icon>
          Paquets de Cartes
        </button>

        <button
          (click)="activeTab.set('gem_vault')"
          class="medieval-btn px-4 py-2 rounded-xl border text-xs font-cinzel font-bold transition-all flex items-center gap-2 shrink-0"
          [class.bg-[#1a1612]]="activeTab() === 'gem_vault'"
          [class.border-[#d4af37]]="activeTab() === 'gem_vault'"
          [class.text-[#d4af37]]="activeTab() === 'gem_vault'"
          [class.bg-[#0d0b09]]="activeTab() !== 'gem_vault'"
          [class.border-[#3a2f23]]="activeTab() !== 'gem_vault'"
          [class.text-[#8b6b43]]="activeTab() !== 'gem_vault'">
          <mat-icon class="text-sm">diamond</mat-icon>
          Chambre des Gemmes & Or
        </button>

        <button
          (click)="activeTab.set('cosmetics')"
          class="medieval-btn px-4 py-2 rounded-xl border text-xs font-cinzel font-bold transition-all flex items-center gap-2 shrink-0"
          [class.bg-[#1a1612]]="activeTab() === 'cosmetics'"
          [class.border-[#d4af37]]="activeTab() === 'cosmetics'"
          [class.text-[#d4af37]]="activeTab() === 'cosmetics'"
          [class.bg-[#0d0b09]]="activeTab() !== 'cosmetics'"
          [class.border-[#3a2f23]]="activeTab() !== 'cosmetics'"
          [class.text-[#8b6b43]]="activeTab() !== 'cosmetics'">
          <mat-icon class="text-sm">checkroom</mat-icon>
          Garde-Robe & Cosmétiques
        </button>
      </div>

      <!-- TAB 1: HEROES & CHAMPIONS -->
      @if (activeTab() === 'heroes') {
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="font-cinzel text-base font-bold text-[#c5a880] flex items-center gap-2">
              <mat-icon class="text-[#d4af37]">military_tech</mat-icon>
              Recrutement des Héros & Maîtres de Classes
            </h2>
            <span class="text-xs text-[#8b6b43]">3 classes de départ + champions déblocables</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            @for (h of gameState.heroes(); track h.id) {
              <div
                class="bg-[#120f0c] border rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4 relative overflow-hidden transition-all"
                [class.border-[#d4af37]]="h.isUnlocked"
                [class.border-[#3a2f23]]="!h.isUnlocked">
                
                @if (h.isUnlocked) {
                  <div class="absolute top-3 right-3 bg-[#0d2618] border border-emerald-500/50 text-emerald-400 text-[10px] font-cinzel font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <mat-icon class="text-[12px]">check</mat-icon> Débloqué
                  </div>
                } @else {
                  <div class="absolute top-3 right-3 bg-[#261010] border border-[#ff4d4d]/50 text-[#ff4d4d] text-[10px] font-cinzel font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <mat-icon class="text-[12px]">lock</mat-icon> À débloquer
                  </div>
                }

                <div class="space-y-3">
                  <!-- Hero Avatar & Name -->
                  <div class="flex items-center gap-3">
                    <div class="w-16 h-16 rounded-xl bg-[#0d0b09] border border-[#8b6b43] flex items-center justify-center shadow-lg overflow-hidden shrink-0">
                      @if (h.imageUrl) {
                        <img
                          [src]="h.imageUrl"
                          [alt]="h.name"
                          class="w-full h-full object-cover"
                          referrerpolicy="no-referrer" />
                      } @else {
                        <mat-icon class="text-3xl text-[#c5a880]">{{ h.avatarIcon }}</mat-icon>
                      }
                    </div>
                    <div>
                      <h3 class="font-cinzel font-bold text-sm text-[#e0dcc7]">{{ h.name }}</h3>
                      <div class="text-xs text-[#d4af37] font-medium">{{ h.title }}</div>
                      <div class="text-[10px] text-[#8b6b43] italic">{{ h.archetype }}</div>
                    </div>
                  </div>

                  <!-- Base Stats Row -->
                  <div class="grid grid-cols-4 gap-1.5 p-2 bg-[#0d0b09] border border-[#3a2f23] rounded-xl text-center text-[10px] font-mono">
                    <div>
                      <span class="text-[#6b5a45] block">PV</span>
                      <span class="text-[#4dff88] font-bold">{{ h.baseHp }}</span>
                    </div>
                    <div>
                      <span class="text-[#6b5a45] block">ARM</span>
                      <span class="text-[#eab308] font-bold">{{ h.baseArmor }}</span>
                    </div>
                    <div>
                      <span class="text-[#6b5a45] block">ATQ</span>
                      <span class="text-[#ff4d4d] font-bold">{{ h.baseAttack }}</span>
                    </div>
                    <div>
                      <span class="text-[#6b5a45] block">ENR</span>
                      <span class="text-[#4d94ff] font-bold">+{{ h.energyPerTurn }}</span>
                    </div>
                  </div>

                  <!-- Playstyle & Powers -->
                  <div class="space-y-2 text-xs">
                    <div class="p-2.5 bg-[#1a1612] rounded-xl border border-[#3a2f23] text-[11px] leading-relaxed">
                      <div class="text-[#d4af37] font-cinzel font-bold flex items-center gap-1 mb-0.5">
                        <mat-icon class="text-xs">{{ h.passiveIcon || 'auto_awesome' }}</mat-icon>
                        {{ h.passiveName }}
                      </div>
                      <p class="text-[#8b6b43] line-clamp-2">{{ h.passiveDesc }}</p>
                    </div>

                    <div class="p-2.5 bg-[#1a1612] rounded-xl border border-[#3a2f23] text-[11px] leading-relaxed">
                      <div class="text-[#ff4d4d] font-cinzel font-bold flex items-center justify-between mb-0.5">
                        <span class="flex items-center gap-1">
                          <mat-icon class="text-xs">{{ h.ultimateIcon }}</mat-icon>
                          {{ h.ultimateName }}
                        </span>
                        <span class="text-[9px] font-mono text-[#8b6b43]">{{ h.ultimateCost }} Énergie</span>
                      </div>
                      <p class="text-[#8b6b43] line-clamp-2">{{ h.ultimateDesc }}</p>
                    </div>
                  </div>
                </div>

                <!-- Purchase / Selection Buttons -->
                <div class="pt-2 border-t border-[#3a2f23]">
                  @if (h.isUnlocked) {
                    <button
                      (click)="gameState.selectHero(h.id)"
                      class="medieval-btn w-full py-2 bg-[#1a1612] text-[#d4af37] font-cinzel font-bold text-xs rounded-xl border border-[#8b6b43] flex items-center justify-center gap-1.5">
                      <mat-icon class="text-xs">check_circle</mat-icon>
                      Sélectionner ce Héros
                    </button>
                  } @else {
                    <div class="space-y-2">
                      <div class="grid grid-cols-2 gap-2">
                        @if (h.goldUnlockCost) {
                          <button
                            (click)="buyHero(h, 'gold')"
                            [disabled]="gameState.gold() < h.goldUnlockCost"
                            class="medieval-btn py-2 bg-[#1a1612] hover:bg-[#251e18] font-cinzel font-bold text-xs rounded-xl border border-[#8b6b43] flex items-center justify-center gap-1.5"
                            [class.opacity-50]="gameState.gold() < h.goldUnlockCost">
                            <span class="currency-gold-coin text-xs">✦</span>
                            <span class="currency-gold-shine font-extrabold">{{ h.goldUnlockCost }} Or</span>
                          </button>
                        }
                        @if (h.gemUnlockCost) {
                          <button
                            (click)="buyHero(h, 'gems')"
                            [disabled]="gameState.gems() < h.gemUnlockCost"
                            class="crimson-btn py-2 text-white font-cinzel font-bold text-xs rounded-xl border border-[#ff4d4d] flex items-center justify-center gap-1.5"
                            [class.opacity-50]="gameState.gems() < h.gemUnlockCost">
                            <span class="currency-gem-facet text-xs">⬥</span>
                            <span class="currency-gem-shine font-extrabold">{{ h.gemUnlockCost }} Gemmes</span>
                          </button>
                        }
                      </div>

                      @if (h.realMoneyCost) {
                        <button
                          (click)="openRealMoneyModal('Pack Héros: ' + h.name, h.realMoneyCost, 0, 500, 3, h)"
                          class="w-full py-2 bg-[#0d0b09] hover:bg-[#16120e] text-[#c5a880] text-xs font-cinzel font-bold rounded-xl border border-[#3a2f23] flex items-center justify-center gap-1.5 transition-all">
                          <mat-icon class="text-xs text-[#d4af37]">local_offer</mat-icon>
                          Achat Direct : {{ h.realMoneyCost }} (+500 Or & 3 Éclats)
                        </button>
                      }
                    </div>
                  }
                </div>

              </div>
            }
          </div>
        </div>
      }

      <!-- TAB 2: POTIONS & RESOURCES -->
      @if (activeTab() === 'resources') {
        <div class="space-y-6">
          
          <!-- Combat Potions Section -->
          <div class="space-y-3">
            <h2 class="font-cinzel text-base font-bold text-[#c5a880] flex items-center gap-2">
              <mat-icon class="text-[#d4af37]">science</mat-icon>
              Élixirs de Combat & Potions d'Appui
            </h2>
            <p class="text-xs text-[#8b6b43]">Consommables stratégiques utilisables en duel pour soigner, booster le mana ou fortifier l'armure.</p>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              @for (potion of gameState.potions(); track potion.id) {
                <div class="bg-[#120f0c] border border-[#3a2f23] rounded-2xl p-4 shadow-xl flex flex-col justify-between space-y-3">
                  <div class="flex items-center gap-3">
                    <div
                      class="w-14 h-14 rounded-xl flex items-center justify-center border-2 shadow-inner shrink-0 treasure-image-shine bg-[#0d0a07]"
                      [style.borderColor]="potion.color">
                      @if (potion.imageUrl) {
                        <img
                          [src]="potion.imageUrl"
                          [alt]="potion.name"
                          class="w-full h-full object-cover rounded-[10px]"
                          referrerpolicy="no-referrer" />
                      } @else {
                        <mat-icon class="text-2xl" [style.color]="potion.color">{{ potion.icon }}</mat-icon>
                      }
                    </div>

                    <div class="flex-1 min-w-0">
                      <div class="flex items-center justify-between gap-1.5">
                        <h4 class="font-cinzel font-bold text-xs text-[#e0dcc7] truncate">{{ potion.name }}</h4>
                        <span class="font-mono text-[10px] text-[#4dff88] bg-[#0d2618] px-2 py-0.5 rounded border border-emerald-500/30 shrink-0">
                          x{{ potion.count }}
                        </span>
                      </div>
                      <p class="text-[11px] text-[#8b6b43] mt-0.5 line-clamp-2">{{ potion.description }}</p>
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-2 pt-2 border-t border-[#3a2f23]">
                    <button
                      (click)="buyPotion(potion.id, 1, 'gold')"
                      [disabled]="gameState.gold() < potion.goldCost"
                      class="medieval-btn py-1.5 text-xs font-cinzel font-bold rounded-lg border border-[#8b6b43] flex items-center justify-center gap-1"
                      [class.opacity-50]="gameState.gold() < potion.goldCost">
                      <span class="currency-gold-coin text-xs">✦</span>
                      <span class="currency-gold-shine font-extrabold">{{ potion.goldCost }} Or</span>
                    </button>

                    <button
                      (click)="buyPotion(potion.id, 1, 'gems')"
                      [disabled]="gameState.gems() < gemCostForPotion(potion.goldCost)"
                      class="crimson-btn py-1.5 text-xs font-cinzel font-bold rounded-lg border border-[#ff4d4d] flex items-center justify-center gap-1"
                      [class.opacity-50]="gameState.gems() < gemCostForPotion(potion.goldCost)">
                      <span class="currency-gem-facet text-xs">⬥</span>
                      <span class="currency-gem-shine font-extrabold">{{ gemCostForPotion(potion.goldCost) }}</span>
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Alchemy Crafting Reagents Section -->
          <div class="bg-[#120f0c] border border-[#3a2f23] rounded-2xl p-5 shadow-xl space-y-4">
            <div class="flex items-center justify-between pb-2 border-b border-[#3a2f23]">
              <div>
                <h3 class="font-cinzel text-sm font-bold text-[#c5a880] flex items-center gap-2">
                  <mat-icon class="text-[#a855f7]">bubble_chart</mat-icon>
                  Packs d'Ingrédients Alchimiques (Accélération de Craft)
                </h3>
                <p class="text-[11px] text-[#8b6b43]">Ingrédients pour concocter des potions de rang Supérieur et Épique dans votre laboratoire.</p>
              </div>
              <div class="flex items-center gap-3 font-mono text-[11px] text-[#c5a880]">
                <span class="flex items-center gap-1">
                  <img
                    src="/src/assets/images/reagent_herbs_bundle_1795188690757.jpg"
                    alt="Herbes"
                    class="w-5 h-5 rounded object-cover border border-emerald-500/50"
                    referrerpolicy="no-referrer" />
                  {{ gameState.alchemyResources().herbs }}
                </span>
                <span class="flex items-center gap-1">
                  <img
                    src="/src/assets/images/reagent_crystals_bundle_1795188691071.jpg"
                    alt="Cristaux"
                    class="w-5 h-5 rounded object-cover border border-sky-400/50"
                    referrerpolicy="no-referrer" />
                  {{ gameState.alchemyResources().crystals }}
                </span>
                <span class="flex items-center gap-1">
                  <img
                    src="/src/assets/images/reagent_essences_bundle_1795188691062.jpg"
                    alt="Essences"
                    class="w-5 h-5 rounded object-cover border border-purple-400/50"
                    referrerpolicy="no-referrer" />
                  {{ gameState.alchemyResources().essences }}
                </span>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="p-4 bg-[#1a1612] rounded-xl border border-[#3a2f23] hover:border-emerald-500/50 text-center space-y-3 transition-colors">
                <div class="w-20 h-20 mx-auto rounded-2xl border-2 border-emerald-500/50 bg-[#0d0a07] shadow-lg treasure-image-shine">
                  <img
                    src="/src/assets/images/reagent_herbs_bundle_1795188690757.jpg"
                    alt="Herbes des Brumes"
                    class="w-full h-full object-cover rounded-[14px]"
                    referrerpolicy="no-referrer" />
                </div>
                <div class="font-cinzel font-bold text-xs text-[#e0dcc7]">+20 Herbes des Brumes</div>
                <button
                  (click)="buyAlchemyReagent('herbs', 20, 30)"
                  [disabled]="gameState.gems() < 30"
                  class="crimson-btn w-full py-2 font-cinzel font-bold text-xs rounded-lg border border-[#ff4d4d] flex items-center justify-center gap-1.5"
                  [class.opacity-50]="gameState.gems() < 30">
                  <span class="currency-gem-facet text-xs">⬥</span>
                  <span class="currency-gem-shine font-extrabold">30 Gemmes</span>
                </button>
              </div>

              <div class="p-4 bg-[#1a1612] rounded-xl border border-[#3a2f23] hover:border-sky-400/50 text-center space-y-3 transition-colors">
                <div class="w-20 h-20 mx-auto rounded-2xl border-2 border-sky-400/50 bg-[#0d0a07] shadow-lg treasure-image-shine">
                  <img
                    src="/src/assets/images/reagent_crystals_bundle_1795188691071.jpg"
                    alt="Cristaux d'Éther"
                    class="w-full h-full object-cover rounded-[14px]"
                    referrerpolicy="no-referrer" />
                </div>
                <div class="font-cinzel font-bold text-xs text-[#e0dcc7]">+15 Cristaux d'Éther</div>
                <button
                  (click)="buyAlchemyReagent('crystals', 15, 45)"
                  [disabled]="gameState.gems() < 45"
                  class="crimson-btn w-full py-2 font-cinzel font-bold text-xs rounded-lg border border-[#ff4d4d] flex items-center justify-center gap-1.5"
                  [class.opacity-50]="gameState.gems() < 45">
                  <span class="currency-gem-facet text-xs">⬥</span>
                  <span class="currency-gem-shine font-extrabold">45 Gemmes</span>
                </button>
              </div>

              <div class="p-4 bg-[#1a1612] rounded-xl border border-[#3a2f23] hover:border-purple-400/50 text-center space-y-3 transition-colors">
                <div class="w-20 h-20 mx-auto rounded-2xl border-2 border-purple-400/50 bg-[#0d0a07] shadow-lg treasure-image-shine">
                  <img
                    src="/src/assets/images/reagent_essences_bundle_1795188691062.jpg"
                    alt="Essences d'Âme"
                    class="w-full h-full object-cover rounded-[14px]"
                    referrerpolicy="no-referrer" />
                </div>
                <div class="font-cinzel font-bold text-xs text-[#e0dcc7]">+10 Essences d'Âme</div>
                <button
                  (click)="buyAlchemyReagent('essences', 10, 60)"
                  [disabled]="gameState.gems() < 60"
                  class="crimson-btn w-full py-2 font-cinzel font-bold text-xs rounded-lg border border-[#ff4d4d] flex items-center justify-center gap-1.5"
                  [class.opacity-50]="gameState.gems() < 60">
                  <span class="currency-gem-facet text-xs">⬥</span>
                  <span class="currency-gem-shine font-extrabold">60 Gemmes</span>
                </button>
              </div>
            </div>
          </div>

        </div>
      }

      <!-- TAB 2.5: RELIC CHESTS & ARTIFACTS -->
      @if (activeTab() === 'relics') {
        <div class="space-y-6">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="font-cinzel text-base font-bold text-[#c5a880] flex items-center gap-2">
                <mat-icon class="text-[#d4af37]">auto_awesome</mat-icon>
                Reliquaires Antiques & Coffres de Transmutation
              </h2>
              <p class="text-xs text-[#8b6b43]">Obtenez des doublons de reliques pour les fusionner jusqu'au Rang V et maximiser vos gains d'EXP en duel.</p>
            </div>
            <div class="text-xs font-mono text-[#d4af37] bg-[#1a1612] px-3 py-1.5 rounded-xl border border-[#3a2f23]">
              Boost EXP Actif : +{{ gameState.totalRelicXpBoostPct() }}%
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <!-- Chest 1: Coffre d'Éclats de Relique -->
            <div class="bg-[#120f0c] border border-[#3a2f23] hover:border-[#8b6b43] rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4 text-center">
              <div class="w-20 h-20 mx-auto rounded-2xl bg-[#0d0a07] border-2 border-[#38bdf8] flex items-center justify-center shadow-lg treasure-image-shine">
                <img
                  src="/src/assets/images/relic_solaris_1795188690211.jpg"
                  alt="Reliquaire des Terres Solaires"
                  class="w-full h-full object-cover rounded-[14px]"
                  referrerpolicy="no-referrer" />
              </div>

              <div>
                <h3 class="font-cinzel font-bold text-sm text-[#e0dcc7]">Reliquaire des Terres Solaires</h3>
                <div class="text-[10px] text-[#38bdf8] font-mono font-bold mt-0.5">+2 Doublons du Sceau Solaire</div>
                <p class="text-[11px] text-[#8b6b43] mt-2">Permet de transmuter le Sceau Solaire vers le rang supérieur pour augmenter son boost d'EXP.</p>
              </div>

              <button
                (click)="buyRelicChest('rel_solaris', 'Sceau Solaire de Solaria', 2, 400, 'gold')"
                [disabled]="gameState.gold() < 400"
                class="medieval-btn w-full py-2 font-cinzel font-bold text-xs rounded-xl border border-[#8b6b43] flex items-center justify-center gap-1.5"
                [class.opacity-50]="gameState.gold() < 400">
                <span class="currency-gold-coin text-xs">✦</span>
                <span class="currency-gold-shine font-extrabold">400 Or</span>
              </button>
            </div>

            <!-- Chest 2: Coffre Temporel -->
            <div class="bg-[#120f0c] border border-[#3a2f23] hover:border-[#c084fc] rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4 text-center">
              <div class="w-20 h-20 mx-auto rounded-2xl bg-[#0d0a07] border-2 border-[#c084fc] flex items-center justify-center shadow-lg treasure-image-shine">
                <img
                  src="/src/assets/images/relic_chronos_1795188690731.jpg"
                  alt="Coffre Chronologique d'Aether"
                  class="w-full h-full object-cover rounded-[14px]"
                  referrerpolicy="no-referrer" />
              </div>

              <div>
                <h3 class="font-cinzel font-bold text-sm text-[#e0dcc7]">Coffre Chronologique d'Aether</h3>
                <div class="text-[10px] text-[#c084fc] font-mono font-bold mt-0.5">+2 Doublons du Sablier des Âges</div>
                <p class="text-[11px] text-[#8b6b43] mt-2">Améliore le Sablier pour débloquer de puissants bonus d'EXP de combat et de saison.</p>
              </div>

              <button
                (click)="buyRelicChest('rel_chronos', 'Sablier des Âges d’Aether', 2, 80, 'gems')"
                [disabled]="gameState.gems() < 80"
                class="crimson-btn w-full py-2 font-cinzel font-bold text-xs rounded-xl border border-[#ff4d4d] flex items-center justify-center gap-1.5"
                [class.opacity-50]="gameState.gems() < 80">
                <span class="currency-gem-facet text-xs">⬥</span>
                <span class="currency-gem-shine font-extrabold">80 Gemmes</span>
              </button>
            </div>

            <!-- Chest 3: Coffre Astral Suprême -->
            <div class="bg-[#120f0c] border border-[#d4af37] rounded-2xl p-5 shadow-2xl flex flex-col justify-between space-y-4 text-center relative overflow-hidden">
              <div class="absolute top-2 right-2 z-10 bg-gradient-to-r from-amber-600 to-yellow-500 text-black font-mono font-black text-[9px] px-2 py-0.5 rounded-full">
                MYTHIQUE
              </div>

              <div class="w-20 h-20 mx-auto rounded-2xl bg-[#0d0a07] border-2 border-[#fb7185] flex items-center justify-center shadow-lg treasure-image-shine">
                <img
                  src="/src/assets/images/relic_astral_1795188691786.jpg"
                  alt="Prisme Astral Mythique"
                  class="w-full h-full object-cover rounded-[14px]"
                  referrerpolicy="no-referrer" />
              </div>

              <div>
                <h3 class="font-cinzel font-bold text-sm text-[#f3eedd]">Prisme Astral Mythique</h3>
                <div class="text-[10px] text-[#fb7185] font-mono font-bold mt-0.5">+1 Doublon du Prisme Astral</div>
                <p class="text-[11px] text-[#8b6b43] mt-2">La relique suprême qui octroie des multiplicateurs phénoménaux d'expérience.</p>
              </div>

              <button
                (click)="buyRelicChest('rel_astral', 'Prisme Astral des Arcanes', 1, 150, 'gems')"
                [disabled]="gameState.gems() < 150"
                class="crimson-btn w-full py-2 font-cinzel font-bold text-xs rounded-xl border border-[#ff4d4d] flex items-center justify-center gap-1.5"
                [class.opacity-50]="gameState.gems() < 150">
                <span class="currency-gem-facet text-xs">⬥</span>
                <span class="currency-gem-shine font-extrabold">150 Gemmes</span>
              </button>
            </div>
          </div>
        </div>
      }

      <!-- TAB 3: BOOSTER PACKS -->
      @if (activeTab() === 'boosters') {
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="font-cinzel text-base font-bold text-[#c5a880] flex items-center gap-2">
              <mat-icon class="text-[#d4af37]">inventory_2</mat-icon>
              Paquets de Cartes & Coffres Mystiques
            </h2>
            <span class="text-xs text-[#8b6b43]">Taux de cartes rares garantis</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            @for (pack of boosterPacks; track pack.id) {
              <div class="medieval-btn bg-[#120f0c] border border-[#3a2f23] hover:border-[#8b6b43] rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4 text-center">
                
                <div class="w-24 h-32 mx-auto rounded-xl flex items-center justify-center border-2 shadow-lg bg-[#0d0b09] treasure-image-shine" [style.borderColor]="pack.color">
                  @if (pack.imageUrl) {
                    <img
                      [src]="pack.imageUrl"
                      [alt]="pack.name"
                      class="w-full h-full object-cover rounded-[10px]"
                      referrerpolicy="no-referrer" />
                  } @else {
                    <mat-icon class="text-4xl" [style.color]="pack.color">{{ pack.icon }}</mat-icon>
                  }
                </div>

                <div>
                  <h3 class="font-cinzel font-bold text-xs text-[#e0dcc7]">{{ pack.name }}</h3>
                  <div class="text-[10px] text-[#d4af37] font-medium mt-0.5">{{ pack.cardCount }} Cartes • Min. {{ pack.minRarity }}</div>
                  <p class="text-[11px] text-[#8b6b43] mt-2 line-clamp-2">{{ pack.description }}</p>
                </div>

                <!-- Buy Pack Button -->
                <button
                  (click)="openPack(pack)"
                  class="crimson-btn w-full py-2.5 text-white font-cinzel font-bold text-xs rounded-xl border border-[#ff4d4d] shadow flex items-center justify-center gap-1.5">
                  <mat-icon class="text-sm">lock_open</mat-icon>
                  <span>Ouvrir</span>
                  @if (pack.priceGold) {
                    <span class="inline-flex items-center gap-1 font-mono">
                      (<span class="currency-gold-coin text-xs">✦</span>
                      <span class="currency-gold-shine font-extrabold">{{ pack.priceGold }} Or</span>)
                    </span>
                  } @else {
                    <span class="inline-flex items-center gap-1 font-mono">
                      (<span class="currency-gem-facet text-xs">⬥</span>
                      <span class="currency-gem-shine font-extrabold">{{ pack.priceGems }}</span>)
                    </span>
                  }
                </button>
              </div>
            }
          </div>
        </div>
      }

      <!-- TAB 4: GEM VAULT & REAL MONEY PURCHASES -->
      @if (activeTab() === 'gem_vault') {
        <div class="space-y-6">
          
          <!-- Real Money Gem Bundles Grid -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <h2 class="font-cinzel text-base font-bold text-[#c5a880] flex items-center gap-2">
                <span class="currency-gem-facet text-lg">⬥</span>
                <span>Coffres de Gemmes Célestes (Monnaie Premium)</span>
              </h2>
              <span class="text-xs text-[#8b6b43]">Accélération & Cosmétiques</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              @for (bundle of gemBundles; track bundle.id) {
                <div class="bg-[#120f0c] border border-[#3a2f23] hover:border-[#38bdf8]/60 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4 text-center relative overflow-hidden transition-colors">
                  
                  @if (bundle.badge) {
                    <div class="absolute top-2 right-2 z-10 bg-[#8b2b2b] text-white font-mono font-bold text-[9px] px-2 py-0.5 rounded-full border border-[#ff4d4d]">
                      {{ bundle.badge }}
                    </div>
                  }

                  <div class="w-20 h-20 mx-auto rounded-2xl bg-[#0d0b09] border-2 border-[#38bdf8]/50 flex items-center justify-center shadow-lg treasure-image-shine">
                    @if (bundle.imageUrl) {
                      <img
                        [src]="bundle.imageUrl"
                        [alt]="bundle.gems + ' Gemmes'"
                        class="w-full h-full object-cover rounded-[14px]"
                        referrerpolicy="no-referrer" />
                    } @else {
                      <mat-icon class="text-3xl text-[#4d94ff]">{{ bundle.icon }}</mat-icon>
                    }
                  </div>

                  <div>
                    <div class="font-cinzel font-bold text-sm flex items-center justify-center gap-1.5">
                      <span class="currency-gem-facet">⬥</span>
                      <span class="currency-gem-shine font-black">{{ bundle.gems }} Gemmes</span>
                    </div>
                    @if (bundle.bonusPercentage) {
                      <div class="text-[10px] text-emerald-400 font-mono mt-0.5">+{{ bundle.bonusPercentage }}% de bonus inclus</div>
                    }
                    @if (bundle.bonusGold) {
                      <div class="text-[10px] font-mono mt-0.5 inline-flex items-center gap-1">
                        <span class="currency-gold-coin text-[10px]">✦</span>
                        <span class="currency-gold-shine font-bold">+{{ bundle.bonusGold }} Or offert</span>
                      </div>
                    }
                  </div>

                  <button
                    (click)="openRealMoneyModal('Coffre de Gemmes: ' + bundle.gems + ' Gemmes', bundle.priceEuro, bundle.gems, bundle.bonusGold || 0, bundle.bonusShards || 0)"
                    class="crimson-btn w-full py-2.5 text-white font-cinzel font-bold text-xs rounded-xl border border-[#ff4d4d] shadow flex items-center justify-center gap-1.5">
                    <mat-icon class="text-sm">shopping_cart</mat-icon>
                    {{ bundle.priceEuro }}
                  </button>
                </div>
              }
            </div>
          </div>

          <!-- Currency Conversion: Gems to Gold -->
          <div class="bg-[#120f0c] border border-[#3a2f23] rounded-2xl p-5 shadow-xl space-y-4">
            <div class="flex items-center justify-between pb-2 border-b border-[#3a2f23]">
              <h3 class="font-cinzel text-sm font-bold text-[#c5a880] flex items-center gap-2">
                <span class="currency-gold-coin text-base">✦</span>
                <span>Convertisseur d'Or Royal (Gemmes ➔ Or)</span>
              </h3>
              <span class="text-xs text-[#6b5a45] font-mono">Monnaie de Jeu Libre</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="p-3.5 bg-[#1a1612] rounded-xl border border-[#3a2f23] flex items-center justify-between gap-3">
                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-12 h-12 rounded-xl border border-[#d4af37]/50 bg-[#0d0a07] shrink-0 treasure-image-shine">
                    <img
                      src="/src/assets/images/vault_gold_coins_1795188690712.jpg"
                      alt="Bourse de 1 000 Or"
                      class="w-full h-full object-cover rounded-[10px]"
                      referrerpolicy="no-referrer" />
                  </div>
                  <div class="min-w-0">
                    <div class="font-cinzel font-bold text-xs currency-gold-shine truncate">Bourse de 1 000 Or</div>
                    <div class="text-[10px] text-[#8b6b43]">Idéal pour les améliorations</div>
                  </div>
                </div>
                <button
                  (click)="buyGoldWithGems(1000, 50)"
                  [disabled]="gameState.gems() < 50"
                  class="medieval-btn px-3 py-1.5 bg-[#0d0b09] hover:bg-[#120f0c] font-cinzel font-bold text-xs rounded-lg border border-[#3a2f23] shrink-0 flex items-center gap-1"
                  [class.opacity-50]="gameState.gems() < 50">
                  <span class="currency-gem-facet text-xs">⬥</span>
                  <span class="currency-gem-shine font-extrabold">50</span>
                </button>
              </div>

              <div class="p-3.5 bg-[#1a1612] rounded-xl border border-[#3a2f23] flex items-center justify-between gap-3">
                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-12 h-12 rounded-xl border border-[#d4af37]/60 bg-[#0d0a07] shrink-0 treasure-image-shine">
                    <img
                      src="/src/assets/images/vault_gold_coins_1795188690712.jpg"
                      alt="Coffre de 5 000 Or"
                      class="w-full h-full object-cover rounded-[10px]"
                      referrerpolicy="no-referrer" />
                  </div>
                  <div class="min-w-0">
                    <div class="font-cinzel font-bold text-xs currency-gold-shine truncate">Coffre de 5 000 Or</div>
                    <div class="text-[10px] text-emerald-400 font-mono">+20% Or Bonus</div>
                  </div>
                </div>
                <button
                  (click)="buyGoldWithGems(5000, 200)"
                  [disabled]="gameState.gems() < 200"
                  class="crimson-btn px-3 py-1.5 font-cinzel font-bold text-xs rounded-lg border border-[#ff4d4d] shrink-0 flex items-center gap-1"
                  [class.opacity-50]="gameState.gems() < 200">
                  <span class="currency-gem-facet text-xs">⬥</span>
                  <span class="currency-gem-shine font-extrabold">200</span>
                </button>
              </div>

              <div class="p-3.5 bg-[#1a1612] rounded-xl border border-[#3a2f23] flex items-center justify-between gap-3">
                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-12 h-12 rounded-xl border border-[#fbbf24] bg-[#0d0a07] shrink-0 treasure-image-shine">
                    <img
                      src="/src/assets/images/vault_gold_coins_1795188690712.jpg"
                      alt="Trésor de 15 000 Or"
                      class="w-full h-full object-cover rounded-[10px]"
                      referrerpolicy="no-referrer" />
                  </div>
                  <div class="min-w-0">
                    <div class="font-cinzel font-bold text-xs currency-gold-shine truncate">Trésor de 15 000 Or</div>
                    <div class="text-[10px] text-emerald-400 font-mono">+35% Or Bonus</div>
                  </div>
                </div>
                <button
                  (click)="buyGoldWithGems(15000, 500)"
                  [disabled]="gameState.gems() < 500"
                  class="crimson-btn px-3 py-1.5 font-cinzel font-bold text-xs rounded-lg border border-[#ff4d4d] shrink-0 flex items-center gap-1"
                  [class.opacity-50]="gameState.gems() < 500">
                  <span class="currency-gem-facet text-xs">⬥</span>
                  <span class="currency-gem-shine font-extrabold">500</span>
                </button>
              </div>
            </div>
          </div>

        </div>
      }

      <!-- TAB 5: COSMETICS & WARDROBE -->
      @if (activeTab() === 'cosmetics') {
        <div class="space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h2 class="font-cinzel text-base font-bold text-[#c5a880] flex items-center gap-2">
              <mat-icon class="text-[#d4af37]">checkroom</mat-icon>
              <span>Garde-Robe des 20 Héros &amp; Skins Cosmétiques</span>
            </h2>
            <span class="text-xs font-mono tabular-nums text-[#8b6b43]">
              {{ gameState.unlockedSkinsCount() }} / {{ gameState.totalSkinsCount() }} apparences débloquées
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (h of gameState.heroes(); track h.id) {
              @for (skin of h.skins; track skin.id) {
                @let isEquipped = h.activeSkinId === skin.id;
                <div
                  class="skin-rarity-card border rounded-2xl p-4 shadow-xl flex flex-col justify-between space-y-3"
                  [class]="getSkinRarityCardClass(skin.rarity)"
                  [class.ring-2]="isEquipped"
                  [class.ring-[#d4af37]/75]="isEquipped">

                  <!-- CSS Particle Layer by Rarity -->
                  <div class="skin-particles" aria-hidden="true">
                    @switch (skin.rarity) {
                      @case ('common') {
                        <span class="skin-particle" style="left: 18%; --p-dur: 5.5s; --p-delay: 0s; --px-drift: 6px; --py-rise: -75px;"></span>
                        <span class="skin-particle" style="left: 78%; --p-dur: 6.2s; --p-delay: 2.1s; --px-drift: -6px; --py-rise: -70px;"></span>
                      }
                      @case ('rare') {
                        <span class="skin-particle" style="left: 14%; --p-dur: 4.4s; --p-delay: 0s; --px-drift: 8px; --py-rise: -120px;"></span>
                        <span class="skin-particle" style="left: 44%; --p-dur: 3.8s; --p-delay: 1.1s; --px-drift: -10px; --py-rise: -135px;"></span>
                        <span class="skin-particle" style="left: 78%; --p-dur: 4.5s; --p-delay: 0.6s; --px-drift: 10px; --py-rise: -120px;"></span>
                      }
                      @case ('epic') {
                        <span class="skin-particle" style="left: 12%; --p-dur: 4.0s; --p-delay: 0s; --px-drift: 14px; --py-rise: -145px;"></span>
                        <span class="skin-particle" style="left: 35%; --p-dur: 3.4s; --p-delay: 0.8s; --px-drift: -12px; --py-rise: -155px;"></span>
                        <span class="skin-particle" style="left: 62%; --p-dur: 4.1s; --p-delay: 1.5s; --px-drift: 10px; --py-rise: -140px;"></span>
                        <span class="skin-particle" style="left: 85%; --p-dur: 3.7s; --p-delay: 0.4s; --px-drift: -12px; --py-rise: -150px;"></span>
                      }
                      @case ('legendary') {
                        <span class="skin-particle" style="left: 10%; --p-dur: 3.4s; --p-delay: 0s; --px-drift: 14px; --py-rise: -165px;"></span>
                        <span class="skin-particle" style="left: 27%; --p-dur: 2.9s; --p-delay: 0.7s; --px-drift: -12px; --py-rise: -175px;"></span>
                        <span class="skin-particle" style="left: 47%; --p-dur: 3.5s; --p-delay: 1.4s; --px-drift: 14px; --py-rise: -160px;"></span>
                        <span class="skin-particle" style="left: 67%; --p-dur: 3.1s; --p-delay: 0.3s; --px-drift: -14px; --py-rise: -180px;"></span>
                        <span class="skin-particle" style="left: 88%; --p-dur: 3.6s; --p-delay: 1.1s; --px-drift: -10px; --py-rise: -165px;"></span>
                        <span class="skin-particle-star" style="top: 16%; right: 12%; --p-dur: 2.4s; --p-delay: 0.2s;"></span>
                        <span class="skin-particle-star" style="top: 48%; left: 10%; --p-dur: 2.8s; --p-delay: 1.0s;"></span>
                      }
                      @case ('mythic') {
                        <span class="skin-particle" style="left: 9%; --p-dur: 3.1s; --p-delay: 0s; --px-drift: 16px; --py-rise: -175px;"></span>
                        <span class="skin-particle" style="left: 25%; --p-dur: 2.7s; --p-delay: 0.5s; --px-drift: -14px; --py-rise: -185px;"></span>
                        <span class="skin-particle" style="left: 45%; --p-dur: 3.3s; --p-delay: 1.2s; --px-drift: 14px; --py-rise: -170px;"></span>
                        <span class="skin-particle" style="left: 64%; --p-dur: 2.8s; --p-delay: 0.2s; --px-drift: -16px; --py-rise: -190px;"></span>
                        <span class="skin-particle" style="left: 81%; --p-dur: 3.4s; --p-delay: 1.5s; --px-drift: 10px; --py-rise: -175px;"></span>
                        <span class="skin-particle" style="left: 92%; --p-dur: 2.6s; --p-delay: 1.9s; --px-drift: -14px; --py-rise: -175px;"></span>
                        <span class="skin-particle-star" style="top: 14%; right: 12%; --p-dur: 2.1s; --p-delay: 0s;"></span>
                        <span class="skin-particle-star" style="top: 44%; left: 9%; --p-dur: 2.6s; --p-delay: 0.9s;"></span>
                      }
                    }
                  </div>

                  <div class="skin-card-content space-y-1">
                    <div class="text-[11px] font-cinzel font-semibold text-[#8b6b43]">
                      <span>{{ h.name }}</span>
                      <span aria-hidden="true"> · </span>
                      <span [class]="getSkinRarityTextClass(skin.rarity)">{{ getSkinRarityLabel(skin.rarity) }}</span>
                    </div>
                    <h4 class="font-cinzel font-bold text-sm text-[#e0dcc7]">{{ skin.name }}</h4>
                    <p class="text-[11px] font-serif text-[#8b6b43] leading-snug">
                      {{ skin.description || 'Apparence alternative pour ' + h.name }}
                    </p>
                  </div>

                  <div
                    class="skin-card-content w-24 h-24 mx-auto rounded-2xl bg-[#0d0b09] border-2 flex items-center justify-center shadow-lg my-1 overflow-hidden relative"
                    [style.borderColor]="skin.accentHex || '#8b6b43'">
                    @if (skin.imageUrl || h.imageUrl) {
                      <img
                        [src]="skin.imageUrl || h.imageUrl"
                        [alt]="skin.name"
                        [style.filter]="skin.portraitFilter || 'none'"
                        class="w-full h-full object-cover"
                        referrerpolicy="no-referrer" />
                      <div class="absolute inset-0 bg-gradient-to-t pointer-events-none" [class]="skin.themeGradient || ''"></div>
                    } @else {
                      <mat-icon class="text-3xl text-[#c5a880]">{{ skin.avatarIcon }}</mat-icon>
                    }
                  </div>

                  <div class="skin-card-content flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
                    <span class="text-[10px] text-[#8b6b43]">{{ skin.visualEffectLabel || skin.badge }}</span>

                    @if (skin.isUnlocked) {
                      @if (isEquipped) {
                        <span class="inline-flex items-center gap-1 text-emerald-400 text-[11px] font-cinzel font-bold whitespace-nowrap shrink-0">
                          <mat-icon class="text-xs">check_circle</mat-icon>
                          <span>Équipé</span>
                        </span>
                      } @else {
                        <button
                          type="button"
                          (click)="gameState.equipSkin(h.id, skin.id)"
                          class="medieval-btn px-3 py-1 bg-[#1a1612] hover:bg-[#2a2117] border border-[#d4af37]/70 text-[#d4af37] text-[11px] font-cinzel font-bold rounded-lg cursor-pointer whitespace-nowrap shrink-0">
                          Équiper
                        </button>
                      }
                    } @else {
                      <div class="flex items-center gap-1.5">
                        @if (skin.goldPrice) {
                          <button
                            type="button"
                            (click)="gameState.purchaseSkinWithCurrency(h.id, skin.id, 'gold')"
                            [disabled]="gameState.gold() < skin.goldPrice"
                            class="medieval-btn px-2.5 py-1 bg-[#1a1612] text-[11px] font-mono tabular-nums font-bold rounded-lg border border-[#d4af37]/60 cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1"
                            [class.opacity-45]="gameState.gold() < skin.goldPrice">
                            <span class="currency-gold-coin">✦</span>
                            <span class="currency-gold-shine font-extrabold">{{ skin.goldPrice }}</span>
                          </button>
                        }
                        @if (skin.gemPrice) {
                          <button
                            type="button"
                            (click)="gameState.purchaseSkinWithCurrency(h.id, skin.id, 'gems')"
                            [disabled]="gameState.gems() < skin.gemPrice"
                            class="crimson-btn px-2.5 py-1 text-[11px] font-mono tabular-nums font-bold rounded-lg border border-[#ff4d4d] cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1"
                            [class.opacity-45]="gameState.gems() < skin.gemPrice">
                            <span class="currency-gem-facet">⬥</span>
                            <span class="currency-gem-shine font-extrabold">{{ skin.gemPrice }}</span>
                          </button>
                        }
                      </div>
                    }
                  </div>
                </div>
              }
            }
          </div>
        </div>
      }

      <!-- REAL MONEY SIMULATED CHECKOUT MODAL -->
      @if (pendingPurchase()) {
        @let p = pendingPurchase()!;
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
          <div class="max-w-md w-full bg-[#120f0c] border border-[#d4af37] rounded-3xl p-6 shadow-2xl space-y-5 text-center relative">
            
            <button
              (click)="pendingPurchase.set(null)"
              class="absolute top-4 right-4 text-[#8b6b43] hover:text-[#e0dcc7]">
              <mat-icon>close</mat-icon>
            </button>

            <div class="w-16 h-16 mx-auto rounded-2xl bg-[#1a1612] border border-[#8b6b43] flex items-center justify-center">
              <mat-icon class="text-3xl text-[#d4af37]">verified_user</mat-icon>
            </div>

            <div>
              <div class="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">Paiement Sécurisé Aetheria Pay</div>
              <h3 class="font-cinzel text-xl font-black text-[#c5a880] mt-1">{{ p.bundleName }}</h3>
              <p class="text-xs text-[#8b6b43] mt-1">Confirmation d'achat d'accélération & cosmétique équitable.</p>
            </div>

            <div class="p-4 bg-[#0d0b09] rounded-2xl border border-[#3a2f23] text-left text-xs space-y-2">
              <div class="flex justify-between text-[#8b6b43]">
                <span>Article :</span>
                <span class="text-[#e0dcc7] font-medium">{{ p.bundleName }}</span>
              </div>
              @if (p.gemsReceived > 0) {
                <div class="flex justify-between items-center text-[#8b6b43]">
                  <span>Gemmes Célestes :</span>
                  <span class="text-[#4d94ff] font-bold font-mono flex items-center gap-1.5">
                    <span>+{{ p.gemsReceived }}</span>
                    <img
                      src="/src/assets/images/vault_gems_treasure_1795188690343.jpg"
                      alt="Gemmes"
                      class="w-4 h-4 rounded object-cover border border-[#4d94ff]/50"
                      referrerpolicy="no-referrer" />
                  </span>
                </div>
              }
              @if (p.bonusGold > 0) {
                <div class="flex justify-between items-center text-[#8b6b43]">
                  <span>Or Bonus :</span>
                  <span class="text-[#d4af37] font-bold font-mono flex items-center gap-1.5">
                    <span>+{{ p.bonusGold }}</span>
                    <img
                      src="/src/assets/images/vault_gold_coins_1795188690712.jpg"
                      alt="Or"
                      class="w-4 h-4 rounded object-cover border border-[#d4af37]/50"
                      referrerpolicy="no-referrer" />
                  </span>
                </div>
              }
              <div class="flex justify-between text-[#8b6b43] pt-2 border-t border-[#3a2f23] text-sm">
                <span class="font-bold text-[#e0dcc7]">Total TTC :</span>
                <span class="font-bold text-[#d4af37] font-mono">{{ p.priceStr }}</span>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <button
                (click)="pendingPurchase.set(null)"
                class="medieval-btn flex-1 py-2.5 rounded-xl border border-[#3a2f23] text-[#8b6b43] text-xs font-cinzel font-bold">
                Annuler
              </button>
              <button
                (click)="confirmPurchase()"
                class="crimson-btn flex-1 py-2.5 rounded-xl border border-[#ff4d4d] text-white text-xs font-cinzel font-bold flex items-center justify-center gap-1.5 shadow-lg">
                <mat-icon class="text-sm">check_circle</mat-icon>
                Confirmer l'Achat
              </button>
            </div>

          </div>
        </div>
      }

      <!-- PACK OPENING CELEBRATION MODAL -->
      @if (openedCards().length > 0) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in zoom-in-95">
          <div class="max-w-4xl w-full text-center space-y-6">
            
            <div>
              <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1a1612] border border-[#8b6b43] text-[#d4af37] font-cinzel text-xs font-bold mb-2">
                <mat-icon class="text-xs animate-spin">auto_awesome</mat-icon> Révélation du Grimoire
              </div>
              <h2 class="font-cinzel-dec text-3xl md:text-4xl font-black text-[#c5a880]">Nouvelles Cartes Découvertes !</h2>
            </div>

            <!-- Revealed Cards Grid with 3D Perspective -->
            <div class="flex flex-wrap items-center justify-center gap-4 py-4 max-h-[60vh] overflow-y-auto card-3d-perspective">
              @for (c of openedCards(); track $index) {
                <div
                  class="card-3d-tilt-hover card-holo w-32 md:w-36 h-48 md:h-52 rounded-2xl bg-[#120f0c] border-2 border-[#8b6b43] p-3 flex flex-col justify-between shadow-2xl animate-in fade-in duration-300 cursor-pointer"
                  [class.rarity-common]="c.rarity === 'common'"
                  [class.rarity-rare]="c.rarity === 'rare'"
                  [class.rarity-epic]="c.rarity === 'epic'"
                  [class.rarity-legendary]="c.rarity === 'legendary'"
                  [class.rarity-mythic]="c.rarity === 'mythic'">
                  <div class="card-3d-layer-pop flex justify-between items-center text-xs font-mono font-bold">
                    <span class="w-5 h-5 rounded-full bg-[#8b2b2b] text-white flex items-center justify-center text-[10px] shadow">{{ c.cost }}</span>
                    <span class="text-[9px] uppercase text-[#d4af37]">{{ c.rarity }}</span>
                  </div>

                  <div class="card-3d-layer-float text-center font-cinzel text-xs font-bold text-[#e0dcc7] truncate mt-1">
                    {{ c.name }}
                  </div>

                  <div class="card-3d-layer-pop my-auto w-20 h-20 mx-auto rounded-xl border border-[#8b6b43]/60 overflow-hidden bg-[#0a0806] flex items-center justify-center shadow">
                    @if (c.imageUrl) {
                      <img
                        [src]="c.imageUrl"
                        [alt]="c.name"
                        class="w-full h-full object-cover"
                        referrerpolicy="no-referrer" />
                    } @else {
                      <mat-icon class="text-3xl text-[#c5a880]">{{ c.icon }}</mat-icon>
                    }
                  </div>

                  <div class="card-3d-layer-deep text-[9px] text-[#8b6b43] text-center line-clamp-2">
                    {{ c.description }}
                  </div>
                </div>
              }
            </div>

            <button
              (click)="openedCards.set([])"
              class="crimson-btn px-8 py-3 text-white font-cinzel font-bold text-sm rounded-xl border border-[#ff4d4d] shadow-xl">
              Ajouter à ma Collection
            </button>
          </div>
        </div>
      }

    </div>
  `,
})
export class ShopView {
  readonly gameState = inject(GameStateService);
  readonly sound = inject(SoundService);

  readonly activeTab = signal<ShopTab>('heroes');
  readonly openedCards = signal<Card[]>([]);
  readonly pendingPurchase = signal<{
    bundleName: string;
    priceStr: string;
    gemsReceived: number;
    bonusGold: number;
    bonusShards: number;
    heroToUnlock?: Hero;
  } | null>(null);

  readonly boosterPacks: PackType[] = [
    {
      id: 'pack_recruit',
      name: 'Paquet de Recrue',
      priceGold: 200,
      cardCount: 3,
      minRarity: 'common',
      icon: 'inventory_2',
      imageUrl: '/src/assets/images/shop_pack_recruit_1795188690850.jpg',
      color: '#a8a29e',
      description: '3 cartes aléatoires avec garantie d\'obtenir au moins 1 carte commune ou rare.',
    },
    {
      id: 'pack_arcane',
      name: 'Booster Arcanique',
      priceGold: 450,
      cardCount: 5,
      minRarity: 'rare',
      icon: 'auto_awesome',
      imageUrl: '/src/assets/images/shop_pack_arcane_1795188691515.jpg',
      color: '#38bdf8',
      description: '5 cartes runiques avec 1 carte Rare garantie pour enrichir vos grimoires.',
    },
    {
      id: 'pack_mystic',
      name: 'Coffre Mystique d\'Or',
      priceGems: 120,
      cardCount: 5,
      minRarity: 'epic',
      icon: 'military_tech',
      imageUrl: '/src/assets/images/shop_pack_mystic_1795188691001.jpg',
      color: '#c084fc',
      description: '5 cartes nobles avec 1 carte Épique garantie et fortes chances d\'éclats.',
    },
    {
      id: 'pack_divine',
      name: 'Trésor Divin d\'Aether',
      priceGems: 300,
      cardCount: 7,
      minRarity: 'legendary',
      icon: 'workspace_premium',
      imageUrl: '/src/assets/images/shop_pack_divine_1795188690278.jpg',
      color: '#fbbf24',
      description: '7 cartes suprêmes avec 1 carte Légendaire ou Mythique dorée garantie !',
    },
  ];

  readonly gemBundles: GemBundle[] = [
    {
      id: 'gem_small',
      gems: 250,
      priceEuro: '4,99 €',
      icon: 'diamond',
      imageUrl: '/src/assets/images/vault_gems_treasure_1795188690343.jpg',
    },
    {
      id: 'gem_med',
      gems: 650,
      priceEuro: '9,99 €',
      bonusPercentage: 15,
      bonusGold: 500,
      badge: 'POPULAIRE',
      icon: 'diamond',
      imageUrl: '/src/assets/images/vault_gems_treasure_1795188690343.jpg',
    },
    {
      id: 'gem_large',
      gems: 1500,
      priceEuro: '19,99 €',
      bonusPercentage: 25,
      bonusGold: 2000,
      bonusShards: 5,
      badge: 'MEILLEURE OFFRE',
      icon: 'workspace_premium',
      imageUrl: '/src/assets/images/vault_gems_treasure_1795188690343.jpg',
    },
    {
      id: 'gem_epic',
      gems: 4000,
      priceEuro: '49,99 €',
      bonusPercentage: 40,
      bonusGold: 6000,
      bonusShards: 15,
      badge: 'MAÎTRE DU DOMAINE',
      icon: 'military_tech',
      imageUrl: '/src/assets/images/vault_gems_treasure_1795188690343.jpg',
    },
  ];

  gemCostForPotion(goldCost: number): number {
    return Math.max(5, Math.ceil(goldCost / 25));
  }

  buyHero(hero: Hero, currency: 'gold' | 'gems') {
    this.gameState.unlockHero(hero.id, currency);
  }

  buyPotion(potionId: string, count: number, currency: 'gold' | 'gems') {
    this.gameState.buyPotionInShop(potionId, count, currency);
  }

  buyAlchemyReagent(reagent: 'herbs' | 'crystals' | 'essences', amount: number, costGems: number) {
    this.gameState.buyAlchemyResource(reagent, amount, costGems);
  }

  buyRelicChest(baseId: string, name: string, count: number, cost: number, currency: 'gold' | 'gems') {
    if (currency === 'gold') {
      if (this.gameState.gold() < cost) return;
      this.gameState.addGold(-cost);
    } else {
      if (this.gameState.gems() < cost) return;
      this.gameState.addGems(-cost);
    }

    this.gameState.addRelicDuplicate(baseId, count);
    this.sound.playVictory();
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (e) {
      console.log(e);
    }
  }

  openRealMoneyModal(bundleName: string, priceStr: string, gemsReceived: number, bonusGold = 0, bonusShards = 0, heroToUnlock?: Hero) {
    this.pendingPurchase.set({
      bundleName,
      priceStr,
      gemsReceived,
      bonusGold,
      bonusShards,
      heroToUnlock,
    });
  }

  confirmPurchase() {
    const p = this.pendingPurchase();
    if (!p) return;

    if (p.heroToUnlock) {
      this.gameState.unlockHero(p.heroToUnlock.id, 'real_money');
    }
    if (p.gemsReceived > 0 || p.bonusGold > 0 || p.bonusShards > 0) {
      this.gameState.simulateRealMoneyPurchase(p.bundleName, p.priceStr, p.gemsReceived, p.bonusGold, p.bonusShards);
    }

    this.pendingPurchase.set(null);
    this.sound.playVictory();
    try {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {
      console.log(e);
    }
  }

  openPack(pack: PackType) {
    if (pack.priceGold && this.gameState.gold() < pack.priceGold) {
      return;
    }
    if (pack.priceGems && this.gameState.gems() < pack.priceGems) {
      return;
    }

    if (pack.priceGold) this.gameState.addGold(-pack.priceGold);
    if (pack.priceGems) this.gameState.addGems(-pack.priceGems);

    const allCards = this.gameState.cards();
    const pulled: Card[] = [];

    for (let i = 0; i < pack.cardCount; i++) {
      const randomCard = allCards[Math.floor(Math.random() * allCards.length)];
      pulled.push(randomCard);
    }

    this.openedCards.set(pulled);
    this.sound.playVictory();
    try {
      confetti({
        particleCount: 100,
        spread: 60,
        origin: { y: 0.5 },
      });
    } catch (e) {
      console.log(e);
    }
  }

  buyGoldWithGems(goldAmount: number, gemCost: number) {
    if (this.gameState.gems() < gemCost) {
      return;
    }
    this.gameState.addGems(-gemCost);
    this.gameState.addGold(goldAmount);
  }

  getSkinRarityCardClass(rarity: CardRarity): string {
    return `skin-rarity-${rarity}`;
  }

  getSkinRarityLabel(rarity: CardRarity): string {
    switch (rarity) {
      case 'common':
        return 'Commun';
      case 'rare':
        return 'Rare';
      case 'epic':
        return 'Épique';
      case 'legendary':
        return 'Légendaire';
      case 'mythic':
        return 'Mythique';
    }
  }

  getSkinRarityTextClass(rarity: CardRarity): string {
    switch (rarity) {
      case 'common':
        return 'text-[#d6d3d1]';
      case 'rare':
        return 'text-[#7dd3fc]';
      case 'epic':
        return 'text-[#d8b4fe]';
      case 'legendary':
        return 'text-[#fde047]';
      case 'mythic':
        return 'text-[#fda4af]';
    }
  }
}
