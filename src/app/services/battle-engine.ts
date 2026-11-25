import { Injectable, signal, computed, inject } from '@angular/core';
import {
  BattleState,
  BattleMinion,
  Card,
  HeroClass,
  CombatLogEntry,
  FloatingDamage,
  StoryMission,
  CustomDuelConfig
} from '../models/game.model';
import { GameStateService } from './game-state';
import { SoundService } from './sound';
import { DailyMissionsService } from './daily-missions';
import { QuestService } from './quest';
import { HERO_PORTRAITS } from '../data/heroes-database';
import { resolveCardImageUrl } from '../data/cards-database';
import confetti from 'canvas-confetti';

export interface CombatPreview {
  valid: boolean;
  reason?: string;
  label: string;
  subLabel?: string;
  isLethal: boolean;
  isBlocked: boolean;
  absorbsShield: boolean;
  tone: 'damage' | 'heal' | 'blocked';
}

export interface GuidedPhaseInfo {
  title: string;
  detail: string;
  tone: 'neutral' | 'spell' | 'attack' | 'taunt' | 'warning' | 'ai' | 'ready_end';
  canCancel: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class BattleEngineService {
  private gameState = inject(GameStateService);
  private sound = inject(SoundService);
  private dailyMissionsService = inject(DailyMissionsService);
  private questService = inject(QuestService);

  readonly isSearchingMatch = signal<boolean>(false);
  readonly searchSeconds = signal<number>(0);
  private searchTimer: ReturnType<typeof setInterval> | null = null;

  readonly battleState = signal<BattleState | null>(null);
  readonly isCombatIntroPlaying = signal<boolean>(false);
  readonly floatingDamages = signal<FloatingDamage[]>([]);
  readonly selectedHandCard = signal<Card | null>(null);
  readonly targetingMode = signal<'spell' | 'minion_attack' | null>(null);
  readonly spellTargetSide = signal<'enemy' | 'ally' | null>(null);
  readonly attackingMinion = signal<BattleMinion | null>(null);
  readonly actionFeedback = signal<{ message: string; tone: 'warning' | 'info' } | null>(null);
  readonly damageDealtThisMatch = signal<number>(0);

  private turnInterval: ReturnType<typeof setInterval> | null = null;
  private feedbackTimeout: ReturnType<typeof setTimeout> | null = null;

  // Derived Combat Guidance Signals
  readonly hasEnemyTaunt = computed<boolean>(() => {
    const b = this.battleState();
    return b ? b.opponentBoard.some(m => m.taunt) : false;
  });

  readonly playableHandCount = computed<number>(() => {
    const b = this.battleState();
    if (!b || b.currentTurn !== 'player' || b.isResolvingTurn) return 0;
    return b.playerHand.filter(c => {
      if (c.cost > b.playerMana) return false;
      if (c.type === 'creature' && b.playerBoard.length >= 7) return false;
      return true;
    }).length;
  });

  readonly readyMinionsCount = computed<number>(() => {
    const b = this.battleState();
    if (!b || b.currentTurn !== 'player' || b.isResolvingTurn) return 0;
    return b.playerBoard.filter(m => m.canAttack && !m.hasAttacked).length;
  });

  readonly guidedPhase = computed<GuidedPhaseInfo | null>(() => {
    const b = this.battleState();
    if (!b || b.winner) return null;

    if (b.currentTurn !== 'player' || b.isResolvingTurn) {
      return {
        title: "Tour de l'adversaire",
        detail: `${b.opponentHero.name} prépare son assaut… Observez le champ de bataille.`,
        tone: 'ai',
        canCancel: false,
      };
    }

    const mode = this.targetingMode();
    const card = this.selectedHandCard();
    const attacker = this.attackingMinion();

    if (mode === 'spell' && card) {
      if (card.spellDamage) {
        const { finalDamage } = this.calculateSpellDamage(card);
        return {
          title: `Sort prêt : ${card.name} (${finalDamage} DGT)`,
          detail: 'Cliquez sur le Héros adverse ou une créature ennemie en surbrillance pour frapper.',
          tone: 'spell',
          canCancel: true,
        };
      }
      if (card.healValue) {
        const healAmt = this.calculateHealAmount(card.healValue, card.element);
        return {
          title: `Soin prêt : ${card.name} (+${healAmt} PV)`,
          detail: 'Cliquez sur votre Héros ou sur une créature alliée blessée pour la soigner.',
          tone: 'spell',
          canCancel: true,
        };
      }
    }

    if (mode === 'minion_attack' && attacker) {
      const { finalDamage } = this.calculatePlayerDamage(attacker.attack);
      if (this.hasEnemyTaunt()) {
        return {
          title: `Provocation active — ${attacker.name} (${finalDamage} ATQ)`,
          detail: 'Attaquez obligatoirement une créature ennemie dotée d’un bouclier Provocation.',
          tone: 'taunt',
          canCancel: true,
        };
      }
      return {
        title: `Attaquant : ${attacker.name} (${finalDamage} DGT)`,
        detail: 'Choisissez le Héros adverse ou une créature ennemie pour déclencher l’assaut.',
        tone: 'attack',
        canCancel: true,
      };
    }

    const playable = this.playableHandCount();
    const ready = this.readyMinionsCount();
    const ultReady = b.playerHero.energy >= b.playerHero.hero.ultimateCost;

    if (playable === 0 && ready === 0 && !ultReady) {
      return {
        title: 'Actions du tour terminées',
        detail: 'Plus aucune carte jouable ni créature prête — cliquez sur « Fin de Tour ».',
        tone: 'ready_end',
        canCancel: false,
      };
    }

    const parts: string[] = [];
    if (playable > 0) parts.push(`${playable} carte${playable > 1 ? 's' : ''} jouable${playable > 1 ? 's' : ''}`);
    if (ready > 0) parts.push(`${ready} créature${ready > 1 ? 's' : ''} prête${ready > 1 ? 's' : ''}`);
    if (ultReady) parts.push(`Ultime disponible`);

    return {
      title: `Votre Tour • ${b.playerMana}/${b.maxPlayerMana} Mana`,
      detail: parts.join(' • ') + ' — Sélectionnez une carte ou une créature verte.',
      tone: 'neutral',
      canCancel: false,
    };
  });

  readonly tacticalHint = computed<string>(() => {
    const b = this.battleState();
    if (!b || b.winner || b.currentTurn !== 'player' || b.isResolvingTurn) {
      return 'Tour adverse en cours…';
    }

    const hasTaunt = this.hasEnemyTaunt();
    const enemyEffectiveHp = b.opponentHero.hp + b.opponentHero.armor;

    // 1. Check lethal by ready minion if no taunt
    const readyMinions = b.playerBoard.filter(m => m.canAttack && !m.hasAttacked);
    if (!hasTaunt && readyMinions.length > 0) {
      const lethalMinion = readyMinions.find(m => this.calculatePlayerDamage(m.attack).finalDamage >= enemyEffectiveHp);
      if (lethalMinion) {
        const dmg = this.calculatePlayerDamage(lethalMinion.attack).finalDamage;
        return `Coup fatal ! Attaquez le Héros adverse avec [${lethalMinion.name}] (${dmg} DGT).`;
      }
    }

    // 2. Check lethal by spell
    const affordableCards = b.playerHand.filter(c => c.cost <= b.playerMana);
    const lethalSpell = affordableCards.find(
      c => c.type === 'spell' && c.spellDamage && this.calculateSpellDamage(c).finalDamage >= enemyEffectiveHp
    );
    if (lethalSpell) {
      const dmg = this.calculateSpellDamage(lethalSpell).finalDamage;
      return `Coup fatal magique ! Lancez [${lethalSpell.name}] sur le Héros adverse (${dmg} DGT).`;
    }

    // 3. Ultimate ready
    if (b.playerHero.energy >= b.playerHero.hero.ultimateCost) {
      return `Ultime chargé ! Déchaînez [${b.playerHero.hero.ultimateName}] pour renverser le duel.`;
    }

    // 4. Taunt clearing
    if (hasTaunt && readyMinions.length > 0) {
      const tauntMinion = b.opponentBoard.find(m => m.taunt);
      const dmg = this.calculatePlayerDamage(readyMinions[0].attack).finalDamage;
      if (tauntMinion) {
        return `Brisez la Provocation : attaquez [${tauntMinion.name}] avec [${readyMinions[0].name}] (${dmg} DGT).`;
      }
    }

    // 5. Affordable creature or spell
    const bestCreature = affordableCards
      .filter(c => c.type === 'creature' && b.playerBoard.length < 7)
      .sort((a, z) => z.cost - a.cost)[0];
    if (bestCreature) {
      return `Renforcez le terrain : invoquez [${bestCreature.name}] (${bestCreature.cost} mana).`;
    }

    if (readyMinions.length > 0) {
      const dmg = this.calculatePlayerDamage(readyMinions[0].attack).finalDamage;
      return `Lancez l’assaut : sélectionnez [${readyMinions[0].name}] (${dmg} DGT prévus).`;
    }

    const bestSpell = affordableCards.find(c => c.type === 'spell');
    if (bestSpell) {
      if (bestSpell.spellDamage) {
        return `Utilisez [${bestSpell.name}] (${bestSpell.cost} mana) contre une cible ennemie.`;
      }
      if (bestSpell.healValue) {
        return `Lancez [${bestSpell.name}] (${bestSpell.cost} mana) pour restaurer des PV.`;
      }
    }

    return 'Aucune action restante : cliquez sur « Fin de Tour ».';
  });

  private showActionFeedback(message: string, tone: 'warning' | 'info' = 'warning') {
    if (this.feedbackTimeout) clearTimeout(this.feedbackTimeout);
    this.actionFeedback.set({ message, tone });
    this.feedbackTimeout = setTimeout(() => {
      this.actionFeedback.set(null);
    }, 2400);
  }

  cancelSelection() {
    this.selectedHandCard.set(null);
    this.targetingMode.set(null);
    this.spellTargetSide.set(null);
    this.attackingMinion.set(null);
    this.sound.playClick();
  }

  triggerCombatIntro() {
    this.isCombatIntroPlaying.set(true);
    this.sound.playSwordHit();
    setTimeout(() => {
      this.isCombatIntroPlaying.set(false);
    }, 2000);
  }

  // Weather & Arena Runes
  private readonly arenaWeathers = [
    { name: 'Sanctuaire Solaire', icon: 'wb_sunny', description: 'Les sorts et créatures de Lumière & Feu soignent 1 PV supplémentaire.' },
    { name: 'Vortex Arcanique', icon: 'cyclone', description: 'Chaque sort joué confère +1 Énergie Ultime au lanceur.' },
    { name: 'Brume des Profondeurs', icon: 'cloud', description: 'Toutes les créatures gagnent +1 PV Max à l\'invocation.' },
    { name: 'Nécropole Maudite', icon: 'coronavirus', description: 'Lorsqu\'une créature meurt, le héros adverse subit 1 dégât.' },
  ];

  startMatchmaking(mode: 'ranked' | 'casual' | 'ai_training' = 'ranked') {
    this.isSearchingMatch.set(true);
    this.searchSeconds.set(0);
    this.sound.playCardDraw();

    this.searchTimer = setInterval(() => {
      this.searchSeconds.update(s => s + 1);
      if (this.searchSeconds() >= 3) {
        if (this.searchTimer) {
          clearInterval(this.searchTimer);
          this.searchTimer = null;
        }
        this.isSearchingMatch.set(false);
        this.initBattle(mode);
      }
    }, 1000);
  }

  cancelMatchmaking() {
    if (this.searchTimer) {
      clearInterval(this.searchTimer);
      this.searchTimer = null;
    }
    this.isSearchingMatch.set(false);
    this.sound.playClick();
  }

  startStoryBattle(mission: StoryMission) {
    const playerHero = this.gameState.selectedHero();
    const activeDeck = this.gameState.activeDeck();
    const buffs = this.gameState.activeBuffs();
    const elixirBonuses = this.gameState.elixirStatBonuses();

    let extraHp = elixirBonuses.bonusHp;
    let extraArmor = playerHero.armor + elixirBonuses.bonusArmor;
    let startingMana = 1 + elixirBonuses.bonusStartingMana;
    let extraEnergy = elixirBonuses.bonusStartingEnergy;

    const unlockedNodes = this.gameState.skillTrees().filter(
      n => n.heroClass === playerHero.id && playerHero.unlockedTalentIds.includes(n.id)
    );
    unlockedNodes.forEach(n => {
      if (n.bonusType === 'hp') extraHp += n.bonusValue;
      if (n.bonusType === 'armor') extraArmor += n.bonusValue;
      if (n.bonusType === 'mana') startingMana += n.bonusValue;
      if (n.bonusType === 'ultimate_boost') extraEnergy += n.bonusValue;
    });

    const initialMaxHp = playerHero.maxHp + extraHp;

    const allCards = this.gameState.cards();
    const deckCards: Card[] = [];
    activeDeck.cardIds.forEach(id => {
      const cardObj = allCards.find(c => c.id === id);
      if (cardObj) {
        deckCards.push({ ...cardObj });
      }
    });

    for (let i = deckCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deckCards[i], deckCards[j]] = [deckCards[j], deckCards[i]];
    }

    const playerHand = deckCards.splice(0, 4);
    const randomWeather = this.arenaWeathers[Math.floor(Math.random() * this.arenaWeathers.length)];

    const newBattle: BattleState = {
      matchId: 'story_' + mission.id + '_' + Date.now(),
      mode: 'story',
      storyMissionId: mission.id,
      storyMissionTitle: mission.title,
      turn: 1,
      currentTurn: 'player',
      playerHero: {
        hero: playerHero,
        hp: initialMaxHp,
        maxHp: initialMaxHp,
        armor: extraArmor,
        energy: Math.min(4, 1 + extraEnergy),
        maxEnergy: 4,
      },
      opponentHero: {
        name: mission.enemyName,
        heroClass: mission.enemyClass,
        title: mission.enemyTitle,
        avatarIcon: mission.enemyAvatar,
        imageUrl: HERO_PORTRAITS[mission.enemyClass],
        hp: mission.enemyHp,
        maxHp: mission.enemyHp,
        armor: mission.enemyArmor,
        energy: 1,
        maxEnergy: 4,
        elo: 1300 + mission.order * 50,
      },
      playerMana: startingMana,
      maxPlayerMana: startingMana,
      opponentMana: 1,
      maxOpponentMana: 1,
      playerHand,
      opponentHandCount: 4,
      playerBoard: [],
      opponentBoard: [],
      playerDeck: deckCards,
      opponentDeckCount: 16,
      graveyard: [],
      combatLogs: [
        {
          id: 'log_0',
          timestamp: '00:00',
          text: `[HISTOIRE - ${mission.title}] Combat contre ${mission.enemyName} !`,
          type: 'system',
        },
        ...(mission.bossPowerName ? [{
          id: 'log_boss',
          timestamp: '00:00',
          text: `Pouvoir de Boss [${mission.bossPowerName}] : ${mission.bossPowerDesc}`,
          type: 'opponent' as const
        }] : [])
      ],
      winner: null,
      appliedElixirBuffs: buffs.map(b => ({ ...b })),
      appliedElixirBonuses: { ...elixirBonuses },
      turnTimeLeft: 50,
      comboCount: 0,
      weatherEffect: randomWeather,
      isResolvingTurn: false,
    };

    this.resetCombatSelections();
    this.damageDealtThisMatch.set(0);
    this.battleState.set(newBattle);
    this.sound.playTurnGong();
    this.triggerCombatIntro();
    this.startTurnTimer();

    if (mission.enemyName) {
      this.gameState.recordMonsterEncounter(mission.enemyName);
    }
  }

  startCustomDuel(config: CustomDuelConfig) {
    const playerHero = this.gameState.selectedHero();
    const activeDeck = this.gameState.activeDeck();
    const buffs = this.gameState.activeBuffs();
    const elixirBonuses = this.gameState.elixirStatBonuses();

    let extraHp = elixirBonuses.bonusHp;
    let extraArmor = playerHero.armor + elixirBonuses.bonusArmor;
    let startingMana = (config.startMana || 1) + elixirBonuses.bonusStartingMana;
    let extraEnergy = elixirBonuses.bonusStartingEnergy;

    const unlockedNodes = this.gameState.skillTrees().filter(
      n => n.heroClass === playerHero.id && playerHero.unlockedTalentIds.includes(n.id)
    );
    unlockedNodes.forEach(n => {
      if (n.bonusType === 'hp') extraHp += n.bonusValue;
      if (n.bonusType === 'armor') extraArmor += n.bonusValue;
      if (n.bonusType === 'mana') startingMana += n.bonusValue;
      if (n.bonusType === 'ultimate_boost') extraEnergy += n.bonusValue;
    });

    const initialMaxHp = playerHero.maxHp + extraHp;

    const allCards = this.gameState.cards();
    const deckCards: Card[] = [];
    activeDeck.cardIds.forEach(id => {
      const cardObj = allCards.find(c => c.id === id);
      if (cardObj) {
        deckCards.push({ ...cardObj });
      }
    });

    for (let i = deckCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deckCards[i], deckCards[j]] = [deckCards[j], deckCards[i]];
    }

    const playerHand = deckCards.splice(0, 4);
    const chosenWeather = this.arenaWeathers.find(w => w.name === config.weather) || this.arenaWeathers[0];

    const newBattle: BattleState = {
      matchId: 'custom_' + Date.now(),
      mode: 'custom',
      turn: 1,
      currentTurn: 'player',
      playerHero: {
        hero: playerHero,
        hp: initialMaxHp,
        maxHp: initialMaxHp,
        armor: extraArmor,
        energy: Math.min(4, 1 + extraEnergy),
        maxEnergy: 4,
      },
      opponentHero: {
        name: config.botName,
        heroClass: config.botClass,
        title: config.botTitle,
        avatarIcon: config.botClass === 'mage' ? 'auto_awesome' : config.botClass === 'necromancer' ? 'coronavirus' : config.botClass === 'rogue' ? 'visibility_off' : 'shield_moon',
        imageUrl: HERO_PORTRAITS[config.botClass],
        hp: config.botHp,
        maxHp: config.botHp,
        armor: config.botArmor,
        energy: 1,
        maxEnergy: 4,
        elo: 1400,
      },
      playerMana: startingMana,
      maxPlayerMana: startingMana,
      opponentMana: config.startMana || 1,
      maxOpponentMana: config.startMana || 1,
      playerHand,
      opponentHandCount: 4,
      playerBoard: [],
      opponentBoard: [],
      playerDeck: deckCards,
      opponentDeckCount: 16,
      graveyard: [],
      combatLogs: [
        {
          id: 'log_0',
          timestamp: '00:00',
          text: `[DUEL PERSONNALISÉ] ${playerHero.name} VS ${config.botName} (Difficulté : ${config.difficulty.toUpperCase()})`,
          type: 'system',
        },
      ],
      winner: null,
      appliedElixirBuffs: buffs.map(b => ({ ...b })),
      appliedElixirBonuses: { ...elixirBonuses },
      turnTimeLeft: config.turnTime || 45,
      comboCount: 0,
      weatherEffect: chosenWeather,
      isResolvingTurn: false,
    };

    this.resetCombatSelections();
    this.damageDealtThisMatch.set(0);
    this.battleState.set(newBattle);
    this.sound.playTurnGong();
    this.triggerCombatIntro();
    this.startTurnTimer();
  }

  initBattle(mode: 'ranked' | 'casual' | 'ai_training' = 'ranked') {
    const playerHero = this.gameState.selectedHero();
    const activeDeck = this.gameState.activeDeck();
    const buffs = this.gameState.activeBuffs();
    const elixirBonuses = this.gameState.elixirStatBonuses();

    let extraHp = elixirBonuses.bonusHp;
    let extraArmor = playerHero.armor + elixirBonuses.bonusArmor;
    let startingMana = 1 + elixirBonuses.bonusStartingMana;
    let extraEnergy = elixirBonuses.bonusStartingEnergy;

    const unlockedNodes = this.gameState.skillTrees().filter(
      n => n.heroClass === playerHero.id && playerHero.unlockedTalentIds.includes(n.id)
    );
    unlockedNodes.forEach(n => {
      if (n.bonusType === 'hp') extraHp += n.bonusValue;
      if (n.bonusType === 'armor') extraArmor += n.bonusValue;
      if (n.bonusType === 'mana') startingMana += n.bonusValue;
      if (n.bonusType === 'ultimate_boost') extraEnergy += n.bonusValue;
    });

    const initialMaxHp = playerHero.maxHp + extraHp;

    const opponentClasses: HeroClass[] = ['mage', 'necromancer', 'rogue', 'druid', 'paladin'];
    const randomClass = opponentClasses[Math.floor(Math.random() * opponentClasses.length)];
    const opponentTitles = ["L'Invocateur Flamboyant", 'Ombre du Crépuscule', 'Liche des Marais', 'Seigneur Croisé', 'Druide Ancien'];
    const opponentNames = ['Aldus le Noir', 'Dame Vespera', 'Gorgoroth', 'Sire Galahad', 'Lyanna Ronceval'];

    const oppName = opponentNames[Math.floor(Math.random() * opponentNames.length)];
    const oppTitle = opponentTitles[Math.floor(Math.random() * opponentTitles.length)];

    const allCards = this.gameState.cards();
    const deckCards: Card[] = [];
    activeDeck.cardIds.forEach(id => {
      const cardObj = allCards.find(c => c.id === id);
      if (cardObj) {
        deckCards.push({ ...cardObj });
      }
    });

    for (let i = deckCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deckCards[i], deckCards[j]] = [deckCards[j], deckCards[i]];
    }

    const playerHand = deckCards.splice(0, 4);
    const randomWeather = this.arenaWeathers[Math.floor(Math.random() * this.arenaWeathers.length)];

    const newBattle: BattleState = {
      matchId: 'match_' + Date.now(),
      mode,
      turn: 1,
      currentTurn: 'player',
      playerHero: {
        hero: playerHero,
        hp: initialMaxHp,
        maxHp: initialMaxHp,
        armor: extraArmor,
        energy: Math.min(4, 1 + extraEnergy),
        maxEnergy: 4,
      },
      opponentHero: {
        name: oppName,
        heroClass: randomClass,
        title: oppTitle,
        avatarIcon: randomClass === 'mage' ? 'auto_awesome' : randomClass === 'necromancer' ? 'coronavirus' : randomClass === 'rogue' ? 'visibility_off' : 'shield_moon',
        imageUrl: HERO_PORTRAITS[randomClass],
        hp: 32,
        maxHp: 32,
        armor: 3,
        energy: 1,
        maxEnergy: 4,
        elo: this.gameState.elo() + Math.floor(Math.random() * 60) - 30,
      },
      playerMana: startingMana,
      maxPlayerMana: startingMana,
      opponentMana: 1,
      maxOpponentMana: 1,
      playerHand,
      opponentHandCount: 4,
      playerBoard: [],
      opponentBoard: [],
      playerDeck: deckCards,
      opponentDeckCount: 16,
      graveyard: [],
      combatLogs: [
        {
          id: 'log_0',
          timestamp: '00:00',
          text: `Le duel débute ! Arène sous l'influence : ${randomWeather.name}`,
          type: 'system',
        },
      ],
      winner: null,
      appliedElixirBuffs: buffs.map(b => ({ ...b })),
      appliedElixirBonuses: { ...elixirBonuses },
      turnTimeLeft: 45,
      comboCount: 0,
      weatherEffect: randomWeather,
      isResolvingTurn: false,
    };

    this.resetCombatSelections();
    this.damageDealtThisMatch.set(0);
    this.battleState.set(newBattle);
    this.sound.playTurnGong();
    this.triggerCombatIntro();
    this.startTurnTimer();
  }

  private resetCombatSelections() {
    this.selectedHandCard.set(null);
    this.targetingMode.set(null);
    this.spellTargetSide.set(null);
    this.attackingMinion.set(null);
    this.actionFeedback.set(null);
  }

  private startTurnTimer() {
    if (this.turnInterval) clearInterval(this.turnInterval);
    this.turnInterval = setInterval(() => {
      const b = this.battleState();
      if (!b || b.winner) {
        if (this.turnInterval) {
          clearInterval(this.turnInterval);
          this.turnInterval = null;
        }
        return;
      }

      if (b.currentTurn !== 'player' || b.isResolvingTurn) {
        return;
      }

      if (b.turnTimeLeft <= 1) {
        this.endTurn();
      } else {
        this.battleState.update(s => (s ? { ...s, turnTimeLeft: s.turnTimeLeft - 1 } : null));
      }
    }, 1000);
  }

  // Floating text feedback
  spawnFloatingText(target: string, value: number | string, type: FloatingDamage['type']) {
    const id = 'float_' + Math.random();
    this.floatingDamages.update(list => [...list, { id, target, value, type }]);
    setTimeout(() => {
      this.floatingDamages.update(list => list.filter(f => f.id !== id));
    }, 1200);
  }

  // Add Combat Log
  addLog(text: string, type: CombatLogEntry['type']) {
    const b = this.battleState();
    if (!b) return;
    const entry: CombatLogEntry = {
      id: 'log_' + Date.now() + Math.random(),
      timestamp: new Date().toLocaleTimeString('fr-FR', { minute: '2-digit', second: '2-digit' }),
      text,
      type,
    };
    this.battleState.update(state => (state ? { ...state, combatLogs: [entry, ...state.combatLogs] } : null));
  }

  // Draw Card for Player
  drawPlayerCard() {
    const b = this.battleState();
    if (!b) return;

    if (b.playerDeck.length === 0) {
      this.addLog('Votre deck est vide ! Vous subissez 3 dégâts de fatigue.', 'damage');
      this.applyDamageToPlayer(3);
      return;
    }

    if (b.playerHand.length >= 8) {
      const burned = b.playerDeck[0];
      const newDeck = b.playerDeck.slice(1);
      this.addLog(`Main pleine ! La carte [${burned.name}] est brûlée.`, 'damage');
      this.battleState.update(s => (s ? { ...s, playerDeck: newDeck } : null));
      return;
    }

    const drawnCard = b.playerDeck[0];
    const remainingDeck = b.playerDeck.slice(1);
    this.battleState.update(s =>
      s
        ? {
            ...s,
            playerHand: [...s.playerHand, drawnCard],
            playerDeck: remainingDeck,
          }
        : null
    );
    this.sound.playCardDraw();
  }

  // Select Card from Hand
  selectHandCard(card: Card) {
    const b = this.battleState();
    if (!b || b.currentTurn !== 'player' || b.isResolvingTurn) return;

    if (b.playerMana < card.cost) {
      this.sound.playClick();
      this.showActionFeedback(`Mana insuffisant : [${card.name}] requiert ${card.cost} mana (${b.playerMana} dispo).`);
      return;
    }

    // Clear minion attack selection if player picks a card
    this.attackingMinion.set(null);

    if (this.selectedHandCard()?.id === card.id) {
      this.cancelSelection();
      return;
    }

    this.selectedHandCard.set(card);
    this.sound.playClick();

    if (card.type === 'spell') {
      this.targetingMode.set('spell');
      this.spellTargetSide.set(card.spellDamage ? 'enemy' : 'ally');
    } else {
      this.targetingMode.set(null);
      this.spellTargetSide.set(null);
    }
  }

  // Play Creature directly to board
  playCreatureCard(card: Card) {
    const b = this.battleState();
    if (!b || b.currentTurn !== 'player' || b.isResolvingTurn) return;

    if (b.playerMana < card.cost) {
      this.sound.playClick();
      this.showActionFeedback(`Mana insuffisant : [${card.name}] requiert ${card.cost} mana (${b.playerMana} dispo).`);
      return;
    }

    if (b.playerBoard.length >= 7) {
      this.sound.playClick();
      this.showActionFeedback('Champ de bataille saturé (7/7 créatures).');
      this.addLog('Le champ de bataille est saturé (max 7 créatures) !', 'system');
      return;
    }

    this.cancelSelection();

    const furyBuff = this.gameState.activeBuffs().find(bf => bf.type === 'fury');
    const attackBonus = furyBuff ? 1 : 0;
    const isDepthFog = b.weatherEffect?.name === 'Brume des Profondeurs';
    const weatherHpBonus = isDepthFog ? 1 : 0;

    const newMinion: BattleMinion = {
      instanceId: 'minion_' + Date.now() + Math.random(),
      cardId: card.id,
      name: card.name,
      cost: card.cost,
      element: card.element,
      rarity: card.rarity,
      attack: (card.attack || 1) + attackBonus,
      currentHealth: (card.health || 1) + weatherHpBonus,
      maxHealth: (card.maxHealth || card.health || 1) + weatherHpBonus,
      taunt: !!card.taunt,
      divineShield: !!card.divineShield,
      lifesteal: !!card.lifesteal,
      canAttack: false, // Summoning Sickness
      hasAttacked: false,
      icon: card.icon,
      imageUrl: card.imageUrl || resolveCardImageUrl(card),
      isBuffed: attackBonus > 0 || weatherHpBonus > 0,
    };

    const remainingHand = b.playerHand.filter(c => c !== card);
    const newBoard = [...b.playerBoard, newMinion];
    const newMana = b.playerMana - card.cost;
    const newCombo = b.comboCount + 1;

    this.dailyMissionsService.advanceByTrigger('invocations', 1);
    this.questService.advanceByTrigger('invocations', 1);
    if (card.taunt || card.divineShield) {
      this.dailyMissionsService.advanceByTrigger('taunt_shield', 1);
      this.questService.advanceByTrigger('taunt_shield', 1);
    }
    if (newCombo >= 2) {
      this.dailyMissionsService.advanceByTrigger('combo', 1);
      this.questService.advanceByTrigger('combo', 1);
    }
    if (card.battlecryDesc) {
      this.dailyMissionsService.advanceByTrigger('battlecry', 1);
      this.questService.advanceByTrigger('battlecry', 1);
    }

    this.sound.playCardSummon(card.rarity);
    const weatherNote = isDepthFog ? ' (+1 PV Brume)' : '';
    this.addLog(`Vous invoquez [${card.name}] (${newMinion.attack}/${newMinion.currentHealth})${weatherNote}.`, 'player');

    this.battleState.update(s =>
      s
        ? {
            ...s,
            playerMana: newMana,
            playerHand: remainingHand,
            playerBoard: newBoard,
            comboCount: newCombo,
          }
        : null
    );

    // Trigger Battlecry / Combo if any
    if (card.battlecryDesc && card.healValue) {
      const healAmt = this.calculateHealAmount(card.healValue, card.element);
      this.healPlayerHero(healAmt);
    }
    if (card.battlecryDesc && card.spellDamage) {
      const { finalDamage, bonusDamage, petMultiplier } = this.calculatePlayerDamage(card.spellDamage);
      this.damageAllOpponentMinions(finalDamage, bonusDamage > 0 ? `Familier x${petMultiplier.toFixed(2)}` : undefined);
      this.cleanupDeadMinions();
    }
  }

  /**
   * Calculates damage with the player's active pet multiplier.
   */
  calculatePlayerDamage(baseDamage: number): {
    finalDamage: number;
    bonusDamage: number;
    petMultiplier: number;
    petName: string | null;
  } {
    const pet = this.gameState.equippedPet();
    if (!pet || !pet.isUnlocked || pet.totalMultiplier <= 1.0) {
      return { finalDamage: baseDamage, bonusDamage: 0, petMultiplier: 1.0, petName: null };
    }
    const mult = pet.totalMultiplier;
    const finalDamage = Math.max(baseDamage, Math.round(baseDamage * mult));
    const bonusDamage = finalDamage - baseDamage;
    return { finalDamage, bonusDamage, petMultiplier: mult, petName: pet.name };
  }

  calculateSpellDamage(card: Card) {
    const base = card.spellDamage || 0;
    const astralBuff = this.gameState.activeBuffs().find(b => b.type === 'astral_surge');
    const baseWithBuff = base + (astralBuff ? 2 : 0);
    return {
      ...this.calculatePlayerDamage(baseWithBuff),
      hasAstralBuff: !!astralBuff,
    };
  }

  calculateHealAmount(baseHeal: number, element: Card['element']): number {
    const b = this.battleState();
    const isSolarSanctuary = b?.weatherEffect?.name === 'Sanctuaire Solaire' && (element === 'light' || element === 'fire');
    return baseHeal + (isSolarSanctuary ? 1 : 0);
  }

  isTargetValidForCurrentAction(
    targetType: 'opponent-hero' | 'opponent-minion' | 'player-hero' | 'player-minion'
  ): { valid: boolean; reason?: string } {
    const b = this.battleState();
    if (!b || b.currentTurn !== 'player' || b.isResolvingTurn) {
      return { valid: false, reason: 'Attendez votre tour.' };
    }

    const mode = this.targetingMode();
    if (mode === 'spell') {
      const card = this.selectedHandCard();
      if (!card) return { valid: false };
      if (card.spellDamage) {
        if (targetType === 'opponent-hero' || targetType === 'opponent-minion') {
          return { valid: true };
        }
        return { valid: false, reason: 'Sort offensif : visez le Héros ou une créature adverse.' };
      }
      if (card.healValue) {
        if (targetType === 'player-hero' || targetType === 'player-minion') {
          return { valid: true };
        }
        return { valid: false, reason: 'Sort de soin : visez votre Héros ou une créature alliée.' };
      }
      return { valid: false };
    }

    if (mode === 'minion_attack') {
      if (targetType === 'player-hero' || targetType === 'player-minion') {
        return { valid: false, reason: 'Sélectionnez une cible ennemie.' };
      }
      return { valid: true };
    }

    return { valid: false };
  }

  isMinionBlockedByTaunt(targetType: 'opponent-hero' | 'opponent-minion', minion?: BattleMinion): boolean {
    if (this.targetingMode() !== 'minion_attack') return false;
    if (!this.hasEnemyTaunt()) return false;
    if (targetType === 'opponent-hero') return true;
    if (targetType === 'opponent-minion' && minion) return !minion.taunt;
    return false;
  }

  getCombatPreview(
    targetType: 'opponent-hero' | 'opponent-minion' | 'player-hero' | 'player-minion',
    targetMinion?: BattleMinion
  ): CombatPreview | null {
    const b = this.battleState();
    const mode = this.targetingMode();
    if (!b || !mode || b.currentTurn !== 'player' || b.isResolvingTurn) return null;

    if (mode === 'spell') {
      const card = this.selectedHandCard();
      if (!card) return null;

      if (card.spellDamage) {
        if (targetType !== 'opponent-hero' && targetType !== 'opponent-minion') return null;
        const { finalDamage } = this.calculateSpellDamage(card);

        if (targetType === 'opponent-hero') {
          const effectiveHp = b.opponentHero.hp + b.opponentHero.armor;
          return {
            valid: true,
            label: `-${finalDamage} DGT`,
            subLabel: finalDamage >= effectiveHp ? 'Coup Fatal' : b.opponentHero.armor > 0 ? `Armure absorbée` : undefined,
            isLethal: finalDamage >= effectiveHp,
            isBlocked: false,
            absorbsShield: false,
            tone: 'damage',
          };
        }

        if (targetMinion) {
          if (targetMinion.divineShield) {
            return {
              valid: true,
              label: `Bouclier brisé`,
              subLabel: '0 PV perdus',
              isLethal: false,
              isBlocked: false,
              absorbsShield: true,
              tone: 'damage',
            };
          }
          return {
            valid: true,
            label: `-${finalDamage} DGT`,
            subLabel: finalDamage >= targetMinion.currentHealth ? 'Détruit' : `Reste ${targetMinion.currentHealth - finalDamage} PV`,
            isLethal: finalDamage >= targetMinion.currentHealth,
            isBlocked: false,
            absorbsShield: false,
            tone: 'damage',
          };
        }
      }

      if (card.healValue) {
        if (targetType !== 'player-hero' && targetType !== 'player-minion') return null;
        const healAmt = this.calculateHealAmount(card.healValue, card.element);
        if (targetType === 'player-hero') {
          const actual = Math.min(b.playerHero.maxHp - b.playerHero.hp, healAmt);
          return {
            valid: true,
            label: `+${actual} PV`,
            subLabel: actual === 0 ? 'PV déjà au max' : undefined,
            isLethal: false,
            isBlocked: false,
            absorbsShield: false,
            tone: 'heal',
          };
        }
        if (targetMinion) {
          const actual = Math.min(targetMinion.maxHealth - targetMinion.currentHealth, healAmt);
          return {
            valid: true,
            label: `+${actual} PV`,
            subLabel: actual === 0 ? 'PV déjà au max' : undefined,
            isLethal: false,
            isBlocked: false,
            absorbsShield: false,
            tone: 'heal',
          };
        }
      }
      return null;
    }

    if (mode === 'minion_attack') {
      const attacker = this.attackingMinion();
      if (!attacker) return null;
      if (targetType !== 'opponent-hero' && targetType !== 'opponent-minion') return null;

      if (this.isMinionBlockedByTaunt(targetType, targetMinion)) {
        return {
          valid: false,
          reason: 'Bloqué par Provocation',
          label: 'Bloqué',
          subLabel: 'Provoc. active',
          isLethal: false,
          isBlocked: true,
          absorbsShield: false,
          tone: 'blocked',
        };
      }

      const { finalDamage } = this.calculatePlayerDamage(attacker.attack);

      if (targetType === 'opponent-hero') {
        const effectiveHp = b.opponentHero.hp + b.opponentHero.armor;
        return {
          valid: true,
          label: `-${finalDamage} DGT`,
          subLabel: finalDamage >= effectiveHp ? 'Coup Fatal' : b.opponentHero.armor > 0 ? `Armure absorbée` : undefined,
          isLethal: finalDamage >= effectiveHp,
          isBlocked: false,
          absorbsShield: false,
          tone: 'damage',
        };
      }

      if (targetMinion) {
        const counterDies = !attacker.divineShield && targetMinion.attack >= attacker.currentHealth;
        if (targetMinion.divineShield) {
          return {
            valid: true,
            label: `Brise Bouclier`,
            subLabel: counterDies ? `Votre unité meurt (-${targetMinion.attack})` : `Subit ${targetMinion.attack}`,
            isLethal: false,
            isBlocked: false,
            absorbsShield: true,
            tone: 'damage',
          };
        }
        const killsTarget = finalDamage >= targetMinion.currentHealth;
        return {
          valid: true,
          label: `-${finalDamage} DGT`,
          subLabel: killsTarget
            ? counterDies ? 'Échange mutuel' : 'Détruit · Survit'
            : counterDies ? `Subit ${targetMinion.attack} (Meurt)` : `Subit ${targetMinion.attack}`,
          isLethal: killsTarget,
          isBlocked: false,
          absorbsShield: false,
          tone: 'damage',
        };
      }
    }

    return null;
  }

  // Cast Spell onto Target (Hero or Minion)
  castSpellOnTarget(
    targetType: 'opponent-hero' | 'opponent-minion' | 'player-minion' | 'player-hero',
    minionTarget?: BattleMinion
  ) {
    const b = this.battleState();
    const card = this.selectedHandCard();
    if (!b || !card || card.type !== 'spell' || b.currentTurn !== 'player' || b.isResolvingTurn) return;
    if (b.playerMana < card.cost) {
      this.showActionFeedback(`Mana insuffisant pour [${card.name}].`);
      return;
    }

    const validation = this.isTargetValidForCurrentAction(targetType);
    if (!validation.valid) {
      this.sound.playClick();
      this.showActionFeedback(validation.reason || 'Cible invalide pour ce sort.');
      return;
    }

    const remainingHand = b.playerHand.filter(c => c !== card);
    const newMana = b.playerMana - card.cost;
    const newCombo = b.comboCount + 1;

    this.dailyMissionsService.advanceByTrigger('spells', 1);
    this.questService.advanceByTrigger('spells', 1);
    if (newCombo >= 2) {
      this.dailyMissionsService.advanceByTrigger('combo', 1);
      this.questService.advanceByTrigger('combo', 1);
    }

    this.sound.playSpellBlast();

    if (card.spellDamage) {
      const { finalDamage, bonusDamage, petMultiplier, petName, hasAstralBuff } = this.calculateSpellDamage(card);
      let hitDamage = finalDamage;
      const critBuff = this.gameState.activeBuffs().find(bf => bf.type === 'crit');
      let critText = '';
      if (critBuff && Math.random() < 0.25) {
        hitDamage = Math.round(hitDamage * 1.5);
        critText = ' CRITIQUE !';
      }

      this.dailyMissionsService.advanceByTrigger('damage', hitDamage);
      this.questService.advanceByTrigger('damage', hitDamage);
      const petIndicator = bonusDamage > 0 ? `Familier x${petMultiplier.toFixed(2)}` : undefined;
      const astralLog = hasAstralBuff ? ' (+2 Éclair Astral)' : '';
      const petLog = petName && bonusDamage > 0 ? ` (boosté par [${petName}] x${petMultiplier.toFixed(2)})` : '';

      if (targetType === 'opponent-hero') {
        this.applyDamageToOpponent(hitDamage, petIndicator);
        this.addLog(`Vous lancez [${card.name}] infligeant ${hitDamage} dégâts au Héros adverse${astralLog}${petLog}${critText}.`, 'player');
      } else if (targetType === 'opponent-minion' && minionTarget) {
        this.damageMinion(minionTarget, hitDamage, petIndicator);
        this.addLog(`Vous lancez [${card.name}] sur [${minionTarget.name}] (${hitDamage} dégâts${astralLog}${petLog}${critText}).`, 'player');
      }
    }

    if (card.healValue) {
      const healAmount = this.calculateHealAmount(card.healValue, card.element);
      if (targetType === 'player-minion' && minionTarget) {
        this.healPlayerMinion(minionTarget, healAmount);
      } else {
        this.healPlayerHero(healAmount);
      }
    }

    // Check Vortex Arcanique weather (+1 Ultimate Energy per spell cast)
    const isArcaneVortex = b.weatherEffect?.name === 'Vortex Arcanique';

    this.battleState.update(s =>
      s
        ? {
            ...s,
            playerMana: newMana,
            playerHand: remainingHand,
            comboCount: newCombo,
            playerHero: isArcaneVortex
              ? { ...s.playerHero, energy: Math.min(s.playerHero.maxEnergy, s.playerHero.energy + 1) }
              : s.playerHero,
          }
        : null
    );

    if (isArcaneVortex) {
      this.spawnFloatingText('player-hero', '+1 Énergie (Vortex)', 'buff');
    }

    this.cancelSelection();
    this.cleanupDeadMinions();
  }

  // Minion Attack Initiation
  selectAttacker(minion: BattleMinion) {
    const b = this.battleState();
    if (!b || b.currentTurn !== 'player' || b.isResolvingTurn) return;

    // Clear hand card if picking attacker
    this.selectedHandCard.set(null);
    this.spellTargetSide.set(null);

    if (!minion.canAttack) {
      this.sound.playClick();
      this.showActionFeedback(`[${minion.name}] vient d'être invoqué (Repos jusqu'au prochain tour).`);
      return;
    }

    if (minion.hasAttacked) {
      this.sound.playClick();
      this.showActionFeedback(`[${minion.name}] a déjà attaqué ce tour-ci.`);
      return;
    }

    if (this.attackingMinion()?.instanceId === minion.instanceId) {
      this.cancelSelection();
      return;
    }

    this.attackingMinion.set(minion);
    this.targetingMode.set('minion_attack');
    this.sound.playClick();
  }

  // Minion Attack Target
  attackTarget(targetType: 'opponent-hero' | 'opponent-minion', targetMinion?: BattleMinion) {
    const b = this.battleState();
    const attacker = this.attackingMinion();
    if (!b || !attacker || b.currentTurn !== 'player' || b.isResolvingTurn) return;

    if (this.isMinionBlockedByTaunt(targetType, targetMinion)) {
      this.showActionFeedback('Attaque bloquée : détruisez d’abord la créature avec Provocation !');
      this.addLog('Une créature avec Provocation bloque cette attaque !', 'system');
      this.sound.playClick();
      return;
    }

    this.sound.playSwordHit();

    const { finalDamage, bonusDamage, petMultiplier, petName } = this.calculatePlayerDamage(attacker.attack);
    let hitDamage = finalDamage;
    const critBuff = this.gameState.activeBuffs().find(bf => bf.type === 'crit');
    let critLabel = '';
    if (critBuff && Math.random() < 0.25) {
      hitDamage = Math.round(hitDamage * 1.5);
      critLabel = ' CRITIQUE !';
    }

    const petIndicator = bonusDamage > 0 ? `Familier x${petMultiplier.toFixed(2)}` : undefined;
    const petLog = petName && bonusDamage > 0 ? ` [${petName} x${petMultiplier.toFixed(2)}]` : '';

    if (targetType === 'opponent-hero') {
      this.applyDamageToOpponent(hitDamage, petIndicator);
      this.dailyMissionsService.advanceByTrigger('damage', hitDamage);
      this.questService.advanceByTrigger('damage', hitDamage);
      if (attacker.lifesteal) {
        this.healPlayerHero(hitDamage);
      }
      this.addLog(`[${attacker.name}] frappe le Héros adverse pour ${hitDamage} dégâts${petLog}${critLabel} !`, 'player');
    } else if (targetType === 'opponent-minion' && targetMinion) {
      const attackerDmg = hitDamage;
      const defenderDmg = targetMinion.attack;

      this.damageMinion(targetMinion, attackerDmg, petIndicator);
      this.damageMinion(attacker, defenderDmg);
      this.dailyMissionsService.advanceByTrigger('damage', attackerDmg);
      this.questService.advanceByTrigger('damage', attackerDmg);

      if (attacker.lifesteal) {
        this.healPlayerHero(attackerDmg);
      }

      this.addLog(`[${attacker.name}] combat [${targetMinion.name}] (${attackerDmg} vs ${defenderDmg} dmg${petLog}${critLabel}).`, 'player');
    }

    this.battleState.update(s =>
      s
        ? {
            ...s,
            playerBoard: s.playerBoard.map(m =>
              m.instanceId === attacker.instanceId
                ? { ...m, currentHealth: attacker.currentHealth, divineShield: attacker.divineShield, hasAttacked: true, canAttack: false }
                : m
            ),
          }
        : null
    );

    this.cancelSelection();
    this.cleanupDeadMinions();
  }

  // Hero Ultimate Activation
  castHeroUltimate() {
    const b = this.battleState();
    if (!b || b.currentTurn !== 'player' || b.isResolvingTurn || b.playerHero.energy < b.playerHero.hero.ultimateCost) return;

    this.cancelSelection();
    const hero = b.playerHero.hero;
    this.sound.playCardSummon('mythic');
    this.addLog(`Vous déchaînez l'Ultime : [${hero.ultimateName}] !`, 'player');

    if (hero.class === 'paladin') {
      const { finalDamage: pDmg1, bonusDamage: b1, petMultiplier: m1 } = this.calculatePlayerDamage(6);
      const { finalDamage: pDmg2 } = this.calculatePlayerDamage(4);
      this.applyDamageToOpponent(pDmg1, b1 > 0 ? `Familier x${m1.toFixed(2)}` : undefined);
      this.damageAllOpponentMinions(pDmg2);
      this.healPlayerHero(6);
    } else if (hero.class === 'mage') {
      const { finalDamage: mDmg1, bonusDamage: bm1, petMultiplier: mm1 } = this.calculatePlayerDamage(9);
      const { finalDamage: mDmg2 } = this.calculatePlayerDamage(3);
      this.applyDamageToOpponent(mDmg1, bm1 > 0 ? `Familier x${mm1.toFixed(2)}` : undefined);
      this.damageAllOpponentMinions(mDmg2);
    } else if (hero.class === 'rogue') {
      const { finalDamage: rDmg, bonusDamage: br, petMultiplier: mr } = this.calculatePlayerDamage(10);
      this.applyDamageToOpponent(rDmg, br > 0 ? `Familier x${mr.toFixed(2)}` : undefined);
    } else if (hero.class === 'druid') {
      this.healPlayerHero(8);
      this.battleState.update(s =>
        s
          ? {
              ...s,
              playerHero: { ...s.playerHero, armor: s.playerHero.armor + 8 },
              playerBoard: s.playerBoard.map(m => ({
                ...m,
                attack: m.attack + 2,
                currentHealth: m.currentHealth + 2,
                maxHealth: m.maxHealth + 2,
                taunt: true,
                isBuffed: true,
              })),
            }
          : null
      );
    } else if (hero.class === 'necromancer') {
      const skeletons: BattleMinion[] = [1, 2, 3].map(i => ({
        instanceId: 'skel_' + Date.now() + i,
        cardId: 'c_nec_skeleton',
        name: 'Guerrier Squelette Maudit',
        cost: 1,
        element: 'shadow',
        rarity: 'rare',
        attack: 3,
        currentHealth: 2,
        maxHealth: 2,
        taunt: false,
        divineShield: false,
        lifesteal: true,
        canAttack: true,
        hasAttacked: false,
        icon: 'coronavirus',
        imageUrl: '/src/assets/images/icon_lich_lord_1792917170436.jpg',
      }));
      this.battleState.update(s => (s ? { ...s, playerBoard: [...s.playerBoard, ...skeletons].slice(0, 7) } : null));
    } else {
      // Fallback generic heroic ultimate for other hero classes
      const { finalDamage: gDmg, bonusDamage: bg, petMultiplier: mg } = this.calculatePlayerDamage(7);
      this.applyDamageToOpponent(gDmg, bg > 0 ? `Familier x${mg.toFixed(2)}` : undefined);
      this.damageAllOpponentMinions(2);
      this.healPlayerHero(4);
    }

    this.dailyMissionsService.advanceByTrigger('ultimate', 1);
    this.questService.advanceByTrigger('ultimate', 1);

    this.battleState.update(s =>
      s
        ? {
            ...s,
            playerHero: { ...s.playerHero, energy: 0 },
          }
        : null
    );

    this.cleanupDeadMinions();
  }

  // Damage / Heal Helpers
  private applyDamageToOpponent(dmg: number, petBadge?: string) {
    const b = this.battleState();
    if (!b || b.winner) return;

    this.damageDealtThisMatch.update(d => d + dmg);

    let remainingDmg = dmg;
    let newArmor = b.opponentHero.armor;

    if (newArmor > 0) {
      if (newArmor >= remainingDmg) {
        newArmor -= remainingDmg;
        remainingDmg = 0;
      } else {
        remainingDmg -= newArmor;
        newArmor = 0;
      }
    }

    const newHp = Math.max(0, b.opponentHero.hp - remainingDmg);
    const displayText = petBadge ? `-${dmg} ${petBadge}` : `-${dmg}`;
    this.spawnFloatingText('opponent-hero', displayText, 'damage');

    this.battleState.update(s =>
      s
        ? {
            ...s,
            opponentHero: { ...s.opponentHero, hp: newHp, armor: newArmor },
          }
        : null
    );

    if (newHp <= 0) {
      this.declareWinner('player');
    }
  }

  private applyDamageToPlayer(dmg: number) {
    const b = this.battleState();
    if (!b || b.winner) return;

    let remainingDmg = dmg;
    let newArmor = b.playerHero.armor;

    if (newArmor > 0) {
      if (newArmor >= remainingDmg) {
        newArmor -= remainingDmg;
        remainingDmg = 0;
      } else {
        remainingDmg -= newArmor;
        newArmor = 0;
      }
    }

    const newHp = Math.max(0, b.playerHero.hp - remainingDmg);
    this.spawnFloatingText('player-hero', `-${dmg}`, 'damage');

    if (newHp <= 0) {
      const phoenixIndex = this.gameState.activeBuffs().findIndex(bf => bf.type === 'phoenix_rebirth');
      if (phoenixIndex !== -1) {
        this.sound.playCardSummon('mythic');
        this.spawnFloatingText('player-hero', 'Renaissance du Phénix ! +12 PV', 'buff');
        this.addLog('RENAISSANCE DU PHÉNIX ! Votre héros renaît de ses cendres avec 12 PV et +6 Armure !', 'player');

        this.gameState.activeBuffs.update(list => {
          const target = list[phoenixIndex];
          if (target.remainingMatches <= 1) {
            return list.filter((_, i) => i !== phoenixIndex);
          }
          return list.map((item, i) => i === phoenixIndex ? { ...item, remainingMatches: item.remainingMatches - 1 } : item);
        });

        this.battleState.update(s =>
          s
            ? {
                ...s,
                playerHero: { ...s.playerHero, hp: 12, armor: s.playerHero.armor + 6 },
                appliedElixirBonuses: s.appliedElixirBonuses
                  ? { ...s.appliedElixirBonuses, hasPhoenixRebirth: false }
                  : s.appliedElixirBonuses,
              }
            : null
        );
        return;
      }
    }

    this.battleState.update(s =>
      s
        ? {
            ...s,
            playerHero: { ...s.playerHero, hp: newHp, armor: newArmor },
          }
        : null
    );

    if (newHp <= 0) {
      this.declareWinner('opponent');
    }
  }

  private healPlayerHero(amount: number) {
    const b = this.battleState();
    if (!b) return;
    const newHp = Math.min(b.playerHero.maxHp, b.playerHero.hp + amount);
    const healed = newHp - b.playerHero.hp;
    this.spawnFloatingText('player-hero', `+${healed > 0 ? healed : amount} PV`, 'heal');
    this.battleState.update(s => (s ? { ...s, playerHero: { ...s.playerHero, hp: newHp } } : null));
    this.addLog(`Votre Héros récupère ${healed > 0 ? healed : amount} PV.`, 'heal');
  }

  private healPlayerMinion(minion: BattleMinion, amount: number) {
    const b = this.battleState();
    if (!b) return;
    const newHp = Math.min(minion.maxHealth, minion.currentHealth + amount);
    const healed = newHp - minion.currentHealth;
    minion.currentHealth = newHp;
    this.spawnFloatingText(minion.instanceId, `+${healed > 0 ? healed : amount} PV`, 'heal');
    this.battleState.update(s =>
      s
        ? {
            ...s,
            playerBoard: s.playerBoard.map(m => (m.instanceId === minion.instanceId ? { ...m, currentHealth: newHp } : m)),
          }
        : null
    );
    this.addLog(`[${minion.name}] récupère ${healed > 0 ? healed : amount} PV.`, 'heal');
  }

  private damageMinion(minion: BattleMinion, dmg: number, petBadge?: string) {
    if (minion.divineShield && dmg > 0) {
      minion.divineShield = false;
      this.spawnFloatingText(minion.instanceId, 'Bouclier Divin !', 'buff');
      return;
    }

    this.damageDealtThisMatch.update(d => d + dmg);
    minion.currentHealth = Math.max(0, minion.currentHealth - dmg);
    const displayText = petBadge ? `-${dmg} ${petBadge}` : `-${dmg}`;
    this.spawnFloatingText(minion.instanceId, displayText, 'damage');
  }

  private damageAllOpponentMinions(dmg: number, petBadge?: string) {
    const b = this.battleState();
    if (!b) return;
    b.opponentBoard.forEach(m => this.damageMinion(m, dmg, petBadge));
  }

  private cleanupDeadMinions() {
    const b = this.battleState();
    if (!b || b.winner) return;

    const deadPlayer = b.playerBoard.filter(m => m.currentHealth <= 0);
    const deadOpponent = b.opponentBoard.filter(m => m.currentHealth <= 0);

    if (deadPlayer.length === 0 && deadOpponent.length === 0) return;

    deadPlayer.forEach(m => this.addLog(`[${m.name}] allié s'effondre.`, 'death'));
    deadOpponent.forEach(m => this.addLog(`[${m.name}] ennemi est détruit.`, 'death'));

    if (deadOpponent.length > 0) {
      this.dailyMissionsService.advanceByTrigger('slay_minions', deadOpponent.length);
      this.questService.advanceByTrigger('slay_minions', deadOpponent.length);
    }

    this.battleState.update(s =>
      s
        ? {
            ...s,
            playerBoard: s.playerBoard.filter(m => m.currentHealth > 0),
            opponentBoard: s.opponentBoard.filter(m => m.currentHealth > 0),
          }
        : null
    );

    // Apply Nécropole Maudite weather effect (1 damage to opponent of each slain creature)
    if (b.weatherEffect?.name === 'Nécropole Maudite') {
      if (deadOpponent.length > 0) {
        this.applyDamageToOpponent(deadOpponent.length);
        this.addLog(`Nécropole Maudite : ${deadOpponent.length} dégât(s) au héros adverse.`, 'damage');
      }
      if (deadPlayer.length > 0) {
        this.applyDamageToPlayer(deadPlayer.length);
        this.addLog(`Nécropole Maudite : vous subissez ${deadPlayer.length} dégât(s).`, 'damage');
      }
    }
  }

  // Turn Flow
  endTurn() {
    const b = this.battleState();
    if (!b || b.winner || b.isResolvingTurn) return;

    this.cancelSelection();

    this.battleState.update(s => (s ? { ...s, currentTurn: 'opponent', isResolvingTurn: true, turnTimeLeft: 45 } : null));
    this.sound.playTurnGong();
    this.addLog("Tour de l'adversaire.", 'system');

    setTimeout(() => {
      this.executeAITurn();
    }, 1000);
  }

  private executeAITurn() {
    const b = this.battleState();
    if (!b || b.winner) return;

    const newMaxMana = Math.min(10, b.maxOpponentMana + 1);
    let curMana = newMaxMana;

    const aiSimCards: Card[] = [
      { id: 'ai_c1', name: 'Garde Noir de Fer', cost: 2, type: 'creature', element: 'shadow', rarity: 'common', attack: 2, health: 3, description: 'Provocation', flavorText: '', icon: 'shield', level: 1, stars: 1, shards: 0, shardsRequired: 10, foil: false, taunt: true },
      { id: 'ai_c2', name: 'Mage du Sang', cost: 3, type: 'creature', element: 'fire', rarity: 'rare', attack: 3, health: 2, description: 'Vol de Vie', flavorText: '', icon: 'whatshot', level: 1, stars: 1, shards: 0, shardsRequired: 10, foil: false, lifesteal: true },
      { id: 'ai_c3', name: 'Champion Runique', cost: 4, type: 'creature', element: 'arcane', rarity: 'epic', attack: 4, health: 5, description: '', flavorText: '', icon: 'military_tech', level: 1, stars: 1, shards: 0, shardsRequired: 10, foil: false },
    ];

    const readyAiMinions = b.opponentBoard.map(m => ({ ...m, canAttack: true, hasAttacked: false }));

    readyAiMinions.forEach(minion => {
      const currentBattle = this.battleState();
      if (!currentBattle || currentBattle.winner) return;

      const aliveTaunts = currentBattle.playerBoard.filter(m => m.taunt && m.currentHealth > 0);
      if (aliveTaunts.length > 0) {
        const target = aliveTaunts[0];
        this.damageMinion(target, minion.attack);
        this.damageMinion(minion, target.attack);
        this.addLog(`L'adversaire attaque [${target.name}] avec [${minion.name}] !`, 'opponent');
        this.cleanupDeadMinions();
      } else {
        this.applyDamageToPlayer(minion.attack);
        if (minion.lifesteal) {
          this.battleState.update(s =>
            s
              ? {
                  ...s,
                  opponentHero: { ...s.opponentHero, hp: Math.min(s.opponentHero.maxHp, s.opponentHero.hp + minion.attack) },
                }
              : null
          );
        }
        this.addLog(`L'adversaire frappe votre Héros pour ${minion.attack} dégâts avec [${minion.name}] !`, 'opponent');
      }
    });

    const stillLivingBoard = readyAiMinions.filter(m => m.currentHealth > 0);
    const isDepthFog = b.weatherEffect?.name === 'Brume des Profondeurs';
    const hpBonus = isDepthFog ? 1 : 0;

    for (const card of aiSimCards) {
      if (curMana >= card.cost && stillLivingBoard.length < 7) {
        curMana -= card.cost;
        stillLivingBoard.push({
          instanceId: 'ai_minion_' + Date.now() + Math.random(),
          cardId: card.id,
          name: card.name,
          cost: card.cost,
          element: card.element,
          rarity: card.rarity,
          attack: card.attack || 2,
          currentHealth: (card.health || 2) + hpBonus,
          maxHealth: (card.health || 2) + hpBonus,
          taunt: !!card.taunt,
          divineShield: false,
          lifesteal: !!card.lifesteal,
          canAttack: false,
          hasAttacked: false,
          icon: card.icon,
          imageUrl: resolveCardImageUrl(card),
        });
        this.addLog(`L'adversaire invoque [${card.name}] (${card.attack}/${(card.health || 2) + hpBonus}).`, 'opponent');
      }
    }

    setTimeout(() => {
      const currentBattle = this.battleState();
      if (!currentBattle || currentBattle.winner) return;

      const nextTurn = currentBattle.turn + 1;
      const nextPlayerMaxMana = Math.min(10, currentBattle.maxPlayerMana + 1);

      this.battleState.update(s =>
        s
          ? {
              ...s,
              turn: nextTurn,
              currentTurn: 'player',
              isResolvingTurn: false,
              turnTimeLeft: 45,
              comboCount: 0,
              playerMana: nextPlayerMaxMana,
              maxPlayerMana: nextPlayerMaxMana,
              opponentMana: newMaxMana,
              maxOpponentMana: newMaxMana,
              opponentBoard: stillLivingBoard,
              playerHero: {
                ...s.playerHero,
                energy: Math.min(s.playerHero.maxEnergy, s.playerHero.energy + 1),
              },
              playerBoard: s.playerBoard.map(m => ({ ...m, canAttack: true, hasAttacked: false })),
            }
          : null
      );

      this.drawPlayerCard();
      this.sound.playTurnGong();
      this.addLog(`Tour ${nextTurn} : À vous de jouer !`, 'system');

      const voidBuff = this.gameState.activeBuffs().find(bf => bf.type === 'void_venom');
      if (voidBuff) {
        this.applyDamageToOpponent(2);
        this.spawnFloatingText('opponent-hero', '-2 Miasme', 'damage');
        this.addLog('Venin Abyssal du Néant : 2 dégâts directs perçants infligés au héros adverse !', 'player');
      }

      this.cleanupDeadMinions();
    }, 1200);
  }

  declareWinner(winner: 'player' | 'opponent') {
    if (this.turnInterval) clearInterval(this.turnInterval);
    const b = this.battleState();
    if (!b || b.winner) return;

    const isWin = winner === 'player';
    const midasBuff = this.gameState.activeBuffs().find(bf => bf.type === 'midas_gold');
    const goldMult = midasBuff ? 2 : 1;
    const baseGold = isWin ? 150 : 50;
    const baseXp = isWin ? 100 : 35;
    const goldEarned = (baseGold + Math.round((baseGold * this.gameState.totalRelicGoldBoostPct()) / 100)) * goldMult;
    const xpEarned = baseXp + Math.round((baseXp * this.gameState.totalRelicXpBoostPct()) / 100);
    const eloDelta = isWin ? 25 : -15;

    this.battleState.update(s =>
      s
        ? {
            ...s,
            winner,
            matchRewards: {
              gold: goldEarned,
              xp: xpEarned,
              shards: isWin ? 10 : 3,
              eloDelta,
            },
          }
        : null
    );

    const totalDmg = Math.max(10, this.damageDealtThisMatch());

    if (isWin) {
      this.sound.playVictory();
      try {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#fbbf24', '#38bdf8', '#c084fc'],
        });
      } catch (e) {
        console.log('Confetti not available', e);
      }

      if (b.mode === 'story' && b.storyMissionId) {
        let stars = 1;
        const hpPercent = (b.playerHero.hp / b.playerHero.maxHp) * 100;
        if (hpPercent >= 60 && b.turn <= 8) {
          stars = 3;
        } else if (hpPercent >= 35 || b.turn <= 12) {
          stars = 2;
        }

        const completedObjs = ['obj_1'];
        if (b.playerHero.hp >= 15) completedObjs.push('obj_2');
        if (b.turn <= 9) completedObjs.push('obj_3');

        this.gameState.completeStoryMission(b.storyMissionId, stars, completedObjs);
      }

      if (b.opponentHero?.name) {
        this.gameState.recordMonsterDefeat(b.opponentHero.name);
      }

      this.dailyMissionsService.advanceByTrigger('wins', 1);
      this.questService.advanceByTrigger('wins', 1);
      if (b.playerHero.hp >= 18) {
        this.dailyMissionsService.advanceByTrigger('high_hp_win', 1);
        this.questService.advanceByTrigger('high_hp_win', 1);
      }
      if (b.turn <= 8) {
        this.dailyMissionsService.advanceByTrigger('fast_win', 1);
        this.questService.advanceByTrigger('fast_win', 1);
      }

      this.gameState.rewardEquippedPetAffinity(35);
      this.gameState.recordMatchResult(true, totalDmg, b.mode === 'ranked');
    } else {
      this.sound.playDefeat();
      this.gameState.rewardEquippedPetAffinity(15);
      this.gameState.recordMatchResult(false, totalDmg, b.mode === 'ranked');
    }
  }

  surrender() {
    this.declareWinner('opponent');
  }

  quitBattle() {
    if (this.turnInterval) clearInterval(this.turnInterval);
    this.battleState.set(null);
    this.resetCombatSelections();
    this.sound.playClick();
  }
}
