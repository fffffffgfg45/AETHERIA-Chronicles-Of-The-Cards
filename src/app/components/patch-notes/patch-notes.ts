import { ChangeDetectionStrategy, Component, OnInit, computed, inject, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import {
  ChangelogCategory,
  ChangelogChangeItem,
  ChangelogRelease,
  ChangelogTargetView,
  PatchEntryKind,
} from '../../data/changelog-data';
import { PatchFeedEntry, PatchNotesService } from '../../services/patch-notes';
import { SoundService } from '../../services/sound';

interface CategoryFilterOption {
  id: 'all' | ChangelogCategory;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-patch-notes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, ReactiveFormsModule],
  template: `
    <section class="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
      <!-- Editorial Header -->
      <header class="bg-[#16120e] border border-[#3a2f23] rounded-2xl p-6 shadow-md">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div class="space-y-1.5">
            <p class="text-xs font-cinzel tracking-[0.16em] uppercase text-[#c5a880]">
              Notes de Patch Développeur · {{ patchNotes.releases().length }} versions · {{ patchNotes.totalFeaturesCount() }} fonctionnalités · {{ patchNotes.totalBugFixesCount() }} correctifs
            </p>
            <h1 class="font-cinzel-dec text-2xl sm:text-3xl font-black text-[#ffd700] flex items-center gap-2.5">
              <mat-icon class="text-[#d4af37] text-3xl">new_releases</mat-icon>
              <span>Journal des Modifications &amp; Correctifs</span>
            </h1>
            <p class="text-sm text-[#c5bca8] max-w-2xl leading-relaxed">
              Consultez les dernières fonctionnalités ajoutées, les correctifs de bugs récents et publiez de nouvelles notes de version depuis le gestionnaire développeur intégré.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2.5 shrink-0">
            <!-- Unread Summary -->
            <div class="px-3.5 py-2 rounded-xl bg-[#120f0c] border border-[#3a2f23] text-xs font-mono tabular-nums flex items-center gap-2">
              <mat-icon class="text-sm text-[#d4af37]">mark_email_unread</mat-icon>
              <span class="text-[#c5a880]">Non lues :</span>
              <strong
                class="font-black"
                [class.text-[#ffd700]]="patchNotes.unreadCount() > 0"
                [class.text-emerald-400]="patchNotes.unreadCount() === 0">
                {{ patchNotes.unreadCount() }}
              </strong>
            </div>

            @if (patchNotes.unreadCount() > 0) {
              <button
                type="button"
                (click)="markAllRead()"
                class="medieval-btn px-3.5 py-2 rounded-xl bg-[#1a1612] hover:bg-[#251f18] border border-[#8b6b43]/70 text-xs font-cinzel font-bold text-[#ffd700] flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0">
                <mat-icon class="text-sm text-emerald-400">done_all</mat-icon>
                <span>Tout marquer comme lu</span>
              </button>
            }

            <button
              type="button"
              (click)="toggleDevManager()"
              class="medieval-btn px-3.5 py-2 rounded-xl border text-xs font-cinzel font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
              [class.bg-[#2a2117]]="showDevManager()"
              [class.border-[#d4af37]]="showDevManager()"
              [class.text-[#ffd700]]="showDevManager()"
              [class.bg-[#120f0c]]="!showDevManager()"
              [class.border-[#3a2f23]]="!showDevManager()"
              [class.text-[#c5a880]]="!showDevManager()">
              <mat-icon class="text-sm text-[#d4af37]">edit_note</mat-icon>
              <span>{{ showDevManager() ? 'Fermer Gestion Dev' : 'Gérer les Notes' }}</span>
            </button>

            <!-- Mode Toggle -->
            <div class="flex items-center bg-[#120f0c] border border-[#3a2f23] rounded-xl p-1">
              <button
                type="button"
                (click)="setViewMode('summary')"
                class="px-3 py-1.5 rounded-lg text-xs font-cinzel font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                [class.bg-[#2a2117]]="viewMode() === 'summary'"
                [class.text-[#ffd700]]="viewMode() === 'summary'"
                [class.text-[#8b7d6b]]="viewMode() !== 'summary'">
                <mat-icon class="text-sm">splitscreen</mat-icon>
                <span>Synthèse</span>
              </button>
              <button
                type="button"
                (click)="setViewMode('release')"
                class="px-3 py-1.5 rounded-lg text-xs font-cinzel font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                [class.bg-[#2a2117]]="viewMode() === 'release'"
                [class.text-[#ffd700]]="viewMode() === 'release'"
                [class.text-[#8b7d6b]]="viewMode() !== 'release'">
                <mat-icon class="text-sm">article</mat-icon>
                <span>Par Version</span>
              </button>
              <button
                type="button"
                (click)="setViewMode('feed')"
                class="px-3 py-1.5 rounded-lg text-xs font-cinzel font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                [class.bg-[#2a2117]]="viewMode() === 'feed'"
                [class.text-[#ffd700]]="viewMode() === 'feed'"
                [class.text-[#8b7d6b]]="viewMode() !== 'feed'">
                <mat-icon class="text-sm">view_agenda</mat-icon>
                <span>Flux Complet</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Filter & Search Toolbar -->
        <div class="mt-5 pt-4 border-t border-[#3a2f23]/80 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div class="flex flex-wrap items-center gap-1.5">
            @for (cat of categoryFilters; track cat.id) {
              <button
                type="button"
                (click)="selectCategory(cat.id)"
                class="px-3 py-1.5 rounded-lg border text-xs font-cinzel font-bold flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0"
                [class.bg-[#d4af37]/15]="selectedCategory() === cat.id"
                [class.border-[#d4af37]]="selectedCategory() === cat.id"
                [class.text-[#ffd700]]="selectedCategory() === cat.id"
                [class.bg-[#120f0c]]="selectedCategory() !== cat.id"
                [class.border-[#3a2f23]]="selectedCategory() !== cat.id"
                [class.text-[#a69882]]="selectedCategory() !== cat.id"
                [class.hover:text-[#e0dcc7]]="selectedCategory() !== cat.id">
                <mat-icon class="text-sm">{{ cat.icon }}</mat-icon>
                <span>{{ cat.label }}</span>
              </button>
            }
          </div>

          <div class="relative w-full lg:w-72 shrink-0">
            <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-base text-[#8b6b43] pointer-events-none">search</mat-icon>
            <input
              #searchInput
              type="text"
              [value]="searchQuery()"
              (input)="onSearchInput(searchInput.value)"
              placeholder="Rechercher fonctionnalité ou correctif..."
              aria-label="Rechercher dans les notes de patch"
              class="w-full pl-9 pr-8 py-2 rounded-xl bg-[#120f0c] border border-[#3a2f23] focus:border-[#d4af37] focus:outline-none text-xs text-[#e0dcc7] placeholder-[#7c6e5b]" />
            @if (searchQuery().length > 0) {
              <button
                type="button"
                (click)="clearSearch()"
                title="Effacer la recherche"
                class="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8b6b43] hover:text-[#ffd700]">
                <mat-icon class="text-sm">close</mat-icon>
              </button>
            }
          </div>
        </div>
      </header>

      <!-- Developer Patch Notes Manager Panel -->
      @if (showDevManager()) {
        <section class="bg-[#16120e] border border-[#8b6b43]/70 rounded-2xl p-6 shadow-md space-y-5">
          <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#3a2f23]">
            <div>
              <h2 class="font-cinzel text-base font-bold text-[#ffd700] flex items-center gap-2">
                <mat-icon class="text-lg text-[#d4af37]">terminal</mat-icon>
                <span>Gestionnaire de Notes Développeur</span>
              </h2>
              <p class="text-xs text-[#b8ae99] mt-0.5">
                Ajoutez de nouvelles fonctionnalités ou des correctifs de bugs à une version existante, ou publiez une nouvelle version.
              </p>
            </div>
            <button
              type="button"
              (click)="resetDefaults()"
              class="px-3 py-1.5 rounded-lg bg-[#120f0c] hover:bg-[#1f1912] border border-[#3a2f23] text-xs font-cinzel font-bold text-[#c5a880] flex items-center gap-1.5">
              <mat-icon class="text-sm">restart_alt</mat-icon>
              <span>Restaurer le catalogue initial</span>
            </button>
          </div>

          @if (devFeedback()) {
            <div
              class="px-4 py-2.5 rounded-xl border text-xs font-medium flex items-center justify-between gap-2"
              [class.bg-emerald-950/50]="devFeedback()!.ok"
              [class.border-emerald-500/60]="devFeedback()!.ok"
              [class.text-emerald-200]="devFeedback()!.ok"
              [class.bg-red-950/50]="!devFeedback()!.ok"
              [class.border-red-500/60]="!devFeedback()!.ok"
              [class.text-red-200]="!devFeedback()!.ok">
              <span>{{ devFeedback()!.message }}</span>
              <button type="button" (click)="devFeedback.set(null)" class="hover:opacity-80">
                <mat-icon class="text-sm">close</mat-icon>
              </button>
            </div>
          }

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Form 1: Add Feature or Bug Fix Entry -->
            <form
              [formGroup]="addEntryForm"
              (ngSubmit)="submitPatchEntry()"
              class="bg-[#120f0c] border border-[#2b2219] rounded-xl p-4 space-y-3">
              <h3 class="font-cinzel text-sm font-bold text-[#f3ebd8] flex items-center gap-1.5">
                <mat-icon class="text-base text-emerald-400">add_circle_outline</mat-icon>
                <span>Ajouter une Fonctionnalité ou un Correctif</span>
              </h3>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <label class="space-y-1 block">
                  <span class="text-[11px] font-cinzel text-[#c5a880]">Version cible</span>
                  <select
                    formControlName="version"
                    class="w-full px-2.5 py-2 rounded-lg bg-[#1a1612] border border-[#3a2f23] text-xs text-[#e0dcc7] focus:border-[#d4af37] focus:outline-none">
                    @for (rel of patchNotes.releases(); track rel.version) {
                      <option [value]="rel.version">v{{ rel.version }}</option>
                    }
                  </select>
                </label>

                <label class="space-y-1 block">
                  <span class="text-[11px] font-cinzel text-[#c5a880]">Type d’entrée</span>
                  <select
                    formControlName="kind"
                    class="w-full px-2.5 py-2 rounded-lg bg-[#1a1612] border border-[#3a2f23] text-xs text-[#e0dcc7] focus:border-[#d4af37] focus:outline-none">
                    <option value="feature">Nouveauté (Feature)</option>
                    <option value="bugfix">Correctif (Bug Fix)</option>
                  </select>
                </label>

                <label class="space-y-1 block">
                  <span class="text-[11px] font-cinzel text-[#c5a880]">Domaine</span>
                  <select
                    formControlName="category"
                    class="w-full px-2.5 py-2 rounded-lg bg-[#1a1612] border border-[#3a2f23] text-xs text-[#e0dcc7] focus:border-[#d4af37] focus:outline-none">
                    <option value="feature">Nouveauté Générale</option>
                    <option value="combat">Combat</option>
                    <option value="economy">Économie &amp; Troc</option>
                    <option value="security">Sécurité</option>
                    <option value="ui">Interface</option>
                    <option value="bugfix">Correctif Technique</option>
                  </select>
                </label>
              </div>

              <label class="space-y-1 block">
                <span class="text-[11px] font-cinzel text-[#c5a880]">Titre de la note</span>
                <input
                  type="text"
                  formControlName="title"
                  placeholder="Ex. : Amélioration du matchmaking ou Correctif de ciblage..."
                  class="w-full px-3 py-2 rounded-lg bg-[#1a1612] border border-[#3a2f23] text-xs text-[#e0dcc7] placeholder-[#7c6e5b] focus:border-[#d4af37] focus:outline-none" />
              </label>

              <label class="space-y-1 block">
                <span class="text-[11px] font-cinzel text-[#c5a880]">Description détaillée</span>
                <textarea
                  rows="2"
                  formControlName="description"
                  placeholder="Décrivez précisément l’ajout ou le comportement corrigé..."
                  class="w-full px-3 py-2 rounded-lg bg-[#1a1612] border border-[#3a2f23] text-xs text-[#e0dcc7] placeholder-[#7c6e5b] focus:border-[#d4af37] focus:outline-none"></textarea>
              </label>

              <button
                type="submit"
                class="medieval-btn px-4 py-2 rounded-xl bg-[#2a2117] hover:bg-[#382b1d] border border-[#d4af37]/70 text-xs font-cinzel font-bold text-[#ffd700] flex items-center gap-1.5">
                <mat-icon class="text-sm">publish</mat-icon>
                <span>Enregistrer la note</span>
              </button>
            </form>

            <!-- Form 2: Publish New Release -->
            <form
              [formGroup]="publishReleaseForm"
              (ngSubmit)="submitNewRelease()"
              class="bg-[#120f0c] border border-[#2b2219] rounded-xl p-4 space-y-3">
              <h3 class="font-cinzel text-sm font-bold text-[#f3ebd8] flex items-center gap-1.5">
                <mat-icon class="text-base text-[#ffd700]">new_label</mat-icon>
                <span>Publier une Nouvelle Version</span>
              </h3>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <label class="space-y-1 block">
                  <span class="text-[11px] font-cinzel text-[#c5a880]">Numéro (ex. 2.8)</span>
                  <input
                    type="text"
                    formControlName="version"
                    placeholder="2.8"
                    class="w-full px-3 py-2 rounded-lg bg-[#1a1612] border border-[#3a2f23] text-xs font-mono text-[#e0dcc7] placeholder-[#7c6e5b] focus:border-[#d4af37] focus:outline-none" />
                </label>

                <label class="space-y-1 block sm:col-span-2">
                  <span class="text-[11px] font-cinzel text-[#c5a880]">Titre de la version</span>
                  <input
                    type="text"
                    formControlName="title"
                    placeholder="Ex. : Équilibrage de l’Arène & Correctifs"
                    class="w-full px-3 py-2 rounded-lg bg-[#1a1612] border border-[#3a2f23] text-xs text-[#e0dcc7] placeholder-[#7c6e5b] focus:border-[#d4af37] focus:outline-none" />
                </label>
              </div>

              <label class="space-y-1 block">
                <span class="text-[11px] font-cinzel text-[#c5a880]">Sous-titre</span>
                <input
                  type="text"
                  formControlName="subtitle"
                  placeholder="Court résumé des objectifs du patch..."
                  class="w-full px-3 py-2 rounded-lg bg-[#1a1612] border border-[#3a2f23] text-xs text-[#e0dcc7] placeholder-[#7c6e5b] focus:border-[#d4af37] focus:outline-none" />
              </label>

              <label class="space-y-1 block">
                <span class="text-[11px] font-cinzel text-[#c5a880]">Résumé éditorial</span>
                <textarea
                  rows="2"
                  formControlName="summary"
                  placeholder="Présentation générale de la mise à jour..."
                  class="w-full px-3 py-2 rounded-lg bg-[#1a1612] border border-[#3a2f23] text-xs text-[#e0dcc7] placeholder-[#7c6e5b] focus:border-[#d4af37] focus:outline-none"></textarea>
              </label>

              <div class="flex flex-wrap items-center justify-between gap-3 pt-1">
                <label class="flex items-center gap-2 text-xs text-[#c5bca8] cursor-pointer">
                  <input
                    type="checkbox"
                    formControlName="isMajor"
                    class="rounded border-[#3a2f23] bg-[#1a1612] text-[#d4af37]" />
                  <span>Marquer comme Édition Majeure</span>
                </label>

                <button
                  type="submit"
                  class="medieval-btn px-4 py-2 rounded-xl bg-[#2a2117] hover:bg-[#382b1d] border border-[#d4af37]/70 text-xs font-cinzel font-bold text-[#ffd700] flex items-center gap-1.5">
                  <mat-icon class="text-sm">rocket_launch</mat-icon>
                  <span>Publier la version</span>
                </button>
              </div>
            </form>
          </div>
        </section>
      }

      <!-- SUMMARY VIEW: Side-by-Side Recent Features vs Bug Fixes -->
      @if (viewMode() === 'summary') {
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <!-- Left Column: Recently Added Features -->
          <section class="bg-[#16120e] border border-[#3a2f23] rounded-2xl p-6 space-y-4 shadow-md">
            <div class="flex items-center justify-between gap-2 pb-3 border-b border-[#3a2f23]/80">
              <div>
                <h2 class="font-cinzel text-lg font-bold text-[#ffd700] flex items-center gap-2">
                  <mat-icon class="text-xl text-[#d4af37]">auto_awesome</mat-icon>
                  <span>Nouvelles Fonctionnalités Récentes</span>
                </h2>
                <p class="text-xs text-[#a69882] mt-0.5">
                  Ajouts majeurs de gameplay, économie et sécurité.
                </p>
              </div>
              <span class="text-xs font-mono tabular-nums text-[#ffd700] font-bold">
                {{ filteredRecentFeatures().length }} ajouts
              </span>
            </div>

            @if (filteredRecentFeatures().length === 0) {
              <p class="text-sm text-[#8b7d6b] py-6 text-center">
                Aucune fonctionnalité ne correspond aux filtres actuels.
              </p>
            } @else {
              <div class="space-y-3">
                @for (item of filteredRecentFeatures(); track item.id) {
                  <article class="p-4 rounded-xl bg-[#120f0c] border border-[#2b2219] hover:border-[#8b6b43]/70 transition-colors space-y-2">
                    <div class="flex items-center justify-between gap-2 text-xs">
                      <span class="font-mono tabular-nums text-[#c5a880]">
                        Version {{ item.releaseVersion }} · {{ item.releaseDate }} · {{ getCategoryLabel(item.category) }}
                      </span>
                      @if (showDevManager()) {
                        <button
                          type="button"
                          (click)="removeEntry(item.releaseVersion, item.id)"
                          title="Supprimer cette note"
                          class="text-red-400 hover:text-red-300 flex items-center gap-0.5 text-[11px]">
                          <mat-icon class="text-sm">delete</mat-icon>
                        </button>
                      }
                    </div>
                    <h3 class="font-cinzel text-sm sm:text-base font-bold text-[#f3ebd8]">
                      {{ item.title }}
                    </h3>
                    <p class="text-xs sm:text-sm text-[#b8ae99] leading-relaxed">
                      {{ item.description }}
                    </p>
                    <div class="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <button
                        type="button"
                        (click)="inspectRelease(item.releaseVersion)"
                        class="text-xs font-cinzel font-bold text-[#c5a880] hover:text-[#ffd700] flex items-center gap-1">
                        <mat-icon class="text-sm">menu_book</mat-icon>
                        <span>Voir la version {{ item.releaseVersion }}</span>
                      </button>
                      @if (item.targetView && item.actionLabel) {
                        <button
                          type="button"
                          (click)="openTargetView(item.targetView, item.releaseVersion)"
                          class="medieval-btn px-3 py-1.5 rounded-lg bg-[#1f1912] hover:bg-[#2b2218] border border-[#8b6b43]/70 text-xs font-cinzel font-bold text-[#ffd700] flex items-center gap-1">
                          <mat-icon class="text-sm text-[#d4af37]">arrow_forward</mat-icon>
                          <span>{{ item.actionLabel }}</span>
                        </button>
                      }
                    </div>
                  </article>
                }
              </div>
            }
          </section>

          <!-- Right Column: Recent Bug Fixes -->
          <section class="bg-[#16120e] border border-[#3a2f23] rounded-2xl p-6 space-y-4 shadow-md">
            <div class="flex items-center justify-between gap-2 pb-3 border-b border-[#3a2f23]/80">
              <div>
                <h2 class="font-cinzel text-lg font-bold text-emerald-300 flex items-center gap-2">
                  <mat-icon class="text-xl text-emerald-400">bug_report</mat-icon>
                  <span>Correctifs &amp; Résolutions de Bugs</span>
                </h2>
                <p class="text-xs text-[#a69882] mt-0.5">
                  Corrections de stabilité, ciblage tactique et sécurité transactionnelle.
                </p>
              </div>
              <span class="text-xs font-mono tabular-nums text-emerald-400 font-bold">
                {{ filteredRecentBugFixes().length }} correctifs
              </span>
            </div>

            @if (filteredRecentBugFixes().length === 0) {
              <p class="text-sm text-[#8b7d6b] py-6 text-center">
                Aucun correctif ne correspond aux filtres actuels.
              </p>
            } @else {
              <div class="space-y-3">
                @for (fix of filteredRecentBugFixes(); track fix.id) {
                  <article class="p-4 rounded-xl bg-[#120f0c] border border-[#2b2219] hover:border-emerald-600/50 transition-colors space-y-2">
                    <div class="flex items-center justify-between gap-2 text-xs">
                      <span class="font-mono tabular-nums text-emerald-400/90">
                        Version {{ fix.releaseVersion }} · {{ fix.releaseDate }} · Correctif Résolu
                      </span>
                      @if (showDevManager()) {
                        <button
                          type="button"
                          (click)="removeEntry(fix.releaseVersion, fix.id)"
                          title="Supprimer ce correctif"
                          class="text-red-400 hover:text-red-300 flex items-center gap-0.5 text-[11px]">
                          <mat-icon class="text-sm">delete</mat-icon>
                        </button>
                      }
                    </div>
                    <h3 class="font-cinzel text-sm sm:text-base font-bold text-[#f3ebd8]">
                      {{ fix.title }}
                    </h3>
                    <p class="text-xs sm:text-sm text-[#b8ae99] leading-relaxed">
                      {{ fix.description }}
                    </p>
                    <div class="pt-1">
                      <button
                        type="button"
                        (click)="inspectRelease(fix.releaseVersion)"
                        class="text-xs font-cinzel font-bold text-[#a69882] hover:text-emerald-300 flex items-center gap-1">
                        <mat-icon class="text-sm">history</mat-icon>
                        <span>Contexte version {{ fix.releaseVersion }}</span>
                      </button>
                    </div>
                  </article>
                }
              </div>
            }
          </section>
        </div>
      } @else {
        <!-- RELEASE TIMELINE + FULL READER VIEW -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <!-- Left Sidebar: Release Timeline -->
          <aside class="lg:col-span-4 bg-[#16120e] border border-[#3a2f23] rounded-2xl p-4 space-y-2 shadow-sm lg:sticky lg:top-24">
            <div class="flex items-center justify-between px-2 pb-2 border-b border-[#3a2f23]/70">
              <h2 class="font-cinzel text-xs font-bold uppercase tracking-wider text-[#c5a880] flex items-center gap-1.5">
                <mat-icon class="text-sm text-[#d4af37]">history</mat-icon>
                <span>Historique des Versions</span>
              </h2>
              <span class="text-[11px] font-mono tabular-nums text-[#8b7d6b]">
                {{ totalMatchingChanges() }} notes
              </span>
            </div>

            <div class="space-y-1.5">
              @for (rel of patchNotes.releases(); track rel.version) {
                <button
                  type="button"
                  (click)="selectRelease(rel.version)"
                  class="w-full text-left p-3 rounded-xl border transition-all space-y-1"
                  [class.bg-[#221b13]]="viewMode() === 'release' && selectedVersion() === rel.version"
                  [class.border-[#d4af37]]="viewMode() === 'release' && selectedVersion() === rel.version"
                  [class.shadow-md]="viewMode() === 'release' && selectedVersion() === rel.version"
                  [class.bg-[#120f0c]]="!(viewMode() === 'release' && selectedVersion() === rel.version)"
                  [class.border-[#2b2219]]="!(viewMode() === 'release' && selectedVersion() === rel.version)"
                  [class.hover:border-[#8b6b43]/70]="!(viewMode() === 'release' && selectedVersion() === rel.version)">
                  <div class="flex items-center justify-between gap-2 text-[11px] font-mono tabular-nums">
                    <span class="font-bold text-[#ffd700]">
                      Version {{ rel.version }}
                    </span>
                    <div class="flex items-center gap-2">
                      @if (!patchNotes.isVersionRead(rel.version)) {
                        <span class="text-emerald-400 font-bold uppercase tracking-wide text-[10px]">
                          Nouveau
                        </span>
                      }
                      <span class="text-[#8b7d6b]">
                        {{ getFilteredChanges(rel).length }}/{{ rel.changes.length }}
                      </span>
                    </div>
                  </div>

                  <p class="font-cinzel text-xs font-bold text-[#e0dcc7] leading-snug">
                    {{ rel.title }}
                  </p>
                  <p class="text-[11px] text-[#8b7d6b]">
                    {{ rel.date }}
                  </p>
                </button>
              }
            </div>
          </aside>

          <!-- Right Reader Pane -->
          <div class="lg:col-span-8 space-y-6">
            @if (displayedReleases().length === 0) {
              <div class="bg-[#16120e] border border-[#3a2f23] rounded-2xl p-10 text-center space-y-3">
                <mat-icon class="text-4xl text-[#8b6b43]">manage_search</mat-icon>
                <h3 class="font-cinzel text-lg font-bold text-[#ffd700]">
                  Aucune note trouvée
                </h3>
                <p class="text-sm text-[#b8ae99] max-w-md mx-auto">
                  Aucune modification ne correspond aux filtres sélectionnés pour cette vue.
                </p>
                <div class="flex flex-wrap items-center justify-center gap-2 pt-2">
                  @if (viewMode() === 'release') {
                    <button
                      type="button"
                      (click)="setViewMode('feed')"
                      class="medieval-btn px-4 py-2 rounded-xl bg-[#251f18] border border-[#d4af37]/70 text-xs font-cinzel font-bold text-[#ffd700] flex items-center gap-1.5">
                      <mat-icon class="text-sm">view_agenda</mat-icon>
                      <span>Chercher dans toutes les versions</span>
                    </button>
                  }
                  <button
                    type="button"
                    (click)="resetFilters()"
                    class="medieval-btn px-4 py-2 rounded-xl bg-[#120f0c] border border-[#3a2f23] text-xs font-cinzel font-bold text-[#c5a880] flex items-center gap-1.5">
                    <mat-icon class="text-sm">restart_alt</mat-icon>
                    <span>Réinitialiser les filtres</span>
                  </button>
                </div>
              </div>
            } @else {
              @for (rel of displayedReleases(); track rel.version) {
                <article class="bg-[#16120e] border border-[#3a2f23] rounded-2xl overflow-hidden shadow-md">
                  @if (rel.bannerImageUrl) {
                    <div class="relative h-44 sm:h-52 overflow-hidden border-b border-[#3a2f23]">
                      <img
                        [src]="rel.bannerImageUrl"
                        [alt]="rel.title"
                        class="w-full h-full object-cover"
                        referrerpolicy="no-referrer" />
                      <div class="absolute inset-0 bg-gradient-to-t from-[#16120e] via-[#16120e]/55 to-transparent"></div>
                      <div class="absolute bottom-4 left-5 right-5 flex flex-wrap items-end justify-between gap-2">
                        <div>
                          <p class="text-xs font-mono tabular-nums text-[#ffd700] font-bold">
                            Version {{ rel.version }} · {{ rel.date }}@if (rel.isMajor) { <span>· Édition Majeure</span> }
                          </p>
                          <h2 class="font-cinzel-dec text-xl sm:text-2xl font-black text-white leading-tight mt-0.5">
                            {{ rel.title }}
                          </h2>
                        </div>
                        @if (!patchNotes.isVersionRead(rel.version)) {
                          <button
                            type="button"
                            (click)="markSingleRead(rel.version)"
                            class="px-3 py-1.5 rounded-lg bg-[#120f0c]/90 border border-emerald-500/60 text-xs font-cinzel font-bold text-emerald-300 flex items-center gap-1">
                            <mat-icon class="text-sm">check</mat-icon>
                            <span>Marquer comme lu</span>
                          </button>
                        }
                      </div>
                    </div>
                  }

                  <div class="p-6 space-y-6">
                    @if (!rel.bannerImageUrl) {
                      <div class="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-[#3a2f23]/80">
                        <div class="space-y-1">
                          <p class="text-xs font-mono tabular-nums text-[#d4af37] font-bold">
                            Version {{ rel.version }} · {{ rel.date }}@if (rel.isMajor) { <span>· Édition Majeure</span> }
                          </p>
                          <h2 class="font-cinzel-dec text-xl sm:text-2xl font-black text-[#ffd700]">
                            {{ rel.title }}
                          </h2>
                        </div>
                        @if (!patchNotes.isVersionRead(rel.version)) {
                          <button
                            type="button"
                            (click)="markSingleRead(rel.version)"
                            class="px-3 py-1.5 rounded-lg bg-[#120f0c] border border-emerald-500/60 text-xs font-cinzel font-bold text-emerald-300 flex items-center gap-1">
                            <mat-icon class="text-sm">check</mat-icon>
                            <span>Marquer comme lu</span>
                          </button>
                        }
                      </div>
                    }

                    <div class="space-y-1">
                      <p class="font-cinzel text-sm font-bold text-[#c5a880]">
                        {{ rel.subtitle }}
                      </p>
                      <p class="text-sm text-[#cfc7b4] leading-relaxed">
                        {{ rel.summary }}
                      </p>
                    </div>

                    @if (getFeatureChanges(rel).length > 0) {
                      <div class="space-y-3">
                        <h3 class="font-cinzel text-xs font-bold uppercase tracking-wider text-[#ffd700] flex items-center gap-1.5">
                          <mat-icon class="text-sm text-[#d4af37]">auto_awesome</mat-icon>
                          <span>Nouvelles Fonctionnalités ({{ getFeatureChanges(rel).length }})</span>
                        </h3>
                        <div class="space-y-3">
                          @for (change of getFeatureChanges(rel); track change.id) {
                            <div class="p-4 rounded-xl bg-[#120f0c] border border-[#2b2219] hover:border-[#8b6b43]/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div class="space-y-1.5 flex-1">
                                <div class="flex items-center justify-between gap-2">
                                  <div class="flex items-center gap-2 text-xs font-cinzel font-bold" [class]="getCategoryTextColor(change.category)">
                                    <mat-icon class="text-base">{{ getCategoryIcon(change.category) }}</mat-icon>
                                    <span>{{ getCategoryLabel(change.category) }}</span>
                                  </div>
                                  @if (showDevManager()) {
                                    <button
                                      type="button"
                                      (click)="removeEntry(rel.version, change.id)"
                                      title="Supprimer cette note"
                                      class="text-red-400 hover:text-red-300">
                                      <mat-icon class="text-sm">delete</mat-icon>
                                    </button>
                                  }
                                </div>
                                <h4 class="font-cinzel text-base font-bold text-[#f3ebd8]">
                                  {{ change.title }}
                                </h4>
                                <p class="text-xs sm:text-sm text-[#b8ae99] leading-relaxed">
                                  {{ change.description }}
                                </p>
                              </div>

                              @if (change.targetView && change.actionLabel) {
                                <button
                                  type="button"
                                  (click)="openTargetView(change.targetView, rel.version)"
                                  class="medieval-btn px-3.5 py-2 rounded-xl bg-[#1f1912] hover:bg-[#2b2218] border border-[#8b6b43]/70 text-xs font-cinzel font-bold text-[#ffd700] flex items-center gap-1.5 whitespace-nowrap shrink-0 self-start sm:self-center">
                                  <mat-icon class="text-sm text-[#d4af37]">arrow_forward</mat-icon>
                                  <span>{{ change.actionLabel }}</span>
                                </button>
                              }
                            </div>
                          }
                        </div>
                      </div>
                    }

                    @if (getBugFixChanges(rel).length > 0) {
                      <div class="space-y-3 pt-2 border-t border-[#3a2f23]/60">
                        <h3 class="font-cinzel text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                          <mat-icon class="text-sm text-emerald-400">bug_report</mat-icon>
                          <span>Correctifs de Bugs ({{ getBugFixChanges(rel).length }})</span>
                        </h3>
                        <div class="space-y-3">
                          @for (fix of getBugFixChanges(rel); track fix.id) {
                            <div class="p-4 rounded-xl bg-[#120f0c] border border-[#2b2219] hover:border-emerald-600/50 transition-colors space-y-1.5">
                              <div class="flex items-center justify-between gap-2">
                                <div class="flex items-center gap-2 text-xs font-cinzel font-bold text-emerald-400">
                                  <mat-icon class="text-base">verified</mat-icon>
                                  <span>Correctif Résolu</span>
                                </div>
                                @if (showDevManager()) {
                                  <button
                                    type="button"
                                    (click)="removeEntry(rel.version, fix.id)"
                                    title="Supprimer ce correctif"
                                    class="text-red-400 hover:text-red-300">
                                    <mat-icon class="text-sm">delete</mat-icon>
                                  </button>
                                }
                              </div>
                              <h4 class="font-cinzel text-base font-bold text-[#f3ebd8]">
                                {{ fix.title }}
                              </h4>
                              <p class="text-xs sm:text-sm text-[#b8ae99] leading-relaxed">
                                {{ fix.description }}
                              </p>
                            </div>
                          }
                        </div>
                      </div>
                    }

                    @if (rel.changes.length === 0) {
                      <p class="text-xs text-[#8b7d6b] italic">
                        Aucune note ajoutée à cette version pour le moment. Ouvrez « Gérer les Notes » pour y ajouter des fonctionnalités ou correctifs.
                      </p>
                    }
                  </div>
                </article>
              }
            }
          </div>
        </div>
      }
    </section>
  `,
})
export class PatchNotesView implements OnInit {
  readonly patchNotes = inject(PatchNotesService);
  private readonly sound = inject(SoundService);

  readonly navigateTo = output<ChangelogTargetView>();

  readonly selectedVersion = signal<string>(this.patchNotes.latestVersion());
  readonly selectedCategory = signal<'all' | ChangelogCategory>('all');
  readonly searchQuery = signal<string>('');
  readonly viewMode = signal<'summary' | 'release' | 'feed'>('summary');
  readonly showDevManager = signal<boolean>(false);
  readonly devFeedback = signal<{ ok: boolean; message: string } | null>(null);

  readonly categoryFilters: CategoryFilterOption[] = [
    { id: 'all', label: 'Toutes', icon: 'apps' },
    { id: 'feature', label: 'Nouveautés', icon: 'auto_awesome' },
    { id: 'bugfix', label: 'Correctifs', icon: 'bug_report' },
    { id: 'combat', label: 'Combat', icon: 'swords' },
    { id: 'economy', label: 'Économie & Troc', icon: 'savings' },
    { id: 'security', label: 'Sécurité', icon: 'verified_user' },
    { id: 'ui', label: 'Interface', icon: 'palette' },
  ];

  readonly addEntryForm = new FormGroup({
    version: new FormControl<string>(this.patchNotes.latestVersion(), { nonNullable: true, validators: [Validators.required] }),
    kind: new FormControl<PatchEntryKind>('feature', { nonNullable: true }),
    category: new FormControl<ChangelogCategory>('feature', { nonNullable: true }),
    title: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
  });

  readonly publishReleaseForm = new FormGroup({
    version: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    title: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    subtitle: new FormControl<string>('', { nonNullable: true }),
    summary: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    isMajor: new FormControl<boolean>(false, { nonNullable: true }),
  });

  readonly filteredRecentFeatures = computed<PatchFeedEntry[]>(() => {
    return this.filterFeedEntries(this.patchNotes.recentFeatures());
  });

  readonly filteredRecentBugFixes = computed<PatchFeedEntry[]>(() => {
    return this.filterFeedEntries(this.patchNotes.recentBugFixes());
  });

  readonly totalMatchingChanges = computed(() => {
    return this.patchNotes.releases().reduce((acc, rel) => acc + this.getFilteredChanges(rel).length, 0);
  });

  readonly displayedReleases = computed<ChangelogRelease[]>(() => {
    const releases = this.patchNotes.releases();
    if (this.viewMode() === 'feed') {
      return releases.filter(rel => this.getFilteredChanges(rel).length > 0 || rel.changes.length === 0);
    }
    const target = releases.find(r => r.version === this.selectedVersion()) ?? releases[0];
    if (!target) return [];
    if (target.changes.length === 0 && this.selectedCategory() === 'all' && !this.searchQuery().trim()) {
      return [target];
    }
    return this.getFilteredChanges(target).length > 0 ? [target] : [];
  });

  ngOnInit() {
    this.patchNotes.markVersionRead(this.selectedVersion());
  }

  private filterFeedEntries(entries: PatchFeedEntry[]): PatchFeedEntry[] {
    const cat = this.selectedCategory();
    const q = this.searchQuery().trim().toLowerCase();

    return entries.filter(item => {
      const catMatch = cat === 'all' || item.category === cat;
      if (!catMatch) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.releaseTitle.toLowerCase().includes(q) ||
        item.releaseVersion.toLowerCase().includes(q)
      );
    });
  }

  getFilteredChanges(release: ChangelogRelease): ChangelogChangeItem[] {
    const cat = this.selectedCategory();
    const q = this.searchQuery().trim().toLowerCase();

    return release.changes.filter(item => {
      const catMatch = cat === 'all' || item.category === cat;
      if (!catMatch) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        release.title.toLowerCase().includes(q) ||
        release.version.toLowerCase().includes(q)
      );
    });
  }

  getFeatureChanges(release: ChangelogRelease): ChangelogChangeItem[] {
    return this.getFilteredChanges(release).filter(c => c.kind === 'feature');
  }

  getBugFixChanges(release: ChangelogRelease): ChangelogChangeItem[] {
    return this.getFilteredChanges(release).filter(c => c.kind === 'bugfix');
  }

  selectRelease(version: string) {
    this.selectedVersion.set(version);
    this.viewMode.set('release');
    this.patchNotes.markVersionRead(version);
    this.sound.playClick('parchment');
  }

  inspectRelease(version: string) {
    this.selectRelease(version);
  }

  selectCategory(cat: 'all' | ChangelogCategory) {
    this.selectedCategory.set(cat);
    this.sound.playClick('default');
  }

  setViewMode(mode: 'summary' | 'release' | 'feed') {
    this.viewMode.set(mode);
    this.sound.playClick('parchment');
  }

  toggleDevManager() {
    this.showDevManager.update(v => !v);
    this.sound.playClick('parchment');
  }

  onSearchInput(value: string) {
    this.searchQuery.set(value);
  }

  clearSearch() {
    this.searchQuery.set('');
    this.sound.playClick('default');
  }

  resetFilters() {
    this.selectedCategory.set('all');
    this.searchQuery.set('');
    this.sound.playClick('default');
  }

  markSingleRead(version: string) {
    this.patchNotes.markVersionRead(version);
    this.sound.playClick('gold');
  }

  markAllRead() {
    this.patchNotes.markAllRead();
  }

  openTargetView(targetView: ChangelogTargetView, version: string) {
    this.patchNotes.markVersionRead(version);
    this.sound.playClick('gold');
    this.navigateTo.emit(targetView);
  }

  submitPatchEntry() {
    if (this.addEntryForm.invalid) {
      this.devFeedback.set({ ok: false, message: 'Veuillez remplir le titre et la description de la note.' });
      return;
    }

    const raw = this.addEntryForm.getRawValue();
    const res = this.patchNotes.addNoteEntry(raw.version, {
      kind: raw.kind,
      category: raw.kind === 'bugfix' ? 'bugfix' : raw.category,
      title: raw.title,
      description: raw.description,
    });

    if (!res.ok) {
      this.devFeedback.set({ ok: false, message: res.error ?? 'Impossible d’ajouter cette note.' });
      return;
    }

    this.addEntryForm.patchValue({ title: '', description: '' });
    this.selectedVersion.set(raw.version);
    this.devFeedback.set({ ok: true, message: `Note ajoutée avec succès à la version ${raw.version}.` });
  }

  submitNewRelease() {
    if (this.publishReleaseForm.invalid) {
      this.devFeedback.set({ ok: false, message: 'Veuillez renseigner un numéro de version, un titre et un résumé.' });
      return;
    }

    const raw = this.publishReleaseForm.getRawValue();
    const res = this.patchNotes.publishRelease({
      version: raw.version,
      title: raw.title,
      subtitle: raw.subtitle,
      summary: raw.summary,
      isMajor: raw.isMajor,
    });

    if (!res.ok || !res.release) {
      this.devFeedback.set({ ok: false, message: res.error ?? 'Impossible de publier cette version.' });
      return;
    }

    this.publishReleaseForm.reset({
      version: '',
      title: '',
      subtitle: '',
      summary: '',
      isMajor: false,
    });
    this.addEntryForm.patchValue({ version: res.release.version });
    this.selectedVersion.set(res.release.version);
    this.viewMode.set('release');
    this.devFeedback.set({ ok: true, message: `Version ${res.release.version} publiée ! Vous pouvez maintenant y ajouter des fonctionnalités et correctifs.` });
  }

  removeEntry(version: string, entryId: string) {
    this.patchNotes.removeNoteEntry(version, entryId);
    this.devFeedback.set({ ok: true, message: 'Note supprimée du journal.' });
  }

  resetDefaults() {
    this.patchNotes.resetDefaultPatchNotes();
    const latest = this.patchNotes.latestVersion();
    this.selectedVersion.set(latest);
    this.addEntryForm.patchValue({ version: latest });
    this.devFeedback.set({ ok: true, message: 'Catalogue des notes de patch restauré aux valeurs initiales.' });
  }

  getCategoryIcon(category: ChangelogCategory): string {
    switch (category) {
      case 'feature':
        return 'auto_awesome';
      case 'bugfix':
        return 'bug_report';
      case 'combat':
        return 'swords';
      case 'economy':
        return 'savings';
      case 'security':
        return 'verified_user';
      case 'ui':
        return 'palette';
    }
  }

  getCategoryLabel(category: ChangelogCategory): string {
    switch (category) {
      case 'feature':
        return 'Nouveauté Majeure';
      case 'bugfix':
        return 'Correctif (Bug Fix)';
      case 'combat':
        return 'Système de Combat';
      case 'economy':
        return 'Économie & Récompenses';
      case 'security':
        return 'Sécurité & Équité';
      case 'ui':
        return 'Visuels & Interface';
    }
  }

  getCategoryTextColor(category: ChangelogCategory): string {
    switch (category) {
      case 'feature':
        return 'text-[#ffd700]';
      case 'bugfix':
        return 'text-emerald-400';
      case 'combat':
        return 'text-[#ff7b7b]';
      case 'economy':
        return 'text-emerald-400';
      case 'security':
        return 'text-sky-400';
      case 'ui':
        return 'text-purple-300';
    }
  }
}
