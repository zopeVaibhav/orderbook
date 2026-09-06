import {
    ClientMessageType,
    type ClientSocketMessage,
    type ServerSocketMessage,
} from '@repo/types/socket';
import { WS_URL } from '@/lib/api-routes';

type Listener = (event: ServerSocketMessage) => void;

const RECONNECT_MS = 1000;

export class SocketClient {
    #ws: WebSocket | null = null;
    #listener: Listener | null = null;
    #marketId: string | null = null;
    #token: string | null = null;
    #reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    #wanted = false;

    connect(marketId: string, listener: Listener, token?: string | null): void {
        this.#marketId = marketId;
        this.#listener = listener;
        this.#token = token ?? null;
        this.#wanted = true;
        this.#open();
    }

    disconnect(): void {
        this.#wanted = false;
        this.#listener = null;
        this.#marketId = null;
        this.#token = null;

        if (this.#reconnectTimer !== null) {
            clearTimeout(this.#reconnectTimer);
            this.#reconnectTimer = null;
        }

        this.#detach();
    }

    #open(): void {
        this.#detach();

        const ws = new WebSocket(WS_URL);
        this.#ws = ws;

        ws.onopen = () => {
            if (this.#token) this.#send({ type: ClientMessageType.AUTH, token: this.#token });
            if (this.#marketId)
                this.#send({ type: ClientMessageType.SUBSCRIBE, market_id: this.#marketId });
        };

        ws.onmessage = (raw) => {
            const event: ServerSocketMessage = JSON.parse(raw.data);
            this.#listener?.(event);
        };

        ws.onclose = () => {
            if (!this.#wanted || this.#ws !== ws) return;
            this.#reconnectTimer = setTimeout(() => this.#open(), RECONNECT_MS);
        };
    }

    #detach(): void {
        const ws = this.#ws;
        if (!ws) return;

        ws.onopen = null;
        ws.onmessage = null;
        ws.onclose = null;
        ws.close();
        this.#ws = null;
    }

    #send(message: ClientSocketMessage): void {
        this.#ws?.send(JSON.stringify(message));
    }
}
