import sendToUi from '@code/utils/sendToUi';
import * as state from '../../state.js';

/**
 * Remove the top image from the clipboard stack.
 * @returns {Promise<{ ok: boolean }>}
 */
async function deleteCard() {
  if (state.clipboardImages.length > 0) {
    const imgs = [...state.clipboardImages];
    imgs.pop();
    state.setClipboard(imgs);

    if (imgs.length === 0) {
      state.setPlacingMode(false);
      sendToUi('render-stack', { images: [] });
    } else {
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
  }
  return { ok: true };
}

export default deleteCard;
