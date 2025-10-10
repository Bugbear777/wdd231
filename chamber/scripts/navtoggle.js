document.addEventListener("DOMContentLoaded", () => {
  const navToggle = document.getElementById("navToggle");
  const siteHeader = document.querySelector(".site-header");

  navToggle.addEventListener("click", () => {
    const isOpen = siteHeader.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", isOpen);
  });
});