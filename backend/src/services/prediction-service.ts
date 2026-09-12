import { randomUUID } from 'crypto'
import Prediction from '../models/prediction-model'
import queueService from './queue-service'
import s3Service from './s3-service'

const POLL_INTERVAL_MS = 400
const TIMEOUT_MS = 30000

class PredictionService {
    private getFileExtension(fileName: string): string {
        const extension = fileName.split('.').pop()?.toLowerCase()
        if (!extension) {
            throw Object.assign(new Error('Unsupported image file type'), { status: 422 })
        }

        return extension
    }

    async createPrediction(file: Express.Multer.File): Promise<{ id: string; prediction: string; confidence: number }> {
        const predictionId = randomUUID()
        const extension = this.getFileExtension(file.originalname)
        const imageKey = `predictions/${predictionId}.${extension}`

        let prediction: Prediction

        try {
            prediction = await Prediction.create({
                id: predictionId,
                originalFileName: file.originalname,
                imageKey,
                status: 'pending',
            })
        } catch (error: any) {
            error.status = 500
            error.message = error.message || 'Database failure'
            throw error
        }

        try {
            await s3Service.uploadImage(imageKey, file.buffer, file.mimetype || `image/${extension === 'jpg' ? 'jpeg' : extension}`)
        } catch (error: any) {
            await prediction.update({
                status: 'failed',
                errorMessage: `S3 failure: ${error.message || 'upload failed'}`,
            })
            const finalError = new Error('S3 failure')
                ; (finalError as any).status = 500
            throw finalError
        }

        try {
            await queueService.publishPredictionJob(predictionId, imageKey)
        } catch (error: any) {
            await prediction.update({
                status: 'failed',
                errorMessage: `RabbitMQ failure: ${error.message || 'publish failed'}`,
            })
            const finalError = new Error('RabbitMQ failure')
                ; (finalError as any).status = 500
            throw finalError
        }

        return this.waitForPredictionResult(predictionId)
    }

    private async waitForPredictionResult(predictionId: string): Promise<{ id: string; prediction: string; confidence: number }> {
        const startedAt = Date.now()

        while (Date.now() - startedAt < TIMEOUT_MS) {
            const prediction = await Prediction.findByPk(predictionId)

            if (!prediction) {
                throw Object.assign(new Error('Database failure'), { status: 500 })
            }

            if (prediction.status === 'completed') {
                if (!prediction.prediction || prediction.confidence === null || prediction.confidence === undefined) {
                    throw Object.assign(new Error('Worker prediction failed'), { status: 500 })
                }

                return {
                    id: prediction.id,
                    prediction: prediction.prediction,
                    confidence: Number(prediction.confidence),
                }
            }

            if (prediction.status === 'failed') {
                throw Object.assign(new Error(prediction.errorMessage || 'Worker prediction failed'), { status: 500 })
            }

            await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
        }

        throw Object.assign(new Error('Prediction timed out'), { status: 504 })
    }
}

export default new PredictionService()
