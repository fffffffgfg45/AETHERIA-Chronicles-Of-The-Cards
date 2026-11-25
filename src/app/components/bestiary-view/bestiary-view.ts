import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { GameStateService } from '../../services/game-state';
import { SoundService } from '../../services/sound';
import {
  BestiaryEntry,
  BestiaryWeaknessElement,
  CardRarity,
  DiscoveryStatus,
  MonsterFamily,
  ThreatRank
} from '../../models/game.model';
import {
  GeneratedMonsterChronicle,
  MonsterDescriptionGenerator
} from '../../utils/monster-description-generator';
import { MatIconModule } from '@angular/material/icon';
import { BestiaryRadarChart } from '../bestiary-radar-chart/bestiary-radar-chart';
import { BestiaryExplorationRadar } from '../bestiary-exploration-radar/bestiary-exploration-radar';

type StatusFilter = 'all' | 'encountered' | 'discovered' | 'mastered' | 'undiscovered';

@Component({
  selector: 'app-bestiary-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, BestiaryRadarChart, BestiaryExplorationRadar],
  host: {
    '(document:keydown.escape)': 'onEscapeKey()',
  },
  template: `
    <div class="max-w-7xl mx-auto p-3 sm:p-5 md:p-6 space-y-6">

      <!-- ======================================================= -->
      <!-- MEDIEVAL BESTIARY HEADER & SCRIPTORIUM METRICS          -->
      <!-- ======================================================= -->
      <div class="relative overflow-hidden rounded-2xl border-2 border-[#8b6b43]/70 bg-gradient-to-b from-[#1c150e] via-[#130d08] to-[#090604] p-5 md:p-6 shadow-2xl">
        <!-- Medieval Corner Flourishes -->
        <mat-icon class="absolute top-2 left-2 text-[#d4af37]/20 select-none text-2xl pointer-events-none">auto_awesome</mat-icon>
        <mat-icon class="absolute top-2 right-2 text-[#d4af37]/20 select-none text-2xl pointer-events-none">auto_awesome</mat-icon>
        <mat-icon class="absolute bottom-2 left-2 text-[#d4af37]/20 select-none text-2xl pointer-events-none">auto_awesome</mat-icon>
        <mat-icon class="absolute bottom-2 right-2 text-[#d4af37]/20 select-none text-2xl pointer-events-none">auto_awesome</mat-icon>

        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#d4af37] text-xs font-cinzel font-bold uppercase tracking-wider mb-2">
              <mat-icon class="text-sm">menu_book</mat-icon>
              Scriptorium de la Haute Citadelle d'Aetheria
            </div>
            <h1 class="font-cinzel-dec text-2xl sm:text-3xl lg:text-4xl font-black text-[#f0e4cb] tracking-wide flex items-center gap-3">
              <img
                src="/src/assets/images/emblem_aetheria_crest_1795189810140.jpg"
                alt="Bestiaire Royal"
                class="w-10 h-10 rounded-xl object-cover border border-[#d4af37]/70 shadow shrink-0"
                referrerpolicy="no-referrer" />
              <span>Bestiarium Aetheriae</span>
            </h1>
            <p class="text-[#b59f7d] text-xs sm:text-sm font-serif max-w-2xl mt-1.5 leading-relaxed">
              Consultez les chroniques des bêtes, démons, dragons et titans arpentant le royaume. Découvrez leurs faiblesses élémentaires, leurs immunités, leurs butins et les récits de terrain générés aléatoirement par les maîtres archivistes.
            </p>
          </div>

          <!-- Scriptorium Metrics Pills -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0 self-start lg:self-auto">
            <!-- Encountered Count -->
            <div class="bg-[#18110b]/90 border border-[#d4af37]/60 rounded-xl px-3 py-2 text-center shadow-inner relative overflow-hidden group">
              <span class="text-[10px] font-cinzel uppercase text-[#ffd700] block font-bold flex items-center justify-center gap-1">
                <mat-icon class="text-xs text-[#ffd700]">sports_martial_arts</mat-icon>
                Rencontrées
              </span>
              <div class="font-mono text-lg font-black text-[#ffd700] flex items-center justify-center gap-1">
                <span>{{ gameState.bestiaryEncounteredCount() }}</span>
                <span class="text-xs text-[#8b6b43]">/ {{ gameState.bestiaryTotalCount() }}</span>
              </div>
              <span class="text-[9px] font-mono text-[#d4af37]">En Campagne & Arène</span>
            </div>

            <!-- Discovered Count -->
            <div class="bg-[#18110b]/90 border border-[#8b6b43]/50 rounded-xl px-3 py-2 text-center shadow-inner">
              <span class="text-[10px] font-cinzel uppercase text-[#b59f7d] block font-bold">Recensées</span>
              <div class="font-mono text-lg font-black text-[#d4af37] flex items-center justify-center gap-1">
                <span>{{ gameState.bestiaryDiscoveredCount() }}</span>
                <span class="text-xs text-[#8b6b43]">/ {{ gameState.bestiaryTotalCount() }}</span>
              </div>
              <span class="text-[9px] font-mono text-[#8b6b43]">{{ gameState.bestiaryDiscoveredPct() }}% Découvertes</span>
            </div>

            <!-- Mastered Count -->
            <div class="bg-[#18110b]/90 border border-[#d4af37]/50 rounded-xl px-3 py-2 text-center shadow-[0_0_15px_rgba(212,175,55,0.15)]">
              <span class="text-[10px] font-cinzel uppercase text-[#ffd700] block font-bold">Maîtrisées</span>
              <div class="font-mono text-lg font-black text-[#ffd700] flex items-center justify-center gap-1">
                <span>{{ gameState.bestiaryMasteredCount() }}</span>
                <span class="text-xs text-[#8b6b43]">/ {{ gameState.bestiaryTotalCount() }}</span>
              </div>
              <span class="text-[9px] font-mono text-[#4dff88]">+{{ gameState.bestiaryMasteredCount() }} Bonus Actifs</span>
            </div>

            <!-- Vault Currency Pill -->
            <div class="bg-[#18110b]/90 border border-[#8b6b43]/50 rounded-xl px-3 py-2 flex flex-col items-center justify-center text-center shadow-inner">
              <span class="text-[10px] font-cinzel uppercase text-[#b59f7d] block font-bold">Ressources Étude</span>
              <div class="flex items-center gap-2 text-xs font-mono font-bold mt-0.5">
                <span class="text-[#d4af37]">✦ {{ gameState.gold() }}</span>
                <span class="text-[#38bdf8]">⬥ {{ gameState.shards() }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Mastery Ribbon Progress Bar -->
        <div class="mt-4 pt-3 border-t border-[#8b6b43]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-cinzel">
          <div class="flex items-center gap-2 text-[#b59f7d]">
            <mat-icon class="text-sm text-[#d4af37]">military_tech</mat-icon>
            <span>Progression de la Maîtrise des Monstres :</span>
            <span class="font-mono text-[#ffd700] font-bold">{{ gameState.bestiaryMasteryPct() }}%</span>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <div class="w-full sm:w-64 h-2.5 bg-[#0a0705] border border-[#8b6b43]/60 rounded-full overflow-hidden p-0.5 shadow-inner">
              <div
                class="h-full bg-gradient-to-r from-[#8b2b2b] via-[#d4af37] to-[#4dff88] rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(212,175,55,0.5)]"
                [style.width.%]="gameState.bestiaryMasteryPct()"></div>
            </div>
            <button
              type="button"
              (click)="toggleExplorationRadar()"
              class="px-3 py-1 rounded-lg border border-[#d4af37]/50 bg-[#1a120b] hover:bg-[#2a1d12] text-[#ffd700] text-[11px] font-cinzel font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer">
              <mat-icon class="text-sm">radar</mat-icon>
              <span>{{ showExplorationRadar() ? 'Masquer Radar' : 'Afficher Radar' }}</span>
            </button>
            <button
              type="button"
              (click)="openGrimoireMode()"
              [disabled]="!selectedMonster()"
              class="px-3 py-1 rounded-lg border border-[#d4af37] bg-gradient-to-r from-[#2c1e11] to-[#1c1208] hover:from-[#3b2817] hover:to-[#271a0c] text-[#ffd700] hover:text-white text-[11px] font-cinzel font-bold flex items-center gap-1.5 shadow transition-all whitespace-nowrap shrink-0 disabled:opacity-50 cursor-pointer">
              <mat-icon class="text-sm">auto_stories</mat-icon>
              <span>Mode Grimoire</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ======================================================= -->
      <!-- EXPLORATION & RARITY RADAR BY ZONE                      -->
      <!-- ======================================================= -->
      @if (showExplorationRadar()) {
        <app-bestiary-exploration-radar
          [entries]="gameState.bestiaryEntries()"
          [activeThreatFilter]="threatFilter()"
          (monsterSelected)="onRadarSelectMonster($event)"
          (threatFilterSelected)="setThreatFilter($event)" />
      }

      <!-- ======================================================= -->
      <!-- FILTER & SEARCH CONTROLS                                -->
      <!-- ======================================================= -->
      <div class="bg-[#140e09] border border-[#8b6b43]/50 rounded-xl p-3.5 sm:p-4 shadow-xl space-y-3">
        <!-- Search + Status Tabs Row -->
        <div class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <!-- Search Bar -->
          <div class="relative flex-1">
            <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#8b6b43]">search</mat-icon>
            <input
              type="text"
              [value]="searchQuery()"
              (input)="updateSearch($event)"
              placeholder="Rechercher par monstre, titre, faiblesse élémentaire ou butin..."
              class="w-full pl-9 pr-8 py-2 bg-[#0c0805] border border-[#8b6b43]/60 rounded-lg text-xs font-serif text-[#e5d8be] placeholder-[#8b6b43] focus:outline-none focus:border-[#d4af37] shadow-inner" />
            @if (searchQuery()) {
              <button
                (click)="clearSearch()"
                class="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8b6b43] hover:text-[#e5d8be] text-xs">
                <mat-icon class="text-sm">close</mat-icon>
              </button>
            }
          </div>

          <!-- Status Filter Tabs -->
          <div class="flex items-center gap-1 bg-[#0c0805] p-1 rounded-lg border border-[#8b6b43]/40 overflow-x-auto text-xs font-cinzel font-bold shrink-0">
            <button
              (click)="setStatusFilter('all')"
              class="px-2.5 py-1.5 rounded-md transition-all whitespace-nowrap"
              [class.bg-[#8b2b2b]_text-white_shadow]="statusFilter() === 'all'"
              [class.text-[#8b6b43]_hover:text-[#c5a880]]="statusFilter() !== 'all'">
              Toutes ({{ gameState.bestiaryTotalCount() }})
            </button>

            <!-- Rencontrées Tab (Highlight Button) -->
            <button
              (click)="setStatusFilter('encountered')"
              class="px-3 py-1.5 rounded-md transition-all whitespace-nowrap flex items-center gap-1.5 border"
              [class.bg-gradient-to-r_from-[#8b6b43]/40_to-[#3a2814]_text-[#ffd700]_border-[#d4af37]_shadow-[0_0_12px_rgba(212,175,55,0.3)]]="statusFilter() === 'encountered'"
              [class.border-transparent_text-[#c5a880]_hover:text-[#ffd700]]="statusFilter() !== 'encountered'">
              <mat-icon class="text-xs text-[#ffd700]">sports_martial_arts</mat-icon>
              <span>Créatures Rencontrées ({{ gameState.bestiaryEncounteredCount() }})</span>
            </button>

            <button
              (click)="setStatusFilter('discovered')"
              class="px-2.5 py-1.5 rounded-md transition-all whitespace-nowrap"
              [class.bg-[#8b2b2b]_text-white_shadow]="statusFilter() === 'discovered'"
              [class.text-[#8b6b43]_hover:text-[#c5a880]]="statusFilter() !== 'discovered'">
              Découvertes ({{ gameState.bestiaryDiscoveredCount() }})
            </button>
            <button
              (click)="setStatusFilter('mastered')"
              class="px-2.5 py-1.5 rounded-md transition-all whitespace-nowrap flex items-center gap-1"
              [class.bg-[#d4af37]/20_text-[#ffd700]_border_border-[#d4af37]/60]="statusFilter() === 'mastered'"
              [class.text-[#8b6b43]_hover:text-[#ffd700]]="statusFilter() !== 'mastered'">
              <mat-icon class="text-xs">military_tech</mat-icon>
              <span>Maîtrisées ({{ gameState.bestiaryMasteredCount() }})</span>
            </button>
            <button
              (click)="setStatusFilter('undiscovered')"
              class="px-2.5 py-1.5 rounded-md transition-all whitespace-nowrap"
              [class.bg-[#8b2b2b]_text-white_shadow]="statusFilter() === 'undiscovered'"
              [class.text-[#8b6b43]_hover:text-[#c5a880]]="statusFilter() !== 'undiscovered'">
              Inconnues ({{ gameState.bestiaryTotalCount() - gameState.bestiaryDiscoveredCount() }})
            </button>
          </div>
        </div>

        <!-- Family Filter Pills (Horizontal Scrollable) -->
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-cinzel font-bold border-t border-[#8b6b43]/20 pt-2.5 scrollbar-thin">
          <span class="text-[#8b6b43] text-xs uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <mat-icon class="text-xs">category</mat-icon>
            Famille :
          </span>

          <button
            (click)="setFamilyFilter('all')"
            class="px-2.5 py-1 rounded-md border transition-all whitespace-nowrap shrink-0"
            [class.bg-[#d4af37]/20_text-[#ffd700]_border-[#d4af37]]="familyFilter() === 'all'"
            [class.bg-[#0d0906]_text-[#8b6b43]_border-[#3a2f23]_hover:text-[#e0dcc7]]="familyFilter() !== 'all'">
            Toutes
          </button>

          @for (fam of monsterFamilies; track fam.id) {
            <button
              (click)="setFamilyFilter(fam.id)"
              class="px-2.5 py-1 rounded-md border transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5"
              [class.bg-[#d4af37]/20_text-[#ffd700]_border-[#d4af37]_shadow-sm]="familyFilter() === fam.id"
              [class.bg-[#0d0906]_text-[#8b6b43]_border-[#3a2f23]_hover:text-[#e0dcc7]]="familyFilter() !== fam.id">
              <mat-icon class="text-xs">{{ fam.icon }}</mat-icon>
              <span>{{ fam.label }}</span>
              <span class="text-[9px] font-mono px-1 rounded bg-[#1a120b] text-[#c5a880]">{{ getFamilyMonsterCount(fam.id) }}</span>
            </button>
          }
        </div>

        <!-- Elemental Type Filter Bar (Horizontal Scrollable) -->
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-cinzel font-bold border-t border-[#8b6b43]/20 pt-2.5 scrollbar-thin">
          <span class="text-[#8b6b43] text-xs uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <mat-icon class="text-xs">flare</mat-icon>
            Élément :
          </span>

          <button
            (click)="setElementFilter('all')"
            class="px-2.5 py-1 rounded-md border transition-all whitespace-nowrap shrink-0 flex items-center gap-1"
            [class.bg-[#d4af37]/20_text-[#ffd700]_border-[#d4af37]_shadow-sm]="elementFilter() === 'all'"
            [class.bg-[#0d0906]_text-[#8b6b43]_border-[#3a2f23]_hover:text-[#e0dcc7]]="elementFilter() !== 'all'">
            <span>Tous</span>
            <span class="text-[9px] font-mono px-1 rounded bg-[#1a120b] text-[#c5a880]">{{ gameState.bestiaryTotalCount() }}</span>
          </button>

          @for (elem of availableElements; track elem.id) {
            <button
              (click)="setElementFilter(elem.id)"
              class="px-2.5 py-1 rounded-md border transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5"
              [class]="elementFilter() === elem.id ? elem.activeClass : 'bg-[#0d0906] text-[#8b6b43] border-[#3a2f23] hover:text-[#e0dcc7]'"
              [style.boxShadow]="elementFilter() === elem.id ? '0 0 10px ' + elem.glowColor : 'none'">
              <mat-icon class="text-xs" [style.color]="elementFilter() === elem.id ? elem.color : '#8b6b43'">{{ elem.icon }}</mat-icon>
              <span [style.color]="elementFilter() === elem.id ? elem.color : ''">{{ elem.label }}</span>
              <span class="text-[9px] font-mono px-1 rounded bg-[#1a120b] text-[#c5a880]">{{ getElementMonsterCount(elem.id) }}</span>
            </button>
          }
        </div>

        <!-- Threat Rank Chips & Interactive Encounter Simulator -->
        <div class="flex flex-wrap items-center justify-between gap-2 text-[11px] font-cinzel font-bold">
          <div class="flex flex-wrap items-center gap-1.5">
            <span class="text-[#8b6b43] text-xs uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
              <mat-icon class="text-xs">warning</mat-icon>
              Menace :
            </span>
            <button
              (click)="setThreatFilter('all')"
              class="px-2 py-0.5 rounded border transition-colors shrink-0"
              [class.bg-[#2a1d12]_text-[#d4af37]_border-[#8b6b43]]="threatFilter() === 'all'"
              [class.bg-[#0d0906]_text-[#8b6b43]_border-[#3a2f23]_hover:text-[#c5a880]]="threatFilter() !== 'all'">
              Toutes
            </button>

            <div class="relative group/rarity inline-block">
              <button
                (click)="setThreatFilter('normal')"
                [attr.aria-label]="'Filtrer Normal — ' + getThreatRankDropSummary('normal')"
                class="bestiary-rarity-trigger px-2 py-0.5 rounded border transition-colors shrink-0 inline-flex items-center gap-1"
                [class.bg-[#2a1d12]_text-[#94a3b8]_border-[#94a3b8]/60]="threatFilter() === 'normal'"
                [class.bg-[#0d0906]_text-[#8b6b43]_border-[#3a2f23]_hover:text-[#c5a880]]="threatFilter() !== 'normal'">
                <mat-icon class="bestiary-rarity-icon text-xs text-[#94a3b8]">shield</mat-icon>
                <span>Normal</span>
              </button>
              <div class="absolute left-0 top-full mt-2 w-60 p-3 rounded-xl bg-[#120d09]/95 border border-[#94a3b8]/50 shadow-2xl z-50 opacity-0 pointer-events-none group-hover/rarity:opacity-100 group-focus-within/rarity:opacity-100 transition-opacity duration-200 backdrop-blur-md space-y-1">
                <div class="flex items-center justify-between text-[11px] font-cinzel font-bold text-[#cbd5e1]">
                  <span>Rang Standard</span>
                  <span class="font-mono text-[10px] text-[#d4af37]">{{ getThreatRankMonsterCount('normal') }} esp.</span>
                </div>
                <p class="text-[10px] font-serif text-[#a89070] leading-snug">
                  {{ getThreatRankDropSummary('normal') }}
                </p>
              </div>
            </div>

            <div class="relative group/rarity inline-block">
              <button
                (click)="setThreatFilter('elite')"
                [attr.aria-label]="'Filtrer Élite — ' + getThreatRankDropSummary('elite')"
                class="bestiary-rarity-trigger px-2 py-0.5 rounded border transition-colors shrink-0 text-[#c084fc] inline-flex items-center gap-1"
                [class.bg-[#3b124d]/40_border-[#c084fc]]="threatFilter() === 'elite'"
                [class.bg-[#0d0906]_border-[#3a2f23]_hover:border-[#c084fc]/50]="threatFilter() !== 'elite'">
                <mat-icon class="bestiary-rarity-icon text-xs">star</mat-icon>
                <span>Élite</span>
              </button>
              <div class="absolute left-0 top-full mt-2 w-60 p-3 rounded-xl bg-[#120d09]/95 border border-[#c084fc]/60 shadow-2xl z-50 opacity-0 pointer-events-none group-hover/rarity:opacity-100 group-focus-within/rarity:opacity-100 transition-opacity duration-200 backdrop-blur-md space-y-1">
                <div class="flex items-center justify-between text-[11px] font-cinzel font-bold text-[#c084fc]">
                  <span>Rang Élite</span>
                  <span class="font-mono text-[10px] text-[#d4af37]">{{ getThreatRankMonsterCount('elite') }} esp.</span>
                </div>
                <p class="text-[10px] font-serif text-[#a89070] leading-snug">
                  {{ getThreatRankDropSummary('elite') }}
                </p>
              </div>
            </div>

            <div class="relative group/rarity inline-block">
              <button
                (click)="setThreatFilter('boss')"
                [attr.aria-label]="'Filtrer Boss — ' + getThreatRankDropSummary('boss')"
                class="bestiary-rarity-trigger px-2 py-0.5 rounded border transition-colors shrink-0 text-[#fb923c] inline-flex items-center gap-1"
                [class.bg-[#4d1f12]/40_border-[#fb923c]]="threatFilter() === 'boss'"
                [class.bg-[#0d0906]_border-[#3a2f23]_hover:border-[#fb923c]/50]="threatFilter() !== 'boss'">
                <mat-icon class="bestiary-rarity-icon text-xs">local_fire_department</mat-icon>
                <span>Boss</span>
              </button>
              <div class="absolute left-0 top-full mt-2 w-60 p-3 rounded-xl bg-[#120d09]/95 border border-[#fb923c]/60 shadow-2xl z-50 opacity-0 pointer-events-none group-hover/rarity:opacity-100 group-focus-within/rarity:opacity-100 transition-opacity duration-200 backdrop-blur-md space-y-1">
                <div class="flex items-center justify-between text-[11px] font-cinzel font-bold text-[#fb923c]">
                  <span>Boss d’Acte</span>
                  <span class="font-mono text-[10px] text-[#d4af37]">{{ getThreatRankMonsterCount('boss') }} esp.</span>
                </div>
                <p class="text-[10px] font-serif text-[#a89070] leading-snug">
                  {{ getThreatRankDropSummary('boss') }}
                </p>
              </div>
            </div>

            <div class="relative group/rarity inline-block">
              <button
                (click)="setThreatFilter('mythic')"
                [attr.aria-label]="'Filtrer Mythique — ' + getThreatRankDropSummary('mythic')"
                class="bestiary-rarity-trigger px-2 py-0.5 rounded border transition-colors shrink-0 text-[#f43f5e] inline-flex items-center gap-1"
                [class.bg-[#4d0c1e]/40_border-[#f43f5e]]="threatFilter() === 'mythic'"
                [class.bg-[#0d0906]_border-[#3a2f23]_hover:border-[#f43f5e]/50]="threatFilter() !== 'mythic'">
                <mat-icon class="bestiary-rarity-icon text-xs">auto_awesome</mat-icon>
                <span>Mythique</span>
              </button>
              <div class="absolute left-0 top-full mt-2 w-60 p-3 rounded-xl bg-[#120d09]/95 border border-[#f43f5e]/60 shadow-2xl z-50 opacity-0 pointer-events-none group-hover/rarity:opacity-100 group-focus-within/rarity:opacity-100 transition-opacity duration-200 backdrop-blur-md space-y-1">
                <div class="flex items-center justify-between text-[11px] font-cinzel font-bold text-[#f43f5e]">
                  <span>Rang Mythique</span>
                  <span class="font-mono text-[10px] text-[#d4af37]">{{ getThreatRankMonsterCount('mythic') }} esp.</span>
                </div>
                <p class="text-[10px] font-serif text-[#a89070] leading-snug">
                  {{ getThreatRankDropSummary('mythic') }}
                </p>
              </div>
            </div>
          </div>

          <!-- Quick Toggle for Encountered Only -->
          <button
            (click)="toggleOnlyEncountered()"
            class="px-3 py-1 rounded-lg border text-xs font-cinzel font-bold flex items-center gap-1.5 transition-all"
            [class.bg-[#ffd700]/20_text-[#ffd700]_border-[#ffd700]]="statusFilter() === 'encountered'"
            [class.bg-[#120d09]_text-[#c5a880]_border-[#8b6b43]/50_hover:border-[#d4af37]]="statusFilter() !== 'encountered'">
            <mat-icon class="text-xs">{{ statusFilter() === 'encountered' ? 'check_box' : 'check_box_outline_blank' }}</mat-icon>
            <span>Afficher uniquement les créatures rencontrées</span>
          </button>
        </div>
      </div>

      <!-- ======================================================= -->
      <!-- DUAL-PANE BESTIARY CODEX                                -->
      <!-- ======================================================= -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        <!-- ===================================================== -->
        <!-- LEFT COLUMN: CREATURE SCROLL LIST (5 Cols on LG)     -->
        <!-- ===================================================== -->
        <div class="lg:col-span-5 space-y-2.5 max-h-[860px] overflow-y-auto pr-1 scrollbar-thin">
          @if (filteredMonsters().length === 0) {
            <div class="bg-[#120e0a] border-2 border-dashed border-[#8b6b43]/40 rounded-xl p-8 text-center text-[#8b6b43]">
              <mat-icon class="text-4xl mb-2 text-[#8b6b43]">search_off</mat-icon>
              <p class="font-cinzel text-sm font-bold text-[#c5a880]">Aucun monstre ne correspond à cette sélection.</p>
              <p class="text-xs font-serif mt-1">Vous n'avez pas encore rencontré ou débloqué de créature correspondant à ce filtre.</p>
              <button
                (click)="resetFilters()"
                class="mt-3 px-3.5 py-1.5 rounded-lg bg-[#1a140f] border border-[#8b6b43] text-xs font-cinzel font-bold text-[#d4af37] hover:bg-[#251d16]">
                Afficher toutes les créatures
              </button>
            </div>
          }

          @for (monster of filteredMonsters(); track monster.id; let idx = $index) {
            <div
              role="button"
              tabindex="0"
              (click)="selectMonster(monster.id)"
              (keydown.enter)="selectMonster(monster.id)"
              (keydown.space)="selectMonster(monster.id); $event.preventDefault()"
              class="animate-bestiary-card group relative rounded-xl border-2 transition-all cursor-pointer p-3.5 flex items-center gap-3.5 select-none focus:outline-none focus:border-[#d4af37] hover:z-30 focus-within:z-30"
              [style.animation-delay]="(idx * 40) + 'ms'"
              [class.bg-gradient-to-r_from-[#2a1d12]_via-[#1f150d]_to-[#140e09]]="selectedMonsterId() === monster.id"
              [class.border-[#d4af37]_shadow-[0_0_20px_rgba(212,175,55,0.25)]]="selectedMonsterId() === monster.id"
              [class.bg-[#120d09]/90_border-[#8b6b43]/40_hover:border-[#8b6b43]_hover:bg-[#18110b]]="selectedMonsterId() !== monster.id"
              [class.opacity-75]="monster.discoveryStatus === 'undiscovered'">

              <!-- Left Crest / Icon Thumbnail with Elemental Pulse -->
              <div
                class="w-14 h-14 rounded-xl border-2 flex items-center justify-center shrink-0 relative overflow-hidden transition-transform group-hover:scale-105 shadow-md"
                [class.border-[#ffd700]_bg-gradient-to-br_from-[#3a2a16]_to-[#1a120b]]="monster.isMastered"
                [class.border-[#8b6b43]_bg-[#1a120c]]="!monster.isMastered && monster.discoveryStatus !== 'undiscovered'"
                [class.border-stone-800_bg-black/80]="monster.discoveryStatus === 'undiscovered'">

                @if (monster.discoveryStatus === 'undiscovered') {
                  <div class="w-full h-full flex items-center justify-center bg-[#0d0906] relative">
                    @if (monster.imageUrl) {
                      <img
                        [src]="monster.imageUrl"
                        alt="Silhouette inconnue"
                        referrerpolicy="no-referrer"
                        class="w-full h-full object-cover filter brightness-[0.14] contrast-125 sepia blur-[0.5px]" />
                    }
                    <span class="absolute text-[#8b6b43] font-cinzel text-xl font-black drop-shadow">?</span>
                  </div>
                } @else if (monster.imageUrl) {
                  <img
                    [src]="monster.imageUrl"
                    [alt]="monster.name"
                    referrerpolicy="no-referrer"
                    class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div class="absolute inset-0 ring-1 ring-inset ring-[#d4af37]/40 pointer-events-none rounded-xl"></div>
                } @else {
                  <mat-icon
                    class="bestiary-rarity-icon text-2xl transition-transform"
                    [title]="getMonsterDropTooltipText(monster)"
                    [class.text-[#ffd700]]="monster.isMastered"
                    [class.text-[#f43f5e]]="monster.threatRank === 'mythic' && !monster.isMastered"
                    [class.text-[#fb923c]]="monster.threatRank === 'boss' && !monster.isMastered"
                    [class.text-[#c084fc]]="monster.threatRank === 'elite' && !monster.isMastered"
                    [class.text-[#94a3b8]]="monster.threatRank === 'normal' && !monster.isMastered">
                    {{ monster.icon }}
                  </mat-icon>
                }

                <!-- Mastered Laurel Badge -->
                @if (monster.isMastered) {
                  <mat-icon
                    [title]="getMonsterDropTooltipText(monster)"
                    class="bestiary-rarity-icon absolute -top-1 -right-1 text-xs text-[#ffd700] drop-shadow-md z-10">verified</mat-icon>
                }
              </div>

              <!-- Main Card Info -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-1.5 mb-0.5">
                  <!-- Threat Rank Pill with Drop Rate Tooltip -->
                  <div class="relative group/rarity inline-block">
                    <span
                      tabindex="0"
                      [attr.aria-label]="getMonsterDropTooltipText(monster)"
                      class="bestiary-rarity-trigger px-1.5 py-0.2 rounded text-[9px] font-cinzel font-bold border inline-flex items-center gap-0.5 cursor-help"
                      [class]="getThreatRankStyle(monster.threatRank)">
                      <mat-icon class="bestiary-rarity-icon text-[10px]">{{ getThreatRankIcon(monster.threatRank) }}</mat-icon>
                      <span>{{ getThreatRankLabel(monster.threatRank) }}</span>
                    </span>

                    <div class="absolute left-0 top-full mt-1.5 w-64 p-3 rounded-xl bg-[#120d09]/95 border border-[#8b6b43] shadow-2xl z-50 opacity-0 pointer-events-none group-hover/rarity:opacity-100 group-focus-within/rarity:opacity-100 transition-opacity duration-200 backdrop-blur-md space-y-2">
                      <div class="flex items-center justify-between gap-2 border-b border-[#8b6b43]/35 pb-1.5">
                        <span class="font-cinzel text-[11px] font-bold text-[#ffd700] flex items-center gap-1">
                          <mat-icon class="text-xs">{{ getThreatRankIcon(monster.threatRank) }}</mat-icon>
                          <span>Rareté {{ getThreatRankLabel(monster.threatRank) }}</span>
                        </span>
                        <span class="font-mono text-[10px] font-bold text-emerald-400 tabular-nums">
                          Max {{ getMonsterBestDropPct(monster) }}% drop
                        </span>
                      </div>

                      @if (monster.discoveryStatus === 'undiscovered') {
                        <p class="text-[10px] font-serif text-[#a89070] leading-snug">
                          Taux de butin estimé jusqu'à <strong class="font-mono text-[#ffd700]">{{ getMonsterBestDropPct(monster) }}%</strong> (moy. <span class="font-mono">{{ getMonsterAvgDropPct(monster) }}%</span>). Rencontrez ou éclairez cette créature pour révéler ses reliques.
                        </p>
                      } @else {
                        <div class="space-y-1">
                          <div class="text-[9px] font-cinzel uppercase text-[#8b6b43] tracking-wider">Taux de drop du monstre :</div>
                          @for (drop of monster.drops; track drop.id) {
                            <div class="flex items-center justify-between gap-2 text-[10px] bg-[#1a130d] px-2 py-1 rounded border border-[#3a2f23]">
                              <span class="truncate font-serif text-[#f0e4cb]">{{ drop.name }}</span>
                              <span class="font-mono font-bold tabular-nums shrink-0" [style.color]="getDropRarityColor(drop.rarity)">
                                {{ drop.dropChancePct }}%
                              </span>
                            </div>
                          }
                        </div>
                      }
                    </div>
                  </div>

                  <!-- Family Pill -->
                  <span class="text-[10px] font-cinzel text-[#8b6b43] flex items-center gap-1">
                    <mat-icon class="text-[11px]">{{ getFamilyIcon(monster.family) }}</mat-icon>
                    <span>{{ getFamilyLabel(monster.family) }}</span>
                  </span>

                  <!-- Element Pill -->
                  <span
                    class="px-1.5 py-0.2 rounded text-[9px] font-cinzel font-bold border flex items-center gap-0.5"
                    [class]="getElementChipStyle(monster.primaryElement)">
                    <mat-icon class="text-[10px]">{{ getElementIcon(monster.primaryElement) }}</mat-icon>
                    <span>{{ getElementShortName(monster.primaryElement) }}</span>
                  </span>

                  <!-- Encountered Stamp or Discovery Status -->
                  @if (monster.encountersCount > 0 || monster.discoveryStatus !== 'undiscovered') {
                    <span
                      class="ml-auto text-[9px] font-cinzel font-bold px-1.5 py-0.2 rounded-full border bg-[#ffd700]/15 text-[#ffd700] border-[#d4af37]/60 flex items-center gap-1">
                      <mat-icon class="text-[9px]">sports_martial_arts</mat-icon>
                      <span>{{ monster.encountersCount }}× Rencontré</span>
                    </span>
                  } @else {
                    <span
                      class="ml-auto text-[9px] font-cinzel font-bold px-1.5 py-0.2 rounded-full border bg-stone-900 text-stone-500 border-stone-700">
                      Non Rencontré
                    </span>
                  }
                </div>

                <!-- Creature Name -->
                <h3
                  class="font-cinzel text-sm font-bold truncate transition-colors"
                  [class.text-[#ffd700]]="selectedMonsterId() === monster.id"
                  [class.text-[#f0e4cb]]="selectedMonsterId() !== monster.id && monster.discoveryStatus !== 'undiscovered'"
                  [class.text-stone-500]="monster.discoveryStatus === 'undiscovered'">
                  {{ monster.discoveryStatus === 'undiscovered' ? 'Entité Inconnue des Failles' : monster.name }}
                </h3>

                <!-- Subtitle / Location -->
                <p class="text-[11px] font-serif text-[#a89070] truncate">
                  {{ monster.discoveryStatus === 'undiscovered' ? 'Habitat : ' + monster.habitat : monster.title }}
                </p>

                <!-- Weakness & Record Quick Badges (if discovered) -->
                @if (monster.discoveryStatus !== 'undiscovered') {
                  <div class="flex items-center gap-2 mt-1 text-[10px]">
                    <!-- Quick Weakness Icons -->
                    <div class="flex items-center gap-1 text-[#b59f7d]">
                      <span class="text-[#8b6b43]">Faiblesse :</span>
                      @for (w of monster.weaknesses; track w.element) {
                        <span
                          class="px-1 rounded text-[9px] font-mono font-bold border flex items-center gap-0.5"
                          [class]="getElementChipStyle(w.element)"
                          [title]="w.multiplier + ' - ' + w.tacticalAdvice">
                          <mat-icon class="text-[10px]">{{ getElementIcon(w.element) }}</mat-icon>
                          <span>{{ getElementShortName(w.element) }}</span>
                        </span>
                      }
                    </div>

                    <!-- Defeats Count -->
                    <div class="ml-auto flex items-center gap-1 font-mono text-[#4dff88]">
                      <span class="inline-flex items-center gap-1">
                        <mat-icon class="text-[11px] text-[#ff6666]">swords</mat-icon>
                        <span>{{ monster.defeatsCount }} v.</span>
                      </span>
                    </div>
                  </div>
                } @else {
                  <!-- Undiscovered Action Button -->
                  <div class="mt-1 flex items-center justify-between">
                    <span class="text-[10px] font-serif text-stone-500 italic">Aucune note de combat</span>
                    <button
                      (click)="buyScoutRumor(monster.id); $event.stopPropagation()"
                      class="px-2 py-0.5 rounded bg-[#1f1710] hover:bg-[#2c2016] border border-[#8b6b43]/70 text-[9px] font-cinzel font-bold text-[#d4af37] flex items-center gap-1 transition-colors">
                      <mat-icon class="text-[10px]">visibility</mat-icon>
                      <span>Éclaireur (150 Or)</span>
                    </button>
                  </div>
                }
              </div>

              <!-- Selected Arrow -->
              @if (selectedMonsterId() === monster.id) {
                <div class="text-[#d4af37] hidden sm:block">
                  <mat-icon class="text-sm">chevron_right</mat-icon>
                </div>
              }
            </div>
          }
        </div>

        <!-- ===================================================== -->
        <!-- RIGHT COLUMN: ILLUMINATED CODEX FOLIO (7 Cols on LG) -->
        <!-- ===================================================== -->
        <div class="lg:col-span-7">
          @if (selectedMonster(); as monster) {
            <div
              [attr.data-monster-id]="monster.id"
              class="animate-bestiary-folio relative rounded-2xl border-2 border-[#8b6b43] bg-gradient-to-b from-[#1c140d] via-[#140e08] to-[#0a0705] p-5 sm:p-7 shadow-2xl space-y-6 overflow-hidden">

              <!-- Ornate Corner Brackets (Medieval Manuscript Feel) -->
              <div class="absolute top-2 left-2 text-[#d4af37]/30 select-none text-xl pointer-events-none">╔</div>
              <div class="absolute top-2 right-2 text-[#d4af37]/30 select-none text-xl pointer-events-none">╗</div>
              <div class="absolute bottom-2 left-2 text-[#d4af37]/30 select-none text-xl pointer-events-none">╚</div>
              <div class="absolute bottom-2 right-2 text-[#d4af37]/30 select-none text-xl pointer-events-none">╝</div>

              <!-- TOP BANNER: CREATURE IDENTITY & DANGER METER -->
              <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#8b6b43]/40 pb-5">
                <div class="flex items-center gap-4">
                  <!-- Grand Illuminated Crest Thumbnail with Elemental Aura -->
                  <div
                    role="button"
                    tabindex="0"
                    (click)="monster.imageUrl ? openArtworkModal(monster) : null"
                    (keydown.enter)="monster.imageUrl ? openArtworkModal(monster) : null"
                    (keydown.space)="monster.imageUrl ? openArtworkModal(monster) : null; $event.preventDefault()"
                    [title]="monster.imageUrl ? 'Cliquer pour examiner la gravure médiévale en grand format' : ''"
                    class="animate-creature-aura w-18 h-18 sm:w-22 sm:h-22 rounded-2xl border-3 flex items-center justify-center shrink-0 shadow-2xl relative overflow-hidden group cursor-pointer focus:outline-none focus:border-[#ffd700]"
                    [class.border-[#ffd700]_shadow-[0_0_25px_rgba(255,215,0,0.3)]_bg-gradient-to-br_from-[#3a2814]_to-[#171008]]="monster.isMastered"
                    [class.border-[#f43f5e]_bg-gradient-to-br_from-[#380e1a]_to-[#150509]]="monster.threatRank === 'mythic' && !monster.isMastered"
                    [class.border-[#fb923c]_bg-gradient-to-br_from-[#381a0e]_to-[#150a05]]="monster.threatRank === 'boss' && !monster.isMastered"
                    [class.border-[#c084fc]_bg-gradient-to-br_from-[#2a0e38]_to-[#100517]]="monster.threatRank === 'elite' && !monster.isMastered"
                    [class.border-[#8b6b43]_bg-[#1a120c]]="monster.threatRank === 'normal' && !monster.isMastered">

                    @if (monster.imageUrl) {
                      <img
                        [src]="monster.imageUrl"
                        [alt]="monster.name"
                        referrerpolicy="no-referrer"
                        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <mat-icon class="text-[#ffd700] text-xl">zoom_in</mat-icon>
                      </div>
                    } @else {
                      <mat-icon
                        class="text-3xl sm:text-4xl"
                        [class.text-[#ffd700]]="monster.isMastered"
                        [class.text-[#f43f5e]]="monster.threatRank === 'mythic' && !monster.isMastered"
                        [class.text-[#fb923c]]="monster.threatRank === 'boss' && !monster.isMastered"
                        [class.text-[#c084fc]]="monster.threatRank === 'elite' && !monster.isMastered"
                        [class.text-[#e0dcc7]]="monster.threatRank === 'normal' && !monster.isMastered">
                        {{ monster.icon }}
                      </mat-icon>
                    }

                    @if (monster.isMastered) {
                      <div class="absolute -bottom-2 px-2 py-0.2 rounded-full bg-[#ffd700] text-black font-cinzel text-[8px] font-black tracking-wider uppercase shadow z-10">
                        Maîtrisé
                      </div>
                    }
                  </div>

                  <div>
                    <!-- Threat & Family Chips -->
                    <div class="flex flex-wrap items-center gap-2 mb-1">
                      <div class="relative group/rarity inline-block">
                        <span
                          tabindex="0"
                          [attr.aria-label]="getMonsterDropTooltipText(monster)"
                          class="bestiary-rarity-trigger px-2 py-0.5 rounded text-[10px] font-cinzel font-bold border inline-flex items-center gap-1 cursor-help"
                          [class]="getThreatRankStyle(monster.threatRank)">
                          <mat-icon class="bestiary-rarity-icon text-xs">{{ getThreatRankIcon(monster.threatRank) }}</mat-icon>
                          <span>{{ getThreatRankLabel(monster.threatRank) }}</span>
                        </span>

                        <div class="absolute left-0 top-full mt-2 w-72 p-3.5 rounded-xl bg-[#120d09]/95 border border-[#8b6b43] shadow-2xl z-50 opacity-0 pointer-events-none group-hover/rarity:opacity-100 group-focus-within/rarity:opacity-100 transition-opacity duration-200 backdrop-blur-md space-y-2">
                          <div class="flex items-center justify-between gap-2 border-b border-[#8b6b43]/35 pb-1.5">
                            <span class="font-cinzel text-xs font-bold text-[#ffd700] flex items-center gap-1">
                              <mat-icon class="text-sm">{{ getThreatRankIcon(monster.threatRank) }}</mat-icon>
                              <span>Butins · {{ getThreatRankLabel(monster.threatRank) }}</span>
                            </span>
                            <span class="font-mono text-[10px] font-bold text-emerald-400 tabular-nums">
                              Max {{ getMonsterBestDropPct(monster) }}%
                            </span>
                          </div>
                          <div class="space-y-1">
                            @for (drop of monster.drops; track drop.id) {
                              <div class="flex items-center justify-between gap-2 text-[11px] bg-[#1a130d] px-2 py-1 rounded-lg border border-[#3a2f23]">
                                <div class="min-w-0">
                                  <div class="truncate font-serif text-[#f0e4cb]">{{ drop.name }}</div>
                                  <div class="text-[9px] font-cinzel" [style.color]="getDropRarityColor(drop.rarity)">
                                    {{ getDropRarityLabel(drop.rarity) }}
                                  </div>
                                </div>
                                <span class="font-mono font-bold tabular-nums shrink-0" [style.color]="getDropRarityColor(drop.rarity)">
                                  {{ drop.dropChancePct }}%
                                </span>
                              </div>
                            }
                          </div>
                        </div>
                      </div>
                      <span class="px-2 py-0.5 rounded text-[10px] font-cinzel font-bold border border-[#8b6b43]/50 bg-[#140e09] text-[#c5a880] flex items-center gap-1">
                        <mat-icon class="text-xs">{{ getFamilyIcon(monster.family) }}</mat-icon>
                        <span>{{ getFamilyLabel(monster.family) }}</span>
                      </span>

                      <!-- Elemental Affinities -->
                      <span
                        class="px-2 py-0.5 rounded text-[10px] font-cinzel font-bold border flex items-center gap-1 shadow-sm"
                        [class]="getElementChipStyle(monster.primaryElement)">
                        <mat-icon class="text-xs">{{ getElementIcon(monster.primaryElement) }}</mat-icon>
                        <span>Type : {{ getElementName(monster.primaryElement) }}</span>
                      </span>
                      @if (monster.secondaryElement) {
                        <span
                          class="px-2 py-0.5 rounded text-[10px] font-cinzel font-bold border flex items-center gap-1 shadow-sm"
                          [class]="getElementChipStyle(monster.secondaryElement)">
                          <mat-icon class="text-xs">{{ getElementIcon(monster.secondaryElement) }}</mat-icon>
                          <span>{{ getElementName(monster.secondaryElement) }}</span>
                        </span>
                      }

                      <!-- Rencontre en Combat Tag -->
                      @if (monster.encountersCount > 0) {
                        <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#ffd700]/20 text-[#ffd700] border border-[#ffd700]/40 flex items-center gap-1">
                          <mat-icon class="text-xs">sports_martial_arts</mat-icon>
                          <span>Rencontré en Combat ({{ monster.encountersCount }})</span>
                        </span>
                      }
                    </div>

                    <!-- Monster Name -->
                    <h2 class="font-cinzel-dec text-xl sm:text-2xl font-black text-[#f5ebd9] tracking-wide">
                      {{ monster.name }}
                    </h2>

                    <!-- Formal Epithet / Title -->
                    <p class="text-xs sm:text-sm font-serif text-[#d4af37] italic">
                      « {{ monster.title }} »
                    </p>
                  </div>
                </div>

                <!-- Danger Meter, Habitat & Mode Grimoire Trigger -->
                <div class="sm:text-right shrink-0 space-y-2">
                  <div>
                    <div class="flex items-center sm:justify-end gap-1 text-[#ef4444]" [title]="'Indice de dangerosité : ' + monster.dangerRating + '/5'">
                      @for (star of [1, 2, 3, 4, 5]; track star) {
                        <mat-icon class="text-sm">
                          {{ star <= monster.dangerRating ? 'skull' : 'radio_button_unchecked' }}
                        </mat-icon>
                      }
                    </div>
                    <span class="text-[10px] font-cinzel text-[#8b6b43] uppercase block font-bold mt-0.5">
                      Indice de Péril : {{ monster.dangerRating }}/5
                    </span>
                    <div class="text-[11px] font-serif text-[#a89070] flex items-center sm:justify-end gap-1 mt-1">
                      <mat-icon class="text-xs text-[#8b6b43]">place</mat-icon>
                      <span>{{ monster.habitat }}</span>
                    </div>
                  </div>
                  <div class="flex sm:justify-end">
                    <button
                      type="button"
                      (click)="openGrimoireMode()"
                      class="medieval-btn px-3.5 py-1.5 rounded-xl border border-[#d4af37] bg-gradient-to-r from-[#332212] to-[#1c1208] hover:from-[#432c17] hover:to-[#281a0d] text-[#ffd700] hover:text-white text-xs font-cinzel font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg transition-all cursor-pointer">
                      <mat-icon class="text-sm">auto_stories</mat-icon>
                      <span>Mode Grimoire</span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- =================================================== -->
              <!-- MEDIEVAL MANUSCRIPT FOLIO & WOODCUT ILLUSTRATION    -->
              <!-- =================================================== -->
              @if (monster.imageUrl) {
                <div class="relative bg-gradient-to-b from-[#18110b] via-[#120c07] to-[#0a0704] border-2 border-[#8b6b43]/80 rounded-2xl p-4 sm:p-5 shadow-2xl overflow-hidden space-y-4">
                  <!-- Ornate Header -->
                  <div class="flex items-center justify-between border-b border-[#8b6b43]/40 pb-3">
                    <div class="flex items-center gap-2.5">
                      <div class="w-8 h-8 rounded-full bg-[#d4af37]/20 border border-[#d4af37] flex items-center justify-center text-[#ffd700]">
                        <mat-icon class="text-base">palette</mat-icon>
                      </div>
                      <div>
                        <span class="text-[10px] font-cinzel uppercase text-[#d4af37] font-bold tracking-wider block">
                          Enluminure Féodale & Gravure sur Bois Authentique
                        </span>
                        <h3 class="font-cinzel text-xs sm:text-sm font-black text-[#f5ebd9]">
                          Folio Enluminé : {{ monster.name }}
                        </h3>
                      </div>
                    </div>

                    <button
                      (click)="openArtworkModal(monster)"
                      class="px-3 py-1.5 rounded-lg border border-[#d4af37] bg-gradient-to-r from-[#2c1e11] to-[#1c1208] text-[#ffd700] hover:text-white text-xs font-cinzel font-bold flex items-center gap-1.5 shadow hover:scale-102 transition-all">
                      <mat-icon class="text-xs">zoom_in</mat-icon>
                      <span>Agrandir l'Enluminure</span>
                    </button>
                  </div>

                  <!-- Illuminated Manuscript Showcase Frame -->
                  <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    <!-- Parchment Woodcut Image Display -->
                    <div
                      role="button"
                      tabindex="0"
                      (click)="openArtworkModal(monster)"
                      (keydown.enter)="openArtworkModal(monster)"
                      class="md:col-span-5 relative group cursor-pointer mx-auto max-w-[280px] w-full rounded-xl overflow-hidden border-2 border-[#d4af37]/60 shadow-[0_0_20px_rgba(212,175,55,0.2)] bg-[#100a06]">
                      <img
                        [src]="monster.imageUrl"
                        [alt]="monster.name"
                        referrerpolicy="no-referrer"
                        class="w-full aspect-square object-cover transition-transform duration-700 group-hover:scale-105" />
                      <!-- Hover Overlay -->
                      <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-3">
                        <span class="px-2.5 py-1 rounded bg-[#d4af37] text-black font-cinzel font-black text-[10px] uppercase flex items-center gap-1 shadow-lg">
                          <mat-icon class="text-xs">zoom_in</mat-icon>
                          Examiner le Trait de Gravure
                        </span>
                      </div>
                      <!-- Vintage Corner Stamp -->
                      <div class="absolute top-2 right-2 text-[#d4af37] text-[10px] font-cinzel font-black select-none pointer-events-none drop-shadow bg-black/60 px-1.5 py-0.5 rounded border border-[#d4af37]/40">
                        Folio № {{ monster.id.replace('mon_', '') }}
                      </div>
                    </div>

                    <!-- Manuscript Annotation & Codification Notes -->
                    <div class="md:col-span-7 space-y-3 text-xs font-serif text-[#c5a880]">
                      <div class="bg-[#0f0b07] border border-[#8b6b43]/40 rounded-xl p-3 space-y-1.5">
                        <div class="flex items-center justify-between text-[11px] font-cinzel font-bold text-[#ffd700]">
                          <span class="flex items-center gap-1">
                            <mat-icon class="text-xs">brush</mat-icon>
                            Technique d'Atelier
                          </span>
                          <span class="text-[9px] font-mono text-[#8b6b43]">Atelier des Maîtres Graveurs</span>
                        </div>
                        <p class="text-[11px] text-[#e0d3bc] leading-relaxed">
                          Gravure originale sur bois d'aulne séché, tirée sur vélin de parchemin ancien et rehaussée de feuilles d'or pur. Les rehauts d'encre de suie et pigments minéraux capturent fidèlement la morphologie et les attributs occultes de cette créature.
                        </p>
                      </div>

                      <div class="grid grid-cols-2 gap-2 text-[10px] font-cinzel">
                        <div class="bg-[#150f09] border border-[#8b6b43]/30 rounded-lg p-2">
                          <span class="text-[#8b6b43] uppercase block font-bold">Élément Majeur</span>
                          <span class="text-[#ffd700] font-bold text-xs flex items-center gap-1 mt-0.5">
                            <mat-icon class="text-xs">{{ getElementIcon(monster.primaryElement) }}</mat-icon>
                            {{ getElementName(monster.primaryElement) }}
                          </span>
                        </div>
                        <div class="bg-[#150f09] border border-[#8b6b43]/30 rounded-lg p-2">
                          <span class="text-[#8b6b43] uppercase block font-bold">Registre de Menace</span>
                          <div class="relative group/rarity inline-block mt-0.5">
                            <span
                              tabindex="0"
                              [attr.aria-label]="getMonsterDropTooltipText(monster)"
                              class="bestiary-rarity-trigger font-bold text-xs inline-flex items-center gap-1 px-1.5 py-0.5 rounded border cursor-help"
                              [class]="getThreatRankStyle(monster.threatRank)">
                              <mat-icon class="bestiary-rarity-icon text-xs">{{ getThreatRankIcon(monster.threatRank) }}</mat-icon>
                              <span>{{ getThreatRankLabel(monster.threatRank) }}</span>
                            </span>

                            <div class="absolute right-0 bottom-full mb-2 w-68 p-3 rounded-xl bg-[#120d09]/95 border border-[#8b6b43] shadow-2xl z-50 opacity-0 pointer-events-none group-hover/rarity:opacity-100 group-focus-within/rarity:opacity-100 transition-opacity duration-200 backdrop-blur-md space-y-1.5">
                              <div class="flex items-center justify-between text-[11px] font-cinzel font-bold text-[#ffd700] border-b border-[#8b6b43]/30 pb-1">
                                <span>Taux de Drop ({{ getThreatRankLabel(monster.threatRank) }})</span>
                                <span class="font-mono text-[10px] text-emerald-400 tabular-nums">Max {{ getMonsterBestDropPct(monster) }}%</span>
                              </div>
                              @for (drop of monster.drops; track drop.id) {
                                <div class="flex items-center justify-between gap-2 text-[10px]">
                                  <span class="truncate font-serif text-[#f0e4cb]">{{ drop.name }}</span>
                                  <span class="font-mono font-bold tabular-nums shrink-0" [style.color]="getDropRarityColor(drop.rarity)">
                                    {{ drop.dropChancePct }}%
                                  </span>
                                </div>
                              }
                            </div>
                          </div>
                        </div>
                      </div>

                      <div class="flex items-center gap-2 text-[11px] text-[#8b6b43]">
                        <mat-icon class="text-xs text-[#d4af37]">verified</mat-icon>
                        <span class="italic font-serif">Sceau officiel de validation du Scriptorium d'Aetheria</span>
                      </div>
                    </div>
                  </div>
                </div>
              }

              <!-- =================================================== -->
              <!-- MARTIAL & OCCULT ATTRIBUTES CHART (RADAR / BARS)    -->
              <!-- =================================================== -->
              <app-bestiary-radar-chart [monster]="monster" />

              <!-- =================================================== -->
              <!-- PROCEDURAL RANDOM MANUSCRIPT & CHRONICLE SECTION   -->
              <!-- =================================================== -->
              <div
                class="space-y-3.5 bg-gradient-to-b from-[#18110b] to-[#0f0b07] border-2 border-[#d4af37]/60 rounded-xl p-4 sm:p-5 shadow-2xl relative overflow-hidden"
                [class.animate-parchment-flash]="isGeneratingChronicle()">
                
                <!-- Medieval Watermark Ribbon -->
                <mat-icon class="absolute right-3 bottom-3 text-[#d4af37]/10 select-none text-6xl pointer-events-none">history_edu</mat-icon>

                <!-- Section Header with Chronicler Credentials -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#8b6b43]/40 pb-3">
                  <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-full bg-[#d4af37]/20 border border-[#d4af37] flex items-center justify-center text-[#ffd700]">
                      <mat-icon class="text-base" [class.animate-quill]="isGeneratingChronicle()">history_edu</mat-icon>
                    </div>
                    <div>
                      <span class="text-[10px] font-cinzel uppercase text-[#ffd700] font-bold tracking-wider block">
                        Chronique d'Érudit Aléatoire & Récit de Terrain
                      </span>
                      <h4 class="font-cinzel text-xs sm:text-sm font-black text-[#f5ebd9]">
                        {{ currentChronicle().headline }}
                      </h4>
                    </div>
                  </div>

                  <!-- Re-roll Random Chronicle Button -->
                  <div class="flex items-center gap-2 shrink-0">
                    <button
                      (click)="generateNewRandomChronicle(monster)"
                      [disabled]="isGeneratingChronicle()"
                      title="Générer une nouvelle observation aléatoire pour ce monstre"
                      class="px-3 py-1.5 rounded-lg border border-[#d4af37] bg-gradient-to-r from-[#2c1d10] to-[#1a1208] text-[#ffd700] text-xs font-cinzel font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md hover:scale-102 hover:border-[#ffd700] transition-all disabled:opacity-50">
                      <mat-icon class="text-xs" [class.animate-spin]="isGeneratingChronicle()">casino</mat-icon>
                      <span>Nouvelle Chronique Aléatoire</span>
                    </button>
                  </div>
                </div>

                <!-- Witness Metadata & Authenticity Badges -->
                <div class="flex flex-wrap items-center gap-2 text-[10px] font-serif border-b border-[#8b6b43]/20 pb-2.5 text-[#b59f7d]">
                  <span class="flex items-center gap-1 text-[#ffd700] font-bold">
                    <mat-icon class="text-xs">person</mat-icon>
                    {{ currentChronicle().chroniclerName }}
                  </span>
                  <span>•</span>
                  <span class="italic text-[#c5a880]">{{ currentChronicle().chroniclerRole }}</span>
                  <span>•</span>
                  <span class="font-mono text-[#8b6b43]">{{ currentChronicle().chronicleDate }}</span>

                  <span class="ml-auto px-2 py-0.5 rounded text-[9px] font-cinzel font-bold border border-[#d4af37]/40 bg-[#120d09] text-[#ffd700]">
                    {{ currentChronicle().categoryLabel }}
                  </span>
                </div>

                <!-- The Procedural Random Description Text with Dynamic Ink Animation -->
                <div class="space-y-3">
                  <p
                    [attr.data-chronicle-key]="chronicleAnimationKey()"
                    class="animate-ink-scribe font-serif text-xs sm:text-sm text-[#f0e6d2] leading-relaxed italic border-l-2 border-[#d4af37]/50 pl-3.5 py-0.5">
                    {{ currentChronicle().description }}
                  </p>

                  <!-- Tactical Observation Highlight from the Chronicle -->
                  <div class="bg-[#120c08] border border-[#d4af37]/40 rounded-lg p-3 space-y-1">
                    <div class="flex items-center gap-1.5 text-xs font-cinzel font-bold text-[#ffd700]">
                      <mat-icon class="text-xs text-[#4dff88]">tips_and_updates</mat-icon>
                      <span>Observation Tactique Recueillie sur le Terrain :</span>
                    </div>
                    <p class="text-xs font-serif text-[#e5d8be] leading-relaxed">
                      {{ currentChronicle().tacticalObservation }}
                    </p>
                  </div>

                  <!-- Environmental & Elemental Footnote -->
                  <div class="flex flex-wrap items-center justify-between gap-2 text-[11px] font-serif text-[#8b6b43] pt-1">
                    <span class="flex items-center gap-1 text-[#a89070]">
                      <mat-icon class="text-xs text-[#8b6b43]">cloud_queue</mat-icon>
                      <span>Circonstance : {{ currentChronicle().environmentalCondition }}</span>
                    </span>
                    <span class="font-mono text-[#ffd700] text-[10px]">
                      {{ currentChronicle().elementalEcho }}
                    </span>
                  </div>
                </div>

              </div>

              <!-- =================================================== -->
              <!-- VITAL: ELEMENTAL WEAKNESSES & VULNERABILITIES       -->
              <!-- =================================================== -->
              <div class="space-y-3 bg-[#110c08] border-2 border-[#ff4d4d]/50 rounded-xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
                <mat-icon class="absolute right-3 bottom-3 text-[#ff4d4d]/10 select-none text-6xl pointer-events-none">bolt</mat-icon>

                <div class="flex items-center justify-between border-b border-[#ff4d4d]/30 pb-2">
                  <div class="flex items-center gap-2">
                    <mat-icon class="text-[#ff4d4d] text-lg">broken_image</mat-icon>
                    <h4 class="font-cinzel text-xs sm:text-sm font-black text-[#ff8080] uppercase tracking-wider">
                      Faiblesses & Vulnérabilités Majeures
                    </h4>
                  </div>
                  <span class="text-[10px] font-mono text-[#ff9999] font-bold uppercase tracking-wider">Exploitation Tactique</span>
                </div>

                <!-- Weaknesses Cards -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  @for (weakness of monster.weaknesses; track weakness.element) {
                    <div class="bg-[#1b100d] border border-[#ff4d4d]/60 rounded-xl p-3 shadow-inner space-y-1.5">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-1.5">
                          <mat-icon class="text-sm text-[#ff9999]">{{ getElementIcon(weakness.element) }}</mat-icon>
                          <span class="font-cinzel text-xs font-black text-[#ffcccc] uppercase">
                            {{ getElementName(weakness.element) }}
                          </span>
                        </div>
                        <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#ff4d4d]/20 text-[#ff6666] border border-[#ff4d4d]/40">
                          {{ weakness.multiplier }}
                        </span>
                      </div>
                      <p class="text-xs font-serif text-[#e5d8be] leading-relaxed">
                        {{ weakness.tacticalAdvice }}
                      </p>
                    </div>
                  }
                </div>
              </div>

              <!-- =================================================== -->
              <!-- ELEMENTAL RESISTANCES & IMMUNITIES                  -->
              <!-- =================================================== -->
              <div class="space-y-3 bg-[#0d0f17] border border-[#38bdf8]/40 rounded-xl p-4 shadow-lg">
                <div class="flex items-center justify-between border-b border-[#38bdf8]/20 pb-2">
                  <div class="flex items-center gap-2">
                    <mat-icon class="text-[#38bdf8] text-base">shield</mat-icon>
                    <h4 class="font-cinzel text-xs sm:text-sm font-bold text-[#7dd3fc] uppercase tracking-wider">
                      Résistances, Blindages & Immunités
                    </h4>
                  </div>
                  <span class="text-[10px] font-mono text-[#7dd3fc]">Attaques Inefficaces</span>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  @for (res of monster.resistances; track res.element) {
                    <div class="bg-[#111624] border border-[#38bdf8]/30 rounded-lg p-2.5 space-y-1">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-1.5">
                          <mat-icon class="text-xs text-[#38bdf8]">{{ getElementIcon(res.element) }}</mat-icon>
                          <span class="font-cinzel text-xs font-bold text-[#bae6fd]">{{ getElementName(res.element) }}</span>
                        </div>
                        <span class="px-2 py-0.2 rounded text-[10px] font-mono font-bold bg-[#38bdf8]/20 text-[#7dd3fc]">
                          {{ res.reduction }}
                        </span>
                      </div>
                      <p class="text-[11px] font-serif text-[#94a3b8] leading-tight">
                        {{ res.tacticalAdvice }}
                      </p>
                    </div>
                  }
                </div>
              </div>

              <!-- =================================================== -->
              <!-- SIGNATURE ABILITIES & COUNTER STRATEGIES            -->
              <!-- =================================================== -->
              <div class="space-y-3">
                <div class="flex items-center gap-2 border-b border-[#8b6b43]/30 pb-2">
                  <mat-icon class="text-[#d4af37] text-base">auto_fix_high</mat-icon>
                  <h4 class="font-cinzel text-xs sm:text-sm font-bold text-[#e5d8be] uppercase tracking-wider">
                    Pouvoirs de Boss & Contre-Mesures de Combat
                  </h4>
                </div>

                <div class="space-y-2.5">
                  @for (ability of monster.signatureAbilities; track ability.name) {
                    <div class="bg-[#150f0a] border border-[#8b6b43]/40 rounded-xl p-3.5 space-y-2">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                          <mat-icon class="text-sm text-[#d4af37]">{{ ability.icon }}</mat-icon>
                          <span class="font-cinzel text-xs font-bold text-[#f5ebd9]">{{ ability.name }}</span>
                        </div>
                        <span
                          class="px-2 py-0.2 rounded text-[9px] font-cinzel font-bold uppercase border"
                          [class.bg-[#fb923c]/20_text-[#fb923c]_border-[#fb923c]/40]="ability.type === 'active'"
                          [class.bg-[#38bdf8]/20_text-[#38bdf8]_border-[#38bdf8]/40]="ability.type === 'passive'"
                          [class.bg-[#f43f5e]/20_text-[#f43f5e]_border-[#f43f5e]/40]="ability.type === 'ultimate'">
                          {{ ability.type }}
                        </span>
                      </div>

                      <p class="text-xs font-serif text-[#b59f7d]">
                        {{ ability.description }}
                      </p>

                      <div class="bg-[#0b0805] rounded-lg p-2 border border-[#8b6b43]/30 flex items-start gap-2">
                        <mat-icon class="text-xs text-[#4dff88] shrink-0 mt-0.5">tips_and_updates</mat-icon>
                        <p class="text-[11px] font-serif text-[#4dff88] leading-tight">
                          <span class="font-bold">Contre-tactique :</span> {{ ability.counterStrategy }}
                        </p>
                      </div>
                    </div>
                  }
                </div>
              </div>

              <!-- =================================================== -->
              <!-- HISTORICAL LORE MANUSCRIPT & ARCHIVIST NOTES        -->
              <!-- =================================================== -->
              <div class="space-y-3 bg-[#130d08] border border-[#8b6b43]/50 rounded-xl p-4 sm:p-5 shadow-inner">
                <div class="flex items-center gap-2 border-b border-[#8b6b43]/30 pb-2">
                  <mat-icon class="text-[#d4af37] text-base">auto_stories</mat-icon>
                  <h4 class="font-cinzel text-xs sm:text-sm font-bold text-[#e5d8be] uppercase tracking-wider">
                    Archives Canoniques de la Citadelle
                  </h4>
                </div>

                <!-- Lore Excerpt with Drop Cap -->
                <p class="font-serif text-xs sm:text-sm text-[#e0d3bc] leading-relaxed italic">
                  <span class="font-cinzel-dec text-2xl font-black text-[#d4af37] float-left mr-2 leading-none">«</span>
                  {{ monster.loreExcerpt }}
                </p>

                <!-- Archivist Notes Quote -->
                <div class="border-l-3 border-[#d4af37] pl-3 py-1 bg-[#1c140d]/60 rounded-r-lg">
                  <p class="font-serif text-xs text-[#ffd700] leading-relaxed">
                    {{ monster.archivistNotes }}
                  </p>
                </div>
              </div>

              <!-- =================================================== -->
              <!-- HARVESTABLE DROPS & ALCHEMICAL INGREDIENTS          -->
              <!-- =================================================== -->
              <div class="space-y-3">
                <div class="flex items-center justify-between border-b border-[#8b6b43]/30 pb-2">
                  <div class="flex items-center gap-2">
                    <mat-icon class="text-[#d4af37] text-base">card_giftcard</mat-icon>
                    <h4 class="font-cinzel text-xs sm:text-sm font-bold text-[#e5d8be] uppercase tracking-wider">
                      Butins d'Arène & Reliques Moissonnables
                    </h4>
                  </div>
                  <span class="text-[10px] font-mono text-[#8b6b43]">Table de Trophées</span>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  @for (drop of monster.drops; track drop.id) {
                    <div class="bg-[#120d09] border border-[#8b6b43]/40 rounded-xl p-3 space-y-1.5 shadow-sm">
                      <div class="flex items-center justify-between">
                        <div class="w-8 h-8 rounded-lg bg-[#1e150f] border border-[#8b6b43] flex items-center justify-center text-[#d4af37]">
                          <mat-icon class="text-sm">{{ drop.icon }}</mat-icon>
                        </div>
                        <span class="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[#d4af37]/15 text-[#ffd700]">
                          {{ drop.dropChancePct }}% Taux
                        </span>
                      </div>
                      <h5 class="font-cinzel text-xs font-bold text-[#f0e4cb] truncate">{{ drop.name }}</h5>
                      <p class="text-[10px] font-serif text-[#a89070] line-clamp-2 leading-tight">
                        {{ drop.description }}
                      </p>
                    </div>
                  }
                </div>
              </div>

              <!-- =================================================== -->
              <!-- COMBAT MASTERY, SCRIPTORIUM STUDY & RECORD          -->
              <!-- =================================================== -->
              <div class="bg-[#17100a] border-2 border-[#d4af37]/60 rounded-xl p-4 sm:p-5 shadow-2xl space-y-4">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#8b6b43]/40 pb-3">
                  <div>
                    <span class="text-[10px] font-cinzel text-[#ffd700] uppercase font-bold tracking-wider block">
                      Registre des Affrontements
                    </span>
                    <h4 class="font-cinzel text-sm sm:text-base font-black text-[#f5ebd9] flex items-center gap-2">
                      <mat-icon class="text-[#ffd700] text-lg">workspace_premium</mat-icon>
                      Maîtrise Tactique : {{ monster.name }}
                    </h4>
                  </div>

                  <!-- Tally Counter Badges -->
                  <div class="flex items-center gap-3 text-xs font-mono font-bold">
                    <span class="px-2.5 py-1 rounded-lg bg-[#0c0805] border border-[#d4af37]/50 text-[#ffd700] flex items-center gap-1">
                      <mat-icon class="text-xs">sports_martial_arts</mat-icon>
                      Rencontres : {{ monster.encountersCount }}
                    </span>
                    <span class="px-2.5 py-1 rounded-lg bg-[#0c0805] border border-[#4dff88]/50 text-[#4dff88]">
                      Victoires : {{ monster.defeatsCount }} / {{ monster.masteryThreshold }}
                    </span>
                  </div>
                </div>

                <!-- Mastery Progress Meter -->
                <div>
                  <div class="flex items-center justify-between text-xs font-cinzel mb-1">
                    <span class="text-[#b59f7d]">Niveau de Savoir de Combat</span>
                    <span class="font-mono text-[#ffd700] font-bold">
                      {{ monster.isMastered ? 'Maîtrise Suprême Atteinte' : (monster.defeatsCount + ' / ' + monster.masteryThreshold) }}
                    </span>
                  </div>
                  <div class="w-full h-3 bg-[#0a0705] border border-[#8b6b43]/60 rounded-full overflow-hidden p-0.5">
                    <div
                      class="h-full bg-gradient-to-r from-[#d4af37] to-[#ffd700] rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(255,215,0,0.6)]"
                      [style.width.%]="monster.isMastered ? 100 : (monster.defeatsCount / monster.masteryThreshold * 100)"></div>
                  </div>
                </div>

                <!-- Mastery Perk Banner -->
                <div class="bg-[#0f0b07] border border-[#ffd700]/40 rounded-xl p-3 flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-[#d4af37]/15 border border-[#d4af37] flex items-center justify-center text-[#ffd700] shrink-0">
                    <mat-icon class="text-xl">military_tech</mat-icon>
                  </div>
                  <div class="flex-1 min-w-0">
                    <span class="text-[10px] font-cinzel text-[#ffd700] uppercase font-bold block">
                      {{ monster.isMastered ? '★ Bonus Permanent Actif ★' : 'Bonus à Débloquer à la Maîtrise :' }}
                    </span>
                    <p class="text-xs font-serif text-[#f0e4cb] font-bold">
                      {{ monster.masteryPerk }}
                    </p>
                  </div>
                </div>

                <!-- Scriptorium Study Button & Simulate Encounter -->
                <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <div class="flex items-center gap-2">
                    <button
                      (click)="simulateCombatEncounter(monster.id)"
                      title="Simuler une rencontre d'arène pour incrémenter le registre des observations"
                      class="px-3 py-2 rounded-xl border border-[#8b6b43] bg-[#1a140f] hover:bg-[#251d16] text-[#c5a880] hover:text-[#ffd700] text-xs font-cinzel font-bold flex items-center gap-1.5 transition-colors">
                      <mat-icon class="text-xs">sports_martial_arts</mat-icon>
                      <span>Simuler Rencontre (+1 Rencontre)</span>
                    </button>
                  </div>

                  @if (!monster.isMastered) {
                    <button
                      (click)="studyInScriptorium(monster.id)"
                      class="medieval-btn w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#d4af37] bg-gradient-to-r from-[#2c1e11] to-[#1c1208] text-[#ffd700] text-xs font-cinzel font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg hover:scale-102 transition-all">
                      <mat-icon class="text-sm">school</mat-icon>
                      <span>Étudier au Scriptorium (350 Or, 15 Éclats)</span>
                    </button>
                  }
                </div>
              </div>

            </div>
          }
        </div>

      </div>

      <!-- ======================================================= -->
      <!-- FULL-SCREEN ILLUMINATED MANUSCRIPT ARTWORK MODAL        -->
      <!-- ======================================================= -->
      @if (activeArtworkModal(); as modalMonster) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true">
          <!-- Backdrop Button -->
          <button
            type="button"
            aria-label="Fermer l'enluminure"
            (click)="closeArtworkModal()"
            class="fixed inset-0 w-full h-full bg-black/85 backdrop-blur-md border-0 cursor-default"></button>

          <!-- Modal Dialog Content -->
          <div
            class="relative z-10 max-w-2xl w-full bg-gradient-to-b from-[#1f150d] via-[#140e08] to-[#0a0705] border-3 border-[#d4af37] rounded-3xl p-5 sm:p-7 shadow-[0_0_50px_rgba(212,175,55,0.4)] space-y-4 max-h-[92vh] overflow-y-auto scrollbar-thin">

            <!-- Ornate Corner Motifs -->
            <mat-icon class="absolute top-3 left-3 text-[#ffd700]/70 text-xl select-none pointer-events-none">auto_awesome</mat-icon>
            <mat-icon class="absolute top-3 right-12 text-[#ffd700]/70 text-xl select-none pointer-events-none">auto_awesome</mat-icon>

            <!-- Close Button -->
            <button
              (click)="closeArtworkModal()"
              class="absolute top-3 right-3 w-8 h-8 rounded-full bg-[#2a1d12] border border-[#d4af37] text-[#ffd700] hover:text-white hover:bg-[#3d2917] flex items-center justify-center transition-all z-20">
              <mat-icon class="text-sm">close</mat-icon>
            </button>

            <!-- Modal Header -->
            <div class="text-center space-y-1 pt-1 border-b border-[#8b6b43]/40 pb-3">
              <span class="text-[10px] font-cinzel uppercase text-[#d4af37] font-bold tracking-widest block">
                Grand Grimoire Médiéval de la Haute Citadelle
              </span>
              <h2 class="font-cinzel-dec text-xl sm:text-2xl font-black text-[#f5ebd9]">
                {{ modalMonster.name }}
              </h2>
              <p class="text-xs font-serif text-[#d4af37] italic">
                « {{ modalMonster.title }} »
              </p>
            </div>

            <!-- Centered Large Artwork Frame -->
            <div class="relative mx-auto max-w-[440px] rounded-2xl overflow-hidden border-2 border-[#d4af37] shadow-2xl bg-[#0b0805]">
              <img
                [src]="modalMonster.imageUrl"
                [alt]="modalMonster.name"
                referrerpolicy="no-referrer"
                class="w-full aspect-square object-cover" />
            </div>

            <!-- Manuscript Inscription & Details -->
            <div class="bg-[#120d09] border border-[#8b6b43]/50 rounded-xl p-4 text-center space-y-2">
              <div class="flex items-center justify-center gap-3 text-xs font-cinzel font-bold">
                <span class="text-[#ffd700] flex items-center gap-1">
                  <mat-icon class="text-xs">{{ getFamilyIcon(modalMonster.family) }}</mat-icon>
                  {{ getFamilyLabel(modalMonster.family) }}
                </span>
                <span class="text-[#8b6b43]">•</span>
                <span class="text-[#ffd700] flex items-center gap-1">
                  <mat-icon class="text-xs">{{ getElementIcon(modalMonster.primaryElement) }}</mat-icon>
                  {{ getElementName(modalMonster.primaryElement) }}
                </span>
                <span class="text-[#8b6b43]">•</span>
                <div class="relative group/rarity inline-block">
                  <span
                    tabindex="0"
                    [attr.aria-label]="getMonsterDropTooltipText(modalMonster)"
                    [class]="getThreatRankStyle(modalMonster.threatRank)"
                    class="bestiary-rarity-trigger px-2 py-0.5 rounded text-[10px] border inline-flex items-center gap-1 cursor-help">
                    <mat-icon class="bestiary-rarity-icon text-xs">{{ getThreatRankIcon(modalMonster.threatRank) }}</mat-icon>
                    <span>{{ getThreatRankLabel(modalMonster.threatRank) }}</span>
                  </span>

                  <div class="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-68 p-3 rounded-xl bg-[#120d09]/95 border border-[#8b6b43] shadow-2xl z-50 opacity-0 pointer-events-none group-hover/rarity:opacity-100 group-focus-within/rarity:opacity-100 transition-opacity duration-200 backdrop-blur-md space-y-1.5 text-left font-normal">
                    <div class="flex items-center justify-between text-[11px] font-cinzel font-bold text-[#ffd700] border-b border-[#8b6b43]/30 pb-1">
                      <span>Taux de drop</span>
                      <span class="font-mono text-[10px] text-emerald-400 tabular-nums">Max {{ getMonsterBestDropPct(modalMonster) }}%</span>
                    </div>
                    @for (drop of modalMonster.drops; track drop.id) {
                      <div class="flex items-center justify-between gap-2 text-[10px]">
                        <span class="truncate font-serif text-[#f0e4cb]">{{ drop.name }}</span>
                        <span class="font-mono font-bold tabular-nums shrink-0" [style.color]="getDropRarityColor(drop.rarity)">
                          {{ drop.dropChancePct }}%
                        </span>
                      </div>
                    }
                  </div>
                </div>
              </div>

              @if (modalMonster.stats) {
                <div class="grid grid-cols-4 gap-2 pt-2 border-t border-[#8b6b43]/30 max-w-md mx-auto">
                  <div class="bg-[#18110b] border border-[#ef4444]/40 rounded-lg p-1.5 text-center">
                    <span class="text-[9px] font-cinzel text-[#ef4444] font-bold block">ᚠ FORCE</span>
                    <span class="font-mono text-xs font-black text-[#f5ebd9]">{{ modalMonster.stats.strength }}/100</span>
                  </div>
                  <div class="bg-[#18110b] border border-[#38bdf8]/40 rounded-lg p-1.5 text-center">
                    <span class="text-[9px] font-cinzel text-[#38bdf8] font-bold block">ᛏ DÉFENSE</span>
                    <span class="font-mono text-xs font-black text-[#f5ebd9]">{{ modalMonster.stats.defense }}/100</span>
                  </div>
                  <div class="bg-[#18110b] border border-[#a855f7]/40 rounded-lg p-1.5 text-center">
                    <span class="text-[9px] font-cinzel text-[#a855f7] font-bold block">ᛗ MAGIE</span>
                    <span class="font-mono text-xs font-black text-[#f5ebd9]">{{ modalMonster.stats.magic }}/100</span>
                  </div>
                  <div class="bg-[#18110b] border border-[#22c55e]/40 rounded-lg p-1.5 text-center">
                    <span class="text-[9px] font-cinzel text-[#22c55e] font-bold block">ᚱ VITESSE</span>
                    <span class="font-mono text-xs font-black text-[#f5ebd9]">{{ modalMonster.stats.speed }}/100</span>
                  </div>
                </div>
              }

              <p class="font-serif text-xs text-[#e0d3bc] leading-relaxed italic max-w-xl mx-auto">
                {{ modalMonster.loreExcerpt }}
              </p>
            </div>

            <!-- Action Button -->
            <div class="text-center pt-1">
              <button
                (click)="closeArtworkModal()"
                class="px-6 py-2 rounded-xl bg-gradient-to-r from-[#2c1e11] to-[#1c1208] border border-[#d4af37] text-[#ffd700] hover:text-white text-xs font-cinzel font-bold uppercase tracking-wider shadow hover:scale-102 transition-all">
                Fermer l'Enluminure
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ======================================================= -->
      <!-- FULL-SCREEN GRIMOIRE MODE (STATS + LORE TWO-PAGE FOLIO) -->
      <!-- ======================================================= -->
      @if (isGrimoireMode()) {
        @if (selectedMonster(); as gMonster) {
          <div
            class="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-[#060403]/95 backdrop-blur-lg"
            role="dialog"
            aria-modal="true"
            aria-label="Mode Grimoire plein écran">
            <!-- Backdrop Close Trigger -->
            <button
              type="button"
              aria-label="Fermer le Mode Grimoire"
              (click)="closeGrimoireMode()"
              class="fixed inset-0 w-full h-full bg-transparent border-0 cursor-default"></button>

            <!-- Two-Page Open Medieval Grimoire -->
            <div
              class="animate-bestiary-folio relative z-10 max-w-7xl w-full h-[94vh] rounded-3xl border-2 border-[#d4af37]/80 bg-gradient-to-br from-[#1d140c] via-[#120c07] to-[#080503] shadow-[0_0_60px_rgba(212,175,55,0.28)] flex flex-col overflow-hidden">

              <!-- Grimoire Spine Glow (Desktop) -->
              <div class="hidden lg:block pointer-events-none absolute inset-y-0 left-[41.6667%] w-px bg-gradient-to-b from-transparent via-[#d4af37]/40 to-transparent z-20"></div>

              <!-- Grimoire Top Header Bar -->
              <div class="relative z-30 flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-b border-[#8b6b43]/60 bg-[#140d07]/95">
                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-10 h-10 rounded-xl bg-[#d4af37]/15 border border-[#d4af37] flex items-center justify-center text-[#ffd700] shrink-0">
                    <mat-icon class="text-xl">auto_stories</mat-icon>
                  </div>
                  <div class="min-w-0">
                    <div class="flex flex-wrap items-center gap-2">
                      <span class="text-[10px] font-cinzel uppercase tracking-widest text-[#d4af37] font-bold">
                        Mode Grimoire · Codex Royal
                      </span>
                      <span
                        class="px-2 py-0.5 rounded-full text-[9px] font-cinzel font-bold uppercase border"
                        [class]="getStatusBadgeStyle(gMonster.discoveryStatus)">
                        {{ getStatusLabel(gMonster.discoveryStatus) }}
                      </span>
                      <div class="relative group/rarity inline-block">
                        <span
                          tabindex="0"
                          [attr.aria-label]="getMonsterDropTooltipText(gMonster)"
                          class="bestiary-rarity-trigger px-2 py-0.5 rounded text-[9px] font-cinzel font-bold border inline-flex items-center gap-1 cursor-help"
                          [class]="getThreatRankStyle(gMonster.threatRank)">
                          <mat-icon class="bestiary-rarity-icon text-[11px]">{{ getThreatRankIcon(gMonster.threatRank) }}</mat-icon>
                          <span>{{ getThreatRankLabel(gMonster.threatRank) }}</span>
                        </span>
                        <div class="absolute left-0 top-full mt-2 w-68 p-3 rounded-xl bg-[#120d09]/95 border border-[#8b6b43] shadow-2xl z-50 opacity-0 pointer-events-none group-hover/rarity:opacity-100 group-focus-within/rarity:opacity-100 transition-opacity duration-200 backdrop-blur-md space-y-1.5">
                          <div class="flex items-center justify-between text-[11px] font-cinzel font-bold text-[#ffd700] border-b border-[#8b6b43]/30 pb-1">
                            <span>Taux de Drop</span>
                            <span class="font-mono text-[10px] text-emerald-400 tabular-nums">Max {{ getMonsterBestDropPct(gMonster) }}%</span>
                          </div>
                          @for (drop of gMonster.drops; track drop.id) {
                            <div class="flex items-center justify-between gap-2 text-[10px]">
                              <span class="truncate font-serif text-[#f0e4cb]">{{ drop.name }}</span>
                              <span class="font-mono font-bold tabular-nums shrink-0" [style.color]="getDropRarityColor(drop.rarity)">
                                {{ drop.dropChancePct }}%
                              </span>
                            </div>
                          }
                        </div>
                      </div>
                    </div>
                    <h2 class="font-cinzel-dec text-lg sm:text-2xl font-black text-[#f5ebd9] truncate">
                      {{ gMonster.discoveryStatus === 'undiscovered' ? 'Entité Inconnue des Failles' : gMonster.name }}
                    </h2>
                  </div>
                </div>

                <!-- Pagination & Close Controls -->
                <div class="flex items-center gap-2 shrink-0">
                  <div class="inline-flex items-center bg-[#0c0805] border border-[#8b6b43]/60 rounded-xl p-1 gap-1">
                    <button
                      type="button"
                      (click)="navigateGrimoire(-1)"
                      [disabled]="!grimoirePageInfo().hasMultiple"
                      aria-label="Folio précédent"
                      class="w-8 h-8 rounded-lg bg-[#1c130c] hover:bg-[#2c1e12] text-[#ffd700] disabled:opacity-40 flex items-center justify-center transition-colors cursor-pointer">
                      <mat-icon class="text-base">chevron_left</mat-icon>
                    </button>
                    <span class="px-2 text-[11px] font-mono font-bold text-[#e5d8be] tabular-nums">
                      Folio {{ grimoirePageInfo().index }} / {{ grimoirePageInfo().total }}
                    </span>
                    <button
                      type="button"
                      (click)="navigateGrimoire(1)"
                      [disabled]="!grimoirePageInfo().hasMultiple"
                      aria-label="Folio suivant"
                      class="w-8 h-8 rounded-lg bg-[#1c130c] hover:bg-[#2c1e12] text-[#ffd700] disabled:opacity-40 flex items-center justify-center transition-colors cursor-pointer">
                      <mat-icon class="text-base">chevron_right</mat-icon>
                    </button>
                  </div>

                  <button
                    type="button"
                    (click)="closeGrimoireMode()"
                    class="px-3.5 py-2 rounded-xl bg-[#2a1d12] hover:bg-[#3d2917] border border-[#d4af37] text-[#ffd700] hover:text-white text-xs font-cinzel font-bold flex items-center gap-1.5 transition-all cursor-pointer">
                    <mat-icon class="text-sm">close</mat-icon>
                    <span class="hidden sm:inline">Fermer le Grimoire</span>
                  </button>
                </div>
              </div>

              <!-- Two-Page Spread Content -->
              <div class="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#8b6b43]/40 overflow-y-auto lg:overflow-hidden">

                <!-- LEFT PAGE: ILLUSTRATION, IDENTITY, STATS & ASTRAL RADAR -->
                <div class="lg:col-span-5 lg:overflow-y-auto scrollbar-thin p-5 sm:p-6 space-y-5 bg-gradient-to-b from-[#1a120b]/80 to-[#0c0805]/95">

                  <!-- Page Header: Habitat & Danger Rating -->
                  <div class="flex items-center justify-between gap-2 border-b border-[#8b6b43]/30 pb-3">
                    <div class="text-xs font-serif text-[#b59f7d] flex items-center gap-1.5">
                      <mat-icon class="text-sm text-[#d4af37]">place</mat-icon>
                      <span>{{ gMonster.habitat }}</span>
                    </div>
                    <div class="flex items-center gap-1 text-[#ef4444]" [title]="'Indice de dangerosité : ' + gMonster.dangerRating + '/5'">
                      @for (star of [1, 2, 3, 4, 5]; track star) {
                        <mat-icon class="text-sm">
                          {{ star <= gMonster.dangerRating ? 'skull' : 'radio_button_unchecked' }}
                        </mat-icon>
                      }
                      <span class="ml-1 text-[10px] font-mono font-bold text-[#fca5a5] tabular-nums">{{ gMonster.dangerRating }}/5</span>
                    </div>
                  </div>

                  <!-- Large Woodcut / Crest Frame -->
                  <div class="relative rounded-2xl overflow-hidden border-2 border-[#d4af37]/70 bg-[#0b0704] shadow-[0_0_30px_rgba(212,175,55,0.18)]">
                    @if (gMonster.imageUrl) {
                      <img
                        [src]="gMonster.imageUrl"
                        [alt]="gMonster.name"
                        referrerpolicy="no-referrer"
                        class="w-full max-h-[300px] object-cover"
                        [class.brightness-40]="gMonster.discoveryStatus === 'undiscovered'"
                        [class.contrast-125]="gMonster.discoveryStatus === 'undiscovered'" />
                    } @else {
                      <div class="w-full h-56 flex items-center justify-center bg-gradient-to-br from-[#23170d] to-[#0c0805]">
                        <mat-icon class="text-7xl text-[#d4af37]/70">{{ gMonster.icon }}</mat-icon>
                      </div>
                    }

                    <div class="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/75 border border-[#d4af37]/50 text-[10px] font-cinzel font-bold text-[#ffd700]">
                      Folio № {{ gMonster.id.replace('mon_', '') }}
                    </div>

                    @if (gMonster.isMastered) {
                      <div class="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-[#ffd700] text-black text-[10px] font-cinzel font-black uppercase shadow">
                        Maîtrisé
                      </div>
                    }

                    <div class="p-4 bg-gradient-to-t from-[#0b0704] via-[#120c07]/95 to-transparent border-t border-[#8b6b43]/30 space-y-2">
                      <p class="text-sm font-serif text-[#d4af37] italic">
                        « {{ gMonster.title }} »
                      </p>
                      <div class="flex flex-wrap items-center gap-2">
                        <span class="px-2 py-0.5 rounded text-[10px] font-cinzel font-bold border border-[#8b6b43]/50 bg-[#140e09] text-[#c5a880] flex items-center gap-1">
                          <mat-icon class="text-xs">{{ getFamilyIcon(gMonster.family) }}</mat-icon>
                          <span>{{ getFamilyLabel(gMonster.family) }}</span>
                        </span>
                        <span
                          class="px-2 py-0.5 rounded text-[10px] font-cinzel font-bold border flex items-center gap-1"
                          [class]="getElementChipStyle(gMonster.primaryElement)">
                          <mat-icon class="text-xs">{{ getElementIcon(gMonster.primaryElement) }}</mat-icon>
                          <span>{{ getElementName(gMonster.primaryElement) }}</span>
                        </span>
                        @if (gMonster.secondaryElement) {
                          <span
                            class="px-2 py-0.5 rounded text-[10px] font-cinzel font-bold border flex items-center gap-1"
                            [class]="getElementChipStyle(gMonster.secondaryElement)">
                            <mat-icon class="text-xs">{{ getElementIcon(gMonster.secondaryElement) }}</mat-icon>
                            <span>{{ getElementName(gMonster.secondaryElement) }}</span>
                          </span>
                        }
                      </div>
                    </div>
                  </div>

                  <!-- Detailed Martial & Occult Attribute Bars -->
                  @if (gMonster.stats; as stats) {
                    <div class="bg-[#120c07] border border-[#8b6b43]/50 rounded-2xl p-4 space-y-3">
                      <div class="flex items-center justify-between border-b border-[#8b6b43]/30 pb-2">
                        <span class="text-xs font-cinzel font-bold uppercase tracking-wider text-[#ffd700] flex items-center gap-1.5">
                          <mat-icon class="text-sm">analytics</mat-icon>
                          Statistiques Détaillées
                        </span>
                        <span class="text-[11px] font-mono font-bold text-[#e5d8be] tabular-nums">
                          Moyenne : {{ getStatAverage(gMonster) }}/100
                        </span>
                      </div>

                      <div class="grid grid-cols-2 gap-3">
                        <div class="bg-[#18110b] border border-[#ef4444]/40 rounded-xl p-2.5 space-y-1.5">
                          <div class="flex items-center justify-between text-[11px] font-cinzel font-bold text-[#fca5a5]">
                            <span class="flex items-center gap-1"><mat-icon class="text-xs">swords</mat-icon> Force</span>
                            <span class="font-mono tabular-nums">{{ stats.strength }}/100</span>
                          </div>
                          <div class="w-full h-1.5 rounded-full bg-black/70 overflow-hidden">
                            <div class="h-full rounded-full bg-[#ef4444]" [style.width.%]="stats.strength"></div>
                          </div>
                        </div>

                        <div class="bg-[#18110b] border border-[#38bdf8]/40 rounded-xl p-2.5 space-y-1.5">
                          <div class="flex items-center justify-between text-[11px] font-cinzel font-bold text-[#7dd3fc]">
                            <span class="flex items-center gap-1"><mat-icon class="text-xs">shield</mat-icon> Défense</span>
                            <span class="font-mono tabular-nums">{{ stats.defense }}/100</span>
                          </div>
                          <div class="w-full h-1.5 rounded-full bg-black/70 overflow-hidden">
                            <div class="h-full rounded-full bg-[#38bdf8]" [style.width.%]="stats.defense"></div>
                          </div>
                        </div>

                        <div class="bg-[#18110b] border border-[#a855f7]/40 rounded-xl p-2.5 space-y-1.5">
                          <div class="flex items-center justify-between text-[11px] font-cinzel font-bold text-[#d8b4fe]">
                            <span class="flex items-center gap-1"><mat-icon class="text-xs">auto_fix_high</mat-icon> Magie</span>
                            <span class="font-mono tabular-nums">{{ stats.magic }}/100</span>
                          </div>
                          <div class="w-full h-1.5 rounded-full bg-black/70 overflow-hidden">
                            <div class="h-full rounded-full bg-[#a855f7]" [style.width.%]="stats.magic"></div>
                          </div>
                        </div>

                        <div class="bg-[#18110b] border border-[#22c55e]/40 rounded-xl p-2.5 space-y-1.5">
                          <div class="flex items-center justify-between text-[11px] font-cinzel font-bold text-[#86efac]">
                            <span class="flex items-center gap-1"><mat-icon class="text-xs">bolt</mat-icon> Vitesse</span>
                            <span class="font-mono tabular-nums">{{ stats.speed }}/100</span>
                          </div>
                          <div class="w-full h-1.5 rounded-full bg-black/70 overflow-hidden">
                            <div class="h-full rounded-full bg-[#22c55e]" [style.width.%]="stats.speed"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  }

                  <!-- Astral Radar Chart -->
                  <app-bestiary-radar-chart [monster]="gMonster" />

                  <!-- Combat Record & Mastery Progress -->
                  <div class="bg-[#130d08] border border-[#d4af37]/50 rounded-2xl p-4 space-y-3">
                    <div class="flex items-center justify-between text-xs font-cinzel font-bold text-[#ffd700]">
                      <span class="flex items-center gap-1.5">
                        <mat-icon class="text-sm">workspace_premium</mat-icon>
                        Registre & Maîtrise
                      </span>
                      <span class="font-mono tabular-nums text-[#4dff88]">
                        {{ gMonster.defeatsCount }} / {{ gMonster.masteryThreshold }} victoires
                      </span>
                    </div>
                    <div class="w-full h-2.5 bg-[#090604] border border-[#8b6b43]/60 rounded-full overflow-hidden p-0.5">
                      <div
                        class="h-full bg-gradient-to-r from-[#d4af37] to-[#ffd700] rounded-full transition-all duration-500"
                        [style.width.%]="getMasteryProgressPct(gMonster)"></div>
                    </div>
                    <div class="flex items-center justify-between text-[11px] font-serif text-[#b59f7d]">
                      <span class="font-mono tabular-nums">Rencontres : {{ gMonster.encountersCount }}</span>
                      <span class="text-[#ffd700] font-bold truncate max-w-[65%]">{{ gMonster.masteryPerk }}</span>
                    </div>
                  </div>
                </div>

                <!-- RIGHT PAGE: LORE ARCHIVES, FIELD CHRONICLE, WEAKNESSES, ABILITIES & DROPS -->
                <div class="lg:col-span-7 lg:overflow-y-auto scrollbar-thin p-5 sm:p-6 space-y-5 bg-gradient-to-b from-[#150e09]/80 to-[#090604]/95">

                  <!-- Canonical Lore & Archivist Notes -->
                  <div class="bg-[#130d08] border-2 border-[#d4af37]/50 rounded-2xl p-5 space-y-4 shadow-xl">
                    <div class="flex items-center justify-between border-b border-[#8b6b43]/40 pb-2.5">
                      <div class="flex items-center gap-2">
                        <mat-icon class="text-[#d4af37] text-lg">auto_stories</mat-icon>
                        <h3 class="font-cinzel text-sm font-black text-[#f5ebd9] uppercase tracking-wider">
                          Archives Canoniques & Lore Complet
                        </h3>
                      </div>
                      <span class="text-[10px] font-mono text-[#8b6b43] uppercase">Scriptorium Royal</span>
                    </div>

                    <p class="font-serif text-sm sm:text-base text-[#ede2cc] leading-relaxed italic">
                      <span class="font-cinzel-dec text-3xl font-black text-[#d4af37] float-left mr-2.5 leading-none">«</span>
                      {{ gMonster.loreExcerpt }}
                    </p>

                    <div class="border-l-3 border-[#d4af37] pl-4 py-2 bg-[#1c140d]/70 rounded-r-xl space-y-1">
                      <span class="text-[10px] font-cinzel font-bold uppercase tracking-wider text-[#d4af37] block">
                        Notes Marginales de l'Archiviste
                      </span>
                      <p class="font-serif text-xs sm:text-sm text-[#ffd700] leading-relaxed">
                        {{ gMonster.archivistNotes }}
                      </p>
                    </div>
                  </div>

                  <!-- Field Chronicle with Live Re-Roll -->
                  <div
                    class="bg-[#160f09] border border-[#8b6b43]/60 rounded-2xl p-4 sm:p-5 space-y-3"
                    [class.animate-parchment-flash]="isGeneratingChronicle()">
                    <div class="flex flex-wrap items-center justify-between gap-2 border-b border-[#8b6b43]/30 pb-2.5">
                      <div class="flex items-center gap-2">
                        <mat-icon class="text-[#ffd700] text-base" [class.animate-quill]="isGeneratingChronicle()">history_edu</mat-icon>
                        <div>
                          <span class="text-[10px] font-cinzel uppercase text-[#d4af37] font-bold block">Chronique de Terrain</span>
                          <h4 class="font-cinzel text-xs sm:text-sm font-black text-[#f5ebd9]">{{ currentChronicle().headline }}</h4>
                        </div>
                      </div>
                      <button
                        type="button"
                        (click)="generateNewRandomChronicle(gMonster)"
                        [disabled]="isGeneratingChronicle()"
                        class="px-3 py-1.5 rounded-lg border border-[#d4af37] bg-[#24180d] hover:bg-[#332212] text-[#ffd700] text-[11px] font-cinzel font-bold flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer">
                        <mat-icon class="text-xs" [class.animate-spin]="isGeneratingChronicle()">casino</mat-icon>
                        <span>Nouvelle Chronique</span>
                      </button>
                    </div>

                    <div class="flex flex-wrap items-center gap-2 text-[11px] font-serif text-[#b59f7d]">
                      <span class="text-[#ffd700] font-bold">{{ currentChronicle().chroniclerName }}</span>
                      <span>•</span>
                      <span class="italic">{{ currentChronicle().chroniclerRole }}</span>
                      <span>•</span>
                      <span class="font-mono text-[#8b6b43]">{{ currentChronicle().chronicleDate }}</span>
                      <span class="ml-auto text-[10px] font-mono text-[#ffd700]">{{ currentChronicle().elementalEcho }}</span>
                    </div>

                    <p class="font-serif text-xs sm:text-sm text-[#e5d8be] leading-relaxed italic border-l-2 border-[#d4af37]/50 pl-3">
                      {{ currentChronicle().description }}
                    </p>

                    <div class="bg-[#0f0a06] border border-[#d4af37]/30 rounded-xl p-3 flex items-start gap-2">
                      <mat-icon class="text-sm text-[#4dff88] shrink-0 mt-0.5">tips_and_updates</mat-icon>
                      <p class="text-xs font-serif text-[#e5d8be] leading-relaxed">
                        <strong class="font-cinzel text-[#ffd700]">Observation tactique :</strong>
                        {{ currentChronicle().tacticalObservation }}
                      </p>
                    </div>
                  </div>

                  <!-- Weaknesses & Resistances Grid -->
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="bg-[#140c0a] border border-[#ff4d4d]/50 rounded-2xl p-4 space-y-2.5">
                      <div class="flex items-center gap-2 text-xs font-cinzel font-black text-[#ff8080] uppercase border-b border-[#ff4d4d]/25 pb-2">
                        <mat-icon class="text-sm text-[#ff4d4d]">broken_image</mat-icon>
                        <span>Faiblesses Majeures</span>
                      </div>
                      <div class="space-y-2">
                        @for (weakness of gMonster.weaknesses; track weakness.element) {
                          <div class="bg-[#1c100d] border border-[#ff4d4d]/40 rounded-xl p-2.5 space-y-1">
                            <div class="flex items-center justify-between text-xs">
                              <span class="font-cinzel font-bold text-[#ffcccc] flex items-center gap-1">
                                <mat-icon class="text-xs text-[#ff9999]">{{ getElementIcon(weakness.element) }}</mat-icon>
                                {{ getElementName(weakness.element) }}
                              </span>
                              <span class="font-mono text-[10px] font-bold text-[#ff6666] tabular-nums">{{ weakness.multiplier }}</span>
                            </div>
                            <p class="text-[11px] font-serif text-[#e5d8be] leading-snug">{{ weakness.tacticalAdvice }}</p>
                          </div>
                        }
                      </div>
                    </div>

                    <div class="bg-[#0d1018] border border-[#38bdf8]/40 rounded-2xl p-4 space-y-2.5">
                      <div class="flex items-center gap-2 text-xs font-cinzel font-black text-[#7dd3fc] uppercase border-b border-[#38bdf8]/25 pb-2">
                        <mat-icon class="text-sm text-[#38bdf8]">shield</mat-icon>
                        <span>Résistances & Immunités</span>
                      </div>
                      <div class="space-y-2">
                        @for (res of gMonster.resistances; track res.element) {
                          <div class="bg-[#111624] border border-[#38bdf8]/30 rounded-xl p-2.5 space-y-1">
                            <div class="flex items-center justify-between text-xs">
                              <span class="font-cinzel font-bold text-[#bae6fd] flex items-center gap-1">
                                <mat-icon class="text-xs text-[#38bdf8]">{{ getElementIcon(res.element) }}</mat-icon>
                                {{ getElementName(res.element) }}
                              </span>
                              <span class="font-mono text-[10px] font-bold text-[#7dd3fc] tabular-nums">{{ res.reduction }}</span>
                            </div>
                            <p class="text-[11px] font-serif text-[#94a3b8] leading-snug">{{ res.tacticalAdvice }}</p>
                          </div>
                        }
                      </div>
                    </div>
                  </div>

                  <!-- Signature Abilities & Counter Strategies -->
                  <div class="space-y-2.5">
                    <div class="flex items-center gap-2 border-b border-[#8b6b43]/30 pb-2">
                      <mat-icon class="text-[#d4af37] text-base">auto_fix_high</mat-icon>
                      <h4 class="font-cinzel text-xs sm:text-sm font-bold text-[#e5d8be] uppercase tracking-wider">
                        Capacités & Contre-Mesures
                      </h4>
                    </div>
                    <div class="space-y-2.5">
                      @for (ability of gMonster.signatureAbilities; track ability.name) {
                        <div class="bg-[#150f0a] border border-[#8b6b43]/40 rounded-xl p-3.5 space-y-1.5">
                          <div class="flex items-center justify-between gap-2">
                            <span class="font-cinzel text-xs font-bold text-[#f5ebd9] flex items-center gap-1.5">
                              <mat-icon class="text-sm text-[#d4af37]">{{ ability.icon }}</mat-icon>
                              {{ ability.name }}
                            </span>
                            <span
                              class="px-2 py-0.5 rounded text-[9px] font-cinzel font-bold uppercase border"
                              [class.bg-[#fb923c]/20_text-[#fb923c]_border-[#fb923c]/40]="ability.type === 'active'"
                              [class.bg-[#38bdf8]/20_text-[#38bdf8]_border-[#38bdf8]/40]="ability.type === 'passive'"
                              [class.bg-[#f43f5e]/20_text-[#f43f5e]_border-[#f43f5e]/40]="ability.type === 'ultimate'">
                              {{ ability.type }}
                            </span>
                          </div>
                          <p class="text-xs font-serif text-[#b59f7d]">{{ ability.description }}</p>
                          <p class="text-[11px] font-serif text-[#4dff88] bg-[#0b0805] rounded-lg px-2.5 py-1.5 border border-[#8b6b43]/30">
                            <span class="font-bold">Contre-tactique :</span> {{ ability.counterStrategy }}
                          </p>
                        </div>
                      }
                    </div>
                  </div>

                  <!-- Harvestable Drops -->
                  <div class="space-y-2.5">
                    <div class="flex items-center justify-between border-b border-[#8b6b43]/30 pb-2">
                      <div class="flex items-center gap-2">
                        <mat-icon class="text-[#d4af37] text-base">card_giftcard</mat-icon>
                        <h4 class="font-cinzel text-xs sm:text-sm font-bold text-[#e5d8be] uppercase tracking-wider">
                          Table des Butins & Reliques
                        </h4>
                      </div>
                      <span class="text-[10px] font-mono text-emerald-400 tabular-nums">Max {{ getMonsterBestDropPct(gMonster) }}%</span>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      @for (drop of gMonster.drops; track drop.id) {
                        <div class="bg-[#120d09] border border-[#8b6b43]/40 rounded-xl p-3 space-y-1">
                          <div class="flex items-center justify-between gap-2">
                            <span class="text-[10px] font-cinzel font-bold" [style.color]="getDropRarityColor(drop.rarity)">
                              {{ getDropRarityLabel(drop.rarity) }}
                            </span>
                            <span class="font-mono text-[10px] font-bold tabular-nums" [style.color]="getDropRarityColor(drop.rarity)">
                              {{ drop.dropChancePct }}%
                            </span>
                          </div>
                          <h5 class="font-cinzel text-xs font-bold text-[#f0e4cb] truncate">{{ drop.name }}</h5>
                          <p class="text-[10px] font-serif text-[#a89070] leading-snug">{{ drop.description }}</p>
                        </div>
                      }
                    </div>
                  </div>

                  <!-- Grimoire Action Bar -->
                  <div class="pt-3 border-t border-[#8b6b43]/40 flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      (click)="simulateCombatEncounter(gMonster.id)"
                      class="px-3.5 py-2 rounded-xl border border-[#8b6b43] bg-[#1a140f] hover:bg-[#251d16] text-[#c5a880] hover:text-[#ffd700] text-xs font-cinzel font-bold flex items-center gap-1.5 transition-colors cursor-pointer">
                      <mat-icon class="text-sm">sports_martial_arts</mat-icon>
                      <span>Simuler Rencontre</span>
                    </button>

                    <div class="flex flex-wrap items-center gap-2">
                      @if (gMonster.discoveryStatus === 'undiscovered') {
                        <button
                          type="button"
                          (click)="buyScoutRumor(gMonster.id)"
                          class="px-4 py-2 rounded-xl border border-[#d4af37] bg-[#241a11] hover:bg-[#332417] text-[#ffd700] text-xs font-cinzel font-bold flex items-center gap-1.5 transition-colors cursor-pointer">
                          <mat-icon class="text-sm">visibility</mat-icon>
                          <span>Éclaireur (150 Or)</span>
                        </button>
                      } @else if (!gMonster.isMastered) {
                        <button
                          type="button"
                          (click)="studyInScriptorium(gMonster.id)"
                          class="medieval-btn px-4 py-2 rounded-xl border border-[#d4af37] bg-gradient-to-r from-[#2c1e11] to-[#1c1208] text-[#ffd700] text-xs font-cinzel font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg cursor-pointer">
                          <mat-icon class="text-sm">school</mat-icon>
                          <span>Étudier au Scriptorium</span>
                        </button>
                      }

                      <button
                        type="button"
                        (click)="closeGrimoireMode()"
                        class="px-4 py-2 rounded-xl border border-[#8b6b43]/70 bg-[#140e09] hover:bg-[#22170e] text-[#e5d8be] text-xs font-cinzel font-bold flex items-center gap-1.5 transition-colors cursor-pointer">
                        <mat-icon class="text-sm">close</mat-icon>
                        <span>Fermer</span>
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        }
      }

    </div>
  `,
})
export class BestiaryView {
  readonly gameState = inject(GameStateService);
  readonly sound = inject(SoundService);

  readonly searchQuery = signal<string>('');
  readonly statusFilter = signal<StatusFilter>('all');
  readonly familyFilter = signal<MonsterFamily | 'all'>('all');
  readonly elementFilter = signal<BestiaryWeaknessElement | 'all'>('all');
  readonly threatFilter = signal<ThreatRank | 'all'>('all');
  readonly showExplorationRadar = signal<boolean>(true);
  readonly isGrimoireMode = signal<boolean>(false);

  // Fullscreen Artwork Modal State
  readonly activeArtworkModal = signal<BestiaryEntry | null>(null);

  // Interactive Chronicle Generation State
  readonly activeChronicles = signal<Record<string, GeneratedMonsterChronicle>>({});
  readonly isGeneratingChronicle = signal<boolean>(false);
  readonly chronicleAnimationKey = signal<number>(0);

  // Currently selected creature ID
  readonly selectedMonsterId = signal<string>(
    this.gameState.bestiaryEntries().find(m => m.encountersCount > 0 || m.discoveryStatus !== 'undiscovered')?.id ||
    this.gameState.bestiaryEntries()[0]?.id || ''
  );

  openArtworkModal(monster: BestiaryEntry) {
    this.activeArtworkModal.set(monster);
    this.sound.playClick();
  }

  closeArtworkModal() {
    this.activeArtworkModal.set(null);
    this.sound.playClick();
  }

  openGrimoireMode() {
    if (!this.selectedMonster()) return;
    this.isGrimoireMode.set(true);
    this.sound.playParchmentFlip();
  }

  closeGrimoireMode() {
    this.isGrimoireMode.set(false);
    this.sound.playClick();
  }

  onEscapeKey() {
    if (this.activeArtworkModal()) {
      this.closeArtworkModal();
    } else if (this.isGrimoireMode()) {
      this.closeGrimoireMode();
    }
  }

  navigateGrimoire(delta: -1 | 1) {
    const list = this.filteredMonsters();
    if (list.length <= 1) return;
    const currentId = this.selectedMonster()?.id;
    const currentIdx = list.findIndex(m => m.id === currentId);
    const baseIdx = currentIdx >= 0 ? currentIdx : 0;
    const nextIdx = (baseIdx + delta + list.length) % list.length;
    this.selectedMonsterId.set(list[nextIdx].id);
    this.sound.playParchmentFlip();
  }

  getStatAverage(monster: BestiaryEntry): number {
    if (!monster.stats) return 0;
    const s = monster.stats;
    return Math.round((s.strength + s.defense + s.magic + s.speed) / 4);
  }

  getMasteryProgressPct(monster: BestiaryEntry): number {
    if (monster.isMastered) return 100;
    if (!monster.masteryThreshold) return 0;
    return Math.min(100, Math.round((monster.defeatsCount / monster.masteryThreshold) * 100));
  }

  readonly selectedMonster = computed<BestiaryEntry | null>(() => {
    const id = this.selectedMonsterId();
    return this.gameState.bestiaryEntries().find(m => m.id === id) || this.gameState.bestiaryEntries()[0] || null;
  });

  readonly grimoirePageInfo = computed(() => {
    const list = this.filteredMonsters();
    const current = this.selectedMonster();
    const idx = current ? list.findIndex(m => m.id === current.id) : -1;
    return {
      index: idx >= 0 ? idx + 1 : 1,
      total: Math.max(list.length, 1),
      hasMultiple: list.length > 1,
    };
  });

  // Current Generated Chronicle for the selected monster
  readonly currentChronicle = computed<GeneratedMonsterChronicle>(() => {
    const monster = this.selectedMonster();
    if (!monster) {
      return {
        id: 'default',
        monsterId: '',
        monsterName: 'Inconnu',
        chroniclerName: 'Archiviste Inconnu',
        chroniclerRole: 'Scribe',
        chronicleDate: 'An 418',
        category: 'sighting',
        categoryLabel: 'Témoignage',
        categoryIcon: 'visibility',
        headline: '« Récit Perdu dans les Éthers »',
        description: 'Aucune chronique n’a encore été rédigée.',
        tacticalObservation: 'Restez vigilant.',
        environmentalCondition: 'Inconnu',
        witnessReliability: 'Incontestable',
        elementalEcho: 'Aucune résonance',
      };
    }

    const dict = this.activeChronicles();
    if (dict[monster.id]) {
      return dict[monster.id];
    }

    // Auto-generate initial chronicle deterministically for this monster
    return MonsterDescriptionGenerator.generateChronicle(monster, monster.id.length * 42);
  });

  readonly monsterFamilies: { id: MonsterFamily; label: string; icon: string }[] = [
    { id: 'undead', label: 'Morts-vivants', icon: 'coronavirus' },
    { id: 'beast', label: 'Bêtes Sauvages', icon: 'pets' },
    { id: 'demon', label: 'Démons', icon: 'whatshot' },
    { id: 'dragon', label: 'Dragons', icon: 'cyclone' },
    { id: 'elemental', label: 'Élémentaires', icon: 'volcano' },
    { id: 'aberration', label: 'Aberrations', icon: 'all_inclusive' },
    { id: 'humanoid', label: 'Humanoïdes', icon: 'military_tech' },
    { id: 'construct', label: 'Constructions', icon: 'shield' },
  ];

  readonly availableElements: {
    id: BestiaryWeaknessElement;
    label: string;
    icon: string;
    color: string;
    glowColor: string;
    activeClass: string;
  }[] = [
    {
      id: 'fire',
      label: 'Feu',
      icon: 'whatshot',
      color: '#ff6b4a',
      glowColor: 'rgba(255, 107, 74, 0.35)',
      activeClass: 'bg-[#ff4d4d]/20 text-[#ff8080] border-[#ff4d4d]',
    },
    {
      id: 'ice',
      label: 'Glace',
      icon: 'ac_unit',
      color: '#38bdf8',
      glowColor: 'rgba(56, 189, 248, 0.35)',
      activeClass: 'bg-[#38bdf8]/20 text-[#7dd3fc] border-[#38bdf8]',
    },
    {
      id: 'shadow',
      label: 'Ombre',
      icon: 'nightlight',
      color: '#c084fc',
      glowColor: 'rgba(192, 132, 252, 0.35)',
      activeClass: 'bg-[#a855f7]/20 text-[#d8b4fe] border-[#c084fc]',
    },
    {
      id: 'light',
      label: 'Lumière',
      icon: 'wb_sunny',
      color: '#fbbf24',
      glowColor: 'rgba(251, 191, 36, 0.35)',
      activeClass: 'bg-[#fbbf24]/20 text-[#fde047] border-[#fbbf24]',
    },
    {
      id: 'nature',
      label: 'Nature',
      icon: 'eco',
      color: '#4ade80',
      glowColor: 'rgba(74, 222, 128, 0.35)',
      activeClass: 'bg-[#4ade80]/20 text-[#86efac] border-[#4ade80]',
    },
    {
      id: 'arcane',
      label: 'Arcane',
      icon: 'auto_awesome',
      color: '#ec4899',
      glowColor: 'rgba(236, 72, 153, 0.35)',
      activeClass: 'bg-[#ec4899]/20 text-[#f472b6] border-[#ec4899]',
    },
    {
      id: 'physical',
      label: 'Physique',
      icon: 'fitness_center',
      color: '#f97316',
      glowColor: 'rgba(249, 115, 22, 0.35)',
      activeClass: 'bg-[#f97316]/20 text-[#fdba74] border-[#f97316]',
    },
  ];

  readonly filteredMonsters = computed<BestiaryEntry[]>(() => {
    const list = this.gameState.bestiaryEntries();
    const query = this.searchQuery().toLowerCase().trim();
    const stFilter = this.statusFilter();
    const famFilter = this.familyFilter();
    const elemFilter = this.elementFilter();
    const thFilter = this.threatFilter();

    return list.filter(entry => {
      // Query filter
      if (query) {
        const matchesName = entry.name.toLowerCase().includes(query);
        const matchesTitle = entry.title.toLowerCase().includes(query);
        const matchesHabitat = entry.habitat.toLowerCase().includes(query);
        const matchesElement =
          entry.primaryElement.toLowerCase().includes(query) ||
          (entry.secondaryElement && entry.secondaryElement.toLowerCase().includes(query)) ||
          this.getElementName(entry.primaryElement).toLowerCase().includes(query) ||
          this.getElementShortName(entry.primaryElement).toLowerCase().includes(query);
        const matchesWeakness = entry.weaknesses.some(w =>
          w.element.toLowerCase().includes(query) || w.tacticalAdvice.toLowerCase().includes(query)
        );
        const matchesDrops = entry.drops.some(d => d.name.toLowerCase().includes(query));
        if (!matchesName && !matchesTitle && !matchesHabitat && !matchesElement && !matchesWeakness && !matchesDrops) {
          return false;
        }
      }

      // Status filter
      if (stFilter === 'encountered') {
        const hasEncountered = entry.encountersCount > 0 || entry.discoveryStatus !== 'undiscovered';
        if (!hasEncountered) return false;
      } else if (stFilter === 'discovered') {
        if (entry.discoveryStatus === 'undiscovered') return false;
      } else if (stFilter === 'mastered') {
        if (!entry.isMastered) return false;
      } else if (stFilter === 'undiscovered') {
        if (entry.discoveryStatus !== 'undiscovered') return false;
      }

      // Family filter
      if (famFilter !== 'all' && entry.family !== famFilter) return false;

      // Elemental Type filter
      if (elemFilter !== 'all') {
        const matchesElem = entry.primaryElement === elemFilter || entry.secondaryElement === elemFilter;
        if (!matchesElem) return false;
      }

      // Threat filter
      if (thFilter !== 'all' && entry.threatRank !== thFilter) return false;

      return true;
    });
  });

  selectMonster(id: string) {
    this.selectedMonsterId.set(id);
    this.sound.playParchmentFlip();
  }

  toggleExplorationRadar() {
    this.showExplorationRadar.update(v => !v);
    this.sound.playClick();
  }

  onRadarSelectMonster(id: string) {
    const isVisibleInList = this.filteredMonsters().some(m => m.id === id);
    if (!isVisibleInList) {
      this.searchQuery.set('');
      this.statusFilter.set('all');
      this.familyFilter.set('all');
      this.elementFilter.set('all');
      this.threatFilter.set('all');
    }
    this.selectedMonsterId.set(id);
    this.sound.playParchmentFlip();
  }

  generateNewRandomChronicle(monster: BestiaryEntry) {
    this.isGeneratingChronicle.set(true);
    this.sound.playParchmentFlip();

    // Generate fresh procedural chronicle with random seed
    const newChronicle = MonsterDescriptionGenerator.generateChronicle(monster);

    // Update active dictionary
    this.activeChronicles.update(dict => ({
      ...dict,
      [monster.id]: newChronicle,
    }));

    // Trigger ink animation
    this.chronicleAnimationKey.update(k => k + 1);

    setTimeout(() => {
      this.isGeneratingChronicle.set(false);
    }, 280);
  }

  simulateCombatEncounter(monsterId: string) {
    this.gameState.recordMonsterEncounter(monsterId);
    this.sound.playSwordHit();
  }

  toggleOnlyEncountered() {
    if (this.statusFilter() === 'encountered') {
      this.statusFilter.set('all');
    } else {
      this.statusFilter.set('encountered');
    }
    this.sound.playClick();
  }

  updateSearch(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.searchQuery.set(val);
  }

  clearSearch() {
    this.searchQuery.set('');
    this.sound.playClick();
  }

  setStatusFilter(status: StatusFilter) {
    this.statusFilter.set(status);
    this.sound.playClick();
  }

  setFamilyFilter(fam: MonsterFamily | 'all') {
    this.familyFilter.set(fam);
    this.sound.playClick();
  }

  setElementFilter(elem: BestiaryWeaknessElement | 'all') {
    this.elementFilter.set(elem);
    this.sound.playClick();
  }

  setThreatFilter(threat: ThreatRank | 'all') {
    this.threatFilter.set(threat);
    this.sound.playClick();
  }

  resetFilters() {
    this.searchQuery.set('');
    this.statusFilter.set('all');
    this.familyFilter.set('all');
    this.elementFilter.set('all');
    this.threatFilter.set('all');
    this.sound.playClick();
  }

  studyInScriptorium(monsterId: string) {
    this.gameState.researchMonsterInScriptorium(monsterId);
  }

  buyScoutRumor(monsterId: string) {
    this.gameState.unlockMonsterLore(monsterId);
  }

  getFamilyMonsterCount(family: MonsterFamily): number {
    return this.gameState.bestiaryEntries().filter(m => m.family === family).length;
  }

  getElementMonsterCount(elem: BestiaryWeaknessElement): number {
    return this.gameState.bestiaryEntries().filter(
      m => m.primaryElement === elem || m.secondaryElement === elem
    ).length;
  }

  getFamilyLabel(family: MonsterFamily): string {
    const f = this.monsterFamilies.find(x => x.id === family);
    return f ? f.label : family;
  }

  getFamilyIcon(family: MonsterFamily): string {
    const f = this.monsterFamilies.find(x => x.id === family);
    return f ? f.icon : 'category';
  }

  getThreatRankLabel(threat: ThreatRank): string {
    switch (threat) {
      case 'mythic': return 'Mythique';
      case 'boss': return 'Boss d’Acte';
      case 'elite': return 'Élite';
      case 'normal': return 'Standard';
      default: return threat;
    }
  }

  getThreatRankStyle(threat: ThreatRank): string {
    switch (threat) {
      case 'mythic': return 'bg-[#f43f5e]/20 text-[#f43f5e] border-[#f43f5e]/50';
      case 'boss': return 'bg-[#fb923c]/20 text-[#fb923c] border-[#fb923c]/50';
      case 'elite': return 'bg-[#c084fc]/20 text-[#c084fc] border-[#c084fc]/50';
      case 'normal': return 'bg-stone-800 text-stone-300 border-stone-600';
      default: return 'bg-stone-800 text-stone-300 border-stone-600';
    }
  }

  getThreatRankIcon(threat: ThreatRank): string {
    switch (threat) {
      case 'mythic': return 'auto_awesome';
      case 'boss': return 'local_fire_department';
      case 'elite': return 'star';
      case 'normal': return 'shield';
      default: return 'shield';
    }
  }

  getMonsterBestDropPct(monster: BestiaryEntry): number {
    if (!monster.drops || monster.drops.length === 0) return 0;
    return Math.max(...monster.drops.map(d => d.dropChancePct));
  }

  getMonsterAvgDropPct(monster: BestiaryEntry): number {
    if (!monster.drops || monster.drops.length === 0) return 0;
    const sum = monster.drops.reduce((acc, d) => acc + d.dropChancePct, 0);
    return Math.round(sum / monster.drops.length);
  }

  getMonsterDropTooltipText(monster: BestiaryEntry): string {
    const rankLabel = this.getThreatRankLabel(monster.threatRank);
    if (!monster.drops || monster.drops.length === 0) {
      return `Rareté ${rankLabel} — Aucun butin répertorié`;
    }
    if (monster.discoveryStatus === 'undiscovered') {
      return `Rareté ${rankLabel} — Taux de drop estimé jusqu'à ${this.getMonsterBestDropPct(monster)}%`;
    }
    const list = monster.drops.map(d => `${d.name} (${d.dropChancePct}%)`).join(', ');
    return `Rareté ${rankLabel} — Taux de drop : ${list}`;
  }

  getThreatRankMonsterCount(threat: ThreatRank): number {
    return this.gameState.bestiaryEntries().filter(m => m.threatRank === threat).length;
  }

  getThreatRankDropSummary(threat: ThreatRank): string {
    const matching = this.gameState.bestiaryEntries().filter(m => m.threatRank === threat);
    const allDrops = matching.flatMap(m => m.drops.map(d => d.dropChancePct));
    if (allDrops.length === 0) return 'Aucun taux de drop enregistré.';
    const min = Math.min(...allDrops);
    const max = Math.max(...allDrops);
    const avg = Math.round(allDrops.reduce((a, b) => a + b, 0) / allDrops.length);
    return `Taux de drop des créatures de ce rang : ${min}% à ${max}% (moyenne ${avg}%).`;
  }

  getDropRarityColor(rarity: CardRarity): string {
    switch (rarity) {
      case 'legendary': return '#fbbf24';
      case 'epic': return '#c084fc';
      case 'rare': return '#38bdf8';
      default: return '#94a3b8';
    }
  }

  getDropRarityLabel(rarity: CardRarity): string {
    switch (rarity) {
      case 'legendary': return 'Légendaire';
      case 'epic': return 'Épique';
      case 'rare': return 'Rare';
      default: return 'Commun';
    }
  }

  getStatusLabel(status: DiscoveryStatus): string {
    switch (status) {
      case 'mastered': return 'Maîtrisé';
      case 'studied': return 'Étudié';
      case 'spotted': return 'Aperçu';
      case 'undiscovered': return 'Inconnu';
      default: return status;
    }
  }

  getStatusBadgeStyle(status: DiscoveryStatus): string {
    switch (status) {
      case 'mastered': return 'bg-[#ffd700]/20 text-[#ffd700] border-[#ffd700]/60';
      case 'studied': return 'bg-[#38bdf8]/20 text-[#38bdf8] border-[#38bdf8]/50';
      case 'spotted': return 'bg-[#fb923c]/20 text-[#fb923c] border-[#fb923c]/50';
      case 'undiscovered': return 'bg-stone-900 text-stone-500 border-stone-700';
      default: return 'bg-stone-900 text-stone-500 border-stone-700';
    }
  }

  getElementName(elem: BestiaryWeaknessElement): string {
    switch (elem) {
      case 'light': return 'Lumière Sacrée';
      case 'fire': return 'Feu Primordial';
      case 'ice': return 'Givre / Glace';
      case 'shadow': return 'Ombre / Néant';
      case 'arcane': return 'Magie Arcanique';
      case 'nature': return 'Nature & Poison';
      case 'physical': return 'Dégâts Physiques';
      default: return elem;
    }
  }

  getElementShortName(elem: BestiaryWeaknessElement): string {
    switch (elem) {
      case 'light': return 'Lumière';
      case 'fire': return 'Feu';
      case 'ice': return 'Givre';
      case 'shadow': return 'Ombre';
      case 'arcane': return 'Arcane';
      case 'nature': return 'Nature';
      case 'physical': return 'Physique';
      default: return elem;
    }
  }

  getElementIcon(elem: BestiaryWeaknessElement): string {
    switch (elem) {
      case 'light': return 'wb_sunny';
      case 'fire': return 'whatshot';
      case 'ice': return 'ac_unit';
      case 'shadow': return 'nightlight';
      case 'arcane': return 'auto_awesome';
      case 'nature': return 'eco';
      case 'physical': return 'swords';
      default: return 'help';
    }
  }

  getElementChipStyle(elem: BestiaryWeaknessElement): string {
    switch (elem) {
      case 'light': return 'bg-[#ffd700]/20 text-[#ffd700] border-[#ffd700]/40';
      case 'fire': return 'bg-[#ff4d4d]/20 text-[#ff7070] border-[#ff4d4d]/40';
      case 'ice': return 'bg-[#38bdf8]/20 text-[#7dd3fc] border-[#38bdf8]/40';
      case 'shadow': return 'bg-[#a855f7]/20 text-[#d8b4fe] border-[#a855f7]/40';
      case 'arcane': return 'bg-[#ec4899]/20 text-[#f472b6] border-[#ec4899]/40';
      case 'nature': return 'bg-[#4dff88]/20 text-[#86efac] border-[#4dff88]/40';
      case 'physical': return 'bg-stone-700/50 text-stone-200 border-stone-500';
      default: return 'bg-stone-800 text-stone-300 border-stone-600';
    }
  }
}
