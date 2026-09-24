/**
 * Modal component.
 * Generic overlay shell that accepts a title and inner HTML/submit
 * handler, so "Add habit", "Add task" and the delete confirmations all
 * reuse the same component instead of separate dialogs.
 *
 * onSubmit(formData) may return false to keep the modal open (validation).
 * Focus moves into the dialog on open and returns to the control that
 * opened it on close (identified by its data-focus-key).
 */
let modalReturnFocusKey = null;

function openModal({ title, bodyHtml, onSubmit, confirmLabel = 'Save', confirmVariant = 'btn--primary', returnFocusKey }) {
  const root = document.getElementById('modal-root');
  modalReturnFocusKey = returnFocusKey !== undefined ? returnFocusKey : captureFocusKey();

  root.innerHTML = `
    <div class="modal-overlay" data-action="close-modal">
      <div class="modal" role="dialog" aria-modal="true" aria-label="${title}" onclick="event.stopPropagation()">
        <div class="modal__header">
          <h3>${title}</h3>
          <button type="button" class="btn btn--icon" data-action="close-modal" aria-label="Close">${Icon('x', 20)}</button>
        </div>
        <form id="modal-form">${bodyHtml}</form>
        <div class="modal__actions">
          <button type="button" class="btn btn--ghost" data-action="close-modal" data-modal-cancel>Cancel</button>
          <button type="submit" form="modal-form" class="btn ${confirmVariant}">${confirmLabel}</button>
        </div>
      </div>
    </div>
  `;

  root.querySelectorAll('[data-action="close-modal"]').forEach(el => {
    el.addEventListener('click', closeModal);
  });

  const modal = root.querySelector('.modal');
  modal.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      closeModal();
      return;
    }
    if (event.key !== 'Tab') return;
    // Keep Tab inside the dialog.
    const focusable = Array.from(modal.querySelectorAll('button, input, select, textarea, [tabindex]:not([tabindex="-1"])'))
      .filter(el => !el.disabled && el.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  document.getElementById('modal-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = Object.fromEntries(new FormData(e.target).entries());
    if (onSubmit(formData) === false) return;
    closeModal();
  });

  // First field if there is one; otherwise Cancel, so a destructive
  // confirmation is never one stray Enter away.
  const firstField = modal.querySelector('input:not([type="radio"]), select, textarea');
  (firstField || modal.querySelector('[data-modal-cancel]')).focus();
}

function closeModal() {
  document.getElementById('modal-root').innerHTML = '';
  restoreFocus(modalReturnFocusKey);
  modalReturnFocusKey = null;
}
