import type { NextConfig } from 'next';
import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [{ protocol: 'https', hostname: 'api.dicebear.com' }],
    },
};

export default nextConfig;
