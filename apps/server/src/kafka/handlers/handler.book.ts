import type { BookDelta } from '@repo/types/kafka';
import { ServerMessageType } from '@repo/types/socket';
import { applyDelta } from '../../services/service.book';
import SocketServer from '../../socket/socket.server';

export async function handleBookDelta(delta: BookDelta): Promise<void> {
    applyDelta(delta);
    SocketServer.broadcast(delta.market_id, { type: ServerMessageType.BOOK_DELTA, ...delta });
}
