<script>
  /**
   * @typedef {Object} Props
   * @property {boolean} [disabled=false]
   * @property {(e: MouseEvent) => void} [onclick]
   * @property {import('svelte').Snippet} [children]
   */

  /** @type {Props} */
  let {
    disabled = false,
    onclick,
    children,
  } = $props();
</script>

<button type="button" class="primary-btn" {disabled} {onclick}>
  {@render children?.()}
</button>

<style>
  .primary-btn {
    width: 100%;
    height: 28px;
    border: none;
    border-radius: var(--radius-ui);
    background: var(--color-primary);
    font-size: 11px;
    font-weight: 600;
    font-family: var(--font-main);
    color: #fff;
    cursor: pointer;

    &:hover:not(:disabled) {
      opacity: 0.9;
    }

    &:disabled {
      opacity: 0.5;
      cursor: default;
    }
  }
</style>
