# Dynamic RAG System

A comprehensive **Retrieval-Augmented Generation (RAG)** implementation that starts with empty data and grows dynamically as users add documents. Built with TypeScript and integrated with Google's Gemini AI through LlamaIndex.

## 🚀 Features

### 🎓 Integrated Coach + RAG System
- **AI Career Coach**: Specialized BPO-to-tech transition coaching
- **Intelligent Memory**: RAG supplements coaching with personal context
- **Auto-Learning**: Automatically saves insights from conversations
- **Context-Aware Responses**: Every answer considers your journey
- **Progress Tracking**: See your growth over time
- **Personalized Guidance**: Adapts to your specific background and goals

### Core RAG Capabilities
- **Dynamic Document Growth**: Start with empty knowledge base and add documents on-demand
- **Multiple Input Methods**: Text, files, URLs, and batch processing
- **Smart Document Processing**: Supports TXT, JSON, CSV, and Markdown files
- **Vector Store Management**: Persistent storage with automatic indexing
- **Intelligent Querying**: Context-aware responses with source attribution

### Advanced Features
- **Content Enrichment**: Automatic keyword extraction and summarization
- **Document Management**: Full CRUD operations with metadata support
- **Web Scraping**: Add content directly from URLs
- **Interactive CLI**: User-friendly command-line interface
- **Batch Operations**: Process multiple documents efficiently
- **Export/Import**: Data portability and backup capabilities

### Input Methods (As Requested)
- **🖥️ Terminal Interface**: Real-time interactive terminal with auto-complete
- **Console Input**: Interactive terminal prompts with readline
- **File Input**: Process various file types automatically
- **Function Parameters**: Type-safe API with comprehensive options
- **Command Line Arguments**: Full CLI support
- **Web Content**: Fetch and process URLs
- **Batch Processing**: Handle multiple inputs simultaneously

## 🛠️ Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your GOOGLE_API_KEY
```

## 🎯 Quick Start

### 🎓 **Option 1: Integrated Coach + RAG (Recommended)**

```bash
# Start AI career coach with intelligent memory
npm run coach

# Interactive coaching with context-aware responses:
🤖 Coach> assess                    # Skills assessment
🤖 Coach> explore                   # Career path exploration  
🤖 Coach> save Met mentor at meetup # Save important notes
🤖 Coach> remember python course    # Search your knowledge
🤖 Coach> How do I prepare for QA interviews? # Context-aware chat
```

### 🖥️ **Option 2: Terminal RAG Interface**

```bash
# Start interactive terminal RAG system
npm run rag

# Then use commands like:
🤖 RAG> add "Machine learning is a subset of AI"
🤖 RAG> What is machine learning?
🤖 RAG> file ./my-document.txt
🤖 RAG> help
🤖 RAG> exit
```

### ⚡ **Option 3: Command Line Interface**

#### 1. Initialize the RAG System
```bash
npx tsx src/rag-cli.ts init
```

#### 2. Add Your First Document
```bash
# Add a simple document
npx tsx src/rag-cli.ts add "Machine learning is a subset of AI that focuses on algorithms that learn from data." --title "ML Introduction" --category "ai"

# Add a document from file
npx tsx src/rag-cli.ts add-file ./my-document.txt --title "My Document"

# Add content from URL
npx tsx src/rag-cli.ts add-url https://example.com/article --title "Web Article"
```

#### 3. Query Your Knowledge Base
```bash
# Ask questions
npx tsx src/rag-cli.ts query "What is machine learning?"

# Get detailed results
npx tsx src/rag-cli.ts query "Explain AI concepts" --max-results 3
```

## 📚 Usage Examples

### 🎓 Integrated Coach + RAG Workflow

```bash
# Launch integrated coach
npm run coach

# First session - Assessment & Planning
🤖 Coach> assess
# → Skills assessment generated and auto-saved

🤖 Coach> explore  
# → Career paths explored, guidance saved

🤖 Coach> save Goal: Get QA job at Accenture within 6 months
# → Manual milestone saved

# Later sessions - Progress tracking
🤖 Coach> remember QA career
# → Retrieves all QA-related conversations and notes

🤖 Coach> I completed the Selenium course, what's next?
# → Context-aware response using your learning history

🤖 Coach> progress
# → Shows complete journey overview
```

### 🖥️ Terminal RAG Workflow

```bash
# Launch terminal RAG
npm run rag

# Add knowledge
🤖 RAG> add "Python is great for automation testing"
🤖 RAG> file ./study-notes.txt
🤖 RAG> url https://selenium.dev/documentation

# Query knowledge
🤖 RAG> What's the best language for automation testing?
🤖 RAG> search selenium
🤖 RAG> stats
```

### Programmatic Usage

```typescript
import { DynamicRAG } from './src/dynamic-rag';

const rag = new DynamicRAG({
  dataDirectory: './my-rag-data',
  vectorStoreDirectory: './my-vector-store',
  documentsFile: 'documents.json',
  maxDocuments: 1000,
  autoSave: true
});

// Initialize
await rag.initialize();

// Add documents
const id1 = await rag.addDocument("Your content here", {
  title: "Document Title",
  source: "manual-input",
  category: "general",
  tags: ["tag1", "tag2"]
});

// Query
const result = await rag.query("Your question here", {
  includeMetadata: true,
  maxResults: 5
});

console.log(result.response);
console.log(result.sources);
```

### CLI Usage

```bash
# Initialize system
npx tsx src/rag-cli.ts init

# Add documents
npx tsx src/rag-cli.ts add "Content here" --title "Title" --category "tech"
npx tsx src/rag-cli.ts bulk-add ./documents/ --pattern "*.md"

# Query system
npx tsx src/rag-cli.ts query "What is TypeScript?"
npx tsx src/rag-cli.ts search --category "tech" --limit 10

# Manage documents
npx tsx src/rag-cli.ts list --limit 20
npx tsx src/rag-cli.ts stats
npx tsx src/rag-cli.ts delete doc-id --force

# Data management
npx tsx src/rag-cli.ts export
npx tsx src/rag-cli.ts import backup-file.json
npx tsx src/rag-cli.ts backup
```

## 🔧 Command Reference

### Core Commands
- `init` - Initialize the RAG system
- `add <content>` - Add a document with content
- `bulk-add <directory>` - Add multiple documents from a directory
- `query <question>` - Query the RAG system
- `search` - Search documents by metadata
- `list` - List all documents
- `stats` - Show system statistics
- `delete <id>` - Delete a document
- `interactive` - Start interactive mode

### Data Management
- `export` - Export all data to JSON
- `import <file>` - Import data from JSON file
- `backup` - Create a backup
- `clean` - Clean and rebuild vector store

### Options
- `--title "Title"` - Set document title
- `--source "Source"` - Set document source
- `--category "Category"` - Set document category
- `--tags "tag1,tag2"` - Set document tags
- `--max-results <n>` - Maximum results for queries
- `--pattern "*.txt"` - File pattern for bulk operations
- `--limit <n>` - Limit number of results
- `--force` - Skip confirmations

## 🧪 Demo & Testing

### Terminal Interface (Recommended)
```bash
# Start interactive terminal RAG
npm run rag

# See comprehensive terminal guide
# Check TERMINAL-GUIDE.md for complete documentation
```

### Run Full Demo
```bash
# Complete feature demonstration
npx tsx src/rag-demo.ts

# Quick test
npx tsx src/rag-demo.ts quick

# Interactive demo
npx tsx src/rag-demo.ts interactive
```

### Test Input Methods
```bash
# Interactive terminal interface (recommended)
npm run rag

# Test all input methods
npx tsx src/input-demo.ts

# Quick input test
npx tsx src/input-demo.ts --quick

# Interactive input test
npx tsx src/input-demo.ts --interactive
```

## 📁 Project Structure

```
src/
├── dynamic-rag.ts                # Main RAG implementation
├── terminal-rag.ts               # Terminal-based interactive interface
├── career-coach.ts               # AI career coaching system
├── coach-rag-integrated.ts       # Integrated coach + RAG system
├── rag.ts                        # Terminal launcher script
├── rag-cli.ts                    # Command-line interface
├── rag-demo.ts                   # Comprehensive demo
├── rag-processors.ts             # Document processors & web scraping
├── input-demo.ts                 # Input methods demo
└── index.ts                      # Original LlamaIndex setup

data/
├── rag-data.json                 # RAG system documents
└── sample_document.txt           # Sample document

# Generated directories (created when used)
coach-user-data/[user-name]/      # User-specific coaching data
coach-vector-store/[user-name]/   # User-specific vector stores
vector-store/                     # General RAG vector store
rag-data/                         # General RAG documents

# Documentation
COACH-RAG-INTEGRATION.md          # Detailed integration guide
TERMINAL-GUIDE.md                 # Terminal RAG guide
README.md                         # This file
```

## 🎛️ Configuration

### Environment Variables
```env
GOOGLE_API_KEY=your_gemini_api_key_here
NODE_ENV=development
```

### Config File (rag-config.json)
```json
{
  "dataDirectory": "./rag-data",
  "vectorStoreDirectory": "./rag-vector-store",
  "documentsFile": "user-documents.json",
  "maxDocuments": 1000,
  "autoSave": true,
  "searchOptions": {
    "defaultMaxResults": 5,
    "defaultTemperature": 0.7,
    "similarityThreshold": 0.7
  }
}
```

## 🔍 Supported File Types

- **Text Files** (.txt): Plain text documents
- **Markdown** (.md): Markdown with heading extraction
- **JSON** (.json): Structured data with searchable text conversion
- **CSV** (.csv): Tabular data with column-based search
- **Web Content**: URLs with HTML-to-text conversion

## 🎯 Key Features Implemented

### 1. **Dynamic Growth** ✅
- Starts with empty knowledge base
- Grows as users add documents
- Automatic vector store updates

### 2. **Multiple Input Methods** ✅
- Console input with readline
- File processing (multiple formats)
- Function parameters (type-safe)
- Command-line arguments
- Web scraping capabilities
- Batch processing

### 3. **Content Processing** ✅
- Document processors for different file types
- Content enrichment (keywords, summaries)
- Content validation and deduplication
- Metadata extraction and management

### 4. **Advanced RAG Features** ✅
- Vector store persistence
- Incremental indexing
- Source attribution
- Category and tag filtering
- Statistics and analytics

### 5. **User Experience** ✅
- Interactive CLI interface
- Comprehensive command-line tools
- Progress indicators and feedback
- Error handling and validation

## 🚀 Advanced Usage

### Custom Document Processing
```typescript
import { DocumentProcessor, ContentEnricher } from './src/rag-processors';

// Process a specific file type
const result = await DocumentProcessor.processFile('./document.json');

// Enrich content with metadata
const enriched = ContentEnricher.enhanceDocument(content);
```

### Web Scraping
```typescript
import { WebScraper } from './src/rag-processors';

// Scrape single URL
const result = await WebScraper.scrapeUrl('https://example.com');

// Scrape multiple URLs
const results = await WebScraper.scrapeUrls(['url1', 'url2']);
```

### Content Validation
```typescript
import { ContentValidator } from './src/rag-processors';

// Validate content
const isValid = ContentValidator.isValidContent(content);

// Check for duplicates
const isDupe = ContentValidator.isDuplicate(content, existingContents);
```

## 🛡️ Error Handling

The system includes comprehensive error handling:
- **File Processing**: Graceful handling of corrupted or unsupported files
- **Network Errors**: Retry mechanisms for web scraping
- **Vector Store**: Automatic recovery and rebuilding
- **API Limits**: Rate limiting and quota management
- **Validation**: Input validation with clear error messages

## 📊 Performance Considerations

- **Incremental Indexing**: Only new documents are processed
- **Batch Processing**: Efficient handling of multiple documents
- **Memory Management**: Streaming for large files
- **Caching**: Vector store persistence reduces rebuild time
- **Lazy Loading**: Documents loaded on-demand

## 🔄 Data Management

### Export Data
```bash
npx tsx src/rag-cli.ts export
# Creates: ./rag-data/export-[timestamp].json
```

### Import Data
```bash
npx tsx src/rag-cli.ts import exported-data.json
# Restores all documents and rebuilds vector store
```

### Backup Strategy
```bash
npx tsx src/rag-cli.ts backup
# Creates backup with timestamp
```

## 🐛 Troubleshooting

### Common Issues

1. **GOOGLE_API_KEY not set**
   ```bash
   export GOOGLE_API_KEY=your_api_key_here
   ```

2. **Vector store corruption**
   ```bash
   npx tsx src/rag-cli.ts clean
   ```

3. **Memory issues with large files**
   - Use batch processing
   - Process files individually
   - Increase Node.js memory limit

4. **Slow queries**
   - Reduce max results
   - Use category filtering
   - Rebuild vector store

## 📈 Future Enhancements

- **Multi-language support**
- **Advanced file type support (PDF, DOCX)**
- **Web UI interface**
- **Collaborative features**
- **Advanced analytics**
- **Custom model integration**

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **LlamaIndex** for the RAG framework
- **Google Gemini** for AI capabilities
- **TypeScript** for type safety
- **Node.js** for runtime environment

---

## 🎉 Getting Started Checklist

- [ ] Clone the repository
- [ ] Install dependencies (`npm install`)
- [ ] Set up environment variables
- [ ] Run the demo (`npx tsx src/rag-demo.ts`)
- [ ] Initialize your RAG system (`npx tsx src/rag-cli.ts init`)
- [ ] Add your first document
- [ ] Start querying your knowledge base!

**Happy RAG-ing!** 🚀 