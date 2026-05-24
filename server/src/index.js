import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { handleSignaling } from "./socket/signaling.js";

// ── In-memory state ─────────────────────────────────────────────────────────
/** @type {Map<string, Set<string>>} roomCode → Set of socketIds */
export const rooms = new Map();

/** @type {Map<string, { deviceName: string, deviceType: string, ip: string, roomCode: string | null }>} socketId → device info */
export const devices = new Map();

// ── Express + HTTP ──────────────────────────────────────────────────────────
const app = express();
app.use(cors({ origin: "http://localhost:5173" }));

const httpServer = createServer(app);

// ── Socket.IO ───────────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(
    `[${new Date().toISOString()}] CONNECTION - socket ${socket.id} connected`,
  );
  handleSignaling(io, socket, rooms, devices);
});

// ── Start ───────────────────────────────────────────────────────────────────
const PORT = 3002;
httpServer.listen(PORT, () => {
  console.log(
    `[${new Date().toISOString()}] SERVER_START - ShareIt signaling server running on port ${PORT}`,
  );
});
