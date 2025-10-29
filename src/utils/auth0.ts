import { keyVaultService } from './keyVault';

export async function getAuth0Config() {
  const secrets = await keyVaultService.loadAuth0Secrets();
  
  return {
    domain: 'dev-iq215msht4aqtejt.us.auth0.com',
    clientId: 'OA7bA8Rzh1N2FKXV1zPp1bCHl6MqN8Y6',
    clientSecret: secrets.AUTH0_CLIENT_SECRET,
  }; 
}