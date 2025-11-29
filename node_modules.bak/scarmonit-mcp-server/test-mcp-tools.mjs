#!/usr/bin/env node
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import path from 'path';
import process from 'process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  const serverPath = path.join(__dirname, 'index.js');
  const repoRoot = path.resolve(__dirname, '..');
  console.log('Resolved MCP server path:', serverPath);
  console.log('Repository root (cwd for server):', repoRoot);

  const client = new Client({
    name: 'scarmonit-mcp-test-client',
    version: '1.0.0'
  }, {
    capabilities: { tools: {} }
  });

  const transport = new StdioClientTransport({
    command: 'node',
    args: [serverPath],
    env: { ...process.env },
    cwd: repoRoot
  });

  await client.connect(transport);

  // Allow server initialization
  await new Promise(resolve => setTimeout(resolve, 1000));

  const toolsResp = await client.listTools();
  console.log('\n=== Available Tools ===');
  toolsResp.tools.forEach(t => console.log(`- ${t.name}: ${t.description}`));

  async function callTool(name, args = {}) {
    try {
      const resp = await client.callTool({ name, arguments: args });
      console.log(`\n>>> Tool: ${name} ${JSON.stringify(args)}`);
      resp.content.forEach(c => {
        if (c.type === 'text') console.log(c.text);
      });
    } catch (error) {
      console.log(`\n>>> Tool: ${name} - ERROR:`, error.message);
    }
  }

  await callTool('list_agents');
  await callTool('search_agents', { query: 'engineer' });
  await callTool('apply_agent_context', { agent: 'backend-engineer' });
  await callTool('get_agent_instructions', { agent: 'security-reviewer' });
  await callTool('get_agent_instructions', { agent: 'nonexistent-agent' });
  await callTool('check_datalore_status');
  await callTool('check_system_status');

  await transport.close();
  console.log('\n=== Test Complete ===');
  process.exit(0);
}

run().catch(err => {
  console.error('Test harness fatal error:', err);
  process.exit(1);
});
