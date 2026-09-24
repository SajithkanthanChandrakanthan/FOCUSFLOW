/**
 * App entry point.
 * Subscribes the NavBar and the router to the store so that any
 * state change (toggling a task, changing route, logging a habit)
 * triggers a full, consistent re-render — a minimal version of the
 * "single source of truth" pattern used in larger frameworks.
 */
let lastRoute = null;

function render(state) {
  // Rebuilding the DOM drops keyboard focus; remember the focused control
  // (or the one a popover asked for) and put focus back afterwards.
  const focusKey = Popover.pendingFocus || captureFocusKey();
  Popover.pendingFocus = null;

  if (state.route !== lastRoute || !state.signedIn) {
    if (lastRoute !== null) window.scrollTo(0, 0);
    Popover.current = null;
    lastRoute = state.route;
  }

  applyTheme(state);
  if (state.signedIn) {
    renderNavBar(state);
  } else {
    document.getElementById('navbar-root').innerHTML = '';
  }
  renderRoute(state);
  restoreFocus(focusKey);
}

/** Reflect the chosen theme onto <html> so the token overrides in
 *  styles.css take effect app-wide. */
function applyTheme(state) {
  document.documentElement.setAttribute('data-theme', state.theme === 'dark' ? 'dark' : 'light');
}

Store.subscribe(render);
render(Store.state);
