<script>
  import MenuPopover from '../MenuPopover/index.js';

  /**
   * @typedef {{ id: string, label: string }} DropdownOption
   * @typedef {Object} Props
   * @property {DropdownOption[]} [options]
   * @property {string} [value]
   */

  /** @type {Props} */
  let {
    options = [],
    value = $bindable(),
  } = $props();

  const selectedLabel = $derived(
    options.find((opt) => opt.id === value)?.label || 'Выберите...'
  );
</script>

<MenuPopover>
  <button type="button" class="dropdown-trigger">
    <span class="dropdown-trigger__text">{selectedLabel}</span>
    <span class="dropdown-trigger__arrow">▾</span>
  </button>

  {#snippet content({ close })}
    <div class="dropdown-menu-list">
      {#each options as option}
        <button
          type="button"
          class="menu-item"
          class:is-selected={value === option.id}
          onclick={() => {
            value = option.id;
            close();
          }}
        >
          {option.label}
        </button>
      {/each}
    </div>
  {/snippet}
</MenuPopover>

<style>
  .dropdown-trigger {
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    width: 110px !important;
    height: 24px !important;
    padding: 0 6px !important;
    border: 1px solid var(--figma-color-border) !important;
    border-radius: var(--radius-medium) !important;
    background-color: var(--figma-color-bg-secondary) !important;
    font-family: var(--font-stack);
    font-size: var(--font-size-default);
    font-weight: normal !important;
    color: var(--figma-color-text) !important;
    cursor: pointer;
    transition: border-color 0.1s ease;

    &:hover {
      border-color: var(--figma-color-text-tertiary) !important;
    }

    &__text {
      overflow: hidden;
      padding-right: 4px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &__arrow {
      font-size: 10px;
      color: var(--figma-color-text-tertiary);
    }
  }

  .dropdown-menu-list {
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  :global(.menu-item.is-selected) {
    font-weight: 600;
    color: var(--figma-color-bg-brand) !important;
    background-color: rgba(12, 140, 233, 0.05) !important;
  }
</style>
