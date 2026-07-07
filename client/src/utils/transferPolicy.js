const SETTINGS_KEY = 'shareit-transfer-settings';
const RECEIVED_NAMES_KEY = 'shareit-received-file-names';

export const FILE_TYPE_GROUPS = {
  images: ['image/'],
  videos: ['video/'],
  audio: ['audio/'],
  documents: [
    'application/pdf',
    'text/',
    'application/msword',
    'application/vnd.openxmlformats-officedocument',
  ],
  archives: [
    'application/zip',
    'application/x-rar',
    'application/x-rar-compressed',
    'application/gzip',
  ],
};

export const DEFAULT_TRANSFER_SETTINGS = {
  maxFiles: 25,
  maxTotalBytes: 1024 * 1024 * 1024,
  receiveGroups: ['images', 'videos', 'audio', 'documents', 'archives'],
  askDownloadLocation: false,
};

export function getTransferSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null');
    return { ...DEFAULT_TRANSFER_SETTINGS, ...(saved || {}) };
  } catch {
    return DEFAULT_TRANSFER_SETTINGS;
  }
}

export function saveTransferSettings(settings) {
  try {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ ...DEFAULT_TRANSFER_SETTINGS, ...settings }),
    );
  } catch (err) {
    console.warn('[TransferPolicy] Failed to save settings', err);
  }
}

export function isFileAllowed(fileOrMeta, settings = getTransferSettings()) {
  const mimeType = fileOrMeta?.type || fileOrMeta?.mimeType || 'application/octet-stream';
  const groups = settings.receiveGroups || DEFAULT_TRANSFER_SETTINGS.receiveGroups;
  if (groups.length === 0) return false;

  return groups.some((groupName) => {
    const matchers = FILE_TYPE_GROUPS[groupName] || [];
    return matchers.some((matcher) => (
      matcher.endsWith('/') ? mimeType.startsWith(matcher) : mimeType.startsWith(matcher)
    ));
  });
}

export function validateFileBatch(files, settings = getTransferSettings()) {
  const list = Array.from(files || []);
  if (list.length === 0) return { ok: false, message: 'Choose at least one file' };
  if (list.length > settings.maxFiles) {
    return { ok: false, message: `You can send up to ${settings.maxFiles} files at once` };
  }

  const totalBytes = list.reduce((sum, file) => sum + file.size, 0);
  if (totalBytes > settings.maxTotalBytes) {
    return { ok: false, message: 'This batch is larger than your transfer limit' };
  }

  const blocked = list.find((file) => !isFileAllowed(file, settings));
  if (blocked) {
    return { ok: false, message: `${blocked.name} is blocked by your file type rules` };
  }

  return { ok: true, files: list, totalBytes };
}

function getReceivedNames() {
  try {
    return JSON.parse(localStorage.getItem(RECEIVED_NAMES_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveReceivedNames(names) {
  try {
    localStorage.setItem(RECEIVED_NAMES_KEY, JSON.stringify([...new Set(names)].slice(-250)));
  } catch (err) {
    console.warn('[TransferPolicy] Failed to save received names', err);
  }
}

export function reserveDownloadName(fileName) {
  const names = getReceivedNames();
  if (!names.includes(fileName)) {
    saveReceivedNames([...names, fileName]);
    return { action: 'save', fileName };
  }

  const keepBoth = window.confirm(
    `${fileName} was received before. Press OK to keep both, or Cancel to skip this download.`,
  );
  if (!keepBoth) return { action: 'skip', fileName };

  const dotIndex = fileName.lastIndexOf('.');
  const base = dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName;
  const ext = dotIndex > 0 ? fileName.slice(dotIndex) : '';
  let index = 1;
  let nextName = `${base} (${index})${ext}`;
  while (names.includes(nextName)) {
    index += 1;
    nextName = `${base} (${index})${ext}`;
  }

  saveReceivedNames([...names, nextName]);
  return { action: 'save', fileName: nextName };
}

export async function saveBlobToDisk(blob, fileName, settings = getTransferSettings()) {
  const reserved = reserveDownloadName(fileName);
  if (reserved.action === 'skip') return false;

  if (settings.askDownloadLocation && 'showSaveFilePicker' in window) {
    const handle = await window.showSaveFilePicker({
      suggestedName: reserved.fileName,
    });
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
    return true;
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = reserved.fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}
