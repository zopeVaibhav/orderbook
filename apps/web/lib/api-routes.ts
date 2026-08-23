const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

export const API_URL = BACKEND_URL + '/api/v1';

const AUTH_URL = API_URL + '/auth';
export const SIGNIN_URL = AUTH_URL + '/signin';

export const MARKETS_URL = API_URL + '/markets';
