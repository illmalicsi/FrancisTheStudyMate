import "../../../../genkit.config";
import { NextResponse } from "next/server";
import {
  type EnhancedStudyPlan,
  enhancedStudyPlanGenerator,
  generateQuizQuestions,
  type StudyPlan,
  studyPlanGenerator,
  studyPlanGeneratorStructured,
} from "@/index";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const subject =
      typeof body?.subject === "string" ? body.subject.trim() : "";
    const model =
      typeof body?.model === "string" ? body.model.trim() : undefined;
    const difficulty =
      typeof body?.difficulty === "string" &&
      ["beginner", "intermediate", "advanced"].includes(body.difficulty)
        ? (body.difficulty as "beginner" | "intermediate" | "advanced")
        : "beginner";
    const includeTimeEstimates = body?.includeTimeEstimates === true;
    const enhanced = body?.enhanced === true;
    const includeQuiz = body?.includeQuiz === true;
    const flowMode =
      typeof body?.flowMode === "string" ? body.flowMode : "structured";
    const topicCount =
      typeof body?.topicCount === "number" ? body.topicCount : 5;

    if (!subject) {
      return NextResponse.json({ error: "Missing subject" }, { status: 400 });
    }

    let result: StudyPlan | EnhancedStudyPlan | { text: string };
    let quizQuestions = null;

    // Handle different flow modes
    if (flowMode === "simple") {
      result = await studyPlanGenerator({
        subject,
        model,
        topicCount,
      });
    } else if (enhanced || flowMode === "enhanced") {
      result = await enhancedStudyPlanGenerator({
        subject,
        model,
        difficulty,
        includeTimeEstimates,
      });
    } else {
      result = await studyPlanGeneratorStructured({
        subject,
        model,
        difficulty,
      });
    }

    // Generate quiz if requested
    if (includeQuiz && "topics" in result) {
      const topics = Array.isArray(result.topics)
        ? result.topics.map((t) => (typeof t === "string" ? t : t.name))
        : [];

      if (topics.length > 0) {
        const quizPromises = topics.map((topic) =>
          generateQuizQuestions({ topic, count: 3, difficulty }),
        );
        const quizResults = await Promise.all(quizPromises);
        quizQuestions = quizResults;
      }
    }

    return NextResponse.json(
      {
        data: result,
        quiz: quizQuestions,
        meta: {
          flowMode,
          toolsUsed: getToolsUsed(flowMode, enhanced, includeTimeEstimates, includeQuiz),
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error generating study plan:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

function getToolsUsed(
  flowMode: string,
  enhanced: boolean,
  includeTimeEstimates: boolean,
  includeQuiz: boolean,
): string[] {
  const tools: string[] = [];

  if (flowMode === "simple") {
    tools.push("studyTopicsPrompt");
  } else {
    tools.push("structuredStudyPlanPrompt");
    tools.push("findEducationalLink");

    if (enhanced || includeTimeEstimates) {
      tools.push("estimateStudyTime");
    }
  }

  if (includeQuiz) {
    tools.push("generateQuizQuestions");
  }

  return tools;
}
