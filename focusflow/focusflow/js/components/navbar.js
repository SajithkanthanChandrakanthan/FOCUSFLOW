/**
 * NavBar component.
 * Renders the primary navigation. Reusable in the sense that it
 * takes no view-specific knowledge — it reads the current route
 * from Store and renders links generically from a config array,
 * so adding a new view only means adding one entry here.
 *
 * Settings is included as a top-level item so the mobile bottom
 * tab bar has a clear fourth destination. The desktop profile row
 * still routes to the same settings view.
 */
const NAV_LINKS = [
  { route: 'dashboard', label: 'Dashboard', icon: 'home' },
  { route: 'habits', label: 'Habits', icon: 'habits' },
  { route: 'tasks', label: 'Tasks', icon: 'tasks' },
  { route: 'settings', label: 'Settings', icon: 'settings' },
];

// Routes that have no sidebar item of their own keep a parent highlighted.
const NAV_PARENT = { reports: 'dashboard' };

function renderNavBar(state) {
  const root = document.getElementById('navbar-root');
  const activeRoute = NAV_PARENT[state.route] || state.route;

  const links = NAV_LINKS.map(link => `
    <button
      class="navbar__link ${activeRoute === link.route ? 'is-active' : ''}"
      data-route="${link.route}"
      data-focus-key="nav:${link.route}"
      aria-current="${activeRoute === link.route ? 'page' : 'false'}"
    >
      <span class="navbar__icon" aria-hidden="true">${Icon(link.icon, 20)}</span>
      <span>${link.label}</span>
    </button>
  `).join('');

  const name = state.userName || 'Friend';

  root.innerHTML = `
    <nav class="navbar" aria-label="Primary">
      <div class="navbar__head">
        <div class="navbar__brand">
          <svg class="navbar__logo" width="26" height="19" viewBox="0 0 38 26" fill="none" aria-hidden="true">
            <path d="M3,15 L15,15 L21,23 L35,3" stroke-width="3.4"
              stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span class="navbar__wordmark">Focus<em>Flow</em></span>
        </div>
      </div>

      <div class="navbar__nav">
        <p class="navbar__menu-label">MENU</p>
        <div class="navbar__links">${links}</div>
      </div>

      <div class="navbar__foot">
        <button class="navbar__profile" data-route="settings" data-focus-key="nav:profile" aria-label="Open settings">
          <span class="avatar" aria-hidden="true">${escapeHtml(initialsOf(name))}</span>
          <span class="navbar__profile-text">
            <span class="navbar__profile-name">${escapeHtml(name)}</span>
            <span class="navbar__profile-sub">Keep going</span>
          </span>
          <span class="navbar__profile-chevron" aria-hidden="true">${Icon('chevron-right', 16)}</span>
        </button>
      </div>
    </nav>
  `;

  bindRouteLinks(root);
}

/**
 * One handler for every [data-route] element — nav links, profile row,
 * stat cards, "View All" links. Native <button>s give focus and
 * Enter/Space activation for free.
 */
function bindRouteLinks(container) {
  container.querySelectorAll('[data-route]').forEach(el => {
    el.addEventListener('click', () => Store.setRoute(el.dataset.route));
  });
}
