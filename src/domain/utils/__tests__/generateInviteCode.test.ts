import { describe, it, expect } from 'vitest';
import { generateInviteCode } from '../generateInviteCode';

describe('generateInviteCode', () => {
  it('generates a 6-character code', () => {
    const code = generateInviteCode();
    expect(code).toHaveLength(6);
  });

  it('uses only allowed characters', () => {
    const allowed = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/;
    for (let i = 0; i < 100; i++) {
      expect(generateInviteCode()).toMatch(allowed);
    }
  });

  it('does not contain ambiguous characters', () => {
    const ambiguous = /[0O1IL]/;
    for (let i = 0; i < 100; i++) {
      expect(generateInviteCode()).not.toMatch(ambiguous);
    }
  });

  it('generates unique codes', () => {
    const codes = new Set(Array.from({ length: 50 }, () => generateInviteCode()));
    expect(codes.size).toBe(50);
  });
});
