// Enhanced container-ready Express server with comprehensive debugging
console.log('=== CONTAINER STARTUP DEBUG ===');
console.log('Node.js version:', process.version);
console.log('Platform:', process.platform);
console.log('Working directory:', process.cwd());
console.log('Container environment:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  PWD: process.env.PWD,
  HOSTNAME: process.env.HOSTNAME,
  WEBSITE_HOSTNAME: process.env.WEBSITE_HOSTNAME
});

// List directory contents
console.log('Directory contents:', require('fs').readdirSync('.'));

// Check for node_modules and specific dependencies
try {
  const nodeModules = require('fs').readdirSync('./node_modules');
  console.log('node_modules exists, total modules:', nodeModules.length);
  console.log('First 10 modules:', nodeModules.slice(0, 10));
  
  // Check specifically for express
  const expressExists = require('fs').existsSync('./node_modules/express');
  console.log('Express module exists:', expressExists);
  
  if (expressExists) {
    console.log('Express package.json:', require('./node_modules/express/package.json').version);
  }
} catch (error) {
  console.log('Error checking node_modules:', error.message);
}

const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

// Middleware for JSON parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    distExists: fs.existsSync(distPath),
    currentDir: __dirname
  });
});

// Simple session endpoint for NextAuth.js compatibility
app.get('/api/auth/session', (req, res) => {
  console.log('Session endpoint called');
  // For now, return a simple response to avoid the JSON parsing error
  res.json({ user: null, expires: null });
});

// Simple providers endpoint for NextAuth.js compatibility  
app.get('/api/auth/providers', (req, res) => {
  console.log('Providers endpoint called');
  res.json({
    github: {
      id: "github",
      name: "GitHub",
      type: "oauth",
      signinUrl: "/api/auth/signin/github",
      callbackUrl: "/api/auth/callback/github"
    },
    google: {
      id: "google", 
      name: "Google",
      type: "oauth",
      signinUrl: "/api/auth/signin/google",
      callbackUrl: "/api/auth/callback/google"
    }
  });
});

// Simple CSRF endpoint for NextAuth.js compatibility
app.get('/api/auth/csrf', (req, res) => {
  console.log('CSRF endpoint called');
  res.json({ csrfToken: 'mock-csrf-token' });
});

// Check if dist directory exists
const distPath = path.join(__dirname, 'dist');
console.log('Checking dist directory:', distPath);
console.log('Dist directory exists:', fs.existsSync(distPath));

if (fs.existsSync(distPath)) {
  // Serve static files from the dist directory
  app.use(express.static(distPath));
  console.log('Serving static files from dist directory');
} else {
  console.error('Dist directory not found!');
  // Serve current directory as fallback
  app.use(express.static(__dirname));
}

// For any routes that don't match static files, serve the index.html file
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send(`
      <h1>Application Status</h1>
      <p>Dist directory: ${distPath}</p>
      <p>Dist exists: ${fs.existsSync(distPath)}</p>
      <p>Current directory: ${__dirname}</p>
      <p>Files in current directory: ${fs.readdirSync(__dirname).join(', ')}</p>
    `);
  }
});

// Configure port for container deployment
const port = process.env.PORT || process.env.WEBSITES_PORT || 8080;

console.log(`=== STARTING SERVER ON PORT ${port} ===`);

app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Server running successfully!`);
  console.log(`📍 Server listening on http://0.0.0.0:${port}`);
  console.log(`🔗 Health check available at http://0.0.0.0:${port}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});