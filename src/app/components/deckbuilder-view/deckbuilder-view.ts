import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { GameStateService } from '../../services/game-state';
import { SoundService } from '../../services/sound';
import { TutorialService } from '../../services/tutorial';
import { Card } from '../../models/game.model';
import { MatIconModule } from '@angular/material/icon';

interface CardTiltState {
  rotateX: number;
  rotateY: number;
  sheenX: number;
  sheenY: number;
  isHovered: boolean;
}

@Component({
  selector: 'app-deckbuilder-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div class="max-w-7xl mx-auto p-4 md:p-6 space-y-6 animate-view-fade">
      
      <!-- Top Title & Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#120f0c] border border-[#3a2f23] rounded-2xl p-5 shadow-xl">
        <div>
          <h1 class="font-cinzel text-2xl md:text-3xl font-black text-[#c5a880] flex items-center gap-2.5">
            <mat-icon class="text-[#d4af37] text-3xl">style</mat-icon>
            Grimoire des Cartes & Forge
          </h1>
          <p class="text-[#8b6b43] text-xs font-serif mt-1">
            Assemblez vos decks tactiques, sublimez vos cartes dans la Forge et ressentez chaque invocation grâce à la mise en main tactile.
          </p>
        </div>

        <!-- Resources summary & Guide Button -->
        <div class="flex items-center gap-3 self-start md:self-auto flex-wrap">
          <button
            (click)="tutorial.openTutorial(1, 0)"
            class="medieval-btn px-3 py-2 bg-[#1a1612] hover:bg-[#251f18] text-[#d4af37] border border-[#d4af37]/60 rounded-xl text-xs font-cinzel font-bold flex items-center gap-1.5 shadow"
            title="Guide du Deckbuilding">
            <mat-icon class="text-sm">school</mat-icon>
            <span>Guide Deck</span>
          </button>

          <div class="flex items-center gap-4 bg-[#1a1612] px-4 py-2 rounded-xl border border-[#3a2f23] shadow-inner">
            <div class="flex items-center gap-1.5 font-mono font-bold text-xs text-[#d4af37]">
              <span class="text-[#d4af37]">✦</span>
              <span>{{ gameState.gold() }} Or</span>
            </div>
            <div class="flex items-center gap-1.5 font-mono font-bold text-xs text-[#4d94ff]">
              <span class="text-[#4d94ff]">⬥</span>
              <span>{{ gameState.shards() }} Éclats</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Layout: Collection (Left) & Deck Builder Panel (Right) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">

        <!-- Left: Collection Browser (8 cols) -->
        <div class="lg:col-span-8 space-y-4">
          
          <!-- Advanced Filter Controls Bar -->
          <div class="bg-[#120f0c] border border-[#3a2f23] rounded-2xl p-4 space-y-3.5 shadow-xl">
            
            <!-- Top Search & Sort Row -->
            <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <!-- Search input with clear button -->
              <div class="relative flex-1">
                <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b6b43] text-sm">search</mat-icon>
                <input
                  type="text"
                  [value]="searchQuery()"
                  (input)="onSearchInput($event)"
                  placeholder="Rechercher par nom, texte, mot-clé..."
                  class="w-full bg-[#1a1612] border border-[#3a2f23] focus:border-[#d4af37] rounded-xl pl-9 pr-8 py-2 text-xs text-[#e0dcc7] placeholder-[#6b5a45] focus:outline-none transition-colors shadow-inner font-serif" />
                @if (searchQuery()) {
                  <button
                    (click)="clearSearch()"
                    class="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8b6b43] hover:text-[#e0dcc7] p-0.5"
                    title="Effacer la recherche">
                    <mat-icon class="text-xs">close</mat-icon>
                  </button>
                }
              </div>

              <!-- Sorting Controls & Order Toggle -->
              <div class="flex items-center gap-2 flex-wrap">
                <div class="flex items-center gap-1.5 bg-[#1a1612] px-2.5 py-1 rounded-xl border border-[#3a2f23]">
                  <mat-icon class="text-xs text-[#d4af37]">sort</mat-icon>
                  <span class="text-[11px] font-cinzel text-[#8b6b43] hidden md:inline">Trier :</span>
                  <select
                    [value]="sortBy()"
                    (change)="onSortByChange($event)"
                    class="bg-transparent text-xs text-[#c5a880] focus:outline-none font-cinzel font-bold cursor-pointer py-1 pr-1">
                    <option value="cost" class="bg-[#1a1612] text-[#c5a880]">Coût Mana</option>
                    <option value="rarity" class="bg-[#1a1612] text-[#c5a880]">Rareté</option>
                    <option value="attack" class="bg-[#1a1612] text-[#c5a880]">Attaque</option>
                    <option value="health" class="bg-[#1a1612] text-[#c5a880]">Points de Vie</option>
                    <option value="name" class="bg-[#1a1612] text-[#c5a880]">Nom (A-Z)</option>
                    <option value="level" class="bg-[#1a1612] text-[#c5a880]">Niveau Forge</option>
                  </select>
                  
                  <button
                    (click)="toggleSortDirection()"
                    class="p-1 rounded bg-[#120f0c] hover:bg-[#251f18] text-[#d4af37] border border-[#3a2f23] transition-colors"
                    [title]="sortDirection() === 'asc' ? 'Ordre croissant (cliquer pour décroissant)' : 'Ordre décroissant (cliquer pour croissant)'">
                    <mat-icon class="text-xs transition-transform" [class.rotate-180]="sortDirection() === 'desc'">
                      arrow_upward
                    </mat-icon>
                  </button>
                </div>

                <!-- Reset Filters Button -->
                @if (hasActiveFilters()) {
                  <button
                    (click)="resetAllFilters()"
                    class="medieval-btn px-2.5 py-1.5 bg-[#241313] hover:bg-[#381a1a] text-[#ff9999] border border-[#ff4d4d]/50 rounded-xl text-xs font-cinzel font-bold flex items-center gap-1 shadow animate-fade-in"
                    title="Réinitialiser tous les filtres">
                    <mat-icon class="text-xs">filter_alt_off</mat-icon>
                    <span>Réinitialiser</span>
                  </button>
                }
              </div>
            </div>

            <!-- 1. ELEMENT FILTERS -->
            <div class="space-y-1.5 pt-2 border-t border-[#3a2f23]/60">
              <div class="flex items-center justify-between">
                <span class="text-[10px] uppercase font-mono tracking-widest text-[#8b6b43] flex items-center gap-1 font-bold">
                  <mat-icon class="text-xs text-[#d4af37]">public</mat-icon>
                  Élément Magique
                </span>
                <span class="text-[10px] text-[#8b6b43] font-mono">
                  {{ filteredCards().length }} / {{ gameState.cards().length }} cartes
                </span>
              </div>
              <div class="flex flex-wrap items-center gap-1.5">
                <button
                  (click)="setElementFilter('all')"
                  class="px-2.5 py-1 rounded-lg text-xs font-cinzel font-semibold transition-all border flex items-center gap-1"
                  [class.bg-[#8b2b2b]_text-white_border-[#ff4d4d]_shadow-md]="selectedElement() === 'all'"
                  [class.bg-[#1a1612]_text-[#8b6b43]_border-[#3a2f23]_hover:text-[#c5a880]]="selectedElement() !== 'all'">
                  <span>Tous</span>
                  <span class="text-[10px] opacity-75 font-mono">({{ gameState.cards().length }})</span>
                </button>
                <button
                  (click)="setElementFilter('light')"
                  class="px-2.5 py-1 rounded-lg text-xs font-cinzel font-semibold flex items-center gap-1.5 transition-all border"
                  [class.bg-[#d4af37]_text-black_border-[#ffd700]_shadow-[0_0_10px_rgba(212,175,55,0.4)]_font-bold]="selectedElement() === 'light'"
                  [class.bg-[#1a1612]_text-[#d4af37]_border-[#3a2f23]_hover:border-[#d4af37]/50]="selectedElement() !== 'light'">
                  <mat-icon class="text-xs">wb_sunny</mat-icon>
                  <span>Lumière</span>
                  <span class="text-[10px] opacity-75 font-mono">({{ getElementCardCount('light') }})</span>
                </button>
                <button
                  (click)="setElementFilter('fire')"
                  class="px-2.5 py-1 rounded-lg text-xs font-cinzel font-semibold flex items-center gap-1.5 transition-all border"
                  [class.bg-[#ff4d4d]_text-white_border-[#ff7878]_shadow-[0_0_10px_rgba(255,77,77,0.4)]_font-bold]="selectedElement() === 'fire'"
                  [class.bg-[#1a1612]_text-[#ff4d4d]_border-[#3a2f23]_hover:border-[#ff4d4d]/50]="selectedElement() !== 'fire'">
                  <mat-icon class="text-xs">local_fire_department</mat-icon>
                  <span>Feu</span>
                  <span class="text-[10px] opacity-75 font-mono">({{ getElementCardCount('fire') }})</span>
                </button>
                <button
                  (click)="setElementFilter('ice')"
                  class="px-2.5 py-1 rounded-lg text-xs font-cinzel font-semibold flex items-center gap-1.5 transition-all border"
                  [class.bg-[#4d94ff]_text-black_border-[#80b3ff]_shadow-[0_0_10px_rgba(77,148,255,0.4)]_font-bold]="selectedElement() === 'ice'"
                  [class.bg-[#1a1612]_text-[#4d94ff]_border-[#3a2f23]_hover:border-[#4d94ff]/50]="selectedElement() !== 'ice'">
                  <mat-icon class="text-xs">ac_unit</mat-icon>
                  <span>Glace</span>
                  <span class="text-[10px] opacity-75 font-mono">({{ getElementCardCount('ice') }})</span>
                </button>
                <button
                  (click)="setElementFilter('shadow')"
                  class="px-2.5 py-1 rounded-lg text-xs font-cinzel font-semibold flex items-center gap-1.5 transition-all border"
                  [class.bg-[#a855f7]_text-white_border-[#c084fc]_shadow-[0_0_10px_rgba(168,85,247,0.4)]_font-bold]="selectedElement() === 'shadow'"
                  [class.bg-[#1a1612]_text-purple-400_border-[#3a2f23]_hover:border-purple-500/50]="selectedElement() !== 'shadow'">
                  <mat-icon class="text-xs">visibility_off</mat-icon>
                  <span>Ombre</span>
                  <span class="text-[10px] opacity-75 font-mono">({{ getElementCardCount('shadow') }})</span>
                </button>
                <button
                  (click)="setElementFilter('nature')"
                  class="px-2.5 py-1 rounded-lg text-xs font-cinzel font-semibold flex items-center gap-1.5 transition-all border"
                  [class.bg-[#10b981]_text-black_border-[#34d399]_shadow-[0_0_10px_rgba(16,185,129,0.4)]_font-bold]="selectedElement() === 'nature'"
                  [class.bg-[#1a1612]_text-emerald-400_border-[#3a2f23]_hover:border-emerald-500/50]="selectedElement() !== 'nature'">
                  <mat-icon class="text-xs">park</mat-icon>
                  <span>Nature</span>
                  <span class="text-[10px] opacity-75 font-mono">({{ getElementCardCount('nature') }})</span>
                </button>
                <button
                  (click)="setElementFilter('arcane')"
                  class="px-2.5 py-1 rounded-lg text-xs font-cinzel font-semibold flex items-center gap-1.5 transition-all border"
                  [class.bg-[#d946ef]_text-white_border-[#e879f9]_shadow-[0_0_10px_rgba(217,70,239,0.4)]_font-bold]="selectedElement() === 'arcane'"
                  [class.bg-[#1a1612]_text-fuchsia-400_border-[#3a2f23]_hover:border-fuchsia-500/50]="selectedElement() !== 'arcane'">
                  <mat-icon class="text-xs">auto_awesome</mat-icon>
                  <span>Arcanes</span>
                  <span class="text-[10px] opacity-75 font-mono">({{ getElementCardCount('arcane') }})</span>
                </button>
              </div>
            </div>

            <!-- 2. MANA COST CRYSTAL FILTER -->
            <div class="space-y-1.5 pt-2 border-t border-[#3a2f23]/60">
              <span class="text-[10px] uppercase font-mono tracking-widest text-[#8b6b43] flex items-center gap-1 font-bold">
                <mat-icon class="text-xs text-[#4d94ff]">diamond</mat-icon>
                Coût en Mana (Cristaux d'Aether)
              </span>
              <div class="flex flex-wrap items-center gap-1.5">
                <button
                  (click)="setManaFilter('all')"
                  class="px-2.5 py-1 rounded-lg text-xs font-cinzel font-semibold transition-all border"
                  [class.bg-[#0d233a]_text-[#4d94ff]_border-[#4d94ff]_shadow-[0_0_8px_rgba(77,148,255,0.4)]]="selectedManaCost() === 'all'"
                  [class.bg-[#1a1612]_text-[#8b6b43]_border-[#3a2f23]_hover:text-[#c5a880]]="selectedManaCost() !== 'all'">
                  Tous les Coûts
                </button>

                @for (cost of manaCostButtons; track cost) {
                  <button
                    (click)="setManaFilter(cost)"
                    class="w-7 h-7 rounded-lg text-xs font-mono font-bold flex items-center justify-center transition-all border"
                    [class.bg-[#4d94ff]_text-[#0d233a]_border-[#80b3ff]_shadow-[0_0_12px_rgba(77,148,255,0.6)]_scale-110]="selectedManaCost() === cost"
                    [class.bg-[#0d233a]/80_text-[#4d94ff]_border-[#4d94ff]/40_hover:border-[#4d94ff]_hover:scale-105]="selectedManaCost() !== cost"
                    [title]="'Filtrer par coût mana: ' + cost">
                    {{ cost }}
                  </button>
                }
              </div>
            </div>

            <!-- 3. RARITY & TYPE FILTERS -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-[#3a2f23]/60">
              
              <!-- Rarity Filters -->
              <div class="space-y-1.5">
                <span class="text-[10px] uppercase font-mono tracking-widest text-[#8b6b43] flex items-center gap-1 font-bold">
                  <mat-icon class="text-xs text-[#d4af37]">military_tech</mat-icon>
                  Rareté de Carte
                </span>
                <div class="flex flex-wrap items-center gap-1">
                  <button
                    (click)="setRarityFilter('all')"
                    class="px-2 py-0.5 rounded text-[11px] font-cinzel border transition-all"
                    [class.bg-[#8b2b2b]_text-white_border-[#ff4d4d]]="selectedRarity() === 'all'"
                    [class.bg-[#1a1612]_text-[#8b6b43]_border-[#3a2f23]]="selectedRarity() !== 'all'">
                    Toutes
                  </button>
                  <button
                    (click)="setRarityFilter('common')"
                    class="px-2 py-0.5 rounded text-[11px] font-cinzel border transition-all"
                    [class.bg-[#a89f91]_text-black_border-white_font-bold]="selectedRarity() === 'common'"
                    [class.bg-[#1a1612]_text-[#a89f91]_border-[#3a2f23]_hover:border-[#a89f91]/50]="selectedRarity() !== 'common'">
                    Commune
                  </button>
                  <button
                    (click)="setRarityFilter('rare')"
                    class="px-2 py-0.5 rounded text-[11px] font-cinzel border transition-all"
                    [class.bg-[#4d94ff]_text-black_border-[#80b3ff]_font-bold]="selectedRarity() === 'rare'"
                    [class.bg-[#1a1612]_text-[#4d94ff]_border-[#3a2f23]_hover:border-[#4d94ff]/50]="selectedRarity() !== 'rare'">
                    Rare
                  </button>
                  <button
                    (click)="setRarityFilter('epic')"
                    class="px-2 py-0.5 rounded text-[11px] font-cinzel border transition-all"
                    [class.bg-[#bf5af2]_text-white_border-[#d580ff]_font-bold]="selectedRarity() === 'epic'"
                    [class.bg-[#1a1612]_text-[#bf5af2]_border-[#3a2f23]_hover:border-[#bf5af2]/50]="selectedRarity() !== 'epic'">
                    Épique
                  </button>
                  <button
                    (click)="setRarityFilter('legendary')"
                    class="px-2 py-0.5 rounded text-[11px] font-cinzel border transition-all"
                    [class.bg-[#d4af37]_text-black_border-[#ffd700]_font-bold]="selectedRarity() === 'legendary'"
                    [class.bg-[#1a1612]_text-[#d4af37]_border-[#3a2f23]_hover:border-[#d4af37]/50]="selectedRarity() !== 'legendary'">
                    Légendaire
                  </button>
                  <button
                    (click)="setRarityFilter('mythic')"
                    class="px-2 py-0.5 rounded text-[11px] font-cinzel border transition-all"
                    [class.bg-[#ff3b30]_text-white_border-[#ff6961]_font-bold]="selectedRarity() === 'mythic'"
                    [class.bg-[#1a1612]_text-[#ff3b30]_border-[#3a2f23]_hover:border-[#ff3b30]/50]="selectedRarity() !== 'mythic'">
                    Mythique
                  </button>
                </div>
              </div>

              <!-- Type Filters -->
              <div class="space-y-1.5">
                <span class="text-[10px] uppercase font-mono tracking-widest text-[#8b6b43] flex items-center gap-1 font-bold">
                  <mat-icon class="text-xs text-[#d4af37]">category</mat-icon>
                  Type & Catégorie
                </span>
                <div class="flex flex-wrap items-center gap-1">
                  <button
                    (click)="setTypeFilter('all')"
                    class="px-2 py-0.5 rounded text-[11px] font-mono border transition-all"
                    [class.bg-[#8b2b2b]_text-white_border-[#ff4d4d]]="selectedType() === 'all'"
                    [class.bg-[#1a1612]_text-[#8b6b43]_border-[#3a2f23]]="selectedType() !== 'all'">
                    Tous
                  </button>
                  <button
                    (click)="setTypeFilter('creature')"
                    class="px-2 py-0.5 rounded text-[11px] font-mono border transition-all flex items-center gap-1"
                    [class.bg-[#8b2b2b]_text-white_border-[#ff4d4d]]="selectedType() === 'creature'"
                    [class.bg-[#1a1612]_text-[#c5a880]_border-[#3a2f23]]="selectedType() !== 'creature'">
                    <mat-icon class="text-xs">shield</mat-icon>
                    <span>Créatures</span>
                  </button>
                  <button
                    (click)="setTypeFilter('spell')"
                    class="px-2 py-0.5 rounded text-[11px] font-mono border transition-all flex items-center gap-1"
                    [class.bg-[#8b2b2b]_text-white_border-[#ff4d4d]]="selectedType() === 'spell'"
                    [class.bg-[#1a1612]_text-[#c5a880]_border-[#3a2f23]]="selectedType() !== 'spell'">
                    <mat-icon class="text-xs">auto_fix_normal</mat-icon>
                    <span>Sorts</span>
                  </button>
                  <button
                    (click)="setTypeFilter('relic')"
                    class="px-2 py-0.5 rounded text-[11px] font-mono border transition-all flex items-center gap-1"
                    [class.bg-[#8b2b2b]_text-white_border-[#ff4d4d]]="selectedType() === 'relic'"
                    [class.bg-[#1a1612]_text-[#c5a880]_border-[#3a2f23]]="selectedType() !== 'relic'">
                    <mat-icon class="text-xs">token</mat-icon>
                    <span>Reliques</span>
                  </button>
                  <button
                    (click)="setTypeFilter('secret')"
                    class="px-2 py-0.5 rounded text-[11px] font-mono border transition-all flex items-center gap-1"
                    [class.bg-[#8b2b2b]_text-white_border-[#ff4d4d]]="selectedType() === 'secret'"
                    [class.bg-[#1a1612]_text-[#c5a880]_border-[#3a2f23]]="selectedType() !== 'secret'">
                    <mat-icon class="text-xs">help_outline</mat-icon>
                    <span>Secrets</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- 4. KEYWORDS & SPECIAL STATUS BADGES -->
            <div class="space-y-1.5 pt-2 border-t border-[#3a2f23]/60">
              <span class="text-[10px] uppercase font-mono tracking-widest text-[#8b6b43] flex items-center gap-1 font-bold">
                <mat-icon class="text-xs text-[#d4af37]">bolt</mat-icon>
                Effets Spéciaux & Statuts
              </span>
              <div class="flex flex-wrap items-center gap-1.5 text-xs">
                <button
                  (click)="setKeywordFilter('all')"
                  class="px-2 py-0.5 rounded text-[11px] font-cinzel border transition-all"
                  [class.bg-[#8b2b2b]_text-white_border-[#ff4d4d]]="selectedKeyword() === 'all'"
                  [class.bg-[#1a1612]_text-[#8b6b43]_border-[#3a2f23]]="selectedKeyword() !== 'all'">
                  Tous les Effets
                </button>
                <button
                  (click)="setKeywordFilter('taunt')"
                  class="px-2 py-0.5 rounded text-[11px] font-cinzel border transition-all flex items-center gap-1"
                  [class.bg-[#8b2b2b]_text-white_border-[#ff4d4d]]="selectedKeyword() === 'taunt'"
                  [class.bg-[#1a1612]_text-[#d4af37]_border-[#3a2f23]]="selectedKeyword() !== 'taunt'">
                  <mat-icon class="text-xs">shield</mat-icon>
                  <span>Provocation</span>
                </button>
                <button
                  (click)="setKeywordFilter('divineShield')"
                  class="px-2 py-0.5 rounded text-[11px] font-cinzel border transition-all flex items-center gap-1"
                  [class.bg-[#8b2b2b]_text-white_border-[#ff4d4d]]="selectedKeyword() === 'divineShield'"
                  [class.bg-[#1a1612]_text-[#d4af37]_border-[#3a2f23]]="selectedKeyword() !== 'divineShield'">
                  <mat-icon class="text-xs">verified_user</mat-icon>
                  <span>Bouclier Divin</span>
                </button>
                <button
                  (click)="setKeywordFilter('lifesteal')"
                  class="px-2 py-0.5 rounded text-[11px] font-cinzel border transition-all flex items-center gap-1"
                  [class.bg-[#8b2b2b]_text-white_border-[#ff4d4d]]="selectedKeyword() === 'lifesteal'"
                  [class.bg-[#1a1612]_text-[#ff4d4d]_border-[#3a2f23]]="selectedKeyword() !== 'lifesteal'">
                  <mat-icon class="text-xs">water_drop</mat-icon>
                  <span>Vol de Vie</span>
                </button>
                <button
                  (click)="setKeywordFilter('foil')"
                  class="px-2 py-0.5 rounded text-[11px] font-cinzel border transition-all flex items-center gap-1"
                  [class.bg-[#d4af37]_text-black_border-[#ffd700]_font-bold]="selectedKeyword() === 'foil'"
                  [class.bg-[#1a1612]_text-[#d4af37]_border-[#3a2f23]]="selectedKeyword() !== 'foil'">
                  <mat-icon class="text-xs">auto_awesome</mat-icon>
                  <span>Cartes Foil (Dorées)</span>
                </button>
                <button
                  (click)="setKeywordFilter('forgeGrimoire')"
                  class="px-2 py-0.5 rounded text-[11px] font-cinzel border transition-all flex items-center gap-1"
                  [class.bg-[#d4af37]_text-black_border-[#ffd700]_font-bold]="selectedKeyword() === 'forgeGrimoire'"
                  [class.bg-[#1a1612]_text-[#d4af37]_border-[#3a2f23]]="selectedKeyword() !== 'forgeGrimoire'">
                  <mat-icon class="text-xs">local_fire_department</mat-icon>
                  <span>Grimoire Forges (56)</span>
                </button>
                <button
                  (click)="setKeywordFilter('upgradeable')"
                  class="px-2 py-0.5 rounded text-[11px] font-cinzel border transition-all flex items-center gap-1"
                  [class.bg-[#4d94ff]_text-black_border-[#80b3ff]_font-bold]="selectedKeyword() === 'upgradeable'"
                  [class.bg-[#1a1612]_text-[#4d94ff]_border-[#3a2f23]]="selectedKeyword() !== 'upgradeable'">
                  <mat-icon class="text-xs">hardware</mat-icon>
                  <span>Améliorables (Forge)</span>
                </button>
                <button
                  (click)="setKeywordFilter('inDeck')"
                  class="px-2 py-0.5 rounded text-[11px] font-cinzel border transition-all flex items-center gap-1"
                  [class.bg-[#10b981]_text-black_border-[#34d399]_font-bold]="selectedKeyword() === 'inDeck'"
                  [class.bg-[#1a1612]_text-emerald-400_border-[#3a2f23]]="selectedKeyword() !== 'inDeck'">
                  <mat-icon class="text-xs">menu_book</mat-icon>
                  <span>Dans le Deck Actif</span>
                </button>
              </div>
            </div>

            <!-- Active Filter Chips & Pagination Summary -->
            <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#3a2f23]/60 text-xs">
              <div class="flex flex-wrap items-center gap-1.5">
                <span class="text-[#8b6b43] font-cinzel text-[11px]">Filtres actifs :</span>
                @if (!hasActiveFilters()) {
                  <span class="text-[#6b5a45] text-[11px] italic font-serif">Aucun filtre appliqué (Affichage complet)</span>
                }
                @if (selectedElement() !== 'all') {
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#1a1612] border border-[#8b6b43] text-[#d4af37] text-[10px] font-cinzel font-bold">
                    <span>Élément : {{ getElementLabel(selectedElement()) }}</span>
                    <button (click)="setElementFilter('all')" class="hover:text-white"><mat-icon class="text-[10px]">close</mat-icon></button>
                  </span>
                }
                @if (selectedManaCost() !== 'all') {
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#0d233a] border border-[#4d94ff] text-[#4d94ff] text-[10px] font-mono font-bold">
                    <span>Mana : {{ selectedManaCost() }}</span>
                    <button (click)="setManaFilter('all')" class="hover:text-white"><mat-icon class="text-[10px]">close</mat-icon></button>
                  </span>
                }
                @if (selectedRarity() !== 'all') {
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#1a1612] border border-[#bf5af2] text-[#bf5af2] text-[10px] font-cinzel font-bold">
                    <span>Rareté : {{ getRarityLabel(selectedRarity()) }}</span>
                    <button (click)="setRarityFilter('all')" class="hover:text-white"><mat-icon class="text-[10px]">close</mat-icon></button>
                  </span>
                }
                @if (selectedType() !== 'all') {
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#1a1612] border border-[#8b6b43] text-[#c5a880] text-[10px] font-mono">
                    <span>Type : {{ selectedType() }}</span>
                    <button (click)="setTypeFilter('all')" class="hover:text-white"><mat-icon class="text-[10px]">close</mat-icon></button>
                  </span>
                }
                @if (selectedKeyword() !== 'all') {
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#1a1612] border border-[#8b6b43] text-[#d4af37] text-[10px] font-cinzel font-bold">
                    <span>Effet : {{ getKeywordLabel(selectedKeyword()) }}</span>
                    <button (click)="setKeywordFilter('all')" class="hover:text-white"><mat-icon class="text-[10px]">close</mat-icon></button>
                  </span>
                }
                @if (searchQuery()) {
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#1a1612] border border-[#d4af37] text-[#e0dcc7] text-[10px] font-serif">
                    <span>"{{ searchQuery() }}"</span>
                    <button (click)="clearSearch()" class="hover:text-[#ff4d4d]"><mat-icon class="text-[10px]">close</mat-icon></button>
                  </span>
                }
              </div>

              <!-- Pagination Info & Controls Top -->
              <div class="flex items-center gap-2 self-end sm:self-auto">
                <span class="text-[#8b6b43] font-mono text-[11px]">
                  {{ filteredCards().length }} cartes • Page {{ currentPage() }}/{{ totalPages() }}
                </span>
                <div class="flex items-center gap-1">
                  <button
                    (click)="prevPage()"
                    [disabled]="currentPage() <= 1"
                    class="p-1 rounded bg-[#1a1612] border border-[#3a2f23] text-[#c5a880] disabled:opacity-30 hover:border-[#8b6b43] transition-colors"
                    title="Page précédente">
                    <mat-icon class="text-xs">chevron_left</mat-icon>
                  </button>
                  <button
                    (click)="nextPage()"
                    [disabled]="currentPage() >= totalPages()"
                    class="p-1 rounded bg-[#1a1612] border border-[#3a2f23] text-[#c5a880] disabled:opacity-30 hover:border-[#8b6b43] transition-colors"
                    title="Page suivante">
                    <mat-icon class="text-xs">chevron_right</mat-icon>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Cards Grid with Tactile 3D Tilt and In-Hand Grab -->
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 min-h-[460px]">
            @for (card of paginatedCards(); track card.id) {
              @let tilt = getCardTilt(card.id);
              @let isHeld = heldCard()?.id === card.id;
              @let rarityMeta = gameState.getCardRarityVisualMeta(card.id);

              <div
                tabindex="0"
                role="button"
                (mouseenter)="onCardHover(card)"
                (mousemove)="onCardMouseMove($event, card.id)"
                (mouseleave)="onCardMouseLeave(card.id)"
                (click)="selectHeldCard(card)"
                (keydown.enter)="selectHeldCard(card)"
                (keydown.space)="selectHeldCard(card)"
                class="card-3d-perspective relative rounded-xl cursor-pointer select-none group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]"
                [title]="'Cliquer pour tenir ' + card.name + ' en main • Rareté : ' + rarityMeta.label">
                
                <!-- Inner Card Surface with Dynamic 3D Transform & Persistent GameState Rarity Glow -->
                <div
                  [class]="'card-3d-inner card-holo relative rounded-xl bg-[#1a1612] border-2 p-2.5 flex flex-col justify-between h-[250px] transition-[border-color,box-shadow] ' + rarityMeta.glowClass + (isHeld ? ' animate-card-pickup' : '')"
                  [style.transform]="tilt.isHovered ? 'perspective(1000px) rotateX(' + tilt.rotateX + 'deg) rotateY(' + tilt.rotateY + 'deg) translateY(-8px) scale3d(1.04, 1.04, 1.04)' : isHeld ? 'translateY(-6px) scale(1.02)' : 'none'">
                  
                  <!-- Dynamic Dynamic Foil Sheen Overlay when hovered/foil -->
                  @if (card.foil || tilt.isHovered) {
                    <div
                      class="card-3d-glare"
                      [style.--glare-x.%]="tilt.sheenX"
                      [style.--glare-y.%]="tilt.sheenY"
                      [style.opacity]="tilt.isHovered ? '0.7' : '0.25'">
                    </div>
                  }

                  <!-- Mana Badge (Crystal Style) with 3D Pop Layer -->
                  <div class="card-3d-layer-pop absolute -top-2.5 -left-2.5 w-6 h-6 rounded-full bg-[#0d233a] border-2 border-[#4d94ff] text-[#4d94ff] font-mono font-black text-[11px] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    {{ card.cost }}
                  </div>

                  <!-- In-Hand Badge Indicator with 3D Pop Layer -->
                  @if (isHeld) {
                    <div class="card-3d-layer-pop absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-[#8b2b2b] border border-[#ff4d4d] text-white font-cinzel font-bold text-[8px] tracking-wider uppercase shadow-md animate-pulse">
                      En Main
                    </div>
                  }

                  <!-- Level & Star Badge with 3D Pop Layer -->
                  <div class="card-3d-layer-pop absolute -top-2.5 -right-2.5 px-1.5 py-0.5 rounded-full bg-[#120f0c] border border-[#8b6b43] text-[#d4af37] font-mono font-bold text-[9px] flex items-center gap-0.5 shadow-md">
                    <span>★{{ card.level }}</span>
                  </div>

                  <!-- Card Name & Rarity Label Header with 3D Float Layer -->
                  <div class="card-3d-layer-float text-center mt-1 space-y-0.5">
                    <div class="font-cinzel text-xs font-bold text-[#c5a880] group-hover:text-[#d4af37] truncate transition-colors">
                      {{ card.name }}
                    </div>
                    <div [class]="'text-[9px] font-cinzel font-semibold tracking-wide ' + rarityMeta.textClass">
                      {{ rarityMeta.label }}
                    </div>
                  </div>

                  <!-- Illustrated Medieval Artwork Frame with 3D Pop Layer -->
                  <div class="card-3d-layer-pop my-1.5 flex flex-col items-center justify-center relative">
                    <div class="w-full h-24 rounded-lg bg-[#120f0c] border border-[#3a2f23] flex items-center justify-center shadow-inner group-hover:border-[#c5a880] transition-colors relative overflow-hidden">
                      @if (card.imageUrl) {
                        <img
                          [src]="card.imageUrl"
                          [alt]="card.name"
                          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          referrerpolicy="no-referrer" />
                      } @else {
                        <mat-icon class="text-3xl text-[#c5a880] group-hover:scale-115 transition-transform duration-300">
                          {{ card.icon }}
                        </mat-icon>
                      }
                      @if (card.foil) {
                        <div class="absolute inset-0 foil-animated opacity-35 pointer-events-none"></div>
                      }
                    </div>
                  </div>

                  <!-- Short Effect Description with 3D Layer -->
                  <div class="card-3d-layer-deep text-[9px] text-[#e0dcc7]/90 text-center leading-tight line-clamp-2 bg-[#0d0b09]/85 p-1 rounded border border-[#3a2f23] mb-1.5 shadow">
                    {{ card.description }}
                  </div>

                  <!-- Footer Attack / Health / Quick Add with 3D Float Layer -->
                  <div class="card-3d-layer-float flex items-center justify-between pt-1 border-t border-[#3a2f23]">
                    @if (card.type === 'creature') {
                      <div class="flex items-center gap-1.5 font-mono text-xs font-bold">
                        <span class="px-1.5 py-0.2 bg-[#241313] text-[#ff4d4d] rounded border border-[#5c2424] inline-flex items-center gap-0.5" title="Attaque">
                          <mat-icon class="text-[11px]">swords</mat-icon>
                          {{ card.attack }}
                        </span>
                        <span class="px-1.5 py-0.2 bg-[#122812] text-[#4dff88] rounded border border-[#225c22] inline-flex items-center gap-0.5" title="Points de Vie">
                          <mat-icon class="text-[11px]">favorite</mat-icon>
                          {{ card.health }}
                        </span>
                      </div>
                    } @else {
                      <span class="text-[9px] font-cinzel text-[#4d94ff] font-semibold uppercase tracking-wider flex items-center gap-1">
                        <mat-icon class="text-xs">auto_fix_normal</mat-icon> Sort
                      </span>
                    }

                    <div class="flex items-center gap-1">
                      <!-- Quick Inspect Button -->
                      <button
                        (click)="openInspectModal(card, $event)"
                        class="medieval-btn p-1 bg-[#120f0c] hover:bg-[#251f18] text-[#8b6b43] hover:text-[#c5a880] rounded border border-[#3a2f23] text-[10px]"
                        title="Inspecter la carte">
                        <mat-icon class="text-xs">zoom_in</mat-icon>
                      </button>

                      <!-- Quick Add to Deck Button -->
                      <button
                        (click)="addCardToActiveDeck(card, $event)"
                        class="medieval-btn p-1 bg-[#120f0c] hover:bg-[#8b2b2b] text-[#c5a880] hover:text-white rounded border border-[#3a2f23] hover:border-[#ff4d4d] text-[10px] transition-colors"
                        title="Ajouter au deck actif">
                        <mat-icon class="text-xs">add</mat-icon>
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            }
          </div>

          <!-- MISE EN MAIN TACTILE (Interactive Hand Dock) -->
          @if (heldCard(); as card) {
            <div class="bg-[#120f0c] border-2 border-[#8b6b43] rounded-2xl p-4 shadow-2xl space-y-3 animate-in fade-in slide-in-from-bottom-3 duration-300">
              
              <div class="flex items-center justify-between border-b border-[#3a2f23] pb-2">
                <div class="flex items-center gap-2">
                  <mat-icon class="text-[#d4af37] text-lg">front_hand</mat-icon>
                  <span class="font-cinzel text-xs font-bold uppercase tracking-widest text-[#d4af37]">
                    Mise en Main Active • {{ card.name }}
                  </span>
                </div>
                <div class="flex items-center gap-2 text-xs font-mono text-[#8b6b43]">
                  <span>Copies dans le Deck : {{ countInActiveDeck(card.id) }}</span>
                  <button
                    (click)="heldCard.set(null)"
                    class="text-[#6b5a45] hover:text-[#e0dcc7] p-0.5"
                    title="Ranger la carte">
                    <mat-icon class="text-sm">close</mat-icon>
                  </button>
                </div>
              </div>

              <!-- Interactive Floating Hand Presentation -->
              <div class="flex flex-col sm:flex-row items-center gap-4">
                
                <!-- Floating In-Hand Hero Card Art -->
                @let heldRarityMeta = gameState.getCardRarityVisualMeta(card.id);
                <div class="relative shrink-0 card-3d-perspective">
                  <div
                    [class]="'w-28 h-40 rounded-xl bg-[#1a1612] border-2 p-2 flex flex-col justify-between shadow-2xl relative animate-card-levitate transition-[border-color,box-shadow] ' + heldRarityMeta.glowClass">
                    
                    <!-- Mana -->
                    <div class="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-[#0d233a] border border-[#4d94ff] text-[#4d94ff] font-mono font-black text-xs flex items-center justify-center shadow">
                      {{ card.cost }}
                    </div>

                    <div class="text-center font-cinzel text-[11px] font-bold text-[#c5a880] truncate mt-1">
                      {{ card.name }}
                    </div>

                    <div class="my-1.5 w-full h-20 rounded-lg overflow-hidden border border-[#8b6b43]/60 bg-[#120f0c] flex items-center justify-center">
                      @if (card.imageUrl) {
                        <img
                          [src]="card.imageUrl"
                          [alt]="card.name"
                          class="w-full h-full object-cover"
                          referrerpolicy="no-referrer" />
                      } @else {
                        <mat-icon class="text-4xl text-[#d4af37]">{{ card.icon }}</mat-icon>
                      }
                    </div>

                    <div class="flex justify-between items-center text-[10px] font-mono font-bold">
                      @if (card.type === 'creature') {
                        <span class="text-[#ff4d4d] inline-flex items-center gap-0.5">
                          <mat-icon class="text-[11px]">swords</mat-icon>
                          {{ card.attack }}
                        </span>
                        <span class="text-[#4dff88] inline-flex items-center gap-0.5">
                          <mat-icon class="text-[11px]">favorite</mat-icon>
                          {{ card.health }}
                        </span>
                      } @else {
                        <span class="text-[#4d94ff] font-cinzel text-[9px] uppercase mx-auto">Sort Épique</span>
                      }
                    </div>
                  </div>
                </div>

                <!-- Detailed Card Lore, Synergies & Tactical Actions -->
                <div class="flex-1 space-y-2 text-xs">
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="px-2 py-0.5 rounded bg-[#1a1612] border border-[#3a2f23] text-[#c5a880] font-cinzel font-semibold uppercase text-[10px]">
                      Élément : {{ getElementLabel(card.element) }}
                    </span>
                    <span class="px-2 py-0.5 rounded bg-[#1a1612] border border-[#3a2f23] text-[#d4af37] font-mono font-semibold text-[10px]">
                      Rareté : {{ card.rarity }}
                    </span>
                    <span class="px-2 py-0.5 rounded bg-[#1a1612] border border-[#3a2f23] text-[#4d94ff] font-mono font-semibold text-[10px]">
                      Éclats : {{ card.shards }}/{{ card.shardsRequired }}
                    </span>
                  </div>

                  <p class="text-[#e0dcc7] font-medium leading-relaxed bg-[#1a1612] p-2.5 rounded-lg border border-[#3a2f23]">
                    {{ card.description }}
                  </p>

                  <p class="text-[#8b6b43] italic text-[11px] font-serif">
                    &ldquo;{{ card.flavorText || "Une relique forgee au coeur d'Aetheria." }}&rdquo;
                  </p>

                  <!-- Action Buttons Row -->
                  <div class="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      (click)="addCardToActiveDeck(card, $event)"
                      [disabled]="gameState.activeDeck().cardIds.length >= 10"
                      class="crimson-btn px-4 py-1.5 rounded-lg font-cinzel font-bold text-xs flex items-center gap-1.5 disabled:opacity-40">
                      <mat-icon class="text-sm">add</mat-icon>
                      <span>Ajouter au Grimoire (+1)</span>
                    </button>

                    <button
                      (click)="playSummonPreview(card)"
                      class="medieval-btn px-3 py-1.5 bg-[#1a1612] hover:bg-[#251f18] text-[#c5a880] border border-[#3a2f23] rounded-lg font-cinzel font-semibold text-xs flex items-center gap-1.5">
                      <mat-icon class="text-sm text-[#d4af37]">volume_up</mat-icon>
                      <span>Tester l'Effet Sonore</span>
                    </button>

                    <button
                      (click)="openInspectModal(card, $event)"
                      class="medieval-btn px-3 py-1.5 bg-[#1a1612] hover:bg-[#251f18] text-[#d4af37] border border-[#3a2f23] hover:border-[#d4af37] rounded-lg font-cinzel font-semibold text-xs flex items-center gap-1.5">
                      <mat-icon class="text-sm">auto_fix_high</mat-icon>
                      <span>Améliorer dans la Forge</span>
                    </button>
                  </div>
                </div>

              </div>

            </div>
          }
        </div>

        <!-- Right: Active Deck Sidebar (4 cols) -->
        <div class="lg:col-span-4 space-y-4">
          @let activeDeck = gameState.activeDeck();
          
          <div class="bg-[#120f0c] border border-[#3a2f23] rounded-2xl p-4 shadow-xl space-y-3.5">
            
            <!-- Deck Selector & Actions -->
            <div class="space-y-2 pb-3 border-b border-[#3a2f23]">
              <div class="flex items-center justify-between gap-2">
                <span class="text-[10px] font-cinzel text-[#8b6b43] uppercase tracking-wider flex items-center gap-1 font-bold">
                  <mat-icon class="text-xs text-[#d4af37]">style</mat-icon>
                  Grimoire Actif
                </span>

                <div class="flex items-center gap-1">
                  <button
                    (click)="openStatsModal()"
                    class="medieval-btn px-2 py-1 bg-[#1a1612] hover:bg-[#251f18] text-[#4d94ff] border border-[#4d94ff]/40 hover:border-[#4d94ff] rounded-lg text-[10px] font-cinzel font-bold flex items-center gap-1 shadow"
                    title="Ouvrir le rapport d'analyse stratégique et équilibrage">
                    <mat-icon class="text-xs">insights</mat-icon>
                    <span>Analyse</span>
                  </button>

                  <button
                    (click)="createNewDeckPrompt()"
                    class="medieval-btn p-1.5 bg-[#1a1612] hover:bg-[#251f18] text-[#c5a880] rounded-lg border border-[#3a2f23] text-xs"
                    title="Nouveau Grimoire">
                    <mat-icon class="text-sm">add</mat-icon>
                  </button>

                  <button
                    (click)="duplicateActiveDeck()"
                    class="medieval-btn p-1.5 bg-[#1a1612] hover:bg-[#251f18] text-[#c5a880] rounded-lg border border-[#3a2f23] text-xs"
                    title="Dupliquer ce Grimoire">
                    <mat-icon class="text-sm">content_copy</mat-icon>
                  </button>

                  <button
                    (click)="clearActiveDeck()"
                    class="medieval-btn p-1.5 bg-[#1a1612] hover:bg-[#381a1a] text-[#ff9999] hover:text-[#ff4d4d] rounded-lg border border-[#3a2f23] hover:border-[#ff4d4d]/40 text-xs"
                    title="Vider le Grimoire">
                    <mat-icon class="text-sm">delete_sweep</mat-icon>
                  </button>
                </div>
              </div>

              <!-- Deck Switcher Dropdown -->
              <div class="relative">
                <select
                  [value]="gameState.activeDeckId()"
                  (change)="onSelectDeck($event)"
                  class="w-full bg-[#1a1612] border border-[#3a2f23] focus:border-[#d4af37] text-[#c5a880] font-cinzel font-bold text-xs py-1.5 pl-3 pr-7 rounded-xl appearance-none cursor-pointer focus:outline-none shadow-inner truncate">
                  @for (deck of gameState.decks(); track deck.id) {
                    <option [value]="deck.id" class="bg-[#120f0c] text-[#c5a880]">
                      {{ deck.name }} ({{ deck.cardIds.length }}/10)
                    </option>
                  }
                </select>
                <mat-icon class="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#8b6b43] pointer-events-none">
                  expand_more
                </mat-icon>
              </div>
            </div>

            <!-- REAL-TIME STATISTICS DASHBOARD: Average Cost & Minion/Spell Ratio -->
            <div class="grid grid-cols-2 gap-2.5">
              
              <!-- Stat 1: Average Card Cost -->
              @let avgStats = averageCostStats();
              <div class="bg-[#1a1612] p-2.5 rounded-xl border border-[#3a2f23] flex flex-col justify-between shadow-inner">
                <div class="flex items-center justify-between gap-1">
                  <span class="text-[10px] font-cinzel text-[#8b6b43] uppercase flex items-center gap-1 font-bold">
                    <mat-icon class="text-xs text-[#4d94ff]">diamond</mat-icon>
                    Coût Moyen
                  </span>
                  <span
                    class="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold border truncate max-w-[85px]"
                    [class]="avgStats.archetypeBadgeClass"
                    [title]="avgStats.archetypeDesc">
                    {{ avgStats.archetype }}
                  </span>
                </div>
                
                <div class="flex items-baseline gap-1.5 my-1.5">
                  <span class="font-mono text-2xl font-black text-[#4d94ff]">{{ avgStats.formatted }}</span>
                  <span class="text-[10px] font-mono text-[#8b6b43]">Mana / carte</span>
                </div>

                <div class="text-[9px] font-mono text-[#6b5a45] flex items-center justify-between border-t border-[#3a2f23]/60 pt-1">
                  <span>Total: {{ avgStats.totalMana }} Mana</span>
                  <span>Min {{ avgStats.minCost }} / Max {{ avgStats.maxCost }}</span>
                </div>
              </div>

              <!-- Stat 2: Minion / Spell Ratio -->
              @let ratioStats = minionSpellStats();
              <div class="bg-[#1a1612] p-2.5 rounded-xl border border-[#3a2f23] flex flex-col justify-between shadow-inner">
                <div class="flex items-center justify-between">
                  <span class="text-[10px] font-cinzel text-[#8b6b43] uppercase flex items-center gap-1 font-bold">
                    <mat-icon class="text-xs text-[#eab308]">pie_chart</mat-icon>
                    Ratio Unités / Sorts
                  </span>
                  <span class="font-mono text-[10px] font-bold text-[#e0dcc7] bg-[#120f0c] px-1.5 py-0.5 rounded border border-[#3a2f23]">
                    {{ ratioStats.ratioText }}
                  </span>
                </div>

                <!-- Dual-Color Segmented Bar -->
                <div class="my-1.5">
                  <div class="h-2 w-full bg-[#120f0c] rounded-full overflow-hidden flex border border-[#3a2f23]">
                    <div
                      class="bg-gradient-to-r from-[#10b981] to-[#34d399] transition-all duration-300"
                      [style.width.%]="ratioStats.minionPct"
                      [title]="ratioStats.minions + ' Créatures (' + ratioStats.minionPct + '%)'"></div>
                    <div
                      class="bg-gradient-to-r from-[#8b5cf6] to-[#c084fc] transition-all duration-300"
                      [style.width.%]="ratioStats.spellPct"
                      [title]="ratioStats.spells + ' Sorts (' + ratioStats.spellPct + '%)'"></div>
                    @if (ratioStats.relicPct > 0) {
                      <div
                        class="bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] transition-all duration-300"
                        [style.width.%]="ratioStats.relicPct"
                        [title]="ratioStats.relics + ' Reliques (' + ratioStats.relicPct + '%)'"></div>
                    }
                  </div>
                </div>

                <div class="flex items-center justify-between text-[9px] font-mono text-[#8b6b43] border-t border-[#3a2f23]/60 pt-1">
                  <span class="text-[#34d399] flex items-center gap-0.5">
                    <mat-icon class="text-[10px]">shield</mat-icon>
                    {{ ratioStats.minions }} ({{ ratioStats.minionPct }}%)
                  </span>
                  <span class="text-[#c084fc] flex items-center gap-0.5">
                    <mat-icon class="text-[10px]">auto_fix_normal</mat-icon>
                    {{ ratioStats.spells }} ({{ ratioStats.spellPct }}%)
                  </span>
                </div>
              </div>

            </div>

            <!-- REAL-TIME MANA CURVE DISTRIBUTION HISTOGRAM -->
            <div class="bg-[#1a1612] p-3 rounded-xl border border-[#3a2f23] space-y-2.5 shadow-inner">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-1.5">
                  <mat-icon class="text-xs text-[#4d94ff]">bar_chart</mat-icon>
                  <span class="text-[10px] font-cinzel text-[#8b6b43] uppercase tracking-wider font-bold">
                    Distribution de Courbe de Mana
                  </span>
                </div>
                <span class="font-mono text-[11px] font-bold text-[#c5a880]">
                  {{ activeDeck.cardIds.length }} / 10 cartes
                </span>
              </div>

              <!-- Interactive Columns (0 to 7+) -->
              <div class="flex items-end gap-1.5 h-20 bg-[#120f0c] p-2 pt-4 rounded-xl border border-[#3a2f23]/80">
                @for (bar of manaHistogram(); track bar.cost) {
                  @let isSlotSelected = selectedCurveFilter() === bar.cost;
                  <button
                    type="button"
                    (click)="toggleCurveFilter(bar.cost)"
                    class="flex-1 flex flex-col items-center gap-1 h-full justify-end group cursor-pointer focus:outline-none"
                    [title]="'Mana ' + bar.cost + ' : ' + bar.count + ' carte(s) (' + bar.pctOfDeck + '%) • Cliquer pour filtrer'">
                    
                    <!-- Exact Count Pill above Bar -->
                    <span
                      class="text-[9px] font-mono font-bold transition-all duration-150"
                      [class.text-[#4d94ff]]="bar.count > 0 && !isSlotSelected"
                      [class.text-[#ffd700]_scale-125]="isSlotSelected"
                      [class.text-[#3a2f23]]="bar.count === 0">
                      {{ bar.count }}
                    </span>

                    <!-- Column Bar Container -->
                    <div class="w-full bg-[#1a1612] rounded-t overflow-hidden flex flex-col justify-end h-full">
                      <div
                        class="w-full rounded-t transition-all duration-300 group-hover:brightness-125"
                        [class.bg-gradient-to-t_from-[#0d233a]_to-[#4d94ff]]="!isSlotSelected && bar.count > 0"
                        [class.bg-gradient-to-t_from-[#8b6b43]_to-[#ffd700]_shadow-[0_0_8px_rgba(255,215,0,0.6)]]="isSlotSelected"
                        [class.bg-[#251f18]/30]="bar.count === 0"
                        [style.height.%]="bar.pct"></div>
                    </div>

                    <!-- Cost Crystal Label below Bar -->
                    <span
                      class="text-[9px] font-mono transition-colors font-bold px-1 rounded"
                      [class.text-[#ffd700]_bg-[#241a0d]]="isSlotSelected"
                      [class.text-[#c5a880]_group-hover:text-[#4d94ff]]="!isSlotSelected && bar.count > 0"
                      [class.text-[#6b5a45]]="!isSlotSelected && bar.count === 0">
                      {{ bar.cost }}
                    </span>
                  </button>
                }
              </div>

              <!-- Active Curve Filter Pill Indicator -->
              @if (selectedCurveFilter(); as activeFilter) {
                <div class="flex items-center justify-between bg-[#241a0d] border border-[#d4af37]/40 px-2 py-1 rounded-lg text-[10px] animate-fade-in">
                  <span class="text-[#ffd700] font-cinzel font-bold flex items-center gap-1">
                    <mat-icon class="text-xs">filter_list</mat-icon>
                    Cartes à {{ activeFilter }} Mana ({{ activeDeckFilteredCards().length }})
                  </span>
                  <button
                    (click)="clearCurveFilter()"
                    class="text-[#8b6b43] hover:text-[#ffd700] text-[10px] font-mono flex items-center gap-0.5">
                    <span>Afficher tout</span>
                    <mat-icon class="text-[10px]">close</mat-icon>
                  </button>
                </div>
              }

              <!-- Game Phases Distribution (Early, Mid, Late) -->
              @let phases = manaCurvePhases();
              <div class="grid grid-cols-3 gap-1.5 pt-1 border-t border-[#3a2f23]/60 text-[9px] font-mono">
                <div class="bg-[#120f0c] p-1.5 rounded-lg border border-[#3a2f23] text-center">
                  <span class="text-[#8b6b43] block text-[8px] uppercase font-cinzel font-bold">Early (0-2)</span>
                  <span class="text-[#34d399] font-bold">{{ phases.early.count }} c. ({{ phases.early.pct }}%)</span>
                </div>
                <div class="bg-[#120f0c] p-1.5 rounded-lg border border-[#3a2f23] text-center">
                  <span class="text-[#8b6b43] block text-[8px] uppercase font-cinzel font-bold">Mid (3-5)</span>
                  <span class="text-[#4d94ff] font-bold">{{ phases.mid.count }} c. ({{ phases.mid.pct }}%)</span>
                </div>
                <div class="bg-[#120f0c] p-1.5 rounded-lg border border-[#3a2f23] text-center">
                  <span class="text-[#8b6b43] block text-[8px] uppercase font-cinzel font-bold">Late (6+)</span>
                  <span class="text-[#c084fc] font-bold">{{ phases.late.count }} c. ({{ phases.late.pct }}%)</span>
                </div>
              </div>
            </div>

            <!-- REAL-TIME BALANCING ADVICE / DIAGNOSTIC CHIP -->
            @let diag = deckBalanceDiagnostics();
            <div class="p-2.5 rounded-xl border space-y-1 text-xs"
              [class.bg-[#122812]/50]="diag.tips[0]?.type === 'success'"
              [class.border-[#225c22]]="diag.tips[0]?.type === 'success'"
              [class.bg-[#2a1a08]/50]="diag.tips[0]?.type === 'warning'"
              [class.border-[#d97706]/40]="diag.tips[0]?.type === 'warning'"
              [class.bg-[#120f0c]]="diag.tips[0]?.type === 'info' || diag.tips.length === 0"
              [class.border-[#3a2f23]]="diag.tips[0]?.type === 'info' || diag.tips.length === 0">
              
              <div class="flex items-center justify-between text-[10px] font-cinzel font-bold">
                <div class="flex items-center gap-1"
                  [class.text-[#4dff88]]="diag.tips[0]?.type === 'success'"
                  [class.text-[#fbbf24]]="diag.tips[0]?.type === 'warning'"
                  [class.text-[#c5a880]]="diag.tips[0]?.type === 'info' || diag.tips.length === 0">
                  <mat-icon class="text-xs">{{ diag.tips[0]?.icon || 'lightbulb' }}</mat-icon>
                  <span>{{ diag.tips[0]?.title || 'Équilibre du Grimoire' }}</span>
                </div>
                <span class="font-mono text-[#8b6b43]">Score: {{ diag.score }}/100</span>
              </div>

              <p class="text-[10px] text-[#e0dcc7] font-medium leading-tight">
                {{ diag.tips[0]?.message || 'Assemblez vos cartes pour recevoir les conseils tactiques de forge.' }}
              </p>
            </div>

            <!-- Deck Card List with Tactile Hover & Removal -->
            <div class="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
              @if (activeDeckFilteredCards().length === 0) {
                <div class="p-5 text-center text-xs text-[#6b5a45] font-cinzel italic border border-dashed border-[#3a2f23] rounded-xl">
                  @if (selectedCurveFilter()) {
                    Aucune carte dans ce palier de mana ({{ selectedCurveFilter() }} Mana).
                  } @else {
                    Votre grimoire est vide. Cliquez sur les cartes pour les ajouter.
                  }
                </div>
              }
              @for (card of activeDeckFilteredCards(); track $index) {
                @let deckRarityMeta = gameState.getCardRarityVisualMeta(card.id);
                <div
                  tabindex="0"
                  role="button"
                  (click)="selectHeldCard(card)"
                  (keydown.enter)="selectHeldCard(card)"
                  class="flex items-center justify-between px-2.5 py-2 bg-[#1a1612] hover:bg-[#251f18] border border-[#3a2f23] hover:border-[#c5a880] rounded-lg text-xs group transition-all duration-150 hover:translate-x-1 cursor-pointer">
                  <div class="flex items-center gap-2 min-w-0">
                    <span class="w-5 h-5 rounded bg-[#0d233a] border border-[#4d94ff] text-[#4d94ff] font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                      {{ card.cost }}
                    </span>
                    @if (card.imageUrl) {
                      <img
                        [src]="card.imageUrl"
                        [alt]="card.name"
                        [class]="'w-6 h-6 rounded object-cover border shrink-0 ' + deckRarityMeta.glowClass"
                        referrerpolicy="no-referrer" />
                    } @else {
                      <span [class]="'w-6 h-6 rounded bg-[#120f0c] border flex items-center justify-center shrink-0 ' + deckRarityMeta.glowClass">
                        <mat-icon [class]="'text-xs ' + deckRarityMeta.textClass">{{ card.icon }}</mat-icon>
                      </span>
                    }
                    <div class="min-w-0">
                      <div class="flex items-center gap-1.5">
                        <span class="font-cinzel text-[#e0dcc7] font-semibold truncate max-w-[120px] group-hover:text-[#d4af37] transition-colors">
                          {{ card.name }}
                        </span>
                        @if (card.type === 'creature') {
                          <span class="text-[9px] font-mono text-[#4dff88] hidden sm:inline">
                            ({{ card.attack }}/{{ card.health }})
                          </span>
                        } @else {
                          <span class="text-[8px] font-cinzel text-[#c084fc] uppercase hidden sm:inline">
                            Sort
                          </span>
                        }
                      </div>
                      <div [class]="'text-[9px] font-cinzel font-semibold ' + deckRarityMeta.textClass">
                        {{ deckRarityMeta.label }}
                      </div>
                    </div>
                  </div>

                  <div class="flex items-center gap-1">
                    <span class="text-[10px] font-mono text-[#8b6b43]">★{{ card.level }}</span>
                    <button
                      (click)="removeCardFromActiveDeckByCardId(card.id, $event)"
                      class="text-[#6b5a45] hover:text-[#ff4d4d] p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Retirer du grimoire">
                      <mat-icon class="text-sm">close</mat-icon>
                    </button>
                  </div>
                </div>
              }
            </div>

            <!-- Action Buttons: Auto Complete & Full Report -->
            <div class="space-y-2 pt-1 border-t border-[#3a2f23]/60">
              <button
                (click)="autoCompleteDeck()"
                class="medieval-btn w-full py-2 bg-[#1a1612] hover:bg-[#251f18] text-[#c5a880] font-cinzel text-xs font-semibold rounded-xl border border-[#3a2f23] flex items-center justify-center gap-1.5 shadow">
                <mat-icon class="text-sm text-[#d4af37]">auto_fix_high</mat-icon>
                Compléter Automatiquement
              </button>

              <button
                (click)="openStatsModal()"
                class="medieval-btn w-full py-2 bg-[#120f0c] hover:bg-[#1f1913] text-[#4d94ff] hover:text-[#80b3ff] font-cinzel text-xs font-bold rounded-xl border border-[#4d94ff]/30 hover:border-[#4d94ff] flex items-center justify-center gap-1.5 shadow">
                <mat-icon class="text-sm text-[#4d94ff]">assessment</mat-icon>
                Rapport d'Analyse Stratégique Complet
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- CARD INSPECTOR & FORGE MODAL -->
      @if (inspectCard(); as card) {
        @let insTilt = inspectTilt();
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
          <div class="bg-[#120f0c] border border-[#3a2f23] rounded-2xl max-w-lg w-full p-6 shadow-2xl text-[#e0dcc7] space-y-5">
            
            <div class="flex items-start justify-between">
              <div>
                <span class="text-[10px] font-cinzel text-[#8b6b43] font-semibold uppercase tracking-widest">
                  Forge d'Aetheria • {{ card.rarity }}
                </span>
                <h3 class="font-cinzel text-2xl font-black text-[#c5a880]">{{ card.name }}</h3>
              </div>
              <button (click)="inspectCard.set(null)" class="text-[#6b5a45] hover:text-[#e0dcc7]">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <!-- Card Visual Presentation with In-Hand 3D Holographic Tilt -->
            @let inspectRarityMeta = gameState.getCardRarityVisualMeta(card.id);
            <div class="flex flex-col sm:flex-row items-center gap-4 bg-[#1a1612] p-4 rounded-xl border border-[#3a2f23]">
              <div
                class="card-3d-perspective relative shrink-0 cursor-grab select-none"
                (mousemove)="onInspectMouseMove($event)"
                (mouseleave)="onInspectMouseLeave()">
                
                <div
                  [class]="'card-3d-inner card-holo w-28 h-40 rounded-xl bg-[#0d0b09] border-2 p-2 flex flex-col items-center justify-between relative shadow-2xl transition-[border-color,box-shadow] ' + inspectRarityMeta.glowClass"
                  [style.transform]="insTilt.isHovered ? 'perspective(1000px) rotateX(' + insTilt.rotateX + 'deg) rotateY(' + insTilt.rotateY + 'deg) scale3d(1.08, 1.08, 1.08)' : 'none'">
                  
                  <!-- Dynamic 3D Glare -->
                  @if (insTilt.isHovered || card.foil) {
                    <div
                      class="card-3d-glare"
                      [style.--glare-x.%]="insTilt.sheenX"
                      [style.--glare-y.%]="insTilt.sheenY"
                      [style.opacity]="insTilt.isHovered ? '0.8' : '0.3'">
                    </div>
                  }

                  <!-- Mana Badge with 3D Pop -->
                  <div class="card-3d-layer-pop absolute -top-2 -left-2 w-6 h-6 rounded-full bg-[#0d233a] border-2 border-[#4d94ff] text-[#4d94ff] font-mono font-black text-xs flex items-center justify-center shadow">
                    {{ card.cost }}
                  </div>

                  <!-- Star Badge with 3D Pop -->
                  <div class="card-3d-layer-pop absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full bg-[#120f0c] border border-[#8b6b43] text-[#d4af37] font-mono font-bold text-[10px] shadow">
                    ★{{ card.level }}
                  </div>

                  <div class="card-3d-layer-float text-center font-cinzel text-xs font-bold text-[#c5a880] truncate mt-1">
                    {{ card.name }}
                  </div>

                  <div class="card-3d-layer-pop my-1.5 w-full h-20 rounded-lg overflow-hidden border border-[#8b6b43]/60 bg-[#120f0c] flex items-center justify-center">
                    @if (card.imageUrl) {
                      <img
                        [src]="card.imageUrl"
                        [alt]="card.name"
                        class="w-full h-full object-cover"
                        referrerpolicy="no-referrer" />
                    } @else {
                      <mat-icon class="text-4xl text-[#c5a880]">{{ card.icon }}</mat-icon>
                    }
                  </div>

                  <div class="card-3d-layer-float flex justify-between items-center text-[10px] font-mono font-bold w-full px-1">
                    @if (card.type === 'creature') {
                      <span class="text-[#ff4d4d] inline-flex items-center gap-0.5">
                        <mat-icon class="text-[11px]">swords</mat-icon>
                        {{ card.attack }}
                      </span>
                      <span class="text-[#4dff88] inline-flex items-center gap-0.5">
                        <mat-icon class="text-[11px]">favorite</mat-icon>
                        {{ card.health }}
                      </span>
                    } @else {
                      <span class="text-[#4d94ff] font-cinzel text-[9px] uppercase mx-auto">Sort Épique</span>
                    }
                  </div>
                </div>
              </div>

              <div class="space-y-2 text-xs flex-1">
                <p class="text-[#e0dcc7] font-medium leading-relaxed">{{ card.description }}</p>
                <p class="text-[#6b5a45] italic text-[11px] font-serif">"{{ card.flavorText }}"</p>
                <div class="flex items-center gap-2 pt-1 font-mono text-[#c5a880]">
                  <span>Éclats possédés : {{ card.shards }} / {{ card.shardsRequired }}</span>
                </div>
              </div>
            </div>

            <!-- Upgrade / Forge Section -->
            <div class="bg-[#1a1612] border border-[#3a2f23] rounded-xl p-4 space-y-3">
              <div class="flex items-center justify-between text-xs">
                <span class="font-cinzel text-[#c5a880] font-bold">Niveau Actuel : {{ card.level }} / 5</span>
                <span class="text-[#8b6b43] font-mono">Coût : {{ card.level * 150 }} Or</span>
              </div>

              <div class="w-full bg-[#0d0b09] rounded-full h-2 overflow-hidden border border-[#3a2f23]">
                <div
                  class="bg-gradient-to-r from-[#8b6b43] to-[#d4af37] h-full transition-all duration-500"
                  [style.width.%]="(card.shards / card.shardsRequired) * 100"></div>
              </div>

              <button
                (click)="upgradeInspectedCard(card.id)"
                [disabled]="card.shards < card.shardsRequired || card.level >= 5 || gameState.gold() < (card.level * 150)"
                class="crimson-btn w-full py-2.5 rounded-xl font-cinzel font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                [class.opacity-50]="card.shards < card.shardsRequired || card.level >= 5 || gameState.gold() < (card.level * 150)">
                <mat-icon class="text-sm">auto_fix_high</mat-icon>
                {{ card.level >= 5 ? 'NIVEAU MAXIMAL ATTEINT' : 'FORGER & AMÉLIORER LA CARTE' }}
              </button>
            </div>

          </div>
        </div>
      }

      <!-- STRATEGIC DECK ANALYSIS & BALANCING MODAL -->
      @if (showStatsModal()) {
        @let activeDeck = gameState.activeDeck();
        @let avgStats = averageCostStats();
        @let ratioStats = minionSpellStats();
        @let phases = manaCurvePhases();
        @let combat = deckCombatStats();
        @let diag = deckBalanceDiagnostics();
        @let elements = deckElementDistribution();

        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
          <div class="bg-[#120f0c] border border-[#3a2f23] rounded-2xl max-w-2xl w-full p-6 shadow-2xl text-[#e0dcc7] space-y-5 max-h-[90vh] overflow-y-auto">
            
            <!-- Modal Header -->
            <div class="flex items-start justify-between border-b border-[#3a2f23] pb-3">
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-[10px] font-cinzel text-[#8b6b43] font-semibold uppercase tracking-widest">
                    Forge Tactique • Rapport d'Équilibrage
                  </span>
                  <span class="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold"
                    [class.bg-[#122812]]="diag.score >= 80"
                    [class.text-[#4dff88]]="diag.score >= 80"
                    [class.border]="true"
                    [class.border-[#225c22]]="diag.score >= 80"
                    [class.bg-[#2a1a08]]="diag.score >= 50 && diag.score < 80"
                    [class.text-[#fbbf24]]="diag.score >= 50 && diag.score < 80"
                    [class.border-[#d97706]/40]="diag.score >= 50 && diag.score < 80"
                    [class.bg-[#281212]]="diag.score < 50"
                    [class.text-[#ff4d4d]]="diag.score < 50"
                    [class.border-[#5c2222]]="diag.score < 50">
                    Score: {{ diag.score }}/100
                  </span>
                </div>
                <h3 class="font-cinzel text-2xl font-black text-[#c5a880] flex items-center gap-2 mt-0.5">
                  <mat-icon class="text-[#d4af37]">insights</mat-icon>
                  {{ activeDeck.name }}
                </h3>
              </div>
              <button (click)="closeStatsModal()" class="text-[#6b5a45] hover:text-[#e0dcc7] p-1">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <!-- Grid 1: Average Cost & Minion/Spell Ratio Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <!-- Average Cost Profile -->
              <div class="bg-[#1a1612] p-4 rounded-xl border border-[#3a2f23] space-y-2.5">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-cinzel font-bold text-[#8b6b43] uppercase flex items-center gap-1.5">
                    <mat-icon class="text-sm text-[#4d94ff]">diamond</mat-icon>
                    Coût Moyen en Mana
                  </span>
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold border" [class]="avgStats.archetypeBadgeClass">
                    {{ avgStats.archetype }}
                  </span>
                </div>

                <div class="flex items-baseline gap-2">
                  <span class="font-mono text-3xl font-black text-[#4d94ff]">{{ avgStats.formatted }}</span>
                  <span class="text-xs font-mono text-[#8b6b43]">Cristaux de Mana / carte</span>
                </div>

                <p class="text-xs text-[#c5a880] leading-relaxed bg-[#120f0c] p-2.5 rounded-lg border border-[#3a2f23]">
                  {{ avgStats.archetypeDesc }}
                </p>

                <div class="grid grid-cols-3 gap-1 pt-1 text-[10px] font-mono text-center">
                  <div class="bg-[#120f0c] p-1.5 rounded border border-[#3a2f23]/60">
                    <span class="text-[#8b6b43] block">Total</span>
                    <span class="text-[#e0dcc7] font-bold">{{ avgStats.totalMana }} Mana</span>
                  </div>
                  <div class="bg-[#120f0c] p-1.5 rounded border border-[#3a2f23]/60">
                    <span class="text-[#8b6b43] block">Coût Min</span>
                    <span class="text-[#4dff88] font-bold">{{ avgStats.minCost }} Mana</span>
                  </div>
                  <div class="bg-[#120f0c] p-1.5 rounded border border-[#3a2f23]/60">
                    <span class="text-[#8b6b43] block">Coût Max</span>
                    <span class="text-[#ff4d4d] font-bold">{{ avgStats.maxCost }} Mana</span>
                  </div>
                </div>
              </div>

              <!-- Minion / Spell Breakdown -->
              <div class="bg-[#1a1612] p-4 rounded-xl border border-[#3a2f23] space-y-2.5">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-cinzel font-bold text-[#8b6b43] uppercase flex items-center gap-1.5">
                    <mat-icon class="text-sm text-[#eab308]">pie_chart</mat-icon>
                    Composition de l'Armée
                  </span>
                  <span class="font-mono text-xs font-bold text-[#e0dcc7] bg-[#120f0c] px-2 py-0.5 rounded border border-[#3a2f23]">
                    Ratio {{ ratioStats.ratioText }}
                  </span>
                </div>

                <!-- Visual Bar -->
                <div class="space-y-1">
                  <div class="h-3 w-full bg-[#120f0c] rounded-full overflow-hidden flex border border-[#3a2f23]">
                    <div
                      class="bg-gradient-to-r from-[#10b981] to-[#34d399] transition-all duration-300"
                      [style.width.%]="ratioStats.minionPct"></div>
                    <div
                      class="bg-gradient-to-r from-[#8b5cf6] to-[#c084fc] transition-all duration-300"
                      [style.width.%]="ratioStats.spellPct"></div>
                    @if (ratioStats.relicPct > 0) {
                      <div
                        class="bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] transition-all duration-300"
                        [style.width.%]="ratioStats.relicPct"></div>
                    }
                  </div>
                  <div class="flex justify-between text-[10px] font-mono text-[#8b6b43]">
                    <span class="text-[#34d399]">{{ ratioStats.minions }} Créatures ({{ ratioStats.minionPct }}%)</span>
                    <span class="text-[#c084fc]">{{ ratioStats.spells }} Sorts ({{ ratioStats.spellPct }}%)</span>
                  </div>
                </div>

                <p class="text-xs text-[#c5a880] leading-relaxed bg-[#120f0c] p-2.5 rounded-lg border border-[#3a2f23]">
                  {{ ratioStats.assessment }}
                </p>

                <!-- Board Threat Sums -->
                <div class="grid grid-cols-2 gap-2 pt-1 text-[10px] font-mono text-center">
                  <div class="bg-[#241313] p-1.5 rounded border border-[#5c2424] text-[#ff4d4d] font-bold flex items-center justify-center gap-1">
                    <mat-icon class="text-xs">swords</mat-icon>
                    <span>Puissance Totale : {{ combat.totalAttack }} Attaque</span>
                  </div>
                  <div class="bg-[#122812] p-1.5 rounded border border-[#225c22] text-[#4dff88] font-bold flex items-center justify-center gap-1">
                    <mat-icon class="text-xs">favorite</mat-icon>
                    <span>Vitalité Totale : {{ combat.totalHealth }} PV</span>
                  </div>
                </div>
              </div>

            </div>

            <!-- Mana Curve Phases & Histogram Breakdown -->
            <div class="bg-[#1a1612] p-4 rounded-xl border border-[#3a2f23] space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-cinzel font-bold text-[#8b6b43] uppercase flex items-center gap-1.5">
                  <mat-icon class="text-sm text-[#4d94ff]">bar_chart</mat-icon>
                  Courbe de Mana & Rythme par Phase
                </span>
                <span class="text-xs font-mono text-[#8b6b43]">{{ activeDeck.cardIds.length }} / 10 cartes</span>
              </div>

              <!-- Phases Meters -->
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div class="bg-[#120f0c] p-2.5 rounded-lg border border-[#3a2f23] space-y-1">
                  <div class="flex justify-between text-[11px] font-mono">
                    <span class="text-[#8b6b43] font-cinzel font-bold">Early Game (T1-T2)</span>
                    <span class="text-[#34d399] font-bold">{{ phases.early.count }} cartes</span>
                  </div>
                  <div class="w-full bg-[#1a1612] h-2 rounded-full overflow-hidden border border-[#3a2f23]">
                    <div class="bg-[#10b981] h-full" [style.width.%]="phases.early.pct"></div>
                  </div>
                  <span class="text-[9px] text-[#8b6b43] block">
                    {{ phases.early.count >= 2 ? 'Sortie rapide garantie' : "Attention au manque d'action T1" }}
                  </span>
                </div>

                <div class="bg-[#120f0c] p-2.5 rounded-lg border border-[#3a2f23] space-y-1">
                  <div class="flex justify-between text-[11px] font-mono">
                    <span class="text-[#8b6b43] font-cinzel font-bold">Mid Game (T3-T5)</span>
                    <span class="text-[#4d94ff] font-bold">{{ phases.mid.count }} cartes</span>
                  </div>
                  <div class="w-full bg-[#1a1612] h-2 rounded-full overflow-hidden border border-[#3a2f23]">
                    <div class="bg-[#3b82f6] h-full" [style.width.%]="phases.mid.pct"></div>
                  </div>
                  <span class="text-[9px] text-[#8b6b43] block">
                    {{ phases.mid.count >= 3 ? 'Cœur de jeu très solide' : 'Faible présence au T3-T5' }}
                  </span>
                </div>

                <div class="bg-[#120f0c] p-2.5 rounded-lg border border-[#3a2f23] space-y-1">
                  <div class="flex justify-between text-[11px] font-mono">
                    <span class="text-[#8b6b43] font-cinzel font-bold">Late Game (T6+)</span>
                    <span class="text-[#c084fc] font-bold">{{ phases.late.count }} cartes</span>
                  </div>
                  <div class="w-full bg-[#1a1612] h-2 rounded-full overflow-hidden border border-[#3a2f23]">
                    <div class="bg-[#8b5cf6] h-full" [style.width.%]="phases.late.pct"></div>
                  </div>
                  <span class="text-[9px] text-[#8b6b43] block">
                    {{ phases.late.count > 3 ? 'Risque de main lourde' : phases.late.count === 0 ? 'Aucun finisseur' : 'Finisseurs équilibrés' }}
                  </span>
                </div>
              </div>

              <!-- Keyword & Synergies Row -->
              <div class="flex flex-wrap items-center gap-2 pt-2 border-t border-[#3a2f23]/60 text-xs">
                <span class="text-[10px] font-cinzel uppercase text-[#8b6b43] font-bold">Capacités &amp; Mots-clés :</span>
                <span class="px-2 py-0.5 rounded bg-[#120f0c] border border-[#3a2f23] text-[#d4af37] font-mono text-[10px] inline-flex items-center gap-1">
                  <mat-icon class="text-[11px]">shield</mat-icon>
                  <span>Provocations : {{ combat.taunts }}</span>
                </span>
                <span class="px-2 py-0.5 rounded bg-[#120f0c] border border-[#3a2f23] text-[#ffd700] font-mono text-[10px] inline-flex items-center gap-1">
                  <mat-icon class="text-[11px]">verified_user</mat-icon>
                  <span>Boucliers Divins : {{ combat.divineShields }}</span>
                </span>
                <span class="px-2 py-0.5 rounded bg-[#120f0c] border border-[#3a2f23] text-[#ff4d4d] font-mono text-[10px] inline-flex items-center gap-1">
                  <mat-icon class="text-[11px]">water_drop</mat-icon>
                  <span>Vols de Vie : {{ combat.lifesteals }}</span>
                </span>
                <span class="px-2 py-0.5 rounded bg-[#120f0c] border border-[#3a2f23] text-[#d4af37] font-mono text-[10px] inline-flex items-center gap-1">
                  <mat-icon class="text-[11px]">auto_awesome</mat-icon>
                  <span>Foils : {{ combat.foils }}</span>
                </span>
              </div>
            </div>

            <!-- Elemental Distribution & Synergies -->
            @if (elements.length > 0) {
              <div class="bg-[#1a1612] p-4 rounded-xl border border-[#3a2f23] space-y-2.5">
                <span class="text-xs font-cinzel font-bold text-[#8b6b43] uppercase flex items-center gap-1.5">
                  <mat-icon class="text-sm text-[#ffd700]">public</mat-icon>
                  Alignement Élémentaire du Grimoire
                </span>
                <div class="flex flex-wrap gap-2">
                  @for (elem of elements; track elem.element) {
                    <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#120f0c] border border-[#3a2f23] text-xs font-mono">
                      <mat-icon class="text-sm" [style.color]="elem.color">{{ elem.icon }}</mat-icon>
                      <span class="text-[#e0dcc7] font-cinzel font-semibold">{{ elem.label }}</span>
                      <span class="font-bold" [style.color]="elem.color">{{ elem.count }} ({{ elem.pct }}%)</span>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Tactical Diagnostics & Balancing Recommendations -->
            <div class="bg-[#1a1612] p-4 rounded-xl border border-[#3a2f23] space-y-2.5">
              <span class="text-xs font-cinzel font-bold text-[#8b6b43] uppercase flex items-center gap-1.5">
                <mat-icon class="text-sm text-[#ffd700]">checklist</mat-icon>
                Diagnostics & Conseils d'Équilibrage
              </span>
              <div class="space-y-2">
                @for (tip of diag.tips; track tip.title) {
                  <div class="flex items-start gap-2.5 p-2.5 rounded-lg border text-xs"
                    [class.bg-[#122812]/40]="tip.type === 'success'"
                    [class.border-[#225c22]]="tip.type === 'success'"
                    [class.bg-[#2a1a08]/40]="tip.type === 'warning'"
                    [class.border-[#d97706]/40]="tip.type === 'warning'"
                    [class.bg-[#120f0c]]="tip.type === 'info'"
                    [class.border-[#3a2f23]]="tip.type === 'info'">
                    
                    <mat-icon class="text-base shrink-0 mt-0.5"
                      [class.text-[#4dff88]]="tip.type === 'success'"
                      [class.text-[#fbbf24]]="tip.type === 'warning'"
                      [class.text-[#c5a880]]="tip.type === 'info'">
                      {{ tip.icon }}
                    </mat-icon>

                    <div>
                      <div class="font-cinzel font-bold"
                        [class.text-[#4dff88]]="tip.type === 'success'"
                        [class.text-[#fbbf24]]="tip.type === 'warning'"
                        [class.text-[#c5a880]]="tip.type === 'info'">
                        {{ tip.title }}
                      </div>
                      <p class="text-[11px] text-[#e0dcc7] leading-relaxed mt-0.5">
                        {{ tip.message }}
                      </p>
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="flex justify-end pt-2 border-t border-[#3a2f23]">
              <button
                (click)="closeStatsModal()"
                class="crimson-btn px-5 py-2 rounded-xl font-cinzel font-bold text-xs uppercase tracking-wider">
                Fermer le Rapport
              </button>
            </div>

          </div>
        </div>
      }

    </div>
  `,
})
export class DeckbuilderView {
  readonly gameState = inject(GameStateService);
  readonly sound = inject(SoundService);
  readonly tutorial = inject(TutorialService);

  readonly selectedElement = signal<string>('all');
  readonly selectedRarity = signal<string>('all');
  readonly selectedManaCost = signal<string>('all');
  readonly selectedType = signal<string>('all');
  readonly selectedKeyword = signal<string>('all');
  readonly searchQuery = signal<string>('');
  readonly sortBy = signal<'cost' | 'rarity' | 'attack' | 'health' | 'name' | 'level'>('cost');
  readonly sortDirection = signal<'asc' | 'desc'>('asc');

  readonly inspectCard = signal<Card | null>(null);
  readonly heldCard = signal<Card | null>(null);
  readonly inspectTilt = signal<CardTiltState>({ rotateX: 0, rotateY: 0, sheenX: 50, sheenY: 50, isHovered: false });

  readonly selectedCurveFilter = signal<string | null>(null);
  readonly showStatsModal = signal<boolean>(false);

  readonly currentPage = signal<number>(1);
  readonly pageSize = signal<number>(24);
  readonly manaCostButtons = ['0', '1', '2', '3', '4', '5', '6', '7', '8+'];

  private lastHoveredCardId: string | null = null;
  private readonly cardTilts = signal<Record<string, CardTiltState>>({});

  readonly hasActiveFilters = computed(() => {
    return (
      this.selectedElement() !== 'all' ||
      this.selectedRarity() !== 'all' ||
      this.selectedManaCost() !== 'all' ||
      this.selectedType() !== 'all' ||
      this.selectedKeyword() !== 'all' ||
      this.searchQuery().trim() !== ''
    );
  });

  getElementCardCount(element: string): number {
    return this.gameState.cards().filter(c => c.element === element).length;
  }

  setElementFilter(elem: string) {
    this.selectedElement.set(elem);
    this.currentPage.set(1);
    this.sound.playClick();
  }

  setManaFilter(cost: string) {
    this.selectedManaCost.set(cost);
    this.currentPage.set(1);
    this.sound.playClick();
  }

  setRarityFilter(rarity: string) {
    this.selectedRarity.set(rarity);
    this.currentPage.set(1);
    this.sound.playClick();
  }

  setTypeFilter(type: string) {
    this.selectedType.set(type);
    this.currentPage.set(1);
    this.sound.playClick();
  }

  setKeywordFilter(keyword: string) {
    this.selectedKeyword.set(keyword);
    this.currentPage.set(1);
    this.sound.playClick();
  }

  onSearchInput(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value);
    this.currentPage.set(1);
  }

  clearSearch() {
    this.searchQuery.set('');
    this.currentPage.set(1);
    this.sound.playClick();
  }

  onSortByChange(event: Event) {
    const val = (event.target as HTMLSelectElement).value as 'cost' | 'rarity' | 'attack' | 'health' | 'name' | 'level';
    this.sortBy.set(val);
    this.sound.playClick();
  }

  toggleSortDirection() {
    this.sortDirection.update(d => (d === 'asc' ? 'desc' : 'asc'));
    this.sound.playClick();
  }

  resetAllFilters() {
    this.selectedElement.set('all');
    this.selectedRarity.set('all');
    this.selectedManaCost.set('all');
    this.selectedType.set('all');
    this.selectedKeyword.set('all');
    this.searchQuery.set('');
    this.currentPage.set(1);
    this.sound.playClick();
  }

  readonly filteredCards = computed(() => {
    let list = this.gameState.cards();
    const elem = this.selectedElement();
    const rarity = this.selectedRarity();
    const mana = this.selectedManaCost();
    const type = this.selectedType();
    const keyword = this.selectedKeyword();
    const query = this.searchQuery().toLowerCase().trim();
    const activeDeckCardIds = this.gameState.activeDeck().cardIds;

    // 1. Element Filter
    if (elem !== 'all') {
      list = list.filter(c => c.element === elem);
    }

    // 2. Rarity Filter
    if (rarity !== 'all') {
      list = list.filter(c => c.rarity === rarity);
    }

    // 3. Mana Cost Filter
    if (mana !== 'all') {
      if (mana === '8+') {
        list = list.filter(c => c.cost >= 8);
      } else {
        const costNum = parseInt(mana, 10);
        list = list.filter(c => c.cost === costNum);
      }
    }

    // 4. Type Filter
    if (type !== 'all') {
      list = list.filter(c => c.type === type);
    }

    // 5. Keyword / Special Status Filter
    if (keyword !== 'all') {
      switch (keyword) {
        case 'taunt':
          list = list.filter(c => !!c.taunt);
          break;
        case 'divineShield':
          list = list.filter(c => !!c.divineShield);
          break;
        case 'lifesteal':
          list = list.filter(c => !!c.lifesteal);
          break;
        case 'foil':
          list = list.filter(c => !!c.foil);
          break;
        case 'forgeGrimoire':
          list = list.filter(c => c.id.startsWith('c_forge_'));
          break;
        case 'upgradeable':
          list = list.filter(c => c.shards >= c.shardsRequired && c.level < 5 && this.gameState.gold() >= (c.level * 150));
          break;
        case 'inDeck':
          list = list.filter(c => activeDeckCardIds.includes(c.id));
          break;
      }
    }

    // 6. Search Query Filter (name, description, flavorText, element, rarity)
    if (query) {
      list = list.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query) ||
        c.flavorText.toLowerCase().includes(query) ||
        c.element.toLowerCase().includes(query) ||
        c.rarity.toLowerCase().includes(query)
      );
    }

    // 7. Sorting
    const sortField = this.sortBy();
    const sortDir = this.sortDirection();
    const rarityRank: Record<string, number> = {
      common: 1,
      rare: 2,
      epic: 3,
      legendary: 4,
      mythic: 5,
    };

    return [...list].sort((a, b) => {
      let diff = 0;
      switch (sortField) {
        case 'cost':
          diff = a.cost - b.cost;
          break;
        case 'rarity':
          diff = (rarityRank[a.rarity] || 0) - (rarityRank[b.rarity] || 0);
          break;
        case 'attack':
          diff = (a.attack || 0) - (b.attack || 0);
          break;
        case 'health':
          diff = (a.health || 0) - (b.health || 0);
          break;
        case 'name':
          diff = a.name.localeCompare(b.name, 'fr');
          break;
        case 'level':
          diff = a.level - b.level;
          break;
      }

      // Tie breaker by cost then name
      if (diff === 0) {
        diff = a.cost - b.cost || a.name.localeCompare(b.name, 'fr');
      }

      return sortDir === 'asc' ? diff : -diff;
    });
  });

  readonly totalPages = computed(() => {
    return Math.max(1, Math.ceil(this.filteredCards().length / this.pageSize()));
  });

  readonly paginatedCards = computed(() => {
    const list = this.filteredCards();
    const page = Math.min(this.currentPage(), this.totalPages());
    const start = (page - 1) * this.pageSize();
    return list.slice(start, start + this.pageSize());
  });

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
      this.sound.playClick();
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
      this.sound.playClick();
    }
  }

  readonly activeDeckCards = computed<Card[]>(() => {
    const activeDeck = this.gameState.activeDeck();
    const allCards = this.gameState.cards();
    return activeDeck.cardIds
      .map(id => allCards.find(c => c.id === id))
      .filter((c): c is Card => !!c);
  });

  readonly averageCostStats = computed(() => {
    const cards = this.activeDeckCards();
    if (cards.length === 0) {
      return {
        value: 0,
        formatted: '0.0',
        totalMana: 0,
        minCost: 0,
        maxCost: 0,
        archetype: 'Inconnu',
        archetypeIcon: 'help_outline',
        archetypeBadgeClass: 'bg-neutral-800 text-neutral-400 border-neutral-700',
        archetypeDesc: 'Ajoutez des cartes au grimoire pour déterminer son archétype tactique.',
      };
    }

    const totalMana = cards.reduce((sum, c) => sum + c.cost, 0);
    const avg = totalMana / cards.length;
    const costs = cards.map(c => c.cost);
    const minCost = Math.min(...costs);
    const maxCost = Math.max(...costs);

    let archetype = 'Midrange / Équilibré';
    let archetypeIcon = 'balance';
    let archetypeBadgeClass = 'bg-[#0d233a] text-[#4d94ff] border-[#4d94ff]/50';
    let archetypeDesc = 'Courbe fluide garantissant un tempo stable du tour 1 au milieu de partie.';

    if (avg < 2.8) {
      archetype = 'Aggro / Rapide';
      archetypeIcon = 'bolt';
      archetypeBadgeClass = 'bg-[#122812] text-[#4dff88] border-[#225c22]';
      archetypeDesc = 'Courbe très basse conçue pour submerger l\'adversaire dès les premiers tours.';
    } else if (avg > 4.2) {
      archetype = 'Contrôle / Tardif';
      archetypeIcon = 'shield';
      archetypeBadgeClass = 'bg-[#2a1a08] text-[#fbbf24] border-[#d97706]/50';
      archetypeDesc = 'Menaces massives et sorts lourds pour dominer la fin de partie.';
    }

    return {
      value: avg,
      formatted: avg.toFixed(1),
      totalMana,
      minCost,
      maxCost,
      archetype,
      archetypeIcon,
      archetypeBadgeClass,
      archetypeDesc,
    };
  });

  readonly minionSpellStats = computed(() => {
    const cards = this.activeDeckCards();
    const total = cards.length;

    if (total === 0) {
      return {
        minions: 0,
        spells: 0,
        relics: 0,
        minionPct: 0,
        spellPct: 0,
        relicPct: 0,
        ratioText: '0 : 0',
        assessment: 'Votre grimoire est actuellement vide.',
        status: 'info' as const,
      };
    }

    const minions = cards.filter(c => c.type === 'creature').length;
    const spells = cards.filter(c => c.type === 'spell').length;
    const relics = cards.filter(c => c.type !== 'creature' && c.type !== 'spell').length;

    const minionPct = Math.round((minions / total) * 100);
    const spellPct = Math.round((spells / total) * 100);
    const relicPct = Math.round((relics / total) * 100);

    let assessment = 'Ratio optimal : 60-70% d\'unités pour garder le contrôle du plateau avec des sorts clés.';
    let status: 'optimal' | 'warning' | 'info' = 'optimal';

    if (minions === 0) {
      assessment = 'Alerte : Aucune créature ! Impossible de contester le plateau face aux assauts adverses.';
      status = 'warning';
    } else if (minionPct < 40) {
      assessment = 'Forte dépendance aux sorts : Risque de manque de présence au sol et de perte de tempo.';
      status = 'warning';
    } else if (minionPct > 80) {
      assessment = 'Armée dense de créatures : Manque potentiel de sorts réactifs ou d\'anti-créatures d\'urgence.';
      status = 'info';
    }

    return {
      minions,
      spells,
      relics,
      minionPct,
      spellPct,
      relicPct,
      ratioText: `${minions} : ${spells}`,
      assessment,
      status,
    };
  });

  readonly manaHistogram = computed(() => {
    const cards = this.activeDeckCards();
    const totalCards = cards.length;
    const buckets = [0, 1, 2, 3, 4, 5, 6, 7]; // 0 to 7+

    const rawCounts: {
      cost: string;
      costNum: number;
      count: number;
      pctOfDeck: number;
      cards: Card[];
      minions: number;
      spells: number;
    }[] = [];

    let maxCount = 1;

    for (const b of buckets) {
      const costLabel = b >= 7 ? '7+' : `${b}`;
      const matchingCards = cards.filter(c => (b >= 7 ? c.cost >= 7 : c.cost === b));
      const count = matchingCards.length;
      if (count > maxCount) maxCount = count;

      rawCounts.push({
        cost: costLabel,
        costNum: b,
        count,
        pctOfDeck: totalCards > 0 ? Math.round((count / totalCards) * 100) : 0,
        cards: matchingCards,
        minions: matchingCards.filter(c => c.type === 'creature').length,
        spells: matchingCards.filter(c => c.type === 'spell').length,
      });
    }

    return rawCounts.map(item => ({
      ...item,
      pct: item.count > 0 ? Math.max(16, Math.round((item.count / maxCount) * 100)) : 0,
    }));
  });

  readonly manaCurvePhases = computed(() => {
    const cards = this.activeDeckCards();
    const total = cards.length;
    if (total === 0) {
      return {
        early: { count: 0, pct: 0, label: 'Early (T1-T2)' },
        mid: { count: 0, pct: 0, label: 'Mid (T3-T5)' },
        late: { count: 0, pct: 0, label: 'Late (T6+)' },
      };
    }

    const earlyCards = cards.filter(c => c.cost <= 2);
    const midCards = cards.filter(c => c.cost >= 3 && c.cost <= 5);
    const lateCards = cards.filter(c => c.cost >= 6);

    return {
      early: {
        count: earlyCards.length,
        pct: Math.round((earlyCards.length / total) * 100),
        label: 'Early (T1-T2)',
      },
      mid: {
        count: midCards.length,
        pct: Math.round((midCards.length / total) * 100),
        label: 'Mid (T3-T5)',
      },
      late: {
        count: lateCards.length,
        pct: Math.round((lateCards.length / total) * 100),
        label: 'Late (T6+)',
      },
    };
  });

  readonly deckCombatStats = computed(() => {
    const cards = this.activeDeckCards();
    const totalAttack = cards.reduce((sum, c) => sum + (c.attack || 0), 0);
    const totalHealth = cards.reduce((sum, c) => sum + (c.health || 0), 0);
    const taunts = cards.filter(c => !!c.taunt).length;
    const divineShields = cards.filter(c => !!c.divineShield).length;
    const lifesteals = cards.filter(c => !!c.lifesteal).length;
    const foils = cards.filter(c => !!c.foil).length;

    return {
      totalAttack,
      totalHealth,
      taunts,
      divineShields,
      lifesteals,
      foils,
    };
  });

  readonly deckElementDistribution = computed(() => {
    const cards = this.activeDeckCards();
    const total = cards.length;
    const elementCounts: Record<string, { count: number; label: string; color: string; icon: string }> = {
      light: { count: 0, label: 'Lumière', color: '#ffd700', icon: 'wb_sunny' },
      fire: { count: 0, label: 'Feu', color: '#ff4d4d', icon: 'local_fire_department' },
      ice: { count: 0, label: 'Glace', color: '#4d94ff', icon: 'ac_unit' },
      shadow: { count: 0, label: 'Ombre', color: '#a855f7', icon: 'visibility_off' },
      nature: { count: 0, label: 'Nature', color: '#10b981', icon: 'park' },
      arcane: { count: 0, label: 'Arcanes', color: '#d946ef', icon: 'auto_awesome' },
    };

    cards.forEach(c => {
      if (elementCounts[c.element]) {
        elementCounts[c.element].count++;
      }
    });

    return Object.entries(elementCounts)
      .filter(([, data]) => data.count > 0)
      .map(([key, data]) => ({
        element: key,
        label: data.label,
        color: data.color,
        icon: data.icon,
        count: data.count,
        pct: total > 0 ? Math.round((data.count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  });

  readonly deckBalanceDiagnostics = computed(() => {
    const cards = this.activeDeckCards();
    const total = cards.length;
    const avg = this.averageCostStats().value;
    const minions = this.minionSpellStats().minions;
    const earlyCount = this.manaCurvePhases().early.count;
    const tips: { type: 'success' | 'warning' | 'info'; title: string; message: string; icon: string }[] = [];

    let score = 100;

    if (total < 10) {
      const missing = 10 - total;
      score -= missing * 8;
      tips.push({
        type: 'warning',
        title: 'Grimoire Incomplet',
        message: `Il manque ${missing} carte${missing > 1 ? 's' : ''} pour compléter le grimoire de 10 cartes de duel.`,
        icon: 'warning',
      });
    }

    if (total > 0 && earlyCount < 2) {
      score -= 15;
      tips.push({
        type: 'warning',
        title: 'Départ Lent (Vulnérabilité T1-T2)',
        message: `Seulement ${earlyCount} carte${earlyCount === 1 ? '' : 's'} à 1 ou 2 Mana. Vous risquez d'être débordé par des sorties rapides.`,
        icon: 'speed',
      });
    } else if (earlyCount >= 2 && earlyCount <= 4) {
      tips.push({
        type: 'success',
        title: 'Sortie Précoce Sécurisée',
        message: `${earlyCount} cartes de début de partie (T1-T2) : vous avez 85%+ de chance d'agir dès le Tour 1 ou 2.`,
        icon: 'check_circle',
      });
    }

    if (total > 0 && minions < 4) {
      score -= 20;
      tips.push({
        type: 'warning',
        title: 'Déficit d\'Unités au Sol',
        message: `Seulement ${minions} créature${minions > 1 ? 's' : ''}. Vos PV seront sans défense face aux assauts de créatures adverses.`,
        icon: 'shield_moon',
      });
    }

    if (total > 0 && avg > 4.5) {
      score -= 15;
      tips.push({
        type: 'warning',
        title: 'Courbe Trop Lourde',
        message: `Coût moyen de ${avg.toFixed(1)} Mana : risque élevé de mains bloquées durant les premiers tours.`,
        icon: 'hourglass_empty',
      });
    } else if (total > 0 && avg >= 2.8 && avg <= 4.2) {
      tips.push({
        type: 'success',
        title: 'Courbe de Mana Harmonieuse',
        message: `Coût moyen de ${avg.toFixed(1)} Mana : parfait pour déployer vos menaces tour après tour sans temps mort.`,
        icon: 'auto_graph',
      });
    }

    if (tips.length === 0 && total === 10) {
      tips.push({
        type: 'success',
        title: 'Équilibre Exemplaire',
        message: 'Ce grimoire dispose d\'une distribution fluide, de solides créatures et de sorts réactifs.',
        icon: 'verified',
      });
    }

    return {
      score: Math.max(20, Math.min(100, score)),
      tips,
    };
  });

  readonly activeDeckFilteredCards = computed<Card[]>(() => {
    const cards = this.activeDeckCards();
    const filter = this.selectedCurveFilter();
    if (!filter) return cards;
    if (filter === '7+') {
      return cards.filter(c => c.cost >= 7);
    }
    const costNum = parseInt(filter, 10);
    return cards.filter(c => c.cost === costNum);
  });

  getCardById(id: string): Card | undefined {
    return this.gameState.cards().find(c => c.id === id);
  }

  countInActiveDeck(cardId: string): number {
    return this.gameState.activeDeck().cardIds.filter(id => id === cardId).length;
  }

  getElementLabel(element: string): string {
    switch (element) {
      case 'light': return 'Lumière Divine';
      case 'fire': return 'Feu Astral';
      case 'ice': return 'Glace Éternelle';
      case 'shadow': return 'Ombre Primordiale';
      case 'nature': return 'Nature Vivante';
      case 'arcane': return 'Arcanes Primordiaux';
      default: return 'Tous';
    }
  }

  getRarityLabel(rarity: string): string {
    switch (rarity) {
      case 'common': return 'Commune';
      case 'rare': return 'Rare';
      case 'epic': return 'Épique';
      case 'legendary': return 'Légendaire';
      case 'mythic': return 'Mythique';
      default: return 'Toutes';
    }
  }

  getKeywordLabel(keyword: string): string {
    switch (keyword) {
      case 'taunt': return 'Provocation';
      case 'divineShield': return 'Bouclier Divin';
      case 'lifesteal': return 'Vol de Vie';
      case 'foil': return 'Foil (Dorée)';
      case 'upgradeable': return 'Améliorable';
      case 'inDeck': return 'Dans le Deck Actif';
      default: return 'Tous';
    }
  }

  getCardTilt(cardId: string): CardTiltState {
    return this.cardTilts()[cardId] || { rotateX: 0, rotateY: 0, sheenX: 50, sheenY: 50, isHovered: false };
  }

  onCardHover(card: Card) {
    if (this.lastHoveredCardId !== card.id) {
      this.lastHoveredCardId = card.id;
      this.sound.playClick();
    }
  }

  onCardMouseMove(event: MouseEvent, cardId: string) {
    const target = event.currentTarget as HTMLElement;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = -((y - centerY) / centerY) * 12;
    const rotateY = ((x - centerX) / centerX) * 12;
    const sheenX = Math.round((x / rect.width) * 100);
    const sheenY = Math.round((y / rect.height) * 100);

    this.cardTilts.update(curr => ({
      ...curr,
      [cardId]: { rotateX, rotateY, sheenX, sheenY, isHovered: true },
    }));
  }

  onCardMouseLeave(cardId: string) {
    this.cardTilts.update(curr => ({
      ...curr,
      [cardId]: { rotateX: 0, rotateY: 0, sheenX: 50, sheenY: 50, isHovered: false },
    }));
  }

  onInspectMouseMove(event: MouseEvent) {
    const target = event.currentTarget as HTMLElement;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = -((y - centerY) / centerY) * 16;
    const rotateY = ((x - centerX) / centerX) * 16;
    const sheenX = Math.round((x / rect.width) * 100);
    const sheenY = Math.round((y / rect.height) * 100);

    this.inspectTilt.set({ rotateX, rotateY, sheenX, sheenY, isHovered: true });
  }

  onInspectMouseLeave() {
    this.inspectTilt.set({ rotateX: 0, rotateY: 0, sheenX: 50, sheenY: 50, isHovered: false });
  }

  selectHeldCard(card: Card) {
    this.heldCard.set(card);
    this.sound.playCardDraw();
  }

  playSummonPreview(card: Card) {
    this.sound.playCardSummon(card.rarity);
  }

  openInspectModal(card: Card, event: Event) {
    event.stopPropagation();
    this.inspectCard.set(card);
    this.sound.playClick();
  }

  addCardToActiveDeck(card: Card, event: Event) {
    event.stopPropagation();
    const deck = this.gameState.activeDeck();
    if (deck.cardIds.length >= 10) {
      this.sound.playClick();
      return;
    }
    this.gameState.updateDeckCards(deck.id, [...deck.cardIds, card.id]);
    this.sound.playCardDraw();
  }

  removeCardFromActiveDeck(index: number, event?: Event) {
    if (event) event.stopPropagation();
    const deck = this.gameState.activeDeck();
    const updated = [...deck.cardIds];
    updated.splice(index, 1);
    this.gameState.updateDeckCards(deck.id, updated);
    this.sound.playClick();
  }

  removeCardFromActiveDeckByCardId(cardId: string, event?: Event) {
    if (event) event.stopPropagation();
    const deck = this.gameState.activeDeck();
    const index = deck.cardIds.indexOf(cardId);
    if (index !== -1) {
      const updated = [...deck.cardIds];
      updated.splice(index, 1);
      this.gameState.updateDeckCards(deck.id, updated);
      this.sound.playClick();
    }
  }

  toggleCurveFilter(cost: string) {
    if (this.selectedCurveFilter() === cost) {
      this.selectedCurveFilter.set(null);
    } else {
      this.selectedCurveFilter.set(cost);
    }
    this.sound.playClick();
  }

  clearCurveFilter() {
    this.selectedCurveFilter.set(null);
    this.sound.playClick();
  }

  onSelectDeck(event: Event) {
    const target = event.target as HTMLSelectElement;
    if (target?.value) {
      this.gameState.setActiveDeck(target.value);
      this.selectedCurveFilter.set(null);
    }
  }

  clearActiveDeck() {
    const deck = this.gameState.activeDeck();
    if (deck.cardIds.length === 0) return;
    this.gameState.updateDeckCards(deck.id, []);
    this.selectedCurveFilter.set(null);
    this.sound.playClick();
  }

  duplicateActiveDeck() {
    const current = this.gameState.activeDeck();
    const newName = `${current.name} (Copie)`;
    this.gameState.createDeck(newName, current.heroClass);
    const decks = this.gameState.decks();
    const newDeck = decks[decks.length - 1];
    if (newDeck) {
      this.gameState.updateDeckCards(newDeck.id, [...current.cardIds]);
    }
    this.sound.playCardDraw();
  }

  openStatsModal() {
    this.showStatsModal.set(true);
    this.sound.playClick();
  }

  closeStatsModal() {
    this.showStatsModal.set(false);
    this.sound.playClick();
  }

  createNewDeckPrompt() {
    const name = `Nouveau Grimoire ${this.gameState.decks().length + 1}`;
    this.gameState.createDeck(name, this.gameState.selectedHeroClass());
    this.sound.playCardDraw();
  }

  autoCompleteDeck() {
    const deck = this.gameState.activeDeck();
    const needed = 10 - deck.cardIds.length;
    if (needed <= 0) return;

    const available = this.gameState.cards().map(c => c.id);
    const newCardIds = [...deck.cardIds];
    for (let i = 0; i < needed; i++) {
      newCardIds.push(available[i % available.length]);
    }
    this.gameState.updateDeckCards(deck.id, newCardIds);
    this.sound.playCardDraw();
  }

  upgradeInspectedCard(cardId: string) {
    const success = this.gameState.upgradeCard(cardId);
    if (success) {
      const updated = this.gameState.cards().find(c => c.id === cardId);
      if (updated) {
        this.inspectCard.set(updated);
        if (this.heldCard()?.id === cardId) {
          this.heldCard.set(updated);
        }
      }
    }
  }
}
