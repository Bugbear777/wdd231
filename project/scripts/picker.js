// scripts/picker.js
document.addEventListener('DOMContentLoaded', () => {
  const wheel = document.getElementById('wheel');
  const spinBtn = document.getElementById('spinBtn');
  const statusEl = document.getElementById('spinStatus');

  // Modal (same IDs as finder)
  const modal = document.getElementById('gameModal');
  const modalClose = modal?.querySelector('.modal-close');
  const modalTitle = modal?.querySelector('#modalTitle');
  const modalImage = modal?.querySelector('#modalImage');
  const modalMaker = modal?.querySelector('#modalMaker');
  const modalPlayers = modal?.querySelector('#modalPlayers');
  const modalPlaytime = modal?.querySelector('#modalPlaytime');
  const modalDifficulty = modal?.querySelector('#modalDifficulty');
  const modalGenres = modal?.querySelector('#modalGenres');
  const modalDescription = modal?.querySelector('#modalDescription');

  if (!(wheel && spinBtn)) return;

  let games = [];
  let spinning = false;
  let lastFocus = null;

  // Same badge mapping as finder
  function difficultyBadge(level) {
    if (level === 3) return { cls: 'gold', text: 'Hard' };
    if (level === 2) return { cls: 'silver', text: 'Medium' };
    return { cls: 'bronze', text: 'Easy' };
  }

  function setStatus(msg) {
    if (statusEl) statusEl.textContent = msg || '';
  }

  // Fetch games.json (adjust path if your picker.html is elsewhere)
  async function loadGames() {
    try {
      const res = await fetch('data/games.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      games = await res.json();
    } catch (err) {
      console.error('Picker: failed to load games.json', err);
      setStatus('Unable to load games. Please check data/games.json.');
      spinBtn.disabled = true;
    }
  }

  // Choose a truly random game
  function pickRandomGame() {
    if (!games.length) return null;
    const idx = Math.floor(Math.random() * games.length);
    return games[idx];
  }

  // Open modal with game details
  function openModal(game) {
    if (!modal) return;
    lastFocus = document.activeElement;

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
    (modalClose || modal).focus();
  }

  function closeModal() {
    if (!modal) return;
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  }

  modalClose?.addEventListener('click', closeModal);
  modal?.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => {
    if (modal && !modal.hidden && e.key === 'Escape') closeModal();
  });

  // Spin logic
  spinBtn.addEventListener('click', () => {
    if (spinning) return;
    if (!games.length) { setStatus('No games loaded yet.'); return; }

    spinning = true;
    setStatus('Spinning…');

    // random target rotation: multiple full turns + random offset
    const baseTurns = Math.floor(Math.random() * 4) + 5; // 5–8 turns
    const randomOffset = Math.floor(Math.random() * 360); // 0–359°
    const targetDeg = baseTurns * 360 + randomOffset;

    // trigger rotation via CSS variable
    wheel.style.setProperty('--spin', `${targetDeg}deg`);

    // wait for transition end (single event)
    const onEnd = () => {
      wheel.removeEventListener('transitionend', onEnd);
      const chosen = pickRandomGame();
      setStatus(chosen ? `You got: ${chosen.title}` : 'No game found.');
      spinning = false;
      if (chosen) openModal(chosen);
    };
    wheel.addEventListener('transitionend', onEnd, { once: true });
  });

  loadGames();
});
