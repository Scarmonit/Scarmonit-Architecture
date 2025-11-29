import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

async function main() {
  console.log('🚀 Starting MCP Client Test...');

  // Connect to our new server
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['index.js']
  });

  const client = new Client(
    { name: 'test-client', version: '1.0.0' },
    { capabilities: {} }
  );

  await client.connect(transport);
  console.log('✅ Connected to scarmonit-monitor server');

  // List tools
  console.log('\n📋 Listing Tools:');
  const tools = await client.request(ListToolsRequestSchema, {});
  console.log(tools.tools.map(t => ` - ${t.name}: ${t.description}`).join('\n'));

  // Call the health check tool
  console.log('\n🩺 Calling check_scarmonit_health...');
  const result = await client.request(CallToolRequestSchema, {
    name: 'check_scarmonit_health',
    arguments: {}
  });

  console.log('\n📊 Tool Output:');
  console.log(result.content[0].text);

  await client.close();
}

main().catch(console.error);
