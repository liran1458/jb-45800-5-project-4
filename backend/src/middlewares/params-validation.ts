import type { NextFunction, Request, Response } from "express";
import { ObjectSchema } from "joi";

export default function paramsValidation(validator: ObjectSchema) {
    return async (request: Request, response: Response, next: NextFunction) => {
        try {
            // we push the validation result back into the request
            // because the validation may contain transformations 
            // (.e.g. uppercase)
            request.params = await validator.validateAsync(request.params)
            next()
        } catch (e) {
            next({
                status: 422,
                message: e.message || 'unprocessable entity'
            })
        }
    }    
}