"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = createPrediction;
const prediction_service_1 = __importDefault(require("../services/prediction-service"));
async function createPrediction(request, response, next) {
    try {
        const file = request.file;
        if (!file) {
            next({ status: 400, message: 'Missing image file' });
            return;
        }
        const result = await prediction_service_1.default.createPrediction(file);
        response.status(200).json(result);
    }
    catch (error) {
        next(error);
    }
}
