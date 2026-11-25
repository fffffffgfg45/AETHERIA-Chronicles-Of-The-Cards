import { Injectable, computed, inject, signal } from '@angular/core';
import {
  CHANGELOG_RELEASES,
  ChangelogCategory,
  ChangelogChangeItem,
  ChangelogRelease,
  ChangelogTargetView,
  PatchEntryKind,
} from '../data/changelog-data';
import { SoundService } from './sound';

export interface PatchFeedEntry extends ChangelogChangeItem {
  releaseVersion: string;
  releaseDate: string;
  releaseTitle: string;
}

export interface CreatePatchReleaseInput {
  version: string;
  title: string;
  subtitle: string;
  summary: string;
  isMajor: boolean;
  date?: string;
}

export interface CreatePatchEntryInput {
  kind: PatchEntryKind;
  category: ChangelogCategory;
  title: string;
  description: string;
  targetView?: ChangelogTargetView;
  actionLabel?: string;
}

const PATCH_NOTES_STORAGE_KEY = 'aetheria_dev_patch_notes_v1';
const PATCH_READ_STORAGE_KEY = 'aetheria_patch_notes_read_v1';
const DEFAULT_READ_VERSIONS = ['2.2', '2.3', '2.4', '2.5'];

@Injectable({
  providedIn: 'root',
})
export class PatchNotesService {
  private readonly sound = inject(SoundService);

  readonly releases = signal<ChangelogRelease[]>(this.loadStoredReleases());
  readonly readVersions = signal<string[]>(this.loadStoredReadVersions());

  readonly latestVersion = computed(() => this.releases()[0]?.version ?? '2.7');

  readonly unreadCount = computed(() => {
    const readSet = new Set(this.readVersions());
    return this.releases().filter(r => !readSet.has(r.version)).length;
  });

  readonly recentFeatures = computed<PatchFeedEntry[]>(() => {
    const items: PatchFeedEntry[] = [];
    for (const rel of this.releases()) {
      for (const change of rel.changes) {
        if (change.kind === 'feature') {
          items.push({
            ...change,
            releaseVersion: rel.version,
            releaseDate: rel.date,
            releaseTitle: rel.title,
          });
        }
      }
    }
    return items;
  });

  readonly recentBugFixes = computed<PatchFeedEntry[]>(() => {
    const items: PatchFeedEntry[] = [];
    for (const rel of this.releases()) {
      for (const change of rel.changes) {
        if (change.kind === 'bugfix') {
          items.push({
            ...change,
            releaseVersion: rel.version,
            releaseDate: rel.date,
            releaseTitle: rel.title,
          });
        }
      }
    }
    return items;
  });

  readonly totalFeaturesCount = computed(() => this.recentFeatures().length);
  readonly totalBugFixesCount = computed(() => this.recentBugFixes().length);

  isVersionRead(version: string): boolean {
    return this.readVersions().includes(version);
  }

  markVersionRead(version: string) {
    if (this.readVersions().includes(version)) return;
    this.readVersions.update(list => [...list, version]);
    this.persistReadVersions();
  }

  markAllRead() {
    const allVersions = this.releases().map(r => r.version);
    this.readVersions.set(allVersions);
    this.persistReadVersions();
    this.sound.playClick('gold');
  }

  publishRelease(input: CreatePatchReleaseInput): { ok: boolean; error?: string; release?: ChangelogRelease } {
    const version = input.version.trim();
    const title = input.title.trim();
    const subtitle = input.subtitle.trim();
    const summary = input.summary.trim();

    if (!version || !title || !summary) {
      return { ok: false, error: 'Veuillez renseigner le numéro de version, le titre et le résumé.' };
    }

    const exists = this.releases().some(r => r.version.toLowerCase() === version.toLowerCase());
    if (exists) {
      return { ok: false, error: `La version ${version} existe déjà dans le journal.` };
    }

    const dateLabel =
      input.date?.trim() ||
      new Date().toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });

    const newRelease: ChangelogRelease = {
      version,
      date: dateLabel,
      title,
      subtitle: subtitle || 'Notes de mise à jour développeur',
      summary,
      isMajor: input.isMajor,
      changes: [],
    };

    this.releases.update(list => [newRelease, ...list]);
    this.persistReleases();
    this.sound.playClick('gold');
    return { ok: true, release: newRelease };
  }

  addNoteEntry(version: string, entry: CreatePatchEntryInput): { ok: boolean; error?: string } {
    const title = entry.title.trim();
    const description = entry.description.trim();

    if (!title || !description) {
      return { ok: false, error: 'Le titre et la description de la note sont obligatoires.' };
    }

    let found = false;
    const newItem: ChangelogChangeItem = {
      id: `${entry.kind}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      kind: entry.kind,
      category: entry.kind === 'bugfix' ? 'bugfix' : entry.category,
      title,
      description,
      targetView: entry.targetView,
      actionLabel: entry.actionLabel,
    };

    this.releases.update(list =>
      list.map(rel => {
        if (rel.version !== version) return rel;
        found = true;
        return {
          ...rel,
          changes: [newItem, ...rel.changes],
        };
      }),
    );

    if (!found) {
      return { ok: false, error: `Version ${version} introuvable.` };
    }

    // Mark version unread again so players notice new patch additions
    this.readVersions.update(list => list.filter(v => v !== version));
    this.persistReleases();
    this.persistReadVersions();
    this.sound.playClick('gold');
    return { ok: true };
  }

  removeNoteEntry(version: string, entryId: string): boolean {
    let removed = false;
    this.releases.update(list =>
      list.map(rel => {
        if (rel.version !== version) return rel;
        const filtered = rel.changes.filter(c => c.id !== entryId);
        if (filtered.length !== rel.changes.length) {
          removed = true;
        }
        return { ...rel, changes: filtered };
      }),
    );

    if (removed) {
      this.persistReleases();
      this.sound.playClick('crimson');
    }
    return removed;
  }

  resetDefaultPatchNotes() {
    this.releases.set(this.cloneDefaultReleases());
    this.readVersions.set([...DEFAULT_READ_VERSIONS]);
    this.persistReleases();
    this.persistReadVersions();
    this.sound.playClick('parchment');
  }

  private cloneDefaultReleases(): ChangelogRelease[] {
    return CHANGELOG_RELEASES.map(rel => ({
      ...rel,
      changes: rel.changes.map(c => ({ ...c })),
    }));
  }

  private loadStoredReleases(): ChangelogRelease[] {
    if (typeof window === 'undefined') {
      return this.cloneDefaultReleases();
    }
    try {
      const raw = localStorage.getItem(PATCH_NOTES_STORAGE_KEY);
      if (!raw) return this.cloneDefaultReleases();
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return this.cloneDefaultReleases();
      }
      // Merge ensuring every item has a valid kind field
      return parsed.map((rel: ChangelogRelease) => ({
        ...rel,
        changes: Array.isArray(rel.changes)
          ? rel.changes.map((c: ChangelogChangeItem) => ({
              ...c,
              kind: c.kind ?? (c.category === 'bugfix' ? 'bugfix' : 'feature'),
            }))
          : [],
      }));
    } catch {
      return this.cloneDefaultReleases();
    }
  }

  private loadStoredReadVersions(): string[] {
    if (typeof window === 'undefined') {
      return [...DEFAULT_READ_VERSIONS];
    }
    try {
      const raw = localStorage.getItem(PATCH_READ_STORAGE_KEY);
      if (!raw) return [...DEFAULT_READ_VERSIONS];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [...DEFAULT_READ_VERSIONS];
    } catch {
      return [...DEFAULT_READ_VERSIONS];
    }
  }

  private persistReleases() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(PATCH_NOTES_STORAGE_KEY, JSON.stringify(this.releases()));
    } catch {
      // Ignore quota errors cleanly
    }
  }

  private persistReadVersions() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(PATCH_READ_STORAGE_KEY, JSON.stringify(this.readVersions()));
    } catch {
      // Ignore quota errors cleanly
    }
  }
}
