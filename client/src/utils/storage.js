const KEYS = {
  DEVICE_NAME: 'shareit-device-name',
  DEVICE_TYPE: 'shareit-device-type',
  HISTORY: 'shareit-history',
  FIRST_LOAD: 'shareit-first-load'
};

// Device name
export function getSavedDeviceName() {
  try {
    return localStorage.getItem(KEYS.DEVICE_NAME);
  } catch (e) {
    return null;
  }
}

export function saveDeviceName(name) {
  if (!name) return;
  try {
    const trimmed = name.trim().slice(0, 24);
    localStorage.setItem(KEYS.DEVICE_NAME, trimmed);
  } catch (e) {
    console.warn('[Storage] Failed to save device name', e);
  }
}

// Device type
export function getSavedDeviceType() {
  try {
    return localStorage.getItem(KEYS.DEVICE_TYPE);
  } catch (e) {
    return null;
  }
}

export function saveDeviceType(type) {
  if (!type) return;
  try {
    localStorage.setItem(KEYS.DEVICE_TYPE, type);
  } catch (e) {
    console.warn('[Storage] Failed to save device type', e);
  }
}

// History
export function getHistory() {
  try {
    const data = localStorage.getItem(KEYS.HISTORY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('[Storage] Failed to get history', e);
    return [];
  }
}

export function saveTransfer(entry) {
  try {
    const history = getHistory();
    // Prepend new entry
    history.unshift(entry);
    // Keep max 100 entries
    if (history.length > 100) {
      history.length = 100;
    }
    localStorage.setItem(KEYS.HISTORY, JSON.stringify(history));
  } catch (e) {
    console.warn('[Storage] Failed to save transfer', e);
  }
}

export function clearHistory() {
  try {
    localStorage.removeItem(KEYS.HISTORY);
  } catch (e) {
    console.warn('[Storage] Failed to clear history', e);
  }
}

export function deleteTransfer(id) {
  try {
    const history = getHistory();
    const updated = history.filter((item) => item.id !== id);
    localStorage.setItem(KEYS.HISTORY, JSON.stringify(updated));
  } catch (e) {
    console.warn('[Storage] Failed to delete transfer', e);
  }
}

// First load flag
export function isFirstLoad() {
  try {
    return !localStorage.getItem(KEYS.FIRST_LOAD);
  } catch (e) {
    return false;
  }
}

export function markLoaded() {
  try {
    localStorage.setItem(KEYS.FIRST_LOAD, 'true');
  } catch (e) {
    console.warn('[Storage] Failed to mark loaded', e);
  }
}
