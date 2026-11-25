import {
  ChangeDetectionStrategy,
  Component,
  inject,
  output,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { GameStateService } from '../../services/game-state';
import { SoundService } from '../../services/sound';
import { BestiaryRadarChart } from '../bestiary-radar-chart/bestiary-radar-chart';
import {
  BestiaryEntry,
  Card,
  CompanionPet,
  Hero
} from '../../models/game.model';
import { INITIAL_BESTIARY_DATABASE } from '../../data/bestiary-database';
import { ALL_GAME_CARDS } from '../../data/cards-database';
import { ALL_GAME_HEROES } from '../../data/heroes-database';
import { INITIAL_COMPANION_PETS } from '../../data/pets-database';

export type ShowcaseTab = 'bestiary' | 'heroes' | 'cards' | 'pets';
export type FactionChoice = 'flame' | 'frost' | 'shadow';

interface ShowcasePillar {
  icon: string;
  badge: string;
  title: string;
  description: string;
  highlights: string[];
}

interface FaqItem {
  question: string;
  answer: string;
  isOpen: boolean;
}

@Component({
  selector: 'app-public-showcase',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule, BestiaryRadarChart],
  template: `
    <div class="min-h-screen text-[#e0dcc7] bg-[#0c0906] selection:bg-[#8b2b2b] selection:text-white pb-20">

      <!-- ======================================================= -->
      <!-- TOP ANNOUNCEMENT BANNER                                 -->
      <!-- ======================================================= -->
      <div class="bg-gradient-to-r from-[#2c1208] via-[#481c0c] to-[#2c1208] border-b border-[#d4af37]/40 py-2.5 px-4 text-center text-xs font-cinzel">
        <div class="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div class="flex items-center gap-2 text-[#ffd700]">
            <img
              src="/src/assets/images/emblem_aetheria_crest_1795189810140.jpg"
              alt="Blason Aetheria"
              class="w-5 h-5 rounded object-cover border border-[#d4af37]/70 shrink-0"
              referrerpolicy="no-referrer" />
            <span class="font-bold tracking-wider">ÉDITION BÊTA PUBLIQUE OFFICIELLE</span>
            <span class="text-[#c5a880] hidden md:inline">· Accès libre dans le navigateur, sans téléchargement</span>
          </div>
          <div class="flex items-center gap-3">
            <button
              (click)="triggerLaunchGame()"
              class="px-3 py-1 bg-[#d4af37] text-black font-black rounded-full hover:bg-[#ffd700] transition-colors shadow-sm text-[11px] flex items-center gap-1">
              <mat-icon class="text-xs">play_arrow</mat-icon>
              <span>Lancer la Démo</span>
            </button>
            <button
              (click)="scrollToSection('preregister')"
              class="text-[#ffd700] hover:underline text-[11px] font-bold">
              Pack Pionnier VIP
            </button>
          </div>
        </div>
      </div>

      <!-- ======================================================= -->
      <!-- HERO BANNER SECTION                                     -->
      <!-- ======================================================= -->
      <header class="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b-2 border-[#8b6b43]/50 bg-gradient-to-b from-[#1a120b] via-[#100a06] to-[#0c0906]">
        <!-- Ambient Decorative Runes & Lighting -->
        <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#d4af37]/10 blur-[120px] pointer-events-none rounded-full"></div>
        <mat-icon class="absolute top-6 left-6 text-[#d4af37]/10 text-7xl select-none pointer-events-none">shield</mat-icon>
        <mat-icon class="absolute top-40 right-6 text-[#d4af37]/10 text-7xl select-none pointer-events-none">auto_awesome</mat-icon>

        <div class="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 text-center space-y-6">
          
          <!-- Heraldic Pre-title -->
          <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#18110a] border border-[#d4af37]/60 text-[#ffd700] text-xs font-cinzel font-bold tracking-widest uppercase shadow-lg">
            <mat-icon class="text-sm text-[#ffd700]">military_tech</mat-icon>
            <span>Vitrine Officielle & Vision du Jeu</span>
            <span class="text-[#8b6b43]">|</span>
            <span class="text-[#4dff88] font-mono text-[11px]">Bêta Ouverte</span>
          </div>

          <!-- Grand Title -->
          <h1 class="font-cinzel-dec text-4xl sm:text-6xl md:text-7xl font-black text-[#f7edd8] tracking-tight leading-none drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
            AETHERIA
            <span class="block text-2xl sm:text-4xl md:text-5xl text-[#d4af37] font-serif font-bold mt-2 tracking-normal italic">
              Chroniques & Arcanes
            </span>
          </h1>

          <!-- Compelling Subtitle -->
          <p class="max-w-3xl mx-auto text-base sm:text-lg md:text-xl text-[#c5a880] font-serif leading-relaxed">
            Plongez dans un univers médiéval fantastique sombre où le destin du trône brisé se joue au tour par tour. Composez votre grimoire de sorts féodaux, étudiez les faiblesses des bêtes légendaires au Bestiaire et dominez l'Arène des champions.
          </p>

          <!-- Core Value Proposition Quick Highlights -->
          <div class="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs font-cinzel text-[#ffd700]">
            <span class="flex items-center gap-1.5 bg-[#140e08]/90 px-3 py-1.5 rounded-lg border border-[#8b6b43]/50">
              <mat-icon class="text-sm text-[#ef4444]">swords</mat-icon>
              Combat de Cartes Tactique
            </span>
            <span class="flex items-center gap-1.5 bg-[#140e08]/90 px-3 py-1.5 rounded-lg border border-[#8b6b43]/50">
              <mat-icon class="text-sm text-[#38bdf8]">radar</mat-icon>
              Bestiaire Radar Interactif
            </span>
            <span class="flex items-center gap-1.5 bg-[#140e08]/90 px-3 py-1.5 rounded-lg border border-[#8b6b43]/50">
              <mat-icon class="text-sm text-[#4dff88]">pets</mat-icon>
              Familiers de Combat x2.25
            </span>
            <span class="flex items-center gap-1.5 bg-[#140e08]/90 px-3 py-1.5 rounded-lg border border-[#8b6b43]/50">
              <mat-icon class="text-sm text-[#a855f7]">science</mat-icon>
              Synthèse d'Élixirs
            </span>
          </div>

          <!-- Hero Action CTAs -->
          <div class="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              (click)="triggerLaunchGame()"
              class="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#8b2b2b] via-[#a83232] to-[#8b2b2b] hover:from-[#a83232] hover:to-[#8b2b2b] text-white font-cinzel font-black text-base rounded-xl border-2 border-[#ff6666] shadow-[0_0_30px_rgba(255,77,77,0.35)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 cursor-pointer">
              <mat-icon class="text-xl">sports_martial_arts</mat-icon>
              <span>Entrer dans l'Arène (Démo Jouable)</span>
            </button>

            <button
              (click)="scrollToSection('preregister')"
              class="w-full sm:w-auto px-7 py-4 bg-[#18110b] hover:bg-[#23170e] text-[#ffd700] hover:text-white font-cinzel font-bold text-base rounded-xl border-2 border-[#d4af37]/80 shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer">
              <mat-icon class="text-xl">military_tech</mat-icon>
              <span>Pré-inscription & Pack Pionnier</span>
            </button>
          </div>

          <!-- Atmospheric Audio Teaser Toggle -->
          <div class="pt-4 flex items-center justify-center gap-3">
            <button
              (click)="toggleSoundtrack()"
              class="px-3.5 py-1.5 rounded-full bg-[#140e08] border border-[#8b6b43] text-xs font-cinzel text-[#c5a880] hover:text-[#ffd700] hover:border-[#ffd700] transition-colors flex items-center gap-2">
              <mat-icon class="text-sm text-[#ffd700]">{{ isAudioPlaying() ? 'volume_up' : 'volume_off' }}</mat-icon>
              <span>{{ isAudioPlaying() ? 'Ambiance Féodale Active' : 'Écouter l’Ambiance de Taverne' }}</span>
            </button>
            <span class="text-[11px] font-mono text-[#8b6b43]">v0.9.8 Bêta Ouverte</span>
          </div>
        </div>

        <!-- Metric Stat Strip -->
        <div class="max-w-5xl mx-auto px-4 mt-14">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 bg-[#120d08]/90 border border-[#8b6b43]/60 rounded-2xl p-4 shadow-2xl backdrop-blur-sm">
            <div class="text-center p-2 border-r border-[#8b6b43]/30 last:border-none">
              <div class="font-mono text-2xl sm:text-3xl font-black text-[#ffd700]">85+</div>
              <div class="text-[11px] font-cinzel text-[#c5a880] uppercase tracking-wider font-bold">Cartes Grimoire</div>
            </div>
            <div class="text-center p-2 border-r border-[#8b6b43]/30 last:border-none">
              <div class="font-mono text-2xl sm:text-3xl font-black text-[#ff6666]">12</div>
              <div class="text-[11px] font-cinzel text-[#c5a880] uppercase tracking-wider font-bold">Bêtes au Bestiaire</div>
            </div>
            <div class="text-center p-2 border-r border-[#8b6b43]/30 last:border-none">
              <div class="font-mono text-2xl sm:text-3xl font-black text-[#38bdf8]">6</div>
              <div class="text-[11px] font-cinzel text-[#c5a880] uppercase tracking-wider font-bold">Éléments & Synergies</div>
            </div>
            <div class="text-center p-2">
              <div class="font-mono text-2xl sm:text-3xl font-black text-[#4dff88]">100%</div>
              <div class="text-[11px] font-cinzel text-[#c5a880] uppercase tracking-wider font-bold">Gratuit & Sans Pub</div>
            </div>
          </div>
        </div>
      </header>

      <!-- ======================================================= -->
      <!-- SECTION 1: LES 4 PILIERS DU JEU                         -->
      <!-- ======================================================= -->
      <section class="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 space-y-12">
        <div class="text-center space-y-3">
          <div class="text-xs font-cinzel uppercase text-[#ffd700] tracking-widest font-bold">
            Architecture & Systèmes de Jeu
          </div>
          <h2 class="font-cinzel-dec text-3xl sm:text-4xl font-black text-[#f5ebd9]">
            Les Quatre Piliers d'Aetheria
          </h2>
          <p class="max-w-2xl mx-auto text-sm sm:text-base text-[#b59f7d] font-serif">
            Une fusion soignée entre la profondeur stratégique d'un card-game compétitif et la progression envoûtante d'un grand jeu de rôle médiéval.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          @for (pillar of pillars; track pillar.title) {
            <div class="relative overflow-hidden rounded-2xl border-2 border-[#8b6b43]/60 bg-gradient-to-b from-[#18110b] via-[#120c07] to-[#0a0705] p-6 shadow-xl hover:border-[#d4af37] transition-all group">
              <!-- Corner accent -->
              <div class="absolute top-2 right-3 text-[#d4af37]/20 text-xs font-mono font-bold">{{ pillar.badge }}</div>

              <div class="flex items-start gap-4">
                <div class="w-12 h-12 rounded-xl bg-[#24170d] border border-[#d4af37]/70 flex items-center justify-center text-[#ffd700] shrink-0 shadow-md group-hover:scale-105 transition-transform">
                  <mat-icon class="text-2xl">{{ pillar.icon }}</mat-icon>
                </div>
                <div class="space-y-2">
                  <h3 class="font-cinzel text-lg sm:text-xl font-bold text-[#f5ebd9]">
                    {{ pillar.title }}
                  </h3>
                  <p class="text-xs sm:text-sm text-[#b59f7d] font-serif leading-relaxed">
                    {{ pillar.description }}
                  </p>
                </div>
              </div>

              <!-- Key points list -->
              <div class="mt-4 pt-4 border-t border-[#8b6b43]/30 space-y-1.5">
                @for (h of pillar.highlights; track h) {
                  <div class="flex items-center gap-2 text-xs font-cinzel text-[#ffd700]">
                    <span class="text-[#d4af37] text-[10px]">✦</span>
                    <span class="text-[#e5d8be]">{{ h }}</span>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      </section>

      <!-- ======================================================= -->
      <!-- SECTION 2: TEASER INTERACTIF EN DIRECT                  -->
      <!-- ======================================================= -->
      <section class="max-w-6xl mx-auto px-4 sm:px-6 py-12 border-t border-b border-[#8b6b43]/40 bg-[#120c07]/60 rounded-3xl my-8">
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div class="inline-flex items-center gap-1.5 text-xs font-cinzel text-[#ffd700] uppercase font-bold tracking-wider mb-1">
              <mat-icon class="text-xs">visibility</mat-icon>
              <span>Aperçu Interactif en Direct</span>
            </div>
            <h2 class="font-cinzel-dec text-2xl sm:text-3xl font-black text-[#f5ebd9]">
              Explorez le Grimoire & le Bestiaire
            </h2>
            <p class="text-xs sm:text-sm text-[#b59f7d] font-serif max-w-xl mt-1">
              Testez les interfaces et fiches d'archétypes directement sur cette vitrine avant de vous lancer dans le jeu complet.
            </p>
          </div>

          <!-- Tab Selector -->
          <div class="inline-flex items-center bg-[#0d0906] border border-[#8b6b43] rounded-xl p-1 shrink-0">
            <button
              (click)="activeShowcaseTab.set('bestiary')"
              class="px-3.5 py-1.5 rounded-lg text-xs font-cinzel font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              [class.bg-[#d4af37]]="activeShowcaseTab() === 'bestiary'"
              [class.text-black]="activeShowcaseTab() === 'bestiary'"
              [class.text-[#c5a880]]="activeShowcaseTab() !== 'bestiary'">
              <mat-icon class="text-xs">menu_book</mat-icon>
              <span>Bêtes du Bestiaire</span>
            </button>
            <button
              (click)="activeShowcaseTab.set('heroes')"
              class="px-3.5 py-1.5 rounded-lg text-xs font-cinzel font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              [class.bg-[#d4af37]]="activeShowcaseTab() === 'heroes'"
              [class.text-black]="activeShowcaseTab() === 'heroes'"
              [class.text-[#c5a880]]="activeShowcaseTab() !== 'heroes'">
              <mat-icon class="text-xs">shield_moon</mat-icon>
              <span>Héros Légendaires</span>
            </button>
            <button
              (click)="activeShowcaseTab.set('cards')"
              class="px-3.5 py-1.5 rounded-lg text-xs font-cinzel font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              [class.bg-[#d4af37]]="activeShowcaseTab() === 'cards'"
              [class.text-black]="activeShowcaseTab() === 'cards'"
              [class.text-[#c5a880]]="activeShowcaseTab() !== 'cards'">
              <mat-icon class="text-xs">style</mat-icon>
              <span>Cartes Sacrées</span>
            </button>
            <button
              (click)="activeShowcaseTab.set('pets')"
              class="px-3.5 py-1.5 rounded-lg text-xs font-cinzel font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              [class.bg-[#d4af37]]="activeShowcaseTab() === 'pets'"
              [class.text-black]="activeShowcaseTab() === 'pets'"
              [class.text-[#c5a880]]="activeShowcaseTab() !== 'pets'">
              <mat-icon class="text-xs">pets</mat-icon>
              <span>Familiers</span>
            </button>
          </div>
        </div>

        <!-- TAB CONTENT 1: BESTIARY INTERACTIVE PREVIEW -->
        @if (activeShowcaseTab() === 'bestiary') {
          <div class="space-y-6">
            <!-- Creature selector strip -->
            <div class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
              @for (monster of showcaseMonsters; track monster.id) {
                <button
                  (click)="selectShowcaseMonster(monster)"
                  class="px-3 py-2 rounded-xl border text-xs font-cinzel font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer"
                  [class.bg-[#3b2713]]="selectedMonster().id === monster.id"
                  [class.border-[#ffd700]]="selectedMonster().id === monster.id"
                  [class.text-[#ffd700]]="selectedMonster().id === monster.id"
                  [class.shadow-[0_0_12px_rgba(212,175,55,0.3)]]="selectedMonster().id === monster.id"
                  [class.bg-[#140e08]]="selectedMonster().id !== monster.id"
                  [class.border-[#8b6b43]/40]="selectedMonster().id !== monster.id"
                  [class.text-[#b59f7d]]="selectedMonster().id !== monster.id">
                  <img
                    [src]="monster.imageUrl || getMonsterFamilyImage(monster.family)"
                    [alt]="monster.name"
                    class="w-6 h-6 rounded-md object-cover border border-[#8b6b43]/50 shrink-0"
                    referrerpolicy="no-referrer" />
                  <span>{{ monster.name }}</span>
                </button>
              }
            </div>

            <!-- Selected Creature Spotlight Card -->
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#160f09] border-2 border-[#8b6b43]/70 rounded-2xl p-5 md:p-6 shadow-2xl">
              <!-- Left Column: Portrait & Lore -->
              <div class="lg:col-span-5 space-y-4">
                <div class="relative overflow-hidden rounded-xl border-2 border-[#8b6b43] bg-black aspect-video sm:aspect-4/3 flex items-center justify-center">
                  @if (selectedMonster().imageUrl) {
                    <img
                      [src]="selectedMonster().imageUrl"
                      [alt]="selectedMonster().name"
                      class="w-full h-full object-cover object-center filter saturate-110 hover:scale-105 transition-transform duration-700"
                      referrerpolicy="no-referrer" />
                  } @else {
                    <mat-icon class="text-7xl text-[#8b6b43]">coronavirus</mat-icon>
                  }
                  <div class="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 border border-[#d4af37]/60 text-[10px] font-cinzel text-[#ffd700] uppercase font-bold">
                    {{ selectedMonster().threatRank }}
                  </div>
                  <div class="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 border border-[#8b6b43] text-[10px] font-mono text-[#4dff88] font-bold">
                    Danger : {{ selectedMonster().dangerRating }}/5
                  </div>
                </div>

                <div>
                  <h3 class="font-cinzel-dec text-xl font-bold text-[#f5ebd9] flex items-center gap-2">
                    <span>{{ selectedMonster().name }}</span>
                  </h3>
                  <div class="text-xs font-serif text-[#ffd700] italic">{{ selectedMonster().title }}</div>
                  <p class="text-xs font-serif text-[#c5a880] mt-2 leading-relaxed">
                    {{ selectedMonster().loreExcerpt }}
                  </p>
                </div>

                <!-- Elemental Counter Matrix -->
                <div class="bg-[#0e0905] border border-[#8b6b43]/40 rounded-xl p-3 space-y-2">
                  <div class="text-[11px] font-cinzel uppercase text-[#ffd700] font-bold flex items-center gap-1.5">
                    <mat-icon class="text-xs text-[#ffd700]">local_fire_department</mat-icon>
                    Points Faibles & Tactique Découverte
                  </div>
                  @for (w of selectedMonster().weaknesses; track w.element) {
                    <div class="text-xs font-serif text-[#e5d8be] flex items-start gap-1.5">
                      <span class="text-[#ff6666] font-bold shrink-0 inline-flex items-center gap-1">
                        <mat-icon class="text-xs">swords</mat-icon>
                        <span>{{ w.multiplier }} :</span>
                      </span>
                      <span>{{ w.tacticalAdvice }}</span>
                    </div>
                  }
                </div>
              </div>

              <!-- Right Column: Live Radar / Bar Chart Component! -->
              <div class="lg:col-span-7">
                <app-bestiary-radar-chart [monster]="selectedMonster()" />
              </div>
            </div>
          </div>
        }

        <!-- TAB CONTENT 1.5: HEROES SHOWCASE -->
        @if (activeShowcaseTab() === 'heroes') {
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            @for (hero of showcaseHeroes; track hero.id) {
              <div class="relative bg-gradient-to-b from-[#1c140d] via-[#140e08] to-[#0c0805] border-2 border-[#8b6b43]/70 hover:border-[#d4af37] rounded-2xl p-4 shadow-xl hover:-translate-y-1 transition-all group space-y-3">
                <div class="relative aspect-square rounded-xl overflow-hidden border border-[#8b6b43] bg-[#0c0805] shadow-inner">
                  @if (hero.imageUrl) {
                    <img
                      [src]="hero.imageUrl"
                      [alt]="hero.name"
                      class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerpolicy="no-referrer" />
                  } @else {
                    <div class="w-full h-full flex items-center justify-center text-[#ffd700]">
                      <mat-icon class="text-5xl">{{ hero.avatarIcon }}</mat-icon>
                    </div>
                  }
                  <div class="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/80 border border-[#d4af37]/60 text-[10px] font-mono font-bold text-[#ffd700] flex items-center gap-1.5">
                    <span class="inline-flex items-center gap-0.5">
                      <mat-icon class="text-[11px] text-[#4dff88]">favorite</mat-icon>
                      {{ hero.baseHp }} PV
                    </span>
                    <span>·</span>
                    <span class="inline-flex items-center gap-0.5">
                      <mat-icon class="text-[11px] text-[#38bdf8]">shield</mat-icon>
                      {{ hero.baseArmor }} ARM
                    </span>
                  </div>
                </div>

                <div>
                  <h4 class="font-cinzel text-sm font-black text-[#f5ebd9] truncate">{{ hero.name }}</h4>
                  <div class="text-[11px] font-serif text-[#ffd700] italic truncate">{{ hero.title }}</div>
                  <p class="text-xs font-serif text-[#c5a880] mt-2 line-clamp-2 leading-relaxed">
                    {{ hero.playstyleOverview }}
                  </p>
                </div>

                <div class="pt-2 border-t border-[#8b6b43]/30 text-[11px] font-cinzel text-[#ffd700] flex items-center gap-1 truncate">
                  <mat-icon class="text-xs shrink-0">{{ hero.ultimateIcon }}</mat-icon>
                  <span class="truncate">{{ hero.ultimateName }}</span>
                </div>
              </div>
            }
          </div>
        }

        <!-- TAB CONTENT 2: CARDS SHOWCASE -->
        @if (activeShowcaseTab() === 'cards') {
          <div class="space-y-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              @for (card of showcaseCards; track card.id) {
                <div class="relative bg-gradient-to-b from-[#1c140d] via-[#140e08] to-[#0c0805] border-2 rounded-2xl p-4 shadow-xl hover:-translate-y-1 transition-all group"
                  [class.border-[#ffd700]]="card.rarity === 'legendary'"
                  [class.border-[#c084fc]]="card.rarity === 'epic'"
                  [class.border-[#60a5fa]]="card.rarity === 'rare'">
                  
                  <!-- Card Header -->
                  <div class="flex items-center justify-between pb-2 border-b border-[#8b6b43]/40">
                    <div class="w-7 h-7 rounded-full bg-[#1e140b] border border-[#d4af37] flex items-center justify-center font-mono font-black text-xs text-[#ffd700]">
                      {{ card.cost }}
                    </div>
                    <span class="text-[10px] font-cinzel uppercase font-bold tracking-wider"
                      [class.text-[#ffd700]]="card.rarity === 'legendary'"
                      [class.text-[#c084fc]]="card.rarity === 'epic'"
                      [class.text-[#60a5fa]]="card.rarity === 'rare'">
                      {{ card.rarity }}
                    </span>
                  </div>

                  <!-- Card Artwork & Name -->
                  <div class="py-3 text-center space-y-2">
                    <div class="w-full aspect-square max-h-36 mx-auto rounded-xl bg-[#25180d] border border-[#8b6b43] flex items-center justify-center text-[#ffd700] shadow-inner overflow-hidden">
                      @if (card.imageUrl) {
                        <img
                          [src]="card.imageUrl"
                          [alt]="card.name"
                          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerpolicy="no-referrer" />
                      } @else {
                        <mat-icon class="text-4xl">{{ card.icon }}</mat-icon>
                      }
                    </div>
                    <h4 class="font-cinzel text-sm font-black text-[#f5ebd9]">{{ card.name }}</h4>
                    <span class="text-[10px] font-cinzel text-[#8b6b43] uppercase">{{ card.type }} · {{ card.element }}</span>
                  </div>

                  <!-- Card Description -->
                  <p class="text-xs font-serif text-[#c5a880] leading-relaxed min-h-[48px] border-t border-[#8b6b43]/30 pt-2">
                    {{ card.description }}
                  </p>

                  <!-- Card Stats (Attack / Health / Spell / Heal) -->
                  <div class="mt-3 pt-2 border-t border-[#8b6b43]/30 flex items-center justify-between font-mono text-xs font-black">
                    @if (card.attack) {
                      <span class="text-[#ff6666] flex items-center gap-1">
                        <mat-icon class="text-xs">swords</mat-icon>
                        <span>{{ card.attack }} ATQ</span>
                      </span>
                    }
                    @if (card.health) {
                      <span class="text-[#38bdf8] flex items-center gap-1">
                        <mat-icon class="text-xs">favorite</mat-icon>
                        <span>{{ card.health }} PV</span>
                      </span>
                    }
                    @if (card.spellDamage) {
                      <span class="text-[#c084fc] flex items-center gap-1">
                        <mat-icon class="text-xs">bolt</mat-icon>
                        <span>{{ card.spellDamage }} MAG</span>
                      </span>
                    }
                    @if (card.healValue) {
                      <span class="text-[#4dff88] flex items-center gap-1">
                        <mat-icon class="text-xs">auto_awesome</mat-icon>
                        <span>{{ card.healValue }} SOIN</span>
                      </span>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- TAB CONTENT 3: PETS SHOWCASE -->
        @if (activeShowcaseTab() === 'pets') {
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
            @for (pet of showcasePets; track pet.id) {
              <div class="bg-[#18110b] border-2 border-[#8b6b43]/60 rounded-2xl p-5 shadow-xl space-y-4 hover:border-[#4dff88] transition-all">
                <div class="flex items-center justify-between">
                  <div class="w-14 h-14 rounded-xl bg-[#23170e] border border-[#4dff88]/60 flex items-center justify-center text-2xl text-[#4dff88] overflow-hidden shrink-0">
                    @if (pet.imageUrl) {
                      <img
                        [src]="pet.imageUrl"
                        [alt]="pet.name"
                        class="w-full h-full object-cover"
                        referrerpolicy="no-referrer" />
                    } @else {
                      <mat-icon class="text-2xl">{{ pet.icon }}</mat-icon>
                    }
                  </div>
                  <div class="text-right">
                    <span class="text-xs font-cinzel text-[#ffd700] uppercase font-bold block">{{ pet.species }}</span>
                    <span class="text-base font-mono font-black text-[#4dff88]">x{{ pet.totalMultiplier.toFixed(2) }} DGT</span>
                  </div>
                </div>

                <div>
                  <h4 class="font-cinzel text-base font-bold text-[#f5ebd9]">{{ pet.name }}</h4>
                  <p class="text-xs font-serif text-[#c5a880] mt-1">{{ pet.lore }}</p>
                </div>

                <div class="bg-[#0e0905] border border-[#8b6b43]/40 rounded-xl p-3">
                  <span class="text-[10px] font-cinzel uppercase text-[#4dff88] font-bold block">{{ pet.specialSkillName }}</span>
                  <span class="text-xs font-serif text-[#e5d8be]">{{ pet.specialSkillDesc }}</span>
                </div>
              </div>
            }
          </div>
        }
      </section>

      <!-- ======================================================= -->
      <!-- SECTION 3: LORE & LES 3 FACTIONS DU ROYAUME             -->
      <!-- ======================================================= -->
      <section class="max-w-6xl mx-auto px-4 sm:px-6 py-16 space-y-12">
        <div class="text-center space-y-3">
          <div class="text-xs font-cinzel uppercase text-[#ffd700] tracking-widest font-bold">
            Les Annales d'Aetheria
          </div>
          <h2 class="font-cinzel-dec text-3xl sm:text-4xl font-black text-[#f5ebd9]">
            Les Trois Grandes Factions du Royaume
          </h2>
          <p class="max-w-2xl mx-auto text-sm sm:text-base text-[#b59f7d] font-serif">
            Alors que la faille d'Aether s'ouvre sous les murailles de la Haute Citadelle, trois ordres se disputent les fragments sacrés.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Faction 1: Ordre de la Flamme -->
          <div class="bg-gradient-to-b from-[#241310] via-[#160d0a] to-[#0c0806] border-2 border-[#ff4d4d]/60 rounded-2xl p-6 shadow-xl space-y-4">
            <div class="w-12 h-12 rounded-xl bg-[#361612] border border-[#ff4d4d] flex items-center justify-center text-[#ff6666]">
              <mat-icon class="text-2xl">local_fire_department</mat-icon>
            </div>
            <h3 class="font-cinzel text-lg font-bold text-[#f5ebd9]">L'Ordre de la Flamme Pourpre</h3>
            <p class="text-xs sm:text-sm font-serif text-[#c5a880] leading-relaxed">
              Croisés et pyromanciens dévoués à la destruction sans compromis. Leurs sorts de feu percent les armures les plus denses et calcinent les hordes de bêtes mortes-vivantes.
            </p>
            <div class="text-[11px] font-mono text-[#ff6666] font-bold">
              Bonus : +25% Dégâts Bruts au Premier Tour
            </div>
          </div>

          <!-- Faction 2: Gardiens du Givre -->
          <div class="bg-gradient-to-b from-[#0f1d24] via-[#0a1318] to-[#060b0e] border-2 border-[#38bdf8]/60 rounded-2xl p-6 shadow-xl space-y-4">
            <div class="w-12 h-12 rounded-xl bg-[#102a36] border border-[#38bdf8] flex items-center justify-center text-[#38bdf8]">
              <mat-icon class="text-2xl">ac_unit</mat-icon>
            </div>
            <h3 class="font-cinzel text-lg font-bold text-[#f5ebd9]">Les Gardiens du Givre Éternel</h3>
            <p class="text-xs sm:text-sm font-serif text-[#c5a880] leading-relaxed">
              Sentinelles des pics boréaux. Ils maîtrisent le froid absolu pour congeler l'ennemi, ériger des remparts de glace inaltérables et contrôler le tempo du duel.
            </p>
            <div class="text-[11px] font-mono text-[#38bdf8] font-bold">
              Bonus : +10 Armure Initiale & Ralentissement
            </div>
          </div>

          <!-- Faction 3: Culte des Ombres -->
          <div class="bg-gradient-to-b from-[#1f1024] via-[#140b18] to-[#0b060d] border-2 border-[#c084fc]/60 rounded-2xl p-6 shadow-xl space-y-4">
            <div class="w-12 h-12 rounded-xl bg-[#2d1436] border border-[#c084fc] flex items-center justify-center text-[#c084fc]">
              <mat-icon class="text-2xl">dark_mode</mat-icon>
            </div>
            <h3 class="font-cinzel text-lg font-bold text-[#f5ebd9]">Le Culte des Ombres Arcaniques</h3>
            <p class="text-xs sm:text-sm font-serif text-[#c5a880] leading-relaxed">
              Érudits occultes et nécromanciens de Mortebreche. Ils exploitent le sang, invoquent des goules sacrifiables et siphonnent les points de vie de leur rival à chaque tour.
            </p>
            <div class="text-[11px] font-mono text-[#c084fc] font-bold">
              Bonus : Vol de Vie & Pioche Arcanique
            </div>
          </div>
        </div>
      </section>

      <!-- ======================================================= -->
      <!-- SECTION 4: FEUILLE DE ROUTE DU LANCEMENT (ROADMAP)      -->
      <!-- ======================================================= -->
      <section class="max-w-5xl mx-auto px-4 sm:px-6 py-16 space-y-10">
        <div class="text-center space-y-3">
          <div class="text-xs font-cinzel uppercase text-[#ffd700] tracking-widest font-bold">
            Développement & Calendrier
          </div>
          <h2 class="font-cinzel-dec text-3xl font-black text-[#f5ebd9]">
            Feuille de Route Officielle du Projet
          </h2>
          <p class="text-xs sm:text-sm text-[#b59f7d] font-serif max-w-xl mx-auto">
            Consultez les étapes franchies et les prochains ajouts avant l'ouverture générale des serveurs.
          </p>
        </div>

        <div class="relative border-l-2 border-[#d4af37]/60 ml-4 md:ml-32 space-y-8 pl-6">
          <!-- Step 1 -->
          <div class="relative group">
            <div class="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-[#4dff88] border-2 border-black"></div>
            <div class="text-xs font-mono text-[#4dff88] font-bold">COMPLÉTÉ · PHASE I</div>
            <h4 class="font-cinzel text-base font-bold text-[#f5ebd9] mt-0.5">Fondations & Moteur de Combat</h4>
            <p class="text-xs font-serif text-[#c5a880] mt-1">
              Architecture Angular 21 zoneless, deckbuilder avec 85 cartes équilibrées, laboratoire de synthèse d'élixirs et immersion sonore médiévale.
            </p>
          </div>

          <!-- Step 2 -->
          <div class="relative group">
            <div class="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-[#ffd700] border-2 border-black animate-ping"></div>
            <div class="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-[#ffd700] border-2 border-black"></div>
            <div class="text-xs font-mono text-[#ffd700] font-bold">ACTUEL · PHASE II (BÊTA OUVERTE)</div>
            <h4 class="font-cinzel text-base font-bold text-[#ffd700] mt-0.5">Bestiarium Interactif & Familiers</h4>
            <p class="text-xs font-serif text-[#e5d8be] mt-1">
              Intégration du radar de stats D3 pour chaque bête, filtres élémentaires, fiches de monstres illustrées et vitrine publique officielle pour les joueurs.
            </p>
          </div>

          <!-- Step 3 -->
          <div class="relative group">
            <div class="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-[#8b6b43] border-2 border-black"></div>
            <div class="text-xs font-mono text-[#8b6b43] font-bold">PROCHAINEMENT · PHASE III</div>
            <h4 class="font-cinzel text-base font-bold text-[#f5ebd9] mt-0.5">Lancement Mondial & Guerres de Guildes</h4>
            <p class="text-xs font-serif text-[#c5a880] mt-1">
              Tournois hebdomadaires en temps réel, Boss de Raid coopératifs à 10 joueurs et extension de 40 nouvelles cartes célestes.
            </p>
          </div>
        </div>
      </section>

      <!-- ======================================================= -->
      <!-- SECTION 5: PRÉ-INSCRIPTION & PACK PIONNIER (INTERACTIF) -->
      <!-- ======================================================= -->
      <section id="preregister" class="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <div class="relative overflow-hidden rounded-3xl border-2 border-[#d4af37] bg-gradient-to-b from-[#23180e] via-[#160f09] to-[#0c0805] p-6 sm:p-10 shadow-2xl space-y-6">
          <!-- Golden corner ornaments -->
          <mat-icon class="absolute top-3 left-3 text-[#d4af37]/30 text-lg pointer-events-none">auto_awesome</mat-icon>
          <mat-icon class="absolute top-3 right-3 text-[#d4af37]/30 text-lg pointer-events-none">auto_awesome</mat-icon>

          <div class="text-center space-y-2">
            <span class="px-3 py-1 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/40 text-[#ffd700] text-xs font-cinzel font-bold uppercase tracking-wider">
              Récompense Pionnier Exclusive
            </span>
            <h2 class="font-cinzel-dec text-2xl sm:text-3xl font-black text-[#f5ebd9]">
              Rejoignez l'Avant-Garde d'Aetheria
            </h2>
            <p class="text-xs sm:text-sm font-serif text-[#c5a880] max-w-xl mx-auto">
              Enregistrez votre nom de seigneur dès maintenant. Vous recevrez instantanément votre Sceau Féodal, un code cadeau VIP et 300 Pièces d'Or dans la démo !
            </p>
          </div>

          @if (!hasRegistered()) {
            <!-- Interactive Pre-registration Form -->
            <div class="space-y-4 max-w-lg mx-auto">
              <div>
                <label for="pioneerNameInput" class="block text-xs font-cinzel text-[#ffd700] font-bold mb-1.5">
                  Nom ou Titre de Seigneur :
                </label>
                <input
                  #nameInput
                  id="pioneerNameInput"
                  name="pioneerNameInput"
                  type="text"
                  placeholder="Ex : Sire Aldric le Brave"
                  [value]="pioneerName()"
                  (input)="pioneerName.set(nameInput.value)"
                  class="w-full px-4 py-3 bg-[#110b07] border border-[#8b6b43] rounded-xl text-sm font-serif text-[#f5ebd9] focus:outline-none focus:border-[#d4af37] shadow-inner" />
              </div>

              <div>
                <span class="block text-xs font-cinzel text-[#ffd700] font-bold mb-1.5">
                  Choisissez votre Allégeance de Faction :
                </span>
                <div class="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    (click)="selectedFaction.set('flame')"
                    class="py-2.5 px-2 rounded-xl border text-xs font-cinzel font-bold text-center transition-all cursor-pointer flex flex-col items-center gap-1.5"
                    [class.bg-[#3d1814]]="selectedFaction() === 'flame'"
                    [class.border-[#ff4d4d]]="selectedFaction() === 'flame'"
                    [class.text-[#ff6666]]="selectedFaction() === 'flame'"
                    [class.bg-[#120c08]]="selectedFaction() !== 'flame'"
                    [class.border-[#8b6b43]/40]]="selectedFaction() !== 'flame'"
                    [class.text-[#8b6b43]]="selectedFaction() !== 'flame'">
                    <img
                      src="/src/assets/images/faction_crest_flame_1795189811323.jpg"
                      alt="Blason Flamme"
                      class="w-8 h-8 rounded-lg object-cover border border-[#ff4d4d]/60 shadow"
                      referrerpolicy="no-referrer" />
                    <span>Flamme</span>
                  </button>

                  <button
                    type="button"
                    (click)="selectedFaction.set('frost')"
                    class="py-2.5 px-2 rounded-xl border text-xs font-cinzel font-bold text-center transition-all cursor-pointer flex flex-col items-center gap-1.5"
                    [class.bg-[#132c3a]]="selectedFaction() === 'frost'"
                    [class.border-[#38bdf8]]="selectedFaction() === 'frost'"
                    [class.text-[#38bdf8]]="selectedFaction() === 'frost'"
                    [class.bg-[#120c08]]="selectedFaction() !== 'frost'"
                    [class.border-[#8b6b43]/40]]="selectedFaction() !== 'frost'"
                    [class.text-[#8b6b43]]="selectedFaction() !== 'frost'">
                    <img
                      src="/src/assets/images/faction_crest_frost_1795189810356.jpg"
                      alt="Blason Givre"
                      class="w-8 h-8 rounded-lg object-cover border border-[#38bdf8]/60 shadow"
                      referrerpolicy="no-referrer" />
                    <span>Givre</span>
                  </button>

                  <button
                    type="button"
                    (click)="selectedFaction.set('shadow')"
                    class="py-2.5 px-2 rounded-xl border text-xs font-cinzel font-bold text-center transition-all cursor-pointer flex flex-col items-center gap-1.5"
                    [class.bg-[#2a1336]]="selectedFaction() === 'shadow'"
                    [class.border-[#c084fc]]="selectedFaction() === 'shadow'"
                    [class.text-[#c084fc]]="selectedFaction() === 'shadow'"
                    [class.bg-[#120c08]]="selectedFaction() !== 'shadow'"
                    [class.border-[#8b6b43]/40]]="selectedFaction() !== 'shadow'"
                    [class.text-[#8b6b43]]="selectedFaction() !== 'shadow'">
                    <img
                      src="/src/assets/images/faction_crest_shadow_1795189809993.jpg"
                      alt="Blason Ombre"
                      class="w-8 h-8 rounded-lg object-cover border border-[#c084fc]/60 shadow"
                      referrerpolicy="no-referrer" />
                    <span>Ombre</span>
                  </button>
                </div>
              </div>

              <button
                type="button"
                (click)="submitPioneerRegistration()"
                class="w-full py-4 bg-gradient-to-r from-[#d4af37] via-[#ffd700] to-[#d4af37] text-black font-cinzel font-black text-sm rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:brightness-110 transition-all cursor-pointer flex items-center justify-center gap-2">
                <mat-icon class="text-lg">verified</mat-icon>
                <span>Sceller mon Inscription & Réclamer le Pack (300 Or)</span>
              </button>
            </div>
          } @else {
            <!-- Pioneer Certificate Badge Screen -->
            <div class="bg-[#110a06] border-2 border-[#d4af37] rounded-2xl p-6 text-center space-y-4 animate-in fade-in">
              <div class="w-16 h-16 mx-auto rounded-full bg-[#d4af37]/20 border-2 border-[#d4af37] overflow-hidden shadow-lg p-0.5">
                <img
                  src="/src/assets/images/emblem_aetheria_crest_1795189810140.jpg"
                  alt="Sceau Pionnier d'Aetheria"
                  class="w-full h-full rounded-full object-cover"
                  referrerpolicy="no-referrer" />
              </div>
              <div>
                <h3 class="font-cinzel-dec text-xl font-bold text-[#ffd700]">
                  Parchemin Pionnier Octroyé à {{ pioneerName() }} !
                </h3>
                <p class="text-xs font-serif text-[#c5a880] mt-1">
                  Votre nom a été gravé dans le Scriptorium d'Aetheria au rang de Seigneur d'Avant-Garde.
                </p>
              </div>

              <div class="bg-[#1a120b] border border-[#8b6b43] rounded-xl p-3 inline-block">
                <span class="text-[10px] font-cinzel text-[#8b6b43] uppercase block">Votre Sceau VIP Exclusif</span>
                <span class="font-mono text-base font-black text-[#4dff88] tracking-widest">{{ voucherCode() }}</span>
              </div>

              <div class="text-xs font-mono text-[#ffd700]">
                ✦ +300 Pièces d'Or ont été créditées à votre coffre féodal !
              </div>

              <div class="pt-2">
                <button
                  (click)="triggerLaunchGame()"
                  class="px-6 py-3 bg-[#8b2b2b] hover:bg-[#a83232] text-white font-cinzel font-bold text-xs rounded-xl border border-[#ff6666] shadow-lg transition-all flex items-center justify-center gap-2 mx-auto cursor-pointer">
                  <mat-icon class="text-base">play_arrow</mat-icon>
                  <span>Entrer dans l'Arène avec ce Pack</span>
                </button>
              </div>
            </div>
          }
        </div>
      </section>

      <!-- ======================================================= -->
      <!-- SECTION 6: FAQ ACCORDION                                -->
      <!-- ======================================================= -->
      <section class="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        <div class="text-center space-y-2">
          <div class="text-xs font-cinzel uppercase text-[#ffd700] tracking-widest font-bold">
            Questions Fréquentes
          </div>
          <h2 class="font-cinzel-dec text-2xl sm:text-3xl font-black text-[#f5ebd9]">
            Tout Ce Que Vous Devez Savoir
          </h2>
        </div>

        <div class="space-y-3">
          @for (faq of faqList(); track faq.question; let idx = $index) {
            <div class="border border-[#8b6b43]/50 rounded-xl bg-[#140e08]/90 overflow-hidden">
              <button
                (click)="toggleFaq(idx)"
                class="w-full text-left p-4 flex items-center justify-between text-xs sm:text-sm font-cinzel font-bold text-[#f5ebd9] hover:text-[#ffd700] transition-colors cursor-pointer">
                <span>{{ faq.question }}</span>
                <mat-icon class="text-sm text-[#d4af37] transition-transform" [class.rotate-180]="faq.isOpen">
                  expand_more
                </mat-icon>
              </button>
              @if (faq.isOpen) {
                <div class="px-4 pb-4 text-xs font-serif text-[#c5a880] leading-relaxed border-t border-[#8b6b43]/20 pt-3">
                  {{ faq.answer }}
                </div>
              }
            </div>
          }
        </div>
      </section>

      <!-- ======================================================= -->
      <!-- FINAL CALL TO ACTION FOOTER BANNER                      -->
      <!-- ======================================================= -->
      <footer class="max-w-6xl mx-auto px-4 sm:px-6 pt-12 text-center space-y-8">
        <div class="bg-gradient-to-r from-[#1b120a] via-[#2c1d12] to-[#1b120a] border-2 border-[#d4af37]/60 rounded-3xl p-8 sm:p-12 shadow-2xl space-y-4">
          <h3 class="font-cinzel-dec text-2xl sm:text-3xl font-black text-[#f5ebd9]">
            La Bataille pour Aetheria N'Attend Que Vous
          </h3>
          <p class="text-xs sm:text-sm font-serif text-[#c5a880] max-w-xl mx-auto">
            Testez la démo jouable en un clic, bâtissez votre premier grimoire et découvrez les secrets du Bestiaire millénaire.
          </p>
          <div class="pt-2">
            <button
              (click)="triggerLaunchGame()"
              class="px-8 py-4 bg-[#8b2b2b] hover:bg-[#a83232] text-white font-cinzel font-black text-sm rounded-xl border-2 border-[#ff6666] shadow-[0_0_25px_rgba(255,77,77,0.3)] transition-all cursor-pointer inline-flex items-center gap-2">
              <mat-icon class="text-lg">sports_esports</mat-icon>
              <span>Lancer le Jeu Immédiatement</span>
            </button>
          </div>
        </div>

        <div class="border-t border-[#8b6b43]/30 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] font-cinzel text-[#8b6b43] gap-2">
          <span class="flex items-center gap-1.5">
            <img
              src="/src/assets/images/emblem_aetheria_crest_1795189810140.jpg"
              alt="Blason"
              class="w-4 h-4 rounded object-cover border border-[#8b6b43]/60"
              referrerpolicy="no-referrer" />
            <span>Aetheria: Chroniques &amp; Arcanes · Tous droits réservés</span>
          </span>
          <span>Version v0.9.8 Bêta · Réalisé avec Passion Médiévale</span>
        </div>
      </footer>

    </div>
  `
})
export class PublicShowcaseView {
  readonly gameState = inject(GameStateService);
  readonly sound = inject(SoundService);

  readonly launchGame = output<void>();
  readonly openModes = output<void>();

  readonly activeShowcaseTab = signal<ShowcaseTab>('bestiary');
  readonly isAudioPlaying = signal<boolean>(false);

  // Pioneer Pre-registration state
  readonly pioneerName = signal<string>('Seigneur d’Aether');
  readonly selectedFaction = signal<FactionChoice>('flame');
  readonly hasRegistered = signal<boolean>(false);
  readonly voucherCode = signal<string>('AETHERIA-PIONEER-2025');

  // Showcase Data
  readonly showcaseMonsters: BestiaryEntry[] = INITIAL_BESTIARY_DATABASE.slice(0, 6);
  readonly selectedMonster = signal<BestiaryEntry>(INITIAL_BESTIARY_DATABASE[0]);
  readonly showcaseHeroes: Hero[] = ALL_GAME_HEROES.slice(0, 8);

  readonly showcaseCards: Card[] = ALL_GAME_CARDS.filter(
    c => c.rarity === 'legendary' || c.rarity === 'epic'
  ).slice(0, 4);

  readonly showcasePets: CompanionPet[] = INITIAL_COMPANION_PETS.slice(0, 3);

  // Pillars list
  readonly pillars: ShowcasePillar[] = [
    {
      icon: 'swords',
      badge: 'TACTIQUE & MANA',
      title: 'Arène de Cartes Vivantes',
      description: 'Dépassez la simple pioche de cartes : chaque sort invoque des effets de champ, des brûlures persistantes, des gels paralysants ou des saignements mortels.',
      highlights: [
        'Gestion du mana féodal par tour',
        'Synergies élémentaires à combos x1.5',
        '20 archétypes de classes personnalisables'
      ]
    },
    {
      icon: 'radar',
      badge: 'ARCHIVES DES MONSTRES',
      title: 'Bestiarium Aetheriae',
      description: 'Chaque bête rencontrée dévoile son profil de stats D3 complet (Force, Défense, Magie, Vitesse), ses faiblesses élémentaires et des conseils d\'archivistes générés.',
      highlights: [
        'Analyse radar en temps réel',
        'Faiblesses élémentaires (+75% dégâts)',
        'Récits aléatoires d\'archivistes'
      ]
    },
    {
      icon: 'science',
      badge: 'ALCHIMIE & RELIQUES',
      title: 'Synthèse & Familiers',
      description: 'Récoltez des herbes rares et du mercure pour distiller des élixirs de guerre. Équipez des familiers légendaires multipliant la puissance de vos sorts jusqu\'à x2.25.',
      highlights: [
        'Chaudron de concoction féodale',
        'Reliques ancestrales sertissables',
        'Compagnons passifs évolutifs'
      ]
    },
    {
      icon: 'groups',
      badge: 'COMMUNAUTÉ & LIGUES',
      title: 'Guildes & Halle du Troc',
      description: 'Prêtez serment dans une guilde féodale, échangez des élixirs sur la place de marché du troc et hissez-vous au sommet du classement des Seigneurs.',
      highlights: [
        'Marché d\'échange entre joueurs',
        'Raids de guilde coopératifs',
        'Ligues saisonnières & Passe de combat'
      ]
    }
  ];

  // FAQ Items
  readonly faqList = signal<FaqItem[]>([
    {
      question: 'Le jeu nécessite-t-il un téléchargement ou une installation ?',
      answer: 'Non, Aetheria fonctionne à 100% directement dans votre navigateur web (Chrome, Firefox, Safari, Edge). Aucune installation n’est requise, et le jeu est optimisé aussi bien sur ordinateur que sur mobile et tablette.',
      isOpen: false
    },
    {
      question: 'La démo et la bêta publique sont-elles gratuites ?',
      answer: 'Oui, l’accès à la campagne, à l’Arène, au Bestiaire et à la forge de cartes est entièrement gratuit sans paywall ni publicités intrusives.',
      isOpen: false
    },
    {
      question: 'Qu’est-ce que le Bestiarium apporte en combat ?',
      answer: 'Consulter le Bestiaire vous permet d’apprendre les faiblesses exactes des bêtes (par exemple, Malgath subit +75% de dégâts des sorts de Lumière sacrée). Vous pouvez ainsi adapter votre grimoire pour terrasser les boss les plus redoutables.',
      isOpen: false
    },
    {
      question: 'Comment fonctionnent les familiers de compagnie ?',
      answer: 'Les familiers (comme le Phénix de Cendres ou le Loup Astral) confèrent un multiplicateur passif de dégâts à toutes vos cartes, sorts et frappes d’arène lorsqu’ils sont équipés.',
      isOpen: false
    },
    {
      question: 'Mes données de jeu et victoires seront-elles conservées ?',
      answer: 'Oui ! Toutes vos cartes débloquées, vos familiers, vos victoires d’arène et vos pièces d’or sont sauvegardés localement de façon persistante.',
      isOpen: false
    }
  ]);

  selectShowcaseMonster(m: BestiaryEntry) {
    this.selectedMonster.set(m);
    this.sound.playClick();
  }

  getMonsterFamilyImage(family: string): string {
    switch (family) {
      case 'undead': return '/src/assets/images/icon_lich_lord_1792917170436.jpg';
      case 'dragon': return '/src/assets/images/icon_infernal_drake_1792917169178.jpg';
      case 'demon': return '/src/assets/images/icon_infernal_drake_1792917169178.jpg';
      case 'beast': return '/src/assets/images/icon_dire_wolf_1792917163200.jpg';
      case 'elemental': return '/src/assets/images/icon_pyre_imp_1792917165257.jpg';
      case 'aberration': return '/src/assets/images/icon_void_watcher_1792917167101.jpg';
      case 'humanoid': return '/src/assets/images/icon_blood_knight_1792917168867.jpg';
      case 'construct': return '/src/assets/images/icon_arcane_automaton_1792917169042.jpg';
      default: return '/src/assets/images/card_arcane_relic_1794650137385.jpg';
    }
  }

  toggleFaq(index: number) {
    this.faqList.update(list => {
      return list.map((item, idx) => {
        if (idx === index) {
          return { ...item, isOpen: !item.isOpen };
        }
        return item;
      });
    });
    this.sound.playClick();
  }

  toggleSoundtrack() {
    if (this.isAudioPlaying()) {
      this.sound.updateSettings({ muted: true });
      this.isAudioPlaying.set(false);
    } else {
      this.sound.updateSettings({ muted: false, masterVolume: 65 });
      this.sound.startAmbientMusic();
      this.isAudioPlaying.set(true);
    }
  }

  submitPioneerRegistration() {
    this.hasRegistered.set(true);
    // Award 300 gold to player state!
    this.gameState.addGold(300);
    this.sound.playVictory();
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('aetheria_pioneer_registered', 'true');
      localStorage.setItem('aetheria_pioneer_name', this.pioneerName());
      localStorage.setItem('aetheria_pioneer_faction', this.selectedFaction());
    }
  }

  triggerLaunchGame() {
    this.sound.playClick();
    this.launchGame.emit();
  }

  scrollToSection(sectionId: string) {
    if (typeof document !== 'undefined') {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }
}
