/**
 * Tasks view.
 * Full task list with filter tabs and an "Add task" action that opens the
 * shared task modal.
 */

// Filter tab choice lives in a module variable so it survives re-renders.
let taskFilter = 'all';

const TASK_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'today', label: 'Today' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'done', label: 'Done' },
];

const TASK_EMPTY_TEXT = {
  all: 'No tasks yet. Add your first one.',
  today: 'Nothing due today.',
  upcoming: 'No upcoming tasks.',
  done: 'No completed tasks yet.',
};

function filterTasks(state, filter) {
  const today = todayKey();
  const all = [...state.tasks].sort(compareByDue);
  if (filter === 'today') return all.filter(t => t.dueDate === today);
  if (filter === 'upcoming') return all.filter(t => !t.done && t.dueDate > today);
  if (filter === 'done') return all.filter(t => t.done);
  // "All": open tasks first, finished ones after.
  return [...all.filter(t => !t.done), ...all.filter(t => t.done)];
}

function renderTasks(state) {
  const root = document.getElementById('view-root');
  const visible = filterTasks(state, taskFilter);
  root.innerHTML = `
    <div class="view-header">
      <div>
        <h1>Tasks</h1>
        <p>${state.tasks.filter(t => !t.done).length} open · ${state.tasks.length} total</p>
      </div>
      <button class="btn btn--primary" data-action="add-task" data-focus-key="add-task">${Icon('plus', 18)} Add task</button>
    </div>
    <div class="tabs" role="group" aria-label="Filter tasks">
      ${TASK_FILTERS.map(f => `
        <button type="button" class="tab ${taskFilter === f.id ? 'is-active' : ''}" data-action="set-filter" data-filter="${f.id}"
          data-focus-key="filter:${f.id}" aria-pressed="${taskFilter === f.id}">${f.label}</button>`).join('')}
    </div>
    <div id="tasks-list" class="tasks-list">
      ${visible.map(TaskCard).join('') || `<p class="empty-note">${TASK_EMPTY_TEXT[taskFilter]}</p>`}
    </div>
  `;

  bindTaskCardEvents(document.getElementById('tasks-list'));
  bindActions(root, {
    'add-task': () => openTaskModal(),
    'set-filter': el => {
      taskFilter = el.dataset.filter;
      Store.refresh();
    },
  });
}
