import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { GameStateService } from '../../services/game-state';
import { SoundService } from '../../services/sound';
import { SkillNode } from '../../models/game.model';

interface PositionedSkillNode {
  node: SkillNode;
  xSvg: number;
  ySvg: number;
  xPct: number;
  yPct: number;
  parentXSvg: number;
  parentYSvg: number;
  branchPath: string;
  isUnlocked: boolean;
  isAvailable: boolean;
  isParentUnlocked: boolean;
  canAfford: boolean;
}

@Component({
  selector: 'app-growing-skill-tree',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    @let hero = gameState.selectedHero();
    @let nodes = positionedNodes();
    @let doneCount = unlockedCount();
    @let maxCount = totalCount();
    @let pct = growthPct();
    @let completed = isCompleted();

    <div
      class="bg-[#120f0c] border-2 rounded-2xl p-5 md:p-6 shadow-2xl space-y-5 relative overflow-hidden transition-all duration-500"
      [class.border-[#fbbf24]]="completed"
      [class.border-[#3a2f23]]="!completed"
      [class.skill-tree-grow-surge]="growthPulseActive()">

      <!-- Header & Completion Grand Prize Bar -->
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#3a2f23]">
        <div>
          <div class="flex flex-wrap items-center gap-2 mb-1">
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-cinzel font-black uppercase tracking-widest border"
              [class.bg-emerald-950/60]="!completed"
              [class.border-emerald-500/50]="!completed"
              [class.text-emerald-300]="!completed"
              [class.bg-amber-950/70]="completed"
              [class.border-[#fbbf24]]="completed"
              [class.text-[#fef08a]]="completed">
              {{ growthStageLabel() }}
            </span>
            <span class="text-xs font-mono text-[#8b6b43] tabular-nums">
              Croissance : {{ doneCount }} / {{ maxCount }} ({{ pct }}%)
            </span>
          </div>
          <h3 class="font-cinzel text-lg md:text-xl font-black text-[#e0dcc7] flex items-center gap-2">
            <mat-icon class="text-emerald-400">park</mat-icon>
            <span>Arbre de Compétences — {{ hero.name }}</span>
          </h3>
          <p class="text-xs text-[#8b6b43]">
            Chaque amélioration fait grandir l'arbre et renforce votre héros au combat.
          </p>
        </div>

        <!-- Grand Prize Chest Banner: 1000 Or & 150 Gemmes -->
        <div
          class="flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 shrink-0 transition-all"
          [class.bg-gradient-to-r]="completed"
          [class.from-[#2b1f09]]="completed"
          [class.to-[#1a150b]]="completed"
          [class.border-[#fbbf24]]="completed"
          [class.bg-[#1a1612]]="!completed"
          [class.border-[#8b6b43]/70]="!completed">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center border shrink-0"
            [class.bg-amber-500/20]="completed"
            [class.border-[#fbbf24]]="completed"
            [class.bg-[#120f0c]]="!completed"
            [class.border-[#d4af37]/50]="!completed">
            <mat-icon class="text-xl" [class.text-[#fef08a]]="completed" [class.text-[#d4af37]]="!completed">
              {{ completed ? 'verified' : 'redeem' }}
            </mat-icon>
          </div>
          <div>
            <div class="text-[10px] font-cinzel font-bold uppercase tracking-wider"
              [class.text-[#fef08a]]="completed"
              [class.text-[#c5a880]]="!completed">
              {{ completed ? 'Arbre Parachevé — Récompense Reçue' : 'Récompense Finale (100%)' }}
            </div>
            <div class="flex items-center gap-2.5 mt-0.5 text-xs font-mono font-black tabular-nums">
              <span class="currency-pill-gold inline-flex items-center gap-1">
                <span class="currency-gold-coin text-[10px]">✦</span>
                <span class="currency-gold-shine">1000 Or</span>
              </span>
              <span class="currency-pill-gem inline-flex items-center gap-1">
                <span class="currency-gem-facet text-[10px]">⬥</span>
                <span class="currency-gem-shine">150 Gemmes</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Growth Progress Strip -->
      <div class="space-y-1.5">
        <div class="flex items-center justify-between text-[11px] font-mono tabular-nums">
          <span class="text-[#c5a880]">Éclats disponibles : <strong class="text-[#a855f7]">{{ gameState.shards() }} Éclats</strong></span>
          <span class="text-emerald-400 font-bold">
            {{ doneCount }} / {{ maxCount }} Branches Éveillées
          </span>
        </div>
        <div class="h-2.5 w-full rounded-full bg-[#0a0806] border border-[#3a2f23] overflow-hidden p-0.5">
          <div
            class="h-full rounded-full transition-all duration-500"
            [style.width.%]="pct"
            [class.bg-gradient-to-r]="true"
            [class.from-emerald-600]="!completed"
            [class.via-emerald-400]="!completed"
            [class.to-[#d4af37]]="!completed"
            [class.from-[#d4af37]]="completed"
            [class.via-[#fef08a]]="completed"
            [class.to-emerald-400]="completed">
          </div>
        </div>
      </div>

      <!-- INTERACTIVE GROWING TREE VISUAL STAGE -->
      <div class="relative w-full rounded-2xl border border-[#3a2f23] bg-gradient-to-b from-[#090d14] via-[#0d1412] to-[#120e0a] overflow-hidden shadow-inner min-h-[430px] sm:min-h-[480px]">

        <!-- Ambient Sky Glow & Soil Horizon -->
        <div
          class="absolute inset-0 pointer-events-none transition-opacity duration-700"
          [style.opacity]="0.25 + growthRatio() * 0.65"
          style="background: radial-gradient(circle at 50% 34%, rgba(16, 185, 129, 0.22) 0%, rgba(212, 175, 55, 0.14) 36%, transparent 72%);">
        </div>

        <!-- SVG Organic Growing Tree (Trunk, Canopy, Branches, Roots) -->
        <svg
          viewBox="0 0 800 500"
          preserveAspectRatio="none"
          class="absolute inset-0 w-full h-full pointer-events-none select-none">
          <defs>
            <linearGradient id="trunkGrad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stop-color="#4a321f" />
              <stop offset="55%" stop-color="#6b482c" />
              <stop offset="100%" stop-color="#8b6b43" />
            </linearGradient>
            <linearGradient id="sapGlowGrad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stop-color="#10b981" />
              <stop offset="60%" stop-color="#34d399" />
              <stop offset="100%" stop-color="#fde047" />
            </linearGradient>
            <radialGradient id="canopyGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="rgba(52, 211, 153, 0.45)" />
              <stop offset="65%" stop-color="rgba(16, 185, 129, 0.2)" />
              <stop offset="100%" stop-color="rgba(16, 185, 129, 0)" />
            </radialGradient>
            <radialGradient id="goldenCrownGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="rgba(253, 224, 71, 0.72)" />
              <stop offset="55%" stop-color="rgba(212, 175, 55, 0.28)" />
              <stop offset="100%" stop-color="rgba(212, 175, 55, 0)" />
            </radialGradient>
          </defs>

          <!-- Soil Mound & Ancestral Roots -->
          <ellipse cx="400" cy="468" [attr.rx]="155 + growthRatio() * 95" ry="26" fill="rgba(20, 14, 9, 0.95)" stroke="#3a2f23" stroke-width="2" />
          <path d="M 400 452 Q 350 462 295 474" fill="none" stroke="#5a3d26" stroke-width="6" stroke-linecap="round" />
          <path d="M 400 452 Q 450 462 505 474" fill="none" stroke="#5a3d26" stroke-width="6" stroke-linecap="round" />
          @if (doneCount >= 1) {
            <path d="M 400 454 Q 320 468 250 478" fill="none" stroke="rgba(16, 185, 129, 0.55)" stroke-width="3" stroke-linecap="round" />
            <path d="M 400 454 Q 480 468 550 478" fill="none" stroke="rgba(16, 185, 129, 0.55)" stroke-width="3" stroke-linecap="round" />
          }

          <!-- Dynamic Foliage Canopy Halo (Grows with every upgrade!) -->
          <g class="skill-tree-canopy-breathe">
            <ellipse
              cx="400"
              [attr.cy]="trunkTopY()"
              [attr.rx]="95 + growthRatio() * 235"
              [attr.ry]="58 + growthRatio() * 145"
              fill="url(#canopyGrad)" />
            @if (completed) {
              <ellipse
                cx="400"
                [attr.cy]="trunkTopY() - 10"
                rx="220"
                ry="135"
                fill="url(#goldenCrownGrad)"
                class="skill-tree-crown-aura" />
            }
          </g>

          <!-- Living Main Trunk (Height & Thickness grow at every upgrade!) -->
          <path
            [attr.d]="trunkSvgPath()"
            fill="none"
            stroke="url(#trunkGrad)"
            [attr.stroke-width]="trunkThickness()"
            stroke-linecap="round"
            style="transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);" />

          <!-- Glowing Mana Sap Vein inside Trunk -->
          @if (doneCount > 0) {
            <path
              [attr.d]="trunkSvgPath()"
              fill="none"
              stroke="url(#sapGlowGrad)"
              [attr.stroke-width]="Math.max(3, trunkThickness() * 0.28)"
              stroke-linecap="round"
              opacity="0.88"
              style="transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);" />
          }

          <!-- Organic Branches to Every Node -->
          @for (item of nodes; track item.node.id) {
            @if (item.isUnlocked) {
              <!-- Grown Bark + Glowing Emerald/Gold Sap Branch -->
              <path
                [attr.d]="item.branchPath"
                fill="none"
                stroke="#5c3e26"
                stroke-width="11"
                stroke-linecap="round" />
              <path
                [attr.d]="item.branchPath"
                fill="none"
                stroke="url(#sapGlowGrad)"
                stroke-width="4"
                stroke-linecap="round"
                opacity="0.92" />
              <!-- Leaf Blossom Cluster around Unlocked Tip -->
              <circle [attr.cx]="item.xSvg - 16" [attr.cy]="item.ySvg - 14" r="14" fill="rgba(16, 185, 129, 0.24)" />
              <circle [attr.cx]="item.xSvg + 18" [attr.cy]="item.ySvg - 10" r="12" fill="rgba(52, 211, 153, 0.22)" />
            } @else if (item.isParentUnlocked) {
              <!-- Sprouting Bud Twig Ready to Grow -->
              <path
                [attr.d]="item.branchPath"
                fill="none"
                stroke="#d4af37"
                stroke-width="3.5"
                stroke-dasharray="7 6"
                stroke-linecap="round"
                opacity="0.72" />
            } @else {
              <!-- Future Locked Branch Silhouette -->
              <path
                [attr.d]="item.branchPath"
                fill="none"
                stroke="#3a2f23"
                stroke-width="2"
                stroke-dasharray="4 6"
                stroke-linecap="round"
                opacity="0.35" />
            }
          }

          <!-- Crown Blossom Star when 100% Complete -->
          @if (completed) {
            <circle cx="400" cy="48" r="22" fill="rgba(253, 224, 71, 0.28)" class="skill-tree-crown-aura" />
            <circle cx="400" cy="48" r="9" fill="#fef08a" />
          }
        </svg>

        <!-- Root Heart Core Emblem -->
        <div
          class="absolute -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none flex flex-col items-center"
          style="left: 50%; top: 87%;">
          <div class="w-11 h-11 rounded-full bg-[#1a140d] border-2 border-[#d4af37] flex items-center justify-center shadow-[0_0_18px_rgba(212,175,55,0.45)]">
            <mat-icon class="text-xl text-[#d4af37]">{{ hero.avatarIcon }}</mat-icon>
          </div>
          <span class="mt-1 px-2 py-0.5 rounded bg-[#0c0a08]/90 border border-[#3a2f23] text-[9px] font-cinzel font-bold text-[#c5a880] whitespace-nowrap">
            Racine · {{ hero.name }}
          </span>
        </div>

        <!-- Branch Labels Top Left / Top Right -->
        <div class="absolute top-3 left-3 z-10 pointer-events-none hidden sm:block">
          <div class="px-2.5 py-1 rounded-lg bg-[#0d0b09]/85 border border-[#3a2f23] text-[10px] font-cinzel font-bold text-emerald-300">
            {{ branchAName() }}
          </div>
        </div>
        <div class="absolute top-3 right-3 z-10 pointer-events-none hidden sm:block">
          <div class="px-2.5 py-1 rounded-lg bg-[#0d0b09]/85 border border-[#3a2f23] text-[10px] font-cinzel font-bold text-[#d4af37]">
            {{ branchBName() }}
          </div>
        </div>

        <!-- Interactive Skill Tree Nodes Positioned Over Branches -->
        @for (item of nodes; track item.node.id) {
          @let isSelected = selectedNode()?.id === item.node.id;
          @let isRecentlyBloomed = recentlyUnlockedId() === item.node.id;

          <div
            class="absolute -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center"
            [style.left.%]="item.xPct"
            [style.top.%]="item.yPct">
            <button
              type="button"
              (click)="onNodeClick(item)"
              [title]="item.node.name + ' — ' + item.node.description"
              class="relative w-11 h-11 sm:w-13 sm:h-13 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer shadow-xl group"
              [class.skill-node-bloom]="isRecentlyBloomed"
              [class.bg-gradient-to-br]="item.isUnlocked"
              [class.from-emerald-700]="item.isUnlocked"
              [class.to-[#8b6b43]]="item.isUnlocked"
              [class.border-[#fde047]]="item.isUnlocked"
              [class.text-white]="item.isUnlocked"
              [class.shadow-[0_0_18px_rgba(52,211,153,0.6)]]="item.isUnlocked"
              [class.bg-[#1f1810]]="!item.isUnlocked && item.isAvailable"
              [class.border-[#d4af37]]="!item.isUnlocked && item.isAvailable"
              [class.text-[#fde047]]="!item.isUnlocked && item.isAvailable"
              [class.hover:scale-110]="item.isAvailable || item.isUnlocked"
              [class.bg-[#100d0a]/85]="!item.isUnlocked && !item.isAvailable"
              [class.border-[#3a2f23]]="!item.isUnlocked && !item.isAvailable"
              [class.text-[#6b5a45]]="!item.isUnlocked && !item.isAvailable"
              [class.opacity-55]="!item.isUnlocked && !item.isAvailable"
              [class.ring-2]="isSelected"
              [class.ring-white]="isSelected">

              <mat-icon class="text-lg sm:text-xl">{{ item.node.icon }}</mat-icon>

              <!-- Cost or Check Corner Pill -->
              @if (item.isUnlocked) {
                <span class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border border-[#0a0f0c] flex items-center justify-center shadow">
                  <mat-icon class="text-[10px] text-black font-black">check</mat-icon>
                </span>
              } @else if (item.isAvailable) {
                <span
                  class="absolute -bottom-1.5 -right-2 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-black border shadow tabular-nums"
                  [class.bg-[#a855f7]]="item.canAfford"
                  [class.text-white]="item.canAfford"
                  [class.border-purple-300]="item.canAfford"
                  [class.bg-[#241313]]="!item.canAfford"
                  [class.text-[#ff9999]]="!item.canAfford"
                  [class.border-[#ff4d4d]/60]="!item.canAfford">
                  {{ item.node.cost }}
                </span>
              } @else {
                <span class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#1a1612] border border-[#3a2f23] flex items-center justify-center">
                  <mat-icon class="text-[10px] text-[#6b5a45]">lock</mat-icon>
                </span>
              }
            </button>

            <span
              class="mt-1 px-1.5 py-0.5 rounded bg-[#0a0806]/90 border text-[9px] sm:text-[10px] font-cinzel font-bold whitespace-nowrap max-w-[110px] truncate pointer-events-none"
              [class.border-emerald-500/50]="item.isUnlocked"
              [class.text-emerald-200]="item.isUnlocked"
              [class.border-[#d4af37]/60]="!item.isUnlocked && item.isAvailable"
              [class.text-[#fef08a]]="!item.isUnlocked && item.isAvailable"
              [class.border-[#3a2f23]]="!item.isUnlocked && !item.isAvailable"
              [class.text-[#6b5a45]]="!item.isUnlocked && !item.isAvailable">
              {{ item.node.name }}
            </span>
          </div>
        }
      </div>

      <!-- SELECTED NODE ACTION INSPECTOR & NEXT UPGRADE CONTROLS -->
      @if (activeInspectorNode(); as sel) {
        @let selUnlocked = hero.unlockedTalentIds.includes(sel.id);
        @let selAvailable = isNodeAvailable(sel);
        @let canPay = gameState.shards() >= sel.cost;

        <div class="bg-[#1a1612] border border-[#3a2f23] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-start sm:items-center gap-3.5">
            <div
              class="w-12 h-12 rounded-xl border-2 flex items-center justify-center shrink-0"
              [class.bg-emerald-900/50]="selUnlocked"
              [class.border-emerald-400]="selUnlocked"
              [class.text-emerald-300]="selUnlocked"
              [class.bg-[#120f0c]]="!selUnlocked"
              [class.border-[#d4af37]]="!selUnlocked && selAvailable"
              [class.text-[#d4af37]]="!selUnlocked && selAvailable"
              [class.border-[#3a2f23]]="!selUnlocked && !selAvailable"
              [class.text-[#6b5a45]]="!selUnlocked && !selAvailable">
              <mat-icon class="text-2xl">{{ sel.icon }}</mat-icon>
            </div>
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <span class="font-cinzel font-black text-sm text-[#e0dcc7]">{{ sel.name }}</span>
                <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-[#120f0c] border border-[#3a2f23] text-[#c5a880]">
                  Tier {{ sel.tier }} · {{ sel.branchName }}
                </span>
              </div>
              <p class="text-xs text-[#c5a880] mt-1">{{ sel.description }}</p>
            </div>
          </div>

          <div class="flex items-center gap-2 self-end sm:self-center shrink-0">
            @if (selUnlocked) {
              <span class="px-3.5 py-2 rounded-xl bg-[#0d2618] border border-emerald-500/60 text-emerald-300 text-xs font-cinzel font-bold flex items-center gap-1.5 whitespace-nowrap">
                <mat-icon class="text-sm">check_circle</mat-icon>
                <span>Branche Éveillée</span>
              </span>
            } @else {
              <button
                type="button"
                (click)="upgradeNode(sel)"
                [disabled]="!selAvailable || !canPay"
                class="crimson-btn px-4 py-2.5 rounded-xl text-xs font-cinzel font-bold border flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                [class.opacity-45]="!selAvailable || !canPay">
                <mat-icon class="text-sm">spa</mat-icon>
                <span>Améliorer ({{ sel.cost }} Éclats)</span>
              </button>
            }

            @if (doneCount > 0) {
              <button
                type="button"
                (click)="resetTree()"
                class="medieval-btn px-3 py-2.5 rounded-xl text-xs font-cinzel font-bold text-[#8b6b43] hover:text-[#e0dcc7] border border-[#3a2f23] flex items-center gap-1 cursor-pointer whitespace-nowrap"
                title="Réinitialiser cet arbre et récupérer les Éclats dépensés">
                <mat-icon class="text-sm">restart_alt</mat-icon>
                <span class="hidden md:inline">Tailler</span>
              </button>
            }
          </div>
        </div>
      }

      <!-- COMPLETION TRIUMPH BANNER (WHEN 1000 GOLD & 150 GEMS AWARDED) -->
      @if (gameState.lastSkillTreeCompletionReward(); as reward) {
        <div class="bg-gradient-to-r from-[#2c1f09] via-[#1b140b] to-[#2c1f09] border-2 border-[#fde047] rounded-2xl p-4 sm:p-5 shadow-[0_0_30px_rgba(251,191,36,0.35)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-modal-pop">
          <div class="flex items-center gap-3.5">
            <div class="w-12 h-12 rounded-2xl bg-[#3a280a] border-2 border-[#fde047] flex items-center justify-center shrink-0">
              <mat-icon class="text-3xl text-[#fef08a]">emoji_events</mat-icon>
            </div>
            <div>
              <div class="text-[10px] font-cinzel font-black uppercase tracking-widest text-[#fef08a]">
                Croissance Maximale Atteinte !
              </div>
              <h4 class="font-cinzel text-base sm:text-lg font-black text-white">
                Arbre de {{ reward.heroName }} Parachevé
              </h4>
              <p class="text-xs text-[#e5c98d] mt-0.5">
                Récompense créditée : <strong class="text-[#fef08a]">+{{ reward.gold }} Pièces d'Or</strong> et <strong class="text-sky-300">+{{ reward.gems }} Gemmes</strong> !
              </p>
            </div>
          </div>

          <button
            type="button"
            (click)="gameState.dismissSkillTreeCompletionReward()"
            class="px-4 py-2 rounded-xl bg-[#fde047] text-[#1a1106] font-cinzel font-black text-xs cursor-pointer hover:bg-[#fef08a] transition-colors shrink-0">
            Célébrer &amp; Fermer
          </button>
        </div>
      }

    </div>
  `,
})
export class GrowingSkillTreePanel {
  readonly gameState = inject(GameStateService);
  readonly sound = inject(SoundService);
  private readonly destroyRef = inject(DestroyRef);

  readonly Math = Math;

  readonly selectedNode = signal<SkillNode | null>(null);
  readonly recentlyUnlockedId = signal<string | null>(null);
  readonly growthPulseActive = signal<boolean>(false);

  private surgeTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      const evt = this.gameState.lastSkillTreeUpgradeEvent();
      if (evt && evt.heroClass === this.gameState.selectedHeroClass()) {
        this.recentlyUnlockedId.set(evt.talentId);
        this.triggerGrowthPulse();
      }
    });

    this.destroyRef.onDestroy(() => {
      if (this.surgeTimer) {
        clearTimeout(this.surgeTimer);
        this.surgeTimer = null;
      }
    });
  }

  readonly heroNodes = computed<SkillNode[]>(() => {
    const curClass = this.gameState.selectedHeroClass();
    return this.gameState.skillTrees().filter(n => n.heroClass === curClass);
  });

  readonly unlockedCount = computed<number>(() => {
    const hero = this.gameState.selectedHero();
    return this.heroNodes().filter(n => hero.unlockedTalentIds.includes(n.id)).length;
  });

  readonly totalCount = computed<number>(() => this.heroNodes().length);

  readonly growthRatio = computed<number>(() => {
    const total = this.totalCount();
    if (total === 0) return 0;
    return this.unlockedCount() / total;
  });

  readonly growthPct = computed<number>(() => Math.round(this.growthRatio() * 100));

  readonly isCompleted = computed<boolean>(() => {
    const total = this.totalCount();
    return total > 0 && this.unlockedCount() >= total;
  });

  readonly growthStageLabel = computed<string>(() => {
    const pct = this.growthPct();
    if (pct >= 100) return 'Stade V : Arbre-Monde Légendaire';
    if (pct >= 70) return 'Stade IV : Chêne Ancestral';
    if (pct >= 45) return 'Stade III : Arbre Florissant';
    if (pct >= 15) return 'Stade II : Jeune Pousse Runique';
    return 'Stade I : Graine d\'Éther';
  });

  readonly branchAName = computed<string>(() => {
    return this.heroNodes().find(n => n.branch === 'branch_a')?.branchName || 'Voie A';
  });

  readonly branchBName = computed<string>(() => {
    return this.heroNodes().find(n => n.branch === 'branch_b')?.branchName || 'Voie B';
  });

  readonly trunkTopY = computed<number>(() => {
    // Trunk visibly grows taller from y=340 down toward y=95 as improvements are unlocked!
    return Math.round(335 - this.growthRatio() * 230);
  });

  readonly trunkThickness = computed<number>(() => {
    return Math.round(12 + this.growthRatio() * 20);
  });

  readonly trunkSvgPath = computed<string>(() => {
    const topY = this.trunkTopY();
    const midY = Math.round((450 + topY) / 2);
    return `M 400 455 Q 392 ${midY} 400 ${topY}`;
  });

  readonly positionedNodes = computed<PositionedSkillNode[]>(() => {
    const hero = this.gameState.selectedHero();
    const list = this.heroNodes();
    const shards = this.gameState.shards();
    const hasTier4 = list.some(n => n.tier === 4);

    const getCoord = (node: SkillNode): { x: number; y: number } => {
      const isA = node.branch === 'branch_a';
      if (hasTier4) {
        switch (node.tier) {
          case 1:
            return { x: isA ? 255 : 545, y: 348 };
          case 2:
            return { x: isA ? 175 : 625, y: 262 };
          case 3:
            return { x: isA ? 205 : 595, y: 168 };
          default:
            return { x: isA ? 285 : 515, y: 86 };
        }
      }
      switch (node.tier) {
        case 1:
          return { x: isA ? 250 : 550, y: 342 };
        case 2:
          return { x: isA ? 182 : 618, y: 230 };
        default:
          return { x: isA ? 275 : 525, y: 112 };
      }
    };

    const coordMap = new Map<string, { x: number; y: number }>();
    list.forEach(n => coordMap.set(n.id, getCoord(n)));

    return list.map(node => {
      const pos = coordMap.get(node.id) ?? { x: 400, y: 250 };
      const parentPos = node.prereqId ? (coordMap.get(node.prereqId) ?? { x: 400, y: 405 }) : { x: 400, y: 408 };
      const ctrlX = Math.round((parentPos.x + pos.x) / 2 + (node.branch === 'branch_a' ? -24 : 24));
      const ctrlY = Math.round((parentPos.y + pos.y) / 2 + 12);

      const isUnlocked = hero.unlockedTalentIds.includes(node.id);
      const isParentUnlocked = !node.prereqId || hero.unlockedTalentIds.includes(node.prereqId);
      const isAvailable = !isUnlocked && isParentUnlocked;

      return {
        node,
        xSvg: pos.x,
        ySvg: pos.y,
        xPct: (pos.x / 800) * 100,
        yPct: (pos.y / 500) * 100,
        parentXSvg: parentPos.x,
        parentYSvg: parentPos.y,
        branchPath: `M ${parentPos.x} ${parentPos.y} Q ${ctrlX} ${ctrlY} ${pos.x} ${pos.y}`,
        isUnlocked,
        isAvailable,
        isParentUnlocked,
        canAfford: shards >= node.cost,
      };
    });
  });

  readonly activeInspectorNode = computed<SkillNode | null>(() => {
    const sel = this.selectedNode();
    const list = this.heroNodes();
    if (sel && list.some(n => n.id === sel.id)) {
      return sel;
    }
    const hero = this.gameState.selectedHero();
    const firstAvailable = list.find(
      n => !hero.unlockedTalentIds.includes(n.id) && (!n.prereqId || hero.unlockedTalentIds.includes(n.prereqId))
    );
    return firstAvailable ?? list[0] ?? null;
  });

  isNodeAvailable(node: SkillNode): boolean {
    const hero = this.gameState.selectedHero();
    if (hero.unlockedTalentIds.includes(node.id)) return false;
    if (!node.prereqId) return true;
    return hero.unlockedTalentIds.includes(node.prereqId);
  }

  onNodeClick(item: PositionedSkillNode) {
    const currentSelected = this.activeInspectorNode();
    if (item.isAvailable && item.canAfford && currentSelected?.id === item.node.id) {
      this.upgradeNode(item.node);
      return;
    }
    this.selectedNode.set(item.node);
    this.sound.playClick();
  }

  upgradeNode(node: SkillNode) {
    const ok = this.gameState.unlockTalent(this.gameState.selectedHeroClass(), node.id, node.cost);
    if (ok) {
      this.selectedNode.set(node);
      this.recentlyUnlockedId.set(node.id);
      this.triggerGrowthPulse();
    }
  }

  resetTree() {
    this.gameState.resetHeroSkillTree(this.gameState.selectedHeroClass());
    this.selectedNode.set(null);
    this.recentlyUnlockedId.set(null);
  }

  private triggerGrowthPulse() {
    if (this.surgeTimer) {
      clearTimeout(this.surgeTimer);
    }
    this.growthPulseActive.set(true);
    this.surgeTimer = setTimeout(() => {
      this.growthPulseActive.set(false);
      this.surgeTimer = null;
    }, 1150);
  }
}
