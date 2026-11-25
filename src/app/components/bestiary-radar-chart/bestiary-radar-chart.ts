import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  input,
  signal,
  viewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import * as d3 from 'd3';
import { BestiaryEntry, MonsterStats } from '../../models/game.model';

export type ChartDisplayMode = 'radar' | 'bar';

export interface StatDescriptor {
  key: keyof MonsterStats;
  label: string;
  shortLabel: string;
  icon: string;
  color: string;
  glowColor: string;
  description: string;
  rune: string;
}

const STAT_CONFIGS: StatDescriptor[] = [
  {
    key: 'strength',
    label: 'Force',
    shortLabel: 'FOR',
    icon: 'swords',
    color: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.4)',
    description: 'Puissance de frappe en mêlée, perforation des boucliers et dégâts bruts physiques.',
    rune: 'ᚠ'
  },
  {
    key: 'defense',
    label: 'Défense',
    shortLabel: 'DEF',
    icon: 'shield',
    color: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.4)',
    description: 'Solidité de la carapace, réduction passive des blessures et tenue de garde.',
    rune: 'ᛏ'
  },
  {
    key: 'magic',
    label: 'Magie',
    shortLabel: 'MAG',
    icon: 'auto_fix_high',
    color: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.4)',
    description: 'Intensité des flux élémentaires, amplification des sorts et décharges mystiques.',
    rune: 'ᛗ'
  },
  {
    key: 'speed',
    label: 'Vitesse',
    shortLabel: 'VIT',
    icon: 'bolt',
    color: '#22c55e',
    glowColor: 'rgba(34, 197, 94, 0.4)',
    description: 'Célérité des esquives, vivacité des réflexes et initiative d’engagement.',
    rune: 'ᚱ'
  }
];

@Component({
  selector: 'app-bestiary-radar-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="relative bg-gradient-to-b from-[#18110b] via-[#120c07] to-[#0a0705] border-2 border-[#8b6b43]/70 rounded-2xl p-4 sm:p-5 shadow-2xl overflow-hidden space-y-4">
      <!-- Medieval Corner Filigree Accents -->
      <div class="absolute top-1.5 left-2 text-[#d4af37]/20 select-none text-sm pointer-events-none">✦</div>
      <div class="absolute top-1.5 right-2 text-[#d4af37]/20 select-none text-sm pointer-events-none">✦</div>
      <div class="absolute bottom-1.5 left-2 text-[#d4af37]/20 select-none text-sm pointer-events-none">✦</div>
      <div class="absolute bottom-1.5 right-2 text-[#d4af37]/20 select-none text-sm pointer-events-none">✦</div>

      <!-- Header & Mode Switcher Controls -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#8b6b43]/40 pb-3">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-full bg-[#d4af37]/20 border border-[#d4af37] flex items-center justify-center text-[#ffd700] shadow-sm">
            <mat-icon class="text-base">{{ displayMode() === 'radar' ? 'radar' : 'bar_chart' }}</mat-icon>
          </div>
          <div>
            <span class="text-[10px] font-cinzel uppercase text-[#ffd700] font-bold tracking-wider block">
              Astrolabe des Attributs Martiaux & Occultes
            </span>
            <h3 class="font-cinzel text-xs sm:text-sm font-black text-[#f5ebd9] flex items-center gap-2">
              <span>Profil Statistique de Combat</span>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#d4af37]/15 text-[#ffd700] border border-[#d4af37]/40">
                Indice Global : {{ averageStat() }}/100
              </span>
            </h3>
          </div>
        </div>

        <!-- Mode Toggle Tabs -->
        <div class="inline-flex items-center bg-[#0d0906] border border-[#8b6b43]/60 rounded-xl p-1 self-start sm:self-auto shadow-inner">
          <button
            type="button"
            (click)="setMode('radar')"
            class="px-3 py-1 rounded-lg text-xs font-cinzel font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            [class.bg-gradient-to-r]="displayMode() === 'radar'"
            [class.from-[#3b2713]]="displayMode() === 'radar'"
            [class.to-[#25170a]]="displayMode() === 'radar'"
            [class.text-[#ffd700]]="displayMode() === 'radar'"
            [class.border]="displayMode() === 'radar'"
            [class.border-[#d4af37]]="displayMode() === 'radar'"
            [class.shadow-md]="displayMode() === 'radar'"
            [class.text-[#a89070]]="displayMode() !== 'radar'"
            [class.hover:text-[#f5ebd9]]="displayMode() !== 'radar'">
            <mat-icon class="text-xs">radar</mat-icon>
            <span>Diagramme Astral</span>
          </button>

          <button
            type="button"
            (click)="setMode('bar')"
            class="px-3 py-1 rounded-lg text-xs font-cinzel font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            [class.bg-gradient-to-r]="displayMode() === 'bar'"
            [class.from-[#3b2713]]="displayMode() === 'bar'"
            [class.to-[#25170a]]="displayMode() === 'bar'"
            [class.text-[#ffd700]]="displayMode() === 'bar'"
            [class.border]="displayMode() === 'bar'"
            [class.border-[#d4af37]]="displayMode() === 'bar'"
            [class.shadow-md]="displayMode() === 'bar'"
            [class.text-[#a89070]]="displayMode() !== 'bar'"
            [class.hover:text-[#f5ebd9]]="displayMode() !== 'bar'">
            <mat-icon class="text-xs">bar_chart</mat-icon>
            <span>Barres Héraldiques</span>
          </button>
        </div>
      </div>

      <!-- Main Visual Stage -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        <!-- Visualization Container: D3 SVG Surface -->
        <div class="lg:col-span-7 flex flex-col items-center justify-center relative">
          <!-- Background Parchment Astrolabe Ring Watermark -->
          <div class="w-full max-w-[340px] aspect-square flex items-center justify-center relative">
            <svg
              #svgContainer
              viewBox="0 0 340 340"
              class="w-full h-full overflow-visible select-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]">
              <!-- Definitions: Gradients & Glow Filters -->
              <defs>
                <!-- Radial Astrolabe Background -->
                <radialGradient id="astrolabeBg" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stop-color="#2c1d10" stop-opacity="0.35" />
                  <stop offset="70%" stop-color="#191008" stop-opacity="0.6" />
                  <stop offset="100%" stop-color="#0c0704" stop-opacity="0.9" />
                </radialGradient>

                <!-- Gold Foil Web Grid Stroke Gradient -->
                <linearGradient id="goldWebGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#d4af37" stop-opacity="0.8" />
                  <stop offset="50%" stop-color="#8b6b43" stop-opacity="0.5" />
                  <stop offset="100%" stop-color="#ffd700" stop-opacity="0.8" />
                </linearGradient>

                <!-- Dynamic Polygon Radar Fill Gradient -->
                <linearGradient id="polygonRadarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#fbbf24" stop-opacity="0.65" />
                  <stop offset="50%" stop-color="#f59e0b" stop-opacity="0.45" />
                  <stop offset="100%" stop-color="#b45309" stop-opacity="0.55" />
                </linearGradient>

                <!-- Bar Fill Gradients -->
                <linearGradient id="barGradStrength" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#7f1d1d" />
                  <stop offset="100%" stop-color="#ef4444" />
                </linearGradient>
                <linearGradient id="barGradDefense" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#0c4a6e" />
                  <stop offset="100%" stop-color="#38bdf8" />
                </linearGradient>
                <linearGradient id="barGradMagic" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#581c87" />
                  <stop offset="100%" stop-color="#a855f7" />
                </linearGradient>
                <linearGradient id="barGradSpeed" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#14532d" />
                  <stop offset="100%" stop-color="#22c55e" />
                </linearGradient>

                <!-- Soft Medieval Amber Glow -->
                <filter id="parchmentGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              <!-- Dynamic D3 Rendering Group -->
              <g #d3Root></g>
            </svg>

            <!-- Center Rune Medallion on Radar mode -->
            @if (displayMode() === 'radar') {
              <div
                class="absolute pointer-events-none flex flex-col items-center justify-center text-center w-14 h-14 rounded-full border border-[#d4af37]/40 bg-[#120c07]/80 backdrop-blur-xs shadow-inner">
                <span class="text-[#d4af37] text-xs font-cinzel font-bold">AETHER</span>
                <span class="text-[9px] font-mono text-[#ffd700] font-black">{{ averageStat() }}</span>
              </div>
            }
          </div>

          <!-- Micro Legend & Cardinal Points Info -->
          <p class="text-[10px] font-serif text-[#8b6b43] text-center mt-2 italic">
            {{ displayMode() === 'radar'
                ? '✦ Diagramme à 4 axes cardinaux étalonné de 0 à 100 points de maîtrise. Survolez chaque sommet pour inspecter.'
                : '✦ Échelle héraldique graduée de 0 à 100 par palier de quart (25, 50, 75, 100).' }}
          </p>
        </div>

        <!-- Sidebar / Right Column: Detailed Attribute Folio Cards -->
        <div class="lg:col-span-5 space-y-2.5">
          <div class="flex items-center justify-between text-xs font-cinzel text-[#ffd700] border-b border-[#8b6b43]/30 pb-1.5">
            <span class="flex items-center gap-1 font-bold">
              <mat-icon class="text-xs">military_tech</mat-icon>
              Attributs de l’Espèce
            </span>
            <span class="text-[10px] font-serif text-[#a89070]">
              Dominance : <strong class="text-[#ffd700] font-cinzel">{{ dominantStatLabel() }}</strong>
            </span>
          </div>

          <!-- 4 Interactive Stat Cards with live values -->
          <div class="space-y-2">
            @for (st of statList(); track st.key) {
              <div
                role="button"
                tabindex="0"
                (mouseenter)="hoveredStat.set(st.key)"
                (mouseleave)="hoveredStat.set(null)"
                (click)="toggleHighlightStat(st.key)"
                (keydown.enter)="toggleHighlightStat(st.key)"
                class="p-2.5 rounded-xl border transition-all cursor-pointer select-none"
                [class.bg-[#23170e]]="hoveredStat() === st.key || activeHighlightedStat() === st.key"
                [class.border-[#ffd700]]="hoveredStat() === st.key || activeHighlightedStat() === st.key"
                [class.shadow-[0_0_12px_rgba(212,175,55,0.25)]]="hoveredStat() === st.key || activeHighlightedStat() === st.key"
                [class.bg-[#120c07]/80]="hoveredStat() !== st.key && activeHighlightedStat() !== st.key"
                [class.border-[#8b6b43]/40]="hoveredStat() !== st.key && activeHighlightedStat() !== st.key"
                [class.hover:border-[#8b6b43]]="hoveredStat() !== st.key && activeHighlightedStat() !== st.key">

                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <!-- Stat Icon & Rune Badge -->
                    <div
                      class="w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 text-xs font-mono font-bold"
                      [style.color]="st.color"
                      [style.border-color]="st.color + '66'"
                      [style.background]="st.color + '15'">
                      <mat-icon class="text-sm">{{ st.icon }}</mat-icon>
                    </div>

                    <div>
                      <div class="flex items-center gap-1.5">
                        <span class="font-cinzel text-xs font-black text-[#f5ebd9]">{{ st.label }}</span>
                        <span class="text-[9px] font-mono text-[#8b6b43]">{{ st.rune }}</span>
                      </div>
                      <span class="text-[10px] font-serif text-[#a89070] block leading-tight">
                        {{ getAppraisalLabel(st.value) }}
                      </span>
                    </div>
                  </div>

                  <!-- Numerical Value Badge with Rank -->
                  <div class="text-right">
                    <span
                      class="font-mono text-sm font-black"
                      [style.color]="st.color">
                      {{ st.value }}<span class="text-[10px] text-[#8b6b43]">/100</span>
                    </span>
                    <span class="block text-[8px] font-cinzel font-bold text-[#8b6b43] uppercase tracking-wider">
                      {{ getRankTier(st.value) }}
                    </span>
                  </div>
                </div>

                <!-- Horizontal Mini Bar Gauge -->
                <div class="mt-2 w-full h-1.5 bg-[#0a0704] border border-[#8b6b43]/40 rounded-full overflow-hidden p-0.2">
                  <div
                    class="h-full rounded-full transition-all duration-700 shadow-sm"
                    [style.background]="st.color"
                    [style.width.%]="st.value"></div>
                </div>

                <!-- Extended description (visible when hovered or selected) -->
                @if (hoveredStat() === st.key || activeHighlightedStat() === st.key) {
                  <p class="mt-2 text-[11px] font-serif text-[#e5d8be] leading-tight border-t border-[#8b6b43]/30 pt-1.5 animate-fadeIn">
                    {{ st.description }}
                  </p>
                }
              </div>
            }
          </div>

          <!-- Archivist Advice Quote on Creature Combat Profile -->
          <div class="bg-[#0e0905] border border-[#d4af37]/30 rounded-xl p-3 flex items-start gap-2.5">
            <mat-icon class="text-sm text-[#ffd700] shrink-0 mt-0.5">tips_and_updates</mat-icon>
            <div class="text-xs font-serif text-[#c5a880] leading-relaxed">
              <span class="text-[#ffd700] font-cinzel font-bold block text-[11px]">Note d’Archiviste Tactique :</span>
              <span>{{ getTacticalInsight() }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-3px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fadeIn {
      animation: fadeIn 0.2s ease-out forwards;
    }
  `]
})
export class BestiaryRadarChart {
  readonly monster = input<BestiaryEntry | null>(null);
  readonly customStats = input<MonsterStats | null>(null);

  readonly d3Root = viewChild<ElementRef<SVGGElement>>('d3Root');
  readonly svgContainer = viewChild<ElementRef<SVGSVGElement>>('svgContainer');

  readonly displayMode = signal<ChartDisplayMode>('radar');
  readonly hoveredStat = signal<keyof MonsterStats | null>(null);
  readonly activeHighlightedStat = signal<keyof MonsterStats | null>(null);

  // Resolved Stats with safe fallback
  readonly resolvedStats = computed<MonsterStats>(() => {
    const custom = this.customStats();
    if (custom) return custom;
    const m = this.monster();
    if (m?.stats) return m.stats;
    // Fallback baseline values based on dangerRating and threatRank
    const danger = m?.dangerRating ?? 3;
    const isBoss = m?.threatRank === 'boss' || m?.threatRank === 'mythic';
    const base = isBoss ? 75 : danger * 16;
    return {
      strength: base,
      defense: base + 5,
      magic: base + 10,
      speed: base - 5,
    };
  });

  // Average computation
  readonly averageStat = computed<number>(() => {
    const s = this.resolvedStats();
    return Math.round((s.strength + s.defense + s.magic + s.speed) / 4);
  });

  // Stat list combining descriptors + values
  readonly statList = computed(() => {
    const s = this.resolvedStats();
    return STAT_CONFIGS.map(cfg => ({
      ...cfg,
      value: s[cfg.key]
    }));
  });

  // Dominant stat determination
  readonly dominantStatLabel = computed<string>(() => {
    const list = this.statList();
    const top = [...list].sort((a, b) => b.value - a.value)[0];
    if (!top) return 'Polyvalent';
    if (top.key === 'strength') return 'Force Brute (Guerrier)';
    if (top.key === 'defense') return 'Rempart Inébranlable';
    if (top.key === 'magic') return 'Suprématie Arcanique';
    return 'Vélocité Furtive';
  });

  constructor() {
    // Effect to render or re-render whenever resolvedStats, displayMode, or hoveredStat changes
    effect(() => {
      const mode = this.displayMode();
      const stats = this.resolvedStats();
      const hovered = this.hoveredStat();
      const highlighted = this.activeHighlightedStat();
      const activeKey = hovered || highlighted;

      const rootEl = this.d3Root()?.nativeElement;
      if (!rootEl) return;

      if (mode === 'radar') {
        this.renderRadarChart(rootEl, stats, activeKey);
      } else {
        this.renderBarChart(rootEl, stats, activeKey);
      }
    });
  }

  setMode(mode: ChartDisplayMode) {
    this.displayMode.set(mode);
  }

  toggleHighlightStat(key: keyof MonsterStats) {
    this.activeHighlightedStat.update(current => (current === key ? null : key));
  }

  getAppraisalLabel(val: number): string {
    if (val >= 90) return 'Suprématie Primordiale';
    if (val >= 80) return 'Niveau Légendaire';
    if (val >= 65) return 'Redoutable & Élevé';
    if (val >= 45) return 'Moyen & Équilibré';
    return 'Modéré / Faiblesse';
  }

  getRankTier(val: number): string {
    if (val >= 90) return 'Rang S';
    if (val >= 80) return 'Rang A';
    if (val >= 65) return 'Rang B';
    if (val >= 45) return 'Rang C';
    return 'Rang D';
  }

  getTacticalInsight(): string {
    const s = this.resolvedStats();
    if (s.defense >= 85 && s.magic < 50) {
      return 'Carapace impénétrable aux lames. Utilisez la magie pure d’arcane ou de glace pour court-circuiter sa défense physique.';
    }
    if (s.magic >= 85) {
      return 'Puissance mystique colossale. Préparez des contre-sorts, des potions de dissipation et des protections élémentaires avant d’engager le duel.';
    }
    if (s.speed >= 85) {
      return 'Réflexes surnaturels. Évitez les frappes lentes et posez des pièges ou des créatures à Provocation pour canaliser ses assauts.';
    }
    if (s.strength >= 85) {
      return 'Frappe titanesque au corps à corps. Maintenez vos distances, déployez des serviteurs sacrifiables et usez d’attaques à distance.';
    }
    return 'Profil martial polyvalent : adaptez vos cartes en fonction de ses faiblesses élémentaires répertoriées au Bestiaire.';
  }

  // =========================================================================
  // D3 RADAR / ASTROLABE CHART RENDERING
  // =========================================================================
  private renderRadarChart(
    container: SVGGElement,
    stats: MonsterStats,
    activeKey: keyof MonsterStats | null
  ) {
    const root = d3.select(container);
    root.selectAll('*').remove();

    const cx = 170;
    const cy = 170;
    const radius = 100;
    const levels = 4; // 25, 50, 75, 100

    const axes: { key: keyof MonsterStats; angle: number; label: string; icon: string; color: string; rune: string }[] = [
      { key: 'strength', angle: -Math.PI / 2, label: 'Force', icon: 'swords', color: '#ef4444', rune: 'ᚠ' }, // Haut
      { key: 'defense', angle: 0, label: 'Défense', icon: 'shield', color: '#38bdf8', rune: 'ᛏ' },            // Droite
      { key: 'magic', angle: Math.PI / 2, label: 'Magie', icon: 'auto_fix_high', color: '#a855f7', rune: 'ᛗ' }, // Bas
      { key: 'speed', angle: Math.PI, label: 'Vitesse', icon: 'bolt', color: '#22c55e', rune: 'ᚱ' }             // Gauche
    ];

    // Background circle astrolabe backdrop
    root
      .append('circle')
      .attr('cx', cx)
      .attr('cy', cy)
      .attr('r', radius + 15)
      .attr('fill', 'url(#astrolabeBg)')
      .attr('stroke', '#8b6b43')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4,3')
      .attr('opacity', 0.85);

    // Concentric Web Polygons (Diamonds / 4-pointed stars)
    const romanLevels = ['XXV', 'L', 'LXXV', 'C'];
    for (let l = 1; l <= levels; l++) {
      const r = (radius / levels) * l;
      const pts = axes.map(a => {
        const x = cx + r * Math.cos(a.angle);
        const y = cy + r * Math.sin(a.angle);
        return `${x},${y}`;
      }).join(' ');

      // Web polygon
      root
        .append('polygon')
        .attr('points', pts)
        .attr('fill', l === levels ? 'rgba(212, 175, 55, 0.04)' : 'none')
        .attr('stroke', l === levels ? '#d4af37' : '#8b6b43')
        .attr('stroke-width', l === levels ? 1.5 : 0.75)
        .attr('stroke-dasharray', l === levels ? 'none' : '2,2')
        .attr('opacity', l === levels ? 0.9 : 0.55);

      // Level tick label along top axis (Strength)
      const tickY = cy - r;
      root
        .append('text')
        .attr('x', cx + 6)
        .attr('y', tickY + 3)
        .attr('fill', '#8b6b43')
        .attr('font-size', '8px')
        .attr('font-family', 'ui-monospace, monospace')
        .attr('opacity', 0.7)
        .text(romanLevels[l - 1]);
    }

    // Cardinal Axis Lines
    axes.forEach(a => {
      const xEnd = cx + (radius + 8) * Math.cos(a.angle);
      const yEnd = cy + (radius + 8) * Math.sin(a.angle);

      root
        .append('line')
        .attr('x1', cx)
        .attr('y1', cy)
        .attr('x2', xEnd)
        .attr('y2', yEnd)
        .attr('stroke', a.key === activeKey ? a.color : '#8b6b43')
        .attr('stroke-width', a.key === activeKey ? 2 : 1)
        .attr('stroke-dasharray', '3,2')
        .attr('opacity', a.key === activeKey ? 1 : 0.6);

      // Outer astrolabe tick pip
      root
        .append('circle')
        .attr('cx', xEnd)
        .attr('cy', yEnd)
        .attr('r', 2)
        .attr('fill', a.color)
        .attr('opacity', 0.8);
    });

    // Compute Monster Data Polygon Points
    const dataPoints = axes.map(a => {
      const val = Math.max(5, Math.min(100, stats[a.key]));
      const r = (radius * val) / 100;
      const x = cx + r * Math.cos(a.angle);
      const y = cy + r * Math.sin(a.angle);
      return { ...a, val, r, x, y };
    });

    const polygonStr = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

    // Radar Filled Area with Parchment Glow
    root
      .append('polygon')
      .attr('points', polygonStr)
      .attr('fill', 'url(#polygonRadarGrad)')
      .attr('stroke', '#ffd700')
      .attr('stroke-width', 2.2)
      .attr('stroke-linejoin', 'round')
      .attr('filter', 'url(#parchmentGlow)')
      .attr('opacity', 0.95);

    // Inner highlight polygon
    root
      .append('polygon')
      .attr('points', polygonStr)
      .attr('fill', 'none')
      .attr('stroke', '#fff8db')
      .attr('stroke-width', 1)
      .attr('opacity', 0.6);

    // Interactive Vertices (Gems / Data Points)
    dataPoints.forEach(p => {
      const isHighlighted = p.key === activeKey;

      // Glow Halo if active
      if (isHighlighted) {
        root
          .append('circle')
          .attr('cx', p.x)
          .attr('cy', p.y)
          .attr('r', 11)
          .attr('fill', p.color)
          .attr('opacity', 0.3)
          .attr('class', 'animate-pulse');
      }

      // Outer Gem Ring
      root
        .append('circle')
        .attr('cx', p.x)
        .attr('cy', p.y)
        .attr('r', isHighlighted ? 6.5 : 4.5)
        .attr('fill', '#140e08')
        .attr('stroke', p.color)
        .attr('stroke-width', 2)
        .style('cursor', 'pointer')
        .on('mouseenter', () => this.hoveredStat.set(p.key))
        .on('mouseleave', () => this.hoveredStat.set(null))
        .on('click', () => this.toggleHighlightStat(p.key));

      // Inner Gem Core
      root
        .append('circle')
        .attr('cx', p.x)
        .attr('cy', p.y)
        .attr('r', isHighlighted ? 3 : 2)
        .attr('fill', '#ffffff')
        .style('pointer-events', 'none');

      // Value label next to vertex
      const labelOffset = 14;
      const lx = p.x + labelOffset * Math.cos(p.angle);
      const ly = p.y + labelOffset * Math.sin(p.angle);

      root
        .append('text')
        .attr('x', lx)
        .attr('y', ly + 4)
        .attr('text-anchor', 'middle')
        .attr('fill', isHighlighted ? '#ffffff' : '#ffd700')
        .attr('font-size', '10px')
        .attr('font-weight', 'bold')
        .attr('font-family', 'ui-monospace, monospace')
        .attr('stroke', '#0c0704')
        .attr('stroke-width', 2.5)
        .attr('paint-order', 'stroke')
        .text(p.val);
    });

    // Cardinal Axis Labels with Medieval Typography
    axes.forEach(a => {
      const dist = radius + 32;
      const lx = cx + dist * Math.cos(a.angle);
      const ly = cy + dist * Math.sin(a.angle);
      const isHighlighted = a.key === activeKey;

      const group = root
        .append('g')
        .attr('transform', `translate(${lx}, ${ly})`)
        .style('cursor', 'pointer')
        .on('mouseenter', () => this.hoveredStat.set(a.key))
        .on('mouseleave', () => this.hoveredStat.set(null))
        .on('click', () => this.toggleHighlightStat(a.key));

      // Text label
      group
        .append('text')
        .attr('x', 0)
        .attr('y', a.angle === Math.PI / 2 ? 10 : a.angle === -Math.PI / 2 ? -8 : 3)
        .attr('text-anchor', 'middle')
        .attr('fill', isHighlighted ? '#ffffff' : a.color)
        .attr('font-size', isHighlighted ? '12px' : '11px')
        .attr('font-weight', '900')
        .attr('font-family', 'Cinzel, Georgia, serif')
        .attr('letter-spacing', '0.05em')
        .text(`${a.rune} ${a.label.toUpperCase()}`);
    });
  }

  // =========================================================================
  // D3 HERALDIC BAR CHART RENDERING
  // =========================================================================
  private renderBarChart(
    container: SVGGElement,
    stats: MonsterStats,
    activeKey: keyof MonsterStats | null
  ) {
    const root = d3.select(container);
    root.selectAll('*').remove();

    const barHeight = 22;
    const rowGap = 38;
    const startX = 65;
    const startY = 60;
    const maxBarWidth = 190;

    const data: { key: keyof MonsterStats; label: string; val: number; color: string; grad: string; icon: string; rune: string }[] = [
      { key: 'strength', label: 'Force', val: stats.strength, color: '#ef4444', grad: 'url(#barGradStrength)', icon: 'swords', rune: 'ᚠ' },
      { key: 'defense', label: 'Défense', val: stats.defense, color: '#38bdf8', grad: 'url(#barGradDefense)', icon: 'shield', rune: 'ᛏ' },
      { key: 'magic', label: 'Magie', val: stats.magic, color: '#a855f7', grad: 'url(#barGradMagic)', icon: 'auto_fix_high', rune: 'ᛗ' },
      { key: 'speed', label: 'Vitesse', val: stats.speed, color: '#22c55e', grad: 'url(#barGradSpeed)', icon: 'bolt', rune: 'ᚱ' }
    ];

    // Background guide grid lines at 25, 50, 75, 100
    [25, 50, 75, 100].forEach(tick => {
      const xPos = startX + (maxBarWidth * tick) / 100;

      root
        .append('line')
        .attr('x1', xPos)
        .attr('y1', 35)
        .attr('x2', xPos)
        .attr('y2', startY + rowGap * 4 - 8)
        .attr('stroke', '#8b6b43')
        .attr('stroke-width', 0.75)
        .attr('stroke-dasharray', '2,3')
        .attr('opacity', 0.4);

      root
        .append('text')
        .attr('x', xPos)
        .attr('y', 30)
        .attr('text-anchor', 'middle')
        .attr('fill', '#8b6b43')
        .attr('font-size', '8px')
        .attr('font-family', 'ui-monospace, monospace')
        .text(tick === 100 ? '100 Max' : tick.toString());
    });

    // Render each bar row
    data.forEach((d, i) => {
      const y = startY + i * rowGap;
      const isHighlighted = d.key === activeKey;
      const barW = (maxBarWidth * Math.max(4, Math.min(100, d.val))) / 100;

      const rowGroup = root
        .append('g')
        .style('cursor', 'pointer')
        .on('mouseenter', () => this.hoveredStat.set(d.key))
        .on('mouseleave', () => this.hoveredStat.set(null))
        .on('click', () => this.toggleHighlightStat(d.key));

      // Label with rune
      rowGroup
        .append('text')
        .attr('x', startX - 10)
        .attr('y', y + barHeight / 2 + 4)
        .attr('text-anchor', 'end')
        .attr('fill', isHighlighted ? '#ffffff' : d.color)
        .attr('font-size', '11px')
        .attr('font-weight', '900')
        .attr('font-family', 'Cinzel, Georgia, serif')
        .text(`${d.rune} ${d.label}`);

      // Bar Background Track (Stone / aged parchment)
      rowGroup
        .append('rect')
        .attr('x', startX)
        .attr('y', y)
        .attr('width', maxBarWidth)
        .attr('height', barHeight)
        .attr('rx', 6)
        .attr('fill', '#0c0804')
        .attr('stroke', isHighlighted ? '#ffd700' : '#8b6b43')
        .attr('stroke-width', 1)
        .attr('opacity', 0.85);

      // Active Value Fill Bar with gradient
      rowGroup
        .append('rect')
        .attr('x', startX + 1)
        .attr('y', y + 1)
        .attr('width', barW - 2)
        .attr('height', barHeight - 2)
        .attr('rx', 5)
        .attr('fill', d.grad)
        .attr('stroke', isHighlighted ? '#ffffff' : d.color)
        .attr('stroke-width', isHighlighted ? 1.5 : 0.75)
        .attr('filter', isHighlighted ? 'url(#parchmentGlow)' : 'none');

      // Value Counter inside or next to the bar
      rowGroup
        .append('text')
        .attr('x', startX + maxBarWidth + 12)
        .attr('y', y + barHeight / 2 + 4)
        .attr('text-anchor', 'start')
        .attr('fill', isHighlighted ? '#ffffff' : '#ffd700')
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .attr('font-family', 'ui-monospace, monospace')
        .text(`${d.val}`);
    });
  }
}
