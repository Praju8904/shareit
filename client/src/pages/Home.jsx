import { Share2, Wifi, WifiOff, Laptop, Smartphone, Tablet, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useShare } from '../context/ShareContext';
import { formatFileSize } from '../utils/fileChunker';
import DeviceList from '../components/DeviceList';
import RoomPanel from '../components/RoomPanel';
import TransferProgress from '../components/TransferProgress';

const deviceIcons = {
  laptop: Laptop,
  phone: Smartphone,
  tablet: Tablet,
};

export default function Home() {
  const {
    deviceName,
    deviceType,
    connected,
    nearbyDevices,
    roomCode,
    roomPeers,
    createRoom,
    joinRoom,
    leaveRoom,
    incomingRequest,
    acceptTransfer,
    rejectTransfer,
    transferProgress,
    cancelTransfer,
  } = useShare();

  const navigate = useNavigate();
  const DeviceIcon = deviceIcons[deviceType] || Laptop;

  const handleSendFile = (peerId) => {
    console.log('[Home] Navigating to transfer page for peer:', peerId);
    navigate(`/transfer/${peerId}`);
  };

  // Look up the sender's name from nearby or room peers
  const getSenderName = () => {
    if (!incomingRequest) return 'Unknown';
    const allPeers = [...(nearbyDevices || []), ...(roomPeers || [])];
    const sender = allPeers.find((p) => p.peerId === incomingRequest.from);
    return sender?.deviceName || incomingRequest.from?.substring(0, 8) + '...';
  };

  // Check if there are any active transfers
  const hasActiveTransfers = transferProgress && Object.keys(transferProgress).length > 0;

  return (
    <div className="min-h-screen bg-navy-900">
      {/* ─── Main Content ─── */}
      <main className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Nearby Devices */}
          <div className="card">
            <DeviceList
              devices={nearbyDevices}
              title="Nearby Devices"
              onSendFile={handleSendFile}
              emptyMessage="No nearby devices found"
            />
          </div>

          {/* Right: Room Panel */}
          <div className="card">
            <RoomPanel
              roomCode={roomCode}
              roomPeers={roomPeers}
              onCreateRoom={createRoom}
              onJoinRoom={joinRoom}
              onLeaveRoom={leaveRoom}
              onSendFile={handleSendFile}
            />
          </div>
        </div>

        {/* ─── Transfer Progress ─── */}
        {hasActiveTransfers && (
          <div className="mt-6">
            <TransferProgress
              transfers={transferProgress}
              onCancel={cancelTransfer}
            />
          </div>
        )}
      </main>

      {/* ─── Incoming Transfer Modal ─── */}
      {incomingRequest && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="card max-w-md w-full animate-slide-up shadow-2xl shadow-cyan-500/10">
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="bg-cyan-500/10 rounded-lg p-2">
                <Share2 className="w-6 h-6 text-cyan-400" />
              </div>
              <h2 className="text-lg font-bold text-slate-100">Incoming File</h2>
            </div>

            {/* Details */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between py-2 border-b border-navy-700">
                <span className="text-slate-400 text-sm">From</span>
                <span className="text-slate-100 text-sm font-medium">{getSenderName()}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-navy-700">
                <span className="text-slate-400 text-sm">File</span>
                <span className="text-slate-100 text-sm font-medium truncate ml-4">
                  {incomingRequest.fileName}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-400 text-sm">Size</span>
                <span className="text-slate-100 text-sm font-medium">
                  {formatFileSize(incomingRequest.fileSize)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  console.log('[Home] Accepting incoming transfer from:', incomingRequest.from);
                  acceptTransfer();
                }}
                className="btn-primary flex-1 flex items-center justify-center gap-2 py-2.5"
              >
                <Check className="w-4 h-4" />
                <span>Accept</span>
              </button>
              <button
                onClick={() => {
                  console.log('[Home] Rejecting incoming transfer from:', incomingRequest.from);
                  rejectTransfer();
                }}
                className="btn-danger flex-1 flex items-center justify-center gap-2 py-2.5"
              >
                <X className="w-4 h-4" />
                <span>Reject</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
