import { useState, useRef } from 'react';
import { Upload, X, Send, Trash2 } from 'lucide-react';
import { formatFileSize, getFileIcon } from '../utils/fileChunker';

export default function FileDropZone({ onFileSelect, disabled = false, isActive = false }) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);

  if (isActive) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-400 text-sm">Transfer in progress...</p>
        <p className="text-xs text-slate-500 mt-2">Wait for current queue to finish before adding more files.</p>
      </div>
    );
  }

  const handleFiles = (files) => {
    if (!files || files.length === 0) return;
    const newFiles = Array.from(files);
    setSelectedFiles((prev) => [...prev, ...newFiles]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;
    handleFiles(e.dataTransfer.files);
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    handleFiles(e.target.files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setSelectedFiles([]);
  };

  const handleSendAll = () => {
    onFileSelect(selectedFiles);
    setSelectedFiles([]);
  };

  const totalSize = selectedFiles.reduce((acc, f) => acc + f.size, 0);

  if (selectedFiles.length > 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm text-slate-300 font-medium">
          <span>📁 {selectedFiles.length} files selected — {formatFileSize(totalSize)} total</span>
          <button onClick={clearAll} className="text-slate-500 hover:text-red-400 transition" title="Clear all">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        
        <div className="max-h-60 overflow-y-auto space-y-2 border border-navy-700 rounded-lg p-2 bg-navy-800/30">
          {selectedFiles.map((f, i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded bg-navy-800 border border-navy-700">
              <div className="flex items-center gap-3 overflow-hidden">
                <span className="text-xl leading-none">{getFileIcon(f.type)}</span>
                <span className="text-slate-200 text-sm truncate max-w-[200px] sm:max-w-[300px]" title={f.name}>
                  {f.name}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-400 whitespace-nowrap">{formatFileSize(f.size)}</span>
                <button onClick={() => removeFile(i)} className="text-slate-500 hover:text-red-400 transition" title="Remove file">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={clearAll} className="btn-secondary flex-1">
            Clear
          </button>
          <button onClick={handleSendAll} className="btn-primary flex-1 flex items-center justify-center gap-2">
            <Send className="w-4 h-4" />
            Send All
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative min-h-[200px] rounded-xl border-2 border-dashed
        flex flex-col items-center justify-center gap-4 cursor-pointer
        transition-all duration-300 ease-out group
        ${disabled
          ? 'opacity-40 pointer-events-none border-navy-700 bg-navy-800/50'
          : isDragging
            ? 'border-cyan-500 bg-cyan-500/5 scale-[1.02] shadow-[0_0_30px_rgba(0,212,255,0.1)]'
            : 'border-navy-600 bg-navy-800/30 hover:border-navy-500 hover:bg-navy-800/50'
        }
      `}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />

      <div
        className={`
          p-4 rounded-full transition-all duration-300
          ${isDragging ? 'bg-cyan-500/15 scale-110' : 'bg-navy-700/50 group-hover:bg-navy-700'}
        `}
      >
        <Upload
          className={`
            w-10 h-10 transition-all duration-300
            ${isDragging ? 'text-cyan-400 drop-shadow-[0_0_12px_rgba(0,212,255,0.5)]' : 'text-slate-400 group-hover:text-slate-300'}
          `}
        />
      </div>

      <div className="text-center">
        <p className={`
          text-sm font-medium transition-colors duration-300
          ${isDragging ? 'text-cyan-400' : 'text-slate-300'}
        `}>
          {isDragging ? 'Drop your files here' : 'Drop files here or click to browse'}
        </p>
        <p className="text-slate-500 text-xs mt-1">
          Supports multiple files of any size (up to 5GB)
        </p>
      </div>

      {isDragging && (
        <div className="absolute inset-0 rounded-xl border-2 border-cyan-500/30 animate-pulse pointer-events-none" />
      )}
    </div>
  );
}
