import { useState, useRef } from 'react';
import { Upload, X, Send, Trash2, FolderOpen, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatFileSize, getFileIcon } from '../utils/fileChunker';
import { isTouchDevice } from '../utils/deviceDetection';
import { getTransferSettings, validateFileBatch } from '../utils/transferPolicy';

export default function FileDropZone({ onFileSelect, disabled = false, isActive = false }) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);
  const photoInputRef = useRef(null);
  
  const touch = isTouchDevice();

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
    const validation = validateFileBatch([...selectedFiles, ...newFiles], getTransferSettings());
    if (!validation.ok) {
      toast.error(validation.message);
      return;
    }
    setSelectedFiles(validation.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !touch) setIsDragging(true);
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
    if (disabled || touch) return;
    handleFiles(e.dataTransfer.files);
  };

  const handleClickFiles = () => {
    if (!disabled && fileInputRef.current) fileInputRef.current.click();
  };

  const handleClickPhotos = () => {
    if (!disabled && photoInputRef.current) photoInputRef.current.click();
  };

  const handleFileChange = (e) => {
    handleFiles(e.target.files);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setSelectedFiles([]);
  };

  const handleSendAll = () => {
    const result = onFileSelect(selectedFiles);
    if (result && result.ok === false) {
      toast.error(result.message);
      return;
    }
    setSelectedFiles([]);
  };

  const totalSize = selectedFiles.reduce((acc, f) => acc + f.size, 0);

  if (selectedFiles.length > 0) {
    return (
      <div className="space-y-4">
        {touch && (
          <div className="flex gap-3 mb-4">
            <button onClick={handleClickFiles} className="btn-secondary flex-1 flex items-center justify-center gap-2 py-3 min-h-touch">
              <FolderOpen className="w-4 h-4" />
              <span>Choose Files</span>
            </button>
            <button onClick={handleClickPhotos} className="btn-secondary flex-1 flex items-center justify-center gap-2 py-3 min-h-touch">
              <ImageIcon className="w-4 h-4" />
              <span>Photo Library</span>
            </button>
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-slate-300 font-medium">
          <span>📁 {selectedFiles.length} files selected — {formatFileSize(totalSize)} total</span>
          <button onClick={clearAll} className="text-slate-500 hover:text-red-400 transition min-h-touch min-w-touch flex items-center justify-center -mr-2" title="Clear all">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        
        <div className="max-h-60 overflow-y-auto space-y-2 border border-navy-700 rounded-lg p-2 bg-navy-800/30">
          {selectedFiles.map((f, i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded bg-navy-800 border border-navy-700">
              <div className="flex items-center gap-3 overflow-hidden">
                <span className="text-xl leading-none">{getFileIcon(f.type)}</span>
                <span className="text-slate-200 text-sm truncate max-w-[150px] sm:max-w-[250px]" title={f.name}>
                  {f.name}
                </span>
              </div>
              <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                <span className="text-xs text-slate-400">{formatFileSize(f.size)}</span>
                <button onClick={() => removeFile(i)} className="text-slate-500 hover:text-red-400 transition min-h-touch min-w-touch flex items-center justify-center -mr-2" title="Remove file">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex pt-2">
          <button onClick={handleSendAll} className="btn-primary w-full flex items-center justify-center gap-2 py-3 min-h-touch text-base">
            <Send className="w-5 h-5" />
            Send All Files
          </button>
        </div>

        {/* Hidden Inputs */}
        <input ref={fileInputRef} type="file" multiple onChange={handleFileChange} className="hidden" disabled={disabled} />
        <input ref={photoInputRef} type="file" accept="image/*,video/*" multiple onChange={handleFileChange} className="hidden" disabled={disabled} />
      </div>
    );
  }

  return (
    <div className="w-full">
      <input ref={fileInputRef} type="file" multiple onChange={handleFileChange} className="hidden" disabled={disabled} />
      <input ref={photoInputRef} type="file" accept="image/*,video/*" multiple onChange={handleFileChange} className="hidden" disabled={disabled} />

      {touch ? (
        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            onClick={handleClickFiles}
            disabled={disabled}
            className={`flex-1 flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 transition-all min-h-[120px] active:scale-95
              ${disabled ? 'opacity-50 border-navy-700 bg-navy-800/50' : 'border-navy-600 bg-navy-800/30 hover:border-cyan-500/50 hover:bg-navy-800/50 text-slate-300 hover:text-cyan-400'}`}
          >
            <FolderOpen className="w-8 h-8" />
            <span className="font-medium">Choose Files</span>
          </button>
          
          <button 
            onClick={handleClickPhotos}
            disabled={disabled}
            className={`flex-1 flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 transition-all min-h-[120px] active:scale-95
              ${disabled ? 'opacity-50 border-navy-700 bg-navy-800/50' : 'border-navy-600 bg-navy-800/30 hover:border-violet-500/50 hover:bg-navy-800/50 text-slate-300 hover:text-violet-400'}`}
          >
            <ImageIcon className="w-8 h-8" />
            <span className="font-medium">Photo Library</span>
          </button>
        </div>
      ) : (
        <div
          onClick={handleClickFiles}
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
              Supports multiple files of any size
            </p>
          </div>

          {isDragging && (
            <div className="absolute inset-0 rounded-xl border-2 border-cyan-500/30 animate-pulse pointer-events-none" />
          )}
        </div>
      )}
    </div>
  );
}
