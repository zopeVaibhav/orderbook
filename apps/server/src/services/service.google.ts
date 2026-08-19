import { OAuth2Client } from 'google-auth-library';
import { ENV } from '../configs/env.config';

export interface GoogleIdentity {
    email: string;
    name: string;
    image: string | null;
}

export default class GoogleAuthService {
    static googleClient = new OAuth2Client();

    static async verifyIdToken(idToken: string): Promise<GoogleIdentity> {
        const ticket = await this.googleClient.verifyIdToken({
            idToken,
            audience: ENV.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();

        if (!payload) throw new Error('invalid google token');
        if (!payload.email) throw new Error('google token carries no email');
        if (!payload.email_verified) throw new Error('google account email not verified');

        return {
            email: payload.email,
            name: payload.name ?? payload.email,
            image: payload.picture ?? null,
        };
    }
}
