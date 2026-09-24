/**
 * Small DOM helpers shared by every view.
 * The whole view is re-rendered on each store change, so anything that
 * lives on a DOM node (keyboard focus, a hidden date input) is rebuilt too.
 * Controls opt in to focus restoration with a data-focus-key attribute.
 */

/** Key of the [data-focus-key] control that currently holds focus, if any. */
function captureFocusKey() {
  const el = document.activeElement;
  const host = el && el.closest ? el.closest('[data-focus-key]') : null;
  return host ? host.dataset.focusKey : null;
}

/** Focus the control carrying `key`. Returns false when it no longer exists. */
function restoreFocus(key) {
  if (!key) return false;
  // Plain loop instead of a selector so keys never need CSS escaping.
  const all = document.querySelectorAll('[data-focus-key]');
  for (const el of all) {
    if (el.dataset.focusKey === key && !el.disabled) {
      el.focus({ preventScroll: true });
      return true;
    }
  }
  return false;
}

/**
 * Wire click handlers by data-action name:
 *   bindActions(root, { 'toggle-day': (el, event) => ... })
 * Call once per render, after innerHTML has been replaced.
 */
function bindActions(container, handlers) {
  container.querySelectorAll('[data-action]').forEach(el => {
    const handler = handlers[el.dataset.action];
    if (handler) el.addEventListener('click', event => handler(el, event));
  });
}

/** "Jordan Lee" -> "JL", "jordan" -> "J". */
function initialsOf(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  const letters = parts.length === 1 ? parts[0].charAt(0) : parts[0].charAt(0) + parts[parts.length - 1].charAt(0);
  return letters.toUpperCase();
}
