/**
 * Add-task modal: title, category, due date and due time.
 * Shared by the Dashboard (Quick Actions, empty state) and the Tasks view.
 */
function openTaskModal(returnFocusKey) {
  openModal({
    title: 'Add a task',
    returnFocusKey,
    bodyHtml: `
      <div class="modal__field">
        <label for="task-title">Title</label>
        <input id="task-title" name="title" required maxlength="80" autocomplete="off"
          pattern=".*\\S.*" title="Enter a title" placeholder="e.g. Review PR #142" />
      </div>
      <div class="modal__field">
        <label for="task-category">Category</label>
        <select id="task-category" name="category">
          ${TASK_CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')}
        </select>
      </div>
      <div class="modal__row">
        <div class="modal__field">
          <label for="task-date">Due date</label>
          <input id="task-date" name="dueDate" type="date" required value="${todayKey()}" />
        </div>
        <div class="modal__field">
          <label for="task-time">Due time</label>
          <input id="task-time" name="dueTime" type="time" required value="09:00" />
        </div>
      </div>
    `,
    onSubmit: (data) => {
      const title = (data.title || '').trim();
      if (!title) return false;
      Store.addTask({ title, category: data.category, dueDate: data.dueDate, dueTime: data.dueTime });
      showToast('Task added');
    },
  });
}
