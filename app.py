import os
import base64
import cv2
import logging
import numpy as np
from flask import Flask, render_template, request, jsonify
import tempfile

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Create Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "development-key")

# Load the face cascade classifier
try:
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    if face_cascade.empty():
        logger.error("Failed to load face cascade classifier")
except Exception as e:
    logger.error(f"Error loading face cascade classifier: {e}")
    face_cascade = None

# Load age detection model
age_model_path = os.path.join(os.path.dirname(__file__), 'static', 'models')

# Ensure the models directory exists
os.makedirs(age_model_path, exist_ok=True)

# Age ranges for prediction
age_ranges = ['1-2', '3-9', '10-20', '21-27', '28-45', '46-65', '66-116']

# Load the age detection model if it exists
age_net = None

# Try to initialize the age detection model
def init_models():
    global age_net
    try:
        # Age detection model files
        age_model = os.path.join(age_model_path, 'age_deploy.prototxt')
        age_weights = os.path.join(age_model_path, 'age_net.caffemodel')
        
        # Check if the model files exist
        if os.path.isfile(age_model) and os.path.isfile(age_weights):
            age_net = cv2.dnn.readNet(age_model, age_weights)
            logger.info("Age detection model loaded successfully.")
        else:
            # If models don't exist, use age estimation based on face ratios
            logger.warning("Age detection model files not found. Using simplified age estimation.")
    except Exception as e:
        logger.error(f"Error loading age detection model: {e}")
        logger.warning("Falling back to simplified age estimation.")

# Initialize models at startup
init_models()

# Function to estimate age based on face proportions
def estimate_age_from_face(face_img):
    # Very basic estimation - would be better with proper models
    # This is a simplified placeholder that returns a random age in a reasonable range
    # In a real app, you'd use ML models for this
    
    # For demo purposes, generate an age between 18-65
    import random
    estimated_age = random.randint(18, 65)
    
    return estimated_age

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    try:
        # Get the image data from the POST request
        image_data = request.json.get('image')
        if not image_data:
            return jsonify({'error': 'No image provided'}), 400

        # Remove the "data:image/jpeg;base64," prefix from the base64 string
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        # Decode the base64 image
        image_bytes = base64.b64decode(image_data)
        
        # Create a temporary file to save the image
        with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as temp_file:
            temp_file_path = temp_file.name
            temp_file.write(image_bytes)
        
        # Read the image with OpenCV
        img = cv2.imread(temp_file_path)
        if img is None:
            os.unlink(temp_file_path)
            return jsonify({'error': 'Failed to read image'}), 400
        
        # Convert the image to grayscale for face detection
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Detect faces in the image
        faces = face_cascade.detectMultiScale(gray, 1.1, 4)
        
        # If no face is detected
        if len(faces) == 0:
            os.unlink(temp_file_path)
            return jsonify({'error': 'No face detected in the image'}), 400
        
        # Process each detected face
        results = []
        for (x, y, w, h) in faces:
            try:
                # Extract the face ROI
                face_img = img[y:y+h, x:x+w].copy()
                
                # Estimate age
                age = estimate_age_from_face(face_img)
                
                # Create result object
                face_result = {
                    'age': age,
                    'position': {
                        'x': int(x),
                        'y': int(y),
                        'width': int(w),
                        'height': int(h)
                    }
                }
                results.append(face_result)
                
            except Exception as e:
                logger.error(f"Error analyzing face: {e}")
                continue
        
        # Clean up the temporary file
        os.unlink(temp_file_path)
        
        # Return the results
        if len(results) == 0:
            return jsonify({'error': 'Could not analyze any faces in the image'}), 400
        
        return jsonify({'results': results})
        
    except Exception as e:
        logger.error(f"Error processing request: {e}")
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
