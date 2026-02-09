# 🎵 Autify Music Protocol

[![Version](https://img.shields.io/badge/version-1.0.0-purple.svg?style=for-the-badge)](https://github.com/)
[![Aesthetics](https://img.shields.io/badge/design-premium-gold.svg?style=for-the-badge)](https://github.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg?style=for-the-badge)](https://github.com/)

**Autify** is a high-fidelity, social music streaming protocol designed for seamless listening experiences across multiple devices. By processing audio locally and synchronizing state via WebSockets, Autify delivers bit-perfect musical freedom without the lag or compression artifacts of traditional cloud services.

---

## ✨ Key Features

- **🚀 Lossless Architecture**: Bit-perfect local playback preserving the full nuance of high-resolution audio files.
- **📱 Real-time Synchronization**: Built-in presence layer using Socket.io to see who's listening and what they're vibing to.
- **📜 LRC-Sync Engine**: Precision timestamp parsing for synchronized lyrics that move perfectly with the rhythm.
- **🎨 Premium UI/UX**: A state-of-the-art interface built with Framer Motion, featuring glassmorphism and smooth micro-animations.
- **🔗 QR Session Joining**: Instant room access via generated QR codes for guests on the same network.

---

## 🛠️ Local Server Setup

Setting up your own Autify node is designed to be effortless.

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0 or higher)
- [npm](https://www.npmjs.com/) or [yarn]

### 1. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/yourusername/autify.git
cd autify
npm install
```

### Running Methods

Choose your preferred way to launch the Autify protocol:

- [⚡ Fast Launch (Recommended)](#-fast-launch-recommended)
- [🛠️ Custom / Manual Launch](#%EF%B8%8F-custom--manual-launch)

#### ⚡ Fast Launch (Recommended)

Our automated scripts handle environment preparation, port cleanup (killing old instances on 3000), and real-time IP detection.

- **Windows**: Double-click [`start.bat`](./start.bat) 
- **Unix/Terminal**: Run [`./start.sh`](./start.sh) 

#### 🛠️ Custom / Manual Launch

For developers who want full control over the process or need to run specific build flags.

1. **Development Mode**:
   ```bash
   npm run dev
   ```
2. **Production Build**:
   ```bash
   npm run build
   npm run start
   ```
3. **Linting**:
   ```bash
   npm run lint
   ```

### 3. Accessing Autify
Once the script starts, it will provide two URLs:
- **Local Access**: `http://localhost:3000` (For the host computer)
- **Network Access**: `http://192.168.x.x:3000` (For other devices on your Wi-Fi)

---

## 🎧 Usage Guide

1. **Host a Session**: Click "Host Session" on the landing page and upload your local music folder or individual tracks.
2. **Share the Vibe**: Open the Room Info (QR icon) to see your 6-digit session code or QR code.
3. **Join as Guest**: On a different device (phone/tablet), enter the network IP provided by the server and input the session code.
4. **Synced Listening**: Everyone in the room will see what's playing in real-time, allowing for a shared musical experience.

---

## 🏗️ Technology Stack

- **Framework**: Next.js 15+ (App Router)
- **Styling**: Vanilla CSS with Design Tokens & Glassmorphism
- **Animations**: Framer Motion
- **Real-time**: Socket.io
- **Icons**: Lucide React & Google Material Symbols

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

*Crafted with 💜 by [Agnel](https://agneldev.netlify.app/)*
