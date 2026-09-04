import { Request, Response } from 'express';
import { ResponseWriter } from '../../services/service.response';
import { prisma, LedgerReason, Prisma, RefType, writeLedger } from '@repo/database';
import z from 'zod';
import JWT from '../../services/service.jwt';
import GoogleAuthService, { GoogleIdentity } from '../../services/service.google';
import { ENV } from '../../configs/env.config';

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

            const user = await prisma.$transaction(async (tx) => {
                const record = await tx.user.upsert({
                    where: { email: identity.email },
                    create: {
                        email: identity.email,
                        name: identity.name,
                        image: identity.image,
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

                /** refId is derived from the user, so the unique ledger key makes
                 *  a repeat sign-in a no-op rather than a second bonus. */
                await writeLedger(tx, [
                    {
                        userId: record.id,
                        asset: SIGNUP_BONUS_ASSET,
                        amount: new Prisma.Decimal(SIGNUP_BONUS_AMOUNT),
                        ledgerReason: LedgerReason.DEPOSIT,
                        refType: RefType.DEPOSIT,
                        refId: `signup-bonus:${record.id}`,
                    },
                ]);

                return record;
            });

            return ResponseWriter.success(
                res,
                {
                    ...user,
                    isAdmin: ENV.ADMIN_EMAIL !== '' && user.email === ENV.ADMIN_EMAIL,
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
