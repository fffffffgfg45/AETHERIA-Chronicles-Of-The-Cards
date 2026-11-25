import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import * as d3 from 'd3';
import { BestiaryEntry, ThreatRank } from '../../models/game.model';
import { SoundService } from '../../services/sound';

export type ExplorationRadarMode = 'zones' | 'rarity';

export interface ExploredZoneStat {
  id: string;
  name: string;
  shortName: string;
  icon: string;
  description: string;
  entries: BestiaryEntry[];
  totalCount: number;
  discoveredCount: number;
  masteredCount: number;
  discoveryPct: number;
  rarityCounts: Record<ThreatRank, { total: number; discovered: number }>;
}

export interface RarityDistributionItem {
  rank: ThreatRank;
  label: string;
  color: string;
  totalCount: number;
  discoveredCount: number;
  pctOfDiscovered: number;
  discoveryRatePct: number;
}

interface ZoneDefinition {
  id: string;
  name: string;
  shortName: string;
  icon: string;
  description: string;
}

const ZONE_DEFINITIONS: ZoneDefinition[] = [
  {
    id: 'crypts',
    name: 'Cryptes de Mortebreche',
    shortName: 'Cryptes',
    icon: 'coronavirus',
    description: 'Mausolées maudits, portails d’obsidienne et couloirs souterrains.',
  },
  {
    id: 'wilds',
    name: 'Sylve & Marécages',
    shortName: 'Sylve & Marais',
    icon: 'forest',
    description: 'Bosquets murmurants et eaux putrides de Bourbe-Noire.',
  },
  {
    id: 'citadel',
    name: 'Citadelle & Remparts',
    shortName: 'Citadelle',
    icon: 'castle',
    description: 'Remparts de Bois-Doran et Sanctuaire Solaire d’Aetheria.',
  },
  {
    id: 'peaks',
    name: 'Pics & Ruines Solaires',
    shortName: 'Pics & Ruines',
    icon: 'terrain',
    description: 'Ruines du Soleil Couchant et Gouffres d’Astral Peak.',
  },
  {
    id: 'rifts',
    name: 'Failles & Cratères',
    shortName: 'Failles & Cratères',
    icon: 'local_fire_department',
    description: 'Brèche de Soufre, Forges d’Ignis et Failles du Néant.',
  },
];

const RARITY_CONFIG: { rank: ThreatRank; label: string; color: string }[] = [
  { rank: 'normal', label: 'Normal', color: '#94a3b8' },
  { rank: 'elite', label: 'Élite', color: '#c084fc' },
  { rank: 'boss', label: 'Boss', color: '#fb923c' },
  { rank: 'mythic', label: 'Mythique', color: '#f43f5e' },
];

@Component({
  selector: 'app-bestiary-exploration-radar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <section class="bg-[#120d09] border border-[#8b6b43]/60 rounded-2xl p-5 md:p-6 shadow-2xl space-y-5">
      <!-- Header & Mode Controls -->
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#8b6b43]/35 pb-4">
        <div class="space-y-1">
          <div class="flex flex-wrap items-center gap-2 text-xs font-cinzel text-[#8b6b43]">
            <span>Cartographie du Scriptorium</span>
            <span aria-hidden="true">·</span>
            <span class="font-mono tabular-nums text-[#d4af37]">
              {{ totalDiscovered() }} / {{ entries().length }} espèces découvertes
            </span>
            <span aria-hidden="true">·</span>
            <span class="font-mono tabular-nums text-emerald-400">
              {{ exploredZonesWithDiscoveries() }} / {{ zoneStats().length }} zones explorées
            </span>
          </div>
          <h2 class="font-cinzel text-lg md:text-xl font-black text-[#f0e4cb] flex items-center gap-2">
            <mat-icon class="text-xl text-[#d4af37]">radar</mat-icon>
            <span>Radar des Zones Explorées &amp; Rareté des Monstres</span>
          </h2>
        </div>

        <div class="inline-flex items-center gap-1 p-1 bg-[#0a0705] border border-[#3a2f23] rounded-xl self-start lg:self-auto">
          <button
            type="button"
            (click)="setRadarMode('zones')"
            class="px-3.5 py-2 rounded-lg text-xs font-cinzel font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            [class.bg-[#2a1d12]]="radarMode() === 'zones'"
            [class.text-[#ffd700]]="radarMode() === 'zones'"
            [class.text-[#8b6b43]]="radarMode() !== 'zones'"
            [class.hover:text-[#c5a880]]="radarMode() !== 'zones'">
            <mat-icon class="text-sm">explore</mat-icon>
            <span>Zones Explorées</span>
          </button>

          <button
            type="button"
            (click)="setRadarMode('rarity')"
            class="px-3.5 py-2 rounded-lg text-xs font-cinzel font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            [class.bg-[#2a1d12]]="radarMode() === 'rarity'"
            [class.text-[#ffd700]]="radarMode() === 'rarity'"
            [class.text-[#8b6b43]]="radarMode() !== 'rarity'"
            [class.hover:text-[#c5a880]]="radarMode() !== 'rarity'">
            <mat-icon class="text-sm">auto_awesome</mat-icon>
            <span>Distribution Rareté</span>
          </button>
        </div>
      </div>

      <!-- Main Radar + Analytical Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">

        <!-- LEFT: D3 Radar Visualization + Rarity Legend -->
        <div class="lg:col-span-5 flex flex-col items-center space-y-3">
          <div class="w-full max-w-[350px] aspect-square relative flex items-center justify-center">
            <svg
              viewBox="0 0 360 360"
              class="w-full h-full overflow-visible select-none"
              role="img"
              aria-label="Radar de distribution des monstres découverts par zones et par rareté">
              <defs>
                <radialGradient id="bestiaryExplorationBg" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stop-color="#2a1d11" stop-opacity="0.45" />
                  <stop offset="70%" stop-color="#140d08" stop-opacity="0.7" />
                  <stop offset="100%" stop-color="#090604" stop-opacity="0.95" />
                </radialGradient>
                <linearGradient id="explorationPolygonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#10b981" stop-opacity="0.52" />
                  <stop offset="55%" stop-color="#d4af37" stop-opacity="0.38" />
                  <stop offset="100%" stop-color="#f59e0b" stop-opacity="0.48" />
                </linearGradient>
                <linearGradient id="rarityPolygonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#c084fc" stop-opacity="0.48" />
                  <stop offset="50%" stop-color="#fb923c" stop-opacity="0.42" />
                  <stop offset="100%" stop-color="#f43f5e" stop-opacity="0.52" />
                </linearGradient>
              </defs>
              <g #radarRoot></g>
            </svg>

            <!-- Center Medallion -->
            <div class="absolute pointer-events-none w-16 h-16 rounded-full bg-[#120d09]/90 border border-[#d4af37]/50 flex flex-col items-center justify-center text-center shadow-inner">
              <span class="font-mono text-sm font-black text-[#ffd700] tabular-nums">
                {{ overallDiscoveryPct() }}%
              </span>
              <span class="text-[9px] font-cinzel text-[#8b6b43]">Recensés</span>
            </div>
          </div>

          <!-- Rarity Blip Legend -->
          <div class="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px] font-cinzel text-[#c5a880]">
            @for (item of rarityDistribution(); track item.rank) {
              <div
                tabindex="0"
                [attr.aria-label]="item.label + ' — ' + getRankDropRangeLabel(item.rank)"
                class="bestiary-rarity-trigger relative group/rarity flex items-center gap-1 cursor-help">
                <mat-icon
                  class="bestiary-rarity-icon text-xs"
                  [style.color]="item.color">{{ getRarityIcon(item.rank) }}</mat-icon>
                <span>{{ item.label }}</span>

                <div class="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 p-2.5 rounded-xl bg-[#120d09]/95 border border-[#8b6b43] shadow-2xl z-50 opacity-0 pointer-events-none group-hover/rarity:opacity-100 group-focus-within/rarity:opacity-100 transition-opacity duration-200 backdrop-blur-md text-left space-y-1">
                  <div class="text-[10px] font-cinzel font-bold" [style.color]="item.color">
                    Rang {{ item.label }}
                  </div>
                  <div class="text-[10px] font-serif text-[#e0dcc7] leading-snug">
                    {{ getRankDropRangeLabel(item.rank) }}
                  </div>
                </div>
              </div>
            }
            <span class="text-[#8b6b43]">·</span>
            <span class="text-[#8b6b43] text-[10px]">Plein : découvert · Cercle : inconnu</span>
          </div>
        </div>

        <!-- RIGHT: Rarity Distribution Bars + Selected Explored Zone Detail -->
        <div class="lg:col-span-7 space-y-5">

          <!-- Rarity Distribution of Discovered Monsters -->
          <div class="bg-[#0e0a07] border border-[#3a2f23] rounded-xl p-4 space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <h3 class="font-cinzel text-xs font-bold text-[#ffd700] uppercase tracking-wider">
                Rareté des Monstres Découverts
              </h3>
              @if (activeThreatFilter() !== 'all') {
                <button
                  type="button"
                  (click)="selectThreatFilter('all')"
                  class="text-[11px] font-cinzel font-semibold text-[#d4af37] hover:text-[#ffd700] flex items-center gap-1">
                  <mat-icon class="text-xs">filter_alt_off</mat-icon>
                  <span>Réinitialiser le filtre</span>
                </button>
              } @else {
                <span class="text-[11px] text-[#8b6b43]">Cliquez un rang pour filtrer le codex</span>
              }
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              @for (item of rarityDistribution(); track item.rank) {
                @let isSelectedThreat = activeThreatFilter() === item.rank;
                <button
                  type="button"
                  (click)="toggleThreatFilter(item.rank)"
                  class="bestiary-rarity-trigger text-left p-2.5 rounded-xl border transition-colors space-y-1.5"
                  [class.bg-[#1f160f]]="isSelectedThreat"
                  [class.border-[#d4af37]]="isSelectedThreat"
                  [class.bg-[#140e09]]="!isSelectedThreat"
                  [class.border-[#3a2f23]]="!isSelectedThreat"
                  [class.hover:border-[#8b6b43]]="!isSelectedThreat">
                  <div class="flex items-center justify-between gap-2 text-xs">
                    <span class="font-cinzel font-bold flex items-center gap-1.5" [style.color]="item.color">
                      <mat-icon class="bestiary-rarity-icon text-sm" [style.color]="item.color">{{ getRarityIcon(item.rank) }}</mat-icon>
                      <span>{{ item.label }}</span>
                    </span>
                    <span class="font-mono font-bold text-[#e0dcc7] tabular-nums">
                      {{ item.discoveredCount }} / {{ item.totalCount }}
                      <span class="text-[10px] text-[#8b6b43]">({{ item.pctOfDiscovered }}% part)</span>
                    </span>
                  </div>
                  <div class="w-full h-2 bg-[#080604] rounded-full overflow-hidden border border-[#3a2f23]/70">
                    <div
                      class="h-full rounded-full transition-all duration-500 ease-out"
                      [style.backgroundColor]="item.color"
                      [style.width.%]="item.discoveryRatePct">
                    </div>
                  </div>
                </button>
              }
            </div>
          </div>

          <!-- Explored Zones Selector & Breakdown -->
          <div class="bg-[#0e0a07] border border-[#3a2f23] rounded-xl p-4 space-y-3.5">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <h3 class="font-cinzel text-xs font-bold text-[#ffd700] uppercase tracking-wider">
                Distribution par Zones Explorées
              </h3>
              <span class="text-[11px] font-mono text-[#8b6b43] tabular-nums">
                {{ selectedZone().discoveredCount }} / {{ selectedZone().totalCount }} espèces recensées ici
              </span>
            </div>

            <!-- Zone Tabs -->
            <div class="flex flex-wrap gap-1.5">
              @for (z of zoneStats(); track z.id) {
                @let isSelectedZone = selectedZone().id === z.id;
                <button
                  type="button"
                  (click)="selectZone(z.id)"
                  class="px-3 py-1.5 rounded-lg border text-xs font-cinzel font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                  [class.bg-[#2a1d12]]="isSelectedZone"
                  [class.border-[#d4af37]]="isSelectedZone"
                  [class.text-[#ffd700]]="isSelectedZone"
                  [class.bg-[#140e09]]="!isSelectedZone"
                  [class.border-[#3a2f23]]="!isSelectedZone"
                  [class.text-[#c5a880]]="!isSelectedZone"
                  [class.hover:border-[#8b6b43]]="!isSelectedZone">
                  <mat-icon class="text-xs">{{ z.icon }}</mat-icon>
                  <span>{{ z.shortName }}</span>
                  <span class="font-mono text-[10px] tabular-nums text-[#8b6b43]">
                    {{ z.discoveredCount }}/{{ z.totalCount }}
                  </span>
                </button>
              }
            </div>

            <!-- Active Zone Summary & Monsters -->
            @let zone = selectedZone();
            <div class="pt-2 border-t border-[#3a2f23]/70 space-y-3">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div class="font-cinzel text-sm font-bold text-[#e0dcc7]">{{ zone.name }}</div>
                  <p class="text-xs text-[#8b6b43]">{{ zone.description }}</p>
                </div>
                <div class="font-mono text-xs font-black tabular-nums shrink-0"
                  [class.text-emerald-400]="zone.discoveryPct === 100"
                  [class.text-[#d4af37]]="zone.discoveryPct < 100">
                  {{ zone.discoveryPct }}% explorée
                </div>
              </div>

              <!-- Zone Monsters List -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                @for (mon of zone.entries; track mon.id) {
                  @let isKnown = mon.discoveryStatus !== 'undiscovered';
                  <button
                    type="button"
                    (click)="inspectMonster(mon.id)"
                    [title]="getMonsterDropSummaryText(mon)"
                    class="bestiary-rarity-trigger relative group/rarity p-2.5 rounded-xl border text-left transition-colors flex items-center justify-between gap-2.5 hover:z-30 focus-visible:z-30"
                    [class.bg-[#16100b]]="isKnown"
                    [class.border-[#3a2f23]]="isKnown"
                    [class.hover:border-[#d4af37]]="isKnown"
                    [class.bg-[#0b0805]]="!isKnown"
                    [class.border-[#2a2118]]="!isKnown"
                    [class.hover:border-[#8b6b43]]="!isKnown">
                    <div class="flex items-center gap-2.5 min-w-0">
                      <mat-icon
                        class="bestiary-rarity-icon text-sm shrink-0"
                        [style.color]="getRarityColor(mon.threatRank)">{{ getRarityIcon(mon.threatRank) }}</mat-icon>
                      <div class="min-w-0">
                        <div class="font-cinzel text-xs font-bold truncate"
                          [class.text-[#e0dcc7]]="isKnown"
                          [class.text-[#8b6b43]]="!isKnown">
                          {{ isKnown ? mon.name : 'Spécimen inconnu' }}
                        </div>
                        <div class="text-[10px] font-mono text-[#8b6b43] tabular-nums">
                          {{ getRarityLabel(mon.threatRank) }} · {{ isKnown ? mon.encountersCount + ' rencontre(s)' : 'Drop max ' + getMonsterBestDropPct(mon) + '%' }}
                        </div>
                      </div>
                    </div>
                    <mat-icon class="text-sm text-[#8b6b43] shrink-0">arrow_forward</mat-icon>

                    <!-- Hover Drop Rate Tooltip -->
                    <div class="absolute left-0 bottom-full mb-1.5 w-60 p-2.5 rounded-xl bg-[#120d09]/95 border border-[#8b6b43] shadow-2xl z-50 opacity-0 pointer-events-none group-hover/rarity:opacity-100 group-focus-visible/rarity:opacity-100 transition-opacity duration-200 backdrop-blur-md space-y-1">
                      <div class="flex items-center justify-between text-[10px] font-cinzel font-bold border-b border-[#8b6b43]/30 pb-1">
                        <span [style.color]="getRarityColor(mon.threatRank)">{{ getRarityLabel(mon.threatRank) }}</span>
                        <span class="font-mono text-emerald-400 tabular-nums">Drop max {{ getMonsterBestDropPct(mon) }}%</span>
                      </div>
                      @if (isKnown) {
                        @for (drop of mon.drops; track drop.id) {
                          <div class="flex items-center justify-between gap-2 text-[10px]">
                            <span class="truncate font-serif text-[#f0e4cb]">{{ drop.name }}</span>
                            <span class="font-mono font-bold text-[#ffd700] tabular-nums shrink-0">{{ drop.dropChancePct }}%</span>
                          </div>
                        }
                      } @else {
                        <p class="text-[10px] font-serif text-[#a89070] leading-snug">
                          Taux de butin estimé jusqu'à {{ getMonsterBestDropPct(mon) }}%.
                        </p>
                      }
                    </div>
                  </button>
                }
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  `,
})
export class BestiaryExplorationRadar {
  private readonly sound = inject(SoundService);

  readonly entries = input.required<BestiaryEntry[]>();
  readonly activeThreatFilter = input<ThreatRank | 'all'>('all');

  readonly monsterSelected = output<string>();
  readonly threatFilterSelected = output<ThreatRank | 'all'>();

  readonly radarMode = signal<ExplorationRadarMode>('zones');
  readonly selectedZoneId = signal<string>('crypts');

  readonly radarRoot = viewChild<ElementRef<SVGGElement>>('radarRoot');

  readonly totalDiscovered = computed(() =>
    this.entries().filter(e => e.discoveryStatus !== 'undiscovered').length
  );

  readonly overallDiscoveryPct = computed(() => {
    const total = this.entries().length;
    if (total === 0) return 0;
    return Math.round((this.totalDiscovered() / total) * 100);
  });

  readonly zoneStats = computed<ExploredZoneStat[]>(() => {
    const list = this.entries();

    return ZONE_DEFINITIONS.map(def => {
      const zoneEntries = list.filter(entry => this.classifyHabitatZone(entry.habitat) === def.id);
      const discovered = zoneEntries.filter(e => e.discoveryStatus !== 'undiscovered');
      const mastered = zoneEntries.filter(e => e.isMastered || e.discoveryStatus === 'mastered');

      const rarityCounts: Record<ThreatRank, { total: number; discovered: number }> = {
        normal: { total: 0, discovered: 0 },
        elite: { total: 0, discovered: 0 },
        boss: { total: 0, discovered: 0 },
        mythic: { total: 0, discovered: 0 },
      };

      for (const mon of zoneEntries) {
        rarityCounts[mon.threatRank].total += 1;
        if (mon.discoveryStatus !== 'undiscovered') {
          rarityCounts[mon.threatRank].discovered += 1;
        }
      }

      const totalCount = zoneEntries.length;
      const discoveredCount = discovered.length;
      const discoveryPct = totalCount > 0 ? Math.round((discoveredCount / totalCount) * 100) : 0;

      return {
        ...def,
        entries: zoneEntries,
        totalCount,
        discoveredCount,
        masteredCount: mastered.length,
        discoveryPct,
        rarityCounts,
      };
    });
  });

  readonly exploredZonesWithDiscoveries = computed(() =>
    this.zoneStats().filter(z => z.discoveredCount > 0).length
  );

  readonly selectedZone = computed<ExploredZoneStat>(() => {
    const stats = this.zoneStats();
    return stats.find(z => z.id === this.selectedZoneId()) ?? stats[0];
  });

  readonly rarityDistribution = computed<RarityDistributionItem[]>(() => {
    const list = this.entries();
    const totalDiscoveredAll = Math.max(1, this.totalDiscovered());

    return RARITY_CONFIG.map(cfg => {
      const matching = list.filter(m => m.threatRank === cfg.rank);
      const discovered = matching.filter(m => m.discoveryStatus !== 'undiscovered');
      const totalCount = matching.length;
      const discoveredCount = discovered.length;
      const pctOfDiscovered = Math.round((discoveredCount / totalDiscoveredAll) * 100);
      const discoveryRatePct = totalCount > 0 ? Math.round((discoveredCount / totalCount) * 100) : 0;

      return {
        rank: cfg.rank,
        label: cfg.label,
        color: cfg.color,
        totalCount,
        discoveredCount,
        pctOfDiscovered,
        discoveryRatePct,
      };
    });
  });

  constructor() {
    effect(() => {
      const rootRef = this.radarRoot();
      const mode = this.radarMode();
      const zones = this.zoneStats();
      const rarity = this.rarityDistribution();
      const activeZone = this.selectedZoneId();

      if (!rootRef || typeof window === 'undefined') return;
      this.renderRadarSvg(rootRef.nativeElement, mode, zones, rarity, activeZone);
    });
  }

  setRadarMode(mode: ExplorationRadarMode) {
    this.radarMode.set(mode);
    this.sound.playClick();
  }

  selectZone(zoneId: string) {
    this.selectedZoneId.set(zoneId);
    this.sound.playClick();
  }

  inspectMonster(monsterId: string) {
    this.monsterSelected.emit(monsterId);
  }

  selectThreatFilter(rank: ThreatRank | 'all') {
    this.threatFilterSelected.emit(rank);
  }

  toggleThreatFilter(rank: ThreatRank) {
    const next = this.activeThreatFilter() === rank ? 'all' : rank;
    this.threatFilterSelected.emit(next);
  }

  getRarityColor(rank: ThreatRank): string {
    return RARITY_CONFIG.find(r => r.rank === rank)?.color ?? '#94a3b8';
  }

  getRarityLabel(rank: ThreatRank): string {
    return RARITY_CONFIG.find(r => r.rank === rank)?.label ?? rank;
  }

  getRarityIcon(rank: ThreatRank): string {
    switch (rank) {
      case 'mythic': return 'auto_awesome';
      case 'boss': return 'local_fire_department';
      case 'elite': return 'star';
      case 'normal': return 'shield';
      default: return 'shield';
    }
  }

  getMonsterBestDropPct(mon: BestiaryEntry): number {
    if (!mon.drops || mon.drops.length === 0) return 0;
    return Math.max(...mon.drops.map(d => d.dropChancePct));
  }

  getMonsterDropSummaryText(mon: BestiaryEntry): string {
    const label = this.getRarityLabel(mon.threatRank);
    if (mon.discoveryStatus === 'undiscovered') {
      return `Rareté ${label} — Taux de drop estimé jusqu'à ${this.getMonsterBestDropPct(mon)}%`;
    }
    const drops = mon.drops.map(d => `${d.name} (${d.dropChancePct}%)`).join(', ');
    return `${mon.name} (${label}) — Taux de drop : ${drops}`;
  }

  getRankDropRangeLabel(rank: ThreatRank): string {
    const matching = this.entries().filter(m => m.threatRank === rank);
    const rates = matching.flatMap(m => m.drops.map(d => d.dropChancePct));
    if (rates.length === 0) return 'Aucun taux de drop connu.';
    const min = Math.min(...rates);
    const max = Math.max(...rates);
    const avg = Math.round(rates.reduce((a, b) => a + b, 0) / rates.length);
    return `Taux de drop : ${min}% – ${max}% (moy. ${avg}%)`;
  }

  private classifyHabitatZone(habitat: string): string {
    const h = habitat.toLowerCase();
    if (h.includes('crypte') || h.includes('catacombe') || h.includes('mortebreche')) {
      return 'crypts';
    }
    if (h.includes('bosquet') || h.includes('sylve') || h.includes('marécage') || h.includes('bourbe')) {
      return 'wilds';
    }
    if (h.includes('bois-doran') || h.includes('sanctuaire') || h.includes('donjon')) {
      return 'citadel';
    }
    if (h.includes('ruines') || h.includes('soleil') || h.includes('gouffre') || h.includes('astral')) {
      return 'peaks';
    }
    return 'rifts';
  }

  private renderRadarSvg(
    rootEl: SVGGElement,
    mode: ExplorationRadarMode,
    zones: ExploredZoneStat[],
    rarity: RarityDistributionItem[],
    activeZoneId: string
  ) {
    const svg = d3.select(rootEl);
    svg.selectAll('*').remove();

    const cx = 180;
    const cy = 180;
    const maxRadius = 112;
    const levels = [0.25, 0.5, 0.75, 1];

    const g = svg.append('g').attr('transform', `translate(${cx}, ${cy})`);

    // Concentric Astrolabe Background Circle
    g.append('circle')
      .attr('r', maxRadius + 8)
      .attr('fill', 'url(#bestiaryExplorationBg)')
      .attr('stroke', '#8b6b43')
      .attr('stroke-opacity', 0.45)
      .attr('stroke-width', 1.2);

    if (mode === 'zones') {
      const n = zones.length;
      const angleSlice = (Math.PI * 2) / n;
      const getAngle = (i: number) => i * angleSlice - Math.PI / 2;

      // Polygon concentric grid rings
      levels.forEach(lvl => {
        const r = maxRadius * lvl;
        const ringPoints = zones.map((_, i) => {
          const a = getAngle(i);
          return [Math.cos(a) * r, Math.sin(a) * r] as [number, number];
        });
        g.append('polygon')
          .attr('points', ringPoints.map(p => p.join(',')).join(' '))
          .attr('fill', 'none')
          .attr('stroke', lvl === 1 ? '#d4af37' : '#8b6b43')
          .attr('stroke-opacity', lvl === 1 ? 0.6 : 0.3)
          .attr('stroke-width', lvl === 1 ? 1.4 : 0.9)
          .attr('stroke-dasharray', lvl < 1 ? '3,3' : null);
      });

      // Discovered ratio polygon (rendered behind blips & vertices)
      const discoveryPoints = zones.map((zone, i) => {
        const ratio = zone.totalCount > 0 ? Math.max(0.14, zone.discoveredCount / zone.totalCount) : 0.14;
        const r = maxRadius * ratio;
        const a = getAngle(i);
        return [Math.cos(a) * r, Math.sin(a) * r] as [number, number];
      });

      g.append('polygon')
        .attr('points', discoveryPoints.map(p => p.join(',')).join(' '))
        .attr('fill', 'url(#explorationPolygonGrad)')
        .attr('stroke', '#10b981')
        .attr('stroke-width', 2);

      // Radial axes, monster blips & interactive zone labels
      zones.forEach((zone, i) => {
        const a = getAngle(i);
        const xEnd = Math.cos(a) * maxRadius;
        const yEnd = Math.sin(a) * maxRadius;
        const isSelected = zone.id === activeZoneId;

        g.append('line')
          .attr('x1', 0)
          .attr('y1', 0)
          .attr('x2', xEnd)
          .attr('y2', yEnd)
          .attr('stroke', isSelected ? '#ffd700' : '#8b6b43')
          .attr('stroke-opacity', isSelected ? 0.9 : 0.45)
          .attr('stroke-width', isSelected ? 2 : 1);

        // Plot each monster in this zone as a rarity-colored radar blip around the axis
        zone.entries.forEach((mon, mIdx) => {
          const isDiscovered = mon.discoveryStatus !== 'undiscovered';
          const spreadAngle = (mIdx - (zone.entries.length - 1) / 2) * 0.22;
          const blipAngle = a + spreadAngle;
          const baseRadius = isDiscovered
            ? maxRadius * (0.48 + ((mIdx % 3) * 0.16))
            : maxRadius * 0.88;
          const bx = Math.cos(blipAngle) * baseRadius;
          const by = Math.sin(blipAngle) * baseRadius;
          const color = this.getRarityColor(mon.threatRank);

          const blip = g
            .append('circle')
            .attr('cx', bx)
            .attr('cy', by)
            .attr('r', isDiscovered ? 5.5 : 4.5)
            .attr('fill', isDiscovered ? color : '#0c0805')
            .attr('stroke', color)
            .attr('stroke-width', 1.5)
            .attr('stroke-dasharray', isDiscovered ? null : '2,2')
            .style('cursor', 'pointer');

          blip.append('title').text(
            isDiscovered
              ? `${mon.name} (${this.getRarityLabel(mon.threatRank)}) — Drop max : ${this.getMonsterBestDropPct(mon)}% — ${zone.name}`
              : `Spécimen inconnu (${this.getRarityLabel(mon.threatRank)}) — Drop estimé : ${this.getMonsterBestDropPct(mon)}% — ${zone.name}`
          );

          blip.on('click', () => {
            this.selectedZoneId.set(zone.id);
            this.monsterSelected.emit(mon.id);
          });
        });

        // Zone label outside vertex
        const labelRadius = maxRadius + 28;
        const lx = Math.cos(a) * labelRadius;
        const ly = Math.sin(a) * labelRadius;

        const labelGroup = g
          .append('g')
          .attr('transform', `translate(${lx}, ${ly})`)
          .style('cursor', 'pointer')
          .on('click', () => this.selectZone(zone.id));

        labelGroup
          .append('text')
          .attr('text-anchor', 'middle')
          .attr('dy', '-0.15em')
          .attr('fill', isSelected ? '#ffd700' : '#e0dcc7')
          .attr('font-size', '10.5px')
          .attr('font-family', 'Cinzel, serif')
          .attr('font-weight', '700')
          .text(zone.shortName);

        labelGroup
          .append('text')
          .attr('text-anchor', 'middle')
          .attr('dy', '1.1em')
          .attr('fill', zone.discoveryPct === 100 ? '#4ade80' : '#d4af37')
          .attr('font-size', '10px')
          .attr('font-family', 'monospace')
          .attr('font-weight', '700')
          .text(`${zone.discoveredCount}/${zone.totalCount}`);
      });

      // Vertices
      discoveryPoints.forEach(([px, py], i) => {
        const z = zones[i];
        g.append('circle')
          .attr('cx', px)
          .attr('cy', py)
          .attr('r', z.id === activeZoneId ? 5.5 : 4)
          .attr('fill', '#ffd700')
          .attr('stroke', '#090604')
          .attr('stroke-width', 1.5)
          .style('cursor', 'pointer')
          .on('click', () => this.selectZone(z.id));
      });
    } else {
      // RARITY MODE (4 axes: Normal, Élite, Boss, Mythique)
      const n = rarity.length;
      const angleSlice = (Math.PI * 2) / n;
      const getAngle = (i: number) => i * angleSlice - Math.PI / 2;

      levels.forEach(lvl => {
        const r = maxRadius * lvl;
        const ringPoints = rarity.map((_, i) => {
          const a = getAngle(i);
          return [Math.cos(a) * r, Math.sin(a) * r] as [number, number];
        });
        g.append('polygon')
          .attr('points', ringPoints.map(p => p.join(',')).join(' '))
          .attr('fill', 'none')
          .attr('stroke', lvl === 1 ? '#d4af37' : '#8b6b43')
          .attr('stroke-opacity', lvl === 1 ? 0.6 : 0.3)
          .attr('stroke-width', lvl === 1 ? 1.4 : 0.9)
          .attr('stroke-dasharray', lvl < 1 ? '3,3' : null);
      });

      rarity.forEach((item, i) => {
        const a = getAngle(i);
        const xEnd = Math.cos(a) * maxRadius;
        const yEnd = Math.sin(a) * maxRadius;

        g.append('line')
          .attr('x1', 0)
          .attr('y1', 0)
          .attr('x2', xEnd)
          .attr('y2', yEnd)
          .attr('stroke', item.color)
          .attr('stroke-opacity', 0.65)
          .attr('stroke-width', 1.4);

        const labelRadius = maxRadius + 28;
        const lx = Math.cos(a) * labelRadius;
        const ly = Math.sin(a) * labelRadius;

        const labelGroup = g
          .append('g')
          .attr('transform', `translate(${lx}, ${ly})`)
          .style('cursor', 'pointer')
          .on('click', () => this.toggleThreatFilter(item.rank));

        labelGroup
          .append('text')
          .attr('text-anchor', 'middle')
          .attr('dy', '-0.15em')
          .attr('fill', item.color)
          .attr('font-size', '11px')
          .attr('font-family', 'Cinzel, serif')
          .attr('font-weight', '700')
          .text(item.label);

        labelGroup
          .append('text')
          .attr('text-anchor', 'middle')
          .attr('dy', '1.1em')
          .attr('fill', '#e0dcc7')
          .attr('font-size', '10px')
          .attr('font-family', 'monospace')
          .attr('font-weight', '700')
          .text(`${item.discoveredCount}/${item.totalCount}`);
      });

      const rarityPoints = rarity.map((item, i) => {
        const ratio = item.totalCount > 0 ? Math.max(0.16, item.discoveredCount / item.totalCount) : 0.16;
        const r = maxRadius * ratio;
        const a = getAngle(i);
        return [Math.cos(a) * r, Math.sin(a) * r] as [number, number];
      });

      g.append('polygon')
        .attr('points', rarityPoints.map(p => p.join(',')).join(' '))
        .attr('fill', 'url(#rarityPolygonGrad)')
        .attr('stroke', '#f59e0b')
        .attr('stroke-width', 2);

      rarityPoints.forEach(([px, py], i) => {
        const item = rarity[i];
        g.append('circle')
          .attr('cx', px)
          .attr('cy', py)
          .attr('r', 5)
          .attr('fill', item.color)
          .attr('stroke', '#090604')
          .attr('stroke-width', 1.5)
          .style('cursor', 'pointer')
          .on('click', () => this.toggleThreatFilter(item.rank));
      });
    }
  }
}
