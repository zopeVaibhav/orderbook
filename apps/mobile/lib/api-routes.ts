import { ENV } from './env';

export const API_URL = `${ENV.apiUrl}/api/v1`;
export const WS_URL = ENV.apiUrl.replace(/^http/, 'ws');

export const SIGNIN_URL = '/auth/signin';
export const MARKETS_URL = '/markets';
export const MARKET_STATS_URL = '/markets/stats';
export const BOOK_URL = (marketId: string) => `/markets/${marketId}/book`;
export const TRADES_URL = (marketId: string) => `/markets/${marketId}/trades`;
export const BALANCE_URL = '/balance';
export const ORDERS_URL = '/orders';
export const FILLS_URL = '/fills';
