import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import {
  Card,
  CardRarity,
  DirectTradeProposal,
  FairTradeAssessment,
  Potion,
  TradeBundle,
  TradeOffer,
  TradePotionBundleItem,
  TradeResourceBundleItem,
  TradeResourceKey,
} from '../../models/game.model';
import {
  GEM_TO_GOLD_RATE,
  GameStateService,
  TRADE_RESOURCE_CATALOG,
  assessTradeFairness,
  evaluateCardValue,
  evaluatePotionValue,
  evaluateResourceValue,
} from '../../services/game-state';
import { SoundService } from '../../services/sound';

interface BesaceTradeItem {
  key: string;
  itemType: 'card' | 'potion';
  id: string;
  name: string;
  subtitle: string;
  rarity: CardRarity;
  imageUrl?: string;
  icon: string;
  color: string;
  suggestedGold: number;
  suggestedGems: number;
  minFloorGold: number;
}

interface PartnerCandidate {
  id: string;
  username: string;
  avatarIcon: string;
  elo: number;
  guildTag: string;
  trustScore: number;
  isOnline: boolean;
}

type InspectedItemPayload =
  | {
      kind: 'card';
      card: Card;
      estimatedGold: number;
      sellerName?: string;
      sellerTrust?: number;
      inActiveDeck: boolean;
    }
  | {
      kind: 'potion';
      potion: Potion;
      quantity: number;
      estimatedGold: number;
      sellerName?: string;
      sellerTrust?: number;
    }
  | {
      kind: 'resource';
      resource: TradeResourceBundleItem;
      description: string;
      isRare: boolean;
      estimatedGold: number;
      ownedStock: number;
      sellerName?: string;
    };

interface SmokePlumeSpec {
  id: number;
  sx: string;
  sy: string;
  sr: string;
  sz: string;
  dur: string;
  del: string;
  coreColor: string;
  midColor: string;
}

interface SmokeSparkSpec {
  id: number;
  px: string;
  py: string;
  dur: string;
  del: string;
}

const SMOKE_PLUMES: SmokePlumeSpec[] = [
  { id: 1, sx: '-72px', sy: '-32px', sr: '-28deg', sz: '96px', dur: '1.35s', del: '0s', coreColor: 'rgba(209, 250, 229, 0.56)', midColor: 'rgba(16, 185, 129, 0.42)' },
  { id: 2, sx: '74px', sy: '-38px', sr: '32deg', sz: '94px', dur: '1.32s', del: '0.03s', coreColor: 'rgba(254, 249, 195, 0.54)', midColor: 'rgba(212, 175, 55, 0.4)' },
  { id: 3, sx: '-44px', sy: '-68px', sr: '-18deg', sz: '108px', dur: '1.42s', del: '0.05s', coreColor: 'rgba(237, 233, 254, 0.5)', midColor: 'rgba(139, 92, 246, 0.34)' },
  { id: 4, sx: '46px', sy: '-66px', sr: '24deg', sz: '104px', dur: '1.4s', del: '0.07s', coreColor: 'rgba(209, 250, 229, 0.54)', midColor: 'rgba(16, 185, 129, 0.38)' },
  { id: 5, sx: '0px', sy: '-84px', sr: '10deg', sz: '116px', dur: '1.48s', del: '0.02s', coreColor: 'rgba(254, 243, 199, 0.58)', midColor: 'rgba(245, 158, 11, 0.36)' },
  { id: 6, sx: '-92px', sy: '-10px', sr: '-42deg', sz: '86px', dur: '1.25s', del: '0.08s', coreColor: 'rgba(220, 252, 231, 0.48)', midColor: 'rgba(52, 211, 153, 0.34)' },
  { id: 7, sx: '90px', sy: '-12px', sr: '40deg', sz: '88px', dur: '1.28s', del: '0.09s', coreColor: 'rgba(243, 232, 255, 0.48)', midColor: 'rgba(167, 139, 250, 0.34)' },
  { id: 8, sx: '-56px', sy: '18px', sr: '-22deg', sz: '82px', dur: '1.22s', del: '0.04s', coreColor: 'rgba(254, 249, 195, 0.46)', midColor: 'rgba(212, 175, 55, 0.32)' },
  { id: 9, sx: '58px', sy: '16px', sr: '20deg', sz: '84px', dur: '1.24s', del: '0.06s', coreColor: 'rgba(209, 250, 229, 0.48)', midColor: 'rgba(16, 185, 129, 0.32)' },
  { id: 10, sx: '-22px', sy: '-42px', sr: '-12deg', sz: '112px', dur: '1.38s', del: '0.11s', coreColor: 'rgba(255, 255, 255, 0.48)', midColor: 'rgba(16, 185, 129, 0.35)' },
  { id: 11, sx: '24px', sy: '-46px', sr: '16deg', sz: '110px', dur: '1.36s', del: '0.12s', coreColor: 'rgba(254, 249, 195, 0.5)', midColor: 'rgba(212, 175, 55, 0.36)' },
  { id: 12, sx: '0px', sy: '-24px', sr: '-8deg', sz: '120px', dur: '1.44s', del: '0.14s', coreColor: 'rgba(236, 253, 245, 0.52)', midColor: 'rgba(139, 92, 246, 0.28)' },
];

const SMOKE_SPARKS: SmokeSparkSpec[] = [
  { id: 1, px: '-48px', py: '-82px', dur: '1.05s', del: '0.04s' },
  { id: 2, px: '52px', py: '-86px', dur: '1.12s', del: '0.08s' },
  { id: 3, px: '-26px', py: '-96px', dur: '1.2s', del: '0.02s' },
  { id: 4, px: '28px', py: '-92px', dur: '1.18s', del: '0.1s' },
  { id: 5, px: '-74px', py: '-58px', dur: '0.98s', del: '0.12s' },
  { id: 6, px: '72px', py: '-60px', dur: '1.02s', del: '0.14s' },
  { id: 7, px: '0px', py: '-104px', dur: '1.24s', del: '0.05s' },
  { id: 8, px: '-14px', py: '-72px', dur: '0.95s', del: '0.18s' },
  { id: 9, px: '18px', py: '-76px', dur: '1.08s', del: '0.16s' },
  { id: 10, px: '-62px', py: '-74px', dur: '1.15s', del: '0.2s' },
  { id: 11, px: '64px', py: '-70px', dur: '1.1s', del: '0.22s' },
  { id: 12, px: '8px', py: '-88px', dur: '1.22s', del: '0.24s' },
];

function emptyBundle(): TradeBundle {
  return { cards: [], potions: [], resources: [], gold: 0, gems: 0 };
}

function cloneBundle(b: TradeBundle): TradeBundle {
  return {
    cards: b.cards.map(c => ({ ...c })),
    potions: b.potions.map(p => ({ ...p, potionData: { ...p.potionData } })),
    resources: b.resources.map(r => ({ ...r })),
    gold: b.gold,
    gems: b.gems,
  };
}

@Component({
  selector: 'app-marketplace-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div class="max-w-7xl mx-auto p-4 md:p-6 space-y-6">

      <!-- TOP HERO BANNER -->
      <div class="relative overflow-hidden bg-[#120f0c] border border-[#8b6b43]/50 rounded-2xl p-6 shadow-xl">
        <img
          src="/src/assets/images/marketplace_bazaar_banner_1795188691111.jpg"
          alt="Halle du Troc d'Aetheria"
          class="absolute inset-0 w-full h-full object-cover opacity-50"
          referrerpolicy="no-referrer" />
        <div class="absolute inset-0 bg-gradient-to-r from-[#0d0a07]/95 via-[#120f0c]/85 to-[#120f0c]/60 pointer-events-none"></div>

        <div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div class="space-y-1.5">
            <div class="flex flex-wrap items-center gap-3">
              <h1 class="font-cinzel-dec text-2xl md:text-3xl font-black text-[#f3ead8] drop-shadow flex items-center gap-2.5">
                <mat-icon class="text-[#d4af37] text-3xl">storefront</mat-icon>
                <span>Halle du Troc & Échanges Sécurisés</span>
              </h1>
              <span class="px-2.5 py-1 rounded-lg bg-emerald-950/75 border border-emerald-500/40 text-xs font-mono text-emerald-300 inline-flex items-center gap-1.5">
                <mat-icon class="text-sm text-emerald-400">verified_user</mat-icon>
                <span>Escrow Protégé · Anti-Arnaque Actif</span>
              </span>
            </div>
            <p class="text-[#c5a880] text-xs font-serif max-w-2xl">
              Négociez directement cartes, potions et réactifs alchimiques rares sous séquestre sécurisé, ou glissez-déposez vos offres sur l'Autel du Marché.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2.5 shrink-0">
            <!-- Player Live Balances -->
            <div class="flex items-center gap-2 bg-[#0d0b09]/85 border border-[#3a2f23] rounded-xl px-3 py-2 font-mono tabular-nums text-xs">
              <span class="currency-pill-gold flex items-center gap-1">
                <span class="currency-gold-coin text-xs">✦</span>
                <span class="currency-gold-shine font-extrabold">{{ gameState.gold() }}</span>
              </span>
              <span class="currency-pill-gem flex items-center gap-1">
                <span class="currency-gem-facet text-xs">⬥</span>
                <span class="currency-gem-shine font-extrabold">{{ gameState.gems() }}</span>
              </span>
            </div>

            <button
              type="button"
              (click)="startNewProposal()"
              class="gold-btn px-4 py-2.5 font-cinzel font-bold text-xs rounded-xl flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer">
              <mat-icon class="text-base">handshake</mat-icon>
              <span>Proposer un Échange</span>
            </button>

            <button
              type="button"
              (click)="openCreateModal()"
              class="crimson-btn px-4 py-2.5 text-white font-cinzel font-bold text-xs rounded-xl border border-[#ff4d4d] shadow flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer">
              <mat-icon class="text-white text-base">add_business</mat-icon>
              <span>Publier au Marché</span>
            </button>
          </div>
        </div>
      </div>

      <!-- WORKSPACE NAVIGATION TABS -->
      <div class="flex flex-wrap items-center justify-between gap-3 bg-[#120f0c] border border-[#3a2f23] rounded-2xl p-2 shadow-lg">
        <div class="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            (click)="activeTab.set('p2p'); isComposingProposal.set(false)"
            class="px-4 py-2 rounded-xl font-cinzel font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
            [class.bg-[#2a2117]]="activeTab() === 'p2p'"
            [class.text-[#fde047]]="activeTab() === 'p2p'"
            [class.border]="activeTab() === 'p2p'"
            [class.border-[#d4af37]/50]="activeTab() === 'p2p'"
            [class.text-[#a38b6d]]="activeTab() !== 'p2p'">
            <mat-icon class="text-base">security</mat-icon>
            <span>Chambre d'Échange P2P</span>
            @if (gameState.pendingIncomingTradesCount() > 0) {
              <span class="px-1.5 py-0.5 rounded-full bg-[#8b2b2b] border border-[#ff6b6b]/50 text-white text-[10px] font-mono font-black tabular-nums">
                {{ gameState.pendingIncomingTradesCount() }}
              </span>
            }
          </button>

          <button
            type="button"
            (click)="activeTab.set('market')"
            class="px-4 py-2 rounded-xl font-cinzel font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
            [class.bg-[#2a2117]]="activeTab() === 'market'"
            [class.text-[#fde047]]="activeTab() === 'market'"
            [class.border]="activeTab() === 'market'"
            [class.border-[#d4af37]/50]="activeTab() === 'market'"
            [class.text-[#a38b6d]]="activeTab() !== 'market'">
            <mat-icon class="text-base">storefront</mat-icon>
            <span>Étalages & Glisser-Déposer</span>
            <span class="text-[10px] font-mono opacity-80 tabular-nums">({{ gameState.tradeOffers().length }})</span>
          </button>

          <button
            type="button"
            (click)="activeTab.set('audit')"
            class="px-4 py-2 rounded-xl font-cinzel font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
            [class.bg-[#2a2117]]="activeTab() === 'audit'"
            [class.text-[#fde047]]="activeTab() === 'audit'"
            [class.border]="activeTab() === 'audit'"
            [class.border-[#d4af37]/50]="activeTab() === 'audit'"
            [class.text-[#a38b6d]]="activeTab() !== 'audit'">
            <mat-icon class="text-base">fact_check</mat-icon>
            <span>Journal & Anti-Arnaque</span>
            <span class="text-[10px] font-mono opacity-80 tabular-nums">({{ gameState.tradeAuditLog().length }})</span>
          </button>
        </div>

        <div class="hidden md:flex items-center gap-4 px-3 text-[11px] font-mono text-[#a38b6d]">
          <span class="inline-flex items-center gap-1.5 text-emerald-400">
            <mat-icon class="text-sm">lock_clock</mat-icon>
            <span>Verrou 5s anti-substitution</span>
          </span>
          <span class="inline-flex items-center gap-1.5 text-[#d4af37]">
            <mat-icon class="text-sm">balance</mat-icon>
            <span>1 Gemme = {{ gemRate }} Or</span>
          </span>
        </div>
      </div>

      <!-- ======================================================== -->
      <!-- TAB 1: CHAMBRE D'ÉCHANGE P2P PROTÉGÉE (ESCROW)            -->
      <!-- ======================================================== -->
      @if (activeTab() === 'p2p') {
        <section aria-label="Chambre d'échange pair-à-pair protégée" class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

          <!-- LEFT SIDEBAR: ACTIVE PROPOSALS & HISTORY -->
          <div class="lg:col-span-4 bg-[#120f0c] border border-[#3a2f23] rounded-2xl p-4 shadow-xl space-y-4">
            <div class="flex items-center justify-between gap-2 pb-3 border-b border-[#3a2f23]">
              <div>
                <h2 class="font-cinzel font-bold text-sm text-[#f3ead8] flex items-center gap-1.5">
                  <mat-icon class="text-base text-[#d4af37]">swap_horizontal_circle</mat-icon>
                  <span>Contrats Escrow</span>
                </h2>
                <p class="text-[11px] text-[#8b6b43]">Sélectionnez une proposition pour inspecter</p>
              </div>
              <button
                type="button"
                (click)="startNewProposal()"
                class="px-2.5 py-1.5 rounded-lg bg-[#1e1812] hover:bg-[#2a2118] border border-[#d4af37]/50 text-[#fde047] text-[11px] font-cinzel font-bold inline-flex items-center gap-1 cursor-pointer transition-colors">
                <mat-icon class="text-sm">add</mat-icon>
                <span>Nouveau</span>
              </button>
            </div>

            <!-- Filter Pills -->
            <div class="grid grid-cols-2 gap-1.5 p-1 bg-[#0d0b09] border border-[#3a2f23] rounded-xl">
              <button
                type="button"
                (click)="proposalFilter.set('active')"
                class="py-1.5 rounded-lg text-xs font-cinzel font-bold transition-colors cursor-pointer"
                [class.bg-[#251d15]]="proposalFilter() === 'active'"
                [class.text-[#fde047]]="proposalFilter() === 'active'"
                [class.text-[#8b6b43]]="proposalFilter() !== 'active'">
                En Cours ({{ activeProposalsCount() }})
              </button>
              <button
                type="button"
                (click)="proposalFilter.set('archive')"
                class="py-1.5 rounded-lg text-xs font-cinzel font-bold transition-colors cursor-pointer"
                [class.bg-[#251d15]]="proposalFilter() === 'archive'"
                [class.text-[#fde047]]="proposalFilter() === 'archive'"
                [class.text-[#8b6b43]]="proposalFilter() !== 'archive'">
                Archivés ({{ archivedProposalsCount() }})
              </button>
            </div>

            <!-- Proposal List -->
            <div class="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
              @for (prop of filteredProposals(); track prop.id) {
                @let assess = assessProposal(prop);
                <button
                  type="button"
                  (click)="selectProposal(prop.id)"
                  class="w-full text-left p-3 rounded-xl border transition-all space-y-2 cursor-pointer"
                  [class.bg-[#1d1711]]="!isComposingProposal() && selectedProposal()?.id === prop.id"
                  [class.border-[#d4af37]]="!isComposingProposal() && selectedProposal()?.id === prop.id"
                  [class.bg-[#16120e]]="isComposingProposal() || selectedProposal()?.id !== prop.id"
                  [class.border-[#3a2f23]]="isComposingProposal() || selectedProposal()?.id !== prop.id">

                  <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2 min-w-0">
                      <div
                        class="w-8 h-8 rounded-lg bg-[#0d0b09] border flex items-center justify-center shrink-0"
                        [class.border-red-500/60]="assess.status === 'scam_blocked'"
                        [class.text-red-400]="assess.status === 'scam_blocked'"
                        [class.border-[#8b6b43]]="assess.status !== 'scam_blocked'"
                        [class.text-[#d4af37]]="assess.status !== 'scam_blocked'">
                        <mat-icon class="text-base">{{ prop.partnerAvatar }}</mat-icon>
                      </div>
                      <div class="min-w-0">
                        <div class="font-cinzel font-bold text-xs text-[#f3ead8] truncate flex items-center gap-1.5">
                          <span>{{ prop.partnerName }}</span>
                          @if (prop.partnerGuildTag) {
                            <span class="text-[10px] font-mono text-[#8b6b43]">{{ prop.partnerGuildTag }}</span>
                          }
                        </div>
                        <div class="text-[10px] font-mono text-[#8b6b43]">
                          {{ prop.direction === 'incoming' ? 'Reçue' : 'Envoyée' }} · {{ prop.updatedAt }}
                        </div>
                      </div>
                    </div>

                    <span
                      class="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold shrink-0 border"
                      [class.bg-emerald-950/70]="prop.partnerTrustScore >= 90"
                      [class.border-emerald-500/40]="prop.partnerTrustScore >= 90"
                      [class.text-emerald-300]="prop.partnerTrustScore >= 90"
                      [class.bg-red-950/70]="prop.partnerTrustScore < 70"
                      [class.border-red-500/50]="prop.partnerTrustScore < 70"
                      [class.text-red-300]="prop.partnerTrustScore < 70"
                      [class.bg-amber-950/70]="prop.partnerTrustScore >= 70 && prop.partnerTrustScore < 90"
                      [class.border-amber-500/40]="prop.partnerTrustScore >= 70 && prop.partnerTrustScore < 90"
                      [class.text-amber-300]="prop.partnerTrustScore >= 70 && prop.partnerTrustScore < 90">
                      {{ prop.partnerTrustScore }}% Fiable
                    </span>
                  </div>

                  <div class="flex items-center justify-between gap-2 text-[10px] font-mono">
                    <span
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded border"
                      [class.bg-emerald-950/60]="assess.status === 'balanced' && prop.status !== 'locked_scam'"
                      [class.border-emerald-500/40]="assess.status === 'balanced' && prop.status !== 'locked_scam'"
                      [class.text-emerald-300]="assess.status === 'balanced' && prop.status !== 'locked_scam'"
                      [class.bg-amber-950/60]="assess.status === 'caution' && prop.status !== 'locked_scam'"
                      [class.border-amber-500/40]="assess.status === 'caution' && prop.status !== 'locked_scam'"
                      [class.text-amber-300]="assess.status === 'caution' && prop.status !== 'locked_scam'"
                      [class.bg-red-950/80]="assess.status === 'scam_blocked' || prop.status === 'locked_scam'"
                      [class.border-red-500/60]="assess.status === 'scam_blocked' || prop.status === 'locked_scam'"
                      [class.text-red-300]="assess.status === 'scam_blocked' || prop.status === 'locked_scam'">
                      <mat-icon class="text-[12px]">
                        {{ assess.status === 'scam_blocked' ? 'gpp_bad' : assess.status === 'caution' ? 'verified_user' : 'check_circle' }}
                      </mat-icon>
                      <span>{{ proposalStatusLabel(prop, assess) }}</span>
                    </span>
                    <span class="text-[#8b6b43] tabular-nums">Rév. #{{ prop.revision }}</span>
                  </div>
                </button>
              } @empty {
                <div class="p-6 text-center text-xs text-[#8b6b43] bg-[#0d0b09] border border-[#3a2f23] rounded-xl space-y-2">
                  <mat-icon class="text-2xl text-[#8b6b43]">inbox</mat-icon>
                  <div>Aucune proposition dans cette catégorie.</div>
                </div>
              }
            </div>
          </div>

          <!-- RIGHT ESCROW WORKSPACE: COMPOSER OR PROPOSAL INSPECTOR -->
          <div class="lg:col-span-8">
            @if (isComposingProposal()) {
              <!-- ===================================== -->
              <!-- P2P TRADE COMPOSER / COUNTER-OFFER    -->
              <!-- ===================================== -->
              <div class="bg-[#120f0c] border border-[#8b6b43]/60 rounded-2xl p-5 shadow-2xl space-y-5">
                <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#3a2f23]">
                  <div>
                    <h2 class="font-cinzel-dec text-lg font-black text-[#f3ead8] flex items-center gap-2">
                      <mat-icon class="text-[#d4af37]">handshake</mat-icon>
                      <span>
                        @if (editingProposalId()) {
                          Contre-Offre Sécurisée (Réinitialise le Verrou 5s)
                        } @else {
                          Nouvelle Proposition d'Échange Protégée
                        }
                      </span>
                    </h2>
                    <p class="text-xs text-[#8b6b43]">
                      Composez vos deux lots : cartes, potions, réactifs rares, or et gemmes. L'équité est calculée en direct.
                    </p>
                  </div>

                  <button
                    type="button"
                    (click)="cancelComposer()"
                    class="px-3 py-1.5 rounded-lg bg-[#1a1612] hover:bg-[#261f18] border border-[#3a2f23] text-[#c5a880] text-xs font-cinzel inline-flex items-center gap-1 cursor-pointer">
                    <mat-icon class="text-sm">arrow_back</mat-icon>
                    <span>Retour</span>
                  </button>
                </div>

                <!-- Step 1: Select Partner -->
                <div class="p-3.5 bg-[#0d0b09] border border-[#3a2f23] rounded-xl space-y-2.5">
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <span class="text-xs font-cinzel font-bold text-[#d4af37]">1. Duelliste Partenaire</span>
                    @if (selectedPartner(); as sp) {
                      <span class="text-[11px] font-mono text-emerald-400 inline-flex items-center gap-1">
                        <mat-icon class="text-xs">verified_user</mat-icon>
                        <span>{{ sp.username }} · {{ sp.elo }} Elo · Confiance {{ sp.trustScore }}%</span>
                      </span>
                    }
                  </div>
                  @if (!editingProposalId()) {
                    <div class="flex items-stretch gap-2 overflow-x-auto pb-1">
                      @for (p of partnerCandidates(); track p.id) {
                        <button
                          type="button"
                          (click)="composerPartnerId.set(p.id)"
                          class="px-3 py-2 rounded-xl border text-left shrink-0 transition-all flex items-center gap-2 cursor-pointer"
                          [class.bg-[#221a12]]="composerPartnerId() === p.id"
                          [class.border-[#d4af37]]="composerPartnerId() === p.id"
                          [class.bg-[#15110d]]="composerPartnerId() !== p.id"
                          [class.border-[#3a2f23]]="composerPartnerId() !== p.id">
                          <mat-icon class="text-base text-[#d4af37]">{{ p.avatarIcon }}</mat-icon>
                          <div>
                            <div class="font-cinzel font-bold text-xs text-[#f3ead8]">{{ p.username }}</div>
                            <div class="text-[10px] font-mono text-[#8b6b43]">{{ p.guildTag }} · {{ p.elo }} Elo</div>
                          </div>
                        </button>
                      }
                    </div>
                  }
                </div>

                <!-- Step 2: Dual Bundle Editors -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <!-- YOUR OFFER -->
                  <div class="bg-[#16120e] border border-[#3a2f23] rounded-xl p-4 space-y-3">
                    <div class="flex items-center justify-between border-b border-[#3a2f23] pb-2">
                      <span class="font-cinzel font-bold text-xs text-[#fde047] flex items-center gap-1.5">
                        <mat-icon class="text-sm">upload</mat-icon>
                        <span>Ce que Vous Offrez</span>
                      </span>
                      <span class="text-xs font-mono text-[#c5a880] tabular-nums">≈ {{ composerAssessment().offeredValueGold }} Or</span>
                    </div>

                    <!-- Add Card -->
                    <div class="space-y-1">
                      <label for="compYourCard" class="text-[10px] font-cinzel text-[#a38b6d]">Ajouter une de vos Cartes :</label>
                      <div class="flex gap-1.5">
                        <select
                          id="compYourCard"
                          #yourCardSel
                          class="flex-1 min-w-0 bg-[#0d0b09] border border-[#3a2f23] rounded-lg px-2 py-1.5 text-xs text-[#e0dcc7]">
                          @for (c of playerTradableCards(); track c.id) {
                            <option [value]="c.id">{{ c.name }} ({{ rarityLabel(c.rarity) }}) · ~{{ cardValue(c) }} Or</option>
                          }
                        </select>
                        <button
                          type="button"
                          (click)="addCardToComposer('player', yourCardSel.value)"
                          class="px-2.5 py-1.5 rounded-lg bg-[#2a2117] border border-[#d4af37]/50 text-[#fde047] text-xs font-bold cursor-pointer">
                          +
                        </button>
                      </div>
                    </div>

                    <!-- Add Potion -->
                    <div class="space-y-1">
                      <label for="compYourPot" class="text-[10px] font-cinzel text-[#a38b6d]">Ajouter une de vos Potions :</label>
                      <div class="flex gap-1.5">
                        <select
                          id="compYourPot"
                          #yourPotSel
                          class="flex-1 min-w-0 bg-[#0d0b09] border border-[#3a2f23] rounded-lg px-2 py-1.5 text-xs text-[#e0dcc7]">
                          @for (p of playerOwnedPotions(); track p.id) {
                            <option [value]="p.id">{{ p.name }} (Stock {{ p.count }}) · ~{{ potionValue(p) }} Or</option>
                          }
                        </select>
                        <button
                          type="button"
                          (click)="addPotionToComposer('player', yourPotSel.value)"
                          class="px-2.5 py-1.5 rounded-lg bg-[#2a2117] border border-[#d4af37]/50 text-[#fde047] text-xs font-bold cursor-pointer">
                          +
                        </button>
                      </div>
                    </div>

                    <!-- Add Resource -->
                    <div class="space-y-1">
                      <label for="compYourRes" class="text-[10px] font-cinzel text-[#a38b6d]">Ajouter un Réactif Alchimique :</label>
                      <div class="flex gap-1.5">
                        <select
                          id="compYourRes"
                          #yourResSel
                          class="flex-1 min-w-0 bg-[#0d0b09] border border-[#3a2f23] rounded-lg px-2 py-1.5 text-xs text-[#e0dcc7]">
                          @for (r of resourceMetaList(); track r.key) {
                            <option [value]="r.key">{{ r.label }} (Stock {{ ownedResourceStock(r.key) }}) · {{ r.unitValueGold }} Or/u</option>
                          }
                        </select>
                        <button
                          type="button"
                          (click)="addResourceToComposer('player', yourResSel.value)"
                          class="px-2.5 py-1.5 rounded-lg bg-[#2a2117] border border-[#d4af37]/50 text-[#fde047] text-xs font-bold cursor-pointer">
                          +
                        </button>
                      </div>
                    </div>

                    <!-- Gold & Gems -->
                    <div class="grid grid-cols-2 gap-2">
                      <div>
                        <label for="compYourGold" class="text-[10px] font-cinzel text-[#a38b6d]">Or cédé :</label>
                        <input
                          id="compYourGold"
                          type="number"
                          min="0"
                          [max]="gameState.gold()"
                          [value]="composerPlayerBundle().gold"
                          (input)="updateComposerCurrency('player', 'gold', $event)"
                          class="w-full mt-0.5 bg-[#0d0b09] border border-[#3a2f23] rounded-lg px-2.5 py-1.5 text-xs text-[#fde047] font-mono tabular-nums" />
                      </div>
                      <div>
                        <label for="compYourGems" class="text-[10px] font-cinzel text-[#a38b6d]">Gemmes cédées :</label>
                        <input
                          id="compYourGems"
                          type="number"
                          min="0"
                          [max]="gameState.gems()"
                          [value]="composerPlayerBundle().gems"
                          (input)="updateComposerCurrency('player', 'gems', $event)"
                          class="w-full mt-0.5 bg-[#0d0b09] border border-[#3a2f23] rounded-lg px-2.5 py-1.5 text-xs text-[#60a5fa] font-mono tabular-nums" />
                      </div>
                    </div>

                    <!-- Selected Chips -->
                    <div class="space-y-1.5 pt-1 border-t border-[#3a2f23]/70">
                      @for (c of composerPlayerBundle().cards; track c.id) {
                        <div class="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-[#0d0b09] border border-[#3a2f23] text-xs">
                          <span class="truncate text-[#f3ead8]">🃏 {{ c.name }}</span>
                          <div class="flex items-center gap-1.5 shrink-0">
                            <button type="button" (click)="inspectCard(c)" class="text-[#c5a880] hover:text-white cursor-pointer" title="Voir les détails">
                              <mat-icon class="text-sm">visibility</mat-icon>
                            </button>
                            <button type="button" (click)="removeCardFromComposer('player', c.id)" class="text-red-400 hover:text-red-300 cursor-pointer">
                              <mat-icon class="text-sm">close</mat-icon>
                            </button>
                          </div>
                        </div>
                      }
                      @for (p of composerPlayerBundle().potions; track p.potionId) {
                        <div class="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-[#0d0b09] border border-[#3a2f23] text-xs">
                          <span class="truncate text-[#f3ead8]">🧪 {{ p.quantity }}x {{ p.potionData.name }}</span>
                          <button type="button" (click)="removePotionFromComposer('player', p.potionId)" class="text-red-400 hover:text-red-300 cursor-pointer shrink-0">
                            <mat-icon class="text-sm">close</mat-icon>
                          </button>
                        </div>
                      }
                      @for (r of composerPlayerBundle().resources; track r.resourceKey) {
                        <div class="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-[#0d0b09] border border-[#3a2f23] text-xs">
                          <span class="truncate text-[#f3ead8]">✦ {{ r.quantity }}x {{ r.label }}</span>
                          <button type="button" (click)="removeResourceFromComposer('player', r.resourceKey)" class="text-red-400 hover:text-red-300 cursor-pointer shrink-0">
                            <mat-icon class="text-sm">close</mat-icon>
                          </button>
                        </div>
                      }
                    </div>
                  </div>

                  <!-- PARTNER OFFER (WHAT YOU REQUEST) -->
                  <div class="bg-[#16120e] border border-[#3a2f23] rounded-xl p-4 space-y-3">
                    <div class="flex items-center justify-between border-b border-[#3a2f23] pb-2">
                      <span class="font-cinzel font-bold text-xs text-emerald-400 flex items-center gap-1.5">
                        <mat-icon class="text-sm">download</mat-icon>
                        <span>Ce que Vous Demandez</span>
                      </span>
                      <span class="text-xs font-mono text-[#c5a880] tabular-nums">≈ {{ composerAssessment().requestedValueGold }} Or</span>
                    </div>

                    <!-- Request Card -->
                    <div class="space-y-1">
                      <label for="compPartnerCard" class="text-[10px] font-cinzel text-[#a38b6d]">Demander une Carte :</label>
                      <div class="flex gap-1.5">
                        <select
                          id="compPartnerCard"
                          #partnerCardSel
                          class="flex-1 min-w-0 bg-[#0d0b09] border border-[#3a2f23] rounded-lg px-2 py-1.5 text-xs text-[#e0dcc7]">
                          @for (c of partnerCatalogCards(); track c.id) {
                            <option [value]="c.id">{{ c.name }} ({{ rarityLabel(c.rarity) }}) · ~{{ cardValue(c) }} Or</option>
                          }
                        </select>
                        <button
                          type="button"
                          (click)="addCardToComposer('partner', partnerCardSel.value)"
                          class="px-2.5 py-1.5 rounded-lg bg-[#172820] border border-emerald-500/50 text-emerald-300 text-xs font-bold cursor-pointer">
                          +
                        </button>
                      </div>
                    </div>

                    <!-- Request Potion -->
                    <div class="space-y-1">
                      <label for="compPartnerPot" class="text-[10px] font-cinzel text-[#a38b6d]">Demander une Potion :</label>
                      <div class="flex gap-1.5">
                        <select
                          id="compPartnerPot"
                          #partnerPotSel
                          class="flex-1 min-w-0 bg-[#0d0b09] border border-[#3a2f23] rounded-lg px-2 py-1.5 text-xs text-[#e0dcc7]">
                          @for (p of gameState.potions(); track p.id) {
                            <option [value]="p.id">{{ p.name }} ({{ rarityLabel(p.rarity) }}) · ~{{ potionValue(p) }} Or</option>
                          }
                        </select>
                        <button
                          type="button"
                          (click)="addPotionToComposer('partner', partnerPotSel.value)"
                          class="px-2.5 py-1.5 rounded-lg bg-[#172820] border border-emerald-500/50 text-emerald-300 text-xs font-bold cursor-pointer">
                          +
                        </button>
                      </div>
                    </div>

                    <!-- Request Resource -->
                    <div class="space-y-1">
                      <label for="compPartnerRes" class="text-[10px] font-cinzel text-[#a38b6d]">Demander un Réactif :</label>
                      <div class="flex gap-1.5">
                        <select
                          id="compPartnerRes"
                          #partnerResSel
                          class="flex-1 min-w-0 bg-[#0d0b09] border border-[#3a2f23] rounded-lg px-2 py-1.5 text-xs text-[#e0dcc7]">
                          @for (r of resourceMetaList(); track r.key) {
                            <option [value]="r.key">{{ r.label }} ({{ rarityLabel(r.rarity) }}) · {{ r.unitValueGold }} Or/u</option>
                          }
                        </select>
                        <button
                          type="button"
                          (click)="addResourceToComposer('partner', partnerResSel.value)"
                          class="px-2.5 py-1.5 rounded-lg bg-[#172820] border border-emerald-500/50 text-emerald-300 text-xs font-bold cursor-pointer">
                          +
                        </button>
                      </div>
                    </div>

                    <!-- Gold & Gems -->
                    <div class="grid grid-cols-2 gap-2">
                      <div>
                        <label for="compPartnerGold" class="text-[10px] font-cinzel text-[#a38b6d]">Or demandé :</label>
                        <input
                          id="compPartnerGold"
                          type="number"
                          min="0"
                          [value]="composerPartnerBundle().gold"
                          (input)="updateComposerCurrency('partner', 'gold', $event)"
                          class="w-full mt-0.5 bg-[#0d0b09] border border-[#3a2f23] rounded-lg px-2.5 py-1.5 text-xs text-[#fde047] font-mono tabular-nums" />
                      </div>
                      <div>
                        <label for="compPartnerGems" class="text-[10px] font-cinzel text-[#a38b6d]">Gemmes demandées :</label>
                        <input
                          id="compPartnerGems"
                          type="number"
                          min="0"
                          [value]="composerPartnerBundle().gems"
                          (input)="updateComposerCurrency('partner', 'gems', $event)"
                          class="w-full mt-0.5 bg-[#0d0b09] border border-[#3a2f23] rounded-lg px-2.5 py-1.5 text-xs text-[#60a5fa] font-mono tabular-nums" />
                      </div>
                    </div>

                    <!-- Requested Chips -->
                    <div class="space-y-1.5 pt-1 border-t border-[#3a2f23]/70">
                      @for (c of composerPartnerBundle().cards; track c.id) {
                        <div class="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-[#0d0b09] border border-[#3a2f23] text-xs">
                          <span class="truncate text-[#f3ead8]">🃏 {{ c.name }}</span>
                          <div class="flex items-center gap-1.5 shrink-0">
                            <button type="button" (click)="inspectCard(c)" class="text-[#c5a880] hover:text-white cursor-pointer" title="Voir les détails">
                              <mat-icon class="text-sm">visibility</mat-icon>
                            </button>
                            <button type="button" (click)="removeCardFromComposer('partner', c.id)" class="text-red-400 hover:text-red-300 cursor-pointer">
                              <mat-icon class="text-sm">close</mat-icon>
                            </button>
                          </div>
                        </div>
                      }
                      @for (p of composerPartnerBundle().potions; track p.potionId) {
                        <div class="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-[#0d0b09] border border-[#3a2f23] text-xs">
                          <span class="truncate text-[#f3ead8]">🧪 {{ p.quantity }}x {{ p.potionData.name }}</span>
                          <button type="button" (click)="removePotionFromComposer('partner', p.potionId)" class="text-red-400 hover:text-red-300 cursor-pointer shrink-0">
                            <mat-icon class="text-sm">close</mat-icon>
                          </button>
                        </div>
                      }
                      @for (r of composerPartnerBundle().resources; track r.resourceKey) {
                        <div class="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-[#0d0b09] border border-[#3a2f23] text-xs">
                          <span class="truncate text-[#f3ead8]">✦ {{ r.quantity }}x {{ r.label }}</span>
                          <button type="button" (click)="removeResourceFromComposer('partner', r.resourceKey)" class="text-red-400 hover:text-red-300 cursor-pointer shrink-0">
                            <mat-icon class="text-sm">close</mat-icon>
                          </button>
                        </div>
                      }
                    </div>
                  </div>
                </div>

                <!-- Note + Live Fairness Meter -->
                <div class="space-y-3">
                  <div>
                    <label for="composerNoteInput" class="block text-xs font-cinzel text-[#c5a880] mb-1">Message au partenaire (optionnel) :</label>
                    <input
                      id="composerNoteInput"
                      type="text"
                      [value]="composerNote()"
                      (input)="onComposerNoteInput($event)"
                      placeholder="Ex : Échange pour compléter mon deck Tournoi..."
                      class="w-full bg-[#0d0b09] border border-[#3a2f23] rounded-xl px-3 py-2 text-xs text-[#e0dcc7] focus:outline-none focus:border-[#d4af37]" />
                  </div>

                  @let compFair = composerAssessment();
                  <div
                    class="p-4 rounded-xl border space-y-2"
                    [class.bg-emerald-950/30]="compFair.status === 'balanced'"
                    [class.border-emerald-500/40]="compFair.status === 'balanced'"
                    [class.bg-amber-950/30]="compFair.status === 'caution'"
                    [class.border-amber-500/40]="compFair.status === 'caution'"
                    [class.bg-red-950/40]="compFair.status === 'scam_blocked'"
                    [class.border-red-500/60]="compFair.status === 'scam_blocked'">
                    <div class="flex flex-wrap items-center justify-between gap-2">
                      <span class="font-cinzel font-bold text-xs flex items-center gap-1.5"
                        [class.text-emerald-300]="compFair.status === 'balanced'"
                        [class.text-amber-300]="compFair.status === 'caution'"
                        [class.text-red-300]="compFair.status === 'scam_blocked'">
                        <mat-icon class="text-base">
                          {{ compFair.status === 'scam_blocked' ? 'gpp_bad' : compFair.status === 'caution' ? 'verified_user' : 'balance' }}
                        </mat-icon>
                        <span>{{ compFair.statusLabel }}</span>
                      </span>
                      <span class="font-mono text-xs text-[#e0dcc7] tabular-nums">
                        Vous : {{ compFair.offeredValueGold }} Or ↔ Reçu : {{ compFair.requestedValueGold }} Or ({{ compFair.ratioPct }}%)
                      </span>
                    </div>
                    <p class="text-xs text-[#c5a880]">{{ compFair.summary }}</p>
                    @for (warn of compFair.warnings; track warn) {
                      <div class="text-[11px] text-[#e0dcc7]/90 flex items-start gap-1.5">
                        <mat-icon class="text-xs mt-0.5 shrink-0">info</mat-icon>
                        <span>{{ warn }}</span>
                      </div>
                    }
                  </div>
                </div>

                <div class="flex items-center justify-end gap-3 pt-1">
                  <button
                    type="button"
                    (click)="cancelComposer()"
                    class="medieval-btn px-5 py-2.5 rounded-xl font-cinzel font-bold text-xs cursor-pointer">
                    Annuler
                  </button>
                  <button
                    type="button"
                    (click)="submitComposer()"
                    [disabled]="composerAssessment().status === 'scam_blocked'"
                    class="gold-btn px-6 py-2.5 rounded-xl font-cinzel font-bold text-xs inline-flex items-center gap-2 cursor-pointer"
                    [class.opacity-50]="composerAssessment().status === 'scam_blocked'">
                    <mat-icon class="text-base">send</mat-icon>
                    <span>{{ editingProposalId() ? 'Envoyer la Contre-Offre' : 'Transmettre la Proposition Escrow' }}</span>
                  </button>
                </div>
              </div>
            } @else if (selectedProposal(); as prop) {
              <!-- ===================================== -->
              <!-- PROTECTED ESCROW PROPOSAL INSPECTOR   -->
              <!-- ===================================== -->
              @let fair = assessProposal(prop);
              @let lockSecs = remainingInspectionSeconds(prop);

              <div class="relative overflow-hidden bg-[#120f0c] border border-[#8b6b43]/50 rounded-2xl p-5 shadow-2xl space-y-5">

                <!-- Magical Smoke Overlay when Sealing P2P Escrow -->
                @if (p2pSmokeBurst(); as pBurst) {
                  <div class="magic-smoke-chamber bg-[#0a0d0b]/80 backdrop-blur-[2px]" aria-live="polite">
                    <div class="magic-smoke-vortex"></div>
                    <div class="magic-smoke-ring"></div>
                    @for (plume of smokePlumes; track plume.id) {
                      <span
                        class="magic-smoke-plume"
                        [style.--sx]="plume.sx"
                        [style.--sy]="plume.sy"
                        [style.--sr]="plume.sr"
                        [style.--sz]="plume.sz"
                        [style.--dur]="plume.dur"
                        [style.--del]="plume.del"
                        [style.--c-core]="plume.coreColor"
                        [style.--c-mid]="plume.midColor"></span>
                    }
                    @for (spark of smokeSparks; track spark.id) {
                      <span
                        class="magic-smoke-spark"
                        [style.--px]="spark.px"
                        [style.--py]="spark.py"
                        [style.--dur]="spark.dur"
                        [style.--del]="spark.del"></span>
                    }
                    <div class="magic-smoke-seal flex flex-col items-center text-center px-6 py-5 rounded-2xl bg-[#120f0c]/95 border border-emerald-400/70 shadow-2xl">
                      <mat-icon class="text-4xl text-emerald-400 mb-1.5">verified</mat-icon>
                      <div class="font-cinzel-dec text-base font-black text-[#fde047]">Contrat Escrow Scellé</div>
                      <div class="text-xs font-serif text-[#e0dcc7] mt-1">Échange avec {{ pBurst.partnerName }} exécuté</div>
                    </div>
                  </div>
                }

                <!-- Partner Header + Escrow Metadata -->
                <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#3a2f23]">
                  <div class="flex items-center gap-3">
                    <div
                      class="w-12 h-12 rounded-xl bg-[#0d0b09] border-2 flex items-center justify-center shrink-0"
                      [class.border-red-500]="prop.partnerTrustScore < 70"
                      [class.text-red-400]="prop.partnerTrustScore < 70"
                      [class.border-[#d4af37]]="prop.partnerTrustScore >= 70"
                      [class.text-[#d4af37]]="prop.partnerTrustScore >= 70">
                      <mat-icon class="text-2xl">{{ prop.partnerAvatar }}</mat-icon>
                    </div>
                    <div>
                      <div class="flex flex-wrap items-center gap-2">
                        <h2 class="font-cinzel-dec text-lg font-black text-[#f3ead8]">{{ prop.partnerName }}</h2>
                        @if (prop.partnerGuildTag) {
                          <span class="text-xs font-mono text-[#8b6b43]">{{ prop.partnerGuildTag }}</span>
                        }
                        <span
                          class="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border"
                          [class.bg-emerald-950/70]="prop.partnerTrustScore >= 90"
                          [class.border-emerald-500/40]="prop.partnerTrustScore >= 90"
                          [class.text-emerald-300]="prop.partnerTrustScore >= 90"
                          [class.bg-red-950/70]="prop.partnerTrustScore < 70"
                          [class.border-red-500/60]="prop.partnerTrustScore < 70"
                          [class.text-red-300]="prop.partnerTrustScore < 70">
                          Fiabilité {{ prop.partnerTrustScore }}% · {{ prop.partnerCompletedTrades }} trocs
                        </span>
                      </div>
                      <div class="text-xs font-mono text-[#8b6b43] flex flex-wrap items-center gap-2 mt-0.5">
                        <span>{{ prop.partnerElo }} Elo</span>
                        <span aria-hidden="true">·</span>
                        <span>Contrat : {{ prop.escrowHash }}</span>
                        <span aria-hidden="true">·</span>
                        <span>Rév. #{{ prop.revision }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="flex items-center gap-2 text-xs font-mono">
                    <span
                      class="px-2.5 py-1 rounded-lg border inline-flex items-center gap-1"
                      [class.bg-emerald-950/60]="prop.partnerConfirmed"
                      [class.border-emerald-500/40]="prop.partnerConfirmed"
                      [class.text-emerald-300]="prop.partnerConfirmed"
                      [class.bg-[#1a1612]]="!prop.partnerConfirmed"
                      [class.border-[#3a2f23]]="!prop.partnerConfirmed"
                      [class.text-[#8b6b43]]="!prop.partnerConfirmed">
                      <mat-icon class="text-sm">{{ prop.partnerConfirmed ? 'check_circle' : 'hourglass_top' }}</mat-icon>
                      <span>{{ prop.partnerConfirmed ? 'Partenaire prêt' : 'En attente partenaire' }}</span>
                    </span>
                  </div>
                </div>

                @if (prop.note) {
                  <div class="px-3.5 py-2.5 rounded-xl bg-[#1a1612] border border-[#3a2f23] text-xs font-serif italic text-[#c5a880] flex items-start gap-2">
                    <mat-icon class="text-base text-[#d4af37] shrink-0">format_quote</mat-icon>
                    <span>« {{ prop.note }} »</span>
                  </div>
                }

                <!-- DUAL-SIDE BUNDLE COMPARISON (CLICKABLE ITEMS FOR FULL DETAILS) -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <!-- LEFT: WHAT YOU GIVE -->
                  <div class="bg-[#0d0b09] border border-[#3a2f23] rounded-xl p-4 space-y-3">
                    <div class="flex items-center justify-between border-b border-[#3a2f23] pb-2">
                      <span class="font-cinzel font-bold text-xs text-[#fca5a5] flex items-center gap-1.5">
                        <mat-icon class="text-sm">arrow_upward</mat-icon>
                        <span>Vous Cédez</span>
                      </span>
                      <span class="font-mono font-bold text-xs text-[#fde047] tabular-nums">
                        Valeur : {{ fair.offeredValueGold }} Or
                      </span>
                    </div>

                    <div class="space-y-2">
                      @for (card of prop.playerOffers.cards; track card.id) {
                        <button
                          type="button"
                          (click)="inspectCard(card)"
                          class="w-full text-left p-2.5 rounded-xl bg-[#16120e] border hover:border-[#d4af37] transition-all flex items-center gap-3 cursor-pointer"
                          [class.border-amber-500/50]="card.rarity === 'legendary' || card.rarity === 'mythic'"
                          [class.border-[#3a2f23]]="card.rarity !== 'legendary' && card.rarity !== 'mythic'">
                          <div class="w-11 h-14 rounded-lg bg-[#0d0b09] border border-[#8b6b43] overflow-hidden shrink-0 flex items-center justify-center">
                            @if (card.imageUrl) {
                              <img [src]="card.imageUrl" [alt]="card.name" class="w-full h-full object-cover" referrerpolicy="no-referrer" />
                            } @else {
                              <mat-icon class="text-lg text-[#d4af37]">{{ card.icon }}</mat-icon>
                            }
                          </div>
                          <div class="min-w-0 flex-1">
                            <div class="font-cinzel font-bold text-xs text-[#f3ead8] truncate">{{ card.name }}</div>
                            <div class="text-[10px] font-mono text-[#d4af37]">
                              {{ rarityLabel(card.rarity) }} · Niv.{{ card.level }} {{ card.foil ? '· Foil' : '' }}
                            </div>
                            <div class="text-[10px] font-mono text-[#8b6b43]">
                              Est. {{ cardValue(card) }} Or · Cliquer pour inspecter
                            </div>
                          </div>
                          <mat-icon class="text-base text-[#8b6b43] shrink-0">zoom_in</mat-icon>
                        </button>
                      }

                      @for (pot of prop.playerOffers.potions; track pot.potionId) {
                        <button
                          type="button"
                          (click)="inspectPotion(pot.potionData, pot.quantity)"
                          class="w-full text-left p-2.5 rounded-xl bg-[#16120e] border border-[#3a2f23] hover:border-[#d4af37] transition-all flex items-center gap-3 cursor-pointer">
                          <div class="w-11 h-11 rounded-lg bg-[#0d0b09] border border-[#8b6b43] overflow-hidden shrink-0 flex items-center justify-center">
                            @if (pot.potionData.imageUrl) {
                              <img [src]="pot.potionData.imageUrl" [alt]="pot.potionData.name" class="w-full h-full object-cover" referrerpolicy="no-referrer" />
                            } @else {
                              <mat-icon class="text-lg text-[#d4af37]">{{ pot.potionData.icon }}</mat-icon>
                            }
                          </div>
                          <div class="min-w-0 flex-1">
                            <div class="font-cinzel font-bold text-xs text-[#f3ead8] truncate">{{ pot.potionData.name }} (x{{ pot.quantity }})</div>
                            <div class="text-[10px] font-mono text-[#d4af37]">{{ pot.potionData.effectLabel }}</div>
                            <div class="text-[10px] font-mono text-[#8b6b43]">Est. {{ potionValue(pot.potionData, pot.quantity) }} Or · Inspecter</div>
                          </div>
                          <mat-icon class="text-base text-[#8b6b43] shrink-0">zoom_in</mat-icon>
                        </button>
                      }

                      @for (res of prop.playerOffers.resources; track res.resourceKey) {
                        <button
                          type="button"
                          (click)="inspectResource(res)"
                          class="w-full text-left p-2.5 rounded-xl bg-[#16120e] border hover:border-[#d4af37] transition-all flex items-center gap-3 cursor-pointer"
                          [class.border-purple-500/50]="isRareResourceKey(res.resourceKey)"
                          [class.border-[#3a2f23]]="!isRareResourceKey(res.resourceKey)">
                          <div class="w-11 h-11 rounded-lg bg-[#0d0b09] border border-[#8b6b43] overflow-hidden shrink-0">
                            <img [src]="res.imageUrl" [alt]="res.label" class="w-full h-full object-cover" referrerpolicy="no-referrer" />
                          </div>
                          <div class="min-w-0 flex-1">
                            <div class="font-cinzel font-bold text-xs text-[#f3ead8] truncate">{{ res.label }} (x{{ res.quantity }})</div>
                            <div class="text-[10px] font-mono text-[#d4af37]">
                              {{ rarityLabel(res.rarity) }}{{ isRareResourceKey(res.resourceKey) ? ' · Réactif Rare Protégé' : '' }}
                            </div>
                            <div class="text-[10px] font-mono text-[#8b6b43]">Est. {{ res.unitValueGold * res.quantity }} Or · Inspecter</div>
                          </div>
                          <mat-icon class="text-base text-[#8b6b43] shrink-0">zoom_in</mat-icon>
                        </button>
                      }

                      @if (prop.playerOffers.gold > 0 || prop.playerOffers.gems > 0) {
                        <div class="p-2.5 rounded-xl bg-[#16120e] border border-[#3a2f23] flex flex-wrap items-center gap-2 font-mono text-xs">
                          <span class="text-[#8b6b43]">Monnaie :</span>
                          @if (prop.playerOffers.gold > 0) {
                            <span class="currency-pill-gold flex items-center gap-1">
                              <span class="currency-gold-coin text-xs">✦</span>
                              <span class="currency-gold-shine font-extrabold">{{ prop.playerOffers.gold }}</span>
                            </span>
                          }
                          @if (prop.playerOffers.gems > 0) {
                            <span class="currency-pill-gem flex items-center gap-1">
                              <span class="currency-gem-facet text-xs">⬥</span>
                              <span class="currency-gem-shine font-extrabold">{{ prop.playerOffers.gems }}</span>
                            </span>
                          }
                        </div>
                      }
                    </div>
                  </div>

                  <!-- RIGHT: WHAT YOU RECEIVE -->
                  <div class="bg-[#0d0b09] border border-[#3a2f23] rounded-xl p-4 space-y-3">
                    <div class="flex items-center justify-between border-b border-[#3a2f23] pb-2">
                      <span class="font-cinzel font-bold text-xs text-emerald-400 flex items-center gap-1.5">
                        <mat-icon class="text-sm">arrow_downward</mat-icon>
                        <span>Vous Recevez</span>
                      </span>
                      <span class="font-mono font-bold text-xs text-emerald-300 tabular-nums">
                        Valeur : {{ fair.requestedValueGold }} Or
                      </span>
                    </div>

                    <div class="space-y-2">
                      @for (card of prop.partnerOffers.cards; track card.id) {
                        <button
                          type="button"
                          (click)="inspectCard(card, prop.partnerName, prop.partnerTrustScore)"
                          class="w-full text-left p-2.5 rounded-xl bg-[#16120e] border hover:border-[#d4af37] transition-all flex items-center gap-3 cursor-pointer"
                          [class.border-amber-500/50]="card.rarity === 'legendary' || card.rarity === 'mythic'"
                          [class.border-[#3a2f23]]="card.rarity !== 'legendary' && card.rarity !== 'mythic'">
                          <div class="w-11 h-14 rounded-lg bg-[#0d0b09] border border-[#8b6b43] overflow-hidden shrink-0 flex items-center justify-center">
                            @if (card.imageUrl) {
                              <img [src]="card.imageUrl" [alt]="card.name" class="w-full h-full object-cover" referrerpolicy="no-referrer" />
                            } @else {
                              <mat-icon class="text-lg text-[#d4af37]">{{ card.icon }}</mat-icon>
                            }
                          </div>
                          <div class="min-w-0 flex-1">
                            <div class="font-cinzel font-bold text-xs text-[#f3ead8] truncate">{{ card.name }}</div>
                            <div class="text-[10px] font-mono text-[#d4af37]">
                              {{ rarityLabel(card.rarity) }} · Niv.{{ card.level }} {{ card.foil ? '· Foil' : '' }}
                            </div>
                            <div class="text-[10px] font-mono text-[#8b6b43]">
                              Est. {{ cardValue(card) }} Or · Cliquer pour inspecter
                            </div>
                          </div>
                          <mat-icon class="text-base text-[#8b6b43] shrink-0">zoom_in</mat-icon>
                        </button>
                      }

                      @for (pot of prop.partnerOffers.potions; track pot.potionId) {
                        <button
                          type="button"
                          (click)="inspectPotion(pot.potionData, pot.quantity, prop.partnerName, prop.partnerTrustScore)"
                          class="w-full text-left p-2.5 rounded-xl bg-[#16120e] border border-[#3a2f23] hover:border-[#d4af37] transition-all flex items-center gap-3 cursor-pointer">
                          <div class="w-11 h-11 rounded-lg bg-[#0d0b09] border border-[#8b6b43] overflow-hidden shrink-0 flex items-center justify-center">
                            @if (pot.potionData.imageUrl) {
                              <img [src]="pot.potionData.imageUrl" [alt]="pot.potionData.name" class="w-full h-full object-cover" referrerpolicy="no-referrer" />
                            } @else {
                              <mat-icon class="text-lg text-[#d4af37]">{{ pot.potionData.icon }}</mat-icon>
                            }
                          </div>
                          <div class="min-w-0 flex-1">
                            <div class="font-cinzel font-bold text-xs text-[#f3ead8] truncate">{{ pot.potionData.name }} (x{{ pot.quantity }})</div>
                            <div class="text-[10px] font-mono text-[#d4af37]">{{ pot.potionData.effectLabel }}</div>
                            <div class="text-[10px] font-mono text-[#8b6b43]">Est. {{ potionValue(pot.potionData, pot.quantity) }} Or · Inspecter</div>
                          </div>
                          <mat-icon class="text-base text-[#8b6b43] shrink-0">zoom_in</mat-icon>
                        </button>
                      }

                      @for (res of prop.partnerOffers.resources; track res.resourceKey) {
                        <button
                          type="button"
                          (click)="inspectResource(res, prop.partnerName)"
                          class="w-full text-left p-2.5 rounded-xl bg-[#16120e] border hover:border-[#d4af37] transition-all flex items-center gap-3 cursor-pointer"
                          [class.border-purple-500/50]="isRareResourceKey(res.resourceKey)"
                          [class.border-[#3a2f23]]="!isRareResourceKey(res.resourceKey)">
                          <div class="w-11 h-11 rounded-lg bg-[#0d0b09] border border-[#8b6b43] overflow-hidden shrink-0">
                            <img [src]="res.imageUrl" [alt]="res.label" class="w-full h-full object-cover" referrerpolicy="no-referrer" />
                          </div>
                          <div class="min-w-0 flex-1">
                            <div class="font-cinzel font-bold text-xs text-[#f3ead8] truncate">{{ res.label }} (x{{ res.quantity }})</div>
                            <div class="text-[10px] font-mono text-[#d4af37]">
                              {{ rarityLabel(res.rarity) }}{{ isRareResourceKey(res.resourceKey) ? ' · Réactif Rare Protégé' : '' }}
                            </div>
                            <div class="text-[10px] font-mono text-[#8b6b43]">Est. {{ res.unitValueGold * res.quantity }} Or · Inspecter</div>
                          </div>
                          <mat-icon class="text-base text-[#8b6b43] shrink-0">zoom_in</mat-icon>
                        </button>
                      }

                      @if (prop.partnerOffers.gold > 0 || prop.partnerOffers.gems > 0) {
                        <div class="p-2.5 rounded-xl bg-[#16120e] border border-[#3a2f23] flex flex-wrap items-center gap-2 font-mono text-xs">
                          <span class="text-[#8b6b43]">Monnaie :</span>
                          @if (prop.partnerOffers.gold > 0) {
                            <span class="currency-pill-gold flex items-center gap-1">
                              <span class="currency-gold-coin text-xs">✦</span>
                              <span class="currency-gold-shine font-extrabold">{{ prop.partnerOffers.gold }}</span>
                            </span>
                          }
                          @if (prop.partnerOffers.gems > 0) {
                            <span class="currency-pill-gem flex items-center gap-1">
                              <span class="currency-gem-facet text-xs">⬥</span>
                              <span class="currency-gem-shine font-extrabold">{{ prop.partnerOffers.gems }}</span>
                            </span>
                          }
                        </div>
                      }
                    </div>
                  </div>
                </div>

                <!-- FAIRNESS METER & ANTI-SCAM SHIELD ANALYSIS -->
                <div
                  class="p-4 rounded-xl border space-y-3"
                  [class.bg-emerald-950/25]="fair.status === 'balanced'"
                  [class.border-emerald-500/40]="fair.status === 'balanced'"
                  [class.bg-amber-950/25]="fair.status === 'caution'"
                  [class.border-amber-500/40]="fair.status === 'caution'"
                  [class.bg-red-950/40]="fair.status === 'scam_blocked'"
                  [class.border-red-500/60]="fair.status === 'scam_blocked'">

                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <div class="flex items-center gap-2">
                      <mat-icon
                        class="text-xl"
                        [class.text-emerald-400]="fair.status === 'balanced'"
                        [class.text-amber-400]="fair.status === 'caution'"
                        [class.text-red-400]="fair.status === 'scam_blocked'">
                        {{ fair.status === 'scam_blocked' ? 'gpp_bad' : fair.status === 'caution' ? 'shield' : 'verified_user' }}
                      </mat-icon>
                      <div>
                        <div
                          class="font-cinzel font-bold text-xs"
                          [class.text-emerald-300]="fair.status === 'balanced'"
                          [class.text-amber-300]="fair.status === 'caution'"
                          [class.text-red-300]="fair.status === 'scam_blocked'">
                          {{ fair.statusLabel }}
                        </div>
                        <div class="text-[11px] text-[#c5a880]">{{ fair.summary }}</div>
                      </div>
                    </div>

                    <div class="text-right font-mono text-xs tabular-nums">
                      <div class="text-[#f3ead8] font-bold">Indice d'équité : {{ fair.ratioPct }}%</div>
                      <div class="text-[10px] text-[#8b6b43]">Écart : {{ fair.imbalancePct }}%</div>
                    </div>
                  </div>

                  <!-- Visual Balance Bar -->
                  <div class="w-full h-2 rounded-full bg-[#0d0b09] border border-[#3a2f23] overflow-hidden">
                    <div
                      class="h-full transition-all duration-300"
                      [style.width.%]="fairRatioBarPct(fair)"
                      [class.bg-emerald-500]="fair.status === 'balanced'"
                      [class.bg-amber-400]="fair.status === 'caution'"
                      [class.bg-red-500]="fair.status === 'scam_blocked'"></div>
                  </div>

                  @if (fair.warnings.length > 0) {
                    <div class="space-y-1">
                      @for (w of fair.warnings; track w) {
                        <div class="text-xs flex items-start gap-1.5 text-[#f3ead8]/90">
                          <mat-icon class="text-sm shrink-0 mt-0.5 text-[#fbbf24]">warning_amber</mat-icon>
                          <span>{{ w }}</span>
                        </div>
                      }
                    </div>
                  }

                  @if (fair.highValueFlags.length > 0) {
                    <div class="flex flex-wrap gap-1.5 pt-1">
                      @for (flag of fair.highValueFlags; track flag) {
                        <span class="px-2 py-0.5 rounded-md bg-[#120f0c]/90 border border-[#d4af37]/40 text-[10px] font-mono text-[#fde047]">
                          ✦ {{ flag }}
                        </span>
                      }
                    </div>
                  }
                </div>

                <!-- SECURITY GATES BEFORE CONFIRMATION -->
                @if (prop.status === 'pending_review' || prop.status === 'locked_scam') {
                  @if (lockSecs > 0) {
                    <div class="px-4 py-3 rounded-xl bg-amber-950/40 border border-amber-500/50 text-amber-200 text-xs flex items-center justify-between gap-3">
                      <div class="flex items-center gap-2">
                        <mat-icon class="text-base text-amber-400 animate-spin">sync</mat-icon>
                        <span>Verrou d'inspection anti-substitution actif : examinez chaque objet avant de sceller.</span>
                      </div>
                      <span class="font-mono font-black text-sm tabular-nums text-[#fde047] shrink-0">{{ lockSecs }}s</span>
                    </div>
                  }

                  @if (fair.status !== 'scam_blocked' && fair.requiresDoubleConfirm) {
                    <label class="flex items-start gap-3 p-3.5 rounded-xl bg-[#1a1612] border border-[#d4af37]/50 cursor-pointer hover:bg-[#221c15] transition-colors">
                      <input
                        type="checkbox"
                        [checked]="prop.highValueVerified"
                        (change)="toggleHighValueCheck(prop.id, $event)"
                        class="mt-0.5 w-4 h-4 accent-[#d4af37] cursor-pointer" />
                      <span class="text-xs text-[#e0dcc7] leading-relaxed">
                        <strong class="text-[#fde047] font-cinzel">Double Vérification Objets Rares :</strong>
                        J'ai inspecté les fiches détaillées et je confirme vouloir échanger ces cartes ou réactifs rares aux conditions ci-dessus.
                      </span>
                    </label>
                  }

                  <!-- Action Footer -->
                  <div class="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#3a2f23]">
                    <div class="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        (click)="openCounterOffer(prop)"
                        class="medieval-btn px-3.5 py-2 rounded-xl font-cinzel font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer">
                        <mat-icon class="text-sm text-[#d4af37]">edit_note</mat-icon>
                        <span>Contre-Proposer</span>
                      </button>

                      @if (fair.status === 'scam_blocked' || prop.status === 'locked_scam') {
                        <button
                          type="button"
                          (click)="gameState.rejectOrCancelDirectTrade(prop.id, true)"
                          class="crimson-btn px-4 py-2 rounded-xl font-cinzel font-bold text-xs text-white border border-[#ff4d4d] inline-flex items-center gap-1.5 cursor-pointer">
                          <mat-icon class="text-sm">report_problem</mat-icon>
                          <span>Rejeter & Signaler l'Arnaque</span>
                        </button>
                      } @else {
                        <button
                          type="button"
                          (click)="gameState.rejectOrCancelDirectTrade(prop.id, false)"
                          class="px-3.5 py-2 rounded-xl bg-[#1a1612] hover:bg-[#271b18] border border-[#3a2f23] text-[#fca5a5] font-cinzel font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer">
                          <mat-icon class="text-sm">cancel</mat-icon>
                          <span>Décliner</span>
                        </button>
                      }
                    </div>

                    <button
                      type="button"
                      (click)="sealDirectTrade(prop)"
                      [disabled]="!canConfirmProposal(prop, fair, lockSecs)"
                      class="gold-btn px-5 py-2.5 rounded-xl font-cinzel font-bold text-xs inline-flex items-center gap-2 cursor-pointer"
                      [class.opacity-45]="!canConfirmProposal(prop, fair, lockSecs)">
                      <mat-icon class="text-base">{{ fair.status === 'scam_blocked' ? 'block' : 'verified' }}</mat-icon>
                      <span>
                        @if (fair.status === 'scam_blocked') {
                          Bloqué par Sécurité
                        } @else if (lockSecs > 0) {
                          Verrou ({{ lockSecs }}s)
                        } @else {
                          Sceller & Confirmer l'Échange
                        }
                      </span>
                    </button>
                  </div>
                } @else {
                  <div class="p-3.5 rounded-xl bg-[#1a1612] border border-[#3a2f23] flex items-center justify-between text-xs">
                    <span class="font-cinzel font-bold text-[#c5a880] flex items-center gap-2">
                      <mat-icon class="text-base text-[#d4af37]">inventory_2</mat-icon>
                      <span>Statut du contrat : {{ prop.updatedAt }}</span>
                    </span>
                    <span class="font-mono text-[#8b6b43]">{{ prop.escrowHash }}</span>
                  </div>
                }
              </div>
            } @else {
              <div class="bg-[#120f0c] border border-[#3a2f23] rounded-2xl p-10 text-center space-y-3">
                <mat-icon class="text-4xl text-[#d4af37]">security</mat-icon>
                <h3 class="font-cinzel font-bold text-base text-[#f3ead8]">Chambre d'Échange Sécurisée</h3>
                <p class="text-xs text-[#8b6b43] max-w-md mx-auto">
                  Sélectionnez une proposition à gauche pour inspecter les objets en séquestre ou créez une nouvelle proposition d'échange.
                </p>
                <button
                  type="button"
                  (click)="startNewProposal()"
                  class="gold-btn px-5 py-2.5 rounded-xl font-cinzel font-bold text-xs inline-flex items-center gap-2 cursor-pointer">
                  <mat-icon class="text-base">handshake</mat-icon>
                  <span>Nouvel Échange P2P</span>
                </button>
              </div>
            }
          </div>
        </section>
      }

      <!-- ======================================================== -->
      <!-- TAB 2: ÉTALAGES PUBLICS & GLISSER-DÉPOSER                 -->
      <!-- ======================================================== -->
      @if (activeTab() === 'market') {
        <!-- INTERACTIVE DRAG-AND-DROP TRADING WORKBENCH -->
        <section aria-label="Autel de glisser-déposer pour les échanges" class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">

          <!-- LEFT ZONE: COFFRE D'ACQUISITION (DROP OFFER TO BUY) -->
          <div
            (dragover)="onBuyDragOver($event)"
            (dragleave)="onBuyDragLeave($event)"
            (drop)="onBuyDrop($event)"
            class="lg:col-span-5 relative overflow-hidden bg-[#120f0c] border-2 rounded-2xl p-5 shadow-xl flex flex-col justify-between trade-dropzone"
            [class.border-[#3a2f23]]="!draggedOfferId() && !isBuyDropOver()"
            [class.border-dashed]="!stagedBuyOffer() && !buySmokeBurst()"
            [class.trade-dropzone-ready]="!!draggedOfferId() && !isBuyDropOver()"
            [class.trade-dropzone-active]="isBuyDropOver()">

            <!-- Volumetric Magical Smoke VFX Overlay on Purchase Confirmation -->
            @if (buySmokeBurst(); as burst) {
              <div class="magic-smoke-chamber bg-[#0a0d0b]/70 backdrop-blur-[2px]" aria-live="polite">
                <div class="magic-smoke-vortex"></div>
                <div class="magic-smoke-ring"></div>
                @for (plume of smokePlumes; track plume.id) {
                  <span
                    class="magic-smoke-plume"
                    [style.--sx]="plume.sx"
                    [style.--sy]="plume.sy"
                    [style.--sr]="plume.sr"
                    [style.--sz]="plume.sz"
                    [style.--dur]="plume.dur"
                    [style.--del]="plume.del"
                    [style.--c-core]="plume.coreColor"
                    [style.--c-mid]="plume.midColor"></span>
                }
                @for (spark of smokeSparks; track spark.id) {
                  <span
                    class="magic-smoke-spark"
                    [style.--px]="spark.px"
                    [style.--py]="spark.py"
                    [style.--dur]="spark.dur"
                    [style.--del]="spark.del"></span>
                }
                <div class="magic-smoke-seal flex flex-col items-center text-center px-5 py-4 rounded-2xl bg-[#120f0c]/90 border border-emerald-400/70 shadow-2xl">
                  <mat-icon class="text-4xl text-emerald-400 mb-1">auto_awesome</mat-icon>
                  <div class="font-cinzel-dec text-sm font-black text-[#fde047] tracking-wide">Transaction Scellée</div>
                  <div class="text-xs font-serif text-[#e0dcc7] mt-0.5 max-w-[230px] truncate">{{ burst.itemName }}</div>
                </div>
              </div>
            }

            <!-- Header -->
            <div class="flex items-center justify-between gap-2 pb-3 border-b border-[#3a2f23]">
              <div class="flex items-center gap-2 min-w-0">
                <div class="w-9 h-9 rounded-xl bg-[#1a1612] border border-[#8b6b43]/60 flex items-center justify-center text-[#d4af37] shrink-0">
                  <mat-icon class="text-lg">move_to_inbox</mat-icon>
                </div>
                <div class="min-w-0">
                  <h2 class="font-cinzel font-bold text-sm text-[#f3ead8] truncate">Coffre d'Acquisition</h2>
                  <p class="text-[11px] text-[#8b6b43] truncate">Glissez une offre ici pour l'inspecter et acheter</p>
                </div>
              </div>

              @if (stagedBuyOffer()) {
                <button
                  type="button"
                  (click)="clearStagedBuy()"
                  class="px-2.5 py-1 rounded-lg bg-[#1a1612] hover:bg-[#261f18] border border-[#3a2f23] text-[#c5a880] hover:text-white text-xs font-cinzel inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer transition-colors">
                  <mat-icon class="text-sm">close</mat-icon>
                  <span>Retirer</span>
                </button>
              }
            </div>

            <!-- Pedestal Body -->
            @if (stagedBuyOffer(); as staged) {
              @let stagedFair = gameState.assessMarketOffer(staged);
              <div class="py-4 space-y-3 animate-trade-snap" [attr.data-snap]="buySnapKey()">
                <div class="p-3.5 bg-[#1a1612] border border-[#d4af37]/60 rounded-xl flex items-center gap-3.5 shadow-lg">
                  @if (staged.cardData; as card) {
                    <div class="w-16 h-20 rounded-xl bg-[#0d0b09] border-2 border-[#d4af37] flex items-center justify-center relative shrink-0 treasure-image-shine">
                      @if (card.imageUrl) {
                        <img
                          [src]="card.imageUrl"
                          [alt]="card.name"
                          class="w-full h-full object-cover rounded-[10px]"
                          referrerpolicy="no-referrer" />
                      } @else {
                        <mat-icon class="text-2xl text-[#d4af37]">{{ card.icon }}</mat-icon>
                      }
                      <span class="absolute -top-1.5 -left-1.5 z-10 w-5 h-5 rounded-full bg-[#8b2b2b] border border-[#ff9f9f]/50 text-white font-mono text-[10px] flex items-center justify-center font-bold shadow">
                        {{ card.cost }}
                      </span>
                    </div>
                    <div class="min-w-0 flex-1 space-y-1">
                      <div class="font-cinzel font-bold text-sm text-[#f3ead8] truncate">{{ card.name }}</div>
                      <div class="text-[11px] text-[#c5a880] font-serif flex items-center gap-1.5">
                        <span>{{ rarityLabel(card.rarity) }}</span>
                        <span aria-hidden="true">·</span>
                        <span>Vendeur : {{ staged.sellerName }}</span>
                      </div>
                      <button
                        type="button"
                        (click)="inspectOfferItem(staged)"
                        class="text-[11px] font-mono text-[#fde047] hover:underline inline-flex items-center gap-1 cursor-pointer">
                        <mat-icon class="text-xs">visibility</mat-icon>
                        <span>Voir la fiche complète</span>
                      </button>
                    </div>
                  } @else if (staged.potionData; as pot) {
                    <div
                      class="w-16 h-16 rounded-xl bg-[#0d0b09] border-2 flex items-center justify-center shrink-0 treasure-image-shine"
                      [style.borderColor]="pot.color">
                      @if (pot.imageUrl) {
                        <img
                          [src]="pot.imageUrl"
                          [alt]="pot.name"
                          class="w-full h-full object-cover rounded-[10px]"
                          referrerpolicy="no-referrer" />
                      } @else {
                        <mat-icon class="text-2xl" [style.color]="pot.color">{{ pot.icon }}</mat-icon>
                      }
                    </div>
                    <div class="min-w-0 flex-1 space-y-1">
                      <div class="font-cinzel font-bold text-sm text-[#f3ead8] truncate">{{ pot.name }} (x{{ pot.count }})</div>
                      <div class="text-[11px] text-[#c5a880] font-serif flex items-center gap-1.5">
                        <span>{{ pot.effectLabel }}</span>
                        <span aria-hidden="true">·</span>
                        <span>Vendeur : {{ staged.sellerName }}</span>
                      </div>
                      <button
                        type="button"
                        (click)="inspectOfferItem(staged)"
                        class="text-[11px] font-mono text-[#fde047] hover:underline inline-flex items-center gap-1 cursor-pointer">
                        <mat-icon class="text-xs">visibility</mat-icon>
                        <span>Voir la fiche complète</span>
                      </button>
                    </div>
                  }
                </div>

                <!-- Price Breakdown & Fair Value Assessment -->
                <div class="flex flex-wrap items-center justify-between gap-2 px-1">
                  <span class="text-xs font-cinzel text-[#c5a880]">Montant vs Valeur Est. ({{ stagedFair.requestedValueGold }} Or)</span>
                  <div class="flex items-center gap-2 font-mono tabular-nums font-bold text-xs">
                    @if (staged.priceGold > 0) {
                      <span class="currency-pill-gold flex items-center gap-1">
                        <span class="currency-gold-coin text-xs">✦</span>
                        <span class="currency-gold-shine font-extrabold">{{ staged.priceGold }}</span>
                      </span>
                    }
                    @if (staged.priceGems > 0) {
                      <span class="currency-pill-gem flex items-center gap-1">
                        <span class="currency-gem-facet text-xs">⬥</span>
                        <span class="currency-gem-shine font-extrabold">{{ staged.priceGems }}</span>
                      </span>
                    }
                  </div>
                </div>

                @if (!canAfford(staged)) {
                  <div class="px-3 py-2 rounded-xl bg-[#2a1212] border border-[#ff4d4d]/40 text-[#fca5a5] text-xs flex items-center gap-2">
                    <mat-icon class="text-base shrink-0">error_outline</mat-icon>
                    <span>Solde insuffisant pour conclure cet échange.</span>
                  </div>
                }
              </div>

              <button
                type="button"
                (click)="confirmStagedBuy()"
                [disabled]="!canAfford(staged)"
                class="gold-btn w-full py-2.5 px-4 font-cinzel text-xs rounded-xl flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
                [class.opacity-50]="!canAfford(staged)">
                <mat-icon class="text-base">verified</mat-icon>
                <span>Confirmer l'Échange</span>
              </button>
            } @else {
              <div class="flex-1 flex flex-col items-center justify-center text-center py-8 px-4 space-y-2.5">
                <div
                  class="w-14 h-14 rounded-2xl bg-[#1a1612] border border-[#3a2f23] flex items-center justify-center text-[#d4af37]"
                  [class.animate-trade-float]="!!draggedOfferId()">
                  <mat-icon class="text-3xl">{{ isBuyDropOver() ? 'downloading' : 'swap_horiz' }}</mat-icon>
                </div>
                <div class="font-cinzel font-bold text-xs text-[#e0dcc7]">
                  @if (isBuyDropOver()) {
                    Relâchez pour déposer l'offre sur le socle
                  } @else if (draggedOfferId()) {
                    Zone prête : déposez l'offre ici
                  } @else {
                    Aucune offre sur le socle
                  }
                </div>
                <p class="text-[11px] text-[#8b6b43] max-w-xs leading-relaxed">
                  Saisissez n'importe quelle carte ci-dessous et glissez-la ici pour inspecter l'objet et déclencher le sceau d'échange.
                </p>
              </div>
            }
          </div>

          <!-- RIGHT ZONE: BESACE DRAGGABLE + AUTEL DE PUBLICATION -->
          <div class="lg:col-span-7 bg-[#120f0c] border border-[#3a2f23] rounded-2xl p-5 shadow-xl flex flex-col justify-between gap-4">

            <!-- Besace Header + Filter -->
            <div class="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#3a2f23]">
              <div class="flex items-center gap-2">
                <mat-icon class="text-[#d4af37] text-lg">backpack</mat-icon>
                <div>
                  <h2 class="font-cinzel font-bold text-sm text-[#f3ead8]">Ma Besace d'Échange</h2>
                  <p class="text-[11px] text-[#8b6b43]">Glissez un objet vers l'Autel de Publication (avec plancher anti-spoliation)</p>
                </div>
              </div>

              <div class="flex items-center gap-1 p-1 bg-[#1a1612] border border-[#3a2f23] rounded-lg">
                <button
                  type="button"
                  (click)="besaceFilter.set('all')"
                  class="px-2.5 py-1 text-[11px] font-cinzel font-bold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  [class.bg-[#2d2318]]="besaceFilter() === 'all'"
                  [class.text-[#fde047]]="besaceFilter() === 'all'"
                  [class.text-[#8b6b43]]="besaceFilter() !== 'all'">
                  Tout
                </button>
                <button
                  type="button"
                  (click)="besaceFilter.set('card')"
                  class="px-2.5 py-1 text-[11px] font-cinzel font-bold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  [class.bg-[#2d2318]]="besaceFilter() === 'card'"
                  [class.text-[#fde047]]="besaceFilter() === 'card'"
                  [class.text-[#8b6b43]]="besaceFilter() !== 'card'">
                  Cartes
                </button>
                <button
                  type="button"
                  (click)="besaceFilter.set('potion')"
                  class="px-2.5 py-1 text-[11px] font-cinzel font-bold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  [class.bg-[#2d2318]]="besaceFilter() === 'potion'"
                  [class.text-[#fde047]]="besaceFilter() === 'potion'"
                  [class.text-[#8b6b43]]="besaceFilter() !== 'potion'">
                  Potions
                </button>
              </div>
            </div>

            <!-- Draggable Inventory Strip -->
            <div class="flex items-stretch gap-2.5 overflow-x-auto pb-2">
              @for (item of filteredBesaceItems(); track item.key) {
                <button
                  type="button"
                  draggable="true"
                  (dragstart)="onBesaceDragStart($event, item)"
                  (dragend)="onBesaceDragEnd()"
                  (click)="stageSellItem(item)"
                  class="w-40 shrink-0 text-left p-2 rounded-xl bg-[#1a1612] border hover:border-[#d4af37] flex items-center gap-2.5 trade-draggable-card"
                  [class.border-[#d4af37]]="stagedSellItem()?.key === item.key"
                  [class.border-[#3a2f23]]="stagedSellItem()?.key !== item.key"
                  [class.trade-card-dragging]="draggedBesaceKey() === item.key">
                  <div
                    class="w-10 h-10 rounded-lg bg-[#0d0b09] border flex items-center justify-center shrink-0 overflow-hidden"
                    [style.borderColor]="item.color">
                    @if (item.imageUrl) {
                      <img
                        [src]="item.imageUrl"
                        [alt]="item.name"
                        class="w-full h-full object-cover"
                        referrerpolicy="no-referrer" />
                    } @else {
                      <mat-icon class="text-base" [style.color]="item.color">{{ item.icon }}</mat-icon>
                    }
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="font-cinzel font-bold text-[11px] text-[#f3ead8] truncate">{{ item.name }}</div>
                    <div class="text-[10px] font-mono text-[#8b6b43] truncate">{{ item.subtitle }}</div>
                  </div>
                </button>
              } @empty {
                <div class="w-full py-4 text-center text-xs text-[#8b6b43]">
                  Aucun objet disponible dans cette catégorie.
                </div>
              }
            </div>

            <!-- Autel de Publication (Drop Zone for Selling) -->
            <div
              (dragover)="onSellDragOver($event)"
              (dragleave)="onSellDragLeave($event)"
              (drop)="onSellDrop($event)"
              class="relative overflow-hidden rounded-xl border-2 p-4 bg-[#0d0b09] trade-dropzone"
              [class.border-[#3a2f23]]="!draggedBesaceKey() && !isSellDropOver()"
              [class.border-dashed]="!stagedSellItem() && !sellSmokeBurst()"
              [class.trade-dropzone-ready]="!!draggedBesaceKey() && !isSellDropOver()"
              [class.trade-dropzone-active]="isSellDropOver()">

              <!-- Volumetric Magical Smoke VFX Overlay on Listing Confirmation -->
              @if (sellSmokeBurst(); as sBurst) {
                <div class="magic-smoke-chamber bg-[#0a0d0b]/70 backdrop-blur-[2px]" aria-live="polite">
                  <div class="magic-smoke-vortex"></div>
                  <div class="magic-smoke-ring"></div>
                  @for (plume of smokePlumes; track plume.id) {
                    <span
                      class="magic-smoke-plume"
                      [style.--sx]="plume.sx"
                      [style.--sy]="plume.sy"
                      [style.--sr]="plume.sr"
                      [style.--sz]="plume.sz"
                      [style.--dur]="plume.dur"
                      [style.--del]="plume.del"
                      [style.--c-core]="plume.coreColor"
                      [style.--c-mid]="plume.midColor"></span>
                  }
                  @for (spark of smokeSparks; track spark.id) {
                    <span
                      class="magic-smoke-spark"
                      [style.--px]="spark.px"
                      [style.--py]="spark.py"
                      [style.--dur]="spark.dur"
                      [style.--del]="spark.del"></span>
                  }
                  <div class="magic-smoke-seal flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#120f0c]/95 border border-[#d4af37]/70 shadow-2xl">
                    <mat-icon class="text-2xl text-[#fde047]">auto_awesome</mat-icon>
                    <div>
                      <div class="font-cinzel-dec text-xs font-black text-[#fde047]">Offre Publiée</div>
                      <div class="text-[11px] font-serif text-[#e0dcc7] truncate max-w-[220px]">{{ sBurst.itemName }}</div>
                    </div>
                  </div>
                </div>
              }

              @if (stagedSellItem(); as sellItem) {
                <div class="space-y-3 animate-trade-snap" [attr.data-snap]="sellSnapKey()">
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div class="flex items-center gap-3 min-w-0">
                      <div
                        class="w-14 h-14 rounded-xl bg-[#1a1612] border-2 flex items-center justify-center shrink-0 overflow-hidden treasure-image-shine"
                        [style.borderColor]="sellItem.color">
                        @if (sellItem.imageUrl) {
                          <img
                            [src]="sellItem.imageUrl"
                            [alt]="sellItem.name"
                            class="w-full h-full object-cover"
                            referrerpolicy="no-referrer" />
                        } @else {
                          <mat-icon class="text-2xl" [style.color]="sellItem.color">{{ sellItem.icon }}</mat-icon>
                        }
                      </div>
                      <div class="min-w-0">
                        <div class="font-cinzel font-bold text-xs text-[#f3ead8] truncate">{{ sellItem.name }}</div>
                        <div class="text-[11px] text-[#8b6b43] font-mono">{{ sellItem.subtitle }}</div>
                        <button
                          type="button"
                          (click)="stagedSellItem.set(null)"
                          class="mt-1 text-[11px] text-[#c5a880] hover:text-white inline-flex items-center gap-1 cursor-pointer">
                          <mat-icon class="text-xs">close</mat-icon>
                          <span>Retirer</span>
                        </button>
                      </div>
                    </div>

                    <div class="flex flex-wrap items-end gap-2.5 shrink-0">
                      <div>
                        <label for="workbenchGoldInput" class="block text-[10px] font-cinzel text-[#c5a880] mb-1">Prix Or</label>
                        <input
                          id="workbenchGoldInput"
                          type="number"
                          min="0"
                          [value]="sellPriceGold()"
                          (input)="onSellGoldInput($event)"
                          class="w-24 bg-[#1a1612] border border-[#3a2f23] rounded-lg px-2.5 py-1.5 text-xs text-[#fde047] font-mono tabular-nums focus:outline-none focus:border-[#d4af37]" />
                      </div>
                      <div>
                        <label for="workbenchGemsInput" class="block text-[10px] font-cinzel text-[#c5a880] mb-1">Prix Gemmes</label>
                        <input
                          id="workbenchGemsInput"
                          type="number"
                          min="0"
                          [value]="sellPriceGems()"
                          (input)="onSellGemsInput($event)"
                          class="w-24 bg-[#1a1612] border border-[#3a2f23] rounded-lg px-2.5 py-1.5 text-xs text-[#60a5fa] font-mono tabular-nums focus:outline-none focus:border-[#d4af37]" />
                      </div>
                      <button
                        type="button"
                        (click)="confirmStagedSell()"
                        [disabled]="!canPublishStagedSell(sellItem)"
                        class="crimson-btn px-4 py-2 rounded-xl font-cinzel font-bold text-xs border border-[#ff4d4d] inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                        [class.opacity-50]="!canPublishStagedSell(sellItem)">
                        <mat-icon class="text-sm">publish</mat-icon>
                        <span>Confirmer l'Offre</span>
                      </button>
                    </div>
                  </div>

                  @if (sellTotalEquivGold() < sellItem.minFloorGold) {
                    <div class="px-3 py-2 rounded-lg bg-red-950/60 border border-red-500/50 text-red-200 text-[11px] flex items-center gap-2">
                      <mat-icon class="text-sm text-red-400 shrink-0">gpp_bad</mat-icon>
                      <span>
                        Plancher anti-arnaque : cet objet vaut au moins <strong>{{ sellItem.minFloorGold }} Or équiv.</strong> (actuellement {{ sellTotalEquivGold() }} Or).
                      </span>
                    </div>
                  }
                </div>
              } @else {
                <div class="flex flex-col sm:flex-row items-center justify-center gap-3 py-3 text-center sm:text-left">
                  <div
                    class="w-11 h-11 rounded-xl bg-[#1a1612] border border-[#3a2f23] flex items-center justify-center text-[#d4af37] shrink-0"
                    [class.animate-trade-float]="!!draggedBesaceKey()">
                    <mat-icon class="text-xl">{{ isSellDropOver() ? 'downloading' : 'sell' }}</mat-icon>
                  </div>
                  <div>
                    <div class="font-cinzel font-bold text-xs text-[#e0dcc7]">
                      @if (isSellDropOver()) {
                        Relâchez pour fixer le prix de votre objet
                      } @else {
                        Autel de Publication — Glissez une carte ou potion ici
                      }
                    </div>
                    <p class="text-[11px] text-[#8b6b43]">
                      Déposez l'objet depuis votre besace ci-dessus pour l'exposer sous protection de prix plancher.
                    </p>
                  </div>
                </div>
              }
            </div>
          </div>
        </section>

        <!-- Listings Filter Bar -->
        <div class="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div class="flex items-center gap-2">
            <h2 class="font-cinzel font-bold text-base text-[#f3ead8]">Étalages des Chevaliers</h2>
            <span class="text-xs font-mono text-[#8b6b43] tabular-nums">· {{ filteredOffers().length }} offres actives</span>
          </div>

          <div class="flex items-center gap-1 p-1 bg-[#120f0c] border border-[#3a2f23] rounded-xl">
            <button
              type="button"
              (click)="marketFilter.set('all')"
              class="px-3 py-1.5 text-xs font-cinzel font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              [class.bg-[#251d15]]="marketFilter() === 'all'"
              [class.text-[#fde047]]="marketFilter() === 'all'"
              [class.text-[#8b6b43]]="marketFilter() !== 'all'">
              Toutes
            </button>
            <button
              type="button"
              (click)="marketFilter.set('card')"
              class="px-3 py-1.5 text-xs font-cinzel font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              [class.bg-[#251d15]]="marketFilter() === 'card'"
              [class.text-[#fde047]]="marketFilter() === 'card'"
              [class.text-[#8b6b43]]="marketFilter() !== 'card'">
              Cartes
            </button>
            <button
              type="button"
              (click)="marketFilter.set('potion')"
              class="px-3 py-1.5 text-xs font-cinzel font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              [class.bg-[#251d15]]="marketFilter() === 'potion'"
              [class.text-[#fde047]]="marketFilter() === 'potion'"
              [class.text-[#8b6b43]]="marketFilter() !== 'potion'">
              Potions
            </button>
            <button
              type="button"
              (click)="marketFilter.set('featured')"
              class="px-3 py-1.5 text-xs font-cinzel font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              [class.bg-[#251d15]]="marketFilter() === 'featured'"
              [class.text-[#fde047]]="marketFilter() === 'featured'"
              [class.text-[#8b6b43]]="marketFilter() !== 'featured'">
              Rares
            </button>
          </div>
        </div>

        <!-- Marketplace Listings Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (offer of filteredOffers(); track offer.id) {
            @let offerFair = gameState.assessMarketOffer(offer);
            <div
              draggable="true"
              (dragstart)="onOfferDragStart($event, offer)"
              (dragend)="onOfferDragEnd()"
              class="medieval-btn trade-draggable-card bg-[#120f0c] border border-[#3a2f23] hover:border-[#8b6b43] rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4"
              [class.trade-card-dragging]="draggedOfferId() === offer.id"
              [class.border-[#d4af37]]="stagedBuyOffer()?.id === offer.id">

              <!-- Seller Profile Header -->
              <div class="flex items-center justify-between pb-2 border-b border-[#3a2f23]">
                <div class="flex items-center gap-2.5 min-w-0">
                  <div class="w-8 h-8 rounded-lg bg-[#0d0b09] border border-[#3a2f23] flex items-center justify-center text-[#c5a880] shrink-0">
                    <mat-icon class="text-sm">{{ offer.sellerAvatar }}</mat-icon>
                  </div>
                  <div class="min-w-0">
                    <div class="font-cinzel font-bold text-xs text-[#e0dcc7] truncate">{{ offer.sellerName }}</div>
                    <div class="text-[10px] text-[#6b5a45] font-mono tabular-nums">{{ offer.sellerElo }} Elo · {{ offer.listedAgo }}</div>
                  </div>
                </div>

                <div class="flex items-center gap-1.5 shrink-0">
                  <span
                    class="px-2 py-0.5 rounded text-[10px] font-mono font-bold border"
                    [class.bg-emerald-950/60]="offerFair.status === 'balanced'"
                    [class.border-emerald-500/40]="offerFair.status === 'balanced'"
                    [class.text-emerald-300]="offerFair.status === 'balanced'"
                    [class.bg-amber-950/60]="offerFair.status === 'caution'"
                    [class.border-amber-500/40]="offerFair.status === 'caution'"
                    [class.text-amber-300]="offerFair.status === 'caution'"
                    [class.bg-red-950/60]="offerFair.status === 'scam_blocked'"
                    [class.border-red-500/50]="offerFair.status === 'scam_blocked'"
                    [class.text-red-300]="offerFair.status === 'scam_blocked'">
                    {{ marketBadgeLabel(offerFair) }}
                  </span>
                  <span class="text-[#6b5a45] inline-flex items-center" title="Glisser vers le Coffre d'Acquisition">
                    <mat-icon class="text-base">drag_indicator</mat-icon>
                  </span>
                </div>
              </div>

              <!-- Item Display (Clickable to Inspect Full Details) -->
              <button
                type="button"
                (click)="inspectOfferItem(offer)"
                class="w-full text-left p-3 bg-[#1a1612] border border-[#3a2f23] hover:border-[#d4af37]/70 rounded-xl flex items-center gap-3 transition-colors cursor-pointer">
                @if (offer.cardData; as card) {
                  <div class="w-14 h-18 rounded-xl bg-[#0d0b09] border-2 border-[#8b6b43] flex flex-col items-center justify-center relative shrink-0 shadow-md treasure-image-shine">
                    @if (card.imageUrl) {
                      <img
                        [src]="card.imageUrl"
                        [alt]="card.name"
                        class="w-full h-full object-cover rounded-[10px]"
                        referrerpolicy="no-referrer" />
                    } @else {
                      <mat-icon class="text-xl text-[#c5a880]">{{ card.icon }}</mat-icon>
                    }
                    <span class="absolute -top-1.5 -left-1.5 z-10 w-5 h-5 rounded-full bg-[#8b2b2b] border border-[#ff9f9f]/50 text-white font-mono text-[10px] flex items-center justify-center font-bold shadow">
                      {{ card.cost }}
                    </span>
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="font-cinzel font-bold text-xs text-[#f3ead8] truncate">{{ card.name }}</div>
                    <div class="text-[10px] font-mono uppercase tracking-wider text-[#d4af37] mt-0.5">{{ rarityLabel(card.rarity) }}</div>
                    <div class="text-[10px] text-[#8b6b43] line-clamp-2 mt-0.5">{{ card.description }}</div>
                  </div>
                } @else if (offer.potionData; as pot) {
                  <div
                    class="w-14 h-14 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md border-2 treasure-image-shine bg-[#0d0b09]"
                    [style.borderColor]="pot.color">
                    @if (pot.imageUrl) {
                      <img
                        [src]="pot.imageUrl"
                        [alt]="pot.name"
                        class="w-full h-full object-cover rounded-[10px]"
                        referrerpolicy="no-referrer" />
                    } @else {
                      <mat-icon class="text-2xl" [style.color]="pot.color">{{ pot.icon }}</mat-icon>
                    }
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="font-cinzel font-bold text-xs text-[#f3ead8] truncate">{{ pot.name }} (x{{ pot.count }})</div>
                    <div class="text-[10px] font-mono text-[#d4af37] mt-0.5">{{ pot.effectLabel }}</div>
                    <div class="text-[10px] text-[#8b6b43] line-clamp-2 mt-0.5">{{ pot.description }}</div>
                  </div>
                }
              </button>

              <!-- Price & Actions -->
              <div class="flex items-center justify-between gap-2 pt-2 border-t border-[#3a2f23]">
                <div class="flex items-center gap-2 font-mono tabular-nums font-bold text-xs">
                  @if (offer.priceGold > 0) {
                    <span class="currency-pill-gold flex items-center gap-1">
                      <span class="currency-gold-coin text-xs">✦</span>
                      <span class="currency-gold-shine font-extrabold">{{ offer.priceGold }}</span>
                    </span>
                  }
                  @if (offer.priceGems > 0) {
                    <span class="currency-pill-gem flex items-center gap-1">
                      <span class="currency-gem-facet text-xs">⬥</span>
                      <span class="currency-gem-shine font-extrabold">{{ offer.priceGems }}</span>
                    </span>
                  }
                </div>

                <div class="flex items-center gap-1.5">
                  <button
                    type="button"
                    (click)="inspectOfferItem(offer)"
                    title="Inspecter les statistiques et la valeur marchande"
                    class="px-2.5 py-1.5 rounded-xl bg-[#1a1612] hover:bg-[#2a2118] border border-[#3a2f23] hover:border-[#d4af37] text-[#c5a880] hover:text-[#fde047] transition-colors inline-flex items-center justify-center cursor-pointer">
                    <mat-icon class="text-sm">visibility</mat-icon>
                  </button>
                  <button
                    type="button"
                    (click)="stageBuyFromCard(offer)"
                    title="Déposer dans le Coffre d'Acquisition"
                    class="px-2.5 py-1.5 rounded-xl bg-[#1a1612] hover:bg-[#2a2118] border border-[#3a2f23] hover:border-[#d4af37] text-[#c5a880] hover:text-[#fde047] transition-colors inline-flex items-center justify-center cursor-pointer">
                    <mat-icon class="text-sm">move_to_inbox</mat-icon>
                  </button>
                  <button
                    type="button"
                    (click)="openPurchaseConfirmation(offer)"
                    [disabled]="!canAfford(offer)"
                    class="crimson-btn px-3.5 py-1.5 rounded-xl font-cinzel font-bold text-xs border transition-all inline-flex items-center gap-1 whitespace-nowrap cursor-pointer"
                    [class.opacity-50]="!canAfford(offer)">
                    <mat-icon class="text-xs">swap_horiz</mat-icon>
                    <span>Acquérir</span>
                  </button>
                </div>
              </div>

            </div>
          } @empty {
            <div class="col-span-full bg-[#120f0c] border border-[#3a2f23] rounded-2xl p-8 text-center space-y-2">
              <mat-icon class="text-3xl text-[#8b6b43]">storefront</mat-icon>
              <div class="font-cinzel font-bold text-sm text-[#e0dcc7]">Aucune offre dans cette catégorie</div>
              <p class="text-xs text-[#8b6b43]">Publiez la vôtre ou sélectionnez un autre filtre.</p>
            </div>
          }
        </div>
      }

      <!-- ======================================================== -->
      <!-- TAB 3: JOURNAL D'AUDIT & BOUCLIER ANTI-ARNAQUE           -->
      <!-- ======================================================== -->
      @if (activeTab() === 'audit') {
        <section aria-label="Protection anti-arnaque et journal d'audit" class="space-y-5">
          <!-- 4 Protection Pillars -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="bg-[#120f0c] border border-emerald-500/35 rounded-2xl p-4 space-y-2">
              <div class="flex items-center gap-2 text-emerald-400 font-cinzel font-bold text-xs">
                <mat-icon class="text-lg">balance</mat-icon>
                <span>Indice d'Équité Objective</span>
              </div>
              <p class="text-xs text-[#c5a880] leading-relaxed">
                Chaque carte (niveau, étoiles, Foil), potion et réactif possède une valeur de référence en Or. Les écarts ≥ 50% en votre défaveur sont bloqués.
              </p>
            </div>

            <div class="bg-[#120f0c] border border-amber-500/35 rounded-2xl p-4 space-y-2">
              <div class="flex items-center gap-2 text-amber-400 font-cinzel font-bold text-xs">
                <mat-icon class="text-lg">lock_clock</mat-icon>
                <span>Verrou Anti-Substitution 5s</span>
              </div>
              <p class="text-xs text-[#c5a880] leading-relaxed">
                Toute modification d'une offre génère une nouvelle empreinte Escrow, réinitialise les signatures des deux joueurs et impose 5s d'inspection.
              </p>
            </div>

            <div class="bg-[#120f0c] border border-[#d4af37]/35 rounded-2xl p-4 space-y-2">
              <div class="flex items-center gap-2 text-[#fde047] font-cinzel font-bold text-xs">
                <mat-icon class="text-lg">verified_user</mat-icon>
                <span>Double Sceau Biens Rares</span>
              </div>
              <p class="text-xs text-[#c5a880] leading-relaxed">
                Les cartes Épiques/Légendaires/Mythiques et les réactifs rares (Rosée Astrale, Cendre de Phénix, Spore du Néant) exigent une double confirmation explicite.
              </p>
            </div>

            <div class="bg-[#120f0c] border border-red-500/35 rounded-2xl p-4 space-y-2">
              <div class="flex items-center gap-2 text-red-400 font-cinzel font-bold text-xs">
                <mat-icon class="text-lg">gpp_good</mat-icon>
                <span>Plancher Anti-Spoliation</span>
              </div>
              <p class="text-xs text-[#c5a880] leading-relaxed">
                Impossible de publier ou brader accidentellement un objet rare à un prix dérisoire sur la Halle publique.
              </p>
            </div>
          </div>

          <!-- Ledger Entries -->
          <div class="bg-[#120f0c] border border-[#3a2f23] rounded-2xl p-5 shadow-xl space-y-4">
            <div class="flex items-center justify-between border-b border-[#3a2f23] pb-3">
              <h2 class="font-cinzel font-bold text-base text-[#f3ead8] flex items-center gap-2">
                <mat-icon class="text-[#d4af37]">receipt_long</mat-icon>
                <span>Registre Immuable des Échanges & Alertes</span>
              </h2>
              <span class="text-xs font-mono text-[#8b6b43]">{{ gameState.tradeAuditLog().length }} événements enregistrés</span>
            </div>

            <div class="space-y-2.5">
              @for (entry of gameState.tradeAuditLog(); track entry.id) {
                <div class="p-3.5 rounded-xl bg-[#16120e] border border-[#3a2f23] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div class="flex items-start gap-3 min-w-0">
                    <div
                      class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border"
                      [class.bg-red-950/60]="entry.type === 'scam_prevented'"
                      [class.border-red-500/50]="entry.type === 'scam_prevented'"
                      [class.text-red-400]="entry.type === 'scam_prevented'"
                      [class.bg-emerald-950/60]="entry.type === 'p2p_trade' || entry.type === 'market_buy'"
                      [class.border-emerald-500/40]="entry.type === 'p2p_trade' || entry.type === 'market_buy'"
                      [class.text-emerald-400]="entry.type === 'p2p_trade' || entry.type === 'market_buy'"
                      [class.bg-[#1d1711]]="entry.type === 'market_sell' || entry.type === 'escrow_cancelled'"
                      [class.border-[#8b6b43]/40]="entry.type === 'market_sell' || entry.type === 'escrow_cancelled'"
                      [class.text-[#d4af37]]="entry.type === 'market_sell' || entry.type === 'escrow_cancelled'">
                      <mat-icon class="text-base">
                        {{ entry.type === 'scam_prevented' ? 'gpp_bad' : entry.type === 'escrow_cancelled' ? 'cancel' : 'verified' }}
                      </mat-icon>
                    </div>
                    <div class="min-w-0 space-y-0.5">
                      <div class="font-cinzel font-bold text-xs text-[#f3ead8]">
                        {{ entry.partnerName }} · {{ auditTypeLabel(entry.type) }}
                      </div>
                      <div class="text-xs text-[#c5a880]">{{ entry.summary }}</div>
                      <div class="text-[10px] font-mono text-[#8b6b43]">
                        {{ entry.timestamp }}{{ entry.escrowHash ? ' · ' + entry.escrowHash : '' }}
                      </div>
                    </div>
                  </div>
                  <div class="text-right font-mono text-xs text-[#fde047] shrink-0 tabular-nums">
                    ~{{ entry.valueGold }} Or
                  </div>
                </div>
              }
            </div>
          </div>
        </section>
      }

      <!-- ======================================================== -->
      <!-- INSPECTEUR DÉTAILLÉ D'OBJET MODAL (VIEW ITEM DETAILS)    -->
      <!-- ======================================================== -->
      @if (inspectedItem(); as inspected) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div class="bg-[#120f0c] border border-[#8b6b43] rounded-2xl max-w-lg w-full p-6 shadow-2xl text-[#e0dcc7] space-y-4 animate-modal-pop">
            <div class="flex items-center justify-between pb-3 border-b border-[#3a2f23]">
              <h3 class="font-cinzel-dec text-base font-black text-[#fde047] flex items-center gap-2">
                <mat-icon class="text-[#d4af37]">manage_search</mat-icon>
                <span>Inspection Détaillée de l'Objet</span>
              </h3>
              <button
                type="button"
                (click)="inspectedItem.set(null)"
                class="text-[#8b6b43] hover:text-white cursor-pointer">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            @if (inspected.kind === 'card') {
              <div class="flex gap-4">
                <div class="w-28 h-36 rounded-xl bg-[#0d0b09] border-2 border-[#d4af37] overflow-hidden shrink-0 relative treasure-image-shine flex items-center justify-center">
                  @if (inspected.card.imageUrl) {
                    <img [src]="inspected.card.imageUrl" [alt]="inspected.card.name" class="w-full h-full object-cover" referrerpolicy="no-referrer" />
                  } @else {
                    <mat-icon class="text-3xl text-[#d4af37]">{{ inspected.card.icon }}</mat-icon>
                  }
                  <span class="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-[#8b2b2b] border border-[#ff9f9f]/60 text-white font-mono text-xs flex items-center justify-center font-black">
                    {{ inspected.card.cost }}
                  </span>
                </div>
                <div class="min-w-0 flex-1 space-y-1.5">
                  <div class="font-cinzel font-black text-base text-[#f3ead8]">{{ inspected.card.name }}</div>
                  <div class="flex flex-wrap gap-1.5 text-[10px] font-mono">
                    <span class="px-2 py-0.5 rounded bg-[#1d1711] border border-[#d4af37]/40 text-[#fde047]">{{ rarityLabel(inspected.card.rarity) }}</span>
                    <span class="px-2 py-0.5 rounded bg-[#1a1612] border border-[#3a2f23] text-[#c5a880]">Niv. {{ inspected.card.level }} · {{ inspected.card.stars }} ★</span>
                    @if (inspected.card.foil) {
                      <span class="px-2 py-0.5 rounded bg-purple-950/60 border border-purple-400/50 text-purple-200">FOIL</span>
                    }
                  </div>
                  @if (inspected.card.type === 'creature') {
                    <div class="flex items-center gap-3 text-xs font-mono pt-1">
                      <span class="text-red-300 font-bold">⚔ ATQ {{ inspected.card.attack }}</span>
                      <span class="text-emerald-300 font-bold">♥ PV {{ inspected.card.health }}</span>
                    </div>
                  }
                  <p class="text-xs text-[#e0dcc7] leading-relaxed">{{ inspected.card.description }}</p>
                  <p class="text-[11px] font-serif italic text-[#8b6b43]">« {{ inspected.card.flavorText }} »</p>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-[#1a1612] border border-[#3a2f23] text-xs font-mono">
                <div>
                  <div class="text-[10px] text-[#8b6b43]">Valeur Marchande Est.</div>
                  <div class="text-[#fde047] font-bold">≈ {{ inspected.estimatedGold }} Or</div>
                </div>
                <div>
                  <div class="text-[10px] text-[#8b6b43]">Statut Deck</div>
                  <div class="text-[#e0dcc7]">{{ inspected.inActiveDeck ? 'Utilisée dans un deck' : 'Libre pour le troc' }}</div>
                </div>
              </div>
            } @else if (inspected.kind === 'potion') {
              <div class="flex gap-4">
                <div class="w-24 h-24 rounded-xl bg-[#0d0b09] border-2 overflow-hidden shrink-0 flex items-center justify-center" [style.borderColor]="inspected.potion.color">
                  @if (inspected.potion.imageUrl) {
                    <img [src]="inspected.potion.imageUrl" [alt]="inspected.potion.name" class="w-full h-full object-cover" referrerpolicy="no-referrer" />
                  } @else {
                    <mat-icon class="text-3xl" [style.color]="inspected.potion.color">{{ inspected.potion.icon }}</mat-icon>
                  }
                </div>
                <div class="min-w-0 flex-1 space-y-1.5">
                  <div class="font-cinzel font-black text-base text-[#f3ead8]">{{ inspected.potion.name }} (x{{ inspected.quantity }})</div>
                  <div class="flex flex-wrap gap-1.5 text-[10px] font-mono">
                    <span class="px-2 py-0.5 rounded bg-[#1d1711] border border-[#d4af37]/40 text-[#fde047]">{{ rarityLabel(inspected.potion.rarity) }}</span>
                    <span class="px-2 py-0.5 rounded bg-[#1a1612] border border-[#3a2f23] text-cyan-300">{{ inspected.potion.durationMatches }} combats</span>
                  </div>
                  <div class="text-xs font-bold text-[#d4af37]">{{ inspected.potion.effectLabel }}</div>
                  <p class="text-xs text-[#c5a880] leading-relaxed">{{ inspected.potion.description }}</p>
                </div>
              </div>
              <div class="p-3 rounded-xl bg-[#1a1612] border border-[#3a2f23] flex items-center justify-between text-xs font-mono">
                <span class="text-[#8b6b43]">Valeur Certifiée du Lot</span>
                <span class="text-[#fde047] font-bold">≈ {{ inspected.estimatedGold }} Or</span>
              </div>
            } @else {
              <div class="flex gap-4">
                <div class="w-24 h-24 rounded-xl bg-[#0d0b09] border-2 border-[#d4af37] overflow-hidden shrink-0">
                  <img [src]="inspected.resource.imageUrl" [alt]="inspected.resource.label" class="w-full h-full object-cover" referrerpolicy="no-referrer" />
                </div>
                <div class="min-w-0 flex-1 space-y-1.5">
                  <div class="font-cinzel font-black text-base text-[#f3ead8]">{{ inspected.resource.label }} (x{{ inspected.resource.quantity }})</div>
                  <div class="flex flex-wrap gap-1.5 text-[10px] font-mono">
                    <span class="px-2 py-0.5 rounded bg-[#1d1711] border border-[#d4af37]/40 text-[#fde047]">{{ rarityLabel(inspected.resource.rarity) }}</span>
                    @if (inspected.isRare) {
                      <span class="px-2 py-0.5 rounded bg-purple-950/60 border border-purple-400/50 text-purple-200">Réactif Rare Protégé</span>
                    }
                  </div>
                  <p class="text-xs text-[#c5a880] leading-relaxed">{{ inspected.description }}</p>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-[#1a1612] border border-[#3a2f23] text-xs font-mono">
                <div>
                  <div class="text-[10px] text-[#8b6b43]">Valeur Certifiée du Lot</div>
                  <div class="text-[#fde047] font-bold">≈ {{ inspected.estimatedGold }} Or ({{ inspected.resource.unitValueGold }} Or/u)</div>
                </div>
                <div>
                  <div class="text-[10px] text-[#8b6b43]">Votre Stock Actuel</div>
                  <div class="text-[#e0dcc7] font-bold">{{ inspected.ownedStock }} unité(s)</div>
                </div>
              </div>
            }

            <button
              type="button"
              (click)="inspectedItem.set(null)"
              class="gold-btn w-full py-2.5 rounded-xl font-cinzel font-bold text-xs cursor-pointer">
              Fermer l'Inspection
            </button>
          </div>
        </div>
      }

      <!-- TRANSACTION CONFIRMATION MODAL (MARKET QUICK-BUY WITH MAGICAL SMOKE BURST) -->
      @if (modalConfirmOffer(); as confirmOffer) {
        @let modalFair = gameState.assessMarketOffer(confirmOffer);
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div class="relative overflow-hidden bg-[#120f0c] border border-[#8b6b43] rounded-2xl max-w-md w-full p-6 shadow-2xl text-[#e0dcc7] space-y-5 animate-modal-pop">

            <!-- Magical Smoke Overlay inside Confirmation Modal -->
            @if (modalSmokeBurst(); as mBurst) {
              <div class="magic-smoke-chamber bg-[#0a0d0b]/80 backdrop-blur-[2px]" aria-live="polite">
                <div class="magic-smoke-vortex"></div>
                <div class="magic-smoke-ring"></div>
                @for (plume of smokePlumes; track plume.id) {
                  <span
                    class="magic-smoke-plume"
                    [style.--sx]="plume.sx"
                    [style.--sy]="plume.sy"
                    [style.--sr]="plume.sr"
                    [style.--sz]="plume.sz"
                    [style.--dur]="plume.dur"
                    [style.--del]="plume.del"
                    [style.--c-core]="plume.coreColor"
                    [style.--c-mid]="plume.midColor"></span>
                }
                @for (spark of smokeSparks; track spark.id) {
                  <span
                    class="magic-smoke-spark"
                    [style.--px]="spark.px"
                    [style.--py]="spark.py"
                    [style.--dur]="spark.dur"
                    [style.--del]="spark.del"></span>
                }
                <div class="magic-smoke-seal flex flex-col items-center text-center px-6 py-5 rounded-2xl bg-[#120f0c]/95 border border-emerald-400/70 shadow-2xl">
                  <mat-icon class="text-4xl text-emerald-400 mb-1.5">verified</mat-icon>
                  <div class="font-cinzel-dec text-base font-black text-[#fde047]">Échange Confirmé</div>
                  <div class="text-xs font-serif text-[#e0dcc7] mt-1">{{ mBurst.itemName }} ajouté à votre inventaire</div>
                </div>
              </div>
            }

            <div class="flex items-center justify-between pb-3 border-b border-[#3a2f23]">
              <h3 class="font-cinzel text-lg font-black text-[#f3ead8] flex items-center gap-2">
                <mat-icon class="text-[#d4af37]">verified_user</mat-icon>
                <span>Confirmer la Transaction</span>
              </h3>
              <button
                type="button"
                (click)="closePurchaseConfirmation()"
                class="text-[#8b6b43] hover:text-[#e0dcc7] cursor-pointer">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <div class="p-4 bg-[#1a1612] border border-[#3a2f23] rounded-xl flex items-center gap-3.5">
              @if (confirmOffer.cardData; as card) {
                <div class="w-16 h-20 rounded-xl bg-[#0d0b09] border-2 border-[#d4af37] shrink-0 overflow-hidden treasure-image-shine flex items-center justify-center">
                  @if (card.imageUrl) {
                    <img [src]="card.imageUrl" [alt]="card.name" class="w-full h-full object-cover" referrerpolicy="no-referrer" />
                  } @else {
                    <mat-icon class="text-2xl text-[#d4af37]">{{ card.icon }}</mat-icon>
                  }
                </div>
                <div class="min-w-0 flex-1 space-y-1">
                  <div class="font-cinzel font-bold text-sm text-[#f3ead8] truncate">{{ card.name }}</div>
                  <div class="text-xs text-[#c5a880]">{{ rarityLabel(card.rarity) }} · {{ confirmOffer.sellerName }}</div>
                  <p class="text-[11px] text-[#8b6b43] line-clamp-2">{{ card.description }}</p>
                </div>
              } @else if (confirmOffer.potionData; as pot) {
                <div
                  class="w-16 h-16 rounded-xl bg-[#0d0b09] border-2 shrink-0 overflow-hidden treasure-image-shine flex items-center justify-center"
                  [style.borderColor]="pot.color">
                  @if (pot.imageUrl) {
                    <img [src]="pot.imageUrl" [alt]="pot.name" class="w-full h-full object-cover" referrerpolicy="no-referrer" />
                  } @else {
                    <mat-icon class="text-2xl" [style.color]="pot.color">{{ pot.icon }}</mat-icon>
                  }
                </div>
                <div class="min-w-0 flex-1 space-y-1">
                  <div class="font-cinzel font-bold text-sm text-[#f3ead8] truncate">{{ pot.name }} (x{{ pot.count }})</div>
                  <div class="text-xs text-[#c5a880]">{{ pot.effectLabel }} · {{ confirmOffer.sellerName }}</div>
                  <p class="text-[11px] text-[#8b6b43] line-clamp-2">{{ pot.description }}</p>
                </div>
              }
            </div>

            <div class="p-3 rounded-xl bg-[#1a1612] border border-[#3a2f23] flex items-center justify-between text-xs">
              <span class="text-[#8b6b43]">Valeur marchande est. : <strong class="text-[#fde047]">{{ modalFair.requestedValueGold }} Or</strong></span>
              <span class="font-mono text-emerald-400">{{ marketBadgeLabel(modalFair) }}</span>
            </div>

            <div class="flex items-center justify-between px-1 text-xs">
              <span class="font-cinzel text-[#c5a880]">Coût total</span>
              <div class="flex items-center gap-2 font-mono tabular-nums font-bold">
                @if (confirmOffer.priceGold > 0) {
                  <span class="currency-pill-gold flex items-center gap-1">
                    <span class="currency-gold-coin text-xs">✦</span>
                    <span class="currency-gold-shine font-extrabold">{{ confirmOffer.priceGold }}</span>
                  </span>
                }
                @if (confirmOffer.priceGems > 0) {
                  <span class="currency-pill-gem flex items-center gap-1">
                    <span class="currency-gem-facet text-xs">⬥</span>
                    <span class="currency-gem-shine font-extrabold">{{ confirmOffer.priceGems }}</span>
                  </span>
                }
              </div>
            </div>

            <div class="flex items-center gap-3 pt-1">
              <button
                type="button"
                (click)="closePurchaseConfirmation()"
                class="medieval-btn flex-1 py-2.5 px-4 font-cinzel font-bold text-xs rounded-xl cursor-pointer">
                Annuler
              </button>
              <button
                type="button"
                (click)="confirmModalPurchase()"
                [disabled]="!canAfford(confirmOffer) || !!modalSmokeBurst()"
                class="gold-btn flex-1 py-2.5 px-4 font-cinzel text-xs rounded-xl inline-flex items-center justify-center gap-1.5 cursor-pointer"
                [class.opacity-50]="!canAfford(confirmOffer)">
                <mat-icon class="text-base">auto_awesome</mat-icon>
                <span>Confirmer</span>
              </button>
            </div>
          </div>
        </div>
      }

      <!-- CREATE TRADE LISTING MODAL -->
      @if (showCreateTradeModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div class="bg-[#120f0c] border border-[#3a2f23] rounded-2xl max-w-md w-full p-6 shadow-2xl text-[#e0dcc7] space-y-4 animate-modal-pop">
            <div class="flex items-center justify-between pb-2 border-b border-[#3a2f23]">
              <h3 class="font-cinzel text-lg font-black text-[#c5a880] flex items-center gap-2">
                <mat-icon class="text-[#d4af37]">add_business</mat-icon>
                <span>Nouvelle Offre de Troc</span>
              </h3>
              <button
                type="button"
                (click)="showCreateTradeModal.set(false)"
                class="text-[#8b6b43] hover:text-[#e0dcc7] cursor-pointer">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <p class="text-xs text-[#8b6b43]">Choisissez un objet à déposer sous protection de prix plancher :</p>

            <div class="space-y-2">
              <label for="itemSelectInput" class="text-xs font-cinzel text-[#c5a880]">Carte ou Potion :</label>
              <select
                id="itemSelectInput"
                #itemSelect
                class="w-full bg-[#1a1612] border border-[#3a2f23] rounded-xl p-2.5 text-xs text-[#e0dcc7] focus:outline-none focus:border-[#8b6b43]">
                @for (c of playerTradableCards(); track c.id) {
                  <option [value]="'card:' + c.id">Carte : {{ c.name }} ({{ rarityLabel(c.rarity) }}) · ~{{ cardValue(c) }} Or</option>
                }
                @for (p of playerOwnedPotions(); track p.id) {
                  <option [value]="'potion:' + p.id">Potion : {{ p.name }} (Stock : {{ p.count }}) · ~{{ potionValue(p) }} Or</option>
                }
              </select>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label for="goldAmountInput" class="text-xs font-cinzel text-[#c5a880]">Prix en Or :</label>
                <input
                  id="goldAmountInput"
                  #goldInput
                  type="number"
                  min="0"
                  value="500"
                  class="w-full bg-[#1a1612] border border-[#3a2f23] rounded-xl p-2.5 text-xs text-[#d4af37] font-mono tabular-nums focus:outline-none focus:border-[#8b6b43] mt-1" />
              </div>
              <div>
                <label for="gemAmountInput" class="text-xs font-cinzel text-[#c5a880]">Prix en Gemmes :</label>
                <input
                  id="gemAmountInput"
                  #gemInput
                  type="number"
                  min="0"
                  value="20"
                  class="w-full bg-[#1a1612] border border-[#3a2f23] rounded-xl p-2.5 text-xs text-[#4d94ff] font-mono tabular-nums focus:outline-none focus:border-[#8b6b43] mt-1" />
              </div>
            </div>

            <button
              type="button"
              (click)="publishTrade(itemSelect.value, +goldInput.value, +gemInput.value)"
              class="crimson-btn w-full py-3 text-white font-cinzel font-bold text-xs rounded-xl border border-[#ff4d4d] shadow-lg mt-2 cursor-pointer">
              Déposer l'Offre Sécurisée
            </button>
          </div>
        </div>
      }

    </div>
  `,
})
export class MarketplaceView {
  readonly gameState = inject(GameStateService);
  readonly sound = inject(SoundService);
  private readonly destroyRef = inject(DestroyRef);

  readonly smokePlumes = SMOKE_PLUMES;
  readonly smokeSparks = SMOKE_SPARKS;
  readonly gemRate = GEM_TO_GOLD_RATE;

  // Workspace Tabs & P2P Escrow State
  readonly activeTab = signal<'p2p' | 'market' | 'audit'>('p2p');
  readonly proposalFilter = signal<'active' | 'archive'>('active');
  readonly selectedProposalId = signal<string | null>(null);
  readonly nowTimestamp = signal<number>(Date.now());

  // Composer / Counter-Offer State
  readonly isComposingProposal = signal<boolean>(false);
  readonly editingProposalId = signal<string | null>(null);
  readonly composerPartnerId = signal<string>('user_valerius');
  readonly composerPlayerBundle = signal<TradeBundle>(emptyBundle());
  readonly composerPartnerBundle = signal<TradeBundle>(emptyBundle());
  readonly composerNote = signal<string>('');

  // Detailed Item Inspector Modal
  readonly inspectedItem = signal<InspectedItemPayload | null>(null);

  // Market Workbench & Modal State
  readonly showCreateTradeModal = signal<boolean>(false);
  readonly marketFilter = signal<'all' | 'card' | 'potion' | 'featured'>('all');
  readonly besaceFilter = signal<'all' | 'card' | 'potion'>('all');

  // Drag-and-Drop States
  readonly draggedOfferId = signal<string | null>(null);
  readonly draggedBesaceKey = signal<string | null>(null);
  readonly isBuyDropOver = signal<boolean>(false);
  readonly isSellDropOver = signal<boolean>(false);

  // Staged Pedestal Items
  readonly stagedBuyOffer = signal<TradeOffer | null>(null);
  readonly buySnapKey = signal<number>(0);

  readonly stagedSellItem = signal<BesaceTradeItem | null>(null);
  readonly sellSnapKey = signal<number>(0);
  readonly sellPriceGold = signal<number>(500);
  readonly sellPriceGems = signal<number>(20);

  // Quick-Buy Confirmation Modal
  readonly modalConfirmOffer = signal<TradeOffer | null>(null);

  // Magical Smoke Confirmation VFX Bursts
  readonly buySmokeBurst = signal<{ id: number; itemName: string } | null>(null);
  readonly sellSmokeBurst = signal<{ id: number; itemName: string } | null>(null);
  readonly modalSmokeBurst = signal<{ id: number; itemName: string } | null>(null);
  readonly p2pSmokeBurst = signal<{ id: number; partnerName: string } | null>(null);

  private activeTimers: ReturnType<typeof setTimeout>[] = [];
  private tickerInterval: ReturnType<typeof setInterval> | null = null;

  // Derived P2P Data
  readonly partnerCandidates = computed<PartnerCandidate[]>(() => {
    const me = this.gameState.username();
    const map = new Map<string, PartnerCandidate>();

    for (const lb of this.gameState.leaderboard()) {
      if (lb.username === me) continue;
      map.set(lb.username, {
        id: 'user_' + lb.username.toLowerCase(),
        username: lb.username,
        avatarIcon: lb.avatarIcon ?? 'shield',
        elo: lb.elo,
        guildTag: lb.guildTag ?? '[DUEL]',
        trustScore: lb.elo >= 2000 ? 99 : 94,
        isOnline: !!lb.isOnline,
      });
    }

    for (const gm of this.gameState.guild().members) {
      if (gm.username === me || map.has(gm.username)) continue;
      map.set(gm.username, {
        id: gm.id,
        username: gm.username,
        avatarIcon: gm.avatarIcon ?? 'shield',
        elo: gm.elo,
        guildTag: '[AETHER]',
        trustScore: 97,
        isOnline: gm.lastActive === 'En ligne',
      });
    }

    return Array.from(map.values());
  });

  readonly selectedPartner = computed(() => {
    const id = this.composerPartnerId();
    const candidates = this.partnerCandidates();
    return candidates.find(c => c.id === id) ?? candidates[0] ?? null;
  });

  readonly activeProposalsCount = computed(() =>
    this.gameState.directTradeProposals().filter(p => p.status === 'pending_review' || p.status === 'locked_scam').length
  );

  readonly archivedProposalsCount = computed(() =>
    this.gameState.directTradeProposals().filter(p => p.status === 'completed' || p.status === 'cancelled' || p.status === 'reported').length
  );

  readonly filteredProposals = computed(() => {
    const filter = this.proposalFilter();
    const list = this.gameState.directTradeProposals();
    if (filter === 'active') {
      return list.filter(p => p.status === 'pending_review' || p.status === 'locked_scam');
    }
    return list.filter(p => p.status === 'completed' || p.status === 'cancelled' || p.status === 'reported');
  });

  readonly selectedProposal = computed(() => {
    const list = this.filteredProposals();
    const selId = this.selectedProposalId();
    if (selId) {
      const found = list.find(p => p.id === selId) ?? this.gameState.directTradeProposals().find(p => p.id === selId);
      if (found) return found;
    }
    return list[0] ?? this.gameState.directTradeProposals()[0] ?? null;
  });

  readonly composerAssessment = computed<FairTradeAssessment>(() =>
    assessTradeFairness(this.composerPlayerBundle(), this.composerPartnerBundle())
  );

  readonly playerTradableCards = computed(() => this.gameState.cards().slice(0, 60));
  readonly partnerCatalogCards = computed(() => this.gameState.cards().slice(0, 60));
  readonly playerOwnedPotions = computed(() => this.gameState.potions().filter(p => p.count > 0));

  readonly resourceMetaList = computed(() => Object.values(TRADE_RESOURCE_CATALOG));

  readonly sellTotalEquivGold = computed(
    () => this.sellPriceGold() + this.sellPriceGems() * GEM_TO_GOLD_RATE
  );

  readonly filteredOffers = computed(() => {
    const filter = this.marketFilter();
    const list = this.gameState.tradeOffers();
    if (filter === 'card') return list.filter(o => o.itemType === 'card');
    if (filter === 'potion') return list.filter(o => o.itemType === 'potion');
    if (filter === 'featured') return list.filter(o => !!o.isFeatured);
    return list;
  });

  readonly besaceItems = computed<BesaceTradeItem[]>(() => {
    const cards: BesaceTradeItem[] = this.gameState.cards().slice(0, 50).map(c => {
      const fairVal = evaluateCardValue(c);
      const isRare = c.rarity !== 'common' || !!c.foil;
      return {
        key: `card:${c.id}`,
        itemType: 'card',
        id: c.id,
        name: c.name,
        subtitle: `${this.rarityLabel(c.rarity)} · ~${fairVal} Or`,
        rarity: c.rarity,
        imageUrl: c.imageUrl,
        icon: c.icon,
        color: this.rarityHex(c.rarity),
        suggestedGold: Math.round(fairVal * 0.72),
        suggestedGems: Math.max(5, Math.round((fairVal * 0.28) / GEM_TO_GOLD_RATE)),
        minFloorGold: Math.round(fairVal * (isRare ? 0.5 : 0.35)),
      };
    });

    const potions: BesaceTradeItem[] = this.gameState.potions()
      .filter(p => p.count > 0)
      .map(p => {
        const fairVal = evaluatePotionValue(p, 1);
        const isRare = p.rarity !== 'common';
        return {
          key: `potion:${p.id}`,
          itemType: 'potion',
          id: p.id,
          name: p.name,
          subtitle: `Stock x${p.count} · ~${fairVal} Or`,
          rarity: p.rarity,
          imageUrl: p.imageUrl,
          icon: p.icon,
          color: p.color,
          suggestedGold: Math.round(fairVal * 0.75),
          suggestedGems: Math.max(5, Math.round((fairVal * 0.25) / GEM_TO_GOLD_RATE)),
          minFloorGold: Math.round(fairVal * (isRare ? 0.5 : 0.35)),
        };
      });

    return [...cards, ...potions];
  });

  readonly filteredBesaceItems = computed(() => {
    const filter = this.besaceFilter();
    const items = this.besaceItems();
    if (filter === 'card') return items.filter(i => i.itemType === 'card');
    if (filter === 'potion') return items.filter(i => i.itemType === 'potion');
    return items;
  });

  constructor() {
    if (typeof window !== 'undefined') {
      this.tickerInterval = setInterval(() => {
        this.nowTimestamp.set(Date.now());
      }, 250);
    }

    this.destroyRef.onDestroy(() => {
      this.activeTimers.forEach(t => clearTimeout(t));
      this.activeTimers = [];
      if (this.tickerInterval) {
        clearInterval(this.tickerInterval);
        this.tickerInterval = null;
      }
    });
  }

  // ==========================================
  // HELPERS & FORMATTING
  // ==========================================

  rarityLabel(rarity: CardRarity): string {
    switch (rarity) {
      case 'mythic':
        return 'Mythique';
      case 'legendary':
        return 'Légendaire';
      case 'epic':
        return 'Épique';
      case 'rare':
        return 'Rare';
      default:
        return 'Commun';
    }
  }

  private rarityHex(rarity: CardRarity): string {
    switch (rarity) {
      case 'mythic':
        return '#fb7185';
      case 'legendary':
        return '#fbbf24';
      case 'epic':
        return '#c084fc';
      case 'rare':
        return '#38bdf8';
      default:
        return '#a8a29e';
    }
  }

  cardValue(card: Card): number {
    return evaluateCardValue(card);
  }

  potionValue(potion: Potion, qty = 1): number {
    return evaluatePotionValue(potion, qty);
  }

  isRareResourceKey(key: TradeResourceKey): boolean {
    return !!TRADE_RESOURCE_CATALOG[key]?.isRareResource;
  }

  ownedResourceStock(key: TradeResourceKey): number {
    return this.gameState.alchemyResources()[key] ?? 0;
  }

  assessProposal(prop: DirectTradeProposal): FairTradeAssessment {
    return assessTradeFairness(prop.playerOffers, prop.partnerOffers);
  }

  remainingInspectionSeconds(prop: DirectTradeProposal): number {
    const diff = prop.inspectionEndsAt - this.nowTimestamp();
    return diff > 0 ? Math.ceil(diff / 1000) : 0;
  }

  fairRatioBarPct(fair: FairTradeAssessment): number {
    return Math.max(8, Math.min(100, fair.ratioPct));
  }

  proposalStatusLabel(prop: DirectTradeProposal, fair: FairTradeAssessment): string {
    if (prop.status === 'completed') return 'Scellé';
    if (prop.status === 'reported') return 'Arnaque Signalée';
    if (prop.status === 'cancelled') return 'Annulé';
    if (prop.status === 'locked_scam' || fair.status === 'scam_blocked') return 'Arnaque Bloquée';
    if (fair.status === 'caution') return 'Double Sceau';
    return 'Équitable';
  }

  marketBadgeLabel(fair: FairTradeAssessment): string {
    if (fair.status === 'balanced') return 'Prix Juste';
    if (fair.ratioPct > 120) return 'Bon Prix';
    if (fair.status === 'scam_blocked') return 'Prix Anormal';
    return 'Vigilance';
  }

  auditTypeLabel(type: 'p2p_trade' | 'market_buy' | 'market_sell' | 'scam_prevented' | 'escrow_cancelled'): string {
    switch (type) {
      case 'p2p_trade':
        return 'Troc Escrow Validé';
      case 'market_buy':
        return 'Achat Marché';
      case 'market_sell':
        return 'Annonce Publiée';
      case 'scam_prevented':
        return 'Arnaque Bloquée';
      case 'escrow_cancelled':
        return 'Contrat Annulé';
    }
  }

  canConfirmProposal(prop: DirectTradeProposal, fair: FairTradeAssessment, lockSecs: number): boolean {
    if (prop.status !== 'pending_review') return false;
    if (fair.status === 'scam_blocked') return false;
    if (lockSecs > 0) return false;
    if (fair.requiresDoubleConfirm && !prop.highValueVerified) return false;
    return true;
  }

  canAfford(offer: TradeOffer): boolean {
    return this.gameState.gold() >= offer.priceGold && this.gameState.gems() >= offer.priceGems;
  }

  canPublishStagedSell(item: BesaceTradeItem): boolean {
    const total = this.sellTotalEquivGold();
    return total > 0 && total >= item.minFloorGold;
  }

  private getOfferItemName(offer: TradeOffer): string {
    return offer.cardData?.name ?? offer.potionData?.name ?? 'Article du Marché';
  }

  private scheduleTimer(fn: () => void, ms: number) {
    const t = setTimeout(fn, ms);
    this.activeTimers.push(t);
  }

  // ==========================================
  // DETAILED ITEM INSPECTOR
  // ==========================================

  inspectCard(card: Card, sellerName?: string, sellerTrust?: number) {
    const inActiveDeck = this.gameState.decks().some(d => d.cardIds.includes(card.id));
    this.inspectedItem.set({
      kind: 'card',
      card,
      estimatedGold: evaluateCardValue(card),
      sellerName,
      sellerTrust,
      inActiveDeck,
    });
    this.sound.playClick('parchment');
  }

  inspectPotion(potion: Potion, quantity = 1, sellerName?: string, sellerTrust?: number) {
    this.inspectedItem.set({
      kind: 'potion',
      potion,
      quantity,
      estimatedGold: evaluatePotionValue(potion, quantity),
      sellerName,
      sellerTrust,
    });
    this.sound.playClick('parchment');
  }

  inspectResource(res: TradeResourceBundleItem, sellerName?: string) {
    const meta = TRADE_RESOURCE_CATALOG[res.resourceKey];
    this.inspectedItem.set({
      kind: 'resource',
      resource: res,
      description: meta?.description ?? 'Réactif alchimique d’Aetheria.',
      isRare: !!meta?.isRareResource,
      estimatedGold: evaluateResourceValue(res.resourceKey, res.quantity),
      ownedStock: this.ownedResourceStock(res.resourceKey),
      sellerName,
    });
    this.sound.playClick('parchment');
  }

  inspectOfferItem(offer: TradeOffer) {
    if (offer.cardData) {
      this.inspectCard(offer.cardData, offer.sellerName, offer.sellerTrustScore);
    } else if (offer.potionData) {
      this.inspectPotion(offer.potionData, offer.potionData.count, offer.sellerName, offer.sellerTrustScore);
    }
  }

  // ==========================================
  // P2P ESCROW ACTIONS & COMPOSER
  // ==========================================

  selectProposal(id: string) {
    this.selectedProposalId.set(id);
    this.isComposingProposal.set(false);
    this.editingProposalId.set(null);
    this.sound.playClick('parchment');
  }

  startNewProposal() {
    this.activeTab.set('p2p');
    this.editingProposalId.set(null);
    const firstPartner = this.partnerCandidates()[0];
    if (firstPartner) {
      this.composerPartnerId.set(firstPartner.id);
    }
    this.composerPlayerBundle.set(emptyBundle());
    this.composerPartnerBundle.set(emptyBundle());
    this.composerNote.set('');
    this.isComposingProposal.set(true);
    this.sound.playClick('gold');
  }

  openCounterOffer(prop: DirectTradeProposal) {
    this.editingProposalId.set(prop.id);
    this.composerPartnerId.set(prop.partnerId);
    this.composerPlayerBundle.set(cloneBundle(prop.playerOffers));
    this.composerPartnerBundle.set(cloneBundle(prop.partnerOffers));
    this.composerNote.set(prop.note ?? '');
    this.isComposingProposal.set(true);
    this.sound.playClick('parchment');
  }

  cancelComposer() {
    this.isComposingProposal.set(false);
    this.editingProposalId.set(null);
    this.sound.playClick('parchment');
  }

  addCardToComposer(side: 'player' | 'partner', cardId: string) {
    const card = this.gameState.cards().find(c => c.id === cardId);
    if (!card) return;
    const targetSig = side === 'player' ? this.composerPlayerBundle : this.composerPartnerBundle;
    targetSig.update(b => {
      if (b.cards.some(c => c.id === card.id)) return b;
      return { ...b, cards: [...b.cards, { ...card }] };
    });
    this.sound.playCardDraw();
  }

  removeCardFromComposer(side: 'player' | 'partner', cardId: string) {
    const targetSig = side === 'player' ? this.composerPlayerBundle : this.composerPartnerBundle;
    targetSig.update(b => ({ ...b, cards: b.cards.filter(c => c.id !== cardId) }));
  }

  addPotionToComposer(side: 'player' | 'partner', potionId: string) {
    const pot = this.gameState.potions().find(p => p.id === potionId);
    if (!pot) return;
    const targetSig = side === 'player' ? this.composerPlayerBundle : this.composerPartnerBundle;
    targetSig.update(b => {
      const existing = b.potions.find(item => item.potionId === potionId);
      if (existing) {
        const maxQty = side === 'player' ? pot.count : 10;
        if (existing.quantity >= maxQty) return b;
        return {
          ...b,
          potions: b.potions.map(item =>
            item.potionId === potionId ? { ...item, quantity: item.quantity + 1 } : item
          ),
        };
      }
      const added: TradePotionBundleItem = { potionId, quantity: 1, potionData: { ...pot } };
      return { ...b, potions: [...b.potions, added] };
    });
    this.sound.playClick();
  }

  removePotionFromComposer(side: 'player' | 'partner', potionId: string) {
    const targetSig = side === 'player' ? this.composerPlayerBundle : this.composerPartnerBundle;
    targetSig.update(b => ({ ...b, potions: b.potions.filter(p => p.potionId !== potionId) }));
  }

  addResourceToComposer(side: 'player' | 'partner', keyStr: string) {
    const key = keyStr as TradeResourceKey;
    const meta = TRADE_RESOURCE_CATALOG[key];
    if (!meta) return;
    const targetSig = side === 'player' ? this.composerPlayerBundle : this.composerPartnerBundle;
    targetSig.update(b => {
      const existing = b.resources.find(r => r.resourceKey === key);
      const maxQty = side === 'player' ? this.ownedResourceStock(key) : 50;
      if (maxQty <= 0) return b;
      if (existing) {
        if (existing.quantity >= maxQty) return b;
        return {
          ...b,
          resources: b.resources.map(r =>
            r.resourceKey === key ? { ...r, quantity: r.quantity + 1 } : r
          ),
        };
      }
      const added: TradeResourceBundleItem = {
        resourceKey: key,
        label: meta.label,
        rarity: meta.rarity,
        quantity: 1,
        imageUrl: meta.imageUrl,
        unitValueGold: meta.unitValueGold,
      };
      return { ...b, resources: [...b.resources, added] };
    });
    this.sound.playClick();
  }

  removeResourceFromComposer(side: 'player' | 'partner', key: TradeResourceKey) {
    const targetSig = side === 'player' ? this.composerPlayerBundle : this.composerPartnerBundle;
    targetSig.update(b => ({ ...b, resources: b.resources.filter(r => r.resourceKey !== key) }));
  }

  updateComposerCurrency(side: 'player' | 'partner', kind: 'gold' | 'gems', event: Event) {
    const raw = Number((event.target as HTMLInputElement).value);
    let val = Number.isFinite(raw) && raw >= 0 ? Math.floor(raw) : 0;
    if (side === 'player') {
      const cap = kind === 'gold' ? this.gameState.gold() : this.gameState.gems();
      if (val > cap) val = cap;
    }
    const targetSig = side === 'player' ? this.composerPlayerBundle : this.composerPartnerBundle;
    targetSig.update(b => ({ ...b, [kind]: val }));
  }

  onComposerNoteInput(event: Event) {
    this.composerNote.set((event.target as HTMLInputElement).value);
  }

  submitComposer() {
    const editId = this.editingProposalId();
    const playerBundle = this.composerPlayerBundle();
    const partnerBundle = this.composerPartnerBundle();
    const note = this.composerNote();

    if (editId) {
      const res = this.gameState.modifyDirectTrade(editId, playerBundle, partnerBundle, note);
      if (res.ok) {
        this.selectedProposalId.set(editId);
        this.isComposingProposal.set(false);
        this.editingProposalId.set(null);
      }
      return;
    }

    const partner = this.selectedPartner();
    if (!partner) return;
    const res = this.gameState.proposeDirectTrade(partner, playerBundle, partnerBundle, note);
    if (res.ok && res.proposal) {
      this.proposalFilter.set('active');
      this.selectedProposalId.set(res.proposal.id);
      this.isComposingProposal.set(false);
    }
  }

  toggleHighValueCheck(proposalId: string, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.gameState.setDirectTradeHighValueVerified(proposalId, checked);
    this.sound.playClick(checked ? 'gold' : 'parchment');
  }

  sealDirectTrade(prop: DirectTradeProposal) {
    const res = this.gameState.confirmDirectTrade(prop.id);
    if (!res.ok) return;

    const burstId = Date.now();
    this.p2pSmokeBurst.set({ id: burstId, partnerName: prop.partnerName });
    this.scheduleTimer(() => {
      if (this.p2pSmokeBurst()?.id === burstId) {
        this.p2pSmokeBurst.set(null);
      }
    }, 1500);
  }

  // ==========================================
  // DRAG & DROP: MARKETPLACE OFFER -> BUY ZONE
  // ==========================================

  onOfferDragStart(event: DragEvent, offer: TradeOffer) {
    this.draggedOfferId.set(offer.id);
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', `offer:${offer.id}`);
      event.dataTransfer.effectAllowed = 'move';
    }
    this.sound.playCardDraw();
  }

  onOfferDragEnd() {
    this.draggedOfferId.set(null);
    this.isBuyDropOver.set(false);
  }

  onBuyDragOver(event: DragEvent) {
    if (!this.draggedOfferId()) return;
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    if (!this.isBuyDropOver()) {
      this.isBuyDropOver.set(true);
    }
  }

  onBuyDragLeave(event: DragEvent) {
    const current = event.currentTarget as HTMLElement | null;
    const related = event.relatedTarget as Node | null;
    if (current && related && current.contains(related)) return;
    this.isBuyDropOver.set(false);
  }

  onBuyDrop(event: DragEvent) {
    event.preventDefault();
    this.isBuyDropOver.set(false);

    let offerId = this.draggedOfferId();
    if (!offerId && event.dataTransfer) {
      const payload = event.dataTransfer.getData('text/plain');
      if (payload.startsWith('offer:')) {
        offerId = payload.slice('offer:'.length);
      }
    }
    this.draggedOfferId.set(null);

    if (!offerId) return;
    const offer = this.gameState.tradeOffers().find(o => o.id === offerId);
    if (offer) {
      this.stageBuyFromCard(offer);
    }
  }

  stageBuyFromCard(offer: TradeOffer) {
    this.stagedBuyOffer.set(offer);
    this.buySnapKey.update(k => k + 1);
    this.sound.playTradeDropSnap();
  }

  clearStagedBuy() {
    this.stagedBuyOffer.set(null);
    this.sound.playClick('parchment');
  }

  confirmStagedBuy() {
    const offer = this.stagedBuyOffer();
    if (!offer || !this.canAfford(offer)) return;

    const itemName = this.getOfferItemName(offer);
    const purchased = this.gameState.buyTradeOffer(offer.id);
    if (!purchased) return;

    this.stagedBuyOffer.set(null);
    this.sound.playTradeSmokeMagic();

    const burstId = Date.now();
    this.buySmokeBurst.set({ id: burstId, itemName });
    this.scheduleTimer(() => {
      if (this.buySmokeBurst()?.id === burstId) {
        this.buySmokeBurst.set(null);
      }
    }, 1500);
  }

  // ==========================================
  // DRAG & DROP: BESACE ITEM -> SELL ZONE
  // ==========================================

  onBesaceDragStart(event: DragEvent, item: BesaceTradeItem) {
    this.draggedBesaceKey.set(item.key);
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', `besace:${item.key}`);
      event.dataTransfer.effectAllowed = 'move';
    }
    this.sound.playCardDraw();
  }

  onBesaceDragEnd() {
    this.draggedBesaceKey.set(null);
    this.isSellDropOver.set(false);
  }

  onSellDragOver(event: DragEvent) {
    if (!this.draggedBesaceKey()) return;
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    if (!this.isSellDropOver()) {
      this.isSellDropOver.set(true);
    }
  }

  onSellDragLeave(event: DragEvent) {
    const current = event.currentTarget as HTMLElement | null;
    const related = event.relatedTarget as Node | null;
    if (current && related && current.contains(related)) return;
    this.isSellDropOver.set(false);
  }

  onSellDrop(event: DragEvent) {
    event.preventDefault();
    this.isSellDropOver.set(false);

    let key = this.draggedBesaceKey();
    if (!key && event.dataTransfer) {
      const payload = event.dataTransfer.getData('text/plain');
      if (payload.startsWith('besace:')) {
        key = payload.slice('besace:'.length);
      }
    }
    this.draggedBesaceKey.set(null);

    if (!key) return;
    const item = this.besaceItems().find(i => i.key === key);
    if (item) {
      this.stageSellItem(item);
    }
  }

  stageSellItem(item: BesaceTradeItem) {
    this.stagedSellItem.set(item);
    this.sellPriceGold.set(item.suggestedGold);
    this.sellPriceGems.set(item.suggestedGems);
    this.sellSnapKey.update(k => k + 1);
    this.sound.playTradeDropSnap();
  }

  onSellGoldInput(event: Event) {
    const val = Number((event.target as HTMLInputElement).value);
    this.sellPriceGold.set(Number.isFinite(val) && val >= 0 ? val : 0);
  }

  onSellGemsInput(event: Event) {
    const val = Number((event.target as HTMLInputElement).value);
    this.sellPriceGems.set(Number.isFinite(val) && val >= 0 ? val : 0);
  }

  confirmStagedSell() {
    const item = this.stagedSellItem();
    const gold = this.sellPriceGold();
    const gems = this.sellPriceGems();
    if (!item || !this.canPublishStagedSell(item)) return;

    const result = this.gameState.createTradeOffer(item.itemType, item.id, gold, gems);
    if (!result.ok) return;

    this.stagedSellItem.set(null);
    this.sound.playTradeSmokeMagic();

    const burstId = Date.now();
    this.sellSmokeBurst.set({ id: burstId, itemName: item.name });
    this.scheduleTimer(() => {
      if (this.sellSmokeBurst()?.id === burstId) {
        this.sellSmokeBurst.set(null);
      }
    }, 1500);
  }

  // ==========================================
  // MODAL PURCHASE & PUBLISH HANDLERS
  // ==========================================

  openPurchaseConfirmation(offer: TradeOffer) {
    this.modalSmokeBurst.set(null);
    this.modalConfirmOffer.set(offer);
    this.sound.playClick('gold');
  }

  closePurchaseConfirmation() {
    if (this.modalSmokeBurst()) return;
    this.modalConfirmOffer.set(null);
    this.sound.playClick('parchment');
  }

  confirmModalPurchase() {
    const offer = this.modalConfirmOffer();
    if (!offer || !this.canAfford(offer)) return;

    const itemName = this.getOfferItemName(offer);
    const purchased = this.gameState.buyTradeOffer(offer.id);
    if (!purchased) return;

    if (this.stagedBuyOffer()?.id === offer.id) {
      this.stagedBuyOffer.set(null);
    }

    this.sound.playTradeSmokeMagic();
    const burstId = Date.now();
    this.modalSmokeBurst.set({ id: burstId, itemName });

    this.scheduleTimer(() => {
      if (this.modalSmokeBurst()?.id === burstId) {
        this.modalSmokeBurst.set(null);
        this.modalConfirmOffer.set(null);
      }
    }, 1380);
  }

  openCreateModal() {
    this.showCreateTradeModal.set(true);
    this.sound.playClick('gold');
  }

  publishTrade(val: string, gold: number, gems: number) {
    const [type, id] = val.split(':');
    const safeGold = Number.isFinite(gold) && gold >= 0 ? gold : 0;
    const safeGems = Number.isFinite(gems) && gems >= 0 ? gems : 0;
    const res = this.gameState.createTradeOffer(type as 'card' | 'potion', id, safeGold, safeGems);
    if (!res.ok) return;

    this.showCreateTradeModal.set(false);
    this.activeTab.set('market');
    this.sound.playTradeSmokeMagic();

    const item = this.besaceItems().find(i => i.key === val);
    const burstId = Date.now();
    this.sellSmokeBurst.set({ id: burstId, itemName: item?.name ?? 'Offre déposée' });
    this.scheduleTimer(() => {
      if (this.sellSmokeBurst()?.id === burstId) {
        this.sellSmokeBurst.set(null);
      }
    }, 1500);
  }
}
