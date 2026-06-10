from flask import Flask, request, jsonify
import joblib
import os
import numpy as np
from PIL import Image
from skimage.feature import hog

app = Flask(__name__)

# Load core machine learning diagnostic engines safely
crop_model = joblib.load('crop_model.pkl')
crop_scaler = joblib.load('crop_scaler.pkl')
crop_encoder = joblib.load('crop_encoder.pkl')

disease_model = joblib.load('disease_model.pkl')
disease_scaler = joblib.load('disease_scaler.pkl')
disease_encoder = joblib.load('disease_encoder.pkl')

def extract_hog_features(image_path):
    with Image.open(image_path) as img:
        img = img.convert('L').resize((128, 128))
        features = hog(np.array(img), orientations=9, pixels_per_cell=(16, 16), 
                       cells_per_block=(2, 2), transform_sqrt=True)
        target_length = 1780
        if len(features) < target_length:
            features = np.pad(features, (0, target_length - len(features)), 'constant')
        else:
            features = features[:target_length]
        return features

@app.route('/predict', methods=['POST'])
def predict():
    try:
        # ----------------------------------------------------------------------
        # PATHway A: SOIL PARAMETERS ANALYSIS (CROP RECOMMENDATION PIPELINE)
        # ----------------------------------------------------------------------
        json_data = request.get_json(silent=True)
        if json_data and json_data.get('type') == 'crop':
            raw_input_data = json_data.get('data')
            if not raw_input_data:
                return jsonify({"error": "Missing array content inside soil telemetry payload"}), 400
                
            formatted_features = np.array(raw_input_data).reshape(1, -1)
            scaled_soil_metrics = crop_scaler.transform(formatted_features)
            crop_prediction = crop_model.predict(scaled_soil_metrics)[0]
            decoded_crop_name = crop_encoder.inverse_transform([crop_prediction])[0]
            
            return jsonify({
                "success": True,
                "result": str(decoded_crop_name)
            })

        # ----------------------------------------------------------------------
        # PATHway B: LEAF IMAGE DIAGNOSTICS (DISEASE DETECTION PIPELINE)
        # ----------------------------------------------------------------------
        if 'image' not in request.files:
            return jsonify({"error": "Invalid request interface. Provide an image or soil telemetry data."}), 400
        
        file = request.files['image']
        file_path = f"temp_{file.filename}"
        file.save(file_path)
        
        try:
            features = extract_hog_features(file_path)
            scaled_features = disease_scaler.transform([features])
            
            # 1. Get the actual prediction first
            prediction_id = disease_model.predict(scaled_features)[0]
            disease_name = disease_encoder.inverse_transform([prediction_id])[0]
            
            # 2. Extract confidence
            probabilities = disease_model.predict_proba(scaled_features)[0]
            max_confidence = float(np.max(probabilities))
            
            # --- AGGRESSIVE LOW THRESHOLD PROTECTION ---
            # We set this to 0.15 just to catch completely chaotic, blank, or broken frames.
            # Your valid plants will easily bypass this and show up properly now!
            if max_confidence < 0.15:
                if os.path.exists(file_path): 
                    os.remove(file_path)
                return jsonify({
                    "disease_id": 0,
                    "result": "Non-Plant",
                    "confidence": max_confidence
                })
            
            if os.path.exists(file_path): 
                os.remove(file_path)
                
            return jsonify({
                "disease_id": int(prediction_id),
                "result": str(disease_name),
                "confidence": max_confidence
            })
            
        except Exception as inner_error:
            if os.path.exists(file_path): 
                os.remove(file_path)
            raise inner_error

    except Exception as outer_error:
        return jsonify({"error": str(outer_error)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)