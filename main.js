// Simple Node.js server to run the Next.js app
const express = require('express');
const { spawn } = require('child_process');
const app = express();
const port = process.env.PORT || 5000;

// Start the Next.js development server
console.log('Starting Next.js development server...');
const nextDev = spawn('npx', ['next', 'dev', '-p', '3000']);

nextDev.stdout.on('data', (data) => {
  console.log(`Next.js: ${data.toString()}`);
});

nextDev.stderr.on('data', (data) => {
  console.error(`Next.js Error: ${data.toString()}`);
});

// Set up a forward proxy to the Next.js server
const { createProxyMiddleware } = require('http-proxy-middleware');
app.use('/', createProxyMiddleware({ 
  target: 'http://localhost:3000',
  changeOrigin: true,
  ws: true,
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.writeHead(500, {
      'Content-Type': 'text/plain'
    });
    res.end('Next.js server is starting up, please refresh in a moment.');
  }
}));

app.listen(port, '0.0.0.0', () => {
  console.log(`Proxy server running at http://0.0.0.0:${port}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down Next.js development server...');
  nextDev.kill();
  process.exit(0);
});

// Export app for potential WSGI usage
module.exports = app;