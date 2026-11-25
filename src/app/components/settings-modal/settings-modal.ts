import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../services/game-state';
import { SoundService, BUILTIN_METAL_TRACKS } from '../../services/sound';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-settings-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule],
  template: `
    @let s = sound.settings();
    @let isPlaying = sound.isMusicPlaying();
    @let currentTrack = sound.currentTrack();

    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 md:p-6 animate-in fade-in select-none">
      <div class="bg-gradient-to-b from-[#211a14] via-[#16120d] to-[#0c0a07] border-2 border-[#8b6b43] rounded-2xl max-w-xl w-full p-5 md:p-7 shadow-[0_0_50px_rgba(0,0,0,0.9),0_0_20px_rgba(212,175,55,0.25)] text-[#e0dcc7] space-y-5 max-h-[92vh] overflow-y-auto relative">
        
        <!-- Gothic Top Filigree & Wax Seal Badge -->
        <div class="flex items-center justify-between pb-3.5 border-b border-[#3a2f23]">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2e2319] to-[#120d09] border border-[#d4af37] flex items-center justify-center text-[#d4af37] shadow-md">
              <mat-icon class="text-xl">tune</mat-icon>
            </div>
            <div>
              <div class="text-[10px] font-mono uppercase tracking-widest text-[#d4af37] font-bold flex items-center gap-1.5">
                <mat-icon class="text-xs">shield</mat-icon>
                <span>HARMONIE DU ROYAUME</span>
              </div>
              <h2 class="font-cinzel text-lg md:text-xl font-black text-white tracking-wide">
                Console Sonore & Volume Équilibré
              </h2>
            </div>
          </div>
          
          <button
            (click)="onClose()"
            class="medieval-btn p-1.5 bg-[#17120d] text-[#8b6b43] hover:text-[#ffd700] rounded-lg border border-[#3a2f23]"
            title="Fermer la console">
            <mat-icon class="text-lg">close</mat-icon>
          </button>
        </div>

        <!-- BALANCED AUDIO PRESETS (One-click presets) -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between text-xs font-cinzel font-bold text-[#c5a880]">
            <span class="flex items-center gap-1.5">
              <mat-icon class="text-sm text-[#d4af37]">auto_fix_high</mat-icon>
              Équilibre Prédéfini
            </span>
            <span class="text-[10px] font-mono text-[#8b6b43]">1 Clic = Balance Optimale</span>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              (click)="sound.applyBalancedPreset('balanced')"
              class="medieval-btn p-2 rounded-xl border text-center flex flex-col items-center justify-center gap-0.5 group"
              title="Musique douce, effets clairs et clics distincts">
              <mat-icon class="text-base text-[#d4af37] group-hover:scale-110 transition-transform">balance</mat-icon>
              <span class="font-cinzel text-[11px] font-bold text-white">Équilibré</span>
              <span class="text-[9px] font-mono text-[#c5a880]">Recommandé</span>
            </button>

            <button
              (click)="sound.applyBalancedPreset('tavern')"
              class="medieval-btn p-2 rounded-xl border text-center flex flex-col items-center justify-center gap-0.5 group"
              title="Musique de taverne & ambiance de foyer mises en avant">
              <mat-icon class="text-base text-amber-400 group-hover:scale-110 transition-transform">sports_bar</mat-icon>
              <span class="font-cinzel text-[11px] font-bold text-white">Taverne</span>
              <span class="text-[9px] font-mono text-amber-300">Immersion</span>
            </button>

            <button
              (click)="sound.applyBalancedPreset('battle')"
              class="crimson-btn p-2 rounded-xl border text-center flex flex-col items-center justify-center gap-0.5 group"
              title="Bataille percutante : sorts puissants et chocs d'épées intenses">
              <mat-icon class="text-base text-[#ff9999] group-hover:scale-110 transition-transform">swords</mat-icon>
              <span class="font-cinzel text-[11px] font-bold text-white">Duel Épique</span>
              <span class="text-[9px] font-mono text-[#ff9999]">Guerre 100%</span>
            </button>

            <button
              (click)="sound.applyBalancedPreset('quiet')"
              class="medieval-btn p-2 rounded-xl border text-center flex flex-col items-center justify-center gap-0.5 group"
              title="Volume discret et apaisé pour jouer sans déranger">
              <mat-icon class="text-base text-sky-400 group-hover:scale-110 transition-transform">nightlight</mat-icon>
              <span class="font-cinzel text-[11px] font-bold text-white">Nocturne</span>
              <span class="text-[9px] font-mono text-sky-300">Discret</span>
            </button>
          </div>
        </div>

        <!-- 5 COMPREHENSIVE BALANCED SLIDERS -->
        <div class="p-4 bg-[#120d09] border border-[#3a2f23] rounded-xl space-y-4 shadow-inner">
          
          <!-- Channel 1: Master Volume -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <span class="font-cinzel text-xs font-bold text-white flex items-center gap-1.5">
                <mat-icon class="text-sm text-[#d4af37]">volume_up</mat-icon>
                Volume Général (Master)
              </span>
              <div class="flex items-center gap-2">
                @if (s.muted) {
                  <span class="px-2 py-0.5 bg-[#8b2b2b] text-white font-mono text-[10px] rounded font-bold">MUET</span>
                }
                <span class="font-mono text-xs text-[#d4af37] font-bold w-12 text-right">{{ s.masterVolume }}%</span>
              </div>
            </div>
            <input
              #masterRange
              type="range"
              min="0"
              max="100"
              [value]="s.masterVolume"
              (input)="onSliderChange('masterVolume', +masterRange.value)"
              class="medieval-slider" />
          </div>

          <!-- Channel 2: Music Volume -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <span class="font-cinzel text-xs font-bold text-[#e0dcc7] flex items-center gap-1.5">
                <mat-icon class="text-sm text-[#ff7777]">music_note</mat-icon>
                Musique & Bandes-Son
              </span>
              <span class="font-mono text-xs text-[#ff9999] font-bold w-12 text-right">{{ s.musicVolume }}%</span>
            </div>
            <input
              #musicRange
              type="range"
              min="0"
              max="100"
              [value]="s.musicVolume"
              (input)="onSliderChange('musicVolume', +musicRange.value)"
              class="medieval-slider" />
          </div>

          <!-- Channel 3: SFX Combat -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <span class="font-cinzel text-xs font-bold text-[#e0dcc7] flex items-center gap-1.5">
                <mat-icon class="text-sm text-amber-400">shield</mat-icon>
                Effets de Combat & Sorts (SFX)
              </span>
              <span class="font-mono text-xs text-amber-300 font-bold w-12 text-right">{{ s.sfxVolume }}%</span>
            </div>
            <input
              #sfxRange
              type="range"
              min="0"
              max="100"
              [value]="s.sfxVolume"
              (input)="onSliderChange('sfxVolume', +sfxRange.value)"
              class="medieval-slider" />
          </div>

          <!-- Channel 4: GUI & Tactile Clicks -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <span class="font-cinzel text-xs font-bold text-[#e0dcc7] flex items-center gap-1.5">
                <mat-icon class="text-sm text-[#c5a880]">touch_app</mat-icon>
                Interface & Clics GUI Rétro-Tactiles
              </span>
              <span class="font-mono text-xs text-[#c5a880] font-bold w-12 text-right">{{ s.uiVolume ?? 75 }}%</span>
            </div>
            <input
              #uiRange
              type="range"
              min="0"
              max="100"
              [value]="s.uiVolume ?? 75"
              (input)="onSliderChange('uiVolume', +uiRange.value)"
              class="medieval-slider" />
          </div>

          <!-- Channel 5: Kingdom Ambiance -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <span class="font-cinzel text-xs font-bold text-[#e0dcc7] flex items-center gap-1.5">
                <mat-icon class="text-sm text-emerald-400">fireplace</mat-icon>
                Ambiance du Foyer & Murmures
              </span>
              <span class="font-mono text-xs text-emerald-300 font-bold w-12 text-right">{{ s.ambientVolume ?? 65 }}%</span>
            </div>
            <input
              #ambientRange
              type="range"
              min="0"
              max="100"
              [value]="s.ambientVolume ?? 65"
              (input)="onSliderChange('ambientVolume', +ambientRange.value)"
              class="medieval-slider" />
          </div>

        </div>

        <!-- LIVE SOUND TEST CHANNELS -->
        <div class="space-y-1.5">
          <div class="text-[11px] font-cinzel font-bold text-[#8b6b43] uppercase flex items-center gap-1">
            <mat-icon class="text-xs">play_circle</mat-icon>
            Tester les Canaux Sonores
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              (click)="sound.playSwordHit(); sound.playClick('crimson')"
              class="medieval-btn py-2 px-2 text-[10px] font-cinzel font-bold text-[#ff9999] rounded-lg border border-[#5c2424] flex items-center justify-center gap-1">
              <mat-icon class="text-xs">swords</mat-icon>
              <span>Fer &amp; Épée</span>
            </button>
            <button
              (click)="sound.playSpellBlast(); sound.playClick('gold')"
              class="medieval-btn py-2 px-2 text-[10px] font-cinzel font-bold text-amber-300 rounded-lg border border-[#8b6b43] flex items-center justify-center gap-1">
              <mat-icon class="text-xs">local_fire_department</mat-icon>
              <span>Sort Runique</span>
            </button>
            <button
              (click)="sound.playClick('gold')"
              class="gold-btn py-2 px-2 text-[10px] font-cinzel font-bold text-black rounded-lg flex items-center justify-center gap-1">
              <mat-icon class="text-xs">notifications_active</mat-icon>
              <span>Clic Doré</span>
            </button>
            <button
              (click)="sound.playVictory(); sound.playClick('crimson')"
              class="crimson-btn py-2 px-2 text-[10px] font-cinzel font-bold text-white rounded-lg flex items-center justify-center gap-1">
              <mat-icon class="text-xs">workspace_premium</mat-icon>
              <span>Fanfare</span>
            </button>
          </div>
        </div>

        <!-- TRACK SELECTOR FOR MUSIC ENTHUSIASTS -->
        <div class="p-3 bg-[#120d09] border border-[#3a2f23] rounded-xl space-y-2">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <img
                src="/src/assets/images/emblem_bard_lute_metal_1795189810523.jpg"
                alt="Luth de Guerre"
                class="w-6 h-6 rounded-md object-cover border border-[#ff4d4d]/60 shrink-0"
                referrerpolicy="no-referrer" />
              <div class="font-cinzel text-xs font-bold text-[#ff9999] truncate">
                {{ currentTrack.title }}
              </div>
            </div>
            <button
              (click)="sound.toggleMusicPlayback()"
              class="crimson-btn px-3 py-1 rounded-lg text-xs font-cinzel font-bold flex items-center gap-1">
              <mat-icon class="text-xs">{{ isPlaying ? 'pause' : 'play_arrow' }}</mat-icon>
              <span>{{ isPlaying ? 'Pause' : 'Jouer' }}</span>
            </button>
          </div>

          <div class="grid grid-cols-2 gap-1.5 pt-1">
            @for (t of builtinTracks; track t.id) {
              <button
                (click)="sound.playHeavyMetalTrack(t); sound.playClick('default')"
                class="medieval-btn p-1.5 rounded-lg border text-left text-[11px] font-cinzel truncate flex items-center justify-between"
                [class.border-[#d4af37]]="t.id === currentTrack.id"
                [class.text-[#ffd700]]="t.id === currentTrack.id">
                <span class="truncate">{{ t.title }}</span>
                @if (t.id === currentTrack.id && isPlaying) {
                  <mat-icon class="text-xs text-[#d4af37] shrink-0">equalizer</mat-icon>
                }
              </button>
            }
          </div>
        </div>

        <!-- REPLAY ENTRANCE ANIMATION BUTTON -->
        <div class="p-3 bg-[#17120d] border border-[#8b6b43]/50 rounded-xl flex items-center justify-between shadow-sm">
          <div class="flex items-center gap-2.5">
            <mat-icon class="text-xl text-[#d4af37]">meeting_room</mat-icon>
            <div>
              <div class="text-xs font-cinzel font-bold text-white">Portes Royales de la Citadelle</div>
              <div class="text-[10px] text-[#8b6b43] font-serif">Rejouer l'animation cinématique 3D d'ouverture et fanfare</div>
            </div>
          </div>
          <button
            (click)="replayEntrance()"
            class="gold-btn px-3 py-1.5 rounded-lg text-xs font-cinzel font-bold flex items-center gap-1 shadow">
            <span>Rejouer</span>
            <mat-icon class="text-xs">play_arrow</mat-icon>
          </button>
        </div>

        <!-- FOOTER ACTIONS -->
        <div class="flex items-center justify-between pt-3 border-t border-[#3a2f23]">
          <button
            (click)="sound.toggleMute()"
            class="medieval-btn px-4 py-2 font-cinzel text-xs font-bold rounded-xl flex items-center gap-2"
            [class.text-[#ff4d4d]]="s.muted"
            [class.border-[#8b2b2b]]="s.muted">
            <mat-icon class="text-base">{{ s.muted ? 'volume_off' : 'volume_up' }}</mat-icon>
            <span>{{ s.muted ? 'Rétablir le Son' : 'Couper le Son (Muet)' }}</span>
          </button>

          <button
            (click)="onClose()"
            class="gold-btn px-7 py-2.5 rounded-xl font-cinzel font-black text-xs uppercase tracking-wider shadow-lg">
            Valider & Fermer
          </button>
        </div>

      </div>
    </div>
  `,
})
export class SettingsModal {
  readonly sound = inject(SoundService);
  readonly gameState = inject(GameStateService);
  readonly modalClose = output<void>();

  readonly builtinTracks = BUILTIN_METAL_TRACKS;

  onSliderChange(key: 'masterVolume' | 'musicVolume' | 'sfxVolume' | 'uiVolume' | 'ambientVolume', val: number) {
    this.sound.updateSettings({ [key]: +val });
    this.sound.previewChannel(key);
  }

  replayEntrance() {
    this.sound.playClick('crimson');
    this.modalClose.emit();
    this.gameState.triggerEntranceCinematic();
  }

  onClose() {
    this.sound.playClick('default');
    this.modalClose.emit();
  }
}
