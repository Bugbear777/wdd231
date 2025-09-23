// ---- CONFIG: mark the courses you've completed personally ----
// Use any identifier you know will exist: code "WDD 131", "CSE 110", or `${subject} ${number}`
const MY_COMPLETED = new Set([
  // Example completions — edit these to yours:
  "WDD 130",
  "WDD 131",
  // "CSE 110",
]);

// ---- Source: use global array from courseArray.js, regardless of its variable name ----
const RAW = (typeof courses !== "undefined")
  ? courses
  : (typeof courseArray !== "undefined")
  ? courseArray
  : [];

// ---- Normalization helpers (tolerant to schema drift) ----
function pick(...keys) {
  return (obj) => keys.find(k => obj && obj[k] != null && obj[k] !== "") ?? null;
}
const get = (obj, ...candidates) => {
  const key = pick(...candidates)(obj);
  return key ? obj[key] : undefined;
};

// Make a best-effort normalized model for each course
function normalizeCourse(c) {
  const subject = (get(c, "subject", "dept", "prefix") || "").toString().toUpperCase().trim();
  const number = (get(c, "number", "num") ?? "").toString().trim();
  const codeRaw = get(c, "code", "course", "id", "title") || "";
  const credits = Number(get(c, "credits", "credit", "cr") || 0);

  let code = codeRaw.toString().trim();
  if (!code) {
    code = [subject, number].filter(Boolean).join(" ");
  }
  // Try to infer subject from code if missing
  const inferredSubject = subject || (code.split(/\s+/)[0] || "");
  const name = get(c, "title", "name") || code;

  // Determine completion: explicit flag OR based on our personal list
  const explicitCompleted = Boolean(get(c, "completed", "isCompleted", "done"));
  const mineCompleted = MY_COMPLETED.has(code) || MY_COMPLETED.has(`${inferredSubject} ${number}`);

  return {
    // Keep everything else in case you want to surface it later
    ...c,
    subject: inferredSubject,
    number,
    code,
    name,
    credits: Number.isFinite(credits) ? credits : 0,
    completed: explicitCompleted || mineCompleted
  };
}

const ALL = RAW.map(normalizeCourse);

// ---- DOM ----
const grid = document.querySelector("#coursesGrid");
const creditTotalEl = document.querySelector("#creditTotal");
const buttons = [...document.querySelectorAll(".filter-btn")];

// Render cards
function renderCourses(list) {
  grid.innerHTML = "";

  const fragment = document.createDocumentFragment();
  list.forEach(course => {
    const card = document.createElement("article");
    card.className = `course-card${course.completed ? " completed" : ""}`;

    card.innerHTML = `
      <h3>${course.code}</h3>
      <p class="course-meta">
        <span class="course-name">${escapeHTML(course.name)}</span>
        <span aria-hidden="true">•</span>
        <span class="course-sub">${course.subject || "—"}</span>
        <span class="course-credits">${course.credits} cr</span>
      </p>
    `;
    fragment.appendChild(card);
  });

  grid.appendChild(fragment);
  updateCredits(list);

  courseDiv.addEventListener('click', () => {
  displayCourseDetails(course);
});
}

function updateCredits(list) {
  const total = list.reduce((sum, c) => sum + (Number(c.credits) || 0), 0);
  creditTotalEl.textContent = total;
}

function escapeHTML(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// ---- Filtering ----
function filterList(kind) {
  if (kind === "WDD" || kind === "CSE") {
    return ALL.filter(c => (c.subject || "").toUpperCase() === kind);
  }
  return ALL; // "all"
}

function setActive(btn) {
  buttons.forEach(b => b.classList.toggle("is-active", b === btn));
}

// Hook up buttons
buttons.forEach(btn => {
  btn.addEventListener("click", () => {
    const kind = btn.dataset.filter || "all";
    const list = filterList(kind);
    setActive(btn);
    renderCourses(list);
  });
});

// Initial render: "All"
renderCourses(ALL);
