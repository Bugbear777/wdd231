// Dynamically display the current year
document.getElementById("currentyear").textContent = new Date().getFullYear();

// Dynamically display last modified date
document.getElementById("lastModified").textContent = "Last Modified: " + document.lastModified;

//Navigation scripts
document.addEventListener("DOMContentLoaded", () => {
  const navToggle = document.getElementById("navToggle");
  const siteHeader = document.querySelector(".site-header");
  const mainNav = document.getElementById("mainNav");
  if (!navToggle || !siteHeader || !mainNav) return;

  navToggle.addEventListener("click", () => {
    const isOpen = siteHeader.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");

    // move focus into the nav for keyboard users when opening
    if (isOpen) {
      const firstLink = mainNav.querySelector("a");
      if (firstLink) firstLink.focus();
    } else {
      navToggle.focus(); // return focus to toggle when closing
    }
  });
});

// view-toggle.js
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('gamesContainer');
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

// view-games.js
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('gamesContainer');
  const gridBtn = document.getElementById('gridViewBtn');
  const listBtn = document.getElementById('listViewBtn');
  const countEl = document.getElementById('gameCount');
  const searchInput = document.getElementById('gameSearch');
  const navToggle = document.getElementById('navToggle');
  const header = document.querySelector('.site-header');

  let games = [];
  let filtered = [];
  let viewMode = 'grid-view';

  // Difficulty badge mapping
  function difficultyBadge(level) {
    if (level >= 3) return { cls: 'gold', text: 'Hard' };
    if (level >= 2) return { cls: 'silver', text: 'Medium' };
    return { cls: 'game', text: 'Easy' };
  }

  // Render games
  function renderGame(data) {
    container.innerHTML = '';
    if (!data || data.length === 0) {
      container.innerHTML = '<p>No games found.</p>';
      countEl.textContent = 'Showing 0 games';
      return;
    }

    const frag = document.createDocumentFragment();
    

    data.forEach(m => {
      const { id, title, maker, player_count, playtime, difficulty, genres, description, image } = m;

      const article = document.createElement('article');
      article.className = 'game-card';
      article.setAttribute('tabindex', '0');
      article.setAttribute('data-id', id);

      // Image
      const img = document.createElement('img');
      img.className = 'game-thumb';
      img.src = image || './images/game-placeholder.jpg';
      img.alt = title;
      img.loading = 'lazy';

      // Main content
      const main = document.createElement('div');
      main.className = 'card-main';

      const h3 = document.createElement('h3');
      h3.textContent = title;

      const info = document.createElement('p');
      info.className = 'game-info';
      info.textContent = `${maker} • ${player_count} • ${playtime}`;

      const desc = document.createElement('p');
      desc.className = 'game-info';
      desc.textContent = description;

      main.appendChild(h3);
      main.appendChild(info);
      main.appendChild(desc);

      // Meta (difficulty + genres)
      const meta = document.createElement('div');
      meta.className = 'card-meta';

      const badgeInfo = difficultyBadge(difficulty);
      const badge = document.createElement('span');
      badge.className = `badge ${badgeInfo.cls}`;
      badge.textContent = badgeInfo.text;
      meta.appendChild(badge);

      if (genres && genres.length) {
        const genreEl = document.createElement('p');
        genreEl.className = 'game-info';
        genreEl.textContent = genres.join(', ');
        meta.appendChild(genreEl);
      }

      // Assemble article
      article.appendChild(img);
      article.appendChild(main);
      article.appendChild(meta);

      frag.appendChild(article);

      article.addEventListener('click', () => openModal(m));
    });

    container.appendChild(frag);
    countEl.textContent = `Showing ${data.length} games`;
  }

  // Fetch games JSON
  async function loadGames() {
    try {
      const res = await fetch('data/games.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      games = data;
      filtered = games.slice();
      renderGame(filtered);
    } catch (err) {
      console.error('Failed to load games:', err);
      container.innerHTML = '<p class="error">Unable to load games. Please try again later.</p>';
      countEl.textContent = '';
    }
  }

  // View toggle
  function setView(mode) {
    container.classList.remove('grid-view', 'list-view');
    container.classList.add(mode);
    gridBtn.setAttribute('aria-pressed', mode === 'grid-view' ? 'true' : 'false');
    listBtn.setAttribute('aria-pressed', mode === 'list-view' ? 'true' : 'false');
    try { localStorage.setItem('directoryView', mode); } catch (e) {}
  }
  gridBtn.addEventListener('click', () => setView('grid-view'));
  listBtn.addEventListener('click', () => setView('list-view'));

  // Search
  function doSearch(q) {
    if (!q) {
      filtered = games.slice();
    } else {
      const term = q.trim().toLowerCase();
      filtered = games.filter(m => {
        return (m.title && m.title.toLowerCase().includes(term))
            || (m.description && m.description.toLowerCase().includes(term))
            || (m.maker && m.maker.toLowerCase().includes(term))
            || (m.genres && m.genres.some(g => g.toLowerCase().includes(term)))
            || (m.difficulty && String(m.difficulty).startsWith(term));
      });
    }
    renderGame(filtered);
  }
  searchInput.addEventListener('input', e => doSearch(e.target.value));

  // Keyboard support for view toggle
  const toolbar = document.querySelector('.view-toggle');
  toolbar && toolbar.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const current = gridBtn.getAttribute('aria-pressed') === 'true' ? 'grid-view' : 'list-view';
      const next = current === 'grid-view' && e.key === 'ArrowRight' ? 'list-view'
                 : current === 'list-view' && e.key === 'ArrowLeft' ? 'grid-view'
                 : current;
      setView(next);
      if (next === 'grid-view') gridBtn.focus(); else listBtn.focus();
    }
  });

  // Mobile nav toggle
  navToggle && navToggle.addEventListener('click', () => {
    const open = header.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  // Init view from storage
  try {
    const saved = localStorage.getItem('directoryView');
    viewMode = saved === 'list-view' ? 'list-view' : 'grid-view';
  } catch (e) {}

  setView(viewMode);
  loadGames();
});

