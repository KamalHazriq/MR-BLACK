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
  const btn = document.getElementById("theme-toggle");
  if (btn) btn.textContent = effectiveTheme() === "dark" ? "☀️" : "🌙";
}

document.getElementById("theme-toggle").addEventListener("click", () => {
  const next = effectiveTheme() === "dark" ? "light" : "dark";
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {
    // ignore storage errors (e.g. private browsing)
  }
  applyTheme(next);
});

try {
  applyTheme(localStorage.getItem(THEME_KEY));
} catch {
  applyTheme(null);
}

const el = (id) => document.getElementById(id);
const screens = {
  home: el("screen-home"),
  lobby: el("screen-lobby"),
  game: el("screen-game"),
};

function showScreen(name) {
  for (const key of Object.keys(screens)) {
    screens[key].classList.toggle("active", key === name);
  }
}

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

function render(view) {
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
  el("game-round").textContent = view.phase === "gameOver" ? "Game over" : `Round ${view.round}`;
}

function renderRoleBadge(view) {
  const badge = el("game-role-badge");
  badge.className = "role-badge";
  if (!hasRevealedRole) {
    badge.classList.add("role-hidden");
    badge.textContent = "Tap to reveal your role";
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

function renderDiscussionPhase(panel, view) {
  const roundClues = view.clues.filter((c) => c.round === view.round);
  const cluesHtml = roundClues
    .map((c) => {
      const p = view.players.find((pp) => pp.id === c.playerId);
      return `<div class="small muted">${escapeHtml(p?.name || "?")}: "${escapeHtml(c.text)}"</div>`;
    })
    .join("");

  panel.innerHTML = `
    <h2>Talk it over</h2>
    <div id="discussion-countdown" class="discussion-countdown">--:--</div>
    <p class="small muted center">Discuss out loud (or in Discord), then voting opens automatically.</p>
    <div class="stack">${cluesHtml}</div>
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
  const roundClues = view.clues.filter((c) => c.round === view.round);

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

  if (roundClues.length) {
    html += `<div class="stack">` + roundClues
      .map((c) => {
        const p = view.players.find((pp) => pp.id === c.playerId);
        return `<div class="small muted">${escapeHtml(p?.name || "?")}: "${escapeHtml(c.text)}"</div>`;
      })
      .join("") + `</div>`;
  }

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
    panel.innerHTML = `<h2>Voting</h2><p>You've been eliminated — watch how it plays out.</p><p class="muted small">${view.votesInCount}/${view.voteEligibleCount} voted</p>`;
    return;
  }

  const candidates = view.voteCandidates
    ? view.players.filter((p) => view.voteCandidates.includes(p.id))
    : view.players.filter((p) => p.alive && p.id !== view.you.id);

  const tieNote = view.voteCandidates ? `<p class="small muted">Revote — pick between the tied players.</p>` : "";

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
    <p class="small muted">${view.votesInCount}/${view.voteEligibleCount} voted</p>
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
    html += `<p class="small muted">Category: ${escapeHtml(reveal.category)} · Civilian word: <strong>${escapeHtml(reveal.civilianWord)}</strong> · Undercover word: <strong>${escapeHtml(reveal.undercoverWord)}</strong></p>`;
    html += `<ul class="reveal-list">` + view.players
      .map((p) => `<li><span>${escapeHtml(p.name)}</span><span>${escapeHtml(roleLabel(reveal.allRoles[p.id]))}</span></li>`)
      .join("") + `</ul>`;
  }

  if (view.you.isHost) {
    html += `<button id="play-again" class="btn btn-primary">Play again</button>`;
  } else {
    html += `<p class="muted small center">Waiting for the host to start a new game&hellip;</p>`;
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
  } else {
    showScreen("home");
  }
})();
