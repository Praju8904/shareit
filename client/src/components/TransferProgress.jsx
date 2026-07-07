import { Loader2, Download, CheckCircle2, XCircle, X, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { formatFileSize, getFileIcon } from '../utils/fileChunker';

const statusConfig = {
  sending: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', Icon: Loader2, iconClass: 'animate-spin text-cyan-400' },
  receiving: { bg: 'bg-violet-500/20', text: 'text-violet-400', Icon: Loader2, iconClass: 'animate-spin text-violet-400' },
  pending: { bg: 'bg-slate-500/20', text: 'text-slate-400', Icon: Download, iconClass: 'text-slate-400' },
  verifying: { bg: 'bg-amber-500/20', text: 'text-amber-400', Icon: Loader2, iconClass: 'animate-spin text-amber-400' },
  retrying: { bg: 'bg-amber-500/20', text: 'text-amber-400', Icon: Loader2, iconClass: 'animate-spin text-amber-400' },
  complete: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', Icon: CheckCircle2, iconClass: 'text-emerald-400' },
  error: { bg: 'bg-red-500/20', text: 'text-red-400', Icon: XCircle, iconClass: 'text-red-400' },
  cancelled: { bg: 'bg-slate-500/20', text: 'text-slate-400', Icon: XCircle, iconClass: 'text-slate-400' },
};

export default function TransferProgress({ transfers, onCancel, peerName }) {
  if (!transfers || transfers.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-slate-100 font-bold mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
        Active Transfers
      </h3>

      <div className="space-y-3">
        {transfers.map((transfer) => {
          const config = statusConfig[transfer.status] || statusConfig.pending;
          const StatusIcon = config.Icon;
          const isSender = transfer.status === 'sending' || (transfer.status === 'pending' && transfer.bytesSent !== undefined) || (transfer.status === 'complete' && transfer.bytesSent > 0);

          return (
            <div
              key={transfer.transferId}
              className={`p-4 rounded-xl border transition-all duration-300 animate-slide-up
                ${transfer.status === 'error' ? 'border-red-500/30 bg-red-500/5' : 
                  transfer.status === 'complete' ? 'border-emerald-500/30 bg-emerald-500/5' : 
                  'border-navy-600 bg-navy-800/50'}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                
                {/* Mobile: Top Row with Name and Cancel */}
                <div className="flex items-start justify-between sm:hidden mb-1">
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <span className="text-2xl shrink-0 leading-none">{getFileIcon(transfer.mimeType)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-slate-200 font-medium text-sm truncate pr-2">
                        {transfer.name}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                        {isSender ? <ArrowUpRight className="w-3 h-3 text-cyan-400" /> : <ArrowDownLeft className="w-3 h-3 text-violet-400" />}
                        {isSender ? 'To' : 'From'} {peerName || transfer.peerId?.substring(0, 8)}
                      </p>
                    </div>
                  </div>
                  {(transfer.status === 'sending' || transfer.status === 'receiving' || transfer.status === 'pending') && (
                    <button
                      onClick={() => onCancel(transfer.transferId)}
                      className="p-2 -mr-2 -mt-2 text-slate-500 hover:text-red-400 bg-navy-800 hover:bg-navy-700 rounded-lg transition-colors min-h-touch min-w-touch flex items-center justify-center shrink-0"
                      title="Cancel transfer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Desktop: Icon + Name */}
                <div className="hidden sm:flex items-center gap-3 w-1/3 min-w-0">
                  <span className="text-2xl shrink-0 leading-none">{getFileIcon(transfer.mimeType)}</span>
                  <div className="min-w-0">
                    <p className="text-slate-200 font-medium text-sm truncate" title={transfer.name}>
                      {transfer.name}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {formatFileSize(transfer.size)}
                    </p>
                  </div>
                </div>

                {/* Progress Bar + Stats */}
                <div className="flex-1 flex flex-col justify-center min-w-0">
                  <div className="flex justify-between text-xs mb-1.5 px-0.5">
                    <span className="font-medium text-slate-300">
                      {transfer.status === 'pending' ? 'Queued' : 
                       transfer.status === 'complete' ? 'Done' :
                       transfer.status === 'error' ? 'Failed' :
                       transfer.status === 'verifying' ? 'Verifying' :
                       transfer.status === 'retrying' ? 'Retrying' :
                       transfer.status === 'cancelled' ? 'Cancelled' :
                       `${Math.round(transfer.progress || 0)}%`}
                    </span>
                    <span className="text-slate-400 sm:hidden">{formatFileSize(transfer.size)}</span>
                  </div>
                  
                  <div className="h-2 sm:h-2 w-full bg-navy-900 rounded-full overflow-hidden border border-navy-700/50">
                    <div
                      className={`h-full transition-all duration-300 relative
                        ${transfer.status === 'error' ? 'bg-red-500' :
                          transfer.status === 'complete' ? 'bg-emerald-500' :
                          isSender ? 'bg-cyan-500' : 'bg-violet-500'}`}
                      style={{ width: `${Math.max(0, Math.min(100, transfer.progress || 0))}%` }}
                    >
                      {(transfer.status === 'sending' || transfer.status === 'receiving') && (
                        <div className="absolute inset-0 bg-white/20 animate-pulse" />
                      )}
                    </div>
                  </div>

                  {/* Transfer Speed / ETA */}
                  {(transfer.status === 'sending' || transfer.status === 'receiving') && (
                    <div className="flex justify-between items-center text-[10px] sm:text-xs text-slate-400 mt-1.5 px-0.5">
                      <span>{formatFileSize(transfer.speed || 0)}/s</span>
                      <span>{transfer.eta || 'Calculating...'}</span>
                    </div>
                  )}
                </div>

                {/* Desktop Status + Actions */}
                <div className="hidden sm:flex items-center gap-4 justify-end min-w-[120px]">
                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${config.bg} ${config.text}`}>
                    <StatusIcon className={`w-3.5 h-3.5 ${config.iconClass}`} />
                    <span className="capitalize">{transfer.status}</span>
                  </div>

                  {(transfer.status === 'sending' || transfer.status === 'receiving' || transfer.status === 'pending') && (
                    <button
                      onClick={() => onCancel(transfer.transferId)}
                      className="p-1.5 text-slate-500 hover:text-red-400 bg-navy-800 hover:bg-navy-700 rounded-lg transition-colors min-w-touch min-h-touch flex items-center justify-center shrink-0"
                      title="Cancel transfer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
