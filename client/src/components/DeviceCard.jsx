import { Laptop, Smartphone, Tablet, Send } from 'lucide-react';

const deviceIcons = {
  laptop: Laptop,
  phone: Smartphone,
  tablet: Tablet,
};

export default function DeviceCard({ peerId, deviceName, deviceType, onSendFile, showSendButton = true }) {
  const Icon = deviceIcons[deviceType] || Laptop;

  return (
    <div className="card card-hover animate-slide-up">
      <div className="flex items-center gap-4">
        {/* Device icon with cyan glow */}
        <div className="bg-cyan-500/10 rounded-lg p-2 shadow-[0_0_15px_rgba(0,212,255,0.15)]">
          <Icon
            className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_8px_rgba(0,212,255,0.4)]"
          />
        </div>

        {/* Device info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-slate-100 font-bold text-sm truncate">
            {deviceName || 'Unknown Device'}
          </h3>
          <p className="text-slate-500 text-xs font-mono truncate">
            {peerId ? peerId.substring(0, 8) + '...' : ''}
          </p>
        </div>

        {/* Send File button */}
        {showSendButton && onSendFile && (
          <button
            onClick={() => {
              console.log('[DeviceCard] Send file to peer:', peerId);
              onSendFile(peerId);
            }}
            className="btn-primary flex items-center gap-2 text-sm px-3 py-2 whitespace-nowrap"
          >
            <Send className="w-4 h-4" />
            <span>Send File</span>
          </button>
        )}
      </div>
    </div>
  );
}
