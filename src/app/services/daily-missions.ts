import { Injectable, signal, computed, inject } from '@angular/core';
import { DailyTacticalMission, TacticalMissionCategory, TacticalMissionDifficulty } from '../models/game.model';
import { GameStateService } from './game-state';
import { SoundService } from './sound';
import { ToastNotificationService } from './toast-notification';
import confetti from 'canvas-confetti';

interface ProceduralSlotConfig {
  slotIndex: number;
  category: TacticalMissionCategory;
  archetypes: {
    titleTemplates: string[];
    objectives: string[];
    tips: string[];
    unitLabel: string;
    icon: string;
    difficulty: TacticalMissionDifficulty;
    minTarget: number;
    maxTarget: number;
    baseGold: number;
    goldVariance: number;
    triggerType: 'combo' | 'mana' | 'spells' | 'invocations' | 'slay_minions' | 'taunt_shield' | 'damage' | 'battlecry' | 'wins' | 'high_hp_win' | 'ultimate' | 'fast_win';
  }[];
}

const PROCEDURAL_SLOTS: ProceduralSlotConfig[] = [
  // Slot 0: Synergies, Combos & Spells (Tactique & Magie)
  {
    slotIndex: 0,
    category: 'tactics',
    archetypes: [
      {
        titleTemplates: ['Maîtrise des Combos', 'Enchaînement Éclair', 'Séquence Tactique', 'Rythme de Bataille'],
        objectives: ['Exécutez {target} combos tactiques en jouant au moins 2 cartes durant le même tour.'],
        tips: ['Privilégiez les cartes à faible coût de mana pour enchaîner vos actions sans vous essouffler.'],
        unitLabel: 'Combos',
        icon: 'dynamic_feed',
        difficulty: 'Standard',
        minTarget: 3,
        maxTarget: 5,
        baseGold: 320,
        goldVariance: 80,
        triggerType: 'combo',
      },
      {
        titleTemplates: ['Flux des Arcanes', 'Tempête de Sorts', 'Catalyse Élémentaire', 'Déflagration Tactique'],
        objectives: ['Lancez {target} sorts offensifs ou défensifs lors de vos affrontements.'],
        tips: ['Les héros Mages et Paladins possèdent de puissants sorts rapides pour contrôler le rythme.'],
        unitLabel: 'Sorts',
        icon: 'auto_fix_high',
        difficulty: 'Standard',
        minTarget: 4,
        maxTarget: 6,
        baseGold: 350,
        goldVariance: 90,
        triggerType: 'spells',
      },
      {
        titleTemplates: ['Déferlement de Troupes', 'Appel des Sentinelles', 'Régiment d’Aether', 'Marée d’Infanterie'],
        objectives: ['Invoquez {target} créatures sur votre champ de bataille tactique.'],
        tips: ['Inondez le plateau de serviteurs pour obliger l’adversaire à gaspiller ses sorts de zone.'],
        unitLabel: 'Créatures',
        icon: 'groups',
        difficulty: 'Standard',
        minTarget: 6,
        maxTarget: 10,
        baseGold: 300,
        goldVariance: 80,
        triggerType: 'invocations',
      },
      {
        titleTemplates: ['Afflux de Mana Primordial', 'Surpression Mystique', 'Résonance des Éthers', 'Cristallisation'],
        objectives: ['Dépensez au moins 6 points de Mana en un tour décisif {target} fois.'],
        tips: ['Attendez le milieu de partie (Tour 5+) pour rentabiliser vos cartes légendaires coûteuses.'],
        unitLabel: 'Tours Majeurs',
        icon: 'bolt',
        difficulty: 'Standard',
        minTarget: 2,
        maxTarget: 4,
        baseGold: 340,
        goldVariance: 70,
        triggerType: 'mana',
      },
    ],
  },
  // Slot 1: Battlefield Control & Defensive Warfare (Combat & Défense)
  {
    slotIndex: 1,
    category: 'combat',
    archetypes: [
      {
        titleTemplates: ['Brise-Lignes Ennemies', 'Nettoyage du Plateau', 'Fléau des Serviteurs', 'Chasse Impitoyable'],
        objectives: ['Éliminez {target} serviteurs adverses par vos assauts ou vos sorts ciblés.'],
        tips: ['Contrôler le champ de bataille est la clé pour empêcher l’adversaire de masser des attaques.'],
        unitLabel: 'Serviteurs Vaincus',
        icon: 'shield_with_heart',
        difficulty: 'Vétéran',
        minTarget: 5,
        maxTarget: 8,
        baseGold: 450,
        goldVariance: 100,
        triggerType: 'slay_minions',
      },
      {
        titleTemplates: ['Rempart d’Acier & Foi', 'Ligne Infranchissable', 'Garde Prétorienne', 'Bouclier de Lumière'],
        objectives: ['Déployez {target} créatures protégées par Provocation ou Bouclier Divin.'],
        tips: ['Les créatures protectrices absorbent les chocs et forcent l’ennemi à perdre ses meilleurs atouts.'],
        unitLabel: 'Protecteurs',
        icon: 'security',
        difficulty: 'Vétéran',
        minTarget: 3,
        maxTarget: 5,
        baseGold: 480,
        goldVariance: 90,
        triggerType: 'taunt_shield',
      },
      {
        titleTemplates: ['Frappes Dévastatrices', 'Pluie de Météores', 'Impact Cataclysmique', 'Fureur de Guerre'],
        objectives: ['Infligez un total de {target} points de dégâts cumulés aux forces adverses.'],
        tips: ['Combinez les attaques directes de vos créatures avec des sorts perçants pour gonfler le compteur.'],
        unitLabel: 'Dégâts',
        icon: 'local_fire_department',
        difficulty: 'Vétéran',
        minTarget: 35,
        maxTarget: 55,
        baseGold: 500,
        goldVariance: 110,
        triggerType: 'damage',
      },
      {
        titleTemplates: ['Ralliement Décisif', 'Cri de Guerre Héroïque', 'Ordre de Charge', 'Écho de Commandement'],
        objectives: ['Déclenchez {target} effets \'Cri de Guerre\' en invoquant vos troupes d\'élite.'],
        tips: ['Les créatures dotées de Cri de Guerre procurent un avantage tactique immédiat dès leur arrivée.'],
        unitLabel: 'Cris de Guerre',
        icon: 'campaign',
        difficulty: 'Vétéran',
        minTarget: 4,
        maxTarget: 7,
        baseGold: 440,
        goldVariance: 90,
        triggerType: 'battlecry',
      },
    ],
  },
  // Slot 2: Heroic Trials & Tactical Mastery (Survie & Victoire Suprême)
  {
    slotIndex: 2,
    category: 'survival',
    archetypes: [
      {
        titleTemplates: ['Triomphe de l’Arène', 'Conquête Tactique', 'Gloire du Duelliste', 'Souveraineté Martiale'],
        objectives: ['Remportez {target} victoires décisives dans l’Arène, en Duel ou en Campagne.'],
        tips: ['Affrontez l\'IA en duel rapide ou défiez de redoutables rivaux en arène classée.'],
        unitLabel: 'Victoires',
        icon: 'military_tech',
        difficulty: 'Héroïque',
        minTarget: 2,
        maxTarget: 3,
        baseGold: 650,
        goldVariance: 120,
        triggerType: 'wins',
      },
      {
        titleTemplates: ['Bastion Inébranlable', 'Santé de Fer', 'Préservation Impériale', 'Victoire Sans Failon'],
        objectives: ['Remportez un combat en conservant au moins 18 PV sur votre Héros à la fin du duel.'],
        tips: ['Utilisez des créatures Provocation et des sorts de soin pour maintenir votre héros hors de danger.'],
        unitLabel: 'Victoire Robuste',
        icon: 'favorite',
        difficulty: 'Héroïque',
        minTarget: 1,
        maxTarget: 1,
        baseGold: 700,
        goldVariance: 100,
        triggerType: 'high_hp_win',
      },
      {
        titleTemplates: ['Déchaînement Ultime', 'Sentence Astrale', 'Pouvoir du Monarque', 'Frappe Finale'],
        objectives: ['Déclenchez l’Ultime de votre Héros {target} fois pour subjuguer l’ennemi.'],
        tips: ['Chaque tour écoulé fait monter votre jauge d’Énergie Ultime. Déclenchez-la au moment opportun !'],
        unitLabel: 'Ultimes',
        icon: 'flare',
        difficulty: 'Héroïque',
        minTarget: 1,
        maxTarget: 2,
        baseGold: 620,
        goldVariance: 130,
        triggerType: 'ultimate',
      },
      {
        titleTemplates: ['Guerre Éclair Tactique', 'Frappe Préventive', 'Blitzkrieg d’Aether', 'Assaut Foudroyant'],
        objectives: ['Terrassez votre adversaire et remportez le duel en 8 tours ou moins.'],
        tips: ['Privilégiez une stratégie agressive (Aggro) axée sur les créatures rapides et les sorts de dégâts directs.'],
        unitLabel: 'Victoire Rapide',
        icon: 'speed',
        difficulty: 'Héroïque',
        minTarget: 1,
        maxTarget: 1,
        baseGold: 750,
        goldVariance: 100,
        triggerType: 'fast_win',
      },
    ],
  },
];

@Injectable({
  providedIn: 'root',
})
export class DailyMissionsService {
  private readonly gameState = inject(GameStateService);
  private readonly sound = inject(SoundService);
  private readonly toast = inject(ToastNotificationService);

  // Active missions signal (always exactly 3)
  readonly missions = signal<DailyTacticalMission[]>([]);

  // Grand Chest completion state
  readonly hasClaimedGrandChest = signal<boolean>(false);
  readonly grandChestGoldBonus = 500;

  // Time remaining until daily midnight reset
  readonly timeRemaining = signal<string>('00h 00m 00s');

  // Computed properties
  readonly completedCount = computed(() => {
    return this.missions().filter(m => m.isCompleted).length;
  });

  readonly claimedCount = computed(() => {
    return this.missions().filter(m => m.isClaimed).length;
  });

  readonly totalPotentialGold = computed(() => {
    const missionsGold = this.missions().reduce((acc, m) => acc + m.rewardGold, 0);
    return missionsGold + this.grandChestGoldBonus;
  });

  readonly claimableGoldTotal = computed(() => {
    return this.missions()
      .filter(m => m.isCompleted && !m.isClaimed)
      .reduce((acc, m) => acc + m.rewardGold, 0);
  });

  readonly hasClaimableRewards = computed(() => {
    return this.missions().some(m => m.isCompleted && !m.isClaimed) || (this.allMissionsClaimed() && !this.hasClaimedGrandChest());
  });

  readonly allMissionsCompleted = computed(() => {
    const list = this.missions();
    return list.length === 3 && list.every(m => m.isCompleted);
  });

  readonly allMissionsClaimed = computed(() => {
    const list = this.missions();
    return list.length === 3 && list.every(m => m.isClaimed);
  });

  constructor() {
    this.initializeDailyMissions();
    this.startCountdownTimer();
  }

  /**
   * Returns current day key formatted as "YYYY-MM-DD"
   */
  getTodayKey(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Deterministic simple hash from string seed
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return Math.abs(hash);
  }

  /**
   * Procedurally generates three daily missions from a given day key and optional seed salt
   */
  generateMissionsForDate(dayKey: string, salt = 0): DailyTacticalMission[] {
    const dayHash = this.hashString(`${dayKey}_aetheria_salt_${salt}`);

    return PROCEDURAL_SLOTS.map((slotConfig, slotIdx) => {
      // Pick archetype using pseudo-random step
      const archetypeIndex = (dayHash + slotIdx * 17) % slotConfig.archetypes.length;
      const archetype = slotConfig.archetypes[archetypeIndex];

      // Pick title variation
      const titleIndex = (dayHash + slotIdx * 31) % archetype.titleTemplates.length;
      const title = archetype.titleTemplates[titleIndex];

      // Calculate target
      const targetRange = Math.max(1, archetype.maxTarget - archetype.minTarget + 1);
      const targetDelta = ((dayHash + slotIdx * 43) % targetRange);
      const target = archetype.minTarget + targetDelta;

      // Calculate reward gold (rounded to tens)
      const goldDelta = ((dayHash + slotIdx * 59) % (archetype.goldVariance + 1));
      const rewardGold = Math.round((archetype.baseGold + goldDelta) / 10) * 10;

      // Build tactical objective text
      const tacticalObjective = archetype.objectives[0].replace('{target}', String(target));
      const tacticalTip = archetype.tips[0];

      const loreBriefings: Record<TacticalMissionDifficulty, string> = {
        Standard: 'Ordre du Conseil des Sentinelles : Affûtez vos réflexes et appliquez la discipline des premiers cercles.',
        Vétéran: 'Édit du Maréchal d’Aether : Les combats s’intensifient. Faites plier les lignes adverses avec rigueur.',
        Héroïque: 'Épreuve des Anciens Monarques : Un haut fait chevaleresque exigé des plus grands stratèges du royaume.',
      };

      return {
        id: `mission_${dayKey}_slot${slotIdx}`,
        slotIndex: slotIdx,
        dayKey,
        title,
        tacticalObjective,
        loreBriefing: loreBriefings[archetype.difficulty],
        tacticalTip,
        category: slotConfig.category,
        difficulty: archetype.difficulty,
        icon: archetype.icon,
        target,
        current: 0,
        rewardGold,
        isCompleted: false,
        isClaimed: false,
        unitLabel: archetype.unitLabel,
      };
    });
  }

  /**
   * Initializes or loads daily missions from local storage
   */
  initializeDailyMissions() {
    if (typeof window === 'undefined') return;

    const todayKey = this.getTodayKey();
    const savedRaw = localStorage.getItem('aetheria_daily_tactical_missions');

    if (savedRaw) {
      try {
        const savedData = JSON.parse(savedRaw);
        if (savedData.dayKey === todayKey && Array.isArray(savedData.missions) && savedData.missions.length === 3) {
          this.missions.set(savedData.missions);
          this.hasClaimedGrandChest.set(!!savedData.hasClaimedGrandChest);
          return;
        }
      } catch (e) {
        console.warn('Failed to parse saved daily missions', e);
      }
    }

    // Generate fresh missions for today
    const freshMissions = this.generateMissionsForDate(todayKey);
    this.missions.set(freshMissions);
    this.hasClaimedGrandChest.set(false);
    this.persistMissions();
  }

  /**
   * Saves current missions to local storage
   */
  private persistMissions() {
    if (typeof window === 'undefined') return;
    try {
      const dataToSave = {
        dayKey: this.getTodayKey(),
        missions: this.missions(),
        hasClaimedGrandChest: this.hasClaimedGrandChest(),
      };
      localStorage.setItem('aetheria_daily_tactical_missions', JSON.stringify(dataToSave));
    } catch (e) {
      console.warn('Failed to save daily missions', e);
    }
  }

  /**
   * Increments progress of a specific mission
   */
  advanceMission(missionId: string, step = 1) {
    const list = this.missions();
    const targetMission = list.find(m => m.id === missionId);
    if (!targetMission || targetMission.isCompleted) return;

    const newCurrent = Math.min(targetMission.target, targetMission.current + step);
    const becameCompleted = newCurrent >= targetMission.target && !targetMission.isCompleted;

    this.missions.update(items =>
      items.map(m => {
        if (m.id === missionId) {
          return {
            ...m,
            current: newCurrent,
            isCompleted: newCurrent >= m.target,
          };
        }
        return m;
      })
    );

    this.persistMissions();

    if (becameCompleted) {
      this.sound.playCardSummon('legendary');
      this.toast.showReward(
        'Objectif Tactique Validé !',
        `Mission complétée : "${targetMission.title}". Récompense de ${targetMission.rewardGold} Or prête à être réclamée !`,
        { badge: 'OBJECTIF ATTEINT', rarity: 'epic', icon: 'task_alt' }
      );
    } else {
      this.sound.playClick();
    }
  }

  /**
   * Increments missions matching a specific trigger type
   */
  advanceByTrigger(
    trigger: 'combo' | 'mana' | 'spells' | 'invocations' | 'slay_minions' | 'taunt_shield' | 'damage' | 'battlecry' | 'wins' | 'high_hp_win' | 'ultimate' | 'fast_win',
    amount = 1
  ) {
    const list = this.missions();
    list.forEach(m => {
      if (m.isCompleted) return;

      // Check slot archetypes to see if this matches
      const slotConfig = PROCEDURAL_SLOTS[m.slotIndex];
      const match = slotConfig?.archetypes.some(a => a.triggerType === trigger);
      if (match) {
        this.advanceMission(m.id, amount);
      }
    });
  }

  /**
   * Claims a completed mission and rewards the user with in-game gold
   */
  claimMission(missionId: string): boolean {
    const mission = this.missions().find(m => m.id === missionId);
    if (!mission || !mission.isCompleted || mission.isClaimed) {
      return false;
    }

    // Mark as claimed
    this.missions.update(items =>
      items.map(m => (m.id === missionId ? { ...m, isClaimed: true } : m))
    );

    // Reward in-game gold to user state
    this.gameState.addGold(mission.rewardGold);

    // Audio & celebratory particle feedback
    this.sound.playVictory();
    this.sound.playCoins();

    try {
      confetti({
        particleCount: 75,
        spread: 55,
        origin: { y: 0.65 },
        colors: ['#f59e0b', '#fbbf24', '#e0dcc7', '#10b981'],
      });
    } catch {
      // Ignored if non-browser
    }

    // Toast notification
    this.toast.showReward(
      'Récompense d\'Or Encaissée !',
      `+${mission.rewardGold} Pièces d'Or ajoutées à votre trésor pour "${mission.title}".`,
      { badge: 'OR REÇU', rarity: 'legendary', icon: 'savings' }
    );

    this.persistMissions();
    return true;
  }

  /**
   * Claims the Grand Tactical Chest when all 3 daily missions are completed
   */
  claimGrandChest(): boolean {
    if (!this.allMissionsClaimed() || this.hasClaimedGrandChest()) {
      return false;
    }

    this.hasClaimedGrandChest.set(true);
    this.gameState.addGold(this.grandChestGoldBonus);
    this.sound.playVictory();
    this.sound.playCoins();

    try {
      confetti({
        particleCount: 120,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#fbbf24', '#f59e0b', '#38bdf8', '#c084fc'],
      });
    } catch {
      // Ignored if non-browser
    }

    this.toast.showReward(
      'Grand Coffre Tactique Déverrouillé !',
      `Toutes les missions du jour sont accomplies ! +${this.grandChestGoldBonus} Pièces d'Or bonus royal ajoutées !`,
      { badge: 'TRIOMPHE QUOTIDIEN', rarity: 'mythic', icon: 'workspace_premium' }
    );

    this.persistMissions();
    return true;
  }

  /**
   * Simulates a procedural daily refresh (useful for testing or rerolling)
   */
  rerollOrSimulateNewDay() {
    const randomSalt = Math.floor(Math.random() * 100000);
    const fresh = this.generateMissionsForDate(this.getTodayKey(), randomSalt);
    this.missions.set(fresh);
    this.hasClaimedGrandChest.set(false);
    this.persistMissions();
    this.sound.playCardDraw();
    this.toast.showSystem(
      'Missions Tactiques Régénérées',
      'Trois nouveaux objectifs procéduraux ont été forgés pour vos troupes.',
      'auto_awesome'
    );
  }

  /**
   * Starts a 1-second interval calculating remaining time until midnight
   */
  private startCountdownTimer() {
    if (typeof window === 'undefined') return;

    const updateTimer = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);

      const diffMs = midnight.getTime() - now.getTime();
      if (diffMs <= 0) {
        this.timeRemaining.set('00h 00m 00s');
        this.initializeDailyMissions();
        return;
      }

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      const formatted = `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
      this.timeRemaining.set(formatted);
    };

    updateTimer();
    setInterval(updateTimer, 1000);
  }
}
