/**
 * Returns individual corner radii for a node.
 * @param {SceneNode} node
 * @returns {{ tl: number, tr: number, br: number, bl: number }}
 */
function radiiOf(node) {
  return {
    tl: 'topLeftRadius' in node ? node.topLeftRadius : 0,
    tr: 'topRightRadius' in node ? node.topRightRadius : 0,
    br: 'bottomRightRadius' in node ? node.bottomRightRadius : 0,
    bl: 'bottomLeftRadius' in node ? node.bottomLeftRadius : 0,
  };
}

export default radiiOf;
