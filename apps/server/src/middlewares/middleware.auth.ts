import { Request, Response, NextFunction } from 'express';
import { ResponseWriter } from '../services/service.response';
import JWT from '../services/service.jwt';

const BEARER_PREFIX = 'Bearer ';

export default class AuthMiddleware {
    static process(req: Request, res: Response, next: NextFunction) {
        const header = req.headers.authorization;

        if (!header?.startsWith(BEARER_PREFIX)) {
            return ResponseWriter.unauthorized(res);
        }

        const token = header.slice(BEARER_PREFIX.length).trim();

        if (!token) {
            return ResponseWriter.unauthorized(res);
        }

        try {
            req.user = JWT.verifySessionJwt(token);
        } catch {
            return ResponseWriter.unauthorized(res, 'invalid token');
        }

        next();
    }
}
