import { ChangeDetectionStrategy, Component, computed, inject, output, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { EpicQuest, EpicQuestObjective } from '../../models/game.model';
import { QuestService } from '../../services/quest';
import { SoundService } from '../../services/sound';

type QuestFilter = 'all' | 'active' | 'claimable' | 'claimed';

@Component({
  selector: 'app-epic-quests',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <section class="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6 text-[#e0dcc7]">

      <!-- Editorial Header & Global Progress Bar -->
      <div class="bg-[#120f0c] border border-[#3a2f23] rounded-2xl p-6 md:p-8 shadow-xl space-y-5">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div class="space-y-1.5 max-w-2xl">
            <div class="flex flex-wrap items-center gap-2 text-xs text-[#8b6b43] font-cinzel font-semibold">
              <span>Registre Royal</span>
              <span aria-hidden="true">·</span>
              <span class="tabular-nums">{{ questService.completedCount() }} / {{ questService.totalQuestsCount() }} Quêtes accomplies</span>
              <span aria-hidden="true">·</span>
              <span class="text-[#d4af37] tabular-nums">{{ questService.totalGoldEarned() }} / {{ questService.totalPotentialGold() }} Or encaissé</span>
            </div>
            <h1 class="font-cinzel text-2xl md:text-3xl font-black text-[#e0dcc7] tracking-tight text-balance">
              Quêtes Épiques d'Aetheria
            </h1>
            <p class="text-sm text-[#c5a880]/90 leading-relaxed">
              Accomplissez des hauts faits sur les champs de bataille pour débloquer d’importantes bourses d’Or. Chaque action en Arène fait progresser vos objectifs en temps réel.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-3 shrink-0">
            <button
              (click)="navigateToArena.emit()"
              class="crimson-btn px-4 py-2 rounded-xl font-cinzel text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-transform active:scale-95">
              <mat-icon class="text-base">swords</mat-icon>
              <span>Combattre en Arène</span>
            </button>

            <button
              (click)="resetAll()"
              class="medieval-btn px-4 py-2 bg-[#1a1612] hover:bg-[#251f18] text-[#c5a880] hover:text-[#e0dcc7] rounded-xl border border-[#3a2f23] font-cinzel text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors">
              <mat-icon class="text-base">restart_alt</mat-icon>
              <span>Réinitialiser</span>
            </button>
          </div>
        </div>

        <!-- Global Quest Mastery Progress Bar -->
        <div class="pt-4 border-t border-[#3a2f23]/80 space-y-2">
          <div class="flex items-center justify-between gap-4 text-xs">
            <span class="font-cinzel font-semibold text-[#c5a880]">
              Progression globale de l'épopée
            </span>
            <div class="flex items-center gap-3 font-mono tabular-nums">
              @if (questService.claimableGoldTotal() > 0) {
                <span class="text-emerald-400 font-bold">
                  {{ questService.claimableGoldTotal() }} Or à réclamer
                </span>
              }
              <span class="text-[#d4af37] font-bold">
                {{ questService.overallProgressPct() }}%
              </span>
            </div>
          </div>

          <div
            class="w-full h-3.5 bg-[#0a0a0c] rounded-full border border-[#3a2f23] overflow-hidden p-0.5"
            role="progressbar"
            [attr.aria-valuenow]="questService.overallProgressPct()"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-label="Progression globale des quêtes épiques">
            <div
              class="h-full rounded-full transition-all duration-500 ease-out"
              [class.bg-gradient-to-r]="true"
              [class.from-emerald-500]="questService.overallProgressPct() >= 100"
              [class.to-emerald-300]="questService.overallProgressPct() >= 100"
              [class.from-[#8b6b43]]="questService.overallProgressPct() < 100"
              [class.via-[#d4af37]]="questService.overallProgressPct() < 100"
              [class.to-[#fbbf24]]="questService.overallProgressPct() < 100"
              [style.width.%]="questService.overallProgressPct()">
            </div>
          </div>
        </div>
      </div>

      <!-- Interactive Filter Bar -->
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="inline-flex flex-wrap items-center gap-1 p-1 bg-[#120f0c] border border-[#3a2f23] rounded-xl">
          <button
            (click)="setFilter('all')"
            class="px-3.5 py-2 rounded-lg text-xs font-cinzel font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            [class.bg-[#251f18]]="activeFilter() === 'all'"
            [class.text-[#ffd700]]="activeFilter() === 'all'"
            [class.text-[#8b6b43]]="activeFilter() !== 'all'"
            [class.hover:text-[#c5a880]]="activeFilter() !== 'all'">
            <mat-icon class="text-sm">list_alt</mat-icon>
            <span>Toutes ({{ questService.totalQuestsCount() }})</span>
          </button>

          <button
            (click)="setFilter('active')"
            class="px-3.5 py-2 rounded-lg text-xs font-cinzel font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            [class.bg-[#251f18]]="activeFilter() === 'active'"
            [class.text-[#ffd700]]="activeFilter() === 'active'"
            [class.text-[#8b6b43]]="activeFilter() !== 'active'"
            [class.hover:text-[#c5a880]]="activeFilter() !== 'active'">
            <mat-icon class="text-sm">explore</mat-icon>
            <span>En cours ({{ activeQuestsCount() }})</span>
          </button>

          <button
            (click)="setFilter('claimable')"
            class="px-3.5 py-2 rounded-lg text-xs font-cinzel font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            [class.bg-[#251f18]]="activeFilter() === 'claimable'"
            [class.text-emerald-300]="activeFilter() === 'claimable'"
            [class.text-[#8b6b43]]="activeFilter() !== 'claimable'"
            [class.hover:text-[#c5a880]]="activeFilter() !== 'claimable'">
            <mat-icon class="text-sm">savings</mat-icon>
            <span>À réclamer ({{ questService.claimableCount() }})</span>
          </button>

          <button
            (click)="setFilter('claimed')"
            class="px-3.5 py-2 rounded-lg text-xs font-cinzel font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            [class.bg-[#251f18]]="activeFilter() === 'claimed'"
            [class.text-[#ffd700]]="activeFilter() === 'claimed'"
            [class.text-[#8b6b43]]="activeFilter() !== 'claimed'"
            [class.hover:text-[#c5a880]]="activeFilter() !== 'claimed'">
            <mat-icon class="text-sm">task_alt</mat-icon>
            <span>Accomplies ({{ questService.claimedCount() }})</span>
          </button>
        </div>

        <span class="text-xs text-[#8b6b43] font-mono tabular-nums">
          {{ filteredQuests().length }} quête(s) affichée(s)
        </span>
      </div>

      <!-- Epic Quests Grid -->
      @if (filteredQuests().length === 0) {
        <div class="bg-[#120f0c] border border-[#3a2f23] rounded-2xl p-10 text-center space-y-3">
          <mat-icon class="text-4xl text-[#8b6b43]">auto_stories</mat-icon>
          <h2 class="font-cinzel text-lg font-bold text-[#c5a880]">Aucune quête dans ce filtre</h2>
          <p class="text-sm text-[#8b6b43] max-w-md mx-auto">
            Changez de filtre ou engagez un duel en Arène pour faire avancer vos quêtes épiques.
          </p>
        </div>
      } @else {
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
          @for (quest of filteredQuests(); track quest.id) {
            @let questPct = questService.getQuestProgressPct(quest);
            @let readyToClaim = quest.isCompleted && !quest.isClaimed;

            <article
              class="bg-[#120f0c] rounded-2xl p-5 md:p-6 border transition-colors flex flex-col justify-between gap-5"
              [class.border-emerald-500/60]="readyToClaim"
              [class.border-[#d4af37]/50]="quest.isClaimed"
              [class.border-[#3a2f23]]="!readyToClaim && !quest.isClaimed">

              <div class="space-y-4">
                <!-- Quest Header -->
                <div class="flex items-start justify-between gap-4">
                  <div class="flex items-start gap-3.5 min-w-0">
                    <div
                      class="w-11 h-11 rounded-xl border flex items-center justify-center shrink-0"
                      [class.bg-emerald-950/50]="quest.isCompleted"
                      [class.border-emerald-500/60]="quest.isCompleted"
                      [class.text-emerald-300]="quest.isCompleted"
                      [class.bg-[#1a1612]]="!quest.isCompleted"
                      [class.border-[#3a2f23]]="!quest.isCompleted"
                      [class.text-[#d4af37]]="!quest.isCompleted">
                      <mat-icon class="text-xl">{{ quest.isClaimed ? 'verified' : quest.icon }}</mat-icon>
                    </div>

                    <div class="min-w-0 space-y-1">
                      <div class="flex flex-wrap items-center gap-1.5 text-xs text-[#8b6b43] font-cinzel">
                        <span>{{ quest.chapter }}</span>
                        <span aria-hidden="true">·</span>
                        <span>Rang {{ quest.tier }}</span>
                        <span aria-hidden="true">·</span>
                        <span class="font-mono font-bold text-[#d4af37] tabular-nums">+{{ quest.rewardGold }} Or</span>
                      </div>
                      <h2 class="font-cinzel text-lg font-bold text-[#e0dcc7] leading-snug">
                        {{ quest.title }}
                      </h2>
                    </div>
                  </div>

                  <div class="text-right shrink-0">
                    <span
                      class="font-mono text-sm font-black tabular-nums"
                      [class.text-emerald-400]="quest.isCompleted"
                      [class.text-[#d4af37]]="!quest.isCompleted">
                      {{ questPct }}%
                    </span>
                  </div>
                </div>

                <p class="text-xs md:text-sm text-[#c5a880]/80 leading-relaxed">
                  {{ quest.lore }}
                </p>

                <!-- Overall Quest Progress Bar -->
                <div class="space-y-1.5">
                  <div class="flex items-center justify-between text-[11px]">
                    <span class="font-cinzel text-[#8b6b43]">
                      @if (quest.isClaimed) {
                        Récompense réclamée
                      } @else if (quest.isCompleted) {
                        Objectifs atteints · Prêt à réclamer
                      } @else {
                        Avancement global de la quête
                      }
                    </span>
                    <span class="font-mono tabular-nums text-[#c5a880]">
                      {{ completedObjectivesCount(quest) }} / {{ quest.objectives.length }} étapes
                    </span>
                  </div>
                  <div
                    class="w-full h-2.5 bg-[#0a0a0c] rounded-full border border-[#3a2f23] overflow-hidden"
                    role="progressbar"
                    [attr.aria-valuenow]="questPct"
                    aria-valuemin="0"
                    aria-valuemax="100"
                    [attr.aria-label]="'Progression de ' + quest.title">
                    <div
                      class="h-full rounded-full transition-all duration-500 ease-out"
                      [class.bg-emerald-500]="quest.isCompleted"
                      [class.bg-[#d4af37]]="!quest.isCompleted"
                      [style.width.%]="questPct">
                    </div>
                  </div>
                </div>

                <!-- Specific Objectives List with Individual Progress Bars -->
                <div class="pt-3 border-t border-[#3a2f23]/70 space-y-3">
                  @for (obj of quest.objectives; track obj.id) {
                    @let objPct = getObjectivePct(obj);
                    @let objDone = obj.current >= obj.target;

                    <div class="space-y-1.5">
                      <div class="flex items-center justify-between gap-3 text-xs">
                        <span
                          class="leading-snug"
                          [class.text-emerald-300]="objDone"
                          [class.text-[#e0dcc7]]="!objDone">
                          {{ obj.label }}
                        </span>
                        <span
                          class="font-mono font-bold tabular-nums shrink-0"
                          [class.text-emerald-400]="objDone"
                          [class.text-[#d4af37]]="!objDone">
                          {{ obj.current }} / {{ obj.target }} {{ obj.unitLabel }}
                        </span>
                      </div>

                      <div class="flex items-center gap-2">
                        <div class="flex-1 h-1.5 bg-[#0a0a0c] rounded-full overflow-hidden border border-[#3a2f23]/70">
                          <div
                            class="h-full rounded-full transition-all duration-300 ease-out"
                            [class.bg-emerald-400]="objDone"
                            [class.bg-[#c5a880]]="!objDone"
                            [style.width.%]="objPct">
                          </div>
                        </div>
                        @if (!quest.isCompleted && !objDone) {
                          <button
                            (click)="simulateObjectiveStep(quest.id, obj.id)"
                            class="px-2 py-1 rounded-md bg-[#1a1612] hover:bg-[#251f18] border border-[#3a2f23] text-[11px] font-mono font-bold text-[#c5a880] hover:text-[#ffd700] flex items-center gap-1 transition-colors whitespace-nowrap shrink-0"
                            title="Simuler une progression sur cet objectif">
                            <mat-icon class="text-xs">add</mat-icon>
                            <span>+{{ getStepIncrement(obj) }}</span>
                          </button>
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>

              <!-- Card Footer Action -->
              <div class="pt-3 border-t border-[#3a2f23]/70 flex flex-wrap items-center justify-between gap-3">
                <div class="flex items-center gap-1.5 text-xs font-cinzel text-[#d4af37] font-bold">
                  <mat-icon class="text-base">savings</mat-icon>
                  <span class="font-mono tabular-nums">{{ quest.rewardGold }} Pièces d'Or</span>
                </div>

                @if (readyToClaim) {
                  <button
                    (click)="claim(quest.id)"
                    class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-cinzel text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors whitespace-nowrap shrink-0">
                    <mat-icon class="text-base">redeem</mat-icon>
                    <span>Réclamer {{ quest.rewardGold }} Or</span>
                  </button>
                } @else if (quest.isClaimed) {
                  <div class="flex items-center gap-1.5 text-xs font-cinzel font-semibold text-emerald-400">
                    <mat-icon class="text-base">check_circle</mat-icon>
                    <span>Trésor encaissé</span>
                  </div>
                } @else {
                  <button
                    (click)="navigateToArena.emit()"
                    class="medieval-btn px-4 py-2 rounded-xl bg-[#1a1612] hover:bg-[#251f18] border border-[#8b6b43]/70 text-[#d4af37] font-cinzel text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0">
                    <mat-icon class="text-base">play_arrow</mat-icon>
                    <span>Poursuivre en Arène</span>
                  </button>
                }
              </div>
            </article>
          }
        </div>
      }
    </section>
  `,
})
export class EpicQuestsView {
  readonly questService = inject(QuestService);
  private readonly sound = inject(SoundService);

  readonly navigateToArena = output<void>();
  readonly activeFilter = signal<QuestFilter>('all');

  readonly activeQuestsCount = computed(() =>
    this.questService.quests().filter(q => !q.isCompleted).length
  );

  readonly filteredQuests = computed(() => {
    const filter = this.activeFilter();
    const list = this.questService.quests();
    switch (filter) {
      case 'active':
        return list.filter(q => !q.isCompleted);
      case 'claimable':
        return list.filter(q => q.isCompleted && !q.isClaimed);
      case 'claimed':
        return list.filter(q => q.isClaimed);
      default:
        return list;
    }
  });

  setFilter(filter: QuestFilter) {
    this.activeFilter.set(filter);
    this.sound.playClick();
  }

  getObjectivePct(obj: EpicQuestObjective): number {
    return this.questService.getObjectiveProgressPct(obj);
  }

  completedObjectivesCount(quest: EpicQuest): number {
    return quest.objectives.filter(o => o.current >= o.target).length;
  }

  getStepIncrement(obj: EpicQuestObjective): number {
    return obj.trigger === 'damage' ? 20 : 1;
  }

  simulateObjectiveStep(questId: string, objectiveId: string) {
    const quest = this.questService.quests().find(q => q.id === questId);
    const obj = quest?.objectives.find(o => o.id === objectiveId);
    const amount = obj ? this.getStepIncrement(obj) : 1;
    this.sound.playClick();
    this.questService.advanceQuest(questId, objectiveId, amount);
  }

  claim(questId: string) {
    this.questService.claimQuestReward(questId);
  }

  resetAll() {
    this.questService.resetQuests();
  }
}
