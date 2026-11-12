export type DayKey = string & { readonly __brand: 'DayKey' };
export type YearMonth = { readonly y: number; readonly m: number } & {
  readonly __brand: 'YearMonth';
};
export type AchievementId = string & { readonly __brand: 'AchievementId' };
export type CategoryId = string & { readonly __brand: 'CategoryId' };
export type ItemId = string & { readonly __brand: 'ItemId' };
export type NonEmptyText = string & { readonly __brand: 'NonEmptyText' };

export type AchievementBody =
  | { readonly kind: 'text'; readonly text: NonEmptyText }
  | { readonly kind: 'items'; readonly itemIds: readonly [ItemId, ...ItemId[]] }
  | {
      readonly kind: 'both';
      readonly text: NonEmptyText;
      readonly itemIds: readonly [ItemId, ...ItemId[]];
    };

export type Achievement = {
  readonly id: AchievementId;
  readonly day: DayKey;
  readonly body: AchievementBody;
  readonly createdAt: number;
};

export type Category = {
  readonly id: CategoryId;
  readonly name: NonEmptyText;
  readonly origin: 'preset' | 'user';
  readonly archived: boolean;
};

export type CategoryItem = {
  readonly id: ItemId;
  readonly categoryId: CategoryId;
  readonly name: NonEmptyText;
  readonly origin: 'preset' | 'user';
  readonly archived: boolean;
};

export type DiaryDocument = {
  readonly schemaVersion: 1;
  readonly categories: readonly Category[];
  readonly items: readonly CategoryItem[];
  readonly achievements: readonly Achievement[];
};

export type AddInput = {
  date?: DayKey;
  text?: string;
  itemIds?: readonly ItemId[];
};

export type DayGroup = {
  readonly day: DayKey;
  readonly label: string;
  readonly entries: readonly AchievementView[];
  readonly count: number;
};

export type AchievementView = {
  readonly id: AchievementId;
  readonly day: DayKey;
  readonly displayLine: string;
  readonly text: string;
  readonly itemLabels: readonly string[];
};

export type MonthCell =
  | { readonly kind: 'pad' }
  | {
      readonly kind: 'day';
      readonly day: DayKey;
      readonly dayOfMonth: number;
      readonly count: number;
    };

export type ImportResult =
  | { readonly ok: true; readonly importedCount: number }
  | {
      readonly ok: false;
      readonly code: 'invalid_json' | 'unsupported_schema' | 'validation_failed';
      readonly message: string;
    };

export type ItemView = {
  readonly id: ItemId;
  readonly name: string;
  readonly archived: boolean;
  readonly origin: 'preset' | 'user';
};

export type CategoryView = {
  readonly id: CategoryId;
  readonly name: string;
  readonly archived: boolean;
  readonly origin: 'preset' | 'user';
  readonly items: readonly ItemView[];
};

export type CatalogView = {
  readonly categories: readonly CategoryView[];
  readonly activeCategories: readonly CategoryView[];
  readonly archivedCategories: readonly CategoryView[];
  readonly activeItems: readonly ItemView[];
};
