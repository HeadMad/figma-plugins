<script>
  /**
   * @typedef {{ value: string, label: string }} RadioOption
   * @typedef {Object} Props
   * @property {string} name
   * @property {string} [value]
   * @property {RadioOption[]} [options]
   * @property {(val: string) => void} [onchange]
   */

  /** @type {Props} */
  let {
    name,
    value = $bindable(''),
    options = [],
    onchange,
  } = $props();

  /** @param {string} v */
  function select(v) {
    value = v;
    onchange?.(v);
  }
</script>

<div class="radio-group">
  {#each options as opt}
    <div
      class="radio-group__option"
      role="radio"
      aria-checked={value === opt.value}
      tabindex="0"
      onclick={() => select(opt.value)}
      onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') select(opt.value); }}
    >
      <input type="radio" {name} value={opt.value} checked={value === opt.value} tabindex="-1" />
      <span class="radio-group__dot"></span>
      <span class="radio-group__label">{opt.label}</span>
    </div>
  {/each}
</div>

<style>
  .radio-group {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px 8px;

    &__option {
      display: flex;
      align-items: center;
      gap: 5px;
      height: 20px;
      cursor: pointer;
      font-size: 11px;
    }

    & input {
      display: none;
    }

    &__dot {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 12px;
      height: 12px;
      border: 1.5px solid var(--color-muted);
      border-radius: 50%;
      flex-shrink: 0;
    }

    & input:checked + .radio-group__dot {
      border-color: var(--color-primary);
    }

    & input:checked + .radio-group__dot::after {
      content: '';
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--color-primary);
    }
  }
</style>
