import type { EngineEvent } from '../kafka/engine-events';

export interface BookSnapshotPayload {
    market_id: string;
    asks: [string, string][];
    bids: [string, string][];
    seq: number;
}

export type ClientSocketMessage = {
    type: 'subscribe';
    market_id: string;
};

export type ServerSocketMessage = EngineEvent;
