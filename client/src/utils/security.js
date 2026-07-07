export function sanitizeDeviceName(value) {
  return String(value || '')
    .replace(/[^\w .-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 24);
}

function fallbackHashHex(bytes) {
  let hash = 2166136261;
  for (const byte of bytes) {
    hash ^= byte;
    hash = Math.imul(hash, 16777619);
  }
  const block = (hash >>> 0).toString(16).padStart(8, '0');
  return block.repeat(8);
}

async function digestBytes(bytes) {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    return fallbackHashHex(bytes);
  }
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function sha256Hex(value) {
  const bytes = new TextEncoder().encode(String(value || ''));
  return digestBytes(bytes);
}

export async function hashBlob(blob) {
  return digestBytes(new Uint8Array(await blob.arrayBuffer()));
}

export async function hashOptionalPassword(password) {
  const trimmed = String(password || '').trim();
  return trimmed ? sha256Hex(trimmed) : '';
}
