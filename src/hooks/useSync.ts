"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

export function useSync(roomCode: string, isHost: boolean, initialTracks?: any[]) {
    const socketRef = useRef<Socket | null>(null);
    const [tracks, setTracks] = useState<any[]>(initialTracks || []);
    const [isConnected, setIsConnected] = useState(false);
    const [usersActivity, setUsersActivity] = useState<Record<string, { username: string, trackId: string, isPlaying: boolean, timestamp: number }>>({});
    const [isDisbanded, setIsDisbanded] = useState(false);

    const tracksRef = useRef<any[]>(initialTracks || []);
    const lastActivity = useRef<any>(null);

    useEffect(() => {
        tracksRef.current = tracks;
    }, [tracks]);

    useEffect(() => {
        if (isHost && initialTracks && initialTracks.length > 0) {
            setTracks(initialTracks);
            if (socketRef.current?.connected) {
                socketRef.current.emit("sync-tracks", { roomCode, tracks: initialTracks });
            }
        }
    }, [initialTracks, isHost, roomCode]);

    useEffect(() => {
        if (!roomCode) return;

        let socket: Socket;

        fetch("/api/socket").finally(() => {
            // Using default path for maximum reliability
            socket = io({
                reconnection: true,
                reconnectionAttempts: Infinity,
                reconnectionDelay: 1000,
            });
            socketRef.current = socket;

            socket.on("connect", () => {
                console.log("[CLIENT] Connected:", socket.id);
                setIsConnected(true);
                socket.emit("join-room", { roomCode, isHost });

                if (!isHost) {
                    socket.emit("request-tracks", roomCode);
                }
            });

            socket.on("tracks-requested", (id) => {
                if (isHost && tracksRef.current && tracksRef.current.length > 0) {
                    socket.emit("sync-tracks", { roomCode, tracks: tracksRef.current });
                }
            });

            socket.on("receive-tracks", (received) => {
                if (!isHost && received && received.length > 0) {
                    setTracks(received);
                }
            });

            socket.on("user-joined", () => {
                if (isHost && tracksRef.current && tracksRef.current.length > 0) {
                    socket.emit("sync-tracks", { roomCode, tracks: tracksRef.current });
                }
                if (lastActivity.current) {
                    socket.emit("update-activity", { roomCode, ...lastActivity.current });
                }
            });

            socket.on("activity-broadcast", ({ userId, username, trackId, isPlaying }: any) => {
                setUsersActivity(prev => ({
                    ...prev,
                    [userId]: { username, trackId, isPlaying, timestamp: Date.now() }
                }));
            });

            socket.on("room-disbanded", () => {
                if (!isHost) {
                    setIsDisbanded(true);
                }
            });

            socket.on("disconnect", (reason) => {
                console.log("[CLIENT] Disconnected:", reason);
                setIsConnected(false);
            });

            socket.on("connect_error", (err) => {
                console.error("[CLIENT] Connection Error:", err.message);
            });
        });

        return () => {
            if (socket) {
                socket.disconnect();
            }
        };
    }, [roomCode, isHost]);

    useEffect(() => {
        if (!roomCode) return;

        const heartbeat = setInterval(() => {
            if (!isHost && tracks.length === 0 && socketRef.current?.connected) {
                socketRef.current.emit("request-tracks", roomCode);
            }
        }, 5000);

        const hostSync = setInterval(() => {
            if (isHost && tracksRef.current && tracksRef.current.length > 0 && socketRef.current?.connected) {
                socketRef.current.emit("sync-tracks", { roomCode, tracks: tracksRef.current });
            }
        }, 15000);

        const presenceCleanup = setInterval(() => {
            const now = Date.now();
            setUsersActivity(prev => {
                const updated = { ...prev };
                let changed = false;
                Object.keys(updated).forEach(id => {
                    if (now - updated[id].timestamp > 20000) {
                        delete updated[id];
                        changed = true;
                    }
                });
                return changed ? updated : prev;
            });
        }, 5000);

        return () => {
            clearInterval(heartbeat);
            clearInterval(hostSync);
            clearInterval(presenceCleanup);
        };
    }, [roomCode, isHost, tracks.length]);

    const reportActivity = (username: string, trackId: string, isPlaying: boolean) => {
        lastActivity.current = { username, trackId, isPlaying };
        if (socketRef.current?.connected) {
            socketRef.current.emit("update-activity", {
                roomCode,
                username,
                trackId,
                isPlaying
            });
        }
    };

    const disband = () => {
        if (socketRef.current?.connected && isHost) {
            socketRef.current.emit("disband-room", roomCode);
        }
    };

    return { tracks, reportActivity, usersActivity, isConnected, isDisbanded, disband };
}
