// Debugging and dependency installation for Azure
console.log('=== SERVER STARTUP DEBUG ===');
console.log('Node.js version:', process.version);
console.log('Platform:', process.platform);
console.log('Working directory:', process.cwd());
console.log('Environment variables:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  PWD: process.env.PWD,
  PATH: process.env.PATH?.split(':').slice(0, 5) // First 5 PATH entries
});

// List directory contents
console.log('Directory contents:', require('fs').readdirSync('.'));

// Check for node_modules and specific dependencies
try {
  const nodeModules = require('fs').readdirSync('./node_modules');
  console.log('node_modules exists, first 10 modules:', nodeModules.slice(0, 10));
  
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    distExists: fs.existsSync(distPath),
    currentDir: __dirname
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

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Current directory: ${__dirname}`);
  console.log(`Dist directory exists: ${fs.existsSync(distPath)}`);
});