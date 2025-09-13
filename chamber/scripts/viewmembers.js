// view-members.js
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('memberContainer');
  const gridBtn = document.getElementById('gridViewBtn');
  const listBtn = document.getElementById('listViewBtn');
  const countEl = document.getElementById('memberCount');
  const searchInput = document.getElementById('memberSearch');
  const navToggle = document.getElementById('navToggle');
  const header = document.querySelector('.site-header');

  let members = [];   // fetched JSON
  let filtered = [];  // after search
  let viewMode = 'grid-view';

  // Map membership level number -> class/text
  function membershipBadge(level) {
    if (level === 3) return { cls: 'gold', text: 'Gold' };
    if (level === 2) return { cls: 'silver', text: 'Silver' };
    return { cls: 'member', text: 'Member' };
  }

  // Render functions
  function renderMembers(data) {
    container.innerHTML = '';
    if (!data || data.length === 0) {
      container.innerHTML = '<p>No members found.</p>';
      countEl.textContent = 'Showing 0 members';
      return;
    }

    const frag = document.createDocumentFragment();
    data.forEach(m => {
      const article = document.createElement('article');
      article.className = 'member-card';
      article.setAttribute('tabindex', '0');
      article.setAttribute('data-id', m.id);

      const img = document.createElement('img');
      img.className = 'member-thumb';
      img.src = m.image || '/images/member-placeholder.jpg';
      img.alt = `${m.name}`;

      const main = document.createElement('div');
      main.className = 'card-main';
      const h3 = document.createElement('h3');
      h3.textContent = m.name;

      const title = document.createElement('p');
      title.className = 'member-info';
      title.textContent = m.description || m.address;

      const meta = document.createElement('div');
      meta.className = 'card-meta';
      const phone = document.createElement('a');
      phone.href = `tel:${m.phone.replace(/[^\d+]/g,'')}`;
      phone.textContent = m.phone;
      const site = document.createElement('a');
      site.href = m.website;
      site.rel = 'noopener';
      site.target = '_blank';
      site.textContent = 'Website';

      const addr = document.createElement('p');
      addr.className = 'member-info';
      addr.textContent = m.address;

      const badgeInfo = membershipBadge(m.membershipLevel);
      const badge = document.createElement('span');
      badge.className = `badge ${badgeInfo.cls}`;
      badge.textContent = badgeInfo.text;

      main.appendChild(h3);
      main.appendChild(addr);
      main.appendChild(title);

      meta.appendChild(badge);
      meta.appendChild(phone);
      meta.appendChild(site);

      // assemble article depending on view (grid vs list CSS handles layout)
      article.appendChild(img);
      article.appendChild(main);
      article.appendChild(meta);

      frag.appendChild(article);
    });

    container.appendChild(frag);
    countEl.textContent = `Showing ${data.length} members`;
  }

  // fetch members.json
  async function loadMembers() {
    try {
      const res = await fetch('/chamber/scripts/members.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      members = data;
      filtered = members.slice();
      renderMembers(filtered);
    } catch (err) {
      console.error('Failed to load members:', err);
      container.innerHTML = '<p class="error">Unable to load members. Please try again later.</p>';
      countEl.textContent = '';
    }
  }

  // view toggle
  function setView(mode) {
    container.classList.remove('grid-view','list-view');
    container.classList.add(mode);
    gridBtn.setAttribute('aria-pressed', mode === 'grid-view' ? 'true' : 'false');
    listBtn.setAttribute('aria-pressed', mode === 'list-view' ? 'true' : 'false');
    try { localStorage.setItem('directoryView', mode); } catch (e) {}
  }
  gridBtn.addEventListener('click', () => setView('grid-view'));
  listBtn.addEventListener('click', () => setView('list-view'));

  // search
  function doSearch(q) {
    if (!q) {
      filtered = members.slice();
    } else {
      const term = q.trim().toLowerCase();
      filtered = members.filter(m => {
        return (m.name && m.name.toLowerCase().includes(term))
          || (m.city && m.city.toLowerCase().includes(term))
          || (m.description && m.description.toLowerCase().includes(term))
          || (m.membershipLevel && String(m.membershipLevel) === term);
      });
    }
    renderMembers(filtered);
  }
  searchInput.addEventListener('input', (e) => doSearch(e.target.value));

  // keyboard support for toolbar
  const toolbar = document.querySelector('.view-toggle');
  toolbar && toolbar.addEventListener('keydown', (e) => {
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

  // mobile nav toggle
  navToggle && navToggle.addEventListener('click', () => {
    const open = header.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  // init view from storage
  try {
    const saved = localStorage.getItem('directoryView');
    viewMode = saved === 'list-view' ? 'list-view' : 'grid-view';
  } catch (e) {}

  setView(viewMode);
  loadMembers();
});
