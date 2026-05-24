import { Loader2, Download, CheckCircle2, XCircle, X } from 'lucide-react';
import { formatFileSize, getFileIcon } from '../utils/fileChunker';

const statusConfig = {
  sending: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', Icon: Loader2, iconClass: 'animate-spin', label: 'Sending' },
  receiving: { bg: 'bg-violet-500/20', text: 'text-violet-400', Icon: Download, iconClass: '', label: 'Receiving' },
  complete: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', Icon: CheckCircle2, iconClass: '', label: 'Complete' },
  error: { bg: 'bg-red-500/20', text: 'text-red-400', Icon: XCircle, iconClass: '', label: 'Error' },
  cancelled: { bg: 'bg-slate-500/20', text: 'text-slate-400', Icon: XCircle, iconClass: '', label: 'Cancelled' },
  pending: { bg: 'bg-amber-500/20', text: 'text-amber-400', Icon: Loader2, iconClass: '', label: 'Queued' },
};

export default function TransferProgress({ transfers, onCancel }) {
  if (!transfers || transfers.length === 0) return null;

  const renderItem = (item) => {
    const { name, size, progress = 0, status, speed, eta, transferId, mimeType } = item;
    const isComplete = status === 'complete';
    const isCancelled = status === 'cancelled';
    const config = statusConfig[status] || statusConfig.pending;
    const StatusIcon = config.Icon;
    
    const formatSpeed = (bytesPerSec) => {
      if (!bytesPerSec) return '';
      return `${formatFileSize(bytesPerSec)}/s`;
    };

    const formatETA = (seconds) => {
      if (!seconds) return '';
      if (seconds < 60) return '< 1m';
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}m ${s}s`;
    };

    return (
      <div key={transferId} className={`flex items-center justify-between p-3 rounded-lg border ${isComplete || isCancelled ? 'bg-navy-800/40 border-navy-700/50 opacity-60' : 'bg-navy-800 border-navy-700'} transition-all duration-300`}>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className="text-2xl shrink-0">{getFileIcon(mimeType)}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium text-slate-200 truncate">{name}</span>
              <span className="text-xs text-slate-400 shrink-0">{formatFileSize(size)}</span>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-2 flex items-center gap-3">
              <div className="flex-1 bg-slate-700 rounded-full h-1.5 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${status === 'error' ? 'bg-red-500' : 'bg-cyan-400'}`} 
                  style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
                />
              </div>
              <span className="text-xs text-slate-400 font-medium shrink-0 w-8">{Math.round(progress)}%</span>
            </div>
            
            {/* Speed & ETA */}
            <div className="flex gap-4 mt-1 h-4">
              {(status === 'sending' || status === 'receiving') && (
                <>
                  {speed > 0 && <span className="text-[10px] text-slate-500">{formatSpeed(speed)}</span>}
                  {eta > 0 && <span className="text-[10px] text-slate-500">ETA {formatETA(eta)}</span>}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 ml-4 shrink-0">
          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-medium uppercase tracking-wide ${config.bg} ${config.text}`}>
            <StatusIcon className={`w-3 h-3 ${config.iconClass}`} />
            {config.label}
          </span>
          
          {(status === 'pending' || status === 'sending' || status === 'receiving') && onCancel && (
            <button
              onClick={() => onCancel(transferId)}
              className="text-slate-500 hover:text-red-400 transition p-1"
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  };

  // Group by peerId to display queue sections
  const grouped = transfers.reduce((acc, item) => {
    const key = item.peerId;
    if (!acc[key]) acc[key] = { sender: [], receiver: [] };
    if (item.bytesSent !== undefined) acc[key].sender.push(item);
    else acc[key].receiver.push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([peerId, queues]) => (
        <div key={peerId} className="space-y-4">
          {queues.sender.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Sending to {peerId.substring(0,8)}
              </h3>
              <div className="space-y-2">
                {queues.sender.map(renderItem)}
              </div>
            </div>
          )}
          {queues.receiver.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Receiving from {peerId.substring(0,8)}
              </h3>
              <div className="space-y-2">
                {queues.receiver.map(renderItem)}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
