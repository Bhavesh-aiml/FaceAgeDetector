import { useState, useRef } from 'react';
import { Card, Button, Form } from 'react-bootstrap';

const ImageUploader = ({ onImageUpload, isLoading }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current.click();
  };

  const processFile = (file) => {
    // Check if file is an image
    if (!file.type.match('image.*')) {
      alert('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      onImageUpload(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <Card className="upload-container">
      <Card.Body>
        <div 
          className={`drop-zone ${isDragging ? 'dragover' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <p className="mb-2">Drag and drop your image here</p>
          <p className="mb-3">or</p>
          <Button variant="outline-secondary" disabled={isLoading}>
            Choose File
          </Button>
          <Form.Control
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            accept="image/*"
            style={{ display: 'none' }}
            disabled={isLoading}
          />
        </div>
      </Card.Body>
    </Card>
  );
};

export default ImageUploader;