/** Clamp pagination limit to prevent abuse */
export function clampLimit(raw: number, max = 100, defaultVal = 50): number {
  if (isNaN(raw) || raw < 1) return defaultVal;
  return Math.min(raw, max);
}

/** Clamp page number */
export function clampPage(raw: number): number {
  if (isNaN(raw) || raw < 1) return 1;
  return Math.floor(raw);
}

/** Sanitize string input - trim and limit length */
export function sanitizeString(input: unknown, maxLength = 500): string {
  if (typeof input !== "string") return "";
  return input.trim().slice(0, maxLength);
}

/** Validate email format */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

/** Validate amount is a positive finite number */
export function isValidAmount(amount: unknown): boolean {
  const n = typeof amount === "string" ? parseFloat(amount) : Number(amount);
  return !isNaN(n) && isFinite(n) && n > 0 && n <= 999_999_999;
}

/** Parse and validate amount, returns null if invalid */
export function parseAmount(amount: unknown): number | null {
  const n = typeof amount === "string" ? parseFloat(amount) : Number(amount);
  if (isNaN(n) || !isFinite(n) || n <= 0 || n > 999_999_999) return null;
  return Math.round(n * 100) / 100; // 2 decimal places
}
