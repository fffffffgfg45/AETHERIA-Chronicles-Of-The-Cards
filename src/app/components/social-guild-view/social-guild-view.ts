import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { animate, stagger } from 'motion';
import {
  GameStateService,
  GUILD_RANK_DETAILS,
  GUILD_PERMISSIONS_MATRIX
} from '../../services/game-state';
import { SoundService } from '../../services/sound';
import { ToastNotificationService } from '../../services/toast-notification';
import { OnlinePresenceService } from '../../services/online-presence';
import { MatIconModule } from '@angular/material/icon';
import { GuildMember, GuildPermission, GuildRank } from '../../models/game.model';

export interface MedievalEmote {
  id: string;
  icon: string;
  category: 'war' | 'honor' | 'tavern' | 'taunt' | 'tactics';
  label: string;
  phrase: string;
  badge?: string;
  color?: string;
}

export interface RankConfirmationAction {
  member: GuildMember;
  action: 'promote' | 'demote' | 'kick';
  currentRank: GuildRank;
  targetRank?: GuildRank;
  title: string;
  warningText: string;
  impactText: string;
  accentColor: string;
  iconBg: string;
  icon: string;
  confirmBtnBg: string;
  confirmBtnText: string;
  confirmBtnLabel: string;
  confirmBtnIcon: string;
}

@Component({
  selector: 'app-social-guild-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule],
  template: `
    @let guild = gameState.guild();
    @let myRank = gameState.playerGuildRank();
    @let myRankInfo = rankDetails[myRank];

    <div class="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      
      <!-- Guild Header Banner with Player Rank Badge & Quick Controls -->
      <div class="bg-[#120f0c] border border-[#3a2f23] rounded-2xl p-6 shadow-2xl relative overflow-hidden space-y-6">
        <div class="absolute -top-12 -right-12 w-72 h-72 rounded-full bg-amber-600/10 blur-3xl pointer-events-none"></div>

        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <!-- Guild Identity -->
          <div class="flex items-start sm:items-center gap-4">
            <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#1a1612] border-2 border-[#d4af37]/70 flex items-center justify-center shadow-lg shrink-0">
              <mat-icon class="text-4xl sm:text-5xl text-[#d4af37]">{{ guild.emblem }}</mat-icon>
            </div>

            <div class="space-y-1">
              <div class="flex flex-wrap items-center gap-2.5">
                <h1 class="font-cinzel-dec text-2xl sm:text-3xl font-black text-[#c5a880] tracking-wide">{{ guild.name }}</h1>
                <span class="px-2.5 py-0.5 rounded-lg bg-[#1a1612] border border-[#8b6b43] text-[#d4af37] font-mono font-bold text-xs">
                  [{{ guild.tag }}]
                </span>
                <span class="px-2 py-0.5 rounded-md bg-[#251b0f] border border-[#d4af37]/40 text-[#f59e0b] font-cinzel text-[11px] font-bold">
                  Niv. {{ guild.level }}
                </span>
              </div>
              <p class="text-[#8b6b43] text-xs sm:text-sm font-serif max-w-xl leading-relaxed">{{ guild.description }}</p>
              
              <div class="flex flex-wrap items-center gap-3 pt-1 text-xs font-mono text-[#6b5a45]">
                <span class="flex items-center gap-1">
                  <mat-icon class="text-xs text-[#8b6b43]">groups</mat-icon>
                  <strong class="text-[#e0dcc7]">{{ guild.members.length }} / {{ guild.maxMembers }}</strong> Membres
                </span>
                <span>•</span>
                <span class="flex items-center gap-1">
                  <mat-icon class="text-xs text-[#d4af37]">toll</mat-icon>
                  <strong class="text-[#d4af37]">{{ guild.treasury.toLocaleString() }}</strong> Or en coffre
                </span>
                <span>•</span>
                <span class="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/50 border border-emerald-500/40 text-emerald-300">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <strong class="font-mono tabular-nums">{{ onlinePresence.onlineCount() }}</strong>
                  <span>{{ onlinePresence.onlineCount() > 1 ? 'joueurs connectés' : 'joueur connecté' }} en direct</span>
                </span>
              </div>
            </div>
          </div>

          <!-- User's Active Guild Rank Card & Simulator Switcher -->
          <div class="bg-[#1a1612] border border-[#3a2f23] rounded-2xl p-4 min-w-[280px] shadow-lg flex flex-col justify-between space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-cinzel font-bold text-[#8b6b43] uppercase tracking-wider flex items-center gap-1">
                <mat-icon class="text-xs text-[#d4af37]">badge</mat-icon>
                Votre Rang Actuel
              </span>

              <!-- Live Rank Badge with Interactive Tooltip -->
              <div class="relative group/myrank cursor-help inline-block">
                <span
                  id="user-active-rank-badge"
                  tabindex="0"
                  role="button"
                  [attr.aria-label]="'Détails de vos privilèges de ' + myRankInfo.label"
                  class="px-2.5 py-0.5 rounded-lg text-xs font-cinzel font-black border flex items-center gap-1.5 shadow-sm transition-all duration-150 group-hover/myrank:scale-105"
                  [style.backgroundColor]="myRankInfo.bgColor"
                  [style.color]="myRankInfo.color"
                  [style.borderColor]="myRankInfo.borderColor">
                  <mat-icon class="text-xs">{{ myRankInfo.icon }}</mat-icon>
                  <span>{{ myRankInfo.label }}</span>
                  <mat-icon class="text-[9px] opacity-70 group-hover/myrank:opacity-100">info</mat-icon>
                </span>

                <!-- Tooltip for Active Rank -->
                <div
                  class="absolute right-0 top-full mt-2 w-80 max-w-[90vw] p-4 rounded-xl bg-[#14100c] border shadow-2xl space-y-3 z-50 opacity-0 pointer-events-none group-hover/myrank:opacity-100 group-hover/myrank:pointer-events-auto group-focus-within/myrank:opacity-100 group-focus-within/myrank:pointer-events-auto transition-all duration-200 backdrop-blur-md"
                  [style.borderColor]="myRankInfo.borderColor"
                  [style.boxShadow]="'0 12px 30px -4px rgba(0, 0, 0, 0.9), 0 0 16px ' + myRankInfo.bgColor">
                  
                  <div
                    class="absolute -top-1.5 right-6 w-3 h-3 rotate-45 bg-[#14100c] border-t border-l"
                    [style.borderColor]="myRankInfo.borderColor"></div>

                  <div class="flex items-start justify-between gap-2 border-b border-[#3a2f23] pb-2.5">
                    <div class="flex items-center gap-2.5">
                      <div
                        class="w-8 h-8 rounded-lg flex items-center justify-center border shadow-inner shrink-0"
                        [style.backgroundColor]="myRankInfo.bgColor"
                        [style.borderColor]="myRankInfo.borderColor"
                        [style.color]="myRankInfo.color">
                        <mat-icon class="text-base">{{ myRankInfo.icon }}</mat-icon>
                      </div>
                      <div>
                        <div class="font-cinzel font-black text-xs text-[#f3eedd]">
                          {{ myRankInfo.label }} (Vous)
                        </div>
                        <div class="text-[10px] font-mono text-[#8b6b43]">
                          {{ myRankInfo.title }} • Rang {{ myRankInfo.level }}/4
                        </div>
                      </div>
                    </div>

                    <span
                      class="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border"
                      [style.backgroundColor]="myRankInfo.bgColor"
                      [style.color]="myRankInfo.color"
                      [style.borderColor]="myRankInfo.borderColor">
                      Niv. {{ myRankInfo.level }}
                    </span>
                  </div>

                  <p class="text-[11px] text-[#c5a880] font-serif leading-relaxed italic">
                    "{{ myRankInfo.description }}"
                  </p>

                  <div class="space-y-1.5">
                    <div class="text-[10px] font-cinzel font-bold text-[#8b6b43] uppercase tracking-wider flex items-center justify-between">
                      <span>Vos Pouvoirs de Guilde</span>
                      <span class="text-[9px] font-mono text-emerald-400">
                        {{ myRankInfo.permissions.length }} prérogatives
                      </span>
                    </div>

                    <ul class="space-y-1 max-h-40 overflow-y-auto pr-1 scrollbar-thin">
                      @for (perm of myRankInfo.permissions; track perm) {
                        <li class="flex items-start gap-1.5 text-[11px] text-[#e0dcc7] bg-[#1a1612]/80 px-2 py-1 rounded-md border border-[#3a2f23]/50">
                          <mat-icon class="text-xs shrink-0 pt-0.5 text-emerald-400">verified</mat-icon>
                          <span class="leading-tight">{{ perm }}</span>
                        </li>
                      }
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div class="text-xs text-[#a89078] font-serif">
              {{ myRankInfo.description }}
            </div>

            <!-- Fast Role Simulator for UX Testing -->
            <div class="pt-2 border-t border-[#3a2f23]/60 flex items-center justify-between gap-2">
              <span class="text-[10px] text-[#6b5a45] font-mono">Changer de rang :</span>
              <div class="flex items-center gap-1">
                @for (r of rankList; track r) {
                  <button
                    (click)="changeMyRank(r)"
                    [title]="'Tester la vue en tant que ' + r"
                    class="px-2 py-0.5 rounded text-[10px] font-cinzel font-bold border transition-all cursor-pointer"
                    [class.bg-[#d4af37]/20_text-[#d4af37]_border-[#d4af37]]="myRank === r"
                    [class.bg-[#0d0b09]_text-[#8b6b43]_border-[#3a2f23]_hover:text-[#c5a880]]="myRank !== r">
                    {{ r }}
                  </button>
                }
              </div>
            </div>
          </div>
        </div>

        <!-- MOTD / Imperial Edict Ticker Banner -->
        <div class="bg-[#18130e] border border-[#8b6b43]/40 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-[#281b0f] border border-[#d4af37]/50 flex items-center justify-center text-[#d4af37] shrink-0">
              <mat-icon class="text-base">campaign</mat-icon>
            </div>
            <div>
              <div class="text-[10px] font-cinzel font-bold text-[#8b6b43] uppercase tracking-wider flex items-center gap-1.5">
                <span>Édit du Conseil de Guilde</span>
                <span class="text-[9px] font-mono text-[#d4af37]">(Message du Jour)</span>
              </div>
              <p class="text-xs text-[#f3eedd] font-serif italic mt-0.5">{{ guild.motd || 'Aucun édit proclamé pour le moment.' }}</p>
            </div>
          </div>

          @if (gameState.hasGuildPermission('Maître', myRank)) {
            <button
              (click)="openMotdModal()"
              class="px-3 py-1.5 rounded-lg bg-[#1a1612] hover:bg-[#281b0f] text-[#d4af37] border border-[#8b6b43] font-cinzel font-bold text-xs whitespace-nowrap transition-colors flex items-center gap-1 shrink-0 self-start sm:self-auto cursor-pointer">
              <mat-icon class="text-xs">edit_note</mat-icon>
              <span>Modifier l'Édit</span>
            </button>
          }
        </div>

      </div>

      <!-- MAIN GUILD VIEW TABS -->
      <div class="flex items-center gap-2 overflow-x-auto pb-1 border-b border-[#3a2f23] text-xs font-cinzel">
        <button
          (click)="activeTab.set('roster')"
          class="px-4 py-2.5 rounded-xl font-bold transition-all border flex items-center gap-2 whitespace-nowrap cursor-pointer"
          [class.bg-[#8b2b2b]_text-white_border-[#ff4d4d]]="activeTab() === 'roster'"
          [class.bg-[#120f0c]_text-[#8b6b43]_border-[#3a2f23]_hover:text-[#c5a880]]="activeTab() !== 'roster'">
          <mat-icon class="text-sm">groups</mat-icon>
          <span>Effectifs & Rangs ({{ guild.members.length }})</span>
        </button>

        <button
          (click)="activeTab.set('hierarchy')"
          class="px-4 py-2.5 rounded-xl font-bold transition-all border flex items-center gap-2 whitespace-nowrap cursor-pointer"
          [class.bg-[#8b2b2b]_text-white_border-[#ff4d4d]]="activeTab() === 'hierarchy'"
          [class.bg-[#120f0c]_text-[#8b6b43]_border-[#3a2f23]_hover:text-[#c5a880]]="activeTab() !== 'hierarchy'">
          <mat-icon class="text-sm">military_tech</mat-icon>
          <span>Hiérarchie & Matrice des Permissions</span>
        </button>

        <button
          (click)="activeTab.set('chat')"
          class="px-4 py-2.5 rounded-xl font-bold transition-all border flex items-center gap-2 whitespace-nowrap cursor-pointer"
          [class.bg-[#8b2b2b]_text-white_border-[#ff4d4d]]="activeTab() === 'chat'"
          [class.bg-[#120f0c]_text-[#8b6b43]_border-[#3a2f23]_hover:text-[#c5a880]]="activeTab() !== 'chat'">
          <mat-icon class="text-sm">chat</mat-icon>
          <span>Taverne & Messagerie</span>
        </button>

        <button
          (click)="activeTab.set('treasury')"
          class="px-4 py-2.5 rounded-xl font-bold transition-all border flex items-center gap-2 whitespace-nowrap cursor-pointer"
          [class.bg-[#8b2b2b]_text-white_border-[#ff4d4d]]="activeTab() === 'treasury'"
          [class.bg-[#120f0c]_text-[#8b6b43]_border-[#3a2f23]_hover:text-[#c5a880]]="activeTab() !== 'treasury'">
          <mat-icon class="text-sm">savings</mat-icon>
          <span>Trésorerie & Bénédictions</span>
        </button>
      </div>

      <!-- TAB 1: ROSTER & RANK MANAGEMENT -->
      @if (activeTab() === 'roster') {
        <div class="space-y-6">
          
          <!-- Roster Top Bar with Rank Counts & Invite Button -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#120f0c] border border-[#3a2f23] rounded-2xl p-4 shadow-xl">
            <!-- Rank Breakdown Pills -->
            <div class="flex flex-wrap items-center gap-2 text-xs">
              <span class="text-[#8b6b43] font-cinzel font-bold mr-1">Rangs :</span>
              @for (r of rankList; track r) {
                @let rInfo = rankDetails[r];
                <div class="relative group/pill cursor-help">
                  <span
                    tabindex="0"
                    role="button"
                    [attr.aria-label]="'Détails du rang ' + rInfo.label"
                    class="px-2.5 py-1 rounded-lg border font-cinzel font-bold flex items-center gap-1.5 shadow-sm text-[11px] transition-all hover:scale-105"
                    [style.backgroundColor]="rInfo.bgColor"
                    [style.color]="rInfo.color"
                    [style.borderColor]="rInfo.borderColor">
                    <mat-icon class="text-xs">{{ rInfo.icon }}</mat-icon>
                    <span>{{ countMembersByRank(r) }} {{ r }}s</span>
                  </span>

                  <!-- Hover Tooltip for Rank Pill -->
                  <div
                    class="absolute left-0 top-full mt-2 w-72 p-3.5 rounded-xl bg-[#14100c] border shadow-2xl space-y-2.5 z-50 opacity-0 pointer-events-none group-hover/pill:opacity-100 group-hover/pill:pointer-events-auto group-focus-within/pill:opacity-100 group-focus-within/pill:pointer-events-auto transition-all duration-200 backdrop-blur-md"
                    [style.borderColor]="rInfo.borderColor"
                    [style.boxShadow]="'0 12px 28px -4px rgba(0,0,0,0.9), 0 0 15px ' + rInfo.bgColor">
                    <div class="flex items-center justify-between border-b border-[#3a2f23] pb-2">
                      <div class="flex items-center gap-2">
                        <mat-icon class="text-base" [style.color]="rInfo.color">{{ rInfo.icon }}</mat-icon>
                        <span class="font-cinzel font-bold text-xs text-[#f3eedd]">{{ rInfo.label }}</span>
                      </div>
                      <span class="text-[9px] font-mono px-1.5 py-0.5 rounded border" [style.backgroundColor]="rInfo.bgColor" [style.color]="rInfo.color" [style.borderColor]="rInfo.borderColor">
                        Niv. {{ rInfo.level }}/4
                      </span>
                    </div>
                    <p class="text-[11px] text-[#c5a880] font-serif leading-tight italic">
                      "{{ rInfo.description }}"
                    </p>
                    <div class="space-y-1">
                      <div class="text-[9px] font-cinzel font-bold text-[#8b6b43] uppercase">Privilèges ({{ rInfo.permissions.length }})</div>
                      <ul class="space-y-0.5 max-h-32 overflow-y-auto text-[10px] text-[#e0dcc7]">
                        @for (p of rInfo.permissions; track p) {
                          <li class="flex items-center gap-1">
                            <mat-icon class="text-[10px] text-emerald-400">check</mat-icon>
                            <span>{{ p }}</span>
                          </li>
                        }
                      </ul>
                    </div>
                  </div>
                </div>
              }
            </div>

            <!-- Recruitment Action -->
            <div class="flex items-center gap-2">
              @if (gameState.hasGuildPermission('Chevalier', myRank)) {
                <button
                  (click)="openInviteModal()"
                  class="crimson-btn px-4 py-2 text-white font-cinzel font-bold text-xs rounded-xl border border-[#ff4d4d] flex items-center gap-1.5 shadow-md cursor-pointer">
                  <mat-icon class="text-sm">person_add</mat-icon>
                  <span>Enrôler une Recrue</span>
                </button>
              } @else {
                <span class="text-xs text-[#8b6b43] font-mono italic">
                  (Rang Chevalier requis pour inviter)
                </span>
              }
            </div>
          </div>

          <!-- Members Grid / List -->
          <div #membersGrid class="grid grid-cols-1 md:grid-cols-2 gap-4">
            @for (m of guild.members; track m.id) {
              @let mRank = getMemberRank(m);
              @let mRankInfo = rankDetails[mRank];

              <div
                [attr.data-member-id]="m.id"
                class="guild-member-card bg-[#120f0c] border border-[#3a2f23] hover:border-[#8b6b43]/80 rounded-2xl p-5 shadow-xl space-y-4 transition-colors duration-200 relative hover:z-30 focus-within:z-30">
                <div class="flex items-start justify-between gap-3">
                  
                  <div class="flex items-center gap-3.5">
                    <div class="w-12 h-12 rounded-xl bg-[#1a1612] border-2 border-[#3a2f23] flex items-center justify-center text-[#c5a880] shadow-md shrink-0">
                      <mat-icon class="text-2xl">{{ m.avatarIcon || 'person' }}</mat-icon>
                    </div>

                    <div>
                      <div class="flex items-center gap-2">
                        <span class="font-cinzel font-black text-sm text-[#f3eedd]">{{ m.username }}</span>
                        @if (m.username === gameState.username()) {
                          <span class="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-mono">
                            VOUS
                          </span>
                        }
                      </div>

                      <div class="flex items-center gap-2 mt-1">
                        <!-- Interactive Rank Badge with Permission Tooltip -->
                        <div class="relative group/rank cursor-help inline-block">
                          <span
                            id="member-rank-badge-{{ m.id }}"
                            tabindex="0"
                            role="button"
                            [attr.aria-label]="'Détails des permissions du rang ' + mRankInfo.label + ' pour ' + m.username"
                            class="px-2 py-0.5 rounded-md text-[10px] font-cinzel font-bold border flex items-center gap-1.5 transition-all duration-150 group-hover/rank:scale-105 group-hover/rank:brightness-110 shadow-sm"
                            [style.backgroundColor]="mRankInfo.bgColor"
                            [style.color]="mRankInfo.color"
                            [style.borderColor]="mRankInfo.borderColor">
                            <mat-icon class="text-[11px]">{{ mRankInfo.icon }}</mat-icon>
                            <span>{{ mRankInfo.label }}</span>
                            <mat-icon class="text-[9px] opacity-70 group-hover/rank:opacity-100 transition-opacity">info</mat-icon>
                          </span>

                          <!-- Detailed Rank Permissions Tooltip on Hover/Focus -->
                          <div
                            id="member-rank-tooltip-{{ m.id }}"
                            class="absolute left-0 top-full mt-2 w-80 max-w-[90vw] p-4 rounded-xl bg-[#14100c] border shadow-2xl space-y-3 z-50 opacity-0 pointer-events-none group-hover/rank:opacity-100 group-hover/rank:pointer-events-auto group-focus-within/rank:opacity-100 group-focus-within/rank:pointer-events-auto transition-all duration-200 backdrop-blur-md"
                            [style.borderColor]="mRankInfo.borderColor"
                            [style.boxShadow]="'0 12px 30px -4px rgba(0, 0, 0, 0.9), 0 0 16px ' + mRankInfo.bgColor">
                            
                            <!-- Arrow Indicator -->
                            <div
                              class="absolute -top-1.5 left-4 w-3 h-3 rotate-45 bg-[#14100c] border-t border-l"
                              [style.borderColor]="mRankInfo.borderColor"></div>

                            <!-- Tooltip Header -->
                            <div class="flex items-start justify-between gap-2 border-b border-[#3a2f23] pb-2.5">
                              <div class="flex items-center gap-2.5">
                                <div
                                  class="w-8 h-8 rounded-lg flex items-center justify-center border shadow-inner shrink-0"
                                  [style.backgroundColor]="mRankInfo.bgColor"
                                  [style.borderColor]="mRankInfo.borderColor"
                                  [style.color]="mRankInfo.color">
                                  <mat-icon class="text-base">{{ mRankInfo.icon }}</mat-icon>
                                </div>
                                <div>
                                  <div class="font-cinzel font-black text-xs text-[#f3eedd] leading-tight">
                                    {{ mRankInfo.label }}
                                  </div>
                                  <div class="text-[10px] font-mono text-[#8b6b43]">
                                    {{ mRankInfo.title }} • Rang {{ mRankInfo.level }}/4
                                  </div>
                                </div>
                              </div>

                              <span
                                class="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border shrink-0"
                                [style.backgroundColor]="mRankInfo.bgColor"
                                [style.color]="mRankInfo.color"
                                [style.borderColor]="mRankInfo.borderColor">
                                Niv. {{ mRankInfo.level }}
                              </span>
                            </div>

                            <!-- Description -->
                            <p class="text-[11px] text-[#c5a880] font-serif leading-relaxed italic">
                              "{{ mRankInfo.description }}"
                            </p>

                            <!-- Authority Meter -->
                            <div class="space-y-1 bg-[#0d0b09] p-2 rounded-lg border border-[#3a2f23]/60">
                              <div class="flex justify-between items-center text-[10px] font-cinzel">
                                <span class="text-[#8b6b43]">Degré d'Autorité</span>
                                <span class="font-mono font-bold" [style.color]="mRankInfo.color">
                                  {{ mRankInfo.level * 25 }}% ({{ mRankInfo.permissions.length }} prérogatives)
                                </span>
                              </div>
                              <div class="w-full bg-[#1a1612] h-1.5 rounded-full overflow-hidden border border-[#3a2f23]">
                                <div
                                  class="h-full rounded-full transition-all duration-300"
                                  [style.width.%]="mRankInfo.level * 25"
                                  [style.backgroundColor]="mRankInfo.color"></div>
                              </div>
                            </div>

                            <!-- Permissions List with Verification Marks -->
                            <div class="space-y-1.5">
                              <div class="text-[10px] font-cinzel font-bold text-[#8b6b43] uppercase tracking-wider flex items-center justify-between">
                                <span>Privilèges & Prérogatives</span>
                                <span class="text-[9px] font-mono" [style.color]="mRankInfo.color">
                                  {{ mRankInfo.permissions.length }} actives
                                </span>
                              </div>

                              <ul class="space-y-1 max-h-44 overflow-y-auto pr-1 scrollbar-thin">
                                @for (perm of mRankInfo.permissions; track perm) {
                                  <li class="flex items-start gap-1.5 text-[11px] text-[#e0dcc7] bg-[#1a1612]/80 px-2 py-1 rounded-md border border-[#3a2f23]/50">
                                    <mat-icon class="text-xs shrink-0 pt-0.5 text-emerald-400">verified</mat-icon>
                                    <span class="leading-tight">{{ perm }}</span>
                                  </li>
                                }
                              </ul>
                            </div>

                            <!-- Footer hint -->
                            <div class="pt-2 border-t border-[#3a2f23] text-[9px] font-mono text-[#6b5a45] text-center">
                              Prérogatives officielles de la confrérie
                            </div>
                          </div>
                        </div>
                        
                        <span class="text-[10px] font-mono text-[#6b5a45]">{{ m.lastActive }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- ELO & Donations -->
                  <div class="text-right font-mono text-xs space-y-0.5">
                    <div class="text-[#d4af37] font-bold">{{ m.elo }} Elo</div>
                    <div class="text-[10px] text-[#8b6b43]">{{ m.donatedGold || 0 }} Or donné</div>
                  </div>

                </div>

                <!-- Member Permissions Overview & Actions -->
                <div class="pt-3 border-t border-[#3a2f23] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div class="text-[11px] text-[#8b6b43] font-serif">
                    <span class="font-semibold text-[#c5a880]">Attributions :</span> {{ mRankInfo.title }} • {{ mRankInfo.permissions.length }} privilèges
                  </div>

                  <!-- Management Controls (Promote / Demote / Kick) -->
                  <div class="flex items-center gap-1.5 shrink-0">
                    
                    <!-- Promote Button -->
                    @if (canPromoteMember(m)) {
                      <button
                        id="btn-promote-member-{{ m.id }}"
                        (click)="requestPromote(m)"
                        [title]="'Promouvoir au rang supérieur'"
                        class="px-2.5 py-1 rounded-lg bg-[#1a1612] hover:bg-emerald-950/40 text-emerald-400 hover:text-emerald-300 border border-emerald-700/50 text-xs font-cinzel font-bold flex items-center gap-1 transition-all cursor-pointer">
                        <mat-icon class="text-xs">arrow_upward</mat-icon>
                        <span>Promouvoir</span>
                      </button>
                    }

                    <!-- Demote Button -->
                    @if (canDemoteMember(m)) {
                      <button
                        id="btn-demote-member-{{ m.id }}"
                        (click)="requestDemote(m)"
                        [title]="'Rétrograder au rang inférieur'"
                        class="px-2.5 py-1 rounded-lg bg-[#1a1612] hover:bg-amber-950/40 text-amber-400 hover:text-amber-300 border border-amber-700/50 text-xs font-cinzel font-bold flex items-center gap-1 transition-all cursor-pointer">
                        <mat-icon class="text-xs">arrow_downward</mat-icon>
                        <span>Rétrograder</span>
                      </button>
                    }

                    <!-- Kick Button -->
                    @if (canKickMember(m)) {
                      <button
                        id="btn-kick-member-{{ m.id }}"
                        (click)="requestKick(m)"
                        [title]="'Exclure de la guilde'"
                        class="p-1.5 rounded-lg bg-[#1a1612] hover:bg-red-950/40 text-red-400 hover:text-red-300 border border-red-700/50 text-xs transition-all flex items-center justify-center cursor-pointer">
                        <mat-icon class="text-xs">person_remove</mat-icon>
                      </button>
                    }

                  </div>
                </div>

              </div>
            }
          </div>

        </div>
      }

      <!-- TAB 2: HIERARCHY & DETAILED PERMISSION MATRIX -->
      @if (activeTab() === 'hierarchy') {
        <div class="space-y-6">
          
          <!-- 4 Ornate Rank Overview Cards -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            @for (r of rankList; track r) {
              @let info = rankDetails[r];
              <div
                class="rounded-2xl p-5 border shadow-xl flex flex-col justify-between space-y-4 bg-[#120f0c] transition-all relative overflow-hidden"
                [class.ring-2]="myRank === r"
                [style.borderColor]="info.borderColor">
                
                @if (myRank === r) {
                  <div class="absolute top-2 right-2 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-mono font-bold">
                    VOTRE RANG
                  </div>
                }

                <div class="space-y-2">
                  <div class="flex items-center gap-2.5">
                    <div
                      class="w-10 h-10 rounded-xl flex items-center justify-center border shadow"
                      [style.backgroundColor]="info.bgColor"
                      [style.borderColor]="info.borderColor"
                      [style.color]="info.color">
                      <mat-icon>{{ info.icon }}</mat-icon>
                    </div>

                    <div>
                      <h3 class="font-cinzel font-black text-sm text-[#e0dcc7]">{{ info.label }}</h3>
                      <div class="text-[10px] font-mono text-[#8b6b43]">Niveau d'autorité : {{ info.level }}/4</div>
                    </div>
                  </div>

                  <p class="text-xs text-[#a89078] font-serif leading-relaxed min-h-[48px]">
                    {{ info.description }}
                  </p>
                </div>

                <div class="pt-3 border-t border-[#3a2f23] space-y-1.5">
                  <div class="text-[10px] font-cinzel font-bold text-[#8b6b43] uppercase tracking-wider">
                    Privilèges Clés ({{ info.permissions.length }}) :
                  </div>
                  <ul class="space-y-1 text-xs text-[#e0dcc7]">
                    @for (perm of info.permissions.slice(0, 3); track perm) {
                      <li class="flex items-center gap-1.5 text-[11px]">
                        <mat-icon class="text-[13px] text-emerald-400">check</mat-icon>
                        <span class="truncate">{{ perm }}</span>
                      </li>
                    }
                    @if (info.permissions.length > 3) {
                      <li class="text-[10px] text-[#8b6b43] font-mono pl-4">
                        + {{ info.permissions.length - 3 }} autres pouvoirs majeurs
                      </li>
                    }
                  </ul>
                </div>

              </div>
            }
          </div>

          <!-- Interactive Full Permission Matrix -->
          <div class="bg-[#120f0c] border border-[#3a2f23] rounded-2xl p-5 shadow-2xl space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#3a2f23]">
              <div>
                <h3 class="font-cinzel text-base font-black text-[#c5a880] flex items-center gap-2">
                  <mat-icon class="text-[#d4af37]">grid_on</mat-icon>
                  Matrice Complète des Permissions et Droits d'Aetheria
                </h3>
                <p class="text-xs text-[#8b6b43] font-serif mt-0.5">
                  Chaque rang supérieur hérite des prérogatives des rangs subalternes. Les statuts cochés en vert indiquent les droits octroyés.
                </p>
              </div>

              <!-- Filter Pills -->
              <div class="flex items-center gap-1.5 overflow-x-auto text-xs font-cinzel">
                <button
                  (click)="permissionCategoryFilter.set('all')"
                  class="px-2.5 py-1 rounded-lg border font-bold transition-all whitespace-nowrap cursor-pointer"
                  [class.bg-[#d4af37]/20_text-[#d4af37]_border-[#d4af37]]="permissionCategoryFilter() === 'all'"
                  [class.bg-[#1a1612]_text-[#8b6b43]_border-[#3a2f23]]="permissionCategoryFilter() !== 'all'">
                  Toutes ({{ permissionsMatrix.length }})
                </button>
                <button
                  (click)="permissionCategoryFilter.set('social')"
                  class="px-2.5 py-1 rounded-lg border font-bold transition-all whitespace-nowrap cursor-pointer"
                  [class.bg-[#d4af37]/20_text-[#d4af37]_border-[#d4af37]]="permissionCategoryFilter() === 'social'"
                  [class.bg-[#1a1612]_text-[#8b6b43]_border-[#3a2f23]]="permissionCategoryFilter() !== 'social'">
                  Social & Taverne
                </button>
                <button
                  (click)="permissionCategoryFilter.set('recruitment')"
                  class="px-2.5 py-1 rounded-lg border font-bold transition-all whitespace-nowrap cursor-pointer"
                  [class.bg-[#d4af37]/20_text-[#d4af37]_border-[#d4af37]]="permissionCategoryFilter() === 'recruitment'"
                  [class.bg-[#1a1612]_text-[#8b6b43]_border-[#3a2f23]]="permissionCategoryFilter() !== 'recruitment'">
                  Recrutement
                </button>
                <button
                  (click)="permissionCategoryFilter.set('management')"
                  class="px-2.5 py-1 rounded-lg border font-bold transition-all whitespace-nowrap cursor-pointer"
                  [class.bg-[#d4af37]/20_text-[#d4af37]_border-[#d4af37]]="permissionCategoryFilter() === 'management'"
                  [class.bg-[#1a1612]_text-[#8b6b43]_border-[#3a2f23]]="permissionCategoryFilter() !== 'management'">
                  Gestion & Guerre
                </button>
                <button
                  (click)="permissionCategoryFilter.set('sovereign')"
                  class="px-2.5 py-1 rounded-lg border font-bold transition-all whitespace-nowrap cursor-pointer"
                  [class.bg-[#d4af37]/20_text-[#d4af37]_border-[#d4af37]]="permissionCategoryFilter() === 'sovereign'"
                  [class.bg-[#1a1612]_text-[#8b6b43]_border-[#3a2f23]]="permissionCategoryFilter() !== 'sovereign'">
                  Souveraineté
                </button>
              </div>
            </div>

            <!-- Table -->
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="border-b border-[#3a2f23] text-xs font-cinzel text-[#8b6b43]">
                    <th class="py-3 px-4 font-bold">Privilège &amp; Pouvoir</th>
                    <th class="py-3 px-3 text-center w-28 text-[#a3e635]">
                      <span class="inline-flex items-center justify-center gap-1">
                        <mat-icon class="text-xs">eco</mat-icon>
                        <span>Recrue</span>
                      </span>
                    </th>
                    <th class="py-3 px-3 text-center w-28 text-[#38bdf8]">
                      <span class="inline-flex items-center justify-center gap-1">
                        <mat-icon class="text-xs">shield</mat-icon>
                        <span>Chevalier</span>
                      </span>
                    </th>
                    <th class="py-3 px-3 text-center w-28 text-[#c084fc]">
                      <span class="inline-flex items-center justify-center gap-1">
                        <mat-icon class="text-xs">military_tech</mat-icon>
                        <span>Maître</span>
                      </span>
                    </th>
                    <th class="py-3 px-3 text-center w-28 text-[#fbbf24]">
                      <span class="inline-flex items-center justify-center gap-1">
                        <mat-icon class="text-xs">workspace_premium</mat-icon>
                        <span>Chef</span>
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#3a2f23]/60 text-xs">
                  @for (perm of filteredPermissions(); track perm.id) {
                    <tr class="hover:bg-[#1a1612]/60 transition-colors">
                      <td class="py-3 px-4">
                        <div class="flex items-center gap-2.5">
                          <div class="w-7 h-7 rounded-lg bg-[#1a1612] border border-[#3a2f23] flex items-center justify-center text-[#d4af37]">
                            <mat-icon class="text-xs">{{ perm.icon }}</mat-icon>
                          </div>
                          <div>
                            <div class="font-cinzel font-bold text-[#e0dcc7]">{{ perm.name }}</div>
                            <div class="text-[11px] text-[#8b6b43] font-serif">{{ perm.description }}</div>
                          </div>
                        </div>
                      </td>

                      <!-- Recrue -->
                      <td class="py-3 px-3 text-center">
                        @if (isPermissionAllowed(perm, 'Recrue')) {
                          <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-700/50">
                            <mat-icon class="text-xs">check</mat-icon>
                          </span>
                        } @else {
                          <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#14100c] text-[#554433] border border-[#2b2218]">
                            <mat-icon class="text-xs">close</mat-icon>
                          </span>
                        }
                      </td>

                      <!-- Chevalier -->
                      <td class="py-3 px-3 text-center">
                        @if (isPermissionAllowed(perm, 'Chevalier')) {
                          <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-700/50">
                            <mat-icon class="text-xs">check</mat-icon>
                          </span>
                        } @else {
                          <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#14100c] text-[#554433] border border-[#2b2218]">
                            <mat-icon class="text-xs">close</mat-icon>
                          </span>
                        }
                      </td>

                      <!-- Maître -->
                      <td class="py-3 px-3 text-center">
                        @if (isPermissionAllowed(perm, 'Maître')) {
                          <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-700/50">
                            <mat-icon class="text-xs">check</mat-icon>
                          </span>
                        } @else {
                          <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#14100c] text-[#554433] border border-[#2b2218]">
                            <mat-icon class="text-xs">close</mat-icon>
                          </span>
                        }
                      </td>

                      <!-- Chef -->
                      <td class="py-3 px-3 text-center">
                        @if (isPermissionAllowed(perm, 'Chef')) {
                          <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-700/50">
                            <mat-icon class="text-xs">check</mat-icon>
                          </span>
                        } @else {
                          <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#14100c] text-[#554433] border border-[#2b2218]">
                            <mat-icon class="text-xs">close</mat-icon>
                          </span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

          </div>

        </div>
      }

      <!-- TAB 3: CHAT & TAVERNE (WITH MEDIEVAL EMOTES) -->
      @if (activeTab() === 'chat') {
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <!-- Chat Log (8 cols) -->
          <div class="lg:col-span-8 space-y-4">
            <div class="bg-[#120f0c] border border-[#3a2f23] rounded-2xl p-5 shadow-xl flex flex-col h-[620px]">
              
              <!-- Channel Switcher -->
              <div class="flex items-center justify-between pb-3 border-b border-[#3a2f23]">
                <div class="flex items-center gap-2">
                  <button
                    (click)="activeChannel.set('global')"
                    class="px-3 py-1.5 rounded-xl font-cinzel text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer"
                    [class.bg-[#8b2b2b]_text-white_border-[#ff4d4d]]="activeChannel() === 'global'"
                    [class.bg-[#1a1612]_text-[#8b6b43]_border-[#3a2f23]]="activeChannel() !== 'global'">
                    <mat-icon class="text-sm">public</mat-icon>
                    <span>Inter-Serveur</span>
                  </button>
                  <button
                    (click)="activeChannel.set('guild')"
                    class="px-3 py-1.5 rounded-xl font-cinzel text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer"
                    [class.bg-[#8b2b2b]_text-white_border-[#ff4d4d]]="activeChannel() === 'guild'"
                    [class.bg-[#1a1612]_text-[#8b6b43]_border-[#3a2f23]]="activeChannel() !== 'guild'">
                    <mat-icon class="text-sm">shield</mat-icon>
                    <span>Chat de Guilde</span>
                  </button>
                </div>

                <div class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span class="text-xs text-[#6b5a45] font-mono">En direct</span>
                </div>
              </div>

              <!-- Messages Log -->
              <div class="flex-1 overflow-y-auto py-3 space-y-3 pr-1">
                @for (msg of filteredMessages(); track msg.id) {
                  <div class="p-3 bg-[#1a1612] border border-[#3a2f23] rounded-xl space-y-1 hover:border-[#8b6b43]/60 transition-colors">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <div class="w-6 h-6 rounded bg-[#0d0b09] border border-[#3a2f23] flex items-center justify-center text-[#c5a880] text-xs">
                          <mat-icon class="text-xs">{{ msg.avatarIcon || 'person' }}</mat-icon>
                        </div>
                        <span class="font-cinzel font-bold text-xs text-[#c5a880]">{{ msg.sender }}</span>
                        @if (msg.senderTag) {
                          <span class="font-mono text-[10px] text-[#8b6b43]">{{ msg.senderTag }}</span>
                        }
                        @if (msg.badge) {
                          <span class="px-1.5 py-0.2 rounded bg-[#0d0b09] text-[#d4af37] border border-[#8b6b43]/40 text-[9px] font-cinzel">
                            {{ msg.badge }}
                          </span>
                        }
                      </div>

                      <span class="text-[10px] font-mono text-[#6b5a45]">{{ msg.timestamp }}</span>
                    </div>

                    <p class="text-xs text-[#e0dcc7] pl-8 leading-relaxed font-serif">{{ msg.text }}</p>
                  </div>
                }
              </div>

              <!-- Medieval Quick Emote Pill Bar -->
              <div class="pt-2.5 pb-1 border-t border-[#3a2f23]">
                <div class="flex items-center justify-between gap-2 mb-1.5">
                  <span class="text-[10px] font-cinzel font-bold text-[#8b6b43] uppercase tracking-wider flex items-center gap-1">
                    <mat-icon class="text-xs text-[#d4af37]">auto_awesome</mat-icon>
                    Émotes Médiévales Rapides
                  </span>
                  
                  <button
                    (click)="toggleEmoteModal()"
                    class="text-[10px] font-cinzel text-[#d4af37] hover:text-[#f3eedd] transition-colors flex items-center gap-1 cursor-pointer">
                    <mat-icon class="text-xs">grid_view</mat-icon>
                    <span>Toutes les émotes ({{ allEmotes.length }})</span>
                  </button>
                </div>

                <!-- Quick scrollable pills -->
                <div class="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
                  @for (emote of favoriteEmotes; track emote.id) {
                    <button
                      (click)="sendQuickEmote(emote)"
                      [title]="emote.phrase"
                      class="px-2.5 py-1 rounded-lg bg-[#18130e] hover:bg-[#281b0f] text-[#c5a880] hover:text-[#d4af37] border border-[#3a2f23] hover:border-[#d4af37]/60 text-[11px] font-cinzel font-semibold whitespace-nowrap shrink-0 transition-all flex items-center gap-1 shadow-sm cursor-pointer">
                      <mat-icon class="text-xs text-[#d4af37]">{{ emote.icon }}</mat-icon>
                      <span>{{ emote.label }}</span>
                    </button>
                  }
                </div>
              </div>

              <!-- Input Area -->
              <div class="pt-2 border-t border-[#3a2f23] flex items-center gap-2">
                <button
                  (click)="toggleEmoteModal()"
                  title="Ouvrir le grimoire des émotes médiévales"
                  class="p-2 rounded-xl bg-[#1a1612] hover:bg-[#281b0f] border border-[#3a2f23] hover:border-[#d4af37] text-[#d4af37] transition-all flex items-center justify-center shrink-0 cursor-pointer">
                  <mat-icon class="text-base">sentiment_satisfied_alt</mat-icon>
                </button>

                <input
                  type="text"
                  [value]="chatInput()"
                  (input)="onChatInput($event)"
                  (keyup.enter)="sendMessage()"
                  placeholder="Rédigez un message ou lancez un cri de ralliement..."
                  class="flex-1 bg-[#1a1612] border border-[#3a2f23] rounded-xl px-4 py-2 text-xs text-[#e0dcc7] placeholder-[#6b5a45] focus:outline-none focus:border-[#8b6b43]" />
                
                <button
                  (click)="sendMessage()"
                  class="crimson-btn px-4 py-2 text-white font-cinzel font-bold text-xs rounded-xl border border-[#ff4d4d] flex items-center gap-1 shrink-0 shadow-md cursor-pointer">
                  <mat-icon class="text-sm">send</mat-icon>
                  <span>Envoyer</span>
                </button>
              </div>

            </div>
          </div>

          <!-- Side Information Panel (4 cols) -->
          <div class="lg:col-span-4 space-y-4">
            <div class="bg-[#120f0c] border border-[#3a2f23] rounded-2xl p-5 shadow-xl space-y-3">
              <h3 class="font-cinzel text-sm font-bold text-[#c5a880] flex items-center gap-1.5">
                <mat-icon class="text-[#d4af37] text-base">military_tech</mat-icon>
                Charte des Proclamations
              </h3>
              <p class="text-xs text-[#8b6b43] font-serif leading-relaxed">
                Les membres de rang <strong>Recrue</strong> et supérieur peuvent envoyer des émotes et proclamations dans la taverne.
                Chaque proclamation est retransmise aux frères d'armes instantanément.
              </p>
            </div>

            <!-- Online Members List -->
            <div class="bg-[#120f0c] border border-[#3a2f23] rounded-2xl p-5 shadow-xl space-y-3">
              <h3 class="font-cinzel text-sm font-bold text-[#c5a880] flex items-center gap-1.5">
                <mat-icon class="text-[#d4af37] text-base">groups</mat-icon>
                Garnison en Ligne
              </h3>
              <div class="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                @for (m of guild.members; track m.id) {
                  @let mRank = getMemberRank(m);
                  @let mRankInfo = rankDetails[mRank];
                  <div class="flex items-center justify-between p-2 bg-[#1a1612] border border-[#3a2f23] rounded-xl text-xs hover:border-[#8b6b43]/50 transition-colors">
                    <div class="flex items-center gap-2">
                      <div class="w-6 h-6 rounded-md bg-[#0d0b09] border border-[#3a2f23] flex items-center justify-center text-[#c5a880]">
                        <mat-icon class="text-xs">{{ m.avatarIcon || 'person' }}</mat-icon>
                      </div>
                      <span class="font-cinzel text-[#e0dcc7] font-semibold">{{ m.username }}</span>
                    </div>

                    <!-- Interactive Rank Badge with Tooltip -->
                    <div class="relative group/chatrank cursor-help">
                      <span
                        class="px-2 py-0.5 rounded text-[10px] font-cinzel font-bold border flex items-center gap-1 shadow-sm transition-all group-hover/chatrank:scale-105"
                        [style.backgroundColor]="mRankInfo.bgColor"
                        [style.color]="mRankInfo.color"
                        [style.borderColor]="mRankInfo.borderColor">
                        <mat-icon class="text-[10px]">{{ mRankInfo.icon }}</mat-icon>
                        <span>{{ mRankInfo.label }}</span>
                      </span>

                      <!-- Tooltip -->
                      <div
                        class="absolute right-0 top-full mt-1.5 w-64 p-3 rounded-xl bg-[#14100c] border shadow-2xl space-y-2 z-50 opacity-0 pointer-events-none group-hover/chatrank:opacity-100 group-hover/chatrank:pointer-events-auto transition-all duration-150 backdrop-blur-md"
                        [style.borderColor]="mRankInfo.borderColor"
                        [style.boxShadow]="'0 10px 25px -3px rgba(0,0,0,0.9), 0 0 12px ' + mRankInfo.bgColor">
                        <div class="flex items-center justify-between border-b border-[#3a2f23] pb-1.5">
                          <div class="flex items-center gap-1.5">
                            <mat-icon class="text-sm" [style.color]="mRankInfo.color">{{ mRankInfo.icon }}</mat-icon>
                            <span class="font-cinzel font-bold text-xs text-[#f3eedd]">{{ mRankInfo.label }}</span>
                          </div>
                          <span class="text-[9px] font-mono" [style.color]="mRankInfo.color">Niv. {{ mRankInfo.level }}/4</span>
                        </div>
                        <div class="text-[9px] font-cinzel text-[#8b6b43] uppercase">Privilèges ({{ mRankInfo.permissions.length }})</div>
                        <ul class="space-y-0.5 max-h-28 overflow-y-auto text-[10px] text-[#e0dcc7]">
                          @for (p of mRankInfo.permissions; track p) {
                            <li class="flex items-center gap-1">
                              <mat-icon class="text-[10px] text-emerald-400">verified</mat-icon>
                              <span class="truncate">{{ p }}</span>
                            </li>
                          }
                        </ul>
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>

        </div>
      }

      <!-- TAB 4: TREASURY & GUILD PERKS -->
      @if (activeTab() === 'treasury') {
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <!-- Treasury Progress & Donations (7 cols) -->
          <div class="lg:col-span-7 space-y-4">
            <div class="bg-[#120f0c] border border-[#3a2f23] rounded-2xl p-6 shadow-xl space-y-6">
              <div>
                <h3 class="font-cinzel text-lg font-black text-[#c5a880] flex items-center gap-2">
                  <mat-icon class="text-[#d4af37]">savings</mat-icon>
                  Trésor & Coffre Hebdomadaire de Guilde
                </h3>
                <p class="text-xs text-[#8b6b43] font-serif mt-1">
                  Chaque pièce d'or versée par les membres contribue à débloquer le grand coffre de fin de semaine et finance les améliorations de garnison.
                </p>
              </div>

              <!-- Big Progress Bar -->
              <div class="space-y-2 bg-[#1a1612] p-4 rounded-xl border border-[#3a2f23]">
                <div class="flex justify-between text-xs font-cinzel">
                  <span class="text-[#8b6b43]">Palier de Coffre Rang 4 / 5</span>
                  <span class="font-mono text-[#d4af37] font-bold">{{ guild.treasury.toLocaleString() }} / {{ guild.weeklyGoal.toLocaleString() }} Or</span>
                </div>

                <div class="w-full bg-[#0d0b09] rounded-full h-3 overflow-hidden border border-[#3a2f23]">
                  <div
                    class="bg-[#8b6b43] h-full transition-all duration-500 rounded-full"
                    [style.width.%]="(guild.treasury / guild.weeklyGoal) * 100"></div>
                </div>

                <div class="text-[11px] text-[#6b5a45] font-mono text-right">
                  Progression : {{ Math.round((guild.treasury / guild.weeklyGoal) * 100) }}%
                </div>
              </div>

              <!-- Donation Action Buttons -->
              <div class="space-y-2">
                <span class="text-xs font-cinzel font-bold text-[#8b6b43] uppercase tracking-wider">
                  Effectuer une offrande au Trésor :
                </span>
                <div class="grid grid-cols-3 gap-3">
                  <button
                    (click)="donateToGuild(100)"
                    class="p-3 rounded-xl bg-[#1a1612] hover:bg-[#251f18] text-[#c5a880] hover:text-[#d4af37] border border-[#3a2f23] hover:border-[#d4af37] text-xs font-cinzel font-bold flex flex-col items-center gap-1 transition-all cursor-pointer">
                    <span>100 Or</span>
                    <span class="text-[10px] text-[#6b5a45] font-mono">+10 Points</span>
                  </button>
                  <button
                    (click)="donateToGuild(500)"
                    class="p-3 rounded-xl bg-[#1a1612] hover:bg-[#251f18] text-[#c5a880] hover:text-[#d4af37] border border-[#3a2f23] hover:border-[#d4af37] text-xs font-cinzel font-bold flex flex-col items-center gap-1 transition-all cursor-pointer">
                    <span>500 Or</span>
                    <span class="text-[10px] text-[#6b5a45] font-mono">+60 Points</span>
                  </button>
                  <button
                    (click)="donateToGuild(1000)"
                    class="p-3 rounded-xl bg-[#1a1612] hover:bg-[#251f18] text-[#c5a880] hover:text-[#d4af37] border border-[#3a2f23] hover:border-[#d4af37] text-xs font-cinzel font-bold flex flex-col items-center gap-1 transition-all cursor-pointer">
                    <span>1 000 Or</span>
                    <span class="text-[10px] text-[#6b5a45] font-mono">+150 Points</span>
                  </button>
                </div>
              </div>

            </div>
          </div>

          <!-- Guild Perks (5 cols) -->
          <div class="lg:col-span-5 space-y-4">
            <div class="bg-[#120f0c] border border-[#3a2f23] rounded-2xl p-6 shadow-xl space-y-4">
              <h3 class="font-cinzel text-sm font-bold text-[#c5a880] flex items-center gap-1.5">
                <mat-icon class="text-[#d4af37] text-base">military_tech</mat-icon>
                Bénédictions & Avantages Actifs
              </h3>

              <div class="space-y-3">
                @for (perk of guild.perks; track perk) {
                  <div class="flex items-start gap-3 bg-[#1a1612] p-3.5 rounded-xl border border-[#3a2f23]">
                    <mat-icon class="text-emerald-400 text-base pt-0.5 shrink-0">check_circle</mat-icon>
                    <div>
                      <div class="text-xs text-[#e0dcc7] font-semibold">{{ perk }}</div>
                      <div class="text-[10px] text-[#8b6b43] font-serif">Actif pour tous les membres de la guilde</div>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>

        </div>
      }

    </div>

    <!-- MODAL: CONFIRM RANK MODIFICATION / MEMBER ACTION -->
    @if (pendingRankAction(); as action) {
      <div
        id="rank-confirmation-modal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rank-confirm-dialog-title"
        (click)="closeRankConfirmationModal()"
        (keydown.escape)="closeRankConfirmationModal()">
        
        <div
          tabindex="0"
          role="document"
          class="bg-[#14100c] border rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-5 outline-none relative animate-scale-up"
          [style.borderColor]="action.accentColor"
          (click)="$event.stopPropagation()"
          (keydown.enter)="$event.stopPropagation()">
          
          <!-- Dialog Header -->
          <div class="flex items-center justify-between border-b border-[#3a2f23] pb-3.5">
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-xl flex items-center justify-center border shadow-md shrink-0"
                [style.backgroundColor]="action.iconBg"
                [style.borderColor]="action.accentColor"
                [style.color]="action.accentColor">
                <mat-icon class="text-xl">{{ action.icon }}</mat-icon>
              </div>
              <div>
                <h3 id="rank-confirm-dialog-title" class="font-cinzel text-lg font-black text-[#f3eedd]">
                  {{ action.title }}
                </h3>
                <p class="text-xs text-[#8b6b43] font-serif">
                  Décret officiel du Conseil de Guilde
                </p>
              </div>
            </div>
            
            <button
              id="btn-close-rank-confirm"
              (click)="closeRankConfirmationModal()"
              class="p-1 rounded-lg text-[#8b6b43] hover:text-[#ff7675] hover:bg-[#1a1612] transition-colors cursor-pointer"
              title="Fermer la fenêtre">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <!-- Target Member Card & Rank Transition Display -->
          <div class="bg-[#1a1612] border border-[#3a2f23] rounded-xl p-4 space-y-4 shadow-inner">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-11 h-11 rounded-xl bg-[#0d0b09] border border-[#8b6b43]/50 flex items-center justify-center text-[#d4af37] shadow">
                  <mat-icon class="text-2xl">{{ action.member.avatarIcon || 'person' }}</mat-icon>
                </div>
                <div>
                  <div class="font-cinzel font-black text-sm text-[#f3eedd]">{{ action.member.username }}</div>
                  <div class="text-[10px] font-mono text-[#8b6b43]">{{ action.member.elo }} ELO • {{ action.member.donatedGold || 0 }} Or donné</div>
                </div>
              </div>

              @if (action.action !== 'kick' && action.targetRank) {
                <span class="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider"
                  [style.backgroundColor]="action.iconBg"
                  [style.color]="action.accentColor">
                  {{ action.action === 'promote' ? 'Élévation' : 'Rétrogradation' }}
                </span>
              } @else {
                <span class="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-red-950/80 text-red-400 border border-red-700/50">
                  Bannissement
                </span>
              }
            </div>

            <!-- Rank Transition Flow -->
            @if (action.action !== 'kick' && action.targetRank) {
              @let currentRankInfo = rankDetails[action.currentRank];
              @let targetRankInfo = rankDetails[action.targetRank];

              <div class="flex items-center justify-center gap-3 py-2.5 px-3 rounded-lg bg-[#0d0b09] border border-[#3a2f23]/80">
                <!-- Current Rank Pill -->
                <div
                  class="px-3 py-1.5 rounded-lg border flex items-center gap-1.5 shadow-sm text-xs font-cinzel font-bold"
                  [style.backgroundColor]="currentRankInfo.bgColor"
                  [style.color]="currentRankInfo.color"
                  [style.borderColor]="currentRankInfo.borderColor">
                  <mat-icon class="text-sm">{{ currentRankInfo.icon }}</mat-icon>
                  <span>{{ currentRankInfo.label }}</span>
                </div>

                <!-- Transition Arrow with Icon -->
                <div class="flex items-center text-[#8b6b43]">
                  <mat-icon class="text-base text-[#d4af37]">arrow_forward</mat-icon>
                </div>

                <!-- Target Rank Pill -->
                <div
                  class="px-3 py-1.5 rounded-lg border flex items-center gap-1.5 shadow-sm text-xs font-cinzel font-black ring-2 ring-offset-1 ring-offset-[#0d0b09]"
                  [style.backgroundColor]="targetRankInfo.bgColor"
                  [style.color]="targetRankInfo.color"
                  [style.borderColor]="targetRankInfo.borderColor">
                  <mat-icon class="text-sm">{{ targetRankInfo.icon }}</mat-icon>
                  <span>{{ targetRankInfo.label }}</span>
                </div>
              </div>
            }
          </div>

          <!-- Explanation & Warning Notice -->
          <div class="space-y-2 text-xs font-serif leading-relaxed">
            <p class="text-[#f3eedd]">
              {{ action.warningText }}
            </p>
            <div class="p-3 rounded-xl bg-[#18130e] border border-[#3a2f23] text-[#a89078] flex items-start gap-2.5">
              <mat-icon class="text-sm text-[#d4af37] shrink-0 pt-0.5">info</mat-icon>
              <span>{{ action.impactText }}</span>
            </div>
          </div>

          <!-- Security Checkbox to prevent accidental changes -->
          <div class="flex items-center gap-2 pt-1">
            <input
              id="chk-confirm-rank-safeguard"
              type="checkbox"
              [checked]="confirmRankSafeguard()"
              (change)="onConfirmSafeguardChange($event)"
              class="w-4 h-4 rounded bg-[#1a1612] border-[#8b6b43] text-amber-500 focus:ring-amber-500 cursor-pointer" />
            <label for="chk-confirm-rank-safeguard" class="text-xs text-[#c5a880] font-cinzel cursor-pointer select-none">
              Je confirme cette décision pour la confrérie
            </label>
          </div>

          <!-- Actions -->
          <div class="pt-3 border-t border-[#3a2f23] flex items-center justify-end gap-3">
            <button
              id="btn-cancel-rank-confirm"
              (click)="closeRankConfirmationModal()"
              class="px-4 py-2.5 rounded-xl bg-[#1a1612] hover:bg-[#251f18] text-[#8b6b43] hover:text-[#e0dcc7] border border-[#3a2f23] text-xs font-cinzel font-bold transition-all cursor-pointer flex items-center gap-1.5">
              <mat-icon class="text-xs">close</mat-icon>
              <span>Annuler</span>
            </button>
            <button
              id="btn-execute-rank-confirm"
              (click)="executeRankAction()"
              [disabled]="!confirmRankSafeguard()"
              class="px-4 py-2.5 rounded-xl text-xs font-cinzel font-bold transition-all flex items-center gap-1.5 shadow-lg cursor-pointer border"
              [class.opacity-50]="!confirmRankSafeguard()"
              [class.cursor-not-allowed]="!confirmRankSafeguard()"
              [style.backgroundColor]="action.confirmBtnBg"
              [style.color]="action.confirmBtnText"
              [style.borderColor]="action.accentColor">
              <mat-icon class="text-sm">{{ action.confirmBtnIcon }}</mat-icon>
              <span>{{ action.confirmBtnLabel }}</span>
            </button>
          </div>

        </div>
      </div>
    }

    <!-- MODAL: INVITE NEW RECRUIT -->
    @if (isInviteModalOpen()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
        role="dialog"
        aria-modal="true"
        (click)="closeInviteModal()"
        (keydown.escape)="closeInviteModal()">
        
        <div
          tabindex="0"
          role="document"
          class="bg-[#14100c] border border-[#d4af37]/60 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4 outline-none"
          (click)="$event.stopPropagation()"
          (keydown.enter)="$event.stopPropagation()">
          
          <div class="flex items-center justify-between border-b border-[#3a2f23] pb-3">
            <div class="flex items-center gap-2">
              <mat-icon class="text-[#d4af37]">person_add</mat-icon>
              <h3 class="font-cinzel text-base font-bold text-[#c5a880]">Enrôler une Nouvelle Recrue</h3>
            </div>
            <button (click)="closeInviteModal()" class="text-[#8b6b43] hover:text-[#ff7675] cursor-pointer">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <div class="space-y-2">
            <label for="invite-username-input" class="block text-xs font-cinzel text-[#8b6b43]">Nom du duelliste :</label>
            <input
              id="invite-username-input"
              type="text"
              [value]="inviteUsername()"
              (input)="onInviteUsernameInput($event)"
              placeholder="Ex: Tristan_L_Invaincu"
              class="w-full bg-[#1a1612] border border-[#3a2f23] rounded-xl px-4 py-2 text-xs text-[#e0dcc7] placeholder-[#6b5a45] focus:outline-none focus:border-[#d4af37]" />
            <p class="text-[11px] text-[#8b6b43] font-serif">Le joueur rejoindra la confrérie avec le rang initial de <strong>Recrue</strong>.</p>
          </div>

          <div class="pt-3 border-t border-[#3a2f23] flex items-center justify-end gap-2">
            <button
              (click)="closeInviteModal()"
              class="px-4 py-2 rounded-xl bg-[#1a1612] text-[#8b6b43] hover:text-[#c5a880] text-xs font-cinzel cursor-pointer">
              Annuler
            </button>
            <button
              (click)="submitInvite()"
              class="crimson-btn px-4 py-2 text-white font-cinzel font-bold text-xs rounded-xl border border-[#ff4d4d] cursor-pointer">
              Envoyer le Serment
            </button>
          </div>

        </div>
      </div>
    }

    <!-- MODAL: EDIT GUILD MOTD -->
    @if (isMotdModalOpen()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
        role="dialog"
        aria-modal="true"
        (click)="closeMotdModal()"
        (keydown.escape)="closeMotdModal()">
        
        <div
          tabindex="0"
          role="document"
          class="bg-[#14100c] border border-[#d4af37]/60 rounded-2xl w-full max-w-lg shadow-2xl p-5 space-y-4 outline-none"
          (click)="$event.stopPropagation()"
          (keydown.enter)="$event.stopPropagation()">
          
          <div class="flex items-center justify-between border-b border-[#3a2f23] pb-3">
            <div class="flex items-center gap-2">
              <mat-icon class="text-[#d4af37]">edit_note</mat-icon>
              <h3 class="font-cinzel text-base font-bold text-[#c5a880]">Édition de l'Édit de Guilde (MOTD)</h3>
            </div>
            <button (click)="closeMotdModal()" class="text-[#8b6b43] hover:text-[#ff7675] cursor-pointer">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <div class="space-y-3">
            <label for="motd-input-proclamation" class="block text-xs font-cinzel text-[#8b6b43]">Proclamation officielle :</label>
            <textarea
              id="motd-input-proclamation"
              [value]="motdInput()"
              (input)="onMotdInput($event)"
              rows="3"
              placeholder="Rédigez la consigne de guerre ou l'annonce du conseil..."
              class="w-full bg-[#1a1612] border border-[#3a2f23] rounded-xl p-3 text-xs text-[#e0dcc7] placeholder-[#6b5a45] focus:outline-none focus:border-[#d4af37] resize-none"></textarea>

            <!-- Quick Presets -->
            <div class="space-y-1">
              <span class="text-[10px] font-cinzel text-[#8b6b43]">Modèles de proclamations :</span>
              <div class="flex flex-wrap gap-1.5">
                <button
                  (click)="motdInput.set('Guerre de Guilde ce samedi à 20h ! Présence obligatoire pour les Chevaliers et Maîtres.')"
                  class="px-2 py-1 rounded bg-[#1a1612] hover:bg-[#251f18] text-[#c5a880] border border-[#3a2f23] text-[10px] font-serif cursor-pointer inline-flex items-center gap-1">
                  <mat-icon class="text-xs text-[#ff6b6b]">swords</mat-icon>
                  <span>Guerre Samedi</span>
                </button>
                <button
                  (click)="motdInput.set('Objectif Coffre Rang 5 : pensez à faire vos dons de 500 Or avant dimanche minuit !')"
                  class="px-2 py-1 rounded bg-[#1a1612] hover:bg-[#251f18] text-[#c5a880] border border-[#3a2f23] text-[10px] font-serif cursor-pointer inline-flex items-center gap-1">
                  <mat-icon class="text-xs text-[#38bdf8]">shield</mat-icon>
                  <span>Objectif Coffre</span>
                </button>
                <button
                  (click)="motdInput.set('Félicitations à nos champions pour la qualification aux tournois inter-serveurs !')"
                  class="px-2 py-1 rounded bg-[#1a1612] hover:bg-[#251f18] text-[#c5a880] border border-[#3a2f23] text-[10px] font-serif cursor-pointer inline-flex items-center gap-1">
                  <mat-icon class="text-xs text-[#d4af37]">emoji_events</mat-icon>
                  <span>Victoire Tournoi</span>
                </button>
              </div>
            </div>
          </div>

          <div class="pt-3 border-t border-[#3a2f23] flex items-center justify-end gap-2">
            <button
              (click)="closeMotdModal()"
              class="px-4 py-2 rounded-xl bg-[#1a1612] text-[#8b6b43] hover:text-[#c5a880] text-xs font-cinzel cursor-pointer">
              Annuler
            </button>
            <button
              (click)="saveMotd()"
              class="crimson-btn px-4 py-2 text-white font-cinzel font-bold text-xs rounded-xl border border-[#ff4d4d] cursor-pointer">
              Proclamer l'Édit
            </button>
          </div>

        </div>
      </div>
    }

    <!-- MEDIEVAL EMOTE SELECTION MODAL / VAULT -->
    @if (isEmoteModalOpen()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
        role="dialog"
        aria-modal="true"
        (click)="closeEmoteModal()"
        (keydown.escape)="closeEmoteModal()">
        
        <div
          tabindex="0"
          role="document"
          class="bg-[#14100c] border border-[#d4af37]/60 rounded-2xl w-full max-w-2xl shadow-2xl p-5 space-y-4 max-h-[85vh] flex flex-col relative animate-scale-up outline-none"
          (click)="$event.stopPropagation()"
          (keydown.enter)="$event.stopPropagation()">
          
          <!-- Header -->
          <div class="flex items-center justify-between border-b border-[#3a2f23] pb-3">
            <div class="flex items-center gap-2.5">
              <div class="w-10 h-10 rounded-xl bg-[#281b0f] border border-[#d4af37] flex items-center justify-center text-[#d4af37] shadow">
                <mat-icon>auto_awesome</mat-icon>
              </div>
              <div>
                <h3 class="font-cinzel text-lg font-black text-[#c5a880]">Grimoire des Émotes d'Aetheria</h3>
                <p class="text-xs text-[#8b6b43] font-serif">Cliquez sur une proclamation pour l'envoyer instantanément dans le canal actif.</p>
              </div>
            </div>

            <button
              (click)="closeEmoteModal()"
              class="p-1.5 rounded-lg text-[#8b6b43] hover:text-[#ff7675] hover:bg-[#1a1612] transition-colors cursor-pointer">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <!-- Category Tabs -->
          <div class="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#3a2f23] text-xs font-cinzel">
            @for (cat of emoteCategories; track cat.id) {
              <button
                (click)="selectedCategory.set(cat.id)"
                class="px-3 py-1.5 rounded-xl border font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
                [class.bg-[#d4af37]/20_text-[#d4af37]_border-[#d4af37]]="selectedCategory() === cat.id"
                [class.bg-[#1a1612]_text-[#8b6b43]_border-[#3a2f23]_hover:text-[#c5a880]]="selectedCategory() !== cat.id">
                <mat-icon class="text-xs">{{ cat.icon }}</mat-icon>
                <span>{{ cat.label }}</span>
              </button>
            }
          </div>

          <!-- Emote Grid -->
          <div class="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2.5 pr-1 py-1">
            @for (emote of currentCategoryEmotes(); track emote.id) {
              <button
                (click)="sendQuickEmote(emote)"
                class="p-3 rounded-xl bg-[#1a1612] hover:bg-[#251f18] border border-[#3a2f23] hover:border-[#d4af37] text-left transition-all flex items-start gap-3 group shadow-md cursor-pointer">
                <div class="w-9 h-9 rounded-lg bg-[#120d09] border border-[#8b6b43]/40 flex items-center justify-center text-[#d4af37] shrink-0 group-hover:scale-110 transition-transform">
                  <mat-icon class="text-lg">{{ emote.icon }}</mat-icon>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center justify-between gap-1">
                    <span class="font-cinzel text-xs font-black text-[#e0dcc7] group-hover:text-[#d4af37] transition-colors">
                      {{ emote.label }}
                    </span>
                    @if (emote.badge) {
                      <span class="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-[#0d0b09] text-[#d4af37] border border-[#8b6b43]/40">
                        {{ emote.badge }}
                      </span>
                    }
                  </div>
                  <p class="text-xs text-[#a89078] font-serif italic mt-1 leading-snug">
                    "{{ emote.phrase }}"
                  </p>
                </div>
              </button>
            }
          </div>

          <!-- Footer -->
          <div class="pt-3 border-t border-[#3a2f23] flex items-center justify-between text-xs text-[#8b6b43]">
            <span class="font-mono flex items-center gap-1.5">
              <span>Canal cible :</span>
              <strong class="text-[#d4af37] inline-flex items-center gap-1">
                <mat-icon class="text-xs">{{ activeChannel() === 'global' ? 'public' : 'shield' }}</mat-icon>
                <span>{{ activeChannel() === 'global' ? 'Inter-Serveur' : 'Chat de Guilde' }}</span>
              </strong>
            </span>
            <button
              (click)="closeEmoteModal()"
              class="px-4 py-1.5 rounded-xl bg-[#1a1612] hover:bg-[#281b0f] text-[#c5a880] border border-[#3a2f23] font-cinzel font-bold text-xs transition-colors cursor-pointer">
              Fermer
            </button>
          </div>

        </div>
      </div>
    }
  `,
})
export class SocialGuildView {
  readonly gameState = inject(GameStateService);
  readonly sound = inject(SoundService);
  readonly toast = inject(ToastNotificationService);
  readonly onlinePresence = inject(OnlinePresenceService);

  readonly Math = Math;

  readonly activeTab = signal<'roster' | 'hierarchy' | 'chat' | 'treasury'>('roster');
  readonly activeChannel = signal<'global' | 'guild'>('global');
  readonly isEmoteModalOpen = signal<boolean>(false);
  readonly isInviteModalOpen = signal<boolean>(false);
  readonly isMotdModalOpen = signal<boolean>(false);
  readonly pendingRankAction = signal<RankConfirmationAction | null>(null);
  readonly selectedCategory = signal<'all' | 'war' | 'honor' | 'tavern' | 'taunt' | 'tactics'>('all');
  readonly permissionCategoryFilter = signal<'all' | 'social' | 'recruitment' | 'management' | 'sovereign'>('all');

  readonly membersGrid = viewChild<ElementRef<HTMLElement>>('membersGrid');
  private lastAnimatedGridEl: HTMLElement | null = null;
  private animatedMemberIds = new Set<string>();

  readonly confirmRankSafeguard = signal<boolean>(true);
  readonly chatInput = signal<string>('');
  readonly inviteUsername = signal<string>('');
  readonly motdInput = signal<string>('');

  constructor() {
    effect(() => {
      const gridRef = this.membersGrid();
      const members = this.gameState.guild().members;

      if (!gridRef || typeof window === 'undefined') {
        if (!gridRef) {
          this.lastAnimatedGridEl = null;
        }
        return;
      }

      const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
      const gridEl = gridRef.nativeElement;

      if (gridEl === this.lastAnimatedGridEl) {
        const newCards = Array.from(gridEl.querySelectorAll<HTMLElement>('.guild-member-card')).filter(card => {
          const memberId = card.dataset['memberId'];
          return Boolean(memberId && !this.animatedMemberIds.has(memberId));
        });

        if (newCards.length > 0 && !reducedMotion) {
          animate(
            newCards,
            { opacity: [0, 1], y: [22, 0] },
            {
              delay: stagger(0.07),
              duration: 0.45,
              ease: [0.22, 1, 0.36, 1],
            }
          );
        }

        members.forEach(m => this.animatedMemberIds.add(m.id));
        return;
      }

      this.lastAnimatedGridEl = gridEl;
      this.animatedMemberIds = new Set(members.map(m => m.id));

      const cards = gridEl.querySelectorAll<HTMLElement>('.guild-member-card');
      if (cards.length === 0 || reducedMotion) return;

      animate(
        cards,
        { opacity: [0, 1], y: [24, 0] },
        {
          delay: stagger(0.08, { startDelay: 0.05 }),
          duration: 0.5,
          ease: [0.22, 1, 0.36, 1],
        }
      );
    });
  }

  readonly rankList: GuildRank[] = ['Chef', 'Maître', 'Chevalier', 'Recrue'];
  readonly rankDetails = GUILD_RANK_DETAILS;
  readonly permissionsMatrix: GuildPermission[] = GUILD_PERMISSIONS_MATRIX;

  readonly filteredPermissions = computed(() => {
    const cat = this.permissionCategoryFilter();
    if (cat === 'all') return this.permissionsMatrix;
    return this.permissionsMatrix.filter(p => p.category === cat);
  });

  readonly emoteCategories: { id: 'all' | 'war' | 'honor' | 'tavern' | 'taunt' | 'tactics'; label: string; icon: string }[] = [
    { id: 'all', label: 'Toutes', icon: 'auto_awesome' },
    { id: 'honor', label: 'Honneur & Saluts', icon: 'shield' },
    { id: 'war', label: 'Cris de Guerre', icon: 'swords' },
    { id: 'tavern', label: 'Taverne & Festin', icon: 'sports_bar' },
    { id: 'taunt', label: 'Défis & Duels', icon: 'local_fire_department' },
    { id: 'tactics', label: 'Entraide & Stratégie', icon: 'psychology' },
  ];

  readonly allEmotes: MedievalEmote[] = [
    // Honor & Greetings
    { id: 'em_honor_1', icon: 'shield', category: 'honor', label: 'Gloire à la Guilde', phrase: 'Gloire et honneur à notre glorieuse bannière !', badge: 'RALLIEMENT' },
    { id: 'em_honor_2', icon: 'swords', category: 'honor', label: 'Par mon honneur', phrase: 'Par mon honneur et mon acier, je ne faillirai point !', badge: 'SERMENT' },
    { id: 'em_honor_3', icon: 'workspace_premium', category: 'honor', label: 'Salut noble champion', phrase: 'Salutations et longue vie à toi, noble frère d\'armes !' },
    { id: 'em_honor_4', icon: 'auto_awesome', category: 'honor', label: 'Que la Lumière guide', phrase: 'Que la Lumière d\'Aetheria guide chacun de vos pas.' },
    { id: 'em_honor_5', icon: 'castle', category: 'honor', label: 'Pour le Royaume', phrase: 'Pour le Royaume et la mémoire des anciens rois !' },
    
    // War & Battle Cries
    { id: 'em_war_1', icon: 'local_fire_department', category: 'war', label: 'Aux armes !', phrase: 'Aux armes ! Que les infidèles goûtent à la fureur de notre acier !', badge: 'CRI DE GUERRE' },
    { id: 'em_war_2', icon: 'campaign', category: 'war', label: 'Sonnons la charge !', phrase: 'Que les cors de guerre sonnent l\'assaut général !', badge: 'ATTAQUE' },
    { id: 'em_war_3', icon: 'bolt', category: 'war', label: 'Foudre céleste !', phrase: 'La tempête des Arcanes s\'abat sur nos ennemis !' },
    { id: 'em_war_4', icon: 'gps_fixed', category: 'war', label: 'Pluie de flèches', phrase: 'Que les cieux s\'obscurcissent sous notre volée de flèches !' },
    { id: 'em_war_5', icon: 'whatshot', category: 'war', label: 'Rage draconique', phrase: 'Par le sang des dragons éternels, triomphe ou trépas !' },

    // Tavern & Celebration
    { id: 'em_tav_1', icon: 'sports_bar', category: 'tavern', label: 'Tournée générale', phrase: 'Aubergiste ! Une tournée de notre meilleur hydromel pour tous !', badge: 'FESTIN' },
    { id: 'em_tav_2', icon: 'emoji_events', category: 'tavern', label: 'Victoire éclatante', phrase: 'Quelle splendide victoire ! Les bardes chanteront nos exploits.' },
    { id: 'em_tav_3', icon: 'monetization_on', category: 'tavern', label: 'Que l\'or coule !', phrase: 'Le trésor regorge de butin et de richesses inestimables !' },
    { id: 'em_tav_4', icon: 'celebration', category: 'tavern', label: 'Hourra !', phrase: 'Hourra pour les preux chevaliers d\'Aetheria !' },

    // Taunts & Duels
    { id: 'em_tnt_1', icon: 'sports_martial_arts', category: 'taunt', label: 'Qui ose me défier ?', phrase: 'Qui donc a le courage de croiser le fer contre mon deck ?', badge: 'DÉFI' },
    { id: 'em_tnt_2', icon: 'coronavirus', category: 'taunt', label: 'Prépare ta garde', phrase: 'Fais tes prières, duelliste, ton heure est venue !' },
    { id: 'em_tnt_3', icon: 'air', category: 'taunt', label: 'Trop lent !', phrase: 'Ta lame fend le vent mais ne touche que le vide !' },
    { id: 'em_tnt_4', icon: 'theater_comedy', category: 'taunt', label: 'Beau combat', phrase: 'Un duel digne des chroniques impériales, bien joué !' },

    // Tactics & Support
    { id: 'em_tac_1', icon: 'handshake', category: 'tactics', label: 'Frères d\'armes', phrase: 'Je couvre tes arrières, quoi qu\'il advienne !', badge: 'ENTRAIDE' },
    { id: 'em_tac_2', icon: 'science', category: 'tactics', label: 'Élixirs prêts', phrase: 'Mes potions et concoctions sont à votre disposition pour le raid !' },
    { id: 'em_tac_3', icon: 'psychology', category: 'tactics', label: 'Concentrez le mana', phrase: 'Gardez votre mana pour la vague décisive !' },
    { id: 'em_tac_4', icon: 'security', category: 'tactics', label: 'En formation', phrase: 'Resserrez les rangs, tenez la ligne de front coûte que coûte !' },
  ];

  // Quick favorite emotes for direct top-row pills
  readonly favoriteEmotes: MedievalEmote[] = [
    this.allEmotes[0], // Gloire à la guilde
    this.allEmotes[1], // Par mon honneur
    this.allEmotes[5], // Aux armes !
    this.allEmotes[10], // Tournée générale
    this.allEmotes[14], // Qui ose me défier ?
    this.allEmotes[18], // Frères d'armes
    this.allEmotes[11], // Victoire éclatante
    this.allEmotes[2], // Salut noble champion
  ];

  getMemberRank(member: GuildMember): GuildRank {
    if (member.rank) return member.rank;
    if (member.role === 'Chef' || member.role === 'Meneur' || member.role === 'Leader') return 'Chef';
    if (member.role === 'Maître' || member.role === 'Officier') return 'Maître';
    if (member.role === 'Chevalier' || member.role === 'Vétéran') return 'Chevalier';
    return 'Recrue';
  }

  countMembersByRank(rank: GuildRank): number {
    return this.gameState.guild().members.filter(m => this.getMemberRank(m) === rank).length;
  }

  isPermissionAllowed(perm: GuildPermission, rank: GuildRank): boolean {
    return this.gameState.hasGuildPermission(perm.minRank, rank);
  }

  canPromoteMember(member: GuildMember): boolean {
    const myRank = this.gameState.playerGuildRank();
    if (member.username === this.gameState.username()) return false;
    const mRank = this.getMemberRank(member);
    if (mRank === 'Chef') return false;
    if (mRank === 'Maître') return false;
    if (mRank === 'Chevalier' && myRank !== 'Chef') return false;
    return this.gameState.hasGuildPermission('Maître', myRank);
  }

  canDemoteMember(member: GuildMember): boolean {
    const myRank = this.gameState.playerGuildRank();
    if (member.username === this.gameState.username()) return false;
    const mRank = this.getMemberRank(member);
    if (mRank === 'Recrue' || mRank === 'Chef') return false;
    if (mRank === 'Maître' && myRank !== 'Chef') return false;
    return this.gameState.hasGuildPermission('Maître', myRank);
  }

  canKickMember(member: GuildMember): boolean {
    const myRank = this.gameState.playerGuildRank();
    if (member.username === this.gameState.username()) return false;
    const mRank = this.getMemberRank(member);
    if (mRank === 'Chef') return false;
    if (mRank === 'Maître' && myRank !== 'Chef') return false;
    return this.gameState.hasGuildPermission('Maître', myRank);
  }

  requestPromote(member: GuildMember) {
    const currentRank = this.getMemberRank(member);
    let targetRank: GuildRank = 'Chevalier';
    if (currentRank === 'Recrue') {
      targetRank = 'Chevalier';
    } else if (currentRank === 'Chevalier') {
      targetRank = 'Maître';
    }

    const currentRankInfo = this.rankDetails[currentRank];
    const targetRankInfo = this.rankDetails[targetRank];

    this.confirmRankSafeguard.set(true);
    this.pendingRankAction.set({
      member,
      action: 'promote',
      currentRank,
      targetRank,
      title: `Élévation de Rang : ${member.username}`,
      warningText: `Vous vous apprêtez à promouvoir [${member.username}] du rang de ${currentRankInfo.title} vers le rang prestigieux de ${targetRankInfo.title}.`,
      impactText: `Ce membre recevra de nouveaux privilèges (${targetRankInfo.permissions.length} au total) et une autorité accrue au sein de la guilde.`,
      accentColor: '#10b981',
      iconBg: 'rgba(16, 185, 129, 0.2)',
      icon: 'military_tech',
      confirmBtnBg: '#047857',
      confirmBtnText: '#ffffff',
      confirmBtnLabel: 'Confirmer la Promotion',
      confirmBtnIcon: 'arrow_upward',
    });
    this.sound.playClick();
  }

  requestDemote(member: GuildMember) {
    const currentRank = this.getMemberRank(member);
    let targetRank: GuildRank = 'Recrue';
    if (currentRank === 'Maître') {
      targetRank = 'Chevalier';
    } else if (currentRank === 'Chevalier') {
      targetRank = 'Recrue';
    }

    const currentRankInfo = this.rankDetails[currentRank];
    const targetRankInfo = this.rankDetails[targetRank];

    this.confirmRankSafeguard.set(true);
    this.pendingRankAction.set({
      member,
      action: 'demote',
      currentRank,
      targetRank,
      title: `Rétrogradation de Rang : ${member.username}`,
      warningText: `Attention : vous vous apprêtez à rétrograder [${member.username}] du rang de ${currentRankInfo.title} vers ${targetRankInfo.title}.`,
      impactText: `Ce membre perdra l'accès aux privilèges réservés aux ${currentRankInfo.label}s et son autorité sera réduite.`,
      accentColor: '#f59e0b',
      iconBg: 'rgba(245, 158, 11, 0.2)',
      icon: 'warning',
      confirmBtnBg: '#b45309',
      confirmBtnText: '#ffffff',
      confirmBtnLabel: 'Confirmer la Rétrogradation',
      confirmBtnIcon: 'arrow_downward',
    });
    this.sound.playClick();
  }

  requestKick(member: GuildMember) {
    const currentRank = this.getMemberRank(member);
    const currentRankInfo = this.rankDetails[currentRank];

    this.confirmRankSafeguard.set(true);
    this.pendingRankAction.set({
      member,
      action: 'kick',
      currentRank,
      title: `Bannissement de Guilde : ${member.username}`,
      warningText: `Êtes-vous certain de vouloir bannir définitivement [${member.username}] (${currentRankInfo.label}) de la confrérie ?`,
      impactText: `Ce joueur sera immédiatement expulsé de la guilde, perdra l'accès au coffre, aux avantages collectifs et aux canaux réservés.`,
      accentColor: '#ef4444',
      iconBg: 'rgba(239, 68, 68, 0.2)',
      icon: 'person_remove',
      confirmBtnBg: '#b91c1c',
      confirmBtnText: '#ffffff',
      confirmBtnLabel: 'Bannir le Membre',
      confirmBtnIcon: 'delete_forever',
    });
    this.sound.playClick();
  }

  closeRankConfirmationModal() {
    this.pendingRankAction.set(null);
  }

  executeRankAction() {
    const action = this.pendingRankAction();
    if (!action) return;

    if (action.action === 'promote') {
      this.gameState.promoteGuildMember(action.member.id);
    } else if (action.action === 'demote') {
      this.gameState.demoteGuildMember(action.member.id);
    } else if (action.action === 'kick') {
      this.gameState.kickGuildMember(action.member.id);
    }

    this.closeRankConfirmationModal();
  }

  promoteMember(member: GuildMember) {
    this.requestPromote(member);
  }

  demoteMember(member: GuildMember) {
    this.requestDemote(member);
  }

  kickMember(member: GuildMember) {
    this.requestKick(member);
  }

  changeMyRank(newRank: GuildRank) {
    this.gameState.setPlayerGuildRank(newRank);
  }

  currentCategoryEmotes(): MedievalEmote[] {
    const cat = this.selectedCategory();
    if (cat === 'all') return this.allEmotes;
    return this.allEmotes.filter(e => e.category === cat);
  }

  filteredMessages() {
    const chan = this.activeChannel();
    return this.gameState.chatMessages().filter(m => m.channel === chan);
  }

  onChatInput(event: Event) {
    this.chatInput.set((event.target as HTMLInputElement).value);
  }

  onConfirmSafeguardChange(event: Event) {
    this.confirmRankSafeguard.set((event.target as HTMLInputElement).checked);
  }

  onInviteUsernameInput(event: Event) {
    this.inviteUsername.set((event.target as HTMLInputElement).value);
  }

  onMotdInput(event: Event) {
    this.motdInput.set((event.target as HTMLTextAreaElement).value);
  }

  sendMessage() {
    const text = this.chatInput().trim();
    if (!text) return;
    this.gameState.sendChatMessage(this.activeChannel(), text);
    this.chatInput.set('');
  }

  sendQuickEmote(emote: MedievalEmote) {
    const formatted = `[${emote.label}] « ${emote.phrase} »`;
    this.gameState.sendChatMessage(this.activeChannel(), formatted);
    this.sound.playClick();
    this.toast.showSystem(
      'Émote Médiévale Envoyée',
      `Message envoyé au canal ${this.activeChannel() === 'global' ? 'Inter-Serveur' : 'de Guilde'}.`,
      'campaign'
    );
    this.isEmoteModalOpen.set(false);
  }

  toggleEmoteModal() {
    this.isEmoteModalOpen.update(v => !v);
    this.sound.playClick();
  }

  closeEmoteModal() {
    this.isEmoteModalOpen.set(false);
  }

  openInviteModal() {
    this.inviteUsername.set('');
    this.isInviteModalOpen.set(true);
    this.sound.playClick();
  }

  closeInviteModal() {
    this.isInviteModalOpen.set(false);
  }

  submitInvite() {
    const username = this.inviteUsername().trim();
    if (!username) return;
    if (this.gameState.inviteGuildMember(username)) {
      this.closeInviteModal();
    }
  }

  openMotdModal() {
    this.motdInput.set(this.gameState.guild().motd || '');
    this.isMotdModalOpen.set(true);
    this.sound.playClick();
  }

  closeMotdModal() {
    this.isMotdModalOpen.set(false);
  }

  saveMotd() {
    if (this.gameState.updateGuildMotd(this.motdInput())) {
      this.closeMotdModal();
    }
  }

  donateToGuild(amount: number) {
    if (this.gameState.gold() < amount) {
      this.toast.showSystem('Or Insuffisant', 'Vous n\'avez pas assez de pièces d\'or pour ce don.');
      return;
    }

    this.gameState.gold.update(g => g - amount);
    this.gameState.guild.update(g => ({
      ...g,
      treasury: g.treasury + amount,
      members: g.members.map(m =>
        m.username === this.gameState.username()
          ? { ...m, donatedGold: (m.donatedGold || 0) + amount }
          : m
      ),
    }));

    this.sound.playCoins();
    this.toast.showReward(
      'Don Effectué !',
      `Vous avez fait don de ${amount} Or au Trésor de la Guilde.`,
      { badge: 'GUILDE', rarity: 'rare', icon: 'shield' }
    );
    this.gameState.triggerAutoSave();
  }
}
