import { difficultyBadge, weekKey } from "./lib/utils.js";

(() => {
  // ---------- helpers ----------
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const on = (el, evt, fn, opts) => el && el.addEventListener(evt, fn, opts);
  const setText = (el, txt) => { if (el) el.textContent = txt; };
  const setAttr = (el, name, val) => { if (el) el.setAttribute(name, val); };

  // ---------- footer: year + last modified ----------
  setText($("#currentyear"), String(new Date().getFullYear()));
  setText($("#lastModified"), `Last Modified: ${document.lastModified}`);

  // ---------- header height variable ----------
  const header = $(".site-header");
  const rootEl = document.documentElement;

  function setHeaderHeightVar() {
    if (!header) return;
    const h = Math.ceil(header.getBoundingClientRect().height);
    rootEl.style.setProperty("--header-height", `${h}px`);
  }
  if (header) {
    setHeaderHeightVar();
    const ro = new ResizeObserver(setHeaderHeightVar);
    ro.observe(header);
    on(window, "orientationchange", setHeaderHeightVar);
  }

  // ---------- mobile nav (hamburger) ----------
  // Click to toggle (delegated so it works on every page)
  on(document, "click", (e) => {
    const btn = e.target.closest(".nav-toggle");
    if (!btn) return;
    const localHeader = btn.closest(".site-header");
    const nav = $(".main-nav", localHeader);
    if (!localHeader || !nav) return;

    const open = localHeader.classList.toggle("open");
    setAttr(btn, "aria-expanded", open ? "true" : "false");
    if (open) nav.querySelector("a")?.focus();
    else btn.focus();
  }, { capture: true });

  // Close menu when:
  // - pressing Escape
  // - clicking a nav link
  // - resizing up to desktop
  // - navigating away / back (bfcache)
  const closeHeader = () => {
    const openHeader = $(".site-header.open");
    if (!openHeader) return;
    const btn = $(".nav-toggle", openHeader);
    openHeader.classList.remove("open");
    btn && setAttr(btn, "aria-expanded", "false");
  };
  on(document, "keydown", (e) => {
    if (e.key === "Escape") closeHeader();
  });
  on(document, "click", (e) => {
    if (e.target.closest(".main-nav a")) closeHeader();
  }, { capture: true });

  const mq = window.matchMedia("(min-width: 801px)");
  const closeIfDesktop = () => { if (mq.matches) closeHeader(); };
  mq.addEventListener?.("change", closeIfDesktop);
  mq.addListener?.(closeIfDesktop); // legacy Safari
  on(window, "pagehide", closeHeader);
  on(window, "pageshow", closeHeader);

  // ---------- Game Finder: view toggle ----------
  (function initViewToggle() {
    const container = $("#gamesContainer");
    const gridBtn   = $("#gridViewBtn");
    const listBtn   = $("#listViewBtn");
    const toolbar   = $(".view-toggle");
    if (!(container && gridBtn && listBtn && toolbar)) return;

    function setView(mode) {
      container.classList.remove("grid-view", "list-view");
      container.classList.add(mode);
      setAttr(gridBtn, "aria-pressed", mode === "grid-view" ? "true" : "false");
      setAttr(listBtn, "aria-pressed", mode === "list-view" ? "true" : "false");
      try { localStorage.setItem("directoryView", mode); } catch {}
    }

    on(gridBtn, "click", () => setView("grid-view"));
    on(listBtn, "click", () => setView("list-view"));

    on(toolbar, "keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      e.preventDefault();
      const toList = gridBtn.getAttribute("aria-pressed") === "true";
      const mode = toList ? "list-view" : "grid-view";
      setView(mode);
      (mode === "grid-view" ? gridBtn : listBtn).focus();
    });

    const saved = (() => { try { return localStorage.getItem("directoryView"); } catch { return null; }})();
    setView(saved === "list-view" ? "list-view" : "grid-view");
  })();

  // ---------- Game Finder: data + render + search + modal ----------
  (function initGameDirectory() {
    const container = $("#gamesContainer");
    if (!container) return; // not on finder page

    const countEl      = $("#gameCount");
    const searchInput  = $("#gameSearch");

    // Modal bits (optional if present)
    const modal            = $("#gameModal");
    const modalClose       = modal?.querySelector(".modal-close");
    const modalTitle       = modal?.querySelector("#modalTitle");
    const modalImage       = modal?.querySelector("#modalImage");
    const modalMaker       = modal?.querySelector("#modalMaker");
    const modalPlayers     = modal?.querySelector("#modalPlayers");
    const modalPlaytime    = modal?.querySelector("#modalPlaytime");
    const modalDifficulty  = modal?.querySelector("#modalDifficulty");
    const modalGenres      = modal?.querySelector("#modalGenres");
    const modalDescription = modal?.querySelector("#modalDescription");

    const difficultyBadge = (level) => {
      if (level === 3) return { cls: "gold",   text: "Hard" };
      if (level === 2) return { cls: "silver", text: "Medium" };
      return { cls: "bronze", text: "Easy" };
    };

    let games = [];
    let filtered = [];
    let lastFocused = null;

    function openModal(game) {
      if (!modal) return;
      lastFocused = document.activeElement;

      setText(modalTitle, game.title);
      if (modalImage) {
        modalImage.src = game.image || "./images/game-placeholder.jpg";
        modalImage.alt = game.title || "Game cover";
      }
      setText(modalMaker,      `Maker: ${game.maker}`);
      setText(modalPlayers,    `Players: ${game.player_count}`);
      setText(modalPlaytime,   `Playtime: ${game.playtime}`);
      setText(modalDifficulty, `Difficulty: ${difficultyBadge(game.difficulty).text}`);
      setText(modalGenres,     `Genres: ${Array.isArray(game.genres) ? game.genres.join(", ") : ""}`);
      setText(modalDescription, game.description || "");

      modal.hidden = false;
      setAttr(modal, "aria-hidden", "false");
      (modalClose || modal).focus();
      on(document, "keydown", onEsc, { capture: true });
    }

    function closeModal() {
      if (!modal) return;
      modal.hidden = true;
      setAttr(modal, "aria-hidden", "true");
      document.removeEventListener("keydown", onEsc, { capture: true });
      lastFocused?.focus?.();
    }

    function onEsc(e) { if (e.key === "Escape") { e.preventDefault(); closeModal(); } }
    on(modalClose, "click", closeModal);
    on(modal, "click", (e) => { if (e.target === modal) closeModal(); });

    function render(list) {
      container.innerHTML = "";
      if (!list?.length) {
        container.innerHTML = `<p>No games found.</p>`;
        setText(countEl, "Showing 0 games");
        return;
      }

      const frag = document.createDocumentFragment();

      list.forEach((g) => {
        const { id, title, maker, player_count, playtime, difficulty, genres, description, image } = g;

        const article = document.createElement("article");
        article.className = "game-card";
        article.tabIndex = 0;
        article.dataset.id = id || "";

        const img = document.createElement("img");
        img.className = "game-thumb";
        img.src = image || "./images/game-placeholder.jpg";
        img.alt = title || "Game cover";
        img.loading = "lazy";

        const main = document.createElement("div");
        main.className = "card-main";

        const h3 = document.createElement("h3");
        h3.textContent = title || "Untitled";

        const info = document.createElement("p");
        info.className = "game-info";
        info.textContent = `${maker} • ${player_count} • ${playtime}`;

        const desc = document.createElement("p");
        desc.className = "game-info";
        desc.textContent = description || "";

        const learnBtn = document.createElement("button");
        learnBtn.className = "learn-more-btn";
        learnBtn.type = "button";
        learnBtn.textContent = "Learn More";
        on(learnBtn, "click", (e) => { e.stopPropagation(); openModal(g); });

        main.append(h3, info, desc, learnBtn);

        const meta = document.createElement("div");
        meta.className = "card-meta";
        const badgeInfo = difficultyBadge(difficulty);
        const badge = document.createElement("span");
        badge.className = `badge ${badgeInfo.cls}`;
        badge.textContent = badgeInfo.text;
        meta.appendChild(badge);

        if (genres?.length) {
          const ge = document.createElement("p");
          ge.className = "game-info";
          ge.textContent = genres.join(", ");
          meta.appendChild(ge);
        }

        article.append(img, main, meta);
        frag.appendChild(article);
      });

      container.appendChild(frag);
      setText(countEl, `Showing ${list.length} games`);
    }

    const doFilter = (q) => {
      if (!q) return games.slice();
      const term = q.trim().toLowerCase();
      return games.filter((m) =>
        (m.title && m.title.toLowerCase().includes(term)) ||
        (m.description && m.description.toLowerCase().includes(term)) ||
        (m.maker && m.maker.toLowerCase().includes(term)) ||
        (m.genres && m.genres.some((g) => g.toLowerCase().includes(term))) ||
        (m.difficulty && String(m.difficulty).startsWith(term))
      );
    };

    const debounce = (fn, ms = 200) => {
      let t;
      return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), ms);
      };
    };

    const onSearch = debounce((val) => {
      filtered = doFilter(val);
      render(filtered);
    }, 180);

    on(searchInput, "input", (e) => onSearch(e.target.value));

    // fetch data
    (async () => {
      try {
        const res = await fetch("data/games.json", { credentials: "same-origin" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        games = await res.json();
        filtered = games.slice();
        render(filtered);
      } catch (err) {
        console.error("Failed to load games:", err);
        container.innerHTML = `<p class="error">Unable to load games. Please try again later.</p>`;
        setText(countEl, "");
      }
    })();
  })();

  // ---------- Home: Game of the Week ----------
  (function initGOTW() {
    const wrap   = $("#gameOfTheWeek");
    if (!wrap) return;

    const card   = $("#gotwCard");
    const empty  = $("#gotwEmpty");
    const imgEl  = $("#gotwImage");
    const nameEl = $("#gotwName");
    const metaEl = $("#gotwMeta");
    const descEl = $("#gotwDesc");
    const btn    = $("#gotwLearnMore");

    // Optional modal on home (if present)
    const modal            = $("#gameModal");
    const modalClose       = modal?.querySelector(".modal-close");
    const modalTitle       = modal?.querySelector("#modalTitle");
    const modalImage       = modal?.querySelector("#modalImage");
    const modalMaker       = modal?.querySelector("#modalMaker");
    const modalPlayers     = modal?.querySelector("#modalPlayers");
    const modalPlaytime    = modal?.querySelector("#modalPlaytime");
    const modalDifficulty  = modal?.querySelector("#modalDifficulty");
    const modalGenres      = modal?.querySelector("#modalGenres");
    const modalDescription = modal?.querySelector("#modalDescription");

    const difficultyBadge = (level) => {
      if (level === 3) return { cls: "gold",   text: "Hard" };
      if (level === 2) return { cls: "silver", text: "Medium" };
      return { cls: "bronze", text: "Easy" };
    };

    const weekKey = (d = new Date()) => {
      const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      const dayNum = (date.getUTCDay() || 7);
      date.setUTCDate(date.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
      const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
      return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
    };

    const pick = (list) => {
      if (!Array.isArray(list) || !list.length) return null;
      const overrideId = (() => { try { return localStorage.getItem("gotwId"); } catch { return null; }})();
      if (overrideId) return list.find((g) => g.id === overrideId) || null;

      const key = weekKey();
      let hash = 0;
      for (let i = 0; i < key.length; i++) hash = ((hash << 5) - hash) + key.charCodeAt(i) | 0;
      return list[Math.abs(hash) % list.length] || null;
    };

    const openModal = (game) => {
      if (!modal) return;
      setText(modalTitle, game.title);
      if (modalImage) {
        modalImage.src = game.image || "./images/game-placeholder.jpg";
        modalImage.alt = game.title || "Game cover";
      }
      setText(modalMaker,      `Maker: ${game.maker}`);
      setText(modalPlayers,    `Players: ${game.player_count}`);
      setText(modalPlaytime,   `Playtime: ${game.playtime}`);
      setText(modalDifficulty, `Difficulty: ${difficultyBadge(game.difficulty).text}`);
      setText(modalGenres,     `Genres: ${Array.isArray(game.genres) ? game.genres.join(", ") : ""}`);
      setText(modalDescription, game.description || "");

      modal.hidden = false;
      setAttr(modal, "aria-hidden", "false");
    };

    on(modalClose, "click", () => {
      modal.hidden = true;
      setAttr(modal, "aria-hidden", "true");
    });
    on(modal, "click", (e) => { if (e.target === modal) { modal.hidden = true; setAttr(modal, "aria-hidden", "true"); }});
    on(document, "keydown", (e) => {
      if (modal && !modal.hidden && e.key === "Escape") {
        modal.hidden = true; setAttr(modal, "aria-hidden", "true");
      }
    });

    (async () => {
      try {
        const res = await fetch("data/games.json", { credentials: "same-origin" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const game = pick(data);

        if (!game) { empty.hidden = false; return; }

        imgEl.src = game.image || "./images/game-placeholder.jpg";
        imgEl.alt = game.title || "Game cover";
        setText(nameEl, game.title);
        setText(metaEl, `${game.maker} • ${game.player_count} • ${game.playtime}`);
        setText(descEl, game.description || "");
        if (btn) btn.onclick = () => openModal(game);

        card.hidden = false;
        empty.hidden = true;
      } catch (err) {
        console.error("GOTW load failed:", err);
        empty.hidden = false;
        empty.textContent = "Unable to load featured game.";
      }
    })();
  })();

  // ---------- Home: Suggest a Game form ----------
  (function initSuggestForm() {
    const form = $("#suggestForm");
    if (!form) return;

    const statusEl    = $("#sgStatus");
    const previewWrap = $("#sgPreviewWrap");
    const previewEl   = $("#sgPreview");
    const copyBtn     = $("#sgCopy");
    const clearBtn    = $("#sgClear");

    const titleEl = $("#sgTitle");
    const makerEl = $("#sgMaker");
    const playersEl = $("#sgPlayers");
    const playtimeEl = $("#sgPlaytime");
    const difficultyEl = $("#sgDifficulty");
    const genresEl = $("#sgGenres");
    const descEl = $("#sgDescription");
    const imageEl = $("#sgImage");

    // load draft
    try {
      const draft = JSON.parse(localStorage.getItem("sgDraft") || "null");
      if (draft) {
        titleEl.value = draft.title || "";
        makerEl.value = draft.maker || "";
        playersEl.value = draft.player_count || "";
        playtimeEl.value = draft.playtime || "";
        difficultyEl.value = draft.difficulty || "";
        genresEl.value = (draft.genres || []).join(", ");
        descEl.value = draft.description || "";
        imageEl.value = draft.image || "";
      }
    } catch {}

    const setStatus = (msg, err=false) => {
      if (!statusEl) return;
      statusEl.textContent = msg || "";
      statusEl.style.color = err ? "#b00020" : "#666";
    };

    const toId = (str) =>
      String(str || "")
        .toLowerCase()
        .replace(/&/g, "and")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    const normalizeGenres = (text) =>
      text.split(",").map((s) => s.trim()).filter(Boolean);

    function buildObject() {
      const title = titleEl.value.trim();
      const maker = makerEl.value.trim();
      const player_count = playersEl.value.trim();
      const playtime = playtimeEl.value.trim();
      const difficulty = Number(difficultyEl.value || 0);
      const genres = normalizeGenres(genresEl.value);
      const description = descEl.value.trim();
      const image = imageEl.value.trim();

      if (!title || !maker || !player_count || !playtime || !difficulty || !genres.length || !description) {
        throw new Error("Please complete all required fields.");
      }
      if (![1,2,3].includes(difficulty)) {
        throw new Error("Difficulty must be 1 (Easy), 2 (Medium), or 3 (Hard).");
      }

      const obj = { id: toId(title), title, maker, player_count, playtime, difficulty, genres, description, image };
      try { localStorage.setItem("sgDraft", JSON.stringify(obj)); } catch {}
      return obj;
    }

    function showPreview(obj) {
      previewEl.textContent = JSON.stringify(obj, null, 2);
      previewWrap.hidden = false;
    }

    on(form, "submit", (e) => {
      e.preventDefault();
      try {
        setStatus("Generating JSON…");
        const obj = buildObject();
        showPreview(obj);
        setStatus("JSON ready. Click “Copy JSON” to copy, then paste into data/games.json.");
      } catch (err) {
        setStatus(err.message || "Please fix the errors and try again.", true);
        previewWrap.hidden = true;
      }
    });

    on(copyBtn, "click", async () => {
      try {
        await navigator.clipboard.writeText(previewEl.textContent);
        setStatus("Copied to clipboard. Thank you!");
      } catch {
        setStatus("Unable to copy. Select the text and copy manually.", true);
      }
    });

    on(clearBtn, "click", () => {
      form.reset();
      previewWrap.hidden = true;
      setStatus("");
      try { localStorage.removeItem("sgDraft"); } catch {}
    });
  })();
})();


