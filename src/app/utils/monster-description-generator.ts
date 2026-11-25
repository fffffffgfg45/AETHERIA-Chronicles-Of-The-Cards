import {
  BestiaryEntry,
  BestiaryWeaknessElement,
  MonsterFamily
} from '../models/game.model';

export interface GeneratedMonsterChronicle {
  id: string;
  monsterId: string;
  monsterName: string;
  chroniclerName: string;
  chroniclerRole: string;
  chronicleDate: string;
  category: 'sighting' | 'anatomy' | 'combat_record' | 'rumor' | 'omen';
  categoryLabel: string;
  categoryIcon: string;
  headline: string;
  description: string;
  tacticalObservation: string;
  environmentalCondition: string;
  witnessReliability: 'Incontestable' | 'Hautement Crédible' | 'Témoignage Fiévreux' | 'Parchemin Oublié';
  elementalEcho: string;
}

// Procedural building blocks
const CHRONICLER_NAMES = [
  'Frère Aldéric',
  'Maître Godefroy de Varennes',
  'Dame Éléonore de la Flamme Noire',
  'Le Rôdeur Silencieux Kaelen',
  'L’Archiviste Anselme',
  'Le Capitaine Roderic des Portes d’Airain',
  'Dame Vespera de Castel-Givre',
  'L’Alchimiste Balthazar Vorne',
  'Soeur Béatrice du Voile Sacré',
  'Le Traqueur Voran des Failles',
  'Mélusine l’Herboriste Errante',
  'Le Barde Aveugle Thémis',
  'Le Commandeur Corvus',
  'L’Apprenti Scribe Lucien',
  'Dame Isabeau du Clair-de-Lune',
];

const CHRONICLER_ROLES = [
  'Inquisiteur de l’Ordre d’Aether',
  'Pisteur Élite de la Haute Garnison',
  'Herboriste & Alchimiste Militaire',
  'Scribe du Grand Scriptorium Royal',
  'Vétéran des Marches Frontalières',
  'Sentinelle des Donjons de Mortebreche',
  'Archiviste des Écrits Interdits',
  'Maître Chasseur de Monstres de Guilde',
  'Moine Copiste de l’Abbatiale du Crépuscule',
  'Explorateur des Profondeurs Telluriques',
];

const CHRONICLE_DATES = [
  'An 412 du Premier Âge, Troisième Veille de Nive',
  'An 418 de la Rupture, Solstice des Braises Éteintes',
  'An 423 d’Aetheria, Sous la Pleine Lune Pourpre',
  'An 399 avant le Grand Cataclysme, Nuit des Trois Comètes',
  'An 425 du Règne de Fer, Brumes Matinales de Vendémiaire',
  'An 419, Veille du Jugement des Cendres',
  'An 427, Saison des Orages d’Éther Brisé',
  'An 415, Nuit de l’Alignement des Constellations Mortes',
];

const CONDITIONS = [
  'Au cœur d’un brouillard spectral stagnant et glacial',
  'Sous un ciel embrasé par les aurores telluriques',
  'Dans le silence oppressant des galeries oubliées',
  'Pendant une averse d’eau saumâtre et d’étincelles d’ombre',
  'À la lueur hésitante de torches imprégnées de résine sacrée',
  'Sur un sol encore tiède de sang coagulé et de cendres',
  'Au détour d’un défilé rocheux balayé par les tourbillons de vent',
  'Près d’une source d’eau vive miraculeusement préservée',
];

const INTROS_BY_FAMILY: Record<MonsterFamily, string[]> = {
  undead: [
    'Une odeur sépulcrale d’encens ranci et de chair consumée a précédé l’apparition.',
    'Les cloches de l’ossuaire ont résonné sans qu’aucune main humaine ne tire la corde.',
    'Le givre s’est répandu sur le marbre des tombes à une vitesse contre-nature.',
    'Les squelettes des défunts ont commencé à frémir dans leurs suaires de toile.',
    'Un chœur de murmures discordants s’est élevé du tréfonds des catacombes.',
  ],
  beast: [
    'Les branchages ont craqué sous un poids colossal avant que le rugissement n’ébranle la falaise.',
    'Les chiens de guerre de notre colonne ont refusé d’avancer, terrorisés par l’empreinte fraîche.',
    'Une silhouette prédatrice aux muscles noueux s’est fondue parmi les taillis épineux.',
    'Les oiseaux de proie ont déserté le ciel plusieurs lieues à la ronde dès son approche.',
    'Des griffures profondes de plusieurs pouces marquaient les troncs centenaires.',
  ],
  demon: [
    'L’air est devenu brûlant, saturé d’une puanteur sulfureuse qui irritait la gorge et les yeux.',
    'Une fissure carmin s’est ouverte dans la roche, laissant échapper des braises vivantes.',
    'Le rire sardonique de la créature résonnait directement dans l’esprit des soldats.',
    'Les métaux sacrés portés par les paladins se sont mis à chauffer jusqu’à cloquer la peau.',
    'Des arabesques de flammes impies traçaient d’anciennes runes de damnation sur la pierre.',
  ],
  dragon: [
    'L’ombre projetée par ses ailes envergées a plongé tout le défilé dans un crépuscule artificiel.',
    'La pression atmosphérique a brusquement chuté, faisant siffler les conduits de ventilation du camp.',
    'Un souffle embrasé a vitrifié le granite de la crête sur plus de quarante pas.',
    'Chacun de ses battements d’ailes engendrait des bourrasques capables de renverser un chevalier en armure.',
    'L’or et les métaux précieux cliquetaient à son passage comme attirés par un magnétisme ancien.',
  ],
  elemental: [
    'La matière brute de l’environnement a commencé à s’assembler d’elle-même en une forme vivante.',
    'Les boussoles arcaniques sont devenues folles, oscillant frénétiquement entre les pôles.',
    'Un vortex élémentaire pur s’est condensé, défiant toutes les lois naturelles de pesanteur.',
    'Le sol vibrait d’une fréquence continue, faisant tinter les flacons des sacoches d’alchimiste.',
    'Une aura luminescente oscillait au rythme de pulsations telluriques profondes.',
  ],
  aberration: [
    'L’espace semblait se plier et se dédoubler autour de cette silhouette insaisissable.',
    'Plusieurs observateurs ont rapporté avoir vu des couleurs impossibles à décrire dans notre langue.',
    'Les ombres projetées au sol bougeaient indépendamment de la source de lumière.',
    'Des murmures dans un dialecte antérieur à la fondation d’Aetheria ont glacé le sang de l’escadron.',
    'Un sentiment de vertige immédiat s’est emparé de quiconque croisait son regard protéiforme.',
  ],
  humanoid: [
    'Une discipline martiale implacable et sans faille trahissait des décennies d’entraînement impitoyable.',
    'Ses armes portaient les gravures héraldiques d’une confrérie que l’on croyait anéantie.',
    'Ses yeux ne cillaient point, fixant la ligne défensive avec un calme glaçant.',
    'Les ordres étaient donnés par claquements secs de dague contre le plastron d’acier.',
    'Chaque mouvement semblait calculé pour anticiper la parade de son adversaire.',
  ],
  construct: [
    'Le fracas assourdissant d’engrenages d’airain et de pistons à vapeur précédait sa marche titanesque.',
    'Des lueurs runiques bleutées parcouraient ses jointures mécaniques scellées au mercure.',
    'Aucune blessure physique classique ne semblait capable d’altérer son avancée mécanique.',
    'Une cheminée dorsale crachait des volutes de vapeur surchauffée aux relents de soufre éthéré.',
    'L’énergie résiduelle d’anciens cristaux arcaniques animait cette masse inerte forgée par les nains.',
  ],
};

const OBSERVATIONS_BY_ELEMENT: Record<BestiaryWeaknessElement, string[]> = {
  light: [
    'Ses chairs et ses barrières nécrotiques fument violemment dès qu’un rayon sacré ou une prière solaire les effleure.',
    'La moindre incantation de lumière pure désoriente son orientation spatiale et calcine ses organes vitaux.',
    'Les éclats de cristal solaire provoquent des gerbes d’étincelles dorées qui dissolvent ses défenses.',
  ],
  fire: [
    'La résine alchimique incandescente embrase instantanément son épiderme, empêchant toute régénération.',
    'La créature manifeste une terreur viscérale face aux flammes vives, hésitant à franchir un cordon de feu.',
    'Les attaques de feu primordial consument les fibres musculaires plus rapidement qu’elle ne peut les reconstituer.',
  ],
  ice: [
    'Le froid mordant enraye ses articulations et cristallise ses humeurs internes en quelques secondes.',
    'Un sort de givre bien ciblé brise ses carapaces chitineuses durcies comme du verre sous tension.',
    'La diminution de sa température corporelle annule immédiatement la frénésie de ses assauts.',
  ],
  shadow: [
    'Les malédictions abyssales pénètrent ses défenses comme si son âme était attirée par le néant.',
    'La rupture de ses sceaux d’ombre provoque un déchirement éthéré qui le prive de son équilibre.',
    'Les toxines ombrales corrompent les canaux d’énergie qui soutiennent sa forme physique.',
  ],
  arcane: [
    'Les perturbations de flux arcanique font imploser ses propres résonances magiques.',
    'Un projectile arcanique bien placé surcharge son noyau d’énergie, déclenchant un retour de flamme mystique.',
    'Elle ne dispose d’aucun bouclier contre les ondes pures de distorsion temporelle ou spatiale.',
  ],
  nature: [
    'Les venins fongiques et les épines sauvages pénètrent facilement ses pores et ses écailles.',
    'Les spores de la sylve ancienne neutralisent ses instincts prédateurs et asphyxient ses branchies.',
    'L’acide végétal extrait des racines de belladone ronge son blindage sans laisser de répit.',
  ],
  physical: [
    'Un choc contondant massif ou un tranchant en fer d’Aetheria brise sans peine sa cage osseuse.',
    'Malgré ses artifices magiques, un coup de marteau de guerre au centre de masse l’anéantit net.',
    'Ses réflexes sont insuffisants face aux enchaînements rapides de lames forgées et équilibrées.',
  ],
};

const TACTICAL_TIPS = [
  'Astuce de combat : Attendez qu’il entame sa posture de charge pour esquiver latéralement et frapper son flanc sans protection.',
  'Note de terrain : Les archers recommandent de cibler l’œil gauche ou le cristal pectoral avant qu’il ne libère son onde de choc.',
  'Recommandation d’érudit : Préparez une fiole de sel d’argent pour neutraliser ses résidus au sol après l’affrontement.',
  'Avis d’alchimiste : Une décoction de racine lunaire bue avant le combat immunise temporairement contre ses vapeurs soporifiques.',
  'Secret des vétérans : Lorsque sa crête commence à rougir, canalisez immédiatement votre bouclier le plus résistant.',
  'Mémo d’armurier : Utilisez des armes dotées d’un contrepoids lourd pour déséquilibrer sa garde au premier échange.',
  'Conseil de traqueur : Évitez le combat rapproché tant que son aura élémentaire crépite à plein régime.',
  'Observation de scribe : Sa cadence d’assaut diminue drastiquement après la troisième seconde suivant un sortilège interrompu.',
];

const HEADLINES = [
  '« Le Témoignage Retrouvé du Poste Avancé »',
  '« L’Avertissement aux Voyageurs des Marches du Nord »',
  '« Étude Anatomique et Vulnérabilités Observées »',
  '« Le Massacre du Convoi de Ravil : Rapport Post-Mortem »',
  '« Rumeurs Étranges Recueillies à la Taverne du Sanglier »',
  '« Confessions d’un Déserteur de la Légion d’Obsidienne »',
  '« L’Analyse Secrète du Cercle des Enlumineurs »',
  '« Le Réveil d’un Mal que l’on Croyait Endormi »',
  '« Chronique d’une Traque dans les Marais Empoisonnés »',
  '« Observations Clandestines sous le Sanctuaire Brisé »',
];

export class MonsterDescriptionGenerator {
  /**
   * Generates an atmospheric, rich medieval chronicle for a given bestiary creature.
   * Can use a seed or generate completely fresh randomized lore.
   */
  static generateChronicle(
    monster: BestiaryEntry,
    customSeed?: number
  ): GeneratedMonsterChronicle {
    const seed = customSeed !== undefined ? customSeed : Math.floor(Math.random() * 1000000);
    const rng = (offset: number) => {
      const x = Math.sin(seed + offset) * 10000;
      return x - Math.floor(x);
    };

    const pick = <T>(arr: T[], offset: number): T => {
      const idx = Math.floor(rng(offset) * arr.length);
      return arr[Math.max(0, Math.min(arr.length - 1, idx))];
    };

    const chronicler = pick(CHRONICLER_NAMES, 1);
    const role = pick(CHRONICLER_ROLES, 2);
    const date = pick(CHRONICLE_DATES, 3);
    const condition = pick(CONDITIONS, 4);
    const headline = pick(HEADLINES, 5);

    const familyIntros = INTROS_BY_FAMILY[monster.family] || INTROS_BY_FAMILY.undead;
    const intro = pick(familyIntros, 6);

    const weakElement = monster.weaknesses[0]?.element || monster.primaryElement || 'light';
    const elemObs = pick(OBSERVATIONS_BY_ELEMENT[weakElement] || OBSERVATIONS_BY_ELEMENT.light, 7);

    const tacticalTip = pick(TACTICAL_TIPS, 8);

    const categories: {
      key: 'sighting' | 'anatomy' | 'combat_record' | 'rumor' | 'omen';
      label: string;
      icon: string;
    }[] = [
      { key: 'sighting', label: 'Témoignage Oculaire', icon: 'visibility' },
      { key: 'anatomy', label: 'Étude Anatomique', icon: 'biotech' },
      { key: 'combat_record', label: 'Rapport d’Engagement', icon: 'sports_martial_arts' },
      { key: 'rumor', label: 'Rumeur des Pistes', icon: 'record_voice_over' },
      { key: 'omen', label: 'Présage Lugubre', icon: 'auto_awesome' },
    ];
    const cat = pick(categories, 9);

    const reliabilities: ('Incontestable' | 'Hautement Crédible' | 'Témoignage Fiévreux' | 'Parchemin Oublié')[] = [
      'Incontestable',
      'Hautement Crédible',
      'Témoignage Fiévreux',
      'Parchemin Oublié',
    ];
    const reliability = pick(reliabilities, 10);

    // Build synthesized description paragraph
    const bodyFragments = [
      `« ${intro} `,
      `Lors de notre incursion dans le secteur de ${monster.habitat}, les éclaireurs ont confirmé la présence menaçante de ${monster.name}. `,
      `${condition}, la bête a déployé toute sa férocité. `,
      `${elemObs} `,
      `D’après les relevés manuscrits, l’indice de péril est évalué sans détour à ${monster.dangerRating}/5 pour un bataillon non préparé. »`
    ];

    const description = bodyFragments.join('');

    return {
      id: `chronicle_${monster.id}_${seed}`,
      monsterId: monster.id,
      monsterName: monster.name,
      chroniclerName: chronicler,
      chroniclerRole: role,
      chronicleDate: date,
      category: cat.key,
      categoryLabel: cat.label,
      categoryIcon: cat.icon,
      headline,
      description,
      tacticalObservation: tacticalTip,
      environmentalCondition: condition,
      witnessReliability: reliability,
      elementalEcho: `Résonance constatée : Vulnérabilité ${weakElement.toUpperCase()}`,
    };
  }
}
