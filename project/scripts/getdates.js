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
  const gridBtn   = document.getElementById('gridViewBtn');
  const listBtn   = document.getElementById('listViewBtn');
  const toolbar   = document.querySelector('.view-toggle');

  // If this page doesn't have the view UI, skip initializing this feature.
  if (!(container && gridBtn && listBtn && toolbar)) return;

  function setView(mode) {
    container.classList.remove('grid-view', 'list-view');
    container.classList.add(mode);
    gridBtn.setAttribute('aria-pressed', mode === 'grid-view' ? 'true' : 'false');
    listBtn.setAttribute('aria-pressed', mode === 'list-view' ? 'true' : 'false');
    try { localStorage.setItem('directoryView', mode); } catch {}
  }

  gridBtn.addEventListener('click', () => setView('grid-view'));
  listBtn.addEventListener('click', () => setView('list-view'));

  toolbar.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const mode = gridBtn.getAttribute('aria-pressed') === 'true' ? 'list-view' : 'grid-view';
      setView(mode);
      (mode === 'grid-view' ? gridBtn : listBtn).focus();
    }
  });

  const saved = (() => { try { return localStorage.getItem('directoryView'); } catch { return null; } })();
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

  // Modal elements
  const modal = document.getElementById('gameModal');
  const modalClose = modal ? modal.querySelector('.modal-close') : null;
  const modalTitle = modal ? modal.querySelector('#modalTitle') : null;
  const modalImage = modal ? modal.querySelector('#modalImage') : null;
  const modalMaker = modal ? modal.querySelector('#modalMaker') : null;
  const modalPlayers = modal ? modal.querySelector('#modalPlayers') : null;
  const modalPlaytime = modal ? modal.querySelector('#modalPlaytime') : null;
  const modalDifficulty = modal ? modal.querySelector('#modalDifficulty') : null;
  const modalGenres = modal ? modal.querySelector('#modalGenres') : null;
  const modalDescription = modal ? modal.querySelector('#modalDescription') : null;

  let lastFocusedEl = null;

  let games = [];
  let filtered = [];
  let viewMode = 'grid-view';

  // Difficulty badge mapping (bronze/silver/gold to match CSS)
  function difficultyBadge(level) {
    if (level === 3) return { cls: 'gold', text: 'Hard' };
    if (level === 2) return { cls: 'silver', text: 'Medium' };
    return { cls: 'bronze', text: 'Easy' };
  }

  // Open/Close modal (with Escape + basic focus return)
  function openModal(game) {
    if (!modal) return;
    lastFocusedEl = document.activeElement;

    modalTitle.textContent = game.title;
    modalImage.src = game.image || './images/game-placeholder.jpg';
    modalImage.alt = game.title;
    modalMaker.textContent = `Maker: ${game.maker}`;
    modalPlayers.textContent = `Players: ${game.player_count}`;
    modalPlaytime.textContent = `Playtime: ${game.playtime}`;
    modalDifficulty.textContent = `Difficulty: ${difficultyBadge(game.difficulty).text}`;
    modalGenres.textContent = `Genres: ${game.genres.join(', ')}`;
    modalDescription.textContent = game.description;

    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');

    // move focus into modal
    (modalClose || modal).focus();
    document.addEventListener('keydown', onEsc, true);
  }

  function closeModal() {
    if (!modal) return;
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    document.removeEventListener('keydown', onEsc, true);
    // return focus to the last focused element
    if (lastFocusedEl && typeof lastFocusedEl.focus === 'function') lastFocusedEl.focus();
  }

  function onEsc(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeModal();
    }
  }

  modalClose && modalClose.addEventListener('click', closeModal);
  modal && modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Render games
  function renderGame(data) {
    container.innerHTML = '';
    if (!data || data.length === 0) {
      container.innerHTML = '<p>No games found.</p>';
      if (countEl) countEl.textContent = 'Showing 0 games';
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

      // Learn More button
      const learnMoreBtn = document.createElement('button');
      learnMoreBtn.className = 'learn-more-btn';
      learnMoreBtn.type = 'button';
      learnMoreBtn.textContent = 'Learn More';
      learnMoreBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openModal(m);
      });

      main.appendChild(h3);
      main.appendChild(info);
      main.appendChild(desc);
      main.appendChild(learnMoreBtn);

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
    });

    container.appendChild(frag);
    if (countEl) countEl.textContent = `Showing ${data.length} games`;
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
      if (countEl) countEl.textContent = '';
    }
  }

  // View toggle
  // If this page doesn't host the games UI, bail early
if (!container) return;

// View toggle (only wire if buttons exist)
function setView(mode) {
  container.classList.remove('grid-view', 'list-view');
  container.classList.add(mode);
  gridBtn?.setAttribute('aria-pressed', mode === 'grid-view' ? 'true' : 'false');
  listBtn?.setAttribute('aria-pressed', mode === 'list-view' ? 'true' : 'false');
  try { localStorage.setItem('directoryView', mode); } catch (e) {}
}
gridBtn?.addEventListener('click', () => setView('grid-view'));
listBtn?.addEventListener('click', () => setView('list-view'));


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

  // Mobile nav toggle (if present)
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
// --- Game of the Week (homepage) ---
document.addEventListener('DOMContentLoaded', () => {
  const wrap      = document.getElementById('gameOfTheWeek');
  if (!wrap) return; // homepage-only

  const card      = document.getElementById('gotwCard');
  const empty     = document.getElementById('gotwEmpty');
  const imgEl     = document.getElementById('gotwImage');
  const nameEl    = document.getElementById('gotwName');
  const metaEl    = document.getElementById('gotwMeta');
  const descEl    = document.getElementById('gotwDesc');
  const learnBtn  = document.getElementById('gotwLearnMore');

  // Optional: if your modal exists on the homepage too
  const modal            = document.getElementById('gameModal');
  const modalClose       = modal?.querySelector('.modal-close');
  const modalTitle       = modal?.querySelector('#modalTitle');
  const modalImage       = modal?.querySelector('#modalImage');
  const modalMaker       = modal?.querySelector('#modalMaker');
  const modalPlayers     = modal?.querySelector('#modalPlayers');
  const modalPlaytime    = modal?.querySelector('#modalPlaytime');
  const modalDifficulty  = modal?.querySelector('#modalDifficulty');
  const modalGenres      = modal?.querySelector('#modalGenres');
  const modalDescription = modal?.querySelector('#modalDescription');

  function difficultyBadge(level) {
    if (level === 3) return { cls: 'gold',   text: 'Hard' };
    if (level === 2) return { cls: 'silver', text: 'Medium' };
    return { cls: 'bronze', text: 'Easy' };
  }

  function weekKey(d = new Date()) {
    // ISO week number for deterministic rotation
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = (date.getUTCDay() || 7);
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
    const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
    return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2,'0')}`;
  }

  function pickGameOfWeek(list) {
    if (!Array.isArray(list) || list.length === 0) return null;

    // Optional manual override: localStorage.setItem('gotwId', '<id>')
    const overrideId = (() => { try { return localStorage.getItem('gotwId'); } catch { return null; } })();
    if (overrideId) {
      const found = list.find(g => g.id === overrideId);
      if (found) return found;
    }

    // Deterministic rotation by week
    const key = weekKey(); // e.g., "2025-W41"
    let hash = 0;
    for (let i = 0; i < key.length; i++) hash = ((hash << 5) - hash) + key.charCodeAt(i) | 0;
    const idx = Math.abs(hash) % list.length;
    return list[idx];
  }

  function openModal(game) {
    if (!modal) return; // no modal on this page
    modalTitle.textContent = game.title;
    modalImage.src = game.image || './images/game-placeholder.jpg';
    modalImage.alt = game.title;
    modalMaker.textContent = `Maker: ${game.maker}`;
    modalPlayers.textContent = `Players: ${game.player_count}`;
    modalPlaytime.textContent = `Playtime: ${game.playtime}`;
    modalDifficulty.textContent = `Difficulty: ${difficultyBadge(game.difficulty).text}`;
    modalGenres.textContent = `Genres: ${game.genres.join(', ')}`;
    modalDescription.textContent = game.description;

    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
  }

  modalClose?.addEventListener('click', () => {
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
  });
  modal?.addEventListener('click', (e) => { if (e.target === modal) { modal.hidden = true; modal.setAttribute('aria-hidden', 'true'); }});
  document.addEventListener('keydown', (e) => { if (modal && !modal.hidden && e.key === 'Escape') { modal.hidden = true; modal.setAttribute('aria-hidden', 'true'); }});

  async function loadGOTW() {
    try {
      const res = await fetch('data/games.json')  // ← adjust if your homepage isn’t at repo root
      // If your homepage is inside /project/, use 'data/games.json' instead.
      // If your homepage is at root and games.json is /project/data, keep as written.
      ;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const game = pickGameOfWeek(data);
      if (!game) {
        empty.hidden = false;
        return;
      }

      // Populate UI
      imgEl.src = game.image || './images/game-placeholder.jpg';
      imgEl.alt = game.title;
      nameEl.textContent = game.title;
      metaEl.textContent = `${game.maker} • ${game.player_count} • ${game.playtime}`;
      descEl.textContent = game.description;

      learnBtn.onclick = () => openModal(game);

      card.hidden = false;
      empty.hidden = true;
    } catch (err) {
      console.error('GOTW load failed:', err);
      empty.hidden = false;
      empty.textContent = 'Unable to load featured game.';
    }
  }

  loadGOTW();
});

// --- Suggest a Game form ---
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('suggestForm');
  if (!form) return; // homepage-only

  const statusEl   = document.getElementById('sgStatus');
  const previewWrap= document.getElementById('sgPreviewWrap');
  const previewEl  = document.getElementById('sgPreview');
  const copyBtn    = document.getElementById('sgCopy');
  const clearBtn   = document.getElementById('sgClear');

  // Inputs
  const titleEl = document.getElementById('sgTitle');
  const makerEl = document.getElementById('sgMaker');
  const playersEl = document.getElementById('sgPlayers');
  const playtimeEl = document.getElementById('sgPlaytime');
  const difficultyEl = document.getElementById('sgDifficulty');
  const genresEl = document.getElementById('sgGenres');
  const descEl = document.getElementById('sgDescription');
  const imageEl = document.getElementById('sgImage');

  // Load draft from localStorage
  try {
    const draft = JSON.parse(localStorage.getItem('sgDraft') || 'null');
    if (draft) {
      titleEl.value = draft.title || '';
      makerEl.value = draft.maker || '';
      playersEl.value = draft.player_count || '';
      playtimeEl.value = draft.playtime || '';
      difficultyEl.value = draft.difficulty || '';
      genresEl.value = (draft.genres || []).join(', ');
      descEl.value = draft.description || '';
      imageEl.value = draft.image || '';
    }
  } catch {}

  function setStatus(msg, isError=false) {
    statusEl.textContent = msg || '';
    statusEl.style.color = isError ? '#b00020' : '#666';
  }

  function toId(str) {
    return String(str || '')
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  function normalizeGenres(text) {
    return text
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
  }

  function buildObject() {
    const title = titleEl.value.trim();
    const maker = makerEl.value.trim();
    const player_count = playersEl.value.trim();
    const playtime = playtimeEl.value.trim();
    const difficulty = Number(difficultyEl.value || 0);
    const genres = normalizeGenres(genresEl.value);
    const description = descEl.value.trim();
    const image = imageEl.value.trim();

    // Required checks
    if (!title || !maker || !player_count || !playtime || !difficulty || !genres.length || !description) {
      throw new Error('Please complete all required fields.');
    }
    if (![1,2,3].includes(difficulty)) {
      throw new Error('Difficulty must be 1 (Easy), 2 (Medium), or 3 (Hard).');
    }

    const obj = {
      id: toId(title),
      title,
      maker,
      player_count,
      playtime,
      difficulty,          // integer 1..3 to match your JSON
      genres,
      description,
      image
    };

    // Save draft
    try { localStorage.setItem('sgDraft', JSON.stringify(obj)); } catch {}

    return obj;
  }

  function showPreview(obj) {
    previewEl.textContent = JSON.stringify(obj, null, 2);
    previewWrap.hidden = false;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    try {
      setStatus('Generating JSON…');
      const obj = buildObject();
      showPreview(obj);
      setStatus('JSON ready. Click “Copy JSON” to copy, then paste into data/games.json.');
    } catch (err) {
      setStatus(err.message || 'Please fix the errors and try again.', true);
      previewWrap.hidden = true;
    }
  });

  copyBtn?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(previewEl.textContent);
      setStatus('Copied to clipboard. Thank you!');
    } catch {
      setStatus('Unable to copy. Select the text and copy manually.', true);
    }
  });

  clearBtn?.addEventListener('click', () => {
    form.reset();
    previewWrap.hidden = true;
    setStatus('');
    try { localStorage.removeItem('sgDraft'); } catch {}
  });
});


