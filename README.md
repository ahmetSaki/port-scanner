<div align="center">

# 🔍 Node.js Concurrent TCP & UDP Port Scanner

![Node.js Version](https://img.shields.io/badge/Node.js-%3E%3D14.0.0-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)
![Dependencies](https://img.shields.io/badge/Dependencies-Zero-success?style=for-the-badge)
![Protocols](https://img.shields.io/badge/Protocols-TCP%20%7C%20UDP-orange?style=for-the-badge)

A fast, lightweight, and zero-dependency network security CLI tool written purely in Node.js.  
Scans TCP & UDP ports concurrently, captures service response banners, and generates structured JSON reports.

</div>

---

## 🚀 Key Features

* **Dual-Protocol Scanning:** Simultaneous asynchronous probing for both TCP (`net`) and UDP (`dgram`) sockets.
* **Banner Grabbing:** Automatic service header identification for protocol inspection (HTTP HEAD requests, SSH/FTP banners).
* **Zero Third-Party Dependencies:** Built 100% on native Node.js core APIs for maximum performance and security.
* **Race-Condition Safety:** Implements an internal `isHandled` state-flag pattern to prevent event listeners collision and socket memory leaks.
* **Smart Completion Tracking:** Synchronizes async I/O routines with a task counter before flushing JSON reports.
* **CLI Flexibility:** Pass target hosts dynamically via terminal arguments.

---

## 📐 Architecture & Logic Flow

The scanner executes low-level network calls using an event-driven non-blocking pipeline:

```text
               ┌─────────────────────────────────────┐
               │         CLI Input (Host/IP)         │
               └──────────────────┬──────────────────┘
                                  │
                  ┌───────────────┴───────────────┐
                  ▼                               ▼
       ┌──────────────────┐            ┌──────────────────┐
       │   TCP Scanner    │            │   UDP Scanner    │
       │   (net.Socket)   │            │  (dgram.Socket)  │
       └──────────┬───────┘            └──────────┬───────┘
                  │                               │
                  ▼                               ▼
     [Banner / Timeout / Refused]     [Response / Timeout / Error]
                  │                               │
                  └───────────────┬───────────────┘
                                  ▼
                     ┌─────────────────────────┐
                     │   isHandled Protection  │
                     └────────────┬────────────┘
                                  ▼
                     ┌─────────────────────────┐
                     │ Task Completion Counter │
                     └────────────┬────────────┘
                                  ▼
                     ┌─────────────────────────┐
                     │ console.table & JSON    │
                     └────────────┬────────────┘


Installation
Clone the repository to your local directory: 

 ```bash
git clone https://github.com/ahmetSaki/port-scanner.git
cd port-scanner
```

Usage
1. Run against localhost (Default: 127.0.0.1):

```bash
node port.js
```

2. Run against a specific IP in your local network:

```bash
node port.js 192.168.1.1
```
