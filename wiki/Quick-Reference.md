# Quick Reference Card

Essential commands, code snippets, and references for quick access during development.

## 🚀 Quick Start Commands

```bash
# Install dependencies
bun install

# Start development server
bun dev

# Start Genkit Dev UI
bun run genkit

# Build for production
bun run build

# Lint code
bun run lint

# Format code
bun run format
```

## 🔑 Environment Variables

```bash
# .env.local
GOOGLE_GENAI_API_KEY=your_google_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

## 📝 Common Code Snippets

### Define a Prompt

```typescript
export const myPrompt = ai.definePrompt(
  {
    name: "myPrompt",
    description: "What this prompt does",
    model: "googleai/gemini-2.0-flash-exp",
    input: {
      schema: z.object({
        variable: z.string(),
      }),
    },
  },
  `Your prompt template with {{variable}}`
);
```

### Define a Tool

```typescript
export const myTool = ai.defineTool(
  {
    name: "myTool",
    inputSchema: z.object({
      input: z.string(),
    }),
    outputSchema: z.object({
      result: z.string(),
    }),
    description: "What this tool does",
  },
  async ({ input }) => {
    // Implementation
    return { result: "output" };
  }
);
```

### Define a Flow

```typescript
export const myFlow = ai.defineFlow(
  {
    name: "myFlow",
    inputSchema: z.object({
      subject: z.string(),
    }),
    outputSchema: z.object({
      text: z.string(),
    }),
  },
  async ({ subject }) => {
    const result = await ai.generate({
      model: "googleai/gemini-2.0-flash-exp",
      prompt: `Generate content about ${subject}`,
    });
    
    return { text: result.text };
  }
);
```

### Call AI with Tools

```typescript
const result = await ai.generate({
  model: "googleai/gemini-2.0-flash-exp",
  prompt: "Your prompt",
  tools: [tool1, tool2],
  output: {
    format: "json",
    schema: z.object({ /* schema */ }),
  },
});
```

### API Endpoint

```typescript
// app/api/myendpoint/route.ts
import { NextResponse } from "next/server";
import { myFlow } from "@/index";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await myFlow(body);
    return NextResponse.json({ data: result });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
```

## 🎯 Flow Modes Comparison

| Mode | Speed | Output | Tools | Use Case |
|------|-------|--------|-------|----------|
| **Simple** | ⚡⚡⚡ Fast | Text | None | Quick brainstorming |
| **Structured** | ⚡⚡ Medium | JSON | 1 (auto) | APIs, structured data |
| **Enhanced** | ⚡ Slower | JSON+ | 2+ (manual) | Complex features |

## 🛠️ Available Tools

| Tool | Purpose | Input | Output |
|------|---------|-------|--------|
| `findEducationalLink` | Find resources | topic, platform | title, url, platform |
| `estimateStudyTime` | Time estimates | topic, difficulty | hours/week, weeks |
| `generateQuizQuestions` | Create quizzes | topic, count, difficulty | questions array |

## 📊 Time Estimates by Difficulty

| Difficulty | Hours/Week | Weeks | Total |
|------------|-----------|-------|-------|
| Beginner | 5 | 4 | 20h |
| Intermediate | 8 | 8 | 64h |
| Advanced | 12 | 12 | 144h |

## 🎨 Supported Models

```typescript
// Google Models
"googleai/gemini-2.0-flash-exp"           // Fast, default
"googleai/gemini-2.0-flash-thinking-exp"  // With reasoning

// OpenAI Models
"openai/gpt-4o-mini"                      // Efficient GPT-4
```

## 🔍 Common Zod Schemas

```typescript
// String validation
z.string()
z.string().min(1, "Required")
z.string().email()
z.string().url()

// Number validation
z.number()
z.number().min(0).max(100)
z.number().positive()

// Enum
z.enum(["option1", "option2", "option3"])

// Array
z.array(z.string())
z.array(z.string()).min(1).max(10)

// Object
z.object({
  name: z.string(),
  age: z.number(),
})

// Optional
z.string().optional()
z.number().optional().default(5)
```

## 🐛 Debugging Commands

```bash
# Check for errors
bun run lint

# View detailed logs
DEBUG=* bun dev

# Clear cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules bun.lock
bun install

# Test API endpoint
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"subject":"Python","flowMode":"simple"}'
```

## 🔗 Important URLs

### Development
- **App:** http://localhost:3000
- **Genkit Dev UI:** http://localhost:4000

### External Resources
- **[Genkit Docs](https://firebase.google.com/docs/genkit)**
- **[Google AI Studio](https://makersuite.google.com/app/apikey)**
- **[OpenAI Platform](https://platform.openai.com/api-keys)**
- **[Zod Docs](https://zod.dev/)**

## ⚡ Performance Tips

1. **Parallelize tool calls:**
   ```typescript
   await Promise.all([tool1(), tool2(), tool3()]);
   ```

2. **Use faster models for simple tasks:**
   ```typescript
   model: "googleai/gemini-2.0-flash-exp"
   ```

3. **Cache expensive operations:**
   ```typescript
   const cached = await getCached(key) || await generate();
   ```

4. **Debounce user input:**
   ```typescript
   const debounced = debounce(handler, 500);
   ```

## 🔒 Security Checklist

- ✅ API keys in `.env.local` (not in code)
- ✅ `.env.local` in `.gitignore`
- ✅ Input validation with Zod
- ✅ Rate limiting on API endpoints
- ✅ Sanitize user inputs
- ✅ Error messages don't expose secrets

## 📋 Request/Response Examples

### Simple Flow
```json
// Request
{
  "subject": "Python",
  "flowMode": "simple",
  "topicCount": 5
}

// Response
{
  "data": {
    "text": "• Topic 1\n• Topic 2..."
  },
  "quiz": null,
  "meta": {
    "flowMode": "simple",
    "toolsUsed": ["studyTopicsPrompt"]
  }
}
```

### Enhanced Flow
```json
// Request
{
  "subject": "React",
  "flowMode": "enhanced",
  "difficulty": "intermediate",
  "includeTimeEstimates": true,
  "includeQuiz": true
}

// Response
{
  "data": {
    "subject": "React",
    "difficulty": "intermediate",
    "topics": [
      {
        "name": "React Hooks",
        "estimatedTime": {
          "hoursPerWeek": 8,
          "totalWeeks": 8
        }
      }
    ],
    "resource": { /* ... */ },
    "totalEstimatedHours": 64
  },
  "quiz": [ /* ... */ ],
  "meta": { /* ... */ }
}
```

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Invalid API key | Check `.env.local`, restart server |
| Port in use | `lsof -ti:3000 \| xargs kill -9` |
| Module not found | `rm -rf node_modules && bun install` |
| Styles not loading | `rm -rf .next && bun dev` |
| Rate limit | Wait 60s or switch model |
| Generation fails | Check server logs, try different model |

## 📚 File Locations

```
src/
├── app/
│   ├── api/generate/route.ts    # API endpoint
│   ├── globals.css              # Styles
│   ├── layout.tsx               # Layout
│   └── page.tsx                 # UI
├── index.ts                     # Flows, tools, prompts
└── genkit.config.ts             # Genkit config
```

## 🎓 Learning Path

**Beginner:**
1. Setup → 2. Concepts → 3. Exercises 1-3

**Intermediate:**
1. Concepts → 2. Flows → 3. Tools → 4. Exercises 1-5

**Advanced:**
1. Advanced Topics → 2. Exercises 6-10 → 3. Build features

## 💡 Pro Tips

1. **Test in Genkit Dev UI first** before integrating
2. **Use Zod for everything** - runtime validation is critical
3. **Parallelize when possible** - major performance gains
4. **Cache expensive operations** - save API calls and time
5. **Start simple, then enhance** - don't over-engineer
6. **Read error messages carefully** - they're usually clear
7. **Use TypeScript** - catch errors at compile time

---

**Need more details?** See the full [documentation](Home) →

