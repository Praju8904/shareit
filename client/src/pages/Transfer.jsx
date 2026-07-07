import { useMemo } from 'react';
import { ArrowLeft, Share2, Check, X, Wifi, WifiOff } from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { useShare } from '../context/ShareContext';
import { formatFileSize } from '../utils/fileChunker';
import FileDropZone from '../components/FileDropZone';
import TransferProgress from '../components/TransferProgress';
import BottomNav from '../components/BottomNav';

export default function Transfer() {
  const { peerId } = useParams();
  const {
    connected,
    nearbyDevices,
    roomPeers,
    incomingRequest,
    acceptTransfer,
    rejectTransfer,
    transferProgress,
    startTransfer,
    cancelTransfer,
    connectionState,
  } = useShare();

  // Look up peer info from nearby or room peers
  const peerInfo = useMemo(() => {
    const allPeers = [...(nearbyDevices || []), ...(roomPeers || [])];
    return allPeers.find((p) => p.peerId === peerId);
  }, [nearbyDevices, roomPeers, peerId]);

  const peerDisplayName = peerInfo?.deviceName || (peerId ? peerId.substring(0, 8) + '...' : 'Unknown');

  // Derive connection state for this specific peer
  const peerConnectionState = connectionState?.[peerId];

  // Filter transfers for this peer
  const peerTransfers = useMemo(() => {
    if (!transferProgress || !Array.isArray(transferProgress)) return null;
    const filtered = transferProgress.filter((t) => t.peerId === peerId);
    return filtered.length > 0 ? filtered : null;
  }, [transferProgress, peerId]);

  const handleFileSelect = (files) => {
    console.log('[Transfer] Starting transfer to peer:', peerId, 'files:', files.length);
    return startTransfer(peerId, files);
  };

  const handleCancel = (targetPeerId) => {
    console.log('[Transfer] Cancelling transfer for peer:', targetPeerId);
    cancelTransfer(targetPeerId);
  };

  // Look up sender name for incoming request
  const getSenderName = () => {
    if (!incomingRequest) return 'Unknown';
    const allPeers = [...(nearbyDevices || []), ...(roomPeers || [])];
    const sender = allPeers.find((p) => p.peerId === incomingRequest.from);
    return sender?.deviceName || incomingRequest.from?.substring(0, 8) + '...';
  };

  // Connection status indicator
  const getConnectionIndicator = () => {
    if (peerConnectionState === 'connected') {
      return {
        dotClass: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]',
        label: 'Connected',
      };
    }
    if (peerConnectionState === 'connecting') {
      return {
        dotClass: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)] animate-pulse',
        label: 'Connecting...',
      };
    }
    if (peerConnectionState === 'failed') {
      return {
        dotClass: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]',
        label: 'Failed',
      };
    }
    // Default: peer found but no WebRTC connection yet
    return {
      dotClass: peerInfo
        ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]'
        : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)] animate-pulse',
      label: peerInfo ? 'Ready' : 'Searching...',
    };
  };

  const connectionIndicator = getConnectionIndicator();

  return (
    <div className="min-h-screen bg-navy-900 pb-12 lg:pb-0">
      {/* ─── Main Content ─── */}
      <main className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Peer info */}
        <div className="card text-center">
          <div className="flex flex-col items-center gap-2">
            {/* Connection state */}
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${connectionIndicator.dotClass}`} />
              <span className="text-xs text-slate-500 uppercase tracking-wider">
                {connectionIndicator.label}
              </span>
            </div>

            <h1 className="text-2xl font-bold text-slate-100">
              {peerInfo ? 'Send to' : 'Connecting to'}
            </h1>
            <p className="text-lg gradient-text font-semibold">
              {peerDisplayName}
            </p>
          </div>
        </div>

        {/* File drop zone */}
        <div className="card">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
            Select File
          </h2>
          <FileDropZone
            onFileSelect={handleFileSelect}
            disabled={!connected || !peerInfo}
            isActive={peerTransfers && peerTransfers.some((t) => ['pending', 'sending', 'receiving'].includes(t.status))}
          />
        </div>

        {/* Transfer progress */}
        {peerTransfers && (
          <div className="card">
            <TransferProgress
              transfers={peerTransfers}
              onCancel={handleCancel}
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
                  console.log('[Transfer] Accepting incoming transfer from:', incomingRequest.from);
                  acceptTransfer();
                }}
                className="btn-primary flex-1 flex items-center justify-center gap-2 py-2.5"
              >
                <Check className="w-4 h-4" />
                <span>Accept</span>
              </button>
              <button
                onClick={() => {
                  console.log('[Transfer] Rejecting incoming transfer from:', incomingRequest.from);
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
      
      <BottomNav />
    </div>
  );
}
