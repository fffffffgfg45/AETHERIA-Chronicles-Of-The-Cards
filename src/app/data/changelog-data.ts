export type ChangelogCategory = 'feature' | 'bugfix' | 'combat' | 'economy' | 'security' | 'ui';

export type PatchEntryKind = 'feature' | 'bugfix';

export type ChangelogTargetView =
  | 'arena'
  | 'ranked'
  | 'heroes'
  | 'skilltree'
  | 'pets'
  | 'relics'
  | 'inventory'
  | 'market'
  | 'shop';

export interface ChangelogChangeItem {
  id: string;
  kind: PatchEntryKind;
  category: ChangelogCategory;
  title: string;
  description: string;
  targetView?: ChangelogTargetView;
  actionLabel?: string;
}

export interface ChangelogRelease {
  version: string;
  date: string;
  title: string;
  subtitle: string;
  summary: string;
  isMajor: boolean;
  bannerImageUrl?: string;
  changes: ChangelogChangeItem[];
}

export const CHANGELOG_RELEASES: ChangelogRelease[] = [
  {
    version: '2.7',
    date: '22 novembre 2026',
    title: 'Notes de Patch Développeur & Halle du Troc Protégée',
    subtitle: 'Gestionnaire de patch notes, échanges P2P sous séquestre et bouclier anti-arnaque',
    summary:
      'Déploiement du service dédié aux notes de version développeur (fonctionnalités récentes et correctifs de bugs), de la Chambre d’Échange P2P sécurisée et du verrou anti-substitution.',
    isMajor: true,
    bannerImageUrl: '/src/assets/images/marketplace_bazaar_banner_1795188691111.jpg',
    changes: [
      {
        id: 'chg_27_1',
        kind: 'feature',
        category: 'feature',
        title: 'Service & Interface de Notes de Patch Développeur',
        description:
          'Nouveau service centralisé et vue dédiée pour publier des versions, séparer clairement les nouvelles fonctionnalités des correctifs de bugs, filtrer par domaine et naviguer vers les modules concernés.',
      },
      {
        id: 'chg_27_2',
        kind: 'feature',
        category: 'economy',
        title: 'Chambre d’Échange P2P Multi-Objets',
        description:
          'Proposez et négociez directement avec les joueurs de votre guilde ou du classement en combinant cartes, potions, réactifs alchimiques (y compris rares), Or et Gemmes des deux côtés.',
        targetView: 'market',
        actionLabel: 'Ouvrir la Halle du Troc',
      },
      {
        id: 'chg_27_3',
        kind: 'feature',
        category: 'security',
        title: 'Bouclier Anti-Arnaque & Verrou Anti-Substitution 5s',
        description:
          'Calculateur d’équité automatique bloquant les échanges déséquilibrés (≥ 50% de perte) ou la sous-cotation d’objets rares (Rosée Astrale, Cendre de Phénix, Spore du Néant, cartes Légendaires/Mythiques).',
        targetView: 'market',
        actionLabel: 'Tester la protection',
      },
      {
        id: 'chg_27_4',
        kind: 'feature',
        category: 'ui',
        title: 'Inspecteur Détaillé d’Objet & Registre Escrow',
        description:
          'Chaque carte, potion ou réactif exposé à la Halle dispose d’une fiche d’inspection complète (statistiques, mots-clés, rareté, valeur marchande estimée) et d’un registre d’audit immuable.',
        targetView: 'market',
        actionLabel: 'Inspecter les offres',
      },
      {
        id: 'fix_27_1',
        kind: 'bugfix',
        category: 'bugfix',
        title: 'Correctif : Réinitialisation des signatures lors d’une modification d’offre P2P',
        description:
          'Correction d’un cas limite où un joueur pouvait modifier un lot juste avant validation : toute retouche réinitialise désormais les deux confirmations et lance un délai de sécurité de 5 secondes.',
      },
      {
        id: 'fix_27_2',
        kind: 'bugfix',
        category: 'bugfix',
        title: 'Correctif : Persistance SSR & sauvegarde locale hors-navigateur',
        description:
          'Sécurisation des accès à localStorage lors du rendu serveur Angular SSR afin d’éliminer les erreurs d’hydratation au démarrage.',
      },
    ],
  },
  {
    version: '2.6',
    date: '20 novembre 2026',
    title: 'Arbre de Compétences Évolutif & Gloire Classée',
    subtitle: 'Croissance organique des maîtrises de héros et compteur de victoires doré',
    summary:
      'Chaque amélioration débloquée fait grandir l’arbre de votre classe jusqu’à la maîtrise absolue, récompensée par un coffre royal de 1 000 Or et 150 Gemmes.',
    isMajor: true,
    bannerImageUrl: '/src/assets/images/trophy_rank_gold_1795189809836.jpg',
    changes: [
      {
        id: 'chg_26_1',
        kind: 'feature',
        category: 'feature',
        title: 'Arbre de Compétences Croissant sur 20 Classes',
        description:
          'Visualisez l’évolution vivante de votre arbre de talents : tronc, ramures, feuillage émeraude et floraisons dorées s’étendent à mesure que vous débloquez de nouveaux nœuds.',
        targetView: 'skilltree',
        actionLabel: 'Voir l’Arbre',
      },
      {
        id: 'chg_26_2',
        kind: 'feature',
        category: 'economy',
        title: 'Récompense de Maîtrise Complète : 1 000 Or & 150 Gemmes',
        description:
          'Compléter l’ensemble des améliorations de l’arbre d’un héros débloque automatiquement le Grand Coffre d’Accomplissement octroyant 1 000 pièces d’Or et 150 Gemmes.',
        targetView: 'skilltree',
        actionLabel: 'Réclamer / Progresser',
      },
      {
        id: 'chg_26_3',
        kind: 'feature',
        category: 'combat',
        title: 'Compteur Visuel de Victoires & Célébration Dorée',
        description:
          'L’en-tête de l’Arène Compétitive affiche votre total de victoires classées en temps réel avec une animation dorée dédiée après chaque duel remporté.',
        targetView: 'ranked',
        actionLabel: 'Accéder au Classement',
      },
      {
        id: 'fix_26_1',
        kind: 'bugfix',
        category: 'bugfix',
        title: 'Correctif : Double réclamation impossible sur la récompense d’Arbre complet',
        description:
          'Ajout d’un verrou persistant par classe de héros empêchant le crédit multiple des 1 000 Or et 150 Gemmes après rechargement de la page.',
      },
      {
        id: 'fix_26_2',
        kind: 'bugfix',
        category: 'bugfix',
        title: 'Correctif : Débordement responsive de l’en-tête sur écrans intermédiaires',
        description:
          'Ajustement des libellés et espacements de la barre supérieure pour éviter le retour à la ligne des boutons d’action entre 1024px et 1280px.',
      },
    ],
  },
  {
    version: '2.5',
    date: '18 novembre 2026',
    title: 'Autel Alchimique de Troc : Glisser-Déposer & Fumée Magique',
    subtitle: 'Manipulation tactile des offres du marché et effets volumétriques',
    summary:
      'La Halle du Troc s’enrichit d’un établi interactif en glisser-déposer permettant d’examiner les offres ou d’exposer vos cartes et potions dans un halo de fumée enchantée.',
    isMajor: false,
    changes: [
      {
        id: 'chg_25_1',
        kind: 'feature',
        category: 'ui',
        title: 'Glisser-Déposer entre Besace, Autel et Coffre d’Acquisition',
        description:
          'Faites glisser n’importe quelle annonce vers le Coffre d’Acquisition pour l’acheter ou déposez un objet de votre Besace sur l’Autel de Publication.',
        targetView: 'market',
        actionLabel: 'Essayer l’Autel',
      },
      {
        id: 'chg_25_2',
        kind: 'feature',
        category: 'ui',
        title: 'Fumée Magique Volumétrique & Effets Sonores',
        description:
          'Chaque confirmation d’échange ou de mise en vente déclenche une nuée de volutes émeraude, d’étincelles dorées et un sceau sonore cristallin.',
      },
      {
        id: 'fix_25_1',
        kind: 'bugfix',
        category: 'bugfix',
        title: 'Correctif : Réinitialisation de la zone de dépôt après annulation du drag-and-drop',
        description:
          'Correction de l’état visuel de surbrillance qui restait bloqué lorsqu’un objet glissé était relâché hors des zones cibles.',
      },
    ],
  },
  {
    version: '2.4',
    date: '15 novembre 2026',
    title: 'Familiers Enluminés & Combat Tactique Guidé',
    subtitle: 'Portraits dédiés pour chaque compagnon et assistance visuelle de ciblage',
    summary:
      'Tous les compagnons animaux reçoivent des illustrations uniques et le plateau de combat intègre un guidage pas-à-pas plus précis entre phase de pioche, invocation et attaque.',
    isMajor: true,
    bannerImageUrl: '/src/assets/images/pet_golden_dragon_legendary_1795189147942.jpg',
    changes: [
      {
        id: 'chg_24_1',
        kind: 'feature',
        category: 'ui',
        title: 'Illustrations Complètes des 14 Familiers',
        description:
          'Faucon, Furet, Tigre de Givre, Dragon Doré, Léviathan du Néant et Kirin Astral disposent chacun de leur portrait peint affiché jusque dans la barre de navigation et le plateau de duel.',
        targetView: 'pets',
        actionLabel: 'Voir les Familiers',
      },
      {
        id: 'chg_24_2',
        kind: 'feature',
        category: 'combat',
        title: 'Système de Combat Guidé & Ciblage Précis',
        description:
          'Indications tactiques dynamiques en duel mettant en surbrillance les cartes jouables, les créatures prêtes à frapper et les cibles soumises à Provocation.',
        targetView: 'arena',
        actionLabel: 'Lancer un Duel',
      },
      {
        id: 'fix_24_1',
        kind: 'bugfix',
        category: 'bugfix',
        title: 'Correctif : Verrou de ciblage après élimination d’une créature avec Provocation',
        description:
          'Résolution du bug qui empêchait parfois de cibler directement le héros adverse immédiatement après la destruction du dernier serviteur Provocation en un même tour.',
      },
      {
        id: 'fix_24_2',
        kind: 'bugfix',
        category: 'bugfix',
        title: 'Correctif : Repli visuel des portraits de familiers manquants',
        description:
          'Ajout d’un repli automatique sur l’icône matérielle dédiée si une texture de compagnon tarde à charger.',
      },
    ],
  },
  {
    version: '2.3',
    date: '12 novembre 2026',
    title: 'Enluminures d’Équipement & Éclat des Trésors',
    subtitle: 'Remplacement des icônes génériques par des visuels peints et reflets d’or',
    summary:
      'Refonte visuelle des Reliques, Potions, Réactifs, Boutique et Trésorerie : les gemmes scintillent et les pièces d’or brillent en continu dans tout le royaume.',
    isMajor: false,
    bannerImageUrl: '/src/assets/images/relic_solaris_1795188690211.jpg',
    changes: [
      {
        id: 'chg_23_1',
        kind: 'feature',
        category: 'ui',
        title: 'Visuels Peints pour Reliques, Potions & Coffres',
        description:
          'Toutes les reliques ancestrales, fioles d’alchimie, réactifs et coffres de la Boutique remplacent les anciens emojis par des illustrations haute définition.',
        targetView: 'relics',
        actionLabel: 'Admirer les Reliques',
      },
      {
        id: 'chg_23_2',
        kind: 'feature',
        category: 'ui',
        title: 'Brillance Animée sur l’Or et les Gemmes',
        description:
          'Les compteurs d’Or et de Gemmes bénéficient d’un reflet métallique et prismatique permanent dans l’en-tête, la Boutique et la Halle du Troc.',
        targetView: 'shop',
        actionLabel: 'Visiter la Boutique',
      },
      {
        id: 'fix_23_1',
        kind: 'bugfix',
        category: 'bugfix',
        title: 'Correctif : Alignement des compteurs numériques d’Or et de Gemmes',
        description:
          'Application de chiffres tabulaires fixes évitant le léger tremblement horizontal lors des gains rapides en combat.',
      },
    ],
  },
  {
    version: '2.2',
    date: '09 novembre 2026',
    title: 'Atelier de Skins Héroïques & Révélations Épiques',
    subtitle: 'Personnalisation visuelle des 20 héros avec raretés et cinématique dédiée',
    summary:
      'Chaque classe dispose désormais de skins déblocables classés par rareté avec particules CSS dédiées et séquence de révélation plein écran lors de l’obtention.',
    isMajor: true,
    bannerImageUrl: '/src/assets/images/hero_paladin_1794650124235.jpg',
    changes: [
      {
        id: 'chg_22_1',
        kind: 'feature',
        category: 'feature',
        title: 'Système de Skins sur Chaque Héros',
        description:
          'Débloquez et équipez des apparences exclusives (Commun, Rare, Légendaire) modifiant l’aura et le portrait de vos champions en combat.',
        targetView: 'heroes',
        actionLabel: 'Personnaliser un Héros',
      },
      {
        id: 'chg_22_2',
        kind: 'feature',
        category: 'ui',
        title: 'Particules de Rareté & Révélation Plein Écran',
        description:
          'Effets de particules CSS adaptés à chaque palier de rareté et transition cinématique plein écran accompagnée d’une signature sonore lors du déblocage d’un skin.',
        targetView: 'heroes',
        actionLabel: 'Explorer les Skins',
      },
      {
        id: 'fix_22_1',
        kind: 'bugfix',
        category: 'bugfix',
        title: 'Correctif : Fermeture propre de l’overlay de révélation par touche Échap',
        description:
          'Assure l’arrêt immédiat des animations et la reprise fluide de la navigation dès la fermeture de la cinématique de skin.',
      },
    ],
  },
];

export const LATEST_CHANGELOG_VERSION = CHANGELOG_RELEASES[0].version;
