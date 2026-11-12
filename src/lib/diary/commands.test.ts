import { describe, expect, it } from 'vitest';
import {
  addAchievement,
  archiveCategory,
  archiveItem,
  canAdd,
  removeAchievement,
  unarchiveCategory,
  unarchiveItem,
} from './commands';
import { DayKey } from './parse';
import { emptyDocument } from './presets';
import { catalogView, dayGroups, monthCounts } from './projections';
import { YearMonth } from './parse';
import { deserializeDocument, serializeDocument } from './wire';
import type { DiaryDocument } from './types';

describe('addAchievement', () => {
  it('rejects empty add', () => {
    const doc = emptyDocument();
    expect(canAdd(doc, {})).toBe(false);
    expect(canAdd(doc, { text: '   ' })).toBe(false);
    expect(canAdd(doc, { itemIds: [] })).toBe(false);
    expect(addAchievement(doc, { text: '' }).ok).toBe(false);
  });

  it('appends a text achievement under its day', () => {
    const doc = emptyDocument();
    const day = DayKey.parse('2026-11-10');
    const result = addAchievement(doc, { date: day, text: '朝ごはんを作った' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const groups = dayGroups(result.doc);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.day).toBe(day);
    expect(groups[0]?.count).toBe(1);
    expect(groups[0]?.entries[0]?.displayLine).toBe('朝ごはんを作った');
  });
});

describe('monthCounts', () => {
  it('counts achievements per day in the month', () => {
    let doc = emptyDocument();
    const a = addAchievement(doc, {
      date: DayKey.parse('2026-11-10'),
      text: 'one',
    });
    expect(a.ok).toBe(true);
    if (!a.ok) return;
    doc = a.doc;
    const b = addAchievement(doc, {
      date: DayKey.parse('2026-11-10'),
      text: 'two',
    });
    expect(b.ok).toBe(true);
    if (!b.ok) return;
    doc = b.doc;
    const c = addAchievement(doc, {
      date: DayKey.parse('2026-11-11'),
      text: 'three',
    });
    expect(c.ok).toBe(true);
    if (!c.ok) return;
    doc = c.doc;

    const cells = monthCounts(doc, YearMonth.parse(2026, 11));
    const dayCells = cells.filter((cell) => cell.kind === 'day');
    const tenth = dayCells.find((cell) => cell.dayOfMonth === 10);
    const eleventh = dayCells.find((cell) => cell.dayOfMonth === 11);
    expect(tenth?.kind === 'day' && tenth.count).toBe(2);
    expect(eleventh?.kind === 'day' && eleventh.count).toBe(1);
  });
});

describe('import replace', () => {
  it('replace-only import leaves the previous doc untouched on failure', () => {
    const original = emptyDocument();
    const added = addAchievement(original, {
      date: DayKey.parse('2026-11-12'),
      text: '残したい記録',
    });
    expect(added.ok).toBe(true);
    if (!added.ok) return;
    const current = added.doc;

    const failed = deserializeDocument('{not-json');
    expect(failed.ok).toBe(false);
    expect(current.achievements).toHaveLength(1);

    const bundle = serializeDocument(emptyDocument());
    const ok = deserializeDocument(bundle);
    expect(ok.ok).toBe(true);
    if (!ok.ok) return;
    expect(ok.doc.achievements).toHaveLength(0);
    expect(current.achievements).toHaveLength(1);
  });

  it('accepts a valid exported bundle', () => {
    let doc: DiaryDocument = emptyDocument();
    const itemId = doc.items[0]?.id;
    expect(itemId).toBeTruthy();
    if (!itemId) return;
    const added = addAchievement(doc, {
      date: DayKey.parse('2026-11-01'),
      itemIds: [itemId],
    });
    expect(added.ok).toBe(true);
    if (!added.ok) return;
    doc = added.doc;
    const raw = serializeDocument(doc);
    const result = deserializeDocument(raw);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.importedCount).toBe(1);
    expect(result.doc.achievements[0]?.id).toBe(doc.achievements[0]?.id);
  });
});

describe('removeAchievement', () => {
  it('is idempotent', () => {
    const base = emptyDocument();
    const added = addAchievement(base, { text: 'x', date: DayKey.parse('2026-01-01') });
    expect(added.ok).toBe(true);
    if (!added.ok) return;
    const id = added.view.id;
    const once = removeAchievement(added.doc, id);
    const twice = removeAchievement(once, id);
    expect(once.achievements).toHaveLength(0);
    expect(twice.achievements).toHaveLength(0);
  });
});

describe('archive catalog', () => {
  it('moves archived categories out of activeCategories', () => {
    const base = emptyDocument();
    const cat = base.categories[0];
    expect(cat).toBeTruthy();
    if (!cat) return;

    const archived = archiveCategory(base, cat.id);
    const view = catalogView(archived);
    expect(view.activeCategories.some((c) => c.id === cat.id)).toBe(false);
    expect(view.archivedCategories.some((c) => c.id === cat.id && c.archived)).toBe(
      true,
    );
    const archivedItemIds = new Set(
      archived.items.filter((i) => i.categoryId === cat.id).map((i) => i.id),
    );
    expect(view.activeItems.every((i) => !archivedItemIds.has(i.id))).toBe(true);
  });

  it('moves a single archived item into archivedCategories under its parent', () => {
    const base = emptyDocument();
    const item = base.items[0];
    expect(item).toBeTruthy();
    if (!item) return;

    const archived = archiveItem(base, item.id);
    const view = catalogView(archived);
    const activeParent = view.activeCategories.find((c) => c.id === item.categoryId);
    expect(activeParent?.items.some((i) => i.id === item.id)).toBe(false);
    const archivedParent = view.archivedCategories.find(
      (c) => c.id === item.categoryId && !c.archived,
    );
    expect(archivedParent?.items.some((i) => i.id === item.id)).toBe(true);
  });

  it('restores a category and all of its items', () => {
    const base = emptyDocument();
    const cat = base.categories[0];
    expect(cat).toBeTruthy();
    if (!cat) return;

    const archived = archiveCategory(base, cat.id);
    const restored = unarchiveCategory(archived, cat.id);
    const view = catalogView(restored);
    expect(view.activeCategories.some((c) => c.id === cat.id)).toBe(true);
    expect(view.archivedCategories.some((c) => c.id === cat.id)).toBe(false);
    expect(
      restored.items
        .filter((i) => i.categoryId === cat.id)
        .every((i) => !i.archived),
    ).toBe(true);
  });

  it('restores an item and reopens its archived parent category', () => {
    const base = emptyDocument();
    const item = base.items[0];
    expect(item).toBeTruthy();
    if (!item) return;

    const archivedCat = archiveCategory(base, item.categoryId);
    const restored = unarchiveItem(archivedCat, item.id);
    expect(restored.items.find((i) => i.id === item.id)?.archived).toBe(false);
    expect(
      restored.categories.find((c) => c.id === item.categoryId)?.archived,
    ).toBe(false);
  });

  it('keeps sibling items archived when one item is restored from an archived category', () => {
    const base = emptyDocument();
    const cat = base.categories[0];
    expect(cat).toBeTruthy();
    if (!cat) return;
    const siblings = base.items.filter((i) => i.categoryId === cat.id);
    expect(siblings.length).toBeGreaterThan(1);
    const [first, second] = siblings;
    expect(first && second).toBeTruthy();
    if (!first || !second) return;

    const archived = archiveCategory(base, cat.id);
    const restored = unarchiveItem(archived, first.id);
    expect(restored.items.find((i) => i.id === first.id)?.archived).toBe(false);
    expect(restored.items.find((i) => i.id === second.id)?.archived).toBe(true);
    const view = catalogView(restored);
    expect(view.activeItems.some((i) => i.id === first.id)).toBe(true);
    expect(view.activeItems.some((i) => i.id === second.id)).toBe(false);
    expect(
      view.archivedCategories.some(
        (c) => c.id === cat.id && c.items.some((i) => i.id === second.id),
      ),
    ).toBe(true);
  });

  it('round-trips archived catalog through serialize/deserialize', () => {
    const base = emptyDocument();
    const cat = base.categories[0];
    const item = base.items.find((i) => i.categoryId !== cat?.id);
    expect(cat && item).toBeTruthy();
    if (!cat || !item) return;

    const archived = archiveItem(archiveCategory(base, cat.id), item.id);
    const raw = serializeDocument(archived);
    const loaded = deserializeDocument(raw);
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const view = catalogView(loaded.doc);
    expect(view.activeCategories.some((c) => c.id === cat.id)).toBe(false);
    expect(view.archivedCategories.some((c) => c.id === cat.id)).toBe(true);
    expect(view.activeItems.some((i) => i.id === item.id)).toBe(false);
  });
});
