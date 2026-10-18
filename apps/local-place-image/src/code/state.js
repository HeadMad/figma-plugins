/** @type {Image[]} */
export let clipboardImages = [];
export let isPlacingMode = false;
/** @type {string[]} */
export let chronologicalSelectionIds = [];

export function setPlacingMode(v) {
  isPlacingMode = v;
}
export function setClipboard(imgs) {
  clipboardImages = imgs;
}
export function setChronologicalIds(ids) {
  chronologicalSelectionIds = ids;
}
