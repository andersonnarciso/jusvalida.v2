import crypto from 'crypto';

// SECURE Encryption configuration
const ALGORITHM = 'aes-256-gcm'; // FIXED: Using GCM for authentication
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 12; // 96 bits for GCM (recommended)
const TAG_LENGTH = 16; // 128 bits for GCM auth tag

// Versioning for migration support
const CURRENT_VERSION = 'v2_gcm';
const LEGACY_VERSION = 'v1_cbc';

// Get encryption key from environment variable
function getEncryptionKey(): Buffer {
  const keyString = process.env.ENCRYPTION_KEY;
  if (!keyString) {
    throw new Error('ENCRYPTION_KEY environment variable is required for API key encryption');
  }
  
  // SECURITY: Validate key length at runtime
  if (keyString.length < 32) {
    throw new Error('ENCRYPTION_KEY must be at least 32 characters long for security');
  }
  
  // Create a consistent 32-byte key from the environment variable
  return crypto.createHash('sha256').update(keyString).digest();
}

/**
 * SECURE: Encrypts a plain text API key using AES-256-GCM with authentication
 * @param plainText - The plain text API key to encrypt
 * @returns Encrypted string in format: version:base64(iv:ciphertext:authTag)
 */
export function encryptApiKey(plainText: string): string {
  if (!plainText) {
    throw new Error('Cannot encrypt empty or null API key');
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH); // FIXED: Random IV for each encryption
  
  // FIXED: Using secure createCipheriv with IV
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(plainText, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  // SECURITY: Get authentication tag for GCM
  const authTag = cipher.getAuthTag();
  
  // SECURE FORMAT: version:iv:ciphertext:authTag (all base64 encoded)
  const combinedData = Buffer.concat([
    iv,
    Buffer.from(encrypted, 'base64'),
    authTag
  ]);
  
  return `${CURRENT_VERSION}:${combinedData.toString('base64')}`;
}

/**
 * SECURE: Decrypts an encrypted API key with authentication verification
 * @param encryptedText - The encrypted text in format: version:base64(iv:ciphertext:authTag)
 * @returns The decrypted plain text API key
 */
export function decryptApiKey(encryptedText: string): string {
  if (!encryptedText) {
    throw new Error('Cannot decrypt empty or null encrypted data');
  }

  const parts = encryptedText.split(':');
  if (parts.length < 2) {
    throw new Error('Invalid encrypted API key format');
  }

  const version = parts[0];
  
  // Handle legacy format for migration
  if (version === LEGACY_VERSION || (!version.startsWith('v') && parts.length === 2)) {
    return decryptLegacyApiKey(encryptedText);
  }
  
  // Handle current secure format
  if (version !== CURRENT_VERSION) {
    throw new Error(`Unsupported encryption version: ${version}`);
  }

  const key = getEncryptionKey();
  const combinedData = Buffer.from(parts[1], 'base64');
  
  // Extract components: iv (12) + ciphertext + authTag (16)
  if (combinedData.length < IV_LENGTH + TAG_LENGTH) {
    throw new Error('Invalid encrypted data: too short');
  }
  
  const iv = combinedData.subarray(0, IV_LENGTH);
  const authTag = combinedData.subarray(-TAG_LENGTH);
  const encrypted = combinedData.subarray(IV_LENGTH, -TAG_LENGTH);

  // FIXED: Using secure createDecipheriv with IV and auth tag
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, undefined, 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * LEGACY: Decrypts old format for migration (INSECURE - only for migration)
 * @param encryptedText - Legacy encrypted text
 * @returns Decrypted text
 */
function decryptLegacyApiKey(encryptedText: string): string {
  console.warn('SECURITY WARNING: Decrypting legacy insecure format for migration');
  
  const parts = encryptedText.split(':');
  if (parts.length !== 2) {
    throw new Error('Invalid legacy encrypted API key format');
  }

  const key = getEncryptionKey();
  const iv = Buffer.from(parts[0], 'base64');
  const encrypted = parts[1];

  // Legacy insecure method (for migration only)
  const decipher = crypto.createDecipher('aes-256-cbc', key);
  
  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Migrates a legacy encrypted key to the new secure format
 * @param legacyEncryptedText - Legacy encrypted API key
 * @returns New secure encrypted API key
 */
export function migrateApiKey(legacyEncryptedText: string): string {
  try {
    // First decrypt using legacy method
    const plainText = decryptLegacyApiKey(legacyEncryptedText);
    
    // Re-encrypt using secure method
    const secureEncrypted = encryptApiKey(plainText);
    
    console.log('Successfully migrated API key to secure format');
    return secureEncrypted;
  } catch (error) {
    console.error('Failed to migrate API key:', error);
    throw new Error('API key migration failed');
  }
}

/**
 * Detects if an encrypted key is in legacy format
 * @param encryptedText - Encrypted text to check
 * @returns True if legacy format
 */
export function isLegacyFormat(encryptedText: string): boolean {
  if (!encryptedText) return false;
  
  const parts = encryptedText.split(':');
  // Legacy format: iv:ciphertext (no version prefix)
  // New format: version:data
  return parts.length === 2 && !parts[0].startsWith('v');
}

/**
 * Creates a masked version of an API key showing only the last 4 characters
 * @param apiKey - The plain text API key
 * @returns Masked string like "****abcd"
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 4) {
    return '****';
  }
  
  const lastFour = apiKey.slice(-4);
  const maskLength = Math.min(apiKey.length - 4, 12); // Limit mask to reasonable length
  const mask = '*'.repeat(maskLength);
  
  return `${mask}${lastFour}`;
}

/**
 * SECURITY: Validates that the encryption/decryption system is working
 * Tests both deterministic behavior and round-trip functionality
 */
export function validateEncryption(): boolean {
  try {
    const testKey = 'test-api-key-12345';
    
    // Test 1: Round-trip encryption/decryption
    const encrypted1 = encryptApiKey(testKey);
    const decrypted1 = decryptApiKey(encrypted1);
    
    if (testKey !== decrypted1) {
      console.error('Encryption validation failed: Round-trip mismatch');
      return false;
    }
    
    // Test 2: NON-deterministic behavior (security requirement)
    const encrypted2 = encryptApiKey(testKey);
    
    if (encrypted1 === encrypted2) {
      console.error('SECURITY FAILURE: Encryption is deterministic! Same plaintext produces same ciphertext');
      return false;
    }
    
    // Test 3: Both encrypt differently but decrypt to same value
    const decrypted2 = decryptApiKey(encrypted2);
    if (testKey !== decrypted2) {
      console.error('Encryption validation failed: Second decryption mismatch');
      return false;
    }
    
    // Test 4: Validate key length requirements
    const originalKey = process.env.ENCRYPTION_KEY;
    if (!originalKey || originalKey.length < 32) {
      console.error('ENCRYPTION_KEY validation failed: Key too short');
      return false;
    }
    
    console.log('✅ Encryption validation passed: Secure, non-deterministic AES-256-GCM');
    return true;
    
  } catch (error) {
    console.error('Encryption validation failed:', error);
    return false;
  }
}

/**
 * SECURITY: Runtime validation called at application startup
 * Ensures encryption system is properly configured and secure
 */
export function validateEncryptionStartup(): void {
  console.log('🔐 Validating encryption system...');
  
  // Check environment variable
  const keyString = process.env.ENCRYPTION_KEY;
  if (!keyString) {
    console.error('❌ CRITICAL: ENCRYPTION_KEY environment variable is missing');
    process.exit(1);
  }
  
  if (keyString.length < 32) {
    console.error('❌ CRITICAL: ENCRYPTION_KEY must be at least 32 characters for security');
    process.exit(1);
  }
  
  // Validate encryption functionality
  if (!validateEncryption()) {
    console.error('❌ CRITICAL: Encryption validation failed');
    process.exit(1);
  }
  
  console.log('✅ Encryption system validated successfully');
}

/**
 * Batch migration utility for upgrading all legacy encrypted keys
 * @param legacyKeys - Array of legacy encrypted keys
 * @returns Array of securely encrypted keys
 */
export function batchMigrateApiKeys(legacyKeys: string[]): string[] {
  const results: string[] = [];
  const errors: Array<{index: number, error: string}> = [];
  
  legacyKeys.forEach((legacyKey, index) => {
    try {
      if (isLegacyFormat(legacyKey)) {
        const migrated = migrateApiKey(legacyKey);
        results.push(migrated);
        console.log(`✅ Migrated key ${index + 1}/${legacyKeys.length}`);
      } else {
        // Already in new format
        results.push(legacyKey);
        console.log(`✅ Key ${index + 1}/${legacyKeys.length} already secure`);
      }
    } catch (error) {
      errors.push({index, error: error instanceof Error ? error.message : 'Unknown error'});
      results.push(legacyKey); // Keep original on error
      console.error(`❌ Failed to migrate key ${index + 1}:`, error);
    }
  });
  
  if (errors.length > 0) {
    console.warn(`⚠️  Migration completed with ${errors.length} errors`);
  } else {
    console.log('✅ All keys migrated successfully');
  }
  
  return results;
}