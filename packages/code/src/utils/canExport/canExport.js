/**
 * Returns true if the node supports exportAsync.
 * @param {SceneNode} node
 * @returns {boolean}
 */
function canExport(node) {
  return typeof node.exportAsync === 'function';
}

export default canExport;
