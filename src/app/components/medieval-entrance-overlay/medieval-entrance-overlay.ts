import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { SoundService } from '../../services/sound';
import { GameStateService } from '../../services/game-state';

@Component({
  selector: 'app-medieval-entrance-overlay',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule],
  template: `
    @if (isVisible()) {
      <div
        class="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-black select-none transition-opacity duration-700"
        [class.opacity-0]="isFadingOut()"
        [class.pointer-events-none]="isFadingOut()">
        
        <!-- Background Radial Light Glow behind the gates (revealed when gates part) -->
        <div class="absolute inset-0 bg-[#0a0806] flex items-center justify-center overflow-hidden pointer-events-none">
          <!-- Ambient Kingdom Castle Backdrop -->
          <div
            class="absolute inset-0 bg-cover bg-center opacity-40 transition-transform duration-1000 scale-105"
            style="background-image: radial-gradient(circle at center, rgba(212,175,55,0.2) 0%, rgba(10,8,6,0.95) 75%);">
          </div>

          <!-- Radiant Golden Explosion of Divine Light when Gates Open -->
          @if (isOpening()) {
            <div class="absolute w-[600px] h-[600px] md:w-[900px] md:h-[900px] rounded-full bg-[radial-gradient(circle,rgba(255,223,128,0.9)_0%,rgba(212,175,55,0.5)_40%,transparent_70%)] animate-light-burst pointer-events-none z-10"></div>
            <div class="absolute w-[500px] h-[500px] md:w-[750px] md:h-[750px] rounded-full border-4 border-[#ffd700] animate-runic-shockwave pointer-events-none z-10"></div>
          }
        </div>

        <!-- 3D PERSPECTIVE GATE CONTAINER -->
        <div class="absolute inset-0 flex w-full h-full [perspective:1400px] overflow-hidden" [class.animate-impact-shake]="isOpening()">
          
          <!-- LEFT GATE WING -->
          <div
            class="w-1/2 h-full relative origin-left transition-all duration-1000 border-r-2 border-[#120d08] shadow-[15px_0_35px_rgba(0,0,0,0.9)] z-20 flex flex-col justify-between p-6 sm:p-10"
            [class.animate-gate-left]="isOpening()"
            style="background: linear-gradient(135deg, #18120c 0%, #251b12 40%, #150f0a 100%);">
            
            <!-- Heavy Timber Texture Lines -->
            <div class="absolute inset-0 opacity-15 pointer-events-none"
              style="background-image: repeating-linear-gradient(90deg, #000 0px, #000 3px, transparent 3px, transparent 48px);">
            </div>

            <!-- Heavy Forged Iron Straps & Diamond Rivets (Top, Mid, Bottom) -->
            <div class="absolute top-16 left-0 right-0 h-10 bg-gradient-to-b from-[#3a2d20] via-[#1a140d] to-[#0a0705] border-y border-[#5a4632] flex items-center justify-around px-8 shadow-lg">
              <span class="w-3.5 h-3.5 rounded-full bg-[#150f0b] border border-[#7a6045] shadow-inner"></span>
              <span class="w-3.5 h-3.5 rounded-full bg-[#150f0b] border border-[#7a6045] shadow-inner"></span>
              <span class="w-3.5 h-3.5 rounded-full bg-[#150f0b] border border-[#7a6045] shadow-inner"></span>
              <span class="w-3.5 h-3.5 rounded-full bg-[#150f0b] border border-[#7a6045] shadow-inner"></span>
            </div>

            <div class="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-12 bg-gradient-to-b from-[#3a2d20] via-[#1a140d] to-[#0a0705] border-y border-[#5a4632] flex items-center justify-around px-8 shadow-lg">
              <span class="w-4 h-4 rounded-full bg-[#150f0b] border border-[#7a6045] shadow-inner"></span>
              <span class="w-4 h-4 rounded-full bg-[#150f0b] border border-[#7a6045] shadow-inner"></span>
              <span class="w-4 h-4 rounded-full bg-[#150f0b] border border-[#7a6045] shadow-inner"></span>
              <span class="w-4 h-4 rounded-full bg-[#150f0b] border border-[#7a6045] shadow-inner"></span>
            </div>

            <div class="absolute bottom-16 left-0 right-0 h-10 bg-gradient-to-b from-[#3a2d20] via-[#1a140d] to-[#0a0705] border-y border-[#5a4632] flex items-center justify-around px-8 shadow-lg">
              <span class="w-3.5 h-3.5 rounded-full bg-[#150f0b] border border-[#7a6045] shadow-inner"></span>
              <span class="w-3.5 h-3.5 rounded-full bg-[#150f0b] border border-[#7a6045] shadow-inner"></span>
              <span class="w-3.5 h-3.5 rounded-full bg-[#150f0b] border border-[#7a6045] shadow-inner"></span>
              <span class="w-3.5 h-3.5 rounded-full bg-[#150f0b] border border-[#7a6045] shadow-inner"></span>
            </div>

            <!-- Left Castle Torch & Sconce -->
            <div class="relative z-10 flex items-center gap-3">
              <div class="relative w-12 h-16 flex flex-col items-center">
                <!-- Flame Flicker -->
                <div class="w-6 h-9 bg-gradient-to-t from-[#ff4500] via-[#ffa500] to-[#ffff99] rounded-full blur-[2px] animate-pulse"></div>
                <div class="w-3 h-5 -mt-6 bg-[#ffffcc] rounded-full blur-[1px]"></div>
                <!-- Iron Wall Bracket -->
                <div class="w-4 h-8 bg-[#251b14] border border-[#4a3726] rounded-sm mt-1 shadow"></div>
              </div>
              <div class="hidden md:block">
                <span class="font-cinzel text-xs font-bold text-[#c5a880] tracking-widest block uppercase">Tour Nord</span>
                <span class="text-[10px] text-[#8b6b43] font-serif">Garnison de Granit</span>
              </div>
            </div>

            <!-- Left Heraldic Shield (Lion of Aetheria) -->
            <div class="relative z-10 my-auto hidden sm:flex flex-col items-center self-center bg-[#130d09] border-2 border-[#8b6b43] rounded-b-3xl p-5 shadow-2xl max-w-[160px] text-center">
              <mat-icon class="text-4xl text-[#d4af37] mb-1">shield</mat-icon>
              <div class="font-cinzel text-xs font-bold text-[#e0dcc7]">Bastion</div>
              <div class="text-[9px] text-[#8b6b43] font-serif">Force & Honneur</div>
            </div>

            <!-- Left Gate Bottom Rune -->
            <div class="relative z-10 font-cinzel text-xs text-[#6b5030] tracking-widest opacity-60">
              PORTA SEPTENTRIONALIS
            </div>

          </div>

          <!-- RIGHT GATE WING -->
          <div
            class="w-1/2 h-full relative origin-right transition-all duration-1000 border-l-2 border-[#120d08] shadow-[-15px_0_35px_rgba(0,0,0,0.9)] z-20 flex flex-col justify-between items-end p-6 sm:p-10"
            [class.animate-gate-right]="isOpening()"
            style="background: linear-gradient(225deg, #18120c 0%, #251b12 40%, #150f0a 100%);">
            
            <!-- Heavy Timber Texture Lines -->
            <div class="absolute inset-0 opacity-15 pointer-events-none"
              style="background-image: repeating-linear-gradient(90deg, #000 0px, #000 3px, transparent 3px, transparent 48px);">
            </div>

            <!-- Heavy Forged Iron Straps (Top, Mid, Bottom) -->
            <div class="absolute top-16 left-0 right-0 h-10 bg-gradient-to-b from-[#3a2d20] via-[#1a140d] to-[#0a0705] border-y border-[#5a4632] flex items-center justify-around px-8 shadow-lg">
              <span class="w-3.5 h-3.5 rounded-full bg-[#150f0b] border border-[#7a6045] shadow-inner"></span>
              <span class="w-3.5 h-3.5 rounded-full bg-[#150f0b] border border-[#7a6045] shadow-inner"></span>
              <span class="w-3.5 h-3.5 rounded-full bg-[#150f0b] border border-[#7a6045] shadow-inner"></span>
              <span class="w-3.5 h-3.5 rounded-full bg-[#150f0b] border border-[#7a6045] shadow-inner"></span>
            </div>

            <div class="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-12 bg-gradient-to-b from-[#3a2d20] via-[#1a140d] to-[#0a0705] border-y border-[#5a4632] flex items-center justify-around px-8 shadow-lg">
              <span class="w-4 h-4 rounded-full bg-[#150f0b] border border-[#7a6045] shadow-inner"></span>
              <span class="w-4 h-4 rounded-full bg-[#150f0b] border border-[#7a6045] shadow-inner"></span>
              <span class="w-4 h-4 rounded-full bg-[#150f0b] border border-[#7a6045] shadow-inner"></span>
              <span class="w-4 h-4 rounded-full bg-[#150f0b] border border-[#7a6045] shadow-inner"></span>
            </div>

            <div class="absolute bottom-16 left-0 right-0 h-10 bg-gradient-to-b from-[#3a2d20] via-[#1a140d] to-[#0a0705] border-y border-[#5a4632] flex items-center justify-around px-8 shadow-lg">
              <span class="w-3.5 h-3.5 rounded-full bg-[#150f0b] border border-[#7a6045] shadow-inner"></span>
              <span class="w-3.5 h-3.5 rounded-full bg-[#150f0b] border border-[#7a6045] shadow-inner"></span>
              <span class="w-3.5 h-3.5 rounded-full bg-[#150f0b] border border-[#7a6045] shadow-inner"></span>
              <span class="w-3.5 h-3.5 rounded-full bg-[#150f0b] border border-[#7a6045] shadow-inner"></span>
            </div>

            <!-- Right Castle Torch & Skip Button -->
            <div class="relative z-10 flex items-center gap-4">
              <button
                (click)="skipIntro()"
                class="px-3 py-1 bg-[#150f0a]/90 hover:bg-[#251a11] text-[#c5a880] hover:text-[#ffd700] rounded-lg border border-[#4a3726] text-xs font-cinzel font-bold transition-all shadow-md flex items-center gap-1">
                <span>Passer l'Intro</span>
                <mat-icon class="text-sm">fast_forward</mat-icon>
              </button>

              <div class="relative w-12 h-16 flex flex-col items-center">
                <!-- Flame Flicker -->
                <div class="w-6 h-9 bg-gradient-to-t from-[#ff4500] via-[#ffa500] to-[#ffff99] rounded-full blur-[2px] animate-pulse"></div>
                <div class="w-3 h-5 -mt-6 bg-[#ffffcc] rounded-full blur-[1px]"></div>
                <!-- Iron Wall Bracket -->
                <div class="w-4 h-8 bg-[#251b14] border border-[#4a3726] rounded-sm mt-1 shadow"></div>
              </div>
            </div>

            <!-- Right Heraldic Shield (Dragon Crest) -->
            <div class="relative z-10 my-auto hidden sm:flex flex-col items-center self-center bg-[#130d09] border-2 border-[#8b6b43] rounded-b-3xl p-5 shadow-2xl max-w-[160px] text-center">
              <mat-icon class="text-4xl text-[#ff4d4d] mb-1">auto_awesome</mat-icon>
              <div class="font-cinzel text-xs font-bold text-[#e0dcc7]">Arcanes</div>
              <div class="text-[9px] text-[#8b6b43] font-serif">Sagesse & Flamme</div>
            </div>

            <!-- Right Gate Bottom Rune -->
            <div class="relative z-10 font-cinzel text-xs text-[#6b5030] tracking-widest opacity-60">
              REGNUM AETHERIAE
            </div>

          </div>

        </div>

        <!-- CENTER ROYAL ENTRANCE PROCLAMATION & INTERACTIVE ENTRY BUTTON -->
        <div
          class="absolute z-30 flex flex-col items-center text-center p-6 max-w-xl w-full transition-all duration-700 pointer-events-auto"
          [class.opacity-0]="isOpening()"
          [class.scale-90]="isOpening()">
          
          <!-- Ornate Royal Crown & Crossed Broadswords Medallion -->
          <div class="relative mb-4 flex items-center justify-center animate-royal-crest">
            <div class="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#1c140d] border-4 border-[#d4af37] flex items-center justify-center shadow-[0_0_35px_rgba(212,175,55,0.7)] relative overflow-hidden p-1">
              <img
                src="/src/assets/images/emblem_aetheria_crest_1795189810140.jpg"
                alt="Blason Royal d'Aetheria"
                class="w-full h-full rounded-full object-cover border border-[#d4af37]/60"
                referrerpolicy="no-referrer" />
              <!-- Crossed Mini Swords Badge -->
              <div class="absolute -bottom-1 px-3 py-0.5 rounded-full bg-[#8b2b2b] border border-[#ff4d4d] text-white text-[10px] font-cinzel font-black uppercase tracking-widest shadow-lg flex items-center gap-1">
                <mat-icon class="text-[11px] text-[#ffd700]">swords</mat-icon>
                <span>FÉODAL</span>
              </div>
            </div>
          </div>

          <!-- Heraldic Proclamation Ribbon -->
          <div class="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[#1b140d]/90 border border-[#8b6b43] text-[#d4af37] text-xs font-cinzel font-bold mb-3 shadow-inner">
            <mat-icon class="text-xs text-[#ffd700]">shield</mat-icon>
            <span class="tracking-[0.2em] uppercase">Chroniques Féodales d'Aetheria</span>
            <mat-icon class="text-xs text-[#ffd700]">shield</mat-icon>
          </div>

          <!-- Grand Illuminated Title -->
          <h1 class="font-cinzel-dec text-3xl sm:text-5xl font-black text-[#ffd700] tracking-wider mb-2 drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)]">
            AETHERIA
          </h1>
          <p class="font-cinzel text-sm sm:text-base text-[#e0dcc7] max-w-md mb-6 leading-relaxed drop-shadow">
            Pénétrez dans la Citadelle des Arcanes. Forgez vos grimoires, invoquez les créatures légendaires et défiez les seigneurs de guerre.
          </p>

          <!-- Action Button: Open Gates & Trigger Sound & Visual Animation -->
          <button
            (click)="enterKingdom()"
            class="group relative px-8 sm:px-12 py-4 sm:py-5 bg-gradient-to-r from-[#8b2b2b] via-[#a82e2e] to-[#8b2b2b] hover:from-[#b91c1c] hover:to-[#b91c1c] text-[#ffd700] hover:text-white font-cinzel font-black text-sm sm:text-base tracking-[0.15em] uppercase rounded-2xl border-2 border-[#ffd700] shadow-[0_0_35px_rgba(212,175,55,0.65)] flex items-center justify-center gap-3 transition-all duration-300 hover:scale-105 active:scale-95 animate-shimmer-btn cursor-pointer">
            <mat-icon class="text-xl sm:text-2xl text-[#ffd700] group-hover:rotate-45 transition-transform duration-300">
              swords
            </mat-icon>
            <span>Franchir les Portes</span>
            <mat-icon class="text-xl sm:text-2xl text-[#ffd700] group-hover:-rotate-45 transition-transform duration-300">
              door_sliding
            </mat-icon>
          </button>

          <p class="text-[11px] font-mono text-[#a88d6b] mt-3 flex items-center gap-1.5 opacity-90">
            <mat-icon class="text-xs text-[#ffd700] animate-pulse">volume_up</mat-icon>
            <span>Fanfare royale & ouverture cinématique des portes</span>
          </p>

        </div>

        <!-- REVEALED WELCOME BANNER WHEN GATES ARE PARTING -->
        @if (isOpening()) {
          <div class="absolute z-40 flex flex-col items-center text-center animate-in zoom-in-75 duration-700 pointer-events-none p-4">
            <div class="w-16 h-16 rounded-full border-2 border-[#d4af37] overflow-hidden mb-3 animate-bounce shadow-2xl p-0.5 bg-[#1a120c]">
              <img
                src="/src/assets/images/emblem_aetheria_crest_1795189810140.jpg"
                alt="Sceau Royal d'Aetheria"
                class="w-full h-full rounded-full object-cover"
                referrerpolicy="no-referrer" />
            </div>
            <h2 class="font-cinzel-dec text-3xl sm:text-5xl font-black text-[#ffd700] tracking-widest drop-shadow-[0_0_25px_rgba(255,215,0,0.9)] mb-2">
              BIENVENUE MESSIRE
            </h2>
            <div class="px-6 py-2 bg-[#120f0c]/90 border border-[#d4af37] rounded-xl text-sm sm:text-base font-cinzel font-bold text-[#e0dcc7] shadow-2xl">
              Que les Chroniques et la Gloire d'Aetheria s'écrivent !
            </div>
          </div>
        }

      </div>
    }
  `,
})
export class MedievalEntranceOverlayComponent {
  readonly sound = inject(SoundService);
  readonly gameState = inject(GameStateService);

  readonly overlayClose = output<void>();

  readonly isVisible = signal<boolean>(true);
  readonly isOpening = signal<boolean>(false);
  readonly isFadingOut = signal<boolean>(false);

  enterKingdom() {
    if (this.isOpening()) return;

    // 1. Play the majestic royal fanfare & stone gate opening SFX
    this.sound.playGameEntranceFanfare();

    // 2. Start tavern ambient music seamlessly in background
    setTimeout(() => {
      this.sound.startAmbientMusic();
    }, 1200);

    // 3. Trigger 3D Gate swing animation and light explosion
    this.isOpening.set(true);

    // 4. Smooth fade out and dismissal
    setTimeout(() => {
      this.isFadingOut.set(true);
    }, 1800);

    setTimeout(() => {
      this.isVisible.set(false);
      this.gameState.showEntranceCinematic.set(false);
      this.overlayClose.emit();
    }, 2500);
  }

  skipIntro() {
    this.isFadingOut.set(true);
    this.sound.playClick();
    setTimeout(() => {
      this.isVisible.set(false);
      this.gameState.showEntranceCinematic.set(false);
      this.overlayClose.emit();
    }, 350);
  }
}
