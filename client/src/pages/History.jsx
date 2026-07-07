import { useState, useMemo } from 'react';
import { ArrowLeft, Clock, Trash2, ArrowUpRight, ArrowDownLeft, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useShare } from '../context/ShareContext';
import { formatFileSize, getFileIcon } from '../utils/fileChunker';
import BottomNav from '../components/BottomNav';

export default function History() {
  const { history, removeFromHistory, wipeHistory } = useShare();
  const [filter, setFilter] = useState('all'); // all, sent, received
  const [searchQuery, setSearchQuery] = useState('');
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  // Filter and group history
  const { filteredHistory, groupedHistory } = useMemo(() => {
    let filtered = history || [];

    // Apply type filter
    if (filter === 'sent') filtered = filtered.filter(item => item.type === 'sent');
    if (filter === 'received') filtered = filtered.filter(item => item.type === 'received');

    // Apply search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        (item.fileName && item.fileName.toLowerCase().includes(q)) ||
        (item.peer && item.peer.toLowerCase().includes(q))
      );
    }

    // Group by date
    const grouped = {};
    filtered.forEach(item => {
      const date = new Date(item.timestamp);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let groupLabel = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      if (date.toDateString() === today.toDateString()) groupLabel = 'Today';
      else if (date.toDateString() === yesterday.toDateString()) groupLabel = 'Yesterday';

      if (!grouped[groupLabel]) grouped[groupLabel] = [];
      grouped[groupLabel].push(item);
    });

    return { filteredHistory: filtered, groupedHistory: grouped };
  }, [history, filter, searchQuery]);

  const handleClearAll = () => {
    wipeHistory();
    setShowConfirmClear(false);
  };

  const formatDuration = (ms) => {
    if (!ms) return '';
    const s = Math.round(ms / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}m ${sec}s`;
  };

  const formatSpeed = (bytes, ms) => {
    if (!ms || !bytes) return '';
    const bytesPerSec = (bytes / ms) * 1000;
    return `${formatFileSize(bytesPerSec)}/s avg`;
  };

  return (
    <div className="min-h-screen bg-navy-900 pb-12">
      <main className="max-w-4xl mx-auto px-6 py-8">
        
        {/* Header Area */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link to="/" className="p-2 -ml-2 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-navy-800 transition">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <Clock className="w-6 h-6 text-cyan-500" />
              Transfer History
            </h1>
          </div>

          {history?.length > 0 && (
            <div>
              {showConfirmClear ? (
                <div className="flex items-center gap-2 text-sm animate-fade-in bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg">
                  <span className="text-slate-300">Are you sure?</span>
                  <button onClick={handleClearAll} className="text-red-400 font-bold hover:text-red-300">Yes</button>
                  <span className="text-slate-600">|</span>
                  <button onClick={() => setShowConfirmClear(false)} className="text-slate-400 hover:text-slate-200">No</button>
                </div>
              ) : (
                <button 
                  onClick={() => setShowConfirmClear(true)}
                  className="flex items-center gap-2 text-sm text-slate-400 hover:text-red-400 transition"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All
                </button>
              )}
            </div>
          )}
        </div>

        {/* Controls Area */}
        {history?.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-8">
            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-navy-800 rounded-lg shrink-0 w-fit max-w-full overflow-x-auto no-scrollbar">
              {['all', 'sent', 'received'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all duration-200 whitespace-nowrap min-h-touch ${
                    filter === tab 
                      ? 'bg-navy-700 text-cyan-400 shadow-sm border border-cyan-500/20' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-navy-700/50'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search files or peers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-navy-800 border border-navy-700 focus:border-cyan-500 text-slate-200 text-sm pl-9 pr-4 py-2 rounded-lg outline-none transition"
              />
            </div>
          </div>
        )}

        {/* History List */}
        <div className="space-y-8">
          {(!history || history.length === 0) ? (
            <div className="text-center py-20 animate-fade-in">
              <div className="bg-navy-800/50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 border border-navy-700">
                <Clock className="w-10 h-10 text-slate-500" />
              </div>
              <h2 className="text-lg font-medium text-slate-300">No transfers yet</h2>
              <p className="text-slate-500 mt-1">Your sharing history will appear here.</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400">No results for this filter.</p>
            </div>
          ) : (
            Object.entries(groupedHistory).map(([dateLabel, items]) => (
              <div key={dateLabel} className="animate-slide-up">
                {/* Date Divider */}
                <div className="flex items-center gap-4 mb-4">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0">
                    {dateLabel}
                  </h3>
                  <div className="h-[1px] flex-1 bg-navy-800"></div>
                </div>

                {/* Items */}
                <div className="space-y-3">
                  {items.map(item => (
                    <div 
                      key={item.id} 
                      className="group flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl bg-slate-800/40 border border-navy-700/50 hover:bg-slate-800/80 hover:border-navy-600 transition duration-200"
                    >
                      {/* Icon & File Info */}
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="shrink-0 relative">
                          <span className="text-3xl">{getFileIcon(item.mimeType)}</span>
                          <div className={`absolute -bottom-1 -right-1 p-0.5 rounded-full bg-navy-900 border border-navy-800`}>
                            {item.type === 'sent' ? (
                              <ArrowUpRight className="w-3 h-3 text-cyan-400" />
                            ) : (
                              <ArrowDownLeft className="w-3 h-3 text-violet-400" />
                            )}
                          </div>
                        </div>
                        
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-3">
                            <span className="text-slate-200 font-medium truncate" title={item.fileName}>
                              {item.fileName}
                            </span>
                            <span className="text-xs text-slate-400 shrink-0">
                              {formatFileSize(item.fileSize)}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                            <span className={item.type === 'sent' ? 'text-cyan-400/80' : 'text-violet-400/80'}>
                              {item.type === 'sent' ? 'To ' : 'From '}
                              {item.peer}
                            </span>
                            <span>•</span>
                            <span className="text-slate-500">
                              {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status & Stats */}
                      <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-4 shrink-0 mt-2 sm:mt-0">
                        <div className="flex flex-col sm:items-end gap-1 text-xs">
                          {item.status === 'complete' ? (
                            <>
                              <span className="inline-flex items-center gap-1 text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded">
                                Complete
                              </span>
                              <span className="text-slate-500 flex items-center gap-1">
                                {formatDuration(item.duration)}
                                {item.duration > 0 && <>
                                  <span className="text-slate-700">•</span>
                                  {formatSpeed(item.fileSize, item.duration)}
                                </>}
                              </span>
                            </>
                          ) : item.status === 'failed' ? (
                            <span className="inline-flex items-center gap-1 text-red-400 font-medium bg-red-500/10 px-2 py-0.5 rounded">
                              Failed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-slate-400 font-medium bg-slate-500/10 px-2 py-0.5 rounded">
                              Cancelled
                            </span>
                          )}
                        </div>

                        {/* Delete Action */}
                        <button 
                          onClick={() => removeFromHistory(item.id)}
                          className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 sm:opacity-100 group-hover:opacity-100 transition-all focus:opacity-100"
                          title="Delete entry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
