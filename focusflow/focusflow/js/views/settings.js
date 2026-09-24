/**
 * Settings view.
 * Three card sections — Profile, Preferences, Account — built from the
 * same card surface the Dashboard and Habits views use. Preferences are
 * state-driven through Store.updateSettings, so a switch flip persists
 * via the store's existing localStorage write like any other action.
 */

/**
 * Unsaved profile edits. Any store write re-renders the whole view, so
 * text typed but not yet saved is held here to survive a re-render
 * triggered by an unrelated action (e.g. flipping a toggle).
 */
let profileDraft = null;

function renderSettings(state) {
  const root = document.getElementById('view-root');
  const settings = state.settings || {};
  const userName = profileDraft ? profileDraft.userName : state.userName;
  const userEmail = profileDraft ? profileDraft.userEmail : state.userEmail;
  const initial = (userName || '?').trim().charAt(0).toUpperCase();

  root.innerHTML = `
    <div class="view-header">
      <div>
        <h1>Settings</h1>
        <p>Your profile, preferences, and account.</p>
      </div>
    </div>

    <div class="settings-stack">

      <section class="settings-card" aria-labelledby="settings-profile-title">
        <h2 class="settings-card__title" id="settings-profile-title">Profile</h2>
        <div class="settings-profile">
          <div class="settings-avatar" aria-hidden="true">${escapeHtml(initial)}</div>
          <div class="settings-profile__fields">
            <div class="modal__field">
              <label for="userName">Display name</label>
              <input id="userName" value="${escapeHtml(userName || '')}" placeholder="Your name" />
            </div>
            <div class="modal__field">
              <label for="userEmail">Email</label>
              <input id="userEmail" type="email" value="${escapeHtml(userEmail || '')}" placeholder="you@example.com" />
            </div>
          </div>
        </div>
        <div class="settings-card__actions">
          <button class="btn btn--primary" id="save-profile">Save changes</button>
        </div>
      </section>

      <section class="settings-card" aria-labelledby="settings-prefs-title">
        <h2 class="settings-card__title" id="settings-prefs-title">Preferences</h2>
        <div class="settings-rows" id="settings-prefs">
          <div class="settings-row">
            <div class="settings-row__text">
              <p class="settings-row__label">Theme</p>
              <p class="settings-row__description">Switch between paper-light and dark.</p>
            </div>
            <div class="theme-pill" role="group" aria-label="Theme">
              <button type="button" class="theme-pill__option ${state.theme === 'dark' ? '' : 'is-active'}"
                data-action="set-theme" data-theme="light" data-focus-key="theme-light" aria-pressed="${state.theme === 'dark' ? 'false' : 'true'}">Light</button>
              <button type="button" class="theme-pill__option ${state.theme === 'dark' ? 'is-active' : ''}"
                data-action="set-theme" data-theme="dark" data-focus-key="theme-dark" aria-pressed="${state.theme === 'dark' ? 'true' : 'false'}">Dark</button>
            </div>
          </div>
          ${Toggle({
            id: 'dailyReminder',
            label: 'Daily reminder',
            description: 'A nudge each morning to plan your day.',
            checked: !!settings.dailyReminder,
          })}
          ${Toggle({
            id: 'streakAlerts',
            label: 'Habit streak alerts',
            description: 'Tell me when a streak is about to break.',
            checked: !!settings.streakAlerts,
          })}
        </div>
      </section>

      <section class="settings-card" aria-labelledby="settings-account-title">
        <h2 class="settings-card__title" id="settings-account-title">Account</h2>
        <div class="settings-rows">
          <button class="settings-row settings-row--action" data-action="export-data">
            <span class="settings-row__text">
              <span class="settings-row__label">Export my data</span>
              <span class="settings-row__description">Download your tasks and habits as a file.</span>
            </span>
            <span class="settings-row__chevron" aria-hidden="true">→</span>
          </button>
          <button class="settings-row settings-row--action" data-action="sign-out">
            <span class="settings-row__text">
              <span class="settings-row__label">Sign out</span>
              <span class="settings-row__description">Return to the sign-in page. Your data stays on this device.</span>
            </span>
            <span class="settings-row__chevron" aria-hidden="true">→</span>
          </button>
          <button class="settings-row settings-row--action settings-row--danger" data-action="delete-account">
            <span class="settings-row__text">
              <span class="settings-row__label">Delete account</span>
              <span class="settings-row__description">Permanently erase your profile, tasks, and habits.</span>
            </span>
            <span class="settings-row__chevron" aria-hidden="true">→</span>
          </button>
        </div>
      </section>

    </div>
  `;

  bindSettingsEvents(root);
}

function bindSettingsEvents(container) {
  const nameInput = container.querySelector('#userName');
  const emailInput = container.querySelector('#userEmail');

  // Keep the draft in step with what's on screen so a re-render mid-edit
  // doesn't discard typing.
  const captureDraft = () => {
    profileDraft = { userName: nameInput.value, userEmail: emailInput.value };
  };
  nameInput.addEventListener('input', captureDraft);
  emailInput.addEventListener('input', captureDraft);

  container.querySelector('#save-profile').addEventListener('click', () => {
    profileDraft = null;
    const emailOk = Store.updateProfile({
      userName: nameInput.value.trim() || 'Friend',
      userEmail: emailInput.value.trim(),
    });
    showToast(emailOk ? 'Settings saved' : 'Name saved. That email is invalid or already in use.');
  });

  container.querySelectorAll('[data-action="set-theme"]').forEach(btn => {
    btn.addEventListener('click', () => Store.setTheme(btn.dataset.theme));
  });

  bindToggleEvents(container.querySelector('#settings-prefs'), (id, checked) => {
    Store.updateSettings({ [id]: checked });
  });

  container.querySelector('[data-action="export-data"]').addEventListener('click', () => {
    showToast('Export started');
  });

  container.querySelector('[data-action="sign-out"]').addEventListener('click', () => {
    profileDraft = null;
    Store.signOut();
    showToast('Signed out');
  });

  container.querySelector('[data-action="delete-account"]').addEventListener('click', () => {
    openModal({
      title: 'Delete account?',
      confirmLabel: 'Delete account',
      confirmVariant: 'btn--danger-solid',
      bodyHtml: `
        <p class="modal__prose">
          This erases your profile, all tasks, and all habit streaks from this
          device. It cannot be undone.
        </p>
      `,
      onSubmit: () => {
        profileDraft = null;
        Store.resetAccount();
        showToast('Account deleted');
      },
    });
  });
}
