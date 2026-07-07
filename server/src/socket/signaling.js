import crypto from 'crypto';

const roomPasswords = new Map();
const VALID_DEVICE_TYPES = new Set(['laptop', 'phone', 'tablet']);

function sanitizeDeviceName(value) {
  return String(value || 'Unknown Device')
    .replace(/[^\w .-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 24) || 'Unknown Device';
}

function sanitizeDeviceType(value) {
  return VALID_DEVICE_TYPES.has(value) ? value : 'laptop';
}

function normalizePasswordHash(value) {
  const hash = String(value || '').trim();
  return /^[a-f0-9]{64}$/i.test(hash) ? hash.toLowerCase() : '';
}

/**
 * Find all sockets that share the same IP as the given socket,
 * excluding the socket itself.
 *
 * @param {string} socketId  - The socket to find neighbours for
 * @param {Map}    devices   - The global devices Map
 * @returns {{ peerId: string, deviceName: string, deviceType: string }[]}
 */
function getNearbyDevices(socketId, devices) {
  const self = devices.get(socketId);
  if (!self) return [];

  const nearby = [];
  for (const [id, device] of devices) {
    if (id !== socketId && device.ip === self.ip) {
      nearby.push({
        peerId: id,
        deviceName: device.deviceName,
        deviceType: device.deviceType,
      });
    }
  }
  return nearby;
}

/**
 * Broadcast updated nearby-devices lists to every socket that shares the
 * same IP address as `referenceIp`.
 *
 * @param {import('socket.io').Server} io
 * @param {string}                     referenceIp
 * @param {Map}                        devices
 */
function broadcastNearbyUpdate(io, referenceIp, devices) {
  for (const [id, device] of devices) {
    if (device.ip === referenceIp) {
      const nearby = getNearbyDevices(id, devices);
      io.to(id).emit('nearby-devices', nearby);
    }
  }
}

/**
 * Generate a unique 6-character uppercase alphanumeric room code.
 *
 * @param {Map} rooms - The global rooms Map (used to check uniqueness)
 * @returns {string}
 */
function generateRoomCode(rooms) {
  let code;
  do {
    code = crypto.randomBytes(4).toString('hex').slice(0, 6).toUpperCase();
  } while (rooms.has(code));
  return code;
}

function arePeersAllowed(from, to, devices) {
  const sender = devices.get(from);
  const receiver = devices.get(to);
  if (!sender || !receiver) return false;
  if (sender.ip && sender.ip === receiver.ip) return true;
  return Boolean(sender.roomCode && sender.roomCode === receiver.roomCode);
}

function relaySignal(io, socket, devices, event, { to, ...payload }) {
  if (!to || !arePeersAllowed(socket.id, to, devices)) {
    socket.emit('signal-error', { message: 'Peer is not reachable from this device' });
    console.log(
      `[${new Date().toISOString()}] SIGNAL_BLOCKED - ${socket.id} attempted ${event} to ${to}`,
    );
    return;
  }

  io.to(to).emit(event, { from: socket.id, ...payload });
}

/**
 * Set up all signaling event handlers on the given socket.
 *
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 * @param {Map<string, Set<string>>}   rooms
 * @param {Map<string, object>}        devices
 */
export function handleSignaling(io, socket, rooms, devices) {
  // ── register ────────────────────────────────────────────────────────────
  socket.on('register', ({ deviceName, deviceType }) => {
    const ip =
      socket.handshake.headers['x-forwarded-for'] ||
      socket.handshake.address;

    const safeDeviceName = sanitizeDeviceName(deviceName);
    const safeDeviceType = sanitizeDeviceType(deviceType);

    const previousDevice = devices.get(socket.id);
    devices.set(socket.id, {
      deviceName: safeDeviceName,
      deviceType: safeDeviceType,
      ip,
      roomCode: previousDevice?.roomCode || null,
    });

    socket.emit('registered', { socketId: socket.id });

    // Notify the registering socket AND every other socket on the same IP
    broadcastNearbyUpdate(io, ip, devices);

    console.log(
      `[${new Date().toISOString()}] REGISTER - ${safeDeviceName} (${safeDeviceType}) from ${ip} as ${socket.id}`,
    );
  });

  // ── create-room ─────────────────────────────────────────────────────────
  socket.on('create-room', ({ passwordHash } = {}) => {
    const roomCode = generateRoomCode(rooms);
    rooms.set(roomCode, new Set([socket.id]));
    const safePasswordHash = normalizePasswordHash(passwordHash);
    if (safePasswordHash) {
      roomPasswords.set(roomCode, safePasswordHash);
    }

    const device = devices.get(socket.id);
    if (device) {
      device.roomCode = roomCode;
    }

    socket.join(roomCode);
    socket.emit('room-created', { roomCode, isPasswordProtected: Boolean(safePasswordHash) });

    console.log(
      `[${new Date().toISOString()}] CREATE_ROOM - ${socket.id} created room ${roomCode}`,
    );
  });

  // ── join-room ───────────────────────────────────────────────────────────
  socket.on('join-room', ({ roomCode, passwordHash } = {}) => {
    const room = rooms.get(roomCode);
    if (!room) {
      socket.emit('room-error', { message: `Room ${roomCode} does not exist` });
      console.log(
        `[${new Date().toISOString()}] JOIN_ROOM_FAIL - ${socket.id} tried non-existent room ${roomCode}`,
      );
      return;
    }

    const expectedPasswordHash = roomPasswords.get(roomCode);
    if (expectedPasswordHash && expectedPasswordHash !== normalizePasswordHash(passwordHash)) {
      socket.emit('room-error', { message: 'Incorrect room password' });
      console.log(
        `[${new Date().toISOString()}] JOIN_ROOM_DENIED - ${socket.id} failed password for ${roomCode}`,
      );
      return;
    }

    room.add(socket.id);

    const device = devices.get(socket.id);
    if (device) {
      device.roomCode = roomCode;
    }

    socket.join(roomCode);

    // Build peer list for the joiner (everyone already in the room except self)
    const peers = [];
    for (const peerId of room) {
      if (peerId === socket.id) continue;
      const peerDevice = devices.get(peerId);
      if (peerDevice) {
        peers.push({
          peerId,
          deviceName: peerDevice.deviceName,
          deviceType: peerDevice.deviceType,
        });
      }
    }

    socket.emit('room-joined', { roomCode, peers });

    // Notify existing room members about the new peer
    if (device) {
      socket.to(roomCode).emit('peer-joined', {
        peerId: socket.id,
        deviceName: device.deviceName,
        deviceType: device.deviceType,
      });
    }

    console.log(
      `[${new Date().toISOString()}] JOIN_ROOM - ${socket.id} joined room ${roomCode} (${room.size} members)`,
    );
  });

  // ── leave-room ──────────────────────────────────────────────────────────
  socket.on('leave-room', () => {
    const device = devices.get(socket.id);
    if (!device || !device.roomCode) return;

    const roomCode = device.roomCode;
    const room = rooms.get(roomCode);

    if (room) {
      room.delete(socket.id);
      if (room.size === 0) {
        rooms.delete(roomCode);
        roomPasswords.delete(roomCode);
      }
    }

    socket.leave(roomCode);
    device.roomCode = null;

    socket.to(roomCode).emit('peer-left', { peerId: socket.id });

    console.log(
      `[${new Date().toISOString()}] LEAVE_ROOM - ${socket.id} left room ${roomCode}`,
    );
  });

  // ── WebRTC signaling relay ──────────────────────────────────────────────
  socket.on('offer', ({ to, offer }) => {
    relaySignal(io, socket, devices, 'offer', { to, offer });
  });

  socket.on('answer', ({ to, answer }) => {
    relaySignal(io, socket, devices, 'answer', { to, answer });
  });

  socket.on('ice-candidate', ({ to, candidate }) => {
    relaySignal(io, socket, devices, 'ice-candidate', { to, candidate });
  });

  // ── disconnect ──────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    const device = devices.get(socket.id);
    if (!device) {
      console.log(
        `[${new Date().toISOString()}] DISCONNECT - ${socket.id} (unregistered)`,
      );
      return;
    }

    const { roomCode, ip, deviceName } = device;

    // Clean up room membership
    if (roomCode) {
      const room = rooms.get(roomCode);
      if (room) {
        room.delete(socket.id);
        socket.to(roomCode).emit('peer-left', { peerId: socket.id });
        if (room.size === 0) {
          rooms.delete(roomCode);
          roomPasswords.delete(roomCode);
        }
      }
    }

    // Remove device record
    devices.delete(socket.id);

    // Recalculate and broadcast nearby-devices for remaining sockets on same IP
    broadcastNearbyUpdate(io, ip, devices);

    console.log(
      `[${new Date().toISOString()}] DISCONNECT - ${deviceName} (${socket.id}) disconnected`,
    );
  });
}
