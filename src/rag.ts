#!/usr/bin/env node

import { TerminalRAG } from './terminal-rag.js';

// Simple launcher for terminal RAG
async function main(): Promise<void> {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                     🤖 Terminal RAG System                   ║
║                  Retrieval-Augmented Generation              ║
║                      Interactive Terminal                    ║
╚══════════════════════════════════════════════════════════════╝
  `);

  const terminalRAG = new TerminalRAG();
  await terminalRAG.start();
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
}); 