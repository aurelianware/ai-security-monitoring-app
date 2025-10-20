import { DefaultAzureCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';

class KeyVaultService {
  private client: SecretClient;
  private cache: Map<string, string> = new Map();

  constructor() {
    const credential = new DefaultAzureCredential();
    const vaultUrl = `https://websecurityapp-kv.vault.azure.net`;
    this.client = new SecretClient(vaultUrl, credential);
  }

  async getSecret(secretName: string): Promise<string> {
    // Check cache first
    if (this.cache.has(secretName)) {
      return this.cache.get(secretName)!;
    }

    try {
      const secret = await this.client.getSecret(secretName);
      const value = secret.value!;
      
      // Cache the secret for performance
      this.cache.set(secretName, value);
      
      return value;
    } catch (error) {
      console.error(`Failed to retrieve secret ${secretName}:`, error);
      throw new Error(`Unable to access secret: ${secretName}`);
    }
  }

  // Load Auth0 and other secrets
  async loadAuth0Secrets() {
    const [clientSecret, stripeSecret, stripeWebhook, dbUrl] = await Promise.all([
      this.getSecret('auth0-client-secret'),
      this.getSecret('stripe-secret-key'),
      this.getSecret('stripe-webhook-secret'),
      this.getSecret('database-url')
    ]);
    
    return {
      AUTH0_CLIENT_SECRET: clientSecret,
      STRIPE_SECRET_KEY: stripeSecret,
      STRIPE_WEBHOOK_SECRET: stripeWebhook,
      DATABASE_URL: dbUrl
    };
  }
}

export const keyVaultService = new KeyVaultService();