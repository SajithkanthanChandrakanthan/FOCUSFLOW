/**
 * Popover state.
 * Kebab menus and the bell popover are "open" only while a module variable
 * says so, because the whole view is rebuilt on every store change and a
 * plain DOM flag would be lost. Only one popover is open at a time.
 *
 * Markup contract: the wrapper carries data-popover-root="<id>", the trigger
 * carries data-focus-key="<id>", and the first menu control carries
 * data-focus-key="<id>:first" so keyboard users land inside on open.
 */
const Popover = {
  current: null,
  // Focus key app.js should restore after the next render.
  pendingFocus: null,

  isOpen(id) {
    return this.current === id;
  },

  toggle(id) {
    const opening = this.current !== id;
    this.current = opening ? id : null;
    this.pendingFocus = opening ? `${id}:first` : id;
    Store.refresh();
  },

  /** Close without moving focus (outside click, tabbing away, item chosen). */
  close() {
    if (this.current === null) return;
    this.current = null;
    Store.refresh();
  },
};

// composedPath() is captured at dispatch time, so it still works when the
// click itself re-rendered the DOM and detached the target.
document.addEventListener('click', event => {
  if (Popover.current === null) return;
  const inside = event.composedPath().some(n => n.dataset && n.dataset.popoverRoot === Popover.current);
  if (!inside) Popover.close();
});

// Only keyboard focus movement closes a popover here. Closing on a mouse
// press would re-render mid-click and swallow the click on the control
// the user is pressing; pointer clicks are handled by the click listener.
let keyboardNav = false;
document.addEventListener('keydown', event => { if (event.key === 'Tab') keyboardNav = true; }, true);
document.addEventListener('pointerdown', () => { keyboardNav = false; }, true);

document.addEventListener('focusin', event => {
  if (Popover.current === null || !keyboardNav) return;
  const root = event.target.closest ? event.target.closest('[data-popover-root]') : null;
  if (!root || root.dataset.popoverRoot !== Popover.current) Popover.close();
});

document.addEventListener('keydown', event => {
  if (Popover.current === null) return;
  // A modal on top owns Escape.
  if (document.getElementById('modal-root').childElementCount) return;

  if (event.key === 'Escape') {
    const id = Popover.current;
    Popover.current = null;
    Popover.pendingFocus = id;
    Store.refresh();
    return;
  }

  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    const menu = document.activeElement && document.activeElement.closest('[role="menu"]');
    if (!menu) return;
    const items = Array.from(menu.querySelectorAll('[role="menuitem"]'));
    const at = items.indexOf(document.activeElement);
    const next = event.key === 'ArrowDown' ? (at + 1) % items.length : (at - 1 + items.length) % items.length;
    event.preventDefault();
    items[next].focus();
  }
});
