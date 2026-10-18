/**
 * Persist calculator draft to clientStorage.
 * @param {{ data: object }} params
 */
async function saveDraft({ data }) {
  await figma.clientStorage.setAsync('layout_calculator_draft', data);
  return { ok: true };
}
export default saveDraft;
