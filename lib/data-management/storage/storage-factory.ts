import { StorageProvider } from './storage-provider';
import { LocalStorageProvider } from './local-storage';
import { S3StorageProvider } from './s3-storage';
import { StorageConfiguration } from '../types';

/**
 * Factory function to create storage providers
 */
export function createStorageProvider(config: StorageConfiguration): StorageProvider {
  switch (config.type) {
    case 'local':
      return new LocalStorageProvider(config.config as any);
      
    case 's3':
      return new S3StorageProvider(config.config as any);
      
    case 'gcs':
      // TODO: Implement Google Cloud Storage provider
      // return new GCSStorageProvider(config.config as any);
      throw new Error('Google Cloud Storage provider not implemented');
      
    case 'azure':
      // TODO: Implement Azure Blob Storage provider
      // return new AzureStorageProvider(config.config as any);
      throw new Error('Azure Blob Storage provider not implemented');
      
    default:
      throw new Error(`Unknown storage type: ${config.type}`);
  }
}