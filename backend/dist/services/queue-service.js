"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const amqplib_1 = __importDefault(require("amqplib"));
const config_1 = __importDefault(require("config"));
const rabbitConfig = config_1.default.get('rabbitmq');
class QueueService {
    async publishPredictionJob(predictionId, imageKey) {
        const connection = await amqplib_1.default.connect({
            protocol: 'amqp',
            hostname: rabbitConfig.host,
            port: rabbitConfig.port,
            username: rabbitConfig.user,
            password: rabbitConfig.password,
        });
        try {
            const channel = await connection.createChannel();
            await channel.assertQueue(rabbitConfig.queueName, { durable: true });
            channel.sendToQueue(rabbitConfig.queueName, Buffer.from(JSON.stringify({ predictionId, imageKey })), { persistent: true });
            await channel.close();
        }
        finally {
            await connection.close();
        }
    }
}
exports.default = new QueueService();
