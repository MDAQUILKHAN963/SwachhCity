import math
from typing import List, Dict

class RoutingEngine:
    def __init__(self):
        """
        Initialize the AI Routing Engine.
        In a production environment, this would integrate with Google Maps API or OSRM for real road distances.
        Here we use a heuristic (Nearest Neighbor TSP) with Euclidean distance for demonstration.
        """
        print("Initializing AI Routing Engine (TSP Heuristic)...")
        # Base depot location (e.g., Central Waste Management Facility)
        # Using approximate central Delhi coordinates for demo
        self.depot_lat = 28.6139
        self.depot_lng = 77.2090

    def optimize_route(self, hotspots: List[Dict], start_lat: float = None, start_lng: float = None) -> Dict:
        """
        Calculate an optimized route for a list of hotspots.
        hotspots: [{ id, lat, lng, severity ... }]
        """
        if not hotspots:
            return {"optimized_route": [], "total_distance_km": 0, "estimated_time_mins": 0}

        current_lat = start_lat if start_lat else self.depot_lat
        current_lng = start_lng if start_lng else self.depot_lng

        unvisited = hotspots.copy()
        route = []
        total_distance = 0.0

        # Nearest neighbor heuristic for TSP
        while unvisited:
            nearest_idx = 0
            min_dist = float('inf')
            
            for i, hotspot in enumerate(unvisited):
                # Simple Haversine approximation or Euclidean (using Euclidean for speed here)
                dist = self._calculate_distance(current_lat, current_lng, hotspot['lat'], hotspot['lng'])
                
                # We could also weight distance by severity (visit high severity first, even if slightly further)
                # Weighted distance = physical_dist / (severity_score + 1)
                weighted_dist = dist / (hotspot.get('severity', 5) + 1)
                
                if weighted_dist < min_dist:
                    min_dist = weighted_dist
                    nearest_idx = i
                    
            # Move to nearest
            next_stop = unvisited.pop(nearest_idx)
            
            # Calculate actual distance added (not weighted)
            actual_dist = self._calculate_distance(current_lat, current_lng, next_stop['lat'], next_stop['lng'])
            total_distance += actual_dist
            
            # Update current location
            current_lat = next_stop['lat']
            current_lng = next_stop['lng']
            
            # Add to route sequence
            next_stop['stop_number'] = len(route) + 1
            route.append(next_stop)

        # Assuming average speed of 20km/h for a garbage truck in a city + 10 mins loading per stop
        estimated_time_mins = (total_distance / 20.0) * 60 + (len(route) * 10)

        return {
            "optimized_route": route,
            "total_distance_km": round(total_distance, 2),
            "estimated_time_mins": round(estimated_time_mins),
            "start_point": {"lat": start_lat or self.depot_lat, "lng": start_lng or self.depot_lng}
        }

    def _calculate_distance(self, lat1, lon1, lat2, lon2):
        """
        Calculate approximate distance in km using Haversine formula.
        """
        R = 6371  # Earth radius in km
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = math.sin(dlat/2) * math.sin(dlat/2) + math.cos(math.radians(lat1)) \
            * math.cos(math.radians(lat2)) * math.sin(dlon/2) * math.sin(dlon/2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        distance = R * c
        return distance
