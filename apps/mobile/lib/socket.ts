import {
    ClientMessageType,
    type ClientSocketMessage,
    type ServerSocketMessage,
} from '@repo/types/socket';
import { setFeedStatus } from '@/store/feed';
import { WS_URL } from './api-routes';

type Listener = (event: ServerSocketMessage) => void;

const MIN_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 15_000;

class LiveSocket {
    #ws: WebSocket | null = null;
    #listeners = new Set<Listener>();
    #openListeners = new Set<() => void>();
    #market: string | null = null;
    #tickers = false;
    #token: string | null = null;
    #foreground = true;
    #online = true;
    #attempt = 0;
    #timer: ReturnType<typeof setTimeout> | null = null;

    subscribe(listener: Listener): () => void {
        this.#listeners.add(listener);
        return () => this.#listeners.delete(listener);
    }

    onOpen(listener: () => void): () => void {
        this.#openListeners.add(listener);
        return () => this.#openListeners.delete(listener);
    }

    setToken(token: string | null): void {
        if (token === this.#token) return;
        const hadAuth = this.#token !== null;
        this.#token = token;
        if (hadAuth) this.#restart();
        else if (token) this.#send({ type: ClientMessageType.AUTH, token });
        this.#reconcile();
    }

    setMarket(marketId: string | null): void {
        this.#market = marketId;
        if (marketId) this.#send({ type: ClientMessageType.SUBSCRIBE, market_id: marketId });
        this.#reconcile();
    }

    setTickers(enabled: boolean): void {
        this.#tickers = enabled;
        if (enabled) this.#send({ type: ClientMessageType.TICKERS });
        this.#reconcile();
    }

    setForeground(foreground: boolean): void {
        this.#foreground = foreground;
        if (foreground) this.#attempt = 0;
        this.#reconcile();
    }

    setOnline(online: boolean): void {
        this.#online = online;
        if (online) this.#attempt = 0;
        this.#reconcile();
    }

    #wanted(): boolean {
        return (
            this.#foreground &&
            this.#online &&
            (this.#market !== null || this.#tickers || this.#token !== null)
        );
    }

    #reconcile(): void {
        if (!this.#wanted()) {
            this.#clearTimer();
            this.#close();
            setFeedStatus('idle');
            return;
        }
        if (!this.#ws && !this.#timer) this.#open();
    }

    #restart(): void {
        this.#clearTimer();
        this.#close();
    }

    #open(): void {
        setFeedStatus(this.#attempt === 0 ? 'connecting' : 'reconnecting');
        const ws = new WebSocket(WS_URL);
        this.#ws = ws;

        ws.onopen = () => {
            this.#attempt = 0;
            if (this.#token) this.#send({ type: ClientMessageType.AUTH, token: this.#token });
            if (this.#market)
                this.#send({ type: ClientMessageType.SUBSCRIBE, market_id: this.#market });
            if (this.#tickers) this.#send({ type: ClientMessageType.TICKERS });
            setFeedStatus('live');
            for (const listener of this.#openListeners) listener();
        };

        ws.onmessage = (raw) => {
            if (typeof raw.data !== 'string') return;
            let event: ServerSocketMessage;
            try {
                event = JSON.parse(raw.data) as ServerSocketMessage;
            } catch {
                return;
            }
            for (const listener of this.#listeners) listener(event);
        };

        ws.onclose = () => {
            if (this.#ws !== ws) return;
            this.#ws = null;
            if (!this.#wanted()) {
                setFeedStatus('idle');
                return;
            }
            setFeedStatus('reconnecting');
            const delay = Math.min(MIN_BACKOFF_MS * 2 ** this.#attempt, MAX_BACKOFF_MS);
            this.#attempt += 1;
            this.#timer = setTimeout(() => {
                this.#timer = null;
                this.#reconcile();
            }, delay);
        };

        ws.onerror = () => ws.close();
    }

    #close(): void {
        const ws = this.#ws;
        if (!ws) return;
        this.#ws = null;
        ws.onopen = null;
        ws.onmessage = null;
        ws.onclose = null;
        ws.onerror = null;
        ws.close();
    }

    #clearTimer(): void {
        if (this.#timer !== null) clearTimeout(this.#timer);
        this.#timer = null;
    }

    #send(message: ClientSocketMessage): void {
        if (this.#ws?.readyState === WebSocket.OPEN) this.#ws.send(JSON.stringify(message));
    }
}

export const liveSocket = new LiveSocket();
