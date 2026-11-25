import { ChangeDetectionStrategy, Component, effect, inject, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import confetti from 'canvas-confetti';
import { GameStateService } from '../../services/game-state';
import { SoundService } from '../../services/sound';
import { CardRarity, HeroClass } from '../../models/game.model';

@Component({
  selector: 'app-skin-reveal-overlay',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  host: {
    '(document:keydown.escape)': 'onEscapeKey()',
  },
  template: `
    @if (gameState.pendingSkinReveal(); as reveal) {
      @let hero = reveal.hero;
      @let skin = reveal.skin;

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="skin-reveal-title"
        class="skin-reveal-backdrop fixed inset-0 z-[70] flex items-center justify-center bg-black/92 backdrop-blur-lg p-4 sm:p-6 overflow-y-auto select-none">

        <!-- Ambient Rarity Radial Aura -->
        <div
          class="absolute inset-0 pointer-events-none opacity-65"
          [style.background]="'radial-gradient(circle at center, ' + getRarityGlowColor(skin.rarity, 0.28) + ' 0%, rgba(8, 7, 6, 0.94) 62%, #050404 100%)'"
          aria-hidden="true"></div>

        <!-- Rotating Conic Light Rays Behind Centerpiece -->
        <div
          class="skin-reveal-rays absolute w-[680px] h-[680px] sm:w-[900px] sm:h-[900px] rounded-full pointer-events-none opacity-35"
          [style.background]="'conic-gradient(from 0deg, transparent 0deg, ' + getRarityGlowColor(skin.rarity, 0.42) + ' 24deg, transparent 52deg, transparent 120deg, ' + getRarityGlowColor(skin.rarity, 0.35) + ' 144deg, transparent 175deg, transparent 240deg, ' + getRarityGlowColor(skin.rarity, 0.42) + ' 264deg, transparent 298deg)'"
          style="mask-image: radial-gradient(circle, black 12%, transparent 66%); -webkit-mask-image: radial-gradient(circle, black 12%, transparent 66%);"
          aria-hidden="true"></div>

        <!-- Expanding Shockwave Crest Ring -->
        <div
          class="skin-reveal-shockwave absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full border-2 pointer-events-none"
          [style.borderColor]="getRarityAccentHex(skin.rarity)"
          [style.boxShadow]="'0 0 60px ' + getRarityGlowColor(skin.rarity, 0.65)"
          aria-hidden="true"></div>

        <!-- Top-Right Close Button -->
        <button
          type="button"
          (click)="dismiss()"
          aria-label="Fermer la révélation"
          class="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 w-11 h-11 rounded-xl bg-[#16110c]/90 hover:bg-[#241c14] border border-[#8b6b43]/70 text-[#c5a880] hover:text-white flex items-center justify-center cursor-pointer transition-colors">
          <mat-icon>close</mat-icon>
        </button>

        <!-- Center Reveal Stage -->
        <div class="relative z-10 max-w-xl w-full flex flex-col items-center text-center space-y-6 my-auto">

          <!-- Unboxed Header Kicker -->
          <div class="skin-reveal-copy space-y-1.5">
            <div class="text-xs font-cinzel font-bold tracking-widest uppercase flex items-center justify-center gap-2 text-[#c5a880]">
              <span [style.color]="getRarityAccentHex(skin.rarity)">{{ getRarityLabel(skin.rarity) }}</span>
              <span class="text-[#6b5a45]" aria-hidden="true">·</span>
              <span>Nouvelle Apparence Débloquée</span>
            </div>
            <h2
              id="skin-reveal-title"
              class="font-cinzel-dec text-2xl sm:text-4xl font-black text-[#f5eedc] tracking-wide"
              style="text-wrap: balance;">
              {{ skin.name }}
            </h2>
            <div class="text-xs sm:text-sm font-cinzel text-[#a89070]">
              <span>{{ hero.name }}</span>
              <span aria-hidden="true"> · </span>
              <span>{{ skin.badge }}</span>
              @if (skin.visualEffectLabel) {
                <span aria-hidden="true"> · </span>
                <span [style.color]="getRarityAccentHex(skin.rarity)">{{ skin.visualEffectLabel }}</span>
              }
            </div>
          </div>

          <!-- Heroic Skin Showcase Card with Rarity Frame & CSS Particles -->
          <div
            class="skin-reveal-card-stage skin-rarity-card w-full max-w-sm rounded-2xl border-2 p-5 shadow-2xl"
            [class]="getSkinRarityCardClass(skin.rarity)">

            <!-- CSS Particle Layer by Rarity -->
            <div class="skin-particles" aria-hidden="true">
              @switch (skin.rarity) {
                @case ('common') {
                  <span class="skin-particle" style="left: 16%; --p-dur: 5.0s; --p-delay: 0s; --px-drift: 8px; --py-rise: -120px;"></span>
                  <span class="skin-particle" style="left: 52%; --p-dur: 5.8s; --p-delay: 1.4s; --px-drift: -6px; --py-rise: -130px;"></span>
                  <span class="skin-particle" style="left: 82%; --p-dur: 5.2s; --p-delay: 0.7s; --px-drift: 6px; --py-rise: -115px;"></span>
                }
                @case ('rare') {
                  <span class="skin-particle" style="left: 12%; --p-dur: 4.0s; --p-delay: 0s; --px-drift: 10px; --py-rise: -180px;"></span>
                  <span class="skin-particle" style="left: 34%; --p-dur: 3.5s; --p-delay: 0.8s; --px-drift: -12px; --py-rise: -195px;"></span>
                  <span class="skin-particle" style="left: 60%; --p-dur: 4.3s; --p-delay: 0.4s; --px-drift: 12px; --py-rise: -185px;"></span>
                  <span class="skin-particle" style="left: 84%; --p-dur: 3.7s; --p-delay: 1.5s; --px-drift: -10px; --py-rise: -175px;"></span>
                }
                @case ('epic') {
                  <span class="skin-particle" style="left: 10%; --p-dur: 3.8s; --p-delay: 0s; --px-drift: 14px; --py-rise: -210px;"></span>
                  <span class="skin-particle" style="left: 28%; --p-dur: 3.2s; --p-delay: 0.6s; --px-drift: -14px; --py-rise: -225px;"></span>
                  <span class="skin-particle" style="left: 48%; --p-dur: 4.0s; --p-delay: 1.3s; --px-drift: 12px; --py-rise: -200px;"></span>
                  <span class="skin-particle" style="left: 70%; --p-dur: 3.4s; --p-delay: 0.2s; --px-drift: -14px; --py-rise: -220px;"></span>
                  <span class="skin-particle" style="left: 89%; --p-dur: 3.7s; --p-delay: 1.7s; --px-drift: 10px; --py-rise: -195px;"></span>
                }
                @case ('legendary') {
                  <span class="skin-particle" style="left: 8%; --p-dur: 3.1s; --p-delay: 0s; --px-drift: 16px; --py-rise: -240px;"></span>
                  <span class="skin-particle" style="left: 22%; --p-dur: 2.7s; --p-delay: 0.5s; --px-drift: -14px; --py-rise: -260px;"></span>
                  <span class="skin-particle" style="left: 38%; --p-dur: 3.4s; --p-delay: 1.1s; --px-drift: 14px; --py-rise: -235px;"></span>
                  <span class="skin-particle" style="left: 54%; --p-dur: 2.9s; --p-delay: 0.2s; --px-drift: -16px; --py-rise: -265px;"></span>
                  <span class="skin-particle" style="left: 69%; --p-dur: 3.5s; --p-delay: 1.4s; --px-drift: 12px; --py-rise: -245px;"></span>
                  <span class="skin-particle" style="left: 83%; --p-dur: 2.8s; --p-delay: 0.8s; --px-drift: -12px; --py-rise: -250px;"></span>
                  <span class="skin-particle" style="left: 93%; --p-dur: 3.2s; --p-delay: 1.6s; --px-drift: -14px; --py-rise: -230px;"></span>
                  <span class="skin-particle-star" style="top: 12%; right: 12%; --p-dur: 2.1s; --p-delay: 0.1s;"></span>
                  <span class="skin-particle-star" style="top: 38%; left: 9%; --p-dur: 2.5s; --p-delay: 0.8s;"></span>
                  <span class="skin-particle-star" style="bottom: 24%; right: 16%; --p-dur: 2.3s; --p-delay: 1.3s;"></span>
                }
                @case ('mythic') {
                  <span class="skin-particle" style="left: 7%; --p-dur: 2.9s; --p-delay: 0s; --px-drift: 18px; --py-rise: -250px;"></span>
                  <span class="skin-particle" style="left: 19%; --p-dur: 2.5s; --p-delay: 0.4s; --px-drift: -16px; --py-rise: -270px;"></span>
                  <span class="skin-particle" style="left: 33%; --p-dur: 3.2s; --p-delay: 1.0s; --px-drift: 16px; --py-rise: -245px;"></span>
                  <span class="skin-particle" style="left: 48%; --p-dur: 2.6s; --p-delay: 0.2s; --px-drift: -18px; --py-rise: -275px;"></span>
                  <span class="skin-particle" style="left: 61%; --p-dur: 3.3s; --p-delay: 1.5s; --px-drift: 14px; --py-rise: -250px;"></span>
                  <span class="skin-particle" style="left: 74%; --p-dur: 2.7s; --p-delay: 0.7s; --px-drift: -14px; --py-rise: -260px;"></span>
                  <span class="skin-particle" style="left: 86%; --p-dur: 3.0s; --p-delay: 1.3s; --px-drift: 12px; --py-rise: -240px;"></span>
                  <span class="skin-particle" style="left: 94%; --p-dur: 2.4s; --p-delay: 1.8s; --px-drift: -16px; --py-rise: -255px;"></span>
                  <span class="skin-particle-star" style="top: 10%; right: 10%; --p-dur: 1.9s; --p-delay: 0s;"></span>
                  <span class="skin-particle-star" style="top: 36%; left: 8%; --p-dur: 2.3s; --p-delay: 0.7s;"></span>
                  <span class="skin-particle-star" style="bottom: 22%; right: 14%; --p-dur: 2.1s; --p-delay: 1.2s;"></span>
                }
              }
            </div>

            <div class="skin-card-content space-y-4">
              <!-- Large Skin Portrait Frame -->
              <div
                class="w-44 h-44 sm:w-52 sm:h-52 mx-auto rounded-2xl bg-[#0d0a07] border-2 overflow-hidden relative shadow-2xl flex items-center justify-center"
                [style.borderColor]="skin.accentHex || getRarityAccentHex(skin.rarity)"
                [style.boxShadow]="'0 0 32px ' + getRarityGlowColor(skin.rarity, 0.5)">
                @if (skin.imageUrl || hero.imageUrl) {
                  <img
                    [src]="skin.imageUrl || hero.imageUrl"
                    [alt]="hero.name + ' - ' + skin.name"
                    [style.filter]="skin.portraitFilter || 'none'"
                    class="w-full h-full object-cover"
                    referrerpolicy="no-referrer" />
                  <div class="absolute inset-0 bg-gradient-to-t pointer-events-none" [class]="skin.themeGradient || ''"></div>
                } @else {
                  <mat-icon class="text-6xl text-[#c5a880]">{{ skin.avatarIcon }}</mat-icon>
                }
              </div>

              <!-- Lore & Active Confirmation -->
              <div class="space-y-2">
                <p class="text-xs sm:text-sm font-serif text-[#d6cbb8] leading-relaxed">
                  {{ skin.description || 'Apparence d’exception forgée pour ' + hero.name + '.' }}
                </p>

                <div class="inline-flex items-center gap-1.5 text-xs font-cinzel font-bold text-[#4dff88]">
                  <mat-icon class="text-sm">check_circle</mat-icon>
                  <span>Apparence automatiquement équipée sur {{ hero.name }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Action Controls -->
          <div class="skin-reveal-copy flex flex-wrap items-center justify-center gap-3 pt-1">
            <button
              type="button"
              (click)="dismiss()"
              class="gold-btn px-6 py-2.5 rounded-xl font-cinzel font-black text-xs sm:text-sm flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0">
              <mat-icon class="text-base">auto_awesome</mat-icon>
              <span>Continuer l'Aventure</span>
            </button>

            <button
              type="button"
              (click)="onInspectHero(hero.id)"
              class="medieval-btn px-5 py-2.5 rounded-xl border border-[#8b6b43] text-[#f0e6d2] hover:text-[#ffd700] font-cinzel font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0">
              <mat-icon class="text-base text-[#d4af37]">shield</mat-icon>
              <span>Voir le Héros</span>
            </button>

            <button
              type="button"
              (click)="replaySound(skin.rarity)"
              title="Rejouer l'effet sonore de révélation"
              aria-label="Rejouer l'effet sonore de révélation"
              class="medieval-btn px-3.5 py-2.5 rounded-xl border border-[#3d2c1c] text-[#c5a880] hover:text-[#ffd700] font-cinzel font-bold text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0">
              <mat-icon class="text-base">volume_up</mat-icon>
              <span>Son</span>
            </button>
          </div>

        </div>
      </div>
    }
  `,
})
export class SkinRevealOverlay {
  readonly gameState = inject(GameStateService);
  private readonly sound = inject(SoundService);

  readonly inspectHero = output<HeroClass>();

  private lastTriggeredAt = 0;

  constructor() {
    effect(() => {
      const reveal = this.gameState.pendingSkinReveal();
      if (!reveal || reveal.triggeredAt === this.lastTriggeredAt) {
        return;
      }
      this.lastTriggeredAt = reveal.triggeredAt;
      this.triggerRevealConfetti(reveal.skin.rarity);
    });
  }

  onEscapeKey() {
    if (this.gameState.pendingSkinReveal()) {
      this.dismiss();
    }
  }

  dismiss() {
    this.sound.playClick('gold');
    this.gameState.dismissSkinReveal();
  }

  onInspectHero(heroId: HeroClass) {
    this.sound.playClick('gold');
    this.gameState.selectHero(heroId);
    this.gameState.dismissSkinReveal();
    this.inspectHero.emit(heroId);
  }

  replaySound(rarity: CardRarity) {
    this.sound.playSkinReveal(rarity);
  }

  getSkinRarityCardClass(rarity: CardRarity): string {
    return `skin-rarity-${rarity}`;
  }

  getRarityLabel(rarity: CardRarity): string {
    switch (rarity) {
      case 'common':
        return 'Commun';
      case 'rare':
        return 'Rare';
      case 'epic':
        return 'Épique';
      case 'legendary':
        return 'Légendaire';
      case 'mythic':
        return 'Mythique';
    }
  }

  getRarityAccentHex(rarity: CardRarity): string {
    switch (rarity) {
      case 'common':
        return '#d6d3d1';
      case 'rare':
        return '#38bdf8';
      case 'epic':
        return '#c084fc';
      case 'legendary':
        return '#fbbf24';
      case 'mythic':
        return '#fb7185';
    }
  }

  getRarityGlowColor(rarity: CardRarity, alpha: number): string {
    switch (rarity) {
      case 'common':
        return `rgba(214, 211, 209, ${alpha})`;
      case 'rare':
        return `rgba(56, 189, 248, ${alpha})`;
      case 'epic':
        return `rgba(192, 132, 252, ${alpha})`;
      case 'legendary':
        return `rgba(251, 191, 36, ${alpha})`;
      case 'mythic':
        return `rgba(251, 113, 133, ${alpha})`;
    }
  }

  private triggerRevealConfetti(rarity: CardRarity) {
    if (typeof window === 'undefined') return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const paletteByRarity: Record<CardRarity, string[]> = {
      common: ['#d6d3d1', '#a8a29e', '#f5f5f4'],
      rare: ['#38bdf8', '#7dd3fc', '#0284c7'],
      epic: ['#c084fc', '#e9d5ff', '#9333ea'],
      legendary: ['#fbbf24', '#fde047', '#f59e0b', '#ffffff'],
      mythic: ['#fb7185', '#c084fc', '#fda4af', '#fbbf24'],
    };

    const countByRarity: Record<CardRarity, number> = {
      common: 35,
      rare: 55,
      epic: 75,
      legendary: 110,
      mythic: 140,
    };

    try {
      confetti({
        particleCount: countByRarity[rarity],
        spread: rarity === 'legendary' || rarity === 'mythic' ? 88 : 65,
        origin: { y: 0.52 },
        colors: paletteByRarity[rarity],
        disableForReducedMotion: true,
      });
    } catch {
      // Safe fallback when confetti canvas is unavailable
    }
  }
}
