import os
import socket
import subprocess
import sys
import time
import threading
import atexit
from urllib.request import Request, urlopen
from urllib.error import URLError
import shutil
import threading

# Create a dedicated Flask server for model files
from flask import Flask, request, Response, send_from_directory, send_file
import socket
import os
import json

app = Flask(__name__, static_folder='static')

# Create the static/models directory if it doesn't exist
os.makedirs(os.path.join(app.static_folder, 'models'), exist_ok=True)

# Copy model files to Flask static directory for direct access
def copy_model_files():
    src_dir = os.path.abspath('./public/models')
    dest_dir = os.path.join(app.static_folder, 'models')
    
    # Ensure the destination directory exists
    os.makedirs(dest_dir, exist_ok=True)
    
    # List of model files to copy
    model_files = [
        'tiny_face_detector_model-weights_manifest.json',
        'tiny_face_detector_model-shard1',
        'face_landmark_68_model-weights_manifest.json',
        'face_landmark_68_model-shard1',
        'age_gender_model-weights_manifest.json',
        'age_gender_model-shard1'
    ]
    
    for filename in model_files:
        src_path = os.path.join(src_dir, filename)
        dest_path = os.path.join(dest_dir, filename)
        
        if os.path.exists(src_path):
            print(f"Copying {filename} to Flask static directory")
            shutil.copy2(src_path, dest_path)
        else:
            print(f"Warning: Model file {filename} not found at {src_path}")

# Copy the model files at startup
copy_model_files()

# Start Next.js directly
print("Starting Next.js development server...")
next_process = subprocess.Popen(
    ["npx", "next", "dev", "-p", "3000"],
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True,
    bufsize=1
)

# Capture and print Next.js logs
def log_output(stream, prefix):
    for line in iter(stream.readline, ''):
        line_str = line.strip()
        print(f"{prefix}: {line_str}")

stdout_thread = threading.Thread(target=log_output, args=(next_process.stdout, "Next.js"))
stderr_thread = threading.Thread(target=log_output, args=(next_process.stderr, "Next.js Error"))
stdout_thread.daemon = True
stderr_thread.daemon = True
stdout_thread.start()
stderr_thread.start()

# Ensure process is terminated on exit
def cleanup():
    if next_process:
        print("Terminating Next.js process...")
        next_process.terminate()
        next_process.wait(timeout=5)
        print("Next.js process terminated.")

atexit.register(cleanup)

# Wait for Next.js to be ready
def wait_for_nextjs():
    print("Waiting for Next.js server to be ready...")
    for _ in range(30):  # try for 30 seconds
        try:
            req = Request("http://localhost:3000")
            urlopen(req, timeout=1)
            print("Next.js server is ready!")
            return True
        except URLError:
            time.sleep(1)
    print("Timed out waiting for Next.js server to start")
    return False

# Special endpoint to check model files
@app.route('/check-models')
def check_models():
    models_dir = os.path.join(app.static_folder, 'models')
    model_files = os.listdir(models_dir)
    return {
        'models_dir': models_dir,
        'model_files': model_files,
        'static_url_path': app.static_url_path
    }

# Direct routes for models
@app.route('/models/<path:filename>')
def models_direct(filename):
    return send_from_directory(os.path.join(app.static_folder, 'models'), filename)

# Specify CORS headers for model files
@app.after_request
def add_cors_headers(response):
    if request.path.startswith('/models/') or request.path.startswith('/static/models/'):
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        response.headers['Cache-Control'] = 'public, max-age=86400'
    return response

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def proxy(path):
    # Check if this is a model file request
    if path.startswith('models/'):
        # Use Flask's static file handling
        file_path = path.replace('models/', '', 1)
        return send_from_directory(os.path.join(app.static_folder, 'models'), file_path)
    
    # Forward to Next.js
    target_url = f"http://localhost:3000/{path}"
    if request.query_string:
        target_url += f"?{request.query_string.decode('utf-8')}"
    
    try:
        headers = {key: value for key, value in request.headers.items() 
                  if key != 'Host' and key != 'Connection'}
        headers['Connection'] = 'close'  # Prevent keep-alive issues
        
        req = Request(
            target_url,
            headers=headers,
            data=request.get_data()
        )
        req.method = request.method
        
        response = urlopen(req)
        
        # Return the response from Next.js
        return Response(
            response.read(),
            status=response.status,
            headers=dict(response.getheaders())
        )
    except URLError as e:
        print(f"URLError for {target_url}: {str(e)}")
        return Response(
            f"Error connecting to Next.js: {str(e)}\n"
            "The Next.js server might still be starting up. Please refresh in a moment.",
            status=503
        )
    except Exception as e:
        print(f"Error proxying to {target_url}: {str(e)}")
        return Response(
            f"Error proxying to Next.js: {str(e)}\n"
            "An unexpected error occurred. Please try again.",
            status=500
        )

if __name__ == "__main__":
    # Make static directory
    os.makedirs(app.static_folder, exist_ok=True)
    
    # Create models directory and copy files
    models_dir = os.path.join(app.static_folder, 'models')
    os.makedirs(models_dir, exist_ok=True)
    
    # Wait for Next.js to start
    wait_thread = threading.Thread(target=wait_for_nextjs, daemon=True)
    wait_thread.start()
    wait_thread.join(timeout=10) # Wait max 10 seconds before starting Flask
    
    # Start Flask app
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=False)