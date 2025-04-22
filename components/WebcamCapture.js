import { useState, useRef, useEffect } from 'react';
import { Card, Button, ButtonGroup } from 'react-bootstrap';

const WebcamCapture = ({ onImageCapture, isLoading }) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [liveDetection, setLiveDetection] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        const tracks = streamRef.current.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const constraints = { 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
        setLiveDetection(false);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      alert('Could not access your camera. Please make sure you have granted permission.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach(track => track.stop());
      streamRef.current = null;
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      
      setCameraActive(false);
      setLiveDetection(false);
    }
  };

  const toggleCamera = () => {
    if (cameraActive) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  const toggleLiveDetection = () => {
    if (liveDetection) {
      setLiveDetection(false);
    } else {
      setLiveDetection(true);
      // The actual live detection is handled by the parent component
      // based on the liveDetection state
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to data URL and pass to parent
    const imageData = canvas.toDataURL('image/jpeg');
    onImageCapture(imageData);
  };

  useEffect(() => {
    // This effect forwards the live detection state to the parent component
    if (liveDetection && cameraActive && videoRef.current) {
      // We'll let the parent component (FaceDetection) know
      // that live detection is active and it should process video frames
      const captureFrame = () => {
        if (!liveDetection || !cameraActive) return;
        
        capturePhoto();
        
        // Request the next frame
        requestAnimationFrame(captureFrame);
      };
      
      // Start capturing frames
      requestAnimationFrame(captureFrame);
    }
  }, [liveDetection, cameraActive]);

  return (
    <Card className="webcam-container">
      <Card.Body>
        <div className="webcam-wrapper position-relative">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted
            className="w-100"
            style={{ display: cameraActive ? 'block' : 'none' }}
          />
          {!cameraActive && (
            <div className="text-center p-5 bg-light rounded">
              <p>Camera is turned off</p>
              <p>Click the "Start Camera" button to enable webcam</p>
            </div>
          )}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
        
        <div className="mt-3 d-flex flex-wrap justify-content-between">
          <ButtonGroup className="mb-2">
            <Button 
              variant={cameraActive ? "outline-danger" : "outline-success"} 
              onClick={toggleCamera}
              disabled={isLoading}
            >
              {cameraActive ? "Stop Camera" : "Start Camera"}
            </Button>
            
            {cameraActive && (
              <Button 
                variant="outline-primary" 
                onClick={capturePhoto}
                disabled={isLoading || !cameraActive}
              >
                Capture Photo
              </Button>
            )}
          </ButtonGroup>
          
          {cameraActive && (
            <Button 
              variant={liveDetection ? "info" : "outline-info"}
              onClick={toggleLiveDetection}
              disabled={isLoading || !cameraActive}
              className="mb-2"
            >
              {liveDetection ? "Stop Live Detection" : "Live Detection"}
            </Button>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default WebcamCapture;