import type { BookDelta } from '@repo/types/kafka';
import { applyDelta } from '../../services/service.book';

export async function handleBookDelta(delta: BookDelta): Promise<void> {
    applyDelta(delta);
}
