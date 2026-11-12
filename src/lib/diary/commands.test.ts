import { describe, expect, it } from 'vitest';
import {
  addAchievement,
  canAdd,
  removeAchievement,
} from './commands';
import { DayKey } from './parse';
import { emptyDocument } from './presets';
import { dayGroups, monthCounts } from './projections';
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
