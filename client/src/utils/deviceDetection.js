export function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

export function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export function isAndroid() {
  return /Android/i.test(navigator.userAgent);
}

export function isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// Adaptive chunk size based on device:
// iOS Safari: 8KB  — lower buffer limits
// Android:    16KB — stable
// Desktop:    16KB — stable
export function getAdaptiveChunkSize() {
  if (isIOS()) return 8192;    // 8KB for iOS
  return 16384;                // 16KB for everything else
}

// Adaptive buffer threshold:
// iOS: 64KB pause threshold (much more conservative)
// Others: 256KB
export function getBufferThreshold() {
  if (isIOS()) return 65536;
  return 262144;
}
