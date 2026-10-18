/**
 * Applies width/height/radius/stroke from UI to the current selection.
 * @param {Object} msg
 * @returns {{ ok: boolean }}
 */
function applyLayout(msg) {
  const selection = figma.currentPage.selection;
  if (!selection.length) return { ok: false, error: 'No selection' };

  for (const node of selection) {
    if ('constrainProportions' in node) {
      node.constrainProportions = !!msg.constrainProportions;
    }

    const nW = msg.width != null && msg.width !== 'mixed' ? msg.width : node.width;
    const nH = msg.height != null && msg.height !== 'mixed' ? msg.height : node.height;
    if ('resize' in node) node.resize(nW, nH);

    if (msg.isMainRadiusChanged) {
      if (msg.radius != null && msg.radius !== 'mixed' && 'cornerRadius' in node) {
        node.cornerRadius = msg.radius;
      }
    } else if (msg.radiusIndividual) {
      const ri = msg.radiusIndividual;
      if ('topLeftRadius' in node && ri.tl != null && ri.tl !== 'mixed') node.topLeftRadius = ri.tl;
      if ('topRightRadius' in node && ri.tr != null && ri.tr !== 'mixed') node.topRightRadius = ri.tr;
      if ('bottomRightRadius' in node && ri.br != null && ri.br !== 'mixed') node.bottomRightRadius = ri.br;
      if ('bottomLeftRadius' in node && ri.bl != null && ri.bl !== 'mixed') node.bottomLeftRadius = ri.bl;
    }

    if (msg.strokeWeight != null && msg.strokeWeight !== 'mixed' && 'strokeWeight' in node) {
      if (msg.strokeWeight > 0 && 'strokes' in node && node.strokes.length === 0) {
        node.strokes = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];
      }
      node.strokeWeight = msg.strokeWeight;
    }
  }

  return { ok: true };
}

export default applyLayout;
