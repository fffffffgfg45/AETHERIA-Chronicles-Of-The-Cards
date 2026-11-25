import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ToastNotificationService } from '../../services/toast-notification';
import { ToastNotification, ToastAction } from '../../models/notification.model';
import { NavView } from '../../app';

@Component({
  selector: 'app-toast-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule],
  template: `
    <!-- FLOATING TOASTS STACK (TOP RIGHT) -->
    <aside
      aria-label="Notifications en temps réel"
      class="fixed top-16 right-4 sm:right-6 z-50 flex flex-col items-end gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none">
      
      @for (toast of notificationService.activeToasts(); track toast.id) {
        <div
          role="alert"
          tabindex="0"
          (mouseenter)="notificationService.setPaused(toast.id, true)"
          (mouseleave)="notificationService.setPaused(toast.id, false)"
          (keydown.escape)="notificationService.dismiss(toast.id)"
          class="pointer-events-auto w-full relative rounded-xl bg-[#14100c]/98 backdrop-blur-md border p-3.5 shadow-[0_12px_32px_rgba(0,0,0,0.85)] flex flex-col gap-2 transition-all duration-300 transform translate-y-0 opacity-100 animate-in slide-in-from-right-8 fade-in"
          [class.border-[#8b6b43]]="toast.rarity === 'common'"
          [class.border-[#38bdf8]]="toast.rarity === 'rare'"
          [class.border-[#c084fc]]="toast.rarity === 'epic'"
          [class.border-[#fbbf24]]="toast.rarity === 'legendary'"
          [class.border-[#fb7185]]="toast.rarity === 'mythic'"
          [class.shadow-[0_0_20px_rgba(251,191,36,0.25)]]="toast.rarity === 'legendary'"
          [class.shadow-[0_0_25px_rgba(251,113,133,0.35)]]="toast.rarity === 'mythic'"
          [class.shadow-[0_0_20px_rgba(192,132,252,0.25)]]="toast.rarity === 'epic'">

          <!-- Card Header & Content Layout -->
          <div class="flex items-start gap-3">
            
            <!-- Thematic Icon Avatar -->
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border relative shadow-md"
              [class.bg-[#241a12]_border-[#8b6b43]_text-[#c5a880]]="toast.rarity === 'common'"
              [class.bg-[#0e2438]_border-[#38bdf8]_text-[#38bdf8]]="toast.rarity === 'rare'"
              [class.bg-[#28153b]_border-[#c084fc]_text-[#c084fc]]="toast.rarity === 'epic'"
              [class.bg-[#36250e]_border-[#fbbf24]_text-[#fbbf24]]="toast.rarity === 'legendary'"
              [class.bg-[#381018]_border-[#fb7185]_text-[#fb7185]]="toast.rarity === 'mythic'">
              <mat-icon class="text-xl">{{ toast.icon }}</mat-icon>
              @if (toast.rarity === 'legendary' || toast.rarity === 'mythic') {
                <span class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#fbbf24] animate-ping"></span>
              }
            </div>

            <!-- Text Content -->
            <div class="flex-1 min-w-0 pr-6">
              
              <!-- Badge + Type Tag -->
              <div class="flex items-center gap-2 mb-0.5">
                <span
                  class="px-2 py-0.5 rounded text-[10px] font-mono font-extrabold uppercase tracking-wider border"
                  [class.bg-[#2a2018]_border-[#8b6b43]_text-[#c5a880]]="toast.type === 'system'"
                  [class.bg-[#38260f]_border-[#fbbf24]_text-[#fbbf24]]="toast.type === 'reward'"
                  [class.bg-[#28153b]_border-[#c084fc]_text-[#e9d5ff]]="toast.type === 'guild'"
                  [class.bg-[#0e2438]_border-[#38bdf8]_text-[#bae6fd]]="toast.type === 'market'"
                  [class.bg-[#381212]_border-[#f87171]_text-[#fca5a5]]="toast.type === 'battle'">
                  {{ toast.badge }}
                </span>
                <span class="text-[10px] text-[#8b6b43] font-mono">
                  {{ formatTime(toast.timestamp) }}
                </span>
              </div>

              <!-- Title -->
              <h4 class="font-cinzel text-sm font-black text-[#f3eedd] leading-snug truncate">
                {{ toast.title }}
              </h4>

              <!-- Message Body -->
              <p class="text-xs text-[#c5a880] mt-1 leading-relaxed break-words font-sans">
                {{ toast.message }}
              </p>

              <!-- Optional Interactive Action Buttons (e.g. Guild Invite / Market Links) -->
              @if (toast.action || toast.secondaryAction) {
                <div class="mt-2.5 flex items-center gap-2">
                  @if (toast.action) {
                    <button
                      (click)="handleActionClick(toast, toast.action)"
                      class="px-3 py-1 text-xs font-cinzel font-bold rounded-lg border transition-all shadow flex items-center gap-1"
                      [class.bg-[#d4af37]_text-[#1a120b]_border-[#fef08a]_hover:bg-[#facc15]]="toast.action.style === 'gold' || !toast.action.style"
                      [class.bg-[#8b2b2b]_text-white_border-[#ef4444]_hover:bg-[#991b1b]]="toast.action.style === 'danger'"
                      [class.bg-[#1e293b]_text-[#93c5fd]_border-[#38bdf8]_hover:bg-[#334155]]="toast.action.style === 'primary'">
                      <span>{{ toast.action.label }}</span>
                      <mat-icon class="text-xs">arrow_forward</mat-icon>
                    </button>
                  }
                  @if (toast.secondaryAction) {
                    <button
                      (click)="handleActionClick(toast, toast.secondaryAction)"
                      class="px-2.5 py-1 text-xs font-cinzel font-medium rounded-lg border border-[#4a3b2c] bg-[#1a1512] text-[#a89078] hover:text-[#e0dcc7] hover:bg-[#251f18] transition-colors">
                      {{ toast.secondaryAction.label }}
                    </button>
                  }
                </div>
              }
            </div>

            <!-- Close Dismiss Button -->
            <button
              (click)="notificationService.dismiss(toast.id)"
              class="absolute top-2.5 right-2.5 p-1 rounded-md text-[#8b6b43] hover:text-[#f3eedd] hover:bg-[#241c15] transition-colors"
              title="Fermer cette notification">
              <mat-icon class="text-base">close</mat-icon>
            </button>
          </div>

          <!-- Bottom Time-Remaining Progress Bar -->
          <div class="w-full bg-[#1e1711] h-1 rounded-full overflow-hidden mt-0.5">
            <div
              class="h-full rounded-full transition-all duration-75 ease-linear"
              [style.width.%]="(toast.remainingTime / toast.duration) * 100"
              [class.bg-[#8b6b43]]="toast.rarity === 'common'"
              [class.bg-[#38bdf8]]="toast.rarity === 'rare'"
              [class.bg-[#c084fc]]="toast.rarity === 'epic'"
              [class.bg-[#fbbf24]]="toast.rarity === 'legendary'"
              [class.bg-[#fb7185]]="toast.rarity === 'mythic'">
            </div>
          </div>

        </div>
      }

      <!-- Queue Overflow Pill -->
      @if (notificationService.queuedCount() > 0) {
        <button
          (click)="notificationService.openHistory()"
          class="pointer-events-auto px-3.5 py-1.5 rounded-full bg-[#1a1512]/95 border border-[#8b6b43] text-xs font-mono font-bold text-[#d4af37] shadow-xl hover:bg-[#241e18] transition-all flex items-center gap-1.5 animate-bounce">
          <mat-icon class="text-sm">hourglass_top</mat-icon>
          <span>+{{ notificationService.queuedCount() }} en file d'attente (voir l'historique)</span>
        </button>
      }

    </aside>

    <!-- NOTIFICATION CENTER DRAWER / HISTORIQUE (SLIDE-OVER PANEL) -->
    @if (notificationService.isHistoryOpen()) {
      <div
        class="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        
        <!-- Backdrop close click area -->
        <div
          class="flex-1"
          (click)="notificationService.closeHistory()"
          (keydown.enter)="notificationService.closeHistory()"
          tabindex="0"
          role="button"
          aria-label="Fermer le panneau"></div>

        <!-- Drawer Body -->
        <div
          class="w-full max-w-md bg-[#120f0c] border-l border-[#3a2f23] flex flex-col h-full shadow-2xl animate-in slide-in-from-right duration-300">
          
          <!-- Drawer Header -->
          <div class="p-4 sm:p-5 border-b border-[#3a2f23] flex items-center justify-between bg-[#18130f]">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-[#2a2017] border border-[#8b6b43] flex items-center justify-center text-[#d4af37]">
                <mat-icon class="text-lg">notifications_active</mat-icon>
              </div>
              <div>
                <h3 class="font-cinzel text-base font-black text-[#f3eedd]">
                  Chroniques & Notifications
                </h3>
                <p class="text-[11px] text-[#8b6b43] font-mono">
                  Événements en direct & récompenses
                </p>
              </div>
            </div>

            <div class="flex items-center gap-1.5">
              <button
                (click)="notificationService.simulateRandomEvent()"
                class="px-2.5 py-1 text-xs font-cinzel font-bold bg-[#251f18] hover:bg-[#342b22] text-[#d4af37] border border-[#8b6b43]/50 rounded-lg flex items-center gap-1 transition-colors"
                title="Générer un événement de simulation en temps réel">
                <mat-icon class="text-xs">bolt</mat-icon>
                <span>Simuler</span>
              </button>

              <button
                (click)="notificationService.closeHistory()"
                class="p-1.5 text-[#8b6b43] hover:text-[#f3eedd] rounded-lg hover:bg-[#251f18] transition-colors">
                <mat-icon class="text-lg">close</mat-icon>
              </button>
            </div>
          </div>

          <!-- Filter Navigation Tabs -->
          <div class="px-4 py-2.5 border-b border-[#2a2118] bg-[#14100c] flex items-center gap-1.5 overflow-x-auto text-xs font-cinzel font-bold">
            <button
              (click)="notificationService.setHistoryFilter('all')"
              class="px-3 py-1 rounded-md transition-all whitespace-nowrap"
              [class.bg-[#d4af37]_text-[#1a120b]]="notificationService.historyFilter() === 'all'"
              [class.text-[#8b6b43]_hover:text-[#c5a880]]="notificationService.historyFilter() !== 'all'">
              Toutes ({{ notificationService.notificationHistory().length }})
            </button>
            <button
              (click)="notificationService.setHistoryFilter('reward')"
              class="px-3 py-1 rounded-md transition-all whitespace-nowrap"
              [class.bg-[#d4af37]_text-[#1a120b]]="notificationService.historyFilter() === 'reward'"
              [class.text-[#8b6b43]_hover:text-[#c5a880]]="notificationService.historyFilter() !== 'reward'">
              Récompenses
            </button>
            <button
              (click)="notificationService.setHistoryFilter('guild')"
              class="px-3 py-1 rounded-md transition-all whitespace-nowrap"
              [class.bg-[#d4af37]_text-[#1a120b]]="notificationService.historyFilter() === 'guild'"
              [class.text-[#8b6b43]_hover:text-[#c5a880]]="notificationService.historyFilter() !== 'guild'">
              Guilde
            </button>
            <button
              (click)="notificationService.setHistoryFilter('market')"
              class="px-3 py-1 rounded-md transition-all whitespace-nowrap"
              [class.bg-[#d4af37]_text-[#1a120b]]="notificationService.historyFilter() === 'market'"
              [class.text-[#8b6b43]_hover:text-[#c5a880]]="notificationService.historyFilter() !== 'market'">
              Marché
            </button>
            <button
              (click)="notificationService.setHistoryFilter('battle')"
              class="px-3 py-1 rounded-md transition-all whitespace-nowrap"
              [class.bg-[#d4af37]_text-[#1a120b]]="notificationService.historyFilter() === 'battle'"
              [class.text-[#8b6b43]_hover:text-[#c5a880]]="notificationService.historyFilter() !== 'battle'">
              Arène
            </button>
          </div>

          <!-- Notifications History List -->
          <div class="flex-1 overflow-y-auto p-4 space-y-3">
            @if (notificationService.filteredHistory().length === 0) {
              <div class="h-64 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-[#2a2118] rounded-xl text-[#8b6b43]">
                <mat-icon class="text-4xl text-[#8b6b43]/50 mb-2">inbox</mat-icon>
                <p class="font-cinzel text-sm font-bold text-[#c5a880]">Aucune notification récente</p>
                <p class="text-xs text-[#8b6b43] mt-1 max-w-xs">
                  Les récompenses, messages de guilde et ventes au marché apparaîtront ici.
                </p>
                <button
                  (click)="notificationService.simulateRandomEvent()"
                  class="mt-4 px-3 py-1.5 bg-[#251f18] hover:bg-[#342b22] text-[#d4af37] border border-[#8b6b43]/60 rounded-lg text-xs font-cinzel font-bold">
                  Générer une notification test
                </button>
              </div>
            } @else {
              @for (item of notificationService.filteredHistory(); track item.id) {
                <div
                  class="p-3 rounded-xl bg-[#18130f] border border-[#3a2f23] hover:border-[#8b6b43] transition-colors flex gap-3">
                  
                  <div
                    class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border"
                    [class.bg-[#241a12]_border-[#8b6b43]_text-[#c5a880]]="item.rarity === 'common'"
                    [class.bg-[#0e2438]_border-[#38bdf8]_text-[#38bdf8]]="item.rarity === 'rare'"
                    [class.bg-[#28153b]_border-[#c084fc]_text-[#c084fc]]="item.rarity === 'epic'"
                    [class.bg-[#36250e]_border-[#fbbf24]_text-[#fbbf24]]="item.rarity === 'legendary'"
                    [class.bg-[#381018]_border-[#fb7185]_text-[#fb7185]]="item.rarity === 'mythic'">
                    <mat-icon class="text-base">{{ item.icon }}</mat-icon>
                  </div>

                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between gap-2">
                      <span class="text-[9px] font-mono uppercase font-bold text-[#d4af37]">
                        {{ item.badge }}
                      </span>
                      <span class="text-[10px] text-[#8b6b43] font-mono">
                        {{ formatDateTime(item.timestamp) }}
                      </span>
                    </div>

                    <h5 class="font-cinzel text-xs font-black text-[#f3eedd] truncate mt-0.5">
                      {{ item.title }}
                    </h5>

                    <p class="text-xs text-[#c5a880] mt-1 leading-relaxed font-sans">
                      {{ item.message }}
                    </p>
                  </div>

                </div>
              }
            }
          </div>

          <!-- Drawer Footer Action Toolbar -->
          <div class="p-4 border-t border-[#3a2f23] bg-[#18130f] flex items-center justify-between">
            <button
              (click)="notificationService.clearHistory()"
              class="text-xs text-[#ff6b6b] hover:text-[#ff9999] transition-colors font-cinzel font-bold flex items-center gap-1">
              <mat-icon class="text-sm">delete_outline</mat-icon>
              <span>Vider le registre</span>
            </button>

            <button
              (click)="notificationService.closeHistory()"
              class="px-4 py-1.5 bg-[#251f18] hover:bg-[#342b22] text-[#e0dcc7] border border-[#8b6b43] rounded-lg text-xs font-cinzel font-bold">
              Fermer
            </button>
          </div>

        </div>

      </div>
    }
  `,
})
export class ToastContainerComponent {
  readonly notificationService = inject(ToastNotificationService);
  readonly navigate = output<NavView>();

  formatTime(date: Date): string {
    if (!date) return '';
    try {
      const d = date instanceof Date ? date : new Date(date);
      return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }

  formatDateTime(date: Date): string {
    if (!date) return '';
    try {
      const d = date instanceof Date ? date : new Date(date);
      return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }

  handleActionClick(toast: ToastNotification, action: ToastAction | undefined) {
    if (!action) return;
    if (action.callback) {
      action.callback();
    }
    if (action.view) {
      this.navigate.emit(action.view);
    }
    this.notificationService.dismiss(toast.id);
  }
}
