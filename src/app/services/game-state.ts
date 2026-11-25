import { Injectable, signal, computed, inject, effect } from '@angular/core';
import {
  Hero,
  HeroClass,
  HeroSkin,
  Card,
  CardRarity,
  Deck,
  Potion,
  PotionType,
  PotionRecipe,
  ActivePotionBuff,
  ElixirStatBonuses,
  ElixirStatBadge,
  SkillNode,
  BattlePassTier,
  DailyQuest,
  LeaderboardPlayer,
  Guild,
  ChatMessage,
  TradeOffer,
  TradeResourceKey,
  TradeResourceBundleItem,
  TradeBundle,
  FairTradeAssessment,
  DirectTradeProposal,
  TradeAuditEntry,
  PlayerStats,
  AlchemyResources,
  StoryChapter,
  StoryMission,
  PlayerRelic,
  CompanionPet,
  GuildRank,
  GuildPermission,
  GuildRankDetails,
  GuildMember,
  MedievalUiTheme,
  MedievalThemeOption,
  BestiaryEntry,
  DiscoveryStatus,
  AchievementViewItem
} from '../models/game.model';
import { SoundService } from './sound';
import { ToastNotificationService } from './toast-notification';
import { ALL_GAME_CARDS, resolveCardImageUrl } from '../data/cards-database';
import { ALL_GAME_HEROES, ALL_SKILL_TREES, HERO_PORTRAITS } from '../data/heroes-database';
import { INITIAL_BATTLE_PASS_TIERS } from '../data/season-pass-data';
import { INITIAL_PLAYER_RELICS } from '../data/relics-database';
import { INITIAL_COMPANION_PETS } from '../data/pets-database';
import { INITIAL_BESTIARY_DATABASE } from '../data/bestiary-database';
import { ACHIEVEMENTS_CATALOG } from '../data/achievements-database';

export const GUILD_RANKS_ORDER: GuildRank[] = ['Recrue', 'Chevalier', 'Maître', 'Chef'];

export interface SkinRevealEvent {
  hero: Hero;
  skin: HeroSkin;
  triggeredAt: number;
}

export interface TradeResourceMeta {
  key: TradeResourceKey;
  label: string;
  rarity: CardRarity;
  imageUrl: string;
  unitValueGold: number;
  isRareResource: boolean;
  description: string;
}

export const TRADE_RESOURCE_CATALOG: Record<TradeResourceKey, TradeResourceMeta> = {
  herbs: {
    key: 'herbs',
    label: 'Herbes Lunaires',
    rarity: 'common',
    imageUrl: '/src/assets/images/reagent_herbs_bundle_1795188690757.jpg',
    unitValueGold: 40,
    isRareResource: false,
    description: 'Fagots d’herbes argentées récoltés à l’aube pour les décoctions de base.',
  },
  crystals: {
    key: 'crystals',
    label: 'Cristaux de Mana',
    rarity: 'rare',
    imageUrl: '/src/assets/images/reagent_crystals_bundle_1795188691071.jpg',
    unitValueGold: 75,
    isRareResource: false,
    description: 'Éclats de quartz arcanique amplifiant la puissance des incantations.',
  },
  essences: {
    key: 'essences',
    label: 'Essences Pures',
    rarity: 'epic',
    imageUrl: '/src/assets/images/reagent_essences_bundle_1795188691062.jpg',
    unitValueGold: 160,
    isRareResource: false,
    description: 'Concentré alchimique raffiné utilisé dans les philtres de haut rang.',
  },
  astralDew: {
    key: 'astralDew',
    label: 'Rosée Astrale',
    rarity: 'legendary',
    imageUrl: '/src/assets/images/reagent_astral_dew_1795189809241.jpg',
    unitValueGold: 450,
    isRareResource: true,
    description: 'Réactif céleste rare condensé sous les comètes ; protégé contre la sous-cotation.',
  },
  phoenixAsh: {
    key: 'phoenixAsh',
    label: 'Cendre de Phénix',
    rarity: 'legendary',
    imageUrl: '/src/assets/images/reagent_phoenix_ash_1795189812170.jpg',
    unitValueGold: 620,
    isRareResource: true,
    description: 'Braise immortelle hautement prisée des maîtres alchimistes et forgerons.',
  },
  voidSpore: {
    key: 'voidSpore',
    label: 'Spore du Néant',
    rarity: 'mythic',
    imageUrl: '/src/assets/images/reagent_void_spore_1795189809748.jpg',
    unitValueGold: 780,
    isRareResource: true,
    description: 'Spore abyssale extrêmement rare ; soumise à une double vérification anti-arnaque.',
  },
};

export const GEM_TO_GOLD_RATE = 15;

export function evaluateCardValue(card: Card): number {
  const rarityBase: Record<CardRarity, number> = {
    common: 220,
    rare: 520,
    epic: 1100,
    legendary: 2400,
    mythic: 4500,
  };
  const base = rarityBase[card.rarity] ?? 220;
  const levelMult = 1 + Math.max(0, (card.level || 1) - 1) * 0.15;
  const starMult = 1 + Math.max(0, (card.stars || 1) - 1) * 0.12;
  const foilMult = card.foil ? 1.35 : 1;
  return Math.round(base * levelMult * starMult * foilMult);
}

export function evaluatePotionValue(potion: Potion, quantity = 1): number {
  const rarityBase: Record<CardRarity, number> = {
    common: 180,
    rare: 340,
    epic: 640,
    legendary: 1350,
    mythic: 2200,
  };
  const unit = Math.max(potion.goldCost || 180, rarityBase[potion.rarity] ?? 180);
  return Math.round(unit * Math.max(0, quantity));
}

export function evaluateResourceValue(key: TradeResourceKey, quantity = 1): number {
  const meta = TRADE_RESOURCE_CATALOG[key];
  return Math.round((meta?.unitValueGold ?? 50) * Math.max(0, quantity));
}

export function evaluateTradeBundleValue(bundle: TradeBundle): number {
  const cardVal = bundle.cards.reduce((sum, c) => sum + evaluateCardValue(c), 0);
  const potVal = bundle.potions.reduce((sum, p) => sum + evaluatePotionValue(p.potionData, p.quantity), 0);
  const resVal = bundle.resources.reduce((sum, r) => sum + evaluateResourceValue(r.resourceKey, r.quantity), 0);
  const currencyVal = Math.max(0, bundle.gold) + Math.max(0, bundle.gems) * GEM_TO_GOLD_RATE;
  return Math.round(cardVal + potVal + resVal + currencyVal);
}

export function assessTradeFairness(playerGives: TradeBundle, playerReceives: TradeBundle): FairTradeAssessment {
  const offeredValueGold = evaluateTradeBundleValue(playerGives);
  const requestedValueGold = evaluateTradeBundleValue(playerReceives);
  const highValueFlags: string[] = [];
  const warnings: string[] = [];

  for (const c of playerGives.cards) {
    if (c.rarity === 'legendary' || c.rarity === 'mythic' || c.rarity === 'epic' || c.foil) {
      highValueFlags.push(`Carte ${c.rarity === 'mythic' ? 'Mythique' : c.rarity === 'legendary' ? 'Légendaire' : c.rarity === 'epic' ? 'Épique' : 'Foil'} : ${c.name}`);
    }
  }
  for (const c of playerReceives.cards) {
    if (c.rarity === 'legendary' || c.rarity === 'mythic') {
      highValueFlags.push(`Réception ${c.rarity === 'mythic' ? 'Mythique' : 'Légendaire'} : ${c.name}`);
    }
  }
  for (const p of playerGives.potions) {
    if (p.potionData.rarity === 'legendary' || p.potionData.rarity === 'mythic') {
      highValueFlags.push(`Élixir précieux : ${p.potionData.name}`);
    }
  }
  for (const r of playerGives.resources) {
    if (TRADE_RESOURCE_CATALOG[r.resourceKey]?.isRareResource) {
      highValueFlags.push(`Réactif rare cédé : ${r.label} (x${r.quantity})`);
    }
  }
  for (const r of playerReceives.resources) {
    if (TRADE_RESOURCE_CATALOG[r.resourceKey]?.isRareResource) {
      highValueFlags.push(`Réactif rare reçu : ${r.label} (x${r.quantity})`);
    }
  }

  const givesRareOrMythic =
    playerGives.cards.some(c => c.rarity === 'legendary' || c.rarity === 'mythic') ||
    playerGives.potions.some(p => p.potionData.rarity === 'legendary' || p.potionData.rarity === 'mythic') ||
    playerGives.resources.some(r => TRADE_RESOURCE_CATALOG[r.resourceKey]?.isRareResource);

  const maxVal = Math.max(offeredValueGold, requestedValueGold, 1);
  const ratioPct = offeredValueGold === 0
    ? (requestedValueGold > 0 ? 200 : 100)
    : Math.round((requestedValueGold / offeredValueGold) * 100);
  const imbalancePct = Math.round((Math.abs(offeredValueGold - requestedValueGold) / maxVal) * 100);
  const playerLosesValue = offeredValueGold > requestedValueGold;
  const requiresDoubleConfirm = highValueFlags.length > 0 || offeredValueGold >= 1200 || requestedValueGold >= 1200;

  // Anti-scam detection rules
  if (offeredValueGold > 0 && requestedValueGold === 0) {
    warnings.push('Contre-offre vide détectée : vous céderiez vos biens sans aucune compensation.');
    return {
      offeredValueGold,
      requestedValueGold,
      ratioPct: 0,
      imbalancePct: 100,
      status: 'scam_blocked',
      statusLabel: 'Bloqué · Don Non Compensé',
      summary: 'Le Bouclier Anti-Arnaque bloque les échanges unilatéraux sans contrepartie.',
      warnings,
      highValueFlags,
      requiresDoubleConfirm: true,
    };
  }

  if (requestedValueGold > 0 && offeredValueGold === 0) {
    warnings.push('Votre proposition ne contient aucun objet ou monnaie en échange.');
    return {
      offeredValueGold,
      requestedValueGold,
      ratioPct: 200,
      imbalancePct: 100,
      status: 'scam_blocked',
      statusLabel: 'Bloqué · Offre Vide',
      summary: 'Ajoutez au moins un objet ou une somme équitable pour proposer un échange valide.',
      warnings,
      highValueFlags,
      requiresDoubleConfirm: true,
    };
  }

  if (givesRareOrMythic && playerLosesValue && ratioPct < 58) {
    warnings.push(`Sous-cotation critique d'objet rare ou mythique (${ratioPct}% de sa valeur marchande).`);
    warnings.push('Protection des biens rares activée : exigez une contrepartie d’au moins 58% de la valeur.');
    return {
      offeredValueGold,
      requestedValueGold,
      ratioPct,
      imbalancePct,
      status: 'scam_blocked',
      statusLabel: 'Arnaque Bloquée · Biens Rares',
      summary: `Écart critique détecté (-${100 - ratioPct}% de perte sur objets rares). Échange verrouillé par sécurité.`,
      warnings,
      highValueFlags,
      requiresDoubleConfirm: true,
    };
  }

  if (playerLosesValue && imbalancePct >= 50) {
    warnings.push(`Déséquilibre majeur de ${imbalancePct}% en votre défaveur (${offeredValueGold} Or cédés contre ${requestedValueGold} Or reçus).`);
    return {
      offeredValueGold,
      requestedValueGold,
      ratioPct,
      imbalancePct,
      status: 'scam_blocked',
      statusLabel: 'Arnaque Bloquée · Écart ≥ 50%',
      summary: 'Perte excessive détectée : ce troc est automatiquement bloqué pour protéger votre inventaire.',
      warnings,
      highValueFlags,
      requiresDoubleConfirm: true,
    };
  }

  if (imbalancePct >= 25 || highValueFlags.length > 0) {
    if (imbalancePct >= 25) {
      warnings.push(
        playerLosesValue
          ? `Écart modéré de ${imbalancePct}% en votre défaveur : vérifiez attentivement les détails avant de sceller.`
          : `Écart de ${imbalancePct}% en votre faveur : votre partenaire pourrait exiger une révision.`
      );
    }
    if (highValueFlags.length > 0) {
      warnings.push('Objets de haute rareté impliqués : double confirmation obligatoire requise.');
    }
    return {
      offeredValueGold,
      requestedValueGold,
      ratioPct,
      imbalancePct,
      status: 'caution',
      statusLabel: imbalancePct >= 25 ? 'Vigilance · Écart Modéré' : 'Objets Rares · Double Sceau',
      summary: imbalancePct >= 25
        ? `Échange autorisé avec vigilance (indice d'équité ${ratioPct}%).`
        : 'Échange équitable contenant des objets rares : inspectez les fiches avant confirmation.',
      warnings,
      highValueFlags,
      requiresDoubleConfirm: true,
    };
  }

  return {
    offeredValueGold,
    requestedValueGold,
    ratioPct,
    imbalancePct,
    status: 'balanced',
    statusLabel: 'Échange Équitable',
    summary: `Valeur certifiée équilibrée (${ratioPct}% d’équivalence).`,
    warnings,
    highValueFlags,
    requiresDoubleConfirm,
  };
}

export function createEscrowHash(
  partnerId: string,
  playerGives: TradeBundle,
  playerReceives: TradeBundle,
  revision: number
): string {
  const payload = JSON.stringify({
    p: partnerId,
    r: revision,
    gC: playerGives.cards.map(c => c.id),
    gP: playerGives.potions.map(p => `${p.potionId}:${p.quantity}`),
    gR: playerGives.resources.map(r => `${r.resourceKey}:${r.quantity}`),
    gM: `${playerGives.gold}/${playerGives.gems}`,
    rC: playerReceives.cards.map(c => c.id),
    rP: playerReceives.potions.map(p => `${p.potionId}:${p.quantity}`),
    rR: playerReceives.resources.map(r => `${r.resourceKey}:${r.quantity}`),
    rM: `${playerReceives.gold}/${playerReceives.gems}`,
  });
  let hash = 2166136261;
  for (let i = 0; i < payload.length; i++) {
    hash ^= payload.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const hex = (hash >>> 0).toString(16).toUpperCase().padStart(8, '0');
  return `ESC-${hex.slice(0, 4)}-${hex.slice(4, 8)}-R${revision}`;
}

export const GUILD_RANK_DETAILS: Record<GuildRank, GuildRankDetails> = {
  Chef: {
    rank: 'Chef',
    level: 4,
    label: 'Chef de Guilde',
    title: 'Souverain Suprême',
    icon: 'military_tech',
    color: '#fbbf24',
    bgColor: 'rgba(251, 191, 36, 0.12)',
    borderColor: '#fbbf24',
    description: 'Souverain suprême et garant des traditions. Possède l’autorité absolue sur la trésorerie, la bannière, la diplomatie et tous les membres.',
    permissions: [
      'Messagerie & Proclamations de Taverne',
      'Dons au Trésor & Coffres Hebdomadaires',
      'Recrutement & Acceptation des Postulants',
      'Défis d’Entraînement de Guilde',
      'Accès à la Réserve d’Élixirs de Guilde',
      'Promotion & Rétrogradation des Chevaliers',
      'Exclusion des Éléments Perturbateurs',
      'Rédaction de l’Édit Suprême & MOTD',
      'Déclaration de Raids & Guerres de Guilde',
      'Gestion Absolue de la Trésorerie',
      'Nomination & Révocation des Maîtres',
      'Transfert du Trône ou Dissolution',
    ],
  },
  Maître: {
    rank: 'Maître',
    level: 3,
    label: 'Maître d’Armes',
    title: 'Haut Officier',
    icon: 'auto_awesome',
    color: '#c084fc',
    bgColor: 'rgba(192, 132, 252, 0.12)',
    borderColor: '#c084fc',
    description: 'Haut dignitaire et stratège de guilde. Supervise les troupes, ordonne les promotions des chevaliers et rédige les annonces officielles.',
    permissions: [
      'Messagerie & Proclamations de Taverne',
      'Dons au Trésor & Coffres Hebdomadaires',
      'Recrutement & Acceptation des Postulants',
      'Défis d’Entraînement de Guilde',
      'Accès à la Réserve d’Élixirs de Guilde',
      'Promotion & Rétrogradation (Recrues <-> Chevaliers)',
      'Exclusion des Recrues et Chevaliers',
      'Rédaction de l’Édit Suprême & MOTD',
      'Déclaration de Raids & Guerres de Guilde',
    ],
  },
  Chevalier: {
    rank: 'Chevalier',
    level: 2,
    label: 'Chevalier Émérite',
    title: 'Frère d’Armes',
    icon: 'shield',
    color: '#38bdf8',
    bgColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: '#38bdf8',
    description: 'Combattant aguerri qui a fait ses preuves dans l’arène. Peut accueillir de nouvelles recrues et mener des duels d’entraînement.',
    permissions: [
      'Messagerie & Proclamations de Taverne',
      'Dons au Trésor & Coffres Hebdomadaires',
      'Recrutement de Nouvelles Recrues',
      'Défis d’Entraînement de Guilde',
      'Accès à la Réserve d’Élixirs de Guilde',
    ],
  },
  Recrue: {
    rank: 'Recrue',
    level: 1,
    label: 'Recrue Initiée',
    title: 'Écuyer',
    icon: 'park',
    color: '#a3e635',
    bgColor: 'rgba(163, 230, 53, 0.12)',
    borderColor: '#a3e635',
    description: 'Nouvel arrivant dans la confrérie. Découvre la guilde, participe aux conversations, verse son tribut et récolte les récompenses de raid.',
    permissions: [
      'Messagerie & Proclamations de Taverne',
      'Dons au Trésor & Coffres Hebdomadaires',
      'Participation aux Raids Communs',
    ],
  },
};

export const GUILD_PERMISSIONS_MATRIX: GuildPermission[] = [
  {
    id: 'perm_chat',
    name: 'Taverne & Messagerie',
    description: 'Discuter dans le chat de guilde et envoyer des proclamations / émotes.',
    category: 'social',
    minRank: 'Recrue',
    icon: 'chat',
  },
  {
    id: 'perm_donate',
    name: 'Dons au Trésor',
    description: 'Verser de l’or au trésor pour faire progresser les paliers de coffre de guilde.',
    category: 'social',
    minRank: 'Recrue',
    icon: 'toll',
  },
  {
    id: 'perm_raid_loot',
    name: 'Butin de Raid',
    description: 'Récupérer les coffres et trophées hebdomadaires débloqués par la guilde.',
    category: 'social',
    minRank: 'Recrue',
    icon: 'inventory_2',
  },
  {
    id: 'perm_recruit',
    name: 'Recrutement & Invitations',
    description: 'Inviter de nouveaux duellistes et valider les candidatures en attente.',
    category: 'recruitment',
    minRank: 'Chevalier',
    icon: 'person_add',
  },
  {
    id: 'perm_duels',
    name: 'Duels Fraternels d’Entraînement',
    description: 'Lancer des sessions de duel privées avec les membres de la guilde sans perte d’ELO.',
    category: 'recruitment',
    minRank: 'Chevalier',
    icon: 'sports_kabaddi',
  },
  {
    id: 'perm_elixir_vault',
    name: 'Réserve d’Élixirs de Guilde',
    description: 'Emprunter des potions et ingrédients alchimiques dans la réserve commune.',
    category: 'recruitment',
    minRank: 'Chevalier',
    icon: 'science',
  },
  {
    id: 'perm_promote_knights',
    name: 'Promotion & Rétrogradation d’Armes',
    description: 'Élever une Recrue au rang de Chevalier ou rétrograder un Chevalier.',
    category: 'management',
    minRank: 'Maître',
    icon: 'military_tech',
  },
  {
    id: 'perm_kick',
    name: 'Exclusion Disciplinaire',
    description: 'Bannir des Recrues ou Chevaliers ne respectant pas la charte de guilde.',
    category: 'management',
    minRank: 'Maître',
    icon: 'person_remove',
  },
  {
    id: 'perm_motd',
    name: 'Édition de l’Édit & MOTD',
    description: 'Modifier le Message du Jour et les annonces stratégiques affichées au conseil.',
    category: 'management',
    minRank: 'Maître',
    icon: 'edit_note',
  },
  {
    id: 'perm_wars',
    name: 'Déclaration de Guerres de Guildes',
    description: 'Inscrire la guilde aux tournois inter-guildes et lancer des assauts de raid.',
    category: 'management',
    minRank: 'Maître',
    icon: 'shield_moon',
  },
  {
    id: 'perm_promote_masters',
    name: 'Nomination des Maîtres',
    description: 'Nommer ou destituer des Maîtres de Guilde parmi les Chevaliers.',
    category: 'sovereign',
    minRank: 'Chef',
    icon: 'auto_awesome',
  },
  {
    id: 'perm_treasury',
    name: 'Gestion de la Trésorerie',
    description: 'Dépenser le trésor pour acheter des bonus permanents et améliorations.',
    category: 'sovereign',
    minRank: 'Chef',
    icon: 'savings',
  },
  {
    id: 'perm_sovereignty',
    name: 'Trône & Dissolution',
    description: 'Modifier la bannière, transférer le trône souverain ou dissoudre la guilde.',
    category: 'sovereign',
    minRank: 'Chef',
    icon: 'workspace_premium',
  },
];

@Injectable({
  providedIn: 'root',
})
export class GameStateService {
  private sound = inject(SoundService);
  private toast = inject(ToastNotificationService);

  // Player Profile Signals
  readonly username = signal<string>('Chevalier-Aether');
  readonly currentTitle = signal<string>('Maître des Arcanes');
  readonly titles = signal<string[]>([
    'Novice de la Forge',
    'Chasseur de Chimères',
    'Maître des Arcanes',
    'Fléau des Ombres',
    'Seigneur de Guerre',
    'Champion d\'Aetheria'
  ]);
  readonly avatarId = signal<string>('paladin_avatar');
  readonly frameId = signal<string>('gold_filigree');
  readonly elo = signal<number>(1450);
  readonly gold = signal<number>(3450);
  readonly gems = signal<number>(420);
  readonly shards = signal<number>(185);
  readonly playerLevel = signal<number>(12);
  readonly playerXp = signal<number>(450);
  readonly playerXpRequired = signal<number>(1000);

  // Medieval UI Mode & Ambiance
  readonly medievalTheme = signal<MedievalUiTheme>(
    (typeof localStorage !== 'undefined' && (localStorage.getItem('aetheria_medieval_theme') as MedievalUiTheme)) || 'stone_citadel'
  );

  // Medieval Entrance Audio-Visual Cinematic
  readonly showEntranceCinematic = signal<boolean>(true);

  triggerEntranceCinematic() {
    this.showEntranceCinematic.set(true);
  }

  readonly medievalThemeOptions: MedievalThemeOption[] = [
    {
      id: 'stone_citadel',
      name: 'Forteresse de Granit & Fer Forgé',
      subtitle: 'Donjon Ancestral',
      badge: 'Forgé',
      icon: 'castle',
      previewBg: 'bg-[#120f0c]',
      previewBorder: 'border-[#8b6b43]',
      previewText: 'text-[#c5a880]',
      description: 'Murs de pierre taillée, fer forgé sombre, rivets de bronze et torches rougeoyantes de la garnison.',
    },
    {
      id: 'illuminated_parchment',
      name: 'Parchemin Ancien & Encre Sépia',
      subtitle: 'Scriptorium Royal',
      badge: 'Enluminé',
      icon: 'history_edu',
      previewBg: 'bg-[#1c1611]',
      previewBorder: 'border-[#d4af37]',
      previewText: 'text-[#e5c98d]',
      description: 'Vélin médiéval tanné, enluminures d\'or, sceaux de cire vermillon et reliures en cuir noble.',
    },
    {
      id: 'royal_sanctuary',
      name: 'Sanctuaire Royal d\'Or & d\'Azur',
      subtitle: 'Couronne d\'Aether',
      badge: 'Impérial',
      icon: 'shield_moon',
      previewBg: 'bg-[#0f1524]',
      previewBorder: 'border-[#ffd700]',
      previewText: 'text-[#38bdf8]',
      description: 'Grande salle du trône aux draperies de velours royal, orfèvrerie étincelante et bannières héraldiques.',
    },
  ];

  setMedievalTheme(theme: MedievalUiTheme) {
    this.medievalTheme.set(theme);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('aetheria_medieval_theme', theme);
    }
    this.sound.playClick();
    const opt = this.medievalThemeOptions.find(o => o.id === theme);
    this.toast.showReward(
      'Ambiance Médiévale Activée !',
      opt ? `${opt.name} — ${opt.subtitle}` : 'Nouveau décor féodal appliqué.',
      { badge: 'FÉODAL', rarity: 'legendary', icon: opt?.icon || 'castle' }
    );
  }

  // Selected Active Hero
  readonly selectedHeroClass = signal<HeroClass>('paladin');

  // Alchemy & Inventory
  readonly alchemyResources = signal<AlchemyResources>({
    herbs: 24,
    crystals: 16,
    essences: 8,
    astralDew: 4,
    phoenixAsh: 3,
    voidSpore: 2,
  });

  readonly potions = signal<Potion[]>([
    {
      id: 'pot_health_1',
      name: 'Élixir de Vitalité Majeure',
      type: 'health',
      rarity: 'rare',
      icon: 'favorite',
      imageUrl: '/src/assets/images/potion_health_1795188690942.jpg',
      color: '#ef4444',
      description: '+10 PV initiaux pour votre héros lors des 3 prochains combats.',
      effectLabel: '+10 PV Max au combat',
      durationMatches: 3,
      count: 4,
      goldCost: 250,
      recipe: { herb: 3, crystal: 1, essence: 0 },
      masteryLevel: 2,
      isSecretDiscovered: true,
    },
    {
      id: 'pot_mana_1',
      name: 'Potion de Mana Primordiale',
      type: 'mana',
      rarity: 'epic',
      icon: 'bolt',
      imageUrl: '/src/assets/images/potion_mana_1795188690586.jpg',
      color: '#3b82f6',
      description: 'Commencez vos 2 prochains combats avec +1 Cristal de Mana max dès le Tour 1.',
      effectLabel: '+1 Mana permanent au Tour 1',
      durationMatches: 2,
      count: 2,
      goldCost: 450,
      recipe: { herb: 2, crystal: 3, essence: 1 },
      masteryLevel: 1,
      isSecretDiscovered: true,
    },
    {
      id: 'pot_fury_1',
      name: 'Flasque de Fureur Berserk',
      type: 'fury',
      rarity: 'epic',
      icon: 'local_fire_department',
      imageUrl: '/src/assets/images/potion_fury_1795188690816.jpg',
      color: '#f97316',
      description: 'Vos créatures ont +1 en Attaque lors de leur premier tour d\'invocation pendant 2 combats.',
      effectLabel: '+1 ATQ aux invocations',
      durationMatches: 2,
      count: 3,
      goldCost: 500,
      recipe: { herb: 4, crystal: 2, essence: 2 },
      masteryLevel: 1,
      isSecretDiscovered: true,
    },
    {
      id: 'pot_crit_1',
      name: 'Goutte de Chance Astrale',
      type: 'crit',
      rarity: 'legendary',
      icon: 'auto_awesome',
      imageUrl: '/src/assets/images/potion_crit_1795188690748.jpg',
      color: '#a855f7',
      description: 'Augmente de 25% les chances d\'infliger un coup critique (dégâts x1.5) sur vos sorts pendant 2 combats.',
      effectLabel: '+25% Chance Critique Sorts',
      durationMatches: 2,
      count: 1,
      goldCost: 800,
      recipe: { herb: 5, crystal: 5, essence: 4, astralDew: 1 },
      masteryLevel: 1,
      isSecretDiscovered: true,
    },
    {
      id: 'pot_stone_1',
      name: 'Baume d\'Écorce de Pierre',
      type: 'stone_skin',
      rarity: 'rare',
      icon: 'shield',
      imageUrl: '/src/assets/images/potion_stone_1795188691102.jpg',
      color: '#eab308',
      description: 'Votre héros commence les 3 prochains combats avec 6 points d\'Armure gratuite.',
      effectLabel: '+6 Armure Initiale',
      durationMatches: 3,
      count: 3,
      goldCost: 300,
      recipe: { herb: 3, crystal: 2, essence: 1 },
      masteryLevel: 1,
      isSecretDiscovered: true,
    },
    {
      id: 'pot_xp_1',
      name: 'Nectar de Sagesse Impériale',
      type: 'xp_boost',
      rarity: 'mythic',
      icon: 'military_tech',
      imageUrl: '/src/assets/images/potion_xp_1795188691038.jpg',
      color: '#06b6d4',
      description: 'Double (+100%) l\'XP de héros et les points de Passe de Combat gagnés pendant 4 combats.',
      effectLabel: '+100% XP & Saison Boost',
      durationMatches: 4,
      count: 1,
      goldCost: 1200,
      recipe: { herb: 6, crystal: 6, essence: 4, astralDew: 1 },
      masteryLevel: 1,
      isSecretDiscovered: true,
    },
    {
      id: 'pot_phoenix_rebirth',
      name: 'Élixir de Renaissance du Phénix',
      type: 'phoenix_rebirth',
      rarity: 'legendary',
      icon: 'flare',
      imageUrl: '/src/assets/images/potion_phoenix_1795188691171.jpg',
      color: '#f43f5e',
      description: 'Si votre héros subit un coup fatal en duel, il renaît de ses cendres avec 12 PV et gagne un Bouclier Divin !',
      effectLabel: 'Résurrection +12 PV & Bouclier Divin',
      durationMatches: 2,
      count: 1,
      goldCost: 1500,
      recipe: { herb: 4, crystal: 3, essence: 2, phoenixAsh: 1, astralDew: 1 },
      masteryLevel: 1,
      isSecretDiscovered: true,
    },
    {
      id: 'pot_astral_surge',
      name: 'Quintessence d\'Éclair Astral',
      type: 'astral_surge',
      rarity: 'legendary',
      icon: 'cyclone',
      imageUrl: '/src/assets/images/potion_astral_1795188690717.jpg',
      color: '#38bdf8',
      description: 'Vos sorts infligent +2 dégâts magiques supplémentaires et vous gagnez +1 Énergie Ultime dès le début du combat.',
      effectLabel: '+2 Dégâts Sorts & +1 Ultime',
      durationMatches: 3,
      count: 1,
      goldCost: 1300,
      recipe: { herb: 5, crystal: 4, essence: 3, astralDew: 2 },
      masteryLevel: 1,
      isSecretDiscovered: true,
    },
    {
      id: 'pot_midas_gold',
      name: 'Philtre de Transmutation de Midas',
      type: 'midas_gold',
      rarity: 'epic',
      icon: 'paid',
      imageUrl: '/src/assets/images/potion_midas_1795188689742.jpg',
      color: '#eab308',
      description: 'Les butins d\'arène rapportent +100% d\'Or et doublent les chances de récolte d\'ingrédients rares pendant 3 combats.',
      effectLabel: '+100% Or & x2 Butin Réactifs',
      durationMatches: 3,
      count: 2,
      goldCost: 950,
      recipe: { herb: 4, crystal: 5, essence: 2, astralDew: 1 },
      masteryLevel: 1,
      isSecretDiscovered: true,
    },
    {
      id: 'pot_void_venom',
      name: 'Venin Abyssal du Néant',
      type: 'void_venom',
      rarity: 'mythic',
      icon: 'coronavirus',
      imageUrl: '/src/assets/images/potion_void_1795188690774.jpg',
      color: '#9333ea',
      description: 'Au début de chaque tour, projette un miasme ténébreux infligeant 2 dégâts directs perçants au héros adverse.',
      effectLabel: '2 Dégâts Perçants / tour adverse',
      durationMatches: 3,
      count: 0,
      goldCost: 2200,
      recipe: { herb: 6, crystal: 4, essence: 4, voidSpore: 1, astralDew: 1 },
      masteryLevel: 0,
      isSecretDiscovered: false,
    },
    {
      id: 'pot_titan_blood',
      name: 'Sang de Titan Inaltérable',
      type: 'titan_blood',
      rarity: 'mythic',
      icon: 'shield_moon',
      imageUrl: '/src/assets/images/potion_titan_1795188691526.jpg',
      color: '#d97706',
      description: 'Forge une constitution titanesque : +15 PV Max et +10 Armure d\'acier au début de chacun des 3 prochains combats.',
      effectLabel: '+15 PV Max & +10 Armure',
      durationMatches: 3,
      count: 0,
      goldCost: 2500,
      recipe: { herb: 8, crystal: 6, essence: 5, phoenixAsh: 1, voidSpore: 1 },
      masteryLevel: 0,
      isSecretDiscovered: false,
    },
  ]);

  readonly activeBuffs = signal<ActivePotionBuff[]>([]);

  readonly availableElixirs = computed(() =>
    this.potions().filter(p => p.count > 0)
  );

  readonly activeElixirsCount = computed(() => this.activeBuffs().length);

  readonly elixirStatBonuses = computed<ElixirStatBonuses>(() =>
    this.computeElixirStatBonuses(this.activeBuffs())
  );

  readonly elixirStatBadges = computed<ElixirStatBadge[]>(() =>
    this.computeElixirStatBadges(this.activeBuffs())
  );

  computeElixirStatBonuses(buffs: ActivePotionBuff[]): ElixirStatBonuses {
    const bonuses: ElixirStatBonuses = {
      bonusHp: 0,
      bonusArmor: 0,
      bonusStartingMana: 0,
      bonusMinionAttack: 0,
      bonusSpellDamage: 0,
      bonusSpellCritPct: 0,
      bonusStartingEnergy: 0,
      piercingTurnDamage: 0,
      bonusXpPct: 0,
      bonusGoldPct: 0,
      hasPhoenixRebirth: false,
    };

    for (const b of buffs) {
      switch (b.type) {
        case 'health':
          bonuses.bonusHp += 10;
          break;
        case 'stone_skin':
          bonuses.bonusArmor += 6;
          break;
        case 'mana':
          bonuses.bonusStartingMana += 1;
          break;
        case 'fury':
          bonuses.bonusMinionAttack += 1;
          break;
        case 'crit':
          bonuses.bonusSpellCritPct += 25;
          break;
        case 'xp_boost':
          bonuses.bonusXpPct += 100;
          break;
        case 'phoenix_rebirth':
          bonuses.hasPhoenixRebirth = true;
          break;
        case 'astral_surge':
          bonuses.bonusSpellDamage += 2;
          bonuses.bonusStartingMana += 1;
          bonuses.bonusStartingEnergy += 1;
          break;
        case 'midas_gold':
          bonuses.bonusGoldPct += 100;
          break;
        case 'void_venom':
          bonuses.piercingTurnDamage += 2;
          break;
        case 'titan_blood':
          bonuses.bonusHp += 15;
          bonuses.bonusArmor += 10;
          break;
      }
    }

    return bonuses;
  }

  computeElixirStatBadges(buffs: ActivePotionBuff[]): ElixirStatBadge[] {
    return buffs.map(b => ({
      id: b.potionId,
      label: b.name,
      value: this.getElixirShortBonusLabel(b.type),
      icon: b.icon,
      color: b.color,
      remainingMatches: b.remainingMatches,
    }));
  }

  getElixirShortBonusLabel(type: PotionType): string {
    switch (type) {
      case 'health':
        return '+10 PV Max';
      case 'stone_skin':
        return '+6 Armure';
      case 'mana':
        return '+1 Mana T1';
      case 'fury':
        return '+1 ATQ Invoq.';
      case 'crit':
        return '+25% Crit Sorts';
      case 'xp_boost':
        return '+100% XP';
      case 'phoenix_rebirth':
        return 'Résurrection 12 PV';
      case 'astral_surge':
        return '+2 Sorts · +1 Mana/Én.';
      case 'midas_gold':
        return '+100% Or & Butin';
      case 'void_venom':
        return '2 Dgt/Tour';
      case 'titan_blood':
        return '+15 PV · +10 Armure';
      default:
        return 'Bonus Actif';
    }
  }

  // Relics System & Enchantment / Fusion
  readonly relics = signal<PlayerRelic[]>(INITIAL_PLAYER_RELICS);

  // Equipped relics (up to 3 slots)
  readonly equippedRelics = computed(() => {
    return this.relics().filter(r => r.isEquipped);
  });

  // Total XP Boost % provided by all equipped relics
  readonly totalRelicXpBoostPct = computed(() => {
    return this.equippedRelics().reduce((acc, rel) => acc + rel.totalXpBonusPct, 0);
  });

  // Total Season Pass XP Boost % provided by equipped relics
  readonly totalRelicSeasonXpBoostPct = computed(() => {
    return this.equippedRelics().reduce((acc, rel) => {
      const affix = rel.affixes.find(a => a.type === 'bonus_season_xp_pct');
      return acc + (affix ? affix.value : 0);
    }, 0);
  });

  // Total Gold Boost % provided by equipped relics
  readonly totalRelicGoldBoostPct = computed(() => {
    return this.equippedRelics().reduce((acc, rel) => {
      const affix = rel.affixes.find(a => a.type === 'bonus_gold_pct');
      return acc + (affix ? affix.value : 0);
    }, 0);
  });

  // ========================================================
  // COMPANION PETS (Animaux de Compagnie - Multiplicateur de Dégâts)
  // ========================================================
  readonly pets = signal<CompanionPet[]>(INITIAL_COMPANION_PETS);

  // Equipped Pet
  readonly equippedPet = computed<CompanionPet | null>(() => {
    return this.pets().find(p => p.isEquipped && p.isUnlocked) || null;
  });

  // Active Pet Damage Multiplier (1.0 if none, or 1.15 to 2.50+ depending on rarity & level)
  readonly activePetDamageMultiplier = computed<number>(() => {
    const pet = this.equippedPet();
    return pet ? pet.totalMultiplier : 1.0;
  });

  // Active Pet Bonus % for display (e.g., +30% for 1.30x, +80% for 1.80x, +125% for 2.25x)
  readonly activePetBonusPct = computed<number>(() => {
    const mult = this.activePetDamageMultiplier();
    return Math.round((mult - 1) * 100);
  });

  // ========================================================
  // BESTIARY SYSTEM (Bestiarium Aetheriae)
  // ========================================================
  readonly bestiaryEntries = signal<BestiaryEntry[]>(this.loadInitialBestiary());

  readonly bestiaryTotalCount = computed(() => this.bestiaryEntries().length);
  readonly bestiaryDiscoveredCount = computed(() => this.bestiaryEntries().filter(m => m.discoveryStatus !== 'undiscovered').length);
  readonly bestiaryEncounteredCount = computed(() => this.bestiaryEntries().filter(m => m.encountersCount > 0 || m.discoveryStatus !== 'undiscovered').length);
  readonly bestiaryMasteredCount = computed(() => this.bestiaryEntries().filter(m => m.isMastered).length);
  readonly bestiaryMasteryPct = computed(() => {
    const total = this.bestiaryTotalCount();
    if (total === 0) return 0;
    return Math.round((this.bestiaryMasteredCount() / total) * 100);
  });
  readonly bestiaryDiscoveredPct = computed(() => {
    const total = this.bestiaryTotalCount();
    if (total === 0) return 0;
    return Math.round((this.bestiaryDiscoveredCount() / total) * 100);
  });

  // ========================================================
  // ACHIEVEMENTS & MILESTONE PROGRESSION SYSTEM
  // ========================================================
  readonly claimedAchievementIds = signal<string[]>(this.loadInitialClaimedAchievements());
  private notifiedAchievementIds = new Set<string>(this.loadInitialNotifiedAchievements());
  private achievementTrackerInitialized = false;

  readonly achievements = computed<AchievementViewItem[]>(() => {
    const stats = this.playerStats();
    const eloVal = this.elo();
    const discoveredMonsters = this.bestiaryDiscoveredCount();
    const masteredMonsters = this.bestiaryMasteredCount();
    const unlockedPets = this.pets().filter(p => p.isUnlocked).length;
    const equippedRelicsCount = this.equippedRelics().length;
    const storyStars = this.totalStoryStars();
    const storyPct = this.storyProgressPercentage();
    const levelVal = this.playerLevel();
    const discoveredPotions = this.potions().filter(p => p.isSecretDiscovered).length;
    const claimedSet = new Set(this.claimedAchievementIds());

    const resolveCurrentValue = (id: string): number => {
      switch (id) {
        case 'ach_wins_10':
        case 'ach_wins_50':
        case 'ach_wins_100':
        case 'ach_wins_250':
          return stats.wins;
        case 'ach_streak_5':
        case 'ach_streak_10':
          return stats.highestWinStreak;
        case 'ach_damage_1000':
        case 'ach_damage_5000':
          return stats.totalDamageDealt;
        case 'ach_elo_1600':
        case 'ach_elo_2000':
          return eloVal;
        case 'ach_bestiary_6':
        case 'ach_bestiary_full':
          return discoveredMonsters;
        case 'ach_bestiary_mastery_6':
        case 'ach_bestiary_mastery_all':
          return masteredMonsters;
        case 'ach_cards_played_250':
        case 'ach_cards_played_1000':
          return stats.cardsPlayed;
        case 'ach_cards_upgraded_20':
          return stats.cardsUpgraded;
        case 'ach_packs_25':
          return stats.packsOpened;
        case 'ach_pets_5':
          return unlockedPets;
        case 'ach_relics_3':
          return equippedRelicsCount;
        case 'ach_story_stars_12':
          return storyStars;
        case 'ach_story_complete':
          return storyPct;
        case 'ach_level_15':
          return levelVal;
        case 'ach_potions_25':
          return stats.potionsConsumed;
        case 'ach_potions_discovered_all':
          return discoveredPotions;
        default:
          return 0;
      }
    };

    return ACHIEVEMENTS_CATALOG.map(def => {
      const rawCurrent = resolveCurrentValue(def.id);
      const current = Math.min(def.target, Math.max(0, rawCurrent));
      const progressPct = def.target > 0 ? Math.min(100, Math.round((current / def.target) * 100)) : 100;
      const isUnlocked = rawCurrent >= def.target;
      const isClaimed = claimedSet.has(def.id);
      return {
        ...def,
        current,
        progressPct,
        isUnlocked,
        isClaimed,
        canClaim: isUnlocked && !isClaimed,
      };
    });
  });

  readonly achievementsTotalCount = computed(() => this.achievements().length);
  readonly achievementsUnlockedCount = computed(() => this.achievements().filter(a => a.isUnlocked).length);
  readonly achievementsClaimableCount = computed(() => this.achievements().filter(a => a.canClaim).length);
  readonly achievementPointsEarned = computed(() =>
    this.achievements()
      .filter(a => a.isUnlocked)
      .reduce((sum, a) => sum + a.points, 0)
  );
  readonly achievementPointsTotal = computed(() =>
    ACHIEVEMENTS_CATALOG.reduce((sum, a) => sum + a.points, 0)
  );
  readonly achievementCompletionPct = computed(() => {
    const total = this.achievementsTotalCount();
    if (total === 0) return 0;
    return Math.round((this.achievementsUnlockedCount() / total) * 100);
  });
  readonly achievementHonorRank = computed(() => {
    const pts = this.achievementPointsEarned();
    if (pts >= 800) return 'Légende Immortelle';
    if (pts >= 500) return 'Grand Héraut d’Aether';
    if (pts >= 250) return 'Paladin Émérite';
    if (pts >= 100) return 'Chevalier Honoré';
    return 'Écuyer Aspirant';
  });

  // Heroes Catalog
  readonly heroes = signal<Hero[]>(ALL_GAME_HEROES);

  // Skill Trees Catalog with Dual Branch Specializations
  readonly skillTrees = signal<SkillNode[]>(ALL_SKILL_TREES);

  // Master Card Library (1050+ Cards)
  readonly cards = signal<Card[]>(ALL_GAME_CARDS);

  // Decks Catalog
  readonly decks = signal<Deck[]>([
    {
      id: 'deck_pal_starter',
      name: 'Lumière Invincible',
      heroClass: 'paladin',
      cardIds: [
        'c_pal_squire', 'c_pal_squire', 'c_pal_holy_strike', 'c_pal_holy_strike',
        'c_pal_crusader', 'c_pal_crusader', 'c_neu_griffin', 'c_pal_bastion',
        'c_neu_titan', 'c_pal_archangel'
      ],
      wins: 14,
      losses: 4,
      isFavorite: true,
      cardBack: 'gold_crest',
    },
    {
      id: 'deck_mage_burn',
      name: 'Tempête Arcanique',
      heroClass: 'mage',
      cardIds: [
        'c_mag_apprentice', 'c_mag_apprentice', 'c_mag_frost_golem', 'c_mag_frost_golem',
        'c_mag_fireball', 'c_mag_fireball', 'c_mag_arcane_nova', 'c_neu_griffin',
        'c_neu_titan', 'c_mag_dragon'
      ],
      wins: 18,
      losses: 7,
      isFavorite: false,
      cardBack: 'arcane_rune',
    },
    {
      id: 'deck_rogue_shadow',
      name: 'Dagues Nocturnes',
      heroClass: 'rogue',
      cardIds: [
        'c_rog_infiltrator', 'c_rog_infiltrator', 'c_rog_shadow_blade', 'c_rog_shadow_blade',
        'c_neu_griffin', 'c_pal_crusader', 'c_rog_shadow_master', 'c_neu_titan',
        'c_pal_squire', 'c_mag_fireball'
      ],
      wins: 9,
      losses: 5,
      isFavorite: false,
      cardBack: 'shadow_dagger',
    },
  ]);

  readonly activeDeckId = signal<string>('deck_pal_starter');

  // Battle Pass Progress (Saison 1: L'Éveil des Dragons)
  readonly seasonNumber = signal<number>(1);
  readonly seasonName = signal<string>('L\'Éveil des Dragons Célestes');
  readonly seasonEndsInDays = signal<number>(24);
  readonly seasonXp = signal<number>(1450);
  readonly seasonTier = signal<number>(6);
  readonly isSeasonPassPremium = signal<boolean>(false);

  readonly battlePassTiers = signal<BattlePassTier[]>(INITIAL_BATTLE_PASS_TIERS);

  // Daily Quests
  readonly dailyQuests = signal<DailyQuest[]>([
    {
      id: 'q_1',
      title: 'Maître de l\'Arène',
      description: 'Remportez 2 combats en Arène Compétitive.',
      target: 2,
      current: 1,
      rewardGold: 350,
      rewardXp: 120,
      isCompleted: false,
      isClaimed: false,
      icon: 'swords',
    },
    {
      id: 'q_2',
      title: 'Alchimiste Novice',
      description: 'Concoctez 1 potion ou élixir dans votre Chaudron.',
      target: 1,
      current: 1,
      rewardGold: 250,
      rewardXp: 80,
      isCompleted: true,
      isClaimed: false,
      icon: 'science',
    },
    {
      id: 'q_3',
      title: 'Forgeur d\'Aether',
      description: 'Améliorez ou fusionnez 1 carte dans la Forge.',
      target: 1,
      current: 0,
      rewardGold: 300,
      rewardXp: 100,
      isCompleted: false,
      isClaimed: false,
      icon: 'hardware',
    },
    {
      id: 'q_4',
      title: 'Déchaînement de Mana',
      description: 'Jouez 15 cartes au total durant vos matchs.',
      target: 15,
      current: 11,
      rewardGold: 400,
      rewardXp: 150,
      isCompleted: false,
      isClaimed: false,
      icon: 'bolt',
    },
  ]);

  // Daily Streak Calendar (7 Days)
  readonly dailyStreak = signal<number>(4);
  readonly hasClaimedDailyToday = signal<boolean>(false);
  readonly dailyCalendar = [
    { day: 1, reward: '300 Or', icon: 'toll', claimed: true },
    { day: 2, reward: '20 Gemmes', icon: 'diamond', claimed: true },
    { day: 3, reward: '1x Potion Vitalité', icon: 'favorite', claimed: true },
    { day: 4, reward: '40 Éclats', icon: 'auto_fix_high', claimed: true },
    { day: 5, reward: '1x Booster Magique', icon: 'inventory_2', claimed: false },
    { day: 6, reward: '600 Or & 50 Gemmes', icon: 'savings', claimed: false },
    { day: 7, reward: 'Carte Mythique Gratuite', icon: 'workspace_premium', claimed: false },
  ];

  // Leaderboard Simulation
  readonly leaderboard = signal<LeaderboardPlayer[]>([
    { rank: 1, username: 'Valerius_Rex', title: 'Grand Maréchal d\'Aether', elo: 2450, tierName: 'Légende', avatarIcon: 'shield_moon', frameColor: '#fbbf24', guildTag: '[TITAN]', wins: 142, losses: 18, favoriteClass: 'paladin', isOnline: true },
    { rank: 2, username: 'Morgane_Noir', title: 'Liche Suprême', elo: 2380, tierName: 'Grand Maître', avatarIcon: 'coronavirus', frameColor: '#c084fc', guildTag: '[SHADOW]', wins: 129, losses: 24, favoriteClass: 'necromancer', isOnline: true },
    { rank: 3, username: 'Ignis_Caller', title: 'Archimage Astral', elo: 2310, tierName: 'Grand Maître', avatarIcon: 'auto_awesome', frameColor: '#38bdf8', guildTag: '[SOLAR]', wins: 115, losses: 20, favoriteClass: 'mage', isOnline: false },
    { rank: 4, username: 'SilentBlade_FR', title: 'Ombre Mortelle', elo: 2240, tierName: 'Maître', avatarIcon: 'visibility_off', frameColor: '#34d399', guildTag: '[ASSASSIN]', wins: 98, losses: 29, favoriteClass: 'rogue', isOnline: true },
    { rank: 5, username: 'Chevalier-Aether', title: 'Maître des Arcanes', elo: 1450, tierName: 'Or I', avatarIcon: 'military_tech', frameColor: '#f59e0b', guildTag: '[AETHER]', wins: 41, losses: 16, favoriteClass: 'paladin', isOnline: true },
    { rank: 6, username: 'Sylva_Keeper', title: 'Gardien d\'Yggdrasil', elo: 1420, tierName: 'Or I', avatarIcon: 'park', frameColor: '#a3e635', guildTag: '[GAIA]', wins: 38, losses: 19, favoriteClass: 'druid', isOnline: false },
    { rank: 7, username: 'Kael_Sunstrider', title: 'Seigneur Solaire', elo: 1390, tierName: 'Or II', avatarIcon: 'wb_sunny', frameColor: '#f59e0b', guildTag: '[SOLAR]', wins: 35, losses: 21, favoriteClass: 'paladin', isOnline: true },
  ]);

  // Guild
  readonly guild = signal<Guild>({
    id: 'guild_aether',
    name: 'Les Gardiens d\'Aether',
    tag: 'AETHER',
    emblem: 'shield',
    level: 4,
    description: 'Guilde médiévale compétitive et fraternelle. Entraide, dons de cartes et tournois du week-end !',
    motd: 'Guerre de Guilde ce samedi à 20h ! Tous les membres de rang Chevalier et supérieur sont conviés au conseil de guerre.',
    members: [
      { id: 'm_1', username: 'Chevalier-Aether', role: 'Chef', rank: 'Chef', elo: 1450, donatedGold: 3200, avatarIcon: 'military_tech', lastActive: 'En ligne', joinedAt: 'Fondateur' },
      { id: 'm_2', username: 'Aldric_Le_Brave', role: 'Maître', rank: 'Maître', elo: 1380, donatedGold: 2100, avatarIcon: 'shield_moon', lastActive: 'Il y a 2h', joinedAt: 'Il y a 3 mois' },
      { id: 'm_3', username: 'Serena_Mage', role: 'Chevalier', rank: 'Chevalier', elo: 1290, donatedGold: 1400, avatarIcon: 'auto_awesome', lastActive: 'Il y a 5h', joinedAt: 'Il y a 1 mois' },
      { id: 'm_4', username: 'Gaston_L_Hache', role: 'Recrue', rank: 'Recrue', elo: 1150, donatedGold: 600, avatarIcon: 'swords', lastActive: 'Hier', joinedAt: 'Il y a 4 jours' },
      { id: 'm_5', username: 'Elowen_Verdoyante', role: 'Recrue', rank: 'Recrue', elo: 1080, donatedGold: 350, avatarIcon: 'park', lastActive: 'Il y a 1j', joinedAt: 'Hier' },
    ],
    maxMembers: 30,
    treasury: 12400,
    weeklyGoal: 20000,
    perks: [
      '+10% Or bonus après chaque victoire en arène',
      'Accès exclusif à la salle de troc de guilde',
      'Réduction de -15% sur les ingrédients d\'alchimie'
    ],
  });

  // Chat messages
  readonly chatMessages = signal<ChatMessage[]>([
    { id: 'c1', channel: 'global', sender: 'Valerius_Rex', senderTag: '[TITAN]', avatarIcon: 'shield_moon', badge: 'Légende', timestamp: '14:22', text: 'Qui pour un duel amical en testant le nouveau deck Nécromancien ?' },
    { id: 'c2', channel: 'global', sender: 'Morgane_Noir', senderTag: '[SHADOW]', avatarIcon: 'coronavirus', badge: 'Grand Maître', timestamp: '14:23', text: 'Attention au sort Nova Arcanique d\'Éléonore, le clean de board est violent.' },
    { id: 'c3', channel: 'guild', sender: 'Aldric_Le_Brave', senderTag: '[AETHER]', avatarIcon: 'shield_moon', timestamp: '14:25', text: 'Bienvenue à tous ! N\'oubliez pas de faire vos dons hebdomadaires pour débloquer le coffre de guilde Rang 5.' },
    { id: 'c4', channel: 'guild', sender: 'Chevalier-Aether', senderTag: '[AETHER]', avatarIcon: 'military_tech', badge: 'Meneur', timestamp: '14:26', text: 'Gloire à Aetheria ! J\'ai mis des potions de vitalité en troc si quelqu\'un en a besoin.' },
  ]);

  // Market & Trade Offers
  readonly tradeOffers = signal<TradeOffer[]>([
    {
      id: 'trade_1',
      sellerId: 'user_valerius',
      sellerName: 'Valerius_Rex',
      sellerAvatar: 'shield_moon',
      sellerElo: 2450,
      itemType: 'card',
      cardData: {
        id: 'c_pal_archangel',
        name: 'Archange de la Rédemption',
        cost: 6,
        type: 'creature',
        element: 'light',
        rarity: 'legendary',
        attack: 6,
        health: 7,
        maxHealth: 7,
        description: 'Vol de Vie. Cri de Guerre: Rend 5 PV à votre Héros.',
        flavorText: 'Ses ailes incandescentes dissipent les ténèbres millénaires.',
        icon: 'flare',
        imageUrl: '/src/assets/images/card_light_warrior_1794650132664.jpg',
        level: 1,
        stars: 3,
        shards: 10,
        shardsRequired: 50,
        foil: true,
        lifesteal: true,
      },
      priceGold: 1800,
      priceGems: 120,
      listedAgo: 'Il y a 10 min',
      isFeatured: true,
    },
    {
      id: 'trade_2',
      sellerId: 'user_morgane',
      sellerName: 'Morgane_Noir',
      sellerAvatar: 'coronavirus',
      sellerElo: 2380,
      itemType: 'potion',
      potionData: {
        id: 'pot_xp_1',
        name: 'Nectar de Sagesse Impériale',
        type: 'xp_boost',
        rarity: 'mythic',
        icon: 'military_tech',
        imageUrl: '/src/assets/images/potion_xp_1795188691038.jpg',
        color: '#06b6d4',
        description: 'Double (+100%) l\'XP de héros et points de saison pendant 4 combats.',
        effectLabel: '+100% XP Boost',
        durationMatches: 4,
        count: 2,
        goldCost: 1200,
      },
      priceGold: 950,
      priceGems: 60,
      listedAgo: 'Il y a 35 min',
      isFeatured: false,
    },
    {
      id: 'trade_3',
      sellerId: 'user_kael',
      sellerName: 'Kael_Sunstrider',
      sellerAvatar: 'wb_sunny',
      sellerElo: 1390,
      itemType: 'card',
      cardData: {
        id: 'c_mag_frost_golem',
        name: 'Golem de Givre Éternel (Foil)',
        cost: 4,
        type: 'creature',
        element: 'ice',
        rarity: 'rare',
        attack: 3,
        health: 6,
        maxHealth: 6,
        description: 'Provocation. Réduit les dégâts subis de 1.',
        flavorText: 'Sculpté dans les glaciers d\'Astral Peak.',
        icon: 'ac_unit',
        imageUrl: '/src/assets/images/card_ice_golem_1794650134695.jpg',
        level: 2,
        stars: 2,
        shards: 15,
        shardsRequired: 30,
        foil: true,
        taunt: true,
      },
      priceGold: 650,
      priceGems: 40,
      listedAgo: 'Il y a 1h',
      isFeatured: false,
    },
    {
      id: 'trade_4',
      sellerId: 'user_ignis',
      sellerName: 'Pyra_Cendrelame',
      sellerAvatar: 'local_fire_department',
      sellerElo: 2140,
      itemType: 'potion',
      potionData: {
        id: 'pot_phoenix_rebirth',
        name: 'Élixir de Renaissance du Phénix',
        type: 'phoenix_rebirth',
        rarity: 'legendary',
        icon: 'flare',
        imageUrl: '/src/assets/images/potion_phoenix_1795188691171.jpg',
        color: '#f43f5e',
        description: 'Si votre héros subit un coup fatal en duel, il renaît avec 12 PV et un Bouclier Divin.',
        effectLabel: 'Résurrection +12 PV',
        durationMatches: 2,
        count: 1,
        goldCost: 1500,
      },
      priceGold: 1350,
      priceGems: 75,
      listedAgo: 'Il y a 22 min',
      isFeatured: true,
    },
    {
      id: 'trade_5',
      sellerId: 'user_sylva',
      sellerName: 'Sylva_Vertefeuille',
      sellerAvatar: 'eco',
      sellerElo: 1840,
      itemType: 'card',
      cardData: {
        id: 'c_dru_ancient_treant',
        name: 'Ancien Sylvestre de Verdelune',
        cost: 5,
        type: 'creature',
        element: 'nature',
        rarity: 'epic',
        attack: 4,
        health: 8,
        maxHealth: 8,
        description: 'Provocation. Soigne votre héros de 3 PV à la fin de chaque tour.',
        flavorText: 'Ses racines puisent directement dans les veines d\'Aether.',
        icon: 'park',
        imageUrl: '/src/assets/images/card_nature_treant_1794650135742.jpg',
        level: 2,
        stars: 2,
        shards: 20,
        shardsRequired: 40,
        foil: true,
        taunt: true,
      },
      priceGold: 1100,
      priceGems: 55,
      listedAgo: 'Il y a 48 min',
      isFeatured: false,
    },
    {
      id: 'trade_6',
      sellerId: 'user_midas',
      sellerName: 'Aurelius_Banquier',
      sellerAvatar: 'paid',
      sellerElo: 1995,
      itemType: 'potion',
      potionData: {
        id: 'pot_midas_gold',
        name: 'Philtre de Transmutation de Midas',
        type: 'midas_gold',
        rarity: 'epic',
        icon: 'paid',
        imageUrl: '/src/assets/images/potion_midas_1795188689742.jpg',
        color: '#eab308',
        description: 'Double l\'Or remporté en arène et augmente les trouvailles de réactifs rares.',
        effectLabel: '+100% Or & x2 Butin',
        durationMatches: 3,
        count: 2,
        goldCost: 950,
      },
      priceGold: 820,
      priceGems: 45,
      listedAgo: 'Il y a 1h 15',
      isFeatured: false,
      sellerTrustScore: 95,
    },
  ]);

  // Peer-to-Peer Protected Direct Trade Proposals (Chambre de Troc Escrow)
  readonly directTradeProposals = signal<DirectTradeProposal[]>(this.createInitialTradeProposals());

  readonly pendingIncomingTradesCount = computed(() =>
    this.directTradeProposals().filter(
      p => p.direction === 'incoming' && (p.status === 'pending_review' || p.status === 'locked_scam')
    ).length
  );

  // Immutable Trade Audit & Anti-Scam Ledger
  readonly tradeAuditLog = signal<TradeAuditEntry[]>([
    {
      id: 'audit_init_1',
      timestamp: 'Aujourd’hui · 13:40',
      type: 'scam_prevented',
      partnerName: 'Corbeau_Furtif',
      summary: 'Tentative de sous-cotation sur Phénix Solaire (offre à 90 Or bloquée automatiquement)',
      valueGold: 7533,
      escrowHash: 'ESC-9A14-B20E-R1',
      fairnessStatus: 'scam_blocked',
    },
    {
      id: 'audit_init_2',
      timestamp: 'Hier · 19:15',
      type: 'p2p_trade',
      partnerName: 'Serena_Mage',
      summary: 'Échange vérifié : 2x Cristaux de Mana + 220 Or ↔ 1x Baume d’Écorce de Pierre',
      valueGold: 370,
      escrowHash: 'ESC-4D72-C81F-R2',
      fairnessStatus: 'balanced',
    },
  ]);

  // Overall Player Performance Stats
  readonly playerStats = signal<PlayerStats>({
    totalMatches: 57,
    wins: 41,
    losses: 16,
    rankedMatches: 34,
    rankedWins: 24,
    currentWinStreak: 4,
    highestWinStreak: 8,
    totalDamageDealt: 1480,
    cardsPlayed: 320,
    potionsConsumed: 18,
    cardsUpgraded: 14,
    packsOpened: 19,
    criticalHits: 42,
    legendariesOwned: 4,
    favoriteCardName: 'Archange de la Rédemption',
  });

  // Victory Counter Golden Gain Animation State
  readonly recentVictoryGain = signal<{ id: number; winsCount: number; rankedWinsCount: number; isRanked: boolean } | null>(null);
  readonly pendingRankedVictoryCelebration = signal<boolean>(false);

  // Skill Tree Growth & Completion Reward State (1000 Gold + 150 Gems)
  readonly claimedSkillTreeRewardIds = signal<HeroClass[]>([]);
  readonly lastSkillTreeUpgradeEvent = signal<{ id: number; heroClass: HeroClass; talentId: string; unlockedCount: number; totalCount: number } | null>(null);
  readonly lastSkillTreeCompletionReward = signal<{ id: number; heroClass: HeroClass; heroName: string; gold: number; gems: number } | null>(null);

  // Cloud Sync Simulation
  readonly cloudSyncId = signal<string>('AETH-9842-SYNC-EU');
  readonly lastCloudSync = signal<string>('À l\'instant');
  readonly isAutoSaving = signal<boolean>(false);

  // Fullscreen Skin Unlock Reveal Overlay State
  readonly pendingSkinReveal = signal<SkinRevealEvent | null>(null);

  // Computed Values
  readonly selectedHero = computed(() => {
    const heroId = this.selectedHeroClass();
    return this.heroes().find(h => h.id === heroId) || this.heroes()[0];
  });

  readonly activeSelectedHeroSkin = computed<HeroSkin>(() => {
    return this.getHeroActiveSkin(this.selectedHero());
  });

  readonly unlockedSkinsCount = computed(() =>
    this.heroes().reduce((sum, h) => sum + h.skins.filter(s => s.isUnlocked).length, 0)
  );

  readonly totalSkinsCount = computed(() =>
    this.heroes().reduce((sum, h) => sum + h.skins.length, 0)
  );

  getHeroActiveSkin(hero: Hero): HeroSkin {
    return hero.skins.find(s => s.id === hero.activeSkinId) || hero.skins[0];
  }

  readonly activeDeck = computed(() => {
    const deckId = this.activeDeckId();
    return this.decks().find(d => d.id === deckId) || this.decks()[0];
  });

  readonly divisionName = computed(() => {
    const score = this.elo();
    if (score >= 2400) return 'Légende';
    if (score >= 2200) return 'Grand Maître';
    if (score >= 2000) return 'Maître';
    if (score >= 1800) return 'Diamant';
    if (score >= 1600) return 'Platine';
    if (score >= 1400) return 'Or I';
    if (score >= 1200) return 'Argent I';
    return 'Bronze';
  });

  readonly tierName = computed(() => this.divisionName());

  readonly winRate = computed(() => {
    const total = this.playerStats().totalMatches;
    if (total === 0) return 0;
    return Math.round((this.playerStats().wins / total) * 100);
  });

  // Story Campaign Signals
  readonly activeStoryMission = signal<StoryMission | null>(null);
  readonly lastCompletedMissionOutro = signal<StoryMission | null>(null);

  readonly storyChapters = signal<StoryChapter[]>([
    {
      id: 'chap_1',
      actNumber: 1,
      title: 'L\'Éveil d\'Aetheria',
      subtitle: 'La Menace des Frontières',
      description: 'Les brumes corrompues envahissent les confins du royaume. Prenez vos premières armes et défendez la garnison.',
      bannerIcon: 'shield_moon',
      color: '#d4af37',
      isUnlocked: true,
      missions: [
        {
          id: 'story_1_1',
          chapterId: 'chap_1',
          order: 1,
          title: 'La Garnison Frontalière',
          subtitle: 'Premiers pas d\'un champion',
          location: 'Remparts de Bois-Doran',
          enemyName: 'Capitaine Brann',
          enemyTitle: 'Commandant de la Garde Déserteur',
          enemyClass: 'paladin',
          enemyAvatar: 'shield_moon',
          enemyHp: 24,
          enemyArmor: 2,
          bossPowerName: 'Discipline de Fer',
          bossPowerDesc: 'Gagne +1 Armure lorsqu\'une créature ennemie attaque.',
          storyIntro: [
            { speaker: 'Narrateur', avatarIcon: 'auto_stories', side: 'left', text: 'Aux confins orientaux du royaume, la garnison de Bois-Doran ne répond plus aux missives de la capitale...' },
            { speaker: 'Capitaine Brann', avatarIcon: 'shield_moon', side: 'right', text: 'Halte là, vagabond ! Nul ne passe cette porte sans payer le tribut en sang ou en or !' },
            { speaker: 'Votre Héros', avatarIcon: 'military_tech', side: 'left', text: 'Vous avez trahi vos serments, Brann. Rangez votre arme ou préparez-vous à être châtié.' }
          ],
          storyOutro: [
            { speaker: 'Capitaine Brann', avatarIcon: 'shield_moon', side: 'right', text: 'Pitié... Les ténèbres dans la forêt... Elles chuchotent à nos esprits...' },
            { speaker: 'Votre Héros', avatarIcon: 'military_tech', side: 'left', text: 'La garnison est libérée. Il est temps d\'explorer l\'origine de cette corruption.' }
          ],
          starsEarned: 0,
          objectives: [
            { id: 'obj_1', text: 'Remporter la victoire contre le Capitaine Brann', isCompleted: false },
            { id: 'obj_2', text: 'Terminer le combat avec au moins 15 PV', isCompleted: false },
            { id: 'obj_3', text: 'Jouer au moins 3 créatures au cours du duel', isCompleted: false }
          ],
          rewards: {
            gold: 250,
            gems: 30,
            shards: 15,
            cardRewardId: 'card_sol_1',
            cardRewardName: 'Sentinelle d\'Aether',
            firstClearClaimed: false
          },
          isUnlocked: true,
          isCompleted: false
        },
        {
          id: 'story_1_2',
          chapterId: 'chap_1',
          order: 2,
          title: 'Le Bosquet des Murmures',
          subtitle: 'La flore corrompue',
          location: 'Sylve Obscure',
          enemyName: 'Corbeau Sylvestre',
          enemyTitle: 'Chaman des Racines Noires',
          enemyClass: 'druid',
          enemyAvatar: 'forest',
          enemyHp: 28,
          enemyArmor: 0,
          bossPowerName: 'Épine Vorace',
          bossPowerDesc: 'Inflige 1 dégât à la créature la plus faible à chaque tour.',
          storyIntro: [
            { speaker: 'Narrateur', avatarIcon: 'auto_stories', side: 'left', text: 'Les arbres ancestraux gémissent sous l\'emprise de lianes violettes palpitantes.' },
            { speaker: 'Corbeau Sylvestre', avatarIcon: 'forest', side: 'right', text: 'La sève noire nourrit nos racines... Votre chair nourrira notre renaissance !' },
            { speaker: 'Votre Héros', avatarIcon: 'military_tech', side: 'left', text: 'Cette forêt doit être purifiée par le feu et la lame.' }
          ],
          storyOutro: [
            { speaker: 'Corbeau Sylvestre', avatarIcon: 'forest', side: 'right', text: 'La sève... s\'éteint... Mais le sanctuaire d\'eau est déjà tombé...' },
            { speaker: 'Votre Héros', avatarIcon: 'military_tech', side: 'left', text: 'Le mal s\'étend vers le Temple Sacré. Nous devons faire vite !' }
          ],
          starsEarned: 0,
          objectives: [
            { id: 'obj_1', text: 'Vaincre le Corbeau Sylvestre', isCompleted: false },
            { id: 'obj_2', text: 'Détruire au moins 3 créatures sylvestres', isCompleted: false },
            { id: 'obj_3', text: 'Utiliser au moins 2 sorts élémentaires', isCompleted: false }
          ],
          rewards: {
            gold: 350,
            gems: 40,
            shards: 25,
            cardRewardId: 'card_nat_1',
            cardRewardName: 'Tréant Protecteur',
            firstClearClaimed: false
          },
          isUnlocked: false,
          isCompleted: false
        },
        {
          id: 'story_1_3',
          chapterId: 'chap_1',
          order: 3,
          title: 'Le Sanctuaire Brisé',
          subtitle: 'L\'autel profané',
          location: 'Ruines du Soleil Couchant',
          enemyName: 'Dame Vespera',
          enemyTitle: 'Prêtresse des Ombres',
          enemyClass: 'necromancer',
          enemyAvatar: 'coronavirus',
          enemyHp: 32,
          enemyArmor: 3,
          bossPowerName: 'Siphon d\'Âme',
          bossPowerDesc: 'Soigne 2 PV au héros adverse lorsqu\'une créature périt.',
          storyIntro: [
            { speaker: 'Dame Vespera', avatarIcon: 'coronavirus', side: 'right', text: 'Le Soleil ne se lèvera plus sur ces terres. Donnez-moi votre essence vitale !' },
            { speaker: 'Votre Héros', avatarIcon: 'military_tech', side: 'left', text: 'La lumière d\'Aetheria ne faiblira pas devant votre culte occulte.' }
          ],
          storyOutro: [
            { speaker: 'Dame Vespera', avatarIcon: 'coronavirus', side: 'right', text: 'Même si je tombe, Malgath ouvre déjà les portes des Cryptes...' },
            { speaker: 'Votre Héros', avatarIcon: 'military_tech', side: 'left', text: 'Malgath... Le seigneur des nécropoles s\'est réveillé.' }
          ],
          starsEarned: 0,
          objectives: [
            { id: 'obj_1', text: 'Triompher de Dame Vespera', isCompleted: false },
            { id: 'obj_2', text: 'Garder l\'avantage sur le plateau pendant 4 tours', isCompleted: false },
            { id: 'obj_3', text: 'Terminer en moins de 8 tours', isCompleted: false }
          ],
          rewards: {
            gold: 450,
            gems: 50,
            shards: 35,
            cardRewardId: 'card_lum_2',
            cardRewardName: 'Rayon Rédempteur',
            firstClearClaimed: false
          },
          isUnlocked: false,
          isCompleted: false
        },
        {
          id: 'story_1_4',
          chapterId: 'chap_1',
          order: 4,
          title: 'L\'Avènement du Nécromancien (Boss)',
          subtitle: 'Le Fléau de Mortebreche',
          location: 'Antre de Malgath',
          enemyName: 'Malgath le Nécromancien',
          enemyTitle: 'Seigneur des Âmes Damnées (Boss Acte I)',
          enemyClass: 'necromancer',
          enemyAvatar: 'skull',
          enemyHp: 38,
          enemyArmor: 5,
          bossPowerName: 'Armée des Trépassés',
          bossPowerDesc: 'Au tour 3 et 6, invoque 2 Goules affamées (2/2) avec Provocation.',
          storyIntro: [
            { speaker: 'Narrateur', avatarIcon: 'auto_stories', side: 'left', text: 'L\'air se glace instantanément tandis que Malgath se dresse au sommet de son mausolée.' },
            { speaker: 'Malgath', avatarIcon: 'skull', side: 'right', text: 'Mortel imprudent ! Ton cœur bat encore, mais ton destin est scellé dans la poussière éternelle !' },
            { speaker: 'Votre Héros', avatarIcon: 'military_tech', side: 'left', text: 'Ton règne de terreur s\'achève ici, Malgath. Pour Aetheria !' }
          ],
          storyOutro: [
            { speaker: 'Malgath', avatarIcon: 'skull', side: 'right', text: 'Impossible... Mon armée... Mais le deuxième sceau des Cryptes est déjà brisé...' },
            { speaker: 'Votre Héros', avatarIcon: 'military_tech', side: 'left', text: 'Victoire ! L\'Acte I est accompli. La voie vers les Cryptes de Mortebreche est ouverte !' }
          ],
          starsEarned: 0,
          objectives: [
            { id: 'obj_1', text: 'Vaincre le boss Malgath le Nécromancien', isCompleted: false },
            { id: 'obj_2', text: 'Détruire au moins 4 squelettes et goules', isCompleted: false },
            { id: 'obj_3', text: 'Déclencher l\'Ultime de votre Héros pour achever le combat', isCompleted: false }
          ],
          rewards: {
            gold: 750,
            gems: 100,
            shards: 60,
            cardRewardId: 'card_arc_3',
            cardRewardName: 'Nova Primordiale d\'Aether',
            firstClearClaimed: false
          },
          isUnlocked: false,
          isCompleted: false
        }
      ]
    },
    {
      id: 'chap_2',
      actNumber: 2,
      title: 'Les Cryptes de Mortebreche',
      subtitle: 'Les Tréfonds Interdits',
      description: 'Pénétrez dans les catacombes millénaires où reposent d\'anciens rois guerriers corrompus.',
      bannerIcon: 'coronavirus',
      color: '#a855f7',
      isUnlocked: false,
      missions: [
        {
          id: 'story_2_1',
          chapterId: 'chap_2',
          order: 1,
          title: 'L\'Entrée des Catacombes',
          subtitle: 'Gardiens d\'outre-tombe',
          location: 'Portails de Pierre Noire',
          enemyName: 'Gorgoroth le Colosse',
          enemyTitle: 'Gargouille d\'Obsidienne',
          enemyClass: 'paladin',
          enemyAvatar: 'shield',
          enemyHp: 34,
          enemyArmor: 8,
          bossPowerName: 'Peau de Granit',
          bossPowerDesc: 'Réduit tous les dégâts de mêlée subis de 1 point.',
          storyIntro: [
            { speaker: 'Gorgoroth', avatarIcon: 'shield', side: 'right', text: 'Rien ne passe la porte millénaire. Seuls les morts ont droit de cité.' },
            { speaker: 'Votre Héros', avatarIcon: 'military_tech', side: 'left', text: 'Ton armure de pierre se brisera comme du verre face à ma détermination.' }
          ],
          storyOutro: [
            { speaker: 'Gorgoroth', avatarIcon: 'shield', side: 'right', text: 'Craignez... La Reine Liche... Elle vous attend au fond du gouffre...' },
            { speaker: 'Votre Héros', avatarIcon: 'military_tech', side: 'left', text: 'Enfonçons-nous dans les galeries.' }
          ],
          starsEarned: 0,
          objectives: [
            { id: 'obj_1', text: 'Vaincre Gorgoroth', isCompleted: false },
            { id: 'obj_2', text: 'Infliger au moins 10 dégâts avec des sorts', isCompleted: false },
            { id: 'obj_3', text: 'Conserver au moins 3 cartes en main', isCompleted: false }
          ],
          rewards: {
            gold: 400,
            gems: 50,
            shards: 30,
            firstClearClaimed: false
          },
          isUnlocked: true,
          isCompleted: false
        },
        {
          id: 'story_2_2',
          chapterId: 'chap_2',
          order: 2,
          title: 'Le Laboratoire d\'Alchimie Noire',
          subtitle: 'Poisons & Expériences',
          location: 'Laboratoire Souterrain',
          enemyName: 'Alchimiste Faust',
          enemyTitle: 'Maître des Toxines Éthérées',
          enemyClass: 'rogue',
          enemyAvatar: 'science',
          enemyHp: 32,
          enemyArmor: 4,
          bossPowerName: 'Brouillard Toxique',
          bossPowerDesc: 'Applique Venin (1 dégât par tour) à toutes les créatures invoquées.',
          storyIntro: [
            { speaker: 'Alchimiste Faust', avatarIcon: 'science', side: 'right', text: 'Ah, de nouveaux cobayes ! Mes potions d\'immortalité réclament du sang frais !' },
            { speaker: 'Votre Héros', avatarIcon: 'military_tech', side: 'left', text: 'Tes abominations s\'arrêtent ici, Faust.' }
          ],
          storyOutro: [
            { speaker: 'Alchimiste Faust', avatarIcon: 'science', side: 'right', text: 'Mes éprouvettes... Mes chefs-d\'œuvre... Détruits...' },
            { speaker: 'Votre Héros', avatarIcon: 'military_tech', side: 'left', text: 'Nous avons récupéré de précieux réactifs pour notre atelier.' }
          ],
          starsEarned: 0,
          objectives: [
            { id: 'obj_1', text: 'Terrasser l\'Alchimiste Faust', isCompleted: false },
            { id: 'obj_2', text: 'Purifier le poison avant le tour 6', isCompleted: false },
            { id: 'obj_3', text: 'Finir avec plus de 20 PV', isCompleted: false }
          ],
          rewards: {
            gold: 500,
            gems: 60,
            shards: 40,
            firstClearClaimed: false
          },
          isUnlocked: false,
          isCompleted: false
        },
        {
          id: 'story_2_3',
          chapterId: 'chap_2',
          order: 3,
          title: 'Le Sanctuaire de la Reine Liche (Boss)',
          subtitle: 'Le Trône de Glace & d\'Os',
          location: 'Trône de Morvanna',
          enemyName: 'Reine Liche Morvanna',
          enemyTitle: 'Souveraine des Cryptes (Boss Acte II)',
          enemyClass: 'necromancer',
          enemyAvatar: 'auto_awesome',
          enemyHp: 44,
          enemyArmor: 6,
          bossPowerName: 'Baiser du Trépas',
          bossPowerDesc: 'Gèle un serviteur aléatoire et vole 2 PV au héros joueur.',
          storyIntro: [
            { speaker: 'Reine Liche Morvanna', avatarIcon: 'auto_awesome', side: 'right', text: 'Vous avez franchi mes gardiens, mais votre âme m\'appartiendra pour l\'éternité !' },
            { speaker: 'Votre Héros', avatarIcon: 'military_tech', side: 'left', text: 'Votre malédiction s\'éteindra dans la lumière d\'Aetheria !' }
          ],
          storyOutro: [
            { speaker: 'Reine Liche Morvanna', avatarIcon: 'auto_awesome', side: 'right', text: 'La Cité Céleste... Solaria brûlera à son tour...' },
            { speaker: 'Votre Héros', avatarIcon: 'military_tech', side: 'left', text: 'Solaria est en danger ! Nous devons monter vers la Citadelle Céleste !' }
          ],
          starsEarned: 0,
          objectives: [
            { id: 'obj_1', text: 'Vaincre la Reine Liche Morvanna', isCompleted: false },
            { id: 'obj_2', text: 'Briser son armure en moins de 4 tours', isCompleted: false },
            { id: 'obj_3', text: 'Terminer le combat sans perdre de créature légendaire', isCompleted: false }
          ],
          rewards: {
            gold: 1000,
            gems: 150,
            shards: 80,
            cardRewardId: 'card_ice_3',
            cardRewardName: 'Blizzard Glacial Éternel',
            firstClearClaimed: false
          },
          isUnlocked: false,
          isCompleted: false
        }
      ]
    },
    {
      id: 'chap_3',
      actNumber: 3,
      title: 'La Citadelle Céleste de Solaria',
      subtitle: 'La Flamme Sacrée Corrompue',
      description: 'Montez au-dessus des nuages où les inquisiteurs et templiers solaires sont tombés dans le fanatisme.',
      bannerIcon: 'wb_sunny',
      color: '#f59e0b',
      isUnlocked: false,
      missions: [
        {
          id: 'story_3_1',
          chapterId: 'chap_3',
          order: 1,
          title: 'Les Flèches Solaires',
          subtitle: 'Le Bastion des Nuées',
          location: 'Passerelle d\'Orichalque',
          enemyName: 'Grand Inquisiteur Kaelen',
          enemyTitle: 'Jugement Radieux',
          enemyClass: 'paladin',
          enemyAvatar: 'military_tech',
          enemyHp: 38,
          enemyArmor: 6,
          bossPowerName: 'Verdict Purificateur',
          bossPowerDesc: 'Chaque coup critique inflige 2 dégâts supplémentaires à tous les ennemis.',
          storyIntro: [
            { speaker: 'Grand Inquisiteur Kaelen', avatarIcon: 'military_tech', side: 'right', text: 'Nul impur ne posera le pied dans le domaine sacré de Solaria !' },
            { speaker: 'Votre Héros', avatarIcon: 'military_tech', side: 'left', text: 'Ouvrez les yeux, Kaelen ! La lumière que vous servez a été corrompue !' }
          ],
          storyOutro: [
            { speaker: 'Grand Inquisiteur Kaelen', avatarIcon: 'military_tech', side: 'right', text: 'Le voile... tombe de mes yeux... Pardonnez mon aveuglement...' },
            { speaker: 'Votre Héros', avatarIcon: 'military_tech', side: 'left', text: 'L\'Archange Déchu règne au sommet. Nous devons l\'affronter.' }
          ],
          starsEarned: 0,
          objectives: [
            { id: 'obj_1', text: 'Vaincre le Grand Inquisiteur Kaelen', isCompleted: false },
            { id: 'obj_2', text: 'Survivre à ses frappes divines', isCompleted: false },
            { id: 'obj_3', text: 'Infliger plus de 25 dégâts en 5 tours', isCompleted: false }
          ],
          rewards: {
            gold: 600,
            gems: 80,
            shards: 50,
            firstClearClaimed: false
          },
          isUnlocked: true,
          isCompleted: false
        },
        {
          id: 'story_3_2',
          chapterId: 'chap_3',
          order: 2,
          title: 'L\'Archange Déchu Azraël (Grand Boss)',
          subtitle: 'L\'Éclipse Céleste',
          location: 'Trône Solaire Zénithal',
          enemyName: 'Azraël l\'Archange Sombre',
          enemyTitle: 'Maître du Jugement Céleste (Boss Acte III)',
          enemyClass: 'mage',
          enemyAvatar: 'flare',
          enemyHp: 50,
          enemyArmor: 8,
          bossPowerName: 'Éclipse Primordiale',
          bossPowerDesc: 'Déchaîne une pluie d\'étoiles filantes (4 dégâts répartis) tous les 3 tours.',
          storyIntro: [
            { speaker: 'Azraël', avatarIcon: 'flare', side: 'right', text: 'Les étoiles s\'alignent pour ma gloire. Le monde ancien doit brûler pour renaître !' },
            { speaker: 'Votre Héros', avatarIcon: 'military_tech', side: 'left', text: 'Aetheria ne sera pas votre brasier ! À genoux, faux archange !' }
          ],
          storyOutro: [
            { speaker: 'Azraël', avatarIcon: 'flare', side: 'right', text: 'Même si je vacille... L\'Abîme Originel s\'ouvre sous nos pieds...' },
            { speaker: 'Votre Héros', avatarIcon: 'military_tech', side: 'left', text: 'Le ciel est sauvé ! Mais la source première du mal se tapit au cœur de l\'Abîme...' }
          ],
          starsEarned: 0,
          objectives: [
            { id: 'obj_1', text: 'Triompher d\'Azraël l\'Archange Sombre', isCompleted: false },
            { id: 'obj_2', text: 'Maintenir au moins 2 créatures sur le plateau', isCompleted: false },
            { id: 'obj_3', text: 'Utiliser votre compétence Ultime avec succès', isCompleted: false }
          ],
          rewards: {
            gold: 1500,
            gems: 250,
            shards: 120,
            cardRewardId: 'card_sol_3',
            cardRewardName: 'Colosse Céleste de Solaria',
            firstClearClaimed: false
          },
          isUnlocked: false,
          isCompleted: false
        }
      ]
    },
    {
      id: 'chap_4',
      actNumber: 4,
      title: 'L\'Abîme du Chaos Primordial',
      subtitle: 'L\'Ultime Bataille pour Aetheria',
      description: 'Plongez au centre du monde pour vaincre l\'Entité du Néant et restaurer l\'équilibre universel.',
      bannerIcon: 'cyclone',
      color: '#ef4444',
      isUnlocked: false,
      missions: [
        {
          id: 'story_4_1',
          chapterId: 'chap_4',
          order: 1,
          title: 'L\'Entité Originelle du Néant (BOSS FINAL)',
          subtitle: 'Le Destin d\'un Monde',
          location: 'Le Cœur de l\'Éther',
          enemyName: 'Néant Primordial',
          enemyTitle: 'Dévoreur d\'Univers (BOSS SUPRÊME)',
          enemyClass: 'necromancer',
          enemyAvatar: 'dark_mode',
          enemyHp: 60,
          enemyArmor: 10,
          bossPowerName: 'Trou Noir Éthéré',
          bossPowerDesc: 'Absorbe 1 cristal de mana au joueur et gagne +2 Attaque à chaque tour pair.',
          storyIntro: [
            { speaker: 'Néant Primordial', avatarIcon: 'dark_mode', side: 'right', text: 'JE SUIS LE COMMENCEMENT ET LA FIN. TOUTE LUMIÈRE ME REVIENT.' },
            { speaker: 'Votre Héros', avatarIcon: 'military_tech', side: 'left', text: 'Nous portons l\'espoir de chaque héros, de chaque mage et de chaque soldat d\'Aetheria. TU NE PASSERAS PAS !' }
          ],
          storyOutro: [
            { speaker: 'Néant Primordial', avatarIcon: 'dark_mode', side: 'right', text: 'LA LUMIÈRE... EST TROP BRILLANTE... AETHERIA EST... LIBÉRÉE...' },
            { speaker: 'Votre Héros', avatarIcon: 'military_tech', side: 'left', text: 'C\'est fait ! Le Néant est repoussé. Vous êtes proclamé Sauveur Légendaire d\'Aetheria !' }
          ],
          starsEarned: 0,
          objectives: [
            { id: 'obj_1', text: 'Vaincre le Néant Primordial', isCompleted: false },
            { id: 'obj_2', text: 'Terminer le combat légendaire', isCompleted: false },
            { id: 'obj_3', text: 'Triomphe total sans abandon', isCompleted: false }
          ],
          rewards: {
            gold: 3000,
            gems: 500,
            shards: 250,
            cardRewardId: 'card_mythic_1',
            cardRewardName: 'Avatar du Dieu Solaire (Mythique)',
            firstClearClaimed: false
          },
          isUnlocked: true,
          isCompleted: false
        }
      ]
    }
  ]);

  // Story Computed Properties
  readonly totalStoryStars = computed(() => {
    let count = 0;
    this.storyChapters().forEach(c => {
      c.missions.forEach(m => {
        count += m.starsEarned || 0;
      });
    });
    return count;
  });

  readonly maxPossibleStoryStars = computed(() => {
    let count = 0;
    this.storyChapters().forEach(c => {
      count += c.missions.length * 3;
    });
    return count;
  });

  readonly storyProgressPercentage = computed(() => {
    let totalMissions = 0;
    let completedMissions = 0;
    this.storyChapters().forEach(c => {
      totalMissions += c.missions.length;
      completedMissions += c.missions.filter(m => m.isCompleted).length;
    });
    if (totalMissions === 0) return 0;
    return Math.round((completedMissions / totalMissions) * 100);
  });

  // Story Mission Methods
  completeStoryMission(missionId: string, stars: number, completedObjectiveIds: string[]) {
    this.storyChapters.update(chapters => {
      let foundMission: StoryMission | null = null;

      const updatedChapters = chapters.map(chap => {
        const updatedMissions = chap.missions.map((m, idx, arr) => {
          if (m.id === missionId) {
            foundMission = {
              ...m,
              isCompleted: true,
              starsEarned: Math.max(m.starsEarned, stars),
              objectives: m.objectives.map(o => ({
                ...o,
                isCompleted: o.isCompleted || completedObjectiveIds.includes(o.id)
              }))
            };

            // Unlock next mission in the same chapter if present
            if (idx + 1 < arr.length) {
              arr[idx + 1] = { ...arr[idx + 1], isUnlocked: true };
            }

            return foundMission;
          }
          return m;
        });

        return { ...chap, missions: updatedMissions };
      });

      // Check if this unlocks next chapter
      const currentChapter = updatedChapters.find(c => c.missions.some(m => m.id === missionId));
      if (currentChapter && currentChapter.missions.every(m => m.isCompleted)) {
        const nextChapIdx = updatedChapters.findIndex(c => c.id === currentChapter.id) + 1;
        if (nextChapIdx < updatedChapters.length) {
          updatedChapters[nextChapIdx] = {
            ...updatedChapters[nextChapIdx],
            isUnlocked: true,
            missions: updatedChapters[nextChapIdx].missions.map((m, i) => i === 0 ? { ...m, isUnlocked: true } : m)
          };
        }
      }

      if (foundMission) {
        this.lastCompletedMissionOutro.set(foundMission);
      }

      return updatedChapters;
    });

    this.sound.playVictory();
    this.triggerAutoSave();
  }

  claimStoryReward(missionId: string): boolean {
    let claimedRewards = false;
    let rewardSummary = '';
    this.storyChapters.update(chapters =>
      chapters.map(chap => ({
        ...chap,
        missions: chap.missions.map(m => {
          if (m.id === missionId && m.isCompleted && !m.rewards.firstClearClaimed) {
            this.gold.update(g => g + m.rewards.gold);
            this.gems.update(g => g + m.rewards.gems);
            this.shards.update(s => s + m.rewards.shards);
            claimedRewards = true;
            rewardSummary = `+${m.rewards.gold} Or, +${m.rewards.gems} Gemmes, +${m.rewards.shards} Éclats reçus !`;
            return {
              ...m,
              rewards: {
                ...m.rewards,
                firstClearClaimed: true
              }
            };
          }
          return m;
        })
      }))
    );

    if (claimedRewards) {
      this.toast.showReward('Butin de Campagne Obtenu !', rewardSummary, { badge: 'CAMPAGNE', rarity: 'legendary' });
      this.sound.playCoins();
      this.triggerAutoSave();
      return true;
    }
    return false;
  }

  constructor() {
    this.loadStateFromLocal();

    // Seed initial already-unlocked achievements so initial load doesn't spam toasts
    for (const ach of this.achievements()) {
      if (ach.isUnlocked) {
        this.notifiedAchievementIds.add(ach.id);
      }
    }
    this.achievementTrackerInitialized = true;

    // Watch live achievement progression for mid-session unlocks
    effect(() => {
      const list = this.achievements();
      if (!this.achievementTrackerInitialized || typeof window === 'undefined') return;
      let addedNew = false;
      for (const ach of list) {
        if (ach.isUnlocked && !this.notifiedAchievementIds.has(ach.id)) {
          this.notifiedAchievementIds.add(ach.id);
          addedNew = true;
          this.toast.showReward(
            `Haut Fait Débloqué : ${ach.title}`,
            `${ach.description} Rendez-vous dans la vue Succès pour réclamer votre butin !`,
            {
              badge: 'SUCCÈS',
              rarity: ach.tier === 'mythic' ? 'mythic' : ach.tier === 'gold' ? 'legendary' : 'epic',
              icon: ach.icon,
            }
          );
        }
      }
      if (addedNew) {
        this.saveNotifiedAchievements();
      }
    });

    // Auto-save heartbeat
    if (typeof window !== 'undefined') {
      setInterval(() => this.triggerAutoSave(), 30000);
    }
  }

  // State Persistence & Auto-Save
  triggerAutoSave() {
    if (typeof window === 'undefined') return;
    this.isAutoSaving.set(true);
    try {
      const stateToSave = {
        username: this.username(),
        currentTitle: this.currentTitle(),
        titles: this.titles(),
        avatarId: this.avatarId(),
        frameId: this.frameId(),
        elo: this.elo(),
        gold: this.gold(),
        gems: this.gems(),
        shards: this.shards(),
        playerLevel: this.playerLevel(),
        playerXp: this.playerXp(),
        selectedHeroClass: this.selectedHeroClass(),
        activeDeckId: this.activeDeckId(),
        cards: this.cards(),
        decks: this.decks(),
        heroes: this.heroes(),
        potions: this.potions(),
        activeBuffs: this.activeBuffs(),
        alchemyResources: this.alchemyResources(),
        dailyQuests: this.dailyQuests(),
        playerStats: this.playerStats(),
        seasonXp: this.seasonXp(),
        seasonTier: this.seasonTier(),
        isSeasonPassPremium: this.isSeasonPassPremium(),
        dailyStreak: this.dailyStreak(),
        hasClaimedDailyToday: this.hasClaimedDailyToday(),
        storyChapters: this.storyChapters(),
        pets: this.pets(),
        relics: this.relics(),
        claimedAchievementIds: this.claimedAchievementIds(),
        claimedSkillTreeRewardIds: this.claimedSkillTreeRewardIds(),
        directTradeProposals: this.directTradeProposals(),
        tradeAuditLog: this.tradeAuditLog(),
      };
      localStorage.setItem('aetheria_savegame', JSON.stringify(stateToSave));
      this.lastCloudSync.set(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
    } catch (e) {
      console.warn('Could not save game state to local storage', e);
    } finally {
      setTimeout(() => this.isAutoSaving.set(false), 800);
    }
  }

  loadStateFromLocal() {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem('aetheria_savegame');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.username) this.username.set(data.username);
        if (data.currentTitle) this.currentTitle.set(data.currentTitle);
        if (Array.isArray(data.titles)) {
          this.titles.update(existing => Array.from(new Set([...existing, ...data.titles])));
        }
        if (Array.isArray(data.claimedAchievementIds)) {
          this.claimedAchievementIds.set(data.claimedAchievementIds);
        }
        if (Array.isArray(data.claimedSkillTreeRewardIds)) {
          this.claimedSkillTreeRewardIds.set(data.claimedSkillTreeRewardIds);
        }
        if (data.avatarId) this.avatarId.set(data.avatarId);
        if (data.frameId) this.frameId.set(data.frameId);
        if (typeof data.elo === 'number') this.elo.set(data.elo);
        if (typeof data.gold === 'number') this.gold.set(data.gold);
        if (typeof data.gems === 'number') this.gems.set(data.gems);
        if (typeof data.shards === 'number') this.shards.set(data.shards);
        if (typeof data.playerLevel === 'number') this.playerLevel.set(data.playerLevel);
        if (data.selectedHeroClass) this.selectedHeroClass.set(data.selectedHeroClass);
        if (data.activeDeckId) this.activeDeckId.set(data.activeDeckId);
        if (Array.isArray(data.cards)) {
          const baseCardMap = new Map<string, Card>(ALL_GAME_CARDS.map(c => [c.id, c]));
          const hydratedCards = data.cards.map((savedCard: Card) => {
            const baseCard = baseCardMap.get(savedCard.id);
            return {
              ...baseCard,
              ...savedCard,
              imageUrl: savedCard.imageUrl || baseCard?.imageUrl || resolveCardImageUrl(savedCard),
            };
          });
          const savedIds = new Set(hydratedCards.map((c: Card) => c.id));
          const missingCards = ALL_GAME_CARDS.filter(c => !savedIds.has(c.id));
          this.cards.set([...hydratedCards, ...missingCards]);
        }
        if (data.decks) this.decks.set(data.decks);
        if (Array.isArray(data.heroes)) {
          const savedHeroMap = new Map<string, Partial<Hero>>(
            data.heroes.map((h: Partial<Hero>) => [h.id ?? '', h])
          );
          const hydratedHeroes = ALL_GAME_HEROES.map(baseHero => {
            const savedHero = savedHeroMap.get(baseHero.id);
            if (!savedHero) return baseHero;
            const savedSkinMap = new Map(
              (savedHero.skins ?? []).map(s => [s.id, s])
            );
            return {
              ...baseHero,
              level: typeof savedHero.level === 'number' ? savedHero.level : baseHero.level,
              xp: typeof savedHero.xp === 'number' ? savedHero.xp : baseHero.xp,
              xpRequired: typeof savedHero.xpRequired === 'number' ? savedHero.xpRequired : baseHero.xpRequired,
              unlockedTalentIds: Array.isArray(savedHero.unlockedTalentIds) ? savedHero.unlockedTalentIds : baseHero.unlockedTalentIds,
              isUnlocked: typeof savedHero.isUnlocked === 'boolean' ? savedHero.isUnlocked : baseHero.isUnlocked,
              activeSkinId: savedHero.activeSkinId || baseHero.activeSkinId,
              imageUrl: baseHero.imageUrl || HERO_PORTRAITS[baseHero.id],
              skins: baseHero.skins.map(baseSkin => {
                const savedSkin = savedSkinMap.get(baseSkin.id);
                return {
                  ...baseSkin,
                  isUnlocked: typeof savedSkin?.isUnlocked === 'boolean' ? savedSkin.isUnlocked : baseSkin.isUnlocked,
                };
              }),
            };
          });
          this.heroes.set(hydratedHeroes);
        }
        if (data.alchemyResources) {
          this.alchemyResources.set({
            herbs: data.alchemyResources.herbs ?? 24,
            crystals: data.alchemyResources.crystals ?? 16,
            essences: data.alchemyResources.essences ?? 8,
            astralDew: data.alchemyResources.astralDew ?? 4,
            phoenixAsh: data.alchemyResources.phoenixAsh ?? 3,
            voidSpore: data.alchemyResources.voidSpore ?? 2,
          });
        }
        if (Array.isArray(data.potions)) {
          const savedPotionMap = new Map<string, Partial<Potion>>(
            data.potions.map((p: Partial<Potion>) => [p.id ?? '', p])
          );
          this.potions.update(basePotions =>
            basePotions.map(bp => {
              const sp = savedPotionMap.get(bp.id);
              if (!sp) return bp;
              return {
                ...bp,
                count: typeof sp.count === 'number' ? sp.count : bp.count,
                masteryLevel: typeof sp.masteryLevel === 'number' ? sp.masteryLevel : bp.masteryLevel,
                isSecretDiscovered: typeof sp.isSecretDiscovered === 'boolean' ? sp.isSecretDiscovered : bp.isSecretDiscovered,
              };
            })
          );
        }
        if (data.activeBuffs) this.activeBuffs.set(data.activeBuffs);
        if (data.playerStats) {
          this.playerStats.set({
            ...data.playerStats,
            rankedMatches: typeof data.playerStats.rankedMatches === 'number' ? data.playerStats.rankedMatches : 34,
            rankedWins: typeof data.playerStats.rankedWins === 'number' ? data.playerStats.rankedWins : 24,
          });
        }
        if (data.storyChapters) this.storyChapters.set(data.storyChapters);
        if (Array.isArray(data.pets)) {
          // Merge saved pets with base database to guarantee integrity
          const savedPetMap = new Map<string, Partial<CompanionPet>>(
            data.pets.map((p: Partial<CompanionPet>) => [p.id ?? '', p])
          );
          const merged = INITIAL_COMPANION_PETS.map(basePet => {
            const savedP = savedPetMap.get(basePet.id);
            if (!savedP) return basePet;
            const lvl = savedP.level || basePet.level;
            const totalMult = Number((basePet.baseMultiplier + (lvl - 1) * basePet.levelBonusPerLevel).toFixed(2));
            return {
              ...basePet,
              level: lvl,
              affinity: typeof savedP.affinity === 'number' ? savedP.affinity : basePet.affinity,
              affinityRequired: savedP.affinityRequired || basePet.affinityRequired,
              totalMultiplier: totalMult,
              isUnlocked: typeof savedP.isUnlocked === 'boolean' ? savedP.isUnlocked : basePet.isUnlocked,
              isEquipped: typeof savedP.isEquipped === 'boolean' ? savedP.isEquipped : basePet.isEquipped,
              goldUpgradeCost: savedP.goldUpgradeCost || basePet.goldUpgradeCost,
              gemUpgradeCost: savedP.gemUpgradeCost || basePet.gemUpgradeCost,
            };
          });
          this.pets.set(merged);
        }
        if (Array.isArray(data.relics)) {
          const savedRelicMap = new Map<string, Partial<PlayerRelic>>(
            data.relics.map((r: Partial<PlayerRelic>) => [r.id ?? '', r])
          );
          const mergedRelics = INITIAL_PLAYER_RELICS.map(baseRelic => {
            const savedR = savedRelicMap.get(baseRelic.id);
            if (!savedR) return baseRelic;
            return {
              ...baseRelic,
              tier: typeof savedR.tier === 'number' ? savedR.tier : baseRelic.tier,
              enchantLevel: typeof savedR.enchantLevel === 'number' ? savedR.enchantLevel : baseRelic.enchantLevel,
              totalXpBonusPct: typeof savedR.totalXpBonusPct === 'number' ? savedR.totalXpBonusPct : baseRelic.totalXpBonusPct,
              affixes: Array.isArray(savedR.affixes) ? savedR.affixes : baseRelic.affixes,
              isEquipped: typeof savedR.isEquipped === 'boolean' ? savedR.isEquipped : baseRelic.isEquipped,
              equippedSlot: savedR.equippedSlot,
              duplicateCount: typeof savedR.duplicateCount === 'number' ? savedR.duplicateCount : baseRelic.duplicateCount,
              fusionRequired: typeof savedR.fusionRequired === 'number' ? savedR.fusionRequired : baseRelic.fusionRequired,
              imageUrl: baseRelic.imageUrl,
            };
          });
          this.relics.set(mergedRelics);
        }
        if (Array.isArray(data.directTradeProposals) && data.directTradeProposals.length > 0) {
          this.directTradeProposals.set(data.directTradeProposals);
        }
        if (Array.isArray(data.tradeAuditLog) && data.tradeAuditLog.length > 0) {
          this.tradeAuditLog.set(data.tradeAuditLog);
        }
      }
    } catch (e) {
      console.warn('Could not parse local save', e);
    }
  }

  // Export / Import Backup
  exportBackupCode(): string {
    const raw = localStorage.getItem('aetheria_savegame') || '{}';
    return btoa(unescape(encodeURIComponent(raw)));
  }

  importBackupCode(code: string): boolean {
    try {
      const jsonStr = decodeURIComponent(escape(atob(code)));
      const data = JSON.parse(jsonStr);
      if (data) {
        localStorage.setItem('aetheria_savegame', jsonStr);
        this.loadStateFromLocal();
        this.sound.playVictory();
        return true;
      }
    } catch (e) {
      console.error('Invalid backup code', e);
    }
    return false;
  }

  // Economy Mutations
  addGold(amount: number) {
    this.gold.update(g => g + amount);
    this.sound.playCoins();
    this.triggerAutoSave();
  }

  addGems(amount: number) {
    this.gems.update(g => g + amount);
    this.sound.playCoins();
    this.triggerAutoSave();
  }

  addShards(amount: number) {
    this.shards.update(s => s + amount);
    this.triggerAutoSave();
  }

  // Hero & Talent Management
  selectHero(heroClass: HeroClass) {
    this.selectedHeroClass.set(heroClass);
    this.sound.playClick();
  }

  isSkillTreeCompleted(heroClass: HeroClass): boolean {
    const hero = this.heroes().find(h => h.id === heroClass);
    const nodes = this.skillTrees().filter(n => n.heroClass === heroClass);
    if (!hero || nodes.length === 0) return false;
    return nodes.every(n => hero.unlockedTalentIds.includes(n.id));
  }

  hasClaimedSkillTreeReward(heroClass: HeroClass): boolean {
    return this.claimedSkillTreeRewardIds().includes(heroClass);
  }

  dismissSkillTreeCompletionReward() {
    this.lastSkillTreeCompletionReward.set(null);
  }

  unlockTalent(heroClass: HeroClass, talentId: string, cost: number): boolean {
    const hero = this.heroes().find(h => h.id === heroClass);
    const heroNodes = this.skillTrees().filter(n => n.heroClass === heroClass);
    const targetNode = heroNodes.find(n => n.id === talentId);
    if (!hero || !targetNode) return false;
    if (hero.unlockedTalentIds.includes(talentId)) return false;
    if (targetNode.prereqId && !hero.unlockedTalentIds.includes(targetNode.prereqId)) return false;
    if (this.shards() < cost) return false;

    const updatedUnlockedIds = [...hero.unlockedTalentIds, talentId];

    this.shards.update(s => s - cost);
    this.heroes.update(heroes =>
      heroes.map(h => {
        if (h.id === heroClass) {
          return { ...h, unlockedTalentIds: updatedUnlockedIds };
        }
        return h;
      })
    );

    const unlockedCount = heroNodes.filter(n => updatedUnlockedIds.includes(n.id)).length;
    const totalCount = heroNodes.length;

    this.lastSkillTreeUpgradeEvent.set({
      id: Date.now(),
      heroClass,
      talentId,
      unlockedCount,
      totalCount,
    });

    const isNowComplete = totalCount > 0 && unlockedCount >= totalCount;
    const alreadyClaimed = this.claimedSkillTreeRewardIds().includes(heroClass);

    if (isNowComplete && !alreadyClaimed) {
      const rewardGold = 1000;
      const rewardGems = 150;
      this.gold.update(g => g + rewardGold);
      this.gems.update(g => g + rewardGems);
      this.claimedSkillTreeRewardIds.update(ids => [...ids, heroClass]);
      this.lastSkillTreeCompletionReward.set({
        id: Date.now(),
        heroClass,
        heroName: hero.name,
        gold: rewardGold,
        gems: rewardGems,
      });
      this.sound.playVictory();
      this.sound.playCoins();
      this.toast.showReward(
        'Arbre de Compétences Complet !',
        `${hero.name} atteint sa croissance maximale : +1000 Pièces d'Or et +150 Gemmes !`,
        { badge: 'ARBRE COMPLET', rarity: 'mythic', icon: 'park' }
      );
    } else {
      this.sound.playCardSummon('epic');
    }

    this.triggerAutoSave();
    return true;
  }

  resetHeroSkillTree(heroClass: HeroClass): number {
    const hero = this.heroes().find(h => h.id === heroClass);
    const heroNodes = this.skillTrees().filter(n => n.heroClass === heroClass);
    if (!hero || hero.unlockedTalentIds.length === 0) return 0;

    const refundedShards = heroNodes
      .filter(n => hero.unlockedTalentIds.includes(n.id))
      .reduce((sum, n) => sum + n.cost, 0);

    if (refundedShards > 0) {
      this.shards.update(s => s + refundedShards);
    }

    this.heroes.update(heroes =>
      heroes.map(h => (h.id === heroClass ? { ...h, unlockedTalentIds: [] } : h))
    );
    this.sound.playClick();
    this.toast.showSystem(
      'Arbre Réinitialisé',
      `Les racines de ${hero.name} ont été taillées (+${refundedShards} Éclats restitués).`,
      'restart_alt'
    );
    this.triggerAutoSave();
    return refundedShards;
  }

  equipSkin(heroClass: HeroClass, skinId: string) {
    const hero = this.heroes().find(h => h.id === heroClass);
    const skin = hero?.skins.find(s => s.id === skinId);
    if (!hero || !skin || !skin.isUnlocked) return;

    this.heroes.update(heroes =>
      heroes.map(h => {
        if (h.id === heroClass) {
          return { ...h, activeSkinId: skinId };
        }
        return h;
      })
    );
    this.toast.showSystem(
      'Apparence Équipée',
      `${hero.name} porte désormais le skin « ${skin.name} ».`,
      'checkroom'
    );
    this.sound.playCardSummon('rare');
    this.triggerAutoSave();
  }

  unlockHero(heroId: HeroClass, currency: 'gold' | 'gems' | 'real_money'): boolean {
    const hero = this.heroes().find(h => h.id === heroId);
    if (!hero || hero.isUnlocked) return false;

    if (currency === 'gold') {
      const cost = hero.goldUnlockCost || 2000;
      if (this.gold() < cost) return false;
      this.gold.update(g => g - cost);
    } else if (currency === 'gems') {
      const cost = hero.gemUnlockCost || 350;
      if (this.gems() < cost) return false;
      this.gems.update(g => g - cost);
    }

    this.heroes.update(heroes =>
      heroes.map(h => (h.id === heroId ? { ...h, isUnlocked: true } : h))
    );

    this.selectedHeroClass.set(heroId);
    this.sound.playCardSummon('mythic');
    this.triggerAutoSave();
    return true;
  }

  buyPotionInShop(potionId: string, count: number, currency: 'gold' | 'gems'): boolean {
    const pot = this.potions().find(p => p.id === potionId);
    if (!pot) return false;

    if (currency === 'gold') {
      const totalCost = pot.goldCost * count;
      if (this.gold() < totalCost) return false;
      this.gold.update(g => g - totalCost);
    } else {
      const gemCost = Math.ceil((pot.goldCost * count) / 25);
      if (this.gems() < gemCost) return false;
      this.gems.update(g => g - gemCost);
    }

    this.potions.update(list =>
      list.map(p => (p.id === potionId ? { ...p, count: p.count + count } : p))
    );
    this.sound.playPotion();
    this.triggerAutoSave();
    return true;
  }

  buyAlchemyResource(resource: 'herbs' | 'crystals' | 'essences', amount: number, costGems: number): boolean {
    if (this.gems() < costGems) return false;
    this.gems.update(g => g - costGems);
    this.alchemyResources.update(res => ({
      ...res,
      [resource]: res[resource] + amount,
    }));
    this.sound.playCoins();
    this.triggerAutoSave();
    return true;
  }

  simulateRealMoneyPurchase(bundleName: string, priceStr: string, gemsReceived: number, bonusGold = 0, bonusShards = 0) {
    this.addGems(gemsReceived);
    if (bonusGold > 0) this.addGold(bonusGold);
    if (bonusShards > 0) this.addShards(bonusShards);
    this.sound.playVictory();
    this.triggerAutoSave();
  }

  purchaseSkinWithCurrency(heroClass: HeroClass, skinId: string, currency: 'gold' | 'gems'): boolean {
    const hero = this.heroes().find(h => h.id === heroClass);
    const skin = hero?.skins.find(s => s.id === skinId);
    if (!hero || !skin || skin.isUnlocked) return false;

    if (currency === 'gold') {
      const price = skin.goldPrice;
      if (!price || this.gold() < price) return false;
      this.gold.update(g => g - price);
    } else {
      const price = skin.gemPrice;
      if (!price || this.gems() < price) return false;
      this.gems.update(g => g - price);
    }

    const unlockedSkin: HeroSkin = { ...skin, isUnlocked: true };
    let updatedHeroSnapshot: Hero = hero;

    this.heroes.update(heroes =>
      heroes.map(h => {
        if (h.id === heroClass) {
          const updatedSkins = h.skins.map(s => (s.id === skinId ? unlockedSkin : s));
          updatedHeroSnapshot = { ...h, skins: updatedSkins, activeSkinId: skinId };
          return updatedHeroSnapshot;
        }
        return h;
      })
    );
    this.toast.showReward(
      `Skin Débloqué : ${skin.name}`,
      `Nouvelle apparence équipée sur ${hero.name} (${skin.visualEffectLabel || skin.badge}).`,
      {
        badge: skin.rarity.toUpperCase(),
        rarity: skin.rarity === 'mythic' ? 'mythic' : skin.rarity === 'legendary' ? 'legendary' : 'epic',
        icon: skin.avatarIcon,
      }
    );
    this.pendingSkinReveal.set({
      hero: updatedHeroSnapshot,
      skin: unlockedSkin,
      triggeredAt: Date.now(),
    });
    this.sound.playSkinReveal(skin.rarity);
    this.triggerAutoSave();
    return true;
  }

  purchaseSkin(heroClass: HeroClass, skinId: string, gemPrice: number) {
    const hero = this.heroes().find(h => h.id === heroClass);
    const skin = hero?.skins.find(s => s.id === skinId);
    if (!hero || !skin || skin.isUnlocked) return false;
    if (this.gems() < gemPrice) return false;

    this.gems.update(g => g - gemPrice);
    const unlockedSkin: HeroSkin = { ...skin, isUnlocked: true };
    let updatedHeroSnapshot: Hero = hero;

    this.heroes.update(heroes =>
      heroes.map(h => {
        if (h.id === heroClass) {
          const updatedSkins = h.skins.map(s => (s.id === skinId ? unlockedSkin : s));
          updatedHeroSnapshot = { ...h, skins: updatedSkins, activeSkinId: skinId };
          return updatedHeroSnapshot;
        }
        return h;
      })
    );
    this.toast.showReward(
      `Skin Débloqué : ${skin.name}`,
      `Nouvelle apparence équipée sur ${hero.name}.`,
      { badge: skin.rarity.toUpperCase(), rarity: 'legendary', icon: skin.avatarIcon }
    );
    this.pendingSkinReveal.set({
      hero: updatedHeroSnapshot,
      skin: unlockedSkin,
      triggeredAt: Date.now(),
    });
    this.sound.playSkinReveal(skin.rarity);
    this.triggerAutoSave();
    return true;
  }

  dismissSkinReveal() {
    this.pendingSkinReveal.set(null);
  }

  // Card Upgrading & Forging
  upgradeCard(cardId: string): boolean {
    const card = this.cards().find(c => c.id === cardId);
    if (!card) return false;
    if (card.level >= 5) return false;
    if (card.shards < card.shardsRequired) return false;

    const goldCost = card.level * 150;
    if (this.gold() < goldCost) return false;

    this.gold.update(g => g - goldCost);
    this.cards.update(cards =>
      cards.map(c => {
        if (c.id === cardId) {
          const newLevel = c.level + 1;
          const newAttack = c.attack ? c.attack + 1 : undefined;
          const newHealth = c.health ? c.health + 1 : undefined;
          const newSpellDmg = c.spellDamage ? c.spellDamage + 1 : undefined;
          return {
            ...c,
            level: newLevel,
            attack: newAttack,
            health: newHealth,
            maxHealth: newHealth,
            spellDamage: newSpellDmg,
            shards: c.shards - c.shardsRequired,
            shardsRequired: Math.round(c.shardsRequired * 1.5),
            foil: newLevel >= 4 || c.foil,
          };
        }
        return c;
      })
    );

    this.playerStats.update(st => ({ ...st, cardsUpgraded: st.cardsUpgraded + 1 }));
    this.toast.showReward('Forge d\'Aether Réussie !', `La carte [${card.name}] passe au Niveau ${card.level + 1} !`, { badge: 'FORGE', rarity: 'epic', icon: 'hardware' });
    this.sound.playCardSummon('mythic');
    this.triggerAutoSave();
    return true;
  }

  getCardRarity(cardOrId: Card | string): CardRarity {
    if (typeof cardOrId === 'string') {
      if (
        cardOrId === 'common' ||
        cardOrId === 'rare' ||
        cardOrId === 'epic' ||
        cardOrId === 'legendary' ||
        cardOrId === 'mythic'
      ) {
        return cardOrId;
      }
      return this.cards().find(c => c.id === cardOrId)?.rarity ?? 'common';
    }
    const stored = this.cards().find(c => c.id === cardOrId.id);
    return stored?.rarity ?? cardOrId.rarity ?? 'common';
  }

  getCardRarityGlowClass(cardOrId: Card | string): string {
    const rarity = this.getCardRarity(cardOrId);
    switch (rarity) {
      case 'mythic':
        return 'card-rarity-glow-mythic';
      case 'legendary':
        return 'card-rarity-glow-legendary';
      case 'epic':
        return 'card-rarity-glow-epic';
      case 'rare':
        return 'card-rarity-glow-rare';
      case 'common':
      default:
        return 'card-rarity-glow-common';
    }
  }

  getCardRarityVisualMeta(cardOrId: Card | string): {
    rarity: CardRarity;
    label: string;
    glowClass: string;
    textClass: string;
    accentHex: string;
  } {
    const rarity = this.getCardRarity(cardOrId);
    const glowClass = this.getCardRarityGlowClass(rarity);
    switch (rarity) {
      case 'mythic':
        return {
          rarity,
          label: 'Mythique',
          glowClass,
          textClass: 'text-[#fb7185]',
          accentHex: '#fb7185',
        };
      case 'legendary':
        return {
          rarity,
          label: 'Légendaire',
          glowClass,
          textClass: 'text-[#fbbf24]',
          accentHex: '#fbbf24',
        };
      case 'epic':
        return {
          rarity,
          label: 'Épique',
          glowClass,
          textClass: 'text-[#c084fc]',
          accentHex: '#c084fc',
        };
      case 'rare':
        return {
          rarity,
          label: 'Rare',
          glowClass,
          textClass: 'text-[#38bdf8]',
          accentHex: '#38bdf8',
        };
      case 'common':
      default:
        return {
          rarity: 'common',
          label: 'Commune',
          glowClass,
          textClass: 'text-slate-300',
          accentHex: '#cbd5e1',
        };
    }
  }

  // Inventory & Alchemy — Pre-combat Elixir Management
  isElixirActive(potionId: string): boolean {
    return this.activeBuffs().some(b => b.potionId === potionId);
  }

  getElixirRemainingMatches(potionId: string): number {
    return this.activeBuffs().find(b => b.potionId === potionId)?.remainingMatches ?? 0;
  }

  consumeElixir(potionId: string): boolean {
    return this.consumePotion(potionId);
  }

  dismissActiveElixir(potionId: string): void {
    const existing = this.activeBuffs().find(b => b.potionId === potionId);
    if (!existing) return;
    this.activeBuffs.update(list => list.filter(b => b.potionId !== potionId));
    this.sound.playClick();
    this.toast.showSystem('Élixir Dissipé', `L'effet de [${existing.name}] a été retiré.`, 'science');
    this.triggerAutoSave();
  }

  consumePotion(potionId: string): boolean {
    const potion = this.potions().find(p => p.id === potionId);
    if (!potion || potion.count <= 0) return false;

    // Deduct count
    this.potions.update(list =>
      list.map(p => (p.id === potionId ? { ...p, count: p.count - 1 } : p))
    );

    // Add or extend active temporary buff
    let totalMatches = potion.durationMatches;
    this.activeBuffs.update(buffs => {
      const existing = buffs.find(b => b.potionId === potionId);
      if (existing) {
        totalMatches = existing.remainingMatches + potion.durationMatches;
        return buffs.map(b => (b.potionId === potionId ? { ...b, remainingMatches: totalMatches } : b));
      }
      return [
        ...buffs,
        {
          potionId: potion.id,
          name: potion.name,
          icon: potion.icon,
          color: potion.color,
          type: potion.type,
          remainingMatches: potion.durationMatches,
          effectDesc: potion.effectLabel,
        },
      ];
    });

    this.playerStats.update(st => ({ ...st, potionsConsumed: st.potionsConsumed + 1 }));
    this.toast.showSystem(
      'Élixir Consommé',
      `Bonus temporaire actif : ${this.getElixirShortBonusLabel(potion.type)} (${totalMatches} combats)`,
      'science'
    );
    this.sound.playPotion();
    this.triggerAutoSave();
    return true;
  }

  canBrewPotion(recipe: PotionRecipe, quantity = 1): boolean {
    const res = this.alchemyResources();
    return (
      res.herbs >= recipe.herb * quantity &&
      res.crystals >= recipe.crystal * quantity &&
      res.essences >= recipe.essence * quantity &&
      res.astralDew >= (recipe.astralDew || 0) * quantity &&
      res.phoenixAsh >= (recipe.phoenixAsh || 0) * quantity &&
      res.voidSpore >= (recipe.voidSpore || 0) * quantity
    );
  }

  brewPotion(potionId: string, quantity = 1): boolean {
    const potion = this.potions().find(p => p.id === potionId);
    if (!potion || !potion.recipe || quantity <= 0) return false;

    if (!this.canBrewPotion(potion.recipe, quantity)) {
      this.toast.showSystem('Ingrédients Insuffisants', 'Il vous manque des ressources rares d\'arène pour forger cet élixir.', 'science');
      return false;
    }

    const r = potion.recipe;
    this.alchemyResources.update(res => ({
      herbs: res.herbs - r.herb * quantity,
      crystals: res.crystals - r.crystal * quantity,
      essences: res.essences - r.essence * quantity,
      astralDew: res.astralDew - (r.astralDew || 0) * quantity,
      phoenixAsh: res.phoenixAsh - (r.phoenixAsh || 0) * quantity,
      voidSpore: res.voidSpore - (r.voidSpore || 0) * quantity,
    }));

    this.potions.update(list =>
      list.map(p =>
        p.id === potionId
          ? {
              ...p,
              count: p.count + quantity,
              masteryLevel: Math.min(5, (p.masteryLevel || 0) + 1),
              isSecretDiscovered: true,
            }
          : p
      )
    );

    this.updateQuestProgress('q_2', quantity);
    this.toast.showReward(
      'Synthèse d\'Élixir Réussie !',
      `+${quantity} [${potion.name}] distillé dans le grand athanor d'Aetheria !`,
      { badge: 'ATHANOR', rarity: potion.rarity, icon: 'science' }
    );
    this.sound.playPotion();
    if (potion.rarity === 'legendary' || potion.rarity === 'mythic') {
      this.sound.playCardSummon('legendary');
    }
    this.triggerAutoSave();
    return true;
  }

  synthesizeCustomExperiment(selected: {
    herbs: number;
    crystals: number;
    essences: number;
    astralDew: number;
    phoenixAsh: number;
    voidSpore: number;
  }): { success: boolean; potion?: Potion; message: string; isDiscovery?: boolean } {
    const res = this.alchemyResources();
    if (
      res.herbs < selected.herbs ||
      res.crystals < selected.crystals ||
      res.essences < selected.essences ||
      res.astralDew < selected.astralDew ||
      res.phoenixAsh < selected.phoenixAsh ||
      res.voidSpore < selected.voidSpore
    ) {
      return { success: false, message: 'Ressources insuffisantes dans votre réserve alchimique.' };
    }

    const totalSpent =
      selected.herbs +
      selected.crystals * 2 +
      selected.essences * 3 +
      selected.astralDew * 5 +
      selected.phoenixAsh * 8 +
      selected.voidSpore * 12;

    if (totalSpent < 4) {
      return { success: false, message: 'Il faut au minimum 4 unités de réactifs pour allumer l\'athanor.' };
    }

    // Deduct
    this.alchemyResources.update(r => ({
      herbs: r.herbs - selected.herbs,
      crystals: r.crystals - selected.crystals,
      essences: r.essences - selected.essences,
      astralDew: r.astralDew - selected.astralDew,
      phoenixAsh: r.phoenixAsh - selected.phoenixAsh,
      voidSpore: r.voidSpore - selected.voidSpore,
    }));

    // Find best matching potion
    let matchedPotion: Potion | undefined;
    const all = this.potions();

    // 1. Exact recipe match
    matchedPotion = all.find(p => {
      const rec = p.recipe;
      if (!rec) return false;
      return (
        rec.herb === selected.herbs &&
        rec.crystal === selected.crystals &&
        rec.essence === selected.essences &&
        (rec.astralDew || 0) === selected.astralDew &&
        (rec.phoenixAsh || 0) === selected.phoenixAsh &&
        (rec.voidSpore || 0) === selected.voidSpore
      );
    });

    if (!matchedPotion) {
      // 2. Transmutation synthesis match
      if (selected.voidSpore > 0 && selected.phoenixAsh > 0) {
        matchedPotion = all.find(p => p.id === 'pot_titan_blood');
      } else if (selected.voidSpore > 0) {
        matchedPotion = all.find(p => p.id === 'pot_void_venom');
      } else if (selected.phoenixAsh > 0) {
        matchedPotion = all.find(p => p.id === 'pot_phoenix_rebirth');
      } else if (selected.astralDew > 0 && selected.crystals >= 2) {
        matchedPotion = all.find(p => p.id === 'pot_astral_surge');
      } else if (selected.astralDew > 0) {
        matchedPotion = all.find(p => p.id === 'pot_midas_gold');
      } else if (selected.essences >= 3) {
        matchedPotion = all.find(p => p.id === 'pot_xp_1');
      } else if (selected.crystals >= 3) {
        matchedPotion = all.find(p => p.id === 'pot_mana_1');
      } else {
        matchedPotion = all.find(p => p.id === 'pot_health_1');
      }
    }

    if (matchedPotion) {
      const isDiscovery = !matchedPotion.isSecretDiscovered;
      this.potions.update(list =>
        list.map(p =>
          p.id === matchedPotion!.id
            ? {
                ...p,
                count: p.count + 1,
                isSecretDiscovered: true,
                masteryLevel: Math.min(5, (p.masteryLevel || 0) + 1),
              }
            : p
        )
      );

      this.sound.playPotion();
      if (isDiscovery) {
        this.sound.playCardSummon('mythic');
        this.toast.showReward(
          'DÉCOUVERTE ALCHIMIQUE SECRÈTE !',
          `Votre transmutation a révélé la formule secrète de [${matchedPotion.name}] !`,
          { badge: 'DÉCOUVERTE', rarity: matchedPotion.rarity, icon: 'auto_awesome' }
        );
      } else {
        this.toast.showReward(
          'Creuset en Fusion !',
          `Synthèse alchimique réussie : +1 [${matchedPotion.name}] forgé !`,
          { badge: 'CREUSET', rarity: matchedPotion.rarity, icon: 'science' }
        );
      }
      this.triggerAutoSave();
      return { success: true, potion: matchedPotion, isDiscovery, message: `Succès : ${matchedPotion.name} forgé !` };
    }

    return { success: false, message: 'La réaction s\'est dissipée en vapeur...' };
  }

  transmuteResource(
    from: keyof AlchemyResources,
    to: keyof AlchemyResources,
    costAmount: number,
    gainAmount: number
  ): boolean {
    const res = this.alchemyResources();
    if (res[from] < costAmount) {
      this.toast.showSystem('Ressources Insuffisantes', `Vous n'avez pas assez de ${from}.`, 'science');
      return false;
    }

    this.alchemyResources.update(r => ({
      ...r,
      [from]: r[from] - costAmount,
      [to]: r[to] + gainAmount,
    }));

    this.sound.playAlchemicalTransmute();
    this.toast.showReward(
      'Transmutation Athanor',
      `Transmutation réussie : -${costAmount} réactifs ➔ +${gainAmount} nouvel ingrédient !`,
      { badge: 'TRANSFORMATION', rarity: 'rare', icon: 'autorenew' }
    );
    this.triggerAutoSave();
    return true;
  }

  // Decks Management
  createDeck(name: string, heroClass: HeroClass) {
    const starterCards = this.cards().slice(0, 10).map(c => c.id);
    const newDeck: Deck = {
      id: 'deck_' + Date.now(),
      name,
      heroClass,
      cardIds: starterCards,
      wins: 0,
      losses: 0,
      cardBack: 'gold_crest',
    };
    this.decks.update(d => [...d, newDeck]);
    this.activeDeckId.set(newDeck.id);
    this.sound.playClick();
    this.triggerAutoSave();
  }

  updateDeckCards(deckId: string, cardIds: string[]) {
    this.decks.update(decks =>
      decks.map(d => (d.id === deckId ? { ...d, cardIds } : d))
    );
    this.sound.playClick();
    this.triggerAutoSave();
  }

  setActiveDeck(deckId: string) {
    this.activeDeckId.set(deckId);
    const deck = this.decks().find(d => d.id === deckId);
    if (deck) {
      this.selectedHeroClass.set(deck.heroClass);
    }
    this.sound.playClick();
  }

  deleteDeck(deckId: string) {
    if (this.decks().length <= 1) return;
    this.decks.update(decks => decks.filter(d => d.id !== deckId));
    if (this.activeDeckId() === deckId) {
      this.activeDeckId.set(this.decks()[0].id);
    }
    this.sound.playClick();
    this.triggerAutoSave();
  }

  // Quest Tracker
  updateQuestProgress(questId: string, amount: number) {
    this.dailyQuests.update(quests =>
      quests.map(q => {
        if (q.id === questId && !q.isCompleted) {
          const newCurr = Math.min(q.target, q.current + amount);
          return { ...q, current: newCurr, isCompleted: newCurr >= q.target };
        }
        return q;
      })
    );
  }

  claimQuestReward(questId: string) {
    const quest = this.dailyQuests().find(q => q.id === questId);
    if (!quest || !quest.isCompleted || quest.isClaimed) return;

    this.dailyQuests.update(quests =>
      quests.map(q => (q.id === questId ? { ...q, isClaimed: true } : q))
    );

    this.addGold(quest.rewardGold);
    this.seasonXp.update(x => x + quest.rewardXp);
    this.toast.showReward('Quête Quotidienne Accomplie !', `${quest.title} : +${quest.rewardGold} Or et +${quest.rewardXp} XP de saison reçus !`, { badge: 'QUÊTE', rarity: 'rare', icon: 'task_alt' });
    this.sound.playVictory();
    this.triggerAutoSave();
  }

  // Daily Streak Claim
  claimDailyReward() {
    if (this.hasClaimedDailyToday()) return;
    this.hasClaimedDailyToday.set(true);
    this.dailyStreak.update(s => Math.min(7, s + 1));
    this.addGold(500);
    this.addGems(30);
    this.addShards(25);
    this.toast.showReward('Présence Quotidienne Validée !', `Série : Jour ${this.dailyStreak()} / 7. +500 Or, +30 Gemmes, +25 Éclats reçus !`, { badge: 'CONNEXION', rarity: 'legendary', icon: 'calendar_month' });
    this.sound.playVictory();
    this.triggerAutoSave();
  }

  // Chat message sending
  sendChatMessage(channel: 'global' | 'guild' | 'battle', text: string) {
    if (!text.trim()) return;
    const newMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      channel,
      sender: this.username(),
      senderTag: channel === 'guild' ? `[${this.guild().tag}]` : undefined,
      avatarIcon: this.avatarId() === 'paladin_avatar' ? 'military_tech' : 'shield_moon',
      badge: this.divisionName(),
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      text: text.trim(),
    };
    this.chatMessages.update(msgs => [...msgs.slice(-50), newMsg]);
    this.sound.playClick();
  }

  private createInitialTradeProposals(): DirectTradeProposal[] {
    const findCard = (id: string, fallbackRarity: CardRarity): Card => {
      const found = ALL_GAME_CARDS.find(c => c.id === id) || ALL_GAME_CARDS.find(c => c.rarity === fallbackRarity) || ALL_GAME_CARDS[0];
      return { ...found, imageUrl: found.imageUrl || resolveCardImageUrl(found) };
    };
    const findPotion = (id: string): Potion => {
      const p = this.potions().find(item => item.id === id) || this.potions()[0];
      return { ...p };
    };
    const makeRes = (key: TradeResourceKey, quantity: number): TradeResourceBundleItem => {
      const meta = TRADE_RESOURCE_CATALOG[key];
      return {
        resourceKey: key,
        label: meta.label,
        rarity: meta.rarity,
        quantity,
        imageUrl: meta.imageUrl,
        unitValueGold: meta.unitValueGold,
      };
    };

    // 1. Fair High-Value Rare Swap from Valerius_Rex
    const valPlayerGives: TradeBundle = {
      cards: [findCard('c_pal_bastion', 'epic')],
      potions: [{ potionId: 'pot_xp_1', quantity: 1, potionData: findPotion('pot_xp_1') }],
      resources: [makeRes('phoenixAsh', 1)],
      gold: 400,
      gems: 0,
    };
    const valPartnerGives: TradeBundle = {
      cards: [findCard('c_pal_archangel', 'legendary')],
      potions: [],
      resources: [makeRes('astralDew', 2)],
      gold: 180,
      gems: 15,
    };

    // 2. Predatory Scam Trap automatically locked by Anti-Scam Shield
    const scamPlayerGives: TradeBundle = {
      cards: [findCard('c_pal_archangel', 'legendary')],
      potions: [],
      resources: [makeRes('voidSpore', 2)],
      gold: 300,
      gems: 0,
    };
    const scamPartnerGives: TradeBundle = {
      cards: [findCard('c_pal_squire', 'common')],
      potions: [],
      resources: [],
      gold: 35,
      gems: 0,
    };

    // 3. Guild Reagent & Potion Swap from Aldric_Le_Brave
    const guildPlayerGives: TradeBundle = {
      cards: [findCard('c_pal_holy_strike', 'common')],
      potions: [],
      resources: [makeRes('crystals', 6), makeRes('astralDew', 1)],
      gold: 150,
      gems: 0,
    };
    const guildPartnerGives: TradeBundle = {
      cards: [],
      potions: [{ potionId: 'pot_crit_1', quantity: 1, potionData: findPotion('pot_crit_1') }],
      resources: [makeRes('phoenixAsh', 1)],
      gold: 210,
      gems: 0,
    };

    return [
      {
        id: 'prop_fair_valerius',
        direction: 'incoming',
        partnerId: 'user_valerius',
        partnerName: 'Valerius_Rex',
        partnerAvatar: 'shield_moon',
        partnerElo: 2450,
        partnerGuildTag: '[TITAN]',
        partnerTrustScore: 99,
        partnerCompletedTrades: 42,
        playerOffers: valPlayerGives,
        partnerOffers: valPartnerGives,
        note: 'Je recherche un Bastion Inébranlable + de la Cendre de Phénix pour mon deck Tournoi.',
        revision: 1,
        escrowHash: createEscrowHash('user_valerius', valPlayerGives, valPartnerGives, 1),
        inspectionEndsAt: Date.now() - 1000,
        playerConfirmed: false,
        partnerConfirmed: true,
        highValueVerified: false,
        status: 'pending_review',
        createdAt: 'Il y a 12 min',
        updatedAt: 'Il y a 12 min',
      },
      {
        id: 'prop_scam_ombre',
        direction: 'incoming',
        partnerId: 'user_ombre_suspect',
        partnerName: 'Ombre_Vénale',
        partnerAvatar: 'visibility_off',
        partnerElo: 1090,
        partnerGuildTag: '[AUCUNE]',
        partnerTrustScore: 41,
        partnerCompletedTrades: 2,
        playerOffers: scamPlayerGives,
        partnerOffers: scamPartnerGives,
        note: 'Accepte vite stp c’est un échange super rare garanti !',
        revision: 3,
        escrowHash: createEscrowHash('user_ombre_suspect', scamPlayerGives, scamPartnerGives, 3),
        inspectionEndsAt: Date.now() - 1000,
        playerConfirmed: false,
        partnerConfirmed: true,
        highValueVerified: false,
        status: 'locked_scam',
        createdAt: 'Il y a 4 min',
        updatedAt: 'Il y a 2 min (Modifié)',
      },
      {
        id: 'prop_guild_aldric',
        direction: 'incoming',
        partnerId: 'm_2',
        partnerName: 'Aldric_Le_Brave',
        partnerAvatar: 'shield_moon',
        partnerElo: 1380,
        partnerGuildTag: '[AETHER]',
        partnerTrustScore: 97,
        partnerCompletedTrades: 28,
        playerOffers: guildPlayerGives,
        partnerOffers: guildPartnerGives,
        note: 'Échange fraternel de guilde pour préparer le raid de samedi !',
        revision: 1,
        escrowHash: createEscrowHash('m_2', guildPlayerGives, guildPartnerGives, 1),
        inspectionEndsAt: Date.now() - 1000,
        playerConfirmed: false,
        partnerConfirmed: true,
        highValueVerified: false,
        status: 'pending_review',
        createdAt: 'Il y a 28 min',
        updatedAt: 'Il y a 28 min',
      },
    ];
  }

  private verifyPlayerOwnsBundle(bundle: TradeBundle): { ok: boolean; error?: string } {
    if (this.gold() < bundle.gold) {
      return { ok: false, error: `Or insuffisant : il vous faut ${bundle.gold} Or.` };
    }
    if (this.gems() < bundle.gems) {
      return { ok: false, error: `Gemmes insuffisantes : il vous faut ${bundle.gems} Gemmes.` };
    }

    const resState = this.alchemyResources();
    for (const r of bundle.resources) {
      const available = resState[r.resourceKey] ?? 0;
      if (r.quantity <= 0 || available < r.quantity) {
        return { ok: false, error: `Stock insuffisant pour ${r.label} (${available}/${r.quantity}).` };
      }
    }

    const ownedPotions = this.potions();
    for (const p of bundle.potions) {
      const found = ownedPotions.find(item => item.id === p.potionId);
      if (!found || found.count < p.quantity) {
        return { ok: false, error: `Potion indisponible : ${p.potionData.name} (stock ${found?.count ?? 0}/${p.quantity}).` };
      }
    }

    const ownedCards = this.cards();
    for (const c of bundle.cards) {
      const found = ownedCards.find(item => item.id === c.id);
      if (!found) {
        return { ok: false, error: `Carte introuvable dans votre collection : ${c.name}.` };
      }
    }

    return { ok: true };
  }

  private applyTradeBundleSwap(playerGives: TradeBundle, playerReceives: TradeBundle) {
    // 1. Currencies
    const netGold = (playerReceives.gold || 0) - (playerGives.gold || 0);
    const netGems = (playerReceives.gems || 0) - (playerGives.gems || 0);
    if (netGold !== 0) this.gold.update(g => Math.max(0, g + netGold));
    if (netGems !== 0) this.gems.update(gm => Math.max(0, gm + netGems));

    // 2. Alchemy Resources
    this.alchemyResources.update(res => {
      const next = { ...res };
      for (const r of playerGives.resources) {
        next[r.resourceKey] = Math.max(0, (next[r.resourceKey] ?? 0) - r.quantity);
      }
      for (const r of playerReceives.resources) {
        next[r.resourceKey] = (next[r.resourceKey] ?? 0) + r.quantity;
      }
      return next;
    });

    // 3. Potions
    this.potions.update(list =>
      list.map(p => {
        let count = p.count;
        for (const given of playerGives.potions) {
          if (given.potionId === p.id) count = Math.max(0, count - given.quantity);
        }
        for (const rec of playerReceives.potions) {
          if (rec.potionId === p.id) count += rec.quantity;
        }
        return count === p.count ? p : { ...p, count };
      })
    );

    // 4. Cards (consume duplicate shards if >= 15, otherwise transfer card ownership cleanly)
    const removedCardIds: string[] = [];
    this.cards.update(cards => {
      const next = [...cards];
      for (const given of playerGives.cards) {
        const idx = next.findIndex(c => c.id === given.id);
        if (idx >= 0) {
          if (next[idx].shards >= 15) {
            next[idx] = { ...next[idx], shards: next[idx].shards - 15 };
          } else {
            removedCardIds.push(given.id);
            next.splice(idx, 1);
          }
        }
      }
      for (const rec of playerReceives.cards) {
        const existingIdx = next.findIndex(c => c.id === rec.id);
        if (existingIdx >= 0) {
          next[existingIdx] = { ...next[existingIdx], shards: next[existingIdx].shards + 15 };
        } else {
          next.push({ ...rec, imageUrl: rec.imageUrl || resolveCardImageUrl(rec) });
        }
      }
      return next;
    });

    if (removedCardIds.length > 0) {
      const removedSet = new Set(removedCardIds);
      this.decks.update(decks =>
        decks.map(d => ({
          ...d,
          cardIds: d.cardIds.filter(id => !removedSet.has(id)),
        }))
      );
    }
  }

  private describeBundleShort(bundle: TradeBundle): string {
    const parts: string[] = [];
    for (const c of bundle.cards) parts.push(c.name);
    for (const p of bundle.potions) parts.push(`${p.quantity}x ${p.potionData.name}`);
    for (const r of bundle.resources) parts.push(`${r.quantity}x ${r.label}`);
    if (bundle.gold > 0) parts.push(`${bundle.gold} Or`);
    if (bundle.gems > 0) parts.push(`${bundle.gems} Gemmes`);
    return parts.length > 0 ? parts.join(' + ') : 'Aucun bien';
  }

  private recordAuditEntry(entry: Omit<TradeAuditEntry, 'id' | 'timestamp'>) {
    const timeLabel = typeof window !== 'undefined'
      ? `Aujourd’hui · ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
      : 'Aujourd’hui';
    const newEntry: TradeAuditEntry = {
      ...entry,
      id: 'audit_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      timestamp: timeLabel,
    };
    this.tradeAuditLog.update(log => [newEntry, ...log].slice(0, 40));
  }

  private showTradeWarning(title: string, message: string) {
    this.toast.show({
      type: 'market',
      title,
      message,
      icon: 'gpp_bad',
      badge: 'SÉCURITÉ TROC',
      rarity: 'epic',
      soundType: 'market',
    });
  }

  proposeDirectTrade(
    partner: { id: string; username: string; avatarIcon: string; elo: number; guildTag?: string },
    playerOffers: TradeBundle,
    partnerOffers: TradeBundle,
    note?: string
  ): { ok: boolean; error?: string; proposal?: DirectTradeProposal } {
    const ownCheck = this.verifyPlayerOwnsBundle(playerOffers);
    if (!ownCheck.ok) {
      this.showTradeWarning('Inventaire Insuffisant', ownCheck.error ?? 'Vérifiez vos ressources disponibles.');
      return { ok: false, error: ownCheck.error };
    }

    const fairness = assessTradeFairness(playerOffers, partnerOffers);
    if (fairness.status === 'scam_blocked') {
      this.showTradeWarning('Proposition Bloquée · Anti-Arnaque', fairness.summary);
      return { ok: false, error: fairness.summary };
    }

    const revision = 1;
    const escrowHash = createEscrowHash(partner.id, playerOffers, partnerOffers, revision);
    const proposal: DirectTradeProposal = {
      id: 'prop_' + Date.now(),
      direction: 'outgoing',
      partnerId: partner.id,
      partnerName: partner.username,
      partnerAvatar: partner.avatarIcon,
      partnerElo: partner.elo,
      partnerGuildTag: partner.guildTag,
      partnerTrustScore: partner.elo >= 2000 ? 98 : 94,
      partnerCompletedTrades: Math.max(8, Math.round(partner.elo / 65)),
      playerOffers,
      partnerOffers,
      note: note?.trim() || undefined,
      revision,
      escrowHash,
      inspectionEndsAt: Date.now() + 5000,
      playerConfirmed: false,
      partnerConfirmed: false,
      highValueVerified: false,
      status: 'pending_review',
      createdAt: 'À l’instant',
      updatedAt: 'À l’instant',
    };

    this.directTradeProposals.update(list => [proposal, ...list]);
    this.sound.playTradeDropSnap();
    this.toast.showMarketUpdate(
      'Proposition Escrow Envoyée',
      `Offre scellée (${escrowHash}) transmise à ${partner.username}. Verrou d’inspection de 5s activé.`,
      { badge: 'TROC SÉCURISÉ', rarity: 'rare' }
    );
    this.triggerAutoSave();

    // Partner reviews and accepts balanced proposals asynchronously
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        this.directTradeProposals.update(list =>
          list.map(p =>
            p.id === proposal.id && p.revision === revision && p.status === 'pending_review'
              ? { ...p, partnerConfirmed: true, updatedAt: 'Partenaire prêt' }
              : p
          )
        );
      }, 1800);
    }

    return { ok: true, proposal };
  }

  modifyDirectTrade(
    proposalId: string,
    playerOffers: TradeBundle,
    partnerOffers: TradeBundle,
    note?: string
  ): { ok: boolean; error?: string } {
    const existing = this.directTradeProposals().find(p => p.id === proposalId);
    if (!existing || existing.status === 'completed' || existing.status === 'cancelled') {
      return { ok: false, error: 'Cette proposition n’est plus modifiable.' };
    }

    const ownCheck = this.verifyPlayerOwnsBundle(playerOffers);
    if (!ownCheck.ok) {
      this.showTradeWarning('Inventaire Insuffisant', ownCheck.error ?? 'Vérifiez vos objets disponibles.');
      return { ok: false, error: ownCheck.error };
    }

    const fairness = assessTradeFairness(playerOffers, partnerOffers);
    const nextRev = existing.revision + 1;
    const nextHash = createEscrowHash(existing.partnerId, playerOffers, partnerOffers, nextRev);
    const nextStatus = fairness.status === 'scam_blocked' ? 'locked_scam' : 'pending_review';

    this.directTradeProposals.update(list =>
      list.map(p =>
        p.id === proposalId
          ? {
              ...p,
              playerOffers,
              partnerOffers,
              note: note?.trim() || p.note,
              revision: nextRev,
              escrowHash: nextHash,
              inspectionEndsAt: Date.now() + 5000,
              playerConfirmed: false,
              partnerConfirmed: false,
              highValueVerified: false,
              status: nextStatus,
              updatedAt: `Révision #${nextRev} · Signatures réinitialisées`,
            }
          : p
      )
    );

    this.sound.playClick('parchment');
    this.toast.showMarketUpdate(
      'Contre-Offre Enregistrée · Verrou 5s',
      `Révision #${nextRev} (${nextHash}) : toutes les confirmations ont été réinitialisées par sécurité.`,
      { badge: 'ANTI-SUBSTITUTION', rarity: 'epic' }
    );
    this.triggerAutoSave();

    if (nextStatus === 'pending_review' && typeof window !== 'undefined') {
      setTimeout(() => {
        this.directTradeProposals.update(list =>
          list.map(p =>
            p.id === proposalId && p.revision === nextRev && p.status === 'pending_review'
              ? { ...p, partnerConfirmed: true }
              : p
          )
        );
      }, 2000);
    }

    return { ok: true };
  }

  setDirectTradeHighValueVerified(proposalId: string, verified: boolean) {
    this.directTradeProposals.update(list =>
      list.map(p => (p.id === proposalId ? { ...p, highValueVerified: verified } : p))
    );
  }

  confirmDirectTrade(proposalId: string): { ok: boolean; error?: string } {
    const proposal = this.directTradeProposals().find(p => p.id === proposalId);
    if (!proposal) return { ok: false, error: 'Proposition introuvable.' };

    if (proposal.status !== 'pending_review') {
      const msg = 'Échange bloqué par le Bouclier Anti-Arnaque : modifiez les termes ou signalez cette offre.';
      this.showTradeWarning('Confirmation Bloquée', msg);
      return { ok: false, error: msg };
    }

    if (Date.now() < proposal.inspectionEndsAt) {
      const secs = Math.ceil((proposal.inspectionEndsAt - Date.now()) / 1000);
      const msg = `Verrou d’inspection actif : attendez encore ${secs}s avant de sceller cet échange.`;
      this.showTradeWarning('Délai de Sécurité Actif', msg);
      return { ok: false, error: msg };
    }

    const fairness = assessTradeFairness(proposal.playerOffers, proposal.partnerOffers);
    if (fairness.status === 'scam_blocked') {
      this.directTradeProposals.update(list =>
        list.map(p => (p.id === proposalId ? { ...p, status: 'locked_scam' } : p))
      );
      this.showTradeWarning('Arnaque Bloquée', fairness.summary);
      return { ok: false, error: fairness.summary };
    }

    if (fairness.requiresDoubleConfirm && !proposal.highValueVerified) {
      const msg = 'Cochez la case de double vérification pour confirmer le transfert d’objets rares.';
      this.showTradeWarning('Double Vérification Requise', msg);
      return { ok: false, error: msg };
    }

    const ownCheck = this.verifyPlayerOwnsBundle(proposal.playerOffers);
    if (!ownCheck.ok) {
      this.showTradeWarning('Échange Impossible', ownCheck.error ?? 'Inventaire modifié.');
      return { ok: false, error: ownCheck.error };
    }

    // Execute atomic escrow swap
    this.applyTradeBundleSwap(proposal.playerOffers, proposal.partnerOffers);

    this.directTradeProposals.update(list =>
      list.map(p =>
        p.id === proposalId
          ? {
              ...p,
              playerConfirmed: true,
              partnerConfirmed: true,
              status: 'completed',
              updatedAt: 'Scellé et exécuté',
            }
          : p
      )
    );

    const summary = `${this.describeBundleShort(proposal.playerOffers)} ↔ ${this.describeBundleShort(proposal.partnerOffers)}`;
    this.recordAuditEntry({
      type: 'p2p_trade',
      partnerName: proposal.partnerName,
      summary,
      valueGold: Math.max(fairness.offeredValueGold, fairness.requestedValueGold),
      escrowHash: proposal.escrowHash,
      fairnessStatus: fairness.status,
    });

    this.sound.playTradeSmokeMagic();
    this.sound.playCoins();
    this.toast.showMarketUpdate(
      'Troc Scellé avec Succès !',
      `Échange avec ${proposal.partnerName} exécuté sous contrat ${proposal.escrowHash}.`,
      { badge: 'ESCROW VALIDÉ', rarity: 'legendary' }
    );
    this.triggerAutoSave();
    return { ok: true };
  }

  rejectOrCancelDirectTrade(proposalId: string, reportScam = false) {
    const proposal = this.directTradeProposals().find(p => p.id === proposalId);
    if (!proposal) return;

    const fairness = assessTradeFairness(proposal.playerOffers, proposal.partnerOffers);
    const nextStatus = reportScam ? 'reported' : 'cancelled';

    this.directTradeProposals.update(list =>
      list.map(p =>
        p.id === proposalId
          ? { ...p, status: nextStatus, updatedAt: reportScam ? 'Signalé et bloqué' : 'Annulé' }
          : p
      )
    );

    this.recordAuditEntry({
      type: reportScam ? 'scam_prevented' : 'escrow_cancelled',
      partnerName: proposal.partnerName,
      summary: reportScam
        ? `Arnaque signalée et bloquée (${this.describeBundleShort(proposal.partnerOffers)} contre ${this.describeBundleShort(proposal.playerOffers)})`
        : `Contrat ${proposal.escrowHash} annulé proprement avant exécution`,
      valueGold: Math.max(fairness.offeredValueGold, fairness.requestedValueGold),
      escrowHash: proposal.escrowHash,
      fairnessStatus: reportScam ? 'scam_blocked' : fairness.status,
    });

    this.sound.playClick('crimson');
    if (reportScam) {
      this.toast.showMarketUpdate(
        'Tentative d’Arnaque Signalée',
        `${proposal.partnerName} a été signalé à la Garde d’Aetheria et vos biens sont restés intacts.`,
        { badge: 'BOUCLIER ACTIF', rarity: 'epic' }
      );
    } else {
      this.toast.showMarketUpdate(
        'Proposition Fermée',
        `Le contrat d’échange ${proposal.escrowHash} a été annulé sans perte d’objet.`,
        { badge: 'ESCROW ANNULÉ', rarity: 'common' }
      );
    }
    this.triggerAutoSave();
  }

  assessMarketOffer(offer: TradeOffer): FairTradeAssessment {
    const zeroBundle: TradeBundle = { cards: [], potions: [], resources: [], gold: 0, gems: 0 };
    const itemBundle: TradeBundle = {
      cards: offer.cardData ? [offer.cardData] : [],
      potions: offer.potionData ? [{ potionId: offer.potionData.id, quantity: offer.potionData.count, potionData: offer.potionData }] : [],
      resources: [],
      gold: 0,
      gems: 0,
    };
    const priceBundle: TradeBundle = {
      ...zeroBundle,
      gold: offer.priceGold,
      gems: offer.priceGems,
    };
    return assessTradeFairness(priceBundle, itemBundle);
  }

  // Marketplace & Trade
  buyTradeOffer(offerId: string): boolean {
    const offer = this.tradeOffers().find(o => o.id === offerId);
    if (!offer) return false;

    if (this.gold() < offer.priceGold || this.gems() < offer.priceGems) {
      this.showTradeWarning('Solde Insuffisant', 'Votre trésor ne couvre pas le prix de cette offre.');
      return false;
    }

    const fairness = this.assessMarketOffer(offer);

    this.gold.update(g => g - offer.priceGold);
    this.gems.update(gm => gm - offer.priceGems);

    const itemName = offer.cardData ? offer.cardData.name : (offer.potionData ? offer.potionData.name : 'Article du Marché');

    if (offer.cardData) {
      this.cards.update(cards => {
        const found = cards.find(c => c.id === offer.cardData!.id);
        if (found) {
          return cards.map(c => (c.id === found.id ? { ...c, shards: c.shards + 15 } : c));
        }
        return [...cards, offer.cardData!];
      });
    } else if (offer.potionData) {
      this.potions.update(list =>
        list.map(p => (p.id === offer.potionData!.id ? { ...p, count: p.count + offer.potionData!.count } : p))
      );
    }

    this.tradeOffers.update(list => list.filter(o => o.id !== offerId));
    this.recordAuditEntry({
      type: 'market_buy',
      partnerName: offer.sellerName ?? 'Marchand d’Aetheria',
      summary: `Acquisition : ${itemName} (${offer.priceGold} Or · ${offer.priceGems} Gemmes)`,
      valueGold: offer.priceGold + offer.priceGems * GEM_TO_GOLD_RATE,
      fairnessStatus: fairness.status,
    });
    this.toast.showMarketUpdate('Achat Effectué au Marché !', `Vous avez acheté [${itemName}] à ${offer.sellerName} (${offer.priceGold} Or / ${offer.priceGems} Gemmes).`, { badge: 'ACHAT TROC', rarity: 'rare' });
    this.sound.playCoins();
    this.triggerAutoSave();
    return true;
  }

  createTradeOffer(
    itemType: 'card' | 'potion',
    itemId: string,
    priceGold: number,
    priceGems: number
  ): { ok: boolean; error?: string } {
    if (priceGold < 0 || priceGems < 0 || (priceGold === 0 && priceGems === 0)) {
      const msg = 'Indiquez un prix valide supérieur à 0 Or ou 0 Gemmes.';
      this.showTradeWarning('Prix Invalide', msg);
      return { ok: false, error: msg };
    }

    let cardData: Card | undefined;
    let potionData: Potion | undefined;
    let referenceValue = 0;
    let isRareItem = false;

    if (itemType === 'card') {
      const foundCard = this.cards().find(c => c.id === itemId);
      if (!foundCard) {
        const msg = 'Carte introuvable dans votre collection.';
        this.showTradeWarning('Objet Introuvable', msg);
        return { ok: false, error: msg };
      }
      cardData = {
        ...foundCard,
        imageUrl: foundCard.imageUrl || resolveCardImageUrl(foundCard),
      };
      referenceValue = evaluateCardValue(cardData);
      isRareItem = cardData.rarity !== 'common' || !!cardData.foil;
    } else {
      const foundPotion = this.potions().find(p => p.id === itemId);
      if (!foundPotion || foundPotion.count <= 0) {
        const msg = 'Vous ne possédez aucune unité disponible de cette potion.';
        this.showTradeWarning('Stock Épuisé', msg);
        return { ok: false, error: msg };
      }
      potionData = { ...foundPotion, count: 1 };
      referenceValue = evaluatePotionValue(foundPotion, 1);
      isRareItem = foundPotion.rarity !== 'common';
    }

    const totalListedGold = priceGold + priceGems * GEM_TO_GOLD_RATE;
    const minFloorGold = Math.round(referenceValue * (isRareItem ? 0.5 : 0.35));
    if (totalListedGold < minFloorGold) {
      const msg = `Protection anti-arnaque : prix trop bas (${totalListedGold} Or équiv.). Plancher de sécurité : ${minFloorGold} Or équiv. pour éviter toute spoliation.`;
      this.showTradeWarning('Prix Bloqué par Sécurité', msg);
      return { ok: false, error: msg };
    }

    const offer: TradeOffer = {
      id: 'trade_' + Date.now(),
      sellerId: 'player_me',
      sellerName: this.username(),
      sellerAvatar: 'military_tech',
      sellerElo: this.elo(),
      sellerTrustScore: 98,
      itemType,
      cardData,
      potionData,
      priceGold,
      priceGems,
      listedAgo: 'À l\'instant',
      isFeatured: isRareItem,
    };

    this.tradeOffers.update(list => [offer, ...list]);
    const itemName = cardData ? cardData.name : (potionData ? potionData.name : 'Objet');
    this.recordAuditEntry({
      type: 'market_sell',
      partnerName: this.username(),
      summary: `Mise en vente vérifiée : ${itemName} à ${priceGold} Or · ${priceGems} Gemmes`,
      valueGold: totalListedGold,
      fairnessStatus: 'balanced',
    });
    this.toast.showMarketUpdate('Annonce Publiée !', `Votre offre [${itemName}] est désormais visible par tous les duellistes à ${priceGold} Or.`, { badge: 'VENTE PUBLIÉE', rarity: 'common' });
    this.sound.playClick();
    this.triggerAutoSave();
    return { ok: true };
  }

  consumeRankedVictoryCelebration() {
    this.pendingRankedVictoryCelebration.set(false);
  }

  // Match Outcome resolution
  recordMatchResult(isWin: boolean, damageDealt: number, isRanked = false) {
    const eloChange = isWin ? 25 : -15;
    this.elo.update(e => Math.max(1000, e + eloChange));

    // Check Midas Gold & XP Boost buffs
    const midasBuff = this.activeBuffs().find(b => b.type === 'midas_gold');
    const xpBuff = this.activeBuffs().find(b => b.type === 'xp_boost');
    const goldMultiplier = midasBuff ? 2 : 1;
    const xpMultiplier = xpBuff ? 2 : 1;

    // Base match rewards
    const baseGoldReward = isWin ? 150 : 50;
    const basePlayerXpReward = isWin ? 100 : 35;
    const baseSeasonXpReward = isWin ? 150 : 50;

    // Relic multipliers
    const relicXpBoostPct = this.totalRelicXpBoostPct(); // e.g. +70%
    const relicGoldBoostPct = this.totalRelicGoldBoostPct();
    const relicSeasonXpBoostPct = this.totalRelicSeasonXpBoostPct();

    const xpBonus = Math.round((basePlayerXpReward * relicXpBoostPct) / 100);
    const goldBonus = Math.round((baseGoldReward * relicGoldBoostPct) / 100);
    const seasonXpBonus = Math.round((baseSeasonXpReward * relicSeasonXpBoostPct) / 100);

    const totalGold = (baseGoldReward + goldBonus) * goldMultiplier;
    const totalXp = (basePlayerXpReward + xpBonus) * xpMultiplier;
    const totalSeasonXp = (baseSeasonXpReward + seasonXpBonus) * xpMultiplier;

    this.gold.update(g => g + totalGold);
    this.playerXp.update(x => {
      const next = x + totalXp;
      if (next >= this.playerXpRequired()) {
        this.playerLevel.update(lvl => lvl + 1);
        this.addGems(25);
        this.addShards(20);
        this.toast.showReward('Niveau Supérieur Atteint !', `Félicitations ! Vous atteignez le Niveau ${this.playerLevel()} (+25 Gemmes, +20 Éclats) !`, { badge: 'NIVEAU +1', rarity: 'mythic', icon: 'military_tech' });
        return next - this.playerXpRequired();
      }
      return next;
    });

    this.seasonXp.update(sx => {
      const next = sx + totalSeasonXp;
      this.recalculateSeasonTier(next);
      return next;
    });

    // Arena alchemical reagent harvesting
    const dropHerbs = Math.floor(Math.random() * (isWin ? 3 : 2)) + (isWin ? 2 : 1);
    const dropCrystals = Math.floor(Math.random() * (isWin ? 2 : 1)) + (isWin ? 1 : 0);
    const dropEssences = isWin ? (Math.random() < 0.75 ? 1 : 2) : (Math.random() < 0.35 ? 1 : 0);

    const astralChance = midasBuff ? 0.65 : 0.35;
    const phoenixChance = midasBuff ? 0.45 : 0.22;
    const voidChance = midasBuff ? 0.30 : 0.15;

    const dropAstral = isWin && Math.random() < astralChance ? (midasBuff ? 2 : 1) : 0;
    const dropPhoenix = isWin && Math.random() < phoenixChance ? 1 : 0;
    const dropVoid = isWin && Math.random() < voidChance ? 1 : 0;

    this.alchemyResources.update(r => ({
      herbs: r.herbs + dropHerbs,
      crystals: r.crystals + dropCrystals,
      essences: r.essences + dropEssences,
      astralDew: r.astralDew + dropAstral,
      phoenixAsh: r.phoenixAsh + dropPhoenix,
      voidSpore: r.voidSpore + dropVoid,
    }));

    // Decrement active potion buffs
    this.activeBuffs.update(buffs =>
      buffs
        .map(b => ({ ...b, remainingMatches: b.remainingMatches - 1 }))
        .filter(b => b.remainingMatches > 0)
    );

    // Update stats
    const curStats = this.playerStats();
    const nextWins = isWin ? curStats.wins + 1 : curStats.wins;
    const nextRankedWins = isWin && isRanked ? (curStats.rankedWins ?? 0) + 1 : (curStats.rankedWins ?? 0);

    this.playerStats.update(st => ({
      ...st,
      totalMatches: st.totalMatches + 1,
      wins: isWin ? st.wins + 1 : st.wins,
      losses: isWin ? st.losses : st.losses + 1,
      rankedMatches: isRanked ? (st.rankedMatches ?? 0) + 1 : st.rankedMatches,
      rankedWins: isRanked && isWin ? (st.rankedWins ?? 0) + 1 : st.rankedWins,
      currentWinStreak: isWin ? st.currentWinStreak + 1 : 0,
      highestWinStreak: isWin ? Math.max(st.highestWinStreak, st.currentWinStreak + 1) : st.highestWinStreak,
      totalDamageDealt: st.totalDamageDealt + damageDealt,
    }));

    if (isWin) {
      this.recentVictoryGain.set({
        id: Date.now(),
        winsCount: nextWins,
        rankedWinsCount: nextRankedWins,
        isRanked,
      });
      this.pendingRankedVictoryCelebration.set(true);
    }

    // Update Quests
    if (isWin) {
      this.updateQuestProgress('q_1', 1);
    }
    this.updateQuestProgress('q_4', 5);

    const reagentsList: string[] = [];
    if (dropHerbs > 0) reagentsList.push(`+${dropHerbs} Herbes`);
    if (dropCrystals > 0) reagentsList.push(`+${dropCrystals} Cristaux`);
    if (dropEssences > 0) reagentsList.push(`+${dropEssences} Essences`);
    if (dropAstral > 0) reagentsList.push(`+${dropAstral} Rosée Astrale`);
    if (dropPhoenix > 0) reagentsList.push(`+${dropPhoenix} Cendres Phénix`);
    if (dropVoid > 0) reagentsList.push(`+${dropVoid} Spores Néant`);

    const reagentSummary = reagentsList.length > 0 ? ` | Récolte : ${reagentsList.join(', ')}` : '';
    const midasNote = midasBuff ? ' [Midas x2]' : '';
    const relicBonusText = xpBonus > 0 ? ` (dont +${xpBonus} XP [+${relicXpBoostPct}%])` : '';

    this.toast.showBattleResult(isWin, eloChange, `Butin : +${totalGold} Or${midasNote}, +${totalXp} XP${relicBonusText}, +${totalSeasonXp} Saison${reagentSummary}`);
    this.triggerAutoSave();
  }

  // ==========================================
  // RELICS SYSTEM: EQUIP, FUSE & ENCHANT
  // ==========================================

  equipRelic(relicId: string, slotNumber: number): boolean {
    const relic = this.relics().find(r => r.id === relicId);
    if (!relic) return false;

    this.relics.update(list =>
      list.map(r => {
        // If another relic is in that slot, unequip it
        if (r.isEquipped && r.equippedSlot === slotNumber && r.id !== relicId) {
          return { ...r, isEquipped: false, equippedSlot: undefined };
        }
        // Equip the chosen relic
        if (r.id === relicId) {
          return { ...r, isEquipped: true, equippedSlot: slotNumber };
        }
        return r;
      })
    );

    this.toast.showSystem(
      'Relique Équipée !',
      `[${relic.name}] enchâssée dans l'Emplacement ${slotNumber}. Boost actif : +${relic.totalXpBonusPct}% EXP !`,
      relic.icon
    );
    this.sound.playCardSummon('epic');
    this.triggerAutoSave();
    return true;
  }

  unequipRelic(relicId: string): boolean {
    const relic = this.relics().find(r => r.id === relicId);
    if (!relic || !relic.isEquipped) return false;

    this.relics.update(list =>
      list.map(r => (r.id === relicId ? { ...r, isEquipped: false, equippedSlot: undefined } : r))
    );

    this.toast.showSystem('Relique Retirée', `[${relic.name}] a été descellée de son emplacement.`, 'inventory_2');
    this.sound.playClick();
    this.triggerAutoSave();
    return true;
  }

  /**
   * Fuse duplicates of a relic to increase its Tier (from Tier 1 to 5)
   */
  fuseRelic(relicId: string): boolean {
    const relic = this.relics().find(r => r.id === relicId);
    if (!relic) return false;

    if (relic.tier >= 5) {
      this.toast.showSystem('Rang Maximal Atteint', `[${relic.name}] a déjà atteint le Rang Suprême V !`);
      return false;
    }

    if (relic.duplicateCount < relic.fusionRequired) {
      this.toast.showSystem(
        'Doublons Insuffisants',
        `Il vous faut ${relic.fusionRequired} doublons pour transmuter cette relique au Rang ${relic.tier + 1}.`
      );
      return false;
    }

    const goldCost = relic.tier * 250;
    if (this.gold() < goldCost) {
      this.toast.showSystem('Or Insuffisant', `La fusion vers le Rang ${relic.tier + 1} requiert ${goldCost} pièces d'or.`);
      return false;
    }

    // Deduct resources
    this.gold.update(g => g - goldCost);

    // Calculate new Tier properties
    const nextTier = relic.tier + 1;
    const nextFusionReq = Math.min(5, nextTier + 1);
    const tierBonusPct = nextTier * 15;
    const enchantBonusPct = relic.enchantLevel * 10;
    const newTotalXp = relic.baseXpBonusPct + tierBonusPct + enchantBonusPct;

    this.relics.update(list =>
      list.map(r => {
        if (r.id === relicId) {
          const updatedAffixes = r.affixes.map(af => {
            if (af.type === 'bonus_xp_pct') {
              return { ...af, value: newTotalXp, label: `+${newTotalXp}% EXP de Compte par combat` };
            }
            if (af.type === 'bonus_season_xp_pct') {
              const val = af.value + 10;
              return { ...af, value: val, label: `+${val}% XP de Passe de Saison` };
            }
            if (af.type === 'bonus_gold_pct') {
              const val = af.value + 5;
              return { ...af, value: val, label: `+${val}% Or supplémentaire` };
            }
            return af;
          });

          return {
            ...r,
            tier: nextTier,
            duplicateCount: r.duplicateCount - r.fusionRequired,
            fusionRequired: nextFusionReq,
            totalXpBonusPct: newTotalXp,
            affixes: updatedAffixes,
          };
        }
        return r;
      })
    );

    this.toast.showReward(
      'Fusion de Relique Réussie !',
      `[${relic.name}] transcendée au Rang ${nextTier} ! Le bonus d'EXP passe à +${newTotalXp}% !`,
      { badge: `FUSION RANG ${nextTier}`, rarity: 'legendary', icon: 'auto_awesome' }
    );
    this.sound.playCardSummon('mythic');
    this.triggerAutoSave();
    return true;
  }

  /**
   * Enchant a relic with Gems to unlock celestial enchantments (+10% EXP & glowing aura per star)
   */
  enchantRelicWithGems(relicId: string): boolean {
    const relic = this.relics().find(r => r.id === relicId);
    if (!relic) return false;

    if (relic.enchantLevel >= 5) {
      this.toast.showSystem('Enchantement Maximal', `[${relic.name}] est déjà infusée de 5 étoiles arcaniques !`);
      return false;
    }

    const nextEnchantLevel = relic.enchantLevel + 1;
    const gemCost = nextEnchantLevel * 50; // 50, 100, 150, 200, 250 gems

    if (this.gems() < gemCost) {
      this.toast.showSystem(
        'Gemmes Insuffisantes',
        `L'enchantement Étoile ${nextEnchantLevel} requiert ${gemCost} Gemmes (vous en possédez ${this.gems()}).`
      );
      return false;
    }

    // Deduct gems
    this.gems.update(gm => gm - gemCost);

    const tierBonusPct = relic.tier * 15;
    const newEnchantBonusPct = nextEnchantLevel * 10;
    const newTotalXp = relic.baseXpBonusPct + tierBonusPct + newEnchantBonusPct;

    this.relics.update(list =>
      list.map(r => {
        if (r.id === relicId) {
          const updatedAffixes = r.affixes.map(af => {
            if (af.type === 'bonus_xp_pct') {
              return { ...af, value: newTotalXp, label: `+${newTotalXp}% EXP de Compte par combat` };
            }
            return af;
          });

          return {
            ...r,
            enchantLevel: nextEnchantLevel,
            totalXpBonusPct: newTotalXp,
            affixes: updatedAffixes,
          };
        }
        return r;
      })
    );

    this.toast.showReward(
      'Enchantement aux Gemmes Scellé !',
      `[${relic.name}] imprégnée de l'Étoile Arcanique ${nextEnchantLevel} (-${gemCost} Gemmes) ! Boost total : +${newTotalXp}% EXP !`,
      { badge: `ENCHANTEMENT ★${nextEnchantLevel}`, rarity: 'mythic', icon: 'diamond' }
    );
    this.sound.playVictory();
    this.triggerAutoSave();
    return true;
  }

  /**
   * Add a duplicate copy of a relic (e.g. from shop or quest reward)
   */
  addRelicDuplicate(baseId: string, count = 1) {
    this.relics.update(list =>
      list.map(r => (r.baseId === baseId ? { ...r, duplicateCount: r.duplicateCount + count } : r))
    );
    this.triggerAutoSave();
  }

  // ==========================================
  // COMPANION PETS (Animaux de Compagnie)
  // Multiplicateur de Dégâts par Rareté & Niveau
  // ==========================================

  equipPet(petId: string): boolean {
    const pet = this.pets().find(p => p.id === petId);
    if (!pet) return false;
    if (!pet.isUnlocked) {
      this.toast.showSystem('Familier Verrouillé', `Vous devez d'abord apprivoiser [${pet.name}].`);
      return false;
    }

    this.pets.update(list =>
      list.map(p => ({
        ...p,
        isEquipped: p.id === petId
      }))
    );

    const bonusPct = Math.round((pet.totalMultiplier - 1) * 100);
    this.toast.showReward(
      'Familier à vos Côtés !',
      `[${pet.name}] (${pet.rarity.toUpperCase()}) est équipé ! Multiplicateur de dégâts : x${pet.totalMultiplier.toFixed(2)} (+${bonusPct}%).`,
      { badge: `MULTIPLICATEUR x${pet.totalMultiplier.toFixed(2)}`, rarity: pet.rarity, icon: pet.icon }
    );
    this.sound.playCardSummon(pet.rarity === 'mythic' ? 'mythic' : 'epic');
    this.triggerAutoSave();
    return true;
  }

  unequipPet(petId: string): boolean {
    const pet = this.pets().find(p => p.id === petId);
    if (!pet || !pet.isEquipped) return false;

    this.pets.update(list =>
      list.map(p => (p.id === petId ? { ...p, isEquipped: false } : p))
    );

    this.toast.showSystem('Familier Renvoyé', `[${pet.name}] regagne la ménagerie. Vos dégâts redeviennent normaux (x1.00).`, 'pets');
    this.sound.playClick();
    this.triggerAutoSave();
    return true;
  }

  unlockPet(petId: string, currency: 'gold' | 'gems'): boolean {
    const pet = this.pets().find(p => p.id === petId);
    if (!pet || pet.isUnlocked) return false;

    if (currency === 'gold') {
      const cost = pet.unlockCostGold || 1000;
      if (this.gold() < cost) {
        this.toast.showSystem('Or Insuffisant', `Il vous manque de l'or pour adopter [${pet.name}] (${cost} requis).`);
        return false;
      }
      this.gold.update(g => g - cost);
    } else {
      const cost = pet.unlockCostGems || 50;
      if (this.gems() < cost) {
        this.toast.showSystem('Gemmes Insuffisantes', `Il vous manque des gemmes pour adopter [${pet.name}] (${cost} requises).`);
        return false;
      }
      this.gems.update(g => g - cost);
    }

    const hadEquipped = this.pets().some(p => p.isEquipped && p.isUnlocked);

    this.pets.update(list =>
      list.map(p => (p.id === petId ? { ...p, isUnlocked: true, isEquipped: !hadEquipped } : p))
    );

    const bonusPct = Math.round((pet.totalMultiplier - 1) * 100);
    this.toast.showReward(
      'Compagnon Apprivoisé !',
      `[${pet.name}] a rejoint votre ménagerie ! Rareté : ${pet.rarity.toUpperCase()} (Dégâts x${pet.totalMultiplier.toFixed(2)} soit +${bonusPct}% !).`,
      { badge: `ADOPTION ${pet.rarity.toUpperCase()}`, rarity: pet.rarity, icon: pet.icon }
    );
    this.sound.playCardSummon('mythic');
    this.triggerAutoSave();
    return true;
  }

  feedAndTrainPet(petId: string, resource: 'gold' | 'gems'): boolean {
    const pet = this.pets().find(p => p.id === petId);
    if (!pet || !pet.isUnlocked) return false;

    if (pet.level >= 10) {
      this.toast.showSystem('Niveau Maximal', `[${pet.name}] a atteint l'harmonie suprême au Niveau 10 !`);
      return false;
    }

    const goldCost = resource === 'gold' ? pet.goldUpgradeCost : 0;
    const gemCost = resource === 'gems' ? pet.gemUpgradeCost : 0;

    if (resource === 'gold') {
      if (this.gold() < goldCost) {
        this.toast.showSystem('Or Insuffisant', `Nourrir [${pet.name}] requiert ${goldCost} pièces d'or.`);
        return false;
      }
      this.gold.update(g => g - goldCost);
    } else {
      if (this.gems() < gemCost) {
        this.toast.showSystem('Gemmes Insuffisantes', `L'essence astrale pour [${pet.name}] requiert ${gemCost} gemmes.`);
        return false;
      }
      this.gems.update(g => g - gemCost);
    }

    const affinityGain = resource === 'gold' ? 60 : 150;
    const newAffinity = pet.affinity + affinityGain;

    if (newAffinity >= pet.affinityRequired) {
      const nextLevel = pet.level + 1;
      const overflowAffinity = newAffinity - pet.affinityRequired;
      const newAffinityReq = Math.round(pet.affinityRequired * 1.45);
      const newTotalMult = Number((pet.baseMultiplier + (nextLevel - 1) * pet.levelBonusPerLevel).toFixed(2));
      const newGoldCost = Math.round(pet.goldUpgradeCost * 1.35);
      const newGemCost = Math.round(pet.gemUpgradeCost * 1.3);
      const newBonusPct = Math.round((newTotalMult - 1) * 100);

      this.pets.update(list =>
        list.map(p =>
          p.id === petId
            ? {
                ...p,
                level: nextLevel,
                affinity: overflowAffinity,
                affinityRequired: newAffinityReq,
                totalMultiplier: newTotalMult,
                goldUpgradeCost: newGoldCost,
                gemUpgradeCost: newGemCost,
              }
            : p
        )
      );

      this.toast.showReward(
        'Montée de Niveau du Familier !',
        `[${pet.name}] atteint le Niveau ${nextLevel} ! Multiplicateur de dégâts amélioré à x${newTotalMult.toFixed(2)} (+${newBonusPct}%) !`,
        { badge: `NIVEAU ${nextLevel}`, rarity: pet.rarity, icon: pet.icon }
      );
      this.sound.playVictory();
    } else {
      this.pets.update(list =>
        list.map(p =>
          p.id === petId
            ? {
                ...p,
                affinity: newAffinity,
              }
            : p
        )
      );

      this.toast.showSystem(
        'Friandise Savourée !',
        `[${pet.name}] gagne +${affinityGain} Affinité (${newAffinity}/${pet.affinityRequired}).`,
        'favorite'
      );
      this.sound.playCoins();
    }

    this.triggerAutoSave();
    return true;
  }

  rewardEquippedPetAffinity(amount: number) {
    const pet = this.equippedPet();
    if (!pet || pet.level >= 10) return;

    const newAffinity = pet.affinity + amount;
    if (newAffinity >= pet.affinityRequired) {
      const nextLevel = pet.level + 1;
      const overflowAffinity = newAffinity - pet.affinityRequired;
      const newAffinityReq = Math.round(pet.affinityRequired * 1.45);
      const newTotalMult = Number((pet.baseMultiplier + (nextLevel - 1) * pet.levelBonusPerLevel).toFixed(2));
      const newBonusPct = Math.round((newTotalMult - 1) * 100);

      this.pets.update(list =>
        list.map(p =>
          p.id === pet.id
            ? {
                ...p,
                level: nextLevel,
                affinity: overflowAffinity,
                affinityRequired: newAffinityReq,
                totalMultiplier: newTotalMult,
              }
            : p
        )
      );

      this.toast.showReward(
        'Votre Familier a Évolué !',
        `Après ce combat valeureux, [${pet.name}] passe au Niveau ${nextLevel} (Dégâts x${newTotalMult.toFixed(2)} / +${newBonusPct}%) !`,
        { badge: `NIVEAU ${nextLevel}`, rarity: pet.rarity, icon: pet.icon }
      );
    } else {
      this.pets.update(list =>
        list.map(p => (p.id === pet.id ? { ...p, affinity: newAffinity } : p))
      );
    }
  }

  recalculateSeasonTier(currentXp: number) {
    const tiers = this.battlePassTiers();
    let highestReached = 1;
    for (const t of tiers) {
      if (currentXp >= t.xpRequired) {
        highestReached = t.tier;
      } else {
        break;
      }
    }
    this.seasonTier.set(highestReached);
  }

  claimBattlePassReward(tierNumber: number, type: 'free' | 'premium'): boolean {
    const tierIndex = this.battlePassTiers().findIndex(t => t.tier === tierNumber);
    if (tierIndex === -1) return false;

    const tier = this.battlePassTiers()[tierIndex];
    if (this.seasonTier() < tier.tier) return false;

    if (type === 'free') {
      if (tier.isFreeClaimed) return false;

      // Distribute free reward
      const r = tier.freeReward;
      if (r.type === 'gold') this.addGold(r.amount);
      else if (r.type === 'gems') this.addGems(r.amount);
      else if (r.type === 'shards') this.addShards(r.amount);
      else if (r.type === 'potion' && r.itemId) {
        this.potions.update(list =>
          list.map(p => (p.id === r.itemId ? { ...p, count: p.count + r.amount } : p))
        );
      } else if (r.type === 'pack') {
        this.addGold(300 * r.amount);
        this.addShards(25 * r.amount);
      }

      this.battlePassTiers.update(tiers =>
        tiers.map(t => (t.tier === tierNumber ? { ...t, isFreeClaimed: true } : t))
      );
    } else {
      if (!this.isSeasonPassPremium() || tier.isPremiumClaimed) return false;

      // Distribute premium reward
      const r = tier.premiumReward;
      if (r.type === 'gems') this.addGems(r.amount);
      else if (r.type === 'gold') this.addGold(r.amount);
      else if (r.type === 'shards') this.addShards(r.amount);
      else if (r.type === 'title' || r.type === 'exclusive_title') {
        const titleText = r.name.replace(/^Titre:\s*/i, '').trim();
        if (!this.titles().includes(titleText)) {
          this.titles.update(titles => [...titles, titleText]);
        }
      }

      this.battlePassTiers.update(tiers =>
        tiers.map(t => (t.tier === tierNumber ? { ...t, isPremiumClaimed: true } : t))
      );
    }

    const rewardObj = type === 'free' ? tier.freeReward : tier.premiumReward;
    this.toast.showReward(
      `Palier ${tierNumber} Récupéré !`,
      `${rewardObj.name} ajouté à votre inventaire.`,
      { badge: type === 'free' ? 'SAISON GRATUITE' : 'SAISON PASS', rarity: type === 'premium' ? 'legendary' : 'epic', icon: 'workspace_premium' }
    );

    this.sound.playVictory();
    this.triggerAutoSave();
    return true;
  }

  claimAllBattlePassRewards(): number {
    let claimedCount = 0;
    const currentTier = this.seasonTier();
    const isPremium = this.isSeasonPassPremium();

    for (const t of this.battlePassTiers()) {
      if (t.tier <= currentTier) {
        if (!t.isFreeClaimed) {
          this.claimBattlePassReward(t.tier, 'free');
          claimedCount++;
        }
        if (isPremium && !t.isPremiumClaimed) {
          this.claimBattlePassReward(t.tier, 'premium');
          claimedCount++;
        }
      }
    }
    if (claimedCount > 0) {
      this.toast.showReward('Récompenses de Saison Collectées !', `${claimedCount} récompenses saisonnières récupérées d'un coup !`, { badge: 'PASSE SAISON', rarity: 'legendary', icon: 'workspace_premium' });
    }
    return claimedCount;
  }

  // -------------------------------------------------------------
  // GUILD RANK HIERARCHY & PERMISSIONS
  // -------------------------------------------------------------
  readonly playerGuildRank = computed<GuildRank>(() => {
    const me = this.guild().members.find(m => m.username === this.username());
    return (me?.rank as GuildRank) || 'Chef';
  });

  getRankLevel(rank: GuildRank): number {
    switch (rank) {
      case 'Chef': return 4;
      case 'Maître': return 3;
      case 'Chevalier': return 2;
      case 'Recrue': return 1;
      default: return 1;
    }
  }

  hasGuildPermission(minRank: GuildRank, userRank?: GuildRank): boolean {
    const activeRank = userRank || this.playerGuildRank();
    return this.getRankLevel(activeRank) >= this.getRankLevel(minRank);
  }

  setPlayerGuildRank(newRank: GuildRank) {
    this.guild.update(g => ({
      ...g,
      members: g.members.map(m => m.username === this.username() ? { ...m, role: newRank, rank: newRank } : m)
    }));
    this.toast.showReward(
      'Rang de Guilde Mis à Jour',
      `Votre rang actif est désormais : ${newRank}.`,
      { badge: 'RANG GUILDE', rarity: newRank === 'Chef' ? 'legendary' : 'epic', icon: 'military_tech' }
    );
    this.sound.playVictory();
    this.triggerAutoSave();
  }

  promoteGuildMember(memberId: string): boolean {
    const myRank = this.playerGuildRank();
    if (!this.hasGuildPermission('Maître', myRank)) {
      this.toast.showSystem('Permission Refusée', 'Seuls les Maîtres et le Chef peuvent promouvoir des membres.');
      return false;
    }

    const member = this.guild().members.find(m => m.id === memberId);
    if (!member) return false;
    if (member.username === this.username()) {
      this.toast.showSystem('Action Impossible', 'Vous ne pouvez pas modifier votre propre rang ainsi.');
      return false;
    }

    let targetRank: GuildRank | null = null;
    if (member.rank === 'Recrue') {
      targetRank = 'Chevalier';
    } else if (member.rank === 'Chevalier') {
      if (myRank !== 'Chef') {
        this.toast.showSystem('Autorité Insuffisante', 'Seul le Chef de Guilde peut nommer un nouveau Maître.');
        return false;
      }
      targetRank = 'Maître';
    } else {
      this.toast.showSystem('Rang Maximum', `${member.username} a déjà atteint le rang de Maître.`);
      return false;
    }

    this.guild.update(g => ({
      ...g,
      members: g.members.map(m => m.id === memberId ? { ...m, role: targetRank!, rank: targetRank! } : m)
    }));

    this.toast.showReward(
      'Promotion Accordée !',
      `[${member.username}] est promu au rang de ${targetRank} !`,
      { badge: 'PROMOTION', rarity: 'legendary', icon: 'military_tech' }
    );
    this.sound.playVictory();
    this.triggerAutoSave();
    return true;
  }

  demoteGuildMember(memberId: string): boolean {
    const myRank = this.playerGuildRank();
    if (!this.hasGuildPermission('Maître', myRank)) {
      this.toast.showSystem('Permission Refusée', 'Seuls les Maîtres et le Chef peuvent rétrograder des membres.');
      return false;
    }

    const member = this.guild().members.find(m => m.id === memberId);
    if (!member) return false;
    if (member.username === this.username()) return false;
    if (member.rank === 'Chef') {
      this.toast.showSystem('Action Impossible', 'Le Chef de Guilde ne peut être rétrogradé.');
      return false;
    }
    if (member.rank === 'Maître' && myRank !== 'Chef') {
      this.toast.showSystem('Autorité Insuffisante', 'Seul le Chef peut rétrograder un Maître.');
      return false;
    }

    let targetRank: GuildRank | null = null;
    if (member.rank === 'Maître') {
      targetRank = 'Chevalier';
    } else if (member.rank === 'Chevalier') {
      targetRank = 'Recrue';
    } else {
      this.toast.showSystem('Rang Minimum', `${member.username} est déjà au rang de Recrue.`);
      return false;
    }

    this.guild.update(g => ({
      ...g,
      members: g.members.map(m => m.id === memberId ? { ...m, role: targetRank!, rank: targetRank! } : m)
    }));

    this.toast.showSystem('Rétrogradation Appliquée', `[${member.username}] est désormais rétrogradé au rang de ${targetRank}.`);
    this.sound.playClick();
    this.triggerAutoSave();
    return true;
  }

  kickGuildMember(memberId: string): boolean {
    const myRank = this.playerGuildRank();
    if (!this.hasGuildPermission('Maître', myRank)) {
      this.toast.showSystem('Permission Refusée', 'Vous n\'avez pas la permission d\'exclure des membres.');
      return false;
    }

    const member = this.guild().members.find(m => m.id === memberId);
    if (!member) return false;
    if (member.username === this.username()) return false;
    if (member.rank === 'Chef') return false;
    if (member.rank === 'Maître' && myRank !== 'Chef') {
      this.toast.showSystem('Autorité Insuffisante', 'Seul le Chef peut exclure un Maître.');
      return false;
    }

    this.guild.update(g => ({
      ...g,
      members: g.members.filter(m => m.id !== memberId)
    }));

    this.toast.showSystem('Membre Exclu', `[${member.username}] a été banni de la guilde.`);
    this.sound.playClick();
    this.triggerAutoSave();
    return true;
  }

  inviteGuildMember(username: string): boolean {
    const myRank = this.playerGuildRank();
    if (!this.hasGuildPermission('Chevalier', myRank)) {
      this.toast.showSystem('Permission Refusée', 'Il faut être au moins Chevalier pour inviter de nouveaux membres.');
      return false;
    }

    const cleanName = username.trim();
    if (!cleanName) return false;

    const currentMembers = this.guild().members;
    if (currentMembers.some(m => m.username.toLowerCase() === cleanName.toLowerCase())) {
      this.toast.showSystem('Déjà Membre', `${cleanName} fait déjà partie de la guilde.`);
      return false;
    }

    if (currentMembers.length >= this.guild().maxMembers) {
      this.toast.showSystem('Guilde Complète', 'La guilde a atteint sa capacité maximale de membres.');
      return false;
    }

    const newMember: GuildMember = {
      id: 'm_' + Date.now(),
      username: cleanName,
      role: 'Recrue',
      rank: 'Recrue',
      elo: 1000 + Math.floor(Math.random() * 300),
      donatedGold: 0,
      avatarIcon: 'person',
      lastActive: 'À l\'instant',
      joinedAt: 'Aujourd\'hui'
    };

    this.guild.update(g => ({
      ...g,
      members: [...g.members, newMember]
    }));

    this.toast.showReward(
      'Nouvelle Recrue Enrôlée !',
      `[${cleanName}] a prêté serment et rejoint les rangs en tant que Recrue !`,
      { badge: 'RECRUTEMENT', rarity: 'rare', icon: 'person_add' }
    );
    this.sound.playVictory();
    this.triggerAutoSave();
    return true;
  }

  updateGuildMotd(newMotd: string): boolean {
    const myRank = this.playerGuildRank();
    if (!this.hasGuildPermission('Maître', myRank)) {
      this.toast.showSystem('Permission Refusée', 'Seuls les Maîtres et le Chef peuvent proclamer un nouvel Édit de guilde.');
      return false;
    }

    this.guild.update(g => ({ ...g, motd: newMotd.trim() }));
    this.toast.showReward(
      'Édit de Guilde Proclamé !',
      'Le Message du Jour a été mis à jour dans toute la confrérie.',
      { badge: 'ÉDIT DE GUILDE', rarity: 'legendary', icon: 'edit_note' }
    );
    this.sound.playVictory();
    this.triggerAutoSave();
    return true;
  }

  // ==========================================
  // BESTIARY MANAGEMENT METHODS
  // ==========================================

  private loadInitialBestiary(): BestiaryEntry[] {
    if (typeof localStorage === 'undefined') return INITIAL_BESTIARY_DATABASE;
    try {
      const saved = localStorage.getItem('aetheria_bestiary_entries');
      if (saved) {
        const parsed: BestiaryEntry[] = JSON.parse(saved);
        return INITIAL_BESTIARY_DATABASE.map(initEntry => {
          const found = parsed.find(p => p.id === initEntry.id);
          return found
            ? { ...initEntry, ...found, imageUrl: initEntry.imageUrl, stats: found.stats || initEntry.stats }
            : initEntry;
        });
      }
    } catch {
      // ignore parsing errors
    }
    return INITIAL_BESTIARY_DATABASE;
  }

  saveBestiaryEntries(entries: BestiaryEntry[]) {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('aetheria_bestiary_entries', JSON.stringify(entries));
      } catch {
        // ignore storage errors
      }
    }
  }

  recordMonsterEncounter(monsterIdentifier: string) {
    if (!monsterIdentifier) return;
    const cleanId = monsterIdentifier.toLowerCase().trim();

    this.bestiaryEntries.update(entries => {
      let isChanged = false;
      const updated = entries.map(entry => {
        const matchesId = entry.id.toLowerCase() === cleanId;
        const matchesName = cleanId.includes(entry.name.toLowerCase()) || entry.name.toLowerCase().includes(cleanId);
        const matchesKey = cleanId.includes(entry.id.replace('mon_', '').toLowerCase());

        if (matchesId || matchesName || matchesKey) {
          isChanged = true;
          const newEncounters = entry.encountersCount + 1;
          let newStatus = entry.discoveryStatus;

          if (entry.discoveryStatus === 'undiscovered') {
            newStatus = 'spotted';
            this.toast.showReward(
              'Nouvelle Créature Observée !',
              `Le [${entry.name}] (${entry.title}) a été consigné dans votre Bestiaire !`,
              { badge: 'BESTIAIRE', rarity: entry.threatRank === 'mythic' ? 'mythic' : 'rare', icon: 'visibility' }
            );
          } else if (entry.discoveryStatus === 'spotted' && newEncounters >= 2) {
            newStatus = 'studied';
            this.toast.showReward(
              'Analyse du Bestiaire Approfondie !',
              `Les faiblesses et résistances de [${entry.name}] ont été révélées !`,
              { badge: 'BESTIAIRE ÉTUDIÉ', rarity: 'epic', icon: 'auto_stories' }
            );
          }

          return {
            ...entry,
            encountersCount: newEncounters,
            discoveryStatus: newStatus,
          };
        }
        return entry;
      });

      if (isChanged) {
        this.saveBestiaryEntries(updated);
      }
      return updated;
    });
  }

  recordMonsterDefeat(monsterIdentifier: string) {
    if (!monsterIdentifier) return;
    const cleanId = monsterIdentifier.toLowerCase().trim();

    this.bestiaryEntries.update(entries => {
      let isChanged = false;
      const updated = entries.map(entry => {
        const matchesId = entry.id.toLowerCase() === cleanId;
        const matchesName = cleanId.includes(entry.name.toLowerCase()) || entry.name.toLowerCase().includes(cleanId);
        const matchesKey = cleanId.includes(entry.id.replace('mon_', '').toLowerCase());

        if (matchesId || matchesName || matchesKey) {
          isChanged = true;
          const newDefeats = entry.defeatsCount + 1;
          const newEncounters = Math.max(entry.encountersCount, newDefeats);
          const shouldMaster = newDefeats >= entry.masteryThreshold;
          const wasAlreadyMastered = entry.isMastered;

          let newStatus = entry.discoveryStatus;
          if (shouldMaster) {
            newStatus = 'mastered';
          } else if (newStatus === 'undiscovered' || newStatus === 'spotted') {
            newStatus = 'studied';
          }

          if (shouldMaster && !wasAlreadyMastered) {
            this.toast.showReward(
              'Créature Maîtrisée au Bestiaire !',
              `Félicitations ! Vous maîtrisez parfaitement [${entry.name}] ! Bonus débloqué : ${entry.masteryPerk}`,
              { badge: 'MAÎTRISE DU BESTIAIRE', rarity: 'mythic', icon: 'military_tech' }
            );
            this.sound.playVictory();
          }

          return {
            ...entry,
            encountersCount: newEncounters,
            defeatsCount: newDefeats,
            discoveryStatus: newStatus,
            isMastered: entry.isMastered || shouldMaster,
          };
        }
        return entry;
      });

      if (isChanged) {
        this.saveBestiaryEntries(updated);
      }
      return updated;
    });
  }

  researchMonsterInScriptorium(monsterId: string): boolean {
    const entry = this.bestiaryEntries().find(e => e.id === monsterId);
    if (!entry) return false;

    if (entry.isMastered) {
      this.toast.showSystem('Déjà Maîtrisé', `Vous possédez déjà la maîtrise suprême sur [${entry.name}].`, 'military_tech');
      return false;
    }

    const goldCost = 350;
    const shardCost = 15;

    if (this.gold() < goldCost || this.shards() < shardCost) {
      this.toast.showSystem(
        'Ressources Insuffisantes',
        `L’étude approfondie au Scriptorium requiert ${goldCost} Or et ${shardCost} Éclats (vous possédez ${this.gold()} Or / ${this.shards()} Éclats).`,
        'school'
      );
      return false;
    }

    this.gold.update(g => g - goldCost);
    this.shards.update(s => s - shardCost);

    this.bestiaryEntries.update(entries => {
      const updated = entries.map(e => {
        if (e.id === monsterId) {
          const newDefeats = e.defeatsCount + 1;
          const shouldMaster = newDefeats >= e.masteryThreshold;
          return {
            ...e,
            defeatsCount: newDefeats,
            encountersCount: Math.max(e.encountersCount, newDefeats),
            discoveryStatus: shouldMaster ? ('mastered' as DiscoveryStatus) : ('studied' as DiscoveryStatus),
            isMastered: e.isMastered || shouldMaster,
          };
        }
        return e;
      });
      this.saveBestiaryEntries(updated);
      return updated;
    });

    this.toast.showReward(
      'Étude au Scriptorium Achevée !',
      `Les parchemins anciens révèlent les secrets tactiques de [${entry.name}] (+1 Savoir de Combat).`,
      { badge: 'SCRIPTOMANCIE', rarity: 'epic', icon: 'auto_stories' }
    );
    this.sound.playCardSummon('epic');
    this.triggerAutoSave();
    return true;
  }

  unlockMonsterLore(monsterId: string): boolean {
    const entry = this.bestiaryEntries().find(e => e.id === monsterId);
    if (!entry || entry.discoveryStatus !== 'undiscovered') return false;

    const goldCost = 150;
    if (this.gold() < goldCost) {
      this.toast.showSystem('Or Insuffisant', `L’achat de rumeurs d’éclaireur requiert ${goldCost} Or.`);
      return false;
    }

    this.gold.update(g => g - goldCost);
    this.bestiaryEntries.update(entries => {
      const updated = entries.map(e => (e.id === monsterId ? { ...e, discoveryStatus: 'spotted' as DiscoveryStatus, encountersCount: 1 } : e));
      this.saveBestiaryEntries(updated);
      return updated;
    });

    this.toast.showReward(
      'Rumeur d’Éclaireur Acquise !',
      `Un pisteur de la Citadelle vous a révélé l’existence de [${entry.name}] (${entry.habitat}) !`,
      { badge: 'ÉCLAIREUR', rarity: 'rare', icon: 'visibility' }
    );
    this.sound.playClick('gold');
    this.triggerAutoSave();
    return true;
  }

  // ==========================================
  // ACHIEVEMENTS PERSISTENCE & CLAIMING
  // ==========================================

  private loadInitialClaimedAchievements(): string[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      const saved = localStorage.getItem('aetheria_claimed_achievements');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore parsing errors
    }
    return [];
  }

  private loadInitialNotifiedAchievements(): string[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      const saved = localStorage.getItem('aetheria_notified_achievements');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore parsing errors
    }
    return [];
  }

  private saveClaimedAchievements(ids: string[]) {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('aetheria_claimed_achievements', JSON.stringify(ids));
      } catch {
        // ignore storage errors
      }
    }
  }

  private saveNotifiedAchievements() {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(
          'aetheria_notified_achievements',
          JSON.stringify(Array.from(this.notifiedAchievementIds))
        );
      } catch {
        // ignore storage errors
      }
    }
  }

  claimAchievementReward(achievementId: string, silent = false): boolean {
    const ach = this.achievements().find(a => a.id === achievementId);
    if (!ach || !ach.canClaim) return false;

    const r = ach.reward;
    if (r.gold) this.gold.update(g => g + r.gold!);
    if (r.gems) this.gems.update(g => g + r.gems!);
    if (r.shards) this.shards.update(s => s + r.shards!);
    if (r.title && !this.titles().includes(r.title)) {
      this.titles.update(t => [...t, r.title!]);
    }

    this.claimedAchievementIds.update(ids => {
      const next = [...ids, achievementId];
      this.saveClaimedAchievements(next);
      return next;
    });

    if (!silent) {
      const parts: string[] = [];
      if (r.gold) parts.push(`+${r.gold} Or`);
      if (r.gems) parts.push(`+${r.gems} Gemmes`);
      if (r.shards) parts.push(`+${r.shards} Éclats`);
      if (r.title) parts.push(`Titre "${r.title}"`);

      this.toast.showReward(
        `Succès Réclamé : ${ach.title}`,
        `Récompenses obtenues : ${parts.join(' · ')}.`,
        {
          badge: `+${ach.points} PTS`,
          rarity: ach.tier === 'mythic' ? 'mythic' : ach.tier === 'gold' ? 'legendary' : 'epic',
          icon: ach.icon,
        }
      );
      this.sound.playVictory();
    }

    this.triggerAutoSave();
    return true;
  }

  claimAllAchievementRewards(): number {
    const claimable = this.achievements().filter(a => a.canClaim);
    if (claimable.length === 0) return 0;

    let totalGold = 0;
    let totalGems = 0;
    let totalShards = 0;
    let titlesUnlocked = 0;

    for (const ach of claimable) {
      totalGold += ach.reward.gold || 0;
      totalGems += ach.reward.gems || 0;
      totalShards += ach.reward.shards || 0;
      if (ach.reward.title && !this.titles().includes(ach.reward.title)) {
        titlesUnlocked++;
      }
      this.claimAchievementReward(ach.id, true);
    }

    const summary: string[] = [];
    if (totalGold > 0) summary.push(`+${totalGold} Or`);
    if (totalGems > 0) summary.push(`+${totalGems} Gemmes`);
    if (totalShards > 0) summary.push(`+${totalShards} Éclats`);
    if (titlesUnlocked > 0) summary.push(`${titlesUnlocked} Titre(s)`);

    this.toast.showReward(
      `${claimable.length} Succès Réclamés !`,
      `Butin total collecté : ${summary.join(' · ')}.`,
      { badge: 'HAUTS FAITS', rarity: 'mythic', icon: 'emoji_events' }
    );
    this.sound.playVictory();
    return claimable.length;
  }
}


