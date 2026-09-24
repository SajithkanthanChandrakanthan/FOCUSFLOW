// Front-end only sign-in: FocusFlow has no backend, so accounts live in this
// browser (see auth.js). "signin" checks a password; "signup" creates an
// account that starts with a clean sheet.
let authMode = 'signin';

function renderLogin() {
  const root = document.getElementById('view-root');
  const signup = authMode === 'signup';

  root.innerHTML = `
    <section class="auth-shell" aria-labelledby="login-title">
      <div class="auth-panel auth-panel--form">
        <div class="auth-card">
          <div class="auth-brand">
            <svg class="auth-logo" width="40" height="28" viewBox="0 0 38 26" fill="none" aria-hidden="true">
              <path d="M3,15 L15,15 L21,23 L35,3" stroke-width="3.4"
                stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <span class="auth-wordmark">Focus<em>Flow</em></span>
          </div>

          <div class="auth-heading">
            <h1 id="login-title">${signup ? 'Create your account' : 'Welcome to FocusFlow'}</h1>
            <p>${signup ? 'Start with a clean sheet. Your habits and tasks stay yours.' : 'Sign in to continue'}</p>
          </div>

          <form class="auth-form" id="login-form" novalidate>
            ${signup ? `
            <div class="modal__field">
              <label for="login-name">Name</label>
              <input id="login-name" type="text" maxlength="40" autocomplete="name" aria-describedby="login-name-error" aria-invalid="false" />
              <p class="auth-error" id="login-name-error" role="alert"></p>
            </div>` : ''}

            <div class="modal__field">
              <label for="login-email">Email</label>
              <input id="login-email" type="email" autocomplete="email" aria-describedby="login-email-error" aria-invalid="false" />
              <p class="auth-error" id="login-email-error" role="alert"></p>
            </div>

            <div class="modal__field">
              <div class="auth-field-head">
                <label for="login-password">Password</label>
                ${signup ? '' : '<button class="auth-link" type="button" data-action="forgot-password">Forgot password?</button>'}
              </div>
              <div class="auth-password-control">
                <input id="login-password" type="password" autocomplete="${signup ? 'new-password' : 'current-password'}" aria-describedby="login-password-error" aria-invalid="false" />
                <button class="auth-password-toggle" type="button" aria-label="Show password">Show</button>
              </div>
              <p class="auth-error" id="login-password-error" role="alert"></p>
              ${signup ? '<p class="auth-hint">Use at least 8 characters.</p>' : ''}
            </div>

            <p class="auth-error auth-error--form" id="login-form-error" role="alert"></p>
            <button class="btn btn--primary auth-submit" type="submit">${signup ? 'Create account' : 'Login to Continue'}</button>
          </form>

          <p class="auth-switch">
            ${signup ? 'Already have an account?' : 'New to FocusFlow?'}
            <button class="auth-link" type="button" data-action="switch-mode">${signup ? 'Sign in' : 'Create an account'}</button>
          </p>

          <p class="auth-terms">By continuing, you're agreeing to our Terms of Service.</p>
        </div>
      </div>

      <aside class="auth-panel auth-panel--visual" aria-hidden="true" inert>
        <img class="auth-visual__img" src="assets/images/auth-illustration.jpg" alt="" />
      </aside>
    </section>
  `;

  bindLoginEvents(root);
}

function bindLoginEvents(container) {
  const signup = authMode === 'signup';
  const form = container.querySelector('#login-form');
  const nameInput = container.querySelector('#login-name');
  const emailInput = container.querySelector('#login-email');
  const passwordInput = container.querySelector('#login-password');
  const nameError = container.querySelector('#login-name-error');
  const emailError = container.querySelector('#login-email-error');
  const passwordError = container.querySelector('#login-password-error');
  const formError = container.querySelector('#login-form-error');
  const submitButton = container.querySelector('.auth-submit');
  const showPasswordButton = container.querySelector('.auth-password-toggle');
  const invalidFields = new Set();
  let busy = false;

  const validateName = () => (nameInput.value.trim() ? '' : 'Enter your name.');

  const validateEmail = () => {
    const value = emailInput.value.trim();
    if (!value) return 'Enter your email address.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter an email like name@example.com.';
    return '';
  };

  const validatePassword = () => {
    if (!passwordInput.value) return 'Enter your password.';
    if (passwordInput.value.length < 8) return 'Use at least 8 characters.';
    return '';
  };

  const setFieldError = (input, errorEl, message) => {
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    errorEl.textContent = message;
  };

  const fields = [
    ...(signup ? [{ input: nameInput, error: nameError, validate: validateName }] : []),
    { input: emailInput, error: emailError, validate: validateEmail },
    { input: passwordInput, error: passwordError, validate: validatePassword },
  ];

  // Re-validate a field live once it has been flagged, and clear the
  // form-level message as soon as the user starts correcting anything.
  fields.forEach(({ input, error, validate }) => {
    input.addEventListener('input', () => {
      formError.textContent = '';
      if (invalidFields.has(input)) setFieldError(input, error, validate());
    });
  });

  showPasswordButton.addEventListener('click', () => {
    const isHidden = passwordInput.type === 'password';
    passwordInput.type = isHidden ? 'text' : 'password';
    showPasswordButton.textContent = isHidden ? 'Hide' : 'Show';
    showPasswordButton.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
  });

  const forgot = container.querySelector('[data-action="forgot-password"]');
  if (forgot) {
    forgot.addEventListener('click', () => {
      showToast("Password reset isn't available yet");
    });
  }

  container.querySelector('[data-action="switch-mode"]').addEventListener('click', () => {
    authMode = signup ? 'signin' : 'signup';
    renderLogin();
    document.getElementById(authMode === 'signup' ? 'login-name' : 'login-email').focus();
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy) return;
    formError.textContent = '';

    let firstInvalid = null;
    fields.forEach(({ input, error, validate }) => {
      const message = validate();
      invalidFields.add(input);
      setFieldError(input, error, message);
      if (message && !firstInvalid) firstInvalid = input;
    });
    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    // Hashing takes a moment, so block double submits and show progress.
    busy = true;
    submitButton.disabled = true;
    submitButton.textContent = signup ? 'Creating account…' : 'Signing in…';

    const credentials = { email: emailInput.value.trim(), password: passwordInput.value };
    const result = signup
      ? await Auth.register({ ...credentials, name: nameInput.value })
      : await Auth.login(credentials);

    busy = false;
    submitButton.disabled = false;
    submitButton.textContent = signup ? 'Create account' : 'Sign in';

    if (!result.ok) {
      if (result.field === 'email') {
        setFieldError(emailInput, emailError, result.error);
        emailInput.focus();
      } else {
        formError.textContent = result.error;
        passwordInput.focus();
      }
      return;
    }

    authMode = 'signin';
    Store.signIn({ email: result.email, name: result.name, isNew: signup });
    showToast(signup ? 'Account created' : 'Signed in');
  });

  if (window.matchMedia('(hover: hover)').matches) {
    (nameInput || emailInput).focus();
  }
}
