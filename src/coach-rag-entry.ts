#!/usr/bin/env node

import { IntegratedCoachRAG } from './coach-rag-integrated.js';
import * as readline from 'readline';

// Main execution function
async function main(): Promise<void> {
  console.log('🤖 Welcome to SUMAKSES Integrated Coach + RAG System!');
  
  // Option to customize profile
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const customizeName = await new Promise<string>((resolve) => {
    rl.question('Enter your name (or press Enter for default "New User"): ', resolve);
  });
  
  let customProfile = {};
  if (customizeName) {
    customProfile = { name: customizeName };
  }
  
  rl.close();
  
  const coach = new IntegratedCoachRAG(customProfile);
  
  // Cleanup on exit
  process.on('SIGINT', () => {
    coach.cleanup();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    coach.cleanup();
    process.exit(0);
  });
  
  await coach.initialize();
  await coach.start();
}

// Run the main function directly
main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
}); 