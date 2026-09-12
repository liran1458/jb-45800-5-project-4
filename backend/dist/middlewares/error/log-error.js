"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = logError;
const crypto_1 = require("crypto");
function logError(err, request, response, next) {
    request.eventId = (0, crypto_1.randomUUID)();
    console.error(`event id ${request.eventId}`, err);
    next(err);
}
