/**
 * Secure Storage Utility
 * Provides secure storage mechanisms for sensitive data
 */
export class SecureStorage {
  /**
   * Encrypt data using a simple XOR cipher (for demonstration purposes)
   * Note: In a production environment, use a proper encryption library
   * @param data Data to encrypt
   * @param key Encryption key
   * @returns Encrypted data as base64 string
   */
  static encrypt(data: string, key: string): string {
    const keyBytes = this.stringToBytes(key);
    const dataBytes = this.stringToBytes(data);
    const encryptedBytes = [];

    for (let i = 0; i < dataBytes.length; i++) {
      encryptedBytes.push(dataBytes[i] ^ keyBytes[i % keyBytes.length]);
    }

    return btoa(String.fromCharCode(...encryptedBytes));
  }

  /**
   * Decrypt data using a simple XOR cipher (for demonstration purposes)
   * Note: In a production environment, use a proper encryption library
   * @param encryptedData Encrypted data as base64 string
   * @param key Encryption key
   * @returns Decrypted data
   */
  static decrypt(encryptedData: string, key: string): string {
    const keyBytes = this.stringToBytes(key);
    const encryptedBytes = this.base64ToBytes(encryptedData);
    const decryptedBytes = [];

    for (let i = 0; i < encryptedBytes.length; i++) {
      decryptedBytes.push(encryptedBytes[i] ^ keyBytes[i % keyBytes.length]);
    }

    return String.fromCharCode(...decryptedBytes);
  }

  /**
   * Convert string to byte array
   * @param str String to convert
   * @returns Byte array
   */
  private static stringToBytes(str: string): number[] {
    const bytes = [];
    for (let i = 0; i < str.length; i++) {
      bytes.push(str.charCodeAt(i));
    }
    return bytes;
  }

  /**
   * Convert base64 string to byte array
   * @param base64 Base64 string
   * @returns Byte array
   */
  private static base64ToBytes(base64: string): number[] {
    const binaryString = atob(base64);
    const bytes = [];
    for (let i = 0; i < binaryString.length; i++) {
      bytes.push(binaryString.charCodeAt(i));
    }
    return bytes;
  }

  /**
   * Store encrypted data in localStorage
   * @param key Storage key
   * @param data Data to store
   * @param encryptionKey Encryption key
   */
  static setEncryptedItem(key: string, data: string, encryptionKey: string): void {
    try {
      const encryptedData = this.encrypt(data, encryptionKey);
      localStorage.setItem(key, encryptedData);
    } catch (error) {
      console.error('Error storing encrypted data:', error);
    }
  }

  /**
   * Retrieve and decrypt data from localStorage
   * @param key Storage key
   * @param encryptionKey Encryption key
   * @returns Decrypted data or null if not found
   */
  static getEncryptedItem(key: string, encryptionKey: string): string | null {
    try {
      const encryptedData = localStorage.getItem(key);
      if (!encryptedData) {
        return null;
      }
      return this.decrypt(encryptedData, encryptionKey);
    } catch (error) {
      console.error('Error retrieving encrypted data:', error);
      return null;
    }
  }

  /**
   * Remove item from localStorage
   * @param key Storage key
   */
  static removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  /**
   * Clear all items from localStorage
   */
  static clear(): void {
    localStorage.clear();
  }

  /**
   * Generate a secure encryption key based on user agent and timestamp
   * Note: This is a basic implementation. In production, use a proper key derivation function.
   * @returns Encryption key
   */
  static generateEncryptionKey(): string {
    const userAgent = navigator.userAgent;
    const timestamp = Date.now().toString();
    const key = userAgent + timestamp;
    
    // Simple hash function for demonstration
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString();
  }
}