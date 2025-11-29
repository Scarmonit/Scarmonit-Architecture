# JetBrains Activation Diagnostic Script
# Checks common activation issues and provides fixes

Write-Host "`n╔══════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     JETBRAINS ACTIVATION DIAGNOSTIC TOOL                        ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$issues = @()
$fixes = @()

# Test 1: Network connectivity to brucege.com
Write-Host "🌐 Testing network access to brucege.com..." -ForegroundColor Yellow
try {
    $ping = Test-Connection -ComputerName brucege.com -Count 2 -ErrorAction SilentlyContinue
    if ($ping) {
        Write-Host "   ✅ brucege.com is accessible" -ForegroundColor Green
    } else {
        throw "Cannot reach brucege.com"
    }
} catch {
    Write-Host "   ❌ Cannot access brucege.com" -ForegroundColor Red
    $issues += "Network access to brucege.com blocked"
    $fixes += "1. Check firewall/VPN settings`n2. Try offline activation (see docs/JETBRAINS_ACTIVATION_GUIDE.md)"
}

# Test 2: Check for ja-netfilter
Write-Host "`n🔍 Checking for ja-netfilter installation..." -ForegroundColor Yellow
$jaNetfilterPaths = @(
    "$env:USERPROFILE\.ja-netfilter",
    "C:\Program Files\ja-netfilter",
    "C:\Program Files (x86)\ja-netfilter"
)

$foundJaNetfilter = $false
foreach ($jaPath in $jaNetfilterPaths) {
    if (Test-Path $jaPath) {
        $foundJaNetfilter = $true
        Write-Host "   ⚠️  ja-netfilter found at: $jaPath" -ForegroundColor Yellow

        # Check dns.conf
        $dnsConf = Join-Path $jaPath "config\dns.conf"
        if (Test-Path $dnsConf) {
            $dnsContent = Get-Content $dnsConf -Raw
            if ($dnsContent -match "equal brucege.com") {
                Write-Host "   ❌ dns.conf contains blocking rule for brucege.com" -ForegroundColor Red
                $issues += "ja-netfilter blocking brucege.com"
                $fixes += "Edit $dnsConf and DELETE the line: equal brucege.com"
            } else {
                Write-Host "   ✅ dns.conf does not block brucege.com" -ForegroundColor Green
            }
        }
    }
}

if (-not $foundJaNetfilter) {
    Write-Host "   ✅ ja-netfilter not detected" -ForegroundColor Green
}

# Test 3: Check JetBrains IDE installation
Write-Host "`n🔍 Checking JetBrains IDE installations..." -ForegroundColor Yellow
$jetbrainsApps = @()
$programFiles = @("$env:ProgramFiles\JetBrains", "${env:ProgramFiles(x86)}\JetBrains", "$env:LOCALAPPDATA\Programs\JetBrains")

foreach ($pf in $programFiles) {
    if (Test-Path $pf) {
        $apps = Get-ChildItem -Path $pf -Directory -ErrorAction SilentlyContinue
        $jetbrainsApps += $apps
    }
}

if ($jetbrainsApps.Count -gt 0) {
    Write-Host "   ✅ Found JetBrains IDEs:" -ForegroundColor Green
    $jetbrainsApps | ForEach-Object { Write-Host "      - $($_.Name)" -ForegroundColor Gray }
} else {
    Write-Host "   ⚠️  No JetBrains IDEs detected" -ForegroundColor Yellow
}

# Test 4: Check for common IDE config locations
Write-Host "`n🔍 Checking IDE configuration..." -ForegroundColor Yellow
$configPaths = @(
    "$env:APPDATA\JetBrains",
    "$env:LOCALAPPDATA\JetBrains"
)

$foundConfigs = $false
foreach ($confPath in $configPaths) {
    if (Test-Path $confPath) {
        $foundConfigs = $true
        $configs = Get-ChildItem -Path $confPath -Directory -ErrorAction SilentlyContinue
        if ($configs) {
            Write-Host "   ✅ IDE configs found at: $confPath" -ForegroundColor Green

            # Check for recent IDE versions
            $recent = $configs | Where-Object { $_.Name -match "202[4-5]" }
            if ($recent) {
                Write-Host "      Recent versions detected:" -ForegroundColor Gray
                $recent | Select-Object -First 3 | ForEach-Object {
                    Write-Host "      - $($_.Name)" -ForegroundColor Gray
                }
            }
        }
    }
}

if (-not $foundConfigs) {
    Write-Host "   ⚠️  No IDE configuration directories found" -ForegroundColor Yellow
}

# Test 5: Check DNS resolution
Write-Host "`n🔍 Testing DNS resolution..." -ForegroundColor Yellow
try {
    $dnsResult = Resolve-DnsName -Name brucege.com -ErrorAction SilentlyContinue
    if ($dnsResult) {
        Write-Host "   ✅ DNS resolution successful" -ForegroundColor Green
        Write-Host "      IP: $($dnsResult[0].IPAddress)" -ForegroundColor Gray
    } else {
        throw "DNS resolution failed"
    }
} catch {
    Write-Host "   ❌ DNS resolution failed" -ForegroundColor Red
    $issues += "DNS cannot resolve brucege.com"
    $fixes += "1. Check DNS settings`n2. Try flushing DNS: ipconfig /flushdns`n3. Use offline activation"
}

# Test 6: Check MCP configuration
Write-Host "`n🔍 Checking MCP configuration..." -ForegroundColor Yellow
$mcpConfigPath = "$env:LOCALAPPDATA\github-copilot\intellij\mcp.json"
if (Test-Path $mcpConfigPath) {
    Write-Host "   ✅ MCP config found" -ForegroundColor Green
    try {
        $mcpConfig = Get-Content $mcpConfigPath -Raw | ConvertFrom-Json
        if ($mcpConfig.mcpServers.'scarmonit-architecture') {
            Write-Host "   ✅ Scarmonit MCP server configured" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  Scarmonit MCP server not in config" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "   ⚠️  Could not parse MCP config" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ℹ️  MCP config not found (may be created on first use)" -ForegroundColor Gray
}

# Summary
Write-Host "`n╔══════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     DIAGNOSTIC SUMMARY                                           ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

if ($issues.Count -eq 0) {
    Write-Host "✅ No activation issues detected!" -ForegroundColor Green
    Write-Host "`nℹ️  If you're still having activation problems:" -ForegroundColor Yellow
    Write-Host "   1. Update plugin to latest version" -ForegroundColor White
    Write-Host "   2. Restart IDE and retry activation" -ForegroundColor White
    Write-Host "   3. Contact support: WeChat gejun12311" -ForegroundColor White
} else {
    Write-Host "❌ Found $($issues.Count) issue(s):" -ForegroundColor Red
    for ($i = 0; $i -lt $issues.Count; $i++) {
        Write-Host "`n$($i + 1). $($issues[$i])" -ForegroundColor Yellow
        Write-Host "   Fix: $($fixes[$i])" -ForegroundColor White
    }
}

Write-Host "`n📚 Documentation:" -ForegroundColor Cyan
Write-Host "   Full Guide: docs\JETBRAINS_ACTIVATION_GUIDE.md" -ForegroundColor White

Write-Host "`n📞 Support:" -ForegroundColor Cyan
Write-Host "   WeChat: gejun12311" -ForegroundColor White
Write-Host "   QQ Group: 575733084" -ForegroundColor White

Write-Host "`n🔧 Quick Actions:" -ForegroundColor Cyan
Write-Host "   [1] Open activation guide" -ForegroundColor White
Write-Host "   [2] Test MCP server" -ForegroundColor White
Write-Host "   [3] Exit`n" -ForegroundColor White

$choice = Read-Host "Select action (1-3)"
switch ($choice) {
    "1" {
        $guidePath = "docs\JETBRAINS_ACTIVATION_GUIDE.md"
        if (Test-Path $guidePath) {
            Start-Process notepad.exe -ArgumentList $guidePath
        } else {
            Write-Host "Guide not found at: $guidePath" -ForegroundColor Red
        }
    }
    "2" {
        Write-Host "`nTesting MCP server..." -ForegroundColor Yellow
        $mcpServerPath = "mcp-server\index.js"
        if (Test-Path $mcpServerPath) {
            node $mcpServerPath
        } else {
            Write-Host "MCP server not found at: $mcpServerPath" -ForegroundColor Red
        }
    }
    "3" {
        Write-Host "Exiting..." -ForegroundColor Gray
    }
    default {
        Write-Host "Invalid choice" -ForegroundColor Red
    }
}

Write-Host ""
