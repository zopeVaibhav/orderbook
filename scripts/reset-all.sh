#!/usr/bin/env bash
# Full dev-environment reset: DB, engine snapshots, redpanda topics + consumer
# groups. Order matters — topics are wiped and markets re-synced last, or
# sync-markets writes into a topic that then gets deleted out from under it.
#
# Requires: postgres + redpanda containers up (infra/docker-compose.yml).
# Stop `bun run dev` and the engine (cargo run) before running this — a live
# consumer racing the topic delete/recreate can end up in a weird state.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

read -r -p "Stopped server/bots/settlement/web/engine? This drops all data. Continue? [y/N] " ok
[[ "$ok" == "y" || "$ok" == "Y" ]] || { echo "aborted"; exit 1; }

TOPICS=(orders.in orders.ack trades.out book.delta markets.control)

echo "==> 1/5 wiping redpanda topics + consumer groups"
docker exec redpanda rpk topic delete "${TOPICS[@]}" || true

# Delete isn't synchronous — recreating immediately can race it (worse: a
# live consumer still polling a topic can make redpanda auto-recreate it out
# from under the delete). Poll until every topic is actually gone.
for _ in $(seq 1 15); do
    still_there=0
    for t in "${TOPICS[@]}"; do
        docker exec redpanda rpk topic describe "$t" >/dev/null 2>&1 && still_there=1
    done
    [[ "$still_there" == "0" ]] && break
    sleep 1
done

docker exec redpanda rpk topic create orders.in orders.ack trades.out book.delta -p 1 || true
docker exec redpanda rpk topic create markets.control -p 1 -c cleanup.policy=compact || true
docker exec redpanda rpk group delete server settlement-group engine engine_control || true
docker exec redpanda rpk topic list

echo "==> 2/5 resetting database (drop, migrate, seed)"
(cd packages/database && bunx prisma migrate reset --force)
bun run --filter @repo/database seed

echo "==> 3/5 clearing engine snapshots (stale market ids from before the reset)"
rm -f apps/engine/snapshots/*.bin

echo "==> 4/5 syncing fresh market ids to the engine"
bun run --filter server sync-markets

echo "==> 5/5 recreating the bot accounts"
bun run --filter marketmaker seed-bots

echo
echo "done. restart: bun run dev (+ the engine), then sign out/in in the browser"
echo "(your old session's JWT points at a user id that no longer exists)."
echo
echo "markets come back with makerEnabled=false, so no bot quotes until you"
echo "toggle one on from the searchbar."
