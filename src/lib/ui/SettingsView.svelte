<script lang="ts">
  import { diary } from '$lib/diary';
  import type { CategoryId, ItemId } from '$lib/diary';

  let newCategory = $state('');
  let itemDrafts = $state<Record<string, string>>({});
  let status = $state('');
  let importError = $state('');

  async function addCategory() {
    try {
      await diary.addCategory(newCategory);
      newCategory = '';
      status = 'カテゴリを追加しました';
    } catch {
      status = 'カテゴリ名を入力してください';
    }
  }

  async function addItem(categoryId: CategoryId) {
    const name = itemDrafts[categoryId] ?? '';
    try {
      await diary.addItem(categoryId, name);
      itemDrafts = { ...itemDrafts, [categoryId]: '' };
      status = '項目を追加しました';
    } catch {
      status = '項目を追加できませんでした';
    }
  }

  async function archiveCategory(id: CategoryId, name: string) {
    if (!confirm(`「${name}」をアーカイブしますか？過去の記録の表示は残ります。`)) return;
    await diary.archiveCategory(id);
  }

  async function archiveItem(id: ItemId, name: string) {
    if (!confirm(`「${name}」をアーカイブしますか？過去の記録の表示は残ります。`)) return;
    await diary.archiveItem(id);
  }

  async function unarchiveCategory(id: CategoryId) {
    await diary.unarchiveCategory(id);
    status = 'カテゴリを復元しました';
  }

  async function unarchiveItem(id: ItemId) {
    await diary.unarchiveItem(id);
    status = '項目を復元しました';
  }

  async function exportData() {
    const json = await diary.exportBundle();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dekita-diary-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    status = 'エクスポートしました';
  }

  async function onImportFile(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    const ok = confirm(
      '現在のデータは置き換わります。先にエクスポートしておくことをおすすめします。続行しますか？',
    );
    if (!ok) return;

    importError = '';
    const raw = await file.text();
    const result = await diary.importBundle(raw);
    if (!result.ok) {
      importError = result.message;
      status = '';
      return;
    }
    status = `${result.importedCount}件の記録を取り込みました`;
  }
</script>

<div class="settings">
  <header>
    <h1>設定</h1>
    <p>分類の整理と、データの控え・復元ができます。</p>
  </header>

  {#if status}
    <p class="status" role="status">{status}</p>
  {/if}

  <section>
    <h2>カテゴリと項目</h2>
    <div class="add-row">
      <input
        type="text"
        placeholder="新しいカテゴリ名"
        bind:value={newCategory}
      />
      <button type="button" onclick={addCategory}>追加</button>
    </div>

    {#each diary.categories.activeCategories as cat (cat.id)}
      <article class="cat">
        <div class="cat-head">
          <h3>
            {cat.name}
            {#if cat.origin === 'preset'}
              <span class="tag">プリセット</span>
            {/if}
          </h3>
          <button type="button" class="ghost" onclick={() => archiveCategory(cat.id, cat.name)}>
            アーカイブ
          </button>
        </div>

        <ul>
          {#each cat.items as item (item.id)}
            <li>
              <span>{item.name}</span>
              <button type="button" class="ghost" onclick={() => archiveItem(item.id, item.name)}>
                アーカイブ
              </button>
            </li>
          {/each}
        </ul>

        <div class="add-row">
          <input
            type="text"
            placeholder="項目を追加"
            value={itemDrafts[cat.id] ?? ''}
            oninput={(e) => {
              itemDrafts = {
                ...itemDrafts,
                [cat.id]: (e.currentTarget as HTMLInputElement).value,
              };
            }}
          />
          <button type="button" onclick={() => addItem(cat.id)}>追加</button>
        </div>
      </article>
    {/each}
  </section>

  {#if diary.categories.archivedCategories.length > 0}
    <section>
      <h2>アーカイブ</h2>
      <p class="hint">使わなくなった分類です。復元すると再び記録に使えます。</p>

      {#each diary.categories.archivedCategories as cat (cat.id)}
        <article class="cat archived">
          <div class="cat-head">
            <h3>
              {cat.name}
              {#if cat.origin === 'preset'}
                <span class="tag">プリセット</span>
              {/if}
              {#if cat.archived}
                <span class="tag">アーカイブ</span>
              {/if}
            </h3>
            {#if cat.archived}
              <button type="button" class="ghost" onclick={() => unarchiveCategory(cat.id)}>
                復元
              </button>
            {/if}
          </div>

          <ul>
            {#each cat.items as item (item.id)}
              <li>
                <span>{item.name}</span>
                <button type="button" class="ghost" onclick={() => unarchiveItem(item.id)}>
                  復元
                </button>
              </li>
            {/each}
          </ul>
        </article>
      {/each}
    </section>
  {/if}

  <section>
    <h2>データの控え</h2>
    <p class="hint">この端末内だけに保存されています。機種変更の前などにエクスポートしてください。</p>
    <div class="data-actions">
      <button type="button" onclick={exportData}>エクスポート</button>
      <label class="file">
        インポート
        <input type="file" accept="application/json,.json" onchange={onImportFile} />
      </label>
    </div>
    {#if importError}
      <p class="error" role="alert">{importError}</p>
    {/if}
  </section>
</div>

<style>
  .settings {
    height: 100%;
    min-height: 0;
    padding: 1.25rem;
    overflow: auto;
    overscroll-behavior: contain;
  }

  header h1 {
    margin: 0;
    font-size: 1.55rem;
    color: var(--ink);
  }

  header p,
  .hint {
    margin: 0.35rem 0 1rem;
    color: var(--ink-soft);
    font-size: 0.95rem;
    line-height: 1.5;
  }

  section {
    margin-bottom: 1.75rem;
  }

  h2 {
    margin: 0 0 0.75rem;
    font-size: 1.05rem;
    color: var(--ink);
  }

  .status {
    margin: 0 0 1rem;
    padding: 0.7rem 0.85rem;
    border-radius: 0.75rem;
    background: var(--accent-soft);
    color: var(--ink);
  }

  .error {
    margin: 0.75rem 0 0;
    color: #b42318;
  }

  .add-row {
    display: flex;
    gap: 0.45rem;
    margin-bottom: 0.75rem;
  }

  input {
    flex: 1;
    border: 1px solid var(--line);
    border-radius: 0.65rem;
    padding: 0.55rem 0.7rem;
    font: inherit;
    background: white;
    color: var(--ink);
  }

  button,
  .file {
    border: none;
    border-radius: 0.65rem;
    padding: 0.55rem 0.85rem;
    font: inherit;
    background: linear-gradient(135deg, var(--accent), var(--accent-deep));
    color: white;
    cursor: pointer;
  }

  .ghost {
    background: transparent;
    color: var(--ink-soft);
    padding: 0.25rem 0.45rem;
  }

  .file {
    display: inline-flex;
    align-items: center;
    position: relative;
    overflow: hidden;
  }

  .file input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
  }

  .cat {
    border: 1px solid var(--line);
    border-radius: 1rem;
    padding: 0.85rem;
    margin-bottom: 0.75rem;
    background: var(--surface);
  }

  .cat.archived {
    opacity: 0.65;
  }

  .cat-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
  }

  .cat-head h3 {
    margin: 0;
    font-size: 1rem;
    color: var(--ink);
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    align-items: center;
  }

  .tag {
    font-size: 0.72rem;
    font-weight: 500;
    color: var(--accent-deep);
    background: var(--accent-soft);
    border-radius: 999px;
    padding: 0.1rem 0.45rem;
  }

  ul {
    list-style: none;
    margin: 0.65rem 0;
    padding: 0;
  }

  li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.35rem 0;
    color: var(--ink);
    border-bottom: 1px solid color-mix(in srgb, var(--line) 70%, transparent);
  }

  .data-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.55rem;
  }
</style>
