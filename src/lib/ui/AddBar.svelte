<script lang="ts">
  import { diary, DayKey, today } from '$lib/diary';
  import type { ItemId } from '$lib/diary';

  let dateInput = $state<string>(today());
  let text = $state('');
  let selected = $state<ItemId[]>([]);
  let busy = $state(false);
  let error = $state('');

  const canSubmit = $derived(
    !busy && diary.canAdd({ text, itemIds: selected }),
  );

  function toggleItem(id: ItemId) {
    if (selected.includes(id)) {
      selected = selected.filter((x) => x !== id);
    } else {
      selected = [...selected, id];
    }
  }

  async function submit() {
    if (!canSubmit) return;
    busy = true;
    error = '';
    try {
      const day = DayKey.tryParse(dateInput);
      if (!day) {
        error = '日付の形式を確認してください';
        return;
      }
      await diary.add({
        date: day,
        text,
        itemIds: selected,
      });
      text = '';
      selected = [];
      dateInput = today();
    } catch {
      error = '記録できませんでした';
    } finally {
      busy = false;
    }
  }
</script>

<section class="add-bar" aria-label="できたことを追加">
  <label class="date-field">
    <span>日付</span>
    <input type="date" bind:value={dateInput} />
  </label>

  <label class="text-field">
    <span class="sr-only">自由記述</span>
    <textarea
      rows="2"
      placeholder="できたことを書いてみましょう（任意）"
      bind:value={text}
    ></textarea>
  </label>

  {#if diary.categories.activeItems.length > 0}
    <div class="items" role="group" aria-label="項目を選ぶ">
      {#each diary.categories.activeItems as item (item.id)}
        <button
          type="button"
          class="chip"
          class:on={selected.includes(item.id)}
          aria-pressed={selected.includes(item.id)}
          onclick={() => toggleItem(item.id)}
        >
          {item.name}
        </button>
      {/each}
    </div>
  {/if}

  {#if error}
    <p class="error" role="alert">{error}</p>
  {/if}

  <button type="button" class="submit" disabled={!canSubmit} onclick={submit}>
    {busy ? '記録中…' : 'できたことを残す'}
  </button>
</section>

<style>
  .add-bar {
    flex: 0 0 auto;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.85rem 1.1rem 1rem;
    background: color-mix(in srgb, var(--surface) 92%, white);
    border-top: 1px solid var(--line);
    box-shadow: 0 -8px 24px color-mix(in srgb, var(--ink) 6%, transparent);
  }

  .date-field {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 0.9rem;
    color: var(--ink-soft);
  }

  .date-field input {
    border: 1px solid var(--line);
    border-radius: 0.6rem;
    padding: 0.35rem 0.55rem;
    background: white;
    color: var(--ink);
    font: inherit;
  }

  .text-field textarea {
    width: 100%;
    box-sizing: border-box;
    resize: none;
    min-height: 2.8rem;
    max-height: 4.5rem;
    border: 1px solid var(--line);
    border-radius: 0.85rem;
    padding: 0.7rem 0.85rem;
    background: white;
    color: var(--ink);
    font: inherit;
    line-height: 1.45;
  }

  .text-field textarea:focus-visible,
  .date-field input:focus-visible,
  .chip:focus-visible,
  .submit:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  .items {
    display: flex;
    flex-wrap: wrap;
    align-content: flex-start;
    gap: 0.45rem;
    max-height: calc(2 * (0.7rem + 1.25em) + 0.45rem);
    overflow-y: auto;
    overscroll-behavior: contain;
    padding-right: 0.15rem;
  }

  .chip {
    border: 1px solid var(--line);
    background: white;
    color: var(--ink-soft);
    border-radius: 999px;
    padding: 0.35rem 0.75rem;
    font: inherit;
    font-size: 0.88rem;
    cursor: pointer;
  }

  .chip.on {
    background: var(--accent-soft);
    border-color: color-mix(in srgb, var(--accent) 45%, white);
    color: var(--ink);
  }

  .submit {
    border: none;
    border-radius: 0.9rem;
    padding: 0.85rem 1rem;
    font: inherit;
    font-weight: 600;
    color: white;
    background: linear-gradient(135deg, var(--accent), var(--accent-deep));
    cursor: pointer;
  }

  .submit:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .error {
    margin: 0;
    color: #b42318;
    font-size: 0.88rem;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>
