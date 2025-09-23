 // Populate timestamp
  document.getElementById('timestamp').value = new Date().toISOString();

  // Modal functionality
  const links = document.querySelectorAll('.card a');
  const modals = document.querySelectorAll('.modal');
  const closeButtons = document.querySelectorAll('.close');

  links.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const modalId = link.dataset.modal;
      document.getElementById(modalId).style.display = 'block';
    });
  });

  closeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.modal').style.display = 'none';
    });
  });

  window.addEventListener('click', e => {
    modals.forEach(modal => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  });