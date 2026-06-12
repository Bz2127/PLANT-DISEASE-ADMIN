from flask import Flask, request, jsonify
import joblib
import numpy as np
from PIL import Image
import io
import os
from skimage.feature import hog
from threading import Lock

app = Flask(__name__)
model_lock = Lock()

crop_model = joblib.load('crop_model.pkl')
crop_scaler = joblib.load('crop_scaler.pkl')
crop_encoder = joblib.load('crop_encoder.pkl')

disease_model = joblib.load('disease_model.pkl')
disease_scaler = joblib.load('disease_scaler.pkl')
disease_encoder = joblib.load('disease_encoder.pkl')

def extract_hog_features(img_file):
    with Image.open(img_file) as img:
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
    with model_lock:
        try:
            json_data = request.get_json(silent=True)
            if json_data and json_data.get('type') == 'crop':
                raw_input_data = json_data.get('data')
                if not raw_input_data:
                    return jsonify({"error": "Missing array content"}), 400
                
                formatted_features = np.array(raw_input_data).reshape(1, -1)
                scaled_soil_metrics = crop_scaler.transform(formatted_features)
                crop_prediction = crop_model.predict(scaled_soil_metrics)[0]
                decoded_crop_name = crop_encoder.inverse_transform([crop_prediction])[0]
                
                return jsonify({
                    "success": True,
                    "result": str(decoded_crop_name)
                })

            if 'image' not in request.files:
                return jsonify({"error": "Invalid request interface."}), 400
            
            file = request.files['image']
            img_bytes = io.BytesIO(file.read())
            
            try:
                features = extract_hog_features(img_bytes)
                scaled_features = disease_scaler.transform([features])
                
                prediction_id = disease_model.predict(scaled_features)[0]
                disease_name = disease_encoder.inverse_transform([prediction_id])[0]
                
                probabilities = disease_model.predict_proba(scaled_features)[0]
                max_confidence = float(np.max(probabilities))
                
                if max_confidence < 0.15:
                    return jsonify({
                        "disease_id": 0,
                        "result": "Non-Plant",
                        "confidence": max_confidence
                    })
                
                return jsonify({
                    "disease_id": int(prediction_id),
                    "result": str(disease_name),
                    "confidence": max_confidence
                })
                
            except Exception as inner_error:
                raise inner_error

        except Exception as outer_error:
            return jsonify({"error": str(outer_error)}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 10000))
    app.run(host='0.0.0.0', port=port)