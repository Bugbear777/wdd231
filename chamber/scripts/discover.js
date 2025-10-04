document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("discoverGrid");
  const visitorMessage = document.getElementById("visitorMessage");

  fetch("./scripts/discover.json")
    .then(res => res.json())
    .then(items => {
      items.forEach((item, index) => {
        const card = document.createElement("article");
        card.className = "discover-card";
        card.style.gridArea = `card${index+1}`;

        card.innerHTML = `
          <figure>
            <img src="${item.image}" alt="${item.name}">
          </figure>
          <h2>${item.name}</h2>
          <address>${item.address}</address>
          <p>${item.description}</p>
          <button>Learn More</button>
        `;
        grid.appendChild(card);
      });
    });

  // Visitor message via localStorage
  const lastVisit = localStorage.getItem("lastVisit");
  const now = Date.now();

  if (!lastVisit) visitorMessage.textContent = "Welcome! Let us know if you have any questions.";
  else {
    const diffDays = Math.floor((now - lastVisit) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) visitorMessage.textContent = "Back so soon! Awesome!";
    else if (diffDays === 1) visitorMessage.textContent = "You last visited 1 day ago.";
    else visitorMessage.textContent = `You last visited ${diffDays} days ago.`;
  }

  localStorage.setItem("lastVisit", now);
});

