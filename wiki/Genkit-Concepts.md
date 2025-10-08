# Genkit Concepts

This guide explains the core concepts of Google Genkit and how they're used in this workshop project.

## What is Genkit?

**Genkit** is Google's AI orchestration framework for building production-ready AI applications. It provides:

- 🔧 **Type-safe AI workflows** - Full TypeScript support with runtime validation
- 🔄 **Multi-provider support** - Use Google, OpenAI, Anthropic, and more
- 🛠️ **Reusable components** - Prompts, tools, and flows
- 📊 **Developer tools** - Built-in UI for testing and debugging
- 🚀 **Production-ready** - Error handling, retries, and observability

## Core Concepts

### 1. Genkit Instance

The foundation of every Genkit application is the Genkit instance:

```typescript
import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/google-genai";
import { openAI } from "@genkit-ai/compat-oai/openai";

const ai = genkit({ 
  plugins: [googleAI(), openAI()] 
});
```

**Key Points:**
- Created once and imported throughout your app
- Configures AI providers (plugins)
- Provides methods for defining prompts, tools, and flows

**In our project:** See `src/index.ts` line 5

### 2. Prompts

Prompts are reusable templates for AI interactions.

#### Defining a Prompt

```typescript
export const studyTopicsPromptDef = ai.definePrompt(
  {
    name: "studyTopicsPrompt",
    description: "Generate study topics for a given subject",
    model: "googleai/gemini-2.0-flash-exp",
    input: {
      schema: z.object({
        subject: z.string(),
        topicCount: z.number().optional(),
      }),
    },
  },
  `You are an expert tutor with deep knowledge across all academic subjects.

Given the subject "{{subject}}", suggest {{topicCount}} concise, actionable study topics as a bullet list.`
);
```

**Key Features:**
- **Variable interpolation**: Use `{{variable}}` syntax
- **Type safety**: Input schema with Zod validation
- **Model specification**: Define which model to use
- **Reusability**: Call the same prompt with different inputs

**In our project:**
- `studyTopicsPromptDef` - Simple topic generation
- `structuredStudyPlanPromptDef` - Detailed study plans

#### Using Prompts in Flows

```typescript
// Helper function approach (used in our project)
const studyTopicsPrompt = (subject: string, topicCount: number = 5) => 
  `You are an expert tutor...
Given the subject "${subject}", suggest ${topicCount} topics...`;

// Use in generate call
const result = await ai.generate({
  model: "googleai/gemini-2.0-flash-exp",
  prompt: studyTopicsPrompt(subject, topicCount)
});
```

### 3. Tools

Tools extend AI capabilities with custom functions.

#### Defining a Tool

```typescript
export const findEducationalLink = ai.defineTool(
  {
    name: "findEducationalLink",
    inputSchema: z.object({
      topic: z.string(),
      preferredPlatform: z.enum(["youtube", "khanacademy", "coursera", "any"]).optional(),
    }),
    outputSchema: z.object({
      title: z.string(),
      url: z.string().url(),
      platform: z.string(),
    }),
    description: "Find a relevant educational link for a topic.",
  },
  async ({ topic, preferredPlatform }) => {
    // Your implementation
    return {
      title: `Introduction to ${topic}`,
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(topic)}`,
      platform: "YouTube"
    };
  }
);
```

**Key Features:**
- **Input validation**: Zod schemas ensure type safety
- **Output validation**: Runtime validation of results
- **Async support**: Can make API calls, database queries
- **AI can call them**: The AI model decides when to use tools

**In our project:**
- `findEducationalLink` - Finds educational resources
- `estimateStudyTime` - Calculates study time estimates
- `generateQuizQuestions` - Creates quiz questions (uses AI internally!)

#### Using Tools in Generate Calls

```typescript
const result = await ai.generate({
  model: "googleai/gemini-2.0-flash-exp",
  prompt: "Create a study plan for World History",
  tools: [findEducationalLink, estimateStudyTime], // AI can call these
  output: { format: "json", schema }
});
```

The AI model will automatically call tools when needed!

### 4. Flows

Flows are the main orchestration units in Genkit - they define complete AI workflows.

#### Defining a Flow

```typescript
export const studyPlanGenerator = ai.defineFlow(
  {
    name: "studyPlanGenerator",
    inputSchema: z.object({
      subject: z.string().min(1, "subject required"),
      model: z.string().optional(),
      topicCount: z.number().min(3).max(10).optional(),
    }),
    outputSchema: z.object({ 
      text: z.string() 
    }),
  },
  async ({ subject, model, topicCount = 5 }) => {
    const selectedModel = model || "googleai/gemini-2.0-flash-exp";
    
    const result = await ai.generate({
      model: selectedModel,
      prompt: studyTopicsPrompt(subject, topicCount),
    });
    
    return { text: result.text ?? "No suggestions available." };
  }
);
```

**Key Features:**
- **Input validation**: Type-safe inputs with Zod
- **Output validation**: Ensures correct return types
- **Traceable**: All flows appear in Genkit Dev UI
- **Composable**: Flows can call other flows
- **Error handling**: Built-in retry and error handling

**In our project:**
- `studyPlanGenerator` - Simple text-based flow
- `studyPlanGeneratorStructured` - JSON output with tools
- `enhancedStudyPlanGenerator` - Advanced flow with conditional logic

#### Flow Patterns

**Pattern 1: Simple Generation**
```typescript
const result = await ai.generate({
  model: "googleai/gemini-2.0-flash-exp",
  prompt: "Your prompt here"
});
return { text: result.text };
```

**Pattern 2: Structured Output**
```typescript
const result = await ai.generate({
  model: "googleai/gemini-2.0-flash-exp",
  prompt: "Your prompt",
  output: { 
    format: "json", 
    schema: z.object({ /* your schema */ })
  }
});
return result.output;
```

**Pattern 3: With Tools**
```typescript
const result = await ai.generate({
  model: "googleai/gemini-2.0-flash-exp",
  prompt: "Your prompt",
  tools: [tool1, tool2],
  output: { format: "json", schema }
});
// AI automatically calls tools as needed
return result.output;
```

**Pattern 4: Tool Composition**
```typescript
// Call tools manually for complex logic
const resource = await findEducationalLink({ topic: subject });
const timeEstimate = await estimateStudyTime({ topic, difficulty });

return {
  subject,
  resource,
  estimatedTime: timeEstimate
};
```

### 5. Generate API

The `ai.generate()` method is the core API for AI interactions.

```typescript
const result = await ai.generate({
  model: "googleai/gemini-2.0-flash-exp",  // Required: which model
  prompt: "Your prompt text",               // Required: what to generate
  output: {                                 // Optional: output format
    format: "json",                        // or "text"
    schema: z.object({ /* ... */ })        // Zod schema for validation
  },
  tools: [tool1, tool2],                   // Optional: tools AI can use
  config: {                                // Optional: generation config
    temperature: 0.7,
    maxOutputTokens: 1000,
  }
});

// Access results
result.text      // Generated text
result.output    // Structured output (if format: "json")
result.usage     // Token usage stats
```

### 6. Type Safety with Zod

Genkit heavily uses [Zod](https://zod.dev/) for runtime type validation.

```typescript
// Define schemas
const inputSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  topicCount: z.number().min(3).max(10).optional(),
});

// TypeScript types are inferred!
type Input = z.infer<typeof inputSchema>;

// Runtime validation
const validated = inputSchema.parse(userInput);
```

**Benefits:**
- Catches errors at runtime
- Provides clear error messages
- TypeScript types are inferred
- Documentation through code

### 7. Multi-Provider Support

Genkit supports multiple AI providers seamlessly:

```typescript
// Configuration
const ai = genkit({ 
  plugins: [
    googleAI(),  // Google Gemini models
    openAI()     // OpenAI GPT models
  ] 
});

// Use any model by provider prefix
await ai.generate({
  model: "googleai/gemini-2.0-flash-exp"     // Google
});

await ai.generate({
  model: "openai/gpt-4o-mini"                // OpenAI
});
```

**In our project:** Users can switch between models in the UI!

## How It All Works Together

Here's how a complete request flows through our application:

```
1. User submits form in UI (page.tsx)
   ↓
2. POST request to /api/generate (route.ts)
   ↓
3. Route validates input and selects flow
   ↓
4. Flow executes with:
   - Prompt template
   - AI generate call
   - Optional tool calls
   ↓
5. Response formatted and returned
   ↓
6. UI displays results
```

## Example: Complete Flow Breakdown

Let's trace `studyPlanGeneratorStructured`:

```typescript
export const studyPlanGeneratorStructured = ai.defineFlow(
  {
    // 1. Define input contract
    inputSchema: z.object({
      subject: z.string().min(1),
      model: z.string().optional(),
      difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
    }),
    // 2. Define output contract
    outputSchema: z.object({
      subject: z.string(),
      topics: z.array(z.string()),
      resource: z.object({
        title: z.string(),
        url: z.string().url(),
        platform: z.string().optional(),
      }),
      difficulty: z.string().optional(),
    }),
  },
  async ({ subject, model, difficulty = "beginner" }) => {
    // 3. Select model
    const selectedModel = model || "googleai/gemini-2.0-flash-exp";
    
    // 4. Call AI with prompt template and tool
    const result = await ai.generate({
      model: selectedModel,
      prompt: structuredStudyPlanPrompt(subject, difficulty),
      output: { format: "json", schema },
      tools: [findEducationalLink], // AI can call this tool
    });
    
    // 5. Validate and enhance output
    const json = result.output as StudyPlan;
    
    // 6. Fallback if tool wasn't called
    if (!json?.resource?.url) {
      const resource = await findEducationalLink({ topic: subject });
      json.resource = resource;
    }
    
    // 7. Return validated output
    return json;
  }
);
```

## Best Practices

### ✅ Do's

1. **Always use Zod schemas** for input and output validation
2. **Provide clear descriptions** for tools and prompts
3. **Handle errors gracefully** with try-catch blocks
4. **Use helper functions** for reusable prompt logic
5. **Test in Genkit Dev UI** before integrating into flows
6. **Keep prompts focused** - one prompt, one purpose
7. **Make tools atomic** - each tool does one thing well

### ❌ Don'ts

1. **Don't skip validation** - always validate inputs and outputs
2. **Don't hardcode models** - make them configurable
3. **Don't ignore errors** - handle and log them properly
4. **Don't make tools too complex** - split into smaller tools
5. **Don't forget type safety** - use TypeScript everywhere
6. **Don't skip testing** - test flows with various inputs

## Key Takeaways

1. **Genkit = Type-Safe AI Orchestration**
   - Everything is validated at runtime
   - TypeScript types are inferred from schemas

2. **Three Main Building Blocks**
   - **Prompts**: Reusable templates
   - **Tools**: Extend AI capabilities  
   - **Flows**: Orchestrate everything

3. **Generate API is Central**
   - All AI interactions go through `ai.generate()`
   - Supports text and structured JSON output
   - Tools are automatically called by AI

4. **Multi-Provider by Default**
   - Switch between providers easily
   - Same code works with different models

5. **Developer Experience First**
   - Dev UI for testing
   - Type safety everywhere
   - Clear error messages

---

**Next:** Learn about the three flows in [Flows Guide](Flows-Guide) →

