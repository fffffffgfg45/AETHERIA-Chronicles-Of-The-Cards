import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { GameStateService } from '../../services/game-state';
import { SoundService } from '../../services/sound';
import { PlayerRelic, CardRarity } from '../../models/game.model';

@Component({
  selector: 'app-relics-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div class="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      
      <!-- Top Title & Sanctum Overview Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#120f0c] border border-[#3a2f23] rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <!-- Ambient background aura glow -->
        <div class="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none"></div>

        <div>
          <h1 class="font-cinzel-dec text-2xl md:text-3xl font-black text-[#c5a880] flex items-center gap-2.5">
            <mat-icon class="text-[#d4af37] text-3xl animate-pulse">auto_awesome</mat-icon>
            Sanctuaire des Reliques Antiques
          </h1>
          <p class="text-[#8b6b43] text-xs font-serif mt-1">
            Enchâssez vos reliques légendaires pour booster massivement l'expérience et le butin gagnés à chaque duel. Fusionnez vos doublons et enchantez-les avec vos précieuses gemmes.
          </p>
        </div>

        <!-- Global Relic XP Boost Banner Badge -->
        <div class="flex items-center gap-4 bg-[#1a1612] px-5 py-3 rounded-2xl border border-[#d4af37]/40 shadow-[0_0_20px_rgba(212,175,55,0.15)] self-start md:self-auto">
          <div class="w-11 h-11 rounded-xl bg-[#281b0f] border border-[#d4af37] flex items-center justify-center text-[#d4af37] shadow-inner">
            <mat-icon class="text-2xl">bolt</mat-icon>
          </div>
          <div>
            <div class="text-[10px] font-mono uppercase tracking-wider text-[#a89078] font-bold">Boost EXP Total Actif</div>
            <div class="font-cinzel text-xl font-black text-[#d4af37] flex items-center gap-1.5">
              <span>+{{ gameState.totalRelicXpBoostPct() }}% EXP</span>
              <span class="text-xs text-[#48bb78] font-mono font-normal">/ combat</span>
            </div>
            @if (gameState.totalRelicSeasonXpBoostPct() > 0 || gameState.totalRelicGoldBoostPct() > 0) {
              <div class="text-[10px] font-mono text-[#8b6b43] mt-0.5">
                @if (gameState.totalRelicSeasonXpBoostPct() > 0) {
                  <span class="text-[#a78bfa]">+{{ gameState.totalRelicSeasonXpBoostPct() }}% Saison</span>
                }
                @if (gameState.totalRelicGoldBoostPct() > 0) {
                  <span class="ml-1 text-[#fbbf24]">+{{ gameState.totalRelicGoldBoostPct() }}% Or</span>
                }
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Reliquary Altars: 3 Equipped Relic Slots -->
      <div class="bg-[#120f0c] border border-[#3a2f23] rounded-2xl p-5 shadow-xl space-y-4">
        <div class="flex items-center justify-between border-b border-[#3a2f23] pb-3">
          <div class="flex items-center gap-2">
            <mat-icon class="text-[#d4af37]">shield</mat-icon>
            <h2 class="font-cinzel text-base font-bold text-[#c5a880]">
              Autel d'Enchâssement (3 Emplacements Majeurs)
            </h2>
          </div>
          <span class="text-xs text-[#8b6b43] font-mono">
            {{ gameState.equippedRelics().length }} / 3 enchâssées
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          @for (slotNum of [1, 2, 3]; track slotNum) {
            @let equipped = getRelicInSlot(slotNum);

            @if (equipped) {
              <!-- Slot with Equipped Relic -->
              <div
                tabindex="0"
                role="button"
                (click)="selectRelic(equipped)"
                (keydown.enter)="selectRelic(equipped)"
                class="group relative rounded-2xl p-4 border transition-all cursor-pointer bg-gradient-to-b from-[#1c1611] to-[#14100c] shadow-lg flex flex-col justify-between"
                [class.border-[#8b6b43]]="equipped.rarity === 'common' && selectedRelic()?.id !== equipped.id"
                [class.border-[#38bdf8]]="equipped.rarity === 'rare' && selectedRelic()?.id !== equipped.id"
                [class.border-[#c084fc]]="equipped.rarity === 'epic' && selectedRelic()?.id !== equipped.id"
                [class.border-[#fbbf24]]="equipped.rarity === 'legendary' && selectedRelic()?.id !== equipped.id"
                [class.border-[#fb7185]]="equipped.rarity === 'mythic' && selectedRelic()?.id !== equipped.id"
                [class.ring-2_ring-[#d4af37]_scale-[1.02]]="selectedRelic()?.id === equipped.id">

                <!-- Slot Number Badge -->
                <div class="flex items-center justify-between mb-3">
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#281b0f] text-[#d4af37] border border-[#8b6b43]/50">
                    EMPLACEMENT {{ slotNum }}
                  </span>
                  <span [class]="'text-[10px] font-cinzel font-black uppercase tracking-wider ' + getRarityTextColor(equipped.rarity)">
                    {{ equipped.rarity }}
                  </span>
                </div>

                <!-- Relic Core Display -->
                <div class="flex items-center gap-3">
                  <div
                    class="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 border-2 relative shadow-md treasure-image-shine bg-[#0d0a07]"
                    [class.border-[#8b6b43]]="equipped.rarity === 'common'"
                    [class.border-[#38bdf8]]="equipped.rarity === 'rare'"
                    [class.border-[#c084fc]]="equipped.rarity === 'epic'"
                    [class.border-[#fbbf24]]="equipped.rarity === 'legendary'"
                    [class.border-[#fb7185]]="equipped.rarity === 'mythic'">
                    @if (equipped.imageUrl) {
                      <img
                        [src]="equipped.imageUrl"
                        [alt]="equipped.name"
                        class="w-full h-full object-cover rounded-[10px]"
                        referrerpolicy="no-referrer" />
                    } @else {
                      <mat-icon class="text-2xl text-[#d4af37]">{{ equipped.icon }}</mat-icon>
                    }
                    @if (equipped.enchantLevel > 0) {
                      <span class="absolute -top-1.5 -right-1.5 z-10 px-1 py-0.2 bg-amber-500 text-black text-[9px] font-mono font-black rounded-full border border-yellow-200 shadow">
                        ★{{ equipped.enchantLevel }}
                      </span>
                    }
                  </div>

                  <div class="min-w-0 flex-1">
                    <h3 class="font-cinzel text-sm font-black text-[#f3eedd] truncate">
                      {{ equipped.name }}
                    </h3>
                    <div class="flex items-center gap-2 mt-0.5">
                      <span class="text-[11px] font-mono text-[#d4af37] font-bold">
                        Rang {{ getRomanTier(equipped.tier) }}
                      </span>
                      <span class="text-[11px] font-mono font-extrabold text-[#38bdf8]">
                        +{{ equipped.totalXpBonusPct }}% EXP
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Stars Enchantment Bar -->
                <div class="flex items-center justify-between mt-3 pt-2.5 border-t border-[#3a2f23]">
                  <div class="flex items-center gap-1">
                    @for (s of [1, 2, 3, 4, 5]; track s) {
                      <span
                        class="text-xs"
                        [class.text-amber-400]="s <= equipped.enchantLevel"
                        [class.text-[#4a3b2c]]="s > equipped.enchantLevel">
                        ★
                      </span>
                    }
                  </div>

                  <button
                    (click)="unequip(equipped); $event.stopPropagation()"
                    class="px-2.5 py-1 rounded bg-[#251f18] hover:bg-[#382618] text-[#e0dcc7] hover:text-[#ff7675] border border-[#3a2f23] text-[11px] font-cinzel font-bold transition-colors flex items-center gap-1">
                    <mat-icon class="text-xs">lock_open</mat-icon>
                    Retirer
                  </button>
                </div>

              </div>
            } @else {
              <!-- Empty Slot placeholder -->
              <div
                class="rounded-2xl p-5 border-2 border-dashed border-[#3a2f23] bg-[#14100c]/50 flex flex-col items-center justify-center text-center gap-2 min-h-[140px] hover:border-[#8b6b43] transition-colors">
                <div class="w-10 h-10 rounded-full bg-[#1a1612] border border-[#3a2f23] flex items-center justify-center text-[#6b5a45]">
                  <mat-icon>add</mat-icon>
                </div>
                <div>
                  <div class="font-cinzel text-xs font-bold text-[#8b6b43]">
                    Emplacement {{ slotNum }} Libre
                  </div>
                  <p class="text-[10px] text-[#6b5a45] mt-0.5">
                    Sélectionnez une relique ci-dessous pour l'enchâsser
                  </p>
                </div>
              </div>
            }
          }
        </div>
      </div>

      <!-- Main Layout: Relic Vault (Left) & Forge of Transmutation & Enchantment (Right) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <!-- Left: Relics Vault Grid (7 cols) -->
        <div class="lg:col-span-7 space-y-4">
          <div class="bg-[#120f0c] border border-[#3a2f23] rounded-2xl p-5 shadow-xl space-y-4">
            
            <div class="flex items-center justify-between pb-2 border-b border-[#3a2f23]">
              <div class="flex items-center gap-2">
                <mat-icon class="text-[#d4af37]">inventory_2</mat-icon>
                <h3 class="font-cinzel text-base font-bold text-[#c5a880]">
                  Grille des Reliques Possédées
                </h3>
              </div>
              <span class="text-xs text-[#8b6b43] font-mono">
                {{ gameState.relics().length }} reliques
              </span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              @for (relic of gameState.relics(); track relic.id) {
                <div
                  tabindex="0"
                  role="button"
                  (click)="selectRelic(relic)"
                  (keydown.enter)="selectRelic(relic)"
                  class="p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 relative shadow-md"
                  [class.bg-[#1a1612]]="selectedRelic()?.id !== relic.id"
                  [class.bg-[#241c14]]="selectedRelic()?.id === relic.id"
                  [class.border-[#3a2f23]]="selectedRelic()?.id !== relic.id"
                  [class.border-[#d4af37]]="selectedRelic()?.id === relic.id"
                  [class.shadow-[0_0_15px_rgba(212,175,55,0.2)]]="selectedRelic()?.id === relic.id">
                  
                  <!-- Top Row: Relic Image + Name + Tier Badge -->
                  <div class="flex items-start gap-3">
                    <div
                      class="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 border-2 relative shadow treasure-image-shine bg-[#0d0a07]"
                      [class.border-[#8b6b43]]="relic.rarity === 'common'"
                      [class.border-[#38bdf8]]="relic.rarity === 'rare'"
                      [class.border-[#c084fc]]="relic.rarity === 'epic'"
                      [class.border-[#fbbf24]]="relic.rarity === 'legendary'"
                      [class.border-[#fb7185]]="relic.rarity === 'mythic'">
                      @if (relic.imageUrl) {
                        <img
                          [src]="relic.imageUrl"
                          [alt]="relic.name"
                          class="w-full h-full object-cover rounded-[10px]"
                          referrerpolicy="no-referrer" />
                      } @else {
                        <mat-icon class="text-xl text-[#d4af37]">{{ relic.icon }}</mat-icon>
                      }
                      @if (relic.isEquipped) {
                        <span class="absolute -top-1 -left-1 z-10 w-3.5 h-3.5 bg-emerald-500 rounded-full border border-black shadow" title="Enchâssée"></span>
                      }
                    </div>

                    <div class="min-w-0 flex-1">
                      <div class="flex items-center justify-between gap-1">
                        <span [class]="'text-[9px] font-mono uppercase font-black tracking-wider ' + getRarityTextColor(relic.rarity)">
                          {{ relic.rarity }}
                        </span>
                        <span class="text-[10px] font-mono text-[#d4af37] font-bold">
                          Rang {{ getRomanTier(relic.tier) }}
                        </span>
                      </div>

                      <h4 class="font-cinzel text-xs font-bold text-[#f3eedd] truncate">
                        {{ relic.name }}
                      </h4>

                      <div class="text-[11px] font-mono text-[#38bdf8] font-bold mt-0.5">
                        +{{ relic.totalXpBonusPct }}% EXP au combat
                      </div>
                    </div>
                  </div>

                  <!-- Stars & Duplicate Meter -->
                  <div class="flex items-center justify-between pt-2 border-t border-[#3a2f23] text-xs">
                    <div class="flex items-center gap-0.5">
                      @for (s of [1, 2, 3, 4, 5]; track s) {
                        <span class="text-xs" [class.text-amber-400]="s <= relic.enchantLevel" [class.text-[#3a2f23]]="s > relic.enchantLevel">★</span>
                      }
                    </div>

                    <div class="text-[10px] font-mono text-[#8b6b43]">
                      Doublons : <strong class="text-[#e0dcc7]">{{ relic.duplicateCount }}</strong> / {{ relic.fusionRequired }}
                    </div>
                  </div>

                </div>
              }
            </div>

          </div>
        </div>

        <!-- Right: Relic Forge: Details, Fusion & Enchantment Altar (5 cols) -->
        <div class="lg:col-span-5 space-y-4">
          @if (selectedRelic(); as relic) {
            <div class="bg-[#120f0c] border border-[#d4af37]/60 rounded-2xl p-5 shadow-2xl space-y-5 relative">
              
              <!-- Relic Header Card -->
              <div class="flex items-start gap-3.5 pb-4 border-b border-[#3a2f23]">
                <div
                  class="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border-2 relative shadow-lg treasure-image-shine bg-[#0d0a07]"
                  [class.border-[#8b6b43]]="relic.rarity === 'common'"
                  [class.border-[#38bdf8]]="relic.rarity === 'rare'"
                  [class.border-[#c084fc]]="relic.rarity === 'epic'"
                  [class.border-[#fbbf24]]="relic.rarity === 'legendary'"
                  [class.border-[#fb7185]]="relic.rarity === 'mythic'">
                  @if (relic.imageUrl) {
                    <img
                      [src]="relic.imageUrl"
                      [alt]="relic.name"
                      class="w-full h-full object-cover rounded-[14px]"
                      referrerpolicy="no-referrer" />
                  } @else {
                    <mat-icon class="text-3xl text-[#d4af37]">{{ relic.icon }}</mat-icon>
                  }
                </div>

                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span [class]="'px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase ' + getRarityBgAndTextColor(relic.rarity)">
                      {{ relic.rarity }}
                    </span>
                    <span class="text-xs font-mono text-[#d4af37] font-bold">
                      Rang {{ getRomanTier(relic.tier) }}
                    </span>
                  </div>
                  <h3 class="font-cinzel text-base font-black text-[#f3eedd] mt-1">
                    {{ relic.name }}
                  </h3>
                  <p class="text-[11px] text-[#8b6b43] italic font-serif mt-0.5">
                    "{{ relic.lore }}"
                  </p>
                </div>
              </div>

              <!-- Equipped Status & Slot Assignment Buttons -->
              <div class="p-3 bg-[#18130e] rounded-xl border border-[#3a2f23] space-y-2">
                <div class="flex items-center justify-between text-xs font-cinzel font-bold text-[#c5a880]">
                  <span>Statut de l'Autel :</span>
                  @if (relic.isEquipped) {
                    <span class="text-emerald-400 flex items-center gap-1">
                      <mat-icon class="text-sm">check_circle</mat-icon>
                      Enchâssée dans l'Emplacement {{ relic.equippedSlot }}
                    </span>
                  } @else {
                    <span class="text-[#8b6b43]">Non enchâssée</span>
                  }
                </div>

                <div class="flex items-center gap-2 pt-1">
                  @if (relic.isEquipped) {
                    <button
                      (click)="unequip(relic)"
                      class="w-full py-2 bg-[#251f18] hover:bg-[#342b22] text-[#ff7675] border border-[#8b6b43]/50 rounded-xl text-xs font-cinzel font-bold transition-all flex items-center justify-center gap-1.5">
                      <mat-icon class="text-sm">lock_open</mat-icon>
                      Desceller de l'Autel
                    </button>
                  } @else {
                    <div class="grid grid-cols-3 gap-2 w-full">
                      @for (s of [1, 2, 3]; track s) {
                        <button
                          (click)="equipInSlot(relic, s)"
                          class="py-2 bg-[#241a12] hover:bg-[#362618] text-[#d4af37] border border-[#8b6b43] rounded-xl text-xs font-cinzel font-bold transition-all flex items-center justify-center gap-1">
                          <mat-icon class="text-sm">security</mat-icon>
                          Slot {{ s }}
                        </button>
                      }
                    </div>
                  }
                </div>
              </div>

              <!-- Passive Affixes List -->
              <div class="space-y-2">
                <div class="text-xs font-cinzel font-bold text-[#c5a880] uppercase tracking-wider">
                  Pouvoirs & Effets Passifs
                </div>
                <div class="space-y-1.5">
                  @for (affix of relic.affixes; track affix.type) {
                    <div class="p-2.5 bg-[#1a1612] border border-[#3a2f23] rounded-xl flex items-center justify-between text-xs">
                      <span class="text-[#e0dcc7] font-medium">{{ affix.label }}</span>
                      <mat-icon class="text-[#38bdf8] text-sm">bolt</mat-icon>
                    </div>
                  }
                </div>
              </div>

              <!-- ACTION 1: FUSION DE DOUBLONS (UPGRADE TIER) -->
              <div class="p-4 bg-[#18130e] border border-[#3a2f23] rounded-xl space-y-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <mat-icon class="text-[#d4af37]">merge_type</mat-icon>
                    <div>
                      <h4 class="font-cinzel text-xs font-black text-[#f3eedd]">Transmutation & Fusion</h4>
                      <p class="text-[10px] text-[#8b6b43]">Combinez vos doublons pour augmenter le Rang.</p>
                    </div>
                  </div>
                  <span class="text-xs font-mono font-bold text-[#d4af37]">
                    Rang {{ getRomanTier(relic.tier) }} ➔ Rang {{ getRomanTier(Math.min(5, relic.tier + 1)) }}
                  </span>
                </div>

                <!-- Progress Bar towards duplicate requirement -->
                <div class="space-y-1">
                  <div class="flex items-center justify-between text-[11px] font-mono">
                    <span class="text-[#8b6b43]">Doublons sacrificiels :</span>
                    <span class="font-bold" [class.text-emerald-400]="relic.duplicateCount >= relic.fusionRequired" [class.text-[#e0dcc7]]="relic.duplicateCount < relic.fusionRequired">
                      {{ relic.duplicateCount }} / {{ relic.fusionRequired }}
                    </span>
                  </div>
                  <div class="w-full bg-[#120f0c] h-2 rounded-full overflow-hidden border border-[#3a2f23]">
                    <div
                      class="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-300"
                      [style.width.%]="Math.min(100, (relic.duplicateCount / relic.fusionRequired) * 100)">
                    </div>
                  </div>
                </div>

                <div class="flex items-center justify-between pt-1">
                  <div class="currency-pill-gold flex items-center gap-1.5 text-xs font-mono font-bold">
                    <span class="currency-gold-coin text-xs">✦</span>
                    <span class="currency-gold-shine font-extrabold">{{ relic.tier * 250 }} Or</span>
                  </div>

                  <button
                    (click)="fuse(relic)"
                    [disabled]="relic.tier >= 5 || relic.duplicateCount < relic.fusionRequired || gameState.gold() < (relic.tier * 250)"
                    class="px-4 py-2 rounded-xl text-xs font-cinzel font-black border transition-all flex items-center gap-1.5 shadow"
                    [class.bg-[#d4af37]_text-[#1a120b]_border-[#fef08a]_hover:bg-[#facc15]]="relic.tier < 5 && relic.duplicateCount >= relic.fusionRequired && gameState.gold() >= (relic.tier * 250)"
                    [class.bg-[#241c14]_text-[#6b5a45]_border-[#3a2f23]_opacity-50]="relic.tier >= 5 || relic.duplicateCount < relic.fusionRequired || gameState.gold() < (relic.tier * 250)">
                    <mat-icon class="text-sm">auto_awesome</mat-icon>
                    {{ relic.tier >= 5 ? 'Rang Max' : 'Transmuter' }}
                  </button>
                </div>
              </div>

              <!-- ACTION 2: ENCHANTEMENT AUX GEMMES (STAR ENCHANTMENT) -->
              <div class="p-4 bg-[#18130e] border border-[#a855f7]/40 rounded-xl space-y-3 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <mat-icon class="text-[#c084fc]">diamond</mat-icon>
                    <div>
                      <h4 class="font-cinzel text-xs font-black text-[#f3eedd]">Infusion Stellaire aux Gemmes</h4>
                      <p class="text-[10px] text-[#c084fc]">Enchantez avec des gemmes (+10% EXP / étoile).</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-0.5">
                    @for (s of [1, 2, 3, 4, 5]; track s) {
                      <span class="text-xs" [class.text-amber-400]="s <= relic.enchantLevel" [class.text-[#3a2f23]]="s > relic.enchantLevel">★</span>
                    }
                  </div>
                </div>

                <div class="flex items-center justify-between pt-1">
                  <div class="currency-pill-gem flex items-center gap-1.5 text-xs font-mono font-bold">
                    <span class="currency-gem-facet text-xs">⬥</span>
                    <span class="currency-gem-shine font-extrabold">{{ (relic.enchantLevel + 1) * 50 }} Gemmes</span>
                  </div>

                  <button
                    (click)="enchantWithGems(relic)"
                    [disabled]="relic.enchantLevel >= 5 || gameState.gems() < ((relic.enchantLevel + 1) * 50)"
                    class="px-4 py-2 rounded-xl text-xs font-cinzel font-black border transition-all flex items-center gap-1.5 shadow"
                    [class.bg-[#a855f7]_text-white_border-[#d8b4fe]_hover:bg-[#9333ea]]="relic.enchantLevel < 5 && gameState.gems() >= ((relic.enchantLevel + 1) * 50)"
                    [class.bg-[#241c14]_text-[#6b5a45]_border-[#3a2f23]_opacity-50]="relic.enchantLevel >= 5 || gameState.gems() < ((relic.enchantLevel + 1) * 50)">
                    <mat-icon class="text-sm">flare</mat-icon>
                    {{ relic.enchantLevel >= 5 ? 'Étoiles Max (★5)' : 'Enchanter' }}
                  </button>
                </div>
              </div>

            </div>
          } @else {
            <div class="h-80 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-[#3a2f23] rounded-2xl text-[#8b6b43]">
              <mat-icon class="text-5xl text-[#8b6b43]/40 mb-2">auto_fix_high</mat-icon>
              <h4 class="font-cinzel text-sm font-bold text-[#c5a880]">Sélectionnez une relique</h4>
              <p class="text-xs text-[#6b5a45] mt-1 max-w-xs">
                Cliquez sur une relique dans votre sac pour l'équiper, fusionner ses doublons ou l'enchanter avec vos gemmes.
              </p>
            </div>
          }
        </div>

      </div>

    </div>
  `,
})
export class RelicsView {
  readonly gameState = inject(GameStateService);
  readonly sound = inject(SoundService);

  readonly selectedRelic = signal<PlayerRelic | null>(this.gameState.relics()[0] || null);

  readonly Math = Math;

  selectRelic(relic: PlayerRelic) {
    this.selectedRelic.set(relic);
    this.sound.playClick();
  }

  getRelicInSlot(slot: number): PlayerRelic | undefined {
    return this.gameState.relics().find(r => r.isEquipped && r.equippedSlot === slot);
  }

  equipInSlot(relic: PlayerRelic, slot: number) {
    this.gameState.equipRelic(relic.id, slot);
    // Refresh selected relic view reference
    const updated = this.gameState.relics().find(r => r.id === relic.id);
    if (updated) this.selectedRelic.set(updated);
  }

  unequip(relic: PlayerRelic) {
    this.gameState.unequipRelic(relic.id);
    const updated = this.gameState.relics().find(r => r.id === relic.id);
    if (updated) this.selectedRelic.set(updated);
  }

  fuse(relic: PlayerRelic) {
    this.gameState.fuseRelic(relic.id);
    const updated = this.gameState.relics().find(r => r.id === relic.id);
    if (updated) this.selectedRelic.set(updated);
  }

  enchantWithGems(relic: PlayerRelic) {
    this.gameState.enchantRelicWithGems(relic.id);
    const updated = this.gameState.relics().find(r => r.id === relic.id);
    if (updated) this.selectedRelic.set(updated);
  }

  getRomanTier(tier: number): string {
    switch (tier) {
      case 1: return 'I';
      case 2: return 'II';
      case 3: return 'III';
      case 4: return 'IV';
      case 5: return 'V';
      default: return String(tier);
    }
  }

  getRarityTextColor(rarity: CardRarity): string {
    switch (rarity) {
      case 'common': return 'text-[#c5a880]';
      case 'rare': return 'text-[#38bdf8]';
      case 'epic': return 'text-[#c084fc]';
      case 'legendary': return 'text-[#fbbf24]';
      case 'mythic': return 'text-[#fb7185]';
    }
  }

  getRarityBgAndTextColor(rarity: CardRarity): string {
    switch (rarity) {
      case 'common': return 'bg-[#241a12] text-[#c5a880] border border-[#8b6b43]';
      case 'rare': return 'bg-[#0e2438] text-[#38bdf8] border border-[#38bdf8]';
      case 'epic': return 'bg-[#28153b] text-[#c084fc] border border-[#c084fc]';
      case 'legendary': return 'bg-[#36250e] text-[#fbbf24] border border-[#fbbf24]';
      case 'mythic': return 'bg-[#381018] text-[#fb7185] border border-[#fb7185]';
    }
  }
}
