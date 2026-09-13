# Chess Piece Classifier

Chess Piece Classifier is a full-stack machine learning project. Users upload an image of a chess piece through the browser and receive a prediction from a trained PyTorch model.

The model classifies:

- Bishop
- King
- Knight
- Pawn
- Queen
- Rook

The model was trained beforehand and is stored at `python-worker/model.pt`. Training is not performed when the application starts.

## How It Works

```text
React Frontend
	-> Node.js / Express Backend
	-> LocalStack S3
	-> MySQL
	-> RabbitMQ Queue
	-> Python / PyTorch Worker
	-> model.pt
	-> MySQL
	-> Backend
	-> Frontend
```

1. The frontend uploads an image.
2. The backend generates a real UUID for the prediction.
3. The image is stored in LocalStack S3.
4. A prediction record is created in MySQL with `pending` status.
5. The backend publishes a job to RabbitMQ.
6. The Python worker receives the job.
7. The worker downloads the image from S3.
8. The PyTorch model performs inference.
9. The worker updates the database with the prediction and confidence.
10. The backend returns the final result to the frontend.

Every new upload receives a new UUID, even when the same image is uploaded more than once.

## Technologies

**Frontend:** React, TypeScript, Vite, Axios, CSS

**Backend:** Node.js, Express, TypeScript, Sequelize, MySQL

**Machine Learning:** Python, PyTorch, Torchvision, ResNet18

**Infrastructure:** Docker, Docker Compose, RabbitMQ, LocalStack S3, MySQL, Nginx

## Run the Project

Docker Desktop must be installed and running. Docker Compose provides all required services, so no separate local installation of Node.js, Python, MySQL, RabbitMQ, or LocalStack is required.

From the project root, run:

```bash
docker compose up --build
```

Wait until the services are running and healthy, then open:

<http://localhost:8080>

## Using the Application

1. Select an image of a chess piece.
2. Preview the selected image.
3. Use **Remove** if the wrong image was selected.
4. Click **Predict**.
5. Wait while the model processes the image.
6. View the prediction class and confidence percentage.
7. Click **Restart** to perform another prediction.

Supported image formats:

- JPG
- JPEG
- PNG
- WEBP
- AVIF

## Stop the Project

Stop the services with:

```bash
docker compose down
```

To remove the MySQL volume and reset stored prediction data:

```bash
docker compose down -v
```

## Docker Services

The application consists of:

- `frontend`
- `backend`
- `python-worker`
- `database`
- `rabbitmq`
- `localstack`

Frontend: <http://localhost:8080>

Backend: <http://localhost:3010>

MySQL, RabbitMQ, and LocalStack communicate internally through the Docker Compose network and are not exposed to the host in the final Compose environment.

## Project Structure

```text
jb-45800-5-project-4/
├── frontend/
├── backend/
├── python-worker/
│   └── model.pt
├── localstack/
│   └── init/
├── docker-compose.yml
├── docker-compose.dev.yml
└── README.md
```

## Model

The project uses the trained chess classification model from the previous machine learning task.

The dataset is not required to run the application. The runtime application performs inference only, using:

```text
python-worker/model.pt
```