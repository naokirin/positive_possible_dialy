<script lang="ts">
  import { diary } from '$lib/diary';
  import type { AchievementId } from '$lib/diary';
  import AddBar from './AddBar.svelte';

  let editingId = $state<AchievementId | null>(null);
  let editText = $state('');

  async function remove(id: AchievementId) {
    if (!confirm('この記録を削除しますか？')) return;
    await diary.remove(id);
  }

  function startEdit(id: AchievementId, text: string) {
    editingId = id;
    editText = text;
  }

  async function saveEdit(id: AchievementId) {
    await diary.update(id, { text: editText });
    editingId = null;
    editText = '';
  }
</script>

<div class="list-page">
  <header class="intro">
    <h1>できたこと</h1>
    <p>小さな一歩も、ちゃんと残しておきましょう。</p>
  </header>

  <div class="scroll">
    {#if diary.dayGroups.length === 0}
      <p class="empty">まだ記録がありません。下から最初の「できたこと」を追加できます。</p>
    {:else}
      {#each diary.dayGroups as group (group.day)}
        <section class="day">
          <h2>
            <span>{group.label}</span>
            <span class="count">{group.count}件</span>
          </h2>
          <ul>
            {#each group.entries as entry (entry.id)}
              <li>
                {#if editingId === entry.id}
                  <div class="edit-row">
                    <input bind:value={editText} aria-label="記録を編集" />
                    <button type="button" onclick={() => saveEdit(entry.id)}>保存</button>
                    <button type="button" class="ghost" onclick={() => (editingId = null)}>
                      やめる
                    </button>
                  </div>
                {:else}
                  <p class="line">{entry.displayLine}</p>
                  <div class="actions">
                    <button type="button" class="ghost" onclick={() => startEdit(entry.id, entry.text)}>
                      編集
                    </button>
                    <button type="button" class="ghost danger" onclick={() => remove(entry.id)}>
                      削除
                    </button>
                  </div>
                {/if}
              </li>
            {/each}
          </ul>
        </section>
      {/each}
    {/if}
  </div>

  <AddBar />
</div>

<style>
  .list-page {
    display: flex;
    flex-direction: column;
    min-height: 0;
    height: 100%;
    flex: 1;
    overflow: hidden;
  }

  .intro {
    flex: 0 0 auto;
    padding: 1.25rem 1.25rem 0.5rem;
  }

  .intro h1 {
    margin: 0;
    font-size: 1.55rem;
    letter-spacing: 0.02em;
    color: var(--ink);
  }

  .intro p {
    margin: 0.35rem 0 0;
    color: var(--ink-soft);
    font-size: 0.95rem;
  }

  .scroll {
    flex: 1 1 auto;
    min-height: 0;
    overflow: auto;
    overscroll-behavior: contain;
    padding: 0.5rem 1.25rem 1rem;
  }

  .empty {
    margin: 1.5rem 0;
    padding: 1.1rem;
    border-radius: 1rem;
    background: color-mix(in srgb, var(--accent-soft) 70%, white);
    color: var(--ink-soft);
    line-height: 1.55;
  }

  .day {
    margin: 0 0 1.25rem;
  }

  .day h2 {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 0.75rem;
    margin: 0 0 0.55rem;
    font-size: 0.95rem;
    color: var(--ink-soft);
    font-weight: 600;
  }

  .count {
    font-size: 0.82rem;
    color: var(--accent-deep);
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
  }

  li {
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 1rem;
    padding: 0.85rem 0.95rem;
  }

  .line {
    margin: 0;
    color: var(--ink);
    line-height: 1.5;
  }

  .actions,
  .edit-row {
    display: flex;
    gap: 0.4rem;
    margin-top: 0.55rem;
    flex-wrap: wrap;
  }

  .edit-row input {
    flex: 1;
    min-width: 10rem;
    border: 1px solid var(--line);
    border-radius: 0.55rem;
    padding: 0.4rem 0.55rem;
    font: inherit;
  }

  button {
    border: none;
    background: var(--accent-soft);
    color: var(--ink);
    border-radius: 0.55rem;
    padding: 0.35rem 0.7rem;
    font: inherit;
    font-size: 0.85rem;
    cursor: pointer;
  }

  .ghost {
    background: transparent;
    color: var(--ink-soft);
  }

  .danger {
    color: #b42318;
  }
</style>
