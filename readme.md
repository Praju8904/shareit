# ShareIt - Peer-to-Peer File Transfer

ShareIt is a modern, privacy-focused file transfer application that enables users to share files directly between devices without relying on cloud services or centralized servers.

## Overview

Built with **React**, **Vite**, **WebRTC**, and **Socket.io**, ShareIt provides a fast and secure way to transfer files between devices on the same network or using room codes for remote connections.

## Features

### Core Functionality
- **Peer-to-Peer Architecture**: Direct WebRTC data channels for file transfers (no server relay)
- **Dual Connection Methods**:
  - **Nearby Devices**: Auto-discovery of devices on the same WiFi network
  - **Room Codes**: 6-character unique codes for connecting devices across networks
- **Multi-Device Support**: Works on smartphones, tablets, and laptops
- **Smart Device Detection**: Automatically identifies device type for better UX

### User Experience
- **Real-Time Progress Tracking**: Live transfer speed, ETA, and progress percentage
- **File Transfer History**: View all past transfers with timestamps and file sizes
- **Mobile-First Design**: Responsive UI optimized for touchscreen and desktop
- **Drag & Drop Support**: Quick file selection on desktop

### Technical Features
- **Chunked File Transmission**: Large files split into manageable chunks
- **Adaptive Buffering**: Automatic pause/resume based on network conditions
- **Battery Optimization**: Wake lock management on mobile devices
- **STUN Servers**: Google STUN servers for NAT traversal
- **Socket.io Fallback**: WebSocket + long-polling for better compatibility

## Tech Stack

**Frontend:**
- React 18
- Vite (build tool)
- Tailwind CSS (styling)
- Lucide React (icons)
- React Router (navigation)
- Socket.io Client (signaling)

**Backend:**
- Node.js
- Express (HTTP server)
- Socket.io (WebSocket server)
- CORS (cross-origin support)

## Use Cases

✅ Quickly transfer files between your devices  
✅ Share files with friends on the same network  
✅ Send files to multiple devices simultaneously  
✅ Transfer large files without compression  
✅ Monitor transfer speeds and statistics  

## Installation & Usage

See [SETUP.md](SETUP.md) for detailed setup instructions.

## Privacy & Security

- All transfers are direct (P2P) - no files stored on servers
- Optional room code protection for secure connections
- Device names are optional
- Local storage only for transfer history