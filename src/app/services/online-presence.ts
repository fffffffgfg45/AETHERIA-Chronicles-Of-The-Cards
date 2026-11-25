import { DestroyRef, Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface OnlinePlayerInfo {
  sessionId: string;
  playerName: string;
  heroClass: string;
  currentView: string;
  connectedAt: number;
}

export interface PresenceSnapshot {
  onlineCount: number;
  peakOnlineCount: number;
  updatedAt: number;
  players: OnlinePlayerInfo[];
}

export type PresenceConnectionStatus = 'connecting' | 'connected' | 'reconnecting';

@Injectable({
  providedIn: 'root',
})
export class OnlinePresenceService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  readonly onlineCount = signal<number>(0);
  readonly peakOnlineCount = signal<number>(0);
  readonly connectedPlayers = signal<OnlinePlayerInfo[]>([]);
  readonly connectionStatus = signal<PresenceConnectionStatus>('connecting');
  readonly currentSessionId = signal<string>('');
  readonly lastUpdatedAt = signal<number | null>(null);

  readonly isConnected = computed(() => this.connectionStatus() === 'connected');

  private eventSource: EventSource | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private started = false;
  private latestMeta = {
    playerName: 'Chevalier-Aether',
    heroClass: 'paladin',
    currentView: 'Arène',
  };

  private readonly handlePageLeave = () => {
    if (!isPlatformBrowser(this.platformId)) return;
    const sessionId = this.currentSessionId();
    if (sessionId && typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const payload = new Blob([JSON.stringify({ sessionId })], { type: 'application/json' });
      navigator.sendBeacon('/api/presence/leave', payload);
    }
    this.closeStream();
  };

  private readonly handleVisibilityChange = () => {
    if (!isPlatformBrowser(this.platformId)) return;
    if (document.visibilityState === 'visible' && this.started) {
      if (!this.eventSource || this.eventSource.readyState === EventSource.CLOSED) {
        this.openStream();
      } else {
        void this.sendActivityUpdate();
      }
    }
  };

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.disconnect();
    });
  }

  connect(initialMeta: { playerName: string; heroClass: string; currentView: string }): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.latestMeta = { ...initialMeta };

    if (!this.currentSessionId()) {
      this.currentSessionId.set(this.getOrCreateTabSessionId());
    }

    if (this.started) {
      void this.sendActivityUpdate();
      return;
    }

    this.started = true;
    window.addEventListener('pagehide', this.handlePageLeave);
    window.addEventListener('beforeunload', this.handlePageLeave);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    this.openStream();
  }

  updateActivity(partial: Partial<{ playerName: string; heroClass: string; currentView: string }>): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const next = {
      playerName: partial.playerName ?? this.latestMeta.playerName,
      heroClass: partial.heroClass ?? this.latestMeta.heroClass,
      currentView: partial.currentView ?? this.latestMeta.currentView,
    };

    const changed =
      next.playerName !== this.latestMeta.playerName ||
      next.heroClass !== this.latestMeta.heroClass ||
      next.currentView !== this.latestMeta.currentView;

    this.latestMeta = next;

    if (this.started && changed && this.currentSessionId()) {
      void this.sendActivityUpdate();
    }
  }

  disconnect(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.started) {
      window.removeEventListener('pagehide', this.handlePageLeave);
      window.removeEventListener('beforeunload', this.handlePageLeave);
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
    this.started = false;
    this.closeStream();
  }

  getHeroClassLabel(heroClass: string): string {
    switch (heroClass) {
      case 'paladin':
        return 'Paladin';
      case 'mage':
        return 'Archimage';
      case 'necromancer':
        return 'Nécromancien';
      case 'rogue':
        return 'Ombre';
      case 'druid':
        return 'Druide';
      default:
        return heroClass;
    }
  }

  private getOrCreateTabSessionId(): string {
    try {
      const key = 'aetheria_presence_session_id';
      const existing = sessionStorage.getItem(key);
      if (existing) return existing;
      const generated =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `tab_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(key, generated);
      return generated;
    } catch {
      return `tab_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    }
  }

  private openStream(): void {
    this.closeStream();

    const sessionId = this.currentSessionId();
    if (!sessionId) return;

    this.connectionStatus.set(this.onlineCount() > 0 ? 'reconnecting' : 'connecting');

    const params = new URLSearchParams({
      sessionId,
      playerName: this.latestMeta.playerName,
      heroClass: this.latestMeta.heroClass,
      currentView: this.latestMeta.currentView,
    });

    const source = new EventSource(`/api/presence/stream?${params.toString()}`);
    this.eventSource = source;

    source.addEventListener('presence', (event: MessageEvent<string>) => {
      try {
        const snapshot = JSON.parse(event.data) as PresenceSnapshot;
        this.applySnapshot(snapshot);
      } catch {
        // Ignore malformed SSE payload
      }
    });

    source.onopen = () => {
      this.connectionStatus.set('connected');
    };

    source.onerror = () => {
      this.connectionStatus.set('reconnecting');
      if (source.readyState === EventSource.CLOSED && this.started) {
        this.scheduleReconnect();
      }
    };
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.started) {
        this.openStream();
      }
    }, 3000);
  }

  private closeStream(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  private applySnapshot(snapshot: PresenceSnapshot): void {
    this.onlineCount.set(snapshot.onlineCount);
    this.peakOnlineCount.set(snapshot.peakOnlineCount);
    this.connectedPlayers.set(snapshot.players);
    this.lastUpdatedAt.set(snapshot.updatedAt);
    this.connectionStatus.set('connected');
  }

  private async sendActivityUpdate(): Promise<void> {
    const sessionId = this.currentSessionId();
    if (!sessionId) return;
    try {
      await fetch('/api/presence/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          playerName: this.latestMeta.playerName,
          heroClass: this.latestMeta.heroClass,
          currentView: this.latestMeta.currentView,
        }),
      });
    } catch {
      // Non-blocking heartbeat update
    }
  }
}
