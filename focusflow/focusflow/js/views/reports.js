/**
 * Reports view.
 * 30-day summary of habit completion: three headline numbers, a daily
 * bar chart and a per-habit table. Reached from the dashboard's
 * "View Reports" quick action; no sidebar item of its own.
 */
function renderReports(state) {
  const root = document.getElementById('view-root');
  const today = todayKey();
  const from = addDays(today, -29);
  const days = daysInRange(from, today).map(key => ({
    key,
    done: doneOnDay(state, key),
    total: totalOnDay(state, key),
    pct: completionPct(state, key),
  }));

  const range = rangeCompletion(state, from, today);

  let longest = null;
  for (const habit of state.habits) {
    const best = bestStreak(habit);
    if (best > 0 && (!longest || best > longest.best)) longest = { habit, best };
  }

  const monthPrefix = today.slice(0, 7);
  const monthDone = state.habits.reduce((sum, h) =>
    sum + Object.keys(h.completions).filter(k => h.completions[k] && k.startsWith(monthPrefix) && k <= today).length, 0);

  const cards = [
    { icon: 'target', color: 'blue', value: `${range.pct}%`, label: '30-day completion rate' },
    { icon: 'flame', color: 'purple', value: longest ? streakText(longest.best) : '0 days', label: longest ? `Best streak (${longest.habit.name})` : 'Best streak' },
    { icon: 'check', color: 'green', value: monthDone, label: 'Habits completed this month' },
  ];

  // Label every 5th bar (and the last) with its day of the month.
  const bars = days.map((d, i) => {
    const text = `${formatMedium(d.key)}: ${d.done} of ${d.total} habits`;
    const showLabel = i % 5 === 0 || i === days.length - 1;
    return `
      <div class="rp-col">
        <div class="rp-bar" role="img" aria-label="${text}" title="${text}">
          ${d.pct ? `<div class="rp-bar__fill" style="height:${d.pct}%"></div>` : ''}
        </div>
        <span class="rp-col__label">${showLabel ? dayOfMonth(d.key) : ''}</span>
      </div>`;
  }).join('');

  const rows = state.habits.map(h => `
    <tr>
      <th scope="row">
        <span class="rp-habit">
          <span class="tint-icon" style="--size:36px;${colorStyle(h.color)}">${Icon(h.icon, 18)}</span>
          <span>${escapeHtml(h.name)}</span>
        </span>
      </th>
      <td>${habitRate(h, from, today)}%</td>
      <td>${streakText(currentStreak(h))}</td>
      <td>${streakText(bestStreak(h))}</td>
    </tr>`).join('');

  root.innerHTML = `
    <div class="dash">
      <button type="button" class="back-link" data-route="dashboard" data-focus-key="back-dashboard">
        ${Icon('chevron-left', 18)} Back to dashboard
      </button>
      <div class="view-header">
        <div>
          <h1>Reports</h1>
          <p>Your last 30 days, ${formatMedium(from)} to ${formatMedium(today)}.</p>
        </div>
      </div>

      <div class="rp-cards">
        ${cards.map(c => `
          <div class="card rp-card">
            <span class="tint-icon" style="${colorStyle(c.color)}">${Icon(c.icon, 20)}</span>
            <span class="rp-card__value">${c.value}</span>
            <span class="rp-card__label">${escapeHtml(c.label)}</span>
          </div>`).join('')}
      </div>

      <section class="card side-card rp-section" aria-labelledby="rp-chart-title">
        <div class="card-head"><h2 id="rp-chart-title">Daily completion</h2></div>
        <div class="rp-bars" role="group" aria-label="Daily habit completion, last 30 days">${bars}</div>
      </section>

      <section class="card side-card rp-section" aria-labelledby="rp-table-title">
        <div class="card-head"><h2 id="rp-table-title">By habit</h2></div>
        ${state.habits.length ? `
          <div class="rp-table-wrap" role="region" aria-label="Per-habit statistics" tabindex="0">
            <table class="rp-table">
              <thead>
                <tr><th scope="col">Habit</th><th scope="col">30-day rate</th><th scope="col">Current streak</th><th scope="col">Best streak</th></tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </div>` : '<p class="empty-note">No habits yet.</p>'}
      </section>
    </div>
  `;

  bindRouteLinks(root);
}
