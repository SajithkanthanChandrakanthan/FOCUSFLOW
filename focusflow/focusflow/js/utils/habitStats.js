/**
 * Habit statistics.
 * Pure functions over state / habit objects: no DOM, no Store. Requires
 * utils/dates.js. A habit's `completions` is { 'YYYY-MM-DD': true }.
 */

/** Habits that already existed on `key`. */
function habitsForDay(state, key) {
  return state.habits.filter(h => h.createdAt <= key);
}

function doneOnDay(state, key) {
  return habitsForDay(state, key).filter(h => h.completions[key]).length;
}

function totalOnDay(state, key) {
  return habitsForDay(state, key).length;
}

function completionPct(state, key) {
  const total = totalOnDay(state, key);
  return total === 0 ? 0 : Math.round((doneOnDay(state, key) / total) * 100);
}

/** Consecutive completed days ending today, or yesterday if today isn't done yet. */
function currentStreak(habit) {
  const today = todayKey();
  let key = habit.completions[today] ? today : addDays(today, -1);
  let count = 0;
  while (habit.completions[key]) {
    count += 1;
    key = addDays(key, -1);
  }
  return count;
}

/** Longest run of consecutive completed days anywhere in the history. */
function bestStreak(habit) {
  const days = Object.keys(habit.completions).filter(k => habit.completions[k]).sort();
  let best = 0;
  let run = 0;
  let prev = null;
  for (const key of days) {
    run = prev !== null && addDays(prev, 1) === key ? run + 1 : 1;
    if (run > best) best = run;
    prev = key;
  }
  return best;
}

/** Consecutive days ending today (or yesterday) with at least one habit done. */
function dayStreak(state) {
  const anyDone = key => state.habits.some(h => h.completions[key]);
  const today = todayKey();
  let key = anyDone(today) ? today : addDays(today, -1);
  let count = 0;
  while (anyDone(key)) {
    count += 1;
    key = addDays(key, -1);
  }
  return count;
}

/** Seven entries Mon..Sun: { key, done, total, pct, future }. */
function weekSummary(state, weekStartKey) {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const key = addDays(weekStartKey, i);
    const future = isFuture(key);
    const total = totalOnDay(state, key);
    const done = future ? 0 : doneOnDay(state, key);
    days.push({ key, done, total, pct: total === 0 ? 0 : Math.round((done / total) * 100), future });
  }
  return days;
}

/** 'complete' (all done), 'partial', or 'none'. */
function dayStatus(state, key) {
  const total = totalOnDay(state, key);
  const done = doneOnDay(state, key);
  if (total > 0 && done === total) return 'complete';
  return done > 0 ? 'partial' : 'none';
}

/** { habit, count } for the habit with most completions that week, or null. */
function topHabitForWeek(state, weekStartKey) {
  let top = null;
  for (const habit of state.habits) {
    let count = 0;
    for (let i = 0; i < 7; i++) {
      if (habit.completions[addDays(weekStartKey, i)]) count += 1;
    }
    if (count > 0 && (!top || count > top.count)) top = { habit, count };
  }
  return top;
}

/** Inclusive list of day keys from `fromKey` to `toKey`. */
function daysInRange(from, to) {
  const keys = [];
  for (let key = from; key <= to; key = addDays(key, 1)) keys.push(key);
  return keys;
}

/** { done, total, pct } across every habit-day in the range (habits count from createdAt). */
function rangeCompletion(state, from, to) {
  let done = 0;
  let total = 0;
  for (const key of daysInRange(from, to)) {
    total += totalOnDay(state, key);
    done += doneOnDay(state, key);
  }
  return { done, total, pct: total === 0 ? 0 : Math.round((done / total) * 100) };
}

/** Completion rate 0-100 for one habit over a range, ignoring days before it existed. */
function habitRate(habit, from, to) {
  const days = daysInRange(from, to).filter(k => k >= habit.createdAt);
  if (!days.length) return 0;
  const done = days.filter(k => habit.completions[k]).length;
  return Math.round((done / days.length) * 100);
}
