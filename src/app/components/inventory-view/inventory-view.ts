import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { GameStateService } from '../../services/game-state';
import { SoundService } from '../../services/sound';
import { AlchemyResources, CardRarity, Hero, HeroSkin, Potion, PotionRecipe } from '../../models/game.model';
import { MatIconModule } from '@angular/material/icon';

type AlchemyTab = 'recipes' | 'experiment' | 'transmute' | 'inventory' | 'skins';
type SkinOwnershipFilter = 'all' | 'unlocked' | 'locked';

interface InventorySkinEntry {
  hero: Hero;
  skin: HeroSkin;
}

interface TransmutationFormula {
  id: string;
  name: string;
  desc: string;
  fromName: string;
  toName: string;
  fromKey: keyof AlchemyResources;
  toKey: keyof AlchemyResources;
  fromCost: number;
  toGain: number;
  icon: string;
  badge: string;
  color: string;
}

@Component({
  selector: 'app-inventory-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div class="max-w-7xl mx-auto p-3 sm:p-5 md:p-6 space-y-6">

      <!-- ======================================================= -->
      <!-- MEDIEVAL HEADER & ALCHEMICAL INGREDIENTS VAULT          -->
      <!-- ======================================================= -->
      <div class="relative overflow-hidden rounded-2xl border-2 border-[#8b6b43]/60 bg-gradient-to-b from-[#1c140d] via-[#120d09] to-[#0a0705] p-5 md:p-6 shadow-2xl">
        <!-- Medieval corner flourishes -->
        <mat-icon class="absolute top-2 left-2 text-[#d4af37]/20 select-none text-2xl pointer-events-none">auto_awesome</mat-icon>
        <mat-icon class="absolute top-2 right-2 text-[#d4af37]/20 select-none text-2xl pointer-events-none">auto_awesome</mat-icon>
        <mat-icon class="absolute bottom-2 left-2 text-[#d4af37]/20 select-none text-2xl pointer-events-none">auto_awesome</mat-icon>
        <mat-icon class="absolute bottom-2 right-2 text-[#d4af37]/20 select-none text-2xl pointer-events-none">auto_awesome</mat-icon>

        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#d4af37] text-xs font-cinzel font-bold uppercase tracking-wider mb-2">
              <mat-icon class="text-sm">science</mat-icon>
              Grand Laboratoire & Athanor d'Aetheria
            </div>
            <h1 class="font-cinzel-dec text-2xl sm:text-3xl lg:text-4xl font-black text-[#e8d7b8] tracking-wide flex items-center gap-3">
              <img
                src="/src/assets/images/emblem_alchemy_cauldron_1795189810181.jpg"
                alt="Athanor d'Alchimie"
                class="w-11 h-11 rounded-xl object-cover border-2 border-[#d4af37]/70 shadow-[0_2px_12px_rgba(212,175,55,0.35)] shrink-0"
                referrerpolicy="no-referrer" />
              <span>Synthèse d'Élixirs &amp; Transmutation</span>
            </h1>
            <p class="text-[#a89070] text-xs sm:text-sm font-serif max-w-2xl mt-1.5 leading-relaxed">
              Assemblez les réactifs rares moissonnés sur les sables ensanglantés de l'arène. Réveillez le feu sacré de l'athanor pour distiller des philtres héroïques, réveiller la flamme du Phénix ou forger le Sang des Titans.
            </p>
          </div>

          <!-- Quick Cauldron Action -->
          <div class="flex items-center gap-3 self-start lg:self-auto shrink-0">
            <button
              (click)="triggerCauldronSound()"
              class="medieval-btn px-4 py-2.5 rounded-xl border border-[#8b6b43]/50 bg-[#1e150f] text-[#d4af37] text-xs font-cinzel font-bold flex items-center gap-2 shadow-md hover:border-[#d4af37]">
              <mat-icon class="text-base text-amber-400 animate-spin" style="animation-duration: 8s;">local_fire_department</mat-icon>
              Raviver le Brasier
            </button>
          </div>
        </div>

        <!-- 6 ARENA ALCHEMICAL REAGENTS DISPLAY -->
        <div class="mt-6 pt-5 border-t border-[#8b6b43]/30">
          <div class="text-[11px] font-cinzel uppercase tracking-wider text-[#9d8364] mb-3 flex items-center justify-between">
            <span class="flex items-center gap-1.5 font-bold">
              <mat-icon class="text-sm text-[#d4af37]">inventory_2</mat-icon>
              Réserve des 6 Ingrédients Récoltés en Arène
            </span>
            <span class="text-[10px] text-[#8b6b43] font-mono">Chaque victoire en arène alimente votre réserve</span>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            <!-- 1. Herbs -->
            <div class="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#16100b] border border-[#3d2c1c] hover:border-emerald-600/60 transition-colors">
              <div class="w-10 h-10 rounded-lg bg-emerald-950/80 border border-emerald-600/50 overflow-hidden shrink-0 shadow-inner treasure-image-shine">
                <img
                  src="/src/assets/images/reagent_herbs_bundle_1795188690757.jpg"
                  alt="Herbes Sauvages"
                  class="w-full h-full object-cover"
                  referrerpolicy="no-referrer" />
              </div>
              <div class="min-w-0">
                <div class="text-[10px] text-[#9a8670] truncate font-serif">Herbes Sauvages</div>
                <div class="font-mono font-bold text-emerald-400 text-sm">{{ res().herbs }}</div>
              </div>
            </div>

            <!-- 2. Crystals -->
            <div class="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#16100b] border border-[#3d2c1c] hover:border-blue-500/60 transition-colors">
              <div class="w-10 h-10 rounded-lg bg-blue-950/80 border border-blue-500/50 overflow-hidden shrink-0 shadow-inner treasure-image-shine">
                <img
                  src="/src/assets/images/reagent_crystals_bundle_1795188691071.jpg"
                  alt="Cristaux de Mana"
                  class="w-full h-full object-cover"
                  referrerpolicy="no-referrer" />
              </div>
              <div class="min-w-0">
                <div class="text-[10px] text-[#9a8670] truncate font-serif">Cristaux de Mana</div>
                <div class="font-mono font-bold text-blue-400 text-sm">{{ res().crystals }}</div>
              </div>
            </div>

            <!-- 3. Essences -->
            <div class="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#16100b] border border-[#3d2c1c] hover:border-purple-500/60 transition-colors">
              <div class="w-10 h-10 rounded-lg bg-purple-950/80 border border-purple-500/50 overflow-hidden shrink-0 shadow-inner treasure-image-shine">
                <img
                  src="/src/assets/images/reagent_essences_bundle_1795188691062.jpg"
                  alt="Essences Runiques"
                  class="w-full h-full object-cover"
                  referrerpolicy="no-referrer" />
              </div>
              <div class="min-w-0">
                <div class="text-[10px] text-[#9a8670] truncate font-serif">Essences Runiques</div>
                <div class="font-mono font-bold text-purple-400 text-sm">{{ res().essences }}</div>
              </div>
            </div>

            <!-- 4. Astral Dew -->
            <div class="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#16100b] border border-[#3d2c1c] hover:border-cyan-500/60 transition-colors">
              <div class="w-10 h-10 rounded-lg bg-cyan-950/80 border border-cyan-500/50 overflow-hidden shrink-0 shadow-inner treasure-image-shine">
                <img
                  src="/src/assets/images/reagent_astral_dew_1795189809241.jpg"
                  alt="Rosée Astrale"
                  class="w-full h-full object-cover"
                  referrerpolicy="no-referrer" />
              </div>
              <div class="min-w-0">
                <div class="text-[10px] text-[#9a8670] truncate font-serif">Rosée Astrale</div>
                <div class="font-mono font-bold text-cyan-300 text-sm">{{ res().astralDew }}</div>
              </div>
            </div>

            <!-- 5. Phoenix Ash -->
            <div class="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#16100b] border border-[#3d2c1c] hover:border-rose-500/60 transition-colors">
              <div class="w-10 h-10 rounded-lg bg-rose-950/80 border border-rose-500/50 overflow-hidden shrink-0 shadow-inner treasure-image-shine">
                <img
                  src="/src/assets/images/reagent_phoenix_ash_1795189812170.jpg"
                  alt="Cendres de Phénix"
                  class="w-full h-full object-cover"
                  referrerpolicy="no-referrer" />
              </div>
              <div class="min-w-0">
                <div class="text-[10px] text-[#9a8670] truncate font-serif">Cendres de Phénix</div>
                <div class="font-mono font-bold text-rose-400 text-sm">{{ res().phoenixAsh }}</div>
              </div>
            </div>

            <!-- 6. Void Spore -->
            <div class="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#16100b] border border-[#3d2c1c] hover:border-violet-500/60 transition-colors">
              <div class="w-10 h-10 rounded-lg bg-violet-950/80 border border-violet-500/50 overflow-hidden shrink-0 shadow-inner treasure-image-shine">
                <img
                  src="/src/assets/images/reagent_void_spore_1795189809748.jpg"
                  alt="Spores du Néant"
                  class="w-full h-full object-cover"
                  referrerpolicy="no-referrer" />
              </div>
              <div class="min-w-0">
                <div class="text-[10px] text-[#9a8670] truncate font-serif">Spores du Néant</div>
                <div class="font-mono font-bold text-violet-400 text-sm">{{ res().voidSpore }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ======================================================= -->
      <!-- ACTIVE COMBAT BUFFS SHOWCASE                            -->
      <!-- ======================================================= -->
      @if (gameState.activeBuffs().length > 0) {
        <div class="relative overflow-hidden rounded-2xl border border-amber-600/40 bg-gradient-to-r from-[#21170d] via-[#1a120b] to-[#140e08] p-4 shadow-xl">
          <div class="flex items-center justify-between pb-2 border-b border-[#8b6b43]/30">
            <div class="flex items-center gap-2 text-xs font-cinzel font-bold text-[#e5c98d] uppercase tracking-wider">
              <mat-icon class="text-amber-400 text-base animate-pulse">local_fire_department</mat-icon>
              Élixirs Actifs Infusés dans l'Âme de Votre Héros
            </div>
            <span class="text-[11px] font-mono text-[#a89070]">
              {{ gameState.activeBuffs().length }} effet(s) actif(s)
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
            @for (buff of gameState.activeBuffs(); track buff.potionId) {
              <div class="flex items-center justify-between p-3 rounded-xl bg-[#140e08] border border-[#3a2817] shadow-inner">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow" [style.backgroundColor]="buff.color">
                    <mat-icon class="text-lg">{{ buff.icon }}</mat-icon>
                  </div>
                  <div>
                    <div class="font-cinzel text-xs font-bold text-[#f0e6d2]">{{ buff.name }}</div>
                    <div class="text-[11px] text-[#d4af37] font-serif">{{ buff.effectDesc }}</div>
                  </div>
                </div>
                <div class="text-right shrink-0 ml-2">
                  <span class="inline-block text-[10px] font-mono font-bold text-[#d4af37] px-2 py-0.5 rounded bg-[#251a10] border border-[#4a341f]">
                    {{ buff.remainingMatches }} match(s)
                  </span>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- ======================================================= -->
      <!-- NAVIGATION TABS (MEDIEVAL SCRIPTORIUM STYLE)            -->
      <!-- ======================================================= -->
      <div class="flex flex-wrap items-center gap-2 border-b-2 border-[#3d2c1c] pb-2">
        <button
          (click)="setTab('recipes')"
          class="medieval-btn px-4 py-2.5 rounded-xl font-cinzel text-xs font-bold transition-all flex items-center gap-2 border"
          [class.bg-[#2a1c12]_text-[#f3e5ab]_border-[#d4af37]_shadow-md]="activeTab() === 'recipes'"
          [class.bg-[#140e08]_text-[#9d8364]_border-[#3d2c1c]_hover:text-[#e8d7b8]]="activeTab() !== 'recipes'">
          <mat-icon class="text-base text-amber-400">auto_stories</mat-icon>
          <span>Grimoire des Recettes</span>
          <span class="text-[10px] px-1.5 py-0.2 rounded bg-amber-950/60 border border-amber-700/50 text-amber-300 font-mono">
            {{ discoveredCount() }}/{{ gameState.potions().length }}
          </span>
        </button>

        <button
          (click)="setTab('experiment')"
          class="medieval-btn px-4 py-2.5 rounded-xl font-cinzel text-xs font-bold transition-all flex items-center gap-2 border"
          [class.bg-[#2a1c12]_text-[#f3e5ab]_border-[#d4af37]_shadow-md]="activeTab() === 'experiment'"
          [class.bg-[#140e08]_text-[#9d8364]_border-[#3d2c1c]_hover:text-[#e8d7b8]]="activeTab() !== 'experiment'">
          <mat-icon class="text-base text-purple-400">science</mat-icon>
          <span>Creuset Libre & Découverte</span>
          <span class="text-[10px] px-1.5 py-0.2 rounded bg-purple-950/60 border border-purple-700/50 text-purple-300 font-serif">Secret</span>
        </button>

        <button
          (click)="setTab('transmute')"
          class="medieval-btn px-4 py-2.5 rounded-xl font-cinzel text-xs font-bold transition-all flex items-center gap-2 border"
          [class.bg-[#2a1c12]_text-[#f3e5ab]_border-[#d4af37]_shadow-md]="activeTab() === 'transmute'"
          [class.bg-[#140e08]_text-[#9d8364]_border-[#3d2c1c]_hover:text-[#e8d7b8]]="activeTab() !== 'transmute'">
          <mat-icon class="text-base text-cyan-400">autorenew</mat-icon>
          <span>Athanor de Transmutation</span>
        </button>

        <button
          type="button"
          (click)="setTab('inventory')"
          class="medieval-btn px-4 py-2.5 rounded-xl font-cinzel text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer whitespace-nowrap shrink-0"
          [class.bg-[#2a1c12]]="activeTab() === 'inventory'"
          [class.text-[#f3e5ab]]="activeTab() === 'inventory'"
          [class.border-[#d4af37]]="activeTab() === 'inventory'"
          [class.shadow-md]="activeTab() === 'inventory'"
          [class.bg-[#140e08]]="activeTab() !== 'inventory'"
          [class.text-[#9d8364]]="activeTab() !== 'inventory'"
          [class.border-[#3d2c1c]]="activeTab() !== 'inventory'">
          <mat-icon class="text-base text-emerald-400">inventory_2</mat-icon>
          <span>Sac d'Élixirs ({{ totalPotionsCount() }})</span>
        </button>

        <button
          type="button"
          (click)="setTab('skins')"
          class="medieval-btn px-4 py-2.5 rounded-xl font-cinzel text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer whitespace-nowrap shrink-0"
          [class.bg-[#2a1c12]]="activeTab() === 'skins'"
          [class.text-[#f3e5ab]]="activeTab() === 'skins'"
          [class.border-[#d4af37]]="activeTab() === 'skins'"
          [class.shadow-md]="activeTab() === 'skins'"
          [class.bg-[#140e08]]="activeTab() !== 'skins'"
          [class.text-[#9d8364]]="activeTab() !== 'skins'"
          [class.border-[#3d2c1c]]="activeTab() !== 'skins'">
          <mat-icon class="text-base text-[#fbbf24]">checkroom</mat-icon>
          <span>Garde-Robe &amp; Skins</span>
          <span class="text-[10px] px-1.5 py-0.2 rounded bg-amber-950/60 border border-amber-700/50 text-amber-300 font-mono tabular-nums">
            {{ gameState.unlockedSkinsCount() }}/{{ gameState.totalSkinsCount() }}
          </span>
        </button>
      </div>

      <!-- ======================================================= -->
      <!-- TAB 1: GRIMOIRE DES RECETTES (RECIPES & MULTI-CRAFT)    -->
      <!-- ======================================================= -->
      @if (activeTab() === 'recipes') {
        <div class="space-y-6">
          <!-- Rarity filter bar -->
          <div class="flex flex-wrap items-center justify-between gap-3 bg-[#140e08] p-3 rounded-xl border border-[#3d2c1c]">
            <div class="flex items-center gap-2">
              <span class="text-xs font-cinzel text-[#9d8364] uppercase tracking-wider">Filtrer par Rareté :</span>
              <button
                (click)="setFilterRarity('all')"
                class="px-2.5 py-1 rounded-lg text-xs font-cinzel font-bold border transition-all"
                [class.bg-[#3d2c1c]_text-[#d4af37]_border-[#d4af37]]="filterRarity() === 'all'"
                [class.bg-[#1e150f]_text-[#8b6b43]_border-[#3d2c1c]]="filterRarity() !== 'all'">
                Toutes
              </button>
              <button
                (click)="setFilterRarity('rare')"
                class="px-2.5 py-1 rounded-lg text-xs font-cinzel font-bold border transition-all"
                [class.bg-blue-950_text-blue-300_border-blue-500]="filterRarity() === 'rare'"
                [class.bg-[#1e150f]_text-[#8b6b43]_border-[#3d2c1c]]="filterRarity() !== 'rare'">
                Rares
              </button>
              <button
                (click)="setFilterRarity('epic')"
                class="px-2.5 py-1 rounded-lg text-xs font-cinzel font-bold border transition-all"
                [class.bg-purple-950_text-purple-300_border-purple-500]="filterRarity() === 'epic'"
                [class.bg-[#1e150f]_text-[#8b6b43]_border-[#3d2c1c]]="filterRarity() !== 'epic'">
                Épiques
              </button>
              <button
                (click)="setFilterRarity('legendary')"
                class="px-2.5 py-1 rounded-lg text-xs font-cinzel font-bold border transition-all"
                [class.bg-amber-950_text-amber-300_border-amber-500]="filterRarity() === 'legendary'"
                [class.bg-[#1e150f]_text-[#8b6b43]_border-[#3d2c1c]]="filterRarity() !== 'legendary'">
                Légendaires
              </button>
              <button
                (click)="setFilterRarity('mythic')"
                class="px-2.5 py-1 rounded-lg text-xs font-cinzel font-bold border transition-all"
                [class.bg-rose-950_text-rose-300_border-rose-500]="filterRarity() === 'mythic'"
                [class.bg-[#1e150f]_text-[#8b6b43]_border-[#3d2c1c]]="filterRarity() !== 'mythic'">
                Mythiques
              </button>
            </div>

            <div class="text-xs font-mono text-[#9d8364]">
              {{ filteredPotions().length }} recette(s) répertoriée(s)
            </div>
          </div>

          <!-- Recipe Cards Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            @for (pot of filteredPotions(); track pot.id) {
              @if (pot.recipe) {
                @let isDiscovered = pot.isSecretDiscovered !== false;
                @let maxCraft = calculateMaxCraft(pot.recipe);
                @let currentCraftQty = getCraftQuantity(pot.id);
                @let canCraftCurrent = canCraftQuantity(pot.recipe, currentCraftQty);

                <div class="relative rounded-2xl border-2 p-4 md:p-5 flex flex-col justify-between transition-all shadow-xl bg-gradient-to-b from-[#18110b] to-[#0f0b07]"
                  [class.border-[#d4af37]/60]="isDiscovered && pot.rarity === 'mythic'"
                  [class.border-amber-600/50]="isDiscovered && pot.rarity === 'legendary'"
                  [class.border-purple-600/50]="isDiscovered && pot.rarity === 'epic'"
                  [class.border-blue-600/40]="isDiscovered && pot.rarity === 'rare'"
                  [class.border-stone-800]="!isDiscovered"
                  [class.opacity-80]="!isDiscovered">

                  <div>
                    <!-- Header of card -->
                    <div class="flex items-start justify-between gap-3">
                      <div class="flex items-center gap-3">
                        <div class="w-14 h-14 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg border-2 treasure-image-shine bg-[#0d0a07]"
                          [style.borderColor]="isDiscovered ? pot.color : '#3d3024'">
                          @if (isDiscovered && pot.imageUrl) {
                            <img
                              [src]="pot.imageUrl"
                              [alt]="pot.name"
                              class="w-full h-full object-cover rounded-[10px]"
                              referrerpolicy="no-referrer" />
                          } @else {
                            <mat-icon class="text-2xl" [style.color]="isDiscovered ? pot.color : '#a89070'">{{ isDiscovered ? pot.icon : 'lock' }}</mat-icon>
                          }
                        </div>
                        <div>
                          <div class="flex items-center gap-2">
                            <span class="font-cinzel text-sm sm:text-base font-bold text-[#f0e6d2]">
                              {{ isDiscovered ? pot.name : "Formule Secrète de l'Abîme" }}
                            </span>
                          </div>
                          <div class="flex items-center gap-2 mt-0.5">
                            <span class="text-[10px] font-cinzel font-bold px-2 py-0.5 rounded uppercase"
                              [class.bg-blue-900/60_text-blue-300]="pot.rarity === 'rare'"
                              [class.bg-purple-900/60_text-purple-300]="pot.rarity === 'epic'"
                              [class.bg-amber-900/60_text-amber-300]="pot.rarity === 'legendary'"
                              [class.bg-rose-900/60_text-rose-300]="pot.rarity === 'mythic'">
                              {{ pot.rarity }}
                            </span>
                            @if (isDiscovered && (pot.masteryLevel || 0) > 0) {
                              <span class="text-[10px] font-mono text-[#d4af37] flex items-center">
                                Maîtrise ★{{ pot.masteryLevel }}
                              </span>
                            }
                          </div>
                        </div>
                      </div>

                      <div class="text-right shrink-0">
                        <div class="text-[10px] text-[#8b6b43] font-serif">En réserve</div>
                        <div class="font-mono font-bold text-xs text-[#e5c98d]">{{ pot.count }} flasque(s)</div>
                      </div>
                    </div>

                    <!-- Effect & Lore description -->
                    <div class="mt-3 bg-[#110c08] p-2.5 rounded-xl border border-[#312316] text-xs">
                      @if (isDiscovered) {
                        <div class="font-cinzel font-bold text-[#d4af37] text-[11px] flex items-center gap-1.5">
                          <mat-icon class="text-xs text-amber-400">stars</mat-icon>
                          {{ pot.effectLabel }}
                        </div>
                        <div class="text-[#a89070] text-[11px] font-serif mt-1 leading-snug">
                          {{ pot.description }}
                        </div>
                      } @else {
                        <div class="text-stone-400 italic text-[11px] font-serif flex items-center gap-2">
                          <mat-icon class="text-sm text-stone-500">lock</mat-icon>
                          Formule secrète non révélée ! Combinez des ressources rares dans le Creuset Libre pour découvrir la réaction.
                        </div>
                      }
                    </div>

                    <!-- Ingredients recipe breakdown -->
                    @if (isDiscovered) {
                      <div class="mt-3 pt-2.5 border-t border-[#312316]">
                        <div class="text-[10px] font-cinzel uppercase tracking-wider text-[#8b6b43] mb-1.5">
                          Composants Requis pour la Distillation :
                        </div>
                        <div class="flex flex-wrap items-center gap-2 text-xs font-mono">
                          @if (pot.recipe.herb > 0) {
                            <div class="flex items-center gap-1 px-2 py-0.5 rounded bg-[#130d08] border"
                              [class.border-emerald-600/40_text-emerald-400]="res().herbs >= pot.recipe.herb * currentCraftQty"
                              [class.border-red-900/60_text-red-400]="res().herbs < pot.recipe.herb * currentCraftQty">
                              <mat-icon class="text-xs">eco</mat-icon>
                              <span>{{ pot.recipe.herb * currentCraftQty }}</span>
                              <span class="text-[9px] text-[#8b6b43]">/{{ res().herbs }}</span>
                            </div>
                          }
                          @if (pot.recipe.crystal > 0) {
                            <div class="flex items-center gap-1 px-2 py-0.5 rounded bg-[#130d08] border"
                              [class.border-blue-600/40_text-blue-400]="res().crystals >= pot.recipe.crystal * currentCraftQty"
                              [class.border-red-900/60_text-red-400]="res().crystals < pot.recipe.crystal * currentCraftQty">
                              <span>⬥</span>
                              <span>{{ pot.recipe.crystal * currentCraftQty }}</span>
                              <span class="text-[9px] text-[#8b6b43]">/{{ res().crystals }}</span>
                            </div>
                          }
                          @if (pot.recipe.essence > 0) {
                            <div class="flex items-center gap-1 px-2 py-0.5 rounded bg-[#130d08] border"
                              [class.border-purple-600/40_text-purple-400]="res().essences >= pot.recipe.essence * currentCraftQty"
                              [class.border-red-900/60_text-red-400]="res().essences < pot.recipe.essence * currentCraftQty">
                              <mat-icon class="text-xs">grain</mat-icon>
                              <span>{{ pot.recipe.essence * currentCraftQty }}</span>
                              <span class="text-[9px] text-[#8b6b43]">/{{ res().essences }}</span>
                            </div>
                          }
                          @if (pot.recipe.astralDew && pot.recipe.astralDew > 0) {
                            <div class="flex items-center gap-1 px-2 py-0.5 rounded bg-[#130d08] border"
                              [class.border-cyan-500/40_text-cyan-300]="res().astralDew >= pot.recipe.astralDew * currentCraftQty"
                              [class.border-red-900/60_text-red-400]="res().astralDew < pot.recipe.astralDew * currentCraftQty">
                              <mat-icon class="text-xs">water_drop</mat-icon>
                              <span>{{ pot.recipe.astralDew * currentCraftQty }}</span>
                              <span class="text-[9px] text-[#8b6b43]">/{{ res().astralDew }}</span>
                            </div>
                          }
                          @if (pot.recipe.phoenixAsh && pot.recipe.phoenixAsh > 0) {
                            <div class="flex items-center gap-1 px-2 py-0.5 rounded bg-[#130d08] border"
                              [class.border-rose-500/40_text-rose-400]="res().phoenixAsh >= pot.recipe.phoenixAsh * currentCraftQty"
                              [class.border-red-900/60_text-red-400]="res().phoenixAsh < pot.recipe.phoenixAsh * currentCraftQty">
                              <mat-icon class="text-xs">local_fire_department</mat-icon>
                              <span>{{ pot.recipe.phoenixAsh * currentCraftQty }}</span>
                              <span class="text-[9px] text-[#8b6b43]">/{{ res().phoenixAsh }}</span>
                            </div>
                          }
                          @if (pot.recipe.voidSpore && pot.recipe.voidSpore > 0) {
                            <div class="flex items-center gap-1 px-2 py-0.5 rounded bg-[#130d08] border"
                              [class.border-violet-500/40_text-violet-400]="res().voidSpore >= pot.recipe.voidSpore * currentCraftQty"
                              [class.border-red-900/60_text-red-400]="res().voidSpore < pot.recipe.voidSpore * currentCraftQty">
                              <mat-icon class="text-xs">coronavirus</mat-icon>
                              <span>{{ pot.recipe.voidSpore * currentCraftQty }}</span>
                              <span class="text-[9px] text-[#8b6b43]">/{{ res().voidSpore }}</span>
                            </div>
                          }
                        </div>
                      </div>
                    }
                  </div>

                  <!-- Crafting Controls Footer -->
                  <div class="mt-4 pt-3 border-t border-[#312316] flex flex-wrap items-center justify-between gap-3">
                    @if (isDiscovered) {
                      <!-- Multi-craft quantity controls -->
                      <div class="flex items-center gap-1.5 bg-[#120d09] px-2 py-1 rounded-xl border border-[#3a2817]">
                        <button
                          (click)="decrementCraftQuantity(pot.id)"
                          [disabled]="currentCraftQty <= 1"
                          class="w-6 h-6 rounded flex items-center justify-center text-xs font-bold bg-[#1e150f] text-[#c5a880] hover:bg-[#2d2016] disabled:opacity-40">
                          -
                        </button>
                        <span class="font-mono font-bold text-xs text-[#d4af37] px-2 min-w-[20px] text-center">
                          {{ currentCraftQty }}
                        </span>
                        <button
                          (click)="incrementCraftQuantity(pot.id)"
                          class="w-6 h-6 rounded flex items-center justify-center text-xs font-bold bg-[#1e150f] text-[#c5a880] hover:bg-[#2d2016]">
                          +
                        </button>
                        <button
                          (click)="setMaxCraftQuantity(pot.id, pot.recipe)"
                          class="text-[10px] font-cinzel font-bold px-1.5 py-0.5 rounded bg-[#251a10] text-[#d4af37] hover:bg-[#382618]">
                          Max ({{ maxCraft }})
                        </button>
                      </div>

                      <!-- Brew Button -->
                      <button
                        (click)="brew(pot.id)"
                        [disabled]="!canCraftCurrent"
                        class="medieval-btn px-4 py-2 rounded-xl text-xs font-cinzel font-bold border transition-all flex items-center gap-1.5 shadow-md"
                        [class.bg-gradient-to-r_from-amber-700_to-amber-600_text-white_border-amber-400_hover:from-amber-600_hover:to-amber-500]="canCraftCurrent"
                        [class.bg-[#1e150f]_text-[#66523f]_border-[#3a2817]_opacity-50]="!canCraftCurrent">
                        <mat-icon class="text-sm">science</mat-icon>
                        Synthétiser (x{{ currentCraftQty }})
                      </button>
                    } @else {
                      <button
                        (click)="setTab('experiment')"
                        class="medieval-btn w-full py-2 rounded-xl text-xs font-cinzel font-bold border border-purple-800/60 bg-purple-950/40 text-purple-300 hover:bg-purple-900/60 transition-all flex items-center justify-center gap-2">
                        <mat-icon class="text-sm">auto_fix_high</mat-icon>
                        Aller au Creuset d'Expérimentation
                      </button>
                    }
                  </div>

                </div>
              }
            }
          </div>
        </div>
      }

      <!-- ======================================================= -->
      <!-- TAB 2: CREUSET LIBRE & EXPÉRIMENTATION                  -->
      <!-- ======================================================= -->
      @if (activeTab() === 'experiment') {
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">

          <!-- Left Crucible Chamber (7 cols) -->
          <div class="lg:col-span-7 space-y-5">
            <div class="rounded-2xl border-2 border-purple-800/50 bg-gradient-to-b from-[#1c121e] via-[#140b16] to-[#0d070e] p-5 md:p-6 shadow-2xl relative overflow-hidden">
              <div class="flex items-center justify-between pb-3 border-b border-purple-900/40">
                <div class="flex items-center gap-2.5">
                  <mat-icon class="text-purple-400 text-2xl animate-pulse">science</mat-icon>
                  <div>
                    <h3 class="font-cinzel text-lg font-bold text-[#e9d5ff]">Creuset d'Alchimie Libre</h3>
                    <p class="text-xs text-[#a88bb5] font-serif">Mélangez librement vos réactifs pour débloquer les formules mythiques cachées.</p>
                  </div>
                </div>
                <button
                  (click)="resetExperiment()"
                  class="text-[11px] font-cinzel text-purple-300 hover:text-white px-2.5 py-1 rounded bg-purple-950/60 border border-purple-800/40">
                  Vider le Creuset
                </button>
              </div>

              <!-- Reagent Ingestion Steppers -->
              <div class="mt-4 space-y-3">
                <div class="text-xs font-cinzel uppercase tracking-wider text-[#c084fc] font-bold">
                  Sélectionnez les quantités à verser dans le chaudron :
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <!-- Herb Stepper -->
                  <div class="p-3 rounded-xl bg-[#1a0e1c] border border-purple-900/40 flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <mat-icon class="text-emerald-400 text-base">eco</mat-icon>
                      <div>
                        <div class="text-xs font-serif text-[#e0d0e5]">Herbes Sauvages</div>
                        <div class="text-[10px] text-[#8d7195] font-mono">Stock : {{ res().herbs }}</div>
                      </div>
                    </div>
                    <div class="flex items-center gap-2">
                      <button (click)="alterExperiment('herbs', -1)" [disabled]="exp().herbs <= 0" class="w-7 h-7 rounded bg-[#2b1730] text-purple-200 font-bold hover:bg-[#3c2043] disabled:opacity-40">-</button>
                      <span class="w-6 text-center font-mono font-bold text-sm text-emerald-400">{{ exp().herbs }}</span>
                      <button (click)="alterExperiment('herbs', 1)" [disabled]="exp().herbs >= res().herbs" class="w-7 h-7 rounded bg-[#2b1730] text-purple-200 font-bold hover:bg-[#3c2043] disabled:opacity-40">+</button>
                    </div>
                  </div>

                  <!-- Crystal Stepper -->
                  <div class="p-3 rounded-xl bg-[#1a0e1c] border border-purple-900/40 flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <span class="text-blue-400 font-bold text-sm">⬥</span>
                      <div>
                        <div class="text-xs font-serif text-[#e0d0e5]">Cristaux de Mana</div>
                        <div class="text-[10px] text-[#8d7195] font-mono">Stock : {{ res().crystals }}</div>
                      </div>
                    </div>
                    <div class="flex items-center gap-2">
                      <button (click)="alterExperiment('crystals', -1)" [disabled]="exp().crystals <= 0" class="w-7 h-7 rounded bg-[#2b1730] text-purple-200 font-bold hover:bg-[#3c2043] disabled:opacity-40">-</button>
                      <span class="w-6 text-center font-mono font-bold text-sm text-blue-400">{{ exp().crystals }}</span>
                      <button (click)="alterExperiment('crystals', 1)" [disabled]="exp().crystals >= res().crystals" class="w-7 h-7 rounded bg-[#2b1730] text-purple-200 font-bold hover:bg-[#3c2043] disabled:opacity-40">+</button>
                    </div>
                  </div>

                  <!-- Essence Stepper -->
                  <div class="p-3 rounded-xl bg-[#1a0e1c] border border-purple-900/40 flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <mat-icon class="text-purple-400 text-base">grain</mat-icon>
                      <div>
                        <div class="text-xs font-serif text-[#e0d0e5]">Essences Runiques</div>
                        <div class="text-[10px] text-[#8d7195] font-mono">Stock : {{ res().essences }}</div>
                      </div>
                    </div>
                    <div class="flex items-center gap-2">
                      <button (click)="alterExperiment('essences', -1)" [disabled]="exp().essences <= 0" class="w-7 h-7 rounded bg-[#2b1730] text-purple-200 font-bold hover:bg-[#3c2043] disabled:opacity-40">-</button>
                      <span class="w-6 text-center font-mono font-bold text-sm text-purple-400">{{ exp().essences }}</span>
                      <button (click)="alterExperiment('essences', 1)" [disabled]="exp().essences >= res().essences" class="w-7 h-7 rounded bg-[#2b1730] text-purple-200 font-bold hover:bg-[#3c2043] disabled:opacity-40">+</button>
                    </div>
                  </div>

                  <!-- Astral Dew Stepper -->
                  <div class="p-3 rounded-xl bg-[#1a0e1c] border border-purple-900/40 flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <mat-icon class="text-cyan-300 text-base">water_drop</mat-icon>
                      <div>
                        <div class="text-xs font-serif text-[#e0d0e5]">Rosée Astrale</div>
                        <div class="text-[10px] text-[#8d7195] font-mono">Stock : {{ res().astralDew }}</div>
                      </div>
                    </div>
                    <div class="flex items-center gap-2">
                      <button (click)="alterExperiment('astralDew', -1)" [disabled]="exp().astralDew <= 0" class="w-7 h-7 rounded bg-[#2b1730] text-purple-200 font-bold hover:bg-[#3c2043] disabled:opacity-40">-</button>
                      <span class="w-6 text-center font-mono font-bold text-sm text-cyan-300">{{ exp().astralDew }}</span>
                      <button (click)="alterExperiment('astralDew', 1)" [disabled]="exp().astralDew >= res().astralDew" class="w-7 h-7 rounded bg-[#2b1730] text-purple-200 font-bold hover:bg-[#3c2043] disabled:opacity-40">+</button>
                    </div>
                  </div>

                  <!-- Phoenix Ash Stepper -->
                  <div class="p-3 rounded-xl bg-[#1a0e1c] border border-purple-900/40 flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <mat-icon class="text-rose-400 text-base">local_fire_department</mat-icon>
                      <div>
                        <div class="text-xs font-serif text-[#e0d0e5]">Cendres de Phénix</div>
                        <div class="text-[10px] text-[#8d7195] font-mono">Stock : {{ res().phoenixAsh }}</div>
                      </div>
                    </div>
                    <div class="flex items-center gap-2">
                      <button (click)="alterExperiment('phoenixAsh', -1)" [disabled]="exp().phoenixAsh <= 0" class="w-7 h-7 rounded bg-[#2b1730] text-purple-200 font-bold hover:bg-[#3c2043] disabled:opacity-40">-</button>
                      <span class="w-6 text-center font-mono font-bold text-sm text-rose-400">{{ exp().phoenixAsh }}</span>
                      <button (click)="alterExperiment('phoenixAsh', 1)" [disabled]="exp().phoenixAsh >= res().phoenixAsh" class="w-7 h-7 rounded bg-[#2b1730] text-purple-200 font-bold hover:bg-[#3c2043] disabled:opacity-40">+</button>
                    </div>
                  </div>

                  <!-- Void Spore Stepper -->
                  <div class="p-3 rounded-xl bg-[#1a0e1c] border border-purple-900/40 flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <mat-icon class="text-violet-400 text-base">coronavirus</mat-icon>
                      <div>
                        <div class="text-xs font-serif text-[#e0d0e5]">Spores du Néant</div>
                        <div class="text-[10px] text-[#8d7195] font-mono">Stock : {{ res().voidSpore }}</div>
                      </div>
                    </div>
                    <div class="flex items-center gap-2">
                      <button (click)="alterExperiment('voidSpore', -1)" [disabled]="exp().voidSpore <= 0" class="w-7 h-7 rounded bg-[#2b1730] text-purple-200 font-bold hover:bg-[#3c2043] disabled:opacity-40">-</button>
                      <span class="w-6 text-center font-mono font-bold text-sm text-violet-400">{{ exp().voidSpore }}</span>
                      <button (click)="alterExperiment('voidSpore', 1)" [disabled]="exp().voidSpore >= res().voidSpore" class="w-7 h-7 rounded bg-[#2b1730] text-purple-200 font-bold hover:bg-[#3c2043] disabled:opacity-40">+</button>
                    </div>
                  </div>
                </div>

                <!-- Action Button -->
                <div class="pt-4">
                  <button
                    (click)="triggerCustomSynthesis()"
                    [disabled]="totalExpSpent() < 4"
                    class="medieval-btn w-full py-3.5 rounded-xl text-sm font-cinzel font-black uppercase tracking-wider border-2 transition-all flex items-center justify-center gap-2.5 shadow-xl"
                    [class.bg-gradient-to-r_from-purple-800_via-indigo-700_to-purple-900_text-amber-200_border-purple-400_hover:scale-[1.01]]="totalExpSpent() >= 4"
                    [class.bg-[#1e1320]_text-purple-400/40_border-purple-900/30_opacity-50]="totalExpSpent() < 4">
                    <mat-icon class="text-lg">auto_awesome</mat-icon>
                    Allumer le Brasier & Forger la Réaction ({{ totalExpSpent() }} réactifs)
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Cauldron Simulation Visualizer (5 cols) -->
          <div class="lg:col-span-5 space-y-5">
            <div class="rounded-2xl border-2 border-[#8b6b43]/60 bg-gradient-to-b from-[#18110a] via-[#100a06] to-[#080503] p-5 shadow-2xl space-y-4">
              <div class="flex items-center justify-between pb-2 border-b border-[#8b6b43]/30">
                <span class="font-cinzel text-xs font-bold text-[#e5c98d] uppercase tracking-wider flex items-center gap-2">
                  <mat-icon class="text-amber-400 text-sm">local_fire_department</mat-icon>
                  État de la Fusion Alchimique
                </span>
                <span class="text-[10px] font-mono text-[#8b6b43]">Athanor Temp: {{ athanorTemp() }}°C</span>
              </div>

              <!-- Animated Cauldron Chamber -->
              <div class="relative w-full h-48 rounded-xl overflow-hidden border border-[#523b26] bg-[#0c0704] flex flex-col items-center justify-end p-4 shadow-inner">
                <!-- Steam Vapors -->
                <div class="absolute inset-x-0 top-3 flex justify-around opacity-40 animate-pulse">
                  <mat-icon class="text-lg text-purple-300">air</mat-icon>
                  <mat-icon class="text-xl text-amber-200" style="animation-delay: 0.5s;">air</mat-icon>
                  <mat-icon class="text-sm text-cyan-300" style="animation-delay: 1s;">air</mat-icon>
                </div>

                <!-- Cauldron Fluid Pot with Bespoke Cauldron Illustration -->
                <div class="relative w-36 h-28 rounded-b-full border-4 border-[#3f2c1c] overflow-hidden shadow-2xl flex items-center justify-center transition-all duration-700"
                  [style.background]="cauldronFluidGradient()">
                  <img
                    src="/src/assets/images/emblem_alchemy_cauldron_1795189810181.jpg"
                    alt="Chaudron Alchimique"
                    class="w-full h-full object-cover opacity-75 mix-blend-screen"
                    referrerpolicy="no-referrer" />
                  <!-- Bubbles animation -->
                  <div class="absolute inset-0 flex items-center justify-around opacity-70 pointer-events-none">
                    <div class="w-3 h-3 rounded-full bg-white/40 animate-bounce" style="animation-duration: 1.2s;"></div>
                    <div class="w-2 h-2 rounded-full bg-white/40 animate-bounce" style="animation-duration: 0.8s; animation-delay: 0.3s;"></div>
                    <div class="w-4 h-4 rounded-full bg-white/30 animate-bounce" style="animation-duration: 1.5s; animation-delay: 0.6s;"></div>
                  </div>
                </div>

                <!-- Glowing Embers Underneath -->
                <div class="w-40 h-3 rounded-full bg-gradient-to-r from-red-600 via-amber-500 to-red-600 blur-[2px] mt-1 animate-pulse"></div>

                <div class="mt-2 text-center">
                  <span class="font-cinzel text-xs font-bold text-[#e5c98d]">
                    {{ cauldronStateLabel() }}
                  </span>
                </div>
              </div>

              <!-- Secret Discovery Clues -->
              <div class="bg-[#120c07] p-3.5 rounded-xl border border-[#3b2817] space-y-2">
                <div class="font-cinzel text-xs font-bold text-[#d4af37] flex items-center gap-1.5">
                  <mat-icon class="text-sm text-amber-400">tips_and_updates</mat-icon>
                  Indices des Formules Cachées
                </div>
                <ul class="text-[11px] text-[#a89070] font-serif space-y-1.5 leading-snug list-disc pl-4">
                  <li><strong class="text-[#e5c98d]">Renaissance du Phénix :</strong> Requiert les Cendres de Phénix mêlées à la Rosée Astrale.</li>
                  <li><strong class="text-[#e5c98d]">Venin Abyssal du Néant :</strong> Distillé à partir de Spores du Néant et de fortes concentrations d'Essences.</li>
                  <li><strong class="text-[#e5c98d]">Sang de Titan :</strong> La recette la plus rare : nécessite l'union d'une Cendre de Phénix et d'une Spore du Néant.</li>
                </ul>
              </div>
            </div>
          </div>

        </div>
      }

      <!-- ======================================================= -->
      <!-- TAB 3: ATHANOR DE TRANSMUTATION                         -->
      <!-- ======================================================= -->
      @if (activeTab() === 'transmute') {
        <div class="space-y-5">
          <div class="bg-[#140e08] border border-[#3d2c1c] rounded-2xl p-4 md:p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 class="font-cinzel text-base font-bold text-[#f0e6d2] flex items-center gap-2">
                <mat-icon class="text-cyan-400">autorenew</mat-icon>
                Raffinage & Conversion de Matière Alchimique
              </h3>
              <p class="text-xs text-[#a89070] font-serif mt-1">
                Convertissez vos surplus d'arène en réactifs rares de haute valeur pour alimenter vos élixirs suprêmes.
              </p>
            </div>
            <span class="text-xs font-mono text-[#d4af37] px-3 py-1 rounded-xl bg-[#1e150f] border border-[#4a341f] shrink-0">
              Athanor Impérial Actif
            </span>
          </div>

          <!-- Transmutation Formulas Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (f of transmutations; track f.id) {
              @let canAfford = res()[f.fromKey] >= f.fromCost;
              <div class="rounded-2xl border-2 p-4 flex flex-col justify-between bg-[#16100a] transition-all shadow-md"
                [class.border-[#d4af37]/40]="canAfford"
                [class.border-[#382618]]="!canAfford">

                <div>
                  <div class="flex items-center justify-between gap-2">
                    <span class="font-cinzel font-bold text-xs text-[#f0e6d2]">{{ f.name }}</span>
                    <span class="text-[9px] font-mono px-2 py-0.5 rounded uppercase" [style.backgroundColor]="f.color + '25'" [style.color]="f.color">
                      {{ f.badge }}
                    </span>
                  </div>

                  <p class="text-[11px] font-serif text-[#a89070] mt-1.5 leading-snug">{{ f.desc }}</p>

                  <!-- Cost & Gain conversion visual -->
                  <div class="mt-3 p-2.5 rounded-xl bg-[#100a06] border border-[#2e1f13] flex items-center justify-between font-mono text-xs">
                    <div class="flex items-center gap-1.5" [class.text-red-400]="!canAfford" [class.text-amber-200]="canAfford">
                      <span>-{{ f.fromCost }}</span>
                      <span class="text-[10px] text-[#8b6b43] font-serif">({{ f.fromName }})</span>
                    </div>

                    <mat-icon class="text-sm text-[#d4af37]">arrow_forward</mat-icon>

                    <div class="flex items-center gap-1.5 text-emerald-400 font-bold">
                      <span>+{{ f.toGain }}</span>
                      <span class="text-[10px] text-[#8b6b43] font-serif">({{ f.toName }})</span>
                    </div>
                  </div>
                </div>

                <div class="mt-4 pt-2.5 border-t border-[#2e1f13] flex items-center justify-between">
                  <span class="text-[10px] font-mono text-[#8b6b43]">
                    Dispo : {{ res()[f.fromKey] }}
                  </span>

                  <button
                    (click)="transmute(f)"
                    [disabled]="!canAfford"
                    class="medieval-btn px-3.5 py-1.5 rounded-xl text-xs font-cinzel font-bold border transition-all flex items-center gap-1.5"
                    [class.bg-[#2a1c12]_text-[#d4af37]_border-[#d4af37]_hover:bg-[#382618]]="canAfford"
                    [class.bg-[#120d09]_text-[#5a4635]_border-[#2e1f13]_opacity-50]="!canAfford">
                    <mat-icon class="text-xs">autorenew</mat-icon>
                    Transmuter
                  </button>
                </div>

              </div>
            }
          </div>
        </div>
      }

      <!-- ======================================================= -->
      <!-- TAB 4: SAC D'ÉLIXIRS & CONSOMMATION                     -->
      <!-- ======================================================= -->
      @if (activeTab() === 'inventory') {
        <div class="space-y-4">
          <div class="bg-[#140e08] border border-[#3d2c1c] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 class="font-cinzel text-base font-bold text-[#f0e6d2] flex items-center gap-2">
                <mat-icon class="text-emerald-400">local_drink</mat-icon>
                Flasques Prêtes pour le Combat
              </h3>
              <p class="text-xs text-[#a89070] font-serif mt-0.5">
                Consommez vos potions avant d'entrer dans l'arène pour bénéficier d'effets passifs dévastateurs.
              </p>
            </div>
            <span class="text-xs font-mono text-[#d4af37] px-3 py-1 rounded-xl bg-[#1e150f] border border-[#4a341f]">
              Stock Total : {{ totalPotionsCount() }} potions
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            @for (pot of gameState.potions(); track pot.id) {
              @if (pot.isSecretDiscovered !== false) {
                <div class="medieval-btn p-4 rounded-xl bg-[#16100a] border border-[#3d2c1c] flex flex-col justify-between space-y-3 shadow-md hover:border-[#8b6b43]">
                  <div class="flex items-start gap-3">
                    <div class="w-14 h-14 rounded-xl flex items-center justify-center text-white shrink-0 shadow border-2 treasure-image-shine bg-[#0d0a07]"
                      [style.borderColor]="pot.color">
                      @if (pot.imageUrl) {
                        <img
                          [src]="pot.imageUrl"
                          [alt]="pot.name"
                          class="w-full h-full object-cover rounded-[10px]"
                          referrerpolicy="no-referrer" />
                      } @else {
                        <mat-icon class="text-xl" [style.color]="pot.color">{{ pot.icon }}</mat-icon>
                      }
                    </div>

                    <div class="min-w-0">
                      <div class="font-cinzel font-bold text-xs text-[#f0e6d2] truncate">{{ pot.name }}</div>
                      <div class="text-[10px] text-[#d4af37] font-medium">{{ pot.effectLabel }}</div>
                      <div class="text-[10px] text-[#8b6b43] mt-1 line-clamp-2 font-serif">{{ pot.description }}</div>
                    </div>
                  </div>

                  <div class="flex items-center justify-between pt-2.5 border-t border-[#312316] text-xs">
                    <span class="font-mono text-[#e5c98d] font-bold text-xs">
                      Stock : {{ pot.count }}
                    </span>

                    <button
                      (click)="usePotion(pot)"
                      [disabled]="pot.count <= 0"
                      class="medieval-btn px-3 py-1.5 rounded-lg text-xs font-cinzel font-bold border transition-all flex items-center gap-1.5 shadow"
                      [class.bg-[#2a1c12]_text-[#d4af37]_border-[#8b6b43]_hover:bg-[#382618]]="pot.count > 0"
                      [class.bg-[#120d09]_text-[#5a4635]_border-[#2e1f13]_opacity-50]="pot.count <= 0">
                      <mat-icon class="text-xs">local_drink</mat-icon>
                      Boire l'Élixir
                    </button>
                  </div>
                </div>
              }
            }
          </div>
        </div>
      }

      <!-- ======================================================= -->
      <!-- TAB 5: GARDE-ROBE & SKINS DE HÉROS (RARETÉS & PARTICULES) -->
      <!-- ======================================================= -->
      @if (activeTab() === 'skins') {
        <div class="space-y-5">
          <!-- Header & Rarity Breakdown -->
          <div class="bg-[#140e08] border border-[#3d2c1c] rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 class="font-cinzel text-base sm:text-lg font-bold text-[#f0e6d2] flex items-center gap-2">
                <mat-icon class="text-[#fbbf24]">checkroom</mat-icon>
                <span>Inventaire des Apparences &amp; Skins Héroïques</span>
              </h2>
              <p class="text-xs text-[#a89070] font-serif mt-1">
                Inspectez vos apparences par palier de rareté — du fer forgé Commun à l'éclat solaire Légendaire et Mythique.
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-4 text-xs font-mono tabular-nums shrink-0">
              <div>
                <span class="text-[#8b6b43]">Débloqués : </span>
                <strong class="text-[#ffd700]">{{ gameState.unlockedSkinsCount() }} / {{ gameState.totalSkinsCount() }}</strong>
              </div>
              <span class="text-[#3d2c1c]" aria-hidden="true">|</span>
              <div class="flex flex-wrap items-center gap-2.5 text-[11px]">
                <span class="text-[#a8a29e]">Commun {{ skinRarityCounts().common }}</span>
                <span class="text-[#38bdf8]">Rare {{ skinRarityCounts().rare }}</span>
                <span class="text-[#c084fc]">Épique {{ skinRarityCounts().epic }}</span>
                <span class="text-[#fbbf24]">Légendaire {{ skinRarityCounts().legendary }}</span>
                <span class="text-[#fb7185]">Mythique {{ skinRarityCounts().mythic }}</span>
              </div>
            </div>
          </div>

          <!-- Search, Ownership & Rarity Filter Strip -->
          <div class="bg-[#140e08] border border-[#3d2c1c] rounded-2xl p-3.5 space-y-3">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <!-- Search Input -->
              <div class="relative flex-1 max-w-sm">
                <mat-icon class="text-sm text-[#8b6b43] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">search</mat-icon>
                <input
                  type="text"
                  [value]="skinSearchQuery()"
                  (input)="onSkinSearch($event)"
                  placeholder="Rechercher un skin ou un héros..."
                  aria-label="Rechercher un skin ou un héros"
                  class="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0d0a07] border border-[#3d2c1c] focus:border-[#d4af37] focus:outline-none text-xs text-[#f0e6d2] placeholder:text-[#6b5a45]" />
              </div>

              <!-- Ownership Filter -->
              <div class="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  (click)="setSkinOwnershipFilter('all')"
                  class="px-3 py-1.5 rounded-lg text-xs font-cinzel font-bold border transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  [class.bg-[#2a1c12]]="skinOwnershipFilter() === 'all'"
                  [class.text-[#ffd700]]="skinOwnershipFilter() === 'all'"
                  [class.border-[#d4af37]]="skinOwnershipFilter() === 'all'"
                  [class.bg-[#120d09]]="skinOwnershipFilter() !== 'all'"
                  [class.text-[#8b6b43]]="skinOwnershipFilter() !== 'all'"
                  [class.border-[#3d2c1c]]="skinOwnershipFilter() !== 'all'">
                  Tous ({{ totalSkinsEntryCount() }})
                </button>
                <button
                  type="button"
                  (click)="setSkinOwnershipFilter('unlocked')"
                  class="px-3 py-1.5 rounded-lg text-xs font-cinzel font-bold border transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  [class.bg-[#0d2618]]="skinOwnershipFilter() === 'unlocked'"
                  [class.text-[#4dff88]]="skinOwnershipFilter() === 'unlocked'"
                  [class.border-[#4dff88]/60]="skinOwnershipFilter() === 'unlocked'"
                  [class.bg-[#120d09]]="skinOwnershipFilter() !== 'unlocked'"
                  [class.text-[#8b6b43]]="skinOwnershipFilter() !== 'unlocked'"
                  [class.border-[#3d2c1c]]="skinOwnershipFilter() !== 'unlocked'">
                  Possédés ({{ gameState.unlockedSkinsCount() }})
                </button>
                <button
                  type="button"
                  (click)="setSkinOwnershipFilter('locked')"
                  class="px-3 py-1.5 rounded-lg text-xs font-cinzel font-bold border transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  [class.bg-[#241212]]="skinOwnershipFilter() === 'locked'"
                  [class.text-[#ff7b7b]]="skinOwnershipFilter() === 'locked'"
                  [class.border-[#ff7b7b]/50]="skinOwnershipFilter() === 'locked'"
                  [class.bg-[#120d09]]="skinOwnershipFilter() !== 'locked'"
                  [class.text-[#8b6b43]]="skinOwnershipFilter() !== 'locked'"
                  [class.border-[#3d2c1c]]="skinOwnershipFilter() !== 'locked'">
                  À débloquer
                </button>
              </div>
            </div>

            <!-- Rarity Filter Buttons -->
            <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#2a1f14]">
              <div class="flex flex-wrap items-center gap-1.5">
                <span class="text-[11px] font-cinzel text-[#9d8364] uppercase tracking-wider mr-1">Rareté :</span>
                <button
                  type="button"
                  (click)="setSkinRarityFilter('all')"
                  class="px-2.5 py-1 rounded-lg text-xs font-cinzel font-bold border transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  [class.bg-[#2a1c12]]="skinRarityFilter() === 'all'"
                  [class.text-[#d4af37]]="skinRarityFilter() === 'all'"
                  [class.border-[#d4af37]]="skinRarityFilter() === 'all'"
                  [class.bg-[#1a130d]]="skinRarityFilter() !== 'all'"
                  [class.text-[#8b6b43]]="skinRarityFilter() !== 'all'"
                  [class.border-[#3d2c1c]]="skinRarityFilter() !== 'all'">
                  Toutes
                </button>
                <button
                  type="button"
                  (click)="setSkinRarityFilter('common')"
                  class="px-2.5 py-1 rounded-lg text-xs font-cinzel font-bold border transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  [class.bg-[#24211e]]="skinRarityFilter() === 'common'"
                  [class.text-[#e7e5e4]]="skinRarityFilter() === 'common'"
                  [class.border-[#a8a29e]]="skinRarityFilter() === 'common'"
                  [class.bg-[#1a130d]]="skinRarityFilter() !== 'common'"
                  [class.text-[#a8a29e]]="skinRarityFilter() !== 'common'"
                  [class.border-[#3d2c1c]]="skinRarityFilter() !== 'common'">
                  Commun
                </button>
                <button
                  type="button"
                  (click)="setSkinRarityFilter('rare')"
                  class="px-2.5 py-1 rounded-lg text-xs font-cinzel font-bold border transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  [class.bg-[#0c2238]]="skinRarityFilter() === 'rare'"
                  [class.text-[#7dd3fc]]="skinRarityFilter() === 'rare'"
                  [class.border-[#38bdf8]]="skinRarityFilter() === 'rare'"
                  [class.bg-[#1a130d]]="skinRarityFilter() !== 'rare'"
                  [class.text-[#38bdf8]]="skinRarityFilter() !== 'rare'"
                  [class.border-[#3d2c1c]]="skinRarityFilter() !== 'rare'">
                  Rare
                </button>
                <button
                  type="button"
                  (click)="setSkinRarityFilter('epic')"
                  class="px-2.5 py-1 rounded-lg text-xs font-cinzel font-bold border transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  [class.bg-[#27123c]]="skinRarityFilter() === 'epic'"
                  [class.text-[#e9d5ff]]="skinRarityFilter() === 'epic'"
                  [class.border-[#c084fc]]="skinRarityFilter() === 'epic'"
                  [class.bg-[#1a130d]]="skinRarityFilter() !== 'epic'"
                  [class.text-[#c084fc]]="skinRarityFilter() !== 'epic'"
                  [class.border-[#3d2c1c]]="skinRarityFilter() !== 'epic'">
                  Épique
                </button>
                <button
                  type="button"
                  (click)="setSkinRarityFilter('legendary')"
                  class="px-2.5 py-1 rounded-lg text-xs font-cinzel font-bold border transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  [class.bg-[#312108]]="skinRarityFilter() === 'legendary'"
                  [class.text-[#fef08a]]="skinRarityFilter() === 'legendary'"
                  [class.border-[#fbbf24]]="skinRarityFilter() === 'legendary'"
                  [class.bg-[#1a130d]]="skinRarityFilter() !== 'legendary'"
                  [class.text-[#fbbf24]]="skinRarityFilter() !== 'legendary'"
                  [class.border-[#3d2c1c]]="skinRarityFilter() !== 'legendary'">
                  Légendaire
                </button>
                <button
                  type="button"
                  (click)="setSkinRarityFilter('mythic')"
                  class="px-2.5 py-1 rounded-lg text-xs font-cinzel font-bold border transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  [class.bg-[#351020]]="skinRarityFilter() === 'mythic'"
                  [class.text-[#fecdd3]]="skinRarityFilter() === 'mythic'"
                  [class.border-[#fb7185]]="skinRarityFilter() === 'mythic'"
                  [class.bg-[#1a130d]]="skinRarityFilter() !== 'mythic'"
                  [class.text-[#fb7185]]="skinRarityFilter() !== 'mythic'"
                  [class.border-[#3d2c1c]]="skinRarityFilter() !== 'mythic'">
                  Mythique
                </button>
              </div>

              <span class="text-xs font-mono tabular-nums text-[#9d8364]">
                {{ filteredSkinEntries().length }} apparence(s)
              </span>
            </div>
          </div>

          <!-- Skin Cards Grid with CSS Rarity Frames & Particle Effects -->
          @if (filteredSkinEntries().length === 0) {
            <div class="rounded-2xl border border-[#3d2c1c] bg-[#140e08] p-8 text-center space-y-2">
              <mat-icon class="text-3xl text-[#8b6b43]">checkroom</mat-icon>
              <div class="font-cinzel text-sm font-bold text-[#e8d7b8]">Aucune apparence ne correspond à vos filtres</div>
              <p class="text-xs font-serif text-[#9d8364]">Réinitialisez votre recherche ou sélectionnez une autre rareté.</p>
            </div>
          } @else {
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              @for (entry of filteredSkinEntries(); track entry.skin.id) {
                @let hero = entry.hero;
                @let skin = entry.skin;
                @let isEquipped = hero.activeSkinId === skin.id;

                <div
                  class="skin-rarity-card rounded-2xl border p-4 flex flex-col justify-between gap-3.5"
                  [class]="getSkinRarityCardClass(skin.rarity)">

                  <!-- CSS Particle Layer by Rarity -->
                  <div class="skin-particles" aria-hidden="true">
                    @switch (skin.rarity) {
                      @case ('common') {
                        <span class="skin-particle" style="left: 18%; --p-dur: 5.5s; --p-delay: 0s; --px-drift: 6px; --py-rise: -75px;"></span>
                        <span class="skin-particle" style="left: 78%; --p-dur: 6.2s; --p-delay: 2.1s; --px-drift: -6px; --py-rise: -70px;"></span>
                      }
                      @case ('rare') {
                        <span class="skin-particle" style="left: 12%; --p-dur: 4.4s; --p-delay: 0s; --px-drift: 8px; --py-rise: -120px;"></span>
                        <span class="skin-particle" style="left: 36%; --p-dur: 3.8s; --p-delay: 1.1s; --px-drift: -10px; --py-rise: -135px;"></span>
                        <span class="skin-particle" style="left: 64%; --p-dur: 4.8s; --p-delay: 0.6s; --px-drift: 12px; --py-rise: -125px;"></span>
                        <span class="skin-particle" style="left: 86%; --p-dur: 4.1s; --p-delay: 1.9s; --px-drift: -8px; --py-rise: -115px;"></span>
                      }
                      @case ('epic') {
                        <span class="skin-particle" style="left: 10%; --p-dur: 4.0s; --p-delay: 0s; --px-drift: 14px; --py-rise: -145px;"></span>
                        <span class="skin-particle" style="left: 28%; --p-dur: 3.4s; --p-delay: 0.8s; --px-drift: -12px; --py-rise: -155px;"></span>
                        <span class="skin-particle" style="left: 52%; --p-dur: 4.3s; --p-delay: 1.5s; --px-drift: 10px; --py-rise: -140px;"></span>
                        <span class="skin-particle" style="left: 72%; --p-dur: 3.7s; --p-delay: 0.3s; --px-drift: -14px; --py-rise: -150px;"></span>
                        <span class="skin-particle" style="left: 89%; --p-dur: 4.1s; --p-delay: 2.2s; --px-drift: 8px; --py-rise: -135px;"></span>
                      }
                      @case ('legendary') {
                        <span class="skin-particle" style="left: 8%; --p-dur: 3.4s; --p-delay: 0s; --px-drift: 16px; --py-rise: -165px;"></span>
                        <span class="skin-particle" style="left: 22%; --p-dur: 2.9s; --p-delay: 0.7s; --px-drift: -12px; --py-rise: -175px;"></span>
                        <span class="skin-particle" style="left: 39%; --p-dur: 3.6s; --p-delay: 1.4s; --px-drift: 14px; --py-rise: -160px;"></span>
                        <span class="skin-particle" style="left: 54%; --p-dur: 3.1s; --p-delay: 0.3s; --px-drift: -16px; --py-rise: -180px;"></span>
                        <span class="skin-particle" style="left: 69%; --p-dur: 3.8s; --p-delay: 1.9s; --px-drift: 12px; --py-rise: -170px;"></span>
                        <span class="skin-particle" style="left: 83%; --p-dur: 3.0s; --p-delay: 0.9s; --px-drift: -10px; --py-rise: -165px;"></span>
                        <span class="skin-particle" style="left: 93%; --p-dur: 3.5s; --p-delay: 1.6s; --px-drift: -14px; --py-rise: -155px;"></span>
                        <span class="skin-particle-star" style="top: 18%; right: 14%; --p-dur: 2.4s; --p-delay: 0.2s;"></span>
                        <span class="skin-particle-star" style="top: 42%; left: 10%; --p-dur: 2.9s; --p-delay: 1.1s;"></span>
                      }
                      @case ('mythic') {
                        <span class="skin-particle" style="left: 7%; --p-dur: 3.1s; --p-delay: 0s; --px-drift: 18px; --py-rise: -175px;"></span>
                        <span class="skin-particle" style="left: 19%; --p-dur: 2.7s; --p-delay: 0.5s; --px-drift: -14px; --py-rise: -185px;"></span>
                        <span class="skin-particle" style="left: 33%; --p-dur: 3.4s; --p-delay: 1.2s; --px-drift: 16px; --py-rise: -170px;"></span>
                        <span class="skin-particle" style="left: 48%; --p-dur: 2.8s; --p-delay: 0.2s; --px-drift: -18px; --py-rise: -190px;"></span>
                        <span class="skin-particle" style="left: 61%; --p-dur: 3.5s; --p-delay: 1.7s; --px-drift: 14px; --py-rise: -175px;"></span>
                        <span class="skin-particle" style="left: 74%; --p-dur: 2.9s; --p-delay: 0.8s; --px-drift: -12px; --py-rise: -180px;"></span>
                        <span class="skin-particle" style="left: 86%; --p-dur: 3.2s; --p-delay: 1.4s; --px-drift: 10px; --py-rise: -165px;"></span>
                        <span class="skin-particle" style="left: 94%; --p-dur: 2.6s; --p-delay: 2.0s; --px-drift: -16px; --py-rise: -175px;"></span>
                        <span class="skin-particle-star" style="top: 15%; right: 12%; --p-dur: 2.1s; --p-delay: 0s;"></span>
                        <span class="skin-particle-star" style="top: 38%; left: 9%; --p-dur: 2.6s; --p-delay: 0.9s;"></span>
                        <span class="skin-particle-star" style="bottom: 28%; right: 20%; --p-dur: 2.3s; --p-delay: 1.5s;"></span>
                      }
                    }
                  </div>

                  <!-- Foreground Card Content -->
                  <div class="skin-card-content flex items-start gap-3.5">
                    <div
                      class="w-20 h-20 rounded-xl bg-[#0d0a07] border-2 overflow-hidden flex items-center justify-center shrink-0 relative shadow-lg"
                      [style.borderColor]="skin.accentHex || getSkinRarityAccentHex(skin.rarity)"
                      [style.boxShadow]="'0 0 18px ' + (skin.accentHex || getSkinRarityAccentHex(skin.rarity)) + '40'">
                      @if (skin.imageUrl || hero.imageUrl) {
                        <img
                          [src]="skin.imageUrl || hero.imageUrl"
                          [alt]="hero.name + ' - ' + skin.name"
                          [style.filter]="skin.portraitFilter || 'none'"
                          class="w-full h-full object-cover"
                          referrerpolicy="no-referrer" />
                        <div class="absolute inset-0 bg-gradient-to-t pointer-events-none" [class]="skin.themeGradient || ''"></div>
                      } @else {
                        <mat-icon class="text-3xl text-[#c5a880]">{{ skin.avatarIcon }}</mat-icon>
                      }
                    </div>

                    <div class="min-w-0 flex-1 space-y-1">
                      <div class="text-[11px] font-cinzel font-bold tracking-wide flex flex-wrap items-center gap-1">
                        <span [class]="getSkinRarityTextClass(skin.rarity)">{{ getSkinRarityLabel(skin.rarity) }}</span>
                        <span class="text-[#6b5a45]" aria-hidden="true">·</span>
                        <span class="text-[#c5a880] truncate">{{ hero.name }}</span>
                      </div>

                      <h3 class="font-cinzel text-sm font-black text-[#f3ead8] truncate">
                        {{ skin.name }}
                      </h3>

                      <div class="text-[10px] font-cinzel text-[#9d8364]">
                        <span>{{ skin.badge }}</span>
                        @if (skin.visualEffectLabel) {
                          <span aria-hidden="true"> · </span>
                          <span class="text-[#e0dcc7]">{{ skin.visualEffectLabel }}</span>
                        }
                      </div>

                      <p class="text-[11px] font-serif text-[#a89070] leading-snug line-clamp-2 pt-0.5">
                        {{ skin.description || 'Apparence alternative pour ' + hero.name + '.' }}
                      </p>
                    </div>
                  </div>

                  <!-- Card Footer Actions -->
                  <div class="skin-card-content flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/10">
                    @if (skin.isUnlocked) {
                      @if (isEquipped) {
                        <span class="inline-flex items-center gap-1.5 text-xs font-cinzel font-bold text-[#4dff88] whitespace-nowrap shrink-0">
                          <mat-icon class="text-sm">check_circle</mat-icon>
                          <span>Équipé sur {{ hero.name }}</span>
                        </span>
                      } @else {
                        <span class="text-[11px] font-cinzel text-[#9d8364]">Débloqué</span>
                        <button
                          type="button"
                          (click)="equipHeroSkin(hero.id, skin.id)"
                          class="medieval-btn px-3.5 py-1.5 rounded-lg bg-[#2a2117] hover:bg-[#382b1d] border border-[#d4af37] text-[#ffd700] text-xs font-cinzel font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0">
                          <mat-icon class="text-sm">checkroom</mat-icon>
                          <span>Équiper</span>
                        </button>
                      }
                    } @else {
                      <span class="text-[11px] font-cinzel text-[#8b6b43] flex items-center gap-1">
                        <mat-icon class="text-xs">lock</mat-icon>
                        <span>Verrouillé</span>
                      </span>
                      <div class="flex items-center gap-1.5">
                        @if (skin.goldPrice) {
                          <button
                            type="button"
                            (click)="unlockHeroSkin(hero.id, skin.id, 'gold')"
                            [disabled]="gameState.gold() < skin.goldPrice"
                            class="medieval-btn px-2.5 py-1.5 rounded-lg bg-[#1a1612] border border-[#d4af37]/70 font-mono tabular-nums font-bold text-xs cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1"
                            [class.opacity-45]="gameState.gold() < skin.goldPrice">
                            <span class="currency-gold-coin">✦</span>
                            <span class="currency-gold-shine font-extrabold">{{ skin.goldPrice }}</span>
                          </button>
                        }
                        @if (skin.gemPrice) {
                          <button
                            type="button"
                            (click)="unlockHeroSkin(hero.id, skin.id, 'gems')"
                            [disabled]="gameState.gems() < skin.gemPrice"
                            class="crimson-btn px-2.5 py-1.5 rounded-lg font-mono tabular-nums font-bold text-xs border border-[#ff4d4d] cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1"
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
            </div>
          }
        </div>
      }

    </div>
  `,
})
export class InventoryView {
  readonly gameState = inject(GameStateService);
  readonly sound = inject(SoundService);

  readonly activeTab = signal<AlchemyTab>('recipes');
  readonly filterRarity = signal<string>('all');
  readonly skinRarityFilter = signal<'all' | CardRarity>('all');
  readonly skinOwnershipFilter = signal<SkinOwnershipFilter>('all');
  readonly skinSearchQuery = signal<string>('');

  // Multi-craft quantity state per potion ID
  private readonly craftQuantities = signal<Record<string, number>>({});

  // Free Experiment Crucible state
  readonly exp = signal<{
    herbs: number;
    crystals: number;
    essences: number;
    astralDew: number;
    phoenixAsh: number;
    voidSpore: number;
  }>({
    herbs: 3,
    crystals: 2,
    essences: 1,
    astralDew: 0,
    phoenixAsh: 0,
    voidSpore: 0,
  });

  readonly res = this.gameState.alchemyResources;

  readonly discoveredCount = computed(() => {
    return this.gameState.potions().filter(p => p.isSecretDiscovered !== false).length;
  });

  readonly totalPotionsCount = computed(() => {
    return this.gameState.potions().reduce((acc, p) => acc + p.count, 0);
  });

  readonly filteredPotions = computed(() => {
    const r = this.filterRarity();
    const list = this.gameState.potions();
    if (r === 'all') return list;
    return list.filter(p => p.rarity === r);
  });

  readonly allSkinEntries = computed<InventorySkinEntry[]>(() => {
    const entries: InventorySkinEntry[] = [];
    for (const hero of this.gameState.heroes()) {
      for (const skin of hero.skins) {
        entries.push({ hero, skin });
      }
    }
    return entries;
  });

  readonly totalSkinsEntryCount = computed(() => this.allSkinEntries().length);

  readonly skinRarityCounts = computed(() => {
    const counts: Record<CardRarity, number> = {
      common: 0,
      rare: 0,
      epic: 0,
      legendary: 0,
      mythic: 0,
    };
    for (const entry of this.allSkinEntries()) {
      counts[entry.skin.rarity] = (counts[entry.skin.rarity] || 0) + 1;
    }
    return counts;
  });

  readonly filteredSkinEntries = computed<InventorySkinEntry[]>(() => {
    const rarity = this.skinRarityFilter();
    const ownership = this.skinOwnershipFilter();
    const query = this.skinSearchQuery().trim().toLowerCase();

    return this.allSkinEntries().filter(({ hero, skin }) => {
      if (rarity !== 'all' && skin.rarity !== rarity) {
        return false;
      }
      if (ownership === 'unlocked' && !skin.isUnlocked) {
        return false;
      }
      if (ownership === 'locked' && skin.isUnlocked) {
        return false;
      }
      if (query) {
        const matchesHero = hero.name.toLowerCase().includes(query) || hero.title.toLowerCase().includes(query);
        const matchesSkin =
          skin.name.toLowerCase().includes(query) ||
          (skin.description && skin.description.toLowerCase().includes(query)) ||
          skin.badge.toLowerCase().includes(query);
        if (!matchesHero && !matchesSkin) {
          return false;
        }
      }
      return true;
    });
  });

  readonly totalExpSpent = computed(() => {
    const e = this.exp();
    return e.herbs + e.crystals + e.essences + e.astralDew + e.phoenixAsh + e.voidSpore;
  });

  readonly athanorTemp = computed(() => {
    const e = this.exp();
    return 300 + e.herbs * 10 + e.crystals * 25 + e.essences * 40 + e.astralDew * 80 + e.phoenixAsh * 150 + e.voidSpore * 220;
  });

  readonly cauldronFluidGradient = computed(() => {
    const e = this.exp();
    if (e.voidSpore > 0 && e.phoenixAsh > 0) {
      return 'radial-gradient(circle, #f59e0b 0%, #7e22ce 100%)';
    }
    if (e.voidSpore > 0) return 'radial-gradient(circle, #9333ea 0%, #3b0764 100%)';
    if (e.phoenixAsh > 0) return 'radial-gradient(circle, #f43f5e 0%, #991b1b 100%)';
    if (e.astralDew > 0) return 'radial-gradient(circle, #38bdf8 0%, #0369a1 100%)';
    if (e.essences > 0) return 'radial-gradient(circle, #c084fc 0%, #6b21a8 100%)';
    if (e.crystals > 0) return 'radial-gradient(circle, #60a5fa 0%, #1e40af 100%)';
    return 'radial-gradient(circle, #34d399 0%, #065f46 100%)';
  });

  readonly cauldronStateLabel = computed(() => {
    const e = this.exp();
    if (e.voidSpore > 0 && e.phoenixAsh > 0) return 'Énergie Primordiale Titanesque';
    if (e.voidSpore > 0) return 'Vapeurs Ténébreuses du Néant';
    if (e.phoenixAsh > 0) return 'Flammes Éternelles du Phénix';
    if (e.astralDew > 0) return 'Condensation Astrale Pure';
    if (e.essences > 0) return 'Résonance Runique Arcanique';
    return 'Infusion Végétale & Cristalline';
  });

  readonly transmutations: TransmutationFormula[] = [
    {
      id: 't_herbs_to_dew',
      name: 'Distillation de Rosée Astrale',
      desc: 'Condense l\'essence végétale d\'arène pour en extraire des gouttes pures de rosée astrale.',
      fromName: 'Herbes Sauvages',
      toName: 'Rosée Astrale',
      fromKey: 'herbs',
      toKey: 'astralDew',
      fromCost: 8,
      toGain: 1,
      icon: 'water_drop',
      badge: 'Rare',
      color: '#38bdf8',
    },
    {
      id: 't_crystal_to_essence',
      name: 'Raffinement d\'Essence Runique',
      desc: 'Broie 4 cristaux de mana pur dans l\'athanor pour concentrer 1 essence runique.',
      fromName: 'Cristaux de Mana',
      toName: 'Essence Runique',
      fromKey: 'crystals',
      toKey: 'essences',
      fromCost: 4,
      toGain: 1,
      icon: 'grain',
      badge: 'Épique',
      color: '#c084fc',
    },
    {
      id: 't_essence_to_ash',
      name: 'Incinération Sacrée du Phénix',
      desc: 'Immole 5 essences runiques dans le brasier incandescent pour récolter une cendre de phénix.',
      fromName: 'Essences Runiques',
      toName: 'Cendre de Phénix',
      fromKey: 'essences',
      toKey: 'phoenixAsh',
      fromCost: 5,
      toGain: 1,
      icon: 'local_fire_department',
      badge: 'Légendaire',
      color: '#f43f5e',
    },
    {
      id: 't_ash_to_void',
      name: 'Condensation Abyssale du Néant',
      desc: 'Transmute 3 cendres de phénix à travers une faille ténébreuse pour synthétiser 1 spore abyssale.',
      fromName: 'Cendres de Phénix',
      toName: 'Spore du Néant',
      fromKey: 'phoenixAsh',
      toKey: 'voidSpore',
      fromCost: 3,
      toGain: 1,
      icon: 'coronavirus',
      badge: 'Mythique',
      color: '#a855f7',
    },
  ];

  setTab(tab: AlchemyTab) {
    this.activeTab.set(tab);
    this.sound.playClick();
  }

  setFilterRarity(rarity: string) {
    this.filterRarity.set(rarity);
    this.sound.playClick();
  }

  getCraftQuantity(potionId: string): number {
    return this.craftQuantities()[potionId] || 1;
  }

  incrementCraftQuantity(potionId: string) {
    this.craftQuantities.update(q => ({
      ...q,
      [potionId]: (q[potionId] || 1) + 1,
    }));
    this.sound.playClick();
  }

  decrementCraftQuantity(potionId: string) {
    this.craftQuantities.update(q => ({
      ...q,
      [potionId]: Math.max(1, (q[potionId] || 1) - 1),
    }));
    this.sound.playClick();
  }

  setMaxCraftQuantity(potionId: string, recipe: PotionRecipe) {
    const max = Math.max(1, this.calculateMaxCraft(recipe));
    this.craftQuantities.update(q => ({
      ...q,
      [potionId]: max,
    }));
    this.sound.playClick();
  }

  calculateMaxCraft(recipe: PotionRecipe): number {
    const r = this.res();
    const limits: number[] = [];
    if (recipe.herb > 0) limits.push(Math.floor(r.herbs / recipe.herb));
    if (recipe.crystal > 0) limits.push(Math.floor(r.crystals / recipe.crystal));
    if (recipe.essence > 0) limits.push(Math.floor(r.essences / recipe.essence));
    if (recipe.astralDew && recipe.astralDew > 0) limits.push(Math.floor(r.astralDew / recipe.astralDew));
    if (recipe.phoenixAsh && recipe.phoenixAsh > 0) limits.push(Math.floor(r.phoenixAsh / recipe.phoenixAsh));
    if (recipe.voidSpore && recipe.voidSpore > 0) limits.push(Math.floor(r.voidSpore / recipe.voidSpore));
    return limits.length > 0 ? Math.min(...limits) : 0;
  }

  canCraftQuantity(recipe: PotionRecipe, qty: number): boolean {
    return this.gameState.canBrewPotion(recipe, qty);
  }

  brew(potionId: string) {
    const qty = this.getCraftQuantity(potionId);
    this.sound.playCauldronBubbling();
    this.gameState.brewPotion(potionId, qty);
  }

  usePotion(potion: Potion) {
    this.gameState.consumePotion(potion.id);
  }

  triggerCauldronSound() {
    this.sound.playCauldronBubbling();
  }

  // Free Experiment Methods
  alterExperiment(key: keyof AlchemyResources, delta: number) {
    this.exp.update(e => {
      const current = e[key];
      const maxAvailable = this.res()[key];
      const next = Math.max(0, Math.min(maxAvailable, current + delta));
      return { ...e, [key]: next };
    });
    this.sound.playClick();
  }

  resetExperiment() {
    this.exp.set({
      herbs: 0,
      crystals: 0,
      essences: 0,
      astralDew: 0,
      phoenixAsh: 0,
      voidSpore: 0,
    });
    this.sound.playClick();
  }

  triggerCustomSynthesis() {
    this.sound.playCauldronBubbling();
    const result = this.gameState.synthesizeCustomExperiment(this.exp());
    if (result.success) {
      this.resetExperiment();
    }
  }

  transmute(formula: TransmutationFormula) {
    this.gameState.transmuteResource(formula.fromKey, formula.toKey, formula.fromCost, formula.toGain);
  }

  setSkinRarityFilter(rarity: 'all' | CardRarity) {
    this.skinRarityFilter.set(rarity);
    this.sound.playClick();
  }

  setSkinOwnershipFilter(ownership: SkinOwnershipFilter) {
    this.skinOwnershipFilter.set(ownership);
    this.sound.playClick();
  }

  onSkinSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.skinSearchQuery.set(input.value);
  }

  equipHeroSkin(heroId: Hero['id'], skinId: string) {
    this.gameState.equipSkin(heroId, skinId);
  }

  unlockHeroSkin(heroId: Hero['id'], skinId: string, currency: 'gold' | 'gems') {
    this.gameState.purchaseSkinWithCurrency(heroId, skinId, currency);
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

  getSkinRarityCardClass(rarity: CardRarity): string {
    return `skin-rarity-${rarity}`;
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

  getSkinRarityAccentHex(rarity: CardRarity): string {
    switch (rarity) {
      case 'common':
        return '#a8a29e';
      case 'rare':
        return '#38bdf8';
      case 'epic':
        return '#c084fc';
      case 'legendary':
        return '#fbbf24';
      case 'mythic':
        return '#fb7185';
    }
  }
}
