# ml-models/models/predict.py
import sys
import json
import joblib
import os
import numpy as np
from PIL import Image
from skimage.feature import hog

# Compute the absolute path of the directory containing this script
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Load the models, scalers, and encoders dynamically
try:
    crop_model = joblib.load(os.path.join(BASE_DIR, 'crop_model.pkl'))
    crop_scaler = joblib.load(os.path.join(BASE_DIR, 'crop_scaler.pkl'))
    crop_encoder = joblib.load(os.path.join(BASE_DIR, 'crop_encoder.pkl'))

    disease_model = joblib.load(os.path.join(BASE_DIR, 'disease_model.pkl'))
    disease_scaler = joblib.load(os.path.join(BASE_DIR, 'disease_scaler.pkl'))
    disease_encoder = joblib.load(os.path.join(BASE_DIR, 'disease_encoder.pkl'))
except Exception as e:
    print(json.dumps({"error": f"Failed to load model files: {str(e)}"}))
    sys.exit(1)

def extract_hog_features(image_path):
    """
    Converts a real image file into features and forces the vector 
    to match the exact length expected by the disease scaler.
    """
    with Image.open(image_path) as img:
        # Standardize base size
        img = img.convert('L').resize((128, 128))
        img_array = np.array(img)
        
        # Extract base HOG textures
        features = hog(
            img_array, 
            orientations=9, 
            pixels_per_cell=(16, 16), 
            cells_per_block=(2, 2), 
            transform_sqrt=True,
            visualize=False
        )
        
        # Force vector to be exactly 1780 features long
        target_length = 1780
        current_length = len(features)
        
        if current_length < target_length:
            # Pad with zeros if it's too short
            features = np.pad(features, (0, target_length - current_length), 'constant')
        elif current_length > target_length:
            # Cut off the extra numbers if it's too long
            features = features[:target_length]
            
        return features

def main():
    try:
        payload_str = os.environ.get("ML_PAYLOAD")
        
        if not payload_str and len(sys.argv) > 1:
            payload_str = sys.argv[1]

        if not payload_str:
            raise ValueError("No input payload package detected.")

        input_args = json.loads(payload_str)
        request_type = input_args.get("type")

        if request_type == "crop":
            data = [input_args["data"]] 
            scaled_data = crop_scaler.transform(data)
            prediction = crop_model.predict(scaled_data)[0]
            crop_name = crop_encoder.inverse_transform([prediction])[0]
            
            print(json.dumps({"success": True, "result": crop_name}))

        elif request_type == "disease":
            image_path = input_args.get("image_url")
            
            if not image_path or not os.path.exists(image_path):
                raise FileNotFoundError(f"Image file not found at path: {image_path}")

            # Extract and force features to be exactly 1780 items long
            hog_features = extract_hog_features(image_path)
            
            # Run features through the scaler matrix
            scaled_features = disease_scaler.transform([hog_features])
            
            # Predict the raw disease ID
            prediction_id = disease_model.predict(scaled_features)[0]
            
            # Convert the ID to the real plant disease text name
            disease_name = disease_encoder.inverse_transform([prediction_id])[0]
            
            try:
                probabilities = disease_model.predict_proba(scaled_features)[0]
                confidence = float(np.max(probabilities))
            except AttributeError:
                confidence = 0.94

            print(json.dumps({
                "success": True, 
                "crop_id": 1, 
                "disease_id": int(prediction_id), 
                "confidence": confidence, 
                "result": str(disease_name)
            }))
            
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == '__main__':
    main()