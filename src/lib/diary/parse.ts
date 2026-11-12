import type {
  Achievement,
  AchievementBody,
  AchievementId,
  Category,
  CategoryId,
  CategoryItem,
  DayKey as DayKeyBrand,
  DiaryDocument,
  ItemId,
  NonEmptyText,
  YearMonth as YearMonthBrand,
} from './types';

const DAY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function isNonEmptyText(value: string): value is NonEmptyText {
  return value.trim().length > 0;
}

export function parseNonEmptyText(value: string): NonEmptyText | null {
  const trimmed = value.trim();
  if (!isNonEmptyText(trimmed)) return null;
  return trimmed;
}

export function isDayKey(value: string): value is DayKeyBrand {
  const m = DAY_RE.exec(value);
  if (!m) return false;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return false;
  const dt = new Date(y, mo - 1, d);
  return (
    dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d
  );
}

export const DayKey = {
  parse(value: string): DayKeyBrand {
    if (!isDayKey(value)) {
      throw new Error(`invalid DayKey: ${value}`);
    }
    return value;
  },
  tryParse(value: string): DayKeyBrand | null {
    return isDayKey(value) ? value : null;
  },
  today(now = new Date()): DayKeyBrand {
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const d = now.getDate();
    return DayKey.parse(`${y}-${pad2(m)}-${pad2(d)}`);
  },
  fromParts(y: number, m: number, d: number): DayKeyBrand {
    return DayKey.parse(`${y}-${pad2(m)}-${pad2(d)}`);
  },
};

export function isYearMonth(value: {
  y: number;
  m: number;
}): value is YearMonthBrand {
  return (
    Number.isInteger(value.y) &&
    Number.isInteger(value.m) &&
    value.m >= 1 &&
    value.m <= 12
  );
}

export const YearMonth = {
  parse(y: number, m: number): YearMonthBrand {
    const value = { y, m };
    if (!isYearMonth(value)) {
      throw new Error(`invalid YearMonth: ${y}-${m}`);
    }
    return value;
  },
  fromDay(day: DayKeyBrand): YearMonthBrand {
    const y = Number(day.slice(0, 4));
    const m = Number(day.slice(5, 7));
    return YearMonth.parse(y, m);
  },
  label(ym: YearMonthBrand): string {
    return `${ym.y}年${ym.m}月`;
  },
  addMonths(ym: YearMonthBrand, delta: number): YearMonthBrand {
    const idx = ym.y * 12 + (ym.m - 1) + delta;
    const y = Math.floor(idx / 12);
    const m = (idx % 12) + 1;
    return YearMonth.parse(y, m);
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isIdBrand(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function parseAchievementBody(raw: unknown): AchievementBody | null {
  if (!isRecord(raw) || typeof raw.kind !== 'string') return null;
  if (raw.kind === 'text') {
    if (typeof raw.text !== 'string') return null;
    const text = parseNonEmptyText(raw.text);
    if (!text) return null;
    return { kind: 'text', text };
  }
  if (raw.kind === 'items') {
    if (!Array.isArray(raw.itemIds) || raw.itemIds.length === 0) return null;
    if (!raw.itemIds.every(isIdBrand)) return null;
    const itemIds = raw.itemIds as [ItemId, ...ItemId[]];
    return { kind: 'items', itemIds };
  }
  if (raw.kind === 'both') {
    if (typeof raw.text !== 'string') return null;
    const text = parseNonEmptyText(raw.text);
    if (!text) return null;
    if (!Array.isArray(raw.itemIds) || raw.itemIds.length === 0) return null;
    if (!raw.itemIds.every(isIdBrand)) return null;
    const itemIds = raw.itemIds as [ItemId, ...ItemId[]];
    return { kind: 'both', text, itemIds };
  }
  return null;
}

function parseAchievement(raw: unknown): Achievement | null {
  if (!isRecord(raw)) return null;
  if (!isIdBrand(raw.id)) return null;
  if (typeof raw.day !== 'string' || !isDayKey(raw.day)) return null;
  if (typeof raw.createdAt !== 'number' || !Number.isFinite(raw.createdAt)) {
    return null;
  }
  const body = parseAchievementBody(raw.body);
  if (!body) return null;
  return {
    id: raw.id as AchievementId,
    day: raw.day,
    body,
    createdAt: raw.createdAt,
  };
}

function parseCategory(raw: unknown): Category | null {
  if (!isRecord(raw)) return null;
  if (!isIdBrand(raw.id)) return null;
  if (typeof raw.name !== 'string') return null;
  const name = parseNonEmptyText(raw.name);
  if (!name) return null;
  if (raw.origin !== 'preset' && raw.origin !== 'user') return null;
  if (typeof raw.archived !== 'boolean') return null;
  return {
    id: raw.id as CategoryId,
    name,
    origin: raw.origin,
    archived: raw.archived,
  };
}

function parseItem(raw: unknown): CategoryItem | null {
  if (!isRecord(raw)) return null;
  if (!isIdBrand(raw.id)) return null;
  if (!isIdBrand(raw.categoryId)) return null;
  if (typeof raw.name !== 'string') return null;
  const name = parseNonEmptyText(raw.name);
  if (!name) return null;
  if (raw.origin !== 'preset' && raw.origin !== 'user') return null;
  if (typeof raw.archived !== 'boolean') return null;
  return {
    id: raw.id as ItemId,
    categoryId: raw.categoryId as CategoryId,
    name,
    origin: raw.origin,
    archived: raw.archived,
  };
}

export function parseDiaryDocument(raw: unknown): DiaryDocument | null {
  if (!isRecord(raw)) return null;
  if (raw.schemaVersion !== 1) return null;
  if (!Array.isArray(raw.categories)) return null;
  if (!Array.isArray(raw.items)) return null;
  if (!Array.isArray(raw.achievements)) return null;

  const categories: Category[] = [];
  for (const entry of raw.categories) {
    const cat = parseCategory(entry);
    if (!cat) return null;
    categories.push(cat);
  }

  const items: CategoryItem[] = [];
  for (const entry of raw.items) {
    const item = parseItem(entry);
    if (!item) return null;
    items.push(item);
  }

  const achievements: Achievement[] = [];
  for (const entry of raw.achievements) {
    const ach = parseAchievement(entry);
    if (!ach) return null;
    achievements.push(ach);
  }

  const categoryIds = new Set(categories.map((c) => c.id));
  for (const item of items) {
    if (!categoryIds.has(item.categoryId)) return null;
  }

  const itemIds = new Set(items.map((i) => i.id));
  for (const ach of achievements) {
    if (ach.body.kind === 'text') continue;
    for (const id of ach.body.itemIds) {
      if (!itemIds.has(id)) return null;
    }
  }

  return {
    schemaVersion: 1,
    categories,
    items,
    achievements,
  };
}

export function buildAchievementBody(input: {
  text?: string;
  itemIds?: readonly ItemId[];
}): AchievementBody | null {
  const text =
    typeof input.text === 'string' ? parseNonEmptyText(input.text) : null;
  const rawIds = input.itemIds ?? [];
  const unique: ItemId[] = [];
  const seen = new Set<string>();
  for (const id of rawIds) {
    if (seen.has(id)) continue;
    seen.add(id);
    unique.push(id);
  }
  const hasItems = unique.length > 0;
  if (text && hasItems) {
    return {
      kind: 'both',
      text,
      itemIds: unique as [ItemId, ...ItemId[]],
    };
  }
  if (text) return { kind: 'text', text };
  if (hasItems) {
    return {
      kind: 'items',
      itemIds: unique as [ItemId, ...ItemId[]],
    };
  }
  return null;
}
