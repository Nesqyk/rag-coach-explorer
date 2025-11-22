import 'dotenv/config';
import {
  VectorStoreIndex,
  Document,
  Settings,
} from 'llamaindex';
import { Gemini, GEMINI_MODEL, GeminiEmbedding, GEMINI_EMBEDDING_MODEL } from '@llamaindex/google';
import * as readline from 'readline';
import * as fs from 'fs/promises';

// Maria's Profile Data
const MARIA_PROFILE = {
  name: "Maria Santos",
  age: 28,
  currentRole: "Customer Service Representative",
  experience: "3 years BPO",
  location: "Quezon City, Philippines",
  shift: "Night shift (9PM-6AM)",
  clients: "US healthcare clients",
  income: "₱25,000-35,000/month",
  education: "Business Administration graduate",
  skills: [
    "Customer service excellence",
    "Problem-solving under pressure", 
    "Healthcare insurance knowledge",
    "Email and phone communication",
    "Process documentation",
    "Issue escalation handling",
    "CRM systems (Salesforce, ServiceNow)",
    "Basic troubleshooting"
  ],
  painPoints: [
    "Feels overwhelmed by tech requirements",
    "Doesn't see how BPO skills translate to tech",
    "Limited time due to night shift schedule",
    "Family financial responsibilities",
    "Imposter syndrome about tech careers"
  ],
  goals: [
    "Transition to tech within 12 months",
    "Increase salary to ₱50,000+",
    "Work normal day hours",
    "Remote work opportunities"
  ]
};

// Career Coaching Knowledge Base
const COACHING_KNOWLEDGE = `
# SUMAKSES Career Coaching Knowledge Base

## BPO Skills to Tech Translation Matrix

### Communication Skills (95% transferable)
- Customer service → User experience research, technical writing
- Phone etiquette → Client communication, stakeholder management  
- Email writing → Technical documentation, user guides

### Problem-Solving (90% transferable)
- Issue resolution → Debug processes, system troubleshooting
- Escalation handling → Incident management, system analysis
- Process improvement → DevOps practices, workflow optimization

### Technical Aptitude (70% transferable)
- CRM systems → Software platforms, database management
- Basic troubleshooting → QA testing, system administration
- Documentation → Code documentation, API documentation

### Process Optimization (85% transferable)
- SOP development → System design, automation scripting
- Quality assurance → Software testing, code review
- Workflow improvement → DevOps, project management

## Recommended Tech Career Paths for BPO Professionals

### 1. Quality Assurance (QA) Tester
**Compatibility Score: 92%**
- Salary Range: ₱35,000-65,000
- Learning Time: 3-6 months
- Key Skills: Testing methodologies, bug reporting, attention to detail
- Why Perfect for BPO: Uses existing problem-solving and documentation skills

### 2. Technical Writer  
**Compatibility Score: 88%**
- Salary Range: ₱40,000-70,000
- Learning Time: 4-6 months
- Key Skills: Technical communication, documentation, user guides
- Why Perfect for BPO: Leverages excellent communication and writing skills

### 3. Customer Success Manager
**Compatibility Score: 95%**
- Salary Range: ₱45,000-80,000
- Learning Time: 2-4 months
- Key Skills: Client relationship management, product knowledge, analytics
- Why Perfect for BPO: Direct application of customer service expertise

### 4. UX/UI Designer
**Compatibility Score: 75%**
- Salary Range: ₱40,000-85,000
- Learning Time: 6-9 months
- Key Skills: User research, design thinking, prototyping
- Why Perfect for BPO: Understanding user needs and pain points

### 5. Software Developer
**Compatibility Score: 65%**
- Salary Range: ₱50,000-120,000
- Learning Time: 9-12 months
- Key Skills: Programming, logical thinking, problem-solving
- Why Challenging: Requires significant new technical skills

## Learning Roadmap Templates

### QA Tester Path (3-6 months)
**Month 1-2: Foundation**
- Software testing fundamentals
- Test case writing
- Bug reporting and tracking
- Basic SQL for database testing

**Month 3-4: Practical Skills**
- Manual testing techniques
- Test automation basics (Selenium)
- API testing with Postman
- Performance testing concepts

**Month 5-6: Specialization**
- Mobile app testing
- Web application testing
- Agile testing methodologies
- Portfolio project development

### Technical Writer Path (4-6 months)
**Month 1-2: Foundation**
- Technical writing principles
- Documentation tools (Confluence, GitBook)
- Markdown and basic HTML
- Information architecture

**Month 3-4: Practical Skills**
- API documentation
- User guide creation
- Version control (Git)
- Content management systems

**Month 5-6: Specialization**
- Developer documentation
- Video tutorial creation
- Content strategy
- Portfolio development

## Filipino Cultural Considerations

### Family Support Strategy
- Gradual transition while maintaining current income
- Evening/weekend learning schedule
- Family education about tech career benefits
- Long-term financial planning discussions

### Learning Preferences
- Community-based learning (study groups)
- Practical, hands-on projects
- Real success stories from Filipino professionals
- Supportive mentorship relationships

### Communication Style
- Respectful but encouraging tone
- Acknowledge current skills and experience
- Provide clear, step-by-step guidance
- Celebrate small wins and progress

## Success Stories - Filipino BPO to Tech Transitions

### Case Study 1: Anna Cruz (Call Center → QA Tester)
- Background: 4 years customer service, similar to Maria
- Transition Time: 5 months
- Salary Increase: ₱22K → ₱55K (150% increase)
- Key Success Factor: Leveraged attention to detail and process documentation skills

### Case Study 2: John Reyes (Tech Support → Technical Writer)
- Background: 3 years technical support BPO
- Transition Time: 4 months  
- Salary Increase: ₱28K → ₱65K (132% increase)
- Key Success Factor: Used existing technical communication skills

### Case Study 3: Sarah Mendoza (Customer Service → UX Designer)
- Background: 5 years customer service, night shift
- Transition Time: 8 months
- Salary Increase: ₱25K → ₱75K (200% increase)
- Key Success Factor: Applied customer empathy to user experience design
`;

class CareerCoach {
  private rl: readline.Interface;
  private queryEngine: any;
  private conversationHistory: string[] = [];
  private thinkingInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async initialize() {
    // Configure LlamaIndex
    if (!process.env.GOOGLE_API_KEY) {
      console.error('❌ GOOGLE_API_KEY environment variable is not set.');
      process.exit(1);
    }

    Settings.llm = new Gemini({
      model: GEMINI_MODEL.GEMINI_PRO_1_5_FLASH_LATEST,
      apiKey: process.env.GOOGLE_API_KEY,
    });

    Settings.embedModel = new GeminiEmbedding({
      model: GEMINI_EMBEDDING_MODEL.EMBEDDING_001,
      apiKey: process.env.GOOGLE_API_KEY,
    });

    // Create knowledge base
    const documents = [
      new Document({ text: COACHING_KNOWLEDGE }),
      new Document({ text: JSON.stringify(MARIA_PROFILE, null, 2) })
    ];

    console.log('🤖 Initializing your career coach...');
    const index = await VectorStoreIndex.fromDocuments(documents);
    this.queryEngine = index.asQueryEngine();
    console.log('✅ Career coach ready!\n');
  }

  async startCoaching() {
    this.displayWelcome();
    
    while (true) {
      const choice = await this.getMainMenuChoice();
      
      switch (choice) {
        case '1':
          await this.skillsAssessment();
          break;
        case '2':
          await this.careerPathExploration();
          break;
        case '3':
          await this.learningRoadmap();
          break;
        case '4':
          await this.motivationalSupport();
          break;
        case '5':
          await this.freeformChat();
          break;
        case '6':
          await this.displayProgress();
          break;
        case '0':
          console.log('\n👋 Salamat, Maria! Keep pushing forward - your tech career is closer than you think!');
          this.cleanup();
          return;
        default:
          console.log('❌ Invalid choice. Please try again.\n');
      }
    }
  }

  private displayWelcome() {
    console.log(`
╭─────────────────────────────────────────────────────────────╮
│                    🚀 SUMAKSES CAREER COACH                 │
│                                                             │
│  Hello Maria! 👋 I'm your personal career transition coach  │
│  I understand your BPO background and I'm here to help     │
│  you discover your path to a successful tech career.       │
│                                                             │
│  💼 Current: Customer Service Rep (3 years)                │
│  🎯 Goal: Tech Career Transition                           │
│  📍 Location: Quezon City, Philippines                     │
╰─────────────────────────────────────────────────────────────╯
`);
  }

  private async getMainMenuChoice(): Promise<string> {
    console.log(`
┌─ CAREER COACHING MENU ─────────────────────────────────────┐
│                                                            │
│  1. 📊 Skills Assessment & Translation                     │
│  2. 🛤️  Explore Tech Career Paths                          │
│  3. 📚 Get Your Learning Roadmap                           │
│  4. 💪 Motivational Support & Success Stories              │
│  5. 💬 Free Chat (Ask me anything!)                        │
│  6. 📈 Review Your Progress                                │
│  0. 👋 Exit                                                │
│                                                            │
└────────────────────────────────────────────────────────────┘
`);

    return new Promise((resolve) => {
      this.rl.question('Choose an option (0-6): ', resolve);
    });
  }

  private async skillsAssessment() {
    console.log('\n🔍 SKILLS ASSESSMENT & TRANSLATION\n');
    
    const prompt = `As Maria's career coach, provide a personalized skills assessment. 
    Analyze her current BPO skills and show exactly how they translate to tech roles.
    Be encouraging and specific. Use her actual experience with US healthcare clients.
    Format the response clearly with bullet points and percentages.
    
    Focus on:
    1. Skills she already has that are valuable in tech
    2. Specific tech roles where these skills are highly valued
    3. Confidence-building message about her potential
    
    Keep it conversational and supportive, like talking to a friend.`;

    const { response, timing } = await this.queryWithTiming(prompt);
    
    console.log(`✨ Response generated in ${timing}s\n`);
    console.log(response);
    
    this.conversationHistory.push(`Skills Assessment: ${response}`);
    
    await this.pressEnterToContinue();
  }

  private async careerPathExploration() {
    console.log('\n🛤️ TECH CAREER PATH EXPLORATION\n');
    
    console.log('Let me show you the tech careers that best match your background:\n');
    
    const prompt = `As Maria's career coach, recommend the top 3 tech career paths that best match her BPO background.
    For each career path, include:
    1. Why it's perfect for her BPO experience
    2. Expected salary range in Philippines (in PHP)
    3. Learning timeline
    4. Specific skills she already has that apply
    5. What new skills she needs to learn
    
    Make it personal and encouraging. Reference her healthcare client experience specifically.
    Include real job market demand information for Philippines.`;

    const { response, timing } = await this.queryWithTiming(prompt);
    
    console.log(`✨ Response generated in ${timing}s\n`);
    console.log(response);
    
    // Interactive follow-up
    console.log('\n📋 QUICK INTEREST CHECK:');
    const interest = await this.askQuestion('Which career path interests you most? (Type the role name): ');
    
    const followUpPrompt = `Maria is interested in: ${interest}. 
    Provide detailed next steps specifically for this career path.
    Include:
    1. First 3 things she should do this week
    2. Free resources to get started
    3. Timeline expectations
    4. Potential challenges and how to overcome them
    
    Be very specific and actionable.`;
    
    console.log(`\n🎯 DETAILED GUIDANCE FOR ${interest.toUpperCase()}:`);
    
    const { response: followUpResponse, timing: followUpTiming } = await this.queryWithTiming(followUpPrompt);
    
    console.log(`✨ Response generated in ${followUpTiming}s\n`);
    console.log(followUpResponse);
    
    this.conversationHistory.push(`Career Exploration: ${interest} - ${followUpResponse}`);
    
    await this.pressEnterToContinue();
  }

  private async learningRoadmap() {
    console.log('\n📚 PERSONALIZED LEARNING ROADMAP\n');
    
    const careerChoice = await this.askQuestion('Which tech career are you most serious about pursuing? ');
    const timeCommitment = await this.askQuestion('How many hours per week can you realistically study? (considering your night shift): ');
    
    const prompt = `Create a detailed, week-by-week learning roadmap for Maria to transition to ${careerChoice}.
    
    Consider:
    - She works night shifts (9PM-6AM)
    - She can commit ${timeCommitment} hours per week
    - She needs practical, hands-on learning
    - She has limited budget
    - She needs to maintain current income during transition
    
    Provide:
    1. Monthly breakdown of learning goals
    2. Specific free resources and courses
    3. Practice projects she can build
    4. Weekly schedule suggestions that fit her night shift
    5. Milestones to track progress
    
    Make it realistic and achievable for someone working full-time night shifts.`;
    
    console.log(`\n🗓️ CREATING YOUR ${careerChoice.toUpperCase()} ROADMAP...`);
    
    const { response, timing } = await this.queryWithTiming(prompt);
    
    console.log(`✨ Response generated in ${timing}s\n`);
    console.log(response);
    
    this.conversationHistory.push(`Learning Roadmap: ${careerChoice} - ${timeCommitment}hrs/week`);
    
    await this.pressEnterToContinue();
  }

  private async motivationalSupport() {
    console.log('\n💪 MOTIVATIONAL SUPPORT & SUCCESS STORIES\n');
    
    const currentFeeling = await this.askQuestion('How are you feeling about your career transition right now? (excited/nervous/overwhelmed/determined): ');
    
    const prompt = `Maria is feeling ${currentFeeling} about her career transition.
    
    Provide:
    1. Empathetic response to her current emotional state
    2. Relevant success story of someone similar to her situation
    3. Specific encouragement about her unique strengths
    4. Reminder of why she started this journey
    5. One small action she can take today to move forward
    
    Be warm, understanding, and culturally sensitive to Filipino context.
    Reference family support and community values.
    Make it personal and heartfelt.`;
    
    const { response, timing } = await this.queryWithTiming(prompt);
    
    console.log(`✨ Response generated in ${timing}s\n`);
    console.log(response);
    
    console.log('\n🌟 DAILY AFFIRMATION FOR YOU:');
    console.log('┌─────────────────────────────────────────────────────────┐');
    console.log('│ "Your 3 years of BPO experience isn\'t just customer     │');
    console.log('│ service - it\'s problem-solving, communication,          │');
    console.log('│ and resilience under pressure. These are exactly        │');
    console.log('│ the skills tech companies desperately need."            │');
    console.log('└─────────────────────────────────────────────────────────┘');
    
    await this.pressEnterToContinue();
  }

  private async freeformChat() {
    console.log('\n💬 FREE CHAT MODE - Ask me anything!\n');
    console.log('Type "back" to return to main menu\n');
    
    while (true) {
      const question = await this.askQuestion('Maria: ');
      
      if (question.toLowerCase() === 'back') {
        break;
      }
      
      const prompt = `Maria asked: "${question}"
      
      Respond as her supportive career coach who understands:
      - Her BPO background and night shift challenges
      - Filipino culture and family considerations  
      - The tech job market in Philippines
      - Her financial responsibilities and career goals
      
      Be conversational, supportive, and provide practical advice.
      If it's a technical question, break it down simply.
      If it's about motivation, be encouraging and understanding.`;
      
      const { response, timing } = await this.queryWithTiming(prompt);
      
      console.log(`\n🤖 Coach: (${timing}s)`);
      console.log(response + '\n');
      
      this.conversationHistory.push(`Q: ${question} A: ${response}`);
    }
  }

  private async displayProgress() {
    console.log('\n📈 YOUR PROGRESS SUMMARY\n');
    
    if (this.conversationHistory.length === 0) {
      console.log('🔄 No progress recorded yet. Start with a skills assessment or career exploration!');
      await this.pressEnterToContinue();
      return;
    }
    
    console.log('📝 COACHING SESSION SUMMARY:');
    console.log('═'.repeat(60));
    
    this.conversationHistory.forEach((entry, index) => {
      console.log(`${index + 1}. ${entry.substring(0, 80)}...`);
    });
    
    console.log('\n🎯 NEXT RECOMMENDED ACTIONS:');
    console.log('• Continue with consistent daily learning (even 30 minutes helps!)');
    console.log('• Join Filipino tech communities for support');
    console.log('• Start building a simple portfolio project');
    console.log('• Connect with other BPO-to-tech transition professionals');
    
    await this.pressEnterToContinue();
  }

  public cleanup() {
    if (this.thinkingInterval) {
      clearInterval(this.thinkingInterval);
      this.thinkingInterval = null;
    }
    // Show cursor again
    process.stdout.write('\x1B[?25h');
    this.rl.close();
  }

  private async askQuestion(question: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(question, resolve);
    });
  }

  private async pressEnterToContinue() {
    await this.askQuestion('\n📱 Press Enter to continue...');
    console.clear();
  }

  private startThinking(): number {
    const startTime = Date.now();
    let dots = '';
    let spinnerIndex = 0;
    const spinnerChars = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    
    // Hide cursor
    process.stdout.write('\x1B[?25l');
    
    this.thinkingInterval = setInterval(() => {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const spinner = spinnerChars[spinnerIndex % spinnerChars.length];
      spinnerIndex++;
      
      // Clear the line and write thinking message
      process.stdout.write('\r\x1B[K');
      process.stdout.write(`${spinner} 🤖 Thinking... ${elapsed}s`);
    }, 100);
    
    return startTime;
  }

  private stopThinking(startTime: number): number {
    if (this.thinkingInterval) {
      clearInterval(this.thinkingInterval);
      this.thinkingInterval = null;
    }
    
    // Show cursor again
    process.stdout.write('\x1B[?25h');
    
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    
    // Clear the thinking line
    process.stdout.write('\r\x1B[K');
    
    return parseFloat(totalTime);
  }

  private async queryWithTiming(prompt: string): Promise<{ response: string; timing: number }> {
    const startTime = this.startThinking();
    
    try {
      const response = await this.queryEngine.query({ query: prompt });
      const timing = this.stopThinking(startTime);
      
      return { response: response.response, timing };
    } catch (error) {
      this.stopThinking(startTime);
      throw error;
    }
  }
}

async function main() {
  const coach = new CareerCoach();
  
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
  await coach.startCoaching();
}

main().catch(console.error); 