# Synthesized design — Positive Possible Diary

Arena note: `architect runners` / `cross-judge pool` were both `auto` → two parent-model seats; Phase C cross-judge skipped. Base = candidate-2 structure; product module name and several grafts from candidate-1.

## Synthesis decision

**Base:** candidate-2 (`JournalDocument` + deep facade + pure commands + projections).

**Why:** Stronger emptiness encoding (`AchievementBody` union), explicit pure `commands` / `projections` (easier for agents to extend without inventing a second store), multi-tab reload via `storage` events, `canRecord` / `focusDate` for UI, seed-once presets with `origin`.

**Grafts from candidate-1:**
- Public module name `$lib/diary` (product is a diary; keep call sites readable in Japanese context).
- Multiple category items per achievement (`itemIds: readonly ItemId[]`) instead of a single `itemId`.
- `MonthCell` as `pad | day` discriminated union (clearer than `inMonth` on every cell).
- `YearMonth` helper for calendar navigation.
- Soft `update` for an existing achievement (date / text / items).
- Archive (not hard-delete) for catalog rows so historical label resolution stays stable.

**Rejected / not grafted:**
- Candidate-1’s `Record<Id, T>` maps as the only doc shape — arrays + project sort from c2 are enough for v1 volume; maps can be an internal detail later.
- Candidate-1’s `ready` auto-hydrate alone — keep explicit `diary.open()` (idempotent) so boot order is obvious.
- Merge-on-import, multi-store, repository layer cake, event sourcing (both candidates already rejected).

**Convergence:** Both seats independently chose one deep facade + one document + derived list/calendar + replace-on-import. That agreement is load-bearing.

## Rubric scores (1–5)

| Criterion | C1 | C2 |
| --- | --- | --- |
| Versioned local persist + import/export | 5 | 5 |
| Day list + easy add fit | 5 | 5 |
| Catalog presets + user adds (one path) | 4 | 5 |
| Static SPA / PWA / Pages | 5 | 5 |
| Interface depth / red-flag cleanliness | 4 | 5 |
| Agent-extendability (pure commands) | 4 | 5 |

---

## Problem

日々の「できたこと」だけを明るく記録し、日区切りのリストとカレンダー件数で振り返るデバイスローカル PWA を、Svelte SPA・静的 GitHub Pages・サーバなしで作る。空リポジトリからの greenfield。非自明なのは、永続化・スキーマ移行・プリセット分類・日次グルーピング・カレンダー集計の所有を一箇所に集め、画面側が `localStorage` や第二ストアを発明しないこと。

## Usage (caller's view)

```ts
import { diary, DayKey, YearMonth } from '$lib/diary';

await diary.open(); // idempotent hydrate / seed

diary.dayGroups; // DayGroup[] newest-first
await diary.add({ text: '朝ごはんを作った' });
await diary.add({ itemIds: [cleanId, laundryId] });
await diary.add({
  date: DayKey.parse('2026-11-10'),
  text: '短い散歩',
  itemIds: [walkId],
});

const cells = diary.monthCounts(YearMonth.parse(2026, 11));
const json = await diary.exportBundle();
await diary.importBundle(fileText); // replace after migrate
```

Call site pattern: views import only `$lib/diary`. List binds `dayGroups` + bottom `add`. Calendar binds `monthCounts`. Settings binds `categories` + export/import. No direct storage.

## Shape

**One `DiaryDocument`**, one writer (`diary` facade). Achievements + catalog live in the document. Timeline and calendar are pure projections — never hand-synced.

**Public surface (deep module):** `open`, `today` / `DayKey` / `YearMonth`, `dayGroups`, `categories` / `activeItems`, `canAdd`, `add` / `update` / `remove`, `monthCounts`, `focusDate` / `focusedDate`, `addCategory` / `addItem` / archive helpers, `exportBundle` / `importBundle`.

**Hidden:** wire JSON, `SCHEMA_VERSION`, migrators, persist adapter, preset seed, display-line joins, emptiness rules.

**Invariants in types:** branded `DayKey` / ids; achievement body requires text and/or non-empty `itemIds`; `MonthCell` = `pad | day`; `ImportResult` closed union; no mood/failure types exist.

**Import:** replace-only after migrate+validate; fail closed leaves current doc untouched; same file twice → same end state.

**Presets:** seeded once into the document with `origin: 'preset' | 'user'`; thereafter one catalog write path.

**Storage:** `persist.ts` abstracts localStorage vs IndexedDB; default recommendation for v1 = **localStorage** (simple, enough for diary scale); swap behind the same API if needed.

**PWA / Pages:** Vite + `vite-plugin-pwa`, `base` = repo path, static `dist/`, optional Actions deploy.

### Type sketch (contract)

```ts
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
  readonly createdAt: number; // epoch ms
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
```

### Facade signatures (stubs only in implementation phase)

```ts
type Diary = {
  open(): Promise<void>;
  readonly dayGroups: DayGroup[];
  readonly categories: /* CatalogView */;
  readonly focusedDate: DayKey | null;
  canAdd(input: Pick<AddInput, 'text' | 'itemIds'>): boolean;
  add(input: AddInput): Promise<AchievementView>;
  update(id: AchievementId, patch: AddInput): Promise<AchievementView>;
  remove(id: AchievementId): Promise<void>; // idempotent
  monthCounts(ym: YearMonth): MonthCell[];
  focusDate(day: DayKey): void;
  addCategory(name: string): Promise<CategoryId>;
  addItem(categoryId: CategoryId, name: string): Promise<ItemId>;
  archiveCategory(id: CategoryId): Promise<void>;
  archiveItem(id: ItemId): Promise<void>;
  exportBundle(): Promise<string>;
  importBundle(raw: string): Promise<ImportResult>;
};
export declare const diary: Diary;
```

### Module map

```
src/
  main.ts                 # await diary.open(); mount
  App.svelte              # List | Calendar | Settings
  lib/diary/
    index.ts              # public barrel ONLY
    types.ts
    diary.svelte.ts       # facade + $state / $derived
    commands.ts           # pure doc → doc
    projections.ts        # dayGroups / monthCounts / catalog
    parse.ts
    migrate.ts
    persist.ts
    presets.ts
    wire.ts               # private
  lib/ui/
    ListView.svelte
    CalendarView.svelte
    SettingsView.svelte
    AddBar.svelte
vite.config.ts            # base, PWA
.github/workflows/pages.yml
```

Import rule: app code only `from '$lib/diary'`. Enforce with eslint `no-restricted-imports` when tooling lands.

## Tradeoffs accepted

- Replace-only import in exchange for one migration path (warn in UI before import).
- Facade singleton in exchange for one import path UI cannot bypass.
- Presets persisted with `origin` in exchange for one catalog path.
- Re-derive projections each update in exchange for no dual-written indexes.
- localStorage default in exchange for simpler v1; adapter keeps IDB optional.
- `add` not content-idempotent (double-tap can double-add); UI disables via `canAdd` / busy state.

## Alternatives considered

1. Per-feature stores — split ownership; rejected by both candidates.
2. Repository / use-case layer cake — temporal decomposition; rejected.
3. Event-sourced log — unnecessary complexity for single-device diary.
4. Preset overlay (code ∪ user doc) — two catalog resolution paths; rejected for seed-once.

## Open questions (need your call before / during implement)

1. **Import UX:** replace-only でよいか（インポート前に「現在のデータは置き換わります。先にエクスポートを」と警告）？
2. **プリセット項目の確定リスト**（家事・運動・成長の具体名）— 仮置きで進めてよいか？
3. **プリセットの削除** — アーカイブ可？ 不可でユーザー追加のみ編集可？
4. **GitHub リポジトリ名 / Pages `base` path** — `positive_possible_dialy` のまま？
5. **エントリ編集** — v1 で `update` を出すか、追加と削除のみか？

## Next implementation step

`types` + `presets` + pure `commands` / `projections` (+ 単体テスト) → `persist` + `diary.open` / `add` → ListView が実データで動くところまで。

## Verification (arena Phase F)

- [x] Usage and types agree (add / dayGroups / monthCounts / import).
- [x] Single writer; projections not stored.
- [x] Wire/migrate not on public barrel.
- [x] Red flags: no split ownership, no two import modes, no hand-synced counts.
- [x] Static SPA + PWA path present in module map.

## Operator decisions (2026-11-12)

1. Import: replace-only with pre-import warning.
2. Preset copy: provisional placeholders OK for v1.
3. Presets: archivable.
4. GitHub Pages base: `/positive_possible_dialy/`.
5. Achievements: editable via `update` in v1.
