import { Server } from "socket.io";
import type { NextApiRequest, NextApiResponse } from "next";

export default function SocketHandler(req: NextApiRequest, res: any) {
    if (res.socket.server.io) {
        // Socket already initialized
    } else {
        console.log("[SERVER v2.1] Initializing Socket.IO (Standard Path)");
        const io = new Server(res.socket.server, {
            // Revert to default path for maximum compatibility
            addTrailingSlash: false,
            maxHttpBufferSize: 2e8, // 200MB
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });
        res.socket.server.io = io;

        io.on("connection", (socket) => {
            console.log("[SERVER] Connected:", socket.id);

            socket.on("join-room", ({ roomCode, isHost }) => {
                const code = String(roomCode).trim();
                socket.join(code);
                console.log(`[JOIN] ${socket.id} -> ROOM ${code} (isHost: ${isHost})`);
                io.to(code).emit("user-joined", { userId: socket.id, isHost });
            });

            socket.on("request-tracks", (roomCode) => {
                const code = String(roomCode).trim();
                io.to(code).emit("tracks-requested", socket.id);
            });

            socket.on("sync-tracks", ({ roomCode, tracks }) => {
                const code = String(roomCode).trim();
                if (tracks && tracks.length > 0) {
                    io.to(code).emit("receive-tracks", tracks);
                }
            });

            socket.on("update-activity", ({ roomCode, username, trackId, isPlaying }) => {
                const code = String(roomCode).trim();
                socket.to(code).emit("activity-broadcast", {
                    userId: socket.id,
                    username,
                    trackId,
                    isPlaying
                });
            });

            socket.on("disband-room", (roomCode) => {
                const code = String(roomCode).trim();
                io.to(code).emit("room-disbanded");
            });

            socket.on("disconnect", (reason) => {
                console.log("[SERVER] Disconnect:", socket.id, reason);
            });
        });
    }
    res.end();
}
