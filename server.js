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

// Application Insights integration (optional)
if (process.env.APPINSIGHTS_INSTRUMENTATIONKEY) {
  const appInsights = require('applicationinsights');
  appInsights.setup(process.env.APPINSIGHTS_INSTRUMENTATIONKEY).start();
  console.log('Application Insights enabled');
}

const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

// HTTPS redirect for production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}

// Security headers middleware
app.use((req, res, next) => {
  // HSTS - Force HTTPS for 1 year
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://storage.googleapis.com; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: blob: https:; " +
    "font-src 'self' data:; " +
    "connect-src 'self' https://*.blob.core.windows.net https://*.googleapis.com; " +
    "media-src 'self' blob:; " +
    "worker-src 'self' blob:; " +
    "frame-ancestors 'none';"
  );
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy
  res.setHeader('Permissions-Policy', 
    'camera=(self), microphone=(self), geolocation=(self), payment=(), usb=()'
  );
  
  // X-Frame-Options
  res.setHeader('X-Frame-Options', 'DENY');
  
  // X-Content-Type-Options
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  next();
});

// CORS whitelist for privaseeai.net
const allowedOrigins = [
  'https://privaseeai.net',
  'https://www.privaseeai.net',
  'https://*.privaseeai.net'
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && (allowedOrigins.includes(origin) || origin.endsWith('.privaseeai.net'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
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

// Health check endpoints
app.get('/healthz', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    distExists: fs.existsSync(distPath),
    currentDir: __dirname,
    nodeVersion: process.version,
    uptime: process.uptime()
  });
});

// Legacy health endpoint for backward compatibility
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    distExists: fs.existsSync(distPath),
    currentDir: __dirname
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString()
  });
});

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