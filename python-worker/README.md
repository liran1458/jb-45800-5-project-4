# Chess ML Python Worker

This folder is the production inference part of the chess-piece classifier created for the exam.

The model was already trained before the project. The original exam README reported a best validation accuracy of **90.09%**. The project does **not** retrain the model when it starts and does **not** require the dataset.

## Model

`model.pt` contains:

- the trained ResNet18 `state_dict`
- class names: Bishop, King, Knight, Pawn, Queen, Rook
- image size: 224
- architecture metadata: ResNet18

The model is loaded once when the Python worker starts and is reused for every prediction.

## UUID contract

Every new image upload creates a new Prediction with a **real UUID v4 generated at runtime by the Node backend**.

That same UUID is the correlation ID for the whole prediction flow:

```text
Prediction DB row id
        =
Queue predictionId
        =
UUID used in the S3 image key
```

Example:

```text
Prediction ID:
7d61266e-3d82-41ac-8465-798f01a26610

S3 key:
predictions/7d61266e-3d82-41ac-8465-798f01a26610.jpg
```

There is no separate image UUID while the project has a 1 Prediction = 1 Image relationship.

If the same physical image is uploaded twice, those are two separate prediction events. The backend must generate two different UUIDs and keep two different DB history rows. There is no deduplication or overwrite.

The original uploaded filename is stored separately in the DB. It is not used as the S3 object name.

## Project flow

```text
React frontend
    -> Node/Express backend
        -> generates a real UUID v4 for the new Prediction
        -> saves image in LocalStack S3 as predictions/<uuid>.<extension>
        -> creates DB row with status=pending and original_file_name
        -> publishes { predictionId, imageKey } to RabbitMQ
            -> Python worker
                -> validates the UUID/job contract
                -> downloads image from LocalStack S3
                -> runs model.pt inference
                -> updates the same DB row
                   status=completed
                   prediction=<class>
                   confidence=<0..1>
```

The Python worker does not poll the database for new work. RabbitMQ tells it when a prediction job is ready.

## Queue message expected from Node

```json
{
  "predictionId": "550e8400-e29b-41d4-a716-446655440000",
  "imageKey": "predictions/550e8400-e29b-41d4-a716-446655440000.jpg"
}
```

The worker validates that `predictionId` is a canonical UUID v4 and that `imageKey` uses the exact same UUID.

The original filename does not need to be sent through RabbitMQ because the backend already saved it in the DB.

## Database contract

The Node backend should own/create the `predictions` table. The worker expects the project database to provide these fields:

```text
id                 UUID, primary key
original_file_name original filename supplied by the user
image_key          LocalStack S3 key
status             pending / processing / completed / failed
prediction         predicted chess-piece class, nullable until completed
confidence         number from 0 to 1, nullable until completed
error_message      nullable error text
created_at
updated_at
```

Expected statuses:

```text
pending -> processing -> completed
                      -> failed
```

`id` is the same UUID that appears in the queue message and S3 key.

## Development

Create the virtual environment:

```bash
python -m venv .venv
```

Windows PowerShell:

```powershell
.venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Copy `.env.example` to `.env`. The defaults assume MySQL, RabbitMQ and LocalStack are exposed from Docker to the host on ports `3307`, `5672` and `4566`.

Run the worker:

```bash
python worker.py
```

## Test the trained model without Queue/DB/S3

The original simple prediction workflow is still available:

```bash
python predict.py test_image.jpg
```

Expected result with the included exam model:

```text
Prediction: King
Confidence: 99.86%
```

The included `rook.avif` can also be tested:

```bash
python predict.py rook.avif
```

It predicts `Rook` with about `90.84%` confidence using the included model.

## Docker Compose environment

When this worker runs inside the final `docker-compose.yml`, the code stays the same. Only environment variables change, for example:

```env
RABBITMQ_HOST=rabbitmq
RABBITMQ_PORT=5672
DB_HOST=database
DB_PORT=3306
AWS_ENDPOINT_URL=http://localstack:4566
S3_BUCKET=ml-images
```

The Docker image starts `worker.py` directly. It never runs `train.py`.

## What was intentionally removed from the exam folder

The production worker does not need:

- `dataset/`
- `train.py`
- `pretrained/resnet18-f37072fd.pth`
- `.venv/`

Those files were only needed for the one-time training stage. The trained `model.pt` is the artifact required for inference and must remain in Git.
