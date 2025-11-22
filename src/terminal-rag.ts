#!/usr/bin/env node

import { DynamicRAG } from './dynamic-rag.js';
import { DocumentProcessor, ContentEnricher, ContentValidator } from './rag-processors.js';
import * as readline from 'readline';
import * as fs from 'fs/promises';
import * as path from 'path';

class TerminalRAG {
  private rag: DynamicRAG;
  private rl: readline.Interface;
  private isInitialized: boolean = false;

  constructor() {
    this.rag = new DynamicRAG({
      dataDirectory: './terminal-rag-data',
      vectorStoreDirectory: './terminal-vector-store',
      documentsFile: 'terminal-documents.json',
      maxDocuments: 1000,
      autoSave: true
    });

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '🤖 RAG> '
    });

    this.setupReadline();
  }

  private setupReadline(): void {
    // Handle Ctrl+C gracefully
    this.rl.on('SIGINT', () => {
      console.log('\n👋 Goodbye!');
      this.rl.close();
      process.exit(0);
    });

    // Handle line input
    this.rl.on('line', async (input: string) => {
      await this.processInput(input.trim());
      this.rl.prompt();
    });

    // Handle close
    this.rl.on('close', () => {
      console.log('\n👋 Goodbye!');
      process.exit(0);
    });
  }

  async start(): Promise<void> {
    console.log('🚀 Welcome to Terminal RAG System!');
    console.log('═'.repeat(50));
    console.log('💡 Type "help" for available commands');
    console.log('💡 Press Ctrl+C to exit\n');

    // Initialize RAG system
    await this.initializeRAG();

    // Start the interactive prompt
    this.rl.prompt();
  }

  private async initializeRAG(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🔄 Initializing RAG system...');
      await this.rag.initialize();
      this.isInitialized = true;
      console.log('✅ RAG system ready!');
      
      // Show initial stats
      const stats = this.rag.getStats();
      if (stats.totalDocuments > 0) {
        console.log(`📚 Loaded ${stats.totalDocuments} existing documents`);
      } else {
        console.log('📭 No existing documents found - start adding some!');
      }
      console.log('');
    } catch (error) {
      console.error('❌ Failed to initialize RAG system:', error);
      process.exit(1);
    }
  }

  private async processInput(input: string): Promise<void> {
    if (!input) return;

    const [command, ...args] = input.split(' ');
    const argsString = args.join(' ');

    try {
      switch (command.toLowerCase()) {
        case 'help':
        case 'h':
          this.showHelp();
          break;

        case 'add':
          await this.handleAdd(argsString);
          break;

        case 'query':
        case 'q':
          await this.handleQuery(argsString);
          break;

        case 'file':
          await this.handleFile(argsString);
          break;

        case 'url':
          await this.handleUrl(argsString);
          break;

        case 'list':
        case 'ls':
          await this.handleList(argsString);
          break;

        case 'stats':
          await this.handleStats();
          break;

        case 'search':
          await this.handleSearch(argsString);
          break;

        case 'delete':
        case 'del':
          await this.handleDelete(argsString);
          break;

        case 'export':
          await this.handleExport();
          break;

        case 'clear':
        case 'cls':
          console.clear();
          console.log('🚀 Terminal RAG System - Screen Cleared\n');
          break;

        case 'exit':
        case 'quit':
        case 'q!':
          console.log('👋 Goodbye!');
          this.rl.close();
          break;

        default:
          // If no command matches, treat as a query
          if (input.endsWith('?') || input.toLowerCase().startsWith('what') || 
              input.toLowerCase().startsWith('how') || input.toLowerCase().startsWith('why') ||
              input.toLowerCase().startsWith('when') || input.toLowerCase().startsWith('where')) {
            await this.handleQuery(input);
          } else {
            console.log('❓ Unknown command. Type "help" for available commands.');
            console.log('💡 Tip: End with "?" to query directly (e.g., "What is AI?")');
          }
      }
    } catch (error) {
      console.error('❌ Error:', error);
    }
  }

  private showHelp(): void {
    console.log('\n📖 Available Commands:');
    console.log('═'.repeat(50));
    console.log('📄 Document Management:');
    console.log('  add <content>           - Add new document');
    console.log('  file <path>            - Add document from file');
    console.log('  url <url>              - Add document from URL');
    console.log('  delete <id>            - Delete document by ID');
    console.log('');
    console.log('🔍 Search & Query:');
    console.log('  query <question>       - Query the knowledge base');
    console.log('  q <question>           - Short form of query');
    console.log('  search <term>          - Search documents by keyword');
    console.log('  <question>?            - Direct query (e.g., "What is AI?")');
    console.log('');
    console.log('📊 Information:');
    console.log('  list                   - List all documents');
    console.log('  ls                     - Short form of list');
    console.log('  stats                  - Show system statistics');
    console.log('');
    console.log('🔧 Utility:');
    console.log('  export                 - Export all data');
    console.log('  clear                  - Clear screen');
    console.log('  help                   - Show this help');
    console.log('  exit                   - Exit the system');
    console.log('');
    console.log('💡 Tips:');
    console.log('  - Questions ending with "?" are auto-queried');
    console.log('  - Use Ctrl+C to exit anytime');
    console.log('  - Commands are case-insensitive');
    console.log('');
  }

  private async handleAdd(content: string): Promise<void> {
    if (!content) {
      console.log('❌ Please provide content to add');
      console.log('📝 Usage: add <content>');
      return;
    }

    console.log('📝 Adding document...');
    
    // Get additional metadata interactively
    const title = await this.askQuestion('Title (optional): ');
    const category = await this.askQuestion('Category (optional): ') || 'general';
    const tagsInput = await this.askQuestion('Tags (comma-separated, optional): ');
    const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()) : [];

    try {
      const id = await this.rag.addDocument(content, {
        title: title || `Document ${Date.now()}`,
        source: 'terminal-input',
        category,
        tags
      });

      console.log(`✅ Document added successfully!`);
      console.log(`🆔 ID: ${id}`);
      console.log(`📊 Total documents: ${this.rag.getStats().totalDocuments}`);
    } catch (error) {
      console.error('❌ Failed to add document:', error);
    }
  }

  private async handleQuery(question: string): Promise<void> {
    if (!question) {
      console.log('❌ Please provide a question');
      console.log('📝 Usage: query <question>');
      return;
    }

    console.log('🔍 Searching knowledge base...');
    
    try {
      const result = await this.rag.query(question, {
        includeMetadata: true,
        maxResults: 5
      });

      console.log('\n📝 Answer:');
      console.log('─'.repeat(40));
      console.log(result.response);
      
      if (result.sources && result.sources.length > 0) {
        console.log('\n📚 Sources:');
        console.log('─'.repeat(40));
        result.sources.forEach((source: any, index: number) => {
          console.log(`${index + 1}. ${source.title || 'Untitled'}`);
          if (source.score) {
            console.log(`   Relevance: ${(source.score * 100).toFixed(1)}%`);
          }
        });
      }
      
      if (result.metadata) {
        console.log(`\n📊 Searched through ${result.metadata.totalDocuments} documents`);
      }
      console.log('');
    } catch (error) {
      console.error('❌ Query failed:', error);
    }
  }

  private async handleFile(filePath: string): Promise<void> {
    if (!filePath) {
      console.log('❌ Please provide a file path');
      console.log('📝 Usage: file <path>');
      return;
    }

    try {
      // Check if file exists
      await fs.access(filePath);
      
      console.log('📄 Processing file...');
      
      const title = await this.askQuestion(`Title (default: ${path.basename(filePath)}): `);
      const id = await this.rag.addDocumentFromFile(filePath, title || undefined);
      
      console.log(`✅ File added successfully!`);
      console.log(`🆔 ID: ${id}`);
      console.log(`📊 Total documents: ${this.rag.getStats().totalDocuments}`);
    } catch (error) {
      console.error('❌ Failed to add file:', error);
    }
  }

  private async handleUrl(url: string): Promise<void> {
    if (!url) {
      console.log('❌ Please provide a URL');
      console.log('📝 Usage: url <url>');
      return;
    }

    if (!ContentValidator.isValidUrl(url)) {
      console.log('❌ Invalid URL format');
      return;
    }

    try {
      console.log('🌐 Fetching content from URL...');
      
      const title = await this.askQuestion('Title (optional): ');
      const id = await this.rag.addDocumentFromURL(url, title || undefined);
      
      console.log(`✅ URL content added successfully!`);
      console.log(`🆔 ID: ${id}`);
      console.log(`📊 Total documents: ${this.rag.getStats().totalDocuments}`);
    } catch (error) {
      console.error('❌ Failed to add URL:', error);
    }
  }

  private async handleList(filter: string): Promise<void> {
    const docs = this.rag.listDocuments({ limit: 20 });
    
    if (docs.length === 0) {
      console.log('📭 No documents found');
      return;
    }

    console.log(`\n📚 Documents (showing ${Math.min(docs.length, 20)} of ${this.rag.getStats().totalDocuments}):`);
    console.log('═'.repeat(60));
    
    docs.forEach((doc, index) => {
      console.log(`${index + 1}. 📄 ${doc.title}`);
      console.log(`   🆔 ID: ${doc.id}`);
      console.log(`   📂 Category: ${doc.metadata.category}`);
      console.log(`   🏷️  Tags: ${doc.metadata.tags.join(', ') || 'none'}`);
      console.log(`   📅 Added: ${new Date(doc.metadata.addedDate).toLocaleDateString()}`);
      console.log(`   📝 Preview: ${doc.content.substring(0, 100)}...`);
      console.log('');
    });
  }

  private async handleStats(): Promise<void> {
    const stats = this.rag.getStats();
    
    console.log('\n📊 RAG System Statistics:');
    console.log('═'.repeat(50));
    console.log(`📚 Total Documents: ${stats.totalDocuments}`);
    console.log(`🆕 Recent Documents (7 days): ${stats.recentDocuments}`);
    
    if (Object.keys(stats.categories).length > 0) {
      console.log('\n📂 Categories:');
      Object.entries(stats.categories).forEach(([category, count]) => {
        console.log(`  ${category}: ${count}`);
      });
    }
    
    if (Object.keys(stats.tags).length > 0) {
      console.log('\n🏷️  Top Tags:');
      Object.entries(stats.tags)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 10)
        .forEach(([tag, count]) => {
          console.log(`  ${tag}: ${count}`);
        });
    }
    
    if (Object.keys(stats.sources).length > 0) {
      console.log('\n📄 Sources:');
      Object.entries(stats.sources).forEach(([source, count]) => {
        console.log(`  ${source}: ${count}`);
      });
    }
    console.log('');
  }

  private async handleSearch(term: string): Promise<void> {
    if (!term) {
      console.log('❌ Please provide a search term');
      console.log('📝 Usage: search <term>');
      return;
    }

    // Simple search through document titles and content
    const allDocs = this.rag.listDocuments();
    const results = allDocs.filter(doc => 
      doc.title.toLowerCase().includes(term.toLowerCase()) ||
      doc.content.toLowerCase().includes(term.toLowerCase()) ||
      doc.metadata.tags.some((tag: string) => tag.toLowerCase().includes(term.toLowerCase()))
    );

    console.log(`\n🔍 Search results for "${term}":`);
    console.log('═'.repeat(50));
    
    if (results.length === 0) {
      console.log('📭 No documents found matching your search');
      console.log('💡 Try a different term or use "query" for AI-powered search');
      return;
    }

    results.forEach((doc, index) => {
      console.log(`${index + 1}. 📄 ${doc.title}`);
      console.log(`   🆔 ID: ${doc.id}`);
      console.log(`   📂 Category: ${doc.metadata.category}`);
      console.log(`   🏷️  Tags: ${doc.metadata.tags.join(', ') || 'none'}`);
      
      // Show snippet with search term highlighted
      const snippet = this.getSearchSnippet(doc.content, term);
      console.log(`   📝 Snippet: ${snippet}`);
      console.log('');
    });
  }

  private getSearchSnippet(content: string, term: string): string {
    const words = content.split(' ');
    const termIndex = words.findIndex(word => 
      word.toLowerCase().includes(term.toLowerCase())
    );
    
    if (termIndex === -1) return content.substring(0, 100) + '...';
    
    const start = Math.max(0, termIndex - 10);
    const end = Math.min(words.length, termIndex + 10);
    const snippet = words.slice(start, end).join(' ');
    
    return snippet.length < content.length ? '...' + snippet + '...' : snippet;
  }

  private async handleDelete(id: string): Promise<void> {
    if (!id) {
      console.log('❌ Please provide a document ID');
      console.log('📝 Usage: delete <id>');
      console.log('💡 Use "list" to see document IDs');
      return;
    }

    // Find the document first
    const docs = this.rag.listDocuments();
    const doc = docs.find(d => d.id === id);
    
    if (!doc) {
      console.log('❌ Document not found');
      console.log('💡 Use "list" to see available document IDs');
      return;
    }

    console.log(`📄 Document to delete: "${doc.title}"`);
    const confirm = await this.askQuestion('Are you sure? (y/N): ');
    
    if (confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes') {
      try {
        const deleted = await this.rag.deleteDocument(id);
        if (deleted) {
          console.log('✅ Document deleted successfully');
          console.log(`📊 Remaining documents: ${this.rag.getStats().totalDocuments}`);
        } else {
          console.log('❌ Failed to delete document');
        }
      } catch (error) {
        console.error('❌ Error deleting document:', error);
      }
    } else {
      console.log('❌ Deletion cancelled');
    }
  }

  private async handleExport(): Promise<void> {
    try {
      console.log('💾 Exporting data...');
      const exportPath = await this.rag.exportData();
      console.log(`✅ Data exported to: ${exportPath}`);
    } catch (error) {
      console.error('❌ Export failed:', error);
    }
  }

  private askQuestion(question: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer.trim());
      });
    });
  }
}

// Banner display
function showBanner(): void {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                     🤖 Terminal RAG System                   ║
║                  Retrieval-Augmented Generation              ║
║                      Interactive Terminal                    ║
╚══════════════════════════════════════════════════════════════╝
  `);
}

// Main execution
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  // Handle command line arguments
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Terminal RAG System - Interactive RAG in your terminal

Usage: npx tsx src/terminal-rag.ts [options]

Options:
  --help, -h     Show this help message
  --no-banner    Skip the welcome banner

Features:
  - Interactive document management
  - Real-time querying with AI
  - File and URL processing
  - Terminal-based interface
  - Full CRUD operations

Commands available in interactive mode:
  add, query, file, url, list, stats, search, delete, export, help, exit

Examples:
  npx tsx src/terminal-rag.ts
  npx tsx src/terminal-rag.ts --no-banner
    `);
    return;
  }

  // Show banner unless disabled
  if (!args.includes('--no-banner')) {
    showBanner();
  }

  // Start the terminal RAG system
  const terminalRAG = new TerminalRAG();
  await terminalRAG.start();
}

// Run if called directly
import { fileURLToPath } from 'url';

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

export { TerminalRAG }; 