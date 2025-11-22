# Dynamic RAG System

A **Retrieval-Augmented Generation (RAG)** implementation that starts with empty data and grows dynamically as users add documents. Built with TypeScript, LlamaIndex, and Google Gemini.

## Features

- **AI Career Coach**: BPO-to-tech transition coaching with intelligent memory
- **Dynamic Knowledge Base**: Start empty, add documents on-demand
- **Multiple Input Methods**: Text, files, URLs, batch processing
- **Smart Processing**: Supports TXT, JSON, CSV, Markdown
- **Vector Store**: Persistent storage with automatic indexing
- **Context-Aware Queries**: Responses with source attribution

## Installation

```bash
npm install
```

Set up environment variables:
```bash
# Create .env file and add:
GOOGLE_API_KEY=your_gemini_api_key_here
```

## Quick Start

### Option 1: Career Coach (Recommended)
```bash
npm run coach

# Commands:
🤖 Coach> assess                    # Skills assessment
🤖 Coach> explore                   # Career paths
🤖 Coach> save <note>               # Save notes
🤖 Coach> remember <query>           # Search knowledge
```

### Option 2: Terminal RAG
```bash
npm run rag

# Commands:
🤖 RAG> add "Your content here"
🤖 RAG> What is machine learning?
🤖 RAG> file ./document.txt
```

### Option 3: CLI
```bash
# Initialize
npx tsx src/rag-cli.ts init

# Add document
npx tsx src/rag-cli.ts add "Content" --title "Title" --category "tech"

# Query
npx tsx src/rag-cli.ts query "Your question"
```

## Usage

### Programmatic API
```typescript
import { DynamicRAG } from './src/dynamic-rag';

const rag = new DynamicRAG({
  dataDirectory: './rag-data',
  vectorStoreDirectory: './vector-store',
  autoSave: true
});

await rag.initialize();
const id = await rag.addDocument("Content", { title: "Title" });
const result = await rag.query("Question");
```

### CLI Commands
- `init` - Initialize system
- `add <content>` - Add document
- `query <question>` - Query knowledge base
- `list` - List documents
- `stats` - Show statistics
- `export/import` - Data management

## Project Structure

```
src/
├── dynamic-rag.ts           # Main RAG implementation
├── career-coach.ts          # AI career coaching
├── coach-rag-integrated.ts  # Integrated coach + RAG
├── rag-cli.ts               # CLI interface
└── ...

data/                        # Sample documents
```

## Configuration

**Environment Variables:**
```env
GOOGLE_API_KEY=your_key_here
```

**Supported File Types:** TXT, JSON, CSV, Markdown, Web URLs

## Troubleshooting

- **API Key not set**: Add `GOOGLE_API_KEY` to `.env`
- **Vector store issues**: Run `npx tsx src/rag-cli.ts clean`
- **Slow queries**: Reduce max results or use category filtering

## License

MIT License

## Acknowledgments

- LlamaIndex for RAG framework
- Google Gemini for AI capabilities
