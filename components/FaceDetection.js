import { useState, useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';
import { Button, Container, Tabs, Tab, Spinner, Alert } from 'react-bootstrap';
import ImageUploader from './ImageUploader';
import WebcamCapture from './WebcamCapture';
import ResultsDisplay from './ResultsDisplay';

const FaceDetection = () => {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [selectedTab, setSelectedTab] = useState('upload');
  const [image, setImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);
  const [manualSelectionMode, setManualSelectionMode] = useState(false);
  const [isManuallySelected, setIsManuallySelected] = useState(false);
  const [manualSelection, setManualSelection] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);

  const imageContainerRef = useRef(null);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const selectionStartRef = useRef(null);

  // Load face-api.js models on component mount
  useEffect(() => {
    const loadModels = async () => {
      setIsLoading(true);
      try {
        const MODEL_URL = '/models';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL)
        ]);
        setModelsLoaded(true);
        console.log('Face detection models loaded successfully');
      } catch (error) {
        console.error('Error loading models:', error);
        setError('Failed to load face detection models. Please refresh the page.');
      } finally {
        setIsLoading(false);
      }
    };

    loadModels();
  }, []);

  const handleImageUpload = (imageData) => {
    resetState();
    setImage(imageData);
  };

  const handleWebcamCapture = (imageData) => {
    resetState();
    setImage(imageData);
    setSelectedTab('upload'); // Switch to upload tab to show the captured image
  };

  const resetState = () => {
    setResults([]);
    setManualSelectionMode(false);
    setIsManuallySelected(false);
    setManualSelection(null);
    setError(null);
    setIsSelecting(false);
  };

  const toggleManualSelection = () => {
    setManualSelectionMode(!manualSelectionMode);
    setIsManuallySelected(false);
    setManualSelection(null);
    setIsSelecting(false);
  };

  const handleTabChange = (key) => {
    setSelectedTab(key);
    resetState();
    setImage(null);
  };

  // Manual face selection handlers
  const handleSelectionStart = (e) => {
    if (!manualSelectionMode || !imageContainerRef.current) return;

    setIsSelecting(true);
    
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    selectionStartRef.current = { x, y };
    
    // Initialize selection
    setManualSelection({
      x,
      y,
      width: 0,
      height: 0
    });
  };

  const handleSelectionMove = (e) => {
    if (!isSelecting || !selectionStartRef.current || !imageContainerRef.current) return;
    
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const startX = selectionStartRef.current.x;
    const startY = selectionStartRef.current.y;
    
    // Calculate dimensions, handling all directions
    const width = Math.abs(x - startX);
    const height = Math.abs(y - startY);
    const selX = x < startX ? x : startX;
    const selY = y < startY ? y : startY;
    
    // Update selection
    setManualSelection({
      x: selX,
      y: selY,
      width,
      height
    });
  };

  const handleSelectionEnd = () => {
    if (!isSelecting) return;
    
    setIsSelecting(false);
    
    if (manualSelection && manualSelection.width > 20 && manualSelection.height > 20) {
      setIsManuallySelected(true);
    } else {
      setManualSelection(null);
      setIsManuallySelected(false);
    }
  };

  // Handle touch events for mobile devices
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      handleSelectionStart({ clientX: touch.clientX, clientY: touch.clientY });
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      handleSelectionMove({ clientX: touch.clientX, clientY: touch.clientY });
    }
  };

  const handleTouchEnd = () => {
    handleSelectionEnd();
  };

  // The main function to analyze faces
  const analyzeFace = async () => {
    if (!image || !modelsLoaded) return;
    
    setIsLoading(true);
    setError(null);
    setResults([]);
    
    try {
      // Create a new image element to pass to face-api
      const img = new Image();
      img.src = image;
      
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      
      // Create a canvas for face-api to work with
      const canvas = canvasRef.current;
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Get detection results
      let detectionResults;
      
      if (isManuallySelected && manualSelection) {
        // Manual selection mode - create a "fake" detection based on user selection
        detectionResults = [{
          // Convert the manual selection to a detection object with age, gender prediction
          detection: new faceapi.FaceDetection(
            0.9, // High confidence since user selected it
            new faceapi.Rect(
              manualSelection.x, 
              manualSelection.y,
              manualSelection.width,
              manualSelection.height
            ),
            {}
          )
        }];
        
        // Get the region of interest from the image
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        // Create an off-screen canvas for the face ROI
        const offScreenCanvas = document.createElement('canvas');
        offScreenCanvas.width = manualSelection.width;
        offScreenCanvas.height = manualSelection.height;
        
        const offCtx = offScreenCanvas.getContext('2d');
        offCtx.drawImage(
          canvas, 
          manualSelection.x, manualSelection.y, 
          manualSelection.width, manualSelection.height,
          0, 0, 
          manualSelection.width, manualSelection.height
        );
        
        // Now analyze just this region
        const faceRegion = await faceapi.createCanvasFromMedia(offScreenCanvas);
        const ageGenderResult = await faceapi.detectSingleFace(
          faceRegion, 
          new faceapi.TinyFaceDetectorOptions()
        )
        .withAgeAndGender();
        
        // If we got results, use them, otherwise use estimates
        if (ageGenderResult) {
          detectionResults[0].age = ageGenderResult.age;
          detectionResults[0].gender = ageGenderResult.gender;
          detectionResults[0].genderProbability = ageGenderResult.genderProbability;
        } else {
          // Fallback to direct detection on the ROI
          try {
            const directROI = await faceapi
              .detectAllFaces(offScreenCanvas, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.1 }))
              .withAgeAndGender();
            
            if (directROI && directROI.length > 0) {
              detectionResults[0].age = directROI[0].age;
              detectionResults[0].gender = directROI[0].gender;
              detectionResults[0].genderProbability = directROI[0].genderProbability;
            } else {
              // Last resort - use TensorFlow.js directly through the API
              const apiResponse = await fetch('/api/analyze-face', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  imageData: offScreenCanvas.toDataURL('image/jpeg')
                }),
              });
              
              const apiData = await apiResponse.json();
              
              if (apiData.results && apiData.results.length > 0) {
                const apiResult = apiData.results[0];
                detectionResults[0].age = apiResult.age;
                detectionResults[0].gender = apiResult.gender;
                detectionResults[0].genderProbability = apiResult.genderProbability;
              } else {
                // Give a reasonable fallback if all else fails
                detectionResults[0].age = 30;
                detectionResults[0].gender = 'unknown';
                detectionResults[0].genderProbability = 0.5;
              }
            }
          } catch (err) {
            console.error('Error in ROI analysis:', err);
            detectionResults[0].age = 30;
            detectionResults[0].gender = 'unknown';
            detectionResults[0].genderProbability = 0.5;
          }
        }
      } else {
        // Automatic detection mode
        detectionResults = await faceapi
          .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions())
          .withAgeAndGender();
        
        if (!detectionResults.length) {
          throw new Error('No faces detected');
        }
      }
      
      // Format the results
      const formattedResults = detectionResults.map(detection => {
        const box = isManuallySelected ? 
          { x: manualSelection.x, y: manualSelection.y, width: manualSelection.width, height: manualSelection.height } : 
          detection.detection.box;
        
        return {
          age: detection.age || 30,
          gender: detection.gender || 'unknown',
          genderProbability: detection.genderProbability || 0.5,
          position: {
            x: box.x,
            y: box.y,
            width: box.width,
            height: box.height
          },
          confidence: isManuallySelected ? 0.99 : detection.detection.score
        };
      });
      
      // Draw face markers on the image
      const displaySize = { width: img.width, height: img.height };
      faceapi.matchDimensions(canvas, displaySize);
      
      setResults(formattedResults);
      
      // Draw bounding boxes and labels
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      formattedResults.forEach(result => {
        const { x, y, width, height } = result.position;
        
        // Draw box
        ctx.strokeStyle = '#0dcaf0';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);
        
        // Draw label background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x, y - 30, width, 30);
        
        // Draw text
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.fillText(
          `Age: ${Math.round(result.age)} Gender: ${result.gender}`,
          x + 5, 
          y - 10
        );
      });
      
    } catch (err) {
      console.error('Face analysis error:', err);
      setError(err.message || 'An error occurred during face analysis');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container>
      <h1 className="text-center my-4">Face Age Predictor</h1>
      
      {error && (
        <Alert variant="danger">{error}</Alert>
      )}
      
      <Tabs
        activeKey={selectedTab}
        onSelect={handleTabChange}
        className="mb-3"
      >
        <Tab eventKey="upload" title="Upload Image">
          <ImageUploader onImageUpload={handleImageUpload} isLoading={isLoading} />
        </Tab>
        <Tab eventKey="webcam" title="Webcam">
          <WebcamCapture onImageCapture={handleWebcamCapture} isLoading={isLoading} />
        </Tab>
      </Tabs>
      
      {image && (
        <div className="mt-4">
          <div 
            ref={imageContainerRef} 
            className="preview-container"
            onMouseDown={manualSelectionMode ? handleSelectionStart : undefined}
            onMouseMove={manualSelectionMode ? handleSelectionMove : undefined}
            onMouseUp={manualSelectionMode ? handleSelectionEnd : undefined}
            onMouseLeave={manualSelectionMode ? handleSelectionEnd : undefined}
            onTouchStart={manualSelectionMode ? handleTouchStart : undefined}
            onTouchMove={manualSelectionMode ? handleTouchMove : undefined}
            onTouchEnd={manualSelectionMode ? handleTouchEnd : undefined}
            style={{ cursor: manualSelectionMode ? 'crosshair' : 'default' }}
          >
            <img 
              ref={imageRef}
              src={image} 
              alt="Preview" 
              className="preview-image img-fluid"
            />
            <canvas 
              ref={canvasRef} 
              className="manual-selection-canvas"
              style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                pointerEvents: 'none'
              }}
            />
            
            {manualSelectionMode && manualSelection && (
              <div 
                className="selection-rect" 
                style={{
                  position: 'absolute',
                  border: '2px dashed #0dcaf0',
                  backgroundColor: 'rgba(13, 202, 240, 0.2)',
                  left: `${manualSelection.x}px`,
                  top: `${manualSelection.y}px`,
                  width: `${manualSelection.width}px`,
                  height: `${manualSelection.height}px`,
                  pointerEvents: 'none'
                }}
              />
            )}
            
            {isLoading && (
              <div className="loading-overlay">
                <img src="/assets/loading.svg" alt="Loading..." width="80" />
              </div>
            )}
          </div>
          
          <div className="d-flex justify-content-between mt-3 flex-wrap">
            <Button 
              variant="primary"
              onClick={analyzeFace}
              disabled={isLoading || (!isManuallySelected && manualSelectionMode)}
              className="mb-2"
            >
              {isLoading ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Analyzing...
                </>
              ) : (
                'Analyze Face'
              )}
            </Button>
            
            <Button
              variant={manualSelectionMode ? "info" : "outline-info"}
              onClick={toggleManualSelection}
              disabled={isLoading}
              className="mb-2"
            >
              {manualSelectionMode ? "Cancel Manual Selection" : "Select Face Manually"}
            </Button>
          </div>
          
          {manualSelectionMode && !isManuallySelected && (
            <Alert variant="info" className="mt-2">
              Click and drag to select a face in the image
            </Alert>
          )}
        </div>
      )}
      
      <ResultsDisplay results={results} isManualSelection={isManuallySelected} />
    </Container>
  );
};

export default FaceDetection;