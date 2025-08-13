import { StorageProvider } from './storage-provider';
import { LocalStorageConfig } from '../types';
import * as fs from 'fs/promises';
import * as path from 'path';

export class LocalStorageProvider extends StorageProvider {
  private basePath: string;

  constructor(config: LocalStorageConfig) {
    super();
    this.basePath = config.path;
  }

  async upload(filename: string, data: Buffer): Promise<string> {
    // Ensure directory exists
    await fs.mkdir(this.basePath, { recursive: true });
    
    const filePath = path.join(this.basePath, filename);
    await fs.writeFile(filePath, data);
    
    return filePath;
  }

  async download(filename: string): Promise<Buffer> {
    const filePath = path.join(this.basePath, filename);
    return await fs.readFile(filePath);
  }

  async delete(filename: string): Promise<void> {
    const filePath = path.join(this.basePath, filename);
    await fs.unlink(filePath);
  }

  async list(prefix?: string): Promise<string[]> {
    try {
      const files = await fs.readdir(this.basePath);
      return prefix ? files.filter(file => file.startsWith(prefix)) : files;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  async exists(filename: string): Promise<boolean> {
    try {
      const filePath = path.join(this.basePath, filename);
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async getMetadata(filename: string): Promise<{
    size: number;
    lastModified: Date;
    etag?: string;
  }> {
    const filePath = path.join(this.basePath, filename);
    const stats = await fs.stat(filePath);
    
    return {
      size: stats.size,
      lastModified: stats.mtime,
    };
  }
}