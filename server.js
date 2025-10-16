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
app.use(express.static(path.join(__dirname, 'dist')));

// GitHub OAuth
app.get('/auth/github', async (req, res) => {
  try {
    const clientId = await getSecret('GH-CLIENT-ID');
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=https://privaseeai.net/auth/github/callback&scope=read:user`;
    res.redirect(authUrl);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/auth/github/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.redirect('/?error=no_code');

  try {
    const clientId = await getSecret('GH-CLIENT-ID');
    const clientSecret = await getSecret('GH-CLIENT-SECRET');
    
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
    if (tokenData.error) return res.redirect(`/?error=${tokenData.error}`);

    const userResponse = await fetch('https://api.github.com/user', {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
    });
    const userData = await userResponse.json();

    const token = Buffer.from(JSON.stringify({
      id: userData.id,
      login: userData.login,
      name: userData.name,
      expires: Date.now() + 86400000
    })).toString('base64');

    res.redirect(`/?token=${token}`);
  } catch (error) {
    res.redirect(`/?error=auth_failed`);
  }
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

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
