# Face Age Predictor

A web application that uses computer vision to detect faces and predict ages from images or webcam.

## Features

- Upload image files or use your webcam to capture faces
- Automatic face detection using OpenCV
- Age prediction for each detected face
- Real-time webcam integration for live detection
- Responsive design that works on mobile and desktop

## Technologies Used

- **Backend**: Flask (Python)
- **Frontend**: HTML, CSS, JavaScript, Bootstrap
- **Computer Vision**: OpenCV
- **Face Detection**: Haar Cascade Classifier
- **Age Detection**: Simple age prediction model

## Deployment Instructions

### Prerequisites

- Python 3.11 or higher
- pip (Python package manager)
- Git (optional, for cloning the repository)

### Option 1: Deploy on Replit

1. Fork this project on Replit
2. Click the "Run" button
3. The application will automatically deploy and be accessible via the provided URL

### Option 2: Local Deployment

1. Clone the repository:
   ```
   git clone <repository-url>
   cd face-age-predictor
   ```

2. Install the required dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Run the application:
   ```
   python main.py
   ```

4. Access the application in your browser at:
   ```
   http://localhost:5000
   ```

### Option 3: Production Deployment

For production deployment, we recommend:

1. Using Gunicorn as a WSGI server:
   ```
   gunicorn --bind 0.0.0.0:5000 main:app
   ```

2. Setting up a reverse proxy with Nginx or Apache

3. Using environment variables for configuration:
   - Set `SESSION_SECRET` for secure session management

## Usage

1. Open the application in your browser
2. Choose either "Upload Image" or "Webcam" for face detection
3. If uploading an image, drag and drop or click to select an image
4. If using webcam, click "Start Camera" and then "Capture Photo"
5. Click "Analyze Face" to process the image
6. View the age prediction results for all detected faces

## Further Development

To improve this application:

1. Integrate more advanced face detection models like MTCNN or RetinaFace
2. Add more prediction capabilities (gender, emotion, etc.)
3. Implement user accounts for saving analysis history
4. Add API endpoints for programmatic access

## License

This project is licensed under the MIT License - see the LICENSE file for details.