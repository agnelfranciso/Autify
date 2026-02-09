"use client";

import { useState, useRef, useEffect } from "react";
import * as musicMetadata from "music-metadata-browser";
import { Play, Pause, SkipForward, SkipBack, Volume2, List, Settings, Share2, FileMusic, Upload, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface Track {
    id: string;
    name: string;
    artist: string;
    album: string;
    cover?: string;
    url: string;
    duration?: number;
    lyrics?: string;
}

interface FolderUploadProps {
    onTracksLoaded: (tracks: Track[]) => void;
}

export default function FolderUpload({ onTracksLoaded }: FolderUploadProps) {
    const folderInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [loadingPhase, setLoadingPhase] = useState<"analyzing" | "uploading">("analyzing");
    const [currentFile, setCurrentFile] = useState<string>("");

    const resizeImage = (dataUrl: string): Promise<string> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const MAX_SIZE = 500;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_SIZE) {
                        height *= MAX_SIZE / width;
                        width = MAX_SIZE;
                    }
                } else {
                    if (height > MAX_SIZE) {
                        width *= MAX_SIZE / height;
                        height = MAX_SIZE;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx?.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL("image/jpeg", 0.9));
            };
            img.src = dataUrl;
        });
    };

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        setLoading(true);
        setLoadingPhase("analyzing");
        const allFiles = Array.from(files);
        const audioFiles = allFiles.filter(file =>
            file.type.startsWith("audio/") ||
            /\.(mp3|wav|flac|m4a)$/i.test(file.name)
        );
        const lrcFiles = allFiles.filter(f => f.name.toLowerCase().endsWith(".lrc"));

        if (audioFiles.length === 0) {
            setLoading(false);
            return;
        }

        setProgress({ current: 0, total: audioFiles.length });
        const loadedTracks: Track[] = [];

        const readTextFile = (file: File): Promise<string> => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.readAsText(file);
            });
        };

        const CONCURRENCY_METADATA = 5;
        const CONCURRENCY_UPLOAD = 3;

        // Phase 1: Parallel Metadata Parsing
        const parseFile = async (file: File) => {
            try {
                setCurrentFile(file.name);
                const metadata = await musicMetadata.parseBlob(file);
                let cover: string | undefined;

                if (metadata.common.picture && metadata.common.picture.length > 0) {
                    const pic = metadata.common.picture[0];
                    const blob = new Blob([pic.data as unknown as BlobPart], { type: pic.format });
                    const fullRes = await new Promise<string>((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result as string);
                        reader.readAsDataURL(blob);
                    });
                    cover = await resizeImage(fullRes);
                }

                const baseName = file.name.replace(/\.[^/.]+$/, "");
                const matchingLrc = lrcFiles.find(l => l.name.replace(/\.[^/.]+$/, "") === baseName);
                let lyrics = matchingLrc ? await readTextFile(matchingLrc) : undefined;

                if (!lyrics && metadata.common.lyrics) {
                    // Filter out garbage characters and join
                    lyrics = metadata.common.lyrics
                        .map(l => l.replace(/[\x00-\x1F\x7F-\x9F]/g, "").trim())
                        .filter(l => l)
                        .join("\n");
                }

                return {
                    name: file.name,
                    metadata: {
                        name: metadata.common.title || baseName,
                        artist: metadata.common.artist || "Unknown Artist",
                        album: metadata.common.album || "Unknown Album",
                        cover,
                        duration: metadata.format.duration,
                        lyrics
                    }
                };
            } catch (e) {
                return { name: file.name, metadata: null };
            }
        };

        const metadataMap = new Map();
        for (let i = 0; i < audioFiles.length; i += CONCURRENCY_METADATA) {
            const batch = audioFiles.slice(i, i + CONCURRENCY_METADATA);
            const results = await Promise.all(batch.map(f => parseFile(f)));
            results.forEach(res => metadataMap.set(res.name, res.metadata));
            setProgress(prev => ({ ...prev, current: Math.min(i + CONCURRENCY_METADATA, audioFiles.length) }));
        }

        // Phase 2: Concurrent Uploads
        setLoadingPhase("uploading");
        setProgress({ current: 0, total: audioFiles.length });

        const uploadFile = async (file: File) => {
            setCurrentFile(file.name);
            const formData = new FormData();
            formData.append("files", file);
            try {
                const res = await fetch("/api/upload", { method: "POST", body: formData });
                const data = await res.json();
                if (data.success && data.tracks[0]) {
                    const meta = metadataMap.get(file.name);
                    loadedTracks.push({
                        id: Math.random().toString(36).substring(2, 11),
                        name: meta?.name || file.name.replace(/\.[^/.]+$/, ""),
                        artist: meta?.artist || "Unknown Artist",
                        album: meta?.album || "Unknown Album",
                        cover: meta?.cover,
                        url: data.tracks[0].url,
                        duration: meta?.duration,
                        lyrics: meta?.lyrics
                    });
                }
            } catch (e) {
                console.error("Upload failed for", file.name, e);
            }
            setProgress(prev => ({ ...prev, current: prev.current + 1 }));
        };

        for (let i = 0; i < audioFiles.length; i += CONCURRENCY_UPLOAD) {
            const batch = audioFiles.slice(i, i + CONCURRENCY_UPLOAD);
            await Promise.all(batch.map(f => uploadFile(f)));
        }

        onTracksLoaded(loadedTracks);
        setLoading(false);
    };

    return (
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <input
                type="file"
                ref={folderInputRef}
                onChange={handleUpload}
                style={{ display: "none" }}
                multiple
                // @ts-ignore
                webkitdirectory=""
                directory=""
            />
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleUpload}
                style={{ display: "none" }}
                multiple
                accept="audio/*"
            />

            {loading ? (
                <div
                    className="glass-card"
                    style={{
                        width: "100%",
                        padding: "2rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "1.5rem",
                        alignItems: "center",
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.08)"
                    }}
                >
                    <div style={{ position: "relative" }}>
                        <motion.div
                            animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.3, 0.6, 0.3]
                            }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            style={{
                                position: "absolute",
                                inset: -20,
                                background: "radial-gradient(circle, hsla(var(--primary), 0.2) 0%, transparent 70%)",
                                borderRadius: "50%"
                            }}
                        />
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        >
                            <Loader2 size={40} color="hsl(var(--primary))" />
                        </motion.div>
                    </div>

                    <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                            <span style={{ fontWeight: 700, fontSize: "1.1rem", letterSpacing: "0.05em" }}>
                                {loadingPhase === "analyzing" ? "ANALYZING TRACKS" : "UPLOADING TO SERVER"}
                            </span>
                            <div style={{ display: "flex", gap: "3px" }}>
                                {[0, 1, 2].map(i => (
                                    <motion.div
                                        key={i}
                                        animate={{ opacity: [0, 1, 0] }}
                                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                                        style={{ width: "4px", height: "4px", borderRadius: "50%", background: "hsl(var(--primary))" }}
                                    />
                                ))}
                            </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                            <span style={{ color: "hsl(var(--muted-foreground))", fontSize: "0.9rem", fontWeight: 600 }}>
                                {progress.current} of {progress.total}
                            </span>
                            <span style={{ color: "hsl(var(--muted-foreground))", fontSize: "0.75rem", opacity: 0.8, maxWidth: "300px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {currentFile}
                            </span>
                        </div>
                    </div>

                    <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.05)", borderRadius: "10px", overflow: "hidden", position: "relative" }}>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(progress.current / progress.total) * 100}%` }}
                            style={{
                                height: "100%",
                                background: "hsl(var(--primary))",
                                boxShadow: "0 0 15px hsla(var(--primary), 0.5)"
                            }}
                        />
                    </div>
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <button
                        onClick={() => folderInputRef.current?.click()}
                        className="btn btn-primary"
                        style={{ height: "4rem" }}
                    >
                        <Upload size={20} />
                        <span>Select Folder</span>
                    </button>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="btn btn-secondary"
                        style={{ height: "4rem" }}
                    >
                        <FileMusic size={20} />
                        <span>Select Files</span>
                    </button>
                </div>
            )}
        </div>
    );
}
