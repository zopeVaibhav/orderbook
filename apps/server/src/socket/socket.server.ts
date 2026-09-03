import type { Server } from 'node:http';
import { WebSocket, WebSocketServer } from 'ws';
import chalk from 'chalk';
import type { ClientSocketMessage, ServerSocketMessage } from '@repo/types/socket';

export default class SocketServer {
    static #wss: WebSocketServer | null = null;
    static #byMarket = new Map<string, Set<WebSocket>>();
    static #marketOf = new Map<WebSocket, string>();

    static start(server: Server) {
        const wss = new WebSocketServer({ server });
        this.#wss = wss;

        wss.on('connection', (ws) => {
            ws.on('message', (raw) => {
                let msg: ClientSocketMessage;
                try {
                    msg = JSON.parse(raw.toString());
                } catch {
                    return;
                }

                if (msg.type === 'subscribe') {
                    this.#subscribe(ws, msg.market_id);
                }
            });

            ws.on('close', () => {
                this.#unsubscribe(ws);
            });
        });

        console.log(chalk.green('socket server started'));
    }

    static #subscribe(ws: WebSocket, marketId: string) {
        this.#unsubscribe(ws);
        let sockets = this.#byMarket.get(marketId);
        if (!sockets) {
            sockets = new Set();
            this.#byMarket.set(marketId, sockets);
        }
        sockets.add(ws);
        this.#marketOf.set(ws, marketId);
    }

    static #unsubscribe(ws: WebSocket) {
        const marketId = this.#marketOf.get(ws);
        if (!marketId) return;
        const sockets = this.#byMarket.get(marketId);
        sockets?.delete(ws);
        if (sockets && sockets.size === 0) this.#byMarket.delete(marketId);
        this.#marketOf.delete(ws);
    }

    static broadcast(marketId: string, payload: ServerSocketMessage) {
        const sockets = this.#byMarket.get(marketId);
        if (!sockets) return;
        const data = JSON.stringify(payload);
        for (const ws of sockets) {
            if (ws.readyState === WebSocket.OPEN) ws.send(data);
        }
    }

    static stop() {
        if (!this.#wss) return;
        this.#wss.close();
        this.#wss = null;
        this.#byMarket.clear();
        this.#marketOf.clear();
    }
}
