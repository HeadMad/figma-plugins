/**
 * Aggregates selection metrics for the Size PDF UI.
 * @returns {Object}
 */
function getSelectionMetrics() {
  const selection = figma.currentPage.selection;

  if (!selection.length) {
    return { ok: true, hasSelection: false, items: [] };
  }

  const strokeOf = (n) =>
    'strokes' in n && n.strokes.length ? n.strokeWeight || 0 : 0;
  const radiiOf = (n) => ({
    tl: 'topLeftRadius' in n ? n.topLeftRadius : 0,
    tr: 'topRightRadius' in n ? n.topRightRadius : 0,
    br: 'bottomRightRadius' in n ? n.bottomRightRadius : 0,
    bl: 'bottomLeftRadius' in n ? n.bottomLeftRadius : 0,
  });

  const items = selection.map((n, i) => ({
    id: n.id,
    name: n.name || `${n.type} ${i + 1}`,
    w: Math.round(n.width),
    h: Math.round(n.height),
  }));

  const first = selection[0];
  let w = first.width;
  let h = first.height;
  let s = strokeOf(first);
  let r = 'cornerRadius' in first ? first.cornerRadius : 0;
  const ind = radiiOf(first);
  let mixedW = false;
  let mixedH = false;
  let mixedS = false;
  let mixedR = false;

  for (let i = 1; i < selection.length; i++) {
    const n = selection[i];
    if (n.width !== w) mixedW = true;
    if (n.height !== h) mixedH = true;
    if (strokeOf(n) !== s) mixedS = true;
    const cr = 'cornerRadius' in n ? n.cornerRadius : 0;
    if (cr !== r || cr === figma.mixed) mixedR = true;
    const ri = radiiOf(n);
    if (ri.tl !== ind.tl) ind.tl = 'mixed';
    if (ri.tr !== ind.tr) ind.tr = 'mixed';
    if (ri.br !== ind.br) ind.br = 'mixed';
    if (ri.bl !== ind.bl) ind.bl = 'mixed';
  }

  if (
    ind.tl === 'mixed' || ind.tr === 'mixed' ||
    ind.br === 'mixed' || ind.bl === 'mixed' ||
    ind.tl !== ind.tr || ind.tl !== ind.br || ind.tl !== ind.bl ||
    r === figma.mixed
  ) {
    mixedR = true;
  }

  return {
    ok: true,
    hasSelection: true,
    items,
    width: mixedW ? 'mixed' : w,
    height: mixedH ? 'mixed' : h,
    radius: mixedR ? 'mixed' : r,
    rIndividual: ind,
    strokeWeight: mixedS ? 'mixed' : s,
    constrainProportions:
      'constrainProportions' in first ? first.constrainProportions : false,
  };
}

export default getSelectionMetrics;
