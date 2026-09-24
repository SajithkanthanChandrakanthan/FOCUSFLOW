/**
 * Dashboard right column: Habit Completion, Weekly Overview, Insights and
 * Quick Actions. Every number is derived from Store.state and the selected
 * day; nothing here is hard-coded. Requires habitTracker.js (streakText).
 */

// Weekly Overview dropdown: module state so it survives re-renders.
let weeklyRange = 'this';

const DONUT_SIZE = 130;
const DONUT_STROKE = 14;

function CompletionCard(state) {
  const sel = state.selectedDate;
  const done = doneOnDay(state, sel);
  const total = totalOnDay(state, sel);
  const pct = completionPct(state, sel);
  const label = sel === todayKey() ? 'today' : formatShort(sel);

  const r = (DONUT_SIZE - DONUT_STROKE) / 2;
  const c = 2 * Math.PI * r;
  const mid = DONUT_SIZE / 2;
  // With a round cap a 0-length dash would still draw a dot, so skip the arc.
  const arc = done > 0 && total > 0
    ? `<circle class="donut__fill" cx="${mid}" cy="${mid}" r="${r}" stroke-width="${DONUT_STROKE}"
         stroke-dasharray="${(done / total) * c} ${c}" transform="rotate(-90 ${mid} ${mid})" />`
    : '';

  return `
    <section class="card side-card" aria-labelledby="completion-title">
      <div class="card-head"><h2 id="completion-title">Habit Completion</h2></div>
      <div class="completion">
        <div class="donut">
          <svg width="${DONUT_SIZE}" height="${DONUT_SIZE}" viewBox="0 0 ${DONUT_SIZE} ${DONUT_SIZE}" role="img"
            aria-label="${done} of ${total} habits completed, ${pct} percent">
            <circle class="donut__track" cx="${mid}" cy="${mid}" r="${r}" stroke-width="${DONUT_STROKE}" />
            ${arc}
          </svg>
          <div class="donut__center" aria-hidden="true">
            <span class="donut__value">${done}/${total}</span>
            <span class="donut__label">${escapeHtml(label)}</span>
          </div>
        </div>
        <div class="completion__legend">
          <ul class="legend">
            <li><span class="legend__dot legend__dot--done" aria-hidden="true"></span>Completed <strong>${done}</strong></li>
            <li><span class="legend__dot legend__dot--missed" aria-hidden="true"></span>Missed <strong>${total - done}</strong></li>
          </ul>
          <hr class="legend__rule" />
          <div class="rate">
            <span class="rate__value">${pct}%</span>
            <span class="rate__label">completion rate</span>
          </div>
        </div>
      </div>
    </section>
  `;
}

function WeeklyCard(state) {
  const thisWeek = startOfWeek(todayKey());
  const weekStart = weeklyRange === 'last' ? addDays(thisWeek, -7) : thisWeek;
  const days = weekSummary(state, weekStart);

  return `
    <section class="card side-card" aria-labelledby="weekly-title">
      <div class="card-head">
        <h2 id="weekly-title">Weekly Overview</h2>
        <div class="select-wrap">
          <select id="weekly-range" data-focus-key="weekly-select" aria-label="Week to show">
            <option value="this" ${weeklyRange === 'this' ? 'selected' : ''}>This Week</option>
            <option value="last" ${weeklyRange === 'last' ? 'selected' : ''}>Last Week</option>
          </select>
          ${Icon('chevron-down', 16)}
        </div>
      </div>
      <div class="wk-bars" role="group" aria-label="Habits completed per day">
        ${days.map(d => {
          const text = d.future ? `${formatShort(d.key)}: upcoming` : `${formatShort(d.key)}: ${d.done} of ${d.total} habits`;
          return `
            <div class="wk-col ${d.key === state.selectedDate ? 'is-selected' : ''}">
              <div class="wk-bar" role="img" aria-label="${text}" title="${text}">
                ${d.future || d.pct === 0 ? '' : `<div class="wk-bar__fill" style="height:${d.pct}%"></div>`}
              </div>
              <span class="wk-col__day">${weekdayShort(d.key)}</span>
              <span class="wk-col__date">${dayOfMonth(d.key)}</span>
            </div>`;
        }).join('')}
      </div>
    </section>
  `;
}

/** Selected day vs the day before it. Uses weekday names when the day isn't today. */
function consistencyInsight(state) {
  if (!state.habits.length) {
    return { icon: 'plus', color: 'blue', title: 'Start your first habit',
      text: 'Add a habit and tick it off each day to see your consistency here.' };
  }
  const sel = state.selectedDate;
  const prev = addDays(sel, -1);
  const n = doneOnDay(state, sel);
  const m = doneOnDay(state, prev);
  const isToday = sel === todayKey();
  const now = isToday ? 'today' : `on ${weekdayLong(sel)}`;
  const before = isToday ? 'yesterday' : `on ${weekdayLong(prev)}`;
  const beforeBare = isToday ? 'yesterday' : weekdayLong(prev);

  if (n > m) {
    return { icon: 'arrow-up', color: 'green', title: 'Your consistency is improving!',
      text: `You completed ${n} ${n === 1 ? 'habit' : 'habits'} ${now}, up from ${m} ${before}.` };
  }
  if (n === m) {
    return { icon: 'check', color: 'amber', title: "You're holding steady",
      text: `You completed ${n} ${n === 1 ? 'habit' : 'habits'}, the same as ${beforeBare}.` };
  }
  return { icon: 'arrow-up', color: 'orange', flip: true,
    title: `${isToday ? 'Yesterday' : weekdayLong(prev)} was stronger`,
    text: `You completed ${n} ${now}, down from ${m} ${before}.` };
}

function InsightsCard(state) {
  let longest = null;
  for (const habit of state.habits) {
    const best = bestStreak(habit);
    if (best > 0 && (!longest || best > longest.best)) longest = { habit, best };
  }
  const top = topHabitForWeek(state, startOfWeek(state.selectedDate));

  const items = [
    consistencyInsight(state),
    {
      icon: 'star', color: 'purple', title: 'Longest streak',
      text: longest ? `${streakText(longest.best)} (${longest.habit.name})` : 'No streaks yet',
    },
    {
      icon: 'target', color: 'blue', title: 'Top habit this week',
      text: top ? `${top.habit.name} (${top.count}/7 days)` : 'No habits completed yet',
    },
  ];

  return `
    <section class="card side-card" aria-labelledby="insights-title">
      <div class="card-head">
        <h2 id="insights-title" class="card-head__title">${Icon('bulb', 20)} Insights</h2>
        <button type="button" class="kebab" data-route="habits" data-focus-key="insights-open" aria-label="Open habits">${Icon('chevron-right', 20)}</button>
      </div>
      <ul class="insights">
        ${items.map(it => `
          <li class="insight">
            <span class="tint-icon ${it.flip ? 'is-flipped' : ''}" style="${colorStyle(it.color)}">${Icon(it.icon, 20)}</span>
            <span class="insight__text">
              <span class="insight__title">${escapeHtml(it.title)}</span>
              <span class="insight__sub">${escapeHtml(it.text)}</span>
            </span>
          </li>`).join('')}
      </ul>
    </section>
  `;
}

function QuickActionsCard() {
  const tiles = [
    { action: 'add-habit', icon: 'plus', color: 'blue', label: 'Add Habit' },
    { action: 'add-task', icon: 'checkbox', color: 'purple', label: 'Add Task' },
    { route: 'reports', icon: 'chart-bar', color: 'green', label: 'View Reports' },
    { route: 'settings', icon: 'settings', color: 'gray', label: 'Settings' },
  ];
  return `
    <section class="card side-card" aria-labelledby="qa-title">
      <div class="card-head"><h2 id="qa-title" class="card-head__title">${Icon('bolt', 20)} Quick Actions</h2></div>
      <div class="qa-grid">
        ${tiles.map((t, i) => `
          <button type="button" class="qa-tile" data-focus-key="qa:${i}"
            ${t.route ? `data-route="${t.route}"` : `data-action="${t.action}"`}>
            <span class="tint-icon" style="--size:44px;${colorStyle(t.color)}">${Icon(t.icon, 22)}</span>
            <span>${t.label}</span>
          </button>`).join('')}
      </div>
    </section>
  `;
}

function SidePanel(state) {
  return CompletionCard(state) + WeeklyCard(state) + InsightsCard(state) + QuickActionsCard();
}

/** Bind the parts of the side panel that aren't plain data-route / data-action buttons. */
function bindSidePanel(container) {
  const select = container.querySelector('#weekly-range');
  if (select) {
    select.addEventListener('change', () => {
      weeklyRange = select.value === 'last' ? 'last' : 'this';
      Store.refresh();
    });
  }
}
