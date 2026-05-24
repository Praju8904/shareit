import { createContext, useContext, useState, useEffect } from 'react';
import { getOrCreateDeviceName, getOrCreateDeviceType } from '../utils/deviceName';
import { isFirstLoad, markLoaded, saveDeviceName, getHistory, saveTransfer, deleteTransfer, clearHistory } from '../utils/storage';
import useSocket from '../hooks/useSocket';
import useWebRTC from '../hooks/useWebRTC';

const ShareContext = createContext(null);

export function ShareProvider({ children }) {
  const [deviceName, setDeviceNameState] = useState(() => getOrCreateDeviceName());
  const [deviceType] = useState(() => getOrCreateDeviceType());
  const [isEditingName, setIsEditingName] = useState(false);
  const [showNameTooltip, setShowNameTooltip] = useState(false);
  const [history, setHistory] = useState(() => getHistory());

  useEffect(() => {
    if (isFirstLoad()) {
      setShowNameTooltip(true);
      markLoaded();
      setTimeout(() => setShowNameTooltip(false), 4000);
    }
  }, []);

  const {
    socket,
    connected,
    socketId,
    nearbyDevices,
    roomCode,
    roomPeers,
    createRoom,
    joinRoom,
    leaveRoom,
  } = useSocket(deviceName, deviceType);

  const updateDeviceName = (newName) => {
    const trimmed = newName.trim().slice(0, 24);
    if (!trimmed) return;
    saveDeviceName(trimmed);
    setDeviceNameState(trimmed);
    setIsEditingName(false);
    if (socket) {
      socket.emit('register', { deviceName: trimmed, deviceType });
    }
  };

  const addToHistory = (entry) => {
    saveTransfer(entry);
    setHistory(getHistory());
  };

  const removeFromHistory = (id) => {
    deleteTransfer(id);
    setHistory(getHistory());
  };

  const wipeHistory = () => {
    clearHistory();
    setHistory([]);
  };

  const allPeers = [...(nearbyDevices || []), ...(roomPeers || [])];
  const {
    startTransfer,
    transferProgress,
    incomingRequest,
    acceptTransfer,
    rejectTransfer,
    cancelTransfer,
    connectionState,
  } = useWebRTC(socket, addToHistory, allPeers);

  return (
    <ShareContext.Provider
      value={{
        deviceName,
        deviceType,
        isEditingName,
        setIsEditingName,
        updateDeviceName,
        showNameTooltip,
        history,
        addToHistory,
        removeFromHistory,
        wipeHistory,
        socket,
        connected,
        socketId,
        nearbyDevices,
        roomCode,
        roomPeers,
        createRoom,
        joinRoom,
        leaveRoom,
        startTransfer,
        transferProgress,
        incomingRequest,
        acceptTransfer,
        rejectTransfer,
        cancelTransfer,
        connectionState,
      }}
    >
      {children}
    </ShareContext.Provider>
  );
}

export function useShare() {
  const context = useContext(ShareContext);
  if (!context) {
    throw new Error('useShare must be used within a ShareProvider');
  }
  return context;
}
