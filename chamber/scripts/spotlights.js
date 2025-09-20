(() => {
  'use strict';

  const body = document.body;
  const membersSrc = (body && body.dataset && body.dataset.membersSrc) || './scripts/members.json';
  const container = document.getElementById('spotlight-grid');

  if (!container) {
    console.warn('spotlight-grid container not found.');
    return;
  }

  // Start
  loadAndRender();

  async function loadAndRender() {
    try {
      const resp = await fetch(membersSrc, { cache: 'no-cache' });
      if (!resp.ok) throw new Error(`Failed to load members JSON: ${resp.status}`);
      const members = await resp.json();
      if (!Array.isArray(members)) throw new Error('Members JSON must be an array.');

      // Filter numeric membership levels: 3 => Gold, 2 => Silver
      const eligible = members.filter(m => {
        const lvl = Number(m.membershipLevel || 0);
        return lvl === 3 || lvl === 2;
      });

      if (!eligible.length) {
        container.innerHTML = `<p class="muted small">No gold or silver members available for spotlight.</p>`;
        return;
      }

      shuffle(eligible);

      // Choose 2 or 3 (if we don't have 3 eligible, choose available count)
      const desiredCount = eligible.length >= 3 ? (Math.random() < 0.5 ? 2 : 3) : Math.min(eligible.length, 3);
      const chosen = eligible.slice(0, desiredCount);

      container.innerHTML = chosen.map(renderCard).join('');
    } catch (err) {
      console.error('spotlights.js error:', err);
      container.innerHTML = `<p class="muted small">Spotlights unavailable.</p>`;
    }
  }

  // Render one card — uses keys: name, image, phone, address, website, membershipLevel
  function renderCard(m) {
    const name = escape(xstr(m.name, 'Member'));
    const logo = m.image || './images/logo-placeholder.png';
    const phone = xstr(m.phone, '');
    const address = xstr(m.address, '');
    const website = xstr(m.website, '');
    const levelNum = Number(m.membershipLevel || 0);
    const levelLabel = levelNum === 3 ? 'Gold' : (levelNum === 2 ? 'Silver' : '');

    const safeLogo = escapeAttr(ensureRelativePath(logo));
    const safeWebsite = website ? escapeAttr(website) : null;
    const phoneTel = phone ? `tel:${phone.replace(/[^+\d]/g, '')}` : null;

    return `
      <article class="spotlight-card" aria-label="Spotlight: ${escape(name)}" style="display:flex;gap:0.8rem;align-items:center;padding:0.8rem;border-radius:10px;border:1px solid rgba(0,0,0,0.03);background:var(--card-bg);box-shadow:var(--shadow-sm);">
        <img class="spot-thumb" src="${safeLogo}" alt="${escape(name)} logo" width="110" height="80" onerror="this.onerror=null;this.src='./images/logo-placeholder.png'">
        <div class="spot-content" style="flex:1">
          <h3 style="margin:.1rem 0">${escape(name)}</h3>
          ${levelLabel ? `<p class="muted" style="margin:.15rem 0">Membership: ${escape(levelLabel)}</p>` : ''}
          ${phone ? `<p class="muted" style="margin:.15rem 0">Phone: <a href="${phoneTel}" aria-label="Call ${escape(name)}">${escape(phone)}</a></p>` : ''}
          ${address ? `<p class="muted" style="margin:.15rem 0">${escape(address)}</p>` : ''}
          ${safeWebsite ? `<p style="margin:.25rem 0"><a href="${safeWebsite}" target="_blank" rel="noopener noreferrer">Visit website</a></p>` : ''}
          ${m.description ? `<p class="muted small" style="margin-top:.25rem">${escape(m.description)}</p>` : ''}
        </div>
      </article>
    `;
  }

  // Helpers
  function xstr(v, fallback = '') { return v === undefined || v === null ? fallback : String(v); }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function escape(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  }

  function escapeAttr(u) {
    return escape(u).replace(/"/g, '&quot;');
  }

  // Ensure relative image paths include leading ./ to avoid accidental broken paths like "images/..."
  function ensureRelativePath(p) {
    if (!p) return './images/logo-placeholder.png';
    if (p.startsWith('http://') || p.startsWith('https://') || p.startsWith('data:') || p.startsWith('./') || p.startsWith('/')) {
      return p;
    }
    return './' + p;
  }

})();
