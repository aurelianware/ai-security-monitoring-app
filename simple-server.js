// Simple standalone server for Azure App Service without Express dependency
// Uses only Node.js built-in modules to avoid dependency issues

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Debug environment info
console.log('🔧 SIMPLE SERVER STARTUP DEBUG');
console.log('=== Environment Info ===');
console.log('Node version:', process.version);
console.log('Platform:', process.platform);
console.log('Working directory:', process.cwd());
console.log('Environment variables:');
console.log('- PORT:', process.env.PORT);
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- PWD:', process.env.PWD);

// Check file system
console.log('\n=== File System Check ===');
try {
  const files = fs.readdirSync('.');
  console.log('Current directory files:', files.slice(0, 10));
  
  // Check for dist directory
  if (fs.existsSync('dist')) {
    const distFiles = fs.readdirSync('dist');
    console.log('Dist directory files:', distFiles.slice(0, 10));
  } else {
    console.log('❌ Dist directory not found');
  }
} catch (error) {
  console.error('Error reading file system:', error.message);
}

const PORT = process.env.PORT || 8080;
const DIST_DIR = path.join(process.cwd(), 'dist');

// MIME types for static files
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return mimeTypes[ext] || 'application/octet-stream';
}

function serveStaticFile(req, res, filePath) {
  const fullPath = path.join(DIST_DIR, filePath);
  
  fs.readFile(fullPath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // File not found, serve index.html for SPA routing
        fs.readFile(path.join(DIST_DIR, 'index.html'), (indexErr, indexContent) => {
          if (indexErr) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 - File Not Found');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(indexContent);
          }
        });
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 - Internal Server Error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': getContentType(filePath) });
      res.end(content);
    }
  });
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  let pathname = parsedUrl.pathname;
  
  console.log(`${new Date().toISOString()} ${req.method} ${pathname}`);
  
  // Health check endpoint
  if (pathname === '/health' || pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      env: process.env.NODE_ENV || 'development'
    }));
    return;
  }
  
  // Remove leading slash
  if (pathname.startsWith('/')) {
    pathname = pathname.slice(1);
  }
  
  // Default to index.html for root path
  if (pathname === '' || pathname === '/') {
    pathname = 'index.html';
  }
  
  serveStaticFile(req, res, pathname);
});

server.listen(PORT, () => {
  console.log(`\n🚀 Simple server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Serving static files from: ${DIST_DIR}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});