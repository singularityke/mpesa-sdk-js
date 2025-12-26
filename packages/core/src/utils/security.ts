import * as crypto from "crypto";
import * as fs from "fs";
/**
 * Encrypt initiator password with M-pesa public certificate
 * @param initiatorPassword - Plain text initiator password
 * @param certificatePath - Path to M-pesa public certificate (.cer file)
 */
export function encryptInitiatorPassword(
  initiatorPassword: string,
  certificatePath: string,
): string {
  try {
    const certificate = fs.readFileSync(certificatePath, "utf8");
    const publicKey = crypto.createPublicKey(certificate);
    const encrypted = crypto.publicEncrypt(
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_PADDING,
      },
      Buffer.from(initiatorPassword),
    );
    return encrypted.toString("base64");
  } catch (error: any) {
    throw new Error(`Failed to encrypt initiator password: ${error.message}`);
  }
}
/**
 * Helper to validate security credential format
 */
export function validateSecurityCredential(credential: string): boolean {
  const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/; // base64 regex
  return base64Regex.test(credential) && credential.length > 100;
}
