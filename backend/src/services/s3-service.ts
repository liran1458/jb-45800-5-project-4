import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import config from 'config'

const localstackConfig = config.get<{ endpoint: string; region: string; accessKeyId: string; secretAccessKey: string; bucket: string }>('localstack')

const s3Client = new S3Client({
    region: localstackConfig.region,
    endpoint: localstackConfig.endpoint,
    credentials: {
        accessKeyId: localstackConfig.accessKeyId,
        secretAccessKey: localstackConfig.secretAccessKey,
    },
    forcePathStyle: true,
})

class S3Service {
    async uploadImage(key: string, body: Buffer, contentType: string): Promise<void> {
        await s3Client.send(new PutObjectCommand({
            Bucket: localstackConfig.bucket,
            Key: key,
            Body: body,
            ContentType: contentType,
        }))
    }
}

export default new S3Service()
