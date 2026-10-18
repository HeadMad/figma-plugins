<script>
  /**
   * @typedef {Object} Props
   * @property {string} [title]
   * @property {boolean} [active=false]
   * @property {boolean} [loading=false]
   * @property {(e: MouseEvent) => void} [onclick]
   * @property {import('svelte').Snippet} [children]
   */

  /** @type {Props} */
  let {
    title = '',
    active = false,
    loading = false,
    onclick,
    children,
  } = $props();
</script>

<button type="button" class="icon-btn" class:icon-btn_active={active} class:icon-btn_loading={loading} {title} {onclick}>
  {@render children?.()}
</button>

<style>
  .icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    border: 1px solid transparent;
    border-radius: var(--radius-ui);
    background: transparent;
    cursor: pointer;
    --color-icon: var(--color-muted);

    &:hover {
      background-color: var(--bg-field);
    }

    &_active {
      --color-icon: var(--color-primary);
      border-color: var(--color-primary-light);
      background-color: var(--color-primary-light);
    }

    &_loading {
      opacity: 0.55;
      pointer-events: none;
    }

    & :global(svg) {
      width: 24px;
      height: 24px;
    }
  }
</style>
