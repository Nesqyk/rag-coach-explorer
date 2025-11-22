import 'dotenv/config'; // Load environment variables from .env file

import {
  VectorStoreIndex,
  Document,
  Settings,
} from 'llamaindex';
import { SimpleDirectoryReader } from '@llamaindex/readers/directory';
import { Gemini, GEMINI_MODEL, GeminiEmbedding, GEMINI_EMBEDDING_MODEL } from '@llamaindex/google';
import * as fs from 'fs/promises'; // Node.js file system module

async function main() {
  // 1. Configure LlamaIndex to use Gemini
  if (!process.env.GOOGLE_API_KEY) {
    console.error('GOOGLE_API_KEY environment variable is not set.');
    console.error('Please set it in your .env file or as an environment variable.');
    process.exit(1);
  }

  Settings.llm = new Gemini({
    model: GEMINI_MODEL.GEMINI_PRO_1_5_FLASH_LATEST, // Best for free tier quotas
    apiKey: process.env.GOOGLE_API_KEY,
  });

  Settings.embedModel = new GeminiEmbedding({
    model: GEMINI_EMBEDDING_MODEL.EMBEDDING_001,
    apiKey: process.env.GOOGLE_API_KEY,
  });

  // 2. Prepare some data
  const dataDirectory = './data';
  await fs.mkdir(dataDirectory, { recursive: true });
  await fs.writeFile(
    `${dataDirectory}/sample_document.txt`,
    `The quick brown fox jumps over the lazy dog. This is a classic pangram.
    LlamaIndex is a data framework for LLM applications. It helps connect your custom data sources to large language models.
    Gemini is a family of multimodal large language models developed by Google AI.`
  );

  // 3. Load documents from the directory
  console.log('Loading documents...');
  const reader = new SimpleDirectoryReader();
  const documents = await reader.loadData({
    directoryPath: dataDirectory,
  });
  console.log(`Loaded ${documents.length} document(s).`);

  // 4. Create an index from the documents
  console.log('Creating vector index...');
  const index = await VectorStoreIndex.fromDocuments(documents);
  console.log('Vector index created.');

  // 5. Create a query engine
  const queryEngine = index.asQueryEngine();

  // 6. Query the engine
  const queries = [
    "What is LlamaIndex?",
    "What did the quick brown fox do?",
    "Who developed Gemini?",
    "Tell me about the classic pangram.",
  ];

  for (const query of queries) {
    console.log(`\nQuery: ${query}`);
    const response = await queryEngine.query({ query });
    console.log(`Response: ${response.response}`);
  }
}

main().catch(console.error);