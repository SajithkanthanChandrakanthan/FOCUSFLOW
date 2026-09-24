/**
 * Dashboard view.
 * Everything on it is derived from Store.state and the selected day, so a
 * single re-render keeps the header, stat cards, tracker, charts and
 * insights consistent with each other.
 */

/** Notifications for the bell: today's unfinished habits, plus tasks due today or overdue. */
function getNotifications(state) {
  const today = todayKey();
  const items = [];
  const left = totalOnDay(state, today) - doneOnDay(state, today);
  if (left > 0) {
    items.push({ route: 'habits', icon: 'habits', color: 'blue', title: `${left} ${left === 1 ? 'habit' : 'habits'} left today`, sub: 'Keep your streaks alive' });
  }
  state.tasks
    .filter(t => !t.done && t.dueDate && t.dueDate <= today)
    .sort(compareByDue)
    .forEach(t => {
      items.push({ route: 'tasks', icon: 'tasks', color: isOverdue(t) ? 'gray' : 'blue', title: t.title, sub: formatDue(t), overdue: isOverdue(t) });
    });
  return items;
}

function BellPopover(items, open) {
  const label = items.length ? `Notifications, ${items.length} new` : 'Notifications';
  const list = items.length
    ? items.map((it, i) => `
        <button type="button" class="popover__item" data-route="${it.route}" ${i === 0 ? 'data-focus-key="bell:first"' : ''}>
          <span class="tint-icon" style="--size:32px;${colorStyle(it.color)}">${Icon(it.icon, 16)}</span>
          <span class="popover__item-text">
            <span class="popover__item-title">${escapeHtml(it.title)}</span>
            <span class="popover__item-sub ${it.overdue ? 'is-overdue' : ''}">${escapeHtml(it.sub)}</span>
          </span>
        </button>`).join('')
    : `<p class="popover__empty" tabindex="-1" data-focus-key="bell:first">You're all caught up</p>`;

  return `
    <div class="popover-wrap" data-popover-root="bell">
      <button type="button" class="round-btn" data-action="toggle-bell" data-focus-key="bell"
        aria-haspopup="dialog" aria-expanded="${open}" aria-label="${label}">
        ${Icon('bell', 20)}
        ${items.length ? '<span class="bell-dot" aria-hidden="true"></span>' : ''}
      </button>
      ${open ? `
        <div class="popover popover--bell" role="dialog" aria-label="Notifications">
          <p class="popover__heading">Notifications</p>
          ${list}
        </div>` : ''}
    </div>
  `;
}

function DashboardHeader(state) {
  const dark = state.theme === 'dark';
  const notifications = getNotifications(state);
  return `
    <header class="dash-header">
      <div class="dash-title">
        <h1>Good to see you, ${escapeHtml(state.userName)}</h1>
        <p>Small steps. Big changes.</p>
      </div>
      <div class="dash-actions">
        ${DatePill(state, 'pill-header')}
        <div class="dash-icons">
          <button type="button" class="round-btn" data-action="toggle-theme" data-focus-key="theme"
            aria-label="Switch to ${dark ? 'light' : 'dark'} mode">${Icon(dark ? 'sun' : 'moon', 20)}</button>
          ${BellPopover(notifications, Popover.isOpen('bell'))}
          <button type="button" class="round-btn round-btn--avatar" data-route="settings" data-focus-key="header-avatar"
            aria-label="Open settings">${escapeHtml(initialsOf(state.userName))}</button>
        </div>
      </div>
    </header>
  `;
}

function StatCards(state) {
  const sel = state.selectedDate;
  const isToday = sel === todayKey();
  const dayTasks = tasksForDay(state, sel);
  const cards = [
    { route: 'habits', color: 'green', icon: 'check', value: `${doneOnDay(state, sel)}/${totalOnDay(state, sel)}`, label: 'Habits completed' },
    { route: 'tasks', color: 'blue', icon: 'target', value: `${dayTasks.filter(t => t.done).length}/${dayTasks.length}`, label: isToday ? "Today's tasks" : `Tasks · ${formatShort(sel)}` },
    { route: 'habits', color: 'purple', icon: 'flame', value: dayStreak(state), label: 'Day streak' },
    { route: 'habits', color: 'amber', icon: 'star', value: state.habits.length, label: 'Total habits' },
  ];
  return `
    <div class="stats-row">
      ${cards.map((c, i) => `
        <button type="button" class="stat-card card" data-route="${c.route}" data-focus-key="stat:${i}">
          <span class="tint-icon" style="${colorStyle(c.color)}">${Icon(c.icon, 20)}</span>
          <span class="stat-card__text">
            <span class="stat-card__value">${c.value}</span>
            <span class="stat-card__label">${escapeHtml(c.label)}</span>
          </span>
          <span class="stat-card__chevron" aria-hidden="true">${Icon('chevron-right', 16)}</span>
        </button>`).join('')}
    </div>
  `;
}

function UpcomingTasksCard(state) {
  const tasks = upcomingTasks(state, 5);
  const rows = tasks.map(t => `
    <li class="up-row">
      <button type="button" class="task-check" role="checkbox" aria-checked="false" data-action="toggle-task" data-id="${t.id}"
        data-focus-key="up:${t.id}" aria-label="Mark ${escapeHtml(t.title)} as done"></button>
      <div class="up-row__text">
        <span class="up-row__title">${escapeHtml(t.title)}</span>
        <span class="up-row__due ${isOverdue(t) ? 'is-overdue' : ''}">${formatDue(t)}</span>
      </div>
      <span class="pill" style="${colorStyle(CATEGORY_COLORS[t.category])}">${escapeHtml(t.category)}</span>
    </li>`).join('');

  return `
    <section class="card up-card" aria-labelledby="upcoming-title">
      <div class="card-head">
        <h2 id="upcoming-title">Upcoming Tasks</h2>
        <button type="button" class="link-btn" data-route="tasks" data-focus-key="view-all-tasks">View All</button>
      </div>
      ${tasks.length ? `<ul class="up-list">${rows}</ul>` : `
        <div class="ht-empty ht-empty--flat">
          <p>No upcoming tasks</p>
          <button type="button" class="btn btn--primary" data-action="add-task" data-focus-key="upcoming-add-task">${Icon('plus', 18)} Add Task</button>
        </div>`}
    </section>
  `;
}

function renderDashboard(state) {
  const root = document.getElementById('view-root');
  root.innerHTML = `
    <div class="dash">
      ${DashboardHeader(state)}
      <div class="dash-grid">
        <div class="dash-main">
          ${StatCards(state)}
          ${HabitTracker(state)}
          ${UpcomingTasksCard(state)}
        </div>
        <aside class="dash-side" aria-label="Summary">
          ${SidePanel(state)}
        </aside>
      </div>
    </div>
  `;

  bindRouteLinks(root);
  bindDatePills(root);
  bindHabitTracker(root);
  bindSidePanel(root);
  bindActions(root, {
    'toggle-theme': () => Store.setTheme(state.theme === 'dark' ? 'light' : 'dark'),
    'toggle-bell': () => Popover.toggle('bell'),
    'add-task': () => openTaskModal(),
    'toggle-task': el => Store.toggleTask(el.dataset.id),
  });
}
