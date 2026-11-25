import { ChangeDetectionStrategy, Component, computed, inject, output, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { GameStateService } from '../../services/game-state';
import { SoundService } from '../../services/sound';
import {
  AchievementCategory,
  AchievementTier,
  AchievementViewItem,
} from '../../models/game.model';

export type AchievementTargetView =
  | 'arena'
  | 'bestiary'
  | 'deckbuilder'
  | 'pets'
  | 'relics'
  | 'modes'
  | 'inventory'
  | 'shop';

type StatusFilter = 'all' | 'claimable' | 'in_progress' | 'completed';

interface CategoryMeta {
  id: AchievementCategory;
  label: string;
  icon: string;
  accentText: string;
  barColor: string;
}

const CATEGORY_LIST: CategoryMeta[] = [
  { id: 'combat', label: 'Combats', icon: 'swords', accentText: 'text-[#ff7b7b]', barColor: '#d9534f' },
  { id: 'bestiary', label: 'Bestiaire', icon: 'menu_book', accentText: 'text-[#d4af37]', barColor: '#d4af37' },
  { id: 'collection', label: 'Collection', icon: 'style', accentText: 'text-[#60a5fa]', barColor: '#4d94ff' },
  { id: 'campaign', label: 'Campagne', icon: 'castle', accentText: 'text-[#4dff88]', barColor: '#2ea866' },
  { id: 'alchemy', label: 'Alchimie', icon: 'science', accentText: 'text-[#c084fc]', barColor: '#a855f7' },
];

@Component({
  selector: 'app-achievements-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div class="max-w-7xl mx-auto p-4 md:p-6 space-y-6">

      <!-- HALL DES HAUTS FAITS : HEADER & GLOBAL PROGRESSION -->
      <section class="bg-[#120f0c] border border-[#8b6b43]/70 rounded-2xl p-5 md:p-7 shadow-2xl relative overflow-hidden">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div class="space-y-2 max-w-2xl">
            <div class="flex items-center gap-2 text-xs font-cinzel font-bold uppercase tracking-widest text-[#8b6b43]">
              <mat-icon class="text-base text-[#d4af37]">workspace_premium</mat-icon>
              <span>Registre Royal des Hauts Faits · {{ gameState.achievementHonorRank() }}</span>
            </div>

            <h1 class="font-cinzel-dec text-2xl sm:text-3xl font-black text-[#e0dcc7] tracking-wide">
              Succès &amp; Gloire d’Aetheria
            </h1>

            <p class="text-sm font-serif text-[#c5a880]/90 leading-relaxed">
              Accomplissez des exploits d’arène, recensez chaque créature du Bestiarium et forgez votre légende pour obtenir de l’Or, des Gemmes et des Titres honorifiques.
            </p>
          </div>

          <!-- Global Progress & Claim All Action -->
          <div class="bg-[#1a1612] border border-[#3a2f23] rounded-xl p-4 sm:p-5 min-w-[280px] lg:min-w-[340px] space-y-3 shadow-inner">
            <div class="flex items-baseline justify-between gap-4">
              <div>
                <div class="text-[11px] font-cinzel uppercase tracking-wider text-[#8b6b43] font-bold">
                  Accomplissement
                </div>
                <div class="font-mono tabular-nums text-2xl font-black text-[#e0dcc7] mt-0.5">
                  {{ gameState.achievementsUnlockedCount() }}
                  <span class="text-sm font-semibold text-[#8b6b43]">/ {{ gameState.achievementsTotalCount() }}</span>
                </div>
              </div>

              <div class="text-right">
                <div class="text-[11px] font-cinzel uppercase tracking-wider text-[#8b6b43] font-bold">
                  Points de Gloire
                </div>
                <div class="font-mono tabular-nums text-xl font-black text-[#d4af37] mt-0.5">
                  {{ gameState.achievementPointsEarned() }}
                  <span class="text-xs font-semibold text-[#8b6b43]">/ {{ gameState.achievementPointsTotal() }} pts</span>
                </div>
              </div>
            </div>

            <!-- Overall Progress Bar -->
            <div class="space-y-1">
              <div class="h-2.5 w-full bg-[#0d0b09] rounded-full overflow-hidden border border-[#3a2f23]">
                <div
                  class="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-[#8b6b43] via-[#d4af37] to-[#fde68a]"
                  [style.width.%]="gameState.achievementCompletionPct()"></div>
              </div>
              <div class="flex items-center justify-between text-[11px] font-mono tabular-nums text-[#8b6b43]">
                <span>{{ gameState.achievementCompletionPct() }}% complété</span>
                <span>{{ gameState.titles().length }} titre(s) débloqué(s)</span>
              </div>
            </div>

            @if (gameState.achievementsClaimableCount() > 0) {
              <button
                type="button"
                (click)="claimAll()"
                class="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#b58a24] via-[#d4af37] to-[#f0c755] hover:brightness-110 text-[#120f0c] font-cinzel font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0">
                <mat-icon class="text-base">redeem</mat-icon>
                <span>Tout Réclamer ({{ gameState.achievementsClaimableCount() }})</span>
              </button>
            } @else {
              <div class="text-center text-[11px] font-cinzel text-[#8b6b43] pt-1 border-t border-[#3a2f23]/60">
                Aucune récompense en attente
              </div>
            }
          </div>
        </div>
      </section>

      <!-- CATEGORY PROGRESSION STRIP -->
      <section class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        @for (cat of categorySummaries(); track cat.id) {
          @let isActive = selectedCategory() === cat.id;
          <button
            type="button"
            (click)="toggleCategory(cat.id)"
            class="text-left p-3.5 rounded-xl border transition-all cursor-pointer bg-[#120f0c] hover:bg-[#1a1612] space-y-2"
            [class.border-[#d4af37]]="isActive"
            [class.shadow-[0_0_18px_rgba(212,175,55,0.18)]]="isActive"
            [class.border-[#3a2f23]]="!isActive">
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-1.5 min-w-0">
                <mat-icon class="text-base shrink-0" [class]="cat.accentText">{{ cat.icon }}</mat-icon>
                <span class="font-cinzel text-xs font-bold text-[#e0dcc7] truncate">{{ cat.label }}</span>
              </div>
              <span class="font-mono tabular-nums text-[11px] font-bold text-[#c5a880] shrink-0">
                {{ cat.unlocked }}/{{ cat.total }}
              </span>
            </div>

            <div class="h-1.5 w-full bg-[#0d0b09] rounded-full overflow-hidden border border-[#3a2f23]/70">
              <div
                class="h-full rounded-full transition-all duration-500"
                [style.width.%]="cat.pct"
                [style.backgroundColor]="cat.barColor"></div>
            </div>

            <div class="flex items-center justify-between text-[10px] font-mono tabular-nums text-[#8b6b43]">
              <span>{{ cat.pct }}%</span>
              @if (cat.claimable > 0) {
                <span class="text-[#d4af37] font-bold">{{ cat.claimable }} prêt(s)</span>
              } @else {
                <span>{{ cat.points }} pts</span>
              }
            </div>
          </button>
        }
      </section>

      <!-- SPOTLIGHT: PRIORITY / CLOSEST MILESTONES -->
      @if (spotlightAchievements().length > 0 && selectedCategory() === 'all' && selectedStatus() === 'all' && !searchQuery().trim()) {
        <section class="space-y-3">
          <div class="flex items-center justify-between">
            <h2 class="font-cinzel text-sm font-bold uppercase tracking-wider text-[#c5a880] flex items-center gap-2">
              <mat-icon class="text-base text-[#d4af37]">flag</mat-icon>
              <span>Jalons Prioritaires &amp; Récompenses Imminentes</span>
            </h2>
            <span class="text-xs font-serif text-[#8b6b43]">Objectifs prêts ou les plus proches</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            @for (item of spotlightAchievements(); track item.id) {
              <div
                class="bg-[#16120e] border rounded-xl p-4 flex flex-col justify-between gap-3 transition-colors"
                [class.border-[#d4af37]]="item.canClaim"
                [class.border-[#3a2f23]]="!item.canClaim">
                <div class="flex items-start justify-between gap-3">
                  <div class="flex items-start gap-3 min-w-0">
                    <div
                      class="w-10 h-10 rounded-lg border flex items-center justify-center shrink-0"
                      [class]="getTierFrameClass(item.tier)">
                      <mat-icon class="text-xl" [class]="getTierIconClass(item.tier)">{{ item.icon }}</mat-icon>
                    </div>
                    <div class="min-w-0">
                      <div class="text-[11px] font-cinzel text-[#8b6b43] truncate">
                        {{ getCategoryLabel(item.category) }} · {{ getTierLabel(item.tier) }}
                      </div>
                      <h3 class="font-cinzel text-sm font-bold text-[#e0dcc7] leading-snug">
                        {{ item.title }}
                      </h3>
                    </div>
                  </div>
                  <span class="font-mono tabular-nums text-xs font-bold text-[#d4af37] shrink-0">
                    {{ item.progressPct }}%
                  </span>
                </div>

                <div class="space-y-1.5">
                  <div class="h-1.5 w-full bg-[#0d0b09] rounded-full overflow-hidden border border-[#3a2f23]">
                    <div
                      class="h-full rounded-full transition-all duration-500"
                      [class]="item.canClaim ? 'bg-[#4dff88]' : 'bg-[#d4af37]'"
                      [style.width.%]="item.progressPct"></div>
                  </div>
                  <div class="flex items-center justify-between gap-2 text-xs">
                    <span class="font-mono tabular-nums text-[#c5a880]">
                      {{ item.current }} / {{ item.target }} {{ item.unitLabel }}
                    </span>
                    @if (item.canClaim) {
                      <button
                        type="button"
                        (click)="claimSingle(item.id)"
                        class="px-3 py-1 rounded-lg bg-[#d4af37] hover:bg-[#e5c158] text-[#120f0c] font-cinzel font-black text-[11px] uppercase tracking-wide cursor-pointer whitespace-nowrap shrink-0">
                        Réclamer
                      </button>
                    } @else if (item.targetView) {
                      <button
                        type="button"
                        (click)="goToTarget(item.targetView)"
                        class="text-[#d4af37] hover:text-[#fde68a] font-cinzel font-bold text-[11px] flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0">
                        <span>Progresser</span>
                        <mat-icon class="text-xs">arrow_forward</mat-icon>
                      </button>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
        </section>
      }

      <!-- FILTER BAR: CATEGORIES, STATUS & SEARCH -->
      <section class="bg-[#120f0c] border border-[#3a2f23] rounded-2xl p-3.5 md:p-4 space-y-3 shadow-xl">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">

          <!-- Category Filter Tabs -->
          <div class="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              (click)="selectCategory('all')"
              class="px-3 py-1.5 rounded-lg border font-cinzel text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0"
              [class.bg-[#2a2117]]="selectedCategory() === 'all'"
              [class.text-[#d4af37]]="selectedCategory() === 'all'"
              [class.border-[#d4af37]]="selectedCategory() === 'all'"
              [class.bg-[#1a1612]]="selectedCategory() !== 'all'"
              [class.text-[#8b6b43]]="selectedCategory() !== 'all'"
              [class.border-[#3a2f23]]="selectedCategory() !== 'all'"
              [class.hover:text-[#c5a880]]="selectedCategory() !== 'all'">
              Tous ({{ gameState.achievementsTotalCount() }})
            </button>

            @for (cat of categories; track cat.id) {
              @let active = selectedCategory() === cat.id;
              <button
                type="button"
                (click)="selectCategory(cat.id)"
                class="px-3 py-1.5 rounded-lg border font-cinzel text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5"
                [class.bg-[#2a2117]]="active"
                [class.text-[#d4af37]]="active"
                [class.border-[#d4af37]]="active"
                [class.bg-[#1a1612]]="!active"
                [class.text-[#8b6b43]]="!active"
                [class.border-[#3a2f23]]="!active"
                [class.hover:text-[#c5a880]]="!active">
                <mat-icon class="text-sm">{{ cat.icon }}</mat-icon>
                <span>{{ cat.label }}</span>
              </button>
            }
          </div>

          <!-- Status Filter + Search Input -->
          <div class="flex flex-col sm:flex-row sm:items-center gap-2.5">
            <div class="flex items-center bg-[#0d0b09] border border-[#3a2f23] rounded-lg p-1 gap-1 overflow-x-auto">
              <button
                type="button"
                (click)="selectStatus('all')"
                class="px-2.5 py-1 rounded text-[11px] font-cinzel font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                [class.bg-[#2a2117]]="selectedStatus() === 'all'"
                [class.text-[#e0dcc7]]="selectedStatus() === 'all'"
                [class.text-[#8b6b43]]="selectedStatus() !== 'all'">
                Tout
              </button>
              <button
                type="button"
                (click)="selectStatus('claimable')"
                class="px-2.5 py-1 rounded text-[11px] font-cinzel font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                [class.bg-[#2a2117]]="selectedStatus() === 'claimable'"
                [class.text-[#d4af37]]="selectedStatus() === 'claimable'"
                [class.text-[#8b6b43]]="selectedStatus() !== 'claimable'">
                À réclamer ({{ gameState.achievementsClaimableCount() }})
              </button>
              <button
                type="button"
                (click)="selectStatus('in_progress')"
                class="px-2.5 py-1 rounded text-[11px] font-cinzel font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                [class.bg-[#2a2117]]="selectedStatus() === 'in_progress'"
                [class.text-[#e0dcc7]]="selectedStatus() === 'in_progress'"
                [class.text-[#8b6b43]]="selectedStatus() !== 'in_progress'">
                En cours
              </button>
              <button
                type="button"
                (click)="selectStatus('completed')"
                class="px-2.5 py-1 rounded text-[11px] font-cinzel font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                [class.bg-[#2a2117]]="selectedStatus() === 'completed'"
                [class.text-[#4dff88]]="selectedStatus() === 'completed'"
                [class.text-[#8b6b43]]="selectedStatus() !== 'completed'">
                Complétés
              </button>
            </div>

            <div class="relative min-w-[210px]">
              <mat-icon class="text-sm text-[#8b6b43] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">search</mat-icon>
              <input
                #searchInput
                type="text"
                [value]="searchQuery()"
                (input)="searchQuery.set(searchInput.value)"
                placeholder="Rechercher un succès..."
                aria-label="Rechercher un succès"
                class="w-full bg-[#0d0b09] border border-[#3a2f23] focus:border-[#8b6b43] rounded-lg pl-8 pr-8 py-1.5 text-xs text-[#e0dcc7] placeholder-[#6b5a45] focus:outline-none transition-colors" />
              @if (searchQuery()) {
                <button
                  type="button"
                  (click)="clearSearch()"
                  aria-label="Effacer la recherche"
                  class="absolute right-2 top-1/2 -translate-y-1/2 text-[#8b6b43] hover:text-[#e0dcc7] cursor-pointer">
                  <mat-icon class="text-sm">close</mat-icon>
                </button>
              }
            </div>
          </div>

        </div>
      </section>

      <!-- ACHIEVEMENTS GRID -->
      @if (filteredAchievements().length > 0) {
        <section class="grid grid-cols-1 md:grid-cols-2 gap-4">
          @for (ach of filteredAchievements(); track ach.id) {
            <article
              class="rounded-2xl border p-4 sm:p-5 flex flex-col justify-between gap-4 transition-all shadow-lg"
              [class.bg-[#18130d]]="ach.canClaim"
              [class.border-[#d4af37]]="ach.canClaim"
              [class.bg-[#101310]]="ach.isClaimed"
              [class.border-[#2a4a2a]]="ach.isClaimed"
              [class.bg-[#120f0c]]="!ach.isUnlocked"
              [class.border-[#3a2f23]]="!ach.isUnlocked">

              <!-- Top Row: Icon, Title, Clean Unboxed Metadata -->
              <div class="flex items-start justify-between gap-3">
                <div class="flex items-start gap-3.5 min-w-0">
                  <div
                    class="w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 shadow-inner"
                    [class]="getTierFrameClass(ach.tier)">
                    <mat-icon class="text-2xl" [class]="getTierIconClass(ach.tier)">{{ ach.icon }}</mat-icon>
                  </div>

                  <div class="space-y-1 min-w-0">
                    <div class="text-[11px] font-cinzel font-semibold tracking-wide text-[#8b6b43]">
                      <span>{{ getCategoryLabel(ach.category) }}</span>
                      <span> · </span>
                      <span [class]="getTierIconClass(ach.tier)">Palier {{ getTierLabel(ach.tier) }}</span>
                      <span> · </span>
                      <span class="font-mono tabular-nums text-[#c5a880]">+{{ ach.points }} pts</span>
                    </div>

                    <h3 class="font-cinzel text-base font-bold text-[#e0dcc7] leading-snug">
                      {{ ach.title }}
                    </h3>

                    <p class="text-xs font-serif text-[#c5a880]/85 leading-relaxed">
                      {{ ach.description }}
                    </p>
                  </div>
                </div>

                @if (ach.isClaimed) {
                  <span class="inline-flex items-center gap-1 text-[11px] font-cinzel font-bold text-[#4dff88] whitespace-nowrap shrink-0">
                    <mat-icon class="text-sm">verified</mat-icon>
                    <span>Accompli</span>
                  </span>
                } @else if (ach.canClaim) {
                  <span class="font-mono tabular-nums text-[11px] font-bold text-[#d4af37] whitespace-nowrap shrink-0">
                    Prêt !
                  </span>
                } @else {
                  <span class="font-mono tabular-nums text-xs font-bold text-[#8b6b43] whitespace-nowrap shrink-0">
                    {{ ach.progressPct }}%
                  </span>
                }
              </div>

              <!-- Middle Row: Progress Bar & Numeric Counter -->
              <div class="space-y-1.5">
                <div class="h-2 w-full bg-[#0d0b09] rounded-full overflow-hidden border border-[#3a2f23]">
                  <div
                    class="h-full rounded-full transition-all duration-500"
                    [class]="ach.isClaimed ? 'bg-[#2ea866]' : ach.canClaim ? 'bg-[#d4af37]' : 'bg-gradient-to-r from-[#6b5a45] to-[#c5a880]'"
                    [style.width.%]="ach.progressPct"></div>
                </div>

                <div class="flex items-center justify-between text-xs font-mono tabular-nums">
                  <span [class]="ach.isUnlocked ? 'text-[#e0dcc7] font-bold' : 'text-[#c5a880]'">
                    {{ ach.current }} / {{ ach.target }} {{ ach.unitLabel }}
                  </span>
                  <span class="text-[#8b6b43]">
                    @if (ach.isUnlocked) {
                      Objectif atteint
                    } @else {
                      Reste {{ ach.target - ach.current }}
                    }
                  </span>
                </div>
              </div>

              <!-- Bottom Row: Reward Summary + Single Primary Action -->
              <div class="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#3a2f23]/70">
                <div class="text-xs font-mono tabular-nums text-[#c5a880] leading-relaxed">
                  <span class="text-[11px] font-cinzel uppercase text-[#8b6b43] mr-1.5">Butin :</span>
                  <span>{{ formatRewards(ach) }}</span>
                </div>

                @if (ach.canClaim) {
                  <button
                    type="button"
                    (click)="claimSingle(ach.id)"
                    class="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#b58a24] to-[#e0b84b] hover:brightness-110 text-[#120f0c] font-cinzel font-black text-xs uppercase tracking-wider shadow flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0">
                    <mat-icon class="text-sm">redeem</mat-icon>
                    <span>Réclamer</span>
                  </button>
                } @else if (ach.isClaimed) {
                  <div class="px-3 py-1.5 rounded-xl bg-[#122014] border border-[#2a4a2a] text-[#4dff88] font-cinzel font-bold text-xs flex items-center gap-1.5 whitespace-nowrap shrink-0">
                    <mat-icon class="text-sm">check_circle</mat-icon>
                    <span>Réclamé</span>
                  </div>
                } @else if (ach.targetView) {
                  <button
                    type="button"
                    (click)="goToTarget(ach.targetView)"
                    class="medieval-btn px-3.5 py-1.5 rounded-xl bg-[#1a1612] hover:bg-[#251f18] border border-[#8b6b43]/70 text-[#d4af37] font-cinzel font-bold text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0">
                    <span>Y aller</span>
                    <mat-icon class="text-sm">arrow_forward</mat-icon>
                  </button>
                }
              </div>

            </article>
          }
        </section>
      } @else {
        <!-- Empty State -->
        <section class="bg-[#120f0c] border border-[#3a2f23] rounded-2xl p-10 text-center space-y-3">
          <mat-icon class="text-4xl text-[#8b6b43]">search_off</mat-icon>
          <h3 class="font-cinzel text-lg font-bold text-[#c5a880]">
            Aucun haut fait ne correspond à ces filtres
          </h3>
          <p class="text-xs font-serif text-[#8b6b43]">
            Modifiez la catégorie, le statut ou la recherche pour explorer l’ensemble des succès d’Aetheria.
          </p>
          <button
            type="button"
            (click)="resetFilters()"
            class="medieval-btn px-4 py-2 rounded-xl bg-[#1a1612] border border-[#8b6b43] text-[#d4af37] font-cinzel font-bold text-xs cursor-pointer">
            Réinitialiser les filtres
          </button>
        </section>
      }

    </div>
  `,
})
export class AchievementsView {
  readonly gameState = inject(GameStateService);
  private readonly sound = inject(SoundService);

  readonly navigateTo = output<AchievementTargetView>();

  readonly categories = CATEGORY_LIST;
  readonly selectedCategory = signal<'all' | AchievementCategory>('all');
  readonly selectedStatus = signal<StatusFilter>('all');
  readonly searchQuery = signal<string>('');

  readonly categorySummaries = computed(() => {
    const all = this.gameState.achievements();
    return CATEGORY_LIST.map(cat => {
      const items = all.filter(a => a.category === cat.id);
      const unlocked = items.filter(a => a.isUnlocked).length;
      const claimable = items.filter(a => a.canClaim).length;
      const total = items.length;
      const pct = total > 0 ? Math.round((unlocked / total) * 100) : 0;
      const points = items.filter(a => a.isUnlocked).reduce((acc, a) => acc + a.points, 0);
      return {
        ...cat,
        unlocked,
        claimable,
        total,
        pct,
        points,
      };
    });
  });

  readonly spotlightAchievements = computed<AchievementViewItem[]>(() => {
    const all = this.gameState.achievements();
    const claimable = all.filter(a => a.canClaim);
    const inProgress = all
      .filter(a => !a.isUnlocked)
      .sort((a, b) => b.progressPct - a.progressPct);
    return [...claimable, ...inProgress].slice(0, 3);
  });

  readonly filteredAchievements = computed<AchievementViewItem[]>(() => {
    const cat = this.selectedCategory();
    const status = this.selectedStatus();
    const q = this.searchQuery().trim().toLowerCase();

    const filtered = this.gameState.achievements().filter(item => {
      if (cat !== 'all' && item.category !== cat) return false;
      if (status === 'claimable' && !item.canClaim) return false;
      if (status === 'in_progress' && item.isUnlocked) return false;
      if (status === 'completed' && !item.isUnlocked) return false;
      if (q) {
        const hay = `${item.title} ${item.description} ${item.reward.title ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    // Sort: claimable first, then highest progress in-progress, then claimed
    return [...filtered].sort((a, b) => {
      const rank = (x: AchievementViewItem): number => {
        if (x.canClaim) return 0;
        if (!x.isUnlocked) return 1;
        return 2;
      };
      const ra = rank(a);
      const rb = rank(b);
      if (ra !== rb) return ra - rb;
      if (ra === 1 && b.progressPct !== a.progressPct) {
        return b.progressPct - a.progressPct;
      }
      return 0;
    });
  });

  selectCategory(cat: 'all' | AchievementCategory) {
    this.selectedCategory.set(cat);
    this.sound.playClick();
  }

  toggleCategory(cat: AchievementCategory) {
    this.selectedCategory.update(current => (current === cat ? 'all' : cat));
    this.sound.playClick();
  }

  selectStatus(status: StatusFilter) {
    this.selectedStatus.set(status);
    this.sound.playClick();
  }

  clearSearch() {
    this.searchQuery.set('');
    this.sound.playClick();
  }

  resetFilters() {
    this.selectedCategory.set('all');
    this.selectedStatus.set('all');
    this.searchQuery.set('');
    this.sound.playClick();
  }

  claimSingle(id: string) {
    this.gameState.claimAchievementReward(id);
  }

  claimAll() {
    this.gameState.claimAllAchievementRewards();
  }

  goToTarget(targetView: AchievementTargetView) {
    this.sound.playClick();
    this.navigateTo.emit(targetView);
  }

  getCategoryLabel(cat: AchievementCategory): string {
    switch (cat) {
      case 'combat':
        return 'Combats';
      case 'bestiary':
        return 'Bestiaire';
      case 'collection':
        return 'Collection';
      case 'campaign':
        return 'Campagne';
      case 'alchemy':
        return 'Alchimie';
    }
  }

  getTierLabel(tier: AchievementTier): string {
    switch (tier) {
      case 'bronze':
        return 'Bronze';
      case 'silver':
        return 'Argent';
      case 'gold':
        return 'Or';
      case 'mythic':
        return 'Mythique';
    }
  }

  getTierFrameClass(tier: AchievementTier): string {
    switch (tier) {
      case 'bronze':
        return 'bg-[#1c130d] border-[#8c5a32]/70';
      case 'silver':
        return 'bg-[#14171c] border-[#94a3b8]/70';
      case 'gold':
        return 'bg-[#21190c] border-[#d4af37]/80';
      case 'mythic':
        return 'bg-[#1c1024] border-[#c084fc]/80';
    }
  }

  getTierIconClass(tier: AchievementTier): string {
    switch (tier) {
      case 'bronze':
        return 'text-[#cd854b]';
      case 'silver':
        return 'text-[#cbd5e1]';
      case 'gold':
        return 'text-[#ffd700]';
      case 'mythic':
        return 'text-[#d8b4fe]';
    }
  }

  formatRewards(ach: AchievementViewItem): string {
    const parts: string[] = [];
    if (ach.reward.gold) parts.push(`+${ach.reward.gold} Or`);
    if (ach.reward.gems) parts.push(`+${ach.reward.gems} Gemmes`);
    if (ach.reward.shards) parts.push(`+${ach.reward.shards} Éclats`);
    if (ach.reward.title) parts.push(`Titre « ${ach.reward.title} »`);
    return parts.join(' · ');
  }
}
