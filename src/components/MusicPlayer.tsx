"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, SkipForward, SkipBack, Volume2, List, Settings, Share2, FileMusic, RefreshCcw, X, Shuffle, Repeat, Repeat1, Mic2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Track } from "./FolderUpload";

interface MusicPlayerProps {
    tracks: Track[];
    isHost: boolean;
    username?: string;
    reportActivity?: (username: string, trackId: string, isPlaying: boolean) => void;
    usersActivity?: Record<string, { username: string, trackId: string, isPlaying: boolean, timestamp: number }>;
}

type RepeatMode = "off" | "all" | "one";

interface LyricLine {
    time: number;
    text: string;
}

export default function MusicPlayer({ tracks, isHost, username, reportActivity, usersActivity = {} }: MusicPlayerProps) {
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [showPlaylist, setShowPlaylist] = useState(false);
    const [isShuffle, setIsShuffle] = useState(false);
    const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");
    const [showLyrics, setShowLyrics] = useState(false);
    const [parsedLyrics, setParsedLyrics] = useState<LyricLine[]>([]);
    const [volume, setVolume] = useState(0.8);
    const lyricsContainerRef = useRef<HTMLDivElement>(null);

    const audioRef = useRef<HTMLAudioElement>(null);

    const [isSynced, setIsSynced] = useState(false);

    const parseLRC = (lrc: string): LyricLine[] => {
        // Basic sanitation for ID3 garbage/prefixes (e.g., 'eng\0' or 'xxx\0')
        const sanitizedLrc = lrc.replace(/^([a-z]{3})[\x00-\x20]+/i, "");

        const lines = sanitizedLrc.split("\n");
        const result: LyricLine[] = [];
        const timeRegex = /\[(\d{2}):(\d{2})(\.|\:)(\d{2,3})\]/g;

        lines.forEach(line => {
            let match;
            const text = line.replace(/\[.*?\]/g, "").trim();
            if (!text) return;

            // Further sanitize individual line text (remove non-printable control chars)
            const cleanText = text.replace(/[\x00-\x1F\x7F-\x9F]/g, "");
            if (!cleanText) return;

            timeRegex.lastIndex = 0;
            let foundTime = false;
            while ((match = timeRegex.exec(line)) !== null) {
                const minutes = parseInt(match[1]);
                const seconds = parseInt(match[2]);
                const rawMs = match[4];
                const ms = parseInt(rawMs);
                const time = minutes * 60 + seconds + (ms / (rawMs.length === 3 ? 1000 : 100));
                result.push({ time, text: cleanText });
                foundTime = true;
            }
        });

        if (result.length > 0) {
            setIsSynced(true);
            return result.sort((a, b) => a.time - b.time);
        } else {
            setIsSynced(false);
            // Plain text lyrics - don't assign times that imply sync
            return sanitizedLrc.split("\n")
                .map(text => text.trim().replace(/[\x00-\x1F\x7F-\x9F]/g, ""))
                .filter(text => text)
                .map((text, i) => ({ time: -1, text })); // -1 indicates unsynced
        }
    };

    const currentTrack = tracks[currentTrackIndex];

    useEffect(() => {
        if (currentTrack?.lyrics) {
            setParsedLyrics(parseLRC(currentTrack.lyrics));
        } else {
            setParsedLyrics([]);
        }
    }, [currentTrack]);

    useEffect(() => {
        if (showLyrics && isSynced && lyricsContainerRef.current && parsedLyrics.length > 0) {
            const activeLine = parsedLyrics.findIndex((l, i) =>
                currentTime >= l.time && (!parsedLyrics[i + 1] || currentTime < parsedLyrics[i + 1].time)
            );
            if (activeLine !== -1) {
                const element = lyricsContainerRef.current.children[activeLine] as HTMLElement;
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }
    }, [currentTime, showLyrics, parsedLyrics, isSynced]);

    // Activity Reporting
    useEffect(() => {
        if (reportActivity && username && currentTrack) {
            const send = () => reportActivity(username, currentTrack.id, isPlaying);
            send(); // Immediate report on track change or play/pause
            const interval = setInterval(send, 5000); // Pulse every 5s for better responsiveness
            return () => clearInterval(interval);
        }
    }, [currentTrack?.id, isPlaying, username, reportActivity]);

    const othersOnThisTrack = Object.values(usersActivity).filter(
        a => a.trackId === currentTrack?.id && a.username !== username
    );

    useEffect(() => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.play().catch(e => console.log("Playback blocked:", e));
            } else {
                audioRef.current.pause();
            }
        }
    }, [isPlaying, currentTrackIndex]);

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
            setDuration(audioRef.current.duration);
        }
    };

    const togglePlay = () => setIsPlaying(!isPlaying);

    const handleSkip = (direction: "forward" | "back") => {
        if (isShuffle && direction === "forward") {
            const nextIndex = Math.floor(Math.random() * tracks.length);
            setCurrentTrackIndex(nextIndex);
        } else {
            let nextIndex = direction === "forward" ? currentTrackIndex + 1 : currentTrackIndex - 1;
            if (nextIndex < 0) nextIndex = tracks.length - 1;
            if (nextIndex >= tracks.length) nextIndex = 0;
            setCurrentTrackIndex(nextIndex);
        }
        setIsPlaying(true);
    };

    const handleTrackEnd = () => {
        if (repeatMode === "one") {
            if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play();
            }
        } else if (repeatMode === "all" || currentTrackIndex < tracks.length - 1 || isShuffle) {
            handleSkip("forward");
        } else {
            setIsPlaying(false);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const toggleRepeat = () => {
        const modes: RepeatMode[] = ["off", "all", "one"];
        const currentIndex = modes.indexOf(repeatMode);
        setRepeatMode(modes[(currentIndex + 1) % modes.length]);
    };

    const formatTime = (time: number) => {
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <div style={{
            height: "100vh",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            position: "relative",
            overflow: "hidden"
        }}>
            {/* Background Blur Effect */}
            <div style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: -1,
                overflow: "hidden"
            }}>
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                    style={{
                        position: "absolute",
                        top: "10%",
                        left: "10%",
                        width: "80%",
                        height: "80%",
                        background: "radial-gradient(circle, hsla(var(--primary), 0.15) 0%, transparent 70%)",
                        filter: "blur(120px)"
                    }}
                />
            </div>

            {/* Main Player UI */}
            <div style={{
                width: "100%",
                maxWidth: "400px",
                display: "flex",
                flexDirection: "column",
                gap: "2rem",
                position: "relative",
                zIndex: 10
            }}>
                {/* Album Art */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    style={{
                        width: "100%",
                        aspectRatio: "1/1",
                        borderRadius: "1.5rem",
                        overflow: "hidden",
                        boxShadow: "0 40px 80px -20px rgba(0,0,0,0.6)",
                        background: "rgba(255,255,255,0.03)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px solid rgba(255,255,255,0.08)"
                    }}
                >
                    {currentTrack?.cover ? (
                        <img
                            src={currentTrack.cover}
                            alt={currentTrack.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                    ) : (
                        <FileMusic size={100} style={{ opacity: 0.1 }} />
                    )}
                </motion.div>

                {/* Track Info */}
                <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <h2 style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.02em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} className="text-gradient">
                        {currentTrack?.name || (tracks.length === 0 ? "SYNCING LIBRARY..." : "No Track Selected")}
                    </h2>
                    <p style={{ color: "hsl(var(--muted-foreground))", fontSize: "1rem", fontWeight: 600 }}>
                        {currentTrack?.artist || (tracks.length === 0 ? "Please wait for host" : "Unknown Artist")}
                    </p>

                    {/* Others listening to this */}
                    <AnimatePresence>
                        {othersOnThisTrack.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginTop: "0.5rem" }}
                            >
                                <span style={{ fontSize: "0.65rem", fontWeight: 800, color: "hsl(var(--primary))", letterSpacing: "0.1em" }}>LISTENING WITH</span>
                                <div style={{ display: "flex", gap: "0.4rem" }}>
                                    {othersOnThisTrack.map((u, i) => (
                                        <span key={i} style={{ fontSize: "0.75rem", background: "rgba(255,255,255,0.05)", padding: "0.2rem 0.5rem", borderRadius: "4px", fontWeight: 700 }}>
                                            {u.username}
                                        </span>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>


                {/* Progress Bar */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <div style={{ position: "relative", width: "100%", height: "4px", background: "rgba(255,255,255,0.1)", borderRadius: "2px" }}>
                        <input
                            type="range"
                            min={0}
                            max={duration || 0}
                            value={currentTime}
                            onChange={handleSeek}
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                opacity: 0,
                                cursor: "pointer",
                                zIndex: 2
                            }}
                        />
                        <div style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            height: "100%",
                            width: `${(currentTime / duration) * 100}%`,
                            background: "hsl(var(--primary))",
                            borderRadius: "2px",
                            boxShadow: "0 0 15px hsla(var(--primary), 0.4)"
                        }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", fontWeight: 700 }}>
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>

                {/* Controls */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsShuffle(!isShuffle)}
                        style={{
                            background: "none",
                            border: "none",
                            color: isShuffle ? "hsl(var(--primary))" : "white",
                            cursor: "pointer",
                            opacity: isShuffle ? 1 : 0.5
                        }}
                    >
                        <Shuffle size={20} />
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleSkip("back")}
                        style={{ background: "none", border: "none", color: "white", cursor: "pointer" }}
                    >
                        <SkipBack size={28} fill="currentColor" />
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={togglePlay}
                        style={{
                            width: "72px",
                            height: "72px",
                            borderRadius: "50%",
                            background: "hsl(var(--primary))",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "none",
                            cursor: "pointer",
                            boxShadow: "0 15px 30px -5px hsla(var(--primary), 0.5)"
                        }}
                    >
                        {isPlaying ? (
                            <Pause size={32} fill="white" color="white" />
                        ) : (
                            <Play size={32} fill="white" color="white" style={{ marginLeft: "4px" }} />
                        )}
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleSkip("forward")}
                        style={{ background: "none", border: "none", color: "white", cursor: "pointer" }}
                    >
                        <SkipForward size={28} fill="currentColor" />
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={toggleRepeat}
                        style={{
                            background: "none",
                            border: "none",
                            color: repeatMode !== "off" ? "hsl(var(--primary))" : "white",
                            cursor: "pointer",
                            opacity: repeatMode !== "off" ? 1 : 0.5,
                            position: "relative"
                        }}
                    >
                        {repeatMode === "one" ? <Repeat1 size={20} /> : <Repeat size={20} />}
                        {repeatMode === "all" && <div style={{ position: "absolute", bottom: -5, left: "50%", transform: "translateX(-50%)", width: "4px", height: "4px", borderRadius: "50%", background: "currentColor" }} />}
                    </motion.button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: currentTrack?.lyrics ? "1fr 1fr" : "1fr", gap: "1rem" }}>
                    {currentTrack?.lyrics && (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowLyrics(true)}
                            className="glass"
                            style={{
                                padding: "0.75rem",
                                borderRadius: "12px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "0.5rem",
                                border: "1px solid rgba(255,255,255,0.06)",
                                color: "white",
                                cursor: "pointer"
                            }}
                        >
                            <Mic2 size={18} color="hsl(var(--primary))" />
                            <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>LYRICS</span>
                        </motion.button>
                    )}

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowPlaylist(true)}
                        className="glass"
                        style={{
                            padding: "0.75rem",
                            borderRadius: "12px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "0.5rem",
                            border: "1px solid rgba(255,255,255,0.06)",
                            color: "white",
                            cursor: "pointer"
                        }}
                    >
                        <List size={18} />
                        <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>QUEUE</span>
                    </motion.button>
                </div>
            </div>

            <audio
                ref={audioRef}
                src={currentTrack?.url}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleTrackEnd}
            />

            {/* Lyrics View */}
            <AnimatePresence>
                {showLyrics && (
                    <motion.div
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        style={{
                            position: "fixed",
                            inset: 0,
                            zIndex: 1000,
                            background: "rgba(0,0,0,0.85)",
                            backdropFilter: "blur(60px)",
                            display: "flex",
                            flexDirection: "column",
                            padding: "6rem 2rem 4rem"
                        }}
                    >
                        <button
                            onClick={() => setShowLyrics(false)}
                            style={{ position: "absolute", top: "2rem", right: "2rem", background: "rgba(255,255,255,0.05)", border: "none", width: "48px", height: "48px", borderRadius: "50%", color: "white", zIndex: 1001, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                        >
                            <X size={24} />
                        </button>

                        <div
                            style={{
                                display: "flex",
                                justifyContent: "center",
                                gap: "0.5rem",
                                marginBottom: "1rem",
                                opacity: 0.6
                            }}
                        >
                            <span style={{ fontSize: "0.65rem", fontWeight: 900, letterSpacing: "0.1rem", background: isSynced ? "hsla(var(--primary), 0.2)" : "rgba(255,255,255,0.1)", color: isSynced ? "hsl(var(--primary))" : "white", padding: "0.25rem 0.5rem", borderRadius: "4px" }}>
                                {isSynced ? "SYNCED" : "PLAIN TEXT"}
                            </span>
                        </div>

                        <div
                            ref={lyricsContainerRef}
                            style={{
                                flex: 1,
                                overflowY: "auto",
                                maskImage: isSynced ? "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)" : "none",
                                WebkitMaskImage: isSynced ? "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)" : "none",
                                display: "flex",
                                flexDirection: "column",
                                gap: isSynced ? "2.3rem" : "1.2rem",
                                padding: isSynced ? "10rem 0" : "2rem 0"
                            }}
                            className="hide-scrollbar"
                        >
                            {parsedLyrics.length > 0 ? (
                                parsedLyrics.map((line, idx) => {
                                    const isActive = isSynced && currentTime >= line.time && (!parsedLyrics[idx + 1] || currentTime < parsedLyrics[idx + 1].time);
                                    return (
                                        <motion.p
                                            key={idx}
                                            animate={{
                                                opacity: isSynced ? (isActive ? 1 : 0.3) : 1,
                                                scale: isSynced ? (isActive ? 1.05 : 1) : 1,
                                                color: isSynced ? (isActive ? "hsl(var(--primary))" : "white") : "white"
                                            }}
                                            style={{
                                                fontSize: isSynced ? "1.75rem" : "1.1rem",
                                                fontWeight: isSynced ? 800 : 600,
                                                textAlign: isSynced ? "center" : "left",
                                                padding: isSynced ? "0 1rem" : "0 2rem",
                                                cursor: isSynced ? "pointer" : "default",
                                                transition: "all 0.3s",
                                                lineHeight: 1.4
                                            }}
                                            onClick={() => {
                                                if (isSynced && audioRef.current) audioRef.current.currentTime = line.time;
                                            }}
                                        >
                                            {line.text}
                                        </motion.p>
                                    );
                                })
                            ) : (
                                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1.5rem", opacity: 0.5 }}>
                                    <Mic2 size={64} />
                                    <div style={{ textAlign: "center" }}>
                                        <p style={{ fontWeight: 800, fontSize: "1.25rem" }}>No Lyrics Found</p>
                                        <p style={{ fontSize: "0.9rem", color: "hsl(var(--muted-foreground))" }}>Make sure your audio files have embedded lyrics or .lrc files in the folder.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Playlist Drawer */}
            <AnimatePresence>
                {showPlaylist && (
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        style={{
                            position: "fixed",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: "75vh",
                            zIndex: 1000,
                            background: "rgba(10, 10, 10, 0.9)",
                            backdropFilter: "blur(40px)",
                            borderTopLeftRadius: "2rem",
                            borderTopRightRadius: "2rem",
                            borderTop: "1px solid rgba(255,255,255,0.1)",
                            padding: "2rem",
                            display: "flex",
                            flexDirection: "column",
                            gap: "1.5rem"
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <h3 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Queue</h3>
                            <button
                                onClick={() => setShowPlaylist(false)}
                                style={{ background: "rgba(255,255,255,0.05)", border: "none", width: "40px", height: "40px", borderRadius: "50%", color: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {tracks.map((track, idx) => (
                                <button
                                    key={track.id || idx}
                                    onClick={() => {
                                        setCurrentTrackIndex(idx);
                                        setIsPlaying(true);
                                    }}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "1rem",
                                        padding: "1rem",
                                        borderRadius: "1rem",
                                        border: "none",
                                        background: idx === currentTrackIndex ? "hsla(var(--primary), 0.1)" : "transparent",
                                        color: "white",
                                        textAlign: "left",
                                        cursor: "pointer",
                                        transition: "background 0.2s"
                                    }}
                                >
                                    <div style={{ width: "48px", height: "48px", borderRadius: "8px", overflow: "hidden", background: "rgba(255,255,255,0.05)" }}>
                                        {track.cover && <img src={track.cover} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                                    </div>
                                    <div style={{ flex: 1, overflow: "hidden" }}>
                                        <p style={{ fontWeight: 700, fontSize: "1rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: idx === currentTrackIndex ? "hsl(var(--primary))" : "white" }}>{track.name}</p>
                                        <p style={{ fontSize: "0.85rem", color: "hsl(var(--muted-foreground))" }}>{track.artist}</p>

                                        {/* Presence in Playlist */}
                                        <div style={{ display: "flex", gap: "0.3rem", marginTop: "0.25rem", flexWrap: "wrap" }}>
                                            {Object.values(usersActivity)
                                                .filter(a => a.trackId === track.id)
                                                .map((u, i) => (
                                                    <span
                                                        key={i}
                                                        style={{
                                                            fontSize: "0.6rem",
                                                            background: u.isPlaying ? "hsla(var(--primary), 0.1)" : "rgba(255,255,255,0.05)",
                                                            color: u.isPlaying ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                                                            padding: "0.1rem 0.3rem",
                                                            borderRadius: "2px",
                                                            fontWeight: 800,
                                                            opacity: u.isPlaying ? 1 : 0.6
                                                        }}
                                                    >
                                                        {u.username.toUpperCase()}{!u.isPlaying && " (PAUSED)"}
                                                    </span>
                                                ))
                                            }
                                        </div>
                                    </div>
                                    {idx === currentTrackIndex && isPlaying && (
                                        <div style={{ display: "flex", gap: "2px", alignItems: "flex-end", height: "12px" }}>
                                            {[1, 2, 3].map(i => (
                                                <motion.div
                                                    key={i}
                                                    animate={{ height: ["20%", "100%", "20%"] }}
                                                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                                                    style={{ width: "3px", background: "hsl(var(--primary))", borderRadius: "1px" }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
