import { Injectable, signal, computed, inject } from '@angular/core';
import { ToastNotification, NotificationType, NotificationRarity, ToastAction } from '../models/notification.model';
import { SoundService } from './sound';

const MAX_VISIBLE_TOASTS = 3;
const DEFAULT_DURATION = 4500; // 4.5 seconds

@Injectable({
  providedIn: 'root',
})
export class ToastNotificationService {
  private sound = inject(SoundService);

  // Active toasts currently shown on screen (capped at MAX_VISIBLE_TOASTS)
  readonly activeToasts = signal<ToastNotification[]>([]);

  // Queue of incoming toasts waiting for a visible slot
  readonly toastQueue = signal<ToastNotification[]>([]);

  // Full history log of received notifications
  readonly notificationHistory = signal<ToastNotification[]>([]);

  // Whether the notification center drawer is open
  readonly isHistoryOpen = signal<boolean>(false);

  // Filter for notification history center
  readonly historyFilter = signal<NotificationType | 'all'>('all');

  // Computed count of unread notifications
  readonly unreadCount = computed(() => {
    return this.notificationHistory().filter(n => !n.read).length;
  });

  // Computed queued items count
  readonly queuedCount = computed(() => {
    return this.toastQueue().length;
  });

  // Filtered history list
  readonly filteredHistory = computed(() => {
    const filter = this.historyFilter();
    const history = this.notificationHistory();
    if (filter === 'all') return history;
    return history.filter(n => n.type === filter);
  });

  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private simulationInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.startTimerTicker();
    this.loadHistoryFromStorage();
    this.startBackgroundSimulation();
  }

  private startTimerTicker() {
    if (typeof window === 'undefined') return;

    // Update remaining times every 50ms for smooth progress bar and auto-dismiss
    const TICK_MS = 50;
    this.timerInterval = setInterval(() => {
      const active = this.activeToasts();
      if (active.length === 0) return;

      let hasExpired = false;
      const updated = active.map(toast => {
        if (toast.paused) return toast;
        const newRemaining = Math.max(0, toast.remainingTime - TICK_MS);
        if (newRemaining === 0) {
          hasExpired = true;
        }
        return { ...toast, remainingTime: newRemaining };
      });

      if (hasExpired) {
        // Filter out expired toasts
        const remainingActive = updated.filter(t => t.remainingTime > 0);
        this.activeToasts.set(remainingActive);
        this.processQueue();
      } else {
        this.activeToasts.set(updated);
      }
    }, 50);
  }

  private processQueue() {
    const currentActive = this.activeToasts();
    const queue = this.toastQueue();

    if (currentActive.length < MAX_VISIBLE_TOASTS && queue.length > 0) {
      const slotsAvailable = MAX_VISIBLE_TOASTS - currentActive.length;
      const nextBatch = queue.slice(0, slotsAvailable);
      const remainingQueue = queue.slice(slotsAvailable);

      this.toastQueue.set(remainingQueue);
      this.activeToasts.set([...currentActive, ...nextBatch]);
    }
  }

  /**
   * Main method to queue & show a notification
   */
  show(config: {
    type: NotificationType;
    title: string;
    message: string;
    icon?: string;
    iconColor?: string;
    badge?: string;
    badgeColor?: string;
    rarity?: NotificationRarity;
    duration?: number;
    action?: ToastAction;
    secondaryAction?: ToastAction;
    soundType?: 'reward' | 'guild' | 'market' | 'battle' | 'system' | 'none';
  }): string {
    const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const duration = config.duration || DEFAULT_DURATION;

    // Determine default icon & styles by type if not provided
    const icon = config.icon || this.getDefaultIcon(config.type);
    const badge = config.badge || this.getDefaultBadge(config.type);

    const newToast: ToastNotification = {
      id,
      type: config.type,
      title: config.title,
      message: config.message,
      icon,
      iconColor: config.iconColor,
      badge,
      badgeColor: config.badgeColor,
      rarity: config.rarity || 'common',
      duration,
      remainingTime: duration,
      timestamp: new Date(),
      read: false,
      paused: false,
      action: config.action,
      secondaryAction: config.secondaryAction,
    };

    // Play appropriate sound effect
    const soundType = config.soundType !== undefined ? config.soundType : config.type;
    this.playNotificationSound(soundType, config.rarity);

    // Save in history
    this.notificationHistory.update(list => [newToast, ...list.slice(0, 49)]);
    this.saveHistoryToStorage();

    // Check if slot is available immediately
    const currentActive = this.activeToasts();
    if (currentActive.length < MAX_VISIBLE_TOASTS) {
      this.activeToasts.set([...currentActive, newToast]);
    } else {
      // Add to waiting queue
      this.toastQueue.update(q => [...q, newToast]);
    }

    return id;
  }

  /**
   * Shorthand: Reward notification (Gold, Gems, Cards, Shards, Quests)
   */
  showReward(
    title: string,
    message: string,
    opts?: {
      badge?: string;
      rarity?: NotificationRarity;
      icon?: string;
      action?: ToastAction;
    }
  ) {
    return this.show({
      type: 'reward',
      title,
      message,
      icon: opts?.icon || 'card_giftcard',
      badge: opts?.badge || 'RÉCOMPENSE',
      rarity: opts?.rarity || 'rare',
      action: opts?.action,
      soundType: 'reward',
    });
  }

  /**
   * Shorthand: Guild notification (Invitations, Donations, Level ups)
   */
  showGuildInvite(
    guildName: string,
    inviterName: string,
    onAccept?: () => void,
    onDecline?: () => void
  ) {
    return this.show({
      type: 'guild',
      title: 'Invitation de Guilde',
      message: `${inviterName} vous convie à rejoindre les rangs de [${guildName}] !`,
      icon: 'groups',
      badge: 'GUILDE',
      rarity: 'epic',
      duration: 6000,
      action: {
        label: 'Accepter',
        style: 'gold',
        callback: () => {
          if (onAccept) onAccept();
          this.showReward('Guilde rejointe !', `Vous faites désormais partie de [${guildName}]. Gloire à votre blason !`);
        },
      },
      secondaryAction: {
        label: 'Décliner',
        style: 'secondary',
        callback: () => {
          if (onDecline) onDecline();
          this.showSystem('Invitation déclinée', `Vous avez refusé l'invitation de [${guildName}].`);
        },
      },
      soundType: 'guild',
    });
  }

  /**
   * Shorthand: Market notification (Trade completed, sold item, new listings)
   */
  showMarketUpdate(
    title: string,
    message: string,
    opts?: {
      badge?: string;
      rarity?: NotificationRarity;
      action?: ToastAction;
    }
  ) {
    return this.show({
      type: 'market',
      title,
      message,
      icon: 'storefront',
      badge: opts?.badge || 'MARCHÉ',
      rarity: opts?.rarity || 'rare',
      action: opts?.action,
      soundType: 'market',
    });
  }

  /**
   * Shorthand: Battle & ELO result notification
   */
  showBattleResult(isWin: boolean, eloDelta: number, rewardsSummary: string) {
    return this.show({
      type: 'battle',
      title: isWin ? 'Victoire Épique en Arène' : 'Défaite Honorable',
      message: `${isWin ? '+' : ''}${eloDelta} ELO. ${rewardsSummary}`,
      icon: isWin ? 'emoji_events' : 'shield',
      badge: isWin ? 'VICTOIRE' : 'DÉFAITE',
      rarity: isWin ? 'legendary' : 'common',
      soundType: 'battle',
    });
  }

  /**
   * Shorthand: System / Cloud save / General notification
   */
  showSystem(title: string, message: string, icon = 'info') {
    return this.show({
      type: 'system',
      title,
      message,
      icon,
      badge: 'SYSTÈME',
      rarity: 'common',
      duration: 3500,
      soundType: 'system',
    });
  }

  /**
   * Dismiss an active toast by ID and pull next from queue
   */
  dismiss(toastId: string) {
    this.activeToasts.update(list => list.filter(t => t.id !== toastId));
    this.toastQueue.update(list => list.filter(t => t.id !== toastId));
    this.processQueue();
  }

  /**
   * Dismiss all currently visible toasts
   */
  dismissAll() {
    this.activeToasts.set([]);
    this.toastQueue.set([]);
    this.sound.playClick();
  }

  /**
   * Pause/Resume timer on mouse hover
   */
  setPaused(toastId: string, paused: boolean) {
    this.activeToasts.update(list =>
      list.map(t => (t.id === toastId ? { ...t, paused } : t))
    );
  }

  /**
   * Notification History Drawer controls
   */
  toggleHistory() {
    this.isHistoryOpen.update(open => !open);
    if (this.isHistoryOpen()) {
      this.markAllAsRead();
    }
    this.sound.playClick();
  }

  openHistory() {
    this.isHistoryOpen.set(true);
    this.markAllAsRead();
    this.sound.playClick();
  }

  closeHistory() {
    this.isHistoryOpen.set(false);
    this.sound.playClick();
  }

  setHistoryFilter(filter: NotificationType | 'all') {
    this.historyFilter.set(filter);
    this.sound.playClick();
  }

  markAllAsRead() {
    this.notificationHistory.update(list =>
      list.map(item => ({ ...item, read: true }))
    );
    this.saveHistoryToStorage();
  }

  clearHistory() {
    this.notificationHistory.set([]);
    this.saveHistoryToStorage();
    this.sound.playClick();
  }

  /**
   * Sound selection based on notification context
   */
  private playNotificationSound(soundType: string, rarity?: NotificationRarity) {
    try {
      switch (soundType) {
        case 'reward':
          if (rarity === 'legendary' || rarity === 'mythic') {
            this.sound.playVictory();
          } else {
            this.sound.playCoins();
          }
          break;
        case 'guild':
          this.sound.playTutorialChime();
          break;
        case 'market':
          this.sound.playCoins();
          break;
        case 'battle':
          this.sound.playCardSummon('epic');
          break;
        case 'system':
          this.sound.playClick();
          break;
        default:
          break;
      }
    } catch {
      // Audio fallback safety
    }
  }

  private getDefaultIcon(type: NotificationType): string {
    switch (type) {
      case 'reward':
        return 'auto_awesome';
      case 'guild':
        return 'groups';
      case 'market':
        return 'storefront';
      case 'battle':
        return 'sports_esports';
      case 'system':
        return 'notifications';
    }
  }

  private getDefaultBadge(type: NotificationType): string {
    switch (type) {
      case 'reward':
        return 'RÉCOMPENSE';
      case 'guild':
        return 'GUILDE';
      case 'market':
        return 'MARCHÉ';
      case 'battle':
        return 'ARÈNE';
      case 'system':
        return 'INFO';
    }
  }

  /**
   * Helper to simulate random live events on demand or periodically
   */
  simulateRandomEvent() {
    const events = [
      () =>
        this.showGuildInvite(
          'L\'Ordre des Templiers d\'Argent',
          'Dame Éléonore',
          () => console.log('Guild invite accepted'),
          () => console.log('Guild invite declined')
        ),
      () =>
        this.showMarketUpdate(
          'Offre Vendue au Marché !',
          'Votre lot de 2x Potions de Vitalité a été acheté par Kael_Sunstrider (+450 Or reçus) !',
          { badge: 'VENTE RÉUSSIE', rarity: 'rare' }
        ),
      () =>
        this.showMarketUpdate(
          'Nouvelle Offre d\'Exception',
          'Une carte [Archange de la Rédemption (Foil)] vient d\'être mise en vente à prix réduit dans la Halle du Troc.',
          { badge: 'BON PLAN', rarity: 'mythic' }
        ),
      () =>
        this.showReward(
          'Coffre de Guilde Débloqué !',
          'Votre guilde a atteint le Palier 4 cette semaine ! Vous obtenez 400 Or, 30 Gemmes et 20 Éclats.',
          { badge: 'BUTIN DE GUILDE', rarity: 'legendary' }
        ),
      () =>
        this.showReward(
          'Exploit de Duelliste Déverrouillé',
          'Vous avez infligé plus de 50 dégâts critiques avec des sorts arcaniques ! Récompense : Titre "Foudre Vivante".',
          { badge: 'HAUT FAIT', rarity: 'epic' }
        ),
      () =>
        this.show({
          type: 'guild',
          title: 'Don de Guilde Reçu',
          message: 'Aldric_Le_Brave a versé 500 pièces d\'or dans la trésorerie de guilde pour le coffre hebdomadaire.',
          icon: 'volunteer_activism',
          badge: 'DONATION',
          rarity: 'common',
        }),
    ];

    const randomEvent = events[Math.floor(Math.random() * events.length)];
    randomEvent();
  }

  /**
   * Background occasional real-time simulation (e.g. an authentic MMO / TCG living world feel)
   */
  private startBackgroundSimulation() {
    if (typeof window === 'undefined') return;

    // Trigger initial welcoming event after 6 seconds if history is small
    setTimeout(() => {
      if (this.notificationHistory().length <= 2) {
        this.showGuildInvite(
          'L\'Ordre des Templiers d\'Argent',
          'Dame Éléonore'
        );
      }
    }, 6000);

    // Occasional market or guild pulse every 75 seconds
    this.simulationInterval = setInterval(() => {
      // 50% chance to pulse a market or guild notification to simulate active community
      if (Math.random() > 0.4) {
        this.simulateRandomEvent();
      }
    }, 75000);
  }

  private saveHistoryToStorage() {
    if (typeof window === 'undefined') return;
    try {
      const serializable = this.notificationHistory().map(n => ({
        ...n,
        timestamp: n.timestamp instanceof Date ? n.timestamp.toISOString() : n.timestamp,
        action: undefined, // actions with functions cannot be JSON serialized
        secondaryAction: undefined,
      }));
      localStorage.setItem('aetheria_notification_history', JSON.stringify(serializable));
    } catch (e) {
      console.warn('Could not save notification history', e);
    }
  }

  private loadHistoryFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem('aetheria_notification_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const list: ToastNotification[] = parsed.map((item: Record<string, unknown>) => ({
            id: String(item['id'] || 'hist_' + Math.random()),
            type: (item['type'] as NotificationType) || 'system',
            title: String(item['title'] || ''),
            message: String(item['message'] || ''),
            icon: String(item['icon'] || 'notifications'),
            iconColor: item['iconColor'] ? String(item['iconColor']) : undefined,
            badge: item['badge'] ? String(item['badge']) : undefined,
            badgeColor: item['badgeColor'] ? String(item['badgeColor']) : undefined,
            rarity: (item['rarity'] as NotificationRarity) || 'common',
            duration: Number(item['duration'] || DEFAULT_DURATION),
            timestamp: new Date(String(item['timestamp'] || new Date().toISOString())),
            read: Boolean(item['read']),
            remainingTime: 0,
            paused: false,
          }));
          this.notificationHistory.set(list);
        }
      }
    } catch (e) {
      console.warn('Could not load notification history', e);
    }
  }
}
