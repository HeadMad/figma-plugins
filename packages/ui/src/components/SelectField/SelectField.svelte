<script>
  /**
   * @typedef {{ value: string, label: string }|string} Option
   * @typedef {Object} Props
   * @property {string} [value]
   * @property {Option[]} [options]
   * @property {(val: string) => void} [onchange]
   */

  /** @type {Props} */
  let {
    value = $bindable(''),
    options = [],
    onchange,
  } = $props();

  /** @param {Event & { currentTarget: HTMLSelectElement }} e */
  function handleChange(e) {
    value = e.currentTarget.value;
    onchange?.(value);
  }
</script>

<div class="select-field">
  <select {value} onchange={handleChange}>
    {#each options as opt}
      <option value={typeof opt === 'string' ? opt : opt.value}>
        {typeof opt === 'string' ? opt : opt.label}
      </option>
    {/each}
  </select>
</div>

<style>
  .select-field {
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

    & select {
      width: 100%;
      height: 100%;
      padding: 0 14px 0 6px;
      border: none;
      background: transparent;
      outline: none;
      font-size: 11px;
      font-family: var(--font-main);
      color: var(--color-text);
      cursor: pointer;
      -webkit-appearance: none;
      background-image: url('data:image/svg+xml;utf8,<svg width="6" height="4" viewBox="0 0 6 4" fill="none" xmlns="http://www.w3.org"><path d="M1 1L3 3L5 1" stroke="black" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/></svg>');
      background-repeat: no-repeat;
      background-position: right 7px center;
      background-size: 6px 4px;
    }
  }
</style>
