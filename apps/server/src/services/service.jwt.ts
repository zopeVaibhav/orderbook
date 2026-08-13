import jwt from 'jsonwebtoken';
import type { AuthUser } from '../types/express';
import { ENV } from '../configs/env';

export default class JWT {
    static signSessionJwt(claims: AuthUser): string {
        return jwt.sign(claims, ENV.JWT_ACCESS_SECRET, {
            algorithm: 'HS256',
            expiresIn: ENV.ACCESS_TOKEN_TTL_SEC,
        });
    }

    static verifySessionJwt(token: string): AuthUser {
        const payload = jwt.verify(token, ENV.JWT_ACCESS_SECRET, {
            algorithms: ['HS256'],
        });

        if (typeof payload !== 'object' || payload === null) {
            throw new Error('invalid token payload');
        }

        const { id } = payload;
        if (typeof id !== 'string' || id.length === 0) {
            throw new Error('invalid token payload');
        }

        return { id };
    }
}
