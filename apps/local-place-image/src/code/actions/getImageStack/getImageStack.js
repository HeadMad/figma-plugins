import sendToUi from '@pkg/code/utils/sendToUi';
import * as state from '../../state.js';

/**
 * Rebuild clipboard from chronological selection and push previews to UI.
 * @returns {Promise<{ ok: boolean, count: number }>}
 */
async function getImageStack() {
  if (state.isPlacingMode) {
    return { ok: true, count: state.clipboardImages.length };
  }

  const currentSelection = figma.currentPage.selection;
  const currentIds = currentSelection.map((n) => n.id);

  let ids = state.chronologicalSelectionIds.filter((id) => currentIds.includes(id));
  for (const id of currentIds) {
    if (!ids.includes(id)) ids.push(id);
  }
  state.setChronologicalIds(ids);

  const images = [];
  for (const id of ids) {
    const node = figma.getNodeById(id);
    if (node && 'fills' in node && Array.isArray(node.fills)) {
      for (const fill of node.fills) {
        if (fill.type === 'IMAGE' && fill.imageHash) {
          const image = figma.getImageByHash(fill.imageHash);
          if (image) images.push(image);
        }
      }
    }
  }
  state.setClipboard(images);

  const base64Array = [];
  for (const img of images) {
    try {
      const bytes = await img.getBytesAsync();
      base64Array.push(figma.base64Encode(bytes));
    } catch (_) {}
  }

  sendToUi('render-stack', { images: base64Array });
  return { ok: true, count: images.length };
}

export default getImageStack;
