import { EngineEventType } from '../kafka/kafka.enums';

export const ClientMessageType = {
    SUBSCRIBE: 'subscribe',
    AUTH: 'auth',
} as const;
export type ClientMessageType = (typeof ClientMessageType)[keyof typeof ClientMessageType];

export const ServerMessageType = {
    ...EngineEventType,
    BALANCE_STALE: 'balance_stale',
} as const;
export type ServerMessageType = (typeof ServerMessageType)[keyof typeof ServerMessageType];
