/**
 * Abstract base class for storage providers
 */
export abstract class StorageProvider {
  /**
   * Upload data to storage
   */
  abstract upload(filename: string, data: Buffer): Promise<string>;

  /**
   * Download data from storage
   */
  abstract download(filename: string): Promise<Buffer>;

  /**
   * Delete file from storage
   */
  abstract delete(filename: string): Promise<void>;

  /**
   * List files in storage
   */
  abstract list(prefix?: string): Promise<string[]>;

  /**
   * Check if file exists
   */
  abstract exists(filename: string): Promise<boolean>;

  /**
   * Get file metadata
   */
  abstract getMetadata(filename: string): Promise<{
    size: number;
    lastModified: Date;
    etag?: string;
  }>;
}