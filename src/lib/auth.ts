import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const SALT_ROUNDS = 12;

/**
 * Hash a password using bcrypt with a per-password salt.
 * Resistant to rainbow tables and brute-force GPU attacks
 * (unlike the previous SHA-256 + static salt).
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a bcrypt hash.
 * Constant-time comparison inside bcrypt prevents timing attacks.
 */
export async function verifyPassword(
  password: string,
  hashed: string
): Promise<boolean> {
  return bcrypt.compare(password, hashed);
}

export function generateToken(): string {
  return randomBytes(32).toString("hex");
}
