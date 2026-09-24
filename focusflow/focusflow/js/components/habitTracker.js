/**
 * HabitTracker component.
 * The week strip and the habit-by-day table, driven by
 * Store.state.selectedDate. Rendered on the Dashboard and, full width, on
 * the Habits view. Call bindHabitTracker(container) after inserting it, and
 * bindDatePills(container) once for the whole view.
 */
function streakText(n) {
  return `${n} ${n === 1 ? 'day' : 'days'}`;
}

function WeekStrip(state, days) {
  const sel = state.selectedDate;
  return `
    <div class="week-strip" role="group" aria-label="Days of the week">
      ${days.map(key => {
        const future = isFuture(key);
        const selected = key === sel;
        const status = future ? 'none' : dayStatus(state, key);
        const summary = future ? 'upcoming' : `${doneOnDay(state, key)} of ${totalOnDay(state, key)} habits done`;
        const dotClass = status === 'complete' ? 'is-complete' : selected ? 'is-selected' : '';
        return `
          <button type="button" class="week-day ${selected ? 'is-selected' : ''}" data-action="select-day" data-date="${key}"
            data-focus-key="day:${key}" aria-pressed="${selected}" aria-label="${formatMedium(key)}, ${summary}" ${future ? 'disabled' : ''}>
            <span class="week-day__name">${weekdayShort(key)}</span>
            <span class="week-day__num">${dayOfMonth(key)}</span>
            <span class="status-dot ${dotClass}" aria-hidden="true">${status === 'complete' ? Icon('check', 12) : ''}</span>
          </button>`;
      }).join('')}
    </div>
  `;
}

function HabitRow(state, habit, days) {
  const sel = state.selectedDate;
  const menuId = `kebab:${habit.id}`;
  const menuOpen = Popover.isOpen(menuId);

  const cells = days.map(key => {
    const future = isFuture(key);
    const tooEarly = key < habit.createdAt;
    const done = !!habit.completions[key];
    const disabled = future || tooEarly;
    const stateText = done ? 'completed' : future ? 'upcoming' : tooEarly ? 'not tracked yet' : 'not completed';
    return `
      <div role="cell" class="ht-cell ${key === sel ? 'is-selected-day' : ''}">
        <button type="button" class="check ${done ? 'is-done' : ''}" data-action="toggle-day" data-habit="${habit.id}" data-date="${key}"
          data-focus-key="cell:${habit.id}:${key}" aria-pressed="${done}"
          aria-label="${escapeHtml(habit.name)}, ${formatMedium(key)}, ${stateText}" ${disabled ? 'disabled' : ''}>
          ${done ? Icon('check', 16) : ''}
        </button>
      </div>`;
  }).join('');

  return `
    <div role="row" class="ht-row">
      <div role="cell" class="ht-habit">
        <span class="tint-icon" style="--size:44px;${colorStyle(habit.color)}">${Icon(habit.icon, 22)}</span>
        <span class="ht-habit__text">
          <span class="ht-habit__name">${escapeHtml(habit.name)}</span>
          <span class="ht-habit__sub">${escapeHtml(habit.subtitle)}</span>
        </span>
      </div>
      ${cells}
      <div role="cell" class="ht-streak">${streakText(currentStreak(habit))}</div>
      <div role="cell" class="ht-menu popover-wrap" data-popover-root="${menuId}">
        <button type="button" class="kebab" data-action="toggle-kebab" data-habit="${habit.id}" data-focus-key="${menuId}"
          aria-haspopup="menu" aria-expanded="${menuOpen}" aria-label="Options for ${escapeHtml(habit.name)}">
          ${Icon('dots-vertical', 20)}
        </button>
        ${menuOpen ? `
          <div class="popover popover--menu" role="menu" aria-label="Options for ${escapeHtml(habit.name)}">
            <button type="button" role="menuitem" class="popover__item" data-action="edit-habit" data-habit="${habit.id}" data-focus-key="${menuId}:first">
              ${Icon('pencil', 18)} Edit
            </button>
            <button type="button" role="menuitem" class="popover__item popover__item--danger" data-action="delete-habit" data-habit="${habit.id}">
              ${Icon('trash', 18)} Delete
            </button>
          </div>` : ''}
      </div>
    </div>
  `;
}

function HabitTracker(state) {
  const weekStart = startOfWeek(state.selectedDate);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const canGoNext = !isFuture(addDays(weekStart, 7));

  // Column headers read "Mon 22"; days that haven't happened yet stay blank.
  const dayHeads = days.map(key => `
    <div role="columnheader" class="ht-day-head ${key === state.selectedDate ? 'is-selected-day' : ''}">
      ${isFuture(key) ? '' : `<span>${weekdayShort(key)}</span> <span>${dayOfMonth(key)}</span>`}
    </div>`).join('');

  const body = state.habits.length
    ? state.habits.map(h => HabitRow(state, h, days)).join('')
    : `<div class="ht-empty">
         <p>No habits yet. Add one to start your streak.</p>
         <button type="button" class="btn btn--primary" data-action="add-habit" data-focus-key="empty-add-habit">${Icon('plus', 18)} Add habit</button>
       </div>`;

  return `
    <section class="card habit-tracker" aria-labelledby="ht-title">
      <div class="ht-top">
        <h2 id="ht-title">Habit Tracker</h2>
        <div class="ht-top__right">
          ${DatePill(state, 'pill-tracker')}
          <button type="button" class="square-btn" data-action="next-week" data-focus-key="next-week"
            aria-label="Next week" ${canGoNext ? '' : 'disabled'}>${Icon('chevron-right', 20)}</button>
        </div>
      </div>

      ${WeekStrip(state, days)}

      <div class="ht-table" role="table" aria-label="Habits by day">
        <div role="row" class="ht-row ht-head">
          <div role="columnheader">Habit</div>
          ${dayHeads}
          <div role="columnheader">Streak</div>
          <div role="columnheader" class="sr-only">Options</div>
        </div>
        ${body}
      </div>
    </section>
  `;
}

function bindHabitTracker(container) {
  const findHabit = el => Store.state.habits.find(h => h.id === el.dataset.habit);
  // Menu items close the popover first, then hand focus back to its trigger.
  const closeMenu = () => { Popover.current = null; Store.refresh(); };

  bindActions(container, {
    'select-day': el => Store.setSelectedDate(el.dataset.date),
    'toggle-day': el => Store.toggleHabitDay(el.dataset.habit, el.dataset.date),
    'next-week': () => {
      // Same weekday next week, but never past today.
      const next = addDays(Store.state.selectedDate, 7);
      Store.setSelectedDate(isFuture(next) ? todayKey() : next);
    },
    'toggle-kebab': el => Popover.toggle(`kebab:${el.dataset.habit}`),
    'edit-habit': el => {
      const habit = findHabit(el);
      closeMenu();
      if (habit) openHabitModal(habit, `kebab:${habit.id}`);
    },
    'delete-habit': el => {
      const habit = findHabit(el);
      closeMenu();
      if (habit) confirmDeleteHabit(habit, `kebab:${habit.id}`);
    },
    'add-habit': () => openHabitModal(null),
  });
}
