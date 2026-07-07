import { useState, useRef, useEffect, useCallback } from 'react';

// Prevents screen from sleeping during active file transfer
// Uses the Screen Wake Lock API (supported on Chrome Android, Chrome desktop, Safari 16.4+)
// Gracefully degrades on unsupported browsers

export function useWakeLock() {
  const [isActive, setIsActive] = useState(false);
  const wakeLockRef = useRef(null);

  const requestWakeLock = useCallback(async () => {
    if (!('wakeLock' in navigator)) return; // not supported, fail silently
    if (wakeLockRef.current) return;
    try {
      wakeLockRef.current = await navigator.wakeLock.request('screen');
      setIsActive(true);
      wakeLockRef.current.addEventListener('release', () => setIsActive(false), { once: true });
    } catch (err) {
      console.warn('Wake Lock failed:', err); // non-fatal
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
      } catch (err) {
        console.warn('Failed to release Wake Lock:', err);
      }
      wakeLockRef.current = null;
      setIsActive(false);
    }
  }, []);

  // Re-acquire on tab visibility change (iOS releases lock when tab hidden)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isActive && !wakeLockRef.current) {
        await requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      releaseWakeLock();
    };
  }, [isActive, releaseWakeLock, requestWakeLock]);

  return { requestWakeLock, releaseWakeLock, isWakeLockActive: isActive };
}
