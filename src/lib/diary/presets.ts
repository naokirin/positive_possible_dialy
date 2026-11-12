import { parseNonEmptyText } from './parse';
import type {
  Category,
  CategoryId,
  CategoryItem,
  DiaryDocument,
  ItemId,
  NonEmptyText,
} from './types';

function text(value: string): NonEmptyText {
  const parsed = parseNonEmptyText(value);
  if (!parsed) throw new Error(`empty preset label: ${value}`);
  return parsed;
}

type PresetCategory = {
  id: CategoryId;
  name: NonEmptyText;
  items: readonly { id: ItemId; name: NonEmptyText }[];
};

const PRESETS: readonly PresetCategory[] = [
  {
    id: 'cat-housework' as CategoryId,
    name: text('家事'),
    items: [
      { id: 'item-laundry' as ItemId, name: text('洗濯をした') },
      { id: 'item-dishes' as ItemId, name: text('食器を洗った') },
      { id: 'item-cook' as ItemId, name: text('食事を作った') },
      { id: 'item-tidy' as ItemId, name: text('部屋を整えた') },
    ],
  },
  {
    id: 'cat-body' as CategoryId,
    name: text('からだ'),
    items: [
      { id: 'item-walk' as ItemId, name: text('短い散歩をした') },
      { id: 'item-stretch' as ItemId, name: text('ストレッチをした') },
      { id: 'item-sleep' as ItemId, name: text('決めた時間に寝た') },
    ],
  },
  {
    id: 'cat-growth' as CategoryId,
    name: text('こころ・成長'),
    items: [
      { id: 'item-outside' as ItemId, name: text('外に出た') },
      { id: 'item-message' as ItemId, name: text('誰かに連絡した') },
      { id: 'item-learn' as ItemId, name: text('少し学んだ') },
    ],
  },
];

export function emptyDocument(): DiaryDocument {
  const categories: Category[] = [];
  const items: CategoryItem[] = [];
  for (const preset of PRESETS) {
    categories.push({
      id: preset.id,
      name: preset.name,
      origin: 'preset',
      archived: false,
    });
    for (const item of preset.items) {
      items.push({
        id: item.id,
        categoryId: preset.id,
        name: item.name,
        origin: 'preset',
        archived: false,
      });
    }
  }
  return {
    schemaVersion: 1,
    categories,
    items,
    achievements: [],
  };
}
