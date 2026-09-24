/**
 * Router.
 * Maps a route name to its render function. Keeping this as a
 * lookup table (rather than a chain of if/else) is what makes
 * adding another view a one-line change.
 */
const VIEW_RENDERERS = {
  dashboard: renderDashboard,
  tasks: renderTasks,
  habits: renderHabits,
  settings: renderSettings,
  reports: renderReports,
};

function renderRoute(state) {
  const root = document.getElementById('view-root');
  root.classList.toggle('view-root--auth', !state.signedIn);
  if (!state.signedIn) {
    renderLogin(state);
    return;
  }
  const renderer = VIEW_RENDERERS[state.route] || renderDashboard;
  renderer(state);
}
