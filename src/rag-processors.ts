import * as fs from 'fs/promises';
import * as path from 'path';

// Enhanced document processors for different file types
export class DocumentProcessor {
  
  // Process plain text files
  static async processTextFile(filePath: string): Promise<{
    content: string;
    metadata: { fileType: string; size: number; lastModified: Date };
  }> {
    const content = await fs.readFile(filePath, 'utf-8');
    const stats = await fs.stat(filePath);
    
    return {
      content: content.trim(),
      metadata: {
        fileType: 'text',
        size: stats.size,
        lastModified: stats.mtime
      }
    };
  }

  // Process markdown files
  static async processMarkdownFile(filePath: string): Promise<{
    content: string;
    metadata: { fileType: string; size: number; lastModified: Date; headings: string[] };
  }> {
    const content = await fs.readFile(filePath, 'utf-8');
    const stats = await fs.stat(filePath);
    
    // Extract headings from markdown
    const headings = content.match(/^#+\s+(.+)$/gm) || [];
    const cleanHeadings = headings.map(h => h.replace(/^#+\s+/, ''));
    
    return {
      content: content.trim(),
      metadata: {
        fileType: 'markdown',
        size: stats.size,
        lastModified: stats.mtime,
        headings: cleanHeadings
      }
    };
  }

  // Process JSON files
  static async processJsonFile(filePath: string): Promise<{
    content: string;
    metadata: { fileType: string; size: number; lastModified: Date; jsonStructure: any };
  }> {
    const content = await fs.readFile(filePath, 'utf-8');
    const stats = await fs.stat(filePath);
    
    try {
      const jsonData = JSON.parse(content);
      
      // Convert JSON to searchable text
      const textContent = this.jsonToText(jsonData);
      
      return {
        content: textContent,
        metadata: {
          fileType: 'json',
          size: stats.size,
          lastModified: stats.mtime,
          jsonStructure: this.getJsonStructure(jsonData)
        }
      };
    } catch (error) {
      throw new Error(`Invalid JSON file: ${filePath}`);
    }
  }

  // Process CSV files
  static async processCsvFile(filePath: string): Promise<{
    content: string;
    metadata: { fileType: string; size: number; lastModified: Date; columns: string[]; rowCount: number };
  }> {
    const content = await fs.readFile(filePath, 'utf-8');
    const stats = await fs.stat(filePath);
    
    const lines = content.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const rows = lines.slice(1);
    
    // Convert CSV to searchable text
    const textContent = this.csvToText(headers, rows);
    
    return {
      content: textContent,
      metadata: {
        fileType: 'csv',
        size: stats.size,
        lastModified: stats.mtime,
        columns: headers,
        rowCount: rows.length
      }
    };
  }

  // Detect file type and process accordingly
  static async processFile(filePath: string): Promise<{
    content: string;
    metadata: any;
  }> {
    const extension = path.extname(filePath).toLowerCase();
    
    switch (extension) {
      case '.txt':
        return await this.processTextFile(filePath);
      case '.md':
        return await this.processMarkdownFile(filePath);
      case '.json':
        return await this.processJsonFile(filePath);
      case '.csv':
        return await this.processCsvFile(filePath);
      default:
        // Fallback to text processing
        return await this.processTextFile(filePath);
    }
  }

  // Helper: Convert JSON to searchable text
  private static jsonToText(obj: any, path: string = ''): string {
    let text = '';
    
    if (typeof obj === 'object' && obj !== null) {
      if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
          text += this.jsonToText(item, `${path}[${index}]`);
        });
      } else {
        Object.entries(obj).forEach(([key, value]) => {
          const currentPath = path ? `${path}.${key}` : key;
          text += `${currentPath}: ${this.jsonToText(value, currentPath)}\n`;
        });
      }
    } else {
      text += String(obj);
    }
    
    return text;
  }

  // Helper: Get JSON structure
  private static getJsonStructure(obj: any): any {
    if (typeof obj === 'object' && obj !== null) {
      if (Array.isArray(obj)) {
        return obj.length > 0 ? [this.getJsonStructure(obj[0])] : [];
      } else {
        const structure: any = {};
        Object.keys(obj).forEach(key => {
          structure[key] = typeof obj[key];
        });
        return structure;
      }
    }
    return typeof obj;
  }

  // Helper: Convert CSV to searchable text
  private static csvToText(headers: string[], rows: string[]): string {
    let text = `CSV Headers: ${headers.join(', ')}\n\n`;
    
    rows.forEach((row, index) => {
      const values = row.split(',').map(v => v.trim());
      text += `Row ${index + 1}:\n`;
      headers.forEach((header, i) => {
        text += `  ${header}: ${values[i] || ''}\n`;
      });
      text += '\n';
    });
    
    return text;
  }
}

// Web scraper for URL content
export class WebScraper {
  
  // Basic web scraping (in production, use proper libraries like Puppeteer)
  static async scrapeUrl(url: string): Promise<{
    content: string;
    metadata: { title: string; description: string; url: string; scrapedAt: Date };
  }> {
    try {
      const response = await fetch(url);
      const html = await response.text();
      
      // Extract title
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : 'Untitled';
      
      // Extract description
      const descMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i);
      const description = descMatch ? descMatch[1].trim() : '';
      
      // Extract text content (basic approach)
      const textContent = this.extractTextFromHtml(html);
      
      return {
        content: textContent,
        metadata: {
          title,
          description,
          url,
          scrapedAt: new Date()
        }
      };
    } catch (error) {
      throw new Error(`Failed to scrape URL ${url}: ${error}`);
    }
  }

  // Extract text from HTML (basic implementation)
  private static extractTextFromHtml(html: string): string {
    // Remove script and style tags
    let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    
    // Remove HTML tags
    text = text.replace(/<[^>]*>/g, ' ');
    
    // Decode HTML entities
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');
    text = text.replace(/&#39;/g, "'");
    
    // Clean up whitespace
    text = text.replace(/\s+/g, ' ').trim();
    
    return text;
  }

  // Scrape multiple URLs
  static async scrapeUrls(urls: string[]): Promise<Array<{
    url: string;
    content: string;
    metadata: any;
    error?: string;
  }>> {
    const results = [];
    
    for (const url of urls) {
      try {
        const result = await this.scrapeUrl(url);
        results.push({
          url,
          content: result.content,
          metadata: result.metadata
        });
      } catch (error) {
        results.push({
          url,
          content: '',
          metadata: {},
          error: error.message
        });
      }
    }
    
    return results;
  }
}

// Content enricher for better search results
export class ContentEnricher {
  
  // Extract keywords from content
  static extractKeywords(content: string): string[] {
    // Simple keyword extraction (in production, use NLP libraries)
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    // Count word frequency
    const wordCount: { [key: string]: number } = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });
    
    // Return top keywords
    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  // Generate summary from content
  static generateSummary(content: string, maxLength: number = 200): string {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (sentences.length === 0) return '';
    
    let summary = sentences[0].trim();
    
    for (let i = 1; i < sentences.length; i++) {
      const nextSentence = sentences[i].trim();
      if (summary.length + nextSentence.length + 1 <= maxLength) {
        summary += '. ' + nextSentence;
      } else {
        break;
      }
    }
    
    return summary + (summary.endsWith('.') ? '' : '.');
  }

  // Enhance document with additional metadata
  static enhanceDocument(content: string, originalMetadata: any = {}): {
    content: string;
    enhancedMetadata: any;
  } {
    const keywords = this.extractKeywords(content);
    const summary = this.generateSummary(content);
    const wordCount = content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200); // Assuming 200 words per minute
    
    return {
      content,
      enhancedMetadata: {
        ...originalMetadata,
        keywords,
        summary,
        wordCount,
        readingTime,
        enhancedAt: new Date()
      }
    };
  }
}

// Content validator
export class ContentValidator {
  
  // Check if content is valid for indexing
  static isValidContent(content: string): boolean {
    return content.trim().length > 10; // Minimum 10 characters
  }

  // Check for duplicate content
  static isDuplicate(content: string, existingContents: string[]): boolean {
    const similarity = this.calculateSimilarity(content, existingContents);
    return similarity > 0.8; // 80% similarity threshold
  }

  // Calculate similarity between contents
  static calculateSimilarity(content: string, existingContents: string[]): number {
    if (existingContents.length === 0) return 0;
    
    const contentWords = new Set(content.toLowerCase().split(/\s+/));
    
    let maxSimilarity = 0;
    
    for (const existing of existingContents) {
      const existingWords = new Set(existing.toLowerCase().split(/\s+/));
      const contentWordsArray = Array.from(contentWords);
      const existingWordsArray = Array.from(existingWords);
      const intersection = new Set(contentWordsArray.filter(x => existingWords.has(x)));
      const union = new Set([...contentWordsArray, ...existingWordsArray]);
      
      const similarity = intersection.size / union.size;
      maxSimilarity = Math.max(maxSimilarity, similarity);
    }
    
    return maxSimilarity;
  }

  // Validate file type
  static isSupportedFileType(filePath: string): boolean {
    const supportedExtensions = ['.txt', '.md', '.json', '.csv'];
    const extension = path.extname(filePath).toLowerCase();
    return supportedExtensions.includes(extension);
  }

  // Validate URL
  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  }
} 