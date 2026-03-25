## What's Changed

### 🐛 Bug Fixes / 修复

- derive cookie name from request Host header for Docker port mapping
- restart with overlay binary after runtime update
- read tokens from multi-account config path in test-channel
- port-specific cookie name to prevent cross-instance collision
- enhance config load diagnostics for JWT secret persistence tracking
- add diagnostic logging for 401 auth failures in middleware
- use correct param name 'key' for sessions.messages RPC
- persist JWT secret across Docker restarts and add diagnostic logging

### 🎨 UI & Styling / 界面优化

- fix model dropdown dark mode contrast

### 🔧 Maintenance / 维护

- bump openclawCompat to >=2026.3.23

---
**Full Changelog**: [v0.0.26...v0.0.27](https://github.com/HAClaw/HAClaw/compare/v0.0.26...v0.0.27)


