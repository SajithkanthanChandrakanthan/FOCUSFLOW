/**
 * Habits view.
 * The same Habit Tracker component the Dashboard uses, at full width,
 * with an "Add habit" action in the page header.
 */
function renderHabits(state) {
  const root = document.getElementById('view-root');
  root.innerHTML = `
    <div class="view-header">
      <div>
        <h1>Habits</h1>
        <p>Tap a circle to log a habit for that day.</p>
      </div>
      <button type="button" class="btn btn--primary" data-action="add-habit" data-focus-key="add-habit">${Icon('plus', 18)} Add habit</button>
    </div>
    ${HabitTracker(state)}
  `;

  bindDatePills(root);
  bindHabitTracker(root);
}
