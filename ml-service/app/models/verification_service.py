class VerificationService:
    def __init__(self):
        """
        Initialize the Automated Verification logic.
        Validates user-submitted text descriptions against detected objects in the image.
        """
        print("Initializing Verification Service (Text-Image Consistency)...")
        # Keyword mappings for basic semantic verification
        self.keyword_map = {
            "plastic": ["plastic", "bottle", "bottles", "polybag", "polythene"],
            "organic": ["food", "fruit", "vegetable", "banana", "apple", "leaves", "organic", "wet"],
            "glass": ["glass", "window", "bottle"], # 'bottle' overlaps, context matters
            "paper": ["paper", "cardboard", "box", "newspaper"],
            "metal": ["metal", "can", "cans", "tin", "iron"],
            "ewaste": ["electronic", "phone", "computer", "battery", "wire", "mouse"]
        }

    def verify_consistency(self, description: str, detected_classes: list, segregation_report: dict) -> dict:
        """
        Check if the text description matches the image detections.
        description: User provided text.
        detected_classes: List of unique labels detected by YOLO.
        segregation_report: Output from YOLO segregation logic.
        """
        if not description:
            return {"verified": True, "reason": "No description provided to verify against.", "confidence": 1.0}

        desc_lower = description.lower()
        matched = False
        findings = []

        # 1. Simple Keyword Matching
        for category, keywords in self.keyword_map.items():
            for keyword in keywords:
                if keyword in desc_lower:
                    # User mentioned a keyword, check if model saw it
                    if category in segregation_report and segregation_report[category] > 0:
                        matched = True
                        findings.append(f"Confirmed presence of {category} waste.")
                    # Direct class match
                    elif any(keyword in cls.lower() for cls in detected_classes):
                        matched = True
                        findings.append(f"Confirmed presence of {keyword}.")

        # 2. Heuristic for generic complaints "Huge dump", "Lots of garbage"
        generic_keywords = ["huge", "lot", "big", "massive", "dump", "pile"]
        if any(gk in desc_lower for gk in generic_keywords):
            if sum(segregation_report.values()) >= 4: # If YOLO sees >= 4 items, it agrees it's a pile
                matched = True
                findings.append("Confirmed image shows a significant quantity of waste.")

        # If we couldn't match specific entities, but there IS garbage detected, 
        # we don't necessarily flag it as false, just low confidence verification
        has_garbage = sum(segregation_report.values()) > 0

        if matched:
            return {
                "verified": True, 
                "confidence": 0.9, 
                "reason": "Text description matches detected visual evidence. " + " ".join(findings)
            }
        elif has_garbage:
            return {
                "verified": True, 
                "confidence": 0.5, 
                "reason": "Garbage detected, but specific details in description could not be explicitly confirmed."
            }
        else:
            return {
                "verified": False, 
                "confidence": 0.1, 
                "reason": "Flagged for review: Image contains no detectable garbage, which contradictions the report submission."
            }
