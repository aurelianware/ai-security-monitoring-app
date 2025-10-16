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

// Debug endpoint for environment variables
app.get('/api/debug/env', (req, res) => {
  res.json({
    GH_CLIENT_ID: process.env.GH_CLIENT_ID ? 'SET' : 'MISSING',
    GH_CLIENT_SECRET: process.env.GH_CLIENT_SECRET ? 'SET' : 'MISSING',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'MISSING',
    NODE_ENV: process.env.NODE_ENV || 'MISSING',
    PORT: process.env.PORT || 'MISSING'
  });
});

// Authentication endpoints
app.get('/api/auth/me', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  console.log('Auth check for token:', token ? 'present' : 'missing');
  
  // For now, return null (not authenticated)
  // TODO: Implement proper JWT token verification
  res.json(null);
});

app.post('/api/auth/signout', (req, res) => {
  console.log('User signing out');
  res.json({ success: true });
});

// OAuth provider signin redirects
app.get('/api/auth/signin/github', (req, res) => {
  const clientId = process.env.GH_CLIENT_ID;
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/callback/github`;
  
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email`;
  
  console.log('Redirecting to GitHub OAuth:', githubAuthUrl);
  res.redirect(githubAuthUrl);
});

app.get('/api/auth/signin/google', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/callback/google`;
  
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid email profile`;
  
  console.log('Redirecting to Google OAuth:', googleAuthUrl);
  res.redirect(googleAuthUrl);
});

// OAuth callbacks
app.get('/api/auth/callback/github', async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.redirect('/?error=oauth_cancelled');
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GH_CLIENT_ID,
        client_secret: process.env.GH_CLIENT_SECRET,
        code: code,
      }),
    });

    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      console.error('GitHub OAuth error:', tokenData);
      return res.redirect('/?error=oauth_failed');
    }

    // Get user info
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'User-Agent': 'PrivaSee-AI-Security-Monitor',
      },
    });

    const userData = await userResponse.json();

    // Get user email
    const emailResponse = await fetch('https://api.github.com/user/emails', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'User-Agent': 'PrivaSee-AI-Security-Monitor',
      },
    });

    const emailData = await emailResponse.json();
    const primaryEmail = emailData.find(email => email.primary)?.email || userData.email;

    // Create session token (simple implementation)
    const sessionToken = Buffer.from(JSON.stringify({
      id: userData.id.toString(),
      email: primaryEmail,
      name: userData.name || userData.login,
      image: userData.avatar_url,
      provider: 'github',
      timestamp: Date.now()
    })).toString('base64');

    // Redirect with token
    res.redirect(`/?token=${sessionToken}`);
    
  } catch (error) {
    console.error('GitHub OAuth callback error:', error);
    res.redirect('/?error=oauth_failed');
  }
});

app.get('/api/auth/callback/google', async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.redirect('/?error=oauth_cancelled');
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/google`,
      }),
    });

    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      console.error('Google OAuth error:', tokenData);
      return res.redirect('/?error=oauth_failed');
    }

    // Get user info
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    const userData = await userResponse.json();

    // Create session token (simple implementation)
    const sessionToken = Buffer.from(JSON.stringify({
      id: userData.id,
      email: userData.email,
      name: userData.name,
      image: userData.picture,
      provider: 'google',
      timestamp: Date.now()
    })).toString('base64');

    // Redirect with token
    res.redirect(`/?token=${sessionToken}`);
    
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    res.redirect('/?error=oauth_failed');
  }
});

// Debug endpoint to test authentication flow
app.get('/api/auth/debug', (req, res) => {
  res.json({
    message: 'Auth debug endpoint',
    environment: {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      GH_CLIENT_ID: process.env.GH_CLIENT_ID ? 'configured' : 'missing',
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'configured' : 'missing'
    },
    timestamp: new Date().toISOString()
  });
});

// Legacy NextAuth.js compatibility endpoints (for gradual migration)
app.get('/api/auth/session', (req, res) => {
  console.log('Legacy session endpoint called');
  res.json({ user: null, expires: null });
});

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