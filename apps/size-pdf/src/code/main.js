import { sendToUi, createRpcRouter } from '@pkg/code';
import * as sharedActions from '@pkg/code/actions';

// Merge shared actions with any plugin-local unique actions (src/code/actions)
import * as localActions from './actions/index.js';

const WINDOW_WIDTH = 200;
const HEIGHT_CONVERTER = 155;

const actions = { ...sharedActions, ...localActions };

figma.showUI(__html__, {
  width: WINDOW_WIDTH,
  height: HEIGHT_CONVERTER,
  themeColors: true,
});

createRpcRouter(actions);

/**
 * Pushes selection metrics stream event to UI.
 */
function pushSelection() {
  if (typeof actions.getSelectionMetrics === 'function') {
    sendToUi('selectionchange', actions.getSelectionMetrics());
  }
}

figma.on('selectionchange', pushSelection);
pushSelection();
