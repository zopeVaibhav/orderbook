import type { BookDelta } from '@repo/types/kafka';
import type { BookSnapshotPayload } from '@repo/types/socket';

type Book = {
    bids: Map<string, string>;
    asks: Map<string, string>;
    lastSeq: number;
};

const books = new Map<string, Book>();

function bookFor(marketId: string): Book {
    let book = books.get(marketId);

    if (!book) {
        book = { bids: new Map(), asks: new Map(), lastSeq: 0 };
        books.set(marketId, book);
    }

    return book;
}

export function applyDelta(delta: BookDelta): void {
    const book = bookFor(delta.market_id);
    if (delta.seq <= book.lastSeq) return;

    for (const change of delta.changes) {
        const side = change.side === 'ASK' ? book.asks : book.bids;

        if (parseFloat(change.new_quantity) === 0) side.delete(change.price);
        else side.set(change.price, change.new_quantity);
    }

    book.lastSeq = delta.seq;
}

export function snapshotOf(marketId: string): BookSnapshotPayload | null {
    const book = books.get(marketId);
    if (!book) return null;

    return {
        market_id: marketId,
        bids: [...book.bids].sort((a, b) => parseFloat(b[0]) - parseFloat(a[0])),
        asks: [...book.asks].sort((a, b) => parseFloat(a[0]) - parseFloat(b[0])),
        seq: book.lastSeq,
    };
}

export function resetBooks(): void {
    books.clear();
}
