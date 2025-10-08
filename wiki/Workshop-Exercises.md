# Workshop Exercises

These hands-on exercises will help you master Genkit by building and extending the study plan generator.

## Prerequisites

- Completed [Getting Started](Getting-Started) setup
- Read [Genkit Concepts](Genkit-Concepts)
- Reviewed [Flows Guide](Flows-Guide)

## Exercise Structure

Each exercise includes:
- 🎯 **Objective** - What you'll build
- ⏱️ **Time** - Estimated completion time
- 📚 **Concepts** - What you'll learn
- 📝 **Steps** - Implementation guide
- ✅ **Solution** - Code reference
- 🚀 **Challenge** - Extended version

---

## Exercise 1: Create a Custom Prompt

**🎯 Objective:** Create a new prompt for generating study tips

**⏱️ Time:** 15 minutes

**📚 Concepts:**
- Prompt definition with `ai.definePrompt`
- Variable interpolation
- Zod schemas

### Steps

1. **Open `src/index.ts`**

2. **Add a new prompt definition after existing prompts:**

```typescript
export const studyTipsPromptDef = ai.definePrompt(
  {
    name: "studyTipsPrompt",
    description: "Generate study tips for a specific subject",
    model: "googleai/gemini-2.0-flash-exp",
    input: {
      schema: z.object({
        subject: z.string(),
        difficulty: z.enum(["beginner", "intermediate", "advanced"]),
      }),
    },
  },
  `You are an experienced study coach who helps students learn effectively.

Generate 5 practical study tips for learning {{subject}} at the {{difficulty}} level.

Focus on:
- Active learning techniques
- Memory retention strategies
- Time management
- Resource utilization
- Practice methods

Format as a numbered list with brief explanations.`
);
```

3. **Create a helper function:**

```typescript
const studyTipsPrompt = (subject: string, difficulty: string) =>
  `You are an experienced study coach who helps students learn effectively.

Generate 5 practical study tips for learning ${subject} at the ${difficulty} level.

Focus on:
- Active learning techniques
- Memory retention strategies
- Time management
- Resource utilization
- Practice methods

Format as a numbered list with brief explanations.`;
```

4. **Test in Genkit Dev UI:**

```bash
bun run genkit
# Navigate to Prompts → studyTipsPrompt
# Test with: subject="Python", difficulty="beginner"
```

### ✅ Verification

Your prompt should generate output like:
```
1. Start with fundamentals - Master basic syntax before complex concepts
2. Code daily - Consistent 30-minute practice beats marathon sessions
3. Build projects - Apply concepts to real problems immediately
...
```

### 🚀 Challenge

- Add a `learningStyle` parameter (visual, auditory, kinesthetic)
- Customize tips based on learning style
- Add a `timeAvailable` parameter (hours per week)

---

## Exercise 2: Build a Study Resource Tool

**🎯 Objective:** Create a tool that finds specific types of study resources

**⏱️ Time:** 25 minutes

**📚 Concepts:**
- Tool definition with `ai.defineTool`
- Input/output schemas
- Async operations

### Steps

1. **Add the tool definition in `src/index.ts`:**

```typescript
export const findStudyResources = ai.defineTool(
  {
    name: "findStudyResources",
    inputSchema: z.object({
      topic: z.string(),
      resourceType: z.enum(["video", "article", "book", "course", "practice"]),
      difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
    }),
    outputSchema: z.object({
      resources: z.array(
        z.object({
          title: z.string(),
          url: z.string().url(),
          type: z.string(),
          description: z.string().optional(),
        })
      ),
    }),
    description:
      "Find study resources of specific types (videos, articles, books, courses, practice sites) for a given topic.",
  },
  async ({ topic, resourceType, difficulty = "beginner" }) => {
    const encoded = encodeURIComponent(topic);
    const resources = [];

    switch (resourceType) {
      case "video":
        resources.push({
          title: `${topic} Tutorial`,
          url: `https://www.youtube.com/results?search_query=${encoded}+tutorial`,
          type: "Video",
          description: "YouTube video tutorials",
        });
        break;

      case "article":
        resources.push({
          title: `${topic} Articles`,
          url: `https://medium.com/search?q=${encoded}`,
          type: "Article",
          description: "Medium articles and blog posts",
        });
        break;

      case "book":
        resources.push({
          title: `${topic} Books`,
          url: `https://www.goodreads.com/search?q=${encoded}`,
          type: "Book",
          description: "Recommended books on Goodreads",
        });
        break;

      case "course":
        resources.push({
          title: `${topic} Courses`,
          url: `https://www.coursera.org/search?query=${encoded}`,
          type: "Course",
          description: "Online courses on Coursera",
        });
        break;

      case "practice":
        resources.push({
          title: `${topic} Practice`,
          url: `https://www.hackerrank.com/domains/tutorials/${encoded}`,
          type: "Practice",
          description: "Coding challenges and practice problems",
        });
        break;
    }

    return { resources };
  }
);
```

2. **Test the tool in code:**

```typescript
// Add temporary test code
const testResult = await findStudyResources({
  topic: "Python",
  resourceType: "video",
  difficulty: "beginner",
});
console.log(testResult);
```

3. **Test in Genkit Dev UI:**

```bash
bun run genkit
# Navigate to Tools → findStudyResources
# Test with different resource types
```

### ✅ Verification

Tool should return:
```json
{
  "resources": [
    {
      "title": "Python Tutorial",
      "url": "https://www.youtube.com/results?search_query=Python+tutorial",
      "type": "Video",
      "description": "YouTube video tutorials"
    }
  ]
}
```

### 🚀 Challenge

- Make an actual API call to a real resource database
- Add filtering by difficulty level
- Return multiple resources per type
- Add user ratings/reviews

---

## Exercise 3: Create a Simple Study Schedule Flow

**🎯 Objective:** Build a flow that generates a weekly study schedule

**⏱️ Time:** 35 minutes

**📚 Concepts:**
- Flow definition
- Structured output
- Multiple tool composition

### Steps

1. **Define output types:**

```typescript
export type StudySchedule = {
  subject: string;
  hoursPerWeek: number;
  schedule: Array<{
    day: string;
    timeSlot: string;
    topic: string;
    duration: number; // minutes
  }>;
};
```

2. **Create the flow:**

```typescript
export const studyScheduleGenerator = ai.defineFlow(
  {
    name: "studyScheduleGenerator",
    inputSchema: z.object({
      subject: z.string().min(1),
      hoursPerWeek: z.number().min(1).max(20),
      difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
      preferredDays: z.array(z.string()).optional(),
    }),
    outputSchema: z.object({
      subject: z.string(),
      hoursPerWeek: z.number(),
      schedule: z.array(
        z.object({
          day: z.string(),
          timeSlot: z.string(),
          topic: z.string(),
          duration: z.number(),
        })
      ),
    }),
  },
  async ({ subject, hoursPerWeek, difficulty = "beginner", preferredDays }) => {
    const prompt = `Create a weekly study schedule for ${subject}.

Requirements:
- Total hours per week: ${hoursPerWeek}
- Difficulty level: ${difficulty}
${preferredDays ? `- Preferred days: ${preferredDays.join(", ")}` : ""}

Create a balanced schedule with:
1. Short study sessions (30-90 minutes)
2. Mix of theory and practice
3. Rest days
4. Progressive topic sequence

Return a schedule with day, time slot, topic, and duration for each session.`;

    const result = await ai.generate({
      model: "googleai/gemini-2.0-flash-exp",
      prompt,
      output: {
        format: "json",
        schema: z.object({
          subject: z.string(),
          hoursPerWeek: z.number(),
          schedule: z.array(
            z.object({
              day: z.string(),
              timeSlot: z.string(),
              topic: z.string(),
              duration: z.number(),
            })
          ),
        }),
      },
    });

    return result.output as StudySchedule;
  }
);
```

3. **Add API endpoint (optional):**

Modify `src/app/api/generate/route.ts` to support the new flow:

```typescript
// In POST handler
if (flowMode === "schedule") {
  result = await studyScheduleGenerator({
    subject,
    hoursPerWeek: body.hoursPerWeek || 5,
    difficulty,
    preferredDays: body.preferredDays,
  });
}
```

4. **Test the flow:**

```bash
bun run genkit
# Test studyScheduleGenerator with:
# subject: "JavaScript"
# hoursPerWeek: 8
# difficulty: "beginner"
```

### ✅ Verification

Output should look like:
```json
{
  "subject": "JavaScript",
  "hoursPerWeek": 8,
  "schedule": [
    {
      "day": "Monday",
      "timeSlot": "7:00 PM - 8:30 PM",
      "topic": "JavaScript Fundamentals - Variables and Data Types",
      "duration": 90
    },
    // ... more sessions
  ]
}
```

### 🚀 Challenge

- Add break reminders between sessions
- Include Pomodoro technique integration
- Add difficulty-based session lengths
- Generate study goals for each session

---

## Exercise 4: Implement Quiz Difficulty Adjustment

**🎯 Objective:** Enhance the quiz generator to adjust difficulty

**⏱️ Time:** 30 minutes

**📚 Concepts:**
- Tool enhancement
- Nested AI generation
- Schema refinement

### Steps

1. **Enhance the quiz tool in `src/index.ts`:**

```typescript
export const generateAdaptiveQuiz = ai.defineTool(
  {
    name: "generateAdaptiveQuiz",
    inputSchema: z.object({
      topic: z.string(),
      difficulty: z.enum(["beginner", "intermediate", "advanced"]),
      count: z.number().min(1).max(10).optional(),
      questionTypes: z.array(
        z.enum(["multiple-choice", "true-false", "short-answer", "coding"])
      ).optional(),
    }),
    outputSchema: z.object({
      topic: z.string(),
      difficulty: z.string(),
      questions: z.array(
        z.object({
          question: z.string(),
          type: z.string(),
          difficulty: z.string(),
          answer: z.string(),
          options: z.array(z.string()).optional(),
          explanation: z.string(),
          hints: z.array(z.string()).optional(),
        })
      ),
    }),
    description:
      "Generate adaptive quiz questions that adjust to student difficulty level with hints and detailed explanations.",
  },
  async ({ topic, difficulty, count = 5, questionTypes }) => {
    const types = questionTypes || ["multiple-choice", "true-false", "short-answer"];
    
    const prompt = `Generate ${count} ${difficulty}-level quiz questions about "${topic}".

Difficulty Guidelines:
- Beginner: Focus on definitions, basic concepts, recall
- Intermediate: Application, analysis, connections between concepts
- Advanced: Synthesis, evaluation, complex problem-solving

Question Types: ${types.join(", ")}

For each question provide:
1. Clear, specific question text
2. Correct answer
3. For multiple-choice: 4 options with one correct
4. Detailed explanation of the correct answer
5. 2-3 helpful hints for students (progressive difficulty)

Make questions challenging but fair for the ${difficulty} level.`;

    const result = await ai.generate({
      model: "googleai/gemini-2.0-flash-exp",
      prompt,
      output: {
        format: "json",
        schema: z.object({
          questions: z.array(
            z.object({
              question: z.string(),
              type: z.string(),
              difficulty: z.string(),
              answer: z.string(),
              options: z.array(z.string()).optional(),
              explanation: z.string(),
              hints: z.array(z.string()).optional(),
            })
          ),
        }),
      },
    });

    return {
      topic,
      difficulty,
      questions: result.output.questions,
    };
  }
);
```

2. **Test with different difficulties:**

```typescript
// Beginner test
const beginnerQuiz = await generateAdaptiveQuiz({
  topic: "JavaScript Arrays",
  difficulty: "beginner",
  count: 3,
});

// Advanced test
const advancedQuiz = await generateAdaptiveQuiz({
  topic: "JavaScript Closures",
  difficulty: "advanced",
  count: 3,
  questionTypes: ["coding", "short-answer"],
});
```

### ✅ Verification

Beginner questions should be simpler:
```json
{
  "question": "What method adds an element to the end of an array?",
  "type": "multiple-choice",
  "difficulty": "beginner",
  "hints": [
    "Think about the direction - end of the array",
    "It starts with 'p'",
    "The opposite is unshift"
  ]
}
```

Advanced questions should be more complex:
```json
{
  "question": "Explain how closure scope chains work in nested functions",
  "type": "short-answer",
  "difficulty": "advanced"
}
```

### 🚀 Challenge

- Add code execution testing for coding questions
- Implement adaptive difficulty (next question based on previous answer)
- Add time estimates per question
- Create a scoring system

---

## Exercise 5: Build a Multi-Step Learning Path

**🎯 Objective:** Create a flow that generates a complete learning path with prerequisites

**⏱️ Time:** 45 minutes

**📚 Concepts:**
- Complex flow orchestration
- Multiple tool composition
- Graph-like data structures

### Steps

1. **Define the learning path type:**

```typescript
export type LearningPath = {
  subject: string;
  totalDuration: string;
  prerequisites: string[];
  modules: Array<{
    moduleNumber: number;
    title: string;
    topics: string[];
    duration: string;
    requiredModules: number[]; // prerequisite module numbers
    resources: Array<{
      title: string;
      url: string;
      type: string;
    }>;
    assessment: {
      quizCount: number;
      projectIdeas: string[];
    };
  }>;
};
```

2. **Create the flow:**

```typescript
export const learningPathGenerator = ai.defineFlow(
  {
    name: "learningPathGenerator",
    inputSchema: z.object({
      subject: z.string().min(1),
      targetSkillLevel: z.enum(["beginner", "intermediate", "advanced"]),
      weeksAvailable: z.number().min(1).max(52),
      priorKnowledge: z.array(z.string()).optional(),
    }),
    outputSchema: z.object({
      subject: z.string(),
      totalDuration: z.string(),
      prerequisites: z.array(z.string()),
      modules: z.array(
        z.object({
          moduleNumber: z.number(),
          title: z.string(),
          topics: z.array(z.string()),
          duration: z.string(),
          requiredModules: z.array(z.number()),
          resources: z.array(
            z.object({
              title: z.string(),
              url: z.string(),
              type: z.string(),
            })
          ),
          assessment: z.object({
            quizCount: z.number(),
            projectIdeas: z.array(z.string()),
          }),
        })
      ),
    }),
  },
  async ({ subject, targetSkillLevel, weeksAvailable, priorKnowledge = [] }) => {
    // Step 1: Generate base learning path structure
    const pathPrompt = `Create a comprehensive ${weeksAvailable}-week learning path for ${subject} to reach ${targetSkillLevel} level.

${priorKnowledge.length > 0 ? `Student already knows: ${priorKnowledge.join(", ")}` : ""}

Create a structured path with:
1. List of prerequisites needed before starting
2. 4-8 progressive modules
3. Each module should have:
   - Module number
   - Descriptive title
   - 3-5 specific topics covered
   - Duration estimate
   - Which previous modules are required (by number)
   - Assessment requirements (quiz count, project ideas)

Ensure modules build on each other logically.`;

    const pathResult = await ai.generate({
      model: "googleai/gemini-2.0-flash-exp",
      prompt: pathPrompt,
      output: {
        format: "json",
        schema: z.object({
          subject: z.string(),
          totalDuration: z.string(),
          prerequisites: z.array(z.string()),
          modules: z.array(
            z.object({
              moduleNumber: z.number(),
              title: z.string(),
              topics: z.array(z.string()),
              duration: z.string(),
              requiredModules: z.array(z.number()),
              assessment: z.object({
                quizCount: z.number(),
                projectIdeas: z.array(z.string()),
              }),
            })
          ),
        }),
      },
    });

    const basePath = pathResult.output;

    // Step 2: Enrich each module with resources
    const enrichedModules = await Promise.all(
      basePath.modules.map(async (module) => {
        // Find resources for this module
        const resourceResults = await Promise.all([
          findEducationalLink({
            topic: module.title,
            preferredPlatform: "youtube",
          }),
          findEducationalLink({
            topic: module.title,
            preferredPlatform: "any",
          }),
        ]);

        return {
          ...module,
          resources: resourceResults.map((r, idx) => ({
            title: r.title,
            url: r.url,
            type: idx === 0 ? "video" : r.platform || "article",
          })),
        };
      })
    );

    return {
      subject: basePath.subject,
      totalDuration: basePath.totalDuration,
      prerequisites: basePath.prerequisites,
      modules: enrichedModules,
    } as LearningPath;
  }
);
```

3. **Test the complete flow:**

```bash
bun run genkit
# Test with:
# subject: "Full Stack Web Development"
# targetSkillLevel: "intermediate"
# weeksAvailable: 12
# priorKnowledge: ["HTML", "CSS", "Basic JavaScript"]
```

### ✅ Verification

Output should include:
- Progressive modules with dependencies
- Resources for each module
- Project ideas for practice
- Clear prerequisite tracking

### 🚀 Challenge

- Add skill assessment tests between modules
- Generate prerequisite learning paths automatically
- Create a visual dependency graph
- Add estimated completion percentage tracking
- Implement adaptive path adjustment based on progress

---

## Bonus Exercises

### Exercise 6: Add Spaced Repetition

Create a tool that calculates optimal review intervals using spaced repetition algorithm.

### Exercise 7: Multi-Language Support

Extend all flows to support multiple languages using translation.

### Exercise 8: Collaborative Study

Build a flow that generates group study session plans.

### Exercise 9: Progress Tracking

Create a system to track student progress through a learning path.

### Exercise 10: AI Study Buddy

Build a conversational flow that answers student questions about topics.

---

## Submission Guidelines

After completing exercises:

1. **Test your implementation**
   ```bash
   bun run lint
   bun run format
   bun dev
   ```

2. **Test in Genkit Dev UI**
   ```bash
   bun run genkit
   ```

3. **Document your changes**
   - Add comments explaining your code
   - Update types as needed
   - Note any challenges faced

4. **Create a branch** (if working in a team)
   ```bash
   git checkout -b exercise-X-your-name
   git add .
   git commit -m "Complete Exercise X: [description]"
   git push origin exercise-X-your-name
   ```

## Getting Help

- **Stuck?** Check the [Troubleshooting](Troubleshooting) guide
- **Questions?** Review [Genkit Concepts](Genkit-Concepts)
- **Need examples?** See [Flows Guide](Flows-Guide) and [Tools and Prompts](Tools-and-Prompts)

---

**Completed the exercises?** Check out [Advanced Topics](Advanced-Topics) for more →

