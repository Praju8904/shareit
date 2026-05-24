import { useState, useCallback, useRef, useEffect } from 'react';
import { chunkFile, generateTransferId } from '../utils/fileChunker';

const ICE_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

const CHUNK_SIZE = 16384;
const BUFFER_THRESHOLD = 262144;
const BUFFER_RESUME = 65536;

export default function useWebRTC(socket, addToHistory, allPeers) {
  const peerConnections = useRef(new Map());
  const dataChannels = useRef(new Map());
  
  // Memory management: map of transferId to array of ArrayBuffer chunks
  const chunkBuffers = useRef(new Map());

  // Track which peers have accepted file transfers
  const peerSessions = useRef(new Set());
  
  // Track queue-meta to send when channel opens
  const pendingMeta = useRef(new Map());

  // State
  const [fileQueue, setFileQueue] = useState([]);
  const [receiveQueue, setReceiveQueue] = useState([]);
  const [incomingRequest, setIncomingRequest] = useState(null);
  const [connectionState, setConnectionState] = useState({});

  // Refs for queue processing
  const processingQueue = useRef(false);
  const currentTransferId = useRef(null);
  const isPaused = useRef(false);
  const currentGenerator = useRef(null);
  const currentChannel = useRef(null);
  
  // For speed/ETA calculation
  const speedInterval = useRef(null);

  const updateConnectionState = useCallback((peerId, state) => {
    setConnectionState(prev => ({ ...prev, [peerId]: state }));
  }, []);

  const updateQueueItem = useCallback((transferId, updates) => {
    setFileQueue(prev => prev.map(item => 
      item.transferId === transferId ? { ...item, ...updates } : item
    ));
  }, []);

  const getPeerName = useCallback((peerId) => {
    const p = allPeers?.find(p => p.peerId === peerId);
    return p?.deviceName || peerId?.substring(0, 8) || 'Unknown';
  }, [allPeers]);

  // Speed and ETA calculation interval
  useEffect(() => {
    speedInterval.current = setInterval(() => {
      // Sender Side
      setFileQueue(prev => prev.map(item => {
        if (item.status === 'sending') {
          const speed = item.bytesSent - (item._lastBytesSent || 0);
          const eta = speed > 0 ? Math.round((item.size - item.bytesSent) / speed) : null;
          return { ...item, speed, eta, _lastBytesSent: item.bytesSent };
        }
        return item;
      }));

      // Receiver Side
      setReceiveQueue(prev => prev.map(item => {
        if (item.status === 'receiving') {
          const speed = item.bytesReceived - (item._lastBytesReceived || 0);
          const eta = speed > 0 ? Math.round((item.size - item.bytesReceived) / speed) : null;
          return { ...item, speed, eta, _lastBytesReceived: item.bytesReceived };
        }
        return item;
      }));
    }, 1000);

    return () => clearInterval(speedInterval.current);
  }, []);

  // ─── Receiver Message Handler ──────────────────────────────────────────────
  const setupReceiverDataChannel = useCallback((channel, remotePeerId) => {
    channel.binaryType = 'arraybuffer';
    dataChannels.current.set(remotePeerId, channel);

    let currentReceiveTransferId = null;

    channel.onopen = () => console.log('[WebRTC] Receiver channel opened for', remotePeerId);
    channel.onclose = () => dataChannels.current.delete(remotePeerId);
    channel.onerror = (err) => console.error('[WebRTC] Receiver channel error:', err);

    channel.onmessage = (event) => {
      if (typeof event.data === 'string') {
        let msg;
        try { msg = JSON.parse(event.data); } catch (e) { return; }

        if (msg.type === 'queue-meta') {
          console.log('[WebRTC] Queue meta incoming:', msg);
          setIncomingRequest({
            from: remotePeerId,
            peerId: remotePeerId,
            totalFiles: msg.totalFiles,
            totalBytes: msg.totalBytes,
            fileName: msg.totalFiles > 1 ? `${msg.totalFiles} files` : '1 file',
            fileSize: msg.totalBytes
          });
        }

        if (msg.type === 'file-meta') {
          console.log('[WebRTC] Receiving file meta:', msg.name);
          currentReceiveTransferId = msg.transferId;
          
          chunkBuffers.current.set(msg.transferId, []);
          
          setReceiveQueue(prev => {
            const exists = prev.find(i => i.transferId === msg.transferId);
            if (exists) {
              return prev.map(i => i.transferId === msg.transferId ? { ...i, status: 'receiving' } : i);
            }
            return [...prev, {
              transferId: msg.transferId,
              peerId: remotePeerId,
              name: msg.name,
              size: msg.size,
              mimeType: msg.mimeType,
              status: 'receiving',
              progress: 0,
              bytesReceived: 0,
              totalChunks: msg.totalChunks,
              startTime: Date.now()
            }];
          });
        }

        if (msg.type === 'file-complete') {
          console.log('[WebRTC] File complete:', msg.transferId);
          const tId = msg.transferId;
          const chunks = chunkBuffers.current.get(tId);
          
          setReceiveQueue(prev => {
            const item = prev.find(i => i.transferId === tId);
            if (item && chunks) {
              try {
                const blob = new Blob(chunks, { type: item.mimeType });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = item.name;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                
                // Memory management: Clean up chunk array after creating Blob
                setTimeout(() => {
                  URL.revokeObjectURL(url);
                  chunkBuffers.current.delete(tId);
                }, 60000);
              } catch (err) {
                console.error('[WebRTC] Error recreating file:', err);
              }
            }
            if (item && addToHistory) {
              addToHistory({
                id: tId,
                type: 'received',
                fileName: item.name,
                fileSize: item.size,
                mimeType: item.mimeType,
                peer: getPeerName(remotePeerId),
                timestamp: Date.now(),
                status: 'complete',
                duration: Date.now() - (item.startTime || Date.now())
              });
            }
            return prev.map(i => i.transferId === tId ? { ...i, status: 'complete', progress: 100 } : i);
          });

          // Acknowledge receipt back to sender
          if (channel.readyState === 'open') {
            channel.send(JSON.stringify({ type: 'file-ack', transferId: tId, status: 'received' }));
          }
        }
      } else {
        // Binary chunk received
        if (!currentReceiveTransferId) return;
        const chunks = chunkBuffers.current.get(currentReceiveTransferId);
        if (chunks) {
          chunks.push(event.data);
          
          setReceiveQueue(prev => prev.map(item => {
            if (item.transferId === currentReceiveTransferId) {
              const bytesReceived = item.bytesReceived + event.data.byteLength;
              const progress = Math.round((bytesReceived / item.size) * 100);
              return { ...item, bytesReceived, progress };
            }
            return item;
          }));
        }
      }
    };
  }, []);

  // ─── Sender Queue Processor (Backpressure Aware) ───────────────────────────
  const processQueue = useCallback(async () => {
    if (processingQueue.current) return;
    processingQueue.current = true;

    setFileQueue(currentQueue => {
      const nextItem = currentQueue.find(i => i.status === 'pending');
      if (!nextItem) {
        processingQueue.current = false;
        return currentQueue;
      }

      currentTransferId.current = nextItem.transferId;
      const channel = dataChannels.current.get(nextItem.peerId);
      
      if (!channel || channel.readyState !== 'open' || !peerSessions.current.has(nextItem.peerId)) {
        // Wait for channel to open and peer to accept the transfer request
        processingQueue.current = false;
        return currentQueue;
      }

      currentChannel.current = channel;
      isPaused.current = false;
      const startTime = Date.now();

      setTimeout(async () => {
        try {
          const file = nextItem.file;
          const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
          
          // 1. Send file metadata
          channel.send(JSON.stringify({
            type: 'file-meta',
            transferId: nextItem.transferId,
            name: file.name,
            size: file.size,
            mimeType: file.type || 'application/octet-stream',
            totalChunks,
            chunkSize: CHUNK_SIZE
          }));

          currentGenerator.current = chunkFile(file);

          const sendNextChunk = async () => {
            // Check if user cancelled this transfer mid-flight
            let isCancelled = false;
            setFileQueue(q => {
              const it = q.find(i => i.transferId === nextItem.transferId);
              if (!it || it.status === 'cancelled') isCancelled = true;
              return q;
            });
            if (isCancelled) {
              processingQueue.current = false;
              processQueue(); 
              return;
            }

            if (isPaused.current || !currentGenerator.current) return;

            const { value, done } = await currentGenerator.current.next();

            if (done) {
              // 3. Send file complete
              channel.send(JSON.stringify({ type: 'file-complete', transferId: nextItem.transferId }));
              updateQueueItem(nextItem.transferId, { status: 'complete', progress: 100, bytesSent: file.size });
              
              if (addToHistory) {
                addToHistory({
                  id: nextItem.transferId,
                  type: 'sent',
                  fileName: file.name,
                  fileSize: file.size,
                  mimeType: file.type || 'application/octet-stream',
                  peer: getPeerName(nextItem.peerId),
                  timestamp: Date.now(),
                  status: 'complete',
                  duration: Date.now() - startTime
                });
              }

              currentGenerator.current = null;
              processingQueue.current = false;
              
              // Move to next item in queue
              processQueue();
              return;
            }

            // 2. Send ArrayBuffer chunk
            channel.send(value.chunk);
            
            const bytesSent = (value.index + 1) * value.chunk.byteLength;
            const progress = Math.round((bytesSent / file.size) * 100);
            updateQueueItem(nextItem.transferId, { bytesSent, progress });

            // Backpressure Control
            if (channel.bufferedAmount > BUFFER_THRESHOLD) {
              isPaused.current = true;
              // onbufferedamountlow will trigger resume
            } else {
              setTimeout(sendNextChunk, 0);
            }
          };

          channel.onbufferedamountlow = () => {
            if (isPaused.current) {
              isPaused.current = false;
              sendNextChunk();
            }
          };

          channel.bufferedAmountLowThreshold = BUFFER_RESUME;
          
          updateQueueItem(nextItem.transferId, { status: 'sending', startTime });
          sendNextChunk();

        } catch (err) {
          console.error('[WebRTC] Error sending file:', err);
          updateQueueItem(nextItem.transferId, { status: 'error' });
          if (addToHistory) {
            addToHistory({
              id: nextItem.transferId,
              type: 'sent',
              fileName: nextItem.name,
              fileSize: nextItem.size,
              mimeType: nextItem.file?.type || 'application/octet-stream',
              peer: getPeerName(nextItem.peerId),
              timestamp: Date.now(),
              status: 'failed',
              duration: Date.now() - startTime
            });
          }
          processingQueue.current = false;
          processQueue();
        }
      }, 0);

      return currentQueue;
    });
  }, [updateQueueItem]);

  // Auto-process queue when it changes
  useEffect(() => {
    processQueue();
  }, [fileQueue, processQueue]);

  // ─── Socket Signaling Listeners ────────────────────────────────────────────
  const setupPeerConnectionEvents = useCallback((pc, remotePeerId) => {
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket?.emit('ice-candidate', { to: remotePeerId, candidate: e.candidate });
      }
    };
    pc.onconnectionstatechange = () => {
      updateConnectionState(remotePeerId, pc.connectionState);
    };
  }, [socket, updateConnectionState]);

  useEffect(() => {
    if (!socket) return;

    const handleOffer = async ({ from, offer }) => {
      try {
        const pc = new RTCPeerConnection(ICE_CONFIG);
        peerConnections.current.set(from, pc);
        updateConnectionState(from, 'connecting');
        setupPeerConnectionEvents(pc, from);

        pc.ondatachannel = (e) => setupReceiverDataChannel(e.channel, from);

        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('answer', { to: from, answer });
      } catch (err) {
        console.error('[WebRTC] Handle offer error:', err);
        updateConnectionState(from, 'failed');
      }
    };

    const handleAnswer = async ({ from, answer }) => {
      const pc = peerConnections.current.get(from);
      if (pc) {
        try { await pc.setRemoteDescription(new RTCSessionDescription(answer)); } 
        catch (err) { console.error('[WebRTC] Handle answer error:', err); }
      }
    };

    const handleIceCandidate = async ({ from, candidate }) => {
      const pc = peerConnections.current.get(from);
      if (pc && candidate) {
        try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } 
        catch (err) { console.error('[WebRTC] Handle ICE error:', err); }
      }
    };

    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleIceCandidate);

    return () => {
      socket.off('offer', handleOffer);
      socket.off('answer', handleAnswer);
      socket.off('ice-candidate', handleIceCandidate);
    };
  }, [socket, setupPeerConnectionEvents, setupReceiverDataChannel, updateConnectionState]);

  // ─── API Functions ─────────────────────────────────────────────────────────

  const initConnection = useCallback(async (peerId) => {
    if (peerConnections.current.has(peerId)) return;
    try {
      const pc = new RTCPeerConnection(ICE_CONFIG);
      peerConnections.current.set(peerId, pc);
      updateConnectionState(peerId, 'connecting');
      setupPeerConnectionEvents(pc, peerId);

      const channel = pc.createDataChannel('file-transfer', { ordered: true });
      dataChannels.current.set(peerId, channel);

      channel.onmessage = (e) => {
        if (typeof e.data === 'string') {
          try {
            const msg = JSON.parse(e.data);
            if (msg.type === 'accepted') {
              peerSessions.current.add(peerId);
              setIncomingRequest(null);
              processQueue(); 
            }
            if (msg.type === 'rejected') {
              peerSessions.current.delete(peerId);
              setIncomingRequest(null);
              setFileQueue(prev => prev.map(i => i.peerId === peerId && i.status === 'pending' ? { ...i, status: 'cancelled' } : i));
            }
          } catch (err) {}
        }
      };

      // Set channel open handler to process queue if session was previously accepted
      channel.onopen = () => {
        console.log('[WebRTC] Sender channel opened for', peerId);
        
        if (!peerSessions.current.has(peerId)) {
          // If not accepted yet, tell the receiver about the incoming queue
          const meta = pendingMeta.current.get(peerId);
          if (meta) {
            channel.send(JSON.stringify({
              type: 'queue-meta',
              totalFiles: meta.totalFiles,
              totalBytes: meta.totalBytes
            }));
            pendingMeta.current.delete(peerId);
          }
        } else {
          // Already accepted (e.g. they sent files to us first, or we are adding more to an active session)
          processQueue();
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('offer', { to: peerId, offer });
    } catch (err) {
      console.error('[WebRTC] Init connection error:', err);
      updateConnectionState(peerId, 'failed');
    }
  }, [socket, setupPeerConnectionEvents, processQueue, updateConnectionState]);

  const addFilesToQueue = useCallback((peerId, files) => {
    if (!files || files.length === 0) return;
    initConnection(peerId);

    const totalBytes = files.reduce((acc, f) => acc + f.size, 0);
    const newItems = files.map(file => ({
      transferId: generateTransferId(),
      peerId,
      file,
      name: file.name,
      size: file.size,
      status: 'pending',
      progress: 0,
      bytesSent: 0,
      speed: 0,
      eta: null
    }));

    // Accumulate pending meta in case multiple batches are added before open
    const existing = pendingMeta.current.get(peerId) || { totalFiles: 0, totalBytes: 0 };
    pendingMeta.current.set(peerId, {
      totalFiles: existing.totalFiles + newItems.length,
      totalBytes: existing.totalBytes + totalBytes
    });

    setFileQueue(prev => [...prev, ...newItems]);

    // If channel is already open and peer hasn't accepted, we can send queue-meta immediately.
    // If it's not open yet, channel.onopen will send it.
    const channel = dataChannels.current.get(peerId);
    if (channel && channel.readyState === 'open' && !peerSessions.current.has(peerId)) {
      const meta = pendingMeta.current.get(peerId);
      if (meta) {
        channel.send(JSON.stringify({
          type: 'queue-meta',
          totalFiles: meta.totalFiles,
          totalBytes: meta.totalBytes
        }));
        pendingMeta.current.delete(peerId);
      }
    }
  }, [initConnection]);

  const cancelTransfer = useCallback((transferId) => {
    setFileQueue(prev => prev.map(item => {
      if (item.transferId === transferId) {
        if (item.status === 'sending') {
          currentGenerator.current = null;
          isPaused.current = false;
          processingQueue.current = false;
          setTimeout(processQueue, 100); // trigger next
        }
        if (addToHistory) {
          addToHistory({
            id: item.transferId,
            type: 'sent',
            fileName: item.name,
            fileSize: item.size,
            mimeType: item.file?.type || 'application/octet-stream',
            peer: getPeerName(item.peerId),
            timestamp: Date.now(),
            status: 'cancelled',
            duration: item.startTime ? Date.now() - item.startTime : 0
          });
        }
        return { ...item, status: 'cancelled' };
      }
      return item;
    }));
  }, [processQueue, addToHistory, getPeerName]);

  const cancelAll = useCallback(() => {
    setFileQueue(prev => {
      let isSending = false;
      const next = prev.map(item => {
        if (item.status === 'pending' || item.status === 'sending') {
          if (item.status === 'sending') isSending = true;
          if (addToHistory) {
            addToHistory({
              id: item.transferId,
              type: 'sent',
              fileName: item.name,
              fileSize: item.size,
              mimeType: item.file?.type || 'application/octet-stream',
              peer: getPeerName(item.peerId),
              timestamp: Date.now(),
              status: 'cancelled',
              duration: item.startTime ? Date.now() - item.startTime : 0
            });
          }
          return { ...item, status: 'cancelled' };
        }
        return item;
      });
      if (isSending) {
        currentGenerator.current = null;
        isPaused.current = false;
        processingQueue.current = false;
      }
      return next;
    });
  }, [addToHistory, getPeerName]);

  const acceptTransfer = useCallback(() => {
    if (incomingRequest?.from) {
      const channel = dataChannels.current.get(incomingRequest.from);
      if (channel && channel.readyState === 'open') {
        channel.send(JSON.stringify({ type: 'accepted' }));
      }
    }
    setIncomingRequest(null);
  }, [incomingRequest]);

  const rejectTransfer = useCallback(() => {
    if (incomingRequest?.from) {
      const channel = dataChannels.current.get(incomingRequest.from);
      if (channel && channel.readyState === 'open') {
        channel.send(JSON.stringify({ type: 'rejected' }));
      }
    }
    setIncomingRequest(null);
  }, [incomingRequest]);

  const closeConnection = useCallback((peerId) => {
    const pc = peerConnections.current.get(peerId);
    if (pc) pc.close();
    peerConnections.current.delete(peerId);
    
    const dc = dataChannels.current.get(peerId);
    if (dc) dc.close();
    dataChannels.current.delete(peerId);
    
    peerSessions.current.delete(peerId);
    updateConnectionState(peerId, 'disconnected');
  }, [updateConnectionState]);

  return {
    initConnection,
    addFilesToQueue,
    cancelTransfer,
    cancelAll,
    fileQueue,

    incomingRequest,
    acceptTransfer,
    rejectTransfer,
    receiveQueue,

    connectionState,
    closeConnection,

    // Aliases for compatibility with ShareContext
    startTransfer: addFilesToQueue,
    transferProgress: [...fileQueue, ...receiveQueue],
  };
}
