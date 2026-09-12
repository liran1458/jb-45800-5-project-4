"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("crypto");
const prediction_model_1 = __importDefault(require("../models/prediction-model"));
const queue_service_1 = __importDefault(require("./queue-service"));
const s3_service_1 = __importDefault(require("./s3-service"));
const POLL_INTERVAL_MS = 400;
const TIMEOUT_MS = 30000;
class PredictionService {
    getFileExtension(fileName) {
        const extension = fileName.split('.').pop()?.toLowerCase();
        if (!extension) {
            throw Object.assign(new Error('Unsupported image file type'), { status: 422 });
        }
        return extension;
    }
    async createPrediction(file) {
        const predictionId = (0, crypto_1.randomUUID)();
        const extension = this.getFileExtension(file.originalname);
        const imageKey = `predictions/${predictionId}.${extension}`;
        let prediction;
        try {
            prediction = await prediction_model_1.default.create({
                id: predictionId,
                originalFileName: file.originalname,
                imageKey,
                status: 'pending',
            });
        }
        catch (error) {
            error.status = 500;
            error.message = error.message || 'Database failure';
            throw error;
        }
        try {
            await s3_service_1.default.uploadImage(imageKey, file.buffer, file.mimetype || `image/${extension === 'jpg' ? 'jpeg' : extension}`);
        }
        catch (error) {
            await prediction.update({
                status: 'failed',
                errorMessage: `S3 failure: ${error.message || 'upload failed'}`,
            });
            const finalError = new Error('S3 failure');
            finalError.status = 500;
            throw finalError;
        }
        try {
            await queue_service_1.default.publishPredictionJob(predictionId, imageKey);
        }
        catch (error) {
            await prediction.update({
                status: 'failed',
                errorMessage: `RabbitMQ failure: ${error.message || 'publish failed'}`,
            });
            const finalError = new Error('RabbitMQ failure');
            finalError.status = 500;
            throw finalError;
        }
        return this.waitForPredictionResult(predictionId);
    }
    async waitForPredictionResult(predictionId) {
        const startedAt = Date.now();
        while (Date.now() - startedAt < TIMEOUT_MS) {
            const prediction = await prediction_model_1.default.findByPk(predictionId);
            if (!prediction) {
                throw Object.assign(new Error('Database failure'), { status: 500 });
            }
            if (prediction.status === 'completed') {
                if (!prediction.prediction || prediction.confidence === null || prediction.confidence === undefined) {
                    throw Object.assign(new Error('Worker prediction failed'), { status: 500 });
                }
                return {
                    id: prediction.id,
                    prediction: prediction.prediction,
                    confidence: Number(prediction.confidence),
                };
            }
            if (prediction.status === 'failed') {
                throw Object.assign(new Error(prediction.errorMessage || 'Worker prediction failed'), { status: 500 });
            }
            await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
        }
        throw Object.assign(new Error('Prediction timed out'), { status: 504 });
    }
}
exports.default = new PredictionService();
