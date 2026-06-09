from flask import Flask, request, jsonify
import joblib
import os
import numpy as np
from PIL import Image
from skimage.feature import hog

app = Flask(__name__)

crop_model, crop_scaler, crop_encoder = joblib.load('crop_model.pkl'), joblib.load('crop_scaler.pkl'), joblib.load('crop_encoder.pkl')
disease_model, disease_scaler, disease_encoder = joblib.load('disease_model.pkl'), joblib.load('disease_scaler.pkl'), joblib.load('disease_encoder.pkl')

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
    if 'image' not in request.files:
        return jsonify({"error": "No image uploaded"}), 400
    
    file = request.files['image']
    file_path = f"temp_{file.filename}"
    file.save(file_path)
    
    try:
        features = extract_hog_features(file_path)
        scaled_features = disease_scaler.transform([features])
        prediction_id = disease_model.predict(scaled_features)[0]
        disease_name = disease_encoder.inverse_transform([prediction_id])[0]
        confidence = float(np.max(disease_model.predict_proba(scaled_features)))
        
        os.remove(file_path)
        return jsonify({
            "disease_id": int(prediction_id),
            "result": str(disease_name),
            "confidence": confidence
        })
    except Exception as e:
        if os.path.exists(file_path): os.remove(file_path)
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)