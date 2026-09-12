import { Room } from "./room";

export { Room };

export interface Env {
  ROOMS: DurableObjectNamespace<Room>;
  ASSETS: Fetcher;
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O, 1/I

function generateCode(): string {
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

async function forwardToRoom(env: Env, code: string, path: string, init: RequestInit): Promise<Response> {
  const stub = env.ROOMS.getByName(code.toUpperCase());
  const url = `https://room/api/room/${code.toUpperCase()}${path}`;
  return stub.fetch(new Request(url, init));
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (request.method === "POST" && path === "/api/rooms") {
        const body = await request
          .json<{ hostName?: string }>()
          .catch(() => ({ hostName: "" }));
        const hostName = (body.hostName || "").trim();
        if (!hostName) return json({ error: "Name is required" }, 400);

        for (let attempt = 0; attempt < 5; attempt++) {
          const code = generateCode();
          const res = await forwardToRoom(env, code, "/create", {
            method: "POST",
            body: JSON.stringify({ code, hostName }),
            headers: { "content-type": "application/json" },
          });
          if (res.status !== 400) return res;
        }
        return json({ error: "Could not create room, try again" }, 500);
      }

      const joinMatch = path.match(/^\/api\/room\/([A-Za-z0-9]+)\/join$/);
      if (request.method === "POST" && joinMatch) {
        const code = joinMatch[1];
        const bodyText = await request.text();
        return forwardToRoom(env, code, "/join", {
          method: "POST",
          body: bodyText,
          headers: { "content-type": "application/json" },
        });
      }

      const socketMatch = path.match(/^\/api\/room\/([A-Za-z0-9]+)\/socket$/);
      if (socketMatch) {
        const code = socketMatch[1];
        const stub = env.ROOMS.getByName(code.toUpperCase());
        const forwardUrl = `https://room/api/room/${code.toUpperCase()}/socket${url.search}`;
        return stub.fetch(new Request(forwardUrl, request));
      }

      return env.ASSETS.fetch(request);
    } catch (err) {
      console.error("Worker fetch error", err);
      return json({ error: "Internal error" }, 500);
    }
  },
};
