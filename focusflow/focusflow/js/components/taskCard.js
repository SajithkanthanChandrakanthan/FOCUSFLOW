/**
 * TaskCard component.
 * Pure render function: given a task object, returns its markup.
 * Reused on the Tasks view and in the login page's preview, which passes
 * plain { color } objects with no due date — both shapes are supported.
 */
function TaskCard(task) {
  // An explicit task.color wins; otherwise use the category's colour token.
  const color = task.color || colorToken(CATEGORY_COLORS[task.category]).base;
  const due = formatDue(task);
  const title = escapeHtml(task.title);
  return `
    <div class="task-card ${task.done ? 'is-done' : ''}" style="--cat-color:${color}" data-task-id="${task.id}">
      <button class="task-card__check" data-action="toggle-task" data-id="${task.id}" aria-label="Mark ${title} as ${task.done ? 'not done' : 'done'}">
        ${task.done ? Icon('check', 14) : ''}
      </button>
      <div class="task-card__body">
        <p class="task-card__title">${title}</p>
        <div class="task-card__meta">
          ${due ? `<span class="task-card__due ${isOverdue(task) ? 'is-overdue' : ''}">${due}</span>` : ''}
          <span class="task-card__tag">${escapeHtml(task.category)}</span>
        </div>
      </div>
      <button class="btn btn--icon" data-action="remove-task" data-id="${task.id}" aria-label="Delete ${title}">${Icon('x', 18)}</button>
    </div>
  `;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  // Quotes too: the result is also interpolated into attribute values
  // (e.g. the Settings profile inputs), where a bare " would break out
  // of the attribute. Harmless in text contexts — the parser decodes it.
  return div.innerHTML.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** Delegated event binding — call once per container after render. */
function bindTaskCardEvents(container) {
  container.querySelectorAll('[data-action="toggle-task"]').forEach(btn => {
    btn.addEventListener('click', () => Store.toggleTask(btn.dataset.id));
  });
  container.querySelectorAll('[data-action="remove-task"]').forEach(btn => {
    btn.addEventListener('click', () => {
      Store.removeTask(btn.dataset.id);
      showToast('Task deleted');
    });
  });
}
