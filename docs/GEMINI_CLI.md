# Gemini CLI - Quick Start Guide

A lightweight PowerShell CLI for Google's Gemini AI API.

## 🚀 Quick Setup

### 1. Get Your API Key
Visit [Google AI Studio](https://makersuite.google.com/app/apikey) and create a free API key.

### 2. Run Setup
```powershell
.\scripts\setup-gemini.ps1
```

Enter your API key when prompted. It will be saved as a user environment variable.

### 3. Restart Your Terminal
Close and reopen PowerShell for the environment variable to take effect.

## 📝 Usage

### Basic Usage
```powershell
gemini "What is machine learning?"
```

### YOLO Mode (Quick Creative Prompts)
```powershell
gemini --yolo
```

This sends a creative prompt and gets an innovative AI project idea.

### Interactive Mode
```powershell
gemini
```

You'll be prompted to enter your question.

## 🔧 Manual Setup

If you prefer to set up manually:

```powershell
# Set the environment variable
[System.Environment]::SetEnvironmentVariable('GEMINI_API_KEY', 'your-api-key-here', 'User')

# Restart terminal, then test
gemini "Hello!"
```

## 🛠️ Troubleshooting

### Command Not Found
```
gemini : The term 'C:\Users\scarm\gemini.ps1' is not recognized...
```

**Solutions:**
1. Ensure `gemini.ps1` exists at `C:\Users\scarm\gemini.ps1`
2. Restart your terminal
3. Try using full path: `C:\Users\scarm\gemini.ps1 --yolo`

### API Key Not Set
```
❌ Error: GEMINI_API_KEY environment variable not set
```

**Solution:**
Run the setup script again:
```powershell
.\scripts\setup-gemini.ps1
```

### API Error: 400 Bad Request
Check that your API key is valid at [Google AI Studio](https://makersuite.google.com/app/apikey).

## 🔐 Security Notes

- API keys are stored in user environment variables (not in code)
- Never commit `.env` files or API keys to Git
- Regenerate your API key if accidentally exposed

## 📚 Features

- ✅ Simple CLI interface
- ✅ Interactive and command-line modes
- ✅ YOLO mode for creative brainstorming
- ✅ Persistent API key storage
- ✅ Error handling and helpful messages
- ✅ PowerShell native (no external dependencies)

## 🔗 Links

- [Google AI Studio](https://makersuite.google.com/)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Scarmonit Architecture](https://github.com/Scarmonit/Scarmonit-Architecture)

## 📄 License

Part of Scarmonit Architecture - Proprietary to Scarmonit Industries

---

**Need Help?** Email: Scarmonit@gmail.com

