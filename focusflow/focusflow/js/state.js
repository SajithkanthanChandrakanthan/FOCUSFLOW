/**
 * FocusFlow state store.
 * A tiny pub-sub pattern: components subscribe to state changes,
 * actions mutate state and notify subscribers, views re-render.
 * This keeps interaction logic centralized and state-driven
 * rather than scattered across ad-hoc DOM event handlers.
 *
 * Accounts: there is no server, so the "database" is localStorage.
 *   focusflow.accounts.v1   { users: { <email>: credentials + profile name } }
 *   focusflow.session.v1    { email } of the signed-in user
 *   focusflow.user.v2:<email>  that user's own habits, tasks, settings, theme
 * Credentials are handled by auth.js; this file owns the app data.
 * Requires utils/dates.js (seed dates are relative to today).
 */
const STORAGE_KEY = 'focusflow.state.v1'; // legacy single-user save, imported once as the demo account
const ACCOUNTS_KEY = 'focusflow.accounts.v1';
const SESSION_KEY = 'focusflow.session.v1';
const THEME_KEY = 'focusflow.theme'; // read by index.html before first paint
const USER_KEY_PREFIX = 'focusflow.user.v2:';
const SCHEMA_VERSION = 2;
const DEFAULT_USER_NAME = 'Jordan';
const DEMO_EMAIL = 'demo@focusflow.app';
const ROUTES = ['dashboard', 'habits', 'tasks', 'settings', 'reports'];

// ---- Storage helpers (all tolerate blocked or full storage) ---------------

function readJSON(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    return false;
  }
}

function removeKey(key) {
  try { localStorage.removeItem(key); } catch (e) { /* ignore */ }
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function userDataKey(email) {
  return USER_KEY_PREFIX + normalizeEmail(email);
}

function readAccounts() {
  const accounts = readJSON(ACCOUNTS_KEY);
  return accounts && accounts.users ? accounts : { users: {} };
}

function writeAccounts(accounts) {
  return writeJSON(ACCOUNTS_KEY, accounts);
}

function readTheme() {
  try { return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'; } catch (e) { return 'light'; }
}

/** "ada.lovelace@x.com" -> "Ada" */
function nameFromEmail(email) {
  const firstName = (String(email).split('@')[0] || '').split(/[._\-+]/)[0] || 'Friend';
  return firstName.charAt(0).toUpperCase() + firstName.slice(1);
}

// ---- Seed and blank data -----------------------------------------------------

/**
 * Seed habits (demo account only). `streak` days are marked as completed; if
 * the habit is done today the run includes today, otherwise it ends yesterday.
 */
function seedHabits(today) {
  const specs = [
    { name: 'Workout', subtitle: 'Gym / Exercise', icon: 'dumbbell', color: 'blue', streak: 6, doneToday: true },
    { name: 'Eat 300g Protein', subtitle: 'Hit your protein goal', icon: 'fork-knife', color: 'green', streak: 4, doneToday: true },
    { name: 'Drink 3L Water', subtitle: 'Stay hydrated', icon: 'droplet', color: 'purple', streak: 8, doneToday: true },
    { name: 'Read', subtitle: '30 mins', icon: 'book', color: 'orange', streak: 3, doneToday: false },
    { name: 'Meditate', subtitle: '10 mins', icon: 'meditate', color: 'pink', streak: 5, doneToday: false },
    { name: 'Sleep 7+ Hours', subtitle: 'Better rest, better you', icon: 'moon-stars', color: 'teal', streak: 7, doneToday: true },
    { name: 'No Social Media', subtitle: 'Stay focused', icon: 'phone-off', color: 'purple', streak: 2, doneToday: false },
  ];

  return specs.map((spec, i) => {
    const completions = {};
    // Not done today: the run covers the previous `streak` days.
    const first = spec.doneToday ? 0 : 1;
    for (let d = first; d < first + spec.streak; d++) completions[addDays(today, -d)] = true;
    // Workout also has an older run so the overall day streak reaches 12.
    if (spec.name === 'Workout') {
      for (let d = 8; d <= 11; d++) completions[addDays(today, -d)] = true;
    }
    return {
      id: `h${i + 1}`,
      name: spec.name,
      subtitle: spec.subtitle,
      icon: spec.icon,
      color: spec.color,
      createdAt: addDays(today, -60),
      completions,
    };
  });
}

function seedTasks(today) {
  const tomorrow = addDays(today, 1);
  return [
    { id: 't1', title: 'Plan the day', category: 'Work', dueDate: today, dueTime: '08:30', done: true },
    { id: 't2', title: 'Reply to emails', category: 'Work', dueDate: today, dueTime: '10:00', done: true },
    { id: 't3', title: 'Finish UI design for landing page', category: 'Work', dueDate: today, dueTime: '14:00', done: false },
    { id: 't4', title: 'Buy gym protein powder', category: 'Personal', dueDate: today, dueTime: '17:00', done: false },
    { id: 't5', title: 'Call mom', category: 'Personal', dueDate: tomorrow, dueTime: '20:00', done: false },
  ];
}

/** Everything a user owns, empty. Built by functions so dates are always relative to *now*. */
function baseUserData() {
  return {
    schemaVersion: SCHEMA_VERSION,
    route: 'dashboard',
    userName: '',
    userEmail: '',
    theme: readTheme(),
    settings: { dailyReminder: true, streakAlerts: false },
    tasks: [],
    habits: [],
  };
}

/** A brand-new account: a clean sheet, no habits or tasks. */
function blankUserData(name, email) {
  return { ...baseUserData(), userName: name || nameFromEmail(email), userEmail: email };
}

/** The demo account: sample data so the dashboard looks populated. */
function demoUserData() {
  const today = todayKey();
  return { ...baseUserData(), userName: DEFAULT_USER_NAME, userEmail: DEMO_EMAIL, tasks: seedTasks(today), habits: seedHabits(today) };
}

/**
 * Merge saved data over `fallback` so a payload from an older build still has
 * every key the views read. Pre-v2 saves used a different habit/task shape:
 * keep the profile, theme and settings, but take the fallback's habits/tasks.
 */
function normalizeUserData(saved, fallback) {
  const data = { ...fallback, ...saved, settings: { ...fallback.settings, ...(saved.settings || {}) } };
  const needsReseed = !(saved.schemaVersion >= SCHEMA_VERSION)
    || !Array.isArray(saved.habits)
    || !Array.isArray(saved.tasks);
  if (needsReseed) {
    data.tasks = fallback.tasks;
    data.habits = fallback.habits;
  }
  // Session flags never belong to the saved user data.
  delete data.signedIn;
  delete data.selectedDate;
  data.schemaVersion = SCHEMA_VERSION;
  if (!ROUTES.includes(data.route)) data.route = 'dashboard';
  return data;
}

/** selectedDate is view state, not data: every load and sign-in starts on today. */
function activeState(data) {
  return { ...data, signedIn: true, selectedDate: todayKey() };
}

function signedOutState() {
  return { ...baseUserData(), signedIn: false, selectedDate: todayKey() };
}

/**
 * First run on the account system: create the demo account, and if an old
 * single-user save exists, keep it as the demo account's data.
 */
function importLegacyState() {
  if (readJSON(ACCOUNTS_KEY)) return;
  writeAccounts({ users: { [DEMO_EMAIL]: { email: DEMO_EMAIL, name: DEFAULT_USER_NAME, demo: true, createdAt: todayKey() } } });
  const legacy = readJSON(STORAGE_KEY);
  if (!legacy || typeof legacy !== 'object') return;
  const data = normalizeUserData(legacy, demoUserData());
  data.userEmail = DEMO_EMAIL;
  writeJSON(userDataKey(DEMO_EMAIL), data);
  if (legacy.signedIn) writeJSON(SESSION_KEY, { email: DEMO_EMAIL });
  try { localStorage.setItem(THEME_KEY, data.theme === 'dark' ? 'dark' : 'light'); } catch (e) { /* ignore */ }
}

function loadState() {
  try {
    importLegacyState();
    const session = readJSON(SESSION_KEY);
    const account = session && session.email ? readAccounts().users[normalizeEmail(session.email)] : null;
    if (account) {
      const fallback = account.demo ? demoUserData() : blankUserData(account.name, account.email);
      const saved = readJSON(userDataKey(account.email));
      return activeState(saved ? normalizeUserData(saved, fallback) : fallback);
    }
  } catch (e) { /* fall through to signed out */ }
  return signedOutState();
}

/** Save the theme always, and the signed-in user's data under their own key. */
function persistState(state) {
  try { localStorage.setItem(THEME_KEY, state.theme); } catch (e) { /* ignore */ }
  if (!state.signedIn || !state.userEmail) return;
  const { signedIn, selectedDate, ...data } = state;
  writeJSON(userDataKey(state.userEmail), data);
}

function newId(prefix) {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

const HABIT_FIELDS = ['name', 'subtitle', 'icon', 'color'];
const TASK_FIELDS = ['title', 'category', 'dueDate', 'dueTime', 'done'];

/** Copy only the whitelisted keys of `partial` onto `target`. */
function assignFields(target, partial, fields) {
  fields.forEach(f => {
    if (partial[f] !== undefined) target[f] = partial[f];
  });
}

const Store = {
  state: loadState(),
  listeners: [],

  subscribe(fn) {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter(l => l !== fn); };
  },

  /** Re-render subscribers without saving (UI-only changes such as an open popover). */
  refresh() {
    this.listeners.forEach(fn => fn(this.state));
  },

  /** Save, then re-render. */
  notify() {
    persistState(this.state);
    this.refresh();
  },

  setRoute(route) {
    this.state.route = route;
    this.notify();
  },

  /** Choose the day the dashboard is showing. Future days are clamped to today. */
  setSelectedDate(key) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key || '')) return;
    this.state.selectedDate = isFuture(key) ? todayKey() : key;
    this.refresh();
  },

  /**
   * Switch to a user's data. Credentials were already checked by Auth.
   * `isNew` starts a clean sheet; `demo` loads the sample-data account.
   */
  signIn({ email, name, demo, isNew } = {}) {
    const key = demo ? DEMO_EMAIL : normalizeEmail(email);
    const account = readAccounts().users[key];
    const fallback = demo ? demoUserData() : blankUserData(name || (account && account.name), key);
    const saved = isNew ? null : readJSON(userDataKey(key));
    this.state = activeState(saved ? normalizeUserData(saved, fallback) : fallback);
    this.state.userEmail = key;
    this.state.route = 'dashboard';
    writeJSON(SESSION_KEY, { email: key });
    this.notify();
  },

  signOut() {
    persistState(this.state);
    removeKey(SESSION_KEY);
    this.state = { ...signedOutState(), theme: this.state.theme };
    this.notify();
  },

  // ---- Tasks -------------------------------------------------------------

  toggleTask(id) {
    const task = this.state.tasks.find(t => t.id === id);
    if (task) task.done = !task.done;
    this.notify();
  },

  addTask({ title, category, dueDate, dueTime }) {
    this.state.tasks.push({
      id: newId('t'),
      title,
      category: category || 'Work',
      dueDate: dueDate || todayKey(),
      dueTime: dueTime || '09:00',
      done: false,
    });
    this.notify();
  },

  updateTask(id, partial) {
    const task = this.state.tasks.find(t => t.id === id);
    if (!task) return;
    assignFields(task, partial, TASK_FIELDS);
    this.notify();
  },

  removeTask(id) {
    this.state.tasks = this.state.tasks.filter(t => t.id !== id);
    this.notify();
  },

  // ---- Habits ------------------------------------------------------------

  /** Tick or untick one habit on one day. Future days, and days before the habit existed, are ignored. */
  toggleHabitDay(habitId, dateKey) {
    const habit = this.state.habits.find(h => h.id === habitId);
    if (!habit || isFuture(dateKey) || dateKey < habit.createdAt) return;
    if (habit.completions[dateKey]) delete habit.completions[dateKey];
    else habit.completions[dateKey] = true;
    this.notify();
  },

  addHabit({ name, subtitle, icon, color }) {
    this.state.habits.push({
      id: newId('h'),
      name,
      subtitle: subtitle || '',
      icon: icon || 'target',
      color: color || 'blue',
      createdAt: todayKey(),
      completions: {},
    });
    this.notify();
  },

  updateHabit(id, partial) {
    const habit = this.state.habits.find(h => h.id === id);
    if (!habit) return;
    assignFields(habit, partial, HABIT_FIELDS);
    this.notify();
  },

  removeHabit(id) {
    this.state.habits = this.state.habits.filter(h => h.id !== id);
    this.notify();
  },

  // ---- Preferences / account ---------------------------------------------

  setTheme(theme) {
    this.state.theme = theme === 'dark' ? 'dark' : 'light';
    this.notify();
  },

  /**
   * Save the profile. Changing the email re-keys the account, so it can be
   * refused (taken, invalid, or the demo account); the name still saves.
   * Returns false when the email change was refused.
   */
  updateProfile({ userName, userEmail }) {
    let emailOk = true;
    if (userName !== undefined) this.state.userName = userName;
    if (userEmail !== undefined && normalizeEmail(userEmail) !== this.state.userEmail) {
      const next = normalizeEmail(userEmail);
      if (Auth.rename(this.state.userEmail, next)) {
        this.state.userEmail = next;
        writeJSON(SESSION_KEY, { email: next });
      } else {
        emailOk = false;
      }
    }
    Auth.setName(this.state.userEmail, this.state.userName);
    this.notify();
    return emailOk;
  },

  /** Merge a partial into state.settings — callers pass only what changed. */
  updateSettings(partial) {
    this.state.settings = { ...this.state.settings, ...partial };
    this.notify();
  },

  /** Destructive: deletes this account and its data, then signs out. */
  resetAccount() {
    Auth.remove(this.state.userEmail);
    removeKey(SESSION_KEY);
    this.state = { ...signedOutState(), theme: this.state.theme };
    this.notify();
  },
};
