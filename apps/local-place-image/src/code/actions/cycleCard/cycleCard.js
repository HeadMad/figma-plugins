import sendToUi from '@code/utils/sendToUi';
import * as state from '../../state.js';

/**
 * Move top clipboard image to the bottom of the stack.
 * @returns {Promise<{ ok: boolean }>}
 */
async function cycleCard() {
  if (state.clipboardImages.length > 1) {
    const imgs = [...state.clipboardImages];
    const top = imgs.pop();
    imgs.unshift(top);
    state.setClipboard(imgs);

    const base64Array = [];
    for (const img of imgs) {
      try {
        const bytes = await img.getBytesAsync();
        base64Array.push(figma.base64Encode(bytes));
      } catch (_) {}
    }
    sendToUi('render-stack', { images: base64Array });
    if (state.isPlacingMode) sendToUi('status-copied', {});
  }
  return { ok: true };
}

export default cycleCard;
