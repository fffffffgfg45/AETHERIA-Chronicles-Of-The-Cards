import { Injectable, computed, inject, signal } from '@angular/core';
import {
  EpicQuest,
  EpicQuestObjective,
  EpicQuestTrigger,
} from '../models/game.model';
import { GameStateService } from './game-state';
import { SoundService } from './sound';
import { ToastNotificationService } from './toast-notification';
import confetti from 'canvas-confetti';

const STORAGE_KEY = 'aetheria_epic_quests_v1';

const INITIAL_EPIC_QUESTS: EpicQuest[] = [
  {
    id: 'quest_crusade_aether',
    title: "La Croisade d'Aether",
    lore: 'Prouvez votre valeur sur les champs de bataille de la Citadelle en brisant les lignes ennemies et en remportant vos premiers duels décisifs.',
    chapter: 'Chapitre I',
    tier: 'Chevalier',
    icon: 'swords',
    rewardGold: 900,
    isCompleted: false,
    isClaimed: false,
    objectives: [
      {
        id: 'obj_crusade_wins',
        label: 'Remporter des duels dans l’Arène ou la Campagne',
        trigger: 'wins',
        current: 0,
        target: 3,
        unitLabel: 'Victoires',
      },
      {
        id: 'obj_crusade_damage',
        label: 'Infliger des dégâts cumulés aux forces adverses',
        trigger: 'damage',
        current: 0,
        target: 80,
        unitLabel: 'Dégâts',
      },
    ],
  },
  {
    id: 'quest_archmage_sanctuary',
    title: 'Archimage du Sanctuaire',
    lore: 'Canalisez les courants arcaniques pour tisser des enchaînements de sorts et submerger votre adversaire sous la magie.',
    chapter: 'Chapitre II',
    tier: 'Chevalier',
    icon: 'auto_fix_high',
    rewardGold: 1100,
    isCompleted: false,
    isClaimed: false,
    objectives: [
      {
        id: 'obj_archmage_spells',
        label: 'Lancer des sorts offensifs ou curatifs en combat',
        trigger: 'spells',
        current: 0,
        target: 10,
        unitLabel: 'Sorts',
      },
      {
        id: 'obj_archmage_combos',
        label: 'Réaliser des enchaînements tactiques (2+ cartes/tour)',
        trigger: 'combo',
        current: 0,
        target: 6,
        unitLabel: 'Combos',
      },
    ],
  },
  {
    id: 'quest_lord_of_legions',
    title: 'Seigneur des Légions',
    lore: 'Rassemblez une armée disciplinée derrière un mur de boucliers divins et faites résonner les cris de ralliement.',
    chapter: 'Chapitre III',
    tier: 'Champion',
    icon: 'shield',
    rewardGold: 1350,
    isCompleted: false,
    isClaimed: false,
    objectives: [
      {
        id: 'obj_legions_invocations',
        label: 'Invoquer des créatures sur le champ de bataille',
        trigger: 'invocations',
        current: 0,
        target: 15,
        unitLabel: 'Invocations',
      },
      {
        id: 'obj_legions_guards',
        label: 'Déployer des troupes avec Provocation ou Bouclier Divin',
        trigger: 'taunt_shield',
        current: 0,
        target: 5,
        unitLabel: 'Protecteurs',
      },
      {
        id: 'obj_legions_battlecry',
        label: 'Déclencher des effets Cri de Guerre',
        trigger: 'battlecry',
        current: 0,
        target: 6,
        unitLabel: 'Cris de Guerre',
      },
    ],
  },
  {
    id: 'quest_arena_scourge',
    title: "Fléau de l'Arène",
    lore: 'Ne laissez aucun répit aux serviteurs ennemis et libérez la puissance ultime de votre Héros pour sceller leur défaite.',
    chapter: 'Chapitre IV',
    tier: 'Champion',
    icon: 'local_fire_department',
    rewardGold: 1600,
    isCompleted: false,
    isClaimed: false,
    objectives: [
      {
        id: 'obj_scourge_slay',
        label: 'Éliminer des créatures adverses en duel',
        trigger: 'slay_minions',
        current: 0,
        target: 14,
        unitLabel: 'Serviteurs vaincus',
      },
      {
        id: 'obj_scourge_ultimate',
        label: 'Déchaîner la capacité Ultime de votre Héros',
        trigger: 'ultimate',
        current: 0,
        target: 3,
        unitLabel: 'Ultimes',
      },
    ],
  },
  {
    id: 'quest_lightning_triumph',
    title: 'Triomphe Éclair',
    lore: 'Seuls les plus fins stratèges savent écraser l’ennemi avant que le siège ne s’enlise tout en préservant leur garde intacte.',
    chapter: 'Chapitre V',
    tier: 'Mythique',
    icon: 'bolt',
    rewardGold: 2000,
    isCompleted: false,
    isClaimed: false,
    objectives: [
      {
        id: 'obj_triumph_fast',
        label: 'Remporter un duel en 8 tours ou moins',
        trigger: 'fast_win',
        current: 0,
        target: 2,
        unitLabel: 'Victoires rapides',
      },
      {
        id: 'obj_triumph_hp',
        label: 'Triompher en conservant au moins 18 PV sur votre Héros',
        trigger: 'high_hp_win',
        current: 0,
        target: 2,
        unitLabel: 'Victoires robustes',
      },
    ],
  },
  {
    id: 'quest_immortal_legend',
    title: "Légende Immortelle d'Aetheria",
    lore: 'Gravissez les plus hauts échelons de la Citadelle par une maîtrise totale de l’acier, des arcanes et du commandement.',
    chapter: 'Chapitre VI',
    tier: 'Mythique',
    icon: 'workspace_premium',
    rewardGold: 2500,
    isCompleted: false,
    isClaimed: false,
    objectives: [
      {
        id: 'obj_legend_wins',
        label: 'Cumuler des victoires épiques',
        trigger: 'wins',
        current: 0,
        target: 8,
        unitLabel: 'Victoires',
      },
      {
        id: 'obj_legend_damage',
        label: 'Infliger des dégâts dévastateurs',
        trigger: 'damage',
        current: 0,
        target: 220,
        unitLabel: 'Dégâts',
      },
      {
        id: 'obj_legend_slay',
        label: 'Terrasser des serviteurs adverses',
        trigger: 'slay_minions',
        current: 0,
        target: 25,
        unitLabel: 'Serviteurs vaincus',
      },
    ],
  },
];

@Injectable({
  providedIn: 'root',
})
export class QuestService {
  private readonly gameState = inject(GameStateService);
  private readonly sound = inject(SoundService);
  private readonly toast = inject(ToastNotificationService);

  readonly quests = signal<EpicQuest[]>(this.loadQuests());

  readonly totalQuestsCount = computed(() => this.quests().length);

  readonly completedCount = computed(() =>
    this.quests().filter(q => q.isCompleted).length
  );

  readonly claimedCount = computed(() =>
    this.quests().filter(q => q.isClaimed).length
  );

  readonly claimableCount = computed(() =>
    this.quests().filter(q => q.isCompleted && !q.isClaimed).length
  );

  readonly hasClaimableRewards = computed(() => this.claimableCount() > 0);

  readonly claimableGoldTotal = computed(() =>
    this.quests()
      .filter(q => q.isCompleted && !q.isClaimed)
      .reduce((acc, q) => acc + q.rewardGold, 0)
  );

  readonly totalGoldEarned = computed(() =>
    this.quests()
      .filter(q => q.isClaimed)
      .reduce((acc, q) => acc + q.rewardGold, 0)
  );

  readonly totalPotentialGold = computed(() =>
    this.quests().reduce((acc, q) => acc + q.rewardGold, 0)
  );

  readonly overallProgressPct = computed(() => {
    const list = this.quests();
    if (list.length === 0) return 0;
    const totalPct = list.reduce((sum, q) => sum + this.getQuestProgressPct(q), 0);
    return Math.round(totalPct / list.length);
  });

  readonly featuredActiveQuest = computed<EpicQuest | null>(() => {
    const list = this.quests();
    const claimable = list.find(q => q.isCompleted && !q.isClaimed);
    if (claimable) return claimable;
    const inProgress = list.find(q => !q.isCompleted);
    return inProgress ?? list[0] ?? null;
  });

  getObjectiveProgressPct(obj: EpicQuestObjective): number {
    if (obj.target <= 0) return 100;
    return Math.min(100, Math.round((obj.current / obj.target) * 100));
  }

  getQuestProgressPct(quest: EpicQuest): number {
    if (quest.objectives.length === 0) return quest.isCompleted ? 100 : 0;
    const sum = quest.objectives.reduce(
      (acc, obj) => acc + Math.min(1, obj.current / Math.max(1, obj.target)),
      0
    );
    return Math.min(100, Math.round((sum / quest.objectives.length) * 100));
  }

  advanceQuest(questId: string, objectiveId?: string, amount = 1) {
    if (amount <= 0) return;

    let completedQuest: EpicQuest | null = null;
    let didProgress = false;

    this.quests.update(list =>
      list.map(q => {
        if (q.id !== questId || q.isCompleted) return q;

        const targetObj = objectiveId
          ? q.objectives.find(o => o.id === objectiveId && o.current < o.target)
          : q.objectives.find(o => o.current < o.target);

        if (!targetObj) return q;

        didProgress = true;
        const updatedObjectives = q.objectives.map(obj => {
          if (obj.id !== targetObj.id) return obj;
          return {
            ...obj,
            current: Math.min(obj.target, obj.current + amount),
          };
        });

        const nowCompleted = updatedObjectives.every(o => o.current >= o.target);
        const updatedQuest: EpicQuest = {
          ...q,
          objectives: updatedObjectives,
          isCompleted: nowCompleted,
        };

        if (nowCompleted && !q.isCompleted) {
          completedQuest = updatedQuest;
        }

        return updatedQuest;
      })
    );

    if (!didProgress) return;
    this.persistQuests();

    if (completedQuest) {
      const done = completedQuest as EpicQuest;
      this.sound.playCardSummon('legendary');
      this.toast.showReward(
        'Quête Épique Accomplie !',
        `« ${done.title} » terminée ! Réclamez votre récompense de ${done.rewardGold} Or.`,
        { badge: 'QUÊTE ÉPIQUE', rarity: 'legendary', icon: done.icon }
      );
    }
  }

  advanceByTrigger(trigger: EpicQuestTrigger, amount = 1) {
    if (amount <= 0) return;

    const newlyCompleted: EpicQuest[] = [];
    let anyChanged = false;

    this.quests.update(list =>
      list.map(q => {
        if (q.isCompleted) return q;

        let questChanged = false;
        const updatedObjectives = q.objectives.map(obj => {
          if (obj.trigger !== trigger || obj.current >= obj.target) return obj;
          questChanged = true;
          anyChanged = true;
          return {
            ...obj,
            current: Math.min(obj.target, obj.current + amount),
          };
        });

        if (!questChanged) return q;

        const nowCompleted = updatedObjectives.every(o => o.current >= o.target);
        const updatedQuest: EpicQuest = {
          ...q,
          objectives: updatedObjectives,
          isCompleted: nowCompleted,
        };

        if (nowCompleted) {
          newlyCompleted.push(updatedQuest);
        }

        return updatedQuest;
      })
    );

    if (!anyChanged) return;
    this.persistQuests();

    for (const done of newlyCompleted) {
      this.sound.playCardSummon('legendary');
      this.toast.showReward(
        'Quête Épique Accomplie !',
        `« ${done.title} » terminée ! Réclamez ${done.rewardGold} Or dans votre journal de quêtes.`,
        { badge: 'QUÊTE ÉPIQUE', rarity: 'legendary', icon: done.icon }
      );
    }
  }

  claimQuestReward(questId: string): boolean {
    const target = this.quests().find(q => q.id === questId);
    if (!target || !target.isCompleted || target.isClaimed) {
      return false;
    }

    this.quests.update(list =>
      list.map(q => (q.id === questId ? { ...q, isClaimed: true } : q))
    );

    this.gameState.addGold(target.rewardGold);
    this.sound.playVictory();
    this.sound.playCoins();

    try {
      confetti({
        particleCount: 95,
        spread: 65,
        origin: { y: 0.65 },
        colors: ['#d4af37', '#fbbf24', '#10b981', '#e0dcc7'],
      });
    } catch {
      // Ignored in non-browser contexts
    }

    this.toast.showReward(
      'Trésor de Quête Épique Reçu !',
      `+${target.rewardGold} Pièces d'Or ajoutées pour « ${target.title} ».`,
      { badge: 'OR ÉPIQUE', rarity: 'mythic', icon: 'savings' }
    );

    this.persistQuests();
    return true;
  }

  resetQuests() {
    const fresh = this.cloneInitialQuests();
    this.quests.set(fresh);
    this.persistQuests();
    this.sound.playClick();
    this.toast.showSystem(
      'Quêtes Épiques Réinitialisées',
      'Le registre des quêtes d’Aetheria a été remis à neuf.',
      'restart_alt'
    );
  }

  private cloneInitialQuests(): EpicQuest[] {
    return INITIAL_EPIC_QUESTS.map(q => ({
      ...q,
      objectives: q.objectives.map(o => ({ ...o })),
    }));
  }

  private loadQuests(): EpicQuest[] {
    if (typeof window === 'undefined') {
      return this.cloneInitialQuests();
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return this.cloneInitialQuests();

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return this.cloneInitialQuests();

      const savedById = new Map<string, EpicQuest>();
      for (const item of parsed) {
        if (item && typeof item.id === 'string') {
          savedById.set(item.id, item as EpicQuest);
        }
      }

      return INITIAL_EPIC_QUESTS.map(template => {
        const saved = savedById.get(template.id);
        if (!saved || !Array.isArray(saved.objectives)) {
          return {
            ...template,
            objectives: template.objectives.map(o => ({ ...o })),
          };
        }

        const mergedObjectives = template.objectives.map(objTemplate => {
          const savedObj = saved.objectives.find(o => o.id === objTemplate.id);
          const current = savedObj && typeof savedObj.current === 'number'
            ? Math.max(0, Math.min(objTemplate.target, savedObj.current))
            : 0;
          return {
            ...objTemplate,
            current,
          };
        });

        const isCompleted = mergedObjectives.every(o => o.current >= o.target);
        return {
          ...template,
          objectives: mergedObjectives,
          isCompleted,
          isClaimed: isCompleted && !!saved.isClaimed,
        };
      });
    } catch {
      return this.cloneInitialQuests();
    }
  }

  private persistQuests() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.quests()));
    } catch {
      // Ignore storage quota errors
    }
  }
}
