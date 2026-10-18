import sendToUi from '@code/utils/sendToUi';

/**
 * Load all fonts used inside a node tree.
 * @param {SceneNode} root
 */
async function loadFonts(root) {
  const fonts = new Set();
  const texts =
    root.type === 'TEXT'
      ? [root]
      : root.findAll
        ? root.findAll((n) => n.type === 'TEXT')
        : [];

  for (const t of texts) {
    if (t.fontName !== figma.mixed) {
      fonts.add(JSON.stringify(t.fontName));
    } else {
      for (let i = 0; i < t.characters.length; i++) {
        const fn = t.getRangeFontName(i, i + 1);
        if (fn !== figma.mixed) fonts.add(JSON.stringify(fn));
      }
    }
  }
  await Promise.all(
    [...fonts].map((s) => figma.loadFontAsync(JSON.parse(s)).catch(() => {}))
  );
}

/**
 * Clone node on top of original and flatten text to vectors.
 * @param {SceneNode} original
 * @returns {Promise<SceneNode|null>}
 */
async function outlineClone(original) {
  const hasText =
    original.type === 'TEXT' ||
    (original.findOne && original.findOne((n) => n.type === 'TEXT'));
  if (!hasText) return null;

  const clone = original.clone();
  clone.name = '__tmp';
  clone.x = original.x;
  clone.y = original.y;

  await loadFonts(clone);

  const texts =
    clone.type === 'TEXT'
      ? [clone]
      : clone.findAll
        ? clone.findAll((n) => n.type === 'TEXT')
        : [];

  for (const t of texts) {
    try {
      if (t.parent) figma.flatten([t], t.parent);
    } catch (_) {}
  }

  if (clone.removed) return null;
  return clone;
}

/**
 * Export selection to PDF/JPG pages with optional font outlining.
 * @param {{ mode?: string, merge?: boolean, outline?: boolean, order?: string[] }} msg
 * @returns {Promise<object>}
 */
async function printExport(msg) {
  const sel = figma.currentPage.selection.filter(
    (n) => typeof n.exportAsync === 'function' && n.visible !== false
  );
  const byId = Object.fromEntries(sel.map((n) => [n.id, n]));
  let ordered = (msg.order || []).map((id) => byId[id]).filter(Boolean);
  if (!ordered.length) ordered = sel;

  if (!ordered.length) {
    return { ok: false, error: 'Select at least one object' };
  }

  const mode = msg.mode || 'flatten';
  const merge = msg.merge !== false;
  const outline = !!msg.outline;
  const temps = [];
  const pages = [];

  try {
    for (let i = 0; i < ordered.length; i++) {
      const original = ordered[i];
      sendToUi('pdf-progress', { current: i + 1, total: ordered.length });

      let node = original;
      if (mode === 'vector' && outline) {
        const clone = await outlineClone(original);
        if (clone) {
          node = clone;
          temps.push(clone);
        }
      }
      if (node.removed) node = original;

      const isFlatten = mode === 'flatten';
      const bytes = await node.exportAsync(
        isFlatten
          ? { format: 'JPG', constraint: { type: 'SCALE', value: 1 }, contentsOnly: true }
          : { format: 'PDF', contentsOnly: true }
      );

      pages.push({
        name: original.name || original.type,
        bytes,
        isImage: isFlatten,
        format: isFlatten ? 'JPG' : 'PDF',
        width: original.width,
        height: original.height,
      });
    }

    temps.forEach((c) => {
      try {
        if (!c.removed) c.remove();
      } catch (_) {}
    });

    return {
      ok: true,
      pages,
      merge,
      pageName: figma.currentPage.name || 'Page',
    };
  } catch (err) {
    temps.forEach((c) => {
      try {
        if (!c.removed) c.remove();
      } catch (_) {}
    });
    return { ok: false, error: err.message || 'Export error' };
  }
}

export default printExport;
