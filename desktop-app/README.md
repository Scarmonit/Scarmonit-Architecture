# AI Chat Desktop App

## Desktop application for chatting with your LM Studio AI

### Quick Start

**Run the app:**
```bash
cd ai-chat-desktop
npm install
npm start
```

The app will open in a desktop window!

### Features

✅ **Standalone Desktop App** - Runs like any Windows program  
✅ **Beautiful UI** - Modern, clean interface  
✅ **Real-time Chat** - Instant AI responses  
✅ **Typing Indicators** - See when AI is thinking  
✅ **Secure** - Uses authentication token  

### Building an EXE

To create a distributable .exe file:

```bash
npm run build
```

The installer will be in the `dist` folder.

### How It Works

Your desktop app connects to:
- **API:** `https://agent.scarmonit.com`
- **Backend:** Your local LM Studio (via tunnel)
- **Model:** lfm2-1.2b

All AI processing happens on YOUR computer!

### Customization

Edit `index.html` to customize:
- Colors and styling
- Window size (in `main.js`)
- API endpoint

Enjoy your desktop AI chat! 🚀
