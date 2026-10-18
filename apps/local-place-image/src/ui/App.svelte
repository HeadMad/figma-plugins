<script>
  import { figma } from '@pkg/ui/utils/figmaBridge/index.js';

  /** @type {string[]} */
  let images = $state([]);
  let isPlacing = $state(false);

  const hasImages = $derived(images.length > 0);
  const canCycle = $derived(images.length > 1);

  $effect(() => {
    const offStack = figma.addEventListener('render-stack', (data) => {
      images = data.images || [];
      if (!images.length) isPlacing = false;
    });
    const offStatus = figma.addEventListener('status-copied', () => {
      isPlacing = true;
    });
    return () => {
      offStack();
      offStatus();
    };
  });
</script>

<div class="app">
  <div class="stack">
    {#if hasImages}
      <div class="badge">{images.length}</div>
      {#each images as src, i (i + src.slice(0, 16))}
        <img class="card" src="data:image/png;base64,{src}" alt="" />
      {/each}
    {:else}
      <div class="empty">
        Выделите одну или несколько картинок с помощью
        <br /><b>Ctrl + Shift + Click</b>
      </div>
    {/if}
  </div>

  {#if hasImages}
    <div class="controls">
      <button
        type="button"
        class="icon"
        title="В конец очереди"
        disabled={!canCycle}
        onclick={() => figma.send('cycleCard')}
      >
        ‹
      </button>
      <button
        type="button"
        class="icon"
        title="Удалить из очереди"
        onclick={() => figma.send('deleteCard')}
      >
        ⌫
      </button>
      <button
        type="button"
        class="icon"
        title="В конец очереди"
        disabled={!canCycle}
        onclick={() => figma.send('cycleCard')}
      >
        ›
      </button>
    </div>
  {/if}

  {#if hasImages && !isPlacing}
    <button type="button" class="action" onclick={() => figma.send('activatePlacing')}>
      Копировать
    </button>
  {:else if isPlacing}
    <div class="hint">Клик по шейпу вставляет изображение</div>
  {/if}
</div>

<style>
  .app {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
    min-height: 248px;
    padding: 16px;
    background: #2c2c2c;
    color: #fff;
    user-select: none;
  }

  .stack {
    position: relative;
    display: flex;
    flex-grow: 1;
    align-items: center;
    justify-content: center;
    width: 100%;
  }

  .card {
    position: absolute;
    width: 130px;
    height: 130px;
    border: 3px solid #fff;
    border-radius: 12px;
    object-fit: cover;
    background: #444;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
    transition: transform 0.2s, opacity 0.2s;
  }

  .card:nth-last-child(1) {
    z-index: 10;
    transform: translate(0, 0) scale(1);
    opacity: 1;
  }
  .card:nth-last-child(2) {
    z-index: 9;
    transform: translate(6px, 6px) scale(0.95);
    opacity: 0.85;
  }
  .card:nth-last-child(3) {
    z-index: 8;
    transform: translate(12px, 12px) scale(0.9);
    opacity: 0.5;
  }
  .card:nth-last-child(n + 4) {
    transform: translate(12px, 12px) scale(0.9);
    opacity: 0;
  }

  .badge {
    position: absolute;
    top: 0;
    right: 25px;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border: 2px solid #fff;
    border-radius: 50%;
    background: #f24822;
    font-size: 11px;
    font-weight: bold;
  }

  .empty {
    max-width: 180px;
    font-size: 12px;
    line-height: 1.5;
    color: #aaa;
    text-align: center;
  }
  .empty b {
    color: #fff;
  }

  .controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    margin: 8px 0 16px;
  }

  .icon {
    padding: 6px 10px;
    border: none;
    border-radius: 4px;
    background: none;
    font-size: 16px;
    color: #aaa;
    cursor: pointer;
  }
  .icon:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }
  .icon:disabled {
    color: #555;
    cursor: not-allowed;
  }

  .action {
    width: 100%;
    padding: 10px;
    border: none;
    border-radius: 6px;
    background: #18a0fb;
    font-size: 12px;
    font-weight: 500;
    color: #fff;
    cursor: pointer;
  }
  .action:hover {
    background: #0d8de3;
  }

  .hint {
    padding: 10px 0;
    font-size: 11px;
    line-height: 1.4;
    color: #888;
    text-align: center;
  }
</style>
