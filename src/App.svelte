<script lang="ts">
  import ListView from '$lib/ui/ListView.svelte';
  import CalendarView from '$lib/ui/CalendarView.svelte';
  import SettingsView from '$lib/ui/SettingsView.svelte';

  type Tab = 'list' | 'calendar' | 'settings';
  let tab = $state<Tab>('list');
</script>

<div class="shell">
  <main>
    {#if tab === 'list'}
      <ListView />
    {:else if tab === 'calendar'}
      <CalendarView />
    {:else}
      <SettingsView />
    {/if}
  </main>

  <nav aria-label="メインメニュー">
    <button
      type="button"
      class:active={tab === 'list'}
      aria-current={tab === 'list' ? 'page' : undefined}
      onclick={() => (tab = 'list')}
    >
      リスト
    </button>
    <button
      type="button"
      class:active={tab === 'calendar'}
      aria-current={tab === 'calendar' ? 'page' : undefined}
      onclick={() => (tab = 'calendar')}
    >
      カレンダー
    </button>
    <button
      type="button"
      class:active={tab === 'settings'}
      aria-current={tab === 'settings' ? 'page' : undefined}
      onclick={() => (tab = 'settings')}
    >
      設定
    </button>
  </nav>
</div>

<style>
  .shell {
    height: 100%;
    max-height: 100dvh;
    display: flex;
    flex-direction: column;
    max-width: 40rem;
    margin: 0 auto;
    overflow: hidden;
    background: color-mix(in srgb, var(--bg) 88%, white);
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--line) 70%, transparent);
  }

  main {
    flex: 1 1 auto;
    min-height: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  nav {
    flex: 0 0 auto;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.35rem;
    padding: 0.55rem 0.75rem calc(0.55rem + env(safe-area-inset-bottom));
    border-top: 1px solid var(--line);
    background: color-mix(in srgb, var(--surface) 94%, white);
  }

  nav button {
    border: none;
    background: transparent;
    color: var(--ink-soft);
    border-radius: 0.85rem;
    padding: 0.7rem 0.4rem;
    font: inherit;
    font-size: 0.92rem;
    font-weight: 600;
    cursor: pointer;
  }

  nav button.active {
    background: var(--accent-soft);
    color: var(--ink);
  }

  nav button:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
</style>
