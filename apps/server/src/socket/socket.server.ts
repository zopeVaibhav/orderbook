import type { Server } from 'node:http';
import { WebSocket, WebSocketServer } from 'ws';
import chalk from 'chalk';
import {
    ClientMessageType,
    ServerMessageType,
    type ClientSocketMessage,
    type ServerSocketMessage,
} from '@repo/types/socket';
import JWT from '../services/service.jwt';

const MARKET = 'market:';
const USER = 'user:';

export default class SocketServer {
    static #wss: WebSocketServer | null = null;
    static #rooms = new Map<string, Set<WebSocket>>();
    static #roomsOf = new Map<WebSocket, Set<string>>();

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

                if (msg.type === ClientMessageType.SUBSCRIBE) {
                    this.#joinOnly(ws, MARKET, MARKET + msg.market_id);
                    return;
                }

                if (msg.type === ClientMessageType.AUTH) {
                    this.#authenticate(ws, msg.token);
                }
            });

            ws.on('close', () => this.#leaveAll(ws));
        });

        console.log(chalk.green('socket server started'));
    }

    static #authenticate(ws: WebSocket, token: string) {
        let userId: string;
        try {
            userId = JWT.verifySessionJwt(token).id;
        } catch {
            return;
        }

        this.#joinOnly(ws, USER, USER + userId);
    }

    static #join(ws: WebSocket, room: string) {
        let sockets = this.#rooms.get(room);
        if (!sockets) {
            sockets = new Set();
            this.#rooms.set(room, sockets);
        }
        sockets.add(ws);

        let rooms = this.#roomsOf.get(ws);
        if (!rooms) {
            rooms = new Set();
            this.#roomsOf.set(ws, rooms);
        }
        rooms.add(room);
    }

    static #leave(ws: WebSocket, room: string) {
        const sockets = this.#rooms.get(room);
        sockets?.delete(ws);
        if (sockets?.size === 0) this.#rooms.delete(room);

        const rooms = this.#roomsOf.get(ws);
        rooms?.delete(room);
        if (rooms?.size === 0) this.#roomsOf.delete(ws);
    }

    static #joinOnly(ws: WebSocket, prefix: string, room: string) {
        for (const joined of [...(this.#roomsOf.get(ws) ?? [])]) {
            if (joined !== room && joined.startsWith(prefix)) this.#leave(ws, joined);
        }
        this.#join(ws, room);
    }

    static #leaveAll(ws: WebSocket) {
        for (const joined of [...(this.#roomsOf.get(ws) ?? [])]) this.#leave(ws, joined);
        this.#roomsOf.delete(ws);
    }

    static #send(room: string, payload: ServerSocketMessage) {
        const sockets = this.#rooms.get(room);
        if (!sockets) return;
        const data = JSON.stringify(payload);
        for (const ws of sockets) {
            if (ws.readyState === WebSocket.OPEN) ws.send(data);
        }
    }

    static broadcast(marketId: string, payload: ServerSocketMessage) {
        this.#send(MARKET + marketId, payload);
    }

    static sendToUser(userId: string, payload: ServerSocketMessage) {
        this.#send(USER + userId, payload);
    }

    static balanceStale(...userIds: string[]) {
        for (const userId of new Set(userIds)) {
            this.sendToUser(userId, { type: ServerMessageType.BALANCE_STALE });
        }
    }

    static stop() {
        if (!this.#wss) return;
        this.#wss.close();
        this.#wss = null;
        this.#rooms.clear();
        this.#roomsOf.clear();
    }
}
