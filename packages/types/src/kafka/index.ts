/**
 * Kafka wire contracts — snake_case, mirroring the Rust engine's serde output.
 *
 * Reachable as `@repo/types/kafka`, deliberately kept out of the root barrel so
 * the web app cannot import a wire shape by accident. Anything the browser sees
 * is normalized to camelCase by the server first.
 */

export * from './engine-events';
export * from './kafka.topics';
export * from './kafka.messages';
export * from './kafka.market-controls';
