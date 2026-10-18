<script>
  import clickOutside from '../../utils/clickOutside/index.js';

  /**
   * @typedef {Object} Props
   * @property {import('svelte').Snippet} [children] - Trigger markup
   * @property {import('svelte').Snippet<[ { close: () => void } ]>} [content] - Menu body; receives { close }
   */

  /** @type {Props} */
  let { children, content } = $props();

  let isOpen = $state(false);

  function close() {
    isOpen = false;
  }

  /** @param {MouseEvent} e */
  function toggle(e) {
    e.stopPropagation();
    isOpen = !isOpen;
  }
</script>

<div class="menu-popover">
  <div class="menu-popover__trigger" onclick={toggle} role="presentation">
    {@render children?.()}
  </div>

  {#if isOpen}
    <div class="menu-popover__menu" {@attach clickOutside(close)}>
      {@render content?.({ close })}
    </div>
  {/if}
</div>

<style>
  .menu-popover {
    position: relative;
    display: inline-block;
    width: auto;

    &__trigger {
      display: inline-block;
      width: auto;
    }

    &__menu {
      position: absolute;
      top: calc(100% + 4px);
      right: 0;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      min-width: 140px;
      max-width: 200px;
      padding: var(--spacing-xs);
      border: 1px solid var(--figma-color-border);
      border-radius: var(--radius-large);
      background: var(--figma-color-bg-primary);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.04);
      animation: menu-popover-in 0.1s ease-out forwards;
    }
  }

  @keyframes menu-popover-in {
    from { opacity: 0; transform: translateY(-4px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>
