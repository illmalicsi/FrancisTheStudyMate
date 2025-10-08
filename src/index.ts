import { openAI } from "@genkit-ai/compat-oai/openai";
import { googleAI } from "@genkit-ai/google-genai";
import { genkit, z } from "genkit";

const ai = genkit({ plugins: [googleAI(), openAI()] });

// ============================================================================
// PROMPTS - Reusable prompt templates
// ============================================================================

// Genkit prompt definitions for Dev UI visibility
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

Given the subject "{{subject}}", suggest {{topicCount}} concise, actionable study topics as a bullet list.

Guidelines:
- Start from fundamentals and progress to advanced concepts
- Focus on core understanding before details
- Make each topic specific and actionable
- Order topics in a logical learning sequence`,
);

export const structuredStudyPlanPromptDef = ai.definePrompt(
  {
    name: "structuredStudyPlanPrompt",
    description: "Generate a structured study plan with topics and resources",
    model: "googleai/gemini-2.0-flash-exp",
    input: {
      schema: z.object({
        subject: z.string(),
        difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
      }),
    },
  },
  `You are an expert educational consultant creating personalized study plans.

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
- Use the findEducationalLink tool to find a high-quality resource for the main subject`,
);

// Helper functions for use in flows (avoid model requirement issues)
const studyTopicsPrompt = (subject: string, topicCount: number = 5) => 
  `You are an expert tutor with deep knowledge across all academic subjects.

Given the subject "${subject}", suggest ${topicCount} concise, actionable study topics as a bullet list.

Guidelines:
- Start from fundamentals and progress to advanced concepts
- Focus on core understanding before details
- Make each topic specific and actionable
- Order topics in a logical learning sequence`;

const structuredStudyPlanPrompt = (
  subject: string,
  difficulty: string = "beginner",
) => `You are an expert educational consultant creating personalized study plans.

Subject: ${subject}
Difficulty Level: ${difficulty}

Create a structured study plan that includes:
1. Subject name (exactly as provided)
2. 3-5 core topics to study in logical order
3. A recommended educational resource

Guidelines:
- For beginners: focus on fundamentals and core concepts
- For intermediate: include practical applications and deeper theory
- For advanced: emphasize mastery, research, and real-world problems
- Topics should be specific, measurable learning objectives
- Use the findEducationalLink tool to find a high-quality resource for the main subject`;

// ============================================================================
// TOOLS - Reusable tool definitions
// ============================================================================

export const findEducationalLink = ai.defineTool(
  {
    name: "findEducationalLink",
    inputSchema: z.object({
      topic: z.string(),
      preferredPlatform: z
        .enum(["youtube", "khanacademy", "coursera", "any"])
        .optional(),
    }),
    outputSchema: z.object({
      title: z.string(),
      url: z.string().url(),
      platform: z.string(),
    }),
    description:
      "Find a relevant educational link for a topic. Can target specific platforms like YouTube, Khan Academy, or Coursera.",
  },
  async ({ topic, preferredPlatform }) => {
    const q = topic?.trim();
    if (!q) {
      return {
        title: "Getting Started",
        url: "https://www.khanacademy.org",
        platform: "Khan Academy",
      };
    }

    const encoded = encodeURIComponent(q);

    switch (preferredPlatform) {
      case "khanacademy":
        return {
          title: `${q} - Khan Academy`,
          url: `https://www.khanacademy.org/search?page_search_query=${encoded}`,
          platform: "Khan Academy",
        };
      case "coursera":
        return {
          title: `${q} Courses`,
          url: `https://www.coursera.org/search?query=${encoded}`,
          platform: "Coursera",
        };
      default:
        return {
          title: `Introduction to ${q}`,
          url: `https://www.youtube.com/results?search_query=${encoded}+tutorial`,
          platform: "YouTube",
        };
    }
  },
);

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
    description:
      "Estimate the time required to master a topic based on difficulty level. Returns recommended hours per week and total weeks needed.",
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
  },
);

export const generateQuizQuestions = ai.defineTool(
  {
    name: "generateQuizQuestions",
    inputSchema: z.object({
      topic: z.string(),
      count: z.number().min(1).max(10).optional(),
      difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
    }),
    outputSchema: z.object({
      topic: z.string(),
      questions: z.array(
        z.object({
          question: z.string(),
          type: z.enum(["multiple-choice", "true-false", "short-answer"]),
          answer: z.string(),
          options: z.array(z.string()).optional(),
          explanation: z.string().optional(),
        }),
      ),
    }),
    description:
      "Generate quiz questions with answers for a given topic to test understanding. Includes multiple-choice options when applicable.",
  },
  async ({ topic, count = 3, difficulty = "beginner" }) => {
    const prompt = `Generate ${count} quiz questions about "${topic}" for ${difficulty} level learners.

For each question, provide:
1. The question text
2. The correct answer
3. For multiple-choice: 4 options (including the correct answer)
4. A brief explanation of why the answer is correct

Mix question types: multiple-choice, true-false, and short-answer.
Return as JSON array with format:
{
  "question": "...",
  "type": "multiple-choice|true-false|short-answer",
  "answer": "...",
  "options": ["A", "B", "C", "D"] (only for multiple-choice),
  "explanation": "..."
}`;

    const result = await ai.generate({
      model: "googleai/gemini-2.0-flash-exp",
      prompt,
      output: {
        format: "json",
        schema: z.object({
          questions: z.array(
            z.object({
              question: z.string(),
              type: z.enum(["multiple-choice", "true-false", "short-answer"]),
              answer: z.string(),
              options: z.array(z.string()).optional(),
              explanation: z.string().optional(),
            }),
          ),
        }),
      },
    });

    const data = result.output as {
      questions: Array<{
        question: string;
        type: "multiple-choice" | "true-false" | "short-answer";
        answer: string;
        options?: string[];
        explanation?: string;
      }>;
    };

    return {
      topic,
      questions: data?.questions || [],
    };
  },
);

// ============================================================================
// TYPES
// ============================================================================

export type Resource = { title: string; url: string; platform?: string };
export type StudyPlan = {
  subject: string;
  topics: string[];
  resource: Resource;
  difficulty?: string;
};

export type EnhancedStudyPlan = {
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

// ============================================================================
// FLOWS
// ============================================================================

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
    const requested = model?.trim();
    const selectedModel = requested || "googleai/gemini-2.0-flash-exp";

    const result = await ai.generate({
      model: selectedModel,
      prompt: studyTopicsPrompt(subject, topicCount),
    });

    return { text: result.text ?? "No suggestions available." };
  },
);

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

    const requested = model?.trim();
    const selectedModel = requested || "googleai/gemini-2.0-flash-exp";

    // Use the structured study plan prompt template
    const result = await ai.generate({
      model: selectedModel,
      prompt: structuredStudyPlanPrompt(subject, difficulty),
      output: { format: "json", schema },
      tools: [findEducationalLink],
    });

    const json = (result.output ?? {}) as StudyPlan;

    if (!json?.resource?.url) {
      const resource = await findEducationalLink({ topic: subject });
      json.resource = resource;
    }

    json.difficulty = difficulty;
    return json as StudyPlan;
  },
);

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
          estimatedTime: z
            .object({
              hoursPerWeek: z.number(),
              totalWeeks: z.number(),
            })
            .optional(),
        }),
      ),
      resource: z.object({
        title: z.string(),
        url: z.string().url(),
        platform: z.string().optional(),
      }),
      totalEstimatedHours: z.number().optional(),
    }),
  },
  async ({
    subject,
    difficulty = "beginner",
    model,
    includeTimeEstimates = false,
  }) => {
    const requested = model?.trim();
    const selectedModel = requested || "googleai/gemini-2.0-flash-exp";

    const schema = z.object({
      subject: z.string(),
      topics: z.array(z.string()),
      resource: z.object({
        title: z.string(),
        url: z.string().url(),
        platform: z.string().optional(),
      }),
    });

    // Use the structured study plan prompt template
    const result = await ai.generate({
      model: selectedModel,
      prompt: structuredStudyPlanPrompt(subject, difficulty),
      output: { format: "json", schema },
      tools: [findEducationalLink, estimateStudyTime],
    });

    const planData = (result.output ?? {}) as {
      subject: string;
      topics: string[];
      resource: Resource;
    };

    if (!planData?.resource?.url) {
      const resource = await findEducationalLink({ topic: subject });
      planData.resource = resource;
    }

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

    return {
      subject: planData.subject,
      difficulty,
      topics: enhancedTopics,
      resource: planData.resource,
      ...(includeTimeEstimates && { totalEstimatedHours: totalHours }),
    } as EnhancedStudyPlan;
  },
);
