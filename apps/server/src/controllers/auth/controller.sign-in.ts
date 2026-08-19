import { Request, Response } from 'express';
import { ResponseWriter } from '../../services/service.response';
import { prisma, LedgerReason, RefType } from '@repo/database';
import z from 'zod';
import { randomUUID } from 'node:crypto';
import JWT from '../../services/service.jwt';
import GoogleAuthService, { GoogleIdentity } from '../../services/service.google';
import { ENV } from '../../configs/env';

const signInSchema = z.object({
    idToken: z.string().min(1),
});

const SIGNUP_BONUS_AMOUNT = '5000';
const SIGNUP_BONUS_ASSET = 'USDC';

export default class SignInController {
    static async process(req: Request, res: Response) {
        try {
            const parsed = signInSchema.safeParse(req.body);
            if (!parsed.success) return ResponseWriter.invalidData(res);

            let identity: GoogleIdentity;
            try {
                identity = await GoogleAuthService.verifyIdToken(parsed.data.idToken);
            } catch (error) {
                console.error('[signIn] google token verification failed', error);
                return ResponseWriter.unauthorized(res, 'invalid google token');
            }

            const user = await prisma.user.upsert({
                where: { email: identity.email },
                create: {
                    email: identity.email,
                    name: identity.name,
                    image: identity.image,
                    ledgerEntries: {
                        create: {
                            refId: randomUUID(),
                            refType: RefType.DEPOSIT,
                            ledgerReason: LedgerReason.DEPOSIT,
                            amount: SIGNUP_BONUS_AMOUNT,
                            assetRef: { connect: { symbol: SIGNUP_BONUS_ASSET } },
                        },
                    },
                },
                update: {
                    name: identity.name,
                    image: identity.image,
                },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    image: true,
                },
            });

            return ResponseWriter.success(
                res,
                {
                    ...user,
                    accessToken: JWT.signSessionJwt({ id: user.id }),
                    expiresIn: ENV.ACCESS_TOKEN_TTL_SEC,
                },
                'Sign in Successfull',
            );
        } catch (error) {
            ResponseWriter.systemError(res, error);
        }
    }
}
