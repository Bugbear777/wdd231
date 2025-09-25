 // Populate timestamp
  document.getElementById('timestamp').value = new Date().toISOString();

  // Modal functionality
  document.querySelectorAll('.open-dialog').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const modalId = link.dataset.modal;   // get value of data-modal
      const modal = document.getElementById(modalId);
      if (modal) modal.showModal();
    });
  });

  // Close buttons
  document.querySelectorAll('dialog .close-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      btn.closest('dialog').close();
    });
  });