import 'dotenv/config';
import {
  VectorStoreIndex,
  Document,
  Settings,
} from 'llamaindex';
import { Gemini, GEMINI_MODEL, GeminiEmbedding, GEMINI_EMBEDDING_MODEL } from '@llamaindex/google';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as readline from 'readline';
import { v4 as uuidv4 } from 'uuid';

// Data structure for user documents
interface UserDocument {
  id: string;
  title: string;
  content: string;
  source: string;
  metadata: {
    addedDate: Date;
    tags: string[];
    category: string;
    author?: string;
  };
}

// RAG configuration
interface RAGConfig {
  dataDirectory: string;
  vectorStoreDirectory: string;
  documentsFile: string;
  maxDocuments: number;
  autoSave: boolean;
}

class DynamicRAG {
  private vectorIndex: VectorStoreIndex | null = null;
  private queryEngine: any = null;
  private documents: UserDocument[] = [];
  private config: RAGConfig;
  private rl: readline.Interface;
  private isInitialized = false;

  constructor(config: Partial<RAGConfig> = {}) {
    this.config = {
      dataDirectory: './rag-data',
      vectorStoreDirectory: './rag-vector-store',
      documentsFile: 'user-documents.json',
      maxDocuments: 1000,
      autoSave: true,
      ...config
    };

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  // Initialize RAG system
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🚀 Initializing Dynamic RAG System...');

    // Setup LlamaIndex with Gemini
    await this.setupLlamaIndex();

    // Create directories
    await this.createDirectories();

    // Load existing data
    await this.loadExistingData();

    // Initialize or load vector store
    await this.initializeVectorStore();

    this.isInitialized = true;
    console.log('✅ Dynamic RAG System initialized!');
    console.log(`📊 Current documents: ${this.documents.length}`);
  }

  private async setupLlamaIndex(): Promise<void> {
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY environment variable is required');
    }

    Settings.llm = new Gemini({
      model: GEMINI_MODEL.GEMINI_PRO_1_5_FLASH_LATEST,
      apiKey: process.env.GOOGLE_API_KEY,
    });

    Settings.embedModel = new GeminiEmbedding({
      model: GEMINI_EMBEDDING_MODEL.EMBEDDING_001,
      apiKey: process.env.GOOGLE_API_KEY,
    });
  }

  private async createDirectories(): Promise<void> {
    await fs.mkdir(this.config.dataDirectory, { recursive: true });
    await fs.mkdir(this.config.vectorStoreDirectory, { recursive: true });
  }

  private async loadExistingData(): Promise<void> {
    const documentsPath = path.join(this.config.dataDirectory, this.config.documentsFile);
    
    try {
      const data = await fs.readFile(documentsPath, 'utf-8');
      this.documents = JSON.parse(data);
      console.log(`📚 Loaded ${this.documents.length} existing documents`);
    } catch (error) {
      console.log('📝 No existing documents found, starting fresh');
      this.documents = [];
    }
  }

  private async saveDocuments(): Promise<void> {
    const documentsPath = path.join(this.config.dataDirectory, this.config.documentsFile);
    await fs.writeFile(documentsPath, JSON.stringify(this.documents, null, 2));
  }

  private async initializeVectorStore(): Promise<void> {
    try {
      // Create new vector store (simplified for compatibility)
      this.vectorIndex = await VectorStoreIndex.fromDocuments([]);
      console.log('🆕 Created new vector store');
    } catch (error) {
      console.error('Error initializing vector store:', error);
      throw error;
    }

    // If we have documents, rebuild the vector store
    if (this.documents.length > 0) {
      await this.rebuildVectorStore();
    }

    this.queryEngine = this.vectorIndex!.asQueryEngine();
  }

  // Add new document to RAG
  async addDocument(content: string, metadata: {
    title: string;
    source: string;
    tags?: string[];
    category?: string;
    author?: string;
  }): Promise<string> {
    const document: UserDocument = {
      id: uuidv4(),
      title: metadata.title,
      content: content,
      source: metadata.source,
      metadata: {
        addedDate: new Date(),
        tags: metadata.tags || [],
        category: metadata.category || 'general',
        author: metadata.author
      }
    };

    this.documents.push(document);

    // Save to file
    await this.saveDocumentToFile(document);

    // Update vector store
    await this.updateVectorStore(document);

    // Save document metadata
    if (this.config.autoSave) {
      await this.saveDocuments();
    }

    console.log(`✅ Added document: "${document.title}" (ID: ${document.id})`);
    return document.id;
  }

  private async saveDocumentToFile(document: UserDocument): Promise<void> {
    const filename = `${document.id}.txt`;
    const filepath = path.join(this.config.dataDirectory, filename);
    
    const content = `Title: ${document.title}
Source: ${document.source}
Category: ${document.metadata.category}
Tags: ${document.metadata.tags.join(', ')}
Added: ${document.metadata.addedDate.toISOString()}
${document.metadata.author ? `Author: ${document.metadata.author}` : ''}

${document.content}`;

    await fs.writeFile(filepath, content);
  }

  private async updateVectorStore(document: UserDocument): Promise<void> {
    if (!this.vectorIndex) return;

    const llamaDocument = new Document({
      text: document.content,
      metadata: {
        id: document.id,
        title: document.title,
        source: document.source,
        category: document.metadata.category,
        tags: document.metadata.tags.join(', '),
        addedDate: document.metadata.addedDate.toISOString(),
        author: document.metadata.author || ''
      }
    });

    // Add to index
    await this.vectorIndex.insert(llamaDocument);
    
    // Update query engine
    this.queryEngine = this.vectorIndex.asQueryEngine();
    
    // Persist the updated index
    await this.persistVectorStore();
  }

  private async persistVectorStore(): Promise<void> {
    if (!this.vectorIndex) return;
    
    // Vector store persistence is handled automatically by LlamaIndex
    // This method is kept for future enhancement
    console.log('🔄 Vector store updated');
  }

  private async rebuildVectorStore(): Promise<void> {
    console.log('🔄 Rebuilding vector store...');
    
    const llamaDocuments = this.documents.map(doc => new Document({
      text: doc.content,
      metadata: {
        id: doc.id,
        title: doc.title,
        source: doc.source,
        category: doc.metadata.category,
        tags: doc.metadata.tags.join(', '),
        addedDate: doc.metadata.addedDate.toISOString(),
        author: doc.metadata.author || ''
      }
    }));

    this.vectorIndex = await VectorStoreIndex.fromDocuments(llamaDocuments);
    this.queryEngine = this.vectorIndex.asQueryEngine();
    await this.persistVectorStore();
    
    console.log('✅ Vector store rebuilt');
  }

  // Query the RAG system
  async query(question: string, options: {
    includeMetadata?: boolean;
    maxResults?: number;
    category?: string;
    tags?: string[];
  } = {}): Promise<{
    response: string;
    sources: any[];
    metadata?: any;
  }> {
    if (!this.queryEngine) {
      throw new Error('RAG system not initialized');
    }

    if (this.documents.length === 0) {
      return {
        response: "I don't have any documents to search through yet. Please add some documents first using the 'add' command.",
        sources: [],
        metadata: { totalDocuments: 0 }
      };
    }

    try {
      const response = await this.queryEngine.query({ query: question });
      
      // Extract source information
      const sources = response.sourceNodes || [];
      
      return {
        response: response.response,
        sources: sources.map((source: any) => ({
          id: source.node?.metadata?.id,
          title: source.node?.metadata?.title,
          source: source.node?.metadata?.source,
          category: source.node?.metadata?.category,
          score: source.score
        })),
        metadata: options.includeMetadata ? {
          totalDocuments: this.documents.length,
          queryTime: new Date().toISOString(),
          categories: this.getCategories(),
          tags: this.getAllTags()
        } : undefined
      };
    } catch (error) {
      console.error('Query error:', error);
      throw error;
    }
  }

  // Add document from URL
  async addDocumentFromURL(url: string, title?: string): Promise<string> {
    try {
      // Simple URL content fetching (in real implementation, use proper web scraping)
      const response = await fetch(url);
      const content = await response.text();
      
      // Extract text content (simplified - in real implementation, use proper HTML parsing)
      const textContent = content.replace(/<[^>]*>/g, '').trim();
      
      return await this.addDocument(textContent, {
        title: title || `Document from ${url}`,
        source: url,
        category: 'web-content',
        tags: ['web', 'external']
      });
    } catch (error) {
      console.error('Error fetching URL:', error);
      throw error;
    }
  }

  // Add document from file
  async addDocumentFromFile(filePath: string, title?: string): Promise<string> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const filename = path.basename(filePath);
      
      return await this.addDocument(content, {
        title: title || filename,
        source: filePath,
        category: 'file',
        tags: ['file', path.extname(filePath).slice(1)]
      });
    } catch (error) {
      console.error('Error reading file:', error);
      throw error;
    }
  }

  // List all documents
  listDocuments(options: {
    category?: string;
    tags?: string[];
    limit?: number;
  } = {}): UserDocument[] {
    let filtered = this.documents;

    if (options.category) {
      filtered = filtered.filter(doc => doc.metadata.category === options.category);
    }

    if (options.tags && options.tags.length > 0) {
      filtered = filtered.filter(doc => 
        options.tags!.some(tag => doc.metadata.tags.includes(tag))
      );
    }

    if (options.limit) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered;
  }

  // Delete document
  async deleteDocument(id: string): Promise<boolean> {
    const index = this.documents.findIndex(doc => doc.id === id);
    if (index === -1) return false;

    // Remove from documents array
    this.documents.splice(index, 1);

    // Delete file
    try {
      const filename = `${id}.txt`;
      const filepath = path.join(this.config.dataDirectory, filename);
      await fs.unlink(filepath);
    } catch (error) {
      console.warn('Could not delete document file:', error);
    }

    // Rebuild vector store
    await this.rebuildVectorStore();

    // Save documents
    if (this.config.autoSave) {
      await this.saveDocuments();
    }

    return true;
  }

  // Get statistics
  getStats(): {
    totalDocuments: number;
    categories: { [key: string]: number };
    tags: { [key: string]: number };
    sources: { [key: string]: number };
    recentDocuments: number;
  } {
    const categories: { [key: string]: number } = {};
    const tags: { [key: string]: number } = {};
    const sources: { [key: string]: number } = {};
    
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    let recentDocuments = 0;

    this.documents.forEach(doc => {
      // Categories
      categories[doc.metadata.category] = (categories[doc.metadata.category] || 0) + 1;
      
      // Tags
      doc.metadata.tags.forEach(tag => {
        tags[tag] = (tags[tag] || 0) + 1;
      });
      
      // Sources
      const sourceType = doc.source.startsWith('http') ? 'web' : 'file';
      sources[sourceType] = (sources[sourceType] || 0) + 1;
      
      // Recent documents
      if (new Date(doc.metadata.addedDate) > oneWeekAgo) {
        recentDocuments++;
      }
    });

    return {
      totalDocuments: this.documents.length,
      categories,
      tags,
      sources,
      recentDocuments
    };
  }

  private getCategories(): string[] {
    return [...new Set(this.documents.map(doc => doc.metadata.category))];
  }

  private getAllTags(): string[] {
    const allTags = this.documents.flatMap(doc => doc.metadata.tags);
    return [...new Set(allTags)];
  }

  // Interactive CLI interface
  async startInteractiveCLI(): Promise<void> {
    await this.initialize();
    
    console.log('\n🎯 Dynamic RAG Interactive Interface');
    console.log('Available commands:');
    console.log('  add <content> - Add new document');
    console.log('  file <path> - Add document from file');
    console.log('  url <url> - Add document from URL');
    console.log('  query <question> - Query the RAG system');
    console.log('  list - List all documents');
    console.log('  stats - Show statistics');
    console.log('  delete <id> - Delete document');
    console.log('  help - Show this help');
    console.log('  exit - Exit the system\n');

    while (true) {
      try {
        const input = await this.askQuestion('RAG> ');
        const [command, ...args] = input.split(' ');

        switch (command.toLowerCase()) {
          case 'add':
            await this.handleAddCommand(args.join(' '));
            break;
          case 'file':
            await this.handleFileCommand(args[0]);
            break;
          case 'url':
            await this.handleUrlCommand(args[0]);
            break;
          case 'query':
            await this.handleQueryCommand(args.join(' '));
            break;
          case 'list':
            this.handleListCommand();
            break;
          case 'stats':
            this.handleStatsCommand();
            break;
          case 'delete':
            await this.handleDeleteCommand(args[0]);
            break;
          case 'help':
            this.showHelp();
            break;
          case 'exit':
          case 'quit':
            console.log('👋 Goodbye!');
            this.rl.close();
            return;
          default:
            console.log('❌ Unknown command. Type "help" for available commands.');
        }
      } catch (error) {
        console.error('❌ Error:', error);
      }
    }
  }

  private askQuestion(question: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  private async handleAddCommand(content: string): Promise<void> {
    if (!content) {
      console.log('❌ Please provide content to add');
      return;
    }

    const title = await this.askQuestion('Title: ');
    const source = await this.askQuestion('Source (optional): ') || 'manual-input';
    const category = await this.askQuestion('Category (optional): ') || 'general';
    const tagsInput = await this.askQuestion('Tags (comma-separated, optional): ');
    const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()) : [];

    const id = await this.addDocument(content, {
      title: title || 'Untitled',
      source,
      category,
      tags
    });

    console.log(`✅ Document added with ID: ${id}`);
  }

  private async handleFileCommand(filePath: string): Promise<void> {
    if (!filePath) {
      console.log('❌ Please provide a file path');
      return;
    }

    try {
      const title = await this.askQuestion('Title (optional): ');
      const id = await this.addDocumentFromFile(filePath, title || undefined);
      console.log(`✅ Document added from file with ID: ${id}`);
    } catch (error) {
      console.log('❌ Error adding document from file:', error);
    }
  }

  private async handleUrlCommand(url: string): Promise<void> {
    if (!url) {
      console.log('❌ Please provide a URL');
      return;
    }

    try {
      console.log('🔄 Fetching content from URL...');
      const title = await this.askQuestion('Title (optional): ');
      const id = await this.addDocumentFromURL(url, title || undefined);
      console.log(`✅ Document added from URL with ID: ${id}`);
    } catch (error) {
      console.log('❌ Error adding document from URL:', error);
    }
  }

  private async handleQueryCommand(question: string): Promise<void> {
    if (!question) {
      console.log('❌ Please provide a question');
      return;
    }

    try {
      console.log('🔍 Searching...');
      const result = await this.query(question, { includeMetadata: true });
      
      console.log('\n📝 Response:');
      console.log(result.response);
      
      if (result.sources.length > 0) {
        console.log('\n📚 Sources:');
        result.sources.forEach((source, index) => {
          console.log(`  ${index + 1}. ${source.title} (${source.source})`);
        });
      }
      
      console.log('');
    } catch (error) {
      console.log('❌ Error querying:', error);
    }
  }

  private handleListCommand(): void {
    const docs = this.listDocuments({ limit: 10 });
    
    if (docs.length === 0) {
      console.log('📭 No documents found');
      return;
    }

    console.log('\n📚 Documents:');
    docs.forEach((doc, index) => {
      console.log(`  ${index + 1}. ${doc.title} (ID: ${doc.id})`);
      console.log(`     Category: ${doc.metadata.category}, Tags: ${doc.metadata.tags.join(', ')}`);
      console.log(`     Added: ${new Date(doc.metadata.addedDate).toLocaleDateString()}`);
    });
    
    if (this.documents.length > 10) {
      console.log(`\n... and ${this.documents.length - 10} more documents`);
    }
    console.log('');
  }

  private handleStatsCommand(): void {
    const stats = this.getStats();
    
    console.log('\n📊 RAG Statistics:');
    console.log(`Total Documents: ${stats.totalDocuments}`);
    console.log(`Recent Documents (last 7 days): ${stats.recentDocuments}`);
    
    console.log('\nCategories:');
    Object.entries(stats.categories).forEach(([category, count]) => {
      console.log(`  ${category}: ${count}`);
    });
    
    console.log('\nTop Tags:');
    Object.entries(stats.tags)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .forEach(([tag, count]) => {
        console.log(`  ${tag}: ${count}`);
      });
    
    console.log('\nSources:');
    Object.entries(stats.sources).forEach(([source, count]) => {
      console.log(`  ${source}: ${count}`);
    });
    
    console.log('');
  }

  private async handleDeleteCommand(id: string): Promise<void> {
    if (!id) {
      console.log('❌ Please provide a document ID');
      return;
    }

    const doc = this.documents.find(d => d.id === id);
    if (!doc) {
      console.log('❌ Document not found');
      return;
    }

    console.log(`Are you sure you want to delete "${doc.title}"? (y/N)`);
    const confirmation = await this.askQuestion('');
    
    if (confirmation.toLowerCase() === 'y') {
      const deleted = await this.deleteDocument(id);
      if (deleted) {
        console.log('✅ Document deleted successfully');
      } else {
        console.log('❌ Failed to delete document');
      }
    } else {
      console.log('❌ Deletion cancelled');
    }
  }

  private showHelp(): void {
    console.log('\n🎯 Dynamic RAG Commands:');
    console.log('  add <content> - Add new document with content');
    console.log('  file <path> - Add document from file');
    console.log('  url <url> - Add document from URL');
    console.log('  query <question> - Query the RAG system');
    console.log('  list - List all documents (first 10)');
    console.log('  stats - Show RAG statistics');
    console.log('  delete <id> - Delete document by ID');
    console.log('  help - Show this help message');
    console.log('  exit - Exit the system\n');
  }

  // Export data
  async exportData(): Promise<string> {
    const exportData = {
      documents: this.documents,
      stats: this.getStats(),
      exportDate: new Date().toISOString()
    };

    const exportPath = path.join(this.config.dataDirectory, `export-${Date.now()}.json`);
    await fs.writeFile(exportPath, JSON.stringify(exportData, null, 2));
    
    return exportPath;
  }

  // Import data
  async importData(filePath: string): Promise<void> {
    try {
      const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));
      
      if (data.documents && Array.isArray(data.documents)) {
        this.documents = data.documents;
        await this.saveDocuments();
        await this.rebuildVectorStore();
        console.log(`✅ Imported ${this.documents.length} documents`);
      } else {
        throw new Error('Invalid import file format');
      }
    } catch (error) {
      console.error('❌ Error importing data:', error);
      throw error;
    }
  }
}

export { DynamicRAG, type UserDocument, type RAGConfig }; 