#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import puppeteer from 'puppeteer';

/**
 * Scarmonit Monitor MCP Server
 * Exposes browser automation as a standardized MCP tool.
 */

const server = new Server(
  {
    name: 'scarmonit-monitor',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Define the tools this server provides
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'check_scarmonit_health',
        description: 'Performs a deep browser-based health check of the Scarmonit Web Portal',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'Target URL (default: https://scarmonit.scarmonit-www.pages.dev)'
            },
            timeout: {
              type: 'number',
              description: 'Timeout in milliseconds (default: 5000)'
            }
          }
        }
      }
    ]
  };
});

/**
 * Execute the tool logic
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  if (name === 'check_scarmonit_health') {
    const url = (args?.url) || 'https://scarmonit.scarmonit-www.pages.dev';
    const timeout = (args?.timeout) || 5000;
    
    let browser;
    try {
      // Launch browser (headless)
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      
      // Navigation Timing
      const startTime = Date.now();
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 });
      
      // Inject our "Smart Probe" logic
      const report = await page.evaluate(async (timeoutMs, start) => {
        const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        // 1. Wait for UI
        while (Date.now() - start < timeoutMs) {
          if (document.querySelector('.status-grid')) break;
          await wait(100);
        }

        if (!document.querySelector('.status-grid')) {
          throw new Error('Timeout waiting for .status-grid');
        }

        // 2. Extract Data
        const cards = Array.from(document.querySelectorAll('.status-card')).map(card => {
          const lines = card.innerText.split('\n');
          const statusEl = card.querySelector('.status-indicator');
          const isOnline = statusEl ? getComputedStyle(statusEl).backgroundColor === 'rgb(16, 185, 129)' : false;
          return {
            name: lines[0] || 'Unknown',
            status: lines[1] || 'Unknown',
            latency: lines[2] || 'N/A',
            isOnline
          };
        });

        const healthBadge = document.querySelector('.health-badge');
        
        return {
           summary: healthBadge ? healthBadge.innerText : 'Unknown',
           services: cards,
           allOnline: cards.every(c => c.isOnline)
        };
      }, timeout, Date.now());

      const duration = Date.now() - startTime;

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              url,
              duration_ms: duration,
              ...report
            }, null, 2)
          }
        ]
      };

    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: 'error',
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }
        ],
        isError: true
      };
    } finally {
      if (browser) await browser.close();
    }
  }
  
  throw new Error(`Unknown tool: ${name}`);
});

// Start the server
const transport = new StdioServerTransport();
await server.connect(transport);
console.error('Scarmonit Monitor MCP Server running on stdio');
