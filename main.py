import os
import socket
import subprocess
import sys
import time
import threading
import atexit
from urllib.request import Request, urlopen
from urllib.error import URLError

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
        print(f"{prefix}: {line.strip()}")

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

# Simple Flask app for compatibility with the current workflow
from flask import Flask, request, redirect, Response

app = Flask(__name__)

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def proxy(path):
    # Forward the request to Next.js
    target_url = f"http://localhost:3000/{path}"
    if request.query_string:
        target_url += f"?{request.query_string.decode('utf-8')}"
    
    try:
        req = Request(
            target_url,
            headers={key: value for key, value in request.headers.items() if key != 'Host'},
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
    except Exception as e:
        return Response(
            f"Error proxying to Next.js: {str(e)}\n"
            "The Next.js server might still be starting up. Please refresh in a moment.",
            status=503
        )

if __name__ == "__main__":
    # Wait for Next.js to start in background thread
    threading.Thread(target=wait_for_nextjs, daemon=True).start()
    
    # Start Flask app
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))