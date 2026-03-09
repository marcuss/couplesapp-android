/**
 * Generate a 6-character alphanumeric invite code.
 * Uses charset without ambiguous characters (0/O/1/I/L).
 */
const CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateInviteCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, (b) => CHARSET[b % CHARSET.length]).join('');
}
