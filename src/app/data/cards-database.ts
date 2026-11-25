import { Card, CardElement, CardRarity, CardType } from '../models/game.model';
import { FORGEABLE_GRIMOIRE_CARDS } from './forgeable-cards-data';

const CARD_ARTWORKS = {
  lightWarrior: '/src/assets/images/card_light_warrior_1794650132664.jpg',
  lightSpell: '/src/assets/images/card_light_spell_1794650132808.jpg',
  firePhoenix: '/src/assets/images/card_fire_phoenix_1794650132276.jpg',
  fireSpell: '/src/assets/images/card_fire_spell_1794650133811.jpg',
  iceGolem: '/src/assets/images/card_ice_golem_1794650134695.jpg',
  iceSpell: '/src/assets/images/card_ice_spell_1794650133853.jpg',
  shadowAssassin: '/src/assets/images/card_shadow_assassin_1794650134918.jpg',
  shadowSpell: '/src/assets/images/card_shadow_spell_1794650134715.jpg',
  natureTreant: '/src/assets/images/card_nature_treant_1794650135742.jpg',
  natureSpell: '/src/assets/images/card_nature_spell_1794650135816.jpg',
  arcaneConstruct: '/src/assets/images/card_arcane_construct_1794650137894.jpg',
  arcaneRelic: '/src/assets/images/card_arcane_relic_1794650137385.jpg',
  beastAutomaton: '/src/assets/images/icon_arcane_automaton_1792917169042.jpg',
  beastBloodKnight: '/src/assets/images/icon_blood_knight_1792917168867.jpg',
  beastCryptGhoul: '/src/assets/images/icon_crypt_ghoul_1792917164842.jpg',
  beastDireWolf: '/src/assets/images/icon_dire_wolf_1792917163200.jpg',
  beastEldritch: '/src/assets/images/icon_eldritch_horror_1792917170889.jpg',
  beastFrostWyrm: '/src/assets/images/icon_frost_wyrm_1792917166822.jpg',
  beastInfernalDrake: '/src/assets/images/icon_infernal_drake_1792917169178.jpg',
  beastLichLord: '/src/assets/images/icon_lich_lord_1792917170436.jpg',
  beastPyreImp: '/src/assets/images/icon_pyre_imp_1792917165257.jpg',
  beastStoneGolem: '/src/assets/images/icon_stone_golem_1792917168643.jpg',
  beastVenomHydra: '/src/assets/images/icon_venom_hydra_1792917171781.jpg',
  beastVoidWatcher: '/src/assets/images/icon_void_watcher_1792917167101.jpg',
} as const;

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash) + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function resolveCardImageUrl(
  card: Pick<Card, 'id' | 'name' | 'type' | 'element' | 'imageUrl'>
): string {
  if (card.imageUrl) {
    return card.imageUrl;
  }

  const name = card.name.toLowerCase();

  if (card.type === 'creature') {
    if (name.includes('phénix') || name.includes('phoenix')) return CARD_ARTWORKS.firePhoenix;
    if (name.includes('wyrm') || (name.includes('dragon') && card.element === 'ice')) return CARD_ARTWORKS.beastFrostWyrm;
    if (name.includes('dragon') || name.includes('drake') || name.includes('drakon')) return CARD_ARTWORKS.beastInfernalDrake;
    if (name.includes('golem') || name.includes('colosse') || name.includes('titan')) {
      if (card.element === 'ice') return CARD_ARTWORKS.iceGolem;
      if (card.element === 'arcane') return CARD_ARTWORKS.arcaneConstruct;
      return CARD_ARTWORKS.beastStoneGolem;
    }
    if (name.includes('automate') || name.includes('construct') || name.includes('sentinelle arcan')) {
      return CARD_ARTWORKS.beastAutomaton;
    }
    if (name.includes('liche') || name.includes('nécro') || name.includes('squelette') || name.includes('outre-tombe')) {
      return CARD_ARTWORKS.beastLichLord;
    }
    if (name.includes('goule') || name.includes('crypte') || name.includes('spectre')) {
      return CARD_ARTWORKS.beastCryptGhoul;
    }
    if (name.includes('sang') || name.includes('chevalier noir') || name.includes('garde noir')) {
      return CARD_ARTWORKS.beastBloodKnight;
    }
    if (name.includes('démon') || name.includes('diablotin') || name.includes('pyro')) {
      return CARD_ARTWORKS.beastPyreImp;
    }
    if (name.includes('loup') || name.includes('bête') || name.includes('chasseur') || name.includes('rôdeur')) {
      return CARD_ARTWORKS.beastDireWolf;
    }
    if (name.includes('hydre') || name.includes('basilic') || name.includes('léviathan') || name.includes('chimère')) {
      return CARD_ARTWORKS.beastVenomHydra;
    }
    if (name.includes('abîme') || name.includes('horreur') || name.includes('vide')) {
      return CARD_ARTWORKS.beastEldritch;
    }
    if (name.includes('oracle') || name.includes('observateur') || name.includes('astral')) {
      return CARD_ARTWORKS.beastVoidWatcher;
    }
    if (name.includes('tréant') || name.includes('yggdrasil') || name.includes('ancien')) {
      return CARD_ARTWORKS.natureTreant;
    }
    if (name.includes('assassin') || name.includes('infiltrateur') || name.includes('ombre')) {
      return CARD_ARTWORKS.shadowAssassin;
    }
    if (name.includes('archange') || name.includes('séraphin') || name.includes('croisé') || name.includes('paladin') || name.includes('écuyer') || name.includes('templier') || name.includes('valkyrie')) {
      return CARD_ARTWORKS.lightWarrior;
    }
  }

  const h = hashString(card.id + '_' + card.name);

  if (card.type === 'creature') {
    const creaturePools: Record<CardElement, string[]> = {
      light: [CARD_ARTWORKS.lightWarrior, CARD_ARTWORKS.beastAutomaton],
      fire: [CARD_ARTWORKS.firePhoenix, CARD_ARTWORKS.beastInfernalDrake, CARD_ARTWORKS.beastPyreImp],
      ice: [CARD_ARTWORKS.iceGolem, CARD_ARTWORKS.beastFrostWyrm],
      shadow: [CARD_ARTWORKS.shadowAssassin, CARD_ARTWORKS.beastCryptGhoul, CARD_ARTWORKS.beastLichLord, CARD_ARTWORKS.beastBloodKnight, CARD_ARTWORKS.beastEldritch],
      nature: [CARD_ARTWORKS.natureTreant, CARD_ARTWORKS.beastDireWolf, CARD_ARTWORKS.beastVenomHydra, CARD_ARTWORKS.beastStoneGolem],
      arcane: [CARD_ARTWORKS.arcaneConstruct, CARD_ARTWORKS.beastAutomaton, CARD_ARTWORKS.beastVoidWatcher],
    };
    const pool = creaturePools[card.element] ?? [CARD_ARTWORKS.lightWarrior];
    return pool[h % pool.length];
  }

  const spellByElement: Record<CardElement, string[]> = {
    light: [CARD_ARTWORKS.lightSpell],
    fire: [CARD_ARTWORKS.fireSpell],
    ice: [CARD_ARTWORKS.iceSpell],
    shadow: [CARD_ARTWORKS.shadowSpell],
    nature: [CARD_ARTWORKS.natureSpell],
    arcane: [CARD_ARTWORKS.arcaneRelic],
  };
  const spellPool = spellByElement[card.element] ?? [CARD_ARTWORKS.arcaneRelic];
  return spellPool[h % spellPool.length];
}

// Core iconic handcrafted cards
const CORE_CARDS: Card[] = [
  {
    id: 'c_pal_squire',
    name: "Écuyer de l'Aube",
    cost: 1,
    type: 'creature',
    element: 'light',
    rarity: 'common',
    attack: 2,
    health: 3,
    maxHealth: 3,
    description: 'Provocation. Un fidèle apprenti protecteur du royaume.',
    flavorText: "L'aube ne faiblit jamais devant la nuit.",
    icon: 'shield_person',
    level: 3,
    stars: 1,
    shards: 12,
    shardsRequired: 20,
    foil: false,
    taunt: true,
  },
  {
    id: 'c_pal_crusader',
    name: 'Croisé de Solaria',
    cost: 3,
    type: 'creature',
    element: 'light',
    rarity: 'rare',
    attack: 3,
    health: 4,
    maxHealth: 4,
    description: 'Bouclier Divin. Absorbe la première instance de dégâts.',
    flavorText: 'Son armure résonne des prières du Temple du Soleil.',
    icon: 'security',
    level: 2,
    stars: 2,
    shards: 8,
    shardsRequired: 30,
    foil: true,
    divineShield: true,
  },
  {
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
    level: 1,
    stars: 3,
    shards: 3,
    shardsRequired: 50,
    foil: true,
    lifesteal: true,
    battlecryDesc: 'Rend 5 PV au héros.',
    healValue: 5,
  },
  {
    id: 'c_pal_holy_strike',
    name: 'Frappe Sainte Radieuse',
    cost: 2,
    type: 'spell',
    element: 'light',
    rarity: 'common',
    description: 'Inflige 4 dégâts à un ennemi et confère +2 Armure au Héros.',
    flavorText: "Que la justice divine s'abatte sans compromis.",
    icon: 'highlight',
    level: 4,
    stars: 1,
    shards: 25,
    shardsRequired: 25,
    foil: false,
    spellDamage: 4,
  },
  {
    id: 'c_pal_bastion',
    name: 'Bastion Inébranlable',
    cost: 4,
    type: 'spell',
    element: 'light',
    rarity: 'epic',
    description: 'Confère Bouclier Divin et +2/+3 à toutes vos créatures en jeu.',
    flavorText: "Tant qu'un homme reste debout, la forteresse ne tombera point.",
    icon: 'fort',
    level: 2,
    stars: 2,
    shards: 14,
    shardsRequired: 35,
    foil: true,
  },
  {
    id: 'c_mag_apprentice',
    name: 'Apprenti Pyromancien',
    cost: 1,
    type: 'creature',
    element: 'fire',
    rarity: 'common',
    attack: 2,
    health: 1,
    maxHealth: 1,
    description: 'Cri de Guerre: Inflige 1 dégât à tous les serviteurs ennemis.',
    flavorText: 'Il joue avec les étincelles avant de savoir éteindre un feu.',
    icon: 'local_fire_department',
    level: 3,
    stars: 1,
    shards: 18,
    shardsRequired: 20,
    foil: false,
    battlecryDesc: '1 dégât à tous les ennemis',
    spellDamage: 1,
  },
  {
    id: 'c_mag_frost_golem',
    name: 'Golem de Givre Éternel',
    cost: 4,
    type: 'creature',
    element: 'ice',
    rarity: 'rare',
    attack: 3,
    health: 6,
    maxHealth: 6,
    description: 'Provocation. Réduit les dégâts subis de 1.',
    flavorText: "Sculpté dans les glaciers d'Astral Peak.",
    icon: 'ac_unit',
    level: 2,
    stars: 2,
    shards: 9,
    shardsRequired: 30,
    foil: false,
    taunt: true,
  },
  {
    id: 'c_mag_fireball',
    name: 'Boule de Feu Astrale',
    cost: 4,
    type: 'spell',
    element: 'fire',
    rarity: 'common',
    description: 'Inflige 6 dégâts directs à n’importe quelle cible.',
    flavorText: 'Une incantation basique mais dévastatrice.',
    icon: 'whatshot',
    level: 5,
    stars: 1,
    shards: 30,
    shardsRequired: 30,
    foil: true,
    spellDamage: 6,
  },
  {
    id: 'c_mag_phoenix',
    name: 'Phénix Solaire d’Aetheria',
    cost: 7,
    type: 'creature',
    element: 'fire',
    rarity: 'mythic',
    attack: 7,
    health: 5,
    maxHealth: 5,
    description: 'Râle d’Agonie: Renaît sous forme d’Œuf Ardent (0/3). S’il survit 1 tour, le Phénix renaît.',
    flavorText: 'Même la cendre la plus sombre couve une étincelle éternelle.',
    icon: 'auto_awesome',
    level: 1,
    stars: 3,
    shards: 1,
    shardsRequired: 60,
    foil: true,
  },
  {
    id: 'c_rog_shadowblade',
    name: 'Infiltrateur Spectral',
    cost: 2,
    type: 'creature',
    element: 'shadow',
    rarity: 'common',
    attack: 3,
    health: 2,
    maxHealth: 2,
    description: 'Combo: Confère Camouflage et gagne +1 ATQ.',
    flavorText: 'On ne sent que le courant d’air froid avant la dague.',
    icon: 'visibility_off',
    level: 2,
    stars: 1,
    shards: 15,
    shardsRequired: 20,
    foil: false,
  },
  {
    id: 'c_rog_poison_dagger',
    name: 'Frappe Venimeuse',
    cost: 1,
    type: 'spell',
    element: 'shadow',
    rarity: 'common',
    description: 'Inflige 2 dégâts et applique Poison (2 dégâts/tour pendant 2 tours).',
    flavorText: 'Un extrait de venin de Basilic d’Ébène.',
    icon: 'colorize',
    level: 3,
    stars: 1,
    shards: 22,
    shardsRequired: 25,
    foil: false,
    spellDamage: 2,
  },
  {
    id: 'c_rog_assassinate',
    name: 'Exécution Furtive',
    cost: 5,
    type: 'spell',
    element: 'shadow',
    rarity: 'epic',
    description: 'Détruit instantanément un serviteur ennemi ciblé.',
    flavorText: 'Ni bruit, ni trace. Juste le silence.',
    icon: 'flash_on',
    level: 1,
    stars: 2,
    shards: 5,
    shardsRequired: 35,
    foil: true,
  },
  {
    id: 'c_dru_treant',
    name: 'Ancien Protecteur d’Yggdrasil',
    cost: 5,
    type: 'creature',
    element: 'nature',
    rarity: 'rare',
    attack: 4,
    health: 7,
    maxHealth: 7,
    description: 'Provocation. Régénère 2 PV à la fin de chaque tour.',
    flavorText: 'Les racines millénaires puisent dans l’éther primordial.',
    icon: 'park',
    level: 2,
    stars: 2,
    shards: 11,
    shardsRequired: 30,
    foil: false,
    taunt: true,
  },
  {
    id: 'c_dru_rejuvenation',
    name: 'Floraison de Vie',
    cost: 2,
    type: 'spell',
    element: 'nature',
    rarity: 'common',
    description: 'Rend 6 PV à une cible et confère +1/+1 si c’est un serviteur.',
    flavorText: 'La terre fleurit sous les murmures du vent.',
    icon: 'spa',
    level: 3,
    stars: 1,
    shards: 19,
    shardsRequired: 25,
    foil: false,
    healValue: 6,
  },
  {
    id: 'c_nec_skeleton_knight',
    name: 'Chevalier d’Outre-Tombe',
    cost: 3,
    type: 'creature',
    element: 'shadow',
    rarity: 'common',
    attack: 3,
    health: 2,
    maxHealth: 2,
    description: 'Râle d’Agonie: Invoque un Squelette Soldat (2/1).',
    flavorText: 'La mort n’est qu’un nouvel engagement sous le drapeau de Malakor.',
    icon: 'coronavirus',
    level: 2,
    stars: 1,
    shards: 16,
    shardsRequired: 20,
    foil: false,
  },
  {
    id: 'c_nec_soul_drain',
    name: 'Siphon d’Âme Primordial',
    cost: 3,
    type: 'spell',
    element: 'shadow',
    rarity: 'rare',
    description: 'Inflige 4 dégâts à un serviteur et rend 4 PV à votre Héros.',
    flavorText: 'Votre vitalité m’appartient désormais.',
    icon: 'stream',
    level: 2,
    stars: 2,
    shards: 10,
    shardsRequired: 30,
    foil: true,
    spellDamage: 4,
    healValue: 4,
  },
];

// Nomenclature components for rich, thematic procedural generation
const PREFIXES = [
  'Grand', 'Ardent', 'Spectral', 'Céleste', 'Ancestral', 'Glacial', 'Solaire', 'Ténébreux',
  'Primordial', 'Éternel', 'Radieux', 'Maudit', 'Sanctifié', 'Furieux', 'Titanique', 'Vénérable',
  'Astral', 'Corrompu', 'Impérial', 'Mystique', 'Surnaturel', 'Drakonique', 'Abyssal', 'Tellurique',
  'Silencieux', 'Illuminé', 'Harmonique', 'Tempétueux', 'Inflexible', 'Éthéré', 'Léthifère', 'Souverain'
];

const ROLES_CREATURES = [
  'Guerrier', 'Gardien', 'Paladin', 'Mage', 'Chasseur', 'Assassin', 'Dragon', 'Golem',
  'Archange', 'Chevalier', 'Sentinelle', 'Invocateur', 'Sorcier', 'Colosse', 'Spectre', 'Champion',
  'Démon', 'Bête', 'Élémentaire', 'Valkyrie', 'Chaman', 'Oracle', 'Monk', 'Hydre',
  'Léviathan', 'Chimère', 'Basilic', 'Griffon', 'Phénix', 'Titan', 'Rôdeur', 'Centurion'
];

const ROLES_SPELLS = [
  'Frappe', 'Éclair', 'Nova', 'Tempête', 'Invocation', 'Bénédiction', 'Malédiction', 'Rayon',
  'Souffle', 'Explosion', 'Vague', 'Bouclier', 'Jugement', 'Pacte', 'Rituel', 'Flèche',
  'Chant', 'Transmutation', 'Comète', 'Fissure', 'Éveil', 'Siphon', 'Purification', 'Fureur'
];

const ROLES_RELICS = [
  'Grimoire', 'Sceptre', 'Bouclier', 'Anneau', 'Orbe', 'Amulette', 'Couronne', 'Tome',
  'Reliquaire', 'Calice', 'Boussole', 'Pierre', 'Égide', 'Lame', 'Flacon', 'Cristal'
];

const ROLES_SECRETS = [
  'Piège', 'Ruse', 'Contresort', 'Représailles', 'Embuscade', 'Mirage', 'Sceau', 'Énigme',
  'Détournement', 'Camouflage', 'Barrière', 'Rancœur', 'Barricade', 'Révélation', 'Reflet'
];

const LOCATIONS = [
  "de Solaria", "d'Aetheria", "des Cimes Brumeuses", "de l'Abîme", "d'Astral Peak",
  "d'Yggdrasil", "des Terres Brûlées", "du Bastion Céleste", "des Ruines d'Os", "du Val Émeraude",
  "du Vortex Éthéré", "des Profondeurs Oubliées", "du Temple Solaire", "de la Faille d'Ébène",
  "des Bois d'Argent", "de la Citadelle", "du Sanctuaire Doré", "des Glaces Éternelles"
];

const ICONS_BY_ELEMENT: Record<CardElement, string[]> = {
  light: ['wb_sunny', 'flare', 'shield_person', 'security', 'highlight', 'fort', 'military_tech', 'brightness_high', 'auto_awesome', 'shield'],
  fire: ['local_fire_department', 'whatshot', 'fireplace', 'flash_on', 'warning', 'electric_bolt', 'wb_twilight', 'offline_bolt', 'bolt'],
  ice: ['ac_unit', 'cloudy_snowing', 'snowing', 'water_drop', 'grain', 'waves', 'dew_point', 'water', 'severe_cold'],
  shadow: ['visibility_off', 'coronavirus', 'skull', 'dark_mode', 'nights_stay', 'psychology', 'remove_red_eye', 'bedtime', 'lens_blur'],
  nature: ['park', 'spa', 'nature', 'pets', 'forest', 'compost', 'yard', 'agriculture', 'grass', 'filter_vintage'],
  arcane: ['diamond', 'auto_stories', 'toll', 'stream', 'star', 'hourglass_full', 'filter_drama', 'change_circle', 'category', 'palette']
};

const FLAVOR_QUOTES = [
  "Forgé au creuset des temps anciens par les maîtres d'Aetheria.",
  "Ceux qui défient son pouvoir ne laissent derrière eux qu'une ombre.",
  "La lumière pure disperse les mensonges et consume les ténèbres.",
  "Dans le murmure du vent se cache une puissance prête à s'éveiller.",
  "Une arme légendaire transmise de génération en génération.",
  "Même la mort hésite avant de réclamer son dû.",
  "Nul ne traverse ce passage sans payer le tribut du sang.",
  "Une incantation rédigée dans le grand grimoire des arcanes perdus.",
  "Les étoiles elles-mêmes s'inclinent devant une telle harmonie.",
  "La terre tremble et le ciel s'embrase à son seul appel."
];

// Deterministic Pseudo-Random Generator for consistent procedural generation
function createPRNG(seed: number) {
  return function() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

export function generateMegaCardsLibrary(): Card[] {
  const cards: Card[] = [...CORE_CARDS, ...FORGEABLE_GRIMOIRE_CARDS];
  const targetCount = 1050;
  const prng = createPRNG(4242);

  const elements: CardElement[] = ['light', 'fire', 'ice', 'shadow', 'nature', 'arcane'];

  let index = 1;

  while (cards.length < targetCount) {
    const element = elements[Math.floor(prng() * elements.length)];
    
    // Type distribution: 60% creature, 28% spell, 7% relic, 5% secret
    const typeRoll = prng();
    let type: CardType = 'creature';
    if (typeRoll > 0.95) type = 'secret';
    else if (typeRoll > 0.88) type = 'relic';
    else if (typeRoll > 0.60) type = 'spell';

    // Rarity distribution: 45% common, 30% rare, 17% epic, 7% legendary, 1% mythic
    const rarityRoll = prng();
    let rarity: CardRarity = 'common';
    if (rarityRoll > 0.99) rarity = 'mythic';
    else if (rarityRoll > 0.92) rarity = 'legendary';
    else if (rarityRoll > 0.75) rarity = 'epic';
    else if (rarityRoll > 0.45) rarity = 'rare';

    // Cost 0 to 10 with realistic distribution bell curve
    let cost = Math.floor(prng() * 8) + 1;
    if (prng() < 0.05) cost = 0;
    if (prng() < 0.04) cost = 9;
    if (prng() < 0.02) cost = 10;

    const prefix = PREFIXES[Math.floor(prng() * PREFIXES.length)];
    const location = LOCATIONS[Math.floor(prng() * LOCATIONS.length)];
    
    let role = '';
    if (type === 'creature') {
      role = ROLES_CREATURES[Math.floor(prng() * ROLES_CREATURES.length)];
    } else if (type === 'spell') {
      role = ROLES_SPELLS[Math.floor(prng() * ROLES_SPELLS.length)];
    } else if (type === 'relic') {
      role = ROLES_RELICS[Math.floor(prng() * ROLES_RELICS.length)];
    } else {
      role = ROLES_SECRETS[Math.floor(prng() * ROLES_SECRETS.length)];
    }

    const cardName = `${prefix} ${role} ${location}`;
    const id = `c_${element}_${String(index).padStart(4, '0')}`;

    const iconList = ICONS_BY_ELEMENT[element];
    const icon = iconList[Math.floor(prng() * iconList.length)];
    const flavorText = FLAVOR_QUOTES[Math.floor(prng() * FLAVOR_QUOTES.length)];

    let attack: number | undefined = undefined;
    let health: number | undefined = undefined;
    let maxHealth: number | undefined = undefined;
    let taunt = false;
    let divineShield = false;
    let lifesteal = false;
    let spellDamage: number | undefined = undefined;
    let healValue: number | undefined = undefined;
    let battlecryDesc: string | undefined = undefined;
    let comboDesc: string | undefined = undefined;
    let description = '';

    const isFoil = rarity === 'mythic' || (rarity === 'legendary' && prng() > 0.3) || prng() > 0.85;
    const level = Math.floor(prng() * 5) + 1;
    const stars = rarity === 'mythic' || rarity === 'legendary' ? 3 : rarity === 'epic' ? 2 : 1;
    const shardsRequired = (rarity === 'mythic' ? 50 : rarity === 'legendary' ? 40 : rarity === 'epic' ? 30 : rarity === 'rare' ? 20 : 10) * level;
    const shards = Math.floor(prng() * (shardsRequired + 5));

    if (element === 'shadow' && prng() > 0.6) {
      comboDesc = 'Combo : Inflige +2 dégâts supplémentaires si une carte a été jouée avant ce tour.';
    }

    if (type === 'creature') {
      // Balanced stat curve: cost ~ ATK + HP - bonus keywords
      const totalBudget = Math.max(2, cost * 2 + 1 + (rarity === 'legendary' || rarity === 'mythic' ? 2 : 0));
      const atkSplit = 0.3 + prng() * 0.4;
      attack = Math.max(1, Math.round(totalBudget * atkSplit));
      health = Math.max(1, totalBudget - attack);
      maxHealth = health;

      if (prng() < 0.25) taunt = true;
      if (prng() < 0.18 && element === 'light') divineShield = true;
      if (prng() < 0.15 && (element === 'shadow' || element === 'light')) lifesteal = true;

      const mechanics: string[] = [];
      if (taunt) mechanics.push('Provocation');
      if (divineShield) mechanics.push('Bouclier Divin');
      if (lifesteal) mechanics.push('Vol de Vie');

      if (prng() < 0.3) {
        const dmg = Math.max(1, Math.floor(cost / 2));
        battlecryDesc = `Cri de Guerre: Inflige ${dmg} dégât(s) ciblé(s).`;
        mechanics.push(battlecryDesc);
      } else if (prng() < 0.2) {
        const heal = Math.max(2, cost);
        battlecryDesc = `Cri de Guerre: Rend ${heal} PV à votre Héros.`;
        mechanics.push(battlecryDesc);
      }

      description = mechanics.length > 0
        ? mechanics.join('. ') + '.'
        : `Créature ${element} loyale et redoutable sur le champ de bataille.`;

    } else if (type === 'spell') {
      if (prng() < 0.6) {
        spellDamage = Math.max(1, cost * 2 - (cost > 4 ? 1 : 0));
        description = `Inflige ${spellDamage} dégâts magiques d'élément ${element} à la cible.`;
      } else if (prng() < 0.85) {
        healValue = Math.max(3, cost * 2 + 2);
        description = `Rend ${healValue} PV à votre Héros ou à un serviteur allié.`;
      } else {
        description = `Confère +${Math.max(1, Math.floor(cost/2))}/+${Math.max(2, cost)} et Bouclier à un serviteur allié.`;
      }
    } else if (type === 'relic') {
      description = `Relique ancestrale: Confère +1 Cristal d'Énergie et renforce vos sorts de ${element} de +${Math.max(1, Math.floor(cost/3))}.`;
    } else { // secret
      description = `Secret: Quand l'adversaire lance une attaque majeure, annule les dégâts et contre-attaque pour ${Math.max(2, cost + 1)} dégâts.`;
    }

    cards.push({
      id,
      name: cardName,
      cost,
      type,
      element,
      rarity,
      attack,
      health,
      maxHealth,
      description,
      flavorText,
      icon,
      level,
      stars,
      shards,
      shardsRequired,
      foil: isFoil,
      taunt,
      divineShield,
      lifesteal,
      battlecryDesc,
      comboDesc,
      spellDamage,
      healValue
    });

    index++;
  }

  return cards.map(card => ({
    ...card,
    imageUrl: resolveCardImageUrl(card),
  }));
}

export const ALL_GAME_CARDS: Card[] = generateMegaCardsLibrary();
