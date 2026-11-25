export type CardType = 'creature' | 'spell' | 'relic' | 'secret';
export type CardElement = 'fire' | 'ice' | 'shadow' | 'light' | 'arcane' | 'nature';
export type CardRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

export type RelicType = 'xp_booster' | 'gold_magnet' | 'arcane_catalyst' | 'stellar_prism' | 'phoenix_heart' | 'chronos_hourglass';

export interface RelicAffix {
  type: 'bonus_xp_pct' | 'bonus_gold_pct' | 'bonus_season_xp_pct' | 'bonus_shards_pct' | 'bonus_first_turn_mana' | 'bonus_starting_armor';
  label: string;
  value: number; // e.g. +15 for 15%
}

export interface RelicEnchantment {
  level: number; // 0 (none) to 5
  gemCostNext: number;
  bonusXpMultiplier: number; // additional % e.g. +5% per enchant level
  glowColor: string;
  namePrefix: string;
}

export interface PlayerRelic {
  id: string;
  baseId: string;
  name: string;
  type: RelicType;
  rarity: CardRarity;
  tier: number; // 1 to 5 (Fusion level)
  enchantLevel: number; // 0 to 5 (Enchant with Gems)
  element: CardElement;
  icon: string;
  imageUrl?: string;
  description: string;
  lore: string;
  baseXpBonusPct: number; // Base XP boost per match (e.g., +10%, +25%, +50%, +100%, +200%)
  totalXpBonusPct: number; // Computed total boost with tier + enchantment
  affixes: RelicAffix[];
  isEquipped: boolean;
  equippedSlot?: number; // 1, 2, or 3
  duplicateCount: number; // for fusion
  fusionRequired: number; // number of same tier duplicates needed to fuse to next tier
}

export interface CompanionPet {
  id: string;
  name: string;
  species: string;
  rarity: CardRarity;
  element: CardElement;
  level: number; // 1 to 10
  baseMultiplier: number; // Base damage multiplier (Common: 1.15, Rare: 1.30, Epic: 1.50, Legendary: 1.80, Mythic: 2.25)
  levelBonusPerLevel: number; // Bonus damage multiplier per level
  totalMultiplier: number; // Final damage multiplier (e.g. 1.50 = +50% damage to all spells, minions, ultimates)
  icon: string;
  avatarIcon: string;
  imageUrl?: string;
  color: string;
  badgeBg: string;
  description: string;
  lore: string;
  specialSkillName: string;
  specialSkillDesc: string;
  isUnlocked: boolean;
  isEquipped: boolean;
  affinity: number;
  affinityRequired: number;
  goldUpgradeCost: number;
  gemUpgradeCost: number;
  unlockCostGold?: number;
  unlockCostGems?: number;
}
export type HeroClass =
  | 'paladin'
  | 'mage'
  | 'rogue'
  | 'druid'
  | 'necromancer'
  | 'berserker'
  | 'warlock'
  | 'shaman'
  | 'hunter'
  | 'priest'
  | 'chronomancer'
  | 'runemaster'
  | 'valkyrie'
  | 'bard'
  | 'shadowblade'
  | 'dragonknight'
  | 'alchemist'
  | 'witchdoctor'
  | 'voidwalker'
  | 'geomancer';

export interface SoundSettings {
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  uiVolume?: number;
  ambientVolume?: number;
  muted?: boolean;
  isMuted?: boolean;
}

export interface Card {
  id: string;
  name: string;
  cost: number;
  type: CardType;
  element: CardElement;
  rarity: CardRarity;
  attack?: number;
  health?: number;
  maxHealth?: number;
  description: string;
  flavorText: string;
  icon: string;
  imageUrl?: string;
  level: number; // 1 to 5
  stars: number; // 1 to 3
  shards: number;
  shardsRequired: number;
  foil: boolean;
  taunt?: boolean;
  divineShield?: boolean;
  lifesteal?: boolean;
  battlecryDesc?: string;
  comboDesc?: string;
  spellDamage?: number;
  healValue?: number;
  summonMinionId?: string;
}

export interface Deck {
  id: string;
  name: string;
  heroClass: HeroClass;
  cardIds: string[];
  wins: number;
  losses: number;
  isFavorite?: boolean;
  cardBack: string;
}

export interface HeroSkin {
  id: string;
  name: string;
  rarity: CardRarity;
  avatarIcon: string;
  imageUrl?: string;
  badge: string;
  borderStyle: string;
  isUnlocked: boolean;
  gemPrice?: number;
  goldPrice?: number;
  description?: string;
  themeGradient?: string;
  accentHex?: string;
  portraitFilter?: string;
  visualEffectLabel?: string;
}

export type SkillBranch = 'branch_a' | 'branch_b';

export interface SkillNode {
  id: string;
  heroClass: HeroClass;
  branch: SkillBranch;
  branchName: string;
  tier: number;
  name: string;
  icon: string;
  description: string;
  cost: number;
  prereqId?: string;
  bonusType: 'hp' | 'mana' | 'crit' | 'spell_power' | 'armor' | 'draw' | 'ultimate_boost' | 'attack' | 'special_effect';
  bonusValue: number;
}

export interface Hero {
  id: HeroClass;
  name: string;
  title: string;
  class: HeroClass;
  archetype: string;
  themeColor: string;
  accentColor: string;
  baseHp: number;
  maxHp: number;
  baseArmor: number;
  armor: number;
  baseAttack: number;
  energyPerTurn: number;
  passiveName: string;
  passiveDesc: string;
  passiveIcon: string;
  ultimateName: string;
  ultimateCost: number; // Energy required
  ultimateDesc: string;
  ultimateIcon: string;
  avatarIcon: string;
  imageUrl?: string;
  skins: HeroSkin[];
  activeSkinId: string;
  level: number;
  xp: number;
  xpRequired: number;
  unlockedTalentIds: string[];
  isUnlocked: boolean;
  goldUnlockCost?: number;
  gemUnlockCost?: number;
  realMoneyCost?: string;
  playstyleOverview: string;
}

export type PotionType =
  | 'health'
  | 'mana'
  | 'fury'
  | 'crit'
  | 'stone_skin'
  | 'xp_boost'
  | 'phoenix_rebirth'
  | 'astral_surge'
  | 'void_venom'
  | 'midas_gold'
  | 'titan_blood';

export interface PotionRecipe {
  herb: number;
  crystal: number;
  essence: number;
  astralDew?: number;
  phoenixAsh?: number;
  voidSpore?: number;
}

export interface Potion {
  id: string;
  name: string;
  type: PotionType;
  rarity: CardRarity;
  icon: string;
  imageUrl?: string;
  color: string;
  description: string;
  effectLabel: string;
  durationMatches: number;
  count: number;
  goldCost: number;
  recipe?: PotionRecipe;
  masteryLevel?: number;
  isSecretDiscovered?: boolean;
}

export interface ActivePotionBuff {
  potionId: string;
  name: string;
  icon: string;
  color: string;
  type: PotionType;
  remainingMatches: number;
  effectDesc: string;
}

export interface ElixirStatBonuses {
  bonusHp: number;
  bonusArmor: number;
  bonusStartingMana: number;
  bonusMinionAttack: number;
  bonusSpellDamage: number;
  bonusSpellCritPct: number;
  bonusStartingEnergy: number;
  piercingTurnDamage: number;
  bonusXpPct: number;
  bonusGoldPct: number;
  hasPhoenixRebirth: boolean;
}

export interface ElixirStatBadge {
  id: string;
  label: string;
  value: string;
  icon: string;
  color: string;
  remainingMatches: number;
}

export interface BattleMinion {
  instanceId: string;
  cardId: string;
  name: string;
  cost: number;
  element: CardElement;
  rarity: CardRarity;
  attack: number;
  currentHealth: number;
  maxHealth: number;
  taunt: boolean;
  divineShield: boolean;
  lifesteal: boolean;
  canAttack: boolean;
  hasAttacked: boolean;
  icon: string;
  imageUrl?: string;
  isBuffed?: boolean;
}

export interface CombatLogEntry {
  id: string;
  timestamp: string;
  text: string;
  type: 'player' | 'opponent' | 'system' | 'damage' | 'heal' | 'death';
}

export interface FloatingDamage {
  id: string;
  target: 'player-hero' | 'opponent-hero' | string; // minion instanceId
  value: number | string;
  type: 'damage' | 'heal' | 'armor' | 'crit' | 'buff';
}

export type GameModeType = 'story' | 'duel';
export type DuelSubType = 'quick' | 'ranked' | 'custom';

export interface StoryDialogue {
  speaker: string;
  avatarIcon: string;
  side: 'left' | 'right';
  text: string;
}

export interface StoryObjective {
  id: string;
  text: string;
  isCompleted: boolean;
}

export interface StoryMission {
  id: string;
  chapterId: string;
  order: number;
  title: string;
  subtitle: string;
  location: string;
  enemyName: string;
  enemyTitle: string;
  enemyClass: HeroClass;
  enemyAvatar: string;
  enemyHp: number;
  enemyArmor: number;
  bossPowerName?: string;
  bossPowerDesc?: string;
  storyIntro: StoryDialogue[];
  storyOutro: StoryDialogue[];
  starsEarned: number; // 0 to 3
  objectives: StoryObjective[];
  rewards: {
    gold: number;
    gems: number;
    shards: number;
    cardRewardId?: string;
    cardRewardName?: string;
    firstClearClaimed: boolean;
  };
  isUnlocked: boolean;
  isCompleted: boolean;
}

export interface StoryChapter {
  id: string;
  actNumber: number;
  title: string;
  subtitle: string;
  description: string;
  bannerIcon: string;
  color: string;
  isUnlocked: boolean;
  missions: StoryMission[];
}

export interface CustomDuelConfig {
  botName: string;
  botClass: HeroClass;
  botTitle: string;
  botHp: number;
  botArmor: number;
  difficulty: 'easy' | 'normal' | 'hard' | 'nightmare';
  weather: string;
  turnTime: number; // in seconds
  startMana: number;
}

export interface BattleState {
  matchId: string;
  mode: 'ranked' | 'casual' | 'ai_training' | 'story' | 'custom';
  storyMissionId?: string;
  storyMissionTitle?: string;
  turn: number;
  currentTurn: 'player' | 'opponent';
  playerHero: {
    hero: Hero;
    name?: string;
    title?: string;
    avatarIcon?: string;
    hp: number;
    maxHp: number;
    armor: number;
    energy: number; // 0 to 5
    maxEnergy: number;
    mana?: number;
    maxMana?: number;
  };
  opponentHero: {
    hero?: Hero;
    name: string;
    title: string;
    avatarIcon: string;
    imageUrl?: string;
    hp: number;
    maxHp: number;
    armor: number;
    energy: number;
    maxEnergy: number;
    mana?: number;
    maxMana?: number;
    isBot?: boolean;
    botDifficulty?: 'easy' | 'normal' | 'hard' | 'nightmare';
    elo?: number;
    heroClass?: HeroClass;
  };
  playerHand: Card[];
  opponentHandCount: number;
  opponentDeckCount?: number;
  playerBoard: BattleMinion[];
  opponentBoard: BattleMinion[];
  playerDeck: Card[];
  playerGraveyard?: Card[];
  opponentGraveyard?: Card[];
  graveyard?: Card[];
  playerMana: number;
  maxPlayerMana: number;
  opponentMana: number;
  maxOpponentMana: number;
  comboCount: number;
  isResolvingTurn: boolean;
  turnTimeLeft: number;
  turnTimeRemaining?: number;
  combatLogs: CombatLogEntry[];
  weather?: 'clear' | 'blizzard' | 'eclipse' | 'sandstorm' | 'aurora' | 'tempest' | 'blood_moon';
  weatherEffect?: {
    name: string;
    icon: string;
    description: string;
  };
  isGameOver?: boolean;
  winner: 'player' | 'opponent' | null;
  appliedElixirBuffs?: ActivePotionBuff[];
  appliedElixirBonuses?: ElixirStatBonuses;
  matchRewards?: {
    gold: number;
    xp: number;
    shards: number;
    eloDelta: number;
    cardsUnlocked?: Card[];
  };
}

export interface BattlePassTier {
  tier: number;
  xpRequired: number;
  freeReward: {
    type: 'gold' | 'gems' | 'shards' | 'pack' | 'card' | 'potion';
    amount: number;
    name: string;
    icon: string;
    rarity?: CardRarity;
    itemId?: string;
  };
  premiumReward: {
    type: 'gold' | 'gems' | 'shards' | 'skin' | 'card_back' | 'title' | 'avatar_frame' | 'mythic_card' | 'exclusive_title';
    amount: number;
    name: string;
    icon: string;
    rarity?: CardRarity;
    itemId?: string;
  };
  isFreeClaimed: boolean;
  isPremiumClaimed: boolean;
}

export interface DailyQuest {
  id: string;
  title: string;
  description: string;
  icon: string;
  progress?: number;
  current: number;
  target: number;
  goldReward?: number;
  rewardGold: number;
  xpReward?: number;
  rewardXp: number;
  isCompleted: boolean;
  isClaimed: boolean;
}

export interface LeaderboardPlayer {
  rank: number;
  username: string;
  title: string;
  elo: number;
  tier?: 'Bronze' | 'Argent' | 'Or' | 'Platine' | 'Diamant' | 'Maître' | 'Grand Maître' | 'Légende';
  tierName?: string;
  avatarId?: string;
  avatarIcon?: string;
  frameId?: string;
  frameColor?: string;
  winRate?: number;
  wins?: number;
  losses?: number;
  totalMatches?: number;
  favoriteHero?: HeroClass;
  favoriteClass?: HeroClass;
  guildTag?: string;
  isOnline?: boolean;
}

export type GuildRank = 'Chef' | 'Maître' | 'Chevalier' | 'Recrue';

export interface GuildPermission {
  id: string;
  name: string;
  description: string;
  category: 'social' | 'recruitment' | 'management' | 'sovereign';
  minRank: GuildRank;
  icon: string;
}

export interface GuildRankDetails {
  rank: GuildRank;
  level: number;
  label: string;
  title: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  maxHolders?: number;
  permissions: string[];
}

export interface GuildMember {
  id: string;
  username: string;
  role: GuildRank | string;
  rank: GuildRank;
  elo: number;
  contributionPoints?: number;
  donatedGold?: number;
  avatarId?: string;
  avatarIcon?: string;
  lastActive?: string;
  isOnline?: boolean;
  joinedAt?: string;
}

export interface Guild {
  id: string;
  name: string;
  tag: string;
  level: number;
  xp?: number;
  xpRequired?: number;
  bannerIcon?: string;
  emblem?: string;
  bannerColor?: string;
  description: string;
  motd?: string;
  members: GuildMember[];
  maxMembers: number;
  weeklyChestTier?: number;
  weeklyTrophies?: number;
  treasury: number;
  weeklyGoal: number;
  perks?: string[];
}

export interface ChatMessage {
  id: string;
  senderId?: string;
  sender?: string;
  senderName?: string;
  senderAvatar?: string;
  avatarIcon?: string;
  senderRole?: string;
  senderTag?: string;
  badge?: string;
  channel: 'world' | 'guild' | 'whisper' | 'global' | 'battle';
  content?: string;
  text?: string;
  timestamp: string;
  cardPreviewId?: string;
}

export interface TradeOffer {
  id: string;
  creatorId?: string;
  creatorName?: string;
  sellerId?: string;
  sellerName?: string;
  sellerAvatar?: string;
  sellerElo?: number;
  sellerTrustScore?: number;
  listedAgo?: string;
  isFeatured?: boolean;
  itemType?: 'card' | 'potion';
  offeredCardId?: string;
  offeredCardLevel?: number;
  requestedCardId?: string;
  requestedCardRarity?: CardRarity;
  cardData?: Card;
  potionData?: Potion;
  priceGold: number;
  priceGems: number;
  status?: 'active' | 'completed' | 'cancelled';
  expiresAt?: string;
}

export type TradeResourceKey =
  | 'herbs'
  | 'crystals'
  | 'essences'
  | 'astralDew'
  | 'phoenixAsh'
  | 'voidSpore';

export interface TradeResourceBundleItem {
  resourceKey: TradeResourceKey;
  label: string;
  rarity: CardRarity;
  quantity: number;
  imageUrl: string;
  unitValueGold: number;
}

export interface TradePotionBundleItem {
  potionId: string;
  quantity: number;
  potionData: Potion;
}

export interface TradeBundle {
  cards: Card[];
  potions: TradePotionBundleItem[];
  resources: TradeResourceBundleItem[];
  gold: number;
  gems: number;
}

export type FairTradeStatus = 'balanced' | 'caution' | 'scam_blocked';

export interface FairTradeAssessment {
  offeredValueGold: number;
  requestedValueGold: number;
  ratioPct: number;
  imbalancePct: number;
  status: FairTradeStatus;
  statusLabel: string;
  summary: string;
  warnings: string[];
  highValueFlags: string[];
  requiresDoubleConfirm: boolean;
}

export type DirectTradeStatus =
  | 'pending_review'
  | 'locked_scam'
  | 'completed'
  | 'cancelled'
  | 'reported';

export interface DirectTradeProposal {
  id: string;
  direction: 'incoming' | 'outgoing';
  partnerId: string;
  partnerName: string;
  partnerAvatar: string;
  partnerElo: number;
  partnerGuildTag?: string;
  partnerTrustScore: number;
  partnerCompletedTrades: number;
  playerOffers: TradeBundle;
  partnerOffers: TradeBundle;
  note?: string;
  revision: number;
  escrowHash: string;
  inspectionEndsAt: number;
  playerConfirmed: boolean;
  partnerConfirmed: boolean;
  highValueVerified: boolean;
  status: DirectTradeStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TradeAuditEntry {
  id: string;
  timestamp: string;
  type: 'p2p_trade' | 'market_buy' | 'market_sell' | 'scam_prevented' | 'escrow_cancelled';
  partnerName: string;
  summary: string;
  valueGold: number;
  escrowHash?: string;
  fairnessStatus: FairTradeStatus;
}

export interface PlayerStats {
  totalMatches: number;
  wins: number;
  losses: number;
  rankedMatches?: number;
  rankedWins?: number;
  highestElo?: number;
  favoriteElement?: CardElement;
  cardsCrafted?: number;
  packsOpened: number;
  potionsBrewed?: number;
  criticalHitsCount?: number;
  criticalHits?: number;
  legendariesOwned?: number;
  favoriteCardName?: string;
  totalDamageDealt: number;
  highestCombo?: number;
  storyMissionsCleared?: number;
  currentWinStreak: number;
  highestWinStreak: number;
  cardsPlayed: number;
  cardsUpgraded: number;
  potionsConsumed: number;
}

export interface AlchemyResources {
  herbs: number;
  crystals: number;
  essences: number;
  astralDew: number;
  phoenixAsh: number;
  voidSpore: number;
}

export interface TutorialStep {
  id: string;
  chapterIndex: number;
  stepIndex: number;
  title: string;
  topic: 'combat' | 'deckbuilding' | 'heroes' | 'alchemy' | 'meta';
  targetSelector?: string;
  bubblePosition?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  speakerName: string;
  speakerTitle: string;
  speakerAvatar: string;
  dialogue: string;
  practicalTip: string;
  actionRequired?: 'next' | 'click_card' | 'open_deckbuilder' | 'open_arena' | 'start_training';
  highlightActionLabel?: string;
  keyConcepts?: string[];
  illustratedBadge?: string;
}

export interface TutorialChapter {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  icon: string;
  category: 'combat' | 'deckbuilding' | 'progression';
  description: string;
  steps: TutorialStep[];
}

export type TacticalMissionDifficulty = 'Standard' | 'Vétéran' | 'Héroïque';
export type TacticalMissionCategory = 'tactics' | 'combat' | 'survival' | 'magic' | 'defense';

export interface DailyTacticalMission {
  id: string;
  slotIndex: number; // 0, 1, 2
  dayKey: string; // e.g. "2026-09-12"
  title: string;
  tacticalObjective: string;
  loreBriefing: string;
  tacticalTip: string;
  category: TacticalMissionCategory;
  difficulty: TacticalMissionDifficulty;
  icon: string;
  target: number;
  current: number;
  rewardGold: number;
  isCompleted: boolean;
  isClaimed: boolean;
  unitLabel: string;
}

export type MedievalUiTheme = 'stone_citadel' | 'illuminated_parchment' | 'royal_sanctuary';

export interface MedievalThemeOption {
  id: MedievalUiTheme;
  name: string;
  subtitle: string;
  badge: string;
  icon: string;
  previewBg: string;
  previewBorder: string;
  previewText: string;
  description: string;
}

// ==========================================
// BESTIARY DATA MODELS (Bestiarium Aetheriae)
// ==========================================

export type MonsterFamily =
  | 'undead'
  | 'beast'
  | 'demon'
  | 'dragon'
  | 'elemental'
  | 'aberration'
  | 'humanoid'
  | 'construct';

export type BestiaryWeaknessElement =
  | 'fire'
  | 'ice'
  | 'shadow'
  | 'light'
  | 'arcane'
  | 'nature'
  | 'physical';

export type ThreatRank = 'normal' | 'elite' | 'boss' | 'mythic';
export type DiscoveryStatus = 'undiscovered' | 'spotted' | 'studied' | 'mastered';

export interface BestiaryDrop {
  id: string;
  name: string;
  icon: string;
  rarity: CardRarity;
  dropChancePct: number;
  description: string;
}

export interface TacticalWeakness {
  element: BestiaryWeaknessElement;
  multiplier: string;
  tacticalAdvice: string;
}

export interface TacticalResistance {
  element: BestiaryWeaknessElement;
  reduction: string;
  tacticalAdvice: string;
}

export interface SignatureAbility {
  name: string;
  icon: string;
  type: 'passive' | 'active' | 'ultimate';
  description: string;
  counterStrategy: string;
}

export interface MonsterStats {
  strength: number; // Force (0 à 100)
  defense: number;  // Défense (0 à 100)
  magic: number;    // Magie (0 à 100)
  speed: number;    // Vitesse (0 à 100)
}

export interface BestiaryEntry {
  id: string;
  name: string;
  title: string;
  family: MonsterFamily;
  threatRank: ThreatRank;
  primaryElement: BestiaryWeaknessElement;
  secondaryElement?: BestiaryWeaknessElement;
  icon: string;
  habitat: string;
  dangerRating: number; // 1 to 5
  discoveryStatus: DiscoveryStatus;
  encountersCount: number;
  defeatsCount: number;
  loreExcerpt: string;
  archivistNotes: string;
  signatureAbilities: SignatureAbility[];
  weaknesses: TacticalWeakness[];
  resistances: TacticalResistance[];
  drops: BestiaryDrop[];
  masteryThreshold: number;
  masteryPerk: string;
  isMastered: boolean;
  imageUrl?: string;
  stats?: MonsterStats;
}

// ==========================================
// ACHIEVEMENTS & MILESTONE PROGRESSION MODELS
// ==========================================

export type AchievementCategory =
  | 'combat'
  | 'bestiary'
  | 'collection'
  | 'campaign'
  | 'alchemy';

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'mythic';

export interface AchievementReward {
  gold?: number;
  gems?: number;
  shards?: number;
  xp?: number;
  title?: string;
}

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  tier: AchievementTier;
  icon: string;
  target: number;
  unitLabel: string;
  points: number;
  reward: AchievementReward;
  targetView?: 'arena' | 'bestiary' | 'deckbuilder' | 'pets' | 'relics' | 'modes' | 'inventory' | 'shop';
  seriesGroup?: string;
  seriesOrder?: number;
}

export interface AchievementViewItem extends AchievementDefinition {
  current: number;
  progressPct: number;
  isUnlocked: boolean;
  isClaimed: boolean;
  canClaim: boolean;
}

// ==========================================
// EPIC QUESTS SYSTEM MODELS (QuestService)
// ==========================================

export type EpicQuestTrigger =
  | 'wins'
  | 'damage'
  | 'invocations'
  | 'spells'
  | 'slay_minions'
  | 'combo'
  | 'taunt_shield'
  | 'ultimate'
  | 'high_hp_win'
  | 'fast_win'
  | 'battlecry';

export type EpicQuestTier = 'Chevalier' | 'Champion' | 'Mythique';

export interface EpicQuestObjective {
  id: string;
  label: string;
  trigger: EpicQuestTrigger;
  current: number;
  target: number;
  unitLabel: string;
}

export interface EpicQuest {
  id: string;
  title: string;
  lore: string;
  chapter: string;
  tier: EpicQuestTier;
  icon: string;
  objectives: EpicQuestObjective[];
  rewardGold: number;
  isCompleted: boolean;
  isClaimed: boolean;
}

