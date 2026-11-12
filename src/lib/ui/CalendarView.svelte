<script lang="ts">
  import { diary, today, YearMonth } from '$lib/diary';

  const now = today();
  let ym = $state(YearMonth.fromDay(now));

  const cells = $derived(diary.monthCounts(ym));
  const label = $derived(YearMonth.label(ym));

  function prev() {
    ym = YearMonth.addMonths(ym, -1);
  }

  function next() {
    ym = YearMonth.addMonths(ym, 1);
  }

  function selectDay(day: typeof now) {
    diary.focusDate(day);
  }
</script>

<div class="cal-page">
  <header>
    <h1>カレンダー</h1>
    <p>できた日が、やさしく積み重なっていきます。</p>
  </header>

  <div class="nav">
    <button type="button" onclick={prev} aria-label="前の月">‹</button>
    <h2>{label}</h2>
    <button type="button" onclick={next} aria-label="次の月">›</button>
  </div>

  <div class="weekdays" aria-hidden="true">
    <span>日</span><span>月</span><span>火</span><span>水</span><span>木</span><span>金</span><span>土</span>
  </div>

  <div class="grid" role="grid" aria-label={label}>
    {#each cells as cell, i (i)}
      {#if cell.kind === 'pad'}
        <div class="pad"></div>
      {:else}
        <button
          type="button"
          class="day"
          class:has={cell.count > 0}
          class:focused={diary.focusedDate === cell.day}
          class:today={cell.day === now}
          onclick={() => selectDay(cell.day)}
        >
          <span class="num">{cell.dayOfMonth}</span>
          {#if cell.count > 0}
            <span class="badge">{cell.count}</span>
          {/if}
        </button>
      {/if}
    {/each}
  </div>

  {#if diary.focusedDate}
    {@const group = diary.dayGroups.find((g) => g.day === diary.focusedDate)}
    <section class="focus" aria-live="polite">
      <h3>{diary.focusedDate}</h3>
      {#if group && group.entries.length > 0}
        <ul>
          {#each group.entries as entry (entry.id)}
            <li>{entry.displayLine}</li>
          {/each}
        </ul>
      {:else}
        <p>この日の記録はまだありません。</p>
      {/if}
    </section>
  {/if}
</div>

<style>
  .cal-page {
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

  header p {
    margin: 0.35rem 0 1rem;
    color: var(--ink-soft);
    font-size: 0.95rem;
  }

  .nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.85rem;
  }

  .nav h2 {
    margin: 0;
    font-size: 1.1rem;
    color: var(--ink);
  }

  .nav button {
    width: 2.4rem;
    height: 2.4rem;
    border: 1px solid var(--line);
    border-radius: 0.7rem;
    background: var(--surface);
    color: var(--ink);
    font-size: 1.35rem;
    cursor: pointer;
  }

  .weekdays,
  .grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 0.35rem;
  }

  .weekdays {
    margin-bottom: 0.35rem;
    color: var(--ink-soft);
    font-size: 0.78rem;
    text-align: center;
  }

  .pad {
    min-height: 3.4rem;
  }

  .day {
    min-height: 3.4rem;
    border: 1px solid var(--line);
    border-radius: 0.8rem;
    background: var(--surface);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.15rem;
    cursor: pointer;
    padding: 0.25rem;
    font: inherit;
    color: var(--ink);
  }

  .day.today {
    border-color: color-mix(in srgb, var(--sky) 55%, var(--line));
  }

  .day.has {
    background: color-mix(in srgb, var(--accent-soft) 80%, white);
  }

  .day.focused {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }

  .num {
    font-size: 0.92rem;
  }

  .badge {
    font-size: 0.72rem;
    font-weight: 700;
    color: var(--accent-deep);
  }

  .focus {
    margin-top: 1.25rem;
    padding: 1rem;
    border-radius: 1rem;
    background: var(--surface);
    border: 1px solid var(--line);
  }

  .focus h3 {
    margin: 0 0 0.55rem;
    font-size: 0.95rem;
    color: var(--ink-soft);
  }

  .focus ul {
    margin: 0;
    padding-left: 1.1rem;
    color: var(--ink);
    line-height: 1.55;
  }

  .focus p {
    margin: 0;
    color: var(--ink-soft);
  }
</style>
