<h1 align="center">
  🦞 HAClaw-OS
</h1>

<p align="center">
  <strong>Complexity within, simplicity without.</strong>
</p>

<p align="center">
  <a href="https://github.com/haniakrim21/HAClaw-OS/releases"><img src="https://img.shields.io/github/v/release/haniakrim21/HAClaw-OS?label=Release&color=black&style=for-the-badge" alt="Release"></a>
  <a href="https://github.com/haniakrim21/HAClaw-OS/actions"><img src="https://img.shields.io/badge/Build-Passing-black?style=for-the-badge&logo=github-actions" alt="Build Status"></a>
  <a href="https://github.com/haniakrim21/HAClaw-OS"><img src="https://img.shields.io/badge/Docker-Ready-black?style=for-the-badge&logo=docker" alt="Docker"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/haniakrim21/HAClaw-OS?label=License&color=black&style=for-the-badge" alt="License"></a>
</p>

<p align="center">
  An open-source web visual management platform built specifically for <b>OpenClaw</b>.<br> Lower the barrier to entry with simplified installation, deep configuration, live monitoring, and an accessible onboarding experience designed for both beginners and experts.
</p>

<br>

<div align="center">
  <img src="assets/screenshots/dashboard.png" alt="HAClaw-OS Dashboard Overview" width="800" style="border-radius: 8px;">
</div>

<br>

## ✦ Why HAClaw-OS?

*   **macOS-Grade Visuals**: Faithfully recreates the macOS design language. Managing AI agents feels as natural, fluid, and refined as using a native desktop application.
*   **Zero-Command Setup**: Guided wizards and pre-built templates enable complete OpenClaw initialization without ever touching your terminal or editing JSON files.
*   **Deep Configuration**: Fine-tune every parameter visualy—model constraints, memory limits, plugin orchestration, and channel routing.
*   **Live Observability**: A comprehensive monitoring dashboard provides real-time execution metrics, resource consumption, and task history across all agents.
*   **Gateway Agnostic**: Seamlessly manage local environments or dial into remote OpenClaw gateways. Effortlessly pivot between staging, dev, and production networks.

<br>

---

## ✦ Quick Start

> **Beta Notice** — This is an early preview release. It has not undergone comprehensive stability testing.

### 1. One-Click Install (Recommended)

Our unified environment installer detects your system and handles downloads, ports, and credentials for both Binary natively and Docker targets.

**macOS / Linux**
```bash
curl -fsSL https://raw.githubusercontent.com/haniakrim21/HAClaw-OS/main/install.sh | bash
```

**Windows (PowerShell)**
```powershell
irm https://raw.githubusercontent.com/haniakrim21/HAClaw-OS/main/install.ps1 | iex
```

<br>

### 2. Docker Compose (Manual)

HAClaw-OS and OpenClaw run seamlessly in the same container architecture.

```bash
curl -fsSL https://raw.githubusercontent.com/haniakrim21/HAClaw-OS/main/docker-compose.yml -o docker-compose.yml
docker compose up -d
```
*Access the interface at `http://localhost:18700` (via Docker) or `http://localhost:18788` (Native Binary).*

<details>
<summary><b>View CLI Commands & Advanced Usage</b></summary>

<br>

Download directly from [Releases](https://github.com/haniakrim21/HAClaw-OS/releases). Single pre-compiled binaries, no dependencies. 

```bash
# Run with default settings
./HAClaw-OS

# Specify port and bind address
./HAClaw-OS --port 18788 --bind 0.0.0.0

# Create initial admin user on first run
./HAClaw-OS --user admin --pass your_password
```

**CLI Account Management**

| Command | Usage | Description |
| :--- | :--- | :--- |
| `reset-password` | `HAClaw-OS reset-password <user> <pass>` | Force reset user password |
| `unlock` | `HAClaw-OS unlock <user>` | Clear lockout timers on a user |

</details>

<br>

---

## ✦ Interface Gallery

<div align="center">
  <img src="assets/screenshots/scenarios.png" width="49%" alt="Scenario Templates">
  <img src="assets/screenshots/config.png" width="49%" alt="Configuration Editor">
</div>

<br>

---

## ✦ Tech Stack

Built utilizing a robust, zero-dependency philosophy.

*   **Backend**: [Go](https://go.dev)
*   **Frontend**: [React](https://react.dev) + [TailwindCSS](https://tailwindcss.com) + [Vite](https://vitejs.dev)
*   **Datastore**: [SQLite](https://sqlite.org)
*   **Communication**: WebSocket & SSE streams

<br>

---

## ✦ Contributing & License

This project is fully open-source and licensed under the **[MIT License](LICENSE)**. 
We welcome ideas, bug reports, and pull requests to help shape the feature-set of HAClaw-OS visual tools. See our [Issue Tracker](https://github.com/haniakrim21/HAClaw-OS/issues) to join the conversation.

<p align="center">
  <br>
  <i>Created By <a href="https://github.com/haniakrim21">Dr.Hani Akrim</a></i><br>
  <a href="https://star-history.com/#haniakrim21/HAClaw-OS&Date"><img src="https://api.star-history.com/svg?repos=haniakrim21/HAClaw-OS&type=Date" width="450"></a>
</p>
