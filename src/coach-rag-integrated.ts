#!/usr/bin/env node

import 'dotenv/config';
import {
  VectorStoreIndex,
  Document,
  Settings,
} from 'llamaindex';
import { Gemini, GEMINI_MODEL, GeminiEmbedding, GEMINI_EMBEDDING_MODEL } from '@llamaindex/google';
import { DynamicRAG } from './dynamic-rag.js';
import * as readline from 'readline';
import * as fs from 'fs/promises';

// User Profile Interface for customization
interface UserProfile {
  name: string;
  age: number;
  currentRole: string;
  experience: string;
  location: string;
  shift?: string;
  clients?: string;
  income?: string;
  education: string;
  skills: string[];
  painPoints: string[];
  goals: string[];
  preferences?: {
    learningStyle: string;
    timeAvailable: string;
    budget: string;
  };
}

// Default profile template (will be customized during setup)
const DEFAULT_PROFILE: UserProfile = {
  name: "New User",
  age: 25,
  currentRole: "BPO Professional",
  experience: "BPO experience",
  location: "Philippines",
  shift: "Standard work schedule",
  clients: "Various clients",
  income: "Current income",
  education: "College graduate",
  skills: [
  
  ],
  painPoints: [
    "Unsure about tech career transition",
    "Need guidance on skill translation",
    "Limited time for learning",
    "Budget constraints",
    "Confidence in tech abilities"
  ],
  goals: [
    "Transition to tech career",
    "Increase earning potential",
    "Improve work-life balance",
    "Develop new skills"
  ],
  preferences: {
    learningStyle: "Hands-on learning",
    timeAvailable: "A few hours per week",
    budget: "Prefer affordable resources"
  }
};

// Coaching Knowledge Base
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
`;

class IntegratedCoachRAG {
  private rl: readline.Interface;
  private coach: any; // LlamaIndex query engine for coaching
  private userRAG: DynamicRAG; // User's personal knowledge base
  private userProfile: UserProfile;
  private conversationHistory: string[] = [];
  private userContext: string[] = []; // Track user inputs for context
  private thinkingInterval: NodeJS.Timeout | null = null;

  constructor(customProfile?: Partial<UserProfile>) {
    this.userProfile = { ...DEFAULT_PROFILE, ...customProfile };
    
    // Initialize user's personal RAG system
    this.userRAG = new DynamicRAG({
      dataDirectory: `./coach-user-data/${this.userProfile.name.replace(' ', '-').toLowerCase()}`,
      vectorStoreDirectory: `./coach-vector-store/${this.userProfile.name.replace(' ', '-').toLowerCase()}`,
      documentsFile: 'user-coaching-data.json',
      maxDocuments: 500,
      autoSave: true
    });

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '🤖 Coach> '
    });

    this.setupReadline();
  }

  private setupReadline(): void {
    // Handle Ctrl+C gracefully
    this.rl.on('SIGINT', () => {
      console.log('\n👋 Keep pushing forward! Your tech career journey continues...');
      this.cleanup();
      process.exit(0);
    });

    // Handle line input
    this.rl.on('line', async (input: string) => {
      await this.processInput(input.trim());
      this.rl.prompt();
    });

    // Handle close
    this.rl.on('close', () => {
      console.log('\n👋 Keep believing in yourself!');
      this.cleanup();
      process.exit(0);
    });
  }

  async initialize(): Promise<void> {
    console.log('🤖 Initializing your personalized career coach with RAG support...');

    // Configure LlamaIndex for coaching
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

    // Initialize coaching knowledge base
    const coachingDocuments = [
      new Document({ text: COACHING_KNOWLEDGE }),
      new Document({ text: JSON.stringify(this.userProfile, null, 2) })
    ];

    const coachIndex = await VectorStoreIndex.fromDocuments(coachingDocuments);
    this.coach = coachIndex.asQueryEngine();

    // Initialize user's personal RAG system
    await this.userRAG.initialize();

    console.log('✅ Integrated Coach + RAG system ready!');
    console.log(`👤 Personalized for: ${this.userProfile.name}`);
    
    // Show user's existing knowledge base
    const userStats = this.userRAG.getStats();
    if (userStats.totalDocuments > 0) {
      console.log(`📚 Your personal knowledge base: ${userStats.totalDocuments} documents`);
    } else {
      console.log('📭 Personal knowledge base is empty - I\'ll help you build it as we talk!');
    }
    console.log('');
  }

  async start(): Promise<void> {
    this.displayWelcome();
    
    // Show available commands
    console.log(`
💡 Available Commands:
  📊 assess         - Skills assessment & translation
  🛤️ explore         - Explore tech career paths  
  📚 roadmap        - Get learning roadmap
  💪 motivate       - Motivational support
  💬 <message>      - Chat with me about anything
  📄 save <note>    - Save important notes to your knowledge base
  📖 remember       - Search your saved notes and progress
  📈 progress       - Review your journey
  🔧 profile        - Update your profile
  ❓ help           - Show all commands
  👋 exit           - Exit coaching session

💡 Tip: I automatically save important insights from our conversations!
`);

    this.rl.prompt();
  }

  private async processInput(input: string): Promise<void> {
    if (!input) return;

    // Track user input for context (automatically save insights)
    this.userContext.push(input);

    const [command, ...args] = input.split(' ');
    const argsString = args.join(' ');

    try {
      switch (command.toLowerCase()) {
        case 'assess':
          await this.skillsAssessment();
          break;
        case 'explore':
          await this.careerPathExploration();
          break;
        case 'roadmap':
          await this.learningRoadmap();
          break;
        case 'motivate':
          await this.motivationalSupport();
          break;
        case 'save':
          await this.saveUserNote(argsString);
          break;
        case 'remember':
          await this.searchUserKnowledge(argsString);
          break;
        case 'progress':
          await this.displayProgress();
          break;
        case 'profile':
          await this.updateProfile();
          break;
        case 'help':
          this.showHelp();
          break;
        case 'exit':
        case 'quit':
          console.log('\n👋 Keep pushing forward! Your tech career is closer than you think!');
          this.cleanup();
          process.exit(0);
          break;
        default:
          // Default: Chat with context-aware coach
          await this.contextAwareChat(input);
      }
    } catch (error) {
      console.error('❌ Error:', error);
    }
  }

  private async contextAwareChat(message: string): Promise<void> {
    console.log('🤖 Let me think about this with your context...');

    // Get relevant context from user's knowledge base
    let userContext = '';
    try {
      if (this.userRAG.getStats().totalDocuments > 0) {
        const contextResult = await this.userRAG.query(message, {
          includeMetadata: false,
          maxResults: 2
        });
        userContext = `\n\nRelevant context from our previous conversations: ${contextResult.response}`;
      }
    } catch (error) {
      // Continue without user context if there's an error
    }

    // Enhanced prompt with user context
    const enhancedPrompt = `${this.userProfile.name} said: "${message}"

    User Profile Context:
    - Name: ${this.userProfile.name}
    - Current Role: ${this.userProfile.currentRole}
    - Experience: ${this.userProfile.experience}
    - Goals: ${this.userProfile.goals.join(', ')}
    - Pain Points: ${this.userProfile.painPoints.join(', ')}
    - Skills: ${this.userProfile.skills.join(', ')}
    
    Recent conversation context: ${this.userContext.slice(-3).join(' | ')}
    ${userContext}

    Respond as a supportive career coach who:
    1. References their specific background and goals
    2. Uses relevant context from previous conversations
    3. Provides actionable, culturally-sensitive advice
    4. Acknowledges their current situation and challenges
    5. Encourages their transition journey

    Be conversational, empathetic, and specific to their Filipino BPO background.`;

    const { response, timing } = await this.queryWithTiming(enhancedPrompt, this.coach);
    
    console.log(`\n🤖 Coach: (${timing}s)`);
    console.log(response);

    // Auto-save meaningful interactions
    await this.autoSaveInteraction(message, response);
    
    this.conversationHistory.push(`Q: ${message} A: ${response}`);
    console.log('');
  }

  private async autoSaveInteraction(userMessage: string, coachResponse: string): Promise<void> {
    // Auto-save if the interaction contains learning insights, goals, or important decisions
    const keywords = ['goal', 'learn', 'study', 'practice', 'timeline', 'roadmap', 'skill', 'next step', 'plan'];
    const shouldSave = keywords.some(keyword => 
      userMessage.toLowerCase().includes(keyword) || coachResponse.toLowerCase().includes(keyword)
    );

    if (shouldSave && userMessage.length > 20) {
      try {
        const timestamp = new Date().toLocaleDateString();
        const insight = `[${timestamp}] Discussion: ${userMessage}\n\nCoach insights: ${coachResponse.substring(0, 300)}...`;
        
        await this.userRAG.addDocument(insight, {
          title: `Coaching Session - ${timestamp}`,
          source: 'coaching-conversation',
          category: 'coaching-insights',
          tags: ['coaching', 'insights', 'auto-saved']
        });
      } catch (error) {
        // Silent fail - don't interrupt the conversation
      }
    }
  }

  private async saveUserNote(note: string): Promise<void> {
    if (!note) {
      console.log('❌ Please provide a note to save');
      console.log('📝 Usage: save <your note or insight>');
      return;
    }

    try {
      const title = note.length > 50 ? note.substring(0, 50) + '...' : note;
      const id = await this.userRAG.addDocument(note, {
        title: `Personal Note: ${title}`,
        source: 'user-input',
        category: 'personal-notes',
        tags: ['note', 'personal', 'user-saved']
      });

      console.log(`✅ Note saved to your knowledge base!`);
      console.log(`🆔 ID: ${id}`);
      console.log(`📊 Total saved items: ${this.userRAG.getStats().totalDocuments}`);
    } catch (error) {
      console.error('❌ Failed to save note:', error);
    }
  }

  private async searchUserKnowledge(query: string): Promise<void> {
    if (!query) {
      console.log('❌ Please provide a search term');
      console.log('📝 Usage: remember <what you want to find>');
      return;
    }

    try {
      const stats = this.userRAG.getStats();
      if (stats.totalDocuments === 0) {
        console.log('📭 Your knowledge base is empty. Start saving notes and insights!');
        return;
      }

      console.log('🔍 Searching your personal knowledge base...');
      
      const result = await this.userRAG.query(query, {
        includeMetadata: true,
        maxResults: 3
      });

      console.log('\n📝 What I found in your saved notes:');
      console.log('─'.repeat(40));
      console.log(result.response);
      
      if (result.sources && result.sources.length > 0) {
        console.log('\n📚 From these saved items:');
        console.log('─'.repeat(40));
        result.sources.forEach((source: any, index: number) => {
          console.log(`${index + 1}. ${source.title || 'Untitled'}`);
          const date = source.metadata?.addedDate ? new Date(source.metadata.addedDate).toLocaleDateString() : 'Unknown date';
          console.log(`   📅 Saved: ${date}`);
        });
      }
      
      console.log(`\n📊 Searched through ${stats.totalDocuments} saved items`);
      console.log('');
    } catch (error) {
      console.error('❌ Search failed:', error);
    }
  }

  private async skillsAssessment(): Promise<void> {
    console.log('\n🔍 SKILLS ASSESSMENT & TRANSLATION\n');
    
    const prompt = `Provide a personalized skills assessment for ${this.userProfile.name}.
    Analyze their current BPO skills and show exactly how they translate to tech roles.
    Be encouraging and specific. Use their actual experience and background.
    
    Their current skills: ${this.userProfile.skills.join(', ')}
    Their experience: ${this.userProfile.experience}
    Their goals: ${this.userProfile.goals.join(', ')}
    
    Focus on:
    1. Skills they already have that are valuable in tech
    2. Specific tech roles where these skills are highly valued  
    3. Confidence-building message about their potential
    4. Percentage compatibility scores for top 3 tech roles
    
    Format with clear sections and bullet points. Be encouraging and specific.`;

    const { response, timing } = await this.queryWithTiming(prompt, this.coach);
    
    console.log(`✨ Assessment completed in ${timing}s\n`);
    console.log(response);
    
    // Auto-save this assessment
    try {
      await this.userRAG.addDocument(`Skills Assessment Results:\n\n${response}`, {
        title: `Skills Assessment - ${new Date().toLocaleDateString()}`,
        source: 'skills-assessment',
        category: 'assessments',
        tags: ['skills', 'assessment', 'tech-roles']
      });
      console.log('\n💾 Assessment saved to your knowledge base for future reference!');
    } catch (error) {
      // Silent fail
    }
    
    this.conversationHistory.push(`Skills Assessment: ${response}`);
    await this.pressEnterToContinue();
  }

  private async careerPathExploration(): Promise<void> {
    console.log('\n🛤️ TECH CAREER PATH EXPLORATION\n');
    
    const prompt = `As ${this.userProfile.name}'s career coach, recommend the top 3 tech career paths that best match their background.
    
    Their profile:
    - Current Role: ${this.userProfile.currentRole}
    - Experience: ${this.userProfile.experience}
    - Skills: ${this.userProfile.skills.join(', ')}
    - Location: ${this.userProfile.location}
    - Goals: ${this.userProfile.goals.join(', ')}
    
    For each career path, include:
    1. Why it's perfect for their BPO experience
    2. Expected salary range in Philippines (in PHP)
    3. Learning timeline
    4. Specific skills they already have that apply
    5. What new skills they need to learn
    6. Compatibility percentage
    
    Make it personal and encouraging. Include real job market demand information for Philippines.`;

    const { response, timing } = await this.queryWithTiming(prompt, this.coach);
    
    console.log(`✨ Career paths analyzed in ${timing}s\n`);
    console.log(response);
    
    // Interactive follow-up
    console.log('\n📋 QUICK INTEREST CHECK:');
    const interest = await this.askQuestion('Which career path interests you most? (Type the role name): ');
    
    if (interest) {
      const followUpPrompt = `${this.userProfile.name} is interested in: ${interest}. 
      Provide detailed next steps specifically for this career path.
      Consider their current situation: ${this.userProfile.experience}, location: ${this.userProfile.location}
      
      Include:
      1. First 3 things they should do this week
      2. Free resources to get started (Philippines-accessible)
      3. Timeline expectations
      4. Potential challenges and how to overcome them
      5. Local communities or groups to join
      
      Be very specific and actionable for someone in the Philippines.`;
      
      console.log(`\n🎯 DETAILED GUIDANCE FOR ${interest.toUpperCase()}:`);
      
      const { response: followUpResponse, timing: followUpTiming } = await this.queryWithTiming(followUpPrompt, this.coach);
      
      console.log(`✨ Personalized roadmap created in ${followUpTiming}s\n`);
      console.log(followUpResponse);
      
      // Save the career interest and guidance
      try {
        await this.userRAG.addDocument(`Career Path Exploration - Interest in ${interest}:\n\n${followUpResponse}`, {
          title: `${interest} Career Path - ${new Date().toLocaleDateString()}`,
          source: 'career-exploration',
          category: 'career-planning',
          tags: ['career-path', interest.toLowerCase(), 'guidance']
        });
        console.log('\n💾 Career guidance saved to your knowledge base!');
      } catch (error) {
        // Silent fail
      }
      
      this.conversationHistory.push(`Career Exploration: ${interest} - ${followUpResponse}`);
    }
    
    await this.pressEnterToContinue();
  }

  private async learningRoadmap(): Promise<void> {
    console.log('\n📚 PERSONALIZED LEARNING ROADMAP\n');
    
    const careerChoice = await this.askQuestion('Which tech career are you most serious about pursuing? ');
    if (!careerChoice) return;

    const timeCommitment = await this.askQuestion(`How many hours per week can you realistically study? (Current: ${this.userProfile.preferences?.timeAvailable || 'not specified'}): `);
    
    const prompt = `Create a detailed, week-by-week learning roadmap for ${this.userProfile.name} to transition to ${careerChoice}.
    
    Consider their situation:
    - Current role: ${this.userProfile.currentRole}
    - Experience: ${this.userProfile.experience}
    - Location: ${this.userProfile.location}
    - Time available: ${timeCommitment || this.userProfile.preferences?.timeAvailable}
    - Learning style: ${this.userProfile.preferences?.learningStyle}
    - Budget: ${this.userProfile.preferences?.budget}
    - Current skills: ${this.userProfile.skills.join(', ')}
    
    Provide:
    1. Monthly breakdown of learning goals
    2. Specific free resources and courses (Philippines-accessible)
    3. Practice projects they can build
    4. Weekly schedule suggestions
    5. Milestones to track progress
    6. Local communities and networking opportunities
    
    Make it realistic and achievable for their specific situation.`;
    
    console.log(`\n🗓️ CREATING YOUR ${careerChoice.toUpperCase()} ROADMAP...`);
    
    const { response, timing } = await this.queryWithTiming(prompt, this.coach);
    
    console.log(`✨ Roadmap generated in ${timing}s\n`);
    console.log(response);
    
    // Save the learning roadmap
    try {
      await this.userRAG.addDocument(`Learning Roadmap for ${careerChoice}:\n\nTime Commitment: ${timeCommitment} hours/week\n\n${response}`, {
        title: `${careerChoice} Learning Roadmap - ${new Date().toLocaleDateString()}`,
        source: 'learning-roadmap',
        category: 'learning-plans',
        tags: ['roadmap', careerChoice.toLowerCase(), 'learning-plan']
      });
      console.log('\n💾 Learning roadmap saved to your knowledge base!');
    } catch (error) {
      // Silent fail
    }
    
    this.conversationHistory.push(`Learning Roadmap: ${careerChoice} - ${timeCommitment}hrs/week`);
    await this.pressEnterToContinue();
  }

  private async motivationalSupport(): Promise<void> {
    console.log('\n💪 MOTIVATIONAL SUPPORT & ENCOURAGEMENT\n');
    
    const currentFeeling = await this.askQuestion('How are you feeling about your career transition right now? (excited/nervous/overwhelmed/determined): ');
    
    const prompt = `${this.userProfile.name} is feeling ${currentFeeling} about their career transition.
    
    Their profile:
    - Background: ${this.userProfile.experience}
    - Current challenges: ${this.userProfile.painPoints.join(', ')}
    - Goals: ${this.userProfile.goals.join(', ')}
    - Strengths: ${this.userProfile.skills.join(', ')}
    
    Provide:
    1. Empathetic response to their current emotional state
    2. Relevant success story of someone similar to their situation
    3. Specific encouragement about their unique strengths
    4. Reminder of their why and goals
    5. One small action they can take today to move forward
    6. Affirmation that highlights their existing value
    
    Be warm, understanding, and culturally sensitive to Filipino context.
    Reference family support and community values. Make it personal and heartfelt.`;
    
    const { response, timing } = await this.queryWithTiming(prompt, this.coach);
    
    console.log(`✨ Encouragement crafted in ${timing}s\n`);
    console.log(response);
    
    // Personal affirmation
    console.log('\n🌟 DAILY AFFIRMATION FOR YOU:');
    console.log('┌─────────────────────────────────────────────────────────┐');
    console.log(`│ "${this.userProfile.name}, your ${this.userProfile.experience} isn't just`);
    console.log('│ customer service - it\'s problem-solving, communication, │');
    console.log('│ and resilience under pressure. These are exactly the    │');
    console.log('│ skills tech companies desperately need. You belong!"    │');
    console.log('└─────────────────────────────────────────────────────────┘');
    
    // Save motivational note
    try {
      await this.userRAG.addDocument(`Motivational Session - Feeling: ${currentFeeling}\n\n${response}`, {
        title: `Motivation Boost - ${new Date().toLocaleDateString()}`,
        source: 'motivational-support',
        category: 'motivation',
        tags: ['motivation', 'encouragement', currentFeeling || 'support']
      });
      console.log('\n💾 Motivational insights saved for when you need them!');
    } catch (error) {
      // Silent fail
    }
    
    await this.pressEnterToContinue();
  }

  private async displayProgress(): Promise<void> {
    console.log('\n📈 YOUR CAREER TRANSITION JOURNEY\n');
    
    const userStats = this.userRAG.getStats();
    
    console.log('📊 PROGRESS OVERVIEW:');
    console.log('═'.repeat(60));
    console.log(`📚 Knowledge Base: ${userStats.totalDocuments} saved items`);
    console.log(`🆕 Recent Activity: ${userStats.recentDocuments} items this week`);
    
    if (Object.keys(userStats.categories).length > 0) {
      console.log('\n📂 Your Focus Areas:');
      Object.entries(userStats.categories).forEach(([category, count]) => {
        console.log(`  ${category}: ${count} items`);
      });
    }
    
    console.log('\n📝 RECENT COACHING SESSIONS:');
    console.log('═'.repeat(60));
    
    if (this.conversationHistory.length === 0) {
      console.log('🔄 No session history yet. Start with an assessment or career exploration!');
    } else {
      this.conversationHistory.slice(-5).forEach((entry, index) => {
        console.log(`${index + 1}. ${entry.substring(0, 80)}...`);
      });
    }
    
    console.log('\n🎯 SUGGESTED NEXT ACTIONS:');
    console.log('• Continue with consistent daily learning (even 15 minutes helps!)');
    console.log('• Review your saved notes and roadmaps regularly');
    console.log('• Join Filipino tech communities for support');
    console.log('• Practice with real projects and build your portfolio');
    console.log('• Connect with mentors in your chosen field');
    
    await this.pressEnterToContinue();
  }

  private async updateProfile(): Promise<void> {
    console.log('\n🔧 UPDATE YOUR PROFILE\n');
    console.log('Current profile:');
    console.log(`Name: ${this.userProfile.name}`);
    console.log(`Role: ${this.userProfile.currentRole}`);
    console.log(`Experience: ${this.userProfile.experience}`);
    console.log(`Location: ${this.userProfile.location}`);
    console.log(`Goals: ${this.userProfile.goals.join(', ')}`);
    
    const field = await this.askQuestion('\nWhich field would you like to update? (name/role/experience/location/goals): ');
    
    if (!field) return;
    
    switch (field.toLowerCase()) {
      case 'name':
        const newName = await this.askQuestion('New name: ');
        if (newName) this.userProfile.name = newName;
        break;
      case 'role':
        const newRole = await this.askQuestion('New current role: ');
        if (newRole) this.userProfile.currentRole = newRole;
        break;
      case 'experience':
        const newExp = await this.askQuestion('Experience description: ');
        if (newExp) this.userProfile.experience = newExp;
        break;
      case 'location':
        const newLocation = await this.askQuestion('New location: ');
        if (newLocation) this.userProfile.location = newLocation;
        break;
      case 'goals':
        const newGoals = await this.askQuestion('Goals (comma-separated): ');
        if (newGoals) this.userProfile.goals = newGoals.split(',').map(g => g.trim());
        break;
      default:
        console.log('❌ Invalid field');
        return;
    }
    
    console.log('✅ Profile updated successfully!');
    
    // Save profile update
    try {
      await this.userRAG.addDocument(`Profile Update - ${field}: ${JSON.stringify(this.userProfile, null, 2)}`, {
        title: `Profile Update - ${new Date().toLocaleDateString()}`,
        source: 'profile-update',
        category: 'profile',
        tags: ['profile', 'update', field]
      });
    } catch (error) {
      // Silent fail
    }
  }

  private showHelp(): void {
    console.log('\n📖 INTEGRATED COACH + RAG COMMANDS:');
    console.log('═'.repeat(60));
    console.log('🎯 COACHING SESSIONS:');
    console.log('  assess           - Skills assessment & tech role matching');
    console.log('  explore          - Explore tech career paths');
    console.log('  roadmap          - Get personalized learning roadmap');
    console.log('  motivate         - Motivational support & encouragement');
    console.log('');
    console.log('💾 KNOWLEDGE MANAGEMENT:');
    console.log('  save <note>      - Save important notes/insights');
    console.log('  remember <query> - Search your saved knowledge');
    console.log('  progress         - Review your journey & progress');
    console.log('');
    console.log('⚙️ SYSTEM:');
    console.log('  profile          - Update your profile');
    console.log('  help             - Show this help');
    console.log('  exit             - Exit coaching session');
    console.log('');
    console.log('💬 CHAT:');
    console.log('  <message>        - Chat with context-aware coach');
    console.log('');
    console.log('💡 FEATURES:');
    console.log('  • Automatic insight saving from conversations');
    console.log('  • Context-aware responses using your history');
    console.log('  • Personalized coaching based on your profile');
    console.log('  • Search through all your coaching sessions');
    console.log('');
  }

  private displayWelcome(): void {
    console.log(`
╭─────────────────────────────────────────────────────────────╮
│                🚀 SUMAKSES INTEGRATED COACH + RAG           │
│                                                             │
│  Hello ${this.userProfile.name}! 👋                        │
│  I'm your AI career coach with intelligent memory          │
│  I remember our conversations and learn from your journey  │
│                                                             │
│  💼 Current: ${this.userProfile.currentRole.substring(0, 30)}${this.userProfile.currentRole.length > 30 ? '...' : ''}         │
│  🎯 Goal: Tech Career Transition                           │
│  📍 Location: ${this.userProfile.location}                 │
│  🧠 Memory: ${this.userRAG.getStats().totalDocuments} saved items                                │
╰─────────────────────────────────────────────────────────────╯
    `);
  }

  private async askQuestion(question: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  private async pressEnterToContinue(): Promise<void> {
    await this.askQuestion('\n📱 Press Enter to continue...');
    console.clear();
  }

  private async queryWithTiming(prompt: string, queryEngine: any): Promise<{ response: string; timing: number }> {
    const startTime = this.startThinking();
    
    try {
      const response = await queryEngine.query({ query: prompt });
      const timing = this.stopThinking(startTime);
      
      return { response: response.response, timing };
    } catch (error) {
      this.stopThinking(startTime);
      throw error;
    }
  }

  private startThinking(): number {
    const startTime = Date.now();
    let spinnerIndex = 0;
    const spinnerChars = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    
    process.stdout.write('\x1B[?25l'); // Hide cursor
    
    this.thinkingInterval = setInterval(() => {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const spinner = spinnerChars[spinnerIndex % spinnerChars.length];
      spinnerIndex++;
      
      process.stdout.write('\r\x1B[K');
      process.stdout.write(`${spinner} 🤖 Thinking with your context... ${elapsed}s`);
    }, 100);
    
    return startTime;
  }

  private stopThinking(startTime: number): number {
    if (this.thinkingInterval) {
      clearInterval(this.thinkingInterval);
      this.thinkingInterval = null;
    }
    
    process.stdout.write('\x1B[?25h'); // Show cursor
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    process.stdout.write('\r\x1B[K'); // Clear thinking line
    
    return parseFloat(totalTime);
  }

  public cleanup(): void {
    if (this.thinkingInterval) {
      clearInterval(this.thinkingInterval);
      this.thinkingInterval = null;
    }
    process.stdout.write('\x1B[?25h'); // Show cursor
    this.rl.close();
  }
}

// Export main function for external use
export async function startCoachSystem(customProfile?: Partial<UserProfile>): Promise<void> {
  console.log('🤖 Welcome to SUMAKSES Integrated Coach + RAG System!');
  
  const coach = new IntegratedCoachRAG(customProfile);
  
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
  await coach.start();
}

export { IntegratedCoachRAG, type UserProfile }; 