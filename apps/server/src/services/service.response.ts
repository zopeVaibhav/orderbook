import { Response } from 'express';
import { ApiResponse } from '@repo/types';

export class ResponseWriter {
    static success<T>(res: Response, data: T, message = 'ok') {
        return res.status(200).json({
            status: true,
            data,
            message,
            timestamp: new Date().toISOString(),
        } satisfies ApiResponse<T>);
    }

    static created<T>(res: Response, data: T, message = 'created') {
        return res.status(201).json({
            status: true,
            data,
            message,
            timestamp: new Date().toISOString(),
        } satisfies ApiResponse<T>);
    }

    static unauthorized(res: Response, error = 'unauthorized', message = 'unauthorized') {
        return res.status(401).json({
            status: false,
            data: null,
            message,
            error,
            timestamp: new Date().toISOString(),
        } satisfies ApiResponse<null>);
    }

    static invalidData(res: Response, error = 'invalid input', message = 'invalid input') {
        return res.status(400).json({
            status: false,
            data: null,
            message,
            error,
            timestamp: new Date().toISOString(),
        } satisfies ApiResponse<null>);
    }

    static notFound(res: Response, error = 'not found', message = 'not found') {
        return res.status(404).json({
            status: false,
            data: null,
            message,
            error,
            timestamp: new Date().toISOString(),
        } satisfies ApiResponse<null>);
    }

    static systemError(res: Response, error: unknown, message = 'internal server error') {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return res.status(500).json({
            status: false,
            data: null,
            message,
            error: errorMessage,
            timestamp: new Date().toISOString(),
        } satisfies ApiResponse<null>);
    }
}
