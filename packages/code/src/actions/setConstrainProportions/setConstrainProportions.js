/**
 * Sets constrainProportions on the current selection.
 * @param {{ constrainProportions: boolean }} params
 * @returns {{ ok: boolean }}
 */
function setConstrainProportions({ constrainProportions }) {
  figma.currentPage.selection.forEach((n) => {
    if ('constrainProportions' in n) n.constrainProportions = !!constrainProportions;
  });
  return { ok: true };
}

export default setConstrainProportions;
