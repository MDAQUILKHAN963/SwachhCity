
import math

class LocationIntelligence:
    def __init__(self):
        # Mock Database of Important Places (Lat, Lng, Type, Weight)
        # Using simplified coordinates around Delhi for demo
        self.pois = [
            {"name": "City General Hospital", "lat": 28.6129, "lng": 77.2295, "type": "hospital", "weight": 1.0},
            {"name": "Public School", "lat": 28.6219, "lng": 77.2195, "type": "school", "weight": 0.9},
            {"name": "Main Market", "lat": 28.6329, "lng": 77.2150, "type": "market", "weight": 0.8},
            {"name": "Bus Terminal", "lat": 28.6100, "lng": 77.2300, "type": "transport", "weight": 0.7}
        ]

    def calculate_location_importance(self, lat, lng):
        """
        Calculate importance (0-1) based on proximity to critical infrastructure.
        Returns: (score, nearest_poi_name)
        """
        max_score = 0.1 # Default low importance (remote area)
        nearest_poi = None
        min_dist = float('inf')

        for poi in self.pois:
            # Simple Euclidean distance for speed (approx degrees)
            # 1 degree lat approx 111km. 0.001 deg approx 100m.
            dist = math.sqrt((poi["lat"] - lat)**2 + (poi["lng"] - lng)**2)
            
            # If within ~500m (0.005 degrees)
            if dist < 0.005:
                # Linear falloff: Closer = Higher score
                score = poi["weight"] * (1 - (dist / 0.005))
                if score > max_score:
                    max_score = score
                    nearest_poi = poi["name"]
            
            if dist < min_dist:
                min_dist = dist

        return round(max_score, 2), nearest_poi
