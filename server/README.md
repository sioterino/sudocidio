# Sudocidio Realtime Server

This package contains the realtime backend for Sudocidio. Its entry point is:

```text
server/server.ts
```

It is separate from the root `server.ts`. The root `server.ts` serves the Next.js app on port `3000`; this server handles Socket.IO matchmaking, room events, and Web Push on port `3001`.

## What It Does

`server/server.ts` creates an HTTP server and attaches a Socket.IO server with permissive CORS for local development.

Main responsibilities:

- Accept browser Socket.IO connections.
- Store Web Push subscriptions by socket id.
- Keep a simple in-memory matchmaking queue.
- Pair two players into a room.
- Generate a shared seed for both players.
- Emit `GAME_START` with `{ roomId, seed }`.
- Relay opponent progress.
- Relay sabotages.
- Finish rooms after correct accusation, surrender, or disconnect.
- Send a Web Push notification when an opponent is found.
- Clean up rooms/subscriptions on disconnect.

All state is in memory. Restarting this process clears rooms, queue state, and saved push subscriptions.

## Socket Events

Client to server:

- `PUSH_SUBSCRIBE`
- `JOIN_ROOM`
- `PIECE_PLACED`
- `SEND_SABOTAGE`
- `MAKE_ACCUSATION`
- `SURRENDER`

Server to client:

- `ROOM_JOINED`
- `GAME_START`
- `OPPONENT_PROGRESS`
- `RECEIVE_SABOTAGE`
- `GAME_OVER`

## Important Dependencies

Runtime dependencies from `server/package.json`:

- `socket.io`: realtime multiplayer transport.
- `web-push`: sends push notifications with VAPID credentials.
- `dotenv`: loads `server/.env` through `import "dotenv/config"`.
- `cors`: installed for CORS support.
- `express`: installed, but not currently used by `server/server.ts`.
- `socket.io-client`: installed, but not currently used by `server/server.ts`.

Development dependencies:

- `tsx`: recommended way to run the TypeScript entry point during development.
- `typescript`: TypeScript support.
- `ts-node`, `ts-node-dev`: alternative TypeScript runners.
- `@types/*`: type definitions.

## Prerequisites

- Node.js 18 or newer.
- npm.
- VAPID keys for Web Push if push notifications should work.

## Environment Setup

The example env file is currently named:

```text
server/.example.env
```

Create the real env file:

```bash
cd server
cp .example.env .env
```

PowerShell:

```powershell
cd server
Copy-Item .example.env .env
```

Current example contents:

```env
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_MAILTO=mailto:example@example.com

NEXT_PUBLIC_WS_URL=http://localhost:3001
```

Variables used by `server/server.ts`:

```env
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_MAILTO=mailto:you@example.com
```

Optional runtime variable:

```env
PORT=3001
```

`PORT` is read by the server, although it is not listed in `.example.env`.

Note about `NEXT_PUBLIC_WS_URL`: it exists in `server/.example.env`, but the current server code does not read it. The browser client reads `NEXT_PUBLIC_WS_URL` from the root Next app environment instead.

## VAPID Keys

Generate a VAPID key pair with:

```bash
npx web-push generate-vapid-keys
```

Use the generated public/private pair like this:

`server/.env`:

```env
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_MAILTO=mailto:you@example.com
```

Root `.env.local`:

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

The public key must match the private key. The private key should only live in `server/.env`.

## Install

From the `server/` directory:

```bash
npm install
```

## Run

There is no `dev` or `start` script in `server/package.json` right now. Run the TypeScript entry point directly:

```bash
npx tsx server.ts
```

For watch mode:

```bash
npx tsx watch server.ts
```

Default server URL:

```text
http://localhost:3001
```

To use another port:

```bash
PORT=4001 npx tsx server.ts
```

PowerShell:

```powershell
$env:PORT = "4001"
npx tsx server.ts
```

## How It Connects to the App

The root Next app connects from:

```text
src/contexts/WebSocketContext.tsx
```

The client URL is:

```ts
process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3001"
```

For local development, start both processes:

Terminal 1, repo root:

```bash
npm run dev
```

Terminal 2, `server/`:

```bash
npx tsx server.ts
```

Then open:

```text
http://localhost:3000/game
```

When two browser clients join, this service creates a room, emits the same seed to both players, and relays all multiplayer events for that room.
