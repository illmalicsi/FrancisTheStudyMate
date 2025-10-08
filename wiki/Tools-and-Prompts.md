# Tools and Prompts Reference

Complete reference for all prompts and tools in the SysDev Genkit Workshop.

## Table of Contents

- [Prompts](#prompts)
  - [studyTopicsPromptDef](#studytopicspromptdef)
  - [structuredStudyPlanPromptDef](#structuredstudyplanpromptdef)
- [Tools](#tools)
  - [findEducationalLink](#findeducationallink)
  - [estimateStudyTime](#estimatestudytime)
  - [generateQuizQuestions](#generatequizquestions)
- [Best Practices](#best-practices)
- [Creating Custom Tools](#creating-custom-tools)
- [Creating Custom Prompts](#creating-custom-prompts)

---

## Prompts

Prompts are reusable templates for AI interactions. They're defined with `ai.definePrompt()` and visible in the Genkit Dev UI.

### studyTopicsPromptDef

Generate a list of study topics for a given subject.

**Location:** `src/index.ts` (lines 12-33)

**Input Schema:**
```typescript
{
  subject: string;
  topicCount?: number;  // Optional, defaults to 5
}
```

**Model:** `googleai/gemini-2.0-flash-exp`

**Template:**
```
You are an expert tutor with deep knowledge across all academic subjects.

Given the subject "{{subject}}", suggest {{topicCount}} concise, actionable study topics as a bullet list.

Guidelines:
- Start from fundamentals and progress to advanced concepts
- Focus on core understanding before details
- Make each topic specific and actionable
- Order topics in a logical learning sequence
```

**Usage in Genkit Dev UI:**
1. Run `bun run genkit`
2. Navigate to "Prompts"
3. Select "studyTopicsPrompt"
4. Enter inputs:
   - subject: "Python Programming"
   - topicCount: 7
5. Click "Run"

**Usage in Code:**

The workshop uses a helper function for easier usage:
```typescript
const studyTopicsPrompt = (subject: string, topicCount: number = 5) => 
  `You are an expert tutor...
Given the subject "${subject}", suggest ${topicCount} topics...`;

// Use in flow
const result = await ai.generate({
  model: "googleai/gemini-2.0-flash-exp",
  prompt: studyTopicsPrompt("Python", 7)
});
```

**Example Output:**
```
• Python Fundamentals - Variables, Data Types, and Operators
• Control Flow - Conditionals and Loops
• Functions and Modules
• Data Structures - Lists, Dictionaries, Sets, Tuples
• Object-Oriented Programming Basics
• File Handling and Exception Handling
• Working with Libraries and Packages
```

**When to Use:**
- Quick topic brainstorming
- Simple flow mode
- Initial learning path creation
- Content ideation

---

### structuredStudyPlanPromptDef

Create a detailed, structured study plan with difficulty-based guidance.

**Location:** `src/index.ts` (lines 35-63)

**Input Schema:**
```typescript
{
  subject: string;
  difficulty?: "beginner" | "intermediate" | "advanced";  // Optional, defaults to "beginner"
}
```

**Model:** `googleai/gemini-2.0-flash-exp`

**Template:**
```
You are an expert educational consultant creating personalized study plans.

Subject: {{subject}}
Difficulty Level: {{difficulty}}

Create a structured study plan that includes:
1. Subject name (exactly as provided)
2. 3-5 core topics to study in logical order
3. A recommended educational resource

Guidelines:
- For beginners: focus on fundamentals and core concepts
- For intermediate: include practical applications and deeper theory
- For advanced: emphasize mastery, research, and real-world problems
- Topics should be specific, measurable learning objectives
- Use the findEducationalLink tool to find a high-quality resource for the main subject
```

**Usage in Code:**
```typescript
const structuredStudyPlanPrompt = (
  subject: string, 
  difficulty: string = "beginner"
) => `You are an expert educational consultant...`;

// Use in flow with tools
const result = await ai.generate({
  model: "googleai/gemini-2.0-flash-exp",
  prompt: structuredStudyPlanPrompt("Machine Learning", "intermediate"),
  tools: [findEducationalLink],
  output: { 
    format: "json", 
    schema: StudyPlanSchema 
  }
});
```

**Difficulty-Based Behavior:**

**Beginner:**
- Fundamental concepts
- Core terminology
- Step-by-step progression
- Hands-on exercises

**Intermediate:**
- Practical applications
- Deeper theory
- Project-based learning
- Integration of concepts

**Advanced:**
- Research topics
- Real-world problems
- Optimization techniques
- Contributing to open source

**Example Output:**
```json
{
  "subject": "Machine Learning",
  "difficulty": "intermediate",
  "topics": [
    "Supervised vs Unsupervised Learning",
    "Linear Regression and Classification",
    "Neural Networks Fundamentals",
    "Model Evaluation and Cross-Validation",
    "Feature Engineering Best Practices"
  ]
}
```

**When to Use:**
- Structured or enhanced flow modes
- Building complete study plans
- Difficulty-aware content
- JSON output needed

---

## Tools

Tools extend AI capabilities by providing functions that can be called during generation.

### findEducationalLink

Find educational resources across multiple platforms.

**Location:** `src/index.ts` (lines 101-151)

**Type:** Synchronous (returns immediately)

**Input Schema:**
```typescript
{
  topic: string;
  preferredPlatform?: "youtube" | "khanacademy" | "coursera" | "any";  // Optional
}
```

**Output Schema:**
```typescript
{
  title: string;
  url: string;
  platform: string;
}
```

**Description:**
"Find a relevant educational link for a topic. Can target specific platforms like YouTube, Khan Academy, or Coursera."

**Implementation:**
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
    description: "Find a relevant educational link for a topic...",
  },
  async ({ topic, preferredPlatform }) => {
    const encoded = encodeURIComponent(topic);
    
    switch (preferredPlatform) {
      case "khanacademy":
        return {
          title: `${topic} - Khan Academy`,
          url: `https://www.khanacademy.org/search?page_search_query=${encoded}`,
          platform: "Khan Academy",
        };
      // ... more cases
    }
  }
);
```

**Platform URLs:**
| Platform | URL Pattern |
|----------|-------------|
| YouTube (default) | `youtube.com/results?search_query={topic}+tutorial` |
| Khan Academy | `khanacademy.org/search?page_search_query={topic}` |
| Coursera | `coursera.org/search?query={topic}` |

**Usage:**

**Manual call:**
```typescript
const resource = await findEducationalLink({ 
  topic: "React Hooks",
  preferredPlatform: "youtube"
});
console.log(resource);
// {
//   title: "Introduction to React Hooks",
//   url: "https://www.youtube.com/results?search_query=React+Hooks+tutorial",
//   platform: "YouTube"
// }
```

**AI-driven call:**
```typescript
const result = await ai.generate({
  prompt: "Create a study plan with resources",
  tools: [findEducationalLink],  // AI can call this
  output: { format: "json", schema }
});
// AI automatically calls findEducationalLink when needed
```

**Fallback pattern:**
```typescript
// If AI doesn't call the tool, call it manually
if (!result.output.resource) {
  result.output.resource = await findEducationalLink({ topic: subject });
}
```

**Customization Ideas:**
- Call real APIs (YouTube Data API, Coursera API)
- Add rating/popularity filtering
- Return multiple resources
- Add language preferences
- Include video duration/course length

---

### estimateStudyTime

Calculate realistic study time estimates based on difficulty level.

**Location:** `src/index.ts` (lines 153-180)

**Type:** Synchronous (returns immediately)

**Input Schema:**
```typescript
{
  topic: string;
  difficulty: "beginner" | "intermediate" | "advanced";
}
```

**Output Schema:**
```typescript
{
  topic: string;
  hoursPerWeek: number;
  totalWeeks: number;
  description: string;
}
```

**Description:**
"Estimate the time required to master a topic based on difficulty level. Returns recommended hours per week and total weeks needed."

**Implementation:**
```typescript
export const estimateStudyTime = ai.defineTool(
  {
    name: "estimateStudyTime",
    inputSchema: z.object({
      topic: z.string(),
      difficulty: z.enum(["beginner", "intermediate", "advanced"]),
    }),
    outputSchema: z.object({
      topic: z.string(),
      hoursPerWeek: z.number(),
      totalWeeks: z.number(),
      description: z.string(),
    }),
    description: "Estimate the time required to master a topic...",
  },
  async ({ topic, difficulty }) => {
    const baseHours = { beginner: 5, intermediate: 8, advanced: 12 };
    const baseWeeks = { beginner: 4, intermediate: 8, advanced: 12 };
    
    return {
      topic,
      hoursPerWeek: baseHours[difficulty],
      totalWeeks: baseWeeks[difficulty],
      description: `For ${difficulty} level ${topic}, we recommend ${baseHours[difficulty]} hours per week for ${baseWeeks[difficulty]} weeks.`,
    };
  }
);
```

**Time Estimates:**
| Difficulty | Hours/Week | Weeks | Total Hours |
|------------|-----------|-------|-------------|
| Beginner | 5 | 4 | 20 |
| Intermediate | 8 | 8 | 64 |
| Advanced | 12 | 12 | 144 |

**Usage:**

**Manual call:**
```typescript
const estimate = await estimateStudyTime({
  topic: "React State Management",
  difficulty: "intermediate"
});
console.log(estimate);
// {
//   topic: "React State Management",
//   hoursPerWeek: 8,
//   totalWeeks: 8,
//   description: "For intermediate level React State Management, we recommend 8 hours per week for 8 weeks."
// }
```

**In enhanced flow:**
```typescript
for (const topicName of topics) {
  const timeEstimate = await estimateStudyTime({
    topic: topicName,
    difficulty: "beginner"
  });
  
  enhancedTopics.push({
    name: topicName,
    estimatedTime: {
      hoursPerWeek: timeEstimate.hoursPerWeek,
      totalWeeks: timeEstimate.totalWeeks
    }
  });
}
```

**Customization Ideas:**
- Use AI to generate personalized estimates
- Factor in prior knowledge
- Add learning style adjustments
- Include practice/project time
- Consider topic complexity
- Add retention/review time

---

### generateQuizQuestions

Generate AI-powered quiz questions with answers and explanations.

**Location:** `src/index.ts` (lines 182-258)

**Type:** Asynchronous (makes AI calls)

**Input Schema:**
```typescript
{
  topic: string;
  count?: number;         // 1-10, defaults to 3
  difficulty?: "beginner" | "intermediate" | "advanced";  // Defaults to "beginner"
}
```

**Output Schema:**
```typescript
{
  topic: string;
  questions: Array<{
    question: string;
    type: "multiple-choice" | "true-false" | "short-answer";
    answer: string;
    options?: string[];      // Only for multiple-choice
    explanation?: string;
  }>;
}
```

**Description:**
"Generate quiz questions with answers for a given topic to test understanding. Includes multiple-choice options when applicable."

**Implementation:**
```typescript
export const generateQuizQuestions = ai.defineTool(
  {
    name: "generateQuizQuestions",
    // ... schemas
  },
  async ({ topic, count = 3, difficulty = "beginner" }) => {
    const prompt = `Generate ${count} quiz questions about "${topic}" for ${difficulty} level learners.
    
For each question, provide:
1. The question text
2. The correct answer
3. For multiple-choice: 4 options (including the correct answer)
4. A brief explanation of why the answer is correct

Mix question types: multiple-choice, true-false, and short-answer.`;

    const result = await ai.generate({
      model: "googleai/gemini-2.0-flash-exp",
      prompt,
      output: {
        format: "json",
        schema: QuizSchema
      },
    });
    
    return {
      topic,
      questions: result.output.questions || [],
    };
  }
);
```

**Question Types:**

**Multiple Choice:**
```json
{
  "question": "What is the time complexity of binary search?",
  "type": "multiple-choice",
  "answer": "O(log n)",
  "options": ["O(n)", "O(log n)", "O(n²)", "O(1)"],
  "explanation": "Binary search divides the search space in half each iteration, resulting in logarithmic time complexity."
}
```

**True/False:**
```json
{
  "question": "JavaScript is a compiled language.",
  "type": "true-false",
  "answer": "False",
  "options": ["True", "False"],
  "explanation": "JavaScript is an interpreted language, executed at runtime by the JavaScript engine."
}
```

**Short Answer:**
```json
{
  "question": "Explain what a closure is in JavaScript.",
  "type": "short-answer",
  "answer": "A closure is a function that has access to variables in its outer (enclosing) function's scope, even after the outer function has returned.",
  "explanation": "Closures are created every time a function is created, allowing the inner function to 'remember' the environment in which it was created."
}
```

**Usage:**

**Manual call:**
```typescript
const quiz = await generateQuizQuestions({
  topic: "React Hooks",
  count: 5,
  difficulty: "intermediate"
});
```

**In API endpoint:**
```typescript
if (includeQuiz && "topics" in result) {
  const quizPromises = result.topics.map(topic => 
    generateQuizQuestions({ topic, count: 3, difficulty })
  );
  const quizResults = await Promise.all(quizPromises);
  return { data: result, quiz: quizResults };
}
```

**Customization Ideas:**
- Add difficulty scoring per question
- Include hints system
- Add time limits
- Code execution for coding questions
- Adaptive difficulty (next question based on answer)
- Spaced repetition integration
- Progress tracking

---

## Best Practices

### Prompt Design

1. **Be specific and clear**
```typescript
// Bad
const prompt = "Tell me about Python";

// Good
const prompt = `You are an expert Python instructor.
Generate 5 beginner-level study topics for Python programming.
Focus on fundamentals and practical applications.`;
```

2. **Use role-playing**
```typescript
"You are an expert educational consultant..."
"You are an experienced tutor..."
"You are a study coach with 10 years of experience..."
```

3. **Provide examples**
```typescript
`Generate topics in this format:
• Topic Name - Brief description
• Another Topic - Its description`
```

4. **Set constraints**
```typescript
"Suggest exactly {{topicCount}} topics"
"Keep each topic under 10 words"
"Order topics from easiest to hardest"
```

5. **Use variables wisely**
```typescript
`Subject: {{subject}}
Difficulty: {{difficulty}}
Time Available: {{weeksAvailable}} weeks`
```

### Tool Design

1. **Single responsibility**
```typescript
// Each tool does ONE thing well
const findResource = ...    // ✅ Only finds resources
const rateResource = ...    // ✅ Only rates resources
const saveResource = ...    // ✅ Only saves resources
```

2. **Clear input/output schemas**
```typescript
inputSchema: z.object({
  topic: z.string().min(1, "Topic required"),  // ✅ Validation message
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),  // ✅ Specific options
}),
```

3. **Descriptive names and descriptions**
```typescript
{
  name: "estimateStudyTime",  // ✅ Clear, verb-based
  description: "Estimate the time required to master a topic based on difficulty level. Returns recommended hours per week and total weeks needed.",  // ✅ Explains what, when, and returns
}
```

4. **Error handling**
```typescript
async ({ topic }) => {
  if (!topic?.trim()) {
    throw new Error("Topic cannot be empty");
  }
  
  try {
    const result = await externalAPI(topic);
    return result;
  } catch (error) {
    console.error("Failed to fetch:", error);
    return fallbackResult;
  }
}
```

5. **Async when needed**
```typescript
// Synchronous for calculations
const estimateTime = async ({ topic, difficulty }) => {
  return { hoursPerWeek: 5, totalWeeks: 4 };  // No await needed
};

// Asynchronous for API calls
const fetchResource = async ({ topic }) => {
  const result = await fetch(`https://api.example.com/${topic}`);  // ✅ Needs await
  return result.json();
};
```

### Validation

1. **Always validate inputs**
```typescript
z.object({
  email: z.string().email(),
  age: z.number().min(0).max(120),
  topics: z.array(z.string()).min(1).max(10),
})
```

2. **Validate outputs too**
```typescript
outputSchema: z.object({
  url: z.string().url(),  // ✅ Ensures valid URL
  title: z.string().min(1),  // ✅ Non-empty string
})
```

3. **Use custom error messages**
```typescript
z.string().min(1, "Subject is required")
z.number().min(3, "At least 3 topics required").max(10, "Maximum 10 topics allowed")
```

---

## Creating Custom Tools

### Step-by-Step Guide

**1. Define the tool:**
```typescript
export const myCustomTool = ai.defineTool(
  {
    name: "myCustomTool",
    inputSchema: z.object({
      // Your inputs
    }),
    outputSchema: z.object({
      // Your outputs
    }),
    description: "What this tool does and when to use it",
  },
  async (input) => {
    // Implementation
    return output;
  }
);
```

**2. Test in isolation:**
```typescript
// Test file
const result = await myCustomTool({ /* test input */ });
console.log(result);
```

**3. Test in Genkit Dev UI:**
```bash
bun run genkit
# Tools → myCustomTool → Test with inputs
```

**4. Use in flows:**
```typescript
const result = await ai.generate({
  prompt: "Your prompt",
  tools: [myCustomTool],
});
```

### Example: Create a CodeExample Tool

```typescript
export const generateCodeExample = ai.defineTool(
  {
    name: "generateCodeExample",
    inputSchema: z.object({
      concept: z.string(),
      language: z.enum(["javascript", "python", "java", "rust"]),
      complexity: z.enum(["simple", "intermediate", "advanced"]),
    }),
    outputSchema: z.object({
      code: z.string(),
      explanation: z.string(),
      runInstructions: z.string(),
    }),
    description: "Generate a code example demonstrating a programming concept with explanation and run instructions.",
  },
  async ({ concept, language, complexity }) => {
    const prompt = `Generate a ${complexity} ${language} code example demonstrating "${concept}".

Include:
1. Well-commented code
2. Explanation of how it works
3. Instructions to run it

Code should be production-quality and follow best practices.`;

    const result = await ai.generate({
      model: "googleai/gemini-2.0-flash-exp",
      prompt,
      output: {
        format: "json",
        schema: z.object({
          code: z.string(),
          explanation: z.string(),
          runInstructions: z.string(),
        }),
      },
    });

    return result.output;
  }
);
```

---

## Creating Custom Prompts

### Step-by-Step Guide

**1. Define the prompt:**
```typescript
export const myCustomPrompt = ai.definePrompt(
  {
    name: "myCustomPrompt",
    description: "What this prompt does",
    model: "googleai/gemini-2.0-flash-exp",
    input: {
      schema: z.object({
        variable1: z.string(),
        variable2: z.number(),
      }),
    },
  },
  `Your prompt template here.
  
Use variables like {{variable1}} and {{variable2}}.

Provide clear instructions and context.`
);
```

**2. Create helper function (optional):**
```typescript
const myCustomPrompt = (var1: string, var2: number) => 
  `Your prompt with ${var1} and ${var2}`;
```

**3. Test in Genkit Dev UI:**
```bash
bun run genkit
# Prompts → myCustomPrompt → Enter inputs
```

**4. Use in flows:**
```typescript
const result = await ai.generate({
  model: "googleai/gemini-2.0-flash-exp",
  prompt: myCustomPrompt(value1, value2),
});
```

### Example: Study Tips Prompt

```typescript
export const studyTipsPrompt = ai.definePrompt(
  {
    name: "studyTipsPrompt",
    description: "Generate practical study tips for a subject",
    model: "googleai/gemini-2.0-flash-exp",
    input: {
      schema: z.object({
        subject: z.string(),
        difficulty: z.enum(["beginner", "intermediate", "advanced"]),
        learningStyle: z.enum(["visual", "auditory", "kinesthetic"]).optional(),
      }),
    },
  },
  `You are an experienced study coach.

Generate 7 practical study tips for learning {{subject}} at {{difficulty}} level.
${learningStyle ? `Student prefers {{learningStyle}} learning.` : ''}

Focus on:
- Active learning techniques
- Memory retention strategies
- Time management
- Resource utilization
- Practice methods
- Motivation techniques
- Common pitfalls to avoid

Format as numbered list with brief explanations.`
);
```

---

**Next:** Explore [Advanced Topics](Advanced-Topics) for optimization and production patterns →

