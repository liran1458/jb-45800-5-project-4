
import type { NextFunction, Request, Response } from "express";

export default function respondError(err: any, request: Request, response: Response, next: NextFunction) {
    response.status(err.status || 500).send(err.status === 422 ? err.message : `something bad happened... call betterx support with event id ${request.eventId}` )
}