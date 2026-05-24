const CHUNK_SIZE = 16384; // 16KB

/**
 * Generator that yields file chunks sequentially.
 * Does not preload the whole file into memory.
 */
export async function* chunkFile(file, chunkSize = CHUNK_SIZE) {
  const total = getTotalChunks(file.size, chunkSize);
  let offset = 0;
  let index = 0;

  while (offset < file.size) {
    const chunk = await file.slice(offset, offset + chunkSize).arrayBuffer();
    yield { chunk, index, total };
    offset += chunkSize;
    index++;
  }
}

export function getTotalChunks(fileSize, chunkSize = CHUNK_SIZE) {
  return Math.ceil(fileSize / chunkSize);
}

export function getFileIcon(mimeType) {
  if (!mimeType) return '📁';
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType.startsWith('video/')) return '🎬';
  if (mimeType.startsWith('audio/')) return '🎵';
  if (mimeType === 'application/pdf') return '📄';
  if (
    mimeType === 'application/zip' ||
    mimeType === 'application/x-rar' ||
    mimeType === 'application/x-rar-compressed' ||
    mimeType === 'application/gzip'
  ) {
    return '📦';
  }
  if (mimeType.startsWith('text/')) return '📝';
  return '📁';
}

export function formatFileSize(bytes) {
  if (bytes === 0 || !bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1) + ' ' + units[i];
}

export function generateTransferId() {
  return Array.from(crypto.getRandomValues(new Uint8Array(4)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
