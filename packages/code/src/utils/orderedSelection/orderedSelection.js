import canExport from '../canExport/index.js';

/**
 * Builds an ordered exportable selection honouring optional id order.
 * @param {readonly SceneNode[]} selection
 * @param {string[]} [orderIds]
 * @returns {SceneNode[]}
 */
function orderedSelection(selection, orderIds) {
  const exportable = selection.filter(canExport);
  if (!orderIds || !orderIds.length) return exportable;
  const byId = Object.fromEntries(exportable.map((n) => [n.id, n]));
  const ordered = orderIds.map((id) => byId[id]).filter(Boolean);
  return ordered.length ? ordered : exportable;
}

export default orderedSelection;
