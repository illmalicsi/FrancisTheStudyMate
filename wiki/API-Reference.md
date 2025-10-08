# API Reference

Complete API documentation for the SysDev Genkit Workshop endpoints and types.

## REST API

### POST /api/generate

Generate a study plan using one of three flow modes.

#### Endpoint

```
POST /api/generate
Content-Type: application/json
```

#### Request Body

```typescript
{
  // Required
  subject: string;
  
  // Optional - Flow Configuration
  flowMode?: "simple" | "structured" | "enhanced";  // default: "structured"
  model?: string;                                    // default: "googleai/gemini-2.0-flash-exp"
  difficulty?: "beginner" | "intermediate" | "advanced";  // default: "beginner"
  
  // Optional - Simple Mode
  topicCount?: number;  // 3-10, default: 5
  
  // Optional - Enhanced Mode
  enhanced?: boolean;              // default: false
  includeTimeEstimates?: boolean;  // default: false
  
  // Optional - Quiz Generation
  includeQuiz?: boolean;  // default: false
}
```

#### Supported Models

| Provider | Model ID | Description |
|----------|----------|-------------|
| Google | `googleai/gemini-2.0-flash-exp` | Fast, general-purpose (default) |
| Google | `googleai/gemini-2.0-flash-thinking-exp` | With reasoning traces |
| OpenAI | `openai/gpt-4o-mini` | Efficient GPT-4 variant |

#### Response Format

```typescript
{
  data: StudyPlan | EnhancedStudyPlan | { text: string };
  quiz: QuizResult[] | null;
  meta: {
    flowMode: string;
    toolsUsed: string[];
  };
}
```

#### Response Types by Flow Mode

**Simple Mode (`flowMode: "simple"`)**

```typescript
{
  data: {
    text: string;  // Plain text topic list
  },
  quiz: null,
  meta: {
    flowMode: "simple",
    toolsUsed: ["studyTopicsPrompt"]
  }
}
```

**Structured Mode (`flowMode: "structured"`)**

```typescript
{
  data: {
    subject: string;
    difficulty?: string;
    topics: string[];
    resource: {
      title: string;
      url: string;
      platform?: string;
    };
  },
  quiz: QuizResult[] | null,
  meta: {
    flowMode: "structured",
    toolsUsed: ["structuredStudyPlanPrompt", "findEducationalLink"]
  }
}
```

**Enhanced Mode (`flowMode: "enhanced"` or `enhanced: true`)**

```typescript
{
  data: {
    subject: string;
    difficulty: string;
    topics: Array<{
      name: string;
      estimatedTime?: {
        hoursPerWeek: number;
        totalWeeks: number;
      };
    }>;
    resource: {
      title: string;
      url: string;
      platform?: string;
    };
    totalEstimatedHours?: number;
  },
  quiz: QuizResult[] | null,
  meta: {
    flowMode: "enhanced",
    toolsUsed: [
      "structuredStudyPlanPrompt",
      "findEducationalLink",
      "estimateStudyTime",
      "generateQuizQuestions"  // if includeQuiz: true
    ]
  }
}
```

#### Quiz Format

When `includeQuiz: true`:

```typescript
quiz: [
  {
    topic: string;
    questions: [
      {
        question: string;
        type: "multiple-choice" | "true-false" | "short-answer";
        answer: string;
        options?: string[];      // Only for multiple-choice
        explanation?: string;
      }
    ];
  }
]
```

#### Error Responses

**400 Bad Request**
```json
{
  "error": "Missing subject"
}
```

**500 Internal Server Error**
```json
{
  "error": "Internal Server Error"
}
```

#### Example Requests

**Simple Mode - Quick Topics**

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Python Programming",
    "flowMode": "simple",
    "topicCount": 7
  }'
```

**Structured Mode - With Resources**

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Machine Learning",
    "flowMode": "structured",
    "difficulty": "intermediate",
    "model": "googleai/gemini-2.0-flash-exp"
  }'
```

**Enhanced Mode - Full Features**

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Web Development",
    "flowMode": "enhanced",
    "difficulty": "beginner",
    "enhanced": true,
    "includeTimeEstimates": true,
    "includeQuiz": true,
    "model": "googleai/gemini-2.0-flash-exp"
  }'
```

**JavaScript/TypeScript Client**

```typescript
const response = await fetch('/api/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    subject: 'React Hooks',
    flowMode: 'enhanced',
    difficulty: 'intermediate',
    includeTimeEstimates: true,
    includeQuiz: true,
  }),
});

const data = await response.json();

if (!response.ok) {
  console.error('Error:', data.error);
} else {
  console.log('Study Plan:', data.data);
  console.log('Quiz:', data.quiz);
  console.log('Tools Used:', data.meta.toolsUsed);
}
```

## TypeScript Types

### Core Types

```typescript
// Resource
type Resource = {
  title: string;
  url: string;
  platform?: string;
};

// Study Plan (Structured)
type StudyPlan = {
  subject: string;
  topics: string[];
  resource: Resource;
  difficulty?: string;
};

// Enhanced Study Plan
type EnhancedStudyPlan = {
  subject: string;
  difficulty: string;
  topics: Array<{
    name: string;
    estimatedTime?: {
      hoursPerWeek: number;
      totalWeeks: number;
    };
  }>;
  resource: Resource;
  totalEstimatedHours?: number;
};

// Quiz Question
type QuizQuestion = {
  question: string;
  type: "multiple-choice" | "true-false" | "short-answer";
  answer: string;
  options?: string[];
  explanation?: string;
};

// Quiz Result
type QuizResult = {
  topic: string;
  questions: QuizQuestion[];
};

// Difficulty Levels
type Difficulty = "beginner" | "intermediate" | "advanced";

// Flow Modes
type FlowMode = "simple" | "structured" | "enhanced";
```

### Import from Source

```typescript
import type {
  Resource,
  StudyPlan,
  EnhancedStudyPlan,
} from '@/index';
```

## Genkit Tools API

### findEducationalLink

Find educational resources for a topic.

```typescript
findEducationalLink({
  topic: string;
  preferredPlatform?: "youtube" | "khanacademy" | "coursera" | "any";
})

// Returns
{
  title: string;
  url: string;
  platform: string;
}
```

**Example:**

```typescript
const resource = await findEducationalLink({
  topic: "React Hooks",
  preferredPlatform: "youtube"
});
// {
//   title: "React Hooks Tutorial",
//   url: "https://www.youtube.com/results?search_query=React+Hooks+tutorial",
//   platform: "YouTube"
// }
```

### estimateStudyTime

Calculate study time estimates based on difficulty.

```typescript
estimateStudyTime({
  topic: string;
  difficulty: "beginner" | "intermediate" | "advanced";
})

// Returns
{
  topic: string;
  hoursPerWeek: number;
  totalWeeks: number;
  description: string;
}
```

**Example:**

```typescript
const estimate = await estimateStudyTime({
  topic: "JavaScript Async/Await",
  difficulty: "intermediate"
});
// {
//   topic: "JavaScript Async/Await",
//   hoursPerWeek: 8,
//   totalWeeks: 8,
//   description: "For intermediate level JavaScript Async/Await, we recommend 8 hours per week for 8 weeks."
// }
```

**Time Estimates by Difficulty:**

| Difficulty | Hours/Week | Total Weeks | Total Hours |
|------------|-----------|-------------|-------------|
| Beginner | 5 | 4 | 20 |
| Intermediate | 8 | 8 | 64 |
| Advanced | 12 | 12 | 144 |

### generateQuizQuestions

Generate quiz questions for a topic.

```typescript
generateQuizQuestions({
  topic: string;
  count?: number;  // 1-10, default: 3
  difficulty?: "beginner" | "intermediate" | "advanced";  // default: "beginner"
})

// Returns
{
  topic: string;
  questions: Array<{
    question: string;
    type: "multiple-choice" | "true-false" | "short-answer";
    answer: string;
    options?: string[];
    explanation?: string;
  }>;
}
```

**Example:**

```typescript
const quiz = await generateQuizQuestions({
  topic: "Python Lists",
  count: 5,
  difficulty: "beginner"
});
```

## Genkit Prompts API

### studyTopicsPromptDef

Generate study topics for a subject.

```typescript
// Input Schema
{
  subject: string;
  topicCount?: number;
}

// Usage in Genkit Dev UI
// Or use helper function in code:
studyTopicsPrompt(subject: string, topicCount: number = 5)
```

### structuredStudyPlanPromptDef

Create a structured study plan with difficulty awareness.

```typescript
// Input Schema
{
  subject: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
}

// Usage in code:
structuredStudyPlanPrompt(subject: string, difficulty: string = "beginner")
```

## Genkit Flows API

### studyPlanGenerator

Simple text-based topic generation.

```typescript
await studyPlanGenerator({
  subject: string;
  model?: string;
  topicCount?: number;  // 3-10
});

// Returns
{
  text: string;
}
```

### studyPlanGeneratorStructured

Structured JSON output with educational resources.

```typescript
await studyPlanGeneratorStructured({
  subject: string;
  model?: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
});

// Returns StudyPlan
```

### enhancedStudyPlanGenerator

Advanced flow with time estimates.

```typescript
await enhancedStudyPlanGenerator({
  subject: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
  model?: string;
  includeTimeEstimates?: boolean;
});

// Returns EnhancedStudyPlan
```

## Rate Limits

### Google AI (Gemini)

- **Free tier**: 15 requests per minute
- **Rate limit headers**: Not provided
- **Quota exceeded**: 429 status code

### OpenAI (GPT-4o Mini)

- **Tier 1** (new accounts): 500 requests per day
- **Rate limit headers**: Provided in response
- **Quota exceeded**: 429 status code

## Best Practices

### Error Handling

```typescript
try {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject: 'Python' }),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Generation failed');
  }
  
  return data;
} catch (error) {
  console.error('API Error:', error);
  // Handle error appropriately
}
```

### Timeout Handling

```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000);  // 30s timeout

try {
  const response = await fetch('/api/generate', {
    method: 'POST',
    signal: controller.signal,
    body: JSON.stringify({ subject: 'Python' }),
  });
  // Process response
} catch (error) {
  if (error.name === 'AbortError') {
    console.error('Request timed out');
  }
} finally {
  clearTimeout(timeoutId);
}
```

### Retry Logic

```typescript
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      
      // Don't retry on 4xx errors (client errors)
      if (response.status >= 400 && response.status < 500) {
        return response;
      }
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

## Webhook Support

Currently not implemented. Future consideration for async long-running generations.

---

**More info:** See [Troubleshooting](Troubleshooting) for common API issues →

