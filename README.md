# Next.js Face Age Predictor

A web application that uses advanced face detection and age prediction using Next.js and face-api.js (built on TensorFlow.js).

## Features

- Upload image files or use your webcam to capture faces
- Automatic face detection using TensorFlow.js and face-api.js
- Manual face selection when automatic detection fails
- Age and gender prediction for each detected face
- Real-time webcam integration with live detection
- Responsive design that works on mobile and desktop

## Technologies Used

- **Frontend**: Next.js, React, Bootstrap
- **Face Detection**: face-api.js, TensorFlow.js
- **UI Components**: React-Bootstrap

## Usage

### Image Upload

1. Visit the homepage
2. Choose "Upload Image" tab
3. Drag and drop an image file or click to select from your device
4. Once the image is loaded, click "Analyze Face" to detect faces and predict ages
5. If automatic detection misses faces, use "Select Face Manually" to draw a rectangle around the face

### Webcam

1. Navigate to the "Webcam" tab
2. Click "Start Camera" to activate your device's camera (you may need to grant permission)
3. Either click "Capture Photo" to take a still image for analysis, or
4. Click "Live Detection" for real-time continuous face detection and age prediction

### Manual Face Selection

If automatic face detection doesn't work correctly:

1. After loading an image, click the "Select Face Manually" button
2. Draw a rectangle around the face by clicking and dragging
3. Once the face is selected, click "Analyze Face" to process just that area
4. The results will be marked as "Manual Selection"

## Development

To run the application locally:

```bash
npm install
npm run dev
```

The application will be available at http://localhost:3000.

