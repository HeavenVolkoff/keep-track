/**
 * Ready callback.
 *
 * @name ReadyCallback
 * @function
 */

/**
 * A simple browser ready scheaduler.
 * Modified from: https://github.com/jquery/jquery/blob/master/src/core/ready.js
 *
 * @param {ReadyCallback} fn - Callback function to be called when browser is ready.
 * @license MIT
 */
export default fn => {
  const listener = () => fn()

  // Catch cases where ready() is called
  // after the browser event has already occurred.
  if (document.readyState !== 'loading') {
    // Handle it asynchronously to allow scripts the opportunity to delay ready
    window.setTimeout(listener)
  } else {
    // Use the handy event callback
    document.addEventListener('DOMContentLoaded', listener)

    // A fallback to window.onload, that will always work
    window.addEventListener('load', listener)
  }
}
