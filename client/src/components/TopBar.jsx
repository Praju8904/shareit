import { useState, useRef, useEffect } from 'react';
import { Share2, Clock, Check, X, Edit2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useShare } from '../context/ShareContext';

export default function TopBar() {
  const {
    deviceName,
    isEditingName,
    setIsEditingName,
    updateDeviceName,
    showNameTooltip
  } = useShare();
  
  const navigate = useNavigate();
  const [editValue, setEditValue] = useState(deviceName || '');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditingName && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditingName]);

  const handleSave = () => {
    updateDeviceName(editValue);
  };

  const handleCancel = () => {
    setEditValue(deviceName || '');
    setIsEditingName(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') handleCancel();
  };

  return (
    <header className="sticky top-0 z-50 bg-navy-950/80 backdrop-blur-md border-b border-cyan-500/20 h-14">
      <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
        {/* Left: Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <Share2 className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform duration-300" />
          <span className="text-lg font-bold gradient-text">ShareIt</span>
        </Link>

        {/* Right: Device Name + History */}
        <div className="flex items-center gap-6">
          
          {/* Device Name Editing */}
          <div className="relative flex items-center">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  maxLength={24}
                  className="bg-navy-800 border border-cyan-500/50 text-slate-100 text-sm px-2 py-1 rounded outline-none w-40 sm:w-48 focus:ring-1 focus:ring-cyan-500"
                />
                <button onClick={handleSave} className="text-emerald-400 hover:text-emerald-300 transition">
                  <Check className="w-4 h-4" />
                </button>
                <button onClick={handleCancel} className="text-red-400 hover:text-red-300 transition">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div 
                className="group flex items-center gap-2 cursor-pointer relative"
                onClick={() => {
                  setEditValue(deviceName);
                  setIsEditingName(true);
                }}
              >
                <span className="text-sm font-medium text-slate-300 relative">
                  {deviceName}
                  <span className="absolute -bottom-0.5 left-0 w-0 h-[1px] bg-cyan-400 transition-all duration-300 group-hover:w-full"></span>
                </span>
                <Edit2 className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 transition-colors" />

                {/* First Load Tooltip */}
                {showNameTooltip && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 whitespace-nowrap animate-fade-in pointer-events-none">
                    <div className="bg-cyan-500/10 border border-cyan-500/20 backdrop-blur-sm text-cyan-100 text-xs px-3 py-1.5 rounded-lg shadow-lg">
                      You're {deviceName} — tap to rename
                    </div>
                    {/* Tooltip triangle */}
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-navy-800 border-l border-t border-cyan-500/20 rotate-45"></div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* History Button */}
          <button
            onClick={() => navigate('/history')}
            className="flex items-center gap-1.5 text-slate-400 hover:text-cyan-400 transition-colors duration-200 pl-4 border-l border-navy-700"
            title="Transfer History"
          >
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium hidden sm:inline">History</span>
          </button>
          
        </div>
      </div>
    </header>
  );
}
