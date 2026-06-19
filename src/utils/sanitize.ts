/**
 * sanitize.ts — lightweight input sanitisation for display names and attribute values.
 * Strips control characters and trims whitespace.
 * For filesystem-safe path components, use sanitizeName() in dataLoader.ts.
 */

/**
 * Sanitises a user-supplied display name or attribute value.
 * - Strips C0 control characters (0x00–0x1f) and DEL (0x7f)
 * - Trims surrounding whitespace
 * - Returns '' if the result is empty
 */
export function sanitizeText(input: string): string {
  // eslint-disable-next-line no-control-regex
  return input.replace(/[\x00-\x1f\x7f]/g, '').trim()
}
