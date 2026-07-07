import { Activity, FolderInput, ShieldCheck } from 'lucide-react';
import { FILE_TYPE_GROUPS } from '../utils/transferPolicy';

const labels = {
  images: 'Images',
  videos: 'Videos',
  audio: 'Audio',
  documents: 'Documents',
  archives: 'Archives',
};

export default function SettingsPanel({
  connected,
  backendUrl,
  connectionError,
  transferSettings,
  updateTransferSettings,
}) {
  const groups = transferSettings.receiveGroups || [];

  const toggleGroup = (groupName) => {
    const nextGroups = groups.includes(groupName)
      ? groups.filter((name) => name !== groupName)
      : [...groups, groupName];
    updateTransferSettings({ receiveGroups: nextGroups });
  };

  return (
    <section className="card">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-slate-100">Transfer Rules</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {Object.keys(FILE_TYPE_GROUPS).map((groupName) => (
              <label
                key={groupName}
                className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer transition ${
                  groups.includes(groupName)
                    ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-100'
                    : 'border-navy-700 bg-navy-900/40 text-slate-400'
                }`}
              >
                <input
                  type="checkbox"
                  checked={groups.includes(groupName)}
                  onChange={() => toggleGroup(groupName)}
                  className="accent-cyan-500"
                />
                <span>{labels[groupName]}</span>
              </label>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
            <label className="text-sm text-slate-400">
              <span className="block mb-1">Max files</span>
              <input
                type="number"
                min="1"
                max="100"
                value={transferSettings.maxFiles}
                onChange={(e) => updateTransferSettings({ maxFiles: Number(e.target.value) || 1 })}
                className="input-field w-full"
              />
            </label>

            <label className="text-sm text-slate-400">
              <span className="block mb-1">Max GB</span>
              <input
                type="number"
                min="1"
                max="10"
                value={Math.round(transferSettings.maxTotalBytes / (1024 * 1024 * 1024))}
                onChange={(e) => updateTransferSettings({
                  maxTotalBytes: (Number(e.target.value) || 1) * 1024 * 1024 * 1024,
                })}
                className="input-field w-full"
              />
            </label>

            <label className="flex items-center gap-3 text-sm text-slate-300 bg-navy-900/40 border border-navy-700 rounded-lg px-3 py-2">
              <FolderInput className="w-4 h-4 text-cyan-400" />
              <input
                type="checkbox"
                checked={Boolean(transferSettings.askDownloadLocation)}
                onChange={(e) => updateTransferSettings({ askDownloadLocation: e.target.checked })}
                className="accent-cyan-500"
              />
              <span>Ask folder</span>
            </label>
          </div>
        </div>

        <div className="lg:w-80 border-t lg:border-t-0 lg:border-l border-navy-700 pt-5 lg:pt-0 lg:pl-6">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-slate-100">Connection</h2>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Status</span>
              <span className={connected ? 'text-emerald-400' : 'text-red-400'}>
                {connected ? 'Online' : 'Offline'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Backend</span>
              <code className="block text-xs text-slate-300 bg-navy-900/60 border border-navy-700 rounded px-2 py-1 break-all">
                {backendUrl}
              </code>
            </div>
            {connectionError && (
              <div>
                <span className="text-slate-400 block mb-1">Last error</span>
                <p className="text-red-300 text-xs bg-red-500/10 border border-red-500/20 rounded px-2 py-1">
                  {connectionError}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
