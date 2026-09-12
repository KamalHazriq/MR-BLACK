import { DurableObject } from "cloudflare:workers";
import { pickWordPair } from "./words";
import type {
  ClientMessage,
  ClientView,
  LogEntry,
  Player,
  Role,
  RoomState,
  ServerMessage,
} from "./types";

export interface Env {
  ROOMS: DurableObjectNamespace<Room>;
}

const MAX_PLAYERS = 20;
const MIN_PLAYERS = 3;
const MAX_LOG = 300;
const IDLE_CLEANUP_MS = 15 * 60 * 1000;

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function roleLabel(role: Role): string {
  if (role === "civilian") return "Civilian";
  if (role === "undercover") return "Undercover";
  return "Mr. Black";
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export class Room extends DurableObject<Env> {
  private state: RoomState | null = null;
  private loaded = false;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }

  private async ensureLoaded(): Promise<void> {
    if (this.loaded) return;
    await this.ctx.blockConcurrencyWhile(async () => {
      const stored = await this.ctx.storage.get<RoomState>("state");
      this.state = stored ?? null;
      this.loaded = true;
    });
  }

  private async persist(): Promise<void> {
    if (this.state) {
      await this.ctx.storage.put("state", this.state);
    }
  }

  private log(type: LogEntry["type"], text: string) {
    if (!this.state) return;
    const entry: LogEntry = {
      id: this.state.nextLogId++,
      type,
      text,
      ts: Date.now(),
    };
    this.state.log.push(entry);
    if (this.state.log.length > MAX_LOG) {
      this.state.log = this.state.log.slice(-MAX_LOG);
    }
  }

  async fetch(request: Request): Promise<Response> {
    await this.ensureLoaded();
    const url = new URL(request.url);
    const parts = url.pathname.split("/").filter(Boolean); // ["api","room",":code","..."]
    const action = parts[3] ?? "";

    try {
      if (request.method === "POST" && action === "create") {
        return await this.handleCreate(request);
      }
      if (request.method === "POST" && action === "join") {
        return await this.handleJoin(request);
      }
      if (request.method === "GET" && action === "socket") {
        return await this.handleSocketUpgrade(request);
      }
      return json({ error: "Not found" }, 404);
    } catch (err) {
      console.error("Room.fetch error", err);
      return json({ error: "Internal error" }, 500);
    }
  }

  // ---- HTTP actions ----

  private async handleCreate(request: Request): Promise<Response> {
    if (this.state) return json({ error: "Room already exists" }, 400);
    const body = await request.json<{ code: string; hostName: string }>();
    const code = (body.code || "").toUpperCase().trim();
    const hostName = (body.hostName || "").trim().slice(0, 20);
    if (!code || !hostName) return json({ error: "Missing code or name" }, 400);

    const hostId = crypto.randomUUID();
    const hostToken = crypto.randomUUID();
    const host: Player = {
      id: hostId,
      name: hostName,
      token: hostToken,
      isHost: true,
      connected: false,
      alive: true,
    };

    this.state = {
      code,
      phase: "lobby",
      createdAt: Date.now(),
      players: [host],
      settings: {
        undercoverCount: 1,
        blankCount: 1,
        difficulty: "any",
        discussionSeconds: 0,
        disabledPairs: [],
      },
      round: 0,
      turnOrder: [],
      turnIndex: 0,
      clues: [],
      votes: {},
      voteCandidates: null,
      revoteCount: 0,
      pendingGuessPlayerId: null,
      civilianWord: null,
      undercoverWord: null,
      category: null,
      discussionEndsAt: null,
      log: [],
      winner: null,
      nextLogId: 1,
    };
    this.log("system", `Room ${code} created by ${hostName}.`);
    await this.persist();

    return json({ code, playerId: hostId, token: hostToken });
  }

  private async handleJoin(request: Request): Promise<Response> {
    if (!this.state) return json({ error: "Room not found" }, 404);
    const body = await request.json<{ name: string }>();
    const name = (body.name || "").trim().slice(0, 20);
    if (!name) return json({ error: "Name is required" }, 400);
    if (this.state.phase !== "lobby") {
      return json({ error: "Game already started" }, 400);
    }
    if (this.state.players.length >= MAX_PLAYERS) {
      return json({ error: "Room is full" }, 400);
    }

    const playerId = crypto.randomUUID();
    const token = crypto.randomUUID();
    const player: Player = {
      id: playerId,
      name,
      token,
      isHost: false,
      connected: false,
      alive: true,
    };
    this.state.players.push(player);
    this.log("join", `${name} joined the room.`);
    await this.persist();
    this.broadcast();

    return json({ code: this.state.code, playerId, token });
  }

  private async handleSocketUpgrade(request: Request): Promise<Response> {
    if (!this.state) return json({ error: "Room not found" }, 404);
    const url = new URL(request.url);
    const playerId = url.searchParams.get("playerId") || "";
    const token = url.searchParams.get("token") || "";
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player || player.token !== token) {
      return json({ error: "Invalid credentials" }, 401);
    }

    if (request.headers.get("Upgrade") !== "websocket") {
      return json({ error: "Expected websocket" }, 426);
    }

    // Close any stale sockets for this player (e.g. reconnect from a new tab).
    for (const old of this.ctx.getWebSockets(playerId)) {
      try {
        old.close(4000, "Reconnected elsewhere");
      } catch {
        // ignore
      }
    }

    const pair = new WebSocketPair();
    this.ctx.acceptWebSocket(pair[1], [playerId]);
    player.connected = true;
    this.log("system", `${player.name} connected.`);
    this.checkDiscussionExpiry();
    await this.ctx.storage.deleteAlarm();
    await this.persist();
    this.broadcast();

    return new Response(null, { status: 101, webSocket: pair[0] });
  }

  // ---- WebSocket handlers ----

  // A discussion-end alarm can be delayed by a later idle-cleanup alarm
  // overwriting it (only one alarm exists per DO), so also check expiry
  // opportunistically whenever a player connects or sends a message.
  private checkDiscussionExpiry(): void {
    const state = this.state;
    if (state && state.phase === "discussion" && state.discussionEndsAt !== null && Date.now() >= state.discussionEndsAt) {
      this.endDiscussion();
    }
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    await this.ensureLoaded();
    if (!this.state || typeof message !== "string") return;
    const tags = this.ctx.getTags(ws);
    const playerId = tags[0];
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player) return;

    let msg: ClientMessage;
    try {
      msg = JSON.parse(message);
    } catch {
      return;
    }

    try {
      this.checkDiscussionExpiry();
      switch (msg.type) {
        case "updateSettings":
          this.actionUpdateSettings(player, msg.settings);
          break;
        case "startGame":
          this.actionStartGame(player);
          break;
        case "submitClue":
          this.actionSubmitClue(player, msg.text);
          break;
        case "submitVote":
          this.actionSubmitVote(player, msg.targetId);
          break;
        case "submitGuess":
          this.actionSubmitGuess(player, msg.word);
          break;
        case "skipTurn":
          this.actionSkipTurn(player);
          break;
        case "playAgain":
          this.actionPlayAgain(player);
          break;
      }
      await this.persist();
      this.broadcast();
    } catch (err) {
      const errMsg: ServerMessage = {
        type: "error",
        message: err instanceof Error ? err.message : "Something went wrong",
      };
      ws.send(JSON.stringify(errMsg));
    }
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    await this.ensureLoaded();
    if (!this.state) return;
    const tags = this.ctx.getTags(ws);
    const playerId = tags[0];
    const player = this.state.players.find((p) => p.id === playerId);
    if (player) {
      player.connected = false;
      this.log("leave", `${player.name} disconnected.`);
      await this.persist();
      this.broadcast();
    }
    if (this.ctx.getWebSockets().length === 0) {
      await this.ctx.storage.setAlarm(Date.now() + IDLE_CLEANUP_MS);
    }
  }

  async alarm(): Promise<void> {
    await this.ensureLoaded();
    if (!this.state) return;

    if (this.state.phase === "discussion" && this.state.discussionEndsAt !== null && Date.now() >= this.state.discussionEndsAt - 250) {
      this.endDiscussion();
      await this.persist();
      this.broadcast();
    }

    if (this.ctx.getWebSockets().length === 0) {
      await this.ctx.storage.deleteAll();
      this.state = null;
      this.loaded = false;
    }
  }

  // ---- Game actions ----

  private requireHost(player: Player) {
    if (!player.isHost) throw new Error("Only the host can do that");
  }

  private actionUpdateSettings(player: Player, partial: Partial<RoomState["settings"]>) {
    const state = this.state!;
    this.requireHost(player);
    if (state.phase !== "lobby") throw new Error("Cannot change settings mid-game");
    if (typeof partial.undercoverCount === "number") {
      state.settings.undercoverCount = Math.max(0, Math.min(6, Math.round(partial.undercoverCount)));
    }
    if (typeof partial.blankCount === "number") {
      state.settings.blankCount = Math.max(0, Math.min(6, Math.round(partial.blankCount)));
    }
    if (partial.difficulty) state.settings.difficulty = partial.difficulty;
    if (typeof partial.discussionSeconds === "number") {
      state.settings.discussionSeconds = Math.max(0, Math.min(300, Math.round(partial.discussionSeconds)));
    }
    if (partial.disabledPairs) {
      state.settings.disabledPairs = partial.disabledPairs.filter((id) => typeof id === "string").slice(0, 500);
    }
  }

  private actionStartGame(player: Player) {
    const state = this.state!;
    this.requireHost(player);
    if (state.phase !== "lobby") throw new Error("Game already started");
    if (state.players.length < MIN_PLAYERS) {
      throw new Error(`Need at least ${MIN_PLAYERS} players`);
    }
    const { undercoverCount, blankCount } = state.settings;
    const impostorCount = undercoverCount + blankCount;
    const civilianCount = state.players.length - impostorCount;
    if (civilianCount <= impostorCount) {
      throw new Error("Civilians must outnumber the Undercover + Mr. Black roles");
    }

    const pair = pickWordPair(state.settings.difficulty, state.settings.disabledPairs);
    state.civilianWord = pair.civilian;
    state.undercoverWord = pair.undercover;
    state.category = pair.category;

    const shuffled = shuffle(state.players);
    shuffled.forEach((p, i) => {
      p.alive = true;
      if (i < undercoverCount) p.role = "undercover";
      else if (i < undercoverCount + blankCount) p.role = "blank";
      else p.role = "civilian";
    });

    state.clues = [];
    state.votes = {};
    state.voteCandidates = null;
    state.revoteCount = 0;
    state.pendingGuessPlayerId = null;
    state.winner = null;
    state.round = 0;
    this.log("system", `Game started — ${state.players.length} players, ${undercoverCount} Undercover, ${blankCount} Mr. Black.`);
    this.startNextRound();
  }

  private startNextRound() {
    const state = this.state!;
    state.round += 1;
    const aliveIds = state.players.filter((p) => p.alive).map((p) => p.id);
    state.turnOrder = shuffle(aliveIds);
    state.turnIndex = 0;
    state.phase = "clue";
    state.discussionEndsAt = null;
    this.log("roundStart", `Round ${state.round} begins.`);
  }

  private actionSubmitClue(player: Player, text: string) {
    const state = this.state!;
    if (state.phase !== "clue") throw new Error("Not clue time");
    if (state.turnOrder[state.turnIndex] !== player.id) throw new Error("Not your turn");
    const clean = (text || "").trim().slice(0, 80);
    if (!clean) throw new Error("Clue cannot be empty");
    state.clues.push({ playerId: player.id, text: clean, round: state.round });
    this.log("clue", `${player.name}: "${clean}"`);
    this.advanceTurn();
  }

  private actionSkipTurn(player: Player) {
    const state = this.state!;
    this.requireHost(player);
    if (state.phase === "clue") {
      const currentId = state.turnOrder[state.turnIndex];
      const current = state.players.find((p) => p.id === currentId);
      if (current) this.log("clue", `${current.name} was skipped.`);
      this.advanceTurn();
    } else if (state.phase === "guess" && state.pendingGuessPlayerId) {
      this.resolveGuess(state.pendingGuessPlayerId, "");
    } else if (state.phase === "discussion") {
      this.endDiscussion();
    }
  }

  private advanceTurn() {
    const state = this.state!;
    state.turnIndex += 1;
    if (state.turnIndex >= state.turnOrder.length) {
      if (state.settings.discussionSeconds > 0) {
        state.phase = "discussion";
        state.discussionEndsAt = Date.now() + state.settings.discussionSeconds * 1000;
        this.ctx.storage.setAlarm(state.discussionEndsAt);
        this.log("system", "Clues are in — talk it over before voting.");
      } else {
        state.phase = "voting";
        state.votes = {};
        state.voteCandidates = null;
        this.log("system", "Clue round complete — time to vote.");
      }
    }
  }

  private endDiscussion() {
    const state = this.state!;
    if (state.phase !== "discussion") return;
    state.phase = "voting";
    state.discussionEndsAt = null;
    state.votes = {};
    state.voteCandidates = null;
    this.log("system", "Discussion's over — time to vote.");
  }

  private actionSubmitVote(player: Player, targetId: string) {
    const state = this.state!;
    if (state.phase !== "voting") throw new Error("Not voting time");
    if (!player.alive) throw new Error("Eliminated players cannot vote");
    if (targetId === player.id) throw new Error("You cannot vote for yourself");
    const target = state.players.find((p) => p.id === targetId);
    if (!target || !target.alive) throw new Error("Invalid vote target");
    if (state.voteCandidates && !state.voteCandidates.includes(targetId)) {
      throw new Error("That player is not up for the revote");
    }
    state.votes[player.id] = targetId;

    const aliveIds = state.players.filter((p) => p.alive).map((p) => p.id);
    const allVoted = aliveIds.every((id) => state.votes[id]);
    if (allVoted) this.tallyVotes();
  }

  private tallyVotes() {
    const state = this.state!;
    const counts = new Map<string, number>();
    for (const targetId of Object.values(state.votes)) {
      counts.set(targetId, (counts.get(targetId) ?? 0) + 1);
    }
    let max = 0;
    for (const c of counts.values()) max = Math.max(max, c);
    const top = [...counts.entries()].filter(([, c]) => c === max).map(([id]) => id);

    if (top.length === 1) {
      this.eliminate(top[0]);
      return;
    }

    // Tie
    const names = top
      .map((id) => state.players.find((p) => p.id === id)?.name ?? "?")
      .join(" and ");
    if (state.revoteCount < 1) {
      state.revoteCount += 1;
      state.voteCandidates = top;
      state.votes = {};
      this.log("tie", `Tie between ${names} — revote!`);
    } else {
      const chosen = top[Math.floor(Math.random() * top.length)];
      this.log("tie", `Still tied between ${names} — drawing lots...`);
      this.eliminate(chosen);
    }
  }

  private eliminate(targetId: string) {
    const state = this.state!;
    const target = state.players.find((p) => p.id === targetId);
    if (!target || !target.role) return;
    target.alive = false;
    this.log("eliminate", `${target.name} was voted out. They were ${roleLabel(target.role)}.`);
    state.votes = {};
    state.voteCandidates = null;

    if (target.role === "blank") {
      state.phase = "guess";
      state.pendingGuessPlayerId = target.id;
      this.log("system", `${target.name} gets one guess at the civilian word...`);
      return;
    }
    this.checkWinOrContinue();
  }

  private actionSubmitGuess(player: Player, word: string) {
    const state = this.state!;
    if (state.phase !== "guess" || state.pendingGuessPlayerId !== player.id) {
      throw new Error("You have no guess pending");
    }
    this.resolveGuess(player.id, word);
  }

  private resolveGuess(playerId: string, word: string) {
    const state = this.state!;
    const player = state.players.find((p) => p.id === playerId);
    if (!player || !state.civilianWord) return;
    const clean = (word || "").trim();
    const correct =
      clean.length > 0 &&
      clean.toLowerCase() === state.civilianWord.toLowerCase();
    state.pendingGuessPlayerId = null;
    if (clean) {
      this.log("guess", `${player.name} guessed "${clean}" — ${correct ? "correct!" : "wrong."}`);
    } else {
      this.log("guess", `${player.name} did not guess in time.`);
    }

    if (correct) {
      state.winner = "impostors";
      state.phase = "gameOver";
      this.log("gameOver", `${player.name} stole the round for the impostors!`);
      return;
    }
    this.checkWinOrContinue();
  }

  private checkWinOrContinue() {
    const state = this.state!;
    const alive = state.players.filter((p) => p.alive);
    const aliveImpostors = alive.filter((p) => p.role === "undercover" || p.role === "blank");
    const aliveCivilians = alive.filter((p) => p.role === "civilian");

    if (aliveImpostors.length === 0) {
      state.winner = "civilians";
      state.phase = "gameOver";
      this.log("gameOver", "All impostors were caught. Civilians win!");
      return;
    }
    if (aliveImpostors.length >= aliveCivilians.length) {
      state.winner = "impostors";
      state.phase = "gameOver";
      this.log("gameOver", "The impostors reached parity. Impostors win!");
      return;
    }
    this.startNextRound();
  }

  private actionPlayAgain(player: Player) {
    const state = this.state!;
    this.requireHost(player);
    if (state.phase !== "gameOver") throw new Error("Game is not over yet");
    for (const p of state.players) {
      p.alive = true;
      p.role = undefined;
    }
    state.phase = "lobby";
    state.round = 0;
    state.turnOrder = [];
    state.turnIndex = 0;
    state.clues = [];
    state.votes = {};
    state.voteCandidates = null;
    state.revoteCount = 0;
    state.pendingGuessPlayerId = null;
    state.civilianWord = null;
    state.undercoverWord = null;
    state.category = null;
    state.discussionEndsAt = null;
    state.winner = null;
    this.log("system", "— New game — back to the lobby.");
  }

  // ---- View + broadcast ----

  private revealedRoles(): Record<string, Role> {
    const state = this.state!;
    const out: Record<string, Role> = {};
    for (const p of state.players) {
      if (!p.alive && p.role) out[p.id] = p.role;
    }
    if (state.phase === "gameOver") {
      for (const p of state.players) {
        if (p.role) out[p.id] = p.role;
      }
    }
    return out;
  }

  private viewFor(playerId: string): ClientView {
    const state = this.state!;
    const you = state.players.find((p) => p.id === playerId)!;
    const revealed = this.revealedRoles();

    return {
      code: state.code,
      phase: state.phase,
      round: state.round,
      you: {
        id: you.id,
        name: you.name,
        isHost: you.isHost,
        alive: you.alive,
        role: you.role ?? null,
        word:
          you.role === "civilian"
            ? state.civilianWord
            : you.role === "undercover"
              ? state.undercoverWord
              : null,
      },
      players: state.players.map((p) => ({
        id: p.id,
        name: p.name,
        isHost: p.isHost,
        connected: p.connected,
        alive: p.alive,
      })),
      settings: state.settings,
      turnPlayerId: state.phase === "clue" ? (state.turnOrder[state.turnIndex] ?? null) : null,
      discussionEndsAt: state.discussionEndsAt,
      clues: state.clues,
      votesInCount: Object.keys(state.votes).length,
      voteEligibleCount: state.players.filter((p) => p.alive).length,
      yourVoteTargetId: state.votes[playerId] ?? null,
      voteCandidates: state.voteCandidates,
      pendingGuessPlayerId: state.pendingGuessPlayerId,
      isYourGuess: state.pendingGuessPlayerId === playerId,
      revealedRoles: revealed,
      finalReveal:
        state.phase === "gameOver" && state.civilianWord && state.undercoverWord && state.category
          ? {
              civilianWord: state.civilianWord,
              undercoverWord: state.undercoverWord,
              category: state.category,
              allRoles: revealed,
            }
          : null,
      winner: state.winner,
      log: state.log,
    };
  }

  private broadcast() {
    if (!this.state) return;
    for (const ws of this.ctx.getWebSockets()) {
      const tags = this.ctx.getTags(ws);
      const playerId = tags[0];
      if (!playerId) continue;
      const player = this.state.players.find((p) => p.id === playerId);
      if (!player) continue;
      const msg: ServerMessage = { type: "state", view: this.viewFor(playerId) };
      try {
        ws.send(JSON.stringify(msg));
      } catch {
        // ignore send errors on dead sockets
      }
    }
  }
}
