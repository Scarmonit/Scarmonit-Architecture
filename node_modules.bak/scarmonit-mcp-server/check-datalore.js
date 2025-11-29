const { spawn } = require('child_process');
const path = require('path');

// Configuration
const serverPath = path.join(__dirname, 'index.js');

console.log(`🚀 Checking Datalore Status...`);

const proc = spawn('node', [serverPath], {
  cwd: __dirname,
  env: { ...process.env, PATH: process.env.PATH }
});

let success = false;

proc.stdout.on('data', (data) => {
  const lines = data.toString().split('\n');
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const msg = JSON.parse(line);
      if (msg.id === 0) {
         // Handshake
         proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized', params: {} }) + '\n');
         // Call Tool
         proc.stdin.write(JSON.stringify({ 
           jsonrpc: '2.0', 
           id: 1, 
           method: 'tools/call', 
           params: { name: 'check_datalore_status', arguments: {} } 
         }) + '\n');
      } else if (msg.id === 1) {
         if (msg.result && msg.result.content) {
             console.log('\n' + msg.result.content[0].text);
             success = true;
         }
         proc.kill();
         process.exit(0);
      }
    } catch (e) {}
  }
});

proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 0, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'checker', version: '1.0' }} }) + '\n');

setTimeout(() => {
    if (!success) {
        console.error('❌ Timeout checking status');
        proc.kill();
        process.exit(1);
    }
}, 5000);