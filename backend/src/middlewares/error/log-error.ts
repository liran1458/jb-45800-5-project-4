
import { randomUUID } from "crypto";
import type { NextFunction, Request, Response } from "express";

declare global {
    namespace Express {
        interface Request {
            eventId: string
        }
    }
}

export default function logError(err: any, request: Request, response: Response, next: NextFunction) {
    request.eventId = randomUUID()
    console.error(`event id ${request.eventId}`, err);
    next(err)
}