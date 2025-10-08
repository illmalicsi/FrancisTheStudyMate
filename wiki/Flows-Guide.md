# Flows Guide

This guide provides detailed documentation for all three flows in the workshop project.

## Flow Architecture

Our project demonstrates three progressively complex flow patterns:

```
Simple Flow
├── Input: subject, topicCount
├── Process: Generate text with prompt
└── Output: Plain text bullet list

Structured Flow
├── Input: subject, difficulty
├── Process: Generate JSON + call tools
├── Tools: findEducationalLink
└── Output: Structured JSON with resource

Enhanced Flow
├── Input: subject, difficulty, includeTimeEstimates
├── Process: Generate JSON + compose multiple tools
├── Tools: findEducationalLink, estimateStudyTime
└── Output: Enhanced JSON with time estimates
```

## Flow 1: studyPlanGenerator (Simple)

**Purpose:** Quick topic brainstorming with plain text output

### Input Schema

```typescript
{
  subject: string (required, min 1 char)
  model?: string (optional, defaults to gemini-2.0-flash-exp)
  topicCount?: number (optional, 3-10, defaults to 5)
}
```

### Implementation

```typescript
export const studyPlanGenerator = ai.defineFlow(
  {
    name: "studyPlanGenerator",
    inputSchema: z.object({
      subject: z.string().min(1, "subject required"),
      model: z.string().optional(),
      topicCount: z.number().min(3).max(10).optional(),
    }),
    outputSchema: z.object({ text: z.string() }),
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

### Output Schema

```typescript
{
  text: string  // Plain text with topics
}
```

### Example Output

```json
{
  "text": "• Ancient Civilizations - Mesopotamia, Egypt, Indus Valley\n• Classical Antiquity - Greece and Rome\n• Medieval Period - Feudalism and the Crusades\n• Renaissance and Reformation\n• Modern Era - Industrial Revolution to present"
}
```

### When to Use

- ✅ Quick topic generation
- ✅ Brainstorming sessions
- ✅ Simple text-based outputs
- ✅ Fastest generation time
- ❌ Need structured data
- ❌ Need additional metadata

### Key Learnings

1. **Simplest flow pattern** - Just prompt → generate → return text
2. **No tools needed** - AI generates everything from prompt alone
3. **Flexible topic count** - User controls output size
4. **Fast execution** - Single AI call, no tool invocations

## Flow 2: studyPlanGeneratorStructured (Structured)

**Purpose:** Organized study plans with structured JSON output and educational resources

### Input Schema

```typescript
{
  subject: string (required, min 1 char)
  model?: string (optional)
  difficulty?: "beginner" | "intermediate" | "advanced" (optional, defaults to "beginner")
}
```

### Implementation

```typescript
export const studyPlanGeneratorStructured = ai.defineFlow(
  {
    name: "studyPlanGeneratorStructured",
    inputSchema: z.object({
      subject: z.string().min(1),
      model: z.string().optional(),
      difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
    }),
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
    const selectedModel = model || "googleai/gemini-2.0-flash-exp";
    
    const schema = z.object({
      subject: z.string(),
      topics: z.array(z.string()),
      resource: z.object({
        title: z.string(),
        url: z.string().url(),
        platform: z.string().optional(),
      }),
      difficulty: z.string().optional(),
    });
    
    // Generate with tools available
    const result = await ai.generate({
      model: selectedModel,
      prompt: structuredStudyPlanPrompt(subject, difficulty),
      output: { format: "json", schema },
      tools: [findEducationalLink],
    });
    
    const json = result.output as StudyPlan;
    
    // Fallback: call tool manually if AI didn't use it
    if (!json?.resource?.url) {
      const resource = await findEducationalLink({ topic: subject });
      json.resource = resource;
    }
    
    json.difficulty = difficulty;
    return json;
  }
);
```

### Output Schema

```typescript
{
  subject: string
  topics: string[]
  resource: {
    title: string
    url: string (valid URL)
    platform?: string
  }
  difficulty?: string
}
```

### Example Output

```json
{
  "subject": "World History",
  "difficulty": "beginner",
  "topics": [
    "Ancient Civilizations",
    "Classical Antiquity",
    "Medieval Period",
    "Renaissance and Reformation"
  ],
  "resource": {
    "title": "Introduction to World History",
    "url": "https://www.youtube.com/results?search_query=World+History+tutorial",
    "platform": "YouTube"
  }
}
```

### When to Use

- ✅ Need structured JSON output
- ✅ Want educational resources included
- ✅ Building APIs or integrations
- ✅ Difficulty-based customization
- ❌ Need time estimates
- ❌ Need quiz generation

### Key Learnings

1. **Structured output** - JSON with Zod validation
2. **Tool integration** - AI can call `findEducationalLink`
3. **Fallback pattern** - Manual tool call if AI doesn't use it
4. **Difficulty awareness** - Prompt adapts to difficulty level
5. **Type safety** - Full TypeScript types inferred

### Tool Usage Pattern

```typescript
// 1. Provide tools to AI
tools: [findEducationalLink]

// 2. AI may call the tool automatically
const result = await ai.generate({ /* ... */ });

// 3. Fallback if AI didn't call it
if (!result.output.resource) {
  result.output.resource = await findEducationalLink({ topic });
}
```

## Flow 3: enhancedStudyPlanGenerator (Enhanced)

**Purpose:** Comprehensive learning plans with time estimates and tool composition

### Input Schema

```typescript
{
  subject: string (required, min 1 char)
  difficulty?: "beginner" | "intermediate" | "advanced" (optional, defaults to "beginner")
  model?: string (optional)
  includeTimeEstimates?: boolean (optional, defaults to false)
}
```

### Implementation

```typescript
export const enhancedStudyPlanGenerator = ai.defineFlow(
  {
    name: "enhancedStudyPlanGenerator",
    inputSchema: z.object({
      subject: z.string().min(1),
      difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
      model: z.string().optional(),
      includeTimeEstimates: z.boolean().optional(),
    }),
    outputSchema: z.object({
      subject: z.string(),
      difficulty: z.string(),
      topics: z.array(
        z.object({
          name: z.string(),
          estimatedTime: z.object({
            hoursPerWeek: z.number(),
            totalWeeks: z.number(),
          }).optional(),
        })
      ),
      resource: z.object({
        title: z.string(),
        url: z.string().url(),
        platform: z.string().optional(),
      }),
      totalEstimatedHours: z.number().optional(),
    }),
  },
  async ({ subject, difficulty = "beginner", model, includeTimeEstimates = false }) => {
    const selectedModel = model || "googleai/gemini-2.0-flash-exp";
    
    // 1. Generate base study plan
    const result = await ai.generate({
      model: selectedModel,
      prompt: structuredStudyPlanPrompt(subject, difficulty),
      output: { format: "json", schema: baseSchema },
      tools: [findEducationalLink, estimateStudyTime],
    });
    
    const planData = result.output;
    
    // 2. Ensure resource exists
    if (!planData?.resource?.url) {
      planData.resource = await findEducationalLink({ topic: subject });
    }
    
    // 3. Enhance topics with time estimates
    const enhancedTopics = [];
    let totalHours = 0;
    
    for (const topicName of planData.topics || []) {
      if (includeTimeEstimates) {
        const timeEstimate = await estimateStudyTime({
          topic: topicName,
          difficulty,
        });
        enhancedTopics.push({
          name: topicName,
          estimatedTime: {
            hoursPerWeek: timeEstimate.hoursPerWeek,
            totalWeeks: timeEstimate.totalWeeks,
          },
        });
        totalHours += timeEstimate.hoursPerWeek * timeEstimate.totalWeeks;
      } else {
        enhancedTopics.push({ name: topicName });
      }
    }
    
    // 4. Return enhanced plan
    return {
      subject: planData.subject,
      difficulty,
      topics: enhancedTopics,
      resource: planData.resource,
      ...(includeTimeEstimates && { totalEstimatedHours: totalHours }),
    };
  }
);
```

### Output Schema

```typescript
{
  subject: string
  difficulty: string
  topics: Array<{
    name: string
    estimatedTime?: {
      hoursPerWeek: number
      totalWeeks: number
    }
  }>
  resource: {
    title: string
    url: string
    platform?: string
  }
  totalEstimatedHours?: number
}
```

### Example Output

```json
{
  "subject": "World History",
  "difficulty": "beginner",
  "topics": [
    {
      "name": "Ancient Civilizations",
      "estimatedTime": {
        "hoursPerWeek": 5,
        "totalWeeks": 4
      }
    },
    {
      "name": "Classical Antiquity",
      "estimatedTime": {
        "hoursPerWeek": 5,
        "totalWeeks": 4
      }
    }
  ],
  "resource": {
    "title": "Introduction to World History",
    "url": "https://www.youtube.com/results?search_query=World+History+tutorial",
    "platform": "YouTube"
  },
  "totalEstimatedHours": 40
}
```

### When to Use

- ✅ Need comprehensive learning plans
- ✅ Want time estimates per topic
- ✅ Building educational platforms
- ✅ Need detailed metadata
- ✅ Composition of multiple tools
- ❌ Need simple, fast results
- ❌ Don't need time tracking

### Key Learnings

1. **Tool composition** - Manually call multiple tools in sequence
2. **Conditional logic** - Time estimates only if requested
3. **Data aggregation** - Calculate total hours from individual estimates
4. **Complex state management** - Track enhanced topics array
5. **Progressive enhancement** - Base plan + optional enrichments

### Advanced Pattern: Manual Tool Composition

```typescript
// Instead of letting AI call tools automatically,
// we compose them manually for precise control:

for (const topic of topics) {
  if (condition) {
    const toolResult = await someTool({ topic });
    // Process result
  }
}

// This gives us:
// 1. Predictable behavior
// 2. Precise control over execution
// 3. Ability to aggregate results
// 4. Custom business logic
```

## Flow Comparison Table

| Feature | Simple | Structured | Enhanced |
|---------|---------|------------|----------|
| Output Format | Text | JSON | JSON |
| Tools Used | None | 1 (auto) | 2 (manual) |
| Complexity | Low | Medium | High |
| Execution Time | Fast | Medium | Slower |
| Type Safety | Basic | Full | Full |
| Customization | Low | Medium | High |
| Best For | Brainstorming | APIs | Learning platforms |

## Calling Flows from API

All flows are exposed via the `/api/generate` endpoint:

```typescript
// Simple flow
const response = await fetch('/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    subject: "World History",
    flowMode: "simple",
    topicCount: 5
  })
});

// Structured flow
const response = await fetch('/api/generate', {
  method: 'POST',
  body: JSON.stringify({
    subject: "World History",
    flowMode: "structured",
    difficulty: "beginner"
  })
});

// Enhanced flow
const response = await fetch('/api/generate', {
  method: 'POST',
  body: JSON.stringify({
    subject: "World History",
    flowMode: "enhanced",
    difficulty: "beginner",
    includeTimeEstimates: true
  })
});
```

## Testing Flows in Genkit Dev UI

```bash
# 1. Start Genkit Dev UI
bun run genkit

# 2. Open http://localhost:4000

# 3. Select a flow from the list

# 4. Enter test inputs

# 5. Click "Run" and inspect results
```

The Dev UI shows:
- Input/output schemas
- Execution traces
- Tool calls
- Token usage
- Errors and logs

## Best Practices

### Flow Design

1. **Start simple** - Begin with basic flow, add complexity gradually
2. **Validate inputs** - Use Zod schemas for all inputs
3. **Handle errors** - Wrap AI calls in try-catch
4. **Provide fallbacks** - Manual tool calls if AI doesn't use them
5. **Keep focused** - One flow, one purpose

### Performance

1. **Minimize AI calls** - Each call adds latency
2. **Parallel tool calls** - Use `Promise.all()` when possible
3. **Cache results** - Store expensive computations
4. **Stream when possible** - For long-running generations
5. **Set timeouts** - Prevent hanging requests

### Type Safety

1. **Define schemas first** - Design types before implementation
2. **Infer types** - Use `z.infer<typeof schema>`
3. **Validate at boundaries** - Parse inputs and outputs
4. **Share types** - Export types for use in UI
5. **Test with bad data** - Ensure validation catches errors

## Exercise Ideas

1. **Modify Simple Flow**: Add a `style` parameter (formal, casual, technical)
2. **Extend Structured Flow**: Add a second resource type (books, courses)
3. **Enhance Enhanced Flow**: Add quiz generation per topic
4. **Create New Flow**: Build a flow that generates study schedules
5. **Optimize Performance**: Parallelize time estimate calculations

---

**Next:** Learn about tools and prompts in [Tools and Prompts](Tools-and-Prompts) →

