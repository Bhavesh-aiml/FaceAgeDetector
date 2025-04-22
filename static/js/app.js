document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const fileInput = document.getElementById('file-input');
    const uploadDropzone = document.getElementById('upload-dropzone');
    const webcamElement = document.getElementById('webcam');
    const startWebcamBtn = document.getElementById('start-webcam-btn');
    const captureBtn = document.getElementById('capture-btn');
    const analyzeBtn = document.getElementById('analyze-btn');
    const resetBtn = document.getElementById('reset-btn');
    const previewSection = document.getElementById('preview-section');
    const previewImage = document.getElementById('preview-image');
    const faceMarkers = document.getElementById('face-markers');
    const loadingOverlay = document.getElementById('loading-overlay');
    const analysisResults = document.getElementById('analysis-results');
    const resultsContent = document.getElementById('results-content');
    const errorMessage = document.getElementById('error-message');
    const webcamTab = document.getElementById('webcam-tab');
    const uploadTab = document.getElementById('upload-tab');

    // Variables
    let stream = null;
    let imageData = null;
    
    // Event Listeners
    uploadDropzone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
    uploadDropzone.addEventListener('dragover', handleDragOver);
    uploadDropzone.addEventListener('dragleave', handleDragLeave);
    uploadDropzone.addEventListener('drop', handleFileDrop);
    startWebcamBtn.addEventListener('click', toggleWebcam);
    captureBtn.addEventListener('click', capturePhoto);
    analyzeBtn.addEventListener('click', analyzeFace);
    resetBtn.addEventListener('click', resetApp);
    webcamTab.addEventListener('click', handleWebcamTabClick);
    uploadTab.addEventListener('click', stopWebcam);

    // File Upload Handlers
    function handleFileSelect(e) {
        const file = e.target.files[0];
        if (file && isImageFile(file)) {
            processSelectedFile(file);
        }
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        uploadDropzone.classList.add('dragover');
    }

    function handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        uploadDropzone.classList.remove('dragover');
    }

    function handleFileDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        uploadDropzone.classList.remove('dragover');
        
        const file = e.dataTransfer.files[0];
        if (file && isImageFile(file)) {
            processSelectedFile(file);
        }
    }

    function isImageFile(file) {
        const acceptedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
        if (!acceptedTypes.includes(file.type)) {
            showError('Please upload an image file (JPEG, PNG, or GIF).');
            return false;
        }
        return true;
    }

    function processSelectedFile(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            imageData = e.target.result;
            displayPreview(imageData);
        };
        reader.readAsDataURL(file);
    }

    // Webcam Handlers
    function handleWebcamTabClick() {
        // Don't automatically start webcam, just prep the UI
        captureBtn.disabled = true;
    }

    function toggleWebcam() {
        if (stream) {
            stopWebcam();
            startWebcamBtn.innerHTML = '<i class="fas fa-video me-2"></i>Start Camera';
            captureBtn.disabled = true;
        } else {
            startWebcam();
        }
    }

    function startWebcam() {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(function(mediaStream) {
                    stream = mediaStream;
                    webcamElement.srcObject = stream;
                    startWebcamBtn.innerHTML = '<i class="fas fa-video-slash me-2"></i>Stop Camera';
                    captureBtn.disabled = false;
                })
                .catch(function(err) {
                    console.error('Error accessing webcam:', err);
                    showError('Could not access the webcam. Please make sure you have granted permission.');
                });
        } else {
            showError('Your browser does not support webcam access.');
        }
    }

    function stopWebcam() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            webcamElement.srcObject = null;
            stream = null;
            startWebcamBtn.innerHTML = '<i class="fas fa-video me-2"></i>Start Camera';
            captureBtn.disabled = true;
        }
    }

    function capturePhoto() {
        if (!stream) return;
        
        // Create a canvas element
        const canvas = document.createElement('canvas');
        canvas.width = webcamElement.videoWidth;
        canvas.height = webcamElement.videoHeight;
        
        // Draw the video frame to the canvas
        const ctx = canvas.getContext('2d');
        ctx.drawImage(webcamElement, 0, 0);
        
        // Convert canvas to base64 image
        imageData = canvas.toDataURL('image/jpeg');
        displayPreview(imageData);
    }

    // Preview and Analysis
    function displayPreview(src) {
        previewImage.src = src;
        previewSection.classList.remove('d-none');
        analyzeBtn.disabled = false;
        clearResults();
        // Remove any face markers
        faceMarkers.innerHTML = '';
    }

    function analyzeFace() {
        if (!imageData) return;
        
        // Show loading overlay
        loadingOverlay.classList.remove('d-none');
        analyzeBtn.disabled = true;
        clearResults();
        
        // Send the image to the server for processing
        fetch('/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ image: imageData })
        })
        .then(response => response.json())
        .then(data => {
            // Hide loading overlay
            loadingOverlay.classList.add('d-none');
            
            if (data.error) {
                showError(data.error);
                return;
            }
            
            // Display results
            displayResults(data.results);
        })
        .catch(error => {
            console.error('Error:', error);
            loadingOverlay.classList.add('d-none');
            showError('An error occurred while analyzing the image. Please try again.');
        });
    }

    function displayResults(results) {
        analysisResults.classList.remove('d-none');
        
        // Clear previous markers
        faceMarkers.innerHTML = '';
        
        // Generate results HTML and face markers
        if (results.length === 0) {
            resultsContent.innerHTML = '<div class="alert alert-warning">No faces were detected in the image.</div>';
            return;
        }
        
        let resultsHTML = '';
        
        // Create card for each detected face
        results.forEach((result, index) => {
            // Add face marker
            const marker = document.createElement('div');
            marker.className = 'face-marker';
            marker.style.left = `${result.position.x}px`;
            marker.style.top = `${result.position.y}px`;
            marker.style.width = `${result.position.width}px`;
            marker.style.height = `${result.position.height}px`;
            
            // Add face number label
            const label = document.createElement('div');
            label.className = 'face-label';
            label.textContent = `${index + 1}`;
            marker.appendChild(label);
            
            faceMarkers.appendChild(marker);
            
            // Create result card
            resultsHTML += `
                <div class="card mb-3">
                    <div class="card-body">
                        <h6 class="card-title">Face #${index + 1}</h6>
                        <div class="d-flex align-items-center">
                            <div class="display-4 me-3">${Math.round(result.age)}</div>
                            <div class="text-muted">years old</div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        resultsContent.innerHTML = resultsHTML;
        
        // Adjust marker positions
        adjustMarkerPositions();
    }

    function adjustMarkerPositions() {
        // Get the natural dimensions of the image
        const imgNaturalWidth = previewImage.naturalWidth;
        const imgNaturalHeight = previewImage.naturalHeight;
        
        // Get the displayed dimensions of the image
        const imgDisplayWidth = previewImage.offsetWidth;
        const imgDisplayHeight = previewImage.offsetHeight;
        
        // Calculate the scale factors
        const widthScale = imgDisplayWidth / imgNaturalWidth;
        const heightScale = imgDisplayHeight / imgNaturalHeight;
        
        // Adjust each marker
        const markers = document.querySelectorAll('.face-marker');
        markers.forEach(marker => {
            const x = parseInt(marker.style.left);
            const y = parseInt(marker.style.top);
            const width = parseInt(marker.style.width);
            const height = parseInt(marker.style.height);
            
            marker.style.left = `${x * widthScale}px`;
            marker.style.top = `${y * heightScale}px`;
            marker.style.width = `${width * widthScale}px`;
            marker.style.height = `${height * heightScale}px`;
        });
    }

    // Utility Functions
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('d-none');
    }

    function clearResults() {
        analysisResults.classList.add('d-none');
        errorMessage.classList.add('d-none');
    }

    function resetApp() {
        // Reset file input
        fileInput.value = '';
        
        // Stop webcam if active
        stopWebcam();
        
        // Clear preview and results
        imageData = null;
        previewSection.classList.add('d-none');
        clearResults();
        
        // Reset buttons
        analyzeBtn.disabled = true;
    }

    // Handle window resize to adjust face markers
    window.addEventListener('resize', function() {
        if (previewSection.classList.contains('d-none')) return;
        
        // Give the image time to resize before adjusting markers
        setTimeout(adjustMarkerPositions, 100);
    });
});
