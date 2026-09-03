import type { ClientSocketMessage, ServerSocketMessage } from '@repo/types/socket';
import { WS_URL } from '@/lib/api-routes';

type Listener = (event: ServerSocketMessage) => void;

const RECONNECT_MS = 1000;

export class SocketClient {
    #ws: WebSocket | null = null;
    #listener: Listener | null = null;
    #marketId: string | null = null;
    #reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    #wanted = false;

    connect(marketId: string, listener: Listener): void {
        this.#marketId = marketId;
        this.#listener = listener;
        this.#wanted = true;
        this.#open();
    }

    disconnect(): void {
        this.#wanted = false;
        this.#listener = null;
        this.#marketId = null;

        if (this.#reconnectTimer !== null) {
            clearTimeout(this.#reconnectTimer);
            this.#reconnectTimer = null;
        }

        this.#ws?.close();
        this.#ws = null;
    }

    #open(): void {
        const ws = new WebSocket(WS_URL);
        this.#ws = ws;

        ws.onopen = () => {
            if (this.#marketId) this.#send({ type: 'subscribe', market_id: this.#marketId });
        };

        ws.onmessage = (raw) => {
            const event: ServerSocketMessage = JSON.parse(raw.data);
            this.#listener?.(event);
        };

        ws.onclose = () => {
            if (!this.#wanted) return;
            this.#reconnectTimer = setTimeout(() => this.#open(), RECONNECT_MS);
        };
    }

    #send(message: ClientSocketMessage): void {
        this.#ws?.send(JSON.stringify(message));
    }
}
