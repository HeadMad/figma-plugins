/**
 * Merges previous ordered ids with an incoming list: keeps old order, appends new.
 * @param {string[]} prevIds
 * @param {Array<{id: string}>} incoming
 * @returns {Array<{id: string}>}
 */
function mergeSelectionOrder(prevIds, incoming) {
  const next = [];
  for (const id of prevIds) {
    const found = incoming.find((n) => n.id === id);
    if (found) next.push(found);
  }
  for (const n of incoming) {
    if (!prevIds.includes(n.id)) next.push(n);
  }
  return next;
}

export default mergeSelectionOrder;
