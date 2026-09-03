import type { TradeOut } from '@repo/types/kafka';
import SocketServer from '../../socket/socket.server';

export async function handleTrade(trade: TradeOut): Promise<void> {
    SocketServer.broadcast(trade.market_id, { type: 'trade', ...trade });
}
