import { sendToUi, createRpcRouter } from '@code';
import * as sharedActions from '@code/actions';
import * as localActions from './actions/index.js';

const actions = { ...sharedActions, ...localActions };

figma.showUI(__html__, { width: 280, height: 480, themeColors: true });
createRpcRouter(actions);

function sendSelection() {
  const nodes = figma.currentPage.selection
    .filter((n) => typeof n.exportAsync === 'function' && n.visible !== false)
    .map((n, i) => ({
      id: n.id,
      name: n.name || `${n.type} ${i + 1}`,
      w: Math.round(n.width),
      h: Math.round(n.height),
    }));
  sendToUi('selectionchange', {
    nodes,
    pageName: figma.currentPage.name || 'Page',
  });
}

figma.on('selectionchange', sendSelection);
sendSelection();
