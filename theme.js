(() => {
  const key = 'attribute-flow:theme';
  const system = matchMedia('(prefers-color-scheme: dark)');
  let preference = 'system';
  try {
    const stored = localStorage.getItem(key);
    if (['system', 'light', 'dark'].includes(stored)) preference = stored;
  } catch {}

  function apply() {
    document.documentElement.dataset.theme = preference === 'system'
      ? system.matches ? 'dark' : 'light'
      : preference;
    const button = document.querySelector('[data-theme-toggle]');
    if (button) {
      const label = preference[0].toUpperCase() + preference.slice(1);
      button.textContent = `Theme: ${label}`;
      button.setAttribute('aria-label', `Change theme. Current setting: ${label}`);
    }
  }

  apply();
  system.addEventListener('change', () => { if (preference === 'system') apply(); });
  document.addEventListener('DOMContentLoaded', () => {
    apply();
    document.querySelector('[data-theme-toggle]').addEventListener('click', () => {
      const modes = ['system', 'light', 'dark'];
      preference = modes[(modes.indexOf(preference) + 1) % modes.length];
      apply();
      try { localStorage.setItem(key, preference); } catch {}
    });
  });
})();
