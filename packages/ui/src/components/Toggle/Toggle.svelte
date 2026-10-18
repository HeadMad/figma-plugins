<script>
  /**
   * @typedef {Object} Props
   * @property {boolean} [checked]
   */

  /** @type {Props} */
  let { checked = $bindable(false) } = $props();
</script>

<div class="toggle">
  <input type="checkbox" bind:checked />
  <span class="toggle__slider"></span>
</div>

<style>
  .toggle {
    position: relative;
    display: inline-block;
    width: 24px;
    height: 12px;
    user-select: none;

    & input {
      position: absolute;
      width: 0;
      height: 0;
      opacity: 0;
    }

    &__slider {
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      border-radius: 6px;
      background-color: var(--figma-color-bg-brand-hover);
      transition: background-color 0.15s ease;

      &::before {
        content: '';
        position: absolute;
        bottom: 1px;
        left: 1px;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background-color: #ffffff;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        transition: transform 0.15s ease;
      }
    }

    & input:checked + .toggle__slider {
      background-color: var(--figma-color-bg-brand);
    }

    & input:checked + .toggle__slider::before {
      transform: translateX(12px);
    }
  }
</style>
