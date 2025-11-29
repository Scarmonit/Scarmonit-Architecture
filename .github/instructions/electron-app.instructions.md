---
applyTo: "desktop-app/**/*.{js,ts,tsx}"
---

# Electron Application Instructions

## Security First
- Enable `contextIsolation: true`
- Use `nodeIntegration: false`
- Expose APIs via preload scripts only
- Validate all IPC messages

## IPC Communication
```javascript
// Main process
ipcMain.handle('channel-name', async (event, ...args) => {
  // Handle and return result
})

// Preload script
contextBridge.exposeInMainWorld('api', {
  methodName: (...args) => ipcRenderer.invoke('channel-name', ...args)
})

// Renderer process
const result = await window.api.methodName(args)
```

## Window Management
- Store window state (size, position)
- Handle graceful close
- Support multiple windows if needed

## File System
- Use `app.getPath()` for standard directories
- Handle both Windows and macOS paths
- Use `path.join()` for path construction

## Updates
- Implement auto-update functionality
- Handle update download progress
- Allow user to defer updates

## Build Configuration
- Configure electron-builder properly
- Include necessary native modules
- Sign applications for distribution
