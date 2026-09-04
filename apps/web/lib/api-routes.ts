const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

export const API_URL = BACKEND_URL + '/api/v1';
export const WS_URL = BACKEND_URL?.replace(/^http/, 'ws') ?? '';

const AUTH_URL = API_URL + '/auth';
export const SIGNIN_URL = AUTH_URL + '/signin';

export const MARKETS_URL = API_URL + '/markets';
export const BOOK_URL = (marketId: string) => `${MARKETS_URL}/${marketId}/book`;
export const TRADES_URL = (marketId: string) => `${MARKETS_URL}/${marketId}/trades`;
export const BALANCE_URL = API_URL + '/balance';

export const ORDERS_URL = API_URL + '/orders';
