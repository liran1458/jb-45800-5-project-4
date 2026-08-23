import json
import os
import time
from pathlib import PurePosixPath
from typing import Any
from uuid import UUID

import boto3
import pika
import pymysql
from dotenv import load_dotenv

from predict import ChessPiecePredictor


load_dotenv()

QUEUE_NAME = os.getenv("QUEUE_NAME", "prediction_jobs")

RABBITMQ_HOST = os.getenv("RABBITMQ_HOST", "localhost")
RABBITMQ_PORT = int(os.getenv("RABBITMQ_PORT", "5672"))
RABBITMQ_USER = os.getenv("RABBITMQ_USER", "guest")
RABBITMQ_PASSWORD = os.getenv("RABBITMQ_PASSWORD", "guest")

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "3307"))
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "password")
DB_NAME = os.getenv("DB_NAME", "ml_project")

AWS_ENDPOINT_URL = os.getenv("AWS_ENDPOINT_URL", "http://localhost:4566")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID", "test")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "test")
S3_BUCKET = os.getenv("S3_BUCKET", "ml-images")


# The trained model is loaded once when the worker process starts.
predictor = ChessPiecePredictor()

s3 = boto3.client(
    "s3",
    endpoint_url=AWS_ENDPOINT_URL,
    region_name=AWS_REGION,
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
)


def get_db_connection():
    return pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        autocommit=True,
        charset="utf8mb4",
    )


def validate_uuid_v4(value: Any) -> str:
    if not isinstance(value, str):
        raise ValueError("predictionId must be a UUID string")

    try:
        parsed = UUID(value)
    except (ValueError, AttributeError) as error:
        raise ValueError("predictionId is not a valid UUID") from error

    if parsed.version != 4 or str(parsed) != value.lower():
        raise ValueError("predictionId must be a canonical UUID v4")

    return str(parsed)


def validate_image_key(image_key: Any, prediction_id: str) -> str:
    if not isinstance(image_key, str) or not image_key:
        raise ValueError("imageKey must be a non-empty string")

    path = PurePosixPath(image_key)
    if len(path.parts) != 2 or path.parts[0] != "predictions":
        raise ValueError(
            "imageKey must use the format predictions/<predictionUUID>.<extension>"
        )

    if path.stem != prediction_id or not path.suffix:
        raise ValueError(
            "imageKey must use the same prediction UUID as its file name"
        )

    return image_key


def validate_job_payload(payload: dict[str, Any]) -> tuple[str, str]:
    prediction_id = validate_uuid_v4(payload.get("predictionId"))
    image_key = validate_image_key(payload.get("imageKey"), prediction_id)
    return prediction_id, image_key


def update_prediction(
    prediction_id: str,
    *,
    status: str,
    prediction: str | None = None,
    confidence: float | None = None,
    error_message: str | None = None,
) -> None:
    query = """
        UPDATE predictions
        SET status = %s,
            prediction = %s,
            confidence = %s,
            error_message = %s,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = %s
    """

    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                query,
                (
                    status,
                    prediction,
                    confidence,
                    error_message,
                    prediction_id,
                ),
            )
    finally:
        connection.close()


def download_image(image_key: str) -> bytes:
    response = s3.get_object(Bucket=S3_BUCKET, Key=image_key)
    return response["Body"].read()


def process_job(payload: dict[str, Any]) -> None:
    prediction_id, image_key = validate_job_payload(payload)

    print(f"Processing prediction {prediction_id}")
    update_prediction(prediction_id, status="processing")

    image_bytes = download_image(image_key)
    predicted_class, confidence = predictor.predict_bytes(image_bytes)

    update_prediction(
        prediction_id,
        status="completed",
        prediction=predicted_class,
        confidence=confidence,
    )

    print(
        f"Completed {prediction_id}: "
        f"{predicted_class} ({confidence * 100:.2f}%)"
    )


def on_message(channel, method, properties, body) -> None:
    prediction_id = None

    try:
        payload = json.loads(body.decode("utf-8"))
        if not isinstance(payload, dict):
            raise ValueError("Queue message must be a JSON object")

        raw_prediction_id = payload.get("predictionId")
        if isinstance(raw_prediction_id, str):
            prediction_id = raw_prediction_id

        process_job(payload)
        channel.basic_ack(delivery_tag=method.delivery_tag)

    except Exception as error:
        print(f"Job failed: {error}")

        # If the message contains a usable prediction UUID, keep the failure
        # attached to that same DB row. Invalid/malformed messages are simply
        # acknowledged so they do not create an endless retry loop.
        if prediction_id:
            try:
                validated_id = validate_uuid_v4(prediction_id)
                update_prediction(
                    validated_id,
                    status="failed",
                    error_message=str(error)[:1000],
                )
            except Exception as db_error:
                print(f"Could not update failed status: {db_error}")

        channel.basic_ack(delivery_tag=method.delivery_tag)


def connect_to_rabbitmq():
    credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASSWORD)

    while True:
        try:
            return pika.BlockingConnection(
                pika.ConnectionParameters(
                    host=RABBITMQ_HOST,
                    port=RABBITMQ_PORT,
                    credentials=credentials,
                    heartbeat=60,
                    blocked_connection_timeout=300,
                )
            )
        except pika.exceptions.AMQPConnectionError as error:
            print(f"RabbitMQ is not ready yet: {error}")
            time.sleep(3)


def main() -> None:
    print("Chess ML worker starting...")
    print("Model loaded. Waiting for prediction jobs.")

    connection = connect_to_rabbitmq()
    channel = connection.channel()

    channel.queue_declare(queue=QUEUE_NAME, durable=True)
    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(
        queue=QUEUE_NAME,
        on_message_callback=on_message,
        auto_ack=False,
    )

    try:
        channel.start_consuming()
    except KeyboardInterrupt:
        print("Worker stopped.")
    finally:
        if connection.is_open:
            connection.close()


if __name__ == "__main__":
    main()
