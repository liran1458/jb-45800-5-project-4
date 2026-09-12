"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_s3_1 = require("@aws-sdk/client-s3");
const config_1 = __importDefault(require("config"));
const localstackConfig = config_1.default.get('localstack');
const s3Client = new client_s3_1.S3Client({
    region: localstackConfig.region,
    endpoint: localstackConfig.endpoint,
    credentials: {
        accessKeyId: localstackConfig.accessKeyId,
        secretAccessKey: localstackConfig.secretAccessKey,
    },
    forcePathStyle: true,
});
class S3Service {
    async uploadImage(key, body, contentType) {
        await s3Client.send(new client_s3_1.PutObjectCommand({
            Bucket: localstackConfig.bucket,
            Key: key,
            Body: body,
            ContentType: contentType,
        }));
    }
}
exports.default = new S3Service();
