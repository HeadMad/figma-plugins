<script>
  /**
   * @typedef {Object} Props
   * @property {number} [value]
   * @property {number} [min=1]
   * @property {number} [max=100]
   * @property {number} [step=1]
   */

  /** @type {Props} */
  let {
    value = $bindable(1),
    min = 1,
    max = 100,
    step = 1,
  } = $props();

  function increment() {
    if (value + step <= max) value += step;
  }

  function decrement() {
    if (value - step >= min) value -= step;
  }

  /** @param {Event & { currentTarget: HTMLInputElement }} e */
  function handleInput(e) {
    const parsed = parseInt(e.currentTarget.value, 10);
    if (Number.isNaN(parsed)) return;
    if (parsed < min) value = min;
    else if (parsed > max) value = max;
    else value = parsed;
  }
</script>

<div class="number-input">
  <button type="button" class="number-input__btn" onclick={decrement} disabled={value <= min}>−</button>
  <input type="text" value={value} oninput={handleInput} />
  <button type="button" class="number-input__btn" onclick={increment} disabled={value >= max}>+</button>
</div>

<style>
  .number-input {
    display: inline-flex;
    align-items: center;
    width: 90px;
    height: 24px;
    overflow: hidden;
    border: 1px solid var(--figma-color-border);
    border-radius: var(--radius-medium);
    background-color: var(--figma-color-bg-secondary);

    &:focus-within {
      border-color: var(--figma-color-border-selected);
      background-color: var(--figma-color-bg-primary);
    }

    & input {
      flex-grow: 1;
      width: 34px;
      height: 100%;
      padding: 0 !important;
      border: none !important;
      background: transparent !important;
      font-family: var(--font-stack);
      font-size: var(--font-size-default);
      color: var(--figma-color-text);
      text-align: center;
      outline: none;
    }

    &__btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 100%;
      padding: 0;
      border: none;
      border-radius: 0;
      background: transparent !important;
      font-size: 13px;
      font-weight: normal;
      color: var(--figma-color-text);
      cursor: pointer;
      transition: background-color 0.1s ease;

      &:hover:not(:disabled) {
        background-color: var(--figma-color-bg-secondary-hover) !important;
      }

      &:disabled {
        opacity: 0.4;
        cursor: default;
      }
    }
  }
</style>
