<script>
  import ScrubHandle from '../ScrubHandle/index.js';

  /**
   * @typedef {Object} Props
   * @property {string} [value]
   * @property {string} [placeholder]
   * @property {string} [prefix]
   * @property {number} [step=1]
   * @property {number} [min=0]
   * @property {boolean} [scrub=true]
   * @property {string|null} [padLeft]
   * @property {(val: string) => void} [oninput]
   * @property {(val: number) => void} [onscrub]
   */

  /** @type {Props} */
  let {
    value = $bindable(''),
    placeholder = '',
    prefix = '',
    step = 1,
    min = 0,
    scrub = true,
    padLeft = null,
    oninput,
    onscrub,
  } = $props();

  /** @param {Event & { currentTarget: HTMLInputElement }} e */
  function handleInput(e) {
    value = e.currentTarget.value;
    oninput?.(value);
  }

  /** @param {number} next */
  function handleScrub(next) {
    const rounded = step >= 1 ? Math.round(next) : next;
    value = String(rounded);
    onscrub?.(rounded);
    oninput?.(value);
  }
</script>

<div class="field">
  {#if scrub && prefix}
    <span class="field__prefix">
      <ScrubHandle {value} {step} {min} onscrub={handleScrub}>
        <span class="field__prefix-label">{prefix}</span>
      </ScrubHandle>
    </span>
  {:else if prefix}
    <span class="field__prefix-static">{prefix}</span>
  {/if}
  <input
    type="text"
    {value}
    {placeholder}
    style:padding-left={padLeft ?? (prefix ? '24px' : '6px')}
    oninput={handleInput}
  />
</div>

<style>
  .field {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
    height: 24px;
    background-color: var(--bg-field);
    border: 1px solid transparent;
    border-radius: var(--radius-ui);

    &:hover {
      background-color: var(--bg-field-hover);
      border-color: var(--border-color);
    }

    &:focus-within {
      border-color: var(--border-focus);
    }

    &__prefix {
      position: absolute;
      top: 0;
      left: 0;
      z-index: 1;
    }

    &__prefix-label,
    &__prefix-static {
      font-size: 10px;
      font-weight: 500;
      color: var(--color-muted);
    }

    &__prefix-static {
      position: absolute;
      top: 0;
      left: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      pointer-events: none;
    }

    & input {
      width: 100%;
      height: 100%;
      padding: 0 4px 0 24px;
      border: none;
      background: transparent;
      outline: none;
      font-size: 11px;
      font-family: var(--font-main);
      color: var(--color-text);
    }
  }
</style>
