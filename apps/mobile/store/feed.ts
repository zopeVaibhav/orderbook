import { create } from 'zustand';

export type FeedStatus = 'idle' | 'connecting' | 'live' | 'reconnecting';

export const useFeedStatus = create<{ status: FeedStatus }>(() => ({ status: 'idle' }));

export function setFeedStatus(status: FeedStatus): void {
    if (useFeedStatus.getState().status !== status) useFeedStatus.setState({ status });
}
