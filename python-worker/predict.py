import sys
from io import BytesIO
from pathlib import Path

import torch
import torch.nn as nn
from PIL import Image
from torchvision import models, transforms


MODEL_PATH = Path(__file__).with_name("model.pt")


class ChessPiecePredictor:
    """Loads the trained exam model once and reuses it for inference."""

    def __init__(self, model_path: str | Path = MODEL_PATH):
        checkpoint = torch.load(
            model_path,
            map_location="cpu",
            weights_only=True,
        )

        self.classes = checkpoint["classes"]
        self.image_size = checkpoint["image_size"]

        self.transform = transforms.Compose([
            transforms.Resize((self.image_size, self.image_size)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225],
            ),
        ])

        self.model = models.resnet18(weights=None)
        number_of_features = self.model.fc.in_features
        self.model.fc = nn.Linear(number_of_features, len(self.classes))
        self.model.load_state_dict(checkpoint["model_state_dict"])
        self.model.eval()

    def predict_image(self, image: Image.Image) -> tuple[str, float]:
        image = image.convert("RGB")
        image_tensor = self.transform(image).unsqueeze(0)

        with torch.no_grad():
            output = self.model(image_tensor)
            probabilities = torch.softmax(output, dim=1)
            confidence, predicted_index = torch.max(probabilities, dim=1)

        predicted_class = self.classes[predicted_index.item()]
        return predicted_class, confidence.item()

    def predict_path(self, image_path: str | Path) -> tuple[str, float]:
        with Image.open(image_path) as image:
            return self.predict_image(image)

    def predict_bytes(self, image_bytes: bytes) -> tuple[str, float]:
        with Image.open(BytesIO(image_bytes)) as image:
            return self.predict_image(image)


def main() -> None:
    image_path = sys.argv[1] if len(sys.argv) > 1 else "test_image.jpg"

    predictor = ChessPiecePredictor()
    predicted_class, confidence = predictor.predict_path(image_path)

    print("Image:", image_path)
    print("Prediction:", predicted_class)
    print(f"Confidence: {confidence * 100:.2f}%")


if __name__ == "__main__":
    main()
