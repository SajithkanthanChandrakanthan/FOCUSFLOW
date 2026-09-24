/**
 * Auth: the local account "database".
 *
 * FocusFlow has no backend, so accounts live in this browser's localStorage
 * (see state.js for the keys). That means an account only exists on the
 * device it was created on. Passwords are never stored: each account keeps a
 * random salt and a PBKDF2-SHA256 hash of the password (Web Crypto), and
 * sign-in re-derives the hash and compares. Requires state.js helpers.
 */
const PBKDF2_ITERATIONS = 150000;
const DUMMY_SALT = new Uint8Array(16);

function toB64(bytes) {
  return btoa(String.fromCharCode(...bytes));
}

function fromB64(text) {
  return Uint8Array.from(atob(text), c => c.charCodeAt(0));
}

async function hashPassword(password, salt, iterations) {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, material, 256);
  return toB64(new Uint8Array(bits));
}

/** Compare without stopping at the first differing character. */
function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const Auth = {
  /** Web Crypto needs a secure context (https or localhost). */
  isReady() {
    return !!(window.crypto && crypto.subtle);
  },

  emailTaken(email) {
    return !!readAccounts().users[normalizeEmail(email)];
  },

  /** Create an account. Resolves { ok, email, name } or { ok:false, error, field? }. */
  async register({ name, email, password }) {
    if (!this.isReady()) {
      return { ok: false, error: 'This browser cannot secure passwords here. Open the app over https or localhost.' };
    }
    const key = normalizeEmail(email);
    if (this.emailTaken(key)) {
      return { ok: false, field: 'email', error: 'An account with this email already exists. Try signing in.' };
    }
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const hash = await hashPassword(password, salt, PBKDF2_ITERATIONS);

    // Re-read after the slow hash: another tab may have registered this email meanwhile.
    const accounts = readAccounts();
    if (accounts.users[key]) {
      return { ok: false, field: 'email', error: 'An account with this email already exists. Try signing in.' };
    }
    const cleanName = String(name || '').trim();
    accounts.users[key] = {
      email: key,
      name: cleanName,
      salt: toB64(salt),
      hash,
      iterations: PBKDF2_ITERATIONS,
      createdAt: todayKey(),
    };
    if (!writeAccounts(accounts)) {
      return { ok: false, error: "Couldn't save your account. Browser storage looks blocked or full." };
    }
    return { ok: true, email: key, name: cleanName };
  },

  /** Check credentials. The error is the same whether the email or the password is wrong. */
  async login({ email, password }) {
    if (!this.isReady()) {
      return { ok: false, error: 'This browser cannot secure passwords here. Open the app over https or localhost.' };
    }
    const key = normalizeEmail(email);
    const account = readAccounts().users[key];
    const hasPassword = !!(account && account.hash);
    // Do the same amount of work for unknown emails so timing doesn't reveal which exist.
    const salt = hasPassword ? fromB64(account.salt) : DUMMY_SALT;
    const hash = await hashPassword(password, salt, hasPassword ? account.iterations : PBKDF2_ITERATIONS);
    if (!hasPassword || !safeEqual(hash, account.hash)) {
      return { ok: false, error: 'Incorrect email or password.' };
    }
    return { ok: true, email: key, name: account.name };
  },

  /** Delete the account's credentials and data. The demo account only loses its data. */
  remove(email) {
    const key = normalizeEmail(email);
    removeKey(userDataKey(key));
    const accounts = readAccounts();
    if (accounts.users[key] && !accounts.users[key].demo) {
      delete accounts.users[key];
      writeAccounts(accounts);
    }
  },

  /** Move an account (and its data) to a new email. False if refused. */
  rename(oldEmail, newEmail) {
    const from = normalizeEmail(oldEmail);
    const to = normalizeEmail(newEmail);
    const accounts = readAccounts();
    const account = accounts.users[from];
    if (!account || account.demo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to) || accounts.users[to]) return false;
    delete accounts.users[from];
    accounts.users[to] = { ...account, email: to };
    if (!writeAccounts(accounts)) return false;
    removeKey(userDataKey(from));
    return true;
  },

  setName(email, name) {
    const accounts = readAccounts();
    const account = accounts.users[normalizeEmail(email)];
    if (!account || account.demo) return;
    account.name = name;
    writeAccounts(accounts);
  },
};
