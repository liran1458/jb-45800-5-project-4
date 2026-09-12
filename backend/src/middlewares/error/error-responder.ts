
import type { NextFunction, Request, Response } from "express";

export default function respondError(err: any, request: Request, response: Response, next: NextFunction) {
    const status = err?.status || 500
    const message = err?.message || 'something bad happened... call betterx support with event id ' + request.eventId

    response.status(status).json({
        message,
        eventId: request.eventId,
    })
}