/**
 * Toggle component.
 * Pure render function: given a labeled preference, returns the markup
 * for a row with a pill switch on the right. Settings renders every
 * boolean preference through this so each switch looks and behaves
 * alike, the same way TaskCard standardises a task row.
 */
function Toggle({ id, label, description, checked }) {
  return `
    <div class="toggle-row">
      <div class="toggle-row__text">
        <p class="toggle-row__label" id="${id}-label">${escapeHtml(label)}</p>
        ${description ? `<p class="toggle-row__description">${escapeHtml(description)}</p>` : ''}
      </div>
      <button
        type="button"
        class="toggle-switch ${checked ? 'is-on' : ''}"
        role="switch"
        aria-checked="${checked ? 'true' : 'false'}"
        aria-labelledby="${id}-label"
        data-action="toggle-switch"
        data-id="${id}"
        data-focus-key="toggle:${id}"
      >
        <span class="toggle-switch__thumb"></span>
      </button>
    </div>
  `;
}

/**
 * Delegated event binding — call once per container after render.
 * onChange receives (id, nextChecked); the caller owns the state write
 * so the component itself stays presentational.
 */
function bindToggleEvents(container, onChange) {
  container.querySelectorAll('[data-action="toggle-switch"]').forEach(btn => {
    btn.addEventListener('click', () => {
      onChange(btn.dataset.id, btn.getAttribute('aria-checked') !== 'true');
    });
  });
}
