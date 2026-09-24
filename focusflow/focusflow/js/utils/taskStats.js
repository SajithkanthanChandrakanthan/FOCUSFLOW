/**
 * Task helpers: pure functions over state / task objects (no DOM, no Store).
 * Requires utils/dates.js.
 */

function tasksForDay(state, key) {
  return state.tasks.filter(t => t.dueDate === key);
}

/** Sort key: due date, then due time; tasks without a date go last. */
function dueSortKey(task) {
  return `${task.dueDate || '9999-12-31'} ${task.dueTime || '00:00'}`;
}

function compareByDue(a, b) {
  return dueSortKey(a).localeCompare(dueSortKey(b));
}

/** Not-done tasks, soonest first. */
function upcomingTasks(state, limit = 5) {
  return state.tasks.filter(t => !t.done).sort(compareByDue).slice(0, limit);
}

/** Overdue means the due DATE has passed (a task due later today is not overdue). */
function isOverdue(task) {
  return !task.done && !!task.dueDate && task.dueDate < todayKey();
}

/** "Today · 2:00 PM", "Tomorrow · 8:00 PM", "Wed 24 Sep · 9:00 AM". */
function formatDue(task) {
  if (!task.dueDate) return '';
  const today = todayKey();
  let day;
  if (task.dueDate === today) day = 'Today';
  else if (task.dueDate === addDays(today, 1)) day = 'Tomorrow';
  else day = formatMedium(task.dueDate);
  const time = task.dueTime ? formatTime12(task.dueTime) : '';
  return time ? `${day} · ${time}` : day;
}
