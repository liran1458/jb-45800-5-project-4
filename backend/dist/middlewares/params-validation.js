"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = paramsValidation;
function paramsValidation(validator) {
    return async (request, response, next) => {
        try {
            // we push the validation result back into the request
            // because the validation may contain transformations 
            // (.e.g. uppercase)
            request.params = await validator.validateAsync(request.params);
            next();
        }
        catch (e) {
            next({
                status: 422,
                message: e.message || 'unprocessable entity'
            });
        }
    };
}
