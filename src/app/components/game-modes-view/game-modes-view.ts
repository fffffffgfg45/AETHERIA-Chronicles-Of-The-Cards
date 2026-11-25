import { ChangeDetectionStrategy, Component, inject, signal, computed, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { GameStateService } from '../../services/game-state';
import { BattleEngineService } from '../../services/battle-engine';
import { SoundService } from '../../services/sound';
import {
  StoryChapter,
  StoryMission,
  StoryDialogue,
  HeroClass,
  CustomDuelConfig
} from '../../models/game.model';

@Component({
  selector: 'app-game-modes-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-6 space-y-6">
      
      <!-- HEADER & MODE SELECTOR TABS -->
      <div class="bg-[#120f0c] border border-[#3a2f23] rounded-2xl p-4 sm:p-6 shadow-2xl relative overflow-hidden">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#3a2f23] pb-5">
          <div>
            <div class="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#8b6b43] mb-1">
              <mat-icon class="text-sm text-[#d4af37]">sports_esports</mat-icon>
              <span>Système de Modes de Jeu</span>
            </div>
            <h1 class="font-cinzel text-2xl sm:text-3xl font-black text-[#c5a880] tracking-wide">
              Choisissez Votre Voie
            </h1>
          </div>

          <!-- Main Mode Switcher Pills -->
          <div class="flex items-center bg-[#1a1612] p-1 rounded-xl border border-[#3a2f23] gap-1 self-start md:self-auto">
            <button
              (click)="selectPrimaryMode('story')"
              class="medieval-btn px-4 sm:px-6 py-2 rounded-lg font-cinzel text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap"
              [class.bg-[#8b2b2b]_text-white_border-[#ff4d4d]_shadow-[0_0_15px_rgba(139,43,43,0.4)]]="selectedPrimaryMode() === 'story'"
              [class.text-[#8b6b43]_border-transparent_hover:text-[#c5a880]]="selectedPrimaryMode() !== 'story'">
              <mat-icon class="text-base">auto_stories</mat-icon>
              <span>Mode Histoire</span>
            </button>

            <button
              (click)="selectPrimaryMode('duel')"
              class="medieval-btn px-4 sm:px-6 py-2 rounded-lg font-cinzel text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap"
              [class.bg-[#8b2b2b]_text-white_border-[#ff4d4d]_shadow-[0_0_15px_rgba(139,43,43,0.4)]]="selectedPrimaryMode() === 'duel'"
              [class.text-[#8b6b43]_border-transparent_hover:text-[#c5a880]]="selectedPrimaryMode() !== 'duel'">
              <mat-icon class="text-base">swords</mat-icon>
              <span>Mode Duel</span>
            </button>
          </div>
        </div>

        <!-- Mode Description & Stats Ribbon -->
        <div class="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          @if (selectedPrimaryMode() === 'story') {
            <p class="text-[#a89984] max-w-2xl leading-relaxed">
              Explorez la saga épique d'Aetheria à travers 4 actes narratifs, affrontez des boss légendaires dotés de pouvoirs uniques et collectez des étoiles pour débloquer des reliques ancestrales.
            </p>
            <div class="flex items-center gap-4 bg-[#1a1612] px-4 py-2 rounded-xl border border-[#3a2f23] shrink-0">
              <div class="flex items-center gap-1.5 text-[#d4af37] font-bold">
                <mat-icon class="text-base">star</mat-icon>
                <span>{{ gameState.totalStoryStars() }} / {{ gameState.maxPossibleStoryStars() }}</span>
              </div>
              <div class="h-4 w-[1px] bg-[#3a2f23]"></div>
              <div class="flex items-center gap-1.5 text-[#e0dcc7] font-mono">
                <span class="text-[#8b6b43]">Progression:</span>
                <span class="font-bold text-[#c5a880]">{{ gameState.storyProgressPercentage() }}%</span>
              </div>
            </div>
          } @else {
            <p class="text-[#a89984] max-w-2xl leading-relaxed">
              Défiez les champions d'Aetheria en Duel Rapide, grimpez dans l'Arène Classée pour la gloire du classement Elo, ou configurez un Duel Personnalisé sur-mesure avec vos propres règles.
            </p>
            <div class="flex items-center gap-4 bg-[#1a1612] px-4 py-2 rounded-xl border border-[#3a2f23] shrink-0">
              <div class="flex items-center gap-1.5 text-[#c5a880] font-bold">
                <mat-icon class="text-base text-[#d4af37]">military_tech</mat-icon>
                <span>{{ gameState.elo() }} Elo</span>
              </div>
              <div class="h-4 w-[1px] bg-[#3a2f23]"></div>
              <div class="flex items-center gap-1.5 text-[#e0dcc7] font-mono">
                <span class="text-[#8b6b43]">Victoires:</span>
                <span class="font-bold text-emerald-400">{{ gameState.playerStats().wins }}</span>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- MODE 1: HISTOIRE (CAMPAGNE ÉPIQUE RPG) -->
      <!-- ========================================================================= -->
      @if (selectedPrimaryMode() === 'story') {
        <div class="space-y-6">
          
          <!-- Chapters Navigation Bar -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            @for (chap of gameState.storyChapters(); track chap.id) {
              <button
                (click)="selectChapter(chap.id)"
                [disabled]="!chap.isUnlocked"
                class="p-4 rounded-xl border text-left transition-all relative overflow-hidden group"
                [class.bg-[#1a1612]]="activeChapterId() === chap.id"
                [class.border-[#d4af37]]="activeChapterId() === chap.id"
                [class.shadow-[0_0_15px_rgba(212,175,55,0.2)]]="activeChapterId() === chap.id"
                [class.bg-[#120f0c]]="activeChapterId() !== chap.id && chap.isUnlocked"
                [class.border-[#3a2f23]]="activeChapterId() !== chap.id && chap.isUnlocked"
                [class.opacity-50]="!chap.isUnlocked"
                [class.cursor-not-allowed]="!chap.isUnlocked">
                
                <div class="flex items-center justify-between mb-2">
                  <span class="text-[10px] font-mono uppercase tracking-widest text-[#8b6b43]">
                    Acte {{ chap.actNumber }}
                  </span>
                  @if (!chap.isUnlocked) {
                    <mat-icon class="text-sm text-[#6b5a45]">lock</mat-icon>
                  } @else if (isChapterCompleted(chap)) {
                    <mat-icon class="text-sm text-emerald-400">check_circle</mat-icon>
                  } @else {
                    <mat-icon class="text-sm text-[#d4af37]">{{ chap.bannerIcon }}</mat-icon>
                  }
                </div>

                <h3 class="font-cinzel text-xs sm:text-sm font-bold text-[#e0dcc7] group-hover:text-[#c5a880] truncate">
                  {{ chap.title }}
                </h3>
                <p class="text-[11px] text-[#6b5a45] truncate mt-0.5">
                  {{ chap.subtitle }}
                </p>

                <!-- Chapter Stars Badge -->
                <div class="mt-3 flex items-center justify-between text-[10px] text-[#8b6b43] font-mono border-t border-[#3a2f23]/60 pt-2">
                  <span>{{ getChapterCompletedCount(chap) }}/{{ chap.missions.length }} quêtes</span>
                  <div class="flex items-center gap-0.5 text-[#d4af37]">
                    <mat-icon class="text-xs">star</mat-icon>
                    <span>{{ getChapterStarsCount(chap) }}</span>
                  </div>
                </div>
              </button>
            }
          </div>

          <!-- Active Chapter Content & Missions List -->
          @if (currentChapter(); as chap) {
            <div class="bg-[#120f0c] border border-[#3a2f23] rounded-2xl p-5 sm:p-7 shadow-xl space-y-6">
              
              <!-- Chapter Header Banner -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#3a2f23] pb-4">
                <div>
                  <div class="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#d4af37] mb-1">
                    <mat-icon class="text-sm">{{ chap.bannerIcon }}</mat-icon>
                    <span>Acte {{ chap.actNumber }} : {{ chap.subtitle }}</span>
                  </div>
                  <h2 class="font-cinzel text-xl sm:text-2xl font-bold text-[#c5a880]">
                    {{ chap.title }}
                  </h2>
                  <p class="text-xs text-[#a89984] mt-1 max-w-2xl leading-relaxed">
                    {{ chap.description }}
                  </p>
                </div>

                <div class="flex items-center gap-3 bg-[#1a1612] px-4 py-2.5 rounded-xl border border-[#3a2f23] self-start sm:self-auto">
                  <div class="text-right">
                    <div class="text-[10px] text-[#6b5a45] uppercase tracking-wider font-mono">Progression Acte</div>
                    <div class="text-xs font-bold text-[#e0dcc7] font-cinzel">{{ getChapterCompletedCount(chap) }} / {{ chap.missions.length }} Terminées</div>
                  </div>
                  <div class="w-10 h-10 rounded-full border-2 border-[#d4af37] flex items-center justify-center bg-[#120f0c] text-[#d4af37] font-bold text-xs font-mono">
                    {{ getChapterStarsCount(chap) }}★
                  </div>
                </div>
              </div>

              <!-- Missions Stage Roadmap / Grid -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                @for (mission of chap.missions; track mission.id) {
                  <div
                    class="bg-[#1a1612] border rounded-xl p-4 sm:p-5 flex flex-col justify-between transition-all relative overflow-hidden"
                    [class.border-[#d4af37]]="mission.isUnlocked && !mission.isCompleted"
                    [class.shadow-[0_0_15px_rgba(212,175,55,0.15)]]="mission.isUnlocked && !mission.isCompleted"
                    [class.border-[#3a2f23]]="!mission.isUnlocked || mission.isCompleted"
                    [class.opacity-60]="!mission.isUnlocked">
                    
                    <!-- Top Mission Info -->
                    <div>
                      <div class="flex items-start justify-between gap-3 mb-2">
                        <div class="flex items-center gap-2">
                          <span class="w-6 h-6 rounded-full bg-[#120f0c] border border-[#3a2f23] text-[11px] font-mono font-bold flex items-center justify-center text-[#c5a880]">
                            {{ mission.order }}
                          </span>
                          <div>
                            <span class="text-[10px] uppercase tracking-widest text-[#8b6b43] font-mono block">
                              {{ mission.location }}
                            </span>
                            <h4 class="font-cinzel text-sm sm:text-base font-bold text-[#e0dcc7]">
                              {{ mission.title }}
                            </h4>
                          </div>
                        </div>

                        <!-- Stars Earned -->
                        <div class="flex items-center gap-0.5">
                          @for (star of [1, 2, 3]; track star) {
                            <mat-icon
                              class="text-base"
                              [class.text-[#d4af37]]="star <= mission.starsEarned"
                              [class.text-[#3a2f23]]="star > mission.starsEarned">
                              star
                            </mat-icon>
                          }
                        </div>
                      </div>

                      <p class="text-xs text-[#a89984] mb-3 italic">
                        "{{ mission.subtitle }}"
                      </p>

                      <!-- Enemy Profile Card -->
                      <div class="bg-[#120f0c] border border-[#3a2f23] rounded-lg p-2.5 flex items-center justify-between mb-3">
                        <div class="flex items-center gap-2.5">
                          <div class="w-9 h-9 rounded-lg bg-[#1a1612] border border-[#3a2f23] flex items-center justify-center text-[#c5a880]">
                            <mat-icon class="text-xl">{{ mission.enemyAvatar }}</mat-icon>
                          </div>
                          <div>
                            <div class="text-xs font-bold text-[#e0dcc7] font-cinzel">{{ mission.enemyName }}</div>
                            <div class="text-[10px] text-[#6b5a45] truncate max-w-[170px] sm:max-w-[220px]">{{ mission.enemyTitle }}</div>
                          </div>
                        </div>

                        <div class="flex items-center gap-2 text-xs font-mono">
                          <div class="flex items-center gap-1 text-[#ff4d4d]" title="Points de Vie">
                            <mat-icon class="text-sm">favorite</mat-icon>
                            <span>{{ mission.enemyHp }}</span>
                          </div>
                          @if (mission.enemyArmor > 0) {
                            <div class="flex items-center gap-1 text-[#4d94ff]" title="Armure">
                              <mat-icon class="text-sm">shield</mat-icon>
                              <span>{{ mission.enemyArmor }}</span>
                            </div>
                          }
                        </div>
                      </div>

                      <!-- Boss Power if present -->
                      @if (mission.bossPowerName) {
                        <div class="bg-[#241313] border border-[#5c2424] rounded-lg p-2 text-xs mb-3 flex items-start gap-2">
                          <mat-icon class="text-base text-[#ff4d4d] shrink-0 mt-0.5">whatshot</mat-icon>
                          <div>
                            <span class="font-bold text-[#ff9999] font-cinzel">{{ mission.bossPowerName }} : </span>
                            <span class="text-[#e0dcc7] text-[11px]">{{ mission.bossPowerDesc }}</span>
                          </div>
                        </div>
                      }

                      <!-- Objectives checklist -->
                      <div class="space-y-1 mb-4">
                        <span class="text-[10px] font-mono text-[#6b5a45] uppercase tracking-wider block">Objectifs d'étoiles :</span>
                        @for (obj of mission.objectives; track obj.id) {
                          <div class="flex items-center gap-1.5 text-xs text-[#a89984]">
                            <mat-icon class="text-xs" [class.text-emerald-400]="obj.isCompleted" [class.text-[#6b5a45]]="!obj.isCompleted">
                              {{ obj.isCompleted ? 'check_circle' : 'radio_button_unchecked' }}
                            </mat-icon>
                            <span [class.line-through]="obj.isCompleted" [class.text-[#e0dcc7]]="obj.isCompleted">{{ obj.text }}</span>
                          </div>
                        }
                      </div>

                      <!-- Rewards Preview -->
                      <div class="bg-[#120f0c]/60 border border-[#3a2f23]/60 rounded-lg p-2 flex items-center justify-between text-xs font-mono mb-4">
                        <span class="text-[10px] text-[#6b5a45] uppercase tracking-wider font-cinzel">Récompenses :</span>
                        <div class="flex items-center gap-3">
                          <span class="text-[#d4af37] font-bold">✦ {{ mission.rewards.gold }}</span>
                          <span class="text-[#4d94ff] font-bold">⬥ {{ mission.rewards.gems }}</span>
                          <span class="text-[#a855f7] font-bold">◆ {{ mission.rewards.shards }}</span>
                          @if (mission.rewards.cardRewardName) {
                            <span class="text-emerald-400 font-bold" title="Carte exclusive">🂠 {{ mission.rewards.cardRewardName }}</span>
                          }
                        </div>
                      </div>
                    </div>

                    <!-- Bottom Action Controls -->
                    <div class="flex items-center justify-between gap-2 border-t border-[#3a2f23] pt-3">
                      <button
                        (click)="openDialogueIntro(mission)"
                        class="medieval-btn px-3 py-1.5 bg-[#120f0c] hover:bg-[#201a14] text-[#c5a880] border border-[#3a2f23] rounded-lg text-xs font-cinzel flex items-center gap-1.5">
                        <mat-icon class="text-sm">chat</mat-icon>
                        <span>Histoire</span>
                      </button>

                      <div class="flex items-center gap-2">
                        @if (mission.isCompleted && !mission.rewards.firstClearClaimed) {
                          <button
                            (click)="claimFirstClearReward(mission)"
                            class="px-3 py-1.5 bg-gradient-to-r from-[#d4af37] to-[#f59e0b] hover:brightness-110 text-black font-bold rounded-lg text-xs font-cinzel flex items-center gap-1 shadow-lg animate-bounce">
                            <mat-icon class="text-sm">redeem</mat-icon>
                            <span>Réclamer</span>
                          </button>
                        }

                        @if (mission.isUnlocked) {
                          <button
                            (click)="launchStoryMissionBattle(mission)"
                            class="crimson-btn px-4 py-1.5 rounded-lg text-xs font-bold font-cinzel flex items-center gap-1.5">
                            <mat-icon class="text-sm">swords</mat-icon>
                            <span>{{ mission.isCompleted ? 'Rejouer' : 'Combattre' }}</span>
                          </button>
                        } @else {
                          <div class="px-3 py-1.5 bg-[#120f0c] text-[#6b5a45] rounded-lg text-xs font-cinzel flex items-center gap-1">
                            <mat-icon class="text-sm">lock</mat-icon>
                            <span>Verrouillé</span>
                          </div>
                        }
                      </div>
                    </div>

                  </div>
                }
              </div>

            </div>
          }
        </div>
      }

      <!-- ========================================================================= -->
      <!-- MODE 2: DUEL (ARÈNES, PVP & DUELS PERSONNALISÉS) -->
      <!-- ========================================================================= -->
      @if (selectedPrimaryMode() === 'duel') {
        <div class="space-y-6">

          <!-- Duel Sub-modes Cards Grid -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
            
            <!-- 1. DUEL RAPIDE (IA ENTRAÎNEMENT) -->
            <div class="bg-[#120f0c] border border-[#3a2f23] hover:border-[#c5a880]/50 transition-all rounded-2xl p-6 flex flex-col justify-between shadow-xl relative overflow-hidden group">
              <div class="absolute -right-8 -top-8 w-32 h-32 bg-[#3b82f6]/5 rounded-full blur-2xl pointer-events-none"></div>
              <div>
                <div class="w-12 h-12 rounded-xl bg-[#1a1612] border border-[#3a2f23] text-[#3b82f6] flex items-center justify-center mb-4">
                  <mat-icon class="text-2xl">smart_toy</mat-icon>
                </div>
                <div class="text-[10px] font-mono text-[#8b6b43] uppercase tracking-widest mb-1">Entraînement & Casual</div>
                <h3 class="font-cinzel text-xl font-bold text-[#e0dcc7] group-hover:text-[#c5a880] transition-colors mb-2">
                  Duel Rapide (IA)
                </h3>
                <p class="text-xs text-[#a89984] leading-relaxed mb-4">
                  Affrontez instantanément un gardien d'Aetheria généré automatiquement. Idéal pour tester vos synergies de deck sans enjeu sur votre cote Elo.
                </p>

                <div class="bg-[#1a1612] border border-[#3a2f23] rounded-xl p-3 space-y-1.5 text-xs font-mono mb-6">
                  <div class="flex justify-between text-[#a89984]">
                    <span>Gain par victoire :</span>
                    <span class="text-[#d4af37] font-bold">+150 Or / +100 XP</span>
                  </div>
                  <div class="flex justify-between text-[#a89984]">
                    <span>Temps moyen :</span>
                    <span class="text-[#e0dcc7]">3 à 5 minutes</span>
                  </div>
                  <div class="flex justify-between text-[#a89984]">
                    <span>Impact Elo :</span>
                    <span class="text-emerald-400 font-bold">Aucun risque (0 pts)</span>
                  </div>
                </div>
              </div>

              <button
                (click)="startQuickDuel()"
                class="medieval-btn w-full py-3 bg-[#1a1612] hover:bg-[#251f18] text-[#c5a880] hover:text-[#e0dcc7] border border-[#3a2f23] hover:border-[#c5a880] rounded-xl font-cinzel text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md">
                <mat-icon class="text-base">play_arrow</mat-icon>
                <span>Lancer Duel Rapide</span>
              </button>
            </div>

            <!-- 2. ARÈNE CLASSÉE (COMPÉTITION ELO) -->
            <div class="bg-[#120f0c] border border-[#8b2b2b] hover:border-[#ff4d4d] transition-all rounded-2xl p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden group">
              <div class="absolute -right-8 -top-8 w-32 h-32 bg-[#8b2b2b]/15 rounded-full blur-2xl pointer-events-none"></div>
              <div>
                <div class="w-12 h-12 rounded-xl bg-[#241313] border border-[#5c2424] text-[#ff4d4d] flex items-center justify-center mb-4">
                  <mat-icon class="text-2xl">workspace_premium</mat-icon>
                </div>
                <div class="text-[10px] font-mono text-[#ff9999] uppercase tracking-widest mb-1">Compétitif Classé</div>
                <h3 class="font-cinzel text-xl font-bold text-[#c5a880] mb-2">
                  Arène Classée (Elo)
                </h3>
                <p class="text-xs text-[#a89984] leading-relaxed mb-4">
                  Mesurez votre maîtrise stratégique contre les meilleurs champions d'Aetheria. Progressez dans les ligues et remportez les coffres de saison.
                </p>

                <div class="bg-[#1a1612] border border-[#3a2f23] rounded-xl p-3 space-y-1.5 text-xs font-mono mb-6">
                  <div class="flex justify-between text-[#a89984]">
                    <span>Votre Rang :</span>
                    <span class="text-[#d4af37] font-bold font-cinzel">{{ gameState.tierName() }} ({{ gameState.elo() }} pts)</span>
                  </div>
                  <div class="flex justify-between text-[#a89984]">
                    <span>Victoires consécutives :</span>
                    <span class="text-emerald-400 font-bold inline-flex items-center gap-1">
                      <span>{{ gameState.playerStats().currentWinStreak }}</span>
                      <mat-icon class="text-xs text-amber-400">local_fire_department</mat-icon>
                    </span>
                  </div>
                  <div class="flex justify-between text-[#a89984]">
                    <span>Enjeu par match :</span>
                    <span class="text-[#ff4d4d] font-bold">± 25 Elo</span>
                  </div>
                </div>
              </div>

              <button
                (click)="startRankedDuel()"
                class="crimson-btn w-full py-3 rounded-xl font-cinzel text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-xl">
                <mat-icon class="text-base">swords</mat-icon>
                <span>Rechercher Duel Classé</span>
              </button>
            </div>

            <!-- 3. DUEL PERSONNALISÉ (MATCH AMICAL & CUSTOM LOBBY) -->
            <div class="bg-[#120f0c] border border-[#3a2f23] hover:border-[#a855f7]/50 transition-all rounded-2xl p-6 flex flex-col justify-between shadow-xl relative overflow-hidden group">
              <div class="absolute -right-8 -top-8 w-32 h-32 bg-[#a855f7]/10 rounded-full blur-2xl pointer-events-none"></div>
              <div>
                <div class="w-12 h-12 rounded-xl bg-[#1a1612] border border-[#3a2f23] text-[#a855f7] flex items-center justify-center mb-4">
                  <mat-icon class="text-2xl">tune</mat-icon>
                </div>
                <div class="text-[10px] font-mono text-[#8b6b43] uppercase tracking-widest mb-1">Sandbox & Personnalisation</div>
                <h3 class="font-cinzel text-xl font-bold text-[#e0dcc7] group-hover:text-[#c5a880] transition-colors mb-2">
                  Duel Personnalisé
                </h3>
                <p class="text-xs text-[#a89984] leading-relaxed mb-4">
                  Configurez entièrement votre adversaire : classe, points de vie, niveau d'IA, météo d'arène et chrono par tour pour un match sur-mesure.
                </p>

                <div class="bg-[#1a1612] border border-[#3a2f23] rounded-xl p-3 space-y-1.5 text-xs font-mono mb-6">
                  <div class="flex justify-between text-[#a89984]">
                    <span>Bot choisi :</span>
                    <span class="text-[#c5a880] font-bold">{{ customConfig().botName }}</span>
                  </div>
                  <div class="flex justify-between text-[#a89984]">
                    <span>Difficulté :</span>
                    <span class="text-[#a855f7] font-bold uppercase">{{ customConfig().difficulty }}</span>
                  </div>
                  <div class="flex justify-between text-[#a89984]">
                    <span>Météo arène :</span>
                    <span class="text-[#d4af37] font-bold truncate max-w-[130px]">{{ customConfig().weather }}</span>
                  </div>
                </div>
              </div>

              <button
                (click)="showCustomLobbyModal.set(true)"
                class="medieval-btn w-full py-3 bg-[#1a1612] hover:bg-[#251f18] text-[#c5a880] hover:text-[#e0dcc7] border border-[#3a2f23] hover:border-[#a855f7] rounded-xl font-cinzel text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md">
                <mat-icon class="text-base">settings</mat-icon>
                <span>Configurer & Lancer</span>
              </button>
            </div>

          </div>

          <!-- Quick Deck & Hero Readiness Bar -->
          @let modeSkin = gameState.activeSelectedHeroSkin();
          <div class="bg-[#120f0c] border border-[#3a2f23] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <div
                class="w-12 h-12 rounded-xl bg-[#1a1612] border-2 flex items-center justify-center text-[#d4af37] overflow-hidden shrink-0 relative"
                [style.borderColor]="modeSkin.accentHex || '#d4af37'">
                @if (modeSkin.imageUrl || gameState.selectedHero().imageUrl; as heroImg) {
                  <img
                    [src]="heroImg"
                    [alt]="gameState.selectedHero().name"
                    [style.filter]="modeSkin.portraitFilter || 'none'"
                    class="w-full h-full object-cover"
                    referrerpolicy="no-referrer" />
                  <div class="absolute inset-0 bg-gradient-to-t pointer-events-none" [class]="modeSkin.themeGradient || ''"></div>
                } @else {
                  <mat-icon>{{ modeSkin.avatarIcon || gameState.selectedHero().avatarIcon }}</mat-icon>
                }
              </div>
              <div>
                <div class="text-xs font-cinzel font-bold text-[#e0dcc7] flex flex-wrap items-center gap-2">
                  <span>Héros sélectionné : {{ gameState.selectedHero().name }}</span>
                  <span class="text-[11px] font-normal" [style.color]="modeSkin.accentHex || '#d4af37'">· {{ modeSkin.name }}</span>
                  <span class="text-[11px] font-mono text-[#8b6b43]">
                    · Deck : {{ gameState.activeDeck().name }} ({{ gameState.activeDeck().cardIds.length }} cartes)
                  </span>
                </div>
                <div class="text-[11px] text-[#6b5a45]">
                  {{ gameState.selectedHero().passiveName }} · {{ gameState.selectedHero().ultimateName }}
                </div>
              </div>
            </div>

            <div class="flex items-center gap-2 text-xs font-cinzel">
              <button
                (click)="navigateToDeck.emit()"
                class="medieval-btn px-3 py-1.5 bg-[#1a1612] hover:bg-[#251f18] text-[#c5a880] border border-[#3a2f23] rounded-lg flex items-center gap-1">
                <mat-icon class="text-sm">menu_book</mat-icon>
                <span>Changer de Deck</span>
              </button>
            </div>
          </div>

        </div>
      }

      <!-- ========================================================================= -->
      <!-- DIALOGUE MODAL (STORY INTRO / OUTRO VISUAL NOVEL) -->
      <!-- ========================================================================= -->
      @if (activeDialogueMission(); as mission) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
          <div class="bg-[#120f0c] border border-[#d4af37] rounded-2xl p-6 max-w-2xl w-full shadow-2xl space-y-5 text-[#e0dcc7] relative overflow-hidden">
            <div class="flex items-center justify-between border-b border-[#3a2f23] pb-3">
              <div class="flex items-center gap-2">
                <mat-icon class="text-[#d4af37]">auto_stories</mat-icon>
                <h3 class="font-cinzel text-lg font-bold text-[#c5a880]">
                  {{ mission.title }} — Récit
                </h3>
              </div>
              <button
                (click)="closeDialogue()"
                class="p-1 text-[#8b6b43] hover:text-[#e0dcc7] rounded-lg">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <!-- Dialogue Steps Display -->
            @let currentDialogue = getCurrentDialogueStep(mission);
            @if (currentDialogue) {
              <div class="space-y-4 py-2">
                
                <div class="flex items-start gap-4" [class.flex-row-reverse]="currentDialogue.side === 'right'">
                  <!-- Speaker Avatar -->
                  <div
                    class="w-16 h-16 rounded-2xl border-2 flex items-center justify-center text-3xl shrink-0 shadow-lg"
                    [class.border-[#d4af37]]="currentDialogue.side === 'left'"
                    [class.bg-[#1a1612]]="currentDialogue.side === 'left'"
                    [class.text-[#d4af37]]="currentDialogue.side === 'left'"
                    [class.border-[#ff4d4d]]="currentDialogue.side === 'right'"
                    [class.bg-[#241313]]="currentDialogue.side === 'right'"
                    [class.text-[#ff4d4d]]="currentDialogue.side === 'right'">
                    <mat-icon class="text-3xl">{{ currentDialogue.avatarIcon }}</mat-icon>
                  </div>

                  <!-- Speech Bubble -->
                  <div
                    class="flex-1 bg-[#1a1612] border rounded-2xl p-4 shadow-inner relative"
                    [class.border-[#d4af37]/40]="currentDialogue.side === 'left'"
                    [class.border-[#ff4d4d]/40]="currentDialogue.side === 'right'">
                    <div
                      class="text-xs font-cinzel font-bold mb-1"
                      [class.text-[#d4af37]]="currentDialogue.side === 'left'"
                      [class.text-[#ff4d4d]]="currentDialogue.side === 'right'">
                      {{ currentDialogue.speaker }}
                    </div>
                    <p class="text-sm text-[#e0dcc7] leading-relaxed font-serif">
                      "{{ currentDialogue.text }}"
                    </p>
                  </div>
                </div>

                <!-- Step Counter -->
                <div class="flex justify-center gap-1.5 pt-2">
                  @for (d of mission.storyIntro; track $index) {
                    <span
                      class="w-2.5 h-1 rounded-full transition-all"
                      [class.bg-[#d4af37]]="$index === dialogueStepIndex()"
                      [class.bg-[#3a2f23]]="$index !== dialogueStepIndex()"></span>
                  }
                </div>

              </div>
            }

            <!-- Dialogue Controls -->
            <div class="flex items-center justify-between border-t border-[#3a2f23] pt-4">
              <button
                (click)="launchStoryMissionBattle(mission)"
                class="medieval-btn px-4 py-2 bg-[#1a1612] hover:bg-[#251f18] text-[#8b6b43] hover:text-[#c5a880] border border-[#3a2f23] rounded-xl text-xs font-cinzel">
                Passer et Combattre
              </button>

              <button
                (click)="nextDialogueStep(mission)"
                class="crimson-btn px-6 py-2.5 rounded-xl font-cinzel text-xs font-bold flex items-center gap-2">
                <span>{{ isLastDialogueStep(mission) ? 'Lancer le Combat' : 'Suivant' }}</span>
                <mat-icon class="text-sm">arrow_forward</mat-icon>
              </button>
            </div>

          </div>
        </div>
      }

      <!-- ========================================================================= -->
      <!-- CUSTOM DUEL CONFIGURATION MODAL -->
      <!-- ========================================================================= -->
      @if (showCustomLobbyModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
          <div class="bg-[#120f0c] border border-[#3a2f23] rounded-2xl p-6 max-w-xl w-full shadow-2xl space-y-5 text-[#e0dcc7] relative">
            <div class="flex items-center justify-between border-b border-[#3a2f23] pb-3">
              <div class="flex items-center gap-2">
                <mat-icon class="text-[#a855f7]">tune</mat-icon>
                <h3 class="font-cinzel text-lg font-bold text-[#c5a880]">
                  Configuration du Duel Personnalisé
                </h3>
              </div>
              <button
                (click)="showCustomLobbyModal.set(false)"
                class="p-1 text-[#8b6b43] hover:text-[#e0dcc7] rounded-lg">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <!-- Settings Form -->
            <div class="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              
              <!-- 1. Bot Archetype Preset -->
              <div>
                <span class="text-[11px] font-mono text-[#8b6b43] uppercase tracking-wider block mb-1.5">
                  Archétype de l'Adversaire Bot :
                </span>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  @for (preset of botPresets; track preset.name) {
                    <button
                      (click)="applyBotPreset(preset)"
                      class="p-2.5 rounded-lg border text-left text-xs transition-all flex items-center gap-2"
                      [class.bg-[#241313]]="customConfig().botName === preset.name"
                      [class.border-[#ff4d4d]]="customConfig().botName === preset.name"
                      [class.text-white]="customConfig().botName === preset.name"
                      [class.bg-[#1a1612]]="customConfig().botName !== preset.name"
                      [class.border-[#3a2f23]]="customConfig().botName !== preset.name"
                      [class.text-[#a89984]]="customConfig().botName !== preset.name">
                      <mat-icon class="text-base text-[#c5a880]">{{ preset.avatar }}</mat-icon>
                      <div class="truncate">
                        <div class="font-bold truncate">{{ preset.name }}</div>
                        <div class="text-[9px] text-[#6b5a45]">{{ preset.heroClass }}</div>
                      </div>
                    </button>
                  }
                </div>
              </div>

              <!-- 2. Difficulty Level -->
              <div>
                <span class="text-[11px] font-mono text-[#8b6b43] uppercase tracking-wider block mb-1.5">
                  Niveau de Difficulté de l'IA :
                </span>
                <div class="grid grid-cols-4 gap-2">
                  @for (diff of ['easy', 'normal', 'hard', 'nightmare']; track diff) {
                    <button
                      (click)="updateCustomConfig('difficulty', diff)"
                      class="p-2 rounded-lg border text-center text-xs font-cinzel font-bold uppercase transition-all"
                      [class.bg-[#8b2b2b]_text-white_border-[#ff4d4d]]="customConfig().difficulty === diff"
                      [class.bg-[#1a1612]_text-[#8b6b43]_border-[#3a2f23]]="customConfig().difficulty !== diff">
                      {{ diff }}
                    </button>
                  }
                </div>
              </div>

              <!-- 3. Bot HP & Armor -->
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <span class="text-[11px] font-mono text-[#8b6b43] uppercase tracking-wider block mb-1.5">
                    Points de Vie du Bot : ({{ customConfig().botHp }} PV)
                  </span>
                  <div class="grid grid-cols-3 gap-1.5">
                    @for (hp of [20, 32, 45]; track hp) {
                      <button
                        (click)="updateCustomConfig('botHp', hp)"
                        class="p-2 rounded-lg border text-center text-xs font-mono font-bold"
                        [class.bg-[#1a1612]_text-[#ff4d4d]_border-[#ff4d4d]]="customConfig().botHp === hp"
                        [class.bg-[#120f0c]_text-[#8b6b43]_border-[#3a2f23]]="customConfig().botHp !== hp">
                        {{ hp }} PV
                      </button>
                    }
                  </div>
                </div>

                <div>
                  <span class="text-[11px] font-mono text-[#8b6b43] uppercase tracking-wider block mb-1.5">
                    Armure de Départ : ({{ customConfig().botArmor }} Armure)
                  </span>
                  <div class="grid grid-cols-3 gap-1.5">
                    @for (arm of [0, 4, 8]; track arm) {
                      <button
                        (click)="updateCustomConfig('botArmor', arm)"
                        class="p-2 rounded-lg border text-center text-xs font-mono font-bold"
                        [class.bg-[#1a1612]_text-[#4d94ff]_border-[#4d94ff]]="customConfig().botArmor === arm"
                        [class.bg-[#120f0c]_text-[#8b6b43]_border-[#3a2f23]]="customConfig().botArmor !== arm">
                        {{ arm }} ARM
                      </button>
                    }
                  </div>
                </div>
              </div>

              <!-- 4. Arena Weather Condition -->
              <div>
                <span class="text-[11px] font-mono text-[#8b6b43] uppercase tracking-wider block mb-1.5">
                  Météo / Rune de l'Arène :
                </span>
                <div class="grid grid-cols-2 gap-2">
                  @for (w of arenaWeathersList; track w.name) {
                    <button
                      (click)="updateCustomConfig('weather', w.name)"
                      class="p-2.5 rounded-lg border text-left text-xs transition-all flex items-center gap-2"
                      [class.bg-[#1a1612]_text-[#d4af37]_border-[#d4af37]]="customConfig().weather === w.name"
                      [class.bg-[#120f0c]_text-[#8b6b43]_border-[#3a2f23]]="customConfig().weather !== w.name">
                      <mat-icon class="text-base text-[#c5a880]">{{ w.icon }}</mat-icon>
                      <div class="truncate">
                        <div class="font-bold truncate">{{ w.name }}</div>
                        <div class="text-[9px] text-[#6b5a45] truncate">{{ w.description }}</div>
                      </div>
                    </button>
                  }
                </div>
              </div>

              <!-- 5. Turn Timer -->
              <div>
                <span class="text-[11px] font-mono text-[#8b6b43] uppercase tracking-wider block mb-1.5">
                  Chronomètre par Tour :
                </span>
                <div class="grid grid-cols-3 gap-2">
                  @for (t of [30, 45, 60]; track t) {
                    <button
                      (click)="updateCustomConfig('turnTime', t)"
                      class="p-2 rounded-lg border text-center text-xs font-mono font-bold"
                      [class.bg-[#1a1612]_text-[#c5a880]_border-[#c5a880]]="customConfig().turnTime === t"
                      [class.bg-[#120f0c]_text-[#8b6b43]_border-[#3a2f23]]="customConfig().turnTime !== t">
                      {{ t }} secondes
                    </button>
                  }
                </div>
              </div>

            </div>

            <!-- Modal Action Buttons -->
            <div class="flex items-center justify-between border-t border-[#3a2f23] pt-4">
              <button
                (click)="showCustomLobbyModal.set(false)"
                class="medieval-btn px-4 py-2 bg-[#1a1612] text-[#8b6b43] rounded-xl text-xs font-cinzel">
                Annuler
              </button>

              <button
                (click)="launchCustomDuelBattle()"
                class="crimson-btn px-6 py-2.5 rounded-xl font-cinzel text-xs font-bold flex items-center gap-2 shadow-xl">
                <mat-icon class="text-sm">swords</mat-icon>
                <span>Démarrer le Combat</span>
              </button>
            </div>

          </div>
        </div>
      }

    </div>
  `,
})
export class GameModesView {
  readonly gameState = inject(GameStateService);
  readonly battleEngine = inject(BattleEngineService);
  readonly sound = inject(SoundService);

  readonly startBattle = output<void>();
  readonly navigateToDeck = output<void>();

  readonly selectedPrimaryMode = signal<'story' | 'duel'>('story');
  readonly activeChapterId = signal<string>('chap_1');

  // Dialogue Modal State
  readonly activeDialogueMission = signal<StoryMission | null>(null);
  readonly dialogueStepIndex = signal<number>(0);

  // Custom Duel Config State
  readonly showCustomLobbyModal = signal<boolean>(false);
  readonly customConfig = signal<CustomDuelConfig>({
    botName: 'Archimage Ignis',
    botClass: 'mage',
    botTitle: 'Maître Pyromancien',
    botHp: 32,
    botArmor: 3,
    difficulty: 'normal',
    weather: 'Sanctuaire Solaire',
    turnTime: 45,
    startMana: 1,
  });

  readonly botPresets = [
    { name: 'Sire Galahad', heroClass: 'paladin' as HeroClass, title: 'Champion du Soleil', avatar: 'shield_moon', hp: 35, armor: 6 },
    { name: 'Archimage Ignis', heroClass: 'mage' as HeroClass, title: 'Maître Pyromancien', avatar: 'auto_awesome', hp: 32, armor: 3 },
    { name: 'Ombre du Crépuscule', heroClass: 'rogue' as HeroClass, title: 'Assassin des Brumes', avatar: 'visibility_off', hp: 28, armor: 2 },
    { name: 'Liche Morvanna', heroClass: 'necromancer' as HeroClass, title: 'Souveraine des Cryptes', avatar: 'coronavirus', hp: 38, armor: 4 },
    { name: 'Lyanna Ronceval', heroClass: 'druid' as HeroClass, title: 'Gardienne Sylvestre', avatar: 'forest', hp: 34, armor: 4 },
  ];

  readonly arenaWeathersList = [
    { name: 'Sanctuaire Solaire', icon: 'wb_sunny', description: 'Les sorts et créatures de Lumière soignent 1 PV supplémentaire.' },
    { name: 'Vortex Arcanique', icon: 'cyclone', description: 'Chaque sort joué confère +1 Énergie Ultime.' },
    { name: 'Brume des Profondeurs', icon: 'cloud', description: 'Toutes les créatures gagnent +1 PV Max à l\'invocation.' },
    { name: 'Nécropole Maudite', icon: 'coronavirus', description: 'Lorsqu\'une créature meurt, le héros adverse subit 1 dégât.' },
  ];

  readonly currentChapter = computed<StoryChapter | null>(() => {
    return this.gameState.storyChapters().find(c => c.id === this.activeChapterId()) || this.gameState.storyChapters()[0] || null;
  });

  selectPrimaryMode(mode: 'story' | 'duel') {
    this.selectedPrimaryMode.set(mode);
    this.sound.playClick();
  }

  selectChapter(chapterId: string) {
    this.activeChapterId.set(chapterId);
    this.sound.playClick();
  }

  isChapterCompleted(chap: StoryChapter): boolean {
    return chap.missions.length > 0 && chap.missions.every(m => m.isCompleted);
  }

  getChapterCompletedCount(chap: StoryChapter): number {
    return chap.missions.filter(m => m.isCompleted).length;
  }

  getChapterStarsCount(chap: StoryChapter): number {
    return chap.missions.reduce((acc, m) => acc + (m.starsEarned || 0), 0);
  }

  // Story Battles & Dialogues
  openDialogueIntro(mission: StoryMission) {
    this.activeDialogueMission.set(mission);
    this.dialogueStepIndex.set(0);
    this.sound.playClick();
  }

  getCurrentDialogueStep(mission: StoryMission): StoryDialogue | null {
    if (!mission.storyIntro || mission.storyIntro.length === 0) return null;
    const idx = Math.min(this.dialogueStepIndex(), mission.storyIntro.length - 1);
    return mission.storyIntro[idx];
  }

  isLastDialogueStep(mission: StoryMission): boolean {
    return this.dialogueStepIndex() >= (mission.storyIntro.length - 1);
  }

  nextDialogueStep(mission: StoryMission) {
    if (this.isLastDialogueStep(mission)) {
      this.launchStoryMissionBattle(mission);
    } else {
      this.dialogueStepIndex.update(i => i + 1);
      this.sound.playClick();
    }
  }

  closeDialogue() {
    this.activeDialogueMission.set(null);
    this.sound.playClick();
  }

  launchStoryMissionBattle(mission: StoryMission) {
    this.activeDialogueMission.set(null);
    this.battleEngine.startStoryBattle(mission);
    this.startBattle.emit();
  }

  claimFirstClearReward(mission: StoryMission) {
    this.gameState.claimStoryReward(mission.id);
  }

  // Duel Actions
  startQuickDuel() {
    this.battleEngine.startMatchmaking('ai_training');
    this.startBattle.emit();
  }

  startRankedDuel() {
    this.battleEngine.startMatchmaking('ranked');
    this.startBattle.emit();
  }

  applyBotPreset(preset: typeof this.botPresets[0]) {
    this.customConfig.update(c => ({
      ...c,
      botName: preset.name,
      botClass: preset.heroClass,
      botTitle: preset.title,
      botHp: preset.hp,
      botArmor: preset.armor,
    }));
    this.sound.playClick();
  }

  updateCustomConfig(key: keyof CustomDuelConfig, value: unknown) {
    this.customConfig.update(c => ({ ...c, [key]: value }));
    this.sound.playClick();
  }

  launchCustomDuelBattle() {
    this.showCustomLobbyModal.set(false);
    this.battleEngine.startCustomDuel(this.customConfig());
    this.startBattle.emit();
  }
}
