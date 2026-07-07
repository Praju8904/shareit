import { useState } from 'react';
import { Plus, LogIn, LogOut, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import DeviceCard from './DeviceCard';
import { hashOptionalPassword } from '../utils/security';

export default function RoomPanel({ roomCode, roomPeers, onCreateRoom, onJoinRoom, onLeaveRoom, onSendFile }) {
  const [joinCode, setJoinCode] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [joinPassword, setJoinPassword] = useState('');

  const handleCreateRoom = async () => {
    const passwordHash = await hashOptionalPassword(roomPassword);
    onCreateRoom(passwordHash);
    setRoomPassword('');
  };

  const handleJoinSubmit = async (e) => {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) {
      toast.error('Room code must be 6 characters');
      return;
    }
    console.log('[RoomPanel] Joining room:', code);
    const passwordHash = await hashOptionalPassword(joinPassword);
    onJoinRoom(code, passwordHash);
    setJoinCode('');
    setJoinPassword('');
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      toast.success('Room code copied!');
      console.log('[RoomPanel] Room code copied:', roomCode);
    } catch {
      toast.error('Failed to copy room code');
    }
  };

  // Not in a room
  if (!roomCode) {
    return (
      <div className="flex flex-col gap-6 p-2 sm:p-0">
        <div className="text-center sm:text-left">
          <h2 className="text-lg font-bold text-slate-100 mb-1">Private Room</h2>
          <p className="text-slate-400 text-sm">Create or join a room for secure sharing across different networks.</p>
        </div>

        {/* Create Room */}
        <button
          onClick={async () => {
            console.log('[RoomPanel] Creating room...');
            await handleCreateRoom();
          }}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 text-base min-h-touch active:scale-95 transition-transform"
        >
          <Plus className="w-5 h-5" />
          <span>Create New Room</span>
        </button>

        <input
          type="password"
          value={roomPassword}
          onChange={(e) => setRoomPassword(e.target.value)}
          placeholder="Optional room password"
          className="input-field w-full"
          autoComplete="new-password"
        />

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-navy-700" />
          <span className="text-slate-500 text-xs uppercase tracking-widest font-semibold">or</span>
          <div className="flex-1 h-px bg-navy-700" />
        </div>

        {/* Join Room Form */}
        <form onSubmit={handleJoinSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            inputMode="text"
            autoCapitalize="characters"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            maxLength={6}
            placeholder="ENTER CODE"
            className="input-field flex-1 text-center sm:text-left font-mono tracking-widest uppercase text-lg sm:text-base min-h-touch"
          />
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="password"
              value={joinPassword}
              onChange={(e) => setJoinPassword(e.target.value)}
              placeholder="Room password, if set"
              className="input-field flex-1 min-h-touch"
              autoComplete="current-password"
            />
            <button
              type="submit"
              className="btn-secondary flex items-center justify-center gap-2 px-6 min-h-touch active:scale-95 transition-transform"
              disabled={joinCode.length !== 6}
            >
              <LogIn className="w-4 h-4" />
              <span>Join</span>
            </button>
          </div>
        </form>
      </div>
    );
  }

  // In a room
  return (
    <div className="flex flex-col gap-6">
      {/* Room Code Display */}
      <div className="bg-navy-800/50 rounded-xl p-6 border border-navy-700/50 flex flex-col items-center justify-center text-center">
        <p className="text-slate-400 text-xs uppercase tracking-wider mb-3 font-semibold">Room Code</p>
        
        <div 
          onClick={handleCopyCode}
          className="group flex flex-col sm:flex-row items-center justify-center gap-3 cursor-pointer active:scale-95 transition-all w-full"
        >
          <span className="text-4xl sm:text-3xl font-mono font-bold gradient-text tracking-[0.2em] select-all">
            {roomCode}
          </span>
          <div className="flex items-center gap-2 text-slate-400 group-hover:text-cyan-400 bg-navy-900/50 sm:bg-transparent px-4 py-2 sm:p-2 rounded-lg mt-2 sm:mt-0 min-h-touch w-full sm:w-auto justify-center">
            <Copy className="w-4 h-4" />
            <span className="text-sm sm:hidden font-medium">Tap to copy code</span>
          </div>
        </div>
        
        <p className="text-slate-500 text-xs mt-4">Share this 6-letter code with others</p>
      </div>

      {/* Leave Room */}
      <button
        onClick={() => {
          console.log('[RoomPanel] Leaving room:', roomCode);
          onLeaveRoom();
        }}
        className="btn-danger w-full flex items-center justify-center gap-2 py-3 min-h-touch active:scale-95 transition-transform"
      >
        <LogOut className="w-4 h-4" />
        <span>Leave Room</span>
      </button>

      {/* Divider */}
      <div className="flex items-center gap-4 mt-2">
        <div className="flex-1 h-px bg-navy-700" />
        <span className="text-slate-500 text-xs uppercase tracking-widest font-semibold">Peers in Room</span>
        <div className="flex-1 h-px bg-navy-700" />
      </div>

      {/* Room Peers */}
      {roomPeers && roomPeers.length > 0 ? (
        <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
          {roomPeers.map((peer) => (
            <DeviceCard
              key={peer.peerId}
              peerId={peer.peerId}
              deviceName={peer.deviceName}
              deviceType={peer.deviceType}
              onSendFile={onSendFile}
              showSendButton={true}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-navy-800/30 rounded-xl border border-dashed border-navy-700">
          <p className="text-slate-400 text-sm animate-pulse">
            Waiting for others to join...
          </p>
        </div>
      )}
    </div>
  );
}
