/**
 * DatePill component.
 * A button showing the selected day ("Tue, 23 Sep 2025") that opens the
 * browser's native date picker. A visually hidden <input type="date">
 * does the real work; showPicker() pops it open from the button click.
 * The header and the Habit Tracker each render one, and both read
 * Store.state.selectedDate, so they stay in sync automatically.
 */
function DatePill(state, focusKey) {
  const label = formatPill(state.selectedDate);
  return `
    <div class="date-pill-wrap">
      <button type="button" class="date-pill" data-focus-key="${focusKey}" aria-label="Choose date, ${label}">
        ${Icon('calendar', 18)}
        <span>${label}</span>
        ${Icon('chevron-down', 16)}
      </button>
      <input type="date" class="date-pill__input" value="${state.selectedDate}" max="${todayKey()}" tabindex="-1" aria-hidden="true" />
    </div>
  `;
}

/** Call once per render, after the markup is in the DOM. */
function bindDatePills(container) {
  container.querySelectorAll('.date-pill-wrap').forEach(wrap => {
    const button = wrap.querySelector('.date-pill');
    const input = wrap.querySelector('input');

    button.addEventListener('click', () => {
      try {
        if (typeof input.showPicker === 'function') input.showPicker();
        else input.click();
      } catch (e) {
        // showPicker throws if the browser refuses (e.g. no user activation).
        input.focus();
      }
    });

    input.addEventListener('change', () => {
      if (input.value) Store.setSelectedDate(input.value);
    });
  });
}
