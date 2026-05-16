import { Request, Response } from 'express';
import { ResponseWriter } from '../class/responseWriter';
import { prisma } from '@/database';
import jwt from 'jsonwebtoken';
import z from 'zod';
import { ENV } from '../config/env.config';

const signInSchema = z.object({
    email: z.email(),
    name: z.string().min(1),
    image: z.string().optional(),
});

export const SignInController = async (req: Request, res: Response) => {
    try {
        const parsed = signInSchema.safeParse(req.body);
        if (!parsed.success) return ResponseWriter.invalidData(res);

        const data = parsed.data;

        const user = await prisma.user.upsert({
            where: { email: data.email },
            create: {
                email: data.email,
                name: data.name,
                image: data.image ?? '',
            },
            update: {
                email: data.email,
                name: data.name,
                image: data.image ?? '',
            },
        });

        const accessToken = jwt.sign({ userId: user.id }, ENV.JWT_ACCESS_SECRET, {
            expiresIn: ENV.ACCESS_TOKEN_TTL_SEC,
        });

        return ResponseWriter.success(
            res,
            {
                user,
                token: accessToken,
            },
            'Sign in Successfull',
        );
    } catch (error) {
        ResponseWriter.error(res, error);
    }
};
