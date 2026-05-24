import { useState } from 'react';
import { Plus, LogIn, LogOut, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import DeviceCard from './DeviceCard';

export default function RoomPanel({ roomCode, roomPeers, onCreateRoom, onJoinRoom, onLeaveRoom, onSendFile }) {
  const [joinCode, setJoinCode] = useState('');

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) {
      toast.error('Room code must be 6 characters');
      return;
    }
    console.log('[RoomPanel] Joining room:', code);
    onJoinRoom(code);
    setJoinCode('');
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      toast.success('Room code copied to clipboard!');
      console.log('[RoomPanel] Room code copied:', roomCode);
    } catch {
      toast.error('Failed to copy room code');
    }
  };

  // Not in a room
  if (!roomCode) {
    return (
      <div className="flex flex-col gap-6">
        <div className="text-center">
          <h2 className="text-lg font-bold text-slate-100 mb-1">Private Room</h2>
          <p className="text-slate-400 text-sm">Create or join a room for secure sharing</p>
        </div>

        {/* Create Room */}
        <button
          onClick={() => {
            console.log('[RoomPanel] Creating room...');
            onCreateRoom();
          }}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base"
        >
          <Plus className="w-5 h-5" />
          <span>Create Room</span>
        </button>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-navy-700" />
          <span className="text-slate-500 text-xs uppercase tracking-widest">or</span>
          <div className="flex-1 h-px bg-navy-700" />
        </div>

        {/* Join Room Form */}
        <form onSubmit={handleJoinSubmit} className="flex gap-3">
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            maxLength={6}
            placeholder="Enter room code"
            className="input-field flex-1 text-center font-mono tracking-widest uppercase text-lg"
          />
          <button
            type="submit"
            className="btn-secondary flex items-center gap-2 px-4"
            disabled={joinCode.length !== 6}
          >
            <LogIn className="w-4 h-4" />
            <span>Join</span>
          </button>
        </form>
      </div>
    );
  }

  // In a room
  return (
    <div className="flex flex-col gap-6">
      {/* Room Code Display */}
      <div className="text-center">
        <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Room Code</p>
        <div className="flex items-center justify-center gap-3">
          <span className="text-3xl font-mono font-bold gradient-text tracking-widest select-all">
            {roomCode}
          </span>
          <button
            onClick={handleCopyCode}
            className="p-2 rounded-lg bg-navy-700 hover:bg-navy-600 text-slate-400 hover:text-cyan-400 transition-all duration-200"
            title="Copy room code"
          >
            <Copy className="w-5 h-5" />
          </button>
        </div>
        <p className="text-slate-500 text-xs mt-2">Share this code with others to join</p>
      </div>

      {/* Leave Room */}
      <button
        onClick={() => {
          console.log('[RoomPanel] Leaving room:', roomCode);
          onLeaveRoom();
        }}
        className="btn-danger w-full flex items-center justify-center gap-2 py-2"
      >
        <LogOut className="w-4 h-4" />
        <span>Leave Room</span>
      </button>

      {/* Divider */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-navy-700" />
        <span className="text-slate-500 text-xs uppercase tracking-widest">peers</span>
        <div className="flex-1 h-px bg-navy-700" />
      </div>

      {/* Room Peers */}
      {roomPeers && roomPeers.length > 0 ? (
        <div className="flex flex-col gap-3">
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
        <div className="text-center py-6">
          <p className="text-slate-400 text-sm animate-pulse">
            Waiting for others to join...
          </p>
        </div>
      )}
    </div>
  );
}
