const adjectives = [
  'Swift', 'Blue', 'Crimson', 'Silver', 'Golden',
  'Shadow', 'Thunder', 'Crystal', 'Phantom', 'Neon',
  'Cosmic', 'Stellar', 'Ember', 'Frost', 'Storm',
  'Mystic', 'Solar', 'Lunar', 'Iron', 'Quantum'
];

const nouns = [
  'Falcon', 'Phoenix', 'Dragon', 'Wolf', 'Tiger',
  'Hawk', 'Viper', 'Jaguar', 'Eagle', 'Panther',
  'Cobra', 'Raven', 'Lion', 'Bear', 'Shark',
  'Lynx', 'Fox', 'Orca', 'Puma', 'Stag'
];

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

import { getSavedDeviceName, saveDeviceName, getSavedDeviceType, saveDeviceType } from './storage';

function generateDeviceName() {
  let seed;

  if (typeof navigator !== 'undefined' && navigator.userAgent) {
    seed = hashString(navigator.userAgent);
  } else {
    seed = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
  }

  const adjIndex = seed % 20;
  const nounIndex = Math.floor(seed / 20) % 20;

  return `${adjectives[adjIndex]}-${nouns[nounIndex]}`;
}

function getDeviceType() {
  if (typeof navigator === 'undefined' || !navigator.userAgent) {
    return 'laptop';
  }

  const ua = navigator.userAgent.toLowerCase();

  if (ua.includes('ipad') || ua.includes('tablet')) {
    return 'tablet';
  }

  if (ua.includes('iphone') || (ua.includes('android') && ua.includes('mobile'))) {
    return 'phone';
  }

  return 'laptop';
}

export function getOrCreateDeviceName() {
  const saved = getSavedDeviceName();
  if (saved) return saved;

  const generated = generateDeviceName();
  saveDeviceName(generated);
  return generated;
}

export function getOrCreateDeviceType() {
  const saved = getSavedDeviceType();
  if (saved) return saved;

  const type = getDeviceType();
  saveDeviceType(type);
  return type;
}
