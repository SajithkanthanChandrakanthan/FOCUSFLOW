/**
 * Colour names -> design tokens.
 * Habits and categories store a colour NAME (e.g. 'purple'), never a hex
 * value, so both themes resolve it through the CSS tokens.
 */
const COLOR_TOKENS = {
  blue: { base: 'var(--color-primary)', tint: 'var(--color-primary-tint)' },
  green: { base: 'var(--color-success)', tint: 'var(--color-success-tint)' },
  purple: { base: 'var(--color-accent-purple)', tint: 'var(--color-accent-purple-tint)' },
  amber: { base: 'var(--color-accent-amber)', tint: 'var(--color-accent-amber-tint)' },
  orange: { base: 'var(--color-accent-orange)', tint: 'var(--color-accent-orange-tint)' },
  pink: { base: 'var(--color-accent-pink)', tint: 'var(--color-accent-pink-tint)' },
  teal: { base: 'var(--color-accent-teal)', tint: 'var(--color-accent-teal-tint)' },
  gray: { base: 'var(--color-ink-soft)', tint: 'var(--color-track)' },
};

const CATEGORY_COLORS = { Work: 'blue', Personal: 'green', Team: 'purple' };
const TASK_CATEGORIES = Object.keys(CATEGORY_COLORS);

const HABIT_COLORS = ['blue', 'green', 'purple', 'orange', 'pink', 'teal'];
const HABIT_ICONS = ['dumbbell', 'fork-knife', 'droplet', 'book', 'meditate', 'moon-stars', 'phone-off', 'target'];

function colorToken(name) {
  return COLOR_TOKENS[name] || COLOR_TOKENS.blue;
}

/** Inline-style fragment consumed by .tint-icon / .pill (--c and --c-tint). */
function colorStyle(name) {
  const c = colorToken(name);
  return `--c:${c.base};--c-tint:${c.tint}`;
}
