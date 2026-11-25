import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, output, signal } from '@angular/core';
import { BattleEngineService } from '../../services/battle-engine';
import { GameStateService } from '../../services/game-state';
import { SoundService } from '../../services/sound';
import { TutorialService } from '../../services/tutorial';
import { DailyMissionsService } from '../../services/daily-missions';
import { QuestService } from '../../services/quest';
import { BattleMinion, Card } from '../../models/game.model';
import { MatIconModule } from '@angular/material/icon';

interface HoverTargetState {
  type: 'opponent-hero' | 'opponent-minion' | 'player-hero' | 'player-minion';
  minion?: BattleMinion;
}

@Component({
  selector: 'app-arena-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  host: {
    '(document:keydown.escape)': 'onEscapeKey()',
  },
  template: `
    @let battle = battleEngine.battleState();

    @if (battleEngine.isSearchingMatch()) {
      <!-- Matchmaking Search Modal -->
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
        <div class="bg-[#120f0c] border border-[#3a2f23] rounded-2xl p-8 max-w-md w-full text-center shadow-2xl text-[#e0dcc7]">
          <div class="w-20 h-20 mx-auto mb-4 relative flex items-center justify-center">
            <div class="absolute inset-0 rounded-full border-4 border-[#3a2f23] border-t-[#c5a880] animate-spin"></div>
            <mat-icon class="text-4xl text-[#c5a880]">swords</mat-icon>
          </div>
          <h3 class="font-cinzel text-2xl font-bold text-[#c5a880] mb-1">Recherche d'Adversaire...</h3>
          <p class="text-[#6b5a45] text-xs uppercase tracking-widest mb-4">Arène Compétitive d'Aetheria</p>
          <div class="inline-flex items-center gap-2 px-4 py-1.5 bg-[#1a1612] rounded-full border border-[#3a2f23] text-[#d4af37] font-mono text-xs mb-6">
            <mat-icon class="text-sm animate-pulse text-[#d4af37]">timer</mat-icon>
            Temps écoulé : {{ battleEngine.searchSeconds() }}s
          </div>
          <div>
            <button
              (click)="battleEngine.cancelMatchmaking()"
              class="medieval-btn px-6 py-2.5 bg-[#1a1612] hover:bg-[#251f18] text-[#e0dcc7] rounded-xl border border-[#3a2f23] font-cinzel text-xs font-semibold">
              Annuler
            </button>
          </div>
        </div>
      </div>
    }

    @if (battle) {
      <div class="relative min-h-[calc(100vh-80px)] w-full flex flex-col justify-between bg-[#0a0a0c] p-2 md:p-4 select-none overflow-hidden" style="background-image: radial-gradient(circle at center, #1a1512 0%, #0a0a0c 100%);">
        
        <!-- Floating Combat Numbers & Alerts -->
        @for (f of battleEngine.floatingDamages(); track f.id; let idx = $index) {
          <div
            class="fixed z-50 pointer-events-none font-cinzel font-black text-xl md:text-3xl animate-float-damage drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]"
            [class.text-[#ff4d4d]]="f.type === 'damage'"
            [class.text-emerald-400]="f.type === 'heal'"
            [class.text-[#d4af37]]="f.type === 'buff'"
            [class.text-[#4d94ff]]="f.type === 'armor'"
            [style.left]="getFloatLeft(f.target, idx)"
            [style.top]="getFloatTop(f.target, idx)">
            {{ f.value }}
          </div>
        }

        <!-- COMBAT ENTRANCE VS INTRO SPLASH OVERLAY -->
        @if (battleEngine.isCombatIntroPlaying()) {
          <div class="fixed inset-0 z-50 pointer-events-none flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div class="w-full max-w-4xl p-6 flex flex-col items-center justify-center text-center space-y-4">
              
              <!-- Top Medieval Heraldic Ribbon -->
              <div class="heraldic-ribbon px-8 py-2 rounded-lg font-cinzel text-xs uppercase tracking-widest font-black shadow-2xl border border-[#ff4d4d] inline-flex items-center gap-2">
                <mat-icon class="text-sm text-[#ffd700]">swords</mat-icon>
                <span>CHAMP DE BATAILLE D'AETHERIA</span>
                <mat-icon class="text-sm text-[#ffd700]">swords</mat-icon>
              </div>

              <!-- VS Clash Block -->
              <div class="w-full grid grid-cols-3 items-center gap-4 py-4">
                
                <!-- Player Champion -->
                @let playerSkin = gameState.getHeroActiveSkin(battle.playerHero.hero);
                <div class="flex flex-col items-center sm:items-end animate-hero-slide-left space-y-1">
                  <div
                    class="w-20 h-20 md:w-28 md:h-28 rounded-2xl bg-[#1a1612] border-2 flex items-center justify-center text-3xl md:text-5xl text-[#d4af37] overflow-hidden relative"
                    [style.borderColor]="playerSkin.accentHex || '#d4af37'"
                    [style.boxShadow]="'0 0 25px ' + (playerSkin.accentHex || '#d4af37') + '55'">
                    @if (playerSkin.imageUrl || battle.playerHero.hero.imageUrl) {
                      <img
                        [src]="playerSkin.imageUrl || battle.playerHero.hero.imageUrl"
                        [alt]="battle.playerHero.hero.name"
                        [style.filter]="playerSkin.portraitFilter || 'none'"
                        class="w-full h-full object-cover"
                        referrerpolicy="no-referrer" />
                      <div class="absolute inset-0 bg-gradient-to-t pointer-events-none" [class]="playerSkin.themeGradient || ''"></div>
                    } @else {
                      <mat-icon class="text-4xl md:text-6xl">{{ playerSkin.avatarIcon || 'shield' }}</mat-icon>
                    }
                  </div>
                  <div class="font-cinzel text-sm md:text-xl font-black text-[#e0dcc7] text-center sm:text-right">
                    {{ battle.playerHero.hero.name }}
                  </div>
                  <div class="text-[10px] md:text-xs font-mono text-[#d4af37]">
                    {{ playerSkin.name }} · {{ battle.playerHero.hp }} PV · {{ battle.playerHero.armor }} Armure
                  </div>
                </div>

                <!-- Central Crossed Swords & VS Emblem -->
                <div class="flex flex-col items-center justify-center animate-swords-clash space-y-2">
                  <div class="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-[#8b2b2b] to-[#3a0a0a] border-2 border-[#ff4d4d] flex items-center justify-center shadow-[0_0_35px_rgba(255,77,77,0.7)]">
                    <span class="font-cinzel font-black text-2xl md:text-3xl text-white">VS</span>
                  </div>
                  <div class="font-cinzel text-xs md:text-sm font-black text-[#ff9999] uppercase tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                    DUEL ENGAGÉ
                  </div>
                </div>

                <!-- Opponent Champion -->
                <div class="flex flex-col items-center sm:items-start animate-hero-slide-right space-y-1">
                  <div class="w-20 h-20 md:w-28 md:h-28 rounded-2xl bg-[#140e0a] border-2 border-[#ff4d4d] shadow-[0_0_25px_rgba(255,77,77,0.4)] flex items-center justify-center text-3xl md:text-5xl text-[#ff4d4d] overflow-hidden">
                    @if (battle.opponentHero.imageUrl) {
                      <img
                        [src]="battle.opponentHero.imageUrl"
                        [alt]="battle.opponentHero.name"
                        class="w-full h-full object-cover"
                        referrerpolicy="no-referrer" />
                    } @else {
                      <mat-icon class="text-4xl md:text-6xl">{{ battle.opponentHero.avatarIcon }}</mat-icon>
                    }
                  </div>
                  <div class="font-cinzel text-sm md:text-xl font-black text-[#ff9999] text-center sm:text-left">
                    {{ battle.opponentHero.name }}
                  </div>
                  <div class="text-[10px] md:text-xs font-mono text-[#c5a880] uppercase">
                    {{ battle.opponentHero.hp }} PV · {{ battle.opponentHero.title }}
                  </div>
                </div>

              </div>

              <!-- Weather or Mission Lore Kicker -->
              @if (battle.weatherEffect) {
                <div class="inline-flex items-center gap-2 px-4 py-1.5 bg-[#120f0c] border border-[#d4af37] rounded-full text-xs text-[#d4af37] font-cinzel font-bold shadow-lg">
                  <mat-icon class="text-sm">{{ battle.weatherEffect.icon }}</mat-icon>
                  <span>Climat de l'Arène : {{ battle.weatherEffect.name }}</span>
                </div>
              }

            </div>
          </div>
        }

        <!-- Top Status Bar & Weather Rune & Controls -->
        <div class="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2 bg-[#120f0c] border border-[#3a2f23] rounded-xl shadow-xl">
          <div class="flex items-center gap-2.5 flex-wrap">
            <span class="font-cinzel text-[#c5a880] font-bold text-sm md:text-base flex items-center gap-1.5">
              <mat-icon class="text-[#d4af37] text-lg">military_tech</mat-icon>
              Tour {{ battle.turn }}
            </span>

            <!-- Mode Badge -->
            <div class="hidden md:flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-cinzel font-bold border"
              [class.bg-[#241313]_text-[#ff9999]_border-[#5c2424]]="battle.mode === 'story'"
              [class.bg-[#1a1612]_text-[#d4af37]_border-[#3a2f23]]="battle.mode === 'ranked'"
              [class.bg-[#1a1612]_text-[#a855f7]_border-[#3a2f23]]="battle.mode === 'custom'"
              [class.bg-[#1a1612]_text-[#3b82f6]_border-[#3a2f23]]="battle.mode === 'casual' || battle.mode === 'ai_training'">
              @if (battle.mode === 'story') {
                <mat-icon class="text-xs">auto_stories</mat-icon>
                <span>Histoire : {{ battle.storyMissionTitle || 'Mission' }}</span>
              } @else if (battle.mode === 'ranked') {
                <mat-icon class="text-xs">workspace_premium</mat-icon>
                <span>Arène Classée</span>
              } @else if (battle.mode === 'custom') {
                <mat-icon class="text-xs">tune</mat-icon>
                <span>Duel Personnalisé</span>
              } @else {
                <mat-icon class="text-xs">smart_toy</mat-icon>
                <span>Duel Rapide</span>
              }
            </div>

            <!-- Compteur Visuel de Victoires (En-Tête d'Arène) -->
            <div
              class="relative flex items-center gap-1.5 px-3 py-1 rounded-lg border border-[#8b6b43]/70 bg-[#1a1612] text-xs font-cinzel font-bold transition-all overflow-visible"
              [class.victory-counter-gold-gain]="arenaVictoryGainActive()"
              title="Compteur Total de Victoires">
              @if (arenaVictoryGainActive()) {
                <div class="victory-gold-ring"></div>
                <div class="overflow-hidden absolute inset-0 rounded-lg pointer-events-none">
                  <div class="victory-gain-shimmer"></div>
                </div>
                <span class="victory-gold-spark" style="left: 20%; bottom: 15%; --vx: -14px; --vy: -34px;"></span>
                <span class="victory-gold-spark" style="left: 75%; bottom: 18%; --vx: 16px; --vy: -36px; animation-delay: 0.14s;"></span>
                <div class="victory-gain-badge absolute -top-5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-gradient-to-r from-[#fef08a] to-[#f59e0b] text-[#1a1106] font-cinzel font-black text-[10px] tracking-wider shadow-[0_0_16px_rgba(251,191,36,0.9)] border border-[#fef9c3] whitespace-nowrap z-30">
                  +1 VICTOIRE !
                </div>
              }
              <mat-icon
                class="text-sm transition-colors"
                [class.text-[#fef08a]]="arenaVictoryGainActive()"
                [class.text-[#d4af37]]="!arenaVictoryGainActive()">
                emoji_events
              </mat-icon>
              <span class="text-[#c5a880] hidden sm:inline">Victoires :</span>
              <span
                class="font-mono font-black tabular-nums transition-colors"
                [class.text-[#fef08a]]="arenaVictoryGainActive()"
                [class.text-[#ffd700]]="!arenaVictoryGainActive()">
                {{ gameState.playerStats().wins }}
              </span>
            </div>

            @if (battle.weatherEffect) {
              <div
                class="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-[#1a1612] border border-[#3a2f23] rounded-lg text-xs text-[#c5a880]"
                [title]="battle.weatherEffect.description">
                <mat-icon class="text-sm text-[#d4af37]">{{ battle.weatherEffect.icon }}</mat-icon>
                <span class="font-semibold">{{ battle.weatherEffect.name }}</span>
                <span class="hidden xl:inline text-[10px] text-[#8b6b43] border-l border-[#3a2f23] pl-2">{{ battle.weatherEffect.description }}</span>
              </div>
            }

            @if (gameState.totalRelicXpBoostPct() > 0) {
              <div class="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-[#281b0f] border border-[#d4af37]/60 rounded-lg text-xs text-[#d4af37] shadow-sm" title="Reliques Enchâssées Actives">
                <mat-icon class="text-xs text-[#d4af37]">auto_awesome</mat-icon>
                <span class="font-mono font-bold tabular-nums">+{{ gameState.totalRelicXpBoostPct() }}% EXP</span>
              </div>
            }
          </div>

          <!-- Turn Timer & Status & Guide -->
          <div class="flex items-center gap-2 sm:gap-2.5">
            <button
              (click)="toggleHintBar()"
              class="medieval-btn px-2.5 py-1 bg-[#1a1612] hover:bg-[#251f18] border rounded-lg text-xs font-cinzel font-bold flex items-center gap-1 shadow transition-colors"
              [class.text-[#4dff88]_border-[#4dff88]/50]="showTacticalHint()"
              [class.text-[#8b6b43]_border-[#3a2f23]]="!showTacticalHint()"
              title="Afficher ou masquer le conseil tactique">
              <mat-icon class="text-sm">tips_and_updates</mat-icon>
              <span class="hidden sm:inline">Conseil</span>
            </button>

            <button
              (click)="tutorial.openTutorial(0, 0)"
              class="medieval-btn px-2.5 py-1 bg-[#1a1612] hover:bg-[#251f18] text-[#d4af37] border border-[#d4af37]/60 rounded-lg text-xs font-cinzel font-bold flex items-center gap-1 shadow"
              title="Aide & Guide du Tour">
              <mat-icon class="text-sm">school</mat-icon>
              <span class="hidden sm:inline">Guide</span>
            </button>

            <div
              class="px-3 py-1 rounded-lg border font-cinzel text-xs md:text-sm font-bold flex items-center gap-1.5 transition-colors tabular-nums"
              [class.bg-[#8b2b2b]_text-white_border-[#ff4d4d]_shadow-[0_0_12px_rgba(139,43,43,0.5)]]="battle.currentTurn === 'player'"
              [class.bg-[#1a1612]_text-[#6b5a45]_border-[#3a2f23]]="battle.currentTurn === 'opponent'">
              <mat-icon class="text-base" [class.animate-spin]="battle.currentTurn === 'opponent'">
                {{ battle.currentTurn === 'player' ? 'play_arrow' : 'hourglass_empty' }}
              </mat-icon>
              {{ battle.currentTurn === 'player' ? 'Votre Tour' : 'Tour Adverse' }} ({{ battle.turnTimeLeft }}s)
            </div>

            <button
              (click)="battleEngine.surrender()"
              class="medieval-btn px-3 py-1.5 bg-[#1a1612] hover:bg-[#251f18] text-[#8b6b43] hover:text-[#ff4d4d] border border-[#3a2f23] rounded-lg text-xs font-semibold flex items-center gap-1">
              <mat-icon class="text-sm">flag</mat-icon>
              <span class="hidden sm:inline">Abandonner</span>
            </button>
          </div>
        </div>

        <!-- GUIDED TACTICAL STEP BAR -->
        @let phase = battleEngine.guidedPhase();
        @let feedback = battleEngine.actionFeedback();
        @if (phase || feedback) {
          <div
            class="mt-1.5 px-3.5 py-2 rounded-xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-lg transition-colors"
            [class.bg-[#241313]/95_border-[#ff4d4d]]="phase?.tone === 'attack' || feedback?.tone === 'warning'"
            [class.bg-[#241c0d]/95_border-[#d4af37]]="phase?.tone === 'taunt' && !feedback"
            [class.bg-[#101c2e]/95_border-[#3b82f6]]="phase?.tone === 'spell' && !feedback"
            [class.bg-[#0f2419]/95_border-emerald-500]="phase?.tone === 'ready_end' && !feedback"
            [class.bg-[#15120e]/95_border-[#3a2f23]]="(!phase || phase.tone === 'neutral' || phase.tone === 'ai') && !feedback">
            <div class="flex items-center gap-2.5 min-w-0">
              <mat-icon class="text-lg shrink-0"
                [class.text-[#ff4d4d]]="phase?.tone === 'attack' || feedback?.tone === 'warning'"
                [class.text-[#d4af37]]="phase?.tone === 'taunt' || phase?.tone === 'neutral'"
                [class.text-[#60a5fa]]="phase?.tone === 'spell'"
                [class.text-emerald-400]="phase?.tone === 'ready_end'"
                [class.text-[#8b6b43]]="phase?.tone === 'ai'">
                {{ feedback ? 'error_outline' : phase?.tone === 'spell' ? 'auto_fix_high' : phase?.tone === 'taunt' ? 'shield' : phase?.tone === 'attack' ? 'gps_fixed' : phase?.tone === 'ready_end' ? 'check_circle' : phase?.tone === 'ai' ? 'hourglass_top' : 'explore' }}
              </mat-icon>
              <div class="min-w-0">
                <div class="font-cinzel text-xs font-bold text-[#e0dcc7] truncate">
                  {{ feedback ? feedback.message : phase?.title }}
                </div>
                @if (!feedback && phase?.detail) {
                  <div class="text-[11px] text-[#c5a880] truncate">
                    {{ phase?.detail }}
                  </div>
                }
              </div>
            </div>

            <div class="flex items-center gap-2 shrink-0 flex-wrap">
              @if (showTacticalHint() && !phase?.canCancel && battle.currentTurn === 'player' && !battle.isResolvingTurn) {
                <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1a1612] border border-[#4dff88]/30 text-[11px] text-[#4dff88]">
                  <mat-icon class="text-xs shrink-0">lightbulb</mat-icon>
                  <span class="truncate max-w-[320px] md:max-w-[440px]">{{ battleEngine.tacticalHint() }}</span>
                </div>
              }
              @if (phase?.canCancel) {
                <button
                  (click)="battleEngine.cancelSelection()"
                  class="px-3 py-1 rounded-lg bg-[#1a1612] hover:bg-[#2a221a] border border-[#8b6b43] text-[#e0dcc7] font-cinzel text-xs font-bold flex items-center gap-1 transition-colors">
                  <mat-icon class="text-xs">close</mat-icon>
                  <span>Annuler (Échap)</span>
                </button>
              }
            </div>
          </div>
        }

        <!-- Battlefield Area (Opponent Hero, Opponent Board, Player Board, Player Hero) -->
        <div class="flex-1 flex flex-col justify-between py-2 gap-2 relative">

          <!-- OPPONENT HERO ZONE -->
          @let oppHeroValid = battleEngine.targetingMode() !== null && (battleEngine.targetingMode() === 'minion_attack' || battleEngine.spellTargetSide() === 'enemy') && !battleEngine.isMinionBlockedByTaunt('opponent-hero');
          @let oppHeroBlocked = battleEngine.isMinionBlockedByTaunt('opponent-hero');
          @let oppHeroPreview = isHovering('opponent-hero') ? battleEngine.getCombatPreview('opponent-hero') : null;
          <div class="flex items-center justify-center gap-4 relative">
            <div
              tabindex="0"
              role="button"
              (mouseenter)="setHoveredTarget('opponent-hero')"
              (mouseleave)="clearHoveredTarget()"
              (focus)="setHoveredTarget('opponent-hero')"
              (blur)="clearHoveredTarget()"
              (click)="handleTargetClick('opponent-hero')"
              (keydown.enter)="handleTargetClick('opponent-hero')"
              class="relative bg-[#120f0c] border-2 rounded-2xl p-3 flex items-center gap-3 cursor-pointer transition-all duration-200 shadow-xl group"
              [class.border-[#ff4d4d]]="oppHeroValid"
              [class.ring-2]="oppHeroValid"
              [class.ring-[#ff4d4d]/40]="oppHeroValid"
              [class.shadow-[0_0_24px_rgba(255,77,77,0.45)]]="oppHeroValid"
              [class.opacity-60]="oppHeroBlocked"
              [class.border-[#3a2f23]]="!oppHeroValid">

              @if (oppHeroBlocked) {
                <div class="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-[#241c0d] border border-[#d4af37] rounded-full text-[9px] font-cinzel font-bold text-[#d4af37] flex items-center gap-1 whitespace-nowrap shadow">
                  <mat-icon class="text-[10px]">shield</mat-icon>
                  <span>Provocation</span>
                </div>
              } @else if (oppHeroPreview) {
                <div
                  class="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black flex items-center gap-1 whitespace-nowrap shadow-lg border z-20"
                  [class.bg-[#7f1d1d]_text-white_border-[#ff4d4d]]="oppHeroPreview.tone === 'damage'">
                  <span>{{ oppHeroPreview.label }}</span>
                  @if (oppHeroPreview.subLabel) {
                    <span class="text-[#fde047]">· {{ oppHeroPreview.subLabel }}</span>
                  }
                </div>
              }
              
              <!-- Avatar with frame -->
              <div class="relative shrink-0">
                <div class="w-14 h-14 rounded-xl bg-[#1a1612] border border-[#3a2f23] flex items-center justify-center text-[#c5a880] overflow-hidden">
                  @if (battle.opponentHero.imageUrl) {
                    <img
                      [src]="battle.opponentHero.imageUrl"
                      [alt]="battle.opponentHero.name"
                      class="w-full h-full object-cover"
                      referrerpolicy="no-referrer" />
                  } @else {
                    <mat-icon class="text-3xl">{{ battle.opponentHero.avatarIcon }}</mat-icon>
                  }
                </div>
                @if (battle.opponentHero.armor > 0) {
                  <div class="absolute -top-2 -right-2 bg-[#1e3a8a] border border-[#3b82f6] text-[#60a5fa] px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-0.5 shadow-md">
                    <mat-icon class="text-[10px]">shield</mat-icon>
                    <span>{{ battle.opponentHero.armor }}</span>
                  </div>
                }
              </div>

              <!-- Info & Health -->
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-cinzel text-xs font-bold text-[#e0dcc7] group-hover:text-[#c5a880] transition-colors">
                    {{ battle.opponentHero.name }}
                  </span>
                  <span class="text-[10px] text-[#8b6b43] font-mono">({{ battle.opponentHero.elo }} Elo)</span>
                </div>
                <div class="text-[10px] text-[#6b5a45] mb-1.5">{{ battle.opponentHero.title }}</div>

                <!-- Opponent HP Bar -->
                <div class="w-36 h-3.5 bg-[#1a1612] rounded-full border border-[#3a2f23] overflow-hidden relative shadow-inner">
                  <div
                    class="h-full bg-gradient-to-r from-[#8b2b2b] to-[#ff4d4d] transition-all duration-500 rounded-full"
                    [style.width.%]="(battle.opponentHero.hp / battle.opponentHero.maxHp) * 100"></div>
                  <span class="absolute inset-0 flex items-center justify-center text-[9px] font-mono font-bold text-white drop-shadow tabular-nums">
                    {{ battle.opponentHero.hp }} / {{ battle.opponentHero.maxHp }} PV
                  </span>
                </div>
              </div>

              <!-- Opponent Hand & Deck Counter -->
              <div class="flex flex-col gap-1 text-[10px] font-mono text-[#8b6b43] border-l border-[#3a2f23] pl-3">
                <div class="flex items-center gap-1" title="Cartes en main adverse">
                  <mat-icon class="text-xs text-[#c5a880]">style</mat-icon>
                  <span>{{ battle.opponentHandCount }}</span>
                </div>
                <div class="flex items-center gap-1" title="Mana adverse">
                  <mat-icon class="text-xs text-[#3b82f6]">bolt</mat-icon>
                  <span>{{ battle.opponentMana }}/{{ battle.maxOpponentMana }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- OPPONENT BOARD (Minions) -->
          <div class="min-h-[116px] flex items-center justify-center gap-2 sm:gap-3 px-2 py-1.5 bg-[#120f0c]/40 border border-[#3a2f23]/40 rounded-2xl">
            @if (battle.opponentBoard.length === 0) {
              <span class="text-xs text-[#3a2f23] font-cinzel italic tracking-widest">Le champ adverse est vide</span>
            }
            @for (m of battle.opponentBoard; track m.instanceId) {
              @let oppMinionValid = battleEngine.targetingMode() !== null && (battleEngine.targetingMode() === 'minion_attack' || battleEngine.spellTargetSide() === 'enemy') && !battleEngine.isMinionBlockedByTaunt('opponent-minion', m);
              @let oppMinionBlocked = battleEngine.isMinionBlockedByTaunt('opponent-minion', m);
              @let oppMinionPreview = isHovering('opponent-minion', m.instanceId) ? battleEngine.getCombatPreview('opponent-minion', m) : null;
              <div
                tabindex="0"
                role="button"
                (mouseenter)="setHoveredTarget('opponent-minion', m)"
                (mouseleave)="clearHoveredTarget()"
                (focus)="setHoveredTarget('opponent-minion', m)"
                (blur)="clearHoveredTarget()"
                (click)="handleMinionClick(m, 'opponent')"
                (keydown.enter)="handleMinionClick(m, 'opponent')"
                class="w-22 sm:w-26 h-32 sm:h-34 bg-[#1a1612] border-2 rounded-xl p-1.5 flex flex-col justify-between cursor-pointer transition-all duration-200 hover:scale-105 shadow-xl relative"
                [class.border-[#d4af37]]="m.taunt && oppMinionValid"
                [class.ring-2]="oppMinionValid"
                [class.ring-[#d4af37]/60]="m.taunt && oppMinionValid"
                [class.border-[#ff4d4d]]="!m.taunt && oppMinionValid"
                [class.ring-[#ff4d4d]/40]="!m.taunt && oppMinionValid"
                [class.opacity-55]="oppMinionBlocked"
                [class.border-[#3a2f23]]="!oppMinionValid && !m.taunt"
                [class.border-[#8b6b43]]="!oppMinionValid && m.taunt">

                @if (oppMinionPreview && !oppMinionBlocked) {
                  <div class="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-[#7f1d1d] border border-[#ff4d4d] rounded-full text-[9px] font-mono font-black text-white whitespace-nowrap shadow-lg z-20">
                    {{ oppMinionPreview.label }}
                  </div>
                } @else if (oppMinionBlocked) {
                  <div class="absolute -top-2.5 left-1/2 -translate-x-1/2 px-1.5 py-0.2 bg-[#1a1612] border border-[#d4af37]/70 rounded-full text-[8px] font-mono font-bold text-[#d4af37] whitespace-nowrap z-20">
                    Bloqué
                  </div>
                }
                
                <div class="flex justify-between items-center text-[10px] font-mono">
                  <span class="text-[#3b82f6] font-bold">⬥{{ m.cost }}</span>
                  <div class="flex items-center gap-0.5">
                    @if (m.taunt) {
                      <mat-icon class="text-xs text-[#d4af37]" title="Provocation : doit être attaquée en priorité">shield</mat-icon>
                    }
                    @if (m.divineShield) {
                      <mat-icon class="text-xs text-[#fde047]" title="Bouclier Divin : annule le premier dégât">verified_user</mat-icon>
                    }
                    @if (m.lifesteal) {
                      <mat-icon class="text-xs text-[#f87171]" title="Vol de Vie">water_drop</mat-icon>
                    }
                  </div>
                </div>

                <div class="flex flex-col items-center">
                  @if (m.imageUrl) {
                    <div class="w-12 h-12 rounded-lg overflow-hidden border border-[#3a2f23] mb-0.5 bg-[#0d0b09]"
                      [class.ring-2_ring-[#fde047]]="m.divineShield">
                      <img
                        [src]="m.imageUrl"
                        [alt]="m.name"
                        class="w-full h-full object-cover"
                        referrerpolicy="no-referrer" />
                    </div>
                  } @else {
                    <mat-icon class="text-2xl text-[#c5a880] mb-0.5">{{ m.icon }}</mat-icon>
                  }
                  <span class="text-[9px] font-cinzel font-bold text-[#e0dcc7] text-center truncate w-full">{{ m.name }}</span>
                </div>

                <div class="flex justify-between items-center text-[10px] font-mono font-bold">
                  <span class="px-1.5 py-0.5 bg-[#241313] text-[#ff4d4d] rounded border border-[#5c2424] inline-flex items-center gap-0.5">
                    <mat-icon class="text-[10px]">swords</mat-icon>
                    {{ m.attack }}
                  </span>
                  <span class="px-1.5 py-0.5 bg-[#122812] text-[#4dff88] rounded border border-[#225c22] inline-flex items-center gap-0.5">
                    <mat-icon class="text-[10px]">favorite</mat-icon>
                    {{ m.currentHealth }}
                  </span>
                </div>
              </div>
            }
          </div>

          <!-- COMBAT LOG TICKER & DIVIDER -->
          <div class="flex items-center justify-between gap-3 px-4 py-1.5 bg-[#120f0c] border border-[#3a2f23] rounded-xl text-xs">
            <div class="flex items-center gap-2 overflow-hidden">
              <mat-icon class="text-xs text-[#d4af37] shrink-0">history_edu</mat-icon>
              <span class="text-[#a89984] truncate font-mono text-[11px]">
                {{ battle.combatLogs[0]?.text || 'Le combat fait rage...' }}
              </span>
            </div>
            <button
              (click)="battleEngine.endTurn()"
              [disabled]="battle.currentTurn !== 'player' || battle.isResolvingTurn"
              class="crimson-btn px-5 py-1.5 text-xs font-cinzel font-bold rounded-lg whitespace-nowrap shrink-0 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5">
              <mat-icon class="text-sm">skip_next</mat-icon>
              <span>Fin de Tour</span>
            </button>
          </div>

          <!-- PLAYER BOARD (Minions) -->
          <div class="min-h-[116px] flex items-center justify-center gap-2 sm:gap-3 px-2 py-1.5 bg-[#120f0c]/40 border border-[#3a2f23]/40 rounded-2xl">
            @if (battle.playerBoard.length === 0) {
              <span class="text-xs text-[#3a2f23] font-cinzel italic tracking-widest">Invoquez vos créatures depuis votre main</span>
            }
            @for (m of battle.playerBoard; track m.instanceId) {
              @let isHealTarget = battleEngine.targetingMode() === 'spell' && battleEngine.spellTargetSide() === 'ally';
              @let allyPreview = isHovering('player-minion', m.instanceId) ? battleEngine.getCombatPreview('player-minion', m) : null;
              @let isSelectedAttacker = battleEngine.attackingMinion()?.instanceId === m.instanceId;
              @let isReady = m.canAttack && !m.hasAttacked && battle.currentTurn === 'player' && !battle.isResolvingTurn;
              <div
                tabindex="0"
                role="button"
                (mouseenter)="setHoveredTarget('player-minion', m)"
                (mouseleave)="clearHoveredTarget()"
                (focus)="setHoveredTarget('player-minion', m)"
                (blur)="clearHoveredTarget()"
                (click)="handleMinionClick(m, 'player')"
                (keydown.enter)="handleMinionClick(m, 'player')"
                class="w-22 sm:w-26 h-32 sm:h-34 bg-[#1a1612] border-2 rounded-xl p-1.5 flex flex-col justify-between cursor-pointer transition-all duration-200 hover:scale-105 shadow-xl relative"
                [class.border-[#d4af37]]="isSelectedAttacker"
                [class.ring-2]="isSelectedAttacker || isHealTarget"
                [class.ring-[#d4af37]/60]="isSelectedAttacker"
                [class.border-emerald-400]="isHealTarget"
                [class.ring-emerald-400/50]="isHealTarget"
                [class.border-[#4dff88]]="isReady && !isSelectedAttacker && !isHealTarget"
                [class.shadow-[0_0_15px_rgba(77,255,136,0.3)]]="isReady && !isSelectedAttacker"
                [class.border-[#3a2f23]]="!isReady && !isSelectedAttacker && !isHealTarget">

                @if (allyPreview) {
                  <div class="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-emerald-950 border border-emerald-400 rounded-full text-[9px] font-mono font-black text-emerald-300 whitespace-nowrap shadow-lg z-20">
                    {{ allyPreview.label }}
                  </div>
                } @else {
                  <div class="absolute -top-2 right-1.5 px-1.5 py-0.2 rounded text-[8px] font-mono font-bold uppercase border shadow"
                    [class.bg-[#122812]_text-[#4dff88]_border-[#4dff88]/50]="isReady"
                    [class.bg-[#241c0d]_text-[#d4af37]_border-[#d4af37]/50]="!m.canAttack && !m.hasAttacked"
                    [class.bg-[#120f0c]_text-[#8b6b43]_border-[#3a2f23]]="m.hasAttacked">
                    {{ isReady ? 'Prêt' : m.hasAttacked ? 'Agie' : 'Repos' }}
                  </div>
                }
                
                <div class="flex justify-between items-center text-[10px] font-mono">
                  <span class="text-[#3b82f6] font-bold">⬥{{ m.cost }}</span>
                  <div class="flex items-center gap-0.5">
                    @if (m.taunt) {
                      <mat-icon class="text-xs text-[#d4af37]" title="Provocation">shield</mat-icon>
                    }
                    @if (m.divineShield) {
                      <mat-icon class="text-xs text-[#fde047]" title="Bouclier Divin">verified_user</mat-icon>
                    }
                    @if (m.lifesteal) {
                      <mat-icon class="text-xs text-[#f87171]" title="Vol de Vie">water_drop</mat-icon>
                    }
                  </div>
                </div>

                <div class="flex flex-col items-center">
                  @if (m.imageUrl) {
                    <div class="w-12 h-12 rounded-lg overflow-hidden border border-[#3a2f23] mb-0.5 bg-[#0d0b09]"
                      [class.ring-2_ring-[#fde047]]="m.divineShield">
                      <img
                        [src]="m.imageUrl"
                        [alt]="m.name"
                        class="w-full h-full object-cover"
                        referrerpolicy="no-referrer" />
                    </div>
                  } @else {
                    <mat-icon class="text-2xl text-[#c5a880] mb-0.5">{{ m.icon }}</mat-icon>
                  }
                  <span class="text-[9px] font-cinzel font-bold text-[#e0dcc7] text-center truncate w-full">{{ m.name }}</span>
                </div>

                <div class="flex justify-between items-center text-[10px] font-mono font-bold">
                  <span class="px-1.5 py-0.5 bg-[#241313] text-[#ff4d4d] rounded border border-[#5c2424] inline-flex items-center gap-0.5">
                    <mat-icon class="text-[10px]">swords</mat-icon>
                    {{ m.attack }}
                  </span>
                  <span class="px-1.5 py-0.5 bg-[#122812] text-[#4dff88] rounded border border-[#225c22] inline-flex items-center gap-0.5">
                    <mat-icon class="text-[10px]">favorite</mat-icon>
                    {{ m.currentHealth }}
                  </span>
                </div>
              </div>
            }
          </div>

          <!-- PLAYER HERO & MANA & HAND ZONE -->
          <div class="space-y-2">

            <!-- ACTIVE ELIXIRS & TEMPORARY STAT BONUSES IN COMBAT HUD -->
            @let matchBuffs = battle.appliedElixirBuffs && battle.appliedElixirBuffs.length > 0 ? battle.appliedElixirBuffs : gameState.activeBuffs();
            @let matchBonuses = battle.appliedElixirBonuses || gameState.elixirStatBonuses();
            @if (matchBuffs.length > 0) {
              <div class="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 bg-[#140e08]/95 border border-[#d4af37]/50 rounded-xl shadow-md">
                <div class="flex flex-wrap items-center gap-2.5">
                  <span class="font-cinzel text-[11px] font-bold text-[#d4af37] flex items-center gap-1.5 shrink-0">
                    <mat-icon class="text-sm text-[#d4af37]">science</mat-icon>
                    <span>Élixirs Actifs :</span>
                  </span>
                  @for (buff of matchBuffs; track buff.potionId) {
                    <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1a1612] border border-[#3a2f23] text-[11px]">
                      <mat-icon class="text-sm" [style.color]="buff.color">{{ buff.icon }}</mat-icon>
                      <span class="font-cinzel font-semibold text-[#e0dcc7]">{{ buff.name }}</span>
                      <span aria-hidden="true" class="text-[#8b6b43]">·</span>
                      <span class="font-mono font-bold text-emerald-400 tabular-nums">{{ gameState.getElixirShortBonusLabel(buff.type) }}</span>
                      <span aria-hidden="true" class="text-[#8b6b43]">·</span>
                      <span class="font-mono text-[#c5a880] tabular-nums">{{ buff.remainingMatches }}c</span>
                    </div>
                  }
                </div>

                <div class="flex flex-wrap items-center gap-2 text-[11px] font-mono tabular-nums text-[#c5a880]">
                  @if (matchBonuses.bonusHp > 0) {
                    <span class="text-emerald-400 font-bold">+{{ matchBonuses.bonusHp }} PV</span>
                  }
                  @if (matchBonuses.bonusArmor > 0) {
                    <span class="text-[#60a5fa] font-bold">+{{ matchBonuses.bonusArmor }} Arm.</span>
                  }
                  @if (matchBonuses.bonusStartingMana > 0) {
                    <span class="text-[#38bdf8] font-bold">+{{ matchBonuses.bonusStartingMana }} Mana</span>
                  }
                  @if (matchBonuses.bonusMinionAttack > 0) {
                    <span class="text-orange-400 font-bold">+{{ matchBonuses.bonusMinionAttack }} ATQ</span>
                  }
                  @if (matchBonuses.bonusSpellDamage > 0) {
                    <span class="text-cyan-300 font-bold">+{{ matchBonuses.bonusSpellDamage }} Sorts</span>
                  }
                  @if (matchBonuses.bonusSpellCritPct > 0) {
                    <span class="text-purple-400 font-bold">+{{ matchBonuses.bonusSpellCritPct }}% Crit</span>
                  }
                  @if (matchBonuses.piercingTurnDamage > 0) {
                    <span class="text-violet-400 font-bold">{{ matchBonuses.piercingTurnDamage }} Dgt/Tour</span>
                  }
                  @if (matchBonuses.hasPhoenixRebirth) {
                    <span class="text-rose-400 font-bold">Phénix Prêt</span>
                  }
                </div>
              </div>
            }
            
            <!-- Hero Stats & Mana Ribbon -->
            @let isPlayerHealTarget = battleEngine.targetingMode() === 'spell' && battleEngine.spellTargetSide() === 'ally';
            @let playerHeroPreview = isHovering('player-hero') ? battleEngine.getCombatPreview('player-hero') : null;
            <div
              class="relative flex items-center justify-between gap-3 px-4 py-2 bg-[#120f0c] border-2 rounded-xl shadow-lg transition-colors"
              [class.border-emerald-400]="isPlayerHealTarget"
              [class.ring-2]="isPlayerHealTarget"
              [class.ring-emerald-400/40]="isPlayerHealTarget"
              [class.border-[#3a2f23]]="!isPlayerHealTarget">

              @if (playerHeroPreview) {
                <div class="absolute -top-3 left-6 px-2.5 py-0.5 bg-emerald-950 border border-emerald-400 rounded-full text-[10px] font-mono font-black text-emerald-300 shadow-lg z-20">
                  {{ playerHeroPreview.label }}
                </div>
              }

              @let hudSkin = gameState.getHeroActiveSkin(battle.playerHero.hero);
              <div class="flex items-center gap-3">
                <div
                  tabindex="0"
                  role="button"
                  (mouseenter)="setHoveredTarget('player-hero')"
                  (mouseleave)="clearHoveredTarget()"
                  (focus)="setHoveredTarget('player-hero')"
                  (blur)="clearHoveredTarget()"
                  (click)="handleTargetClick('player-hero')"
                  (keydown.enter)="handleTargetClick('player-hero')"
                  class="flex items-center gap-3 rounded-xl p-1 -m-1 transition-colors"
                  [class.cursor-pointer]="isPlayerHealTarget"
                  [class.bg-emerald-950/30]="isPlayerHealTarget">
                  <div class="relative shrink-0">
                    <div
                      class="w-12 h-12 rounded-xl bg-[#1a1612] border-2 flex items-center justify-center text-[#d4af37] overflow-hidden relative"
                      [style.borderColor]="hudSkin.accentHex || '#d4af37'">
                      @if (hudSkin.imageUrl || battle.playerHero.hero.imageUrl) {
                        <img
                          [src]="hudSkin.imageUrl || battle.playerHero.hero.imageUrl"
                          [alt]="battle.playerHero.hero.name"
                          [style.filter]="hudSkin.portraitFilter || 'none'"
                          class="w-full h-full object-cover"
                          referrerpolicy="no-referrer" />
                        <div class="absolute inset-0 bg-gradient-to-t pointer-events-none" [class]="hudSkin.themeGradient || ''"></div>
                      } @else {
                        <mat-icon class="text-2xl">{{ hudSkin.avatarIcon || battle.playerHero.hero.avatarIcon }}</mat-icon>
                      }
                    </div>
                    @if (battle.playerHero.armor > 0) {
                      <div class="absolute -top-2 -right-2 bg-[#1e3a8a] border border-[#3b82f6] text-[#60a5fa] px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-0.5 shadow-md z-10">
                        <mat-icon class="text-[10px]">shield</mat-icon>
                        <span>{{ battle.playerHero.armor }}</span>
                      </div>
                    }
                  </div>

                  <div>
                    <div class="flex items-center gap-2">
                      <span class="font-cinzel text-xs font-bold text-[#c5a880]">{{ battle.playerHero.hero.name }}</span>
                      <span class="text-[10px] font-mono" [style.color]="hudSkin.accentHex || '#8b6b43'">{{ hudSkin.name }}</span>
                      @if (matchBonuses.bonusHp > 0 || matchBonuses.bonusArmor > 0) {
                        <span class="text-[10px] font-mono text-emerald-400 font-bold tabular-nums">
                          Élixir actif
                        </span>
                      }
                    </div>
                    <!-- Player HP Bar -->
                    <div class="w-40 h-3 bg-[#1a1612] rounded-full border border-[#3a2f23] overflow-hidden relative shadow-inner mt-1">
                      <div
                        class="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500 rounded-full"
                        [style.width.%]="(battle.playerHero.hp / battle.playerHero.maxHp) * 100"></div>
                      <span class="absolute inset-0 flex items-center justify-center text-[9px] font-mono font-bold text-white drop-shadow tabular-nums">
                        {{ battle.playerHero.hp }} / {{ battle.playerHero.maxHp }} PV
                      </span>
                    </div>
                  </div>
                </div>

                <!-- EQUIPPED COMPANION PET BADGE (Portrait + Damage Multiplier) -->
                @if (gameState.equippedPet(); as activePet) {
                  <div
                    class="hidden sm:flex items-center gap-2.5 px-2.5 py-1 bg-[#1a1612] border rounded-xl shadow-md transition-all cursor-help"
                    [style.border-color]="getPetRarityColor(activePet.rarity)"
                    [title]="'Familier Actif : ' + activePet.name + ' (' + activePet.rarity.toUpperCase() + ') - Multiplicateur de Dégâts x' + activePet.totalMultiplier.toFixed(2) + ' (+' + gameState.activePetBonusPct() + '%)'">
                    <div class="w-9 h-9 rounded-lg overflow-hidden border border-white/15 shrink-0 bg-[#120f0c] flex items-center justify-center">
                      @if (activePet.imageUrl) {
                        <img
                          [src]="activePet.imageUrl"
                          [alt]="activePet.name"
                          class="w-full h-full object-cover"
                          referrerpolicy="no-referrer" />
                      } @else {
                        <mat-icon class="text-lg text-[#d4af37]">{{ activePet.icon }}</mat-icon>
                      }
                    </div>
                    <div class="flex flex-col">
                      <div class="flex items-center gap-1">
                        <span class="font-cinzel text-[10px] font-bold text-[#e0dcc7] truncate max-w-[95px]">{{ activePet.name }}</span>
                        <span class="text-[8px] font-mono text-[#d4af37]">Niv.{{ activePet.level }}</span>
                      </div>
                      <span class="text-[9px] font-mono font-black" [style.color]="getPetRarityTextColor(activePet.rarity)">
                        DMG x{{ activePet.totalMultiplier.toFixed(2) }} (+{{ gameState.activePetBonusPct() }}%)
                      </span>
                    </div>
                  </div>
                }
              </div>

              <!-- Mana Crystals & Ultimate Energy -->
              <div class="flex items-center gap-2 sm:gap-3">
                <div class="flex items-center gap-1 bg-[#1a1612] px-3 py-1.5 rounded-lg border border-[#3a2f23]">
                  <mat-icon class="text-base text-[#3b82f6]">bolt</mat-icon>
                  <span class="font-mono font-bold text-xs text-[#60a5fa] tabular-nums">{{ battle.playerMana }} / {{ battle.maxPlayerMana }}</span>
                </div>
                <button
                  (click)="battleEngine.castHeroUltimate()"
                  [disabled]="battle.playerHero.energy < battle.playerHero.maxEnergy || battle.currentTurn !== 'player' || battle.isResolvingTurn"
                  class="px-3 py-1.5 rounded-lg border font-cinzel text-xs font-bold flex items-center gap-1.5 transition-all disabled:cursor-not-allowed"
                  [class.bg-gradient-to-r_from-[#d4af37]_to-[#f59e0b]_text-black_border-[#d4af37]_shadow-[0_0_15px_rgba(212,175,55,0.4)]]="battle.playerHero.energy >= battle.playerHero.maxEnergy"
                  [class.bg-[#1a1612]_text-[#6b5a45]_border-[#3a2f23]_opacity-50]="battle.playerHero.energy < battle.playerHero.maxEnergy"
                  [title]="battle.playerHero.hero.ultimateName + ' : ' + battle.playerHero.hero.ultimateDesc">
                  <mat-icon class="text-sm">auto_awesome</mat-icon>
                  <span>Ultime ({{ battle.playerHero.energy }}/{{ battle.playerHero.maxEnergy }})</span>
                </button>
              </div>
            </div>

            <!-- PLAYER HAND CARDS -->
            <div class="flex items-center justify-center gap-2 overflow-x-auto py-2 px-1 card-3d-perspective">
              @for (card of battle.playerHand; track card.id + '_' + $index) {
                @let canPlayCard = battle.currentTurn === 'player' && !battle.isResolvingTurn && battle.playerMana >= card.cost && (card.type !== 'creature' || battle.playerBoard.length < 7);
                @let isSelected = battleEngine.selectedHandCard()?.id === card.id;
                <div
                  tabindex="0"
                  role="button"
                  (click)="handleHandCardClick(card)"
                  (keydown.enter)="handleHandCardClick(card)"
                  class="card-3d-tilt-hover w-24 sm:w-28 h-36 sm:h-40 bg-[#1a1612] border-2 rounded-xl p-2 flex flex-col justify-between cursor-pointer shadow-2xl relative shrink-0 transition-opacity"
                  [class.rarity-common]="card.rarity === 'common'"
                  [class.rarity-rare]="card.rarity === 'rare'"
                  [class.rarity-epic]="card.rarity === 'epic'"
                  [class.rarity-legendary]="card.rarity === 'legendary'"
                  [class.rarity-mythic]="card.rarity === 'mythic'"
                  [class.border-[#3b82f6]]="isSelected"
                  [class.ring-2]="isSelected"
                  [class.ring-[#60a5fa]]="isSelected"
                  [class.shadow-[0_0_20px_rgba(59,130,246,0.5)]]="isSelected"
                  [class.opacity-50]="!canPlayCard"
                  [class.border-[#3a2f23]]="!isSelected">
                  
                  <!-- Cost & Type -->
                  <div class="card-3d-layer-pop flex justify-between items-center text-xs font-mono">
                    <span
                      class="w-5 h-5 rounded-full font-bold flex items-center justify-center shadow"
                      [class.bg-[#1e3a8a]_text-[#60a5fa]]="battle.playerMana >= card.cost"
                      [class.bg-[#3b1515]_text-[#ff6b6b]]="battle.playerMana < card.cost">
                      {{ card.cost }}
                    </span>
                    <div class="flex items-center gap-1">
                      @if (card.spellDamage) {
                        <span class="text-[9px] font-bold text-[#60a5fa] inline-flex items-center gap-0.5" title="Dégâts effectifs avec bonus">
                          <mat-icon class="text-[10px]">bolt</mat-icon>
                          {{ battleEngine.calculateSpellDamage(card).finalDamage }}
                        </span>
                      }
                      <mat-icon class="text-xs text-[#8b6b43]">{{ card.type === 'creature' ? 'group' : 'local_fire_department' }}</mat-icon>
                    </div>
                  </div>

                  <!-- Card Art & Name -->
                  <div class="card-3d-layer-float flex flex-col items-center text-center">
                    @if (card.imageUrl) {
                      <div class="w-full h-14 rounded-lg overflow-hidden border border-[#3a2f23] mb-1 bg-[#0d0b09]">
                        <img
                          [src]="card.imageUrl"
                          [alt]="card.name"
                          class="w-full h-full object-cover"
                          referrerpolicy="no-referrer" />
                      </div>
                    } @else {
                      <mat-icon class="text-2xl sm:text-3xl text-[#c5a880] mb-1">{{ card.icon }}</mat-icon>
                    }
                    <span class="text-[10px] sm:text-xs font-cinzel font-bold text-[#e0dcc7] line-clamp-1">{{ card.name }}</span>
                    <span class="text-[9px] text-[#6b5a45] line-clamp-2 mt-0.5 leading-tight">{{ card.description }}</span>
                  </div>

                  <!-- Attack & Health if Creature -->
                  <div class="card-3d-layer-float flex justify-between items-center text-[10px] font-mono font-bold">
                    @if (card.type === 'creature') {
                      <span class="text-[#ff4d4d] inline-flex items-center gap-0.5">
                        <mat-icon class="text-[10px]">swords</mat-icon>
                        {{ card.attack }}
                      </span>
                      <span class="text-[#4dff88] inline-flex items-center gap-0.5">
                        <mat-icon class="text-[10px]">favorite</mat-icon>
                        {{ card.health }}
                      </span>
                    } @else {
                      <span class="text-[#d4af37] text-[9px] font-cinzel uppercase mx-auto">
                        {{ card.spellDamage ? 'Sort Offensif' : 'Sort de Soin' }}
                      </span>
                    }
                  </div>
                </div>
              }
            </div>

          </div>

        </div>

        <!-- VICTORY / DEFEAT MODAL OVERLAY -->
        @if (battle.winner) {
          <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
            <div class="bg-[#120f0c] border-2 rounded-2xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl text-[#e0dcc7]"
              [class.border-[#d4af37]]="battle.winner === 'player'"
              [class.border-[#ff4d4d]]="battle.winner === 'opponent'">
              
              <div class="w-20 h-20 mx-auto mb-4 rounded-full border-2 flex items-center justify-center shadow-xl"
                [class.border-[#d4af37]]="battle.winner === 'player'"
                [class.bg-[#1a1612]]="battle.winner === 'player'"
                [class.border-[#ff4d4d]]="battle.winner === 'opponent'"
                [class.bg-[#241313]]="battle.winner === 'opponent'">
                <mat-icon class="text-5xl" [class.text-[#d4af37]]="battle.winner === 'player'" [class.text-[#ff4d4d]]="battle.winner === 'opponent'">
                  {{ battle.winner === 'player' ? 'workspace_premium' : 'heart_broken' }}
                </mat-icon>
              </div>

              <h2 class="font-cinzel text-2xl md:text-3xl font-black mb-1" [class.text-[#c5a880]]="battle.winner === 'player'" [class.text-[#ff4d4d]]="battle.winner === 'opponent'">
                {{ battle.winner === 'player' ? 'VICTOIRE GLORIEUSE' : 'DÉFAITE ÉPIQUE' }}
              </h2>

              <p class="text-xs text-[#6b5a45] mb-6">
                {{ battle.winner === 'player' ? "Les bardes chanteront votre triomphe à travers toute l'Aetheria !" : 'Relevez-vous, chevalier. Améliorez votre deck et forgez votre revanche.' }}
              </p>

              <!-- Rewards Box -->
              <div class="bg-[#1a1612] border border-[#3a2f23] rounded-xl p-4 mb-6 space-y-3">
                <div class="text-[10px] font-cinzel text-[#8b6b43] uppercase tracking-widest">Récompenses & Progression</div>
                <div class="grid grid-cols-3 gap-2 text-center">
                  <div class="bg-[#120f0c] p-2 rounded-lg border border-[#3a2f23]">
                    <div class="text-[10px] text-[#6b5a45]">Points Elo</div>
                    <div class="font-mono font-bold text-xs tabular-nums" [class.text-emerald-400]="battle.winner === 'player'" [class.text-[#ff4d4d]]="battle.winner === 'opponent'">
                      {{ battle.winner === 'player' ? '+' + (battle.matchRewards?.eloDelta || 25) : (battle.matchRewards?.eloDelta || -15) }} Elo
                    </div>
                  </div>
                  <div class="bg-[#120f0c] p-2 rounded-lg border border-[#3a2f23]">
                    <div class="text-[10px] text-[#6b5a45]">Or Reçu</div>
                    <div class="font-mono font-bold text-xs text-[#d4af37] tabular-nums">
                      +{{ battle.matchRewards?.gold || (battle.winner === 'player' ? 150 : 50) }} Or
                    </div>
                  </div>
                  <div class="bg-[#120f0c] p-2 rounded-lg border border-[#3a2f23]">
                    <div class="text-[10px] text-[#6b5a45]">XP Héros</div>
                    <div class="font-mono font-bold text-xs text-[#4d94ff] tabular-nums">
                      +{{ battle.matchRewards?.xp || (battle.winner === 'player' ? 100 : 35) }} XP
                    </div>
                  </div>
                </div>

                @if (battle.winner === 'player') {
                  <div class="relative overflow-hidden flex items-center justify-between px-3.5 py-2 rounded-xl border border-[#fbbf24]/70 bg-gradient-to-r from-[#2e200a] via-[#1b150c] to-[#2e200a] victory-counter-gold-gain">
                    <div class="victory-gain-shimmer"></div>
                    <div class="flex items-center gap-2 relative z-10">
                      <mat-icon class="text-lg text-[#fef08a]">emoji_events</mat-icon>
                      <span class="font-cinzel text-xs font-bold text-[#fef08a]">Compteur de Victoires</span>
                    </div>
                    <div class="flex items-center gap-2 relative z-10">
                      <span class="font-mono text-sm font-black text-[#ffd700] tabular-nums">{{ gameState.playerStats().wins }}</span>
                      <span class="px-2 py-0.5 rounded-full bg-[#fbbf24] text-[#1a1106] text-[10px] font-cinzel font-black">+1</span>
                    </div>
                  </div>
                }
              </div>

              <button
                (click)="battleEngine.quitBattle()"
                class="crimson-btn w-full py-3 font-cinzel font-bold text-xs uppercase tracking-widest rounded-xl">
                Retourner au Bastion
              </button>
            </div>
          </div>
        }

      </div>
    } @else {
      <!-- BASTION DU HÉROS & GAME MODES PORTAL -->
      <div class="max-w-7xl mx-auto p-4 md:p-8 flex flex-col gap-8">
        
        <!-- Header Section with Hero Identity & Game Modes Launchers -->
        <div class="flex flex-col lg:flex-row justify-between items-start gap-8">
          
          <div class="space-y-4 flex-1">
            <div class="flex items-center justify-between">
              <h1 class="text-3xl md:text-4xl font-black uppercase tracking-[0.2em] text-[#c5a880] font-cinzel">
                Bastion d'Aetheria
              </h1>
              <button
                (click)="navigateToModes.emit()"
                class="medieval-btn px-4 py-2 bg-[#1a1612] hover:bg-[#251f18] text-[#d4af37] border border-[#3a2f23] hover:border-[#d4af37] rounded-xl text-xs font-cinzel font-bold flex items-center gap-1.5">
                <mat-icon class="text-sm">sports_esports</mat-icon>
                <span>Sélecteur de Modes</span>
              </button>
            </div>
            
            <div class="flex flex-col sm:flex-row gap-6 items-start">
              @let previewSkin = gameState.activeSelectedHeroSkin();
              <!-- Ornate Hero Bastion Card -->
              <div
                class="w-64 h-96 bg-[#1a1612] border-4 border-double relative rounded shadow-2xl overflow-hidden group shrink-0"
                [style.borderColor]="previewSkin.accentHex || '#3a2f23'">
                @if (previewSkin.imageUrl || gameState.selectedHero().imageUrl; as heroPortrait) {
                  <img
                    [src]="heroPortrait"
                    [alt]="gameState.selectedHero().name"
                    [style.filter]="previewSkin.portraitFilter || 'none'"
                    class="absolute inset-0 w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-700"
                    referrerpolicy="no-referrer" />
                  <div class="absolute inset-0 bg-gradient-to-tr pointer-events-none" [class]="previewSkin.themeGradient || ''"></div>
                } @else {
                  <div class="absolute inset-0 flex items-center justify-center">
                    <mat-icon class="text-8xl text-[#c5a880]/40 group-hover:scale-110 transition-transform duration-500">
                      {{ previewSkin.avatarIcon || gameState.selectedHero().avatarIcon }}
                    </mat-icon>
                  </div>
                }
                <div class="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/30 to-[#0a0a0c]/60"></div>
                <div class="absolute top-2 left-2 right-2 border border-[#3a2f23] p-1 text-center text-[10px] tracking-wide bg-[#0d0b09]/90 font-cinzel font-bold z-10">
                  <span class="text-[#d4af37] uppercase">{{ gameState.selectedHero().name }}</span>
                  <span class="block text-[9px] font-normal" [style.color]="previewSkin.accentHex || '#c5a880'">{{ previewSkin.name }}</span>
                </div>

                <div class="absolute bottom-4 left-0 right-0 px-4 text-center">
                  <p class="text-xs text-[#6b5a45] italic mb-2 font-serif">&ldquo;{{ gameState.selectedHero().passiveDesc || 'L\\'acier et la magie guident ma lame.' }}&rdquo;</p>
                  <div class="flex justify-center gap-2">
                    <span class="px-2.5 py-0.5 bg-[#12100d] border border-[#3a2f23] text-[9px] rounded font-mono text-[#c5a880]">
                      PV: {{ gameState.selectedHero().baseHp }}
                    </span>
                    <span class="px-2.5 py-0.5 bg-[#12100d] border border-[#3a2f23] text-[9px] rounded font-mono text-[#4d94ff]">
                      ÉNERGIE: {{ gameState.selectedHero().ultimateCost }}
                    </span>
                  </div>
                </div>

                <div class="absolute -right-4 top-1/2 -translate-y-1/2 text-6xl opacity-10 font-bold rotate-90 text-[#8b6b43] pointer-events-none">
                  ELITE
                </div>
              </div>

              <!-- Quick Game Modes Launcher Cards -->
              <div class="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                
                <!-- TUTORIAL LAUNCHER CARD -->
                <div
                  tabindex="0"
                  role="button"
                  (click)="tutorial.openTutorial(0, 0)"
                  (keydown.enter)="tutorial.openTutorial(0, 0)"
                  class="col-span-1 sm:col-span-2 bg-[#1a1612] border-2 border-[#d4af37]/60 hover:border-[#d4af37] p-4 rounded-xl cursor-pointer transition-all shadow-xl flex items-center justify-between group">
                  <div class="flex items-center gap-3.5">
                    <div class="w-12 h-12 rounded-xl bg-[#120f0c] border border-[#d4af37] flex items-center justify-center text-[#d4af37] group-hover:scale-105 transition-transform shadow">
                      <mat-icon class="text-2xl">school</mat-icon>
                    </div>
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="text-[10px] font-mono uppercase tracking-widest text-[#d4af37] font-bold">Conseils de l'Archimage</span>
                        @if (!tutorial.isCompleted()) {
                          <span class="px-2 py-0.5 bg-[#8b2b2b] text-white text-[9px] font-bold rounded-full animate-pulse">+500 Or Récompense</span>
                        }
                      </div>
                      <h3 class="font-cinzel text-sm font-bold text-[#e0dcc7] group-hover:text-[#d4af37]">
                        Tutoriel Interactif & Guide des Novices
                      </h3>
                      <p class="text-[11px] text-[#8b6b43] line-clamp-1">
                        Maîtrisez les arcanes du duel : gestion du mana, provocations, sorts et création de decks.
                      </p>
                    </div>
                  </div>
                  <div class="flex items-center gap-1.5 px-3 py-1.5 bg-[#120f0c] rounded-lg border border-[#8b6b43] text-xs font-cinzel text-[#d4af37] group-hover:bg-[#d4af37] group-hover:text-black transition-colors whitespace-nowrap">
                    <span>Ouvrir le Guide</span>
                    <mat-icon class="text-sm">arrow_forward</mat-icon>
                  </div>
                </div>

                <!-- DAILY TACTICAL MISSIONS BANNER CARD -->
                <div
                  tabindex="0"
                  role="button"
                  (click)="openDailyMissions.emit()"
                  (keydown.enter)="openDailyMissions.emit()"
                  class="col-span-1 sm:col-span-2 bg-[#17130f] border-2 border-[#8b6b43]/70 hover:border-[#d4af37] p-4 rounded-xl cursor-pointer transition-all shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 group">
                  <div class="flex items-start sm:items-center gap-3.5">
                    <div class="w-12 h-12 rounded-xl bg-[#120f0c] border border-[#d4af37] flex items-center justify-center text-[#d4af37] group-hover:scale-105 transition-transform shadow shrink-0">
                      <mat-icon class="text-2xl">military_tech</mat-icon>
                    </div>
                    <div>
                      <div class="flex flex-wrap items-center gap-2">
                        <span class="text-[10px] font-mono uppercase tracking-widest text-[#d4af37] font-bold">Ordres du Jour</span>
                        <span class="text-[10px] font-mono text-emerald-400 font-bold">
                          {{ dailyMissions.completedCount() }} / 3 Complétés
                        </span>
                        @if (dailyMissions.hasClaimableRewards()) {
                          <span class="px-2 py-0.5 bg-[#d4af37] text-black text-[9px] font-bold rounded-full animate-bounce">Or à Réclamer !</span>
                        }
                      </div>
                      <h3 class="font-cinzel text-sm font-bold text-[#e0dcc7] group-hover:text-[#d4af37]">
                        Missions Tactiques Quotidiens
                      </h3>
                      <div class="flex flex-wrap items-center gap-2 mt-1">
                        @for (m of dailyMissions.missions(); track m.id) {
                          <span
                            class="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border"
                            [class.bg-emerald-950/40_border-emerald-500/40_text-emerald-300]="m.isCompleted"
                            [class.bg-[#1a1612]_border-[#3a2f23]_text-[#c5a880]]="!m.isCompleted">
                            <mat-icon class="text-[11px]">{{ m.icon }}</mat-icon>
                            <span>{{ m.current }}/{{ m.target }}</span>
                            <span class="text-[#d4af37]">(+{{ m.rewardGold }} Or)</span>
                          </span>
                        }
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 self-end md:self-center shrink-0">
                    <span class="text-[10px] font-mono text-[#8b6b43] hidden lg:inline">{{ dailyMissions.timeRemaining() }}</span>
                    <div class="flex items-center gap-1.5 px-3 py-1.5 bg-[#120f0c] rounded-lg border border-[#8b6b43] text-xs font-cinzel text-[#d4af37] group-hover:bg-[#d4af37] group-hover:text-black transition-colors whitespace-nowrap">
                      <span>Voir les Ordres</span>
                      <mat-icon class="text-sm">arrow_forward</mat-icon>
                    </div>
                  </div>
                </div>

                <!-- FEATURED EPIC QUEST PROGRESS BAR CARD -->
                @if (questService.featuredActiveQuest(); as featuredQuest) {
                  @let featuredPct = questService.getQuestProgressPct(featuredQuest);
                  <div
                    tabindex="0"
                    role="button"
                    (click)="openEpicQuests.emit()"
                    (keydown.enter)="openEpicQuests.emit()"
                    class="col-span-1 sm:col-span-2 bg-[#17130f] border border-[#3a2f23] hover:border-[#d4af37] p-4 rounded-xl cursor-pointer transition-colors shadow-lg flex flex-col gap-3 group">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div class="flex items-center gap-3 min-w-0">
                        <div class="w-10 h-10 rounded-xl bg-[#120f0c] border border-[#3a2f23] flex items-center justify-center text-[#d4af37] shrink-0">
                          <mat-icon class="text-xl">{{ featuredQuest.icon }}</mat-icon>
                        </div>
                        <div class="min-w-0">
                          <div class="flex flex-wrap items-center gap-1.5 text-[11px] font-cinzel text-[#8b6b43]">
                            <span>Quête Épique</span>
                            <span aria-hidden="true">·</span>
                            <span>{{ featuredQuest.chapter }}</span>
                            <span aria-hidden="true">·</span>
                            <span class="font-mono font-bold text-[#d4af37] tabular-nums">+{{ featuredQuest.rewardGold }} Or</span>
                          </div>
                          <h3 class="font-cinzel text-sm font-bold text-[#e0dcc7] group-hover:text-[#d4af37] truncate">
                            {{ featuredQuest.title }}
                          </h3>
                        </div>
                      </div>

                      <div class="flex items-center gap-3 self-end sm:self-center shrink-0">
                        <span class="font-mono text-xs font-black tabular-nums" [class.text-emerald-400]="featuredQuest.isCompleted" [class.text-[#d4af37]]="!featuredQuest.isCompleted">
                          {{ featuredPct }}%
                        </span>
                        <div class="flex items-center gap-1.5 px-3 py-1.5 bg-[#120f0c] rounded-lg border border-[#3a2f23] text-xs font-cinzel text-[#d4af37] group-hover:bg-[#d4af37] group-hover:text-black transition-colors whitespace-nowrap">
                          <span>{{ questService.claimableCount() > 0 ? 'Réclamer Or' : 'Voir les Quêtes' }}</span>
                          <mat-icon class="text-sm">arrow_forward</mat-icon>
                        </div>
                      </div>
                    </div>

                    <div
                      class="w-full h-2 bg-[#0a0a0c] rounded-full border border-[#3a2f23] overflow-hidden"
                      role="progressbar"
                      [attr.aria-valuenow]="featuredPct"
                      aria-valuemin="0"
                      aria-valuemax="100"
                      [attr.aria-label]="'Progression de la quête ' + featuredQuest.title">
                      <div
                        class="h-full rounded-full transition-all duration-500 ease-out"
                        [class.bg-emerald-500]="featuredQuest.isCompleted"
                        [class.bg-[#d4af37]]="!featuredQuest.isCompleted"
                        [style.width.%]="featuredPct">
                      </div>
                    </div>
                  </div>
                }

                <!-- Card 1: Mode Histoire -->
                <div
                  tabindex="0"
                  role="button"
                  (click)="navigateToModes.emit()"
                  (keydown.enter)="navigateToModes.emit()"
                  class="bg-[#120f0c] border border-[#3a2f23] hover:border-[#d4af37] p-4 rounded-xl cursor-pointer transition-all shadow-lg flex flex-col justify-between group">
                  <div>
                    <div class="flex items-center justify-between mb-2">
                      <span class="text-[10px] font-mono uppercase tracking-widest text-[#d4af37] flex items-center gap-1">
                        <mat-icon class="text-xs">auto_stories</mat-icon>
                        Mode Histoire
                      </span>
                      <span class="text-xs font-mono text-[#d4af37] font-bold">{{ gameState.totalStoryStars() }}★</span>
                    </div>
                    <h3 class="font-cinzel text-sm font-bold text-[#e0dcc7] group-hover:text-[#c5a880] mb-1">
                      Campagne RPG Épique
                    </h3>
                    <p class="text-[11px] text-[#6b5a45] line-clamp-2">
                      4 Actes narratifs, boss légendaires et récompenses exclusives de premier succès.
                    </p>
                  </div>
                  <div class="mt-3 flex items-center justify-between pt-2 border-t border-[#3a2f23] text-xs font-cinzel text-[#c5a880]">
                    <span>{{ gameState.storyProgressPercentage() }}% Accompli</span>
                    <mat-icon class="text-sm group-hover:translate-x-1 transition-transform">arrow_forward</mat-icon>
                  </div>
                </div>

                <!-- Card 2: Mode Duel Classé -->
                <div
                  tabindex="0"
                  role="button"
                  (click)="startRankedDuel()"
                  (keydown.enter)="startRankedDuel()"
                  class="bg-[#120f0c] border border-[#8b2b2b] hover:border-[#ff4d4d] p-4 rounded-xl cursor-pointer transition-all shadow-lg flex flex-col justify-between group">
                  <div>
                    <div class="flex items-center justify-between mb-2">
                      <span class="text-[10px] font-mono uppercase tracking-widest text-[#ff9999] flex items-center gap-1">
                        <mat-icon class="text-xs">workspace_premium</mat-icon>
                        Arène Classée
                      </span>
                      <span class="text-xs font-mono text-[#c5a880] font-bold">{{ gameState.elo() }} Elo</span>
                    </div>
                    <h3 class="font-cinzel text-sm font-bold text-[#e0dcc7] group-hover:text-[#c5a880] mb-1">
                      Duel Compétitif
                    </h3>
                    <p class="text-[11px] text-[#6b5a45] line-clamp-2">
                      Grimpez les ligues d'Aetheria et combattez pour le classement saisonnier.
                    </p>
                  </div>
                  <div class="mt-3 flex items-center justify-between pt-2 border-t border-[#3a2f23] text-xs font-cinzel text-[#ff4d4d]">
                    <span>Rechercher Match</span>
                    <mat-icon class="text-sm group-hover:translate-x-1 transition-transform">arrow_forward</mat-icon>
                  </div>
                </div>

                <!-- Card 3: Mode Duel Rapide -->
                <div
                  tabindex="0"
                  role="button"
                  (click)="startQuickDuel()"
                  (keydown.enter)="startQuickDuel()"
                  class="bg-[#120f0c] border border-[#3a2f23] hover:border-[#3b82f6] p-4 rounded-xl cursor-pointer transition-all shadow-lg flex flex-col justify-between group">
                  <div>
                    <div class="flex items-center justify-between mb-2">
                      <span class="text-[10px] font-mono uppercase tracking-widest text-[#3b82f6] flex items-center gap-1">
                        <mat-icon class="text-xs">smart_toy</mat-icon>
                        Duel Rapide (IA)
                      </span>
                      <span class="text-[10px] font-mono text-emerald-400 font-bold">+150 Or</span>
                    </div>
                    <h3 class="font-cinzel text-sm font-bold text-[#e0dcc7] group-hover:text-[#c5a880] mb-1">
                      Entraînement Sans Risque
                    </h3>
                    <p class="text-[11px] text-[#6b5a45] line-clamp-2">
                      Testez immédiatement vos synergies de cartes contre l'IA d'entraînement.
                    </p>
                  </div>
                  <div class="mt-3 flex items-center justify-between pt-2 border-t border-[#3a2f23] text-xs font-cinzel text-[#3b82f6]">
                    <span>Duel Immédiat</span>
                    <mat-icon class="text-sm group-hover:translate-x-1 transition-transform">arrow_forward</mat-icon>
                  </div>
                </div>

                <!-- Card 4: Duel Personnalisé -->
                <div
                  tabindex="0"
                  role="button"
                  (click)="navigateToModes.emit()"
                  (keydown.enter)="navigateToModes.emit()"
                  class="bg-[#120f0c] border border-[#3a2f23] hover:border-[#a855f7] p-4 rounded-xl cursor-pointer transition-all shadow-lg flex flex-col justify-between group">
                  <div>
                    <div class="flex items-center justify-between mb-2">
                      <span class="text-[10px] font-mono uppercase tracking-widest text-[#a855f7] flex items-center gap-1">
                        <mat-icon class="text-xs">tune</mat-icon>
                        Duel Personnalisé
                      </span>
                      <span class="text-[10px] font-mono text-[#a855f7] font-bold">Sandbox</span>
                    </div>
                    <h3 class="font-cinzel text-sm font-bold text-[#e0dcc7] group-hover:text-[#c5a880] mb-1">
                      Règles & Bot Sur-Mesure
                    </h3>
                    <p class="text-[11px] text-[#6b5a45] line-clamp-2">
                      Choisissez la classe, les PV, la météo et le temps par tour pour vos parties.
                    </p>
                  </div>
                  <div class="mt-3 flex items-center justify-between pt-2 border-t border-[#3a2f23] text-xs font-cinzel text-[#a855f7]">
                    <span>Configurer</span>
                    <mat-icon class="text-sm group-hover:translate-x-1 transition-transform">arrow_forward</mat-icon>
                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>

        <!-- PRE-COMBAT ELIXIR PREPARATION PANEL -->
        <section class="bg-[#120f0c] border border-[#3a2f23] rounded-2xl p-5 md:p-6 shadow-xl space-y-5">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#3a2f23]/80 pb-4">
            <div class="space-y-1">
              <div class="flex flex-wrap items-center gap-2 text-xs text-[#8b6b43] font-cinzel font-semibold">
                <span>Préparation Avant-Combat</span>
                <span aria-hidden="true">·</span>
                <span class="font-mono tabular-nums text-[#c5a880]">{{ gameState.availableElixirs().length }} type(s) en réserve</span>
                <span aria-hidden="true">·</span>
                <span class="font-mono tabular-nums text-emerald-400">{{ gameState.activeElixirsCount() }} actif(s)</span>
              </div>
              <h2 class="font-cinzel text-lg md:text-xl font-bold text-[#e0dcc7]">
                Élixirs &amp; Bonus Temporaires d'Arène
              </h2>
              <p class="text-xs text-[#c5a880]/80">
                Buvez un élixir avant d’engager un duel pour accorder des bonus temporaires à votre Héros directement visibles dans l’interface de combat.
              </p>
            </div>

            <button
              (click)="openAlchemy.emit()"
              class="medieval-btn px-4 py-2 bg-[#1a1612] hover:bg-[#251f18] text-[#d4af37] rounded-xl border border-[#8b6b43]/70 font-cinzel text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors">
              <mat-icon class="text-base">science</mat-icon>
              <span>Atelier d'Alchimie</span>
            </button>
          </div>

          <!-- Active Pre-Combat Stat Bonuses Summary -->
          @let activeBadges = gameState.elixirStatBadges();
          @if (activeBadges.length > 0) {
            <div class="bg-[#17130f] border border-emerald-500/40 rounded-xl p-4 space-y-3">
              <div class="flex items-center justify-between text-xs">
                <span class="font-cinzel font-bold text-emerald-300">
                  Bonus Temporaires Prêts pour Votre Prochain Duel
                </span>
                <span class="font-mono text-[#c5a880] tabular-nums">
                  {{ activeBadges.length }} effet(s) actif(s)
                </span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                @for (badge of activeBadges; track badge.id) {
                  <div class="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#120f0c] border border-[#3a2f23]">
                    <div class="flex items-center gap-2.5 min-w-0">
                      <div class="w-8 h-8 rounded-lg bg-[#1a1612] border border-[#3a2f23] flex items-center justify-center shrink-0">
                        <mat-icon class="text-base" [style.color]="badge.color">{{ badge.icon }}</mat-icon>
                      </div>
                      <div class="min-w-0">
                        <div class="font-cinzel text-xs font-bold text-[#e0dcc7] truncate">{{ badge.label }}</div>
                        <div class="font-mono text-[11px] font-bold text-emerald-400 tabular-nums">
                          {{ badge.value }} · {{ badge.remainingMatches }} combat(s)
                        </div>
                      </div>
                    </div>
                    <button
                      (click)="gameState.dismissActiveElixir(badge.id)"
                      class="p-1.5 rounded-lg text-[#8b6b43] hover:text-[#ff4d4d] hover:bg-[#1a1612] transition-colors shrink-0"
                      title="Retirer cet effet temporaire">
                      <mat-icon class="text-sm">close</mat-icon>
                    </button>
                  </div>
                }
              </div>
            </div>
          } @else {
            <div class="bg-[#17130f] border border-[#3a2f23] rounded-xl px-4 py-3 text-xs text-[#8b6b43] flex items-center justify-between gap-2">
              <span>Aucun élixir actif pour le moment. Consommez une potion ci-dessous avant d’entrer dans l’Arène.</span>
            </div>
          }

          <!-- Available Elixirs Stock Grid -->
          @let elixirsInStock = gameState.availableElixirs();
          @if (elixirsInStock.length === 0) {
            <div class="p-6 text-center bg-[#17130f] border border-[#3a2f23] rounded-xl space-y-2">
              <p class="text-sm font-cinzel text-[#c5a880]">Votre besace d'élixirs est vide.</p>
              <p class="text-xs text-[#8b6b43]">Rendez-vous à l’Atelier d’Alchimie ou à la Boutique pour préparer de nouvelles potions.</p>
            </div>
          } @else {
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              @for (potion of elixirsInStock; track potion.id) {
                @let isActive = gameState.isElixirActive(potion.id);
                @let remMatches = gameState.getElixirRemainingMatches(potion.id);
                <div
                  class="bg-[#17130f] border rounded-xl p-3.5 flex flex-col justify-between gap-3 transition-colors"
                  [class.border-emerald-500/60]="isActive"
                  [class.border-[#3a2f23]]="!isActive">
                  <div class="flex items-start gap-3">
                    <div class="w-11 h-11 rounded-xl bg-[#120f0c] border border-[#3a2f23] overflow-hidden flex items-center justify-center shrink-0">
                      @if (potion.imageUrl) {
                        <img
                          [src]="potion.imageUrl"
                          [alt]="potion.name"
                          class="w-full h-full object-cover"
                          referrerpolicy="no-referrer" />
                      } @else {
                        <mat-icon class="text-xl" [style.color]="potion.color">{{ potion.icon }}</mat-icon>
                      }
                    </div>
                    <div class="min-w-0 space-y-0.5">
                      <div class="flex items-center gap-1.5 text-[11px] font-mono tabular-nums text-[#8b6b43]">
                        <span class="text-[#d4af37] font-bold">x{{ potion.count }}</span>
                        <span aria-hidden="true">·</span>
                        <span>{{ potion.durationMatches }} combats</span>
                        @if (isActive) {
                          <span aria-hidden="true">·</span>
                          <span class="text-emerald-400 font-bold">Actif ({{ remMatches }}c)</span>
                        }
                      </div>
                      <h3 class="font-cinzel text-xs font-bold text-[#e0dcc7] leading-snug line-clamp-1">
                        {{ potion.name }}
                      </h3>
                      <div class="font-mono text-[11px] font-bold text-[#4dff88] tabular-nums">
                        {{ gameState.getElixirShortBonusLabel(potion.type) }}
                      </div>
                    </div>
                  </div>

                  <button
                    (click)="consumePreCombatElixir(potion.id)"
                    class="w-full py-2 px-3 rounded-lg border font-cinzel text-xs font-bold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                    [class.bg-emerald-950/60]="isActive"
                    [class.hover:bg-emerald-900/70]="isActive"
                    [class.border-emerald-500/60]="isActive"
                    [class.text-emerald-300]="isActive"
                    [class.bg-[#1a1612]]="!isActive"
                    [class.hover:bg-[#251f18]]="!isActive"
                    [class.border-[#8b6b43]/70]="!isActive"
                    [class.text-[#d4af37]]="!isActive">
                    <mat-icon class="text-sm">local_drink</mat-icon>
                    <span>{{ isActive ? 'Prolonger (+' + potion.durationMatches + 'c)' : 'Consommer' }}</span>
                  </button>
                </div>
              }
            </div>
          }
        </section>

      </div>
    }
  `,
})
export class ArenaView {
  readonly battleEngine = inject(BattleEngineService);
  readonly gameState = inject(GameStateService);
  readonly sound = inject(SoundService);
  readonly tutorial = inject(TutorialService);
  readonly dailyMissions = inject(DailyMissionsService);
  readonly questService = inject(QuestService);
  private readonly destroyRef = inject(DestroyRef);

  readonly navigateToModes = output<void>();
  readonly openDailyMissions = output<void>();
  readonly openEpicQuests = output<void>();
  readonly openAlchemy = output<void>();

  readonly hoveredTarget = signal<HoverTargetState | null>(null);
  readonly showTacticalHint = signal<boolean>(true);
  readonly arenaVictoryGainActive = signal<boolean>(false);

  private lastSeenVictoryId: number | null = this.gameState.recentVictoryGain()?.id ?? null;
  private victoryPulseTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      const gain = this.gameState.recentVictoryGain();
      if (gain && gain.id !== this.lastSeenVictoryId) {
        this.lastSeenVictoryId = gain.id;
        if (this.victoryPulseTimer) {
          clearTimeout(this.victoryPulseTimer);
        }
        this.arenaVictoryGainActive.set(true);
        this.victoryPulseTimer = setTimeout(() => {
          this.arenaVictoryGainActive.set(false);
          this.victoryPulseTimer = null;
        }, 2800);
      }
    });

    this.destroyRef.onDestroy(() => {
      if (this.victoryPulseTimer) {
        clearTimeout(this.victoryPulseTimer);
        this.victoryPulseTimer = null;
      }
    });
  }

  onEscapeKey() {
    if (this.battleEngine.targetingMode() !== null) {
      this.battleEngine.cancelSelection();
    }
  }

  toggleHintBar() {
    this.showTacticalHint.update(v => !v);
    this.sound.playClick();
  }

  consumePreCombatElixir(potionId: string) {
    this.gameState.consumeElixir(potionId);
  }

  setHoveredTarget(
    type: 'opponent-hero' | 'opponent-minion' | 'player-hero' | 'player-minion',
    minion?: BattleMinion
  ) {
    this.hoveredTarget.set({ type, minion });
  }

  clearHoveredTarget() {
    this.hoveredTarget.set(null);
  }

  isHovering(
    type: 'opponent-hero' | 'opponent-minion' | 'player-hero' | 'player-minion',
    minionId?: string
  ): boolean {
    const h = this.hoveredTarget();
    if (!h || h.type !== type) return false;
    if (minionId) return h.minion?.instanceId === minionId;
    return true;
  }

  getFloatLeft(target: string, idx: number): string {
    const offset = ((idx % 3) - 1) * 8;
    return `${50 + offset}%`;
  }

  getFloatTop(target: string, idx: number): string {
    const offset = (idx % 2) * 3;
    if (target === 'opponent-hero') return `${16 + offset}%`;
    if (target === 'player-hero') return `${70 + offset}%`;
    return `${42 + offset}%`;
  }

  getPetRarityColor(rarity: string): string {
    switch (rarity) {
      case 'mythic':
        return '#ef4444';
      case 'legendary':
        return '#f59e0b';
      case 'epic':
        return '#a855f7';
      case 'rare':
        return '#3b82f6';
      default:
        return '#9ca3af';
    }
  }

  getPetRarityTextColor(rarity: string): string {
    switch (rarity) {
      case 'mythic':
        return '#f87171';
      case 'legendary':
        return '#fbbf24';
      case 'epic':
        return '#c084fc';
      case 'rare':
        return '#60a5fa';
      default:
        return '#9ca3af';
    }
  }

  startQuickDuel() {
    this.battleEngine.startMatchmaking('ai_training');
  }

  startRankedDuel() {
    this.battleEngine.startMatchmaking('ranked');
  }

  handleHandCardClick(card: Card) {
    if (card.type === 'creature') {
      this.battleEngine.playCreatureCard(card);
    } else {
      this.battleEngine.selectHandCard(card);
    }
  }

  handleTargetClick(targetType: 'opponent-hero' | 'player-hero') {
    const selectedSpell = this.battleEngine.selectedHandCard();
    const attackingMinion = this.battleEngine.attackingMinion();

    if (selectedSpell && selectedSpell.type === 'spell') {
      this.battleEngine.castSpellOnTarget(targetType);
    } else if (attackingMinion && targetType === 'opponent-hero') {
      this.battleEngine.attackTarget('opponent-hero');
    }
  }

  handleMinionClick(minion: BattleMinion, side: 'player' | 'opponent') {
    const selectedSpell = this.battleEngine.selectedHandCard();
    const attackingMinion = this.battleEngine.attackingMinion();

    if (selectedSpell && selectedSpell.type === 'spell') {
      this.battleEngine.castSpellOnTarget(side === 'opponent' ? 'opponent-minion' : 'player-minion', minion);
    } else if (side === 'player') {
      this.battleEngine.selectAttacker(minion);
    } else if (side === 'opponent' && attackingMinion) {
      this.battleEngine.attackTarget('opponent-minion', minion);
    }
  }
}
