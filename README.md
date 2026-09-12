# Mr. Black

An online, real-time version of the Undercover / Mr. White social deduction party game — reskinned as **Mr. Black**. Play with up to 20 friends, each on their own device. No app, no account, no database.

## How it plays

- Most players are **Civilians** and share a secret word.
- One or more players are **Undercover** and get a similar-but-different word.
- One or more players are **Mr. Black** and get no word at all — pure bluff.
- Each round, players take turns typing a one-line clue about their word.
- After clues, everyone votes simultaneously on who to eliminate.
- Eliminating **Mr. Black** gives them one shot at guessing the Civilian word — guess right and the impostors steal the round.
- **Civilians win** by eliminating every impostor. **Impostors win** by reaching equal numbers with the Civilians.

This build assumes players are talking over a separate voice channel (e.g. Discord) — clues are typed into a shared, timestamped log so everyone can see who said what and whose turn it is.

## Stack

- **Cloudflare Workers** serves the static frontend (plain HTML/CSS/JS, no build step, no framework).
- **Durable Objects** — one instance per room — hold all game state (players, roles, turn order, votes, log) in memory and push updates to every connected player over WebSockets (Hibernation API). State is mirrored into the Durable Object's own local storage so a room survives a hibernation cycle, but nothing is written to an external database, and idle rooms clean themselves up automatically.

## Local development

```bash
npm install
npm run dev
```

This starts a local Worker + Durable Object at `http://localhost:8787`. Open it in multiple browser tabs (or on multiple phones on the same network via your machine's LAN IP) to test multiplayer.

## Deploy

```bash
npx wrangler login   # one-time, opens a browser to authorize your Cloudflare account
npm run deploy
```

Wrangler prints the live `*.workers.dev` URL when it finishes — share that (or the room code it generates) with friends.

## Project structure

```
src/
  index.ts   Worker entry — routes HTTP to the right room, serves static assets
  room.ts    Durable Object — all game logic and state for a single room
  words.ts   Curated word-pair bank (category + difficulty)
  types.ts   Shared types between server and client
public/
  index.html
  styles.css
  app.js     Vanilla-JS client: screens, WebSocket, rendering
```
