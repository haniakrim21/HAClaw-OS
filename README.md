<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0ea5e9&height=220&section=header&text=HAClaw-OS&fontSize=70&fontColor=ffffff&desc=Visual%20Management%20Platform%20for%20OpenClaw&descSize=20&descColor=ffffff" width="100%" />

<br/>

**Complexity within, simplicity without.**<br>
**繁于内，简于形。**

<br/>

[![Release](https://img.shields.io/github/v/release/haniakrim21/HAClaw-OS?style=for-the-badge&logo=rocket&color=0ea5e9)](https://github.com/haniakrim21/HAClaw-OS/releases)
[![Build](https://img.shields.io/badge/Build-Passing-success?style=for-the-badge&logo=github-actions)](https://github.com/haniakrim21/HAClaw-OS/actions)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue?style=for-the-badge&logo=docker)](https://github.com/haniakrim21/HAClaw-OS)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

English | [简体中文](README.zh-CN.md)

</div>

<br/>

> **HAClaw-OS** is an open-source web visual management platform built for [OpenClaw](https://github.com/openclaw/openclaw). It is designed to lower the barrier to entry, making installation, configuration, monitoring, and optimization simpler and more efficient, while providing a more accessible onboarding experience for users worldwide, especially beginners.

---

## ⚡ Highlights & Features

<table>
  <tr>
    <td width="50%" valign="top">
      <h3>💎 macOS-Grade UI</h3>
      <p>Faithfully recreates the macOS design language with refined glassmorphism, rounded cards, and smooth animation transitions. Managing AI agents feels as natural as using a native desktop app.</p>
    </td>
    <td width="50%" valign="top">
      <h3>🎯 Zero-Friction Setup</h3>
      <p>Guided wizards and pre-built templates let you complete OpenClaw's initial configuration and model setup without touching a single JSON file or terminal command.</p>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <h3>⚙️ Deep Config Editor</h3>
      <p>Fine-tune every OpenClaw parameter — model switching, memory management, plugin loading, channel routing — all through a beautiful visual editor.</p>
    </td>
    <td width="50%" valign="top">
      <h3>📊 Real-Time Observability</h3>
      <p>Built-in monitoring dashboard with live execution status, resource consumption, and task history providing full visibility into every agent's behavior.</p>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <h3>🌐 Native Cross-Platform</h3>
      <p>Single binary, zero dependencies. Runs natively on Windows, macOS (Intel & Apple Silicon), and Linux (amd64 & arm64). Just download and run.</p>
    </td>
    <td width="50%" valign="top">
      <h3>🔌 Gateway Control</h3>
      <p>Manage both local and remote OpenClaw gateways seamlessly. Switch between gateway profiles with one click — perfect for dev, staging, and production multi-environments.</p>
    </td>
  </tr>
</table>

<br/>

## 📸 Interface Preview

<div align="center">
  <img src="assets/screenshots/dashboard.png" style="border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.15);" width="800" alt="Dashboard Overview" />
  <p><i>Dashboard Overview</i></p>
</div>
<br/>
<div align="center">
  <img src="assets/screenshots/scenarios.png" style="border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.15);" width="395" alt="Scenario Templates" />
  &nbsp;
  <img src="assets/screenshots/config.png" style="border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.15);" width="395" alt="Configuration Center" />
  <p><i>Scenario Templates & Configuration Editor</i></p>
</div>

---

## 🚀 Quick Start

> [!CAUTION]
> **Beta Preview** — This is an early preview release. It has not undergone comprehensive testing. **Do not use in production environments.**

### 1️⃣ One-Click Install (Recommended)

The unified installer detects existing installations and lets you **install, update, manage, or uninstall** both Binary and Docker deployments from a single adaptive menu.

**macOS / Linux**
```bash
curl -fsSL https://raw.githubusercontent.com/haniakrim21/HAClaw-OS/main/install.sh | bash
```

**Windows (PowerShell)**
```powershell
irm https://raw.githubusercontent.com/haniakrim21/HAClaw-OS/main/install.ps1 | iex
```

### 2️⃣ Docker Compose

HAClaw-OS and OpenClaw run in the same container. OpenClaw is **preinstalled** in the official Docker image.

```bash
curl -fsSL https://raw.githubusercontent.com/haniakrim21/HAClaw-OS/main/docker-compose.yml -o docker-compose.yml
docker compose up -d
```
*Open your browser at `http://localhost:18700` (Docker) or `http://localhost:18788` (Native).*

<details>
<summary><b>🛠️ View Advanced Manual Installation Steps</b></summary>
<br>

Download from [Releases](https://github.com/haniakrim21/HAClaw-OS/releases). Single file, no dependencies. Just run.

```bash
# Run with default settings (localhost:18788)
./HAClaw-OS

# Specify port and bind address
./HAClaw-OS --port 18788 --bind 0.0.0.0

# Create initial admin user on first run
./HAClaw-OS --user admin --pass your_password
```

| Command | Usage | Description |
| :--- | :--- | :--- |
| `reset-password` | `HAClaw-OS reset-password <user> <pass>` | Reset a user's password |
| `reset-username` | `HAClaw-OS reset-username <old> <new>` | Change a user's username |
| `list-users` | `HAClaw-OS list-users` | List all registered users |
| `unlock` | `HAClaw-OS unlock <user>` | Unlock a locked user account |

</details>

---

## 🔋 Tech Stack Ecosystem

<div align="center">

![Go](https://img.shields.io/badge/go-%2300ADD8.svg?style=for-the-badge&logo=go&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![SQLite](https://img.shields.io/badge/sqlite-%2307405e.svg?style=for-the-badge&logo=sqlite&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)

</div>

<br/>

## 🤝 Contributing & Support

This project is open-source and licensed under the [MIT License](LICENSE) — free to use, modify, and distribute for both personal and commercial purposes!

If you run into any issues or have ideas for improvement, feel free to open an [Issue](https://github.com/haniakrim21/HAClaw-OS/issues) or submit a [Pull Request](https://github.com/haniakrim21/HAClaw-OS/pulls). Every piece of feedback helps this project grow.

---

<div align="center">
  [![Star History Chart](https://api.star-history.com/svg?repos=haniakrim21/HAClaw-OS&type=Date)](https://star-history.com/#haniakrim21/HAClaw-OS&Date)
  <br><br>
  <b>Created By <a href="https://github.com/haniakrim21">Dr.Hani Akrim</a></b> &bull; Powered by OpenClaw<br>
  <sub><i>An AI predicted this project would go viral. But as we all know, AIs do hallucinate sometimes 😅</i></sub>
</div>
