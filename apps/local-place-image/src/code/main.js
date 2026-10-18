import { sendToUi, createRpcRouter } from '@code';
import * as sharedActions from '@code/actions';
import * as localActions from './actions/index.js';
import * as state from './state.js';

const actions = { ...sharedActions, ...localActions };

figma.showUI(__html__, { width: 260, height: 280, themeColors: true });
createRpcRouter(actions);

figma.on('selectionchange', async () => {
  if (!state.isPlacingMode) {
    await actions.getImageStack();
    return;
  }

  const currentSelection = figma.currentPage.selection;
  if (currentSelection.length === 1 && state.clipboardImages.length > 0) {
    const targetNode = currentSelection[0];
    if ('fills' in targetNode) {
      const imgs = [...state.clipboardImages];
      const currentImage = imgs.pop();
      state.setClipboard(imgs);

      targetNode.fills = [
        {
          type: 'IMAGE',
          scaleMode: 'FILL',
          imageHash: currentImage.hash,
        },
      ];

      const base64Array = [];
      for (const img of imgs) {
        try {
          const bytes = await img.getBytesAsync();
          base64Array.push(figma.base64Encode(bytes));
        } catch (_) {}
      }
      sendToUi('render-stack', { images: base64Array });

      if (imgs.length === 0) {
        state.setPlacingMode(false);
        figma.notify('Все изображения успешно перенесены!');
      } else {
        sendToUi('status-copied', {});
      }
    }
  }
});

actions.getImageStack();
