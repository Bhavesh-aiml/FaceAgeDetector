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
        
        // Check browser compatibility up front
        if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
            showError('Your browser does not support webcam access. Please try a modern browser like Chrome or Firefox.');
            startWebcamBtn.disabled = true;
        }
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
            // Request video with preferred settings
            navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: "user" // Prefer front camera if available
                }
            })
            .then(function(mediaStream) {
                stream = mediaStream;
                webcamElement.srcObject = stream;
                webcamElement.onloadedmetadata = function(e) {
                    webcamElement.play();
                    startWebcamBtn.innerHTML = '<i class="fas fa-video-slash me-2"></i>Stop Camera';
                    captureBtn.disabled = false;
                    
                    // Add live detection option
                    let liveDetectionBtn = document.getElementById('live-detection-btn');
                    if (!liveDetectionBtn) {
                        liveDetectionBtn = document.createElement('button');
                        liveDetectionBtn.id = 'live-detection-btn';
                        liveDetectionBtn.className = 'btn btn-info ms-2';
                        liveDetectionBtn.innerHTML = '<i class="fas fa-magic me-2"></i>Live Detection';
                        liveDetectionBtn.onclick = toggleLiveDetection;
                        
                        // Add it after capture button
                        captureBtn.parentNode.appendChild(liveDetectionBtn);
                    } else {
                        liveDetectionBtn.style.display = 'inline-block';
                    }
                };
            })
            .catch(function(err) {
                console.error('Error accessing webcam:', err);
                if (err.name === 'NotAllowedError') {
                    showError('Webcam access denied. Please allow camera access in your browser settings.');
                } else if (err.name === 'NotFoundError') {
                    showError('No webcam found. Please connect a webcam and try again.');
                } else {
                    showError('Could not access the webcam: ' + err.message);
                }
            });
        } else {
            showError('Your browser does not support webcam access.');
        }
    }

    function stopWebcam() {
        if (stream) {
            // Stop all tracks
            stream.getTracks().forEach(track => track.stop());
            webcamElement.srcObject = null;
            stream = null;
            
            // Update UI
            startWebcamBtn.innerHTML = '<i class="fas fa-video me-2"></i>Start Camera';
            captureBtn.disabled = true;
            
            // Hide live detection button
            const liveDetectionBtn = document.getElementById('live-detection-btn');
            if (liveDetectionBtn) {
                liveDetectionBtn.style.display = 'none';
            }
            
            // Stop live detection if active
            stopLiveDetection();
        }
    }

    // Live face detection variables
    let isLiveDetectionActive = false;
    let liveDetectionInterval = null;

    function toggleLiveDetection() {
        const liveDetectionBtn = document.getElementById('live-detection-btn');
        
        if (isLiveDetectionActive) {
            stopLiveDetection();
            liveDetectionBtn.innerHTML = '<i class="fas fa-magic me-2"></i>Live Detection';
            liveDetectionBtn.classList.remove('btn-danger');
            liveDetectionBtn.classList.add('btn-info');
        } else {
            startLiveDetection();
            liveDetectionBtn.innerHTML = '<i class="fas fa-stop me-2"></i>Stop Live Detection';
            liveDetectionBtn.classList.remove('btn-info');
            liveDetectionBtn.classList.add('btn-danger');
        }
    }

    function startLiveDetection() {
        if (!stream || isLiveDetectionActive) return;
        
        isLiveDetectionActive = true;
        
        // Show preview section if hidden
        previewSection.classList.remove('d-none');
        
        // Run detection every 1 second
        liveDetectionInterval = setInterval(() => {
            captureAndAnalyze();
        }, 1000);
        
        // Initial capture and analysis
        captureAndAnalyze();
    }

    function stopLiveDetection() {
        if (liveDetectionInterval) {
            clearInterval(liveDetectionInterval);
            liveDetectionInterval = null;
        }
        isLiveDetectionActive = false;
    }

    function captureAndAnalyze() {
        // Capture current frame
        capturePhoto();
        
        // Analyze automatically
        analyzeFace();
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

    // Manual face selection variables
    let isManualSelectionActive = false;
    let manualSelectionStart = { x: 0, y: 0 };
    let manualSelectionCurrent = { x: 0, y: 0 };
    let selectionBox = null;

    // Preview and Analysis
    function displayPreview(src) {
        previewImage.src = src;
        previewSection.classList.remove('d-none');
        analyzeBtn.disabled = false;
        clearResults();
        // Remove any face markers
        faceMarkers.innerHTML = '';
        
        // Add manual selection button if not already present
        let manualSelectionBtn = document.getElementById('manual-selection-btn');
        if (!manualSelectionBtn) {
            const buttonContainer = analyzeBtn.parentNode;
            
            manualSelectionBtn = document.createElement('button');
            manualSelectionBtn.id = 'manual-selection-btn';
            manualSelectionBtn.className = 'btn btn-outline-secondary ms-2';
            manualSelectionBtn.innerHTML = '<i class="fas fa-crop-alt me-2"></i>Select Face Manually';
            manualSelectionBtn.onclick = toggleManualSelection;
            
            // Insert after analyze button
            buttonContainer.insertBefore(manualSelectionBtn, analyzeBtn.nextSibling);
        } else {
            manualSelectionBtn.style.display = 'inline-block';
        }
    }
    
    // Manual face selection functions
    function toggleManualSelection() {
        const manualSelectionBtn = document.getElementById('manual-selection-btn');
        const imageContainer = document.querySelector('.image-container');
        
        if (isManualSelectionActive) {
            // Deactivate manual selection
            isManualSelectionActive = false;
            manualSelectionBtn.innerHTML = '<i class="fas fa-crop-alt me-2"></i>Select Face Manually';
            manualSelectionBtn.classList.remove('btn-warning');
            manualSelectionBtn.classList.add('btn-outline-secondary');
            
            // Remove event listeners
            previewImage.removeEventListener('mousedown', startManualSelection);
            previewImage.removeEventListener('mousemove', updateManualSelection);
            previewImage.removeEventListener('mouseup', endManualSelection);
            previewImage.removeEventListener('touchstart', handleTouchStart);
            previewImage.removeEventListener('touchmove', handleTouchMove);
            previewImage.removeEventListener('touchend', handleTouchEnd);
            
            // Remove selection style
            previewImage.style.cursor = 'default';
            imageContainer.classList.remove('manual-selection-active');
            
            // Remove instructions if present
            const instructions = document.getElementById('selection-instructions');
            if (instructions) {
                instructions.remove();
            }
        } else {
            // Activate manual selection
            isManualSelectionActive = true;
            manualSelectionBtn.innerHTML = '<i class="fas fa-times me-2"></i>Cancel Selection';
            manualSelectionBtn.classList.remove('btn-outline-secondary');
            manualSelectionBtn.classList.add('btn-warning');
            
            // Add event listeners
            previewImage.addEventListener('mousedown', startManualSelection);
            previewImage.addEventListener('mousemove', updateManualSelection);
            previewImage.addEventListener('mouseup', endManualSelection);
            previewImage.addEventListener('touchstart', handleTouchStart);
            previewImage.addEventListener('touchmove', handleTouchMove);
            previewImage.addEventListener('touchend', handleTouchEnd);
            
            // Change cursor and add selection style
            previewImage.style.cursor = 'crosshair';
            imageContainer.classList.add('manual-selection-active');
            
            // Add instructions
            const instructions = document.createElement('div');
            instructions.id = 'selection-instructions';
            instructions.className = 'alert alert-info mt-2';
            instructions.innerHTML = '<strong>Instructions:</strong> Click and drag to select a face on the image. After selecting, click "Analyze Face" to process your selection.';
            imageContainer.after(instructions);
            
            // Clear any existing selection
            clearManualSelection();
        }
    }
    
    function startManualSelection(e) {
        e.preventDefault();
        if (!isManualSelectionActive) return;
        
        // Get mouse coordinates relative to the image
        const rect = previewImage.getBoundingClientRect();
        manualSelectionStart.x = e.clientX - rect.left;
        manualSelectionStart.y = e.clientY - rect.top;
        
        // Create selection box if it doesn't exist
        if (!selectionBox) {
            selectionBox = document.createElement('div');
            selectionBox.className = 'manual-selection-box';
            document.querySelector('.image-container').appendChild(selectionBox);
        }
        
        // Initialize selection box
        selectionBox.style.left = `${manualSelectionStart.x}px`;
        selectionBox.style.top = `${manualSelectionStart.y}px`;
        selectionBox.style.width = '0px';
        selectionBox.style.height = '0px';
        selectionBox.style.display = 'block';
    }
    
    function updateManualSelection(e) {
        if (!isManualSelectionActive || !selectionBox || selectionBox.style.display === 'none') return;
        
        e.preventDefault();
        
        // Get current mouse position
        const rect = previewImage.getBoundingClientRect();
        manualSelectionCurrent.x = e.clientX - rect.left;
        manualSelectionCurrent.y = e.clientY - rect.top;
        
        // Calculate width and height
        const width = Math.abs(manualSelectionCurrent.x - manualSelectionStart.x);
        const height = Math.abs(manualSelectionCurrent.y - manualSelectionStart.y);
        
        // Calculate left and top (in case of dragging from right-to-left or bottom-to-top)
        const left = Math.min(manualSelectionStart.x, manualSelectionCurrent.x);
        const top = Math.min(manualSelectionStart.y, manualSelectionCurrent.y);
        
        // Update selection box
        selectionBox.style.left = `${left}px`;
        selectionBox.style.top = `${top}px`;
        selectionBox.style.width = `${width}px`;
        selectionBox.style.height = `${height}px`;
    }
    
    function endManualSelection(e) {
        if (!isManualSelectionActive) return;
        e.preventDefault();
        
        // We don't remove the selection box, as we want it to remain visible
        // The box will be used for the face analysis
    }
    
    // Touch event handlers for mobile devices
    function handleTouchStart(e) {
        if (!isManualSelectionActive) return;
        
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        startManualSelection(mouseEvent);
    }
    
    function handleTouchMove(e) {
        if (!isManualSelectionActive) return;
        e.preventDefault(); // Prevent scrolling while selecting
        
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        updateManualSelection(mouseEvent);
    }
    
    function handleTouchEnd(e) {
        if (!isManualSelectionActive) return;
        
        const mouseEvent = new MouseEvent('mouseup', {});
        endManualSelection(mouseEvent);
    }
    
    function clearManualSelection() {
        if (selectionBox) {
            selectionBox.style.display = 'none';
        }
    }

    function analyzeFace() {
        if (!imageData) return;
        
        // Show loading overlay
        loadingOverlay.classList.remove('d-none');
        analyzeBtn.disabled = true;
        clearResults();
        
        // Check if we're using manual selection
        let requestBody = { image: imageData };
        
        if (isManualSelectionActive && selectionBox && selectionBox.style.display !== 'none') {
            // Get the selection box coordinates for the displayed image
            const selectionRect = {
                x: parseInt(selectionBox.style.left),
                y: parseInt(selectionBox.style.top),
                width: parseInt(selectionBox.style.width),
                height: parseInt(selectionBox.style.height)
            };
            
            // Calculate the ratio between the displayed image and the natural image
            const displayedWidth = previewImage.offsetWidth;
            const displayedHeight = previewImage.offsetHeight;
            const naturalWidth = previewImage.naturalWidth;
            const naturalHeight = previewImage.naturalHeight;
            
            const widthRatio = naturalWidth / displayedWidth;
            const heightRatio = naturalHeight / displayedHeight;
            
            // Convert the selection coordinates to the natural image coordinates
            const naturalSelectionRect = {
                x: Math.round(selectionRect.x * widthRatio),
                y: Math.round(selectionRect.y * heightRatio),
                width: Math.round(selectionRect.width * widthRatio),
                height: Math.round(selectionRect.height * heightRatio)
            };
            
            // Add the manual selection to the request
            requestBody.manual_selection = naturalSelectionRect;
            console.log('Using manual selection:', naturalSelectionRect);
        }
        
        // Send the image to the server for processing
        fetch('/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        })
        .then(response => response.json())
        .then(data => {
            // Hide loading overlay
            loadingOverlay.classList.add('d-none');
            
            if (data.error) {
                showError(data.error);
                return;
            }
            
            // If it was a manual selection, deactivate selection mode
            if (isManualSelectionActive) {
                toggleManualSelection();
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
                <div class="card mb-3 ${result.manual ? 'border-warning' : ''}">
                    <div class="card-body">
                        <h6 class="card-title">
                            Face #${index + 1}
                            ${result.manual ? '<span class="badge bg-warning text-dark ms-2">Manual Selection</span>' : ''}
                        </h6>
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
        
        // Deactivate manual selection if active
        if (isManualSelectionActive) {
            toggleManualSelection();
        }
        
        // Clear manual selection box
        clearManualSelection();
        
        // Reset buttons
        analyzeBtn.disabled = true;
        
        // Hide manual selection button if it exists
        const manualSelectionBtn = document.getElementById('manual-selection-btn');
        if (manualSelectionBtn) {
            manualSelectionBtn.style.display = 'none';
        }
    }

    // Handle window resize to adjust face markers
    window.addEventListener('resize', function() {
        if (previewSection.classList.contains('d-none')) return;
        
        // Give the image time to resize before adjusting markers
        setTimeout(adjustMarkerPositions, 100);
    });
});
