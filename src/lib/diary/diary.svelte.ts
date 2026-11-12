import {
  addAchievement,
  addCategory as cmdAddCategory,
  addItem as cmdAddItem,
  archiveCategory as cmdArchiveCategory,
  archiveItem as cmdArchiveItem,
  canAdd as cmdCanAdd,
  removeAchievement,
  unarchiveCategory as cmdUnarchiveCategory,
  unarchiveItem as cmdUnarchiveItem,
  updateAchievement,
} from './commands';
import { DayKey } from './parse';
import {
  createLocalStoragePersist,
  STORAGE_KEY,
  type PersistAdapter,
} from './persist';
import { emptyDocument } from './presets';
import { catalogView, dayGroups, monthCounts } from './projections';
import type {
  AchievementId,
  AchievementView,
  AddInput,
  CatalogView,
  CategoryId,
  DayGroup,
  DayKey as DayKeyType,
  DiaryDocument,
  ImportResult,
  ItemId,
  MonthCell,
  YearMonth,
} from './types';
import {
  deserializeDocument,
  hydrateFromStorage,
  serializeDocument,
} from './wire';

let doc = $state<DiaryDocument>(emptyDocument());
let focused = $state<DayKeyType | null>(null);
let opened = false;
let persist: PersistAdapter = createLocalStoragePersist();
let listening = false;

async function commit(next: DiaryDocument): Promise<void> {
  doc = next;
  await persist.save(serializeDocument(next));
}

function onStorage(event: StorageEvent): void {
  if (event.key !== STORAGE_KEY || !event.newValue) return;
  const hydrated = hydrateFromStorage(event.newValue);
  if (hydrated) doc = hydrated;
}

export const diary = {
  async open(): Promise<void> {
    if (opened) return;
    const raw = await persist.load();
    const hydrated = hydrateFromStorage(raw);
    if (hydrated) {
      doc = hydrated;
    } else {
      doc = emptyDocument();
      await persist.save(serializeDocument(doc));
    }
    if (typeof window !== 'undefined' && !listening) {
      window.addEventListener('storage', onStorage);
      listening = true;
    }
    opened = true;
  },

  get dayGroups(): DayGroup[] {
    return dayGroups(doc);
  },

  get categories(): CatalogView {
    return catalogView(doc);
  },

  get focusedDate(): DayKeyType | null {
    return focused;
  },

  canAdd(input: Pick<AddInput, 'text' | 'itemIds'>): boolean {
    return cmdCanAdd(doc, input);
  },

  async add(input: AddInput): Promise<AchievementView> {
    const result = addAchievement(doc, input);
    if (!result.ok) {
      throw new Error('empty achievement rejected');
    }
    await commit(result.doc);
    return result.view;
  },

  async update(
    id: AchievementId,
    patch: AddInput,
  ): Promise<AchievementView> {
    const result = updateAchievement(doc, id, patch);
    if (!result.ok) {
      throw new Error('update rejected');
    }
    await commit(result.doc);
    return result.view;
  },

  async remove(id: AchievementId): Promise<void> {
    await commit(removeAchievement(doc, id));
  },

  monthCounts(ym: YearMonth): MonthCell[] {
    return monthCounts(doc, ym);
  },

  focusDate(day: DayKeyType): void {
    focused = day;
  },

  async addCategory(name: string): Promise<CategoryId> {
    const result = cmdAddCategory(doc, name);
    if (!result.ok) throw new Error('category name required');
    await commit(result.doc);
    return result.id;
  },

  async addItem(categoryId: CategoryId, name: string): Promise<ItemId> {
    const result = cmdAddItem(doc, categoryId, name);
    if (!result.ok) throw new Error('item add rejected');
    await commit(result.doc);
    return result.id;
  },

  async archiveCategory(id: CategoryId): Promise<void> {
    await commit(cmdArchiveCategory(doc, id));
  },

  async archiveItem(id: ItemId): Promise<void> {
    await commit(cmdArchiveItem(doc, id));
  },

  async unarchiveCategory(id: CategoryId): Promise<void> {
    await commit(cmdUnarchiveCategory(doc, id));
  },

  async unarchiveItem(id: ItemId): Promise<void> {
    await commit(cmdUnarchiveItem(doc, id));
  },

  async exportBundle(): Promise<string> {
    return serializeDocument(doc);
  },

  async importBundle(raw: string): Promise<ImportResult> {
    const result = deserializeDocument(raw);
    if (!result.ok) {
      return {
        ok: false,
        code: result.code,
        message: result.message,
      };
    }
    await commit(result.doc);
    return { ok: true, importedCount: result.importedCount };
  },
};

export function today(): DayKeyType {
  return DayKey.today();
}
