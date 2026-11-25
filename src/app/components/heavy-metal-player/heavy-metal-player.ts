import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { SoundService, BUILTIN_METAL_TRACKS } from '../../services/sound';
import { ToastNotificationService } from '../../services/toast-notification';

@Component({
  selector: 'app-heavy-metal-player',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule],
  template: `
    @let track = sound.currentTrack();
    @let isPlaying = sound.isMusicPlaying();
    @let isGen = sound.isGeneratingAi();

    <!-- COMPACT FLOATING METAL JUKEBOX DOCK (Bottom Right) -->
    <div class="fixed bottom-4 right-4 z-40 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3">
      
      <!-- Mini Bar -->
      <div class="bg-[#140e0a]/95 backdrop-blur-md border border-[#8b2b2b] hover:border-[#ff4d4d] rounded-2xl p-2.5 shadow-2xl flex items-center gap-3 transition-all duration-200">
        
        <!-- Animated Visualizer & Play/Pause Button -->
        <button
          id="toggle-metal-music-btn"
          type="button"
          (click)="sound.toggleMusicPlayback()"
          class="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#8b2b2b] to-[#4a1212] border border-[#ff4d4d]/60 text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform group"
          [attr.aria-label]="isPlaying ? 'Mettre en pause le heavy metal' : 'Lancer le heavy metal'">
          @if (isPlaying) {
            <mat-icon class="text-xl">pause</mat-icon>
          } @else {
            <mat-icon class="text-xl group-hover:text-[#ffd700] transition-colors">play_arrow</mat-icon>
          }

          @if (isPlaying) {
            <span class="absolute -top-1 -right-1 flex h-3 w-3">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff4d4d] opacity-75"></span>
              <span class="relative inline-flex rounded-full h-3 w-3 bg-[#ff4d4d]"></span>
            </span>
          }
        </button>

        <!-- Track Info & Visualizer Button -->
        <button
          type="button"
          class="text-left select-none max-w-[150px] sm:max-w-[200px] hover:opacity-90 transition-opacity"
          (click)="showJukeboxModal.set(true)"
          aria-label="Ouvrir les détails de la piste et le jukebox">
          <div class="flex items-center gap-1.5">
            <span class="text-[#ff4d4d] text-xs font-bold font-cinzel tracking-wider flex items-center gap-1.5">
              <img
                src="/src/assets/images/emblem_bard_lute_metal_1795189810523.jpg"
                alt="Luth de Guerre"
                class="w-4 h-4 rounded object-cover border border-[#ff4d4d]/60 shrink-0"
                referrerpolicy="no-referrer" />
              <span class="truncate">{{ track.title }}</span>
            </span>
          </div>

          <div class="flex items-center gap-2 mt-0.5">
            <!-- Mini Equalizer Bars -->
            <div class="flex items-end gap-0.5 h-3">
              @for (h of sound.visualizerBars().slice(0, 6); track $index) {
                <div
                  class="w-1 bg-[#ff4d4d] rounded-t-sm transition-all duration-75"
                  [style.height.%]="isPlaying ? h : 20"></div>
              }
            </div>
            <span class="text-[10px] font-mono text-[#a89078] truncate">{{ track.genre }}</span>
          </div>
        </button>

        <!-- Controls: Next & Forge Jukebox -->
        <div class="flex items-center gap-1 pl-1 border-l border-[#3a2f23]">
          <button
            type="button"
            (click)="sound.nextTrack()"
            class="p-1.5 text-[#a89078] hover:text-[#ff4d4d] hover:bg-[#251815] rounded-lg transition-colors"
            title="Morceau suivant">
            <mat-icon class="text-base">skip_next</mat-icon>
          </button>

          <button
            type="button"
            (click)="showJukeboxModal.set(true)"
            class="px-2.5 py-1.5 bg-[#251815] hover:bg-[#3d1818] border border-[#ff4d4d]/40 hover:border-[#ff4d4d] text-[#ff9999] hover:text-white rounded-lg text-xs font-cinzel font-bold flex items-center gap-1 transition-all shadow-md"
            title="Ouvrir le Jukebox Heavy Metal & Générateur Lyria AI">
            <mat-icon class="text-xs text-[#ffd700]">auto_awesome</mat-icon>
            <span class="hidden sm:inline">Forge IA</span>
          </button>
        </div>

      </div>
    </div>

    <!-- FULL HEAVY METAL JUKEBOX & LYRIA GENERATOR MODAL -->
    @if (showJukeboxModal()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in">
        <div class="bg-[#120c09] border-2 border-[#8b2b2b] rounded-2xl max-w-2xl w-full p-6 shadow-2xl text-[#e0dcc7] space-y-6 max-h-[92vh] overflow-y-auto">
          
          <!-- Modal Header -->
          <div class="flex items-center justify-between pb-3 border-b border-[#3a2f23]">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-xl bg-gradient-to-br from-[#8b2b2b] to-[#251815] border border-[#ff4d4d] overflow-hidden shadow-lg shrink-0">
                <img
                  src="/src/assets/images/emblem_bard_lute_metal_1795189810523.jpg"
                  alt="Jukebox Heavy Metal"
                  class="w-full h-full object-cover"
                  referrerpolicy="no-referrer" />
              </div>
              <div>
                <h2 class="font-cinzel text-lg font-black text-[#ff9999] flex items-center gap-2">
                  Jukebox Heavy Metal & Lyria IA
                </h2>
                <p class="text-xs font-serif text-[#a89078]">Bande originale heavy metal & forge musicale Lyria pour Aetheria</p>
              </div>
            </div>
            <button
              type="button"
              (click)="showJukeboxModal.set(false)"
              class="text-[#a89078] hover:text-white p-1 rounded-lg hover:bg-[#251815]">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <!-- Active Playing Track Banner -->
          <div class="p-4 bg-[#1a0f0d] border border-[#8b2b2b]/80 rounded-xl space-y-3 relative overflow-hidden shadow-inner">
            <div class="absolute -right-8 -top-8 w-32 h-32 bg-[#ff4d4d]/10 rounded-full blur-2xl pointer-events-none"></div>

            <div class="flex items-start justify-between gap-3">
              <div>
                <div class="text-[10px] font-cinzel font-bold text-[#ff4d4d] uppercase tracking-widest flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-[#ff4d4d] animate-ping"></span>
                  Piste en lecture actuelle
                </div>
                <div class="font-cinzel text-base font-black text-white mt-1">
                  {{ track.title }}
                </div>
                <div class="text-xs font-mono text-[#c5a880] mt-0.5">
                  {{ track.artist }} • {{ track.genre }} @if (track.bpm) { • {{ track.bpm }} BPM }
                </div>
              </div>

              <!-- Master Controls -->
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  (click)="sound.previousTrack()"
                  class="p-2 bg-[#251815] hover:bg-[#3d1818] border border-[#3a2f23] rounded-lg text-[#c5a880] hover:text-white"
                  title="Piste précédente">
                  <mat-icon class="text-base">skip_previous</mat-icon>
                </button>

                <button
                  type="button"
                  (click)="sound.toggleMusicPlayback()"
                  class="px-4 py-2 bg-gradient-to-r from-[#8b2b2b] to-[#d43f3f] hover:from-[#d43f3f] hover:to-[#ff4d4d] text-white font-cinzel font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5">
                  <mat-icon class="text-base">{{ isPlaying ? 'pause' : 'play_arrow' }}</mat-icon>
                  <span>{{ isPlaying ? 'Pause' : 'Lecture' }}</span>
                </button>

                <button
                  type="button"
                  (click)="sound.nextTrack()"
                  class="p-2 bg-[#251815] hover:bg-[#3d1818] border border-[#3a2f23] rounded-lg text-[#c5a880] hover:text-white"
                  title="Piste suivante">
                  <mat-icon class="text-base">skip_next</mat-icon>
                </button>
              </div>
            </div>

            <!-- Equalizer Visualization Waveform -->
            <div class="pt-2 border-t border-[#3a2f23]/60 flex items-center justify-between gap-2">
              <div class="flex items-end gap-1 h-6 flex-1">
                @for (h of sound.visualizerBars(); track $index) {
                  <div
                    class="flex-1 bg-gradient-to-t from-[#8b2b2b] to-[#ff4d4d] rounded-t-sm transition-all duration-100"
                    [style.height.%]="isPlaying ? h : 15"></div>
                }
              </div>

              <button
                type="button"
                (click)="sound.playGuitarSoloRiff()"
                class="px-2.5 py-1 bg-[#251815] hover:bg-[#3d1818] border border-[#ff4d4d]/40 rounded-lg text-[11px] font-cinzel text-[#ffd700] hover:text-white whitespace-nowrap shadow inline-flex items-center gap-1">
                <mat-icon class="text-xs text-[#ffd700]">bolt</mat-icon>
                <span>Solo Riff Test</span>
              </button>
            </div>

            @if (track.lyrics) {
              <div class="bg-[#120c09] p-3 rounded-lg border border-[#3a2f23] text-xs text-[#c5a880] font-mono leading-relaxed max-h-24 overflow-y-auto">
                <div class="text-[10px] font-cinzel text-[#ff4d4d] uppercase font-bold mb-1">Paroles / Chant de Bataille :</div>
                "{{ track.lyrics }}"
              </div>
            }
          </div>

          <!-- GENERATE NEW MUSIC WITH LYRIA (AI) -->
          <div class="bg-[#18110c] border border-[#d4af37]/60 rounded-xl p-5 space-y-4 shadow-lg">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <mat-icon class="text-[#d4af37]">auto_awesome</mat-icon>
                <h3 class="font-cinzel text-sm font-bold text-[#d4af37] uppercase tracking-wider">
                  Générer une Musique Heavy Metal (Lyria AI)
                </h3>
              </div>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-[#251f18] text-[#d4af37] border border-[#d4af37]/40">
                Lyria Clip & Pro
              </span>
            </div>

            <!-- Subgenre Quick Presets -->
            <div>
              <div class="text-xs font-cinzel text-[#a89078] mb-1.5 font-bold">Style / Sous-genre Métal :</div>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                @for (preset of subgenrePresets; track preset.label) {
                  <button
                    type="button"
                    (click)="selectPreset(preset)"
                    class="p-2 rounded-lg border text-left transition-all text-xs font-cinzel"
                    [class.bg-[#8b2b2b]/30_border-[#ff4d4d]_text-white]="selectedPreset() === preset.label"
                    [class.bg-[#120c09]_border-[#3a2f23]_text-[#a89078]_hover:text-[#e0dcc7]]="selectedPreset() !== preset.label">
                    <div class="font-bold flex items-center gap-1.5">
                      <mat-icon class="text-sm text-[#ff7777]">{{ preset.icon }}</mat-icon>
                      <span>{{ preset.label }}</span>
                    </div>
                    <div class="text-[9px] font-sans text-[#8b6b43] mt-0.5 truncate">{{ preset.hint }}</div>
                  </button>
                }
              </div>
            </div>

            <!-- Model choice: Clip (30s) or Pro (Full Track) -->
            <div class="grid grid-cols-2 gap-3">
              <button
                type="button"
                (click)="selectedModel.set('lyria-3-clip-preview')"
                class="p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all"
                [class.bg-[#8b2b2b]/30_border-[#ff4d4d]_text-white]="selectedModel() === 'lyria-3-clip-preview'"
                [class.bg-[#120c09]_border-[#3a2f23]_text-[#a89078]]="selectedModel() !== 'lyria-3-clip-preview'">
                <mat-icon class="text-base text-[#ff9999] mt-0.5">timer</mat-icon>
                <div>
                  <div class="text-xs font-cinzel font-bold">Lyria Clip (30s)</div>
                  <div class="text-[10px] text-[#8b6b43]">Idéal pour les combats & intros rapides</div>
                </div>
              </button>

              <button
                type="button"
                (click)="selectedModel.set('lyria-3-pro-preview')"
                class="p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all"
                [class.bg-[#8b2b2b]/30_border-[#ff4d4d]_text-white]="selectedModel() === 'lyria-3-pro-preview'"
                [class.bg-[#120c09]_border-[#3a2f23]_text-[#a89078]]="selectedModel() !== 'lyria-3-pro-preview'">
                <mat-icon class="text-base text-[#ffd700] mt-0.5">album</mat-icon>
                <div>
                  <div class="text-xs font-cinzel font-bold">Lyria Pro (Complet)</div>
                  <div class="text-[10px] text-[#8b6b43]">Morceau complet haute fidélité</div>
                </div>
              </button>
            </div>

            <!-- Custom Prompt Input -->
            <div>
              <label for="custom-prompt-input" class="block text-xs font-cinzel text-[#a89078] mb-1 font-bold">Description / Ambiance du morceau :</label>
              <input
                #promptInput
                id="custom-prompt-input"
                type="text"
                [value]="customPrompt()"
                (input)="customPrompt.set(promptInput.value)"
                placeholder="Ex: Riff de guitare incisif en Drop-D, double grosse caisse furieuse et solo de guitare électrique pour duel légendaire"
                class="w-full bg-[#120c09] border border-[#3a2f23] focus:border-[#ff4d4d] rounded-xl px-3 py-2 text-xs text-[#e0dcc7] outline-none shadow-inner" />
            </div>

            <!-- Generate Action Button -->
            <button
              type="button"
              (click)="generateCustomTrack()"
              [disabled]="isGen"
              class="w-full py-3 bg-gradient-to-r from-[#d4af37] via-[#e65100] to-[#b71c1c] hover:brightness-110 disabled:opacity-50 text-stone-950 font-cinzel font-black text-xs rounded-xl shadow-xl flex items-center justify-center gap-2 transition-all">
              @if (isGen) {
                <mat-icon class="animate-spin text-base">sync</mat-icon>
                <span>Composition en cours par Lyria IA...</span>
              } @else {
                <mat-icon class="text-base">auto_awesome</mat-icon>
                <span>Générer le Morceau Heavy Metal (Lyria)</span>
              }
            </button>
          </div>

          <!-- BUILTIN & SAVED TRACKS LIST -->
          <div class="space-y-3">
            <div class="flex items-center justify-between text-xs font-cinzel font-bold text-[#a89078] uppercase">
              <span>Pistes Disponibles</span>
              <span class="font-mono text-[10px]">{{ allTracks().length }} morceaux</span>
            </div>

            <div class="space-y-2 max-h-48 overflow-y-auto pr-1">
              @for (t of allTracks(); track t.id) {
                <button
                  type="button"
                  (click)="sound.playHeavyMetalTrack(t)"
                  class="w-full p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-left"
                  [class.bg-[#251815]_border-[#ff4d4d]_text-white]="t.id === track.id"
                  [class.bg-[#16100c]_border-[#3a2f23]_text-[#c5a880]_hover:border-[#8b2b2b]]="t.id !== track.id">
                  
                  <div class="flex items-center gap-3">
                    <div
                      class="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                      [class.bg-[#ff4d4d]_text-white]="t.id === track.id"
                      [class.bg-[#1e1612]_text-[#8b6b43]]="t.id !== track.id">
                      @if (t.id === track.id && isPlaying) {
                        <mat-icon class="text-base">volume_up</mat-icon>
                      } @else {
                        <mat-icon class="text-base">{{ t.type === 'ai' ? 'auto_awesome' : 'music_note' }}</mat-icon>
                      }
                    </div>

                    <div>
                      <div class="font-cinzel text-xs font-bold leading-tight">{{ t.title }}</div>
                      <div class="text-[10px] font-mono text-[#8b6b43]">{{ t.genre }} • {{ t.artist }}</div>
                    </div>
                  </div>

                  <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 rounded text-[9px] font-mono border"
                      [class.bg-[#ff4d4d]/20_border-[#ff4d4d]_text-[#ff9999]]="t.type === 'ai'"
                      [class.bg-[#251f18]_border-[#3a2f23]_text-[#8b6b43]]="t.type !== 'ai'">
                      {{ t.type === 'ai' ? 'Lyria IA' : 'Synthèse Riff' }}
                    </span>

                    <span
                      class="p-1.5 rounded-lg bg-[#251815] text-[#c5a880]">
                      <mat-icon class="text-base">{{ t.id === track.id && isPlaying ? 'pause' : 'play_arrow' }}</mat-icon>
                    </span>
                  </div>
                </button>
              }
            </div>
          </div>

          <!-- Close Footer -->
          <div class="flex justify-end pt-3 border-t border-[#3a2f23]">
            <button
              type="button"
              (click)="showJukeboxModal.set(false)"
              class="px-6 py-2 bg-[#251815] hover:bg-[#3d1818] text-[#c5a880] hover:text-white font-cinzel font-bold text-xs rounded-xl border border-[#3a2f23]">
              Fermer le Jukebox
            </button>
          </div>

        </div>
      </div>
    }
  `,
})
export class HeavyMetalPlayerComponent {
  readonly sound = inject(SoundService);
  readonly notification = inject(ToastNotificationService);

  readonly showJukeboxModal = signal<boolean>(false);
  readonly selectedModel = signal<'lyria-3-clip-preview' | 'lyria-3-pro-preview'>('lyria-3-clip-preview');
  readonly selectedPreset = signal<string>('Thrash Metal');
  readonly customPrompt = signal<string>(
    'Riff de guitare acéré en Drop-D avec batterie double pédale intense et solo de guitare électrique incendiaire pour combat de boss.',
  );

  readonly subgenrePresets = [
    {
      label: 'Thrash Metal',
      icon: 'local_fire_department',
      hint: 'Fast 160 BPM, double-kick, Drop-D power riffs',
      prompt: 'Fast and aggressive thrash metal battle soundtrack with palm-muted guitar riffs, screaming solos, and double-bass drum blasts.',
    },
    {
      label: 'Power Metal',
      icon: 'swords',
      hint: 'Twin guitar harmonies, galloping beat, heroic',
      prompt: 'Epic power metal battle theme with triumphant twin guitar harmonies, soaring guitar leads, and galloping drums.',
    },
    {
      label: 'Doom Metal',
      icon: 'coronavirus',
      hint: 'Slow crushing riffs, heavy bass, dark atmospheric',
      prompt: 'Heavy downtuned doom metal chugs with crushing bass, thunderous half-time drums, and dark cathedral atmosphere.',
    },
    {
      label: 'Symphonic Metal',
      icon: 'workspace_premium',
      hint: 'Epic brass & choir combined with blast beat metal',
      prompt: 'Symphonic blackened heavy metal with blistering guitar shredding, blast beats, orchestral brass, and epic boss choir.',
    },
  ];

  allTracks() {
    return [...BUILTIN_METAL_TRACKS, ...this.sound.savedAiTracks()];
  }

  selectPreset(preset: (typeof this.subgenrePresets)[0]) {
    this.selectedPreset.set(preset.label);
    this.customPrompt.set(preset.prompt);
  }

  async generateCustomTrack() {
    try {
      this.notification.showSystem(
        'Forge Musicale Lyria',
        'Composition d\'un morceau Heavy Metal en cours via Lyria IA...',
        'auto_awesome'
      );

      const track = await this.sound.generateLyriaMetalTrack({
        prompt: this.customPrompt(),
        model: this.selectedModel(),
        subGenre: this.selectedPreset(),
        customTitle: `Métal IA: ${this.selectedPreset()}`,
      });

      this.notification.showReward(
        'Nouveau Morceau Heavy Metal Forgé !',
        `"${track.title}" est maintenant prêt et en cours de lecture.`,
        { badge: 'LYRIA IA', rarity: 'epic', icon: 'music_note' }
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur de génération';
      this.notification.showSystem(
        'Échec de la Forge Lyria',
        message,
        'error'
      );
    }
  }
}
