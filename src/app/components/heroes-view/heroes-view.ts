import { ChangeDetectionStrategy, Component, inject, computed, signal } from '@angular/core';
import { GameStateService } from '../../services/game-state';
import { SoundService } from '../../services/sound';
import { CardRarity, Hero, HeroSkin, SkillNode, SkillBranch } from '../../models/game.model';
import { MatIconModule } from '@angular/material/icon';
import { GrowingSkillTreePanel } from '../skill-tree-view/growing-skill-tree';

@Component({
  selector: 'app-heroes-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, GrowingSkillTreePanel],
  template: `
    @let hero = gameState.selectedHero();
    @let heroTalents = classTalents();
    @let equippedSkin = gameState.getHeroActiveSkin(hero);
    @let displaySkin = activeDisplaySkin();

    <div class="max-w-7xl mx-auto p-4 md:p-6 space-y-6">

      <!-- Class Selector Header -->
      <div class="bg-[#120f0c] border border-[#3a2f23] rounded-2xl p-4 md:p-5 shadow-xl">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h1 class="font-cinzel-dec text-2xl md:text-3xl font-black text-[#c5a880] flex items-center gap-2.5">
              <mat-icon class="text-[#d4af37] text-3xl">shield_moon</mat-icon>
              <span>Ordre des 20 Héros &amp; Customisation</span>
            </h1>
            <p class="text-[#8b6b43] text-xs font-serif mt-0.5">
              Explorez les 20 héros légendaires, personnalisez leur apparence grâce à la garde-robe de skins et développez leur double arbre de talents.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-3 bg-[#1a1612] px-4 py-2 rounded-xl border border-[#3a2f23] self-start sm:self-auto text-xs font-mono tabular-nums">
            <span class="text-[#d4af37] font-bold">
              {{ gameState.unlockedSkinsCount() }}/{{ gameState.totalSkinsCount() }} Skins
            </span>
            <span class="text-[#3a2f23]" aria-hidden="true">·</span>
            <span class="text-[#4d94ff] font-bold">
              ⬥ {{ gameState.shards() }} Éclats
            </span>
          </div>
        </div>

        <!-- Archetype & Search Filter for 20 Heroes -->
        <div class="flex flex-wrap items-center justify-between gap-3 mb-3 pt-2 border-t border-[#3a2f23]/60">
          <div class="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              type="button"
              (click)="heroCategoryFilter.set('all')"
              class="px-3 py-1.5 rounded-lg font-cinzel font-semibold transition-all border text-xs cursor-pointer whitespace-nowrap shrink-0"
              [class.bg-[#8b2b2b]]="heroCategoryFilter() === 'all'"
              [class.text-white]="heroCategoryFilter() === 'all'"
              [class.border-[#ff4d4d]]="heroCategoryFilter() === 'all'"
              [class.bg-[#1a1612]]="heroCategoryFilter() !== 'all'"
              [class.text-[#8b6b43]]="heroCategoryFilter() !== 'all'"
              [class.border-[#3a2f23]]="heroCategoryFilter() !== 'all'">
              Tous ({{ gameState.heroes().length }})
            </button>
            <button
              type="button"
              (click)="heroCategoryFilter.set('unlocked')"
              class="px-3 py-1.5 rounded-lg font-cinzel font-semibold transition-all border text-xs flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
              [class.bg-[#8b2b2b]]="heroCategoryFilter() === 'unlocked'"
              [class.text-white]="heroCategoryFilter() === 'unlocked'"
              [class.border-[#ff4d4d]]="heroCategoryFilter() === 'unlocked'"
              [class.bg-[#1a1612]]="heroCategoryFilter() !== 'unlocked'"
              [class.text-[#d4af37]]="heroCategoryFilter() !== 'unlocked'"
              [class.border-[#3a2f23]]="heroCategoryFilter() !== 'unlocked'">
              <mat-icon class="text-xs">lock_open</mat-icon>
              <span>Débloqués</span>
            </button>
            <button
              type="button"
              (click)="heroCategoryFilter.set('locked')"
              class="px-3 py-1.5 rounded-lg font-cinzel font-semibold transition-all border text-xs flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
              [class.bg-[#8b2b2b]]="heroCategoryFilter() === 'locked'"
              [class.text-white]="heroCategoryFilter() === 'locked'"
              [class.border-[#ff4d4d]]="heroCategoryFilter() === 'locked'"
              [class.bg-[#1a1612]]="heroCategoryFilter() !== 'locked'"
              [class.text-[#6b5a45]]="heroCategoryFilter() !== 'locked'"
              [class.border-[#3a2f23]]="heroCategoryFilter() !== 'locked'">
              <mat-icon class="text-xs">lock</mat-icon>
              <span>À débloquer</span>
            </button>
          </div>

          <div class="relative min-w-[210px]">
            <input
              #heroSearchEl
              type="text"
              [value]="heroSearchQuery()"
              (input)="heroSearchQuery.set(heroSearchEl.value)"
              placeholder="Chercher un héros (nom, classe)..."
              aria-label="Chercher un héros"
              class="w-full bg-[#1a1612] border border-[#3a2f23] rounded-lg px-3 py-1.5 pr-8 text-xs text-[#e0dcc7] placeholder-[#6b5a45] focus:outline-none focus:border-[#8b6b43]" />
            <mat-icon class="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6b5a45] text-xs pointer-events-none">search</mat-icon>
          </div>
        </div>

        <!-- 20 Hero Class Switcher Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
          @for (h of displayedHeroes(); track h.id) {
            @let hSkin = gameState.getHeroActiveSkin(h);
            @let unlockedCount = getHeroUnlockedSkinCount(h);
            <button
              type="button"
              (click)="selectHeroForCustomization(h.id)"
              class="medieval-btn flex items-center gap-2.5 p-2 rounded-xl border transition-all text-left relative overflow-hidden group cursor-pointer"
              [class.bg-[#1a1612]]="gameState.selectedHeroClass() === h.id"
              [class.border-[#d4af37]]="gameState.selectedHeroClass() === h.id"
              [class.text-[#d4af37]]="gameState.selectedHeroClass() === h.id"
              [class.bg-[#0d0b09]]="gameState.selectedHeroClass() !== h.id"
              [class.border-[#3a2f23]]="gameState.selectedHeroClass() !== h.id"
              [class.text-[#6b5a45]]="gameState.selectedHeroClass() !== h.id">

              <div
                class="w-10 h-10 rounded-lg bg-[#120f0c] border flex items-center justify-center shrink-0 overflow-hidden relative transition-colors"
                [style.borderColor]="hSkin.accentHex || '#3a2f23'">
                @if (hSkin.imageUrl || h.imageUrl) {
                  <img
                    [src]="hSkin.imageUrl || h.imageUrl"
                    [alt]="h.name"
                    [style.filter]="hSkin.portraitFilter || 'none'"
                    class="w-full h-full object-cover"
                    referrerpolicy="no-referrer" />
                  <div class="absolute inset-0 bg-gradient-to-t pointer-events-none" [class]="hSkin.themeGradient || ''"></div>
                } @else {
                  <mat-icon class="text-base text-[#c5a880]">{{ hSkin.avatarIcon || h.avatarIcon }}</mat-icon>
                }
              </div>

              <div class="truncate flex-1 min-w-0">
                <div class="font-cinzel font-bold text-[11px] truncate leading-tight text-[#e0dcc7]">{{ h.name }}</div>
                <div class="text-[10px] font-mono tabular-nums text-[#8b6b43] flex items-center gap-1 truncate mt-0.5">
                  @if (!h.isUnlocked) {
                    <span class="text-[#ff4d4d] font-bold">Verrouillé</span>
                  } @else {
                    <span class="text-[#d4af37]">Niv. {{ h.level }}</span>
                    <span aria-hidden="true">·</span>
                    <span>{{ unlockedCount }}/{{ h.skins.length }} skins</span>
                  }
                </div>
              </div>
            </button>
          }
        </div>
      </div>

      <!-- Main Dual Column: Hero Overview, Stats & Skin Studio (Left) / Dual-Branch Dynamic Talent Tree (Right) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">

        <!-- Left Column: Hero Archetype, Base Stats & Wardrobe Customization Studio (5 cols) -->
        <div class="lg:col-span-5 space-y-6">

          <!-- Hero Banner Card -->
          <div class="bg-[#120f0c] border border-[#3a2f23] rounded-2xl p-5 md:p-6 shadow-2xl relative overflow-hidden space-y-5">

            @if (!hero.isUnlocked) {
              <!-- Locked Hero Overlay Banner -->
              <div class="p-3.5 bg-[#261010] border border-[#ff4d4d]/40 rounded-xl text-center space-y-2">
                <div class="flex items-center justify-center gap-1.5 text-xs font-cinzel font-bold text-[#ff4d4d]">
                  <mat-icon class="text-sm">lock</mat-icon>
                  <span>Champion Non Débloqué</span>
                </div>
                <p class="text-[11px] text-[#e0dcc7]/80">Débloquez ce héros pour participer aux duels classés et maîtriser son arbre de compétences.</p>
                <div class="flex items-center justify-center gap-2 pt-1">
                  @if (hero.goldUnlockCost) {
                    <button
                      type="button"
                      (click)="unlockWithCurrency('gold')"
                      [disabled]="gameState.gold() < hero.goldUnlockCost"
                      class="medieval-btn px-3 py-1.5 bg-[#1a1612] text-[#d4af37] text-xs font-cinzel font-bold rounded-lg border border-[#8b6b43] cursor-pointer whitespace-nowrap shrink-0">
                      {{ hero.goldUnlockCost }} Or
                    </button>
                  }
                  @if (hero.gemUnlockCost) {
                    <button
                      type="button"
                      (click)="unlockWithCurrency('gems')"
                      [disabled]="gameState.gems() < hero.gemUnlockCost"
                      class="crimson-btn px-3 py-1.5 text-white text-xs font-cinzel font-bold rounded-lg border border-[#ff4d4d] cursor-pointer whitespace-nowrap shrink-0">
                      {{ hero.gemUnlockCost }} Gemmes
                    </button>
                  }
                </div>
              </div>
            }

            <!-- Live Skin Preview Indicator Bar if previewing an unequipped skin -->
            @if (previewSkinId() && previewSkinId() !== equippedSkin.id) {
              <div class="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#1f1810] border border-[#d4af37]/70 text-xs">
                <div class="flex items-center gap-2 min-w-0">
                  <mat-icon class="text-sm text-[#d4af37] shrink-0">visibility</mat-icon>
                  <span class="font-cinzel font-bold text-[#ffd700] truncate">
                    Aperçu : {{ displaySkin.name }}
                  </span>
                </div>
                <button
                  type="button"
                  (click)="clearPreview()"
                  class="text-[11px] font-cinzel font-bold text-[#c5a880] hover:text-white underline cursor-pointer whitespace-nowrap shrink-0">
                  Revenir à l’équipé
                </button>
              </div>
            }

            <div class="flex items-center gap-4">
              <div class="relative shrink-0">
                <div
                  class="w-28 h-28 rounded-2xl bg-[#0d0b09] border-2 flex items-center justify-center overflow-hidden shadow-xl relative transition-all duration-300"
                  [style.borderColor]="displaySkin.accentHex || '#d4af37'"
                  [style.boxShadow]="'0 0 22px ' + (displaySkin.accentHex || '#d4af37') + '35'">
                  @if (displaySkin.imageUrl || hero.imageUrl) {
                    <img
                      [src]="displaySkin.imageUrl || hero.imageUrl"
                      [alt]="hero.name + ' - ' + displaySkin.name"
                      [style.filter]="displaySkin.portraitFilter || 'none'"
                      class="w-full h-full object-cover transition-all duration-300"
                      referrerpolicy="no-referrer" />
                    <div
                      class="absolute inset-0 bg-gradient-to-t pointer-events-none"
                      [class]="displaySkin.themeGradient || ''"></div>
                  } @else {
                    <mat-icon class="text-5xl text-[#c5a880]">{{ displaySkin.avatarIcon || hero.avatarIcon }}</mat-icon>
                  }
                </div>
                <div class="mt-2 text-center font-mono tabular-nums text-[10px] font-bold text-[#c5a880]">
                  Niv. {{ hero.level }}
                </div>
              </div>

              <div class="min-w-0 flex-1 space-y-1">
                <h2 class="font-cinzel text-xl md:text-2xl font-black text-[#e0dcc7] leading-tight">{{ hero.name }}</h2>
                <div class="text-xs text-[#d4af37] font-medium">{{ hero.title }}</div>
                <div class="text-[11px] text-[#8b6b43]">{{ hero.archetype }}</div>

                <div class="text-[11px] font-cinzel pt-1 text-[#c5a880]">
                  <span>Apparence : </span>
                  <strong [style.color]="displaySkin.accentHex || '#d4af37'">{{ displaySkin.name }}</strong>
                </div>

                <!-- XP Bar -->
                <div class="pt-1 space-y-1">
                  <div class="w-full max-w-[200px] bg-[#0d0b09] rounded-full h-2 border border-[#3a2f23] overflow-hidden">
                    <div
                      class="bg-gradient-to-r from-[#8b6b43] to-[#d4af37] h-full transition-all duration-500"
                      [style.width.%]="(hero.xp / hero.xpRequired) * 100"></div>
                  </div>
                  <div class="text-[10px] text-[#6b5a45] font-mono tabular-nums">{{ hero.xp }} / {{ hero.xpRequired }} XP</div>
                </div>
              </div>
            </div>

            <!-- Playstyle Overview -->
            <div class="p-3 bg-[#0d0b09] border border-[#3a2f23] rounded-xl text-xs text-[#8b6b43] leading-relaxed">
              <span class="text-[#c5a880] font-cinzel font-bold">Style de Jeu :</span> {{ hero.playstyleOverview }}
            </div>

            <!-- Core Base Stats Grid (HP, Defense, Attack, Energy) -->
            <div class="grid grid-cols-4 gap-2 pt-1 font-mono tabular-nums">
              <div class="p-2 bg-[#1a1612] border border-[#3a2f23] rounded-xl text-center">
                <div class="text-[9px] uppercase tracking-wider text-[#6b5a45]">Vie</div>
                <div class="text-sm font-bold text-[#4dff88] mt-0.5">{{ hero.baseHp }} PV</div>
              </div>
              <div class="p-2 bg-[#1a1612] border border-[#3a2f23] rounded-xl text-center">
                <div class="text-[9px] uppercase tracking-wider text-[#6b5a45]">Armure</div>
                <div class="text-sm font-bold text-[#eab308] mt-0.5">{{ hero.baseArmor }} ARM</div>
              </div>
              <div class="p-2 bg-[#1a1612] border border-[#3a2f23] rounded-xl text-center">
                <div class="text-[9px] uppercase tracking-wider text-[#6b5a45]">Attaque</div>
                <div class="text-sm font-bold text-[#ff4d4d] mt-0.5">{{ hero.baseAttack }} ATQ</div>
              </div>
              <div class="p-2 bg-[#1a1612] border border-[#3a2f23] rounded-xl text-center">
                <div class="text-[9px] uppercase tracking-wider text-[#6b5a45]">Énergie</div>
                <div class="text-sm font-bold text-[#4d94ff] mt-0.5">+{{ hero.energyPerTurn }}/t</div>
              </div>
            </div>

            <!-- Passive & Ultimate details -->
            <div class="space-y-3 pt-1">
              <div class="bg-[#1a1612] p-3 rounded-xl border border-[#3a2f23]">
                <div class="flex items-center gap-1.5 text-xs font-cinzel text-[#d4af37] font-bold mb-1">
                  <mat-icon class="text-sm">{{ hero.passiveIcon || 'auto_awesome' }}</mat-icon>
                  <span>Capacité Spéciale : {{ hero.passiveName }}</span>
                </div>
                <p class="text-[#e0dcc7]/90 text-xs leading-relaxed">{{ hero.passiveDesc }}</p>
              </div>

              <div class="bg-[#1a1612] p-3 rounded-xl border border-[#3a2f23]">
                <div class="flex items-center justify-between text-xs font-cinzel text-[#d4af37] font-bold mb-1">
                  <div class="flex items-center gap-1.5">
                    <mat-icon class="text-sm">{{ hero.ultimateIcon }}</mat-icon>
                    <span>Ultime : {{ hero.ultimateName }}</span>
                  </div>
                  <span class="font-mono tabular-nums text-[11px] text-[#ff7b7b]">
                    Coût : {{ hero.ultimateCost }} Énergie
                  </span>
                </div>
                <p class="text-[#e0dcc7]/90 text-xs leading-relaxed">{{ hero.ultimateDesc }}</p>
              </div>
            </div>

            <!-- HERO SKINS CUSTOMIZATION STUDIO -->
            <div class="pt-4 border-t border-[#3a2f23] space-y-3">
              <div class="flex items-center justify-between gap-2">
                <h3 class="font-cinzel text-sm font-bold text-[#c5a880] flex items-center gap-1.5">
                  <mat-icon class="text-base text-[#d4af37]">checkroom</mat-icon>
                  <span>Garde-Robe &amp; Skins du Héros</span>
                </h3>
                <span class="text-[11px] font-mono tabular-nums text-[#8b6b43]">
                  {{ getHeroUnlockedSkinCount(hero) }} / {{ hero.skins.length }} débloqués
                </span>
              </div>

              <div class="space-y-3">
                @for (skin of hero.skins; track skin.id) {
                  @let isEquipped = hero.activeSkinId === skin.id;
                  @let isPreviewed = displaySkin.id === skin.id;

                  <div
                    class="skin-rarity-card rounded-xl border p-3.5 space-y-3"
                    [class]="getSkinRarityCardClass(skin.rarity)"
                    [class.ring-2]="isEquipped"
                    [class.ring-[#d4af37]/70]="isEquipped"
                    [class.ring-1]="!isEquipped && isPreviewed"
                    [class.ring-[#8b6b43]]="!isEquipped && isPreviewed">

                    <!-- CSS Particle Layer by Rarity -->
                    <div class="skin-particles" aria-hidden="true">
                      @switch (skin.rarity) {
                        @case ('common') {
                          <span class="skin-particle" style="left: 18%; --p-dur: 5.5s; --p-delay: 0s; --px-drift: 6px; --py-rise: -75px;"></span>
                          <span class="skin-particle" style="left: 78%; --p-dur: 6.2s; --p-delay: 2.1s; --px-drift: -6px; --py-rise: -70px;"></span>
                        }
                        @case ('rare') {
                          <span class="skin-particle" style="left: 14%; --p-dur: 4.4s; --p-delay: 0s; --px-drift: 8px; --py-rise: -115px;"></span>
                          <span class="skin-particle" style="left: 42%; --p-dur: 3.8s; --p-delay: 1.1s; --px-drift: -10px; --py-rise: -125px;"></span>
                          <span class="skin-particle" style="left: 76%; --p-dur: 4.5s; --p-delay: 0.6s; --px-drift: 10px; --py-rise: -120px;"></span>
                        }
                        @case ('epic') {
                          <span class="skin-particle" style="left: 12%; --p-dur: 4.0s; --p-delay: 0s; --px-drift: 14px; --py-rise: -135px;"></span>
                          <span class="skin-particle" style="left: 35%; --p-dur: 3.4s; --p-delay: 0.8s; --px-drift: -12px; --py-rise: -145px;"></span>
                          <span class="skin-particle" style="left: 62%; --p-dur: 4.1s; --p-delay: 1.5s; --px-drift: 10px; --py-rise: -135px;"></span>
                          <span class="skin-particle" style="left: 85%; --p-dur: 3.7s; --p-delay: 0.4s; --px-drift: -12px; --py-rise: -140px;"></span>
                        }
                        @case ('legendary') {
                          <span class="skin-particle" style="left: 10%; --p-dur: 3.4s; --p-delay: 0s; --px-drift: 14px; --py-rise: -150px;"></span>
                          <span class="skin-particle" style="left: 27%; --p-dur: 2.9s; --p-delay: 0.7s; --px-drift: -12px; --py-rise: -160px;"></span>
                          <span class="skin-particle" style="left: 47%; --p-dur: 3.5s; --p-delay: 1.4s; --px-drift: 14px; --py-rise: -150px;"></span>
                          <span class="skin-particle" style="left: 67%; --p-dur: 3.1s; --p-delay: 0.3s; --px-drift: -14px; --py-rise: -165px;"></span>
                          <span class="skin-particle" style="left: 88%; --p-dur: 3.6s; --p-delay: 1.1s; --px-drift: -10px; --py-rise: -155px;"></span>
                          <span class="skin-particle-star" style="top: 16%; right: 12%; --p-dur: 2.4s; --p-delay: 0.2s;"></span>
                          <span class="skin-particle-star" style="top: 48%; left: 10%; --p-dur: 2.8s; --p-delay: 1.0s;"></span>
                        }
                        @case ('mythic') {
                          <span class="skin-particle" style="left: 9%; --p-dur: 3.1s; --p-delay: 0s; --px-drift: 16px; --py-rise: -160px;"></span>
                          <span class="skin-particle" style="left: 25%; --p-dur: 2.7s; --p-delay: 0.5s; --px-drift: -14px; --py-rise: -170px;"></span>
                          <span class="skin-particle" style="left: 45%; --p-dur: 3.3s; --p-delay: 1.2s; --px-drift: 14px; --py-rise: -160px;"></span>
                          <span class="skin-particle" style="left: 64%; --p-dur: 2.8s; --p-delay: 0.2s; --px-drift: -16px; --py-rise: -175px;"></span>
                          <span class="skin-particle" style="left: 81%; --p-dur: 3.4s; --p-delay: 1.5s; --px-drift: 10px; --py-rise: -160px;"></span>
                          <span class="skin-particle" style="left: 92%; --p-dur: 2.6s; --p-delay: 1.9s; --px-drift: -14px; --py-rise: -165px;"></span>
                          <span class="skin-particle-star" style="top: 14%; right: 12%; --p-dur: 2.1s; --p-delay: 0s;"></span>
                          <span class="skin-particle-star" style="top: 44%; left: 9%; --p-dur: 2.6s; --p-delay: 0.9s;"></span>
                        }
                      }
                    </div>

                    <div class="skin-card-content flex items-start gap-3">
                      <!-- Skin Thumbnail with live chroma/aura preview -->
                      <div
                        class="w-16 h-16 rounded-xl bg-[#120f0c] border-2 overflow-hidden flex items-center justify-center shrink-0 relative shadow-inner"
                        [style.borderColor]="skin.accentHex || '#8b6b43'">
                        @if (skin.imageUrl || hero.imageUrl) {
                          <img
                            [src]="skin.imageUrl || hero.imageUrl"
                            [alt]="skin.name"
                            [style.filter]="skin.portraitFilter || 'none'"
                            class="w-full h-full object-cover"
                            referrerpolicy="no-referrer" />
                          <div
                            class="absolute inset-0 bg-gradient-to-t pointer-events-none"
                            [class]="skin.themeGradient || ''"></div>
                        } @else {
                          <mat-icon class="text-3xl text-[#c5a880]">{{ skin.avatarIcon }}</mat-icon>
                        }
                      </div>

                      <!-- Skin Info (Clean unboxed metadata with middle dot separators) -->
                      <div class="min-w-0 flex-1 space-y-1">
                        <div class="text-[11px] font-cinzel font-semibold text-[#8b6b43]">
                          <span [class]="getRarityColorClass(skin.rarity)">{{ getRarityLabel(skin.rarity) }}</span>
                          <span aria-hidden="true"> · </span>
                          <span>{{ skin.badge }}</span>
                          @if (skin.visualEffectLabel) {
                            <span aria-hidden="true"> · </span>
                            <span class="text-[#c5a880]">{{ skin.visualEffectLabel }}</span>
                          }
                        </div>

                        <div class="flex items-center justify-between gap-2">
                          <h4 class="font-cinzel text-sm font-bold text-[#e0dcc7] truncate">
                            {{ skin.name }}
                          </h4>
                          @if (isEquipped) {
                            <span class="inline-flex items-center gap-1 text-[11px] font-cinzel font-bold text-[#4dff88] whitespace-nowrap shrink-0">
                              <mat-icon class="text-sm">check_circle</mat-icon>
                              <span>Équipé</span>
                            </span>
                          }
                        </div>

                        <p class="text-[11px] font-serif text-[#8b6b43] leading-snug">
                          {{ skin.description || 'Apparence personnalisée de ' + hero.name + '.' }}
                        </p>
                      </div>
                    </div>

                    <!-- Skin Action Controls -->
                    <div class="skin-card-content flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
                      <button
                        type="button"
                        (click)="previewSkin(skin)"
                        class="px-2.5 py-1 rounded-lg border text-[11px] font-cinzel font-bold flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap shrink-0"
                        [class.bg-[#2a2117]]="isPreviewed"
                        [class.text-[#d4af37]]="isPreviewed"
                        [class.border-[#d4af37]/70]="isPreviewed"
                        [class.bg-[#120f0c]]="!isPreviewed"
                        [class.text-[#c5a880]]="!isPreviewed"
                        [class.border-[#3a2f23]]="!isPreviewed"
                        [class.hover:border-[#8b6b43]]="!isPreviewed">
                        <mat-icon class="text-xs">visibility</mat-icon>
                        <span>{{ isPreviewed ? 'Aperçu actif' : 'Aperçu' }}</span>
                      </button>

                      <div class="flex flex-wrap items-center gap-2">
                        @if (skin.isUnlocked) {
                          @if (isEquipped) {
                            <span class="text-[11px] font-cinzel font-semibold text-[#4dff88]">
                              Apparence active en combat
                            </span>
                          } @else {
                            <button
                              type="button"
                              (click)="equipSkin(hero.id, skin.id)"
                              class="medieval-btn px-3.5 py-1.5 rounded-lg bg-[#2a2117] hover:bg-[#382b1d] border border-[#d4af37] text-[#ffd700] font-cinzel font-bold text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0">
                              <mat-icon class="text-sm">checkroom</mat-icon>
                              <span>Équiper</span>
                            </button>
                          }
                        } @else {
                          @if (skin.goldPrice) {
                            <button
                              type="button"
                              (click)="unlockSkinWithCurrency(hero.id, skin.id, 'gold')"
                              [disabled]="gameState.gold() < skin.goldPrice"
                              class="medieval-btn px-3 py-1.5 rounded-lg bg-[#1a1612] hover:bg-[#2a2117] border border-[#d4af37]/70 font-mono tabular-nums font-bold text-xs flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                              [class.opacity-45]="gameState.gold() < skin.goldPrice">
                              <span class="currency-gold-coin">✦</span>
                              <span class="currency-gold-shine font-extrabold">{{ skin.goldPrice }} Or</span>
                            </button>
                          }
                          @if (skin.gemPrice) {
                            <button
                              type="button"
                              (click)="unlockSkinWithCurrency(hero.id, skin.id, 'gems')"
                              [disabled]="gameState.gems() < skin.gemPrice"
                              class="crimson-btn px-3 py-1.5 rounded-lg font-mono tabular-nums font-bold text-xs border border-[#ff4d4d] flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                              [class.opacity-45]="gameState.gems() < skin.gemPrice">
                              <span class="currency-gem-facet">⬥</span>
                              <span class="currency-gem-shine font-extrabold">{{ skin.gemPrice }} Gemmes</span>
                            </button>
                          }
                        }
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>

          </div>
        </div>

        <!-- Right Column: Interactive Growing Skill Tree + Detailed Branch List (7 cols) -->
        <div class="lg:col-span-7 space-y-5">
          <app-growing-skill-tree />

          <div class="bg-[#120f0c] border border-[#3a2f23] rounded-2xl p-6 shadow-xl space-y-6">

            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#3a2f23]">
              <div>
                <h3 class="font-cinzel text-base font-bold text-[#c5a880] flex items-center gap-2">
                  <mat-icon class="text-[#d4af37]">account_tree</mat-icon>
                  <span>Arbre de Compétences &amp; Spécialisations Dynamiques</span>
                </h3>
                <p class="text-xs text-[#6b5a45]">Personnalisez votre classe avec deux branches de maîtrise complémentaires.</p>
              </div>

              <div class="font-mono tabular-nums text-xs text-[#d4af37] bg-[#1a1612] px-3 py-1.5 rounded-lg border border-[#3a2f23] whitespace-nowrap shrink-0">
                Talents Débloqués : {{ hero.unlockedTalentIds.length }} / {{ heroTalents.length }}
              </div>
            </div>

            <!-- Branch Selector Tabs -->
            <div class="flex flex-wrap items-center gap-2">
              <button
                type="button"
                (click)="selectedBranchFilter.set('all')"
                class="medieval-btn px-3 py-1.5 rounded-lg border text-xs font-cinzel transition-all cursor-pointer whitespace-nowrap shrink-0"
                [class.bg-[#1a1612]]="selectedBranchFilter() === 'all'"
                [class.border-[#d4af37]]="selectedBranchFilter() === 'all'"
                [class.text-[#d4af37]]="selectedBranchFilter() === 'all'"
                [class.bg-[#0d0b09]]="selectedBranchFilter() !== 'all'"
                [class.border-[#3a2f23]]="selectedBranchFilter() !== 'all'"
                [class.text-[#8b6b43]]="selectedBranchFilter() !== 'all'">
                Toutes les Voies
              </button>
              <button
                type="button"
                (click)="selectedBranchFilter.set('branch_a')"
                class="medieval-btn px-3 py-1.5 rounded-lg border text-xs font-cinzel transition-all cursor-pointer whitespace-nowrap shrink-0"
                [class.bg-[#1a1612]]="selectedBranchFilter() === 'branch_a'"
                [class.border-[#d4af37]]="selectedBranchFilter() === 'branch_a'"
                [class.text-[#d4af37]]="selectedBranchFilter() === 'branch_a'"
                [class.bg-[#0d0b09]]="selectedBranchFilter() !== 'branch_a'"
                [class.border-[#3a2f23]]="selectedBranchFilter() !== 'branch_a'"
                [class.text-[#8b6b43]]="selectedBranchFilter() !== 'branch_a'">
                Branche A : {{ branchAName() }}
              </button>
              <button
                type="button"
                (click)="selectedBranchFilter.set('branch_b')"
                class="medieval-btn px-3 py-1.5 rounded-lg border text-xs font-cinzel transition-all cursor-pointer whitespace-nowrap shrink-0"
                [class.bg-[#1a1612]]="selectedBranchFilter() === 'branch_b'"
                [class.border-[#d4af37]]="selectedBranchFilter() === 'branch_b'"
                [class.text-[#d4af37]]="selectedBranchFilter() === 'branch_b'"
                [class.bg-[#0d0b09]]="selectedBranchFilter() !== 'branch_b'"
                [class.border-[#3a2f23]]="selectedBranchFilter() !== 'branch_b'"
                [class.text-[#8b6b43]]="selectedBranchFilter() !== 'branch_b'">
                Branche B : {{ branchBName() }}
              </button>
            </div>

            <!-- Dynamic Branching Tree Nodes by Tiers -->
            <div class="space-y-4 relative">
              @for (talent of filteredTalents(); track talent.id) {
                @let isUnlocked = hero.unlockedTalentIds.includes(talent.id);
                @let canUnlock = isTalentAvailable(talent);

                <div
                  class="medieval-btn p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  [class.bg-[#1a1612]]="isUnlocked"
                  [class.border-[#d4af37]]="isUnlocked"
                  [class.bg-[#120f0c]]="!isUnlocked && canUnlock"
                  [class.border-[#8b6b43]]="!isUnlocked && canUnlock"
                  [class.bg-[#0d0b09]]="!isUnlocked && !canUnlock"
                  [class.border-[#3a2f23]]="!isUnlocked && !canUnlock"
                  [class.opacity-50]="!isUnlocked && !canUnlock">

                  <div class="flex items-start sm:items-center gap-3.5">
                    <div
                      class="w-12 h-12 rounded-xl flex items-center justify-center border shrink-0"
                      [class.bg-[#8b2b2b]]="isUnlocked"
                      [class.border-[#ff4d4d]]="isUnlocked"
                      [class.text-white]="isUnlocked"
                      [class.bg-[#1a1612]]="!isUnlocked"
                      [class.border-[#3a2f23]]="!isUnlocked"
                      [class.text-[#c5a880]]="!isUnlocked">
                      <mat-icon class="text-2xl">{{ talent.icon }}</mat-icon>
                    </div>

                    <div>
                      <div class="flex flex-wrap items-center gap-2">
                        <span class="font-cinzel font-bold text-sm text-[#e0dcc7]">{{ talent.name }}</span>
                        <span class="text-[11px] font-mono text-[#8b6b43]">
                          · Tier {{ talent.tier }} · {{ talent.branchName }}
                        </span>
                      </div>
                      <p class="text-xs text-[#8b6b43] mt-0.5">{{ talent.description }}</p>
                    </div>
                  </div>

                  <!-- Action Button -->
                  <div class="self-end sm:self-auto shrink-0">
                    @if (isUnlocked) {
                      <div class="px-3 py-1.5 bg-[#0d2618] border border-emerald-500/60 text-emerald-400 text-xs font-cinzel font-bold rounded-lg flex items-center gap-1 whitespace-nowrap shrink-0">
                        <mat-icon class="text-xs">check</mat-icon>
                        <span>Maîtrisé</span>
                      </div>
                    } @else {
                      <button
                        type="button"
                        (click)="unlockTalent(talent)"
                        [disabled]="!canUnlock || gameState.shards() < talent.cost"
                        class="crimson-btn px-4 py-2 rounded-xl text-xs font-cinzel font-bold border transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                        [class.opacity-50]="!canUnlock || gameState.shards() < talent.cost">
                        <mat-icon class="text-xs">auto_fix_high</mat-icon>
                        <span>Débloquer ({{ talent.cost }} Éclats)</span>
                      </button>
                    }
                  </div>
                </div>
              }
            </div>

          </div>
        </div>

      </div>

    </div>
  `,
})
export class HeroesView {
  readonly gameState = inject(GameStateService);
  readonly sound = inject(SoundService);

  readonly selectedBranchFilter = signal<'all' | SkillBranch>('all');
  readonly heroCategoryFilter = signal<'all' | 'unlocked' | 'locked'>('all');
  readonly heroSearchQuery = signal<string>('');
  readonly previewSkinId = signal<string | null>(null);

  readonly activeDisplaySkin = computed<HeroSkin>(() => {
    const hero = this.gameState.selectedHero();
    const previewId = this.previewSkinId();
    if (previewId) {
      const found = hero.skins.find(s => s.id === previewId);
      if (found) return found;
    }
    return this.gameState.getHeroActiveSkin(hero);
  });

  readonly displayedHeroes = computed(() => {
    let list = this.gameState.heroes();
    const cat = this.heroCategoryFilter();
    const query = this.heroSearchQuery().toLowerCase().trim();

    if (cat === 'unlocked') {
      list = list.filter(h => h.isUnlocked);
    } else if (cat === 'locked') {
      list = list.filter(h => !h.isUnlocked);
    }

    if (query) {
      list = list.filter(h =>
        h.name.toLowerCase().includes(query) ||
        h.title.toLowerCase().includes(query) ||
        h.archetype.toLowerCase().includes(query) ||
        h.class.toLowerCase().includes(query)
      );
    }
    return list;
  });

  readonly classTalents = computed(() => {
    const curClass = this.gameState.selectedHeroClass();
    return this.gameState.skillTrees().filter(t => t.heroClass === curClass);
  });

  readonly branchAName = computed(() => {
    const firstA = this.classTalents().find(t => t.branch === 'branch_a');
    return firstA?.branchName || 'Branche A';
  });

  readonly branchBName = computed(() => {
    const firstB = this.classTalents().find(t => t.branch === 'branch_b');
    return firstB?.branchName || 'Branche B';
  });

  readonly filteredTalents = computed(() => {
    const all = this.classTalents();
    const filter = this.selectedBranchFilter();
    if (filter === 'all') return all;
    return all.filter(t => t.branch === filter);
  });

  selectHeroForCustomization(heroId: Hero['id']) {
    this.previewSkinId.set(null);
    this.gameState.selectHero(heroId);
  }

  getHeroUnlockedSkinCount(hero: Hero): number {
    return hero.skins.filter(s => s.isUnlocked).length;
  }

  previewSkin(skin: HeroSkin) {
    if (this.previewSkinId() === skin.id) {
      this.previewSkinId.set(null);
    } else {
      this.previewSkinId.set(skin.id);
    }
    this.sound.playClick();
  }

  clearPreview() {
    this.previewSkinId.set(null);
    this.sound.playClick();
  }

  equipSkin(heroId: Hero['id'], skinId: string) {
    this.gameState.equipSkin(heroId, skinId);
    this.previewSkinId.set(null);
  }

  unlockSkinWithCurrency(heroId: Hero['id'], skinId: string, currency: 'gold' | 'gems') {
    const ok = this.gameState.purchaseSkinWithCurrency(heroId, skinId, currency);
    if (ok) {
      this.previewSkinId.set(null);
    }
  }

  isTalentAvailable(talent: SkillNode): boolean {
    const hero = this.gameState.selectedHero();
    if (!talent.prereqId) return true;
    return hero.unlockedTalentIds.includes(talent.prereqId);
  }

  unlockTalent(talent: SkillNode) {
    this.gameState.unlockTalent(this.gameState.selectedHeroClass(), talent.id, talent.cost);
  }

  unlockWithCurrency(currency: 'gold' | 'gems') {
    this.gameState.unlockHero(this.gameState.selectedHeroClass(), currency);
  }

  getRarityLabel(rarity: CardRarity): string {
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

  getRarityColorClass(rarity: CardRarity): string {
    switch (rarity) {
      case 'common':
        return 'text-[#c5a880]';
      case 'rare':
        return 'text-[#60a5fa]';
      case 'epic':
        return 'text-[#c084fc]';
      case 'legendary':
        return 'text-[#fbbf24]';
      case 'mythic':
        return 'text-[#fb7185]';
    }
  }
}
