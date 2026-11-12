import { DayKey, YearMonth } from './parse';
import type {
  Achievement,
  AchievementView,
  CatalogView,
  CategoryView,
  DayGroup,
  DayKey as DayKeyType,
  DiaryDocument,
  ItemId,
  ItemView,
  MonthCell,
  YearMonth as YearMonthType,
} from './types';

function itemLabelMap(doc: DiaryDocument): Map<ItemId, string> {
  const map = new Map<ItemId, string>();
  for (const item of doc.items) {
    map.set(item.id, item.name);
  }
  return map;
}

function labelsFor(
  body: Achievement['body'],
  labels: Map<ItemId, string>,
): string[] {
  if (body.kind === 'text') return [];
  return body.itemIds.map((id) => labels.get(id) ?? '（不明な項目）');
}

function displayLineFor(
  body: Achievement['body'],
  itemLabels: readonly string[],
): string {
  if (body.kind === 'text') return body.text;
  if (body.kind === 'items') return itemLabels.join('・');
  return `${body.text}（${itemLabels.join('・')}）`;
}

export function toAchievementView(
  doc: DiaryDocument,
  achievement: Achievement,
): AchievementView {
  const labels = itemLabelMap(doc);
  const itemLabels = labelsFor(achievement.body, labels);
  return {
    id: achievement.id,
    day: achievement.day,
    itemLabels,
    text: achievement.body.kind === 'items' ? '' : achievement.body.text,
    displayLine: displayLineFor(achievement.body, itemLabels),
  };
}

function dayLabel(day: DayKeyType): string {
  const y = Number(day.slice(0, 4));
  const m = Number(day.slice(5, 7));
  const d = Number(day.slice(8, 10));
  const weekday = ['日', '月', '火', '水', '木', '金', '土'][
    new Date(y, m - 1, d).getDay()
  ]!;
  return `${y}年${m}月${d}日（${weekday}）`;
}

export function dayGroups(doc: DiaryDocument): DayGroup[] {
  const byDay = new Map<DayKeyType, Achievement[]>();
  for (const ach of doc.achievements) {
    const list = byDay.get(ach.day);
    if (list) list.push(ach);
    else byDay.set(ach.day, [ach]);
  }

  const days = [...byDay.keys()].sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
  return days.map((day) => {
    const entries = (byDay.get(day) ?? [])
      .slice()
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((ach) => toAchievementView(doc, ach));
    return {
      day,
      label: dayLabel(day),
      entries,
      count: entries.length,
    };
  });
}

export function monthCounts(
  doc: DiaryDocument,
  ym: YearMonthType,
): MonthCell[] {
  const counts = new Map<DayKeyType, number>();
  for (const ach of doc.achievements) {
    if (YearMonth.fromDay(ach.day).y !== ym.y) continue;
    if (YearMonth.fromDay(ach.day).m !== ym.m) continue;
    counts.set(ach.day, (counts.get(ach.day) ?? 0) + 1);
  }

  const first = new Date(ym.y, ym.m - 1, 1);
  const daysInMonth = new Date(ym.y, ym.m, 0).getDate();
  const startPad = first.getDay();
  const cells: MonthCell[] = [];
  for (let i = 0; i < startPad; i++) {
    cells.push({ kind: 'pad' });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const day = DayKey.fromParts(ym.y, ym.m, d);
    cells.push({
      kind: 'day',
      day,
      dayOfMonth: d,
      count: counts.get(day) ?? 0,
    });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ kind: 'pad' });
  }
  return cells;
}

export function catalogView(doc: DiaryDocument): CatalogView {
  const categories: CategoryView[] = doc.categories.map((cat) => {
    const items: ItemView[] = doc.items
      .filter((i) => i.categoryId === cat.id)
      .map((i) => ({
        id: i.id,
        name: i.name,
        archived: i.archived,
        origin: i.origin,
      }));
    return {
      id: cat.id,
      name: cat.name,
      archived: cat.archived,
      origin: cat.origin,
      items,
    };
  });
  const activeItems = categories
    .filter((c) => !c.archived)
    .flatMap((c) => c.items.filter((i) => !i.archived));
  return { categories, activeItems };
}
