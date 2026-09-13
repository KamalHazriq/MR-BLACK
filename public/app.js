// Mr. Black — client
const SESSION_KEY = "mrblack:session";
const THEME_KEY = "mrblack:theme";

function effectiveTheme() {
  const explicit = document.documentElement.getAttribute("data-theme");
  if (explicit === "light" || explicit === "dark") return explicit;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme) {
  if (theme === "light" || theme === "dark") {
    document.documentElement.setAttribute("data-theme", theme);
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
  const glyph = effectiveTheme() === "dark" ? "◑" : "◐";
  document.querySelectorAll(".theme-toggle").forEach((btn) => (btn.textContent = glyph));
}

document.querySelectorAll(".theme-toggle").forEach((btn) => {
  btn.addEventListener("click", () => {
    const next = effectiveTheme() === "dark" ? "light" : "dark";
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // ignore storage errors (e.g. private browsing)
    }
    applyTheme(next);
  });
});

try {
  applyTheme(localStorage.getItem(THEME_KEY));
} catch {
  applyTheme(null);
}

const el = (id) => document.getElementById(id);
const screens = {
  landing: el("screen-landing"),
  home: el("screen-home"),
  lobby: el("screen-lobby"),
  game: el("screen-game"),
};

function showScreen(name) {
  for (const key of Object.keys(screens)) {
    screens[key].classList.toggle("active", key === name);
  }
  window.scrollTo(0, 0);
}

// ---- Landing page navigation ----

function goToPlay() {
  showScreen("home");
  el("home-name").focus();
}

document.querySelectorAll("#nav-play, #hero-play, #cta-play, [data-play]").forEach((btn) => {
  btn.addEventListener("click", goToPlay);
});

document.querySelectorAll("[data-scroll-to]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = document.getElementById(btn.dataset.scrollTo);
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

document.querySelectorAll("[data-back-to-landing]").forEach((btn) => {
  btn.addEventListener("click", () => showScreen("landing"));
});

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function roleLabel(role) {
  if (role === "civilian") return "Civilian";
  if (role === "undercover") return "Undercover";
  if (role === "blank") return "Mr. Black";
  return "Unknown";
}

function saveSession(session) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}
function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

let socket = null;
let lastView = null;
let hasRevealedRole = false;
let reconnectAttempts = 0;
let intentionalClose = false;

// ---- Turn sound ----

const SOUND_KEY = "mrblack:sound";
let soundOn = true;
let audioCtx = null;

try {
  soundOn = localStorage.getItem(SOUND_KEY) !== "off";
} catch {
  // keep the default
}

function renderSoundToggle() {
  const btn = el("sound-toggle");
  if (btn) btn.textContent = soundOn ? "Sound on" : "Sound off";
}

function playTurnChime() {
  if (!soundOn) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
    const start = audioCtx.currentTime;
    [880, 1318.5].forEach((freq, i) => {
      const at = start + i * 0.13;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.2, at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(at);
      osc.stop(at + 0.32);
    });
  } catch {
    // audio is a nicety; never let it break the game
  }
  try {
    navigator.vibrate?.(180);
  } catch {
    // ignore
  }
}

el("sound-toggle").addEventListener("click", () => {
  soundOn = !soundOn;
  try {
    localStorage.setItem(SOUND_KEY, soundOn ? "on" : "off");
  } catch {
    // ignore
  }
  renderSoundToggle();
  if (soundOn) playTurnChime();
});
renderSoundToggle();

// ---- Invite link ----

function inviteUrl(code) {
  return `${location.origin}/?room=${encodeURIComponent(code)}`;
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

el("lobby-copy-link").addEventListener("click", async () => {
  if (!lastView) return;
  const ok = await copyText(inviteUrl(lastView.code));
  const status = el("lobby-copy-status");
  status.textContent = ok ? "Link copied" : inviteUrl(lastView.code);
  setTimeout(() => {
    if (status.textContent === "Link copied") status.textContent = "";
  }, 2500);
});

// ---- Word pairs picker ----

let allWordPairs = [];
const wordPairsByCategory = new Map();

async function loadWordPairs() {
  try {
    const res = await fetch("/api/word-pairs");
    allWordPairs = await res.json();
    wordPairsByCategory.clear();
    for (const p of allWordPairs) {
      if (!wordPairsByCategory.has(p.category)) wordPairsByCategory.set(p.category, []);
      wordPairsByCategory.get(p.category).push(p);
    }
    buildWordsPickerDom();
    if (lastView && lastView.phase === "lobby") renderLobby(lastView);
  } catch {
    // Picker just stays empty if this fails; game still works with the full default word bank.
  }
}

function buildWordsPickerDom() {
  el("setting-category-chips").innerHTML = Array.from(wordPairsByCategory.entries())
    .map(
      ([category, pairs]) =>
        `<button type="button" class="cat-chip" data-category="${escapeHtml(category)}">${escapeHtml(category)} <span class="cat-chip-count">${pairs.length}</span></button>`
    )
    .join("");

  const container = el("setting-words-categories");
  container.innerHTML = Array.from(wordPairsByCategory.entries())
    .map(([category, pairs]) => {
      const items = pairs
        .map(
          (p) => `
            <label class="word-pair-item">
              <input type="checkbox" data-pair-id="${p.id}" checked />
              <span>${escapeHtml(p.civilian)} / ${escapeHtml(p.undercover)}</span>
              <span class="diff-tag diff-${p.difficulty}">${p.difficulty}</span>
            </label>`
        )
        .join("");
      return `
        <details class="word-category" data-category-panel="${escapeHtml(category)}">
          <summary>
            <span class="word-category-name">${escapeHtml(category)}</span>
            <span class="muted"><span data-category-on="${escapeHtml(category)}">0</span>/${pairs.length}</span>
          </summary>
          <div class="word-pair-list">${items}</div>
        </details>`;
    })
    .join("");

  container.querySelectorAll("input[data-pair-id]").forEach((input) => {
    input.addEventListener("change", sendDisabledPairsUpdate);
  });

  el("setting-category-chips").querySelectorAll("[data-category]").forEach((chip) => {
    chip.addEventListener("click", () => {
      const on = chip.classList.contains("active");
      setCategoryChecked(chip.dataset.category, !on);
      sendDisabledPairsUpdate();
    });
  });
}

// A category counts as "picked" when at least one of its pairs is still in.
function syncCategoryChips() {
  const container = el("setting-words-categories");
  el("setting-category-chips").querySelectorAll("[data-category]").forEach((chip) => {
    const category = chip.dataset.category;
    const pairs = wordPairsByCategory.get(category) || [];
    const on = pairs.filter((p) => {
      const box = container.querySelector(`input[data-pair-id="${p.id}"]`);
      return box && box.checked;
    }).length;

    chip.classList.toggle("active", on > 0);
    chip.classList.toggle("partial", on > 0 && on < pairs.length);

    const panel = container.querySelector(`[data-category-panel="${CSS.escape(category)}"]`);
    if (panel) panel.classList.toggle("hidden", on === 0);
    const counter = container.querySelector(`[data-category-on="${CSS.escape(category)}"]`);
    if (counter) counter.textContent = String(on);
  });
}

function setCategoryChecked(category, checked) {
  const ids = new Set((wordPairsByCategory.get(category) || []).map((p) => p.id));
  el("setting-words-categories").querySelectorAll("input[data-pair-id]").forEach((input) => {
    if (ids.has(input.dataset.pairId)) input.checked = checked;
  });
}

// The picker is optimistic: the DOM changes immediately and the server echo
// arrives a round-trip later. Debounce the send and ignore echoes for a beat
// afterwards, so a quick burst of taps doesn't get reverted by a stale one.
let wordEditTimer = null;
let wordEditUntil = 0;

function localWordEditInFlight() {
  return Date.now() < wordEditUntil;
}

function sendDisabledPairsUpdate() {
  wordEditUntil = Date.now() + 1200;
  syncCategoryChips();
  updateWordCountLabel();
  clearTimeout(wordEditTimer);
  wordEditTimer = setTimeout(() => {
    const disabledPairs = Array.from(el("setting-words-categories").querySelectorAll("input[data-pair-id]"))
      .filter((i) => !i.checked)
      .map((i) => i.dataset.pairId);
    wordEditUntil = Date.now() + 1200;
    send({ type: "updateSettings", settings: { disabledPairs } });
  }, 200);
}

function updateWordCountLabel() {
  if (!lastView) return;
  const mode = lastView.settings.wordMode;
  const custom = lastView.settings.customPairs.length;
  const builtinOn =
    mode === "custom"
      ? 0
      : mode === "all"
        ? allWordPairs.length
        : el("setting-words-categories").querySelectorAll("input[data-pair-id]:checked").length;
  el("setting-words-count").textContent = `${builtinOn + custom} in play`;
}

document.querySelectorAll("#setting-wordmode .pill").forEach((btn) => {
  btn.addEventListener("click", () => {
    send({ type: "updateSettings", settings: { wordMode: btn.dataset.wordmode } });
  });
});

// ---- Custom word pairs ----

function renderWordMode(view) {
  const mode = view.settings.wordMode;
  const custom = view.settings.customPairs.length;

  document.querySelectorAll("#setting-wordmode .pill").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.wordmode === mode);
  });
  el("words-builtin-block").classList.toggle("hidden", mode !== "pick");

  if (allWordPairs.length > 0 && !localWordEditInFlight()) {
    const disabledSet = new Set(view.settings.disabledPairs);
    el("setting-words-categories").querySelectorAll("input[data-pair-id]").forEach((input) => {
      input.checked = !disabledSet.has(input.dataset.pairId);
    });
    syncCategoryChips();
  }

  const builtinInPlay =
    mode === "custom" ? 0 : mode === "all" ? allWordPairs.length : allWordPairs.length - view.settings.disabledPairs.length;
  const total = builtinInPlay + custom;

  if (localWordEditInFlight()) {
    updateWordCountLabel();
  } else {
    el("setting-words-count").textContent = `${total} in play`;
  }
  el("wordmode-hint").textContent =
    mode === "all"
      ? `Every built-in pair is in the draw${custom ? `, plus your ${custom}` : ""}.`
      : mode === "pick"
        ? `Tick a whole category, or open it to pick individual pairs. ${builtinInPlay} built-in${custom ? ` + ${custom} of yours` : ""}.`
        : custom
          ? `Only your ${custom} pair${custom === 1 ? "" : "s"} will be used.`
          : "Add at least one pair below to use Custom mode.";
}

function renderCustomPairs(pairs) {
  el("custom-list").innerHTML = pairs
    .map(
      (p, i) => `
      <div class="custom-item">
        <span>${escapeHtml(p.civilian)} / ${escapeHtml(p.undercover)}</span>
        <button type="button" data-remove-custom="${i}" aria-label="Remove">&times;</button>
      </div>`
    )
    .join("");
}

el("custom-list").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-remove-custom]");
  if (!btn || !lastView) return;
  const index = Number(btn.dataset.removeCustom);
  const customPairs = lastView.settings.customPairs.filter((_, i) => i !== index);
  send({ type: "updateSettings", settings: { customPairs } });
});

function addCustomPair() {
  if (!lastView) return;
  const civilian = el("custom-civilian").value.trim();
  const undercover = el("custom-undercover").value.trim();
  if (!civilian || !undercover) return showError("Enter both words");
  const customPairs = [...lastView.settings.customPairs, { civilian, undercover }];
  send({ type: "updateSettings", settings: { customPairs } });
  el("custom-civilian").value = "";
  el("custom-undercover").value = "";
  el("custom-civilian").focus();
}

el("custom-add").addEventListener("click", addCustomPair);
["custom-civilian", "custom-undercover"].forEach((id) => {
  el(id).addEventListener("keydown", (e) => {
    if (e.key === "Enter") addCustomPair();
  });
});

// ---- Admin panel ----

let adminPin = null;
let adminPairs = [];
let adminCategories = [];

async function adminCall(op, payload = {}) {
  const res = await fetch("/api/admin", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ pin: adminPin, op, payload }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  if (data.pairs) {
    adminPairs = data.pairs;
    adminCategories = data.categories || [];
    renderAdmin();
    // The lobby picker caches the bank at load, so refresh it after any edit.
    if (op !== "auth") loadWordPairs();
  }
  return data;
}

function openAdmin() {
  el("modal-admin").classList.remove("hidden");
  if (!adminPin) {
    el("admin-gate").classList.remove("hidden");
    el("admin-panel").classList.add("hidden");
    el("admin-pin").focus();
  }
}

el("admin-link").addEventListener("click", openAdmin);
el("modal-admin-close").addEventListener("click", () => el("modal-admin").classList.add("hidden"));

async function unlockAdmin() {
  const pin = el("admin-pin").value.trim();
  if (!pin) return;
  adminPin = pin;
  try {
    await adminCall("auth");
    el("admin-gate-error").textContent = "";
    el("admin-gate").classList.add("hidden");
    el("admin-panel").classList.remove("hidden");
    el("admin-pin").value = "";
  } catch (err) {
    adminPin = null;
    el("admin-gate-error").textContent = err.message;
  }
}

el("admin-unlock").addEventListener("click", unlockAdmin);
el("admin-pin").addEventListener("keydown", (e) => {
  if (e.key === "Enter") unlockAdmin();
});

function adminError(err) {
  el("admin-error").textContent = err.message || String(err);
  setTimeout(() => (el("admin-error").textContent = ""), 4000);
}

function renderAdmin() {
  // Category chips, each removable
  el("admin-categories").innerHTML = adminCategories
    .map((c) => {
      const n = adminPairs.filter((p) => p.category === c).length;
      return `<span class="cat-chip active" data-admin-category="${escapeHtml(c)}">${escapeHtml(c)} <span class="cat-chip-count">${n}</span> <button class="cat-chip-x" data-delete-category="${escapeHtml(c)}" title="Delete category">&times;</button></span>`;
    })
    .join("");

  const options = adminCategories.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
  const keepCategory = el("admin-category").value;
  const keepFilter = el("admin-filter").value;
  el("admin-category").innerHTML = options;
  el("admin-filter").innerHTML = `<option value="">All categories</option>${options}`;
  if (keepCategory) el("admin-category").value = keepCategory;
  if (keepFilter) el("admin-filter").value = keepFilter;

  const search = el("admin-search").value.trim().toLowerCase();
  const filter = el("admin-filter").value;
  const shown = adminPairs.filter((p) => {
    if (filter && p.category !== filter) return false;
    if (!search) return true;
    return `${p.civilian} ${p.undercover}`.toLowerCase().includes(search);
  });

  el("admin-count").textContent = `${shown.length} of ${adminPairs.length}`;
  el("admin-list").innerHTML = shown
    .slice(0, 300)
    .map(
      (p) => `
      <div class="admin-row" data-id="${escapeHtml(p.id)}">
        <div class="admin-row-main">
          <span>${escapeHtml(p.civilian)} / ${escapeHtml(p.undercover)}</span>
          <span class="admin-row-meta">${escapeHtml(p.category)} · ${escapeHtml(p.difficulty)}${p.builtin ? "" : " · custom"}</span>
        </div>
        <button data-edit="${escapeHtml(p.id)}">Edit</button>
        <button class="danger" data-delete="${escapeHtml(p.id)}">Delete</button>
      </div>`
    )
    .join("");
}

el("admin-search").addEventListener("input", renderAdmin);
el("admin-filter").addEventListener("change", renderAdmin);

el("admin-add-pair").addEventListener("click", async () => {
  try {
    await adminCall("addPair", {
      civilian: el("admin-civilian").value,
      undercover: el("admin-undercover").value,
      category: el("admin-category").value,
      difficulty: el("admin-difficulty").value,
    });
    el("admin-civilian").value = "";
    el("admin-undercover").value = "";
    el("admin-civilian").focus();
  } catch (err) {
    adminError(err);
  }
});

el("admin-add-category").addEventListener("click", async () => {
  const name = el("admin-new-category").value.trim();
  if (!name) return;
  try {
    await adminCall("addCategory", { name });
    el("admin-new-category").value = "";
  } catch (err) {
    adminError(err);
  }
});

el("admin-categories").addEventListener("click", async (e) => {
  const del = e.target.closest("[data-delete-category]");
  if (!del) return;
  const name = del.dataset.deleteCategory;
  const n = adminPairs.filter((p) => p.category === name).length;
  if (!confirm(`Delete "${name}" and its ${n} word pair${n === 1 ? "" : "s"}? This cannot be undone.`)) return;
  try {
    await adminCall("deleteCategory", { name });
  } catch (err) {
    adminError(err);
  }
});

el("admin-list").addEventListener("click", async (e) => {
  const editBtn = e.target.closest("[data-edit]");
  const delBtn = e.target.closest("[data-delete]");
  try {
    if (delBtn) {
      const pair = adminPairs.find((p) => p.id === delBtn.dataset.delete);
      if (!pair) return;
      if (!confirm(`Delete "${pair.civilian} / ${pair.undercover}"?`)) return;
      await adminCall("deletePair", { id: pair.id });
      return;
    }
    if (editBtn) {
      const pair = adminPairs.find((p) => p.id === editBtn.dataset.edit);
      if (!pair) return;
      const civilian = prompt("Civilian word", pair.civilian);
      if (civilian === null) return;
      const undercover = prompt("Undercover word", pair.undercover);
      if (undercover === null) return;
      const category = prompt("Category", pair.category);
      if (category === null) return;
      const difficulty = prompt("Difficulty (easy / medium / hard)", pair.difficulty);
      if (difficulty === null) return;
      await adminCall("updatePair", { id: pair.id, civilian, undercover, category, difficulty });
    }
  } catch (err) {
    adminError(err);
  }
});

el("admin-restore").addEventListener("click", async () => {
  try {
    await adminCall("restoreBuiltins");
  } catch (err) {
    adminError(err);
  }
});

loadWordPairs();

async function api(path, body) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body || {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong");
  return data;
}

function wsUrl(code, playerId, token) {
  const proto = location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${location.host}/api/room/${code}/socket?playerId=${encodeURIComponent(playerId)}&token=${encodeURIComponent(token)}`;
}

function connect(session) {
  intentionalClose = false;
  socket = new WebSocket(wsUrl(session.code, session.playerId, session.token));

  socket.addEventListener("open", () => {
    reconnectAttempts = 0;
  });

  socket.addEventListener("message", (event) => {
    let msg;
    try {
      msg = JSON.parse(event.data);
    } catch {
      return;
    }
    if (msg.type === "state") {
      lastView = msg.view;
      render(lastView);
    } else if (msg.type === "error") {
      showError(msg.message);
    }
  });

  socket.addEventListener("close", () => {
    if (intentionalClose) return;
    if (reconnectAttempts < 8) {
      reconnectAttempts += 1;
      setTimeout(() => connect(session), Math.min(1000 * reconnectAttempts, 4000));
    } else {
      clearSession();
      showScreen("home");
      showError("Lost connection to the room.");
    }
  });
}

function send(msg) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(msg));
  }
}

function showError(message) {
  const active = Object.entries(screens).find(([, node]) => node.classList.contains("active"));
  const targetId = active
    ? { home: "home-error", lobby: "lobby-error", game: "game-error" }[active[0]]
    : "home-error";
  const node = el(targetId);
  if (node) {
    node.textContent = message;
    setTimeout(() => {
      if (node.textContent === message) node.textContent = "";
    }, 4000);
  }
}

// ---- Home screen ----

el("home-create-btn").addEventListener("click", async () => {
  const name = el("home-name").value.trim();
  if (!name) return showError("Enter your name first");
  try {
    const data = await api("/api/rooms", { hostName: name });
    saveSession(data);
    connect(data);
    showScreen("lobby");
  } catch (err) {
    showError(err.message);
  }
});

el("home-join-btn").addEventListener("click", async () => {
  const name = el("home-name").value.trim();
  const code = el("home-code").value.trim().toUpperCase();
  if (!name) return showError("Enter your name first");
  if (!code) return showError("Enter a room code");
  try {
    const data = await api(`/api/room/${code}/join`, { name });
    saveSession(data);
    connect(data);
    showScreen("lobby");
  } catch (err) {
    showError(err.message);
  }
});

el("home-code").addEventListener("input", (e) => {
  e.target.value = e.target.value.toUpperCase();
});

el("link-how-to-play").addEventListener("click", () => el("modal-how-to-play").classList.remove("hidden"));
el("modal-how-to-play-close").addEventListener("click", () => el("modal-how-to-play").classList.add("hidden"));
el("link-faq").addEventListener("click", () => el("modal-faq").classList.remove("hidden"));
el("modal-faq-close").addEventListener("click", () => el("modal-faq").classList.add("hidden"));

// ---- Lobby screen ----

el("lobby-code").addEventListener("click", () => {
  const code = lastView?.code;
  if (!code) return;
  navigator.clipboard?.writeText(code).catch(() => {});
  const btn = el("lobby-code");
  const original = btn.textContent;
  btn.textContent = "Copied!";
  setTimeout(() => (btn.textContent = original), 1000);
});

el("lobby-leave").addEventListener("click", () => {
  intentionalClose = true;
  socket?.close();
  clearSession();
  lastView = null;
  showScreen("home");
});

document.querySelectorAll("[data-step]").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (!lastView) return;
    const key = btn.dataset.step;
    const dir = Number(btn.dataset.dir);
    const current = lastView.settings[key] ?? 0;
    send({ type: "updateSettings", settings: { [key]: current + dir } });
  });
});

document.querySelectorAll("#setting-difficulty .pill").forEach((btn) => {
  btn.addEventListener("click", () => {
    send({ type: "updateSettings", settings: { difficulty: btn.dataset.difficulty } });
  });
});

document.querySelectorAll("#setting-discussion .pill").forEach((btn) => {
  btn.addEventListener("click", () => {
    send({ type: "updateSettings", settings: { discussionSeconds: Number(btn.dataset.discussion) } });
  });
});

el("lobby-start").addEventListener("click", () => {
  send({ type: "startGame" });
});

// ---- Game screen ----

el("game-role-badge").addEventListener("click", () => {
  hasRevealedRole = true;
  if (lastView) render(lastView);
});

el("game-log-toggle").addEventListener("click", () => {
  el("game-log-panel").classList.remove("hidden");
});
el("game-log-close").addEventListener("click", () => {
  el("game-log-panel").classList.add("hidden");
});

// ---- Rendering ----

let lastTurnPlayerId = null;
let lastGuessPlayerId = null;

function maybeChime(view) {
  const myTurn = view.phase === "clue" && view.turnPlayerId === view.you.id;
  if (myTurn && lastTurnPlayerId !== view.you.id) playTurnChime();
  lastTurnPlayerId = view.phase === "clue" ? view.turnPlayerId : null;

  const myGuess = view.phase === "guess" && view.isYourGuess;
  if (myGuess && lastGuessPlayerId !== view.you.id) playTurnChime();
  lastGuessPlayerId = view.phase === "guess" ? view.pendingGuessPlayerId : null;
}

function render(view) {
  maybeChime(view);
  if (view.phase === "lobby") {
    hasRevealedRole = false;
    renderLobby(view);
    showScreen("lobby");
  } else {
    renderGame(view);
    showScreen("game");
  }
}

function renderLobby(view) {
  el("lobby-code").textContent = view.code;
  el("lobby-count").textContent = `(${view.players.length}/20)`;

  el("lobby-players").innerHTML = view.players
    .map((p) => {
      const dotClass = p.connected ? "dot" : "dot off";
      const host = p.isHost ? '<span class="host-tag">Host</span>' : "";
      return `<li><span class="${dotClass}"></span>${escapeHtml(p.name)}${host}</li>`;
    })
    .join("");

  const isHost = view.you.isHost;
  el("lobby-settings").classList.toggle("hidden", !isHost);
  el("lobby-nonhost-hint").classList.toggle("hidden", isHost);

  if (isHost) {
    el("setting-undercover").textContent = view.settings.undercoverCount;
    el("setting-blank").textContent = view.settings.blankCount;
    document.querySelectorAll("#setting-difficulty .pill").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.difficulty === view.settings.difficulty);
    });
    document.querySelectorAll("#setting-discussion .pill").forEach((btn) => {
      btn.classList.toggle("active", Number(btn.dataset.discussion) === view.settings.discussionSeconds);
    });

    renderCustomPairs(view.settings.customPairs);
    renderWordMode(view);

    const impostors = view.settings.undercoverCount + view.settings.blankCount;
    const civilians = view.players.length - impostors;
    let hint = "";
    let canStart = true;
    if (view.players.length < 3) {
      hint = `Need at least 3 players (${view.players.length}/3).`;
      canStart = false;
    } else if (civilians <= impostors) {
      hint = "Civilians must outnumber Undercover + Mr. Black.";
      canStart = false;
    } else if (view.settings.wordMode === "custom" && view.settings.customPairs.length === 0) {
      hint = "Custom mode needs at least one of your own word pairs.";
      canStart = false;
    } else {
      hint = `${civilians} Civilian${civilians === 1 ? "" : "s"} · ${view.settings.undercoverCount} Undercover · ${view.settings.blankCount} Mr. Black`;
    }
    el("lobby-hint").textContent = hint;
    el("lobby-start").disabled = !canStart;
  } else {
    const impostors = view.settings.undercoverCount + view.settings.blankCount;
    const timerNote = view.settings.discussionSeconds > 0 ? ` · ${view.settings.discussionSeconds}s discussion timer` : "";
    el("lobby-nonhost-hint").textContent =
      `Waiting for the host to start — ${view.settings.undercoverCount} Undercover, ${view.settings.blankCount} Mr. Black (${impostors} impostor${impostors === 1 ? "" : "s"} total)${timerNote}.`;
  }
}

function renderGame(view) {
  renderRoleBadge(view);
  renderRoster(view);
  renderCenterPanel(view);
  renderLog(view);
  const phaseLabel = {
    clue: "Clues",
    discussion: "Discussion",
    voting: "Voting",
    guess: "Final guess",
  }[view.phase];
  el("game-round").textContent =
    view.phase === "gameOver" ? "Game over" : `Round ${view.round} · ${phaseLabel}`;
}

function renderRoleBadge(view) {
  const badge = el("game-role-badge");
  badge.className = "role-badge";
  if (!hasRevealedRole) {
    badge.classList.add("role-hidden");
    badge.innerHTML = '<span class="role-badge-hint">Tap to reveal your role</span>';
    return;
  }
  const role = view.you.role;
  badge.classList.add(`role-${role}`);
  const word = view.you.word;
  const wordLine = role === "blank" ? "No word — bluff your way through!" : `Your word: ${word}`;
  badge.innerHTML = `<span class="role-name">${escapeHtml(roleLabel(role))}</span><span class="role-word">${escapeHtml(wordLine)}</span>`;
}

function renderRoster(view) {
  const revealed = view.revealedRoles || {};
  el("game-roster").innerHTML = view.players
    .map((p) => {
      const classes = ["roster-chip"];
      if (p.id === view.turnPlayerId) classes.push("turn");
      if (!p.alive) classes.push("dead");
      const roleTag = revealed[p.id] ? ` — ${escapeHtml(roleLabel(revealed[p.id]))}` : "";
      const you = p.id === view.you.id ? " (you)" : "";
      return `<span class="${classes.join(" ")}">${escapeHtml(p.name)}${escapeHtml(you)}${roleTag}</span>`;
    })
    .join("");
}

let discussionTickInterval = null;

function renderCenterPanel(view) {
  const panel = el("game-center");
  if (discussionTickInterval) {
    clearInterval(discussionTickInterval);
    discussionTickInterval = null;
  }
  if (view.phase === "clue") return renderCluePhase(panel, view);
  if (view.phase === "discussion") return renderDiscussionPhase(panel, view);
  if (view.phase === "voting") return renderVotingPhase(panel, view);
  if (view.phase === "guess") return renderGuessPhase(panel, view);
  if (view.phase === "gameOver") return renderGameOver(panel, view);
  panel.innerHTML = "";
}

function clueFeedHtml(view) {
  const roundClues = view.clues.filter((c) => c.round === view.round);
  if (!roundClues.length) return "";
  return (
    `<div class="clue-feed">` +
    roundClues
      .map((c) => {
        const p = view.players.find((pp) => pp.id === c.playerId);
        return `<div class="clue-feed-item"><strong>${escapeHtml(p?.name || "?")}</strong> — "${escapeHtml(c.text)}"</div>`;
      })
      .join("") +
    `</div>`
  );
}

function renderDiscussionPhase(panel, view) {
  panel.innerHTML = `
    <h2>Talk it over</h2>
    <div id="discussion-countdown" class="discussion-countdown">--:--</div>
    <p class="meta center">Voting opens automatically when the clock runs out.</p>
    ${clueFeedHtml(view)}
    ${view.you.isHost ? '<button id="discussion-skip" class="btn btn-ghost btn-small">Skip to vote</button>' : ""}
  `;

  const tick = () => {
    const remainingMs = view.discussionEndsAt ? view.discussionEndsAt - Date.now() : 0;
    const remaining = Math.max(0, Math.ceil(remainingMs / 1000));
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    const node = el("discussion-countdown");
    if (node) node.textContent = `${mins}:${String(secs).padStart(2, "0")}`;
    if (remaining <= 0 && discussionTickInterval) {
      clearInterval(discussionTickInterval);
      discussionTickInterval = null;
    }
  };
  tick();
  discussionTickInterval = setInterval(tick, 250);

  el("discussion-skip")?.addEventListener("click", () => send({ type: "skipTurn" }));
}

function renderCluePhase(panel, view) {
  const isYourTurn = view.turnPlayerId === view.you.id;
  const turnPlayer = view.players.find((p) => p.id === view.turnPlayerId);

  let html = "";
  if (isYourTurn && view.you.alive) {
    html += `
      <h2>Your turn</h2>
      <div class="clue-input-row">
        <input id="clue-input" type="text" maxlength="80" placeholder="Give a one-line clue..." autocomplete="off" />
        <button id="clue-submit" class="btn btn-primary">Send</button>
      </div>`;
  } else {
    html += `<h2>Clue round</h2><p>Waiting for <strong>${escapeHtml(turnPlayer?.name || "?")}</strong> to give a clue&hellip;</p>`;
  }

  html += clueFeedHtml(view);

  if (view.you.isHost) {
    html += `<button id="clue-skip" class="btn btn-ghost btn-small">Skip current player</button>`;
  }

  panel.innerHTML = html;

  const input = el("clue-input");
  const submit = el("clue-submit");
  const doSubmit = () => {
    const text = input.value.trim();
    if (!text) return;
    send({ type: "submitClue", text });
    input.value = "";
  };
  submit?.addEventListener("click", doSubmit);
  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") doSubmit();
  });
  el("clue-skip")?.addEventListener("click", () => send({ type: "skipTurn" }));
}

function renderVotingPhase(panel, view) {
  if (!view.you.alive) {
    panel.innerHTML = `<h2>Voting</h2><p>You've been eliminated — watch how it plays out.</p><p class="meta">${view.votesInCount}/${view.voteEligibleCount} voted</p>`;
    return;
  }

  const candidates = view.voteCandidates
    ? view.players.filter((p) => view.voteCandidates.includes(p.id))
    : view.players.filter((p) => p.alive && p.id !== view.you.id);

  const tieNote = view.voteCandidates ? `<p class="meta">Revote — pick between the tied players.</p>` : "";

  panel.innerHTML = `
    <h2>Who's suspicious?</h2>
    ${tieNote}
    <div class="vote-grid">
      ${candidates
        .map((p) => {
          const selected = view.yourVoteTargetId === p.id ? "selected" : "";
          return `<button class="vote-btn ${selected}" data-vote="${p.id}">${escapeHtml(p.name)}</button>`;
        })
        .join("")}
    </div>
    <p class="meta">${view.votesInCount}/${view.voteEligibleCount} voted</p>
  `;

  panel.querySelectorAll("[data-vote]").forEach((btn) => {
    btn.addEventListener("click", () => {
      send({ type: "submitVote", targetId: btn.dataset.vote });
    });
  });
}

function renderGuessPhase(panel, view) {
  const guesser = view.players.find((p) => p.id === view.pendingGuessPlayerId);
  if (view.isYourGuess) {
    panel.innerHTML = `
      <h2>You were caught!</h2>
      <p>You're Mr. Black — guess the Civilians' word to steal the round.</p>
      <div class="clue-input-row">
        <input id="guess-input" type="text" maxlength="40" placeholder="Your guess..." autocomplete="off" />
        <button id="guess-submit" class="btn btn-primary">Guess</button>
      </div>
    `;
    const input = el("guess-input");
    const submit = el("guess-submit");
    const doSubmit = () => {
      const word = input.value.trim();
      if (!word) return;
      send({ type: "submitGuess", word });
    };
    submit.addEventListener("click", doSubmit);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") doSubmit();
    });
  } else {
    panel.innerHTML = `<h2>Final guess</h2><p><strong>${escapeHtml(guesser?.name || "?")}</strong> was Mr. Black and is guessing the word&hellip;</p>`;
    if (view.you.isHost) {
      panel.innerHTML += `<button id="guess-skip" class="btn btn-ghost btn-small">Force wrong guess</button>`;
      el("guess-skip")?.addEventListener("click", () => send({ type: "skipTurn" }));
    }
  }
}

function renderGameOver(panel, view) {
  const reveal = view.finalReveal;
  const winnerLabel = view.winner === "civilians" ? "Civilians win!" : "Impostors win!";
  let html = `<div class="winner-banner ${view.winner}">${escapeHtml(winnerLabel)}</div>`;

  if (reveal) {
    html += `<p class="meta">Category: ${escapeHtml(reveal.category)} · Civilian word: <strong>${escapeHtml(reveal.civilianWord)}</strong> · Undercover word: <strong>${escapeHtml(reveal.undercoverWord)}</strong></p>`;
    html += `<ul class="reveal-list">` + view.players
      .map((p) => `<li><span>${escapeHtml(p.name)}</span><span>${escapeHtml(roleLabel(reveal.allRoles[p.id]))}</span></li>`)
      .join("") + `</ul>`;
  }

  if (view.you.isHost) {
    html += `<button id="play-again" class="btn btn-primary">Play again</button>`;
  } else {
    html += `<p class="meta center">Waiting for the host to start a new game&hellip;</p>`;
  }

  panel.innerHTML = html;
  el("play-again")?.addEventListener("click", () => send({ type: "playAgain" }));
}

function renderLog(view) {
  el("game-log-list").innerHTML = view.log
    .map((entry) => {
      const time = new Date(entry.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      return `<li><span class="log-time">${time}</span>${escapeHtml(entry.text)}</li>`;
    })
    .join("");
  const list = el("game-log-list");
  list.scrollTop = list.scrollHeight;
}

// ---- Boot ----

(function boot() {
  const session = loadSession();
  if (session) {
    showScreen("lobby");
    connect(session);
    return;
  }

  // Invite links land here as /?room=CODE — skip the landing page, prefill the
  // code, and let them straight into the join form.
  const invited = new URLSearchParams(location.search).get("room");
  if (invited) {
    showScreen("home");
    el("home-code").value = invited.toUpperCase().slice(0, 6);
    el("home-error").textContent = "Room code filled in — add your name to join.";
    el("home-name").focus();
    return;
  }

  showScreen("landing");
})();
