#!/usr/bin/env node
/**
 * Interactive Demo - Scarmonit MCP Agent Personas
 * Run this to see agent tools in action
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

function banner(text) {
  const line = '='.repeat(70);
  console.log(`\n${line}`);
  console.log(`  ${text}`);
  console.log(`${line}\n`);
}

async function demo() {
  banner('🎯 SCARMONIT MCP AGENT PERSONAS - INTERACTIVE DEMO');

  const serverPath = path.join(__dirname, 'index.js');
  const repoRoot = path.resolve(__dirname, '..');

  console.log('📡 Connecting to MCP server...');
  const client = new Client({
    name: 'scarmonit-demo-client',
    version: '1.0.0'
  }, { capabilities: { tools: {} } });

  const transport = new StdioClientTransport({
    command: 'node',
    args: [serverPath],
    env: { ...process.env },
    cwd: repoRoot
  });

  await client.connect(transport);
  console.log('✅ Connected!\n');

  await new Promise(resolve => setTimeout(resolve, 500));

  // Demo 1: List all tools
  banner('📋 DEMO 1: List Available Tools');
  const toolsResp = await client.listTools();
  console.log(`Found ${toolsResp.tools.length} tools:\n`);
  toolsResp.tools.forEach((t, i) => {
    console.log(`${i + 1}. ${t.name}`);
    console.log(`   ${t.description}\n`);
  });

  await ask('Press Enter to continue...');

  // Demo 2: List agents
  banner('👥 DEMO 2: List Agent Personas');
  const agentsResp = await client.callTool({ name: 'list_agents', arguments: {} });
  console.log(agentsResp.content[0].text);

  await ask('\nPress Enter to continue...');

  // Demo 3: Search agents
  banner('🔍 DEMO 3: Search for "engineer" Agents');
  const searchResp = await client.callTool({
    name: 'search_agents',
    arguments: { query: 'engineer' }
  });
  console.log(searchResp.content[0].text);

  await ask('\nPress Enter to continue...');

  // Demo 4: Apply context
  banner('⚡ DEMO 4: Get Backend Engineer Context');
  const contextResp = await client.callTool({
    name: 'apply_agent_context',
    arguments: { agent: 'backend-engineer' }
  });
  console.log(contextResp.content[0].text);

  await ask('\nPress Enter to continue...');

  // Demo 5: Full instructions
  banner('📖 DEMO 5: Get Security Reviewer Full Instructions (Preview)');
  const instructResp = await client.callTool({
    name: 'get_agent_instructions',
    arguments: { agent: 'security-reviewer' }
  });
  const fullText = instructResp.content[0].text;
  const preview = fullText.split('\n').slice(0, 30).join('\n');
  console.log(preview);
  console.log('\n... (truncated - full instructions available via MCP tool)');

  await ask('\nPress Enter to continue...');

  // Demo 6: Error handling
  banner('❌ DEMO 6: Error Handling (Nonexistent Agent)');
  const errorResp = await client.callTool({
    name: 'get_agent_instructions',
    arguments: { agent: 'nonexistent-agent' }
  });
  console.log(errorResp.content[0].text);

  await ask('\nPress Enter to continue...');

  // Demo 7: System status
  banner('🔧 DEMO 7: Check System Status');
  const statusResp = await client.callTool({ name: 'check_system_status', arguments: {} });
  console.log(statusResp.content[0].text);

  banner('✅ DEMO COMPLETE!');
  console.log('\n🎯 Next Steps:\n');
  console.log('1. Open JetBrains Copilot Chat');
  console.log('2. Try: Run MCP tool list_agents');
  console.log('3. Try: Run MCP tool apply_agent_context {"agent":"backend-engineer"}');
  console.log('\n📚 See MCP_AGENT_USAGE.md for complete guide');
  console.log('📋 Quick ref: C:\\Users\\scarm\\Desktop\\COPILOT_AGENTS_QUICKREF.txt\n');

  await transport.close();
  rl.close();
  process.exit(0);
}

demo().catch(err => {
  console.error('❌ Demo error:', err);
  rl.close();
  process.exit(1);
});

