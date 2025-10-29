import { getAuth0Config } from './auth0';

(async () => {
  try {
    const config = await getAuth0Config();
    console.log('Auth0 Config:', config);
    console.log('Auth0 Client ID:', config.clientId);
  } catch (error) {
    console.error('Error loading Auth0 config:', error);
  }
})();