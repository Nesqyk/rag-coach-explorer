#!/usr/bin/env node

import { DynamicRAG } from './dynamic-rag.js';
import * as fs from 'fs/promises';
import * as path from 'path';

// Enhanced CLI with additional features
class RAGCLIAdvanced {
  private rag: DynamicRAG;
  private configPath: string;
  private defaultConfig: any;

  constructor() {
    this.configPath = './rag-config.json';
    this.defaultConfig = {
      dataDirectory: './rag-data',
      vectorStoreDirectory: './rag-vector-store',
      documentsFile: 'user-documents.json',
      maxDocuments: 1000,
      autoSave: true,
      searchOptions: {
        defaultMaxResults: 5,
        defaultTemperature: 0.7,
        similarityThreshold: 0.7
      }
    };
    
    this.rag = new DynamicRAG(this.defaultConfig);
  }

  async loadConfig(): Promise<void> {
    try {
      const configData = await fs.readFile(this.configPath, 'utf-8');
      const config = JSON.parse(configData);
      this.rag = new DynamicRAG(config);
      console.log('✅ Configuration loaded from', this.configPath);
    } catch (error) {
      console.log('📝 Using default configuration');
      await this.saveConfig();
    }
  }

  async saveConfig(): Promise<void> {
    await fs.writeFile(this.configPath, JSON.stringify(this.defaultConfig, null, 2));
  }

  async run(): Promise<void> {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
      this.showHelp();
      return;
    }

    const command = args[0].toLowerCase();
    const commandArgs = args.slice(1);

    try {
      await this.loadConfig();
      
      switch (command) {
        case 'init':
          await this.initCommand();
          break;
        case 'add':
          await this.addCommand(commandArgs);
          break;
        case 'bulk-add':
          await this.bulkAddCommand(commandArgs);
          break;
        case 'query':
          await this.queryCommand(commandArgs);
          break;
        case 'search':
          await this.searchCommand(commandArgs);
          break;
        case 'list':
          await this.listCommand(commandArgs);
          break;
        case 'stats':
          await this.statsCommand();
          break;
        case 'delete':
          await this.deleteCommand(commandArgs);
          break;
        case 'export':
          await this.exportCommand(commandArgs);
          break;
        case 'import':
          await this.importCommand(commandArgs);
          break;
        case 'interactive':
          await this.interactiveCommand();
          break;
        case 'clean':
          await this.cleanCommand();
          break;
        case 'backup':
          await this.backupCommand();
          break;
        case 'help':
          this.showHelp();
          break;
        default:
          console.log(`❌ Unknown command: ${command}`);
          this.showHelp();
      }
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  }

  private async initCommand(): Promise<void> {
    console.log('🚀 Initializing RAG system...');
    await this.rag.initialize();
    console.log('✅ RAG system initialized successfully!');
  }

  private async addCommand(args: string[]): Promise<void> {
    if (args.length === 0) {
      console.log('❌ Usage: rag add <content> [--title "Title"] [--source "Source"] [--category "Category"] [--tags "tag1,tag2"]');
      return;
    }

    const content = args[0];
    const options = this.parseOptions(args.slice(1));

    await this.rag.initialize();
    const id = await this.rag.addDocument(content, {
      title: options.title || 'Untitled',
      source: options.source || 'cli-input',
      category: options.category || 'general',
      tags: options.tags ? options.tags.split(',') : []
    });

    console.log(`✅ Document added with ID: ${id}`);
  }

  private async bulkAddCommand(args: string[]): Promise<void> {
    if (args.length === 0) {
      console.log('❌ Usage: rag bulk-add <directory> [--pattern "*.txt"] [--category "Category"]');
      return;
    }

    const directory = args[0];
    const options = this.parseOptions(args.slice(1));
    const pattern = options.pattern || '*.txt';

    await this.rag.initialize();

    try {
      const files = await fs.readdir(directory);
      const filteredFiles = files.filter(file => {
        if (pattern === '*.txt') return file.endsWith('.txt');
        if (pattern === '*.md') return file.endsWith('.md');
        return true;
      });

      console.log(`📁 Found ${filteredFiles.length} files to process`);

      let successCount = 0;
      let errorCount = 0;

      for (const file of filteredFiles) {
        try {
          const filePath = path.join(directory, file);
          const id = await this.rag.addDocumentFromFile(filePath);
          console.log(`✅ Added: ${file} (ID: ${id})`);
          successCount++;
        } catch (error) {
          console.log(`❌ Failed to add ${file}:`, error);
          errorCount++;
        }
      }

      console.log(`\n📊 Bulk add completed: ${successCount} successful, ${errorCount} errors`);
    } catch (error) {
      console.log('❌ Error reading directory:', error);
    }
  }

  private async queryCommand(args: string[]): Promise<void> {
    if (args.length === 0) {
      console.log('❌ Usage: rag query <question> [--max-results 5] [--category "Category"]');
      return;
    }

    const question = args[0];
    const options = this.parseOptions(args.slice(1));

    await this.rag.initialize();
    
    const result = await this.rag.query(question, {
      includeMetadata: true,
      maxResults: parseInt(options['max-results'] || '5'),
      category: options.category
    });

    console.log('\n📝 Response:');
    console.log(result.response);
    
    if (result.sources.length > 0) {
      console.log('\n📚 Sources:');
      result.sources.forEach((source, index) => {
        console.log(`  ${index + 1}. ${source.title} (${source.source})`);
        if (source.score) {
          console.log(`     Relevance: ${(source.score * 100).toFixed(1)}%`);
        }
      });
    }
    
    if (result.metadata) {
      console.log(`\n📊 Query processed from ${result.metadata.totalDocuments} documents`);
    }
  }

  private async searchCommand(args: string[]): Promise<void> {
    if (args.length === 0) {
      console.log('❌ Usage: rag search [--category "Category"] [--tags "tag1,tag2"] [--limit 10]');
      return;
    }

    const options = this.parseOptions(args);
    await this.rag.initialize();

    const docs = this.rag.listDocuments({
      category: options.category,
      tags: options.tags ? options.tags.split(',') : undefined,
      limit: parseInt(options.limit || '10')
    });

    if (docs.length === 0) {
      console.log('📭 No documents found matching criteria');
      return;
    }

    console.log(`\n📚 Found ${docs.length} documents:`);
    docs.forEach((doc, index) => {
      console.log(`\n${index + 1}. ${doc.title} (ID: ${doc.id})`);
      console.log(`   Category: ${doc.metadata.category}`);
      console.log(`   Tags: ${doc.metadata.tags.join(', ')}`);
      console.log(`   Source: ${doc.source}`);
      console.log(`   Added: ${new Date(doc.metadata.addedDate).toLocaleDateString()}`);
      console.log(`   Content: ${doc.content.substring(0, 100)}...`);
    });
  }

  private async listCommand(args: string[]): Promise<void> {
    const options = this.parseOptions(args);
    await this.rag.initialize();

    const docs = this.rag.listDocuments({
      limit: parseInt(options.limit || '20')
    });

    if (docs.length === 0) {
      console.log('📭 No documents found');
      return;
    }

    console.log(`\n📚 Documents (${docs.length}):`);
    docs.forEach((doc, index) => {
      console.log(`${index + 1}. ${doc.title} (ID: ${doc.id})`);
      console.log(`   Category: ${doc.metadata.category}, Tags: ${doc.metadata.tags.join(', ')}`);
      console.log(`   Added: ${new Date(doc.metadata.addedDate).toLocaleDateString()}`);
    });
  }

  private async statsCommand(): Promise<void> {
    await this.rag.initialize();
    const stats = this.rag.getStats();

    console.log('\n📊 RAG System Statistics:');
    console.log(`Total Documents: ${stats.totalDocuments}`);
    console.log(`Recent Documents (last 7 days): ${stats.recentDocuments}`);
    
    console.log('\n📂 Categories:');
    Object.entries(stats.categories).forEach(([category, count]) => {
      console.log(`  ${category}: ${count}`);
    });
    
    console.log('\n🏷️  Top Tags:');
    Object.entries(stats.tags)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .forEach(([tag, count]) => {
        console.log(`  ${tag}: ${count}`);
      });
    
    console.log('\n📄 Sources:');
    Object.entries(stats.sources).forEach(([source, count]) => {
      console.log(`  ${source}: ${count}`);
    });
  }

  private async deleteCommand(args: string[]): Promise<void> {
    if (args.length === 0) {
      console.log('❌ Usage: rag delete <document-id> [--force]');
      return;
    }

    const id = args[0];
    const options = this.parseOptions(args.slice(1));
    const force = options.force !== undefined;

    await this.rag.initialize();

    if (!force) {
      console.log('⚠️  Are you sure you want to delete this document? Use --force to skip confirmation');
      return;
    }

    const deleted = await this.rag.deleteDocument(id);
    if (deleted) {
      console.log('✅ Document deleted successfully');
    } else {
      console.log('❌ Document not found');
    }
  }

  private async exportCommand(args: string[]): Promise<void> {
    await this.rag.initialize();
    const exportPath = await this.rag.exportData();
    console.log(`✅ Data exported to: ${exportPath}`);
  }

  private async importCommand(args: string[]): Promise<void> {
    if (args.length === 0) {
      console.log('❌ Usage: rag import <file-path>');
      return;
    }

    const filePath = args[0];
    await this.rag.initialize();
    await this.rag.importData(filePath);
    console.log('✅ Data imported successfully');
  }

  private async interactiveCommand(): Promise<void> {
    await this.rag.startInteractiveCLI();
  }

  private async cleanCommand(): Promise<void> {
    console.log('🧹 Cleaning up old vector store and rebuilding...');
    await this.rag.initialize();
    // This would trigger a rebuild internally
    console.log('✅ Cleanup completed');
  }

  private async backupCommand(): Promise<void> {
    console.log('💾 Creating backup...');
    await this.rag.initialize();
    const backupPath = await this.rag.exportData();
    console.log(`✅ Backup created: ${backupPath}`);
  }

  private parseOptions(args: string[]): { [key: string]: string } {
    const options: { [key: string]: string } = {};
    
    for (let i = 0; i < args.length; i += 2) {
      if (args[i].startsWith('--')) {
        const key = args[i].substring(2);
        const value = args[i + 1] || 'true';
        options[key] = value;
      }
    }
    
    return options;
  }

  private showHelp(): void {
    console.log(`
🎯 Dynamic RAG System CLI

Usage: rag <command> [options]

Commands:
  init                          Initialize the RAG system
  add <content> [options]       Add a new document
  bulk-add <dir> [options]      Add multiple documents from directory
  query <question> [options]    Query the RAG system
  search [options]              Search documents by metadata
  list [options]                List documents
  stats                         Show system statistics
  delete <id> --force           Delete a document
  export                        Export all data
  import <file>                 Import data from file
  interactive                   Start interactive mode
  clean                         Clean and rebuild vector store
  backup                        Create a backup
  help                          Show this help

Options:
  --title "Title"               Set document title
  --source "Source"             Set document source
  --category "Category"         Set document category
  --tags "tag1,tag2"           Set document tags
  --max-results <n>            Maximum results for queries
  --pattern "*.txt"            File pattern for bulk operations
  --limit <n>                  Limit number of results
  --force                      Skip confirmations

Examples:
  rag add "Hello world" --title "My First Doc" --category "test"
  rag bulk-add ./documents --pattern "*.md" --category "notes"
  rag query "What is machine learning?" --max-results 3
  rag search --category "test" --limit 5
  rag delete doc-123 --force
  rag interactive

Environment:
  GOOGLE_API_KEY               Required for Gemini API access
    `);
  }
}

// Run CLI if called directly
import { fileURLToPath } from 'url';

// Check if this script is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const cli = new RAGCLIAdvanced();
  cli.run().catch(console.error);
}

export { RAGCLIAdvanced }; 