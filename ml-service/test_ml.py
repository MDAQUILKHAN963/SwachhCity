import requests
import sys
import os

def test_detection(image_path=None):
    url = "http://127.0.0.1:8000/api/detect"
    
    if not image_path:
        print("Please provide an image path")
        return

    if not os.path.exists(image_path):
        print(f"File not found: {image_path}")
        return

    print(f"Sending request to {url} with image {image_path}...")
    
    try:
        files = {'file': open(image_path, 'rb')}
        response = requests.post(url, files=files)
        
        if response.status_code == 200:
            print("\n✅ Success! Response:")
            print(response.json())
        else:
            print(f"\n❌ Error: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"\n❌ Exception: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        test_detection(sys.argv[1])
    else:
        print("Usage: python test_ml.py <path_to_image>")
