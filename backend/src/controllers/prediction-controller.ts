import type { NextFunction, Request, Response } from 'express'
import predictionService from '../services/prediction-service'

export default async function createPrediction(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
        const file = request.file
        if (!file) {
            next({ status: 400, message: 'Missing image file' })
            return
        }

        const result = await predictionService.createPrediction(file)
        response.status(200).json(result)
    } catch (error: any) {
        next(error)
    }
}
