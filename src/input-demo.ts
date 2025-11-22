import { askQuestion, getUserInput } from './console-input-example';
import { readTextFile, fileInputExamples } from './file-input-example';
import { functionInputExamples, processAIQuery } from './function-input-example';
import { InteractiveAI } from './interactive-ai-example';

async function runAllInputDemos() {
  console.log('🎯 TypeScript Input Methods Demo\n');
  
  try {
    // 1. Function Input Examples
    console.log('1️⃣ Function Input Examples:');
    await functionInputExamples();
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 2. File Input Examples
    console.log('2️⃣ File Input Examples:');
    await fileInputExamples();
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 3. AI Query Example
    console.log('3️⃣ AI Query Processing Example:');
    const aiResult = await processAIQuery({
      query: 'What is the best way to handle user input in TypeScript?',
      context: 'Web development context',
      options: { temperature: 0.8, maxTokens: 200 }
    });
    console.log(aiResult);
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 4. Interactive Console Demo (commented out to avoid blocking)
    console.log('4️⃣ Interactive Console Input Demo:');
    console.log('(Skipping interactive demo to avoid blocking - uncomment to test)');
    // await getUserInput();
    
  } catch (error) {
    console.error('Demo error:', error);
  }
}

// Quick test function
async function quickInputTest() {
  console.log('⚡ Quick Input Test\n');
  
  // Test command line args
  console.log('Command line args:', process.argv.slice(2));
  
  // Test environment variables
  console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');
  console.log('GOOGLE_API_KEY:', process.env.GOOGLE_API_KEY ? 'set' : 'not set');
  
  // Test file reading
  try {
    const content = await readTextFile('./data/sample_document.txt');
    console.log('File content preview:', content.substring(0, 100) + '...');
  } catch (error) {
    console.log('File reading test failed:', error);
  }
}

// Export demo functions
export { runAllInputDemos, quickInputTest };

// Run if called directly
if (require.main === module) {
  // Check command line arguments
  const args = process.argv.slice(2);
  
  if (args.includes('--quick')) {
    quickInputTest().catch(console.error);
  } else if (args.includes('--interactive')) {
    // Run interactive AI demo
    const ai = new InteractiveAI();
    ai.startChat().catch(console.error);
  } else {
    runAllInputDemos().catch(console.error);
  }
} 