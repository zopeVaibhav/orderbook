import type { TradeOut } from '@repo/types/kafka';
import { ServerMessageType } from '@repo/types/socket';
import SocketServer from '../../socket/socket.server';

export async function handleTrade(trade: TradeOut): Promise<void> {
    SocketServer.broadcast(trade.market_id, {
        type: ServerMessageType.TRADE,
        market_id: trade.market_id,
        trade_id: trade.trade_id,
        price: trade.price,
        quantity: trade.quantity,
        taker_side: trade.taker_side,
        ts: trade.ts,
        seq: trade.seq,
    });

    SocketServer.balanceStale(trade.maker_user_id, trade.taker_user_id);
}
