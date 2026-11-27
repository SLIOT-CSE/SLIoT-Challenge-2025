/**
 * Format a normalized Sri Lankan WhatsApp number (`+94771234567`) into readable groups
 * (`+94 77 123 4567`). Returns unrecognized or partial values trimmed without alteration.
 */
export function formatWhatsappDisplay(value: string): string {
  const trimmed = value.trim();
  const match = /^\+94(\d{2})(\d{3})(\d{4})$/.exec(trimmed);
  if (!match) return trimmed;
  return `+94 ${match[1]} ${match[2]} ${match[3]}`;
}
