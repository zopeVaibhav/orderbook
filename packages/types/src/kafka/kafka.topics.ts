export const KafkaTopics = {
    ORDERS_IN: 'orders.in',
    ORDERS_ACK: 'orders.ack',
    TRADES_OUT: 'trades.out',
    BOOK_DELTA: 'book.delta',
    USER_EVENTS: 'user.events',
    MARKET_CONTROL: 'markets.control',
} as const;

export type KafkaTopic = (typeof KafkaTopics)[keyof typeof KafkaTopics];
