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