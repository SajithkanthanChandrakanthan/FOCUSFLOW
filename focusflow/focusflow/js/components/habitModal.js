/**
 * Habit modals: the shared add/edit form and the delete confirmation.
 * Icon and colour are native radio groups drawn as tiles/swatches, so
 * FormData collects them and the keyboard works with no extra code.
 */
function openHabitModal(habit, returnFocusKey) {
  const editing = !!habit;
  const name = editing ? habit.name : '';
  const subtitle = editing ? habit.subtitle : '';
  const icon = editing && HABIT_ICONS.includes(habit.icon) ? habit.icon : HABIT_ICONS[0];
  const color = editing && HABIT_COLORS.includes(habit.color) ? habit.color : HABIT_COLORS[0];

  const iconTiles = HABIT_ICONS.map(i => `
    <label class="pick">
      <input type="radio" name="icon" value="${i}" ${i === icon ? 'checked' : ''} />
      <span class="pick__face">${Icon(i, 22)}</span>
      <span class="sr-only">${i.replace('-', ' ')}</span>
    </label>`).join('');

  const swatches = HABIT_COLORS.map(c => `
    <label class="pick pick--swatch" style="${colorStyle(c)}">
      <input type="radio" name="color" value="${c}" ${c === color ? 'checked' : ''} />
      <span class="pick__face">${Icon('check', 18)}</span>
      <span class="sr-only">${c}</span>
    </label>`).join('');

  openModal({
    title: editing ? 'Edit habit' : 'Add a habit',
    returnFocusKey,
    bodyHtml: `
      <div class="modal__field">
        <label for="habit-name">Name</label>
        <input id="habit-name" name="name" required maxlength="40" autocomplete="off"
          pattern=".*\\S.*" title="Enter a name" placeholder="e.g. Morning walk" value="${escapeHtml(name)}" />
      </div>
      <div class="modal__field">
        <label for="habit-subtitle">Subtitle</label>
        <input id="habit-subtitle" name="subtitle" maxlength="60" autocomplete="off"
          placeholder="e.g. 20 minutes" value="${escapeHtml(subtitle)}" />
      </div>
      <fieldset class="modal__field">
        <legend>Icon</legend>
        <div class="pick-group">${iconTiles}</div>
      </fieldset>
      <fieldset class="modal__field">
        <legend>Colour</legend>
        <div class="pick-group">${swatches}</div>
      </fieldset>
    `,
    onSubmit: (data) => {
      const values = {
        name: (data.name || '').trim(),
        subtitle: (data.subtitle || '').trim(),
        icon: data.icon,
        color: data.color,
      };
      if (!values.name) return false;
      if (editing) {
        Store.updateHabit(habit.id, values);
        showToast('Habit updated');
      } else {
        Store.addHabit(values);
        showToast('Habit added');
      }
    },
  });
}

function confirmDeleteHabit(habit, returnFocusKey) {
  openModal({
    title: 'Delete habit?',
    confirmLabel: 'Delete',
    confirmVariant: 'btn--danger-solid',
    returnFocusKey,
    bodyHtml: `
      <p class="modal__prose">
        This removes <strong>${escapeHtml(habit.name)}</strong> and its whole history.
        It cannot be undone.
      </p>
    `,
    onSubmit: () => {
      Store.removeHabit(habit.id);
      showToast('Habit deleted');
    },
  });
}
