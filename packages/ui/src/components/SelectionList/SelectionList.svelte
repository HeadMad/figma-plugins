<script>
  import moveItem from '@pkg/utils/moveItem';

  /**
   * @typedef {{ id: string, name: string, w: number, h: number }} ListItem
   * @typedef {Object} Props
   * @property {ListItem[]} [items]
   * @property {string} [emptyText='No selection']
   */

  /** @type {Props} */
  let {
    items = $bindable([]),
    emptyText = 'No selection',
  } = $props();

  /** @type {number|null} */
  let dragFrom = $state(null);

  /**
   * @param {number} i
   * @param {DragEvent} e
   */
  function onDragStart(i, e) {
    dragFrom = i;
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.classList.add('selection-list__item_dragging');
  }

  /** @param {DragEvent} e */
  function onDragEnd(e) {
    e.currentTarget.classList.remove('selection-list__item_dragging');
    dragFrom = null;
    const parent = e.currentTarget.parentElement;
    if (parent) {
      for (const el of parent.querySelectorAll('.selection-list__item_over')) {
        el.classList.remove('selection-list__item_over');
      }
    }
  }

  /** @param {DragEvent} e */
  function onDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('selection-list__item_over');
  }

  /** @param {DragEvent} e */
  function onDragLeave(e) {
    e.currentTarget.classList.remove('selection-list__item_over');
  }

  /**
   * @param {number} to
   * @param {DragEvent} e
   */
  function onDrop(to, e) {
    e.preventDefault();
    e.currentTarget.classList.remove('selection-list__item_over');
    if (dragFrom == null || dragFrom === to) return;
    items = moveItem(items, dragFrom, to);
    dragFrom = null;
  }
</script>

<div class="selection-list">
  {#if !items.length}
    <div class="selection-list__empty">{emptyText}</div>
  {:else}
    {#each items as item, i (item.id)}
      <div
        class="selection-list__item"
        draggable="true"
        ondragstart={(e) => onDragStart(i, e)}
        ondragend={onDragEnd}
        ondragover={onDragOver}
        ondragleave={onDragLeave}
        ondrop={(e) => onDrop(i, e)}
      >
        <span class="selection-list__name">{item.name}</span>
        <span class="selection-list__size">{item.w}×{item.h}</span>
      </div>
    {/each}
  {/if}
</div>

<style>
  .selection-list {
    max-height: 72px;
    overflow-y: auto;
    background: var(--bg-field);
    border-radius: var(--radius-ui);

    &__item {
      display: flex;
      align-items: center;
      height: 22px;
      padding: 0 var(--space-sm);
      border-bottom: 1px solid var(--bg-field-hover);
      font-size: 11px;
      cursor: grab;

      &:last-child {
        border-bottom: none;
      }

      &_dragging {
        opacity: 0.4;
      }

      &_over {
        box-shadow: inset 0 2px 0 var(--color-primary);
      }
    }

    &__name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &__size {
      margin-left: var(--space-sm);
      flex-shrink: 0;
      font-size: 10px;
      color: var(--color-muted);
    }

    &__empty {
      padding: var(--space-md);
      text-align: center;
      font-size: 10px;
      color: var(--color-muted);
    }
  }
</style>
