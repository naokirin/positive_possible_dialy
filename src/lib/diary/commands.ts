import { buildAchievementBody, DayKey, parseNonEmptyText } from './parse';
import type {
  Achievement,
  AchievementId,
  AchievementView,
  AddInput,
  CategoryId,
  DiaryDocument,
  ItemId,
} from './types';
import { toAchievementView } from './projections';

function newId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function canAdd(
  doc: DiaryDocument,
  input: Pick<AddInput, 'text' | 'itemIds'>,
): boolean {
  const body = buildAchievementBody(input);
  if (!body) return false;
  if (body.kind === 'text') return true;
  const known = new Set(doc.items.map((i) => i.id));
  return body.itemIds.every((id) => known.has(id));
}

export type AddResult =
  | { readonly ok: true; readonly doc: DiaryDocument; readonly view: AchievementView }
  | { readonly ok: false };

export function addAchievement(
  doc: DiaryDocument,
  input: AddInput,
  now = Date.now(),
  today = DayKey.today(),
): AddResult {
  if (!canAdd(doc, input)) return { ok: false };
  const body = buildAchievementBody(input);
  if (!body) return { ok: false };
  const day = input.date ?? today;
  const achievement: Achievement = {
    id: newId('ach') as AchievementId,
    day,
    body,
    createdAt: now,
  };
  const next: DiaryDocument = {
    ...doc,
    achievements: [...doc.achievements, achievement],
  };
  return { ok: true, doc: next, view: toAchievementView(next, achievement) };
}

export type UpdateResult =
  | { readonly ok: true; readonly doc: DiaryDocument; readonly view: AchievementView }
  | { readonly ok: false };

export function updateAchievement(
  doc: DiaryDocument,
  id: AchievementId,
  patch: AddInput,
): UpdateResult {
  const index = doc.achievements.findIndex((a) => a.id === id);
  if (index < 0) return { ok: false };

  const current = doc.achievements[index]!;
  const nextText =
    patch.text !== undefined
      ? patch.text
      : current.body.kind === 'items'
        ? undefined
        : current.body.text;
  const nextItemIds =
    patch.itemIds !== undefined
      ? patch.itemIds
      : current.body.kind === 'text'
        ? undefined
        : current.body.itemIds;

  if (!canAdd(doc, { text: nextText, itemIds: nextItemIds })) {
    return { ok: false };
  }
  const body = buildAchievementBody({ text: nextText, itemIds: nextItemIds });
  if (!body) return { ok: false };

  const updated: Achievement = {
    ...current,
    day: patch.date ?? current.day,
    body,
  };
  const achievements = doc.achievements.slice();
  achievements[index] = updated;
  const next: DiaryDocument = { ...doc, achievements };
  return { ok: true, doc: next, view: toAchievementView(next, updated) };
}

export function removeAchievement(
  doc: DiaryDocument,
  id: AchievementId,
): DiaryDocument {
  if (!doc.achievements.some((a) => a.id === id)) return doc;
  return {
    ...doc,
    achievements: doc.achievements.filter((a) => a.id !== id),
  };
}

export type CatalogAddResult =
  | { readonly ok: true; readonly doc: DiaryDocument; readonly id: CategoryId }
  | { readonly ok: false };

export function addCategory(
  doc: DiaryDocument,
  name: string,
): CatalogAddResult {
  const parsed = parseNonEmptyText(name);
  if (!parsed) return { ok: false };
  const id = newId('cat') as CategoryId;
  return {
    ok: true,
    id,
    doc: {
      ...doc,
      categories: [
        ...doc.categories,
        { id, name: parsed, origin: 'user', archived: false },
      ],
    },
  };
}

export type ItemAddResult =
  | { readonly ok: true; readonly doc: DiaryDocument; readonly id: ItemId }
  | { readonly ok: false };

export function addItem(
  doc: DiaryDocument,
  categoryId: CategoryId,
  name: string,
): ItemAddResult {
  const parsed = parseNonEmptyText(name);
  if (!parsed) return { ok: false };
  if (!doc.categories.some((c) => c.id === categoryId && !c.archived)) {
    return { ok: false };
  }
  const id = newId('item') as ItemId;
  return {
    ok: true,
    id,
    doc: {
      ...doc,
      items: [
        ...doc.items,
        {
          id,
          categoryId,
          name: parsed,
          origin: 'user',
          archived: false,
        },
      ],
    },
  };
}

export function archiveCategory(
  doc: DiaryDocument,
  id: CategoryId,
): DiaryDocument {
  const categories = doc.categories.map((c) =>
    c.id === id ? { ...c, archived: true } : c,
  );
  const items = doc.items.map((i) =>
    i.categoryId === id ? { ...i, archived: true } : i,
  );
  return { ...doc, categories, items };
}

export function archiveItem(doc: DiaryDocument, id: ItemId): DiaryDocument {
  return {
    ...doc,
    items: doc.items.map((i) =>
      i.id === id ? { ...i, archived: true } : i,
    ),
  };
}
