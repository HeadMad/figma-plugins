import sendToUi from '@code/utils/sendToUi';
import * as state from '../../state.js';

/**
 * Enter placing mode: next single-node selection receives the top clipboard image.
 * @returns {{ ok: boolean }}
 */
function activatePlacing() {
  state.setPlacingMode(true);
  state.setChronologicalIds([]);
  figma.currentPage.selection = [];
  sendToUi('status-copied', {});
  return { ok: true };
}

export default activatePlacing;
