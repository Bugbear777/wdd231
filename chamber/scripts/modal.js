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
    // Select all modal links and modals
    const modalLinks = document.querySelectorAll('.modal-link');
    const modals = document.querySelectorAll('.modal');
    const closeButtons = document.querySelectorAll('.close');

    // Open the modal when a link is clicked
    modalLinks.forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault(); // prevent page jump
        const modalId = link.dataset.modal;
        const modal = document.getElementById(modalId);
        if (modal) modal.style.display = 'block';
    });
    });

    // Close modal when clicking the close button
    closeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        btn.closest('.modal').style.display = 'none';
    });
    });

    // Close modal when clicking outside the modal content
    window.addEventListener('click', e => {
    modals.forEach(modal => {
        if (e.target === modal) {
        modal.style.display = 'none';
        }
    });
    });
});
  