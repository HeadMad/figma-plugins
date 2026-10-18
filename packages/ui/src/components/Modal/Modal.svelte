<script module>
  /** @type {any} */
  let activeModal = $state(null);

  /**
   * @param {Object} config
   * @param {string} config.title
   * @param {string} [config.description]
   * @param {import('svelte').Snippet} [config.snippet]
   * @param {import('svelte').Component} [config.component]
   * @param {Object} [config.componentProps]
   * @param {Array<{label: string, variant?: string, onClick: (close: Function) => void}>} config.buttons
   */
  export function showModal(config) {
    activeModal = { id: Math.random().toString(36).substring(2, 9), ...config };
  }

  export function closeModal() {
    activeModal = null;
  }
</script>

{#if activeModal}
  <div class="modal-backdrop" onclick={closeModal} role="presentation">
    <div class="modal" onclick={(e) => e.stopPropagation()} role="presentation">
      <h3 class="modal__title">{activeModal.title}</h3>
      <div class="modal__content">
        {#if activeModal.description}
          <p class="modal__desc text-muted">{activeModal.description}</p>
        {/if}
        {#if activeModal.snippet}
          {@render activeModal.snippet(closeModal)}
        {/if}
        {#if activeModal.component}
          <activeModal.component close={closeModal} {...activeModal.componentProps} />
        {/if}
      </div>
      <div class="modal__actions">
        {#each activeModal.buttons as btn}
          <button type="button" class={btn.variant || 'secondary'} onclick={() => btn.onClick(closeModal)}>
            {btn.label}
          </button>
        {/each}
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    background: rgba(0, 0, 0, 0.4);
  }

  .modal {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
    padding: 16px;
    border-radius: var(--radius-large);
    background: var(--figma-color-bg-primary);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    animation: modal-in 0.12s cubic-bezier(0.16, 1, 0.3, 1) forwards;

    &__title {
      font-size: var(--font-size-large);
      font-weight: 600;
    }

    &__content {
      display: flex;
      flex-direction: column;
      width: 100%;
    }

    &__desc {
      line-height: 14px;
    }

    &__actions {
      display: flex;
      gap: 8px;
      margin-top: 4px;

      & button {
        flex: 1;
      }
    }
  }

  @keyframes modal-in {
    from { transform: scale(0.95); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
</style>
