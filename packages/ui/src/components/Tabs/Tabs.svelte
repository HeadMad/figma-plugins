<script module>
  import { Super, SuperContent } from 'svelte-super';
  /** Tab panel primitive — place as child of Tabs with an `id` prop. */
  export const Tab = SuperContent;
</script>

<script>
  /**
   * @typedef {Object} Props
   * @property {import('svelte').Snippet} [children]
   */

  /** @type {Props} */
  let { children: content } = $props();
</script>

<Super>
  {#snippet children({ select, open, close, toggle, isActive, controls })}
    <div class="tabs">
      {#each controls as { id, active }}
        <button
          type="button"
          class="tabs__button"
          class:tabs__button_active={active}
          onclick={() => select(id)}
        >
          {id}
        </button>
      {/each}
    </div>
    {@render content?.({ select, open, close, toggle, isActive, controls })}
  {/snippet}
</Super>

<style>
  .tabs {
    display: flex;
    width: 100%;
    height: 32px;
    padding: 2px;
    gap: 2px;
    border: 1px solid var(--figma-color-border);
    border-radius: var(--radius-medium);
    background-color: var(--figma-color-bg-secondary);

    &__button {
      display: flex;
      flex: 1;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 0 !important;
      border: none !important;
      border-radius: calc(var(--radius-medium) - 2px) !important;
      background: transparent !important;
      font-family: var(--font-stack);
      font-size: var(--font-size-default);
      font-weight: 500;
      color: var(--figma-color-text-tertiary) !important;
      cursor: pointer;
      transition: all 0.1s ease;

      &:hover {
        background-color: var(--figma-color-bg-secondary-hover) !important;
        color: var(--figma-color-text) !important;
      }

      &_active {
        background-color: var(--figma-color-bg-primary) !important;
        color: var(--figma-color-text) !important;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
    }
  }
</style>
