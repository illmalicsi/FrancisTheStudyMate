# Frequently Asked Questions (FAQ)

Common questions about the SysDev Genkit Workshop.

## General Questions

### What is Genkit?

Genkit is Google's AI orchestration framework for building production-ready AI applications. It provides type-safe workflows, multi-provider support, reusable components (prompts, tools, flows), and built-in developer tools.

**Key benefits:**
- Full TypeScript support with runtime validation
- Works with Google, OpenAI, Anthropic, and other providers
- Built-in Dev UI for testing and debugging
- Production-ready error handling and observability

### What will I learn from this workshop?

You'll learn to:
- Build type-safe AI applications with Genkit
- Create reusable prompts and tools
- Design complex AI workflows (flows)
- Integrate multiple AI providers
- Build full-stack Next.js apps with AI features
- Handle structured JSON outputs
- Implement tool composition patterns

### Do I need prior AI/ML knowledge?

No! This workshop focuses on **using** AI models through Genkit, not building them. You should know:
- JavaScript/TypeScript basics
- React fundamentals
- Basic async/await concepts
- REST API concepts

No ML/AI expertise required!

### Which AI providers are supported?

Currently configured:
- **Google Gemini** (googleai/gemini-2.0-flash-exp)
- **Google Gemini Thinking** (googleai/gemini-2.0-flash-thinking-exp)
- **OpenAI** (openai/gpt-4o-mini)

Genkit also supports: Anthropic Claude, Vertex AI, Ollama, and custom providers.

---

## Setup and Installation

### Which package manager should I use?

**Recommended:** Bun (fastest)
```bash
bun install
bun dev
```

**Alternatives:** npm, yarn, pnpm all work fine
```bash
npm install && npm run dev
yarn && yarn dev
pnpm install && pnpm dev
```

The project is optimized for Bun but compatible with all package managers.

### Do I need both Google and OpenAI API keys?

No, you only need one. The app works with either:
- **Google API key** → Use Gemini models
- **OpenAI API key** → Use GPT models
- **Both** → Switch between all models

Add keys to `.env.local`:
```bash
GOOGLE_GENAI_API_KEY=your_key    # For Gemini models
OPENAI_API_KEY=your_key          # For GPT models
```

### Are the API keys free?

**Google Gemini (AI Studio):**
- ✅ Free tier available
- 15 requests per minute
- 1,500 requests per day
- Good for development and learning

**OpenAI GPT-4o Mini:**
- ⚠️ Requires payment method
- Very low cost ($0.15-0.60 per million tokens)
- Free trial credits for new accounts
- Check [OpenAI Pricing](https://openai.com/pricing)

**Recommendation for students:** Start with Google Gemini (free tier).

### Can I run this without an API key?

No, you need at least one API key. However:
- Google Gemini free tier is sufficient for learning
- You can share a team API key (check with instructor)
- Some universities provide educational credits

---

## Development Questions

### What's the difference between the three flows?

| Feature | Simple | Structured | Enhanced |
|---------|--------|------------|----------|
| **Output** | Text | JSON | JSON + metadata |
| **Tools** | None | 1 (automatic) | 2+ (manual) |
| **Speed** | Fastest | Medium | Slowest |
| **Use Case** | Quick brainstorming | APIs, integrations | Learning platforms |
| **Complexity** | Beginner | Intermediate | Advanced |

**Choose based on your needs:**
- Quick topic list? → Simple
- Need structured data? → Structured
- Want time estimates and quizzes? → Enhanced

### What are "tools" in Genkit?

Tools are functions that extend AI capabilities. They:
- Have typed input/output schemas (Zod)
- Can be called by the AI model automatically
- Or called manually in your code
- Can do anything: API calls, database queries, calculations

**Example:**
```typescript
// AI can call this tool when needed
const findResource = ai.defineTool({
  name: "findResource",
  inputSchema: z.object({ topic: z.string() }),
  outputSchema: z.object({ url: z.string() }),
}, async ({ topic }) => {
  return { url: `https://youtube.com/search?q=${topic}` };
});
```

### What's the difference between prompts and tools?

**Prompts:**
- Templates for AI interactions
- Define what the AI should do
- Include variable interpolation
- Reusable across flows
- Example: "Generate study topics for {{subject}}"

**Tools:**
- Functions the AI can call
- Extend AI capabilities
- Perform actions (API calls, calculations)
- Example: Finding educational resources, estimating time

**Analogy:**
- **Prompt** = Instructions you give to AI
- **Tool** = Actions AI can take

### How does the AI know when to call tools?

The AI model decides automatically based on:
1. Tool descriptions
2. The prompt you provide
3. The context of the request

**Example:**
```typescript
await ai.generate({
  prompt: "Create a study plan with resources",
  tools: [findResource],  // AI sees this is available
});

// AI thinks: "I need to find resources → I'll call findResource tool"
```

You can also call tools manually for precise control.

---

## Usage Questions

### Why is generation slow sometimes?

Several factors affect speed:
1. **Model choice** - Flash models are faster
2. **Complexity** - Enhanced mode makes more AI calls
3. **Tool calls** - Each tool call adds latency
4. **Network** - API calls require internet
5. **Rate limits** - Waiting between requests

**Solutions:**
- Use `gemini-2.0-flash-exp` (fastest)
- Use Simple mode for quick results
- Disable optional features (quiz, time estimates)
- Check your internet connection

### Can I use this offline?

No, the app requires internet because:
- AI models are cloud-hosted
- API calls to Google/OpenAI servers
- Real-time generation

**Alternative:** You could use local models with Ollama + Genkit, but that requires setup and powerful hardware.

### How accurate are the study plans?

The AI generates suggestions based on:
- Trained knowledge (up to model's cutoff date)
- Patterns in educational content
- Difficulty level you specify

**Limitations:**
- May not know very recent topics
- Resource links are generated (may not exist)
- Time estimates are general guidelines
- Quiz questions should be reviewed

**Best practice:** Use as a starting point, then customize based on your needs.

### Can I customize the prompts?

Yes! Prompts are in `src/index.ts`:

```typescript
// Modify existing prompts
const studyTopicsPrompt = (subject: string, topicCount: number) => 
  `Your custom prompt here...`;

// Or create new ones
export const customPrompt = ai.definePrompt({
  name: "customPrompt",
  // ... your prompt
});
```

See [Workshop Exercises](Workshop-Exercises) for prompt customization exercises.

---

## Technical Questions

### What's the `ai` instance?

```typescript
const ai = genkit({ 
  plugins: [googleAI(), openAI()] 
});
```

This is your Genkit instance. It provides methods for:
- `ai.definePrompt()` - Create prompts
- `ai.defineTool()` - Create tools
- `ai.defineFlow()` - Create flows
- `ai.generate()` - Call AI models

**Think of it as:** Your AI application factory.

### Why use Zod schemas?

Zod provides:
1. **Runtime validation** - Catches errors before they happen
2. **Type inference** - TypeScript types from schemas
3. **Clear errors** - Helpful validation messages
4. **Documentation** - Schema is self-documenting

**Example:**
```typescript
const schema = z.object({
  subject: z.string().min(1, "Subject required"),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
});

// TypeScript type is automatically inferred!
type Input = z.infer<typeof schema>;

// Runtime validation
const validated = schema.parse(userInput);  // Throws if invalid
```

### What's the difference between `format: "text"` and `format: "json"`?

```typescript
// Text format - returns plain text
const result = await ai.generate({
  prompt: "List topics",
  // output format defaults to "text"
});
console.log(result.text);  // "• Topic 1\n• Topic 2"

// JSON format - returns structured data
const result = await ai.generate({
  prompt: "Create study plan",
  output: { 
    format: "json", 
    schema: z.object({ topics: z.array(z.string()) })
  }
});
console.log(result.output);  // { topics: ["Topic 1", "Topic 2"] }
```

**Use JSON when:**
- Building APIs
- Need structured data
- Integrating with other systems
- Want type safety

**Use text when:**
- Simple output
- Human-readable content
- No further processing needed

### How do I add a new AI model?

1. **Install provider plugin:**
```bash
bun add @genkit-ai/anthropic  # Example: Anthropic Claude
```

2. **Configure in genkit.config.ts:**
```typescript
import { anthropic } from '@genkit-ai/anthropic';

export default {
  plugins: [
    googleAI(), 
    openAI(),
    anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  ],
};
```

3. **Use in generate calls:**
```typescript
await ai.generate({
  model: "anthropic/claude-3-sonnet-20240229",
  prompt: "Your prompt"
});
```

4. **Add to UI model selector** (optional):
```typescript
// src/app/page.tsx
<option value="anthropic/claude-3-sonnet-20240229">
  Claude 3 Sonnet
</option>
```

---

## Project Structure Questions

### Where should I add new flows?

Add to `src/index.ts`:
```typescript
export const myNewFlow = ai.defineFlow(
  {
    name: "myNewFlow",
    inputSchema: z.object({ /* ... */ }),
    outputSchema: z.object({ /* ... */ }),
  },
  async (input) => {
    // Implementation
  }
);
```

Then import in the API route:
```typescript
// src/app/api/generate/route.ts
import { myNewFlow } from '@/index';
```

### Where should I add new API endpoints?

Create a new file:
```
src/app/api/
└── your-endpoint/
    └── route.ts
```

Example:
```typescript
// src/app/api/quiz/route.ts
export async function POST(req: Request) {
  const body = await req.json();
  // Handle request
  return NextResponse.json({ data: result });
}
```

### How do I modify the UI?

Edit `src/app/page.tsx`:
```typescript
export default function Home() {
  // Add state
  const [newFeature, setNewFeature] = useState(false);
  
  // Add UI
  return (
    <div>
      {/* Your UI changes */}
    </div>
  );
}
```

### Can I add a database?

Yes! Common options:
- **Vercel Postgres** - Easy Next.js integration
- **Supabase** - Postgres + Auth + Storage
- **MongoDB** - Document database
- **Prisma** - ORM for any SQL database

Example with Prisma:
```bash
bun add prisma @prisma/client
npx prisma init
```

Then use in tools:
```typescript
const savePlan = ai.defineTool({
  name: "savePlan",
  // ...
}, async ({ plan }) => {
  await prisma.studyPlan.create({ data: plan });
});
```

---

## Deployment Questions

### Can I deploy this to production?

Yes! Deploy to:
- **Vercel** (recommended for Next.js)
- **Netlify**
- **Railway**
- **Google Cloud Run**
- **AWS**

**Vercel deployment:**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
```

### Do I need to change anything for production?

1. **Set environment variables** in hosting platform
2. **Add rate limiting** to prevent abuse
3. **Add analytics** (optional)
4. **Configure CORS** if building a separate frontend
5. **Set up monitoring** (Sentry, LogRocket, etc.)

### Is this production-ready?

The architecture is production-ready, but consider adding:
- ✅ Rate limiting
- ✅ User authentication
- ✅ Request caching
- ✅ Error monitoring
- ✅ Usage analytics
- ✅ Database for persistence
- ✅ API key rotation
- ✅ Request logging

See [Advanced Topics](Advanced-Topics) for production patterns.

---

## Learning Questions

### I'm stuck on an exercise, what should I do?

1. **Read the error message carefully**
2. **Check [Troubleshooting](Troubleshooting) page**
3. **Review relevant concept in [Genkit Concepts](Genkit-Concepts)**
4. **Test in Genkit Dev UI** to isolate the issue
5. **Compare with working code** in the main project
6. **Ask for help** with specific error messages

### How long will it take to complete the workshop?

**Beginner:** 8-12 hours
- Setup: 1 hour
- Core concepts: 2-3 hours
- Basic exercises: 3-5 hours
- Exploration: 2-3 hours

**Intermediate:** 6-8 hours
- Already know React/TypeScript
- Focus on Genkit concepts
- Complete advanced exercises

**Advanced:** 4-6 hours
- Experienced developers
- Quick concept review
- Build custom features

### What should I build next?

**Ideas:**
1. **Add new flows** - Recipe generator, workout planner
2. **Enhance tools** - Real API integrations, database storage
3. **Build new features** - User authentication, study progress tracking
4. **Create variations** - Different subjects (coding, language learning)
5. **Optimize** - Caching, parallel processing, streaming

See [Workshop Exercises](Workshop-Exercises) for structured challenges.

### Where can I learn more about Genkit?

- [Official Genkit Docs](https://firebase.google.com/docs/genkit)
- [Genkit GitHub](https://github.com/firebase/genkit)
- [Genkit Discord](https://discord.gg/qXt5zzQKpc)
- [Google AI Blog](https://developers.googleblog.com/)
- This workshop wiki!

---

## Contributing Questions

### Can I contribute to this project?

Yes! Contributions welcome:
- Bug fixes
- New exercises
- Documentation improvements
- New features
- Example projects

See contribution guidelines in repository.

### How do I report bugs?

Create an issue with:
1. **Description** of the bug
2. **Steps to reproduce**
3. **Expected behavior**
4. **Actual behavior**
5. **Environment** (OS, Node version, etc.)
6. **Screenshots** (if relevant)

### Can I use this for my own projects?

Yes! This project is open source. You can:
- Use as a template
- Modify for your needs
- Learn from the code
- Build commercial applications

Check the license file for details.

---

**More questions?** Check [Troubleshooting](Troubleshooting) or ask in discussions →

