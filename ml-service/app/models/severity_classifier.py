import torch
import torch.nn as nn
import torchvision.transforms as transforms
from PIL import Image
import timm
import io

class SeverityClassifier:
    def __init__(self, model_name="efficientnet_b0", pretrained=True):
        """
        Initialize EfficientNet-B0 for severity classification.
        In a real scenario, this would load custom weights trained on garbage volume/density.
        """
        print(f"Initializing {model_name} for severity classification...")
        self.model = timm.create_model(model_name, pretrained=pretrained, num_classes=11) # 0-10 severity
        self.model.eval()
        
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])
        
        self.severity_levels = {
            0: "No garbage",
            1: "Minimal - small amount",
            2: "Low - scattered items",
            3: "Moderate - noticeable pile",
            4: "Moderate - medium pile",
            5: "Medium - significant amount",
            6: "Medium-High - large pile",
            7: "High - very large dump",
            8: "Very High - massive dump",
            9: "Critical - extremely large dump",
            10: "Critical - hazardous waste"
        }

    def predict(self, image_bytes):
        """
        Predict severity score from image bytes.
        Returns: {severity: int, reasoning: str}
        """
        try:
            image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
            input_tensor = self.transform(image).unsqueeze(0)
            
            with torch.no_grad():
                output = self.model(input_tensor)
                # In a real system, the model would be trained to output severity.
                # Here we simulate using the top class or a calculated score.
                severity_score = torch.argmax(output, dim=1).item()
            
            # Simple heuristic for demo: if it's untrained, randomness is mixed with model output
            # severity_score = (severity_score) % 11
            
            return {
                "severity": severity_score,
                "reasoning": self.severity_levels.get(severity_score, "Unknown severity"),
                "model": "EfficientNet-B0"
            }
        except Exception as e:
            print(f"Error in Severity Classification: {e}")
            return {"severity": 5, "reasoning": f"Defaulting due to error: {str(e)}"}
