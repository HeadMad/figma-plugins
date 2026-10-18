<script module>
  /** @type {Array<{id: string, message: string, type: string, timer: any}>} */
  let toastQueue = $state([]);

  /**
   * @param {string} message
   * @param {'info'|'success'|'error'} [type='info']
   * @param {number} [duration=3000]
   */
  export function showToast(message, type = 'info', duration = 3000) {
    const id = Math.random().toString(36).substring(2, 9);
    const timer = setTimeout(() => closeToast(id), duration);
    toastQueue.push({ id, message, type, timer });
  }

  /** @param {string} id */
  function closeToast(id) {
    const target = toastQueue.find((t) => t.id === id);
    if (target) {
      clearTimeout(target.timer);
      toastQueue = toastQueue.filter((t) => t.id !== id);
    }
  }
</script>

<div class="toast-provider">
  {#each toastQueue as toast (toast.id)}
    <div class="toast toast_{toast.type}">
      <span class="toast__message">{toast.message}</span>
      <button type="button" class="toast__close" onclick={() => closeToast(toast.id)} aria-label="Close">×</button>
    </div>
  {/each}
</div>

<style>
  .toast-provider {
    position: fixed;
    top: 12px;
    right: 16px;
    left: 16px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 6px;
    pointer-events: none;
  }

  .toast {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border-radius: var(--radius-medium);
    font-size: var(--font-size-small);
    color: #ffffff;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    pointer-events: auto;
    animation: toast-in 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards;

    &_info { background-color: var(--figma-color-bg-brand); }
    &_success { background-color: var(--figma-color-bg-success); }
    &_error { background-color: var(--figma-color-bg-danger); }

    &__message {
      flex-grow: 1;
      padding-right: 8px;
      line-height: 14px;
    }

    &__close {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      padding: 0;
      border: none;
      background: transparent;
      font-size: 16px;
      line-height: 12px;
      color: rgba(255, 255, 255, 0.7);
      cursor: pointer;

      &:hover { color: #ffffff; }
    }
  }

  @keyframes toast-in {
    from { transform: translateY(-8px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
</style>
