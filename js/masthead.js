(() => {
  const mast = document.querySelector('.mast');
  if (!mast) return;
  const browse = mast.querySelector('.mast-directory');
  const finder = mast.querySelector('.mast-finder');
  const input = finder.querySelector('input');
  const panels = [browse, finder];

  panels.forEach(panel => panel.addEventListener('toggle', () => {
    if (!panel.open) return;
    for (const other of panels) {
      if (other !== panel) other.open = false;
    }
    if (panel === finder) input.focus();
  }));

  document.addEventListener('pointerdown', event => {
    for (const panel of panels) {
      if (!panel.contains(event.target)) panel.open = false;
    }
  });
  mast.addEventListener('focusout', event => {
    if (event.relatedTarget && !mast.contains(event.relatedTarget)) {
      panels.forEach(panel => { panel.open = false; });
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      const panel = panels.find(item => item.open);
      if (panel) {
        panel.open = false;
        panel.querySelector('summary').focus();
      }
      return;
    }
    const typing = event.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName);
    if ((event.key === '/' && !typing) || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k')) {
      event.preventDefault();
      finder.open = true;
      input.focus();
    }
  });
})();
