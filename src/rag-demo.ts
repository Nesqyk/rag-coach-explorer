import { DynamicRAG } from './dynamic-rag.js';
import { DocumentProcessor, WebScraper, ContentEnricher, ContentValidator } from './rag-processors.js';
import * as fs from 'fs/promises';
import * as path from 'path';

// Comprehensive RAG Demo
class RAGDemo {
  public rag: DynamicRAG;
  private demoDataDir: string;

  constructor() {
    this.demoDataDir = './demo-data';
    this.rag = new DynamicRAG({
      dataDirectory: './demo-rag-data',
      vectorStoreDirectory: './demo-vector-store',
      documentsFile: 'demo-documents.json',
      maxDocuments: 100,
      autoSave: true
    });
  }

  async runFullDemo(): Promise<void> {
    console.log('🚀 Starting Dynamic RAG System Demo\n');
    
    try {
      // Initialize RAG
      await this.rag.initialize();
      
      // Create demo data
      await this.createDemoData();
      
      // Demo 1: Basic document addition
      await this.demoBasicDocumentAddition();
      
      // Demo 2: File processing
      await this.demoFileProcessing();
      
      // Demo 3: Web scraping (commented out to avoid external dependencies)
      // await this.demoWebScraping();
      
      // Demo 4: Content enrichment
      await this.demoContentEnrichment();
      
      // Demo 5: Querying and retrieval
      await this.demoQuerying();
      
      // Demo 6: Document management
      await this.demoDocumentManagement();
      
      // Demo 7: Advanced features
      await this.demoAdvancedFeatures();
      
      console.log('\n✅ Demo completed successfully!');
      console.log('🎯 You can now use the RAG system for your own documents.');
      
    } catch (error) {
      console.error('❌ Demo failed:', error);
    }
  }

  private async createDemoData(): Promise<void> {
    console.log('📁 Creating demo data...');
    
    // Create demo directory
    await fs.mkdir(this.demoDataDir, { recursive: true });
    
    // Create sample text files
    const textFiles = [
      {
        name: 'machine-learning.txt',
        content: `Machine Learning is a subset of artificial intelligence that focuses on the development of algorithms and statistical models that enable computers to improve their performance on a specific task through experience.

Key concepts in machine learning include:
- Supervised learning: Training with labeled data
- Unsupervised learning: Finding patterns in unlabeled data
- Reinforcement learning: Learning through interaction and feedback
- Deep learning: Using neural networks with multiple layers

Machine learning applications include image recognition, natural language processing, recommendation systems, and predictive analytics.`
      },
      {
        name: 'web-development.txt',
        content: `Web Development is the process of creating websites and web applications for the internet or intranet. It involves several aspects including web design, web content development, client-side scripting, server-side scripting, and network security configuration.

Modern web development typically involves:
- Frontend technologies: HTML, CSS, JavaScript, React, Vue.js
- Backend technologies: Node.js, Python, Java, PHP
- Databases: MySQL, PostgreSQL, MongoDB
- Cloud platforms: AWS, Google Cloud, Azure
- Version control: Git, GitHub

Best practices include responsive design, performance optimization, security measures, and accessibility compliance.`
      },
      {
        name: 'data-science.txt',
        content: `Data Science is an interdisciplinary field that uses scientific methods, processes, algorithms, and systems to extract knowledge and insights from structured and unstructured data.

The data science process typically includes:
1. Data collection and acquisition
2. Data cleaning and preprocessing
3. Exploratory data analysis
4. Feature engineering
5. Model selection and training
6. Model evaluation and validation
7. Deployment and monitoring

Common tools and technologies include Python, R, SQL, Jupyter notebooks, pandas, scikit-learn, TensorFlow, and various visualization libraries.`
      }
    ];
    
    for (const file of textFiles) {
      await fs.writeFile(path.join(this.demoDataDir, file.name), file.content);
    }
    
    // Create sample JSON file
    const jsonData = {
      "technologies": [
        {
          "name": "React",
          "type": "Frontend Framework",
          "language": "JavaScript",
          "popularity": "Very High",
          "description": "A JavaScript library for building user interfaces"
        },
        {
          "name": "Node.js",
          "type": "Backend Runtime",
          "language": "JavaScript",
          "popularity": "High",
          "description": "A JavaScript runtime built on Chrome's V8 engine"
        },
        {
          "name": "Python",
          "type": "Programming Language",
          "language": "Python",
          "popularity": "Very High",
          "description": "A high-level, interpreted programming language"
        }
      ]
    };
    
    await fs.writeFile(
      path.join(this.demoDataDir, 'technologies.json'),
      JSON.stringify(jsonData, null, 2)
    );
    
    // Create sample CSV file
    const csvData = `Name,Position,Department,Experience
John Doe,Senior Developer,Engineering,5
Jane Smith,Data Scientist,Analytics,3
Bob Johnson,Product Manager,Product,7
Alice Brown,UX Designer,Design,4
Charlie Wilson,DevOps Engineer,Engineering,6`;
    
    await fs.writeFile(path.join(this.demoDataDir, 'employees.csv'), csvData);
    
    console.log('✅ Demo data created');
  }

  private async demoBasicDocumentAddition(): Promise<void> {
    console.log('\n🔹 Demo 1: Basic Document Addition');
    
    // Add a simple document
    const id1 = await this.rag.addDocument(
      "TypeScript is a programming language developed by Microsoft that builds on JavaScript by adding static type definitions. It helps catch errors early and provides better tooling support.",
      {
        title: "TypeScript Introduction",
        source: "demo-manual",
        category: "programming",
        tags: ["typescript", "javascript", "programming"]
      }
    );
    
    console.log(`📄 Added document: ${id1}`);
    
    // Add another document
    const id2 = await this.rag.addDocument(
      "Docker is a platform that uses containerization technology to package applications and their dependencies into lightweight, portable containers. This ensures consistent deployment across different environments.",
      {
        title: "Docker Overview",
        source: "demo-manual",
        category: "devops",
        tags: ["docker", "containerization", "devops"]
      }
    );
    
    console.log(`📄 Added document: ${id2}`);
  }

  private async demoFileProcessing(): Promise<void> {
    console.log('\n🔹 Demo 2: File Processing');
    
    // Process text files
    const textFiles = await fs.readdir(this.demoDataDir);
    
    for (const file of textFiles) {
      if (file.endsWith('.txt')) {
        const filePath = path.join(this.demoDataDir, file);
        const id = await this.rag.addDocumentFromFile(filePath);
        console.log(`📄 Added file: ${file} (ID: ${id})`);
      }
    }
    
    // Process JSON file
    const jsonFile = path.join(this.demoDataDir, 'technologies.json');
    const jsonId = await this.rag.addDocumentFromFile(jsonFile, 'Technology Stack');
    console.log(`📄 Added JSON file: ${jsonId}`);
    
    // Process CSV file
    const csvFile = path.join(this.demoDataDir, 'employees.csv');
    const csvId = await this.rag.addDocumentFromFile(csvFile, 'Employee Data');
    console.log(`📄 Added CSV file: ${csvId}`);
  }

  private async demoWebScraping(): Promise<void> {
    console.log('\n🔹 Demo 3: Web Scraping');
    
    // Note: Commented out to avoid external dependencies in demo
    // In real usage, you would uncomment this
    
    /*
    try {
      const urls = [
        'https://en.wikipedia.org/wiki/Machine_learning',
        'https://developer.mozilla.org/en-US/docs/Web/JavaScript'
      ];
      
      for (const url of urls) {
        const id = await this.rag.addDocumentFromURL(url);
        console.log(`🌐 Added URL: ${url} (ID: ${id})`);
      }
    } catch (error) {
      console.log('⚠️  Web scraping skipped (external dependencies)');
    }
    */
    
    console.log('⚠️  Web scraping demo skipped (to avoid external dependencies)');
  }

  private async demoContentEnrichment(): Promise<void> {
    console.log('\n🔹 Demo 4: Content Enrichment');
    
    const sampleContent = `
    Artificial Intelligence (AI) is transforming various industries by automating complex tasks and providing intelligent insights. Machine learning algorithms can analyze vast amounts of data to identify patterns and make predictions. Deep learning networks, inspired by the human brain, are particularly effective for tasks like image recognition and natural language processing. AI applications include chatbots, recommendation systems, autonomous vehicles, and medical diagnosis tools.
    `;
    
    const enriched = ContentEnricher.enhanceDocument(sampleContent);
    
    console.log('📝 Original content length:', sampleContent.length);
    console.log('🔍 Keywords:', enriched.enhancedMetadata.keywords.join(', '));
    console.log('📊 Word count:', enriched.enhancedMetadata.wordCount);
    console.log('⏱️  Reading time:', enriched.enhancedMetadata.readingTime, 'minutes');
    console.log('📄 Summary:', enriched.enhancedMetadata.summary);
    
    // Add enriched document
    const id = await this.rag.addDocument(enriched.content, {
      title: "AI and Machine Learning Overview",
      source: "demo-enriched",
      category: "artificial-intelligence",
      tags: enriched.enhancedMetadata.keywords.slice(0, 5)
    });
    
    console.log(`📄 Added enriched document: ${id}`);
  }

  private async demoQuerying(): Promise<void> {
    console.log('\n🔹 Demo 5: Querying and Retrieval');
    
    const queries = [
      "What is machine learning?",
      "How does TypeScript help with JavaScript development?",
      "What are the key technologies in web development?",
      "Tell me about Docker and containerization",
      "What is data science process?"
    ];
    
    for (const query of queries) {
      console.log(`\n❓ Query: "${query}"`);
      
      const result = await this.rag.query(query, {
        includeMetadata: true,
        maxResults: 3
      });
      
      console.log(`💬 Response: ${result.response.substring(0, 200)}...`);
      
      if (result.sources.length > 0) {
        console.log(`📚 Sources: ${result.sources.map(s => s.title).join(', ')}`);
      }
    }
  }

  private async demoDocumentManagement(): Promise<void> {
    console.log('\n🔹 Demo 6: Document Management');
    
    // List all documents
    const allDocs = this.rag.listDocuments();
    console.log(`📚 Total documents: ${allDocs.length}`);
    
    // List documents by category
    const programmingDocs = this.rag.listDocuments({ category: 'programming' });
    console.log(`💻 Programming documents: ${programmingDocs.length}`);
    
    // Search by tags
    const dockerDocs = this.rag.listDocuments({ tags: ['docker'] });
    console.log(`🐳 Docker-related documents: ${dockerDocs.length}`);
    
    // Show statistics
    const stats = this.rag.getStats();
    console.log('\n📊 RAG Statistics:');
    console.log(`Total documents: ${stats.totalDocuments}`);
    console.log(`Categories: ${Object.keys(stats.categories).join(', ')}`);
    console.log(`Top tags: ${Object.entries(stats.tags)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([tag]) => tag)
      .join(', ')}`);
  }

  private async demoAdvancedFeatures(): Promise<void> {
    console.log('\n🔹 Demo 7: Advanced Features');
    
    // Export data
    const exportPath = await this.rag.exportData();
    console.log(`💾 Data exported to: ${exportPath}`);
    
    // Content validation
    const validContent = "This is a valid piece of content that should be indexed.";
    const invalidContent = "Short.";
    
    console.log(`✅ Valid content: ${ContentValidator.isValidContent(validContent)}`);
    console.log(`❌ Invalid content: ${ContentValidator.isValidContent(invalidContent)}`);
    
    // File type validation
    console.log(`📄 .txt supported: ${ContentValidator.isSupportedFileType('document.txt')}`);
    console.log(`📄 .pdf supported: ${ContentValidator.isSupportedFileType('document.pdf')}`);
    
    // URL validation
    console.log(`🌐 Valid URL: ${ContentValidator.isValidUrl('https://example.com')}`);
    console.log(`🌐 Invalid URL: ${ContentValidator.isValidUrl('not-a-url')}`);
  }

  async cleanup(): Promise<void> {
    console.log('\n🧹 Cleaning up demo data...');
    
    try {
      // Remove demo data directory
      await fs.rm(this.demoDataDir, { recursive: true, force: true });
      console.log('✅ Demo data cleaned up');
    } catch (error) {
      console.log('⚠️  Could not clean up demo data:', error);
    }
  }
}

// Interactive demo runner
async function runInteractiveDemo(): Promise<void> {
  const demo = new RAGDemo();
  
  console.log('Welcome to the Dynamic RAG System Demo!');
  console.log('This demo will showcase all features of the RAG system.\n');
  
  try {
    await demo.runFullDemo();
    
    console.log('\n🎉 Demo completed successfully!');
    console.log('You can now:');
    console.log('  1. Use the interactive CLI: npx tsx src/rag-demo.ts interactive');
    console.log('  2. Use the command line: npx tsx src/rag-cli.ts help');
    console.log('  3. Integrate the RAG system into your own applications');
    
  } catch (error) {
    console.error('❌ Demo failed:', error);
  } finally {
    // Ask user if they want to clean up
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question('\nDo you want to clean up demo data? (y/N): ', async (answer: string) => {
      if (answer.toLowerCase() === 'y') {
        await demo.cleanup();
      }
      rl.close();
    });
  }
}

// Quick test for specific features
async function runQuickTest(): Promise<void> {
  const demo = new RAGDemo();
  
  console.log('🚀 Quick RAG Test\n');
  
  try {
    await demo.rag.initialize();
    
    // Add a test document
    const id = await demo.rag.addDocument(
      "This is a test document for the RAG system. It contains information about testing and validation.",
      {
        title: "Test Document",
        source: "quick-test",
        category: "testing",
        tags: ["test", "validation"]
      }
    );
    
    console.log(`✅ Added test document: ${id}`);
    
    // Query the document
    const result = await demo.rag.query("What is this document about?");
    console.log(`💬 Query result: ${result.response}`);
    
    // Show stats
    const stats = demo.rag.getStats();
    console.log(`📊 Total documents: ${stats.totalDocuments}`);
    
  } catch (error) {
    console.error('❌ Quick test failed:', error);
  }
}

// Main execution
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check if this script is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.includes('quick')) {
    runQuickTest().catch(console.error);
  } else if (args.includes('interactive')) {
    const demo = new RAGDemo();
    demo.rag.startInteractiveCLI().catch(console.error);
  } else {
    runInteractiveDemo().catch(console.error);
  }
}

export { RAGDemo }; 