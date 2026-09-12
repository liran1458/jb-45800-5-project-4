import amqplib from 'amqplib'
import config from 'config'

const rabbitConfig = config.get<{ host: string; port: number; user: string; password: string; queueName: string }>('rabbitmq')

class QueueService {
    async publishPredictionJob(predictionId: string, imageKey: string): Promise<void> {
        const connection = await amqplib.connect({
            protocol: 'amqp',
            hostname: rabbitConfig.host,
            port: rabbitConfig.port,
            username: rabbitConfig.user,
            password: rabbitConfig.password,
        })

        try {
            const channel = await connection.createChannel()
            await channel.assertQueue(rabbitConfig.queueName, { durable: true })
            channel.sendToQueue(
                rabbitConfig.queueName,
                Buffer.from(JSON.stringify({ predictionId, imageKey })),
                { persistent: true },
            )
            await channel.close()
        } finally {
            await connection.close()
        }
    }
}

export default new QueueService()
