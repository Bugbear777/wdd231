 // Populate timestamp
  document.getElementById('timestamp').value = new Date().toISOString();

  const triggers = document.querySelectorAll('.open-dialog');
  let lastTrigger = null;

  triggers.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = btn.dataset.modal;
      const dlg = document.getElementById(id);
      if (!dlg) return;
      lastTrigger = btn;
      // showModal is supported in modern browsers; fallback to a simple role-based toggle if needed
      if (typeof dlg.showModal === 'function') {
        dlg.showModal();
        // focus the first focusable (close button)
        const close = dlg.querySelector('.dialog-close, button');
        if (close) close.focus();
      } else {
        // polyfill-like fallback: make visible
        dlg.setAttribute('open', '');
      }
    });
  });

  // Close behavior & return focus to trigger
  document.querySelectorAll('dialog .dialog-close').forEach(close => {
    close.addEventListener('click', () => {
      const dlg = close.closest('dialog');
      if (!dlg) return;
      if (typeof dlg.close === 'function') dlg.close();
      if (lastTrigger) lastTrigger.focus();
    });
  });

  // Close on ESC and click outside (for browsers that support dialog)
  document.querySelectorAll('dialog').forEach(dlg => {
    dlg.addEventListener('cancel', (ev) => { // user pressed esc
      // allow default close
      if (lastTrigger) lastTrigger.focus();
    });
    dlg.addEventListener('click', (e) => {
      // click on backdrop closes dialog (only if click outside content)
      const rect = dlg.getBoundingClientRect();
      const clickedIn = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
      // if clicked outside element area (some browsers might dispatch click on dialog for backdrop)
      if (!clickedIn && typeof dlg.close === 'function') {
        dlg.close();
        if (lastTrigger) lastTrigger.focus();
      }
    });
  });