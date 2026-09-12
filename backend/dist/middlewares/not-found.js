"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = notFound;
function notFound(request, response, next) {
    next({
        status: 404,
        message: 'not found'
    });
}
