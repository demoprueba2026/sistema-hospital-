// admin-theme.js – handles dark / light theme toggle for admin portal
// This replicates the behavior used in other pages.

// Set initial theme from localStorage or OS preference (already set by inline script in <head>)
const setTheme = (theme) => {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  // update aria-pressed for accessibility
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.setAttribute('aria-pressed', theme === 'dark');
};

const toggleTheme = () => {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = current === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
};

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  // Ensure button reflects current theme
  const saved = document.documentElement.getAttribute('data-theme') || 'light';
  btn.setAttribute('aria-pressed', saved === 'dark');
  btn.addEventListener('click', toggleTheme);
});

