<script>
  /**
   * @typedef {Object} Props
   * @property {boolean} [open]
   * @property {string} [width='124px']
   * @property {string} [top='34px']
   * @property {string} [right='8px']
   * @property {import('svelte').Snippet} [children]
   */

  /** @type {Props} */
  let {
    open = $bindable(false),
    width = '124px',
    top = '34px',
    right = '8px',
    children,
  } = $props();
</script>

{#if open}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="popover" style:width style:top style:right onclick={(e) => e.stopPropagation()}>
    {@render children?.()}
  </div>
{/if}

<style>
  .popover {
    position: absolute;
    z-index: 100;
    padding: 10px 12px;
    background: var(--bg-main);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-ui);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
    box-sizing: border-box;
  }
</style>
