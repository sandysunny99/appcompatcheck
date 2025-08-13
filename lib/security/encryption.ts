import crypto from 'crypto';
import CryptoJS from 'crypto-js';

// Environment variables for encryption keys
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-256-bit-secret-key-here-change-this';
const ENCRYPTION_IV_LENGTH = 16; // For AES, this is always 16

export class DataEncryption {
  
  // AES-256-GCM encryption for sensitive data
  static encrypt(text: string, key?: string): { encrypted: string; iv: string; tag: string } {
    const encryptionKey = key || ENCRYPTION_KEY;
    const iv = crypto.randomBytes(ENCRYPTION_IV_LENGTH);
    const cipher = crypto.createCipher('aes-256-gcm', encryptionKey);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
    };
  }

  // AES-256-GCM decryption
  static decrypt(encryptedData: { encrypted: string; iv: string; tag: string }, key?: string): string {
    const encryptionKey = key || ENCRYPTION_KEY;
    const decipher = crypto.createDecipher('aes-256-gcm', encryptionKey);
    
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  // Simple encryption for less sensitive data (reversible)
  static encryptSimple(text: string, key?: string): string {
    const encryptionKey = key || ENCRYPTION_KEY;
    return CryptoJS.AES.encrypt(text, encryptionKey).toString();
  }

  // Simple decryption
  static decryptSimple(encryptedText: string, key?: string): string {
    const encryptionKey = key || ENCRYPTION_KEY;
    const bytes = CryptoJS.AES.decrypt(encryptedText, encryptionKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  // Hash sensitive data (one-way, for passwords, etc.)
  static hash(text: string, salt?: string): { hash: string; salt: string } {
    const saltValue = salt || crypto.randomBytes(32).toString('hex');
    const hash = crypto.pbkdf2Sync(text, saltValue, 10000, 64, 'sha512').toString('hex');
    
    return { hash, salt: saltValue };
  }

  // Verify hash
  static verifyHash(text: string, hash: string, salt: string): boolean {
    const hashVerify = crypto.pbkdf2Sync(text, salt, 10000, 64, 'sha512').toString('hex');
    return hash === hashVerify;
  }

  // Generate secure random token
  static generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  // Generate secure random UUID
  static generateUUID(): string {
    return crypto.randomUUID();
  }

  // Encrypt file contents
  static encryptFile(fileBuffer: Buffer, key?: string): { 
    encrypted: Buffer; 
    iv: string; 
    tag: string; 
  } {
    const encryptionKey = key || ENCRYPTION_KEY;
    const iv = crypto.randomBytes(ENCRYPTION_IV_LENGTH);
    const cipher = crypto.createCipher('aes-256-gcm', encryptionKey);
    
    const encrypted = Buffer.concat([
      cipher.update(fileBuffer),
      cipher.final(),
    ]);
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
    };
  }

  // Decrypt file contents
  static decryptFile(encryptedData: {
    encrypted: Buffer;
    iv: string;
    tag: string;
  }, key?: string): Buffer {
    const encryptionKey = key || ENCRYPTION_KEY;
    const decipher = crypto.createDecipher('aes-256-gcm', encryptionKey);
    
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
    
    const decrypted = Buffer.concat([
      decipher.update(encryptedData.encrypted),
      decipher.final(),
    ]);
    
    return decrypted;
  }
}

// Field-level encryption for database columns
export class FieldEncryption {
  
  // Encrypt sensitive database fields
  static encryptField(value: string | null, fieldName: string): string | null {
    if (!value) return null;
    
    const fieldKey = this.generateFieldKey(fieldName);
    return DataEncryption.encryptSimple(value, fieldKey);
  }

  // Decrypt sensitive database fields
  static decryptField(encryptedValue: string | null, fieldName: string): string | null {
    if (!encryptedValue) return null;
    
    try {
      const fieldKey = this.generateFieldKey(fieldName);
      return DataEncryption.decryptSimple(encryptedValue, fieldKey);
    } catch (error) {
      console.error(`Failed to decrypt field ${fieldName}:`, error);
      return null;
    }
  }

  // Generate field-specific encryption key
  private static generateFieldKey(fieldName: string): string {
    return crypto.createHash('sha256')
      .update(ENCRYPTION_KEY + fieldName)
      .digest('hex');
  }

  // Encrypt multiple fields in an object
  static encryptFields<T extends Record<string, any>>(
    data: T, 
    fieldsToEncrypt: (keyof T)[]
  ): T {
    const encrypted = { ...data };
    
    fieldsToEncrypt.forEach(field => {
      if (encrypted[field] && typeof encrypted[field] === 'string') {
        encrypted[field] = this.encryptField(encrypted[field] as string, field as string);
      }
    });
    
    return encrypted;
  }

  // Decrypt multiple fields in an object
  static decryptFields<T extends Record<string, any>>(
    data: T, 
    fieldsToDecrypt: (keyof T)[]
  ): T {
    const decrypted = { ...data };
    
    fieldsToDecrypt.forEach(field => {
      if (decrypted[field] && typeof decrypted[field] === 'string') {
        decrypted[field] = this.decryptField(decrypted[field] as string, field as string);
      }
    });
    
    return decrypted;
  }
}

// JWT token encryption and security
export class TokenSecurity {
  
  // Generate secure JWT payload
  static generateSecurePayload(userId: number, additional: Record<string, any> = {}): {
    payload: Record<string, any>;
    jti: string;
  } {
    const jti = DataEncryption.generateUUID();
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + (7 * 24 * 60 * 60); // 7 days
    
    return {
      payload: {
        sub: userId.toString(),
        iat,
        exp,
        jti,
        ...additional,
      },
      jti,
    };
  }

  // Encrypt sensitive JWT claims
  static encryptClaims(claims: Record<string, any>, sensitiveFields: string[]): Record<string, any> {
    const encrypted = { ...claims };
    
    sensitiveFields.forEach(field => {
      if (encrypted[field]) {
        encrypted[field] = DataEncryption.encryptSimple(
          typeof encrypted[field] === 'string' 
            ? encrypted[field] 
            : JSON.stringify(encrypted[field])
        );
      }
    });
    
    return encrypted;
  }

  // Decrypt sensitive JWT claims
  static decryptClaims(claims: Record<string, any>, sensitiveFields: string[]): Record<string, any> {
    const decrypted = { ...claims };
    
    sensitiveFields.forEach(field => {
      if (decrypted[field]) {
        try {
          const decryptedValue = DataEncryption.decryptSimple(decrypted[field]);
          try {
            decrypted[field] = JSON.parse(decryptedValue);
          } catch {
            decrypted[field] = decryptedValue;
          }
        } catch (error) {
          console.error(`Failed to decrypt JWT claim ${field}:`, error);
        }
      }
    });
    
    return decrypted;
  }

  // Generate secure API key
  static generateApiKey(userId: number, permissions: string[]): {
    apiKey: string;
    keyId: string;
    hash: string;
  } {
    const keyId = DataEncryption.generateUUID();
    const keyData = {
      userId,
      permissions,
      keyId,
      createdAt: Date.now(),
    };
    
    const apiKey = `ak_${Buffer.from(JSON.stringify(keyData)).toString('base64')}`;
    const { hash } = DataEncryption.hash(apiKey);
    
    return { apiKey, keyId, hash };
  }

  // Verify API key
  static verifyApiKey(apiKey: string, storedHash: string): {
    valid: boolean;
    keyData?: any;
  } {
    try {
      // Extract key data
      const base64Data = apiKey.replace('ak_', '');
      const keyData = JSON.parse(Buffer.from(base64Data, 'base64').toString());
      
      // Verify hash
      const { hash } = DataEncryption.hash(apiKey, storedHash);
      if (hash !== storedHash) {
        return { valid: false };
      }
      
      return { valid: true, keyData };
    } catch (error) {
      return { valid: false };
    }
  }
}

// Secure session management
export class SessionSecurity {
  
  // Generate secure session data
  static generateSessionData(userId: number, userRole: string, organizationId?: number): {
    sessionId: string;
    sessionData: Record<string, any>;
    csrfToken: string;
  } {
    const sessionId = DataEncryption.generateUUID();
    const csrfToken = DataEncryption.generateToken(32);
    
    const sessionData = {
      userId,
      userRole,
      organizationId,
      csrfToken,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      ipAddress: null, // Will be set by session handler
      userAgent: null, // Will be set by session handler
    };
    
    return { sessionId, sessionData, csrfToken };
  }

  // Encrypt session data for storage
  static encryptSessionData(sessionData: Record<string, any>): string {
    const dataString = JSON.stringify(sessionData);
    return DataEncryption.encryptSimple(dataString, ENCRYPTION_KEY + 'session');
  }

  // Decrypt session data from storage
  static decryptSessionData(encryptedData: string): Record<string, any> | null {
    try {
      const dataString = DataEncryption.decryptSimple(encryptedData, ENCRYPTION_KEY + 'session');
      return JSON.parse(dataString);
    } catch (error) {
      console.error('Failed to decrypt session data:', error);
      return null;
    }
  }

  // Generate secure CSRF token
  static generateCSRFToken(sessionId: string): string {
    const data = `${sessionId}:${Date.now()}:${Math.random()}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // Verify CSRF token
  static verifyCSRFToken(token: string, sessionData: Record<string, any>): boolean {
    return token === sessionData.csrfToken;
  }
}

// Audit trail encryption
export class AuditEncryption {
  
  // Encrypt sensitive audit data
  static encryptAuditData(auditData: {
    userId: number;
    action: string;
    description: string;
    metadata?: any;
    ipAddress?: string;
    userAgent?: string;
  }): {
    encryptedData: string;
    hash: string;
  } {
    const dataString = JSON.stringify(auditData);
    const encryptedData = DataEncryption.encryptSimple(dataString, ENCRYPTION_KEY + 'audit');
    
    // Create integrity hash
    const hash = crypto.createHash('sha256')
      .update(dataString + ENCRYPTION_KEY)
      .digest('hex');
    
    return { encryptedData, hash };
  }

  // Decrypt and verify audit data
  static decryptAuditData(encryptedData: string, hash: string): any | null {
    try {
      const dataString = DataEncryption.decryptSimple(encryptedData, ENCRYPTION_KEY + 'audit');
      
      // Verify integrity
      const calculatedHash = crypto.createHash('sha256')
        .update(dataString + ENCRYPTION_KEY)
        .digest('hex');
      
      if (calculatedHash !== hash) {
        console.error('Audit data integrity check failed');
        return null;
      }
      
      return JSON.parse(dataString);
    } catch (error) {
      console.error('Failed to decrypt audit data:', error);
      return null;
    }
  }
}

// Key rotation utilities
export class KeyRotation {
  
  // Generate new encryption key
  static generateNewKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Re-encrypt data with new key
  static reEncryptData(encryptedData: string, oldKey: string, newKey: string): string {
    const decrypted = DataEncryption.decryptSimple(encryptedData, oldKey);
    return DataEncryption.encryptSimple(decrypted, newKey);
  }

  // Schedule key rotation (would integrate with a job queue)
  static scheduleKeyRotation(days: number = 90): void {
    // This would integrate with a job scheduling system
    console.log(`Key rotation scheduled for ${days} days from now`);
  }
}