import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { GameStateService } from '../../services/game-state';
import { GrowingSkillTreePanel } from './growing-skill-tree';
import { HeroClass } from '../../models/game.model';

@Component({
  selector: 'app-skill-tree-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, GrowingSkillTreePanel],
  template: `
    <div class="max-w-7xl mx-auto p-4 md:p-6 space-y-6">

      <!-- Top Header Banner -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#120f0c] border border-[#3a2f23] rounded-2xl p-5 md:p-6 shadow-2xl">
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 rounded-2xl bg-[#0d2618] border-2 border-emerald-500/70 flex items-center justify-center shadow-lg shrink-0">
            <mat-icon class="text-4xl text-emerald-400">park</mat-icon>
          </div>
          <div>
            <div class="text-[10px] font-cinzel text-emerald-400 font-bold uppercase tracking-widest">
              Sanctuaire de Maîtrise &amp; Croissance
            </div>
            <h1 class="font-cinzel-dec text-2xl md:text-3xl font-black text-[#e0dcc7]">
              Arbre de Compétences Évolutif
            </h1>
            <p class="text-xs text-[#8b6b43] mt-0.5">
              À chaque amélioration, l'arbre grandit. Complétez tout un arbre pour obtenir <strong class="text-[#ffd700]">1000 Pièces d'Or</strong> et <strong class="text-sky-300">150 Gemmes</strong> !
            </p>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-3 shrink-0">
          <div class="px-4 py-2 rounded-xl bg-[#1a1612] border border-[#3a2f23] text-xs font-mono tabular-nums flex items-center gap-2">
            <mat-icon class="text-base text-[#a855f7]">auto_awesome</mat-icon>
            <span class="text-[#c5a880]">Éclats :</span>
            <strong class="text-[#a855f7] text-sm">{{ gameState.shards() }}</strong>
          </div>

          <div class="px-4 py-2 rounded-xl bg-[#1a1612] border border-[#d4af37]/60 text-xs font-mono tabular-nums flex items-center gap-2">
            <mat-icon class="text-base text-[#d4af37]">workspace_premium</mat-icon>
            <span class="text-[#c5a880]">Arbres Complets :</span>
            <strong class="text-[#ffd700] text-sm">{{ completedTreesCount() }} / {{ gameState.heroes().length }}</strong>
          </div>
        </div>
      </div>

      <!-- Hero Tree Selector Strip -->
      <div class="bg-[#120f0c] border border-[#3a2f23] rounded-2xl p-4 shadow-xl space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="font-cinzel text-xs uppercase tracking-widest text-[#8b6b43] font-bold flex items-center gap-1.5">
            <mat-icon class="text-sm text-[#d4af37]">groups</mat-icon>
            <span>Choisir le Héros dont l'Arbre doit Grandir</span>
          </h2>
          <span class="text-[11px] font-mono text-[#c5a880]">
            {{ unlockedTotalTalents() }} / {{ totalAllTalents() }} Nœuds Débloqués au Total
          </span>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-2">
          @for (hero of gameState.heroes(); track hero.id) {
            @let isSelected = hero.id === gameState.selectedHeroClass();
            @let nodeCount = getHeroNodeCount(hero.id);
            @let done = getHeroUnlockedCount(hero.id);
            @let isDone = nodeCount > 0 && done >= nodeCount;

            <button
              type="button"
              (click)="selectHero(hero.id)"
              class="p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col items-center gap-1.5 relative overflow-hidden"
              [class.bg-[#1f1912]]="isSelected"
              [class.border-[#d4af37]]="isSelected"
              [class.shadow-[0_0_16px_rgba(212,175,55,0.3)]]="isSelected"
              [class.bg-[#0d0b09]]="!isSelected"
              [class.border-[#3a2f23]]="!isSelected"
              [class.hover:border-[#8b6b43]]="!isSelected">

              @if (isDone) {
                <span class="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow" title="Arbre Complété">
                  <mat-icon class="text-[11px] font-black">check</mat-icon>
                </span>
              }

              <div class="w-9 h-9 rounded-full overflow-hidden border border-[#8b6b43]/70 bg-[#1a1612] flex items-center justify-center shrink-0">
                @if (hero.imageUrl) {
                  <img
                    [src]="hero.imageUrl"
                    [alt]="hero.name"
                    class="w-full h-full object-cover"
                    referrerpolicy="no-referrer" />
                } @else {
                  <mat-icon class="text-base text-[#d4af37]">{{ hero.avatarIcon }}</mat-icon>
                }
              </div>

              <div class="w-full text-center">
                <div class="font-cinzel text-[10px] font-bold text-[#e0dcc7] truncate">{{ hero.name }}</div>
                <div
                  class="text-[9px] font-mono tabular-nums"
                  [class.text-emerald-400]="isDone"
                  [class.text-[#8b6b43]]="!isDone">
                  {{ done }}/{{ nodeCount }}
                </div>
              </div>
            </button>
          }
        </div>
      </div>

      <!-- Main Growing Skill Tree Canvas -->
      <app-growing-skill-tree />

    </div>
  `,
})
export class SkillTreeView {
  readonly gameState = inject(GameStateService);

  readonly completedTreesCount = computed(() =>
    this.gameState.heroes().filter(h => this.gameState.isSkillTreeCompleted(h.id)).length
  );

  readonly unlockedTotalTalents = computed(() =>
    this.gameState.heroes().reduce((sum, h) => sum + this.getHeroUnlockedCount(h.id), 0)
  );

  readonly totalAllTalents = computed(() => this.gameState.skillTrees().length);

  selectHero(heroId: HeroClass) {
    this.gameState.selectHero(heroId);
  }

  getHeroNodeCount(heroId: HeroClass): number {
    return this.gameState.skillTrees().filter(n => n.heroClass === heroId).length;
  }

  getHeroUnlockedCount(heroId: HeroClass): number {
    const hero = this.gameState.heroes().find(h => h.id === heroId);
    if (!hero) return 0;
    const validIds = new Set(
      this.gameState.skillTrees()
        .filter(n => n.heroClass === heroId)
        .map(n => n.id)
    );
    return hero.unlockedTalentIds.filter(id => validIds.has(id)).length;
  }
}
