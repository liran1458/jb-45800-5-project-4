"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = respondError;
function respondError(err, request, response, next) {
    const status = err?.status || 500;
    const message = err?.message || 'something bad happened... call betterx support with event id ' + request.eventId;
    response.status(status).json({
        message,
        eventId: request.eventId,
    });
}
