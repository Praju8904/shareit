import { Laptop, Smartphone, Tablet, Send } from 'lucide-react';

const deviceIcons = {
  laptop: Laptop,
  phone: Smartphone,
  tablet: Tablet,
};

export default function DeviceCard({ peerId, deviceName, deviceType, onSendFile, showSendButton = true }) {
  const Icon = deviceIcons[deviceType] || Laptop;

  return (
    <div className="card card-hover animate-slide-up p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        
        <div className="flex items-center gap-4 flex-1">
          {/* Device icon with cyan glow */}
          <div className="bg-cyan-500/10 rounded-lg p-2 sm:p-3 shadow-[0_0_15px_rgba(0,212,255,0.15)] shrink-0">
            <Icon
              className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400 drop-shadow-[0_0_8px_rgba(0,212,255,0.4)]"
            />
          </div>

          {/* Device info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-slate-100 font-bold text-base sm:text-sm truncate">
              {deviceName || 'Unknown Device'}
            </h3>
            <p className="text-slate-500 text-sm sm:text-xs truncate flex items-center gap-1.5 mt-0.5">
              <span className="capitalize">{deviceType || 'Laptop'}</span>
              <span className="w-1 h-1 rounded-full bg-slate-600"></span>
              <span className="text-emerald-500 font-medium">Online</span>
            </p>
          </div>
        </div>

        {/* Send File button */}
        {showSendButton && onSendFile && (
          <div className="mt-2 sm:mt-0 flex justify-end">
            <button
              onClick={() => {
                console.log('[DeviceCard] Send file to peer:', peerId);
                onSendFile(peerId);
              }}
              className="btn-primary flex items-center justify-center gap-2 text-sm sm:px-3 sm:py-2 whitespace-nowrap min-h-touch min-w-[120px] active:scale-95 transition-transform w-full sm:w-auto"
            >
              <Send className="w-4 h-4" />
              <span>Send File</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
