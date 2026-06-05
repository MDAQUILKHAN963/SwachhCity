import easyocr
import numpy as np
import cv2
import io
from PIL import Image

class BrandDetector:
    def __init__(self):
        """
        Initialize EasyOCR for brand detection.
        Currently supports English.
        """
        print("Initializing Brand Detector (EasyOCR)...")
        # gpu=False for better compatibility in CPU environments, 
        # though it will be slower than GPU.
        self.reader = easyocr.Reader(['en'], gpu=False)
        
        # Known polluter brands/keywords to look for
        self.target_brands = [
            "Coke", "Coca-Cola", "Pepsi", "Nestle", "Lays", "Kurkure", 
            "Amul", "Mother Dairy", "Bisleri", "Kinley", "Aquafina",
            "Hindustan Unilever", "P&G", "ITC", "Britannia"
        ]

    def detect_brands(self, image_bytes):
        """
        Detect text in image and match against known brands.
        Returns: list of detected brands.
        """
        try:
            # Convert bytes to numpy array for EasyOCR
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            # Perform OCR
            results = self.reader.readtext(img)
            
            detected_brands = []
            all_text = []
            
            for (bbox, text, prob) in results:
                all_text.append(text)
                # Case-insensitive matching
                for brand in self.target_brands:
                    if brand.lower() in text.lower():
                        if brand not in [b['name'] for b in detected_brands]:
                            detected_brands.append({
                                "name": brand,
                                "matched_text": text,
                                "confidence": round(float(prob), 2)
                            })
            
            return {
                "brands": detected_brands,
                "identified_text_count": len(results),
                "corporates_accountable": len(detected_brands) > 0
            }
            
        except Exception as e:
            print(f"Error in Brand Detection: {e}")
            return {"brands": [], "error": str(e)}
