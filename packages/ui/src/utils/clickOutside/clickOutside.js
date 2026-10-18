/**
 * Svelte 5 attachment: fires callback when clicking outside the element.
 * @param {Function} callback
 * @returns {import('svelte/attachments').Attachment}
 */
function clickOutside(callback) {
  return (element) => {
    const handleClick = (event) => {
      if (element && !element.contains(/** @type {Node} */ (event.target)) && !event.defaultPrevented) {
        callback();
      }
    };
    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  };
}
export default clickOutside;
