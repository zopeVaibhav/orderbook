# orderbook

A CLOB (central limit order book) exchange. The matching engine is Rust, everything around it is TypeScript, and the two only ever talk over Kafka — there is no HTTP call, shared database handle, or RPC between them.

## How it fits together

```
                  ┌──────────┐
   browser ─────▶ │   web    │  Next.js — chart, book, trade panel
                  └────┬─────┘
                       │ REST (/api/v1)
                  ┌────▼─────┐
                  │  server  │  Express — auth, validation, market registry
                  └────┬─────┘
                       │ produce
        ┌──────────────┼───────────────────────────┐
        │ orders.in    │ markets.control           │
        ▼              ▼                           │
   ┌─────────────────────────┐                     │
   │        engine           │  Rust — matching    │
   │  in-memory books        │                     │
   └────┬──────────┬─────────┘                     │
        │          │                               │
   orders.ack   trades.out  book.delta ────────────┘
        │          │
        │          ▼
        │   ┌────────────┐
        │   │ settlement │  applies fills to the ledger
        │   └─────┬──────┘
        │         ▼
        │    ┌──────────┐
        └───▶│ postgres │
             └──────────┘
```

The engine is the only writer of order state and holds every book in memory. It never reads Postgres — markets reach it over the compacted `markets.control` topic, orders over `orders.in`. Everything it decides comes back out as events, and the TypeScript side is responsible for turning those into rows.

### Topics

| Topic             | Producer | Consumer      | Carries                                    |
| ----------------- | -------- | ------------- | ------------------------------------------ |
| `orders.in`       | server   | engine        | new order / cancel order commands          |
| `orders.ack`      | engine   | server¹       | per-order outcome (`RESTED`, `FILLED`, …)  |
| `trades.out`      | engine   | settlement    | executed fills                             |
| `book.delta`      | engine   | server → web¹ | level changes, delta-only                  |
| `markets.control` | server   | engine        | market registrations (compacted, replayed) |

¹ Not wired yet — see [Status](#status).

`markets.control` is compacted rather than time-retained on purpose: the engine drains it to the high watermark at boot, so the full registry is always recoverable from the topic alone.

## Repo layout

```
apps/
  engine/       Rust matching engine — books, order kinds, snapshots
  server/       Express API, Kafka producers/consumers, market sync script
  settlement/   Kafka consumer that turns trades.out into ledger entries
  web/          Next.js frontend
packages/
  database/     Prisma schema, client, migrations, seed
  types/        Shared TypeScript contracts (two entrypoints, see below)
infra/
  docker-compose.yml   Postgres + Redpanda + topic bootstrap + console
```

### Engine internals

- `engine/` — the book itself. `orders/` has one file per order kind (`limit`, `market`, `ioc`, `fok`, `postonly`, `cancel`); `registry.rs` holds the per-market state.
- `protocol/` — the wire types. `incoming.rs` and `outgoing.rs` are the serde definitions the TypeScript side mirrors.
- `persistence/snapshot.rs` — bincode snapshots every 10,000 offsets, written per market alongside the partition and last applied offset. On boot the engine restores each market and resumes its consumer at exactly that offset, so a restart replays nothing it already applied.
- `runtime/run.rs` — the four boot phases: restore snapshots, drain `markets.control`, assign `orders.in`, then the steady-state select loop.

## Conventions worth knowing before you write code

**Money is never a JS number.** Prices and quantities are decimal strings end to end. The engine holds them as scaled integers using each market's `tick_exp` / `lot_exp` and renders them back to strings. Parse to a float only at the moment you render.

**One enum vocabulary.** The engine serializes `Side` and `AckStatus` as `SCREAMING_SNAKE_CASE` so they match the Prisma enums verbatim — `BID`/`ASK`, `FILLED`/`PARTIAL`/`RESTED`/`CANCELLED`/`REJECTED`. No mapping table anywhere between the engine and the database.

**`@repo/types` has two entrypoints, and the split is load-bearing.**

- `@repo/types` — client-facing domain enums (`Side`, `OrderKind`, `TimeInForce`, `OrderStatus`, `MarketStatus`). Declared as const objects so `z.enum(Side)` and `Side.BID` both work. Redeclared rather than re-exported from `@repo/database`, which would drag the Node-only Prisma client into the browser bundle.
- `@repo/types/kafka` — the wire contracts, `snake_case`, mirroring the engine's serde output. Deliberately kept out of the root barrel so the frontend cannot import a raw wire shape by accident.

**Kind and time-in-force are one field to the engine, two to the API.** The API takes `kind: LIMIT|MARKET` plus `timeInForce: GTC|IOC|FOK|POST_ONLY`; the engine takes a single flat `order_kind` (`LimitGtc`, `Ioc`, `Fok`, `PostOnly`, `Market`). The mapping lives in the place-order controller and nowhere else.

**The book is delta-only on the wire.** `book.delta` sends level changes with `new_quantity`, where `"0"` deletes the level. A client needs a snapshot to apply deltas against.

## Running it locally

Five services, two terminals. Postgres and Redpanda live in Docker; the engine runs in its own terminal because turbo's TUI repaints over anything else sharing a window with it; web, server and settlement run together under turbo.

### Prerequisites

| Need                       | Why                                                         |
| -------------------------- | ----------------------------------------------------------- |
| [Bun](https://bun.sh) 1.3+ | Package manager and runtime. The repo pins `bun@1.3.14`.    |
| Docker                     | Postgres and Redpanda. Docker Desktop is fine.              |
| Rust 1.85+                 | The engine is edition 2024.                                 |
| A C toolchain + CMake      | `rdkafka` compiles `librdkafka` from source on first build. |

Platform notes for the C toolchain: macOS needs `xcode-select --install` and `brew install cmake`; Debian/Ubuntu needs `build-essential cmake pkg-config libssl-dev`; Windows needs the **Visual Studio Build Tools** with the C++ workload plus CMake, and Rust installed with the `x86_64-pc-windows-msvc` toolchain.

Every command below is written for a POSIX shell. On Windows use **Git Bash** or **WSL** and they work verbatim. In PowerShell the only ones that differ are noted inline.

### 1. Install dependencies

```bash
bun install
```

### 2. Create your `.env`

```bash
cp .env.example .env
```

PowerShell: `Copy-Item .env.example .env`

Fill it in. Every one of these is required — the services validate their environment with Zod at boot and exit immediately if something is missing:

| Variable                                            | Notes                                                                                               |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`           | 32 chars minimum each. `openssl rand -base64 48` generates one.                                     |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Read by the compose file. `DATABASE_URL` must agree with all three.                                 |
| `DATABASE_URL`                                      | `postgresql://<user>:<password>@localhost:5432/<db>`                                                |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`          | Sign-in is Google OAuth only. Authorized redirect: `http://localhost:3000/api/auth/callback/google` |
| `NEXTAUTH_SECRET`, `NEXTAUTH_URL`                   | `NEXTAUTH_URL` is `http://localhost:3000`                                                           |
| `NEXT_PUBLIC_API_URL`                               | `http://localhost:8080`                                                                             |
| `KAFKA_BROKER`, `KAFKA_GROUP_ID`                    | `localhost:9092` and any group name                                                                 |

On PowerShell, generate a secret with:

```powershell
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Max 256 }))
```

**The engine does not read this file.** It reads its own `apps/engine/.env`, which is gitignored, so a fresh clone needs it created too:

```bash
cp apps/engine/.env.example apps/engine/.env
```

PowerShell: `Copy-Item apps/engine/.env.example apps/engine/.env`

The defaults in it work as-is against the Docker Redpanda — `KAFKA_BROKER=localhost:9092`, `KAFKA_GROUP_ID=engine`, `KAFKA_MARKET_CONTROL_GROUP_ID=engine_control`. Two separate group ids because the engine consumes orders and market control on independent consumers.

### 3. Start Postgres and Redpanda

```bash
docker compose -f infra/docker-compose.yml up -d
```

Postgres lands on 5432, Redpanda on 9092, and the Redpanda console on **8090** — not 8080, which is the API server. A one-shot `topic-init` container creates `orders.in`, `orders.ack`, `trades.out`, `book.delta` and a compacted `markets.control`, then exits; seeing it in `Exited (0)` is correct.

Confirm before moving on:

```bash
docker compose -f infra/docker-compose.yml ps
```

`orderbook-postgres` should say `healthy`. If it says `starting`, wait — the next step fails against a database that is not accepting connections yet.

### 4. Build the database and register the markets

```bash
bun run setup
```

One command for four things: generates the Prisma client, applies the migrations, seeds 21 assets and 20 markets, then publishes those markets to `markets.control` so the engine knows about them.

It should end with `synced 20 markets`. A `KafkaJS v2.0.0 switched default partitioner` warning along the way is noise.

Safe to re-run — the seed upserts and `markets.control` is compacted. You need it again only when markets change or after wiping the database. Note it runs `migrate:deploy`, which applies existing migrations without prompting; to author a _new_ migration use `bun run --filter @repo/database migrate`.

Skipping the market sync is the single most common way to get a broken setup: the engine boots with an empty registry and rejects every order.

### 5. Start the engine — terminal 1

```bash
cd apps/engine
```

```bash
cargo run
```

**Run it from `apps/engine`, not the repo root.** Snapshots are written to `./snapshots` relative to the working directory, so starting it anywhere else silently ignores existing state and replays `orders.in` from the beginning.

The first build compiles `librdkafka` and takes a few minutes. A healthy boot ends like this:

```
Draining markets.control
Registered market 0ae17220-... tick_exp=1 lot_exp=8 min_quantity=100
...
Registry holds 20 markets
Listening on orders.in and markets.control
```

`Registry holds 0 markets` means step 4 did not happen.

### 6. Start web, server and settlement — terminal 2

```bash
bun run dev
```

Turborepo runs all three: web on 3000, the API server on 8080, settlement with no port of its own. Keep this separate from the engine — turbo takes over the terminal in TUI mode and paints over anything else printed there.

### Checking it actually works

```bash
curl http://localhost:8080/health
```

`{"status":"ok"}` means the API server is up.

```bash
curl http://localhost:8080/api/v1/markets
```

Should return the 20 seeded markets.

To confirm the engine is alive rather than just started, watch it consume. In a third terminal:

```bash
docker exec redpanda rpk topic consume orders.ack
```

Place an order from the web app; an ack appears here within a moment. Nothing arriving means the engine is not consuming, whatever its terminal last said.

### Stopping

Ctrl-C each terminal, then:

```bash
docker compose -f infra/docker-compose.yml down
```

Add `-v` to that to also drop the Postgres volume, which throws away every row and means re-running step 4.

## Everyday commands

| Command                                         | What it does                          |
| ----------------------------------------------- | ------------------------------------- |
| `bun run dev`                                   | web + server + settlement             |
| `bun run check-types`                           | `tsc --noEmit` across every workspace |
| `bun run lint`                                  | eslint across every workspace         |
| `bun run format`                                | prettier over the repo                |
| `cd apps/engine && cargo run`                   | the matching engine                   |
| `cd apps/engine && cargo clippy -- -D warnings` | what the pre-push hook enforces       |
| `bun run --filter @repo/database studio`        | Prisma Studio                         |
| `bun run --filter @repo/database migrate:reset` | drop and rebuild the database         |

Husky runs `prettier --write` on staged files at commit time. Pre-push is heavier: lint, type check, full build, `cargo fmt --check`, and `cargo clippy -- -D warnings`. Clippy runs with warnings denied, so something as small as a `collapsible_if` fails the push rather than warning.

## When something looks broken

**Every order comes back rejected.** The engine does not know the market. Re-run `bun run setup` and check the engine's boot log for `Registry holds 20 markets`.

**A service exits immediately with an env complaint.** The Zod env schemas fail loudly and call `process.exit(1)`. The message names the field. Note that `server` requires `KAFKA_GROUP_ID`, which is easy to miss.

**The engine replays orders you thought were settled.** It resumed from an older snapshot, or from none at all. Check you launched it from `apps/engine`; delete `apps/engine/snapshots/` if you want a deliberate clean rebuild from the start of `orders.in`.

**The engine fails to build on a fresh machine.** Almost always the C toolchain — `librdkafka` needs a compiler and CMake, listed under Prerequisites. On Windows this means the Visual Studio Build Tools, not just Rust.

**The terminal only shows turbo and you cannot tell if the engine is alive.** They are meant to be separate terminals — turbo's TUI paints over anything sharing its window. Check the process directly with `pgrep -fl "target/debug/engine"` (`tasklist | findstr engine` on Windows), or watch `orders.ack` as above.

**You want to see what is actually on a topic.** The Redpanda console at http://localhost:8090 shows every message, which is usually faster than adding a log line.

## Status

Working end to end: Google sign-in, market listing, balances, order placement (`POST /api/v1/orders`), matching across all five order kinds, trade settlement into the ledger.

Not yet wired: the server's `orders.ack` / `book.delta` consumers and the socket layer are stubs, so the frontend still runs off `apps/web/lib/market/mockFeed.ts` rather than live engine output. Placed orders are not yet persisted as `Order` rows — the ack comes back over Kafka with nowhere to land.
