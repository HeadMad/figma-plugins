<script>
  /**
   * @typedef {Object} Props
   * @property {number|string} [value=0]
   * @property {number} [step=1]
   * @property {number} [min]
   * @property {boolean} [disabled=false]
   * @property {(next: number) => void} [onscrub]
   * @property {import('svelte').Snippet} [children]
   */

  /** @type {Props} */
  let {
    value = 0,
    step = 1,
    min = -Infinity,
    disabled = false,
    onscrub,
    children,
  } = $props();

  let dragging = $state(false);

  /**
   * @param {PointerEvent} e
   */
  function onPointerDown(e) {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    dragging = true;
    const startX = e.clientX;
    const startVal = parseFloat(/** @type {any} */ (value)) || 0;

    /** @param {PointerEvent} ev */
    const onMove = (ev) => {
      let next = startVal + (ev.clientX - startX) * step;
      if (next < min) next = min;
      onscrub?.(next);
    };

    const onUp = () => {
      dragging = false;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }
</script>

<span class="scrub" class:dragging role="presentation" onpointerdown={onPointerDown}>
  {@render children?.()}
</span>

<style>
  .scrub {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    color: var(--color-muted);
    font-size: 10px;
    font-weight: 500;
    cursor: ew-resize;
    user-select: none;
    flex-shrink: 0;

    &:active,
    &.dragging {
      color: var(--color-primary);
    }
  }
</style>
