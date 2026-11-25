import { ChangeDetectionStrategy, Component, OnInit, effect, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { GameStateService } from './services/game-state';
import { SoundService } from './services/sound';
import { BattleEngineService } from './services/battle-engine';
import { ArenaView } from './components/arena-view/arena-view';
import { GameModesView } from './components/game-modes-view/game-modes-view';
import { DeckbuilderView } from './components/deckbuilder-view/deckbuilder-view';
import { HeroesView } from './components/heroes-view/heroes-view';
import { InventoryView } from './components/inventory-view/inventory-view';
import { SeasonPassView } from './components/season-pass-view/season-pass-view';
import { RankedArenaView } from './components/ranked-arena-view/ranked-arena-view';
import { SocialGuildView } from './components/social-guild-view/social-guild-view';
import { MarketplaceView } from './components/marketplace-view/marketplace-view';
import { ShopView } from './components/shop-view/shop-view';
import { ProfileStatsView } from './components/profile-stats-view/profile-stats-view';
import { RelicsView } from './components/relics-view/relics-view';
import { PetsView } from './components/pets-view/pets-view';
import { SettingsModal } from './components/settings-modal/settings-modal';
import { DailyRewardsModal } from './components/daily-rewards-modal/daily-rewards-modal';
import { DailyMissionsComponent } from './components/daily-missions/daily-missions';
import { TutorialOverlay } from './components/tutorial-overlay/tutorial-overlay';
import { ToastContainerComponent } from './components/toast-container/toast-container';
import { HeavyMetalPlayerComponent } from './components/heavy-metal-player/heavy-metal-player';
import { BestiaryView } from './components/bestiary-view/bestiary-view';
import { AchievementsView } from './components/achievements-view/achievements-view';
import { PublicShowcaseView } from './components/public-showcase/public-showcase';
import { SkinRevealOverlay } from './components/skin-reveal-overlay/skin-reveal-overlay';
import { SkillTreeView } from './components/skill-tree-view/skill-tree-view';
import { PatchNotesView } from './components/patch-notes/patch-notes';
import { EpicQuestsView } from './components/epic-quests/epic-quests';
import { TutorialService } from './services/tutorial';
import { ToastNotificationService } from './services/toast-notification';
import { DailyMissionsService } from './services/daily-missions';
import { PatchNotesService } from './services/patch-notes';
import { QuestService } from './services/quest';
import { OnlinePresenceService } from './services/online-presence';
import { HeroClass, MedievalUiTheme } from './models/game.model';

export type NavView =
  | 'showcase'
  | 'modes'
  | 'arena'
  | 'missions'
  | 'quests'
  | 'story'
  | 'duel'
  | 'deckbuilder'
  | 'heroes'
  | 'skilltree'
  | 'pets'
  | 'relics'
  | 'inventory'
  | 'bestiary'
  | 'achievements'
  | 'season'
  | 'ranked'
  | 'social'
  | 'market'
  | 'shop'
  | 'profile'
  | 'changelog';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'closePopoversOnEscape()',
  },
  imports: [
    MatIconModule,
    PublicShowcaseView,
    ArenaView,
    GameModesView,
    DeckbuilderView,
    HeroesView,
    PetsView,
    RelicsView,
    InventoryView,
    BestiaryView,
    AchievementsView,
    SeasonPassView,
    RankedArenaView,
    SocialGuildView,
    MarketplaceView,
    ShopView,
    ProfileStatsView,
    SettingsModal,
    DailyRewardsModal,
    DailyMissionsComponent,
    TutorialOverlay,
    ToastContainerComponent,
    HeavyMetalPlayerComponent,
    SkinRevealOverlay,
    SkillTreeView,
    PatchNotesView,
    EpicQuestsView,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  readonly gameState = inject(GameStateService);
  readonly sound = inject(SoundService);
  readonly battleEngine = inject(BattleEngineService);
  readonly tutorial = inject(TutorialService);
  readonly notificationService = inject(ToastNotificationService);
  readonly missionsService = inject(DailyMissionsService);
  readonly patchNotes = inject(PatchNotesService);
  readonly questService = inject(QuestService);
  readonly onlinePresence = inject(OnlinePresenceService);

  readonly currentView = signal<NavView>('arena');
  readonly showSettings = signal<boolean>(false);
  readonly showDailyModal = signal<boolean>(false);
  readonly showDailyMissionsModal = signal<boolean>(false);
  readonly showMoreMenu = signal<boolean>(false);
  readonly showMedievalThemeModal = signal<boolean>(false);
  readonly showQuickVolume = signal<boolean>(false);
  readonly showOnlinePopover = signal<boolean>(false);

  // Grand Medieval Citadel Entrance Animation
  readonly isEntrancePlaying = signal<boolean>(true);
  readonly isGatesOpening = signal<boolean>(false);
  private entranceTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      const playerName = this.gameState.username();
      const heroClass = this.gameState.selectedHeroClass();
      const currentView = this.getViewDisplayLabel(this.currentView());
      this.onlinePresence.updateActivity({ playerName, heroClass, currentView });
    });
  }

  ngOnInit() {
    // Check if user requested showcase directly
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('view') === 'showcase' || window.location.hash === '#showcase' || window.location.hash === '#vitrine') {
        this.currentView.set('showcase');
        this.isEntrancePlaying.set(false);
      }

      this.onlinePresence.connect({
        playerName: this.gameState.username(),
        heroClass: this.gameState.selectedHeroClass(),
        currentView: this.getViewDisplayLabel(this.currentView()),
      });

      const handleInitialInteraction = () => {
        this.sound.startAmbientMusic();
        window.removeEventListener('click', handleInitialInteraction);
      };
      window.addEventListener('click', handleInitialInteraction);

      // Auto-open entrance gates after 2.2s if not already opened
      this.entranceTimeout = setTimeout(() => {
        if (this.isEntrancePlaying() && !this.isGatesOpening()) {
          this.openGates();
        }
      }, 2200);

      // If user is brand new (level 1 or first visit), auto prompt tutorial gently after 1 second
      if (!this.tutorial.isCompleted() && !localStorage.getItem('aetheria_tutorial_completed')) {
        setTimeout(() => {
          this.tutorial.openTutorial(0, 0);
        }, 3600);
      }
    }
  }

  openGates() {
    if (this.isGatesOpening()) return;
    if (this.entranceTimeout) {
      clearTimeout(this.entranceTimeout);
      this.entranceTimeout = null;
    }
    this.isGatesOpening.set(true);
    this.sound.playVictory();
    setTimeout(() => {
      this.isEntrancePlaying.set(false);
      this.isGatesOpening.set(false);
    }, 1300);
  }

  skipEntrance() {
    if (this.entranceTimeout) {
      clearTimeout(this.entranceTimeout);
      this.entranceTimeout = null;
    }
    this.isEntrancePlaying.set(false);
    this.isGatesOpening.set(false);
    this.sound.playClick();
  }

  replayEntrance() {
    this.isGatesOpening.set(false);
    this.isEntrancePlaying.set(true);
    this.sound.playClick();
    this.entranceTimeout = setTimeout(() => {
      if (this.isEntrancePlaying() && !this.isGatesOpening()) {
        this.openGates();
      }
    }, 2400);
  }

  openTutorial() {
    this.tutorial.openTutorial(0, 0);
  }

  switchView(view: NavView) {
    this.currentView.set(view);
    this.showMoreMenu.set(false);
    this.sound.playClick();
  }

  toggleMoreMenu() {
    this.showMoreMenu.update(v => !v);
    this.sound.playClick();
  }

  openDailyRewards() {
    this.showDailyModal.set(true);
    this.sound.playClick();
  }

  openDailyMissions() {
    this.showDailyMissionsModal.set(true);
    this.sound.playClick();
  }

  openSettings() {
    this.showSettings.set(true);
    this.showQuickVolume.set(false);
    this.sound.playClick('gold');
  }

  toggleQuickVolume() {
    this.showQuickVolume.update(v => !v);
    this.sound.playClick('gold');
  }

  setMasterVolume(val: number) {
    this.sound.updateSettings({ masterVolume: +val });
    this.sound.previewChannel('masterVolume');
  }

  toggleMedievalThemeModal() {
    this.showMedievalThemeModal.update(v => !v);
    this.sound.playClick();
  }

  selectMedievalTheme(theme: MedievalUiTheme) {
    this.gameState.setMedievalTheme(theme);
  }

  getThemeBadge(theme: MedievalUiTheme): string {
    switch (theme) {
      case 'stone_citadel':
        return 'Forteresse';
      case 'illuminated_parchment':
        return 'Parchemin';
      case 'royal_sanctuary':
        return 'Sanctuaire';
      default:
        return 'Médiéval';
    }
  }

  onInspectRevealedHero(heroId: HeroClass) {
    this.gameState.selectHero(heroId);
    this.switchView('heroes');
  }

  toggleOnlinePopover() {
    this.showOnlinePopover.update(v => !v);
    if (this.showOnlinePopover()) {
      this.showQuickVolume.set(false);
      this.showMoreMenu.set(false);
    }
    this.sound.playClick();
  }

  closePopoversOnEscape() {
    this.showOnlinePopover.set(false);
    this.showQuickVolume.set(false);
    this.showMoreMenu.set(false);
  }

  getViewDisplayLabel(view: NavView): string {
    switch (view) {
      case 'showcase': return 'Site Public';
      case 'modes': return 'Modes de Jeu';
      case 'arena': return 'Arène';
      case 'missions': return 'Missions';
      case 'quests': return 'Quêtes Épiques';
      case 'story': return 'Histoire';
      case 'duel': return 'Duel';
      case 'deckbuilder': return 'Grimoire';
      case 'heroes': return 'Héros';
      case 'skilltree': return 'Arbre de Talents';
      case 'pets': return 'Familiers';
      case 'relics': return 'Reliques';
      case 'inventory': return 'Synthèse';
      case 'bestiary': return 'Bestiaire';
      case 'achievements': return 'Succès';
      case 'season': return 'Passe Saison';
      case 'ranked': return 'Classement';
      case 'social': return 'Guilde & Chat';
      case 'market': return 'Halle du Troc';
      case 'shop': return 'Boutique';
      case 'profile': return 'Profil & Stats';
      case 'changelog': return 'Notes de Patch';
      default: return view;
    }
  }
}
