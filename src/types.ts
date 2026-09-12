export type Role = "civilian" | "undercover" | "blank";

export type Difficulty = "any" | "easy" | "medium" | "hard";

export type Phase = "lobby" | "clue" | "discussion" | "voting" | "guess" | "gameOver";

export interface Player {
  id: string;
  name: string;
  token: string;
  isHost: boolean;
  connected: boolean;
  alive: boolean;
  role?: Role;
}

export interface CustomPair {
  civilian: string;
  undercover: string;
}

// "all" = the whole built-in bank, "pick" = only the categories/pairs left ticked,
// "custom" = nothing but the host's own pairs.
export type WordMode = "all" | "pick" | "custom";

export interface Settings {
  undercoverCount: number;
  blankCount: number;
  difficulty: Difficulty;
  discussionSeconds: number;
  wordMode: WordMode;
  disabledPairs: string[];
  customPairs: CustomPair[];
}

export interface LogEntry {
  id: number;
  type:
    | "system"
    | "join"
    | "leave"
    | "clue"
    | "eliminate"
    | "guess"
    | "roundStart"
    | "gameOver"
    | "tie";
  text: string;
  ts: number;
}

export interface RoomState {
  code: string;
  phase: Phase;
  createdAt: number;
  players: Player[];
  settings: Settings;
  round: number;
  turnOrder: string[];
  turnIndex: number;
  clues: { playerId: string; text: string; round: number }[];
  votes: Record<string, string>;
  voteCandidates: string[] | null;
  revoteCount: number;
  pendingGuessPlayerId: string | null;
  civilianWord: string | null;
  undercoverWord: string | null;
  category: string | null;
  discussionEndsAt: number | null;
  log: LogEntry[];
  winner: "civilians" | "impostors" | null;
  nextLogId: number;
}

// Messages sent from client -> server over the room WebSocket
export type ClientMessage =
  | { type: "updateSettings"; settings: Partial<Settings> }
  | { type: "startGame" }
  | { type: "submitClue"; text: string }
  | { type: "submitVote"; targetId: string }
  | { type: "submitGuess"; word: string }
  | { type: "skipTurn" }
  | { type: "playAgain" };

// A per-player, privacy-scoped view of the room, sent server -> client
export interface ClientView {
  code: string;
  phase: Phase;
  round: number;
  you: {
    id: string;
    name: string;
    isHost: boolean;
    alive: boolean;
    role: Role | null;
    word: string | null;
  };
  players: Array<{
    id: string;
    name: string;
    isHost: boolean;
    connected: boolean;
    alive: boolean;
  }>;
  settings: Settings;
  turnPlayerId: string | null;
  discussionEndsAt: number | null;
  clues: { playerId: string; text: string; round: number }[];
  votesInCount: number;
  voteEligibleCount: number;
  yourVoteTargetId: string | null;
  voteCandidates: string[] | null;
  pendingGuessPlayerId: string | null;
  isYourGuess: boolean;
  revealedRoles: Record<string, Role>;
  finalReveal: {
    civilianWord: string;
    undercoverWord: string;
    category: string;
    allRoles: Record<string, Role>;
  } | null;
  winner: "civilians" | "impostors" | null;
  log: LogEntry[];
}

// Server -> client envelope over the WebSocket
export type ServerMessage =
  | { type: "state"; view: ClientView }
  | { type: "error"; message: string };
