// view-toggle.js
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('memberContainer');
  const gridBtn = document.getElementById('gridViewBtn');
  const listBtn = document.getElementById('listViewBtn');

  // helper to set view and ARIA states
  function setView(mode) {
    container.classList.remove('grid-view', 'list-view');
    container.classList.add(mode);

    // update aria-pressed on buttons
    gridBtn.setAttribute('aria-pressed', mode === 'grid-view' ? 'true' : 'false');
    listBtn.setAttribute('aria-pressed', mode === 'list-view' ? 'true' : 'false');

    // save preference
    try { localStorage.setItem('directoryView', mode); } catch (e) { /* ignore */ }
  }

  // event listeners
  gridBtn.addEventListener('click', () => setView('grid-view'));
  listBtn.addEventListener('click', () => setView('list-view'));

  // keyboard support: allow left/right arrow to toggle while focus is in toolbar
  const toolbar = document.querySelector('.view-toggle');
  toolbar.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const mode = gridBtn.getAttribute('aria-pressed') === 'true' ? 'list-view' : 'grid-view';
      setView(mode);
      // move focus to the active button
      if (mode === 'grid-view') gridBtn.focus(); else listBtn.focus();
    }
  });

  // initialize from saved preference or default to grid
  const saved = (function () {
    try { return localStorage.getItem('directoryView'); } catch (e) { return null; }
  })();
  setView(saved === 'list-view' ? 'list-view' : 'grid-view');
});
