"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = validateImageUpload;
const allowedExtensions = new Set(['jpg', 'jpeg', 'png', 'webp', 'avif']);
const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
function validateImageUpload(request, response, next) {
    const file = request.file;
    if (!file) {
        next({ status: 400, message: 'Missing image file' });
        return;
    }
    if (file.size > 10 * 1024 * 1024) {
        next({ status: 413, message: 'File too large. Max size is 10 MB.' });
        return;
    }
    const originalName = file.originalname || '';
    const extension = originalName.split('.').pop()?.toLowerCase();
    if (!extension || !allowedExtensions.has(extension)) {
        next({ status: 422, message: 'Unsupported image type. Allowed: jpg, jpeg, png, webp, avif.' });
        return;
    }
    const mimeType = file.mimetype?.toLowerCase() || '';
    if (!allowedMimeTypes.has(mimeType)) {
        next({ status: 422, message: 'Unsupported image type. Allowed: jpg, jpeg, png, webp, avif.' });
        return;
    }
    next();
}
