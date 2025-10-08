# Advanced Topics

Advanced patterns, optimization techniques, and production-ready features for Genkit applications.

## Table of Contents

- [Performance Optimization](#performance-optimization)
- [Production Patterns](#production-patterns)
- [Advanced Flow Patterns](#advanced-flow-patterns)
- [Streaming Responses](#streaming-responses)
- [Caching Strategies](#caching-strategies)
- [Error Handling](#error-handling)
- [Observability](#observability)
- [Security](#security)
- [Testing](#testing)
- [Deployment](#deployment)

---

## Performance Optimization

### Parallel Tool Calls

Instead of calling tools sequentially, parallelize when possible:

**Before (Sequential):**
```typescript
const resource = await findEducationalLink({ topic });
const timeEstimate = await estimateStudyTime({ topic, difficulty });
const quiz = await generateQuizQuestions({ topic, difficulty });

// Total time: ~6-9 seconds
```

**After (Parallel):**
```typescript
const [resource, timeEstimate, quiz] = await Promise.all([
  findEducationalLink({ topic }),
  estimateStudyTime({ topic, difficulty }),
  generateQuizQuestions({ topic, difficulty }),
]);

// Total time: ~3 seconds (50% faster!)
```

**For multiple topics:**
```typescript
const enhancedTopics = await Promise.all(
  topics.map(async (topic) => {
    const [time, quiz] = await Promise.all([
      estimateStudyTime({ topic: topic.name, difficulty }),
      includeQuiz ? generateQuizQuestions({ topic: topic.name, difficulty }) : null,
    ]);
    
    return {
      ...topic,
      estimatedTime: time,
      quiz,
    };
  })
);
```

### Model Selection Strategy

Choose models based on task complexity:

```typescript
function selectModel(task: "simple" | "complex"): string {
  if (task === "simple") {
    // Fast, cheap models for simple tasks
    return "googleai/gemini-2.0-flash-exp";
  } else {
    // More capable models for complex tasks
    return "googleai/gemini-2.0-flash-thinking-exp";
  }
}

// Use different models for different parts
const topics = await ai.generate({
  model: selectModel("simple"),  // Fast model for topic generation
  prompt: studyTopicsPrompt(subject, count),
});

const analysis = await ai.generate({
  model: selectModel("complex"),  // Better model for analysis
  prompt: `Analyze the learning path for ${subject}...`,
});
```

### Request Batching

Batch multiple requests when users need several study plans:

```typescript
async function generateMultiplePlans(subjects: string[]) {
  // Batch with rate limiting
  const results = [];
  const BATCH_SIZE = 3;  // Process 3 at a time
  
  for (let i = 0; i < subjects.length; i += BATCH_SIZE) {
    const batch = subjects.slice(i, i + BATCH_SIZE);
    
    const batchResults = await Promise.all(
      batch.map(subject => studyPlanGenerator({ subject }))
    );
    
    results.push(...batchResults);
    
    // Delay between batches to avoid rate limits
    if (i + BATCH_SIZE < subjects.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}
```

### Debouncing User Input

Prevent excessive API calls as users type:

```typescript
'use client';
import { useState, useCallback } from 'react';
import debounce from 'lodash/debounce';

export default function SmartSearch() {
  const [suggestions, setSuggestions] = useState([]);
  
  const fetchSuggestions = useCallback(
    debounce(async (query: string) => {
      if (query.length < 3) return;
      
      const response = await fetch('/api/suggest', {
        method: 'POST',
        body: JSON.stringify({ query }),
      });
      
      const data = await response.json();
      setSuggestions(data.suggestions);
    }, 500),  // Wait 500ms after user stops typing
    []
  );
  
  return (
    <input
      onChange={(e) => fetchSuggestions(e.target.value)}
      placeholder="Search subjects..."
    />
  );
}
```

---

## Production Patterns

### Rate Limiting

Protect your API from abuse:

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const rateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),  // 10 requests per minute
  analytics: true,
});

// In API route
export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') ?? 'anonymous';
  
  const { success, reset } = await rateLimiter.limit(ip);
  
  if (!success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', resetAt: reset },
      { status: 429 }
    );
  }
  
  // Process request...
}
```

### Request Validation Middleware

Centralized validation:

```typescript
// lib/validate-request.ts
import { z } from 'zod';
import { NextResponse } from 'next/server';

export function validateRequest<T extends z.ZodType>(
  schema: T,
  handler: (data: z.infer<T>, req: Request) => Promise<NextResponse>
) {
  return async (req: Request) => {
    try {
      const body = await req.json().catch(() => ({}));
      const validated = schema.parse(body);
      return handler(validated, req);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

// Usage
const requestSchema = z.object({
  subject: z.string().min(1),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
});

export const POST = validateRequest(
  requestSchema,
  async (data, req) => {
    const result = await studyPlanGenerator(data);
    return NextResponse.json({ data: result });
  }
);
```

### Graceful Degradation

Fallback when services fail:

```typescript
async function generateStudyPlan(subject: string) {
  try {
    // Try primary service
    return await ai.generate({
      model: "googleai/gemini-2.0-flash-exp",
      prompt: studyTopicsPrompt(subject, 5),
    });
  } catch (error) {
    console.error('Primary service failed:', error);
    
    try {
      // Fallback to secondary service
      return await ai.generate({
        model: "openai/gpt-4o-mini",
        prompt: studyTopicsPrompt(subject, 5),
      });
    } catch (fallbackError) {
      console.error('Fallback service failed:', fallbackError);
      
      // Return cached or default response
      return {
        text: getCachedPlan(subject) || getDefaultPlan(subject)
      };
    }
  }
}
```

---

## Advanced Flow Patterns

### Conditional Tool Usage

Use tools based on conditions:

```typescript
export const smartStudyPlanGenerator = ai.defineFlow(
  {
    name: "smartStudyPlanGenerator",
    inputSchema: z.object({
      subject: z.string(),
      includeResources: z.boolean().optional(),
      includeTimeEstimates: z.boolean().optional(),
      includeQuiz: z.boolean().optional(),
    }),
    outputSchema: z.object({ /* ... */ }),
  },
  async ({ subject, includeResources, includeTimeEstimates, includeQuiz }) => {
    // Build tools array conditionally
    const tools = [];
    if (includeResources) tools.push(findEducationalLink);
    if (includeTimeEstimates) tools.push(estimateStudyTime);
    if (includeQuiz) tools.push(generateQuizQuestions);
    
    const result = await ai.generate({
      model: "googleai/gemini-2.0-flash-exp",
      prompt: studyPlanPrompt(subject),
      tools,  // Only includes requested tools
      output: { format: "json", schema },
    });
    
    return result.output;
  }
);
```

### Multi-Step Reasoning

Break complex tasks into steps:

```typescript
export const researchStudyPathGenerator = ai.defineFlow(
  {
    name: "researchStudyPathGenerator",
    inputSchema: z.object({
      subject: z.string(),
      currentLevel: z.enum(["beginner", "intermediate", "advanced"]),
      goalLevel: z.enum(["intermediate", "advanced", "expert"]),
    }),
    outputSchema: z.object({ /* ... */ }),
  },
  async ({ subject, currentLevel, goalLevel }) => {
    // Step 1: Assess knowledge gaps
    const gaps = await ai.generate({
      prompt: `Analyze the knowledge gaps between ${currentLevel} and ${goalLevel} in ${subject}.`,
      output: { format: "json", schema: GapsSchema },
    });
    
    // Step 2: Create learning modules for each gap
    const modules = await Promise.all(
      gaps.output.gaps.map(async (gap) => {
        const module = await ai.generate({
          prompt: `Create a learning module to fill this gap: ${gap}`,
          tools: [findEducationalLink],
          output: { format: "json", schema: ModuleSchema },
        });
        return module.output;
      })
    );
    
    // Step 3: Order modules by dependencies
    const orderedModules = await ai.generate({
      prompt: `Order these modules by prerequisites: ${JSON.stringify(modules)}`,
      output: { format: "json", schema: OrderedPathSchema },
    });
    
    // Step 4: Add time estimates
    const enhancedModules = await Promise.all(
      orderedModules.output.modules.map(async (module) => ({
        ...module,
        timeEstimate: await estimateStudyTime({ 
          topic: module.title, 
          difficulty: module.level 
        }),
      }))
    );
    
    return {
      currentLevel,
      goalLevel,
      modules: enhancedModules,
    };
  }
);
```

### Flow Composition

Reuse flows within flows:

```typescript
export const comprehensiveLearningPlan = ai.defineFlow(
  {
    name: "comprehensiveLearningPlan",
    inputSchema: z.object({ subject: z.string() }),
    outputSchema: z.object({ /* ... */ }),
  },
  async ({ subject }) => {
    // Call existing flows
    const [studyPlan, quizzes, schedule] = await Promise.all([
      enhancedStudyPlanGenerator({ subject, includeTimeEstimates: true }),
      // Assume we have this flow
      generateComprehensiveQuiz({ subject }),
      // And this one
      generateStudySchedule({ subject }),
    ]);
    
    // Combine results
    return {
      studyPlan,
      quizzes,
      schedule,
      createdAt: new Date().toISOString(),
    };
  }
);
```

---

## Streaming Responses

Stream long responses for better UX:

```typescript
// API route with streaming
export async function POST(req: Request) {
  const { subject } = await req.json();
  
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const result = await ai.generate({
          model: "googleai/gemini-2.0-flash-exp",
          prompt: studyTopicsPrompt(subject, 10),
          // Stream: true enables streaming
          streamingCallback: (chunk) => {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text: chunk.text })}\n\n`)
            );
          },
        });
        
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// Client-side
async function streamGeneration(subject: string) {
  const response = await fetch('/api/generate-stream', {
    method: 'POST',
    body: JSON.stringify({ subject }),
  });
  
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  
  while (true) {
    const { done, value } = await reader!.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') return;
        
        const parsed = JSON.parse(data);
        // Update UI with parsed.text
        setGeneratedText(prev => prev + parsed.text);
      }
    }
  }
}
```

---

## Caching Strategies

### Redis Caching

Cache expensive operations:

```typescript
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

async function getCachedOrGenerate(
  key: string,
  generator: () => Promise<any>,
  ttl: number = 3600  // 1 hour
) {
  // Try cache first
  const cached = await redis.get(key);
  if (cached) {
    return cached;
  }
  
  // Generate if not cached
  const result = await generator();
  
  // Cache for future requests
  await redis.setex(key, ttl, JSON.stringify(result));
  
  return result;
}

// Usage
export async function POST(req: Request) {
  const { subject, difficulty } = await req.json();
  
  const cacheKey = `study-plan:${subject}:${difficulty}`;
  
  const result = await getCachedOrGenerate(
    cacheKey,
    () => studyPlanGeneratorStructured({ subject, difficulty }),
    3600  // Cache for 1 hour
  );
  
  return NextResponse.json({ data: result });
}
```

### In-Memory Caching

For frequently accessed data:

```typescript
// lib/cache.ts
class SimpleCache<T> {
  private cache = new Map<string, { value: T; expires: number }>();
  
  set(key: string, value: T, ttlSeconds: number) {
    this.cache.set(key, {
      value,
      expires: Date.now() + ttlSeconds * 1000,
    });
  }
  
  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }
  
  clear() {
    this.cache.clear();
  }
}

export const studyPlanCache = new SimpleCache<StudyPlan>();

// Usage
const cached = studyPlanCache.get(`${subject}-${difficulty}`);
if (cached) return cached;

const result = await studyPlanGenerator({ subject });
studyPlanCache.set(`${subject}-${difficulty}`, result, 3600);
```

---

## Error Handling

### Retry Logic with Exponential Backoff

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}

// Usage
const result = await withRetry(
  () => ai.generate({ model: "googleai/gemini-2.0-flash-exp", prompt }),
  3,  // Try up to 3 times
  1000  // Start with 1s delay
);
```

### Error Classification

```typescript
class AIError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'AIError';
  }
}

function classifyError(error: any): AIError {
  if (error.status === 429) {
    return new AIError('Rate limit exceeded', 'RATE_LIMIT', true);
  }
  if (error.status === 401) {
    return new AIError('Invalid API key', 'AUTH_ERROR', false);
  }
  if (error.status >= 500) {
    return new AIError('Service unavailable', 'SERVICE_ERROR', true);
  }
  return new AIError('Unknown error', 'UNKNOWN', false);
}

// Usage
try {
  const result = await ai.generate({ /* ... */ });
} catch (error) {
  const aiError = classifyError(error);
  
  if (aiError.retryable) {
    // Retry logic
  } else {
    // Log and return error to user
    console.error(aiError);
    return NextResponse.json(
      { error: aiError.message, code: aiError.code },
      { status: 400 }
    );
  }
}
```

---

## Observability

### Logging and Tracing

```typescript
// lib/logger.ts
import { createLogger, format, transports } from 'winston';

export const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'error.log', level: 'error' }),
    new transports.File({ filename: 'combined.log' }),
  ],
});

// Usage in flows
export const trackedFlow = ai.defineFlow(
  { /* ... */ },
  async (input) => {
    const startTime = Date.now();
    
    logger.info('Flow started', { 
      flow: 'studyPlanGenerator',
      input 
    });
    
    try {
      const result = await ai.generate({ /* ... */ });
      
      logger.info('Flow completed', {
        flow: 'studyPlanGenerator',
        duration: Date.now() - startTime,
        success: true,
      });
      
      return result;
    } catch (error) {
      logger.error('Flow failed', {
        flow: 'studyPlanGenerator',
        duration: Date.now() - startTime,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }
);
```

### Analytics

```typescript
// lib/analytics.ts
import { Analytics } from '@segment/analytics-node';

const analytics = new Analytics({
  writeKey: process.env.SEGMENT_WRITE_KEY!,
});

export function trackFlowExecution(
  flowName: string,
  input: any,
  result: any,
  duration: number
) {
  analytics.track({
    userId: 'system',
    event: 'Flow Executed',
    properties: {
      flowName,
      input,
      success: !!result,
      duration,
      timestamp: new Date().toISOString(),
    },
  });
}

// Usage
const startTime = Date.now();
const result = await studyPlanGenerator({ subject: "Python" });
trackFlowExecution(
  'studyPlanGenerator',
  { subject: "Python" },
  result,
  Date.now() - startTime
);
```

---

## Security

### API Key Rotation

```typescript
// lib/api-keys.ts
const API_KEYS = [
  process.env.GOOGLE_GENAI_API_KEY_1,
  process.env.GOOGLE_GENAI_API_KEY_2,
  process.env.GOOGLE_GENAI_API_KEY_3,
];

let currentKeyIndex = 0;

export function getApiKey(): string {
  const key = API_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  return key!;
}

// Use in Genkit config
const ai = genkit({
  plugins: [
    googleAI({ apiKey: getApiKey() }),
  ],
});
```

### Input Sanitization

```typescript
import { escape } from 'lodash';

function sanitizeInput(input: string): string {
  // Remove potentially harmful content
  return escape(input)
    .replace(/<script.*?<\/script>/gi, '')
    .trim()
    .slice(0, 1000);  // Limit length
}

// Usage
export async function POST(req: Request) {
  const { subject } = await req.json();
  
  const sanitized = sanitizeInput(subject);
  
  const result = await studyPlanGenerator({ 
    subject: sanitized 
  });
  
  return NextResponse.json({ data: result });
}
```

---

## Testing

### Unit Testing Flows

```typescript
// __tests__/flows.test.ts
import { describe, it, expect } from 'bun:test';
import { studyPlanGenerator } from '@/index';

describe('studyPlanGenerator', () => {
  it('should generate topics for a subject', async () => {
    const result = await studyPlanGenerator({
      subject: 'Python',
      topicCount: 5,
    });
    
    expect(result.text).toBeDefined();
    expect(result.text.length).toBeGreaterThan(0);
  });
  
  it('should handle errors gracefully', async () => {
    await expect(
      studyPlanGenerator({ subject: '' })
    ).rejects.toThrow('subject required');
  });
});
```

### Integration Testing

```typescript
// __tests__/api.test.ts
import { describe, it, expect } from 'bun:test';

describe('/api/generate', () => {
  it('should return study plan', async () => {
    const response = await fetch('http://localhost:3000/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: 'React',
        flowMode: 'simple',
      }),
    });
    
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.data).toBeDefined();
    expect(data.meta.flowMode).toBe('simple');
  });
});
```

---

## Deployment

### Environment Configuration

```typescript
// lib/config.ts
const config = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  
  api: {
    googleApiKey: process.env.GOOGLE_GENAI_API_KEY!,
    openaiApiKey: process.env.OPENAI_API_KEY!,
  },
  
  redis: {
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  },
  
  rateLimit: {
    requestsPerMinute: parseInt(process.env.RATE_LIMIT_RPM || '10'),
  },
};

export default config;
```

### Health Check Endpoint

```typescript
// app/api/health/route.ts
export async function GET() {
  const checks = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    checks: {
      google: await checkGoogleAPI(),
      openai: await checkOpenAIAPI(),
      redis: await checkRedis(),
    },
  };
  
  const allHealthy = Object.values(checks.checks).every(c => c.healthy);
  
  return NextResponse.json(checks, {
    status: allHealthy ? 200 : 503,
  });
}
```

---

**Congratulations!** You've completed the advanced topics. You now have the knowledge to build production-ready Genkit applications!

**Continue exploring:** Review [Workshop Exercises](Workshop-Exercises) to practice these concepts →

