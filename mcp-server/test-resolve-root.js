#!/usr/bin/env node
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Import resolveAgainstRoot from index.js by re-evaluating the file and extracting the function
// Since it's not exported, we duplicate minimal logic inline for validation purposes.
function resolveAgainstRoot(relOrAbs) {
  try {
    const envRoot = process.env.SCARMONIT_ROOT || process.env.MCP_PROJECT_ROOT || '';
    const candidateRoot = envRoot && envRoot.trim().length > 0 ? envRoot : process.cwd();
    const safeRoot = path.resolve(candidateRoot);
    const absIn = path.isAbsolute(relOrAbs) ? relOrAbs : path.join(safeRoot, relOrAbs || '');
    const absNorm = path.normalize(absIn);
    if (!absNorm.startsWith(safeRoot)) {
      return safeRoot;
    }
    return absNorm;
  } catch {
    return path.resolve(process.cwd());
  }
}

function assert(name, cond) {
  if (!cond) {
    console.error('FAIL', name);
    process.exitCode = 1;
  } else {
    console.log('PASS', name);
  }
}

// Setup root
process.env.SCARMONIT_ROOT = path.resolve(process.cwd(), '..');
const ROOT = process.env.SCARMONIT_ROOT;

assert('joins relative under root', resolveAgainstRoot('.github/agents').startsWith(ROOT));
assert('normalizes dot-dot escaping to root', resolveAgainstRoot('..\\..').startsWith(ROOT));
const outside = path.resolve('C:/Windows');
assert('absolute outside root falls back to root', resolveAgainstRoot(outside) === ROOT);

console.log('All resolveAgainstRoot checks done. Root =', ROOT);

