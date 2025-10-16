const express = require('express');
const { DefaultAzureCredential } = require('@azure/identity');
const { SecretClient } = require('@azure/keyvault-secrets');
const path = require('path');
const fetch = require('node-fetch');

const app = express();
const port = process.env.PORT || 3000;

// Azure Key Vault setup
const credential = new DefaultAzureCredential();
const client = new SecretClient('https://websecurityapp-kv.vault.azure.net', credential);

async function getSecret(name) {
  try {
    const secret = await client.getSecret(name);
    return secret.value;
  } catch (error) {
    console.error(`Key Vault error for ${name}:`, error.message);
    return process.env[name.replace('-', '_')];
  }
}

app.use(express.json());

// Security headers
app.use((req, res, next) => {
  // Set frame-ancestors via HTTP header (more secure than meta tag)
  res.setHeader('Content-Security-Policy', "frame-ancestors 'none'");
  next();
});

// GitHub OAuth
app.get('/auth/github', async (req, res) => {
  try {
    const clientId = await getSecret('GH-CLIENT-ID');
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=https://privaseeai.net/auth/github/callback&scope=read:user,user:email`;
    res.redirect(authUrl);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/auth/github/callback', async (req, res) => {
  const { code, error } = req.query;
  console.log('🔙 GitHub callback received:', { code: code ? 'present' : 'missing', error });
  
  if (error) {
    console.error('❌ GitHub OAuth error:', error);
    return res.redirect(`/?error=${encodeURIComponent(error)}`);
  }
  
  if (!code) {
    console.error('❌ No authorization code received');
    return res.redirect('/?error=no_code');
  }

  try {
    console.log('🔑 Fetching OAuth secrets from Key Vault...');
    const clientId = await getSecret('GH-CLIENT-ID');
    const clientSecret = await getSecret('GH-CLIENT-SECRET');
    console.log('✅ OAuth secrets retrieved');
    
    console.log('🔄 Exchanging authorization code for access token...');
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code
      })
    });

    const tokenData = await tokenResponse.json();
    console.log('📄 Token response status:', tokenResponse.status);
    console.log('📄 Token response data:', tokenData);
    
    if (tokenData.error) {
      console.error('❌ Token exchange error:', tokenData);
      return res.redirect(`/?error=${encodeURIComponent(tokenData.error_description || tokenData.error)}`);
    }

    console.log('👤 Fetching user data from GitHub...');
    const userResponse = await fetch('https://api.github.com/user', {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
    });
    const userData = await userResponse.json();
    console.log('👤 User data received:', { login: userData.login, id: userData.id });

    // Get user email separately (GitHub may not return email in user endpoint)
    console.log('📧 Fetching user emails...');
    const emailResponse = await fetch('https://api.github.com/user/emails', {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
    });
    const emailData = await emailResponse.json();
    console.log('📧 Email data:', emailData);
    const primaryEmail = emailData.find(email => email.primary)?.email || userData.email;

    const userPayload = {
      id: userData.id.toString(),
      login: userData.login,
      name: userData.name || userData.login,
      email: primaryEmail || `${userData.login}@github.local`,
      image: userData.avatar_url,
      provider: 'github',
      expires: Date.now() + 86400000
    };
    
    console.log('🎫 Creating user token with payload:', userPayload);
    const token = Buffer.from(JSON.stringify(userPayload)).toString('base64');
    console.log('✅ OAuth success! Redirecting with token');

    res.redirect(`/?token=${token}`);
  } catch (error) {
    console.error('❌ OAuth callback error:', error);
    res.redirect(`/?error=auth_failed`);
  }
});

// Signout endpoint
app.post('/api/auth/signout', (req, res) => {
  res.json({ success: true });
});

app.get('/api/debug/env', async (req, res) => {
  try {
    const clientId = await getSecret('GH-CLIENT-ID');
    res.json({
      GH_CLIENT_ID: clientId ? clientId.substring(0, 10) + '...' : 'MISSING',
      KEY_VAULT: 'websecurityapp-kv.vault.azure.net',
      TIMESTAMP: new Date().toISOString()
    });
  } catch (error) {
    res.json({ error: error.message });
  }
});

// Debug endpoint to check authentication flow
app.get('/api/debug/auth', (req, res) => {
  res.json({
    timestamp: new Date().toISOString(),
    message: 'Auth debug endpoint working',
    userAgent: req.get('User-Agent'),
    headers: {
      authorization: req.get('Authorization') ? 'Bearer [PRESENT]' : 'MISSING',
      cookie: req.get('Cookie') ? '[PRESENT]' : 'MISSING'
    },
    url: req.url,
    method: req.method
  });
});

// Serve static files (React build)
app.use(express.static(path.join(__dirname, 'dist')));

// Handle client-side routing (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
