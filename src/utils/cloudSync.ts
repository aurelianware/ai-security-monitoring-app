// Azure Blob Storage Client for Security App
import { SecurityEvent, AppSettings } from './storage';

export interface BlobStorageConfig {
  accountName: string;
  containerName: string;
  sasToken?: string;
  accessKey?: string;
  authMethod: 'sas' | 'accessKey';
}

export interface UploadResult {
  success: boolean;
  blobUrl?: string;
  error?: string;
}

export interface SyncResult {
  uploaded: number;
  failed: number;
  errors: string[];
}

class CloudSyncService {
  private config: BlobStorageConfig | null = null;
  private baseUrl: string = '';

  configure(config: BlobStorageConfig): void {
    if (config.authMethod === 'sas' && config.sasToken) {
      // Handle SAS token - use it exactly as provided
      let sasToken = config.sasToken;
      
      // Remove leading ? if present
      if (sasToken.startsWith('?')) {
        sasToken = sasToken.substring(1);
      }
      
      console.log('🔧 Using SAS token as-is (no encoding/decoding)');
      
      this.config = {
        ...config,
        sasToken
      };
    } else if (config.authMethod === 'accessKey' && config.accessKey) {
      // Handle access key
      this.config = config;
      console.log('🔑 Using access key authentication');
    } else {
      throw new Error('Invalid configuration: must provide either sasToken or accessKey');
    }
    
    this.baseUrl = `https://${config.accountName}.blob.core.windows.net/${config.containerName}`;
    console.log('☁️ Azure Blob Storage configured');
  }

  isConfigured(): boolean {
    if (!this.config) return false;
    
    if (this.config.authMethod === 'sas') {
      return !!(this.config.sasToken && this.config.sasToken.length > 0);
    } else if (this.config.authMethod === 'accessKey') {
      return !!(this.config.accessKey && this.config.accessKey.length > 0);
    }
    
    return false;
  }

  // Upload security event data as JSON
  async uploadEvent(event: SecurityEvent): Promise<UploadResult> {
    if (!this.isConfigured()) {
      return { success: false, error: 'Blob storage not configured' };
    }

    try {
      const eventData = {
        ...event,
        // Remove large blobs from JSON - upload separately
        imageBlob: undefined,
        videoBlob: undefined,
      };

      const fileName = `events/${event.id}.json`;
      const result = await this.uploadJson(fileName, eventData);

      // Upload blobs separately if they exist
      if (result.success && event.imageBlob) {
        await this.uploadBlob(`images/${event.id}.jpg`, event.imageBlob);
      }

      if (result.success && event.videoBlob) {
        await this.uploadBlob(`videos/${event.id}.mp4`, event.videoBlob);
      }

      return result;
    } catch (error) {
      console.error('Upload event failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Upload failed' 
      };
    }
  }

  // Upload settings
  async uploadSettings(settings: AppSettings): Promise<UploadResult> {
    if (!this.isConfigured()) {
      return { success: false, error: 'Blob storage not configured' };
    }

    try {
      const fileName = 'settings/app_settings.json';
      return await this.uploadJson(fileName, settings);
    } catch (error) {
      console.error('Upload settings failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Upload failed' 
      };
    }
  }

  // Download events from cloud
  async downloadEvents(since?: Date): Promise<SecurityEvent[]> {
    if (!this.isConfigured()) {
      throw new Error('Blob storage not configured');
    }

    try {
      // List all event files
      const eventFiles = await this.listBlobs('events/');
      const events: SecurityEvent[] = [];

      for (const file of eventFiles) {
        try {
          const eventData = await this.downloadJson(file.name);
          
          // Filter by date if specified
          if (since && new Date(eventData.timestamp) < since) {
            continue;
          }

          // Download associated blobs
          if (file.name.includes('.json')) {
            const eventId = file.name.replace('events/', '').replace('.json', '');
            
            // Try to download image
            try {
              eventData.imageBlob = await this.downloadBlob(`images/${eventId}.jpg`);
            } catch {
              // Image doesn't exist, continue
            }

            // Try to download video
            try {
              eventData.videoBlob = await this.downloadBlob(`videos/${eventId}.mp4`);
            } catch {
              // Video doesn't exist, continue
            }
          }

          events.push(eventData);
        } catch (error) {
          console.warn(`Failed to download event ${file.name}:`, error);
        }
      }

      console.log(`☁️ Downloaded ${events.length} events from cloud`);
      return events;
    } catch (error) {
      console.error('Download events failed:', error);
      throw error;
    }
  }

  // Download settings from cloud
  async downloadSettings(): Promise<AppSettings | null> {
    if (!this.isConfigured()) {
      throw new Error('Blob storage not configured');
    }

    try {
      const settings = await this.downloadJson('settings/app_settings.json');
      console.log('☁️ Settings downloaded from cloud');
      return settings;
    } catch (error) {
      console.warn('No settings found in cloud or download failed:', error);
      return null;
    }
  }

  // Delete old events from cloud
  async cleanupCloudEvents(olderThanDays: number): Promise<number> {
    if (!this.isConfigured()) {
      throw new Error('Blob storage not configured');
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    try {
      const eventFiles = await this.listBlobs('events/');
      let deletedCount = 0;

      for (const file of eventFiles) {
        if (file.lastModified && file.lastModified < cutoffDate) {
          try {
            await this.deleteBlob(file.name);
            
            // Also delete associated image/video
            const eventId = file.name.replace('events/', '').replace('.json', '');
            try {
              await this.deleteBlob(`images/${eventId}.jpg`);
            } catch {}
            try {
              await this.deleteBlob(`videos/${eventId}.mp4`);
            } catch {}
            
            deletedCount++;
          } catch (error) {
            console.warn(`Failed to delete ${file.name}:`, error);
          }
        }
      }

      console.log(`☁️ Cleaned up ${deletedCount} old events from cloud`);
      return deletedCount;
    } catch (error) {
      console.error('Cloud cleanup failed:', error);
      throw error;
    }
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    if (!this.isConfigured()) {
      console.error('❌ Cloud sync not configured');
      return false;
    }

    console.log('🔍 Testing cloud connection...');
    console.log('Account:', this.config?.accountName);
    console.log('Container:', this.config?.containerName);
    console.log('Auth method:', this.config?.authMethod);
    console.log('Base URL:', this.baseUrl);
    
    if (this.config?.authMethod === 'sas' && this.config.sasToken) {
      console.log('SAS token (first 50 chars):', this.config.sasToken.substring(0, 50) + '...');
    }

    try {
      // First try to list container contents (simpler test)
      console.log('📋 Testing container access...');
      const listUrl = `${this.baseUrl}?comp=list&restype=container&${this.config?.sasToken}`;
      console.log('List URL:', listUrl);
      
      const listResponse = await fetch(listUrl);
      console.log('List response status:', listResponse.status);
      
      if (listResponse.ok) {
        console.log('✅ Container access successful');
        
        // Now try to upload a small test file
        const testData = { test: true, timestamp: new Date(), message: 'Connection test from security app' };
        console.log('📤 Attempting to upload test file...');
        const result = await this.uploadJson('test/connection_test.json', testData);
        
        console.log('📋 Upload result:', result);
        
        if (result.success) {
          console.log('✅ Upload successful, cleaning up test file...');
          // Clean up test file
          try {
            await this.deleteBlob('test/connection_test.json');
            console.log('🗑️ Test file cleaned up');
          } catch (cleanupError) {
            console.warn('⚠️ Could not clean up test file:', cleanupError);
          }
          
          console.log('☁️ Cloud connection test successful');
          return true;
        } else {
          console.error('❌ Upload failed:', result.error);
          return false;
        }
      } else {
        const errorText = await listResponse.text();
        console.error('❌ Container access failed:', listResponse.status, errorText);
        
        if (listResponse.status === 0 || errorText.includes('CORS')) {
          console.error('🚫 CORS Error: Configure CORS in Azure Storage Account');
          console.error('🔧 Solution: Go to Azure Portal → Storage Account → Settings → Resource sharing (CORS)');
          console.error('🔧 Add rule: Origins: *, Methods: GET,PUT,POST,DELETE,HEAD,OPTIONS, Headers: *');
        } else if (listResponse.status === 404) {
          console.error('🚫 Container not found: security-events');
          console.error('🔧 Solution: Create the container in Azure Portal');
        } else if (listResponse.status === 403) {
          console.error('🚫 Access denied: Check SAS token permissions');
          console.error('🔧 Solution: Ensure SAS token has Read, Write, Delete, List permissions');
        }
        
        return false;
      }
      
    } catch (error) {
      console.error('❌ Cloud connection test failed:', error);
      
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.error('🚫 Network Error: This is likely a CORS issue');
        console.error('🔧 Solution: Configure CORS in Azure Storage Account');
      }
      
      return false;
    }
  }

  // Get storage usage info
  async getStorageInfo(): Promise<{
    totalBlobs: number;
    estimatedSize: number;
    events: number;
    images: number;
    videos: number;
  }> {
    if (!this.isConfigured()) {
      throw new Error('Blob storage not configured');
    }

    try {
      const [events, images, videos] = await Promise.all([
        this.listBlobs('events/'),
        this.listBlobs('images/'),
        this.listBlobs('videos/'),
      ]);

      const totalBlobs = events.length + images.length + videos.length;
      const estimatedSize = [...events, ...images, ...videos]
        .reduce((sum, blob) => sum + (blob.size || 0), 0);

      return {
        totalBlobs,
        estimatedSize,
        events: events.length,
        images: images.length,
        videos: videos.length,
      };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      throw error;
    }
  }

  // Private helper methods
  private async uploadJson(fileName: string, data: any): Promise<UploadResult> {
    const jsonBlob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    });
    
    return this.uploadBlob(fileName, jsonBlob);
  }

  private async uploadBlob(fileName: string, blob: Blob): Promise<UploadResult> {
    if (!this.config) {
      return { success: false, error: 'Not configured' };
    }

    if (this.config.authMethod !== 'sas' || !this.config.sasToken) {
      return { success: false, error: 'SAS token authentication required' };
    }

    const url = `${this.baseUrl}/${fileName}?${this.config.sasToken}`;
    console.log(`🔄 Uploading ${fileName} to Azure Blob Storage...`);

    try {
      const response = await fetch(url, {
        method: 'PUT',
        body: blob,
        headers: {
          'x-ms-blob-type': 'BlockBlob',
          'Content-Type': blob.type || 'application/octet-stream',
        },
      });

      if (response.ok) {
        const blobUrl = `${this.baseUrl}/${fileName}`;
        console.log(`✅ Successfully uploaded ${fileName}`);
        return { success: true, blobUrl };
      } else {
        const errorText = await response.text();
        console.error(`❌ Upload failed for ${fileName}:`, response.status, errorText);
        
        // Provide specific error messages for common issues
        let friendlyError = `HTTP ${response.status}: ${errorText}`;
        if (response.status === 403) {
          friendlyError = 'Access denied. Check your SAS token permissions and expiration.';
        } else if (response.status === 404) {
          friendlyError = 'Container not found. Check your account name and container name.';
        }
        
        return { 
          success: false, 
          error: friendlyError
        };
      }
    } catch (error) {
      console.error(`❌ Network error uploading ${fileName}:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Network error' 
      };
    }
  }

  private async downloadJson(fileName: string): Promise<any> {
    if (!this.config || this.config.authMethod !== 'sas' || !this.config.sasToken) {
      throw new Error('SAS token authentication required');
    }

    const url = `${this.baseUrl}/${fileName}?${this.config.sasToken}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  private async downloadBlob(fileName: string): Promise<Blob> {
    if (!this.config || this.config.authMethod !== 'sas' || !this.config.sasToken) {
      throw new Error('SAS token authentication required');
    }

    const url = `${this.baseUrl}/${fileName}?${this.config.sasToken}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.blob();
  }

  private async listBlobs(prefix: string = ''): Promise<Array<{
    name: string;
    size?: number;
    lastModified?: Date;
  }>> {
    if (!this.config || this.config.authMethod !== 'sas' || !this.config.sasToken) {
      throw new Error('SAS token authentication required');
    }

    const url = `${this.baseUrl}?comp=list&restype=container&prefix=${prefix}&${this.config.sasToken}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const xmlText = await response.text();
    
    // Parse XML response (simplified - in production, use proper XML parser)
    const blobs: Array<{ name: string; size?: number; lastModified?: Date }> = [];
    const blobMatches = xmlText.match(/<Blob>[\s\S]*?<\/Blob>/g);

    if (blobMatches) {
      for (const blobXml of blobMatches) {
        const nameMatch = blobXml.match(/<Name>(.*?)<\/Name>/);
        const sizeMatch = blobXml.match(/<Content-Length>(\d+)<\/Content-Length>/);
        const modifiedMatch = blobXml.match(/<Last-Modified>(.*?)<\/Last-Modified>/);

        if (nameMatch) {
          blobs.push({
            name: nameMatch[1],
            size: sizeMatch ? parseInt(sizeMatch[1]) : undefined,
            lastModified: modifiedMatch ? new Date(modifiedMatch[1]) : undefined,
          });
        }
      }
    }

    return blobs;
  }

  private async deleteBlob(fileName: string): Promise<void> {
    if (!this.config || this.config.authMethod !== 'sas' || !this.config.sasToken) {
      throw new Error('SAS token authentication required');
    }

    const url = `${this.baseUrl}/${fileName}?${this.config.sasToken}`;
    const response = await fetch(url, { method: 'DELETE' });

    if (!response.ok && response.status !== 404) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }
}

// Singleton instance
export const cloudSyncService = new CloudSyncService();

export default cloudSyncService;