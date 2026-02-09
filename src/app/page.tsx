"use client";

import { useState, useEffect } from "react";
import { Music, Plus, Users, ArrowRight, Play, Loader2, QrCode, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import FolderUpload, { Track } from "@/components/FolderUpload";
import MusicPlayer from "@/components/MusicPlayer";
import { useSync } from "@/hooks/useSync";
import { QRCodeSVG } from "qrcode.react";

export default function Home() {
  const [view, setView] = useState<"landing" | "host-setup" | "guest-setup" | "active" | "about">("landing");
  const [isHost, setIsHost] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [tracks, setTracks] = useState<Track[]>([]);
  const [joinCode, setJoinCode] = useState("");
  const [showRoomInfo, setShowRoomInfo] = useState(false);
  const [username, setUsername] = useState("");
  const [showNameModal, setShowNameModal] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [view]);

  useEffect(() => {
    const saved = localStorage.getItem("autify_name");
    if (saved) {
      setUsername(saved);
    } else {
      setShowNameModal(true);
    }
  }, []);

  const saveName = (name: string) => {
    localStorage.setItem("autify_name", name);
    setUsername(name);
    setShowNameModal(false);
  };

  const { tracks: syncTracks, reportActivity, usersActivity, isConnected, isDisbanded, disband } = useSync(roomCode, isHost, isHost ? tracks : undefined);

  const resetState = () => {
    setView("landing");
    setRoomCode("");
    setJoinCode("");
    setIsHost(false);
    setTracks([]);
  };

  const startHosting = (loadedTracks: Track[]) => {
    setTracks(loadedTracks);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setRoomCode(code);
    setIsHost(true);
    setView("active");
    setShowRoomInfo(true);
  };

  const joinSession = () => {
    if (joinCode.length === 6) {
      setRoomCode(joinCode);
      setIsHost(false);
      setView("active");
    }
  };

  const handleDisband = () => {
    disband();
    resetState();
  };

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0", background: "hsl(var(--background))", overflow: "hidden" }}>
      <AnimatePresence>
        {isDisbanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", backdropFilter: "blur(20px)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="glass-card"
              style={{ padding: "3rem", width: "100%", maxWidth: "450px", display: "flex", flexDirection: "column", gap: "1.5rem", textAlign: "center", alignItems: "center" }}
            >
              <div style={{ padding: "1.5rem", borderRadius: "50%", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", marginBottom: "0.5rem" }}>
                <Users size={48} />
              </div>
              <h2 style={{ fontSize: "2rem", fontWeight: 800 }}>Session Closed</h2>
              <p style={{ color: "hsl(var(--muted-foreground))", fontSize: "1.1rem", lineHeight: 1.5 }}>
                The host has disbanded the session or left the room. You'll be returned to the home screen.
              </p>
              <button
                className="btn btn-primary"
                onClick={resetState}
                style={{ width: "100%", height: "4rem", marginTop: "1rem" }}
              >
                BACK TO HOME
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showNameModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", backdropFilter: "blur(20px)", zIndex: 5000, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="glass-card"
              style={{ padding: "2.5rem", width: "100%", maxWidth: "400px", display: "flex", flexDirection: "column", gap: "1.5rem" }}
            >
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Who's Vibing?</h2>
              <p style={{ color: "hsl(var(--muted-foreground))" }}>Enter your name to see others and let them see you.</p>
              <input
                type="text"
                placeholder="Enter your name..."
                className="glass"
                maxLength={20}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.target as HTMLInputElement).value.trim()) {
                    saveName((e.target as HTMLInputElement).value.trim());
                  }
                }}
                autoFocus
                style={{ width: "100%", padding: "1rem", outline: "none", color: "white" }}
              />
              <button
                className="btn btn-primary"
                onClick={(e) => {
                  const input = (e.currentTarget.previousSibling as HTMLInputElement).value.trim();
                  if (input) saveName(input);
                }}
              >
                LET'S GO
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {view === "landing" && (
          <motion.div
            key="landing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{ maxWidth: "800px", width: "100%", textAlign: "center", display: "flex", flexDirection: "column", gap: "3rem", padding: "2rem" }}
          >
            <header style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <motion.div
                initial={{ rotate: -10, scale: 0.8 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", damping: 10 }}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem", marginBottom: "0.5rem" }}
              >
                <div className="glass" style={{ padding: "1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Music size={40} color="hsl(var(--primary))" />
                </div>
                <h1 style={{ fontSize: "4rem", fontWeight: 800, letterSpacing: "-0.04em" }} className="text-gradient">Autify</h1>
              </motion.div>
              <p style={{ fontSize: "1.25rem", color: "hsl(var(--muted-foreground))", lineHeight: 1.6, maxWidth: "600px", margin: "0 auto" }}>
                High-fidelity musical freedom for every device.
              </p>
            </header>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem" }}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setView("host-setup")}
                className="glass-card"
                style={{ padding: "3.5rem 2.5rem", textAlign: "left", display: "flex", flexDirection: "column", gap: "1.5rem", cursor: "pointer", border: "none", color: "inherit" }}
              >
                <div style={{ padding: "1rem", borderRadius: "16px", background: "hsla(var(--primary), 0.1)", width: "fit-content" }}>
                  <Plus size={32} color="hsl(var(--primary))" />
                </div>
                <div>
                  <h3 style={{ fontSize: "1.75rem", marginBottom: "0.5rem", fontWeight: 700 }}>Host Session</h3>
                  <p style={{ color: "hsl(var(--muted-foreground))", lineHeight: 1.5 }}>Host a local server and invite friends to listen along independently.</p>
                </div>
                <ArrowRight style={{ marginTop: "auto", alignSelf: "flex-end", opacity: 0.5 }} size={24} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setView("guest-setup")}
                className="glass-card"
                style={{ padding: "3.5rem 2.5rem", textAlign: "left", display: "flex", flexDirection: "column", gap: "1.5rem", cursor: "pointer", border: "none", color: "inherit" }}
              >
                <div style={{ padding: "1rem", borderRadius: "16px", background: "rgba(255, 255, 255, 0.05)", width: "fit-content" }}>
                  <Users size={32} />
                </div>
                <div>
                  <h3 style={{ fontSize: "1.75rem", marginBottom: "0.5rem", fontWeight: 700 }}>Join Session</h3>
                  <p style={{ color: "hsl(var(--muted-foreground))", lineHeight: 1.5 }}>Join a room by entering a code and experience the vibe together.</p>
                </div>
                <ArrowRight style={{ marginTop: "auto", alignSelf: "flex-end", opacity: 0.5 }} size={24} />
              </motion.button>
            </div>

            <footer style={{ marginTop: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem", alignItems: "center" }}>
              <button
                onClick={() => setView("about")}
                style={{ background: "none", border: "none", color: "hsl(var(--muted-foreground))", fontSize: "0.9rem", fontWeight: 700, cursor: "pointer", textDecoration: "none", letterSpacing: "0.05em", opacity: 0.6 }}
              >
                LEARN MORE ABOUT AUTIFY
              </button>

              <div style={{ fontSize: "0.9rem", color: "hsl(var(--muted-foreground))", display: "flex", alignItems: "center", gap: "0.5rem", opacity: 0.8 }}>
                <span>A project made by</span>
                <a
                  href="https://agneldev.netlify.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "white", fontWeight: 700, textDecoration: "none", paddingBottom: "2px", borderBottom: "2px solid hsl(var(--primary))" }}
                >
                  Agnel
                </a>
              </div>
            </footer>
          </motion.div>
        )}

        {view === "about" && (
          <motion.div
            key="about"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              width: "100%",
              maxWidth: "900px",
              display: "flex",
              flexDirection: "column",
              gap: "4rem",
              padding: "4rem 2rem",
              minHeight: "100vh"
            }}
          >
            {/* Header Section */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
            >
              <button
                onClick={() => setView("landing")}
                style={{
                  background: "hsla(var(--primary), 0.1)",
                  border: "1px solid hsla(var(--primary), 0.2)",
                  color: "hsl(var(--primary))",
                  cursor: "pointer",
                  width: "fit-content",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  letterSpacing: "0.1em",
                  padding: "0.5rem 1rem",
                  borderRadius: "100px",
                  marginBottom: "1rem"
                }}
              >
                ← BACK TO HOME
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
                <div className="glass" style={{ padding: "1.5rem", borderRadius: "32px", background: "linear-gradient(135deg, hsla(var(--primary), 0.2) 0%, transparent 100%)" }}>
                  <Music size={48} color="hsl(var(--primary))" />
                </div>
                <div>
                  <h1 style={{ fontSize: "clamp(2.5rem, 8vw, 4.5rem)", fontWeight: 900, letterSpacing: "-0.05em", lineHeight: 0.9 }}>About <span className="text-gradient">Autify.</span></h1>
                  <p style={{ color: "hsl(var(--muted-foreground))", fontSize: "1.25rem", marginTop: "0.5rem", fontWeight: 500 }}>The story behind the ultimate listening experience.</p>
                </div>
              </div>
            </motion.div>

            {/* Core Philosophy Section */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="glass-card"
              style={{ padding: "3.5rem", borderRadius: "40px", display: "flex", flexDirection: "column", gap: "2rem", border: "1px solid rgba(255,255,255,0.05)" }}
            >
              <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "white" }}>Designed to Connect.</h2>
              <p style={{ color: "hsl(var(--muted-foreground))", fontSize: "1.2rem", lineHeight: 1.7 }}>
                <strong style={{ color: "white" }}>Autify</strong> was created by <a href="https://agneldev.netlify.app/" target="_blank" rel="noopener noreferrer" style={{ color: "hsl(var(--primary))", textDecoration: "none", borderBottom: "1px solid" }}>Agnel</a> as a high-fidelity solution for social music. It’s built on the belief that music quality shouldn't be sacrificed for social features.
              </p>
              <p style={{ color: "hsl(var(--muted-foreground))", fontSize: "1.2rem", lineHeight: 1.7 }}>
                By processing audio locally on your device, we bypass cloud compression and latency, delivering the purest possible signal while keeping you synchronized with friends near and far.
              </p>
            </motion.div>

            {/* Features Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "2rem" }}>
              {[
                {
                  title: "Lossless Architecture",
                  desc: "Bit-perfect local playback that preserves every nuance of your high-resolution files. No re-sampling, no artifacts.",
                  icon: <Play size={24} />,
                  delay: 0.3
                },
                {
                  title: "LRC-Sync Engine",
                  desc: "Precision timestamp parsing for synchronized lyrics that move exactly with the rhythm of your music.",
                  icon: <Music size={24} />,
                  delay: 0.4
                },
                {
                  title: "Presence Layer",
                  desc: "See who's listening and what they're feeling in real-time. Built-in activity heartbeats keep the room alive.",
                  icon: <Users size={24} />,
                  delay: 0.5
                }
              ].map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: f.delay }}
                  className="glass"
                  style={{
                    padding: "2.5rem",
                    borderRadius: "32px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1.5rem",
                    border: "1px solid rgba(255,255,255,0.03)",
                    background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 100%)"
                  }}
                >
                  <div style={{ width: "56px", height: "56px", borderRadius: "18px", background: "hsla(var(--primary), 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "hsl(var(--primary))" }}>
                    {f.icon}
                  </div>
                  <div>
                    <h3 style={{ fontSize: "1.5rem", color: "white", fontWeight: 800, marginBottom: "0.75rem" }}>{f.title}</h3>
                    <p style={{ color: "hsl(var(--muted-foreground))", lineHeight: 1.6, fontSize: "1.05rem" }}>{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Tech Footer */}
            <motion.footer
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              style={{
                borderTop: "1px solid rgba(255,255,255,0.1)",
                paddingTop: "3rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "2rem",
                paddingBottom: "4rem"
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <p style={{ color: "white", fontWeight: 800, fontSize: "1.1rem" }}>Autify v1.0.0</p>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.95rem", color: "hsl(var(--muted-foreground))" }}>
                  <span>Crafted by</span>
                  <a href="https://agneldev.netlify.app/" target="_blank" rel="noopener noreferrer" style={{ color: "white", fontWeight: 800, textDecoration: "none", borderBottom: "2px solid hsl(var(--primary))" }}>Agnel</a>
                </div>
              </div>

              <div style={{ textAlign: "right", color: "hsl(var(--muted-foreground))", fontSize: "0.9rem" }}>
                <p>© 2026 Autify Music Protocol</p>
                <p style={{ opacity: 0.5 }}>All rights to vibes reserved.</p>
              </div>
            </motion.footer>
          </motion.div>
        )}

        {view === "host-setup" && (
          <motion.div
            key="host-setup"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="glass-card"
            style={{ padding: "2.5rem", width: "90%", maxWidth: "550px", display: "flex", flexDirection: "column", gap: "2rem" }}
          >
            <button onClick={() => setView("landing")} style={{ background: "none", border: "none", color: "hsl(var(--muted-foreground))", cursor: "pointer", width: "fit-content", fontWeight: 600 }}>
              ← BACK TO HOME
            </button>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <h2 style={{ fontSize: "2rem", fontWeight: 800 }}>Start Hosting</h2>
              <p style={{ color: "hsl(var(--muted-foreground))", lineHeight: 1.5 }}>Choose files or folders with your music.</p>
            </div>

            <FolderUpload onTracksLoaded={startHosting} />
          </motion.div>
        )}

        {view === "guest-setup" && (
          <motion.div
            key="guest-setup"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="glass-card"
            style={{ padding: "2.5rem", width: "90%", maxWidth: "550px", display: "flex", flexDirection: "column", gap: "2rem" }}
          >
            <button onClick={() => setView("landing")} style={{ background: "none", border: "none", color: "hsl(var(--muted-foreground))", cursor: "pointer", width: "fit-content", fontWeight: 600 }}>
              ← BACK TO HOME
            </button>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <h2 style={{ fontSize: "2rem", fontWeight: 800 }}>Join Session</h2>
              <p style={{ color: "hsl(var(--muted-foreground))" }}>Enter the 6-digit code.</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <input
                type="text"
                maxLength={6}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="000000"
                className="glass"
                style={{ width: "100%", padding: "1.25rem", border: "1px solid rgba(255,255,255,0.1)", textAlign: "center", outline: "none", color: "white", fontSize: "2.5rem", fontWeight: 800, letterSpacing: "0.3em" }}
              />
              <button
                onClick={joinSession}
                disabled={joinCode.length < 6}
                className="btn btn-primary"
                style={{ width: "100%", height: "4rem", fontSize: "1.1rem", opacity: joinCode.length === 6 ? 1 : 0.5 }}
              >
                <Play size={20} fill="currentColor" />
                JOIN NOW
              </button>
            </div>
          </motion.div>
        )}

        {view === "active" && (
          <motion.div
            key="active"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ width: "100%", height: "100vh", position: "relative" }}
          >
            <MusicPlayer
              tracks={isHost ? tracks : syncTracks}
              isHost={isHost}
              username={username}
              reportActivity={reportActivity}
              usersActivity={usersActivity}
            />

            {/* Modal Room Info for Host */}
            {isHost && (
              <>
                <div style={{ position: "absolute", top: "1.25rem", left: "1.25rem", zIndex: 100 }}>
                  <button
                    onClick={() => setShowRoomInfo(true)}
                    className="glass"
                    style={{ width: "auto", padding: "0.6rem 1rem", display: "flex", alignItems: "center", gap: "0.75rem", border: "none", color: "white", fontWeight: 700, fontSize: "0.85rem" }}
                  >
                    <QrCode size={18} />
                    <span>Room: {roomCode}</span>
                  </button>
                </div>

                <AnimatePresence>
                  {showRoomInfo && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,0.8)",
                        backdropFilter: "blur(20px)",
                        zIndex: 2000,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "2rem"
                      }}
                      onClick={() => setShowRoomInfo(false)}
                    >
                      <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        className="glass-card"
                        style={{ padding: "2.5rem", width: "100%", maxWidth: "400px", display: "flex", flexDirection: "column", gap: "2rem", alignItems: "center", position: "relative" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => setShowRoomInfo(false)}
                          style={{ position: "absolute", top: "1rem", right: "1.25rem", background: "none", border: "none", color: "white", opacity: 0.5, cursor: "pointer" }}
                        >
                          <X size={24} />
                        </button>

                        <div style={{ textAlign: "center" }}>
                          <p style={{ fontSize: "0.75rem", fontWeight: 800, color: "hsl(var(--muted-foreground))", letterSpacing: "0.15em", marginBottom: "0.5rem" }}>SESSION CODE</p>
                          <h3 style={{ fontSize: "3rem", fontWeight: 800, letterSpacing: "0.1em" }} className="text-gradient">{roomCode}</h3>
                        </div>

                        <div style={{ background: "white", padding: "1rem", borderRadius: "1.5rem", boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}>
                          <QRCodeSVG value={`${window.location.origin}?join=${roomCode}`} size={180} />
                        </div>

                        <p style={{ color: "hsl(var(--muted-foreground))", textAlign: "center", fontSize: "0.9rem", lineHeight: 1.5 }}>
                          Friends can scan this QR code or enter the code manualy to join your session.
                        </p>

                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", padding: "0.75rem 1.25rem", borderRadius: "1rem", background: isConnected ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)" }}>
                            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: isConnected ? "#10b981" : "#ef4444" }}></div>
                            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: isConnected ? "#10b981" : "#ef4444" }}>
                              {isConnected ? "Host Server Active" : "Host Disconnected"}
                            </span>
                          </div>

                          <button
                            onClick={handleDisband}
                            className="glass"
                            style={{ width: "100%", padding: "1rem", borderRadius: "1rem", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#ef4444", fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}
                            onMouseOver={(e) => e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)"}
                            onMouseOut={(e) => e.currentTarget.style.background = "none"}
                          >
                            DISBAND SESSION
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}

            {!isHost && (
              <div style={{ position: "absolute", top: "1.25rem", right: "1.25rem", zIndex: 100 }} className="glass">
                <div style={{ padding: "0.5rem 0.85rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Users size={14} />
                  <span style={{ fontWeight: 700, fontSize: "0.75rem" }}>Synced</span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
