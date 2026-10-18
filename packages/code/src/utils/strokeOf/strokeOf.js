/**
 * Returns stroke weight if the node has strokes, otherwise 0.
 * @param {SceneNode} node
 * @returns {number}
 */
function strokeOf(node) {
  return 'strokes' in node && node.strokes.length ? node.strokeWeight || 0 : 0;
}

export default strokeOf;
