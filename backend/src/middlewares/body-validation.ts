import type { NextFunction, Request, Response } from "express";
import { ObjectSchema } from "joi";

export default function bodyValidation(validator: ObjectSchema) {
    return async (request: Request, response: Response, next: NextFunction) => {
        try {
            // we push the validation result back into the request
            // because the validation may contain transformations 
            // (.e.g. uppercase)
            request.body = await validator.validateAsync(request.body)
            next()
        } catch (e) {
            next({
                status: 422,
                message: e.message || 'unprocessable entity'
            })
        }
    }    
}