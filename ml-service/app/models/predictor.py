
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from datetime import datetime, timedelta

class GarbagePredictor:
    def __init__(self):
        self.model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.is_trained = False
        
        # Define areas in our simulated city
        self.areas = [
            {"name": "Market Area", "type": "commercial", "base_risk": 0.8},
            {"name": "Residential Zone A", "type": "residential", "base_risk": 0.3},
            {"name": "Industrial Sector", "type": "industrial", "base_risk": 0.6},
            {"name": "City Park", "type": "public", "base_risk": 0.4},
            {"name": "Bus Station", "type": "transport", "base_risk": 0.7}
        ]
        
        self.train_dummy_model()

    def train_dummy_model(self):
        """
        Since we don't have historical data, we train on synthetic data 
        that mimics real-world patterns (e.g., more trash on weekends in markets)
        """
        print("Training Hotspot Predictor on synthetic data...")
        
        data = []
        start_date = datetime.now() - timedelta(days=90) # 3 months history
        
        for i in range(90):
            current_date = start_date + timedelta(days=i)
            day_of_week = current_date.weekday() # 0=Mon, 6=Sun
            is_weekend = 1 if day_of_week >= 5 else 0
            
            for area in self.areas:
                # Risk formula: Base + Weekend Factor + Random Noise
                risk = area["base_risk"]
                
                if area["type"] == "commercial" and is_weekend:
                    risk += 0.2 # Markets busier on weekends
                elif area["type"] == "residential" and is_weekend:
                    risk += 0.1 # More activity
                elif area["type"] == "industrial" and not is_weekend:
                    risk += 0.1 # Factories active weekdays
                    
                # Add noise
                risk += np.random.normal(0, 0.05)
                risk = max(0, min(1, risk)) # Clamp 0-1
                
                # Target: Daily complaint count
                complaint_count = int(risk * 20) # Max 20 complaints/day
                
                data.append({
                    "day_of_week": day_of_week,
                    "is_weekend": is_weekend,
                    "area_type_code": self._encode_area_type(area["type"]),
                    "complaint_count": complaint_count
                })
                
        df = pd.DataFrame(data)
        X = df[["day_of_week", "is_weekend", "area_type_code"]]
        y = df["complaint_count"]
        
        self.model.fit(X, y)
        self.is_trained = True
        print("Hotspot Predictor Trained Successfully ✅")

    def predict_next_week(self):
        """
        Predict hotspots for the next 7 days
        """
        predictions = []
        today = datetime.now()
        
        for i in range(1, 8): # Next 7 days
            future_date = today + timedelta(days=i)
            day_of_week = future_date.weekday()
            is_weekend = 1 if day_of_week >= 5 else 0
            
            for area in self.areas:
                # Prepare input
                input_data = [[day_of_week, is_weekend, self._encode_area_type(area["type"])]]
                predicted_count = self.model.predict(input_data)[0]
                
                if predicted_count > 8: # Arbitrary threshold for "Hotspot"
                    predictions.append({
                        "date": future_date.strftime("%Y-%m-%d"),
                        "area_name": area["name"],
                        "predicted_complaints": round(predicted_count, 1),
                        "severity": "High" if predicted_count > 12 else "Medium",
                        # Mock coordinates for demo
                        "location": self._get_mock_location(area["name"]) 
                    })
                    
        return predictions

    def _encode_area_type(self, area_type):
        mapping = {"residential": 0, "commercial": 1, "industrial": 2, "public": 3, "transport": 4}
        return mapping.get(area_type, 0)

    def _get_mock_location(self, area_name):
        # Demo coordinates for each simulated area. Centered on the admin
        # dashboard's default map view (Bhopal) so predicted hotspots are
        # visible immediately without panning/zooming.
        base_lat, base_lng = 23.2599, 77.4126
        offsets = {
            "Market Area": (0.012, 0.015),
            "Residential Zone A": (-0.015, -0.012),
            "Industrial Sector": (0.022, -0.018),
            "City Park": (-0.010, 0.022),
            "Bus Station": (0.0, 0.0)
        }
        off = offsets.get(area_name, (0, 0))
        return {"lat": base_lat + off[0], "lng": base_lng + off[1]}
