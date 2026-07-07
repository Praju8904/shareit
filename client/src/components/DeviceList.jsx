import { Users } from 'lucide-react';
import DeviceCard from './DeviceCard';

export default function DeviceList({ devices, title, onSendFile, emptyMessage = 'No devices found' }) {
  return (
    <section>
      {/* Section header */}
      <div className="flex items-center gap-3 mb-5 px-1">
        <Users className="w-5 h-5 text-cyan-400" />
        <h2 className="text-lg font-bold text-slate-100">{title}</h2>
        <span className="badge ml-1">
          {devices?.length || 0}
        </span>
      </div>

      {/* Content */}
      {!devices || devices.length === 0 ? (
        /* Empty state with scanning animation */
        <div className="flex flex-col items-center justify-center py-12 sm:py-16 gap-4">
          {/* Pulsing scan ring */}
          <div className="relative flex items-center justify-center">
            <div className="animate-pulse-scan w-20 h-20 rounded-full border-2 border-cyan-500/30 absolute" />
            <div className="animate-pulse-scan w-14 h-14 rounded-full border-2 border-cyan-500/20 absolute" style={{ animationDelay: '0.5s' }} />
            <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-cyan-500/60" />
            </div>
          </div>

          <p className="text-slate-400 text-sm text-center mt-2 px-4 max-w-[200px] leading-relaxed">
            {emptyMessage}
          </p>
          <p className="text-slate-500 text-xs text-center animate-pulse">
            Searching network...
          </p>
        </div>
      ) : (
        /* Device grid */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          {devices.map((device) => (
            <div key={device.peerId} className="animate-fade-in">
              <DeviceCard
                peerId={device.peerId}
                deviceName={device.deviceName}
                deviceType={device.deviceType}
                onSendFile={onSendFile}
                showSendButton={true}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
