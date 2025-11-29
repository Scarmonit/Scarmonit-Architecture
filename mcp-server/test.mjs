import { spawn } from 'child_process';

const server = spawn('node', ['index.js']);
let output = '';

server.stderr.on('data', (data) => {
  console.log('Server:', data.toString());
});

server.stdout.on('data', (data) => {
  output += data.toString();
});

// Send list tools request
setTimeout(() => {
  const request = JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list',
    params: {}
  }) + '\n';
  
  server.stdin.write(request);
  
  setTimeout(() => {
    console.log('\nResponse:', output);
    server.kill();
    process.exit(0);
  }, 1000);
}, 1000);
