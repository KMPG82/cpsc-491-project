// Presentation only: never replace the address stored on a selected Location.
export function formatAddress(address: string): { primary: string; secondary: string } {
  const parts = address.split(',').map((part) => part.trim()).filter(Boolean);
  // Remove only a standalone trailing US country label, preserving other data.
  if (parts.length > 1 && /^(United States of America|United States|USA|US)$/i.test(parts[parts.length - 1])) {
    parts.pop();
  }
  return {
    primary: parts[0] || address.trim() || 'Selected location',
    secondary: parts.slice(1).join(', '),
  };
}
