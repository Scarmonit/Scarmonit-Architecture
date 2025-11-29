# JetBrains Plugin Activation & Troubleshooting Guide

## ⚠️ Common Activation Issues

This guide covers troubleshooting for JetBrains IDE plugin activation issues, including ja-netfilter compatibility and network access problems.

---

## 🔧 Issue 1: Activation Fails (Corrupted Data or DnsFilter.testQuery Error)

### Symptoms
- Activation fails with corrupted data message
- `DnsFilter.testQuery` error appears
- License verification cannot complete

### Solution Steps

**Step 1: Update Plugin**
```
1. Open JetBrains IDE (IntelliJ/WebStorm/PyCharm)
2. Go to Settings → Plugins
3. Find the plugin and click "Update"
4. Restart IDE
```

**Step 2: Retry Activation**
```
1. Go to Help → Register
2. Enter your activation code
3. Click "Activate"
```

**Step 3: Contact Support (if still failing)**
- **WeChat:** gejun12311
- **QQ Group:** 575733084
- Provide error details and activation code

---

## 🛡️ Issue 2: ja-netfilter Compatibility Problem

### Background
- ja-netfilter versions ≥ 20220701 block `brucege.com`
- This prevents license verification from completing
- Affects plugin activation and validation

### Detection
Check if you have ja-netfilter installed:
```bash
# Windows
dir /s ja-netfilter

# Mac/Linux
find ~ -name "ja-netfilter" -type d
```

### Solution A: Fix DNS Configuration (Recommended)

**Step 1: Locate Config File**
```
ja-netfilter/config/dns.conf
```

**Step 2: Edit dns.conf**
Open the file and **DELETE** this line:
```
equal brucege.com
```

**Step 3: Save and Restart IDE**

### Solution B: Downgrade Plugin (Alternative)

If DNS fix doesn't work:
```
1. Uninstall current plugin version
2. Download plugin version 3.3.1
3. Install manually: Settings → Plugins → ⚙️ → Install Plugin from Disk
4. Retry activation
```

### Verification
After fix, test access:
```bash
# Windows PowerShell
Test-Connection brucege.com -Count 2

# Mac/Linux
ping -c 2 brucege.com
```

Expected: Should resolve and respond

---

## 🌐 Issue 3: Cannot Access brucege.com

### Symptoms
- Network timeout when activating
- DNS resolution fails
- Firewall/VPN blocking access

### Quick Network Test
```bash
# Windows
nslookup brucege.com
ping brucege.com

# Mac/Linux
dig brucege.com
curl -I https://brucege.com
```

### Solution: Offline Activation

**Step 1: Get Unique Code**
```
1. Open JetBrains IDE
2. Go to Help → Register
3. Select "Offline Activation"
4. Copy the unique code displayed
```

**Step 2: Contact Support**
- **WeChat:** gejun12311
- **QQ Group:** 575733084

**Provide:**
1. Your unique offline activation code
2. Your purchased online activation code
3. IDE version and OS details

**Step 3: Apply Offline License**
```
1. Receive offline license file from support
2. Go to Help → Register
3. Select "License file"
4. Browse and select the received file
5. Click "Activate"
```

---

## 🍎 Issue 4: Mac "Permission Denied" Error

### Symptoms
- "Permission denied" when activating
- Cannot write to config directory
- Activation settings not saved

### Solution: Fix Permissions

**Step 1: Navigate to Home**
```bash
cd ~
```

**Step 2: Fix Config Permissions**
```bash
sudo chmod 777 .config
```

**Step 3: Verify**
```bash
ls -la | grep .config
# Should show: drwxrwxrwx
```

**Step 4: Retry Activation**
```
1. Restart JetBrains IDE
2. Go to Help → Register
3. Enter activation code
4. Click "Activate"
```

### Alternative: Reset Config (if above fails)
```bash
# Backup existing config
mv ~/.config ~/.config.backup

# Create fresh config directory
mkdir ~/.config
chmod 755 ~/.config

# Restart IDE and retry
```

---

## 📋 Troubleshooting Checklist

Before contacting support, verify:

- [ ] Plugin is updated to latest version
- [ ] JetBrains IDE is updated to latest version
- [ ] Internet connection is stable
- [ ] No VPN/proxy blocking brucege.com
- [ ] Firewall allows IDE network access
- [ ] ja-netfilter DNS config doesn't block brucege.com
- [ ] Config directory has correct permissions (Mac)
- [ ] Activation code is valid and not expired

---

## 🆘 Support Channels

### Primary Support
- **WeChat:** gejun12311
- **QQ Group:** 575733084

### When Contacting Support, Include:
1. **IDE Details:**
   - Product (IntelliJ/WebStorm/PyCharm/etc.)
   - Version number
   - OS (Windows/Mac/Linux + version)

2. **Error Details:**
   - Exact error message
   - Screenshot if possible
   - When error occurs (during activation/at startup/etc.)

3. **Activation Info:**
   - Online activation code (if applicable)
   - Offline unique code (for offline activation)

4. **Environment:**
   - ja-netfilter version (if installed)
   - Network setup (VPN/proxy/firewall)
   - Previous activation attempts

---

## 🔍 Advanced Diagnostics

### Check IDE Logs
```
Help → Show Log in Explorer/Finder
```
Look for:
- `DnsFilter` errors
- `brucege.com` connection failures
- `Permission denied` messages

### Test Network Access
```bash
# Windows PowerShell
Test-NetConnection brucege.com -Port 443

# Mac/Linux
nc -zv brucege.com 443
telnet brucege.com 443
```

### Verify ja-netfilter Status
```bash
# Check if ja-netfilter is active
# Look for VM options in IDE Help → Edit Custom VM Options
# Should see: -javaagent:/path/to/ja-netfilter.jar
```

---

## ✅ Post-Activation Verification

After successful activation:

1. **Check License Status:**
   ```
   Help → About
   # Should show license valid until <date>
   ```

2. **Verify Features:**
   - Premium features are enabled
   - No trial/evaluation banners
   - All plugins functional

3. **Test MCP Integration:**
   ```
   # In Copilot Chat
   Run MCP tool list_agents
   # Should return agent list without errors
   ```

---

## 🔄 Re-Activation After System Changes

If license becomes invalid after:
- OS reinstall
- Hardware changes
- IDE upgrade

**Steps:**
1. Deactivate old license (if possible)
2. Follow activation steps again
3. Use same activation code
4. Contact support if code is rejected

---

## 📝 Known Issues & Workarounds

### Issue: Activation Works but MCP Tools Don't Load
**Fix:**
```bash
# Restart MCP server
.\mcp-server\restart-mcp.ps1

# Restart IDE
# Verify: Run MCP tool list_agents
```

### Issue: Activation Code "Already Used"
**Fix:**
- Contact support via WeChat: gejun12311
- Provide proof of purchase
- Request code reset

### Issue: License Valid but Shows as Trial
**Fix:**
```
1. Help → Register → Manage Licenses
2. Remove all licenses
3. Restart IDE
4. Reactivate with code
```

---

## 🛠️ Preventive Measures

### Before Installing ja-netfilter:
1. Check version compatibility
2. Backup existing IDE settings
3. Test activation before applying ja-netfilter

### Regular Maintenance:
1. Keep IDE updated
2. Keep plugins updated
3. Backup license files/codes
4. Monitor license expiration dates

### Network Configuration:
1. Whitelist brucege.com in firewall
2. Exclude from VPN routing (if causing issues)
3. Add to antivirus exceptions if needed

---

## 📞 Quick Support Reference

| Issue | Solution | Support Contact |
|-------|----------|-----------------|
| Activation fails | Update plugin + retry | WeChat: gejun12311 |
| ja-netfilter blocking | Edit dns.conf | QQ: 575733084 |
| Cannot access brucege.com | Offline activation | WeChat: gejun12311 |
| Mac permission denied | `sudo chmod 777 .config` | - |
| Code already used | Contact support | WeChat: gejun12311 |

---

**Last Updated:** November 29, 2025  
**Compatibility:** JetBrains IDEs 2024.x - 2025.x  
**Support Hours:** Check QQ Group for availability

