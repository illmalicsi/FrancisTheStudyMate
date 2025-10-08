"use client";
import { useState } from "react";

type Resource = { title: string; url: string; platform?: string };

type StudyPlan = {
  subject: string;
  topics: string[];
  resource: Resource;
  difficulty?: string;
};

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

type QuizQuestion = {
  question: string;
  type: "multiple-choice" | "true-false" | "short-answer";
  answer: string;
  options?: string[];
  explanation?: string;
};

type QuizResult = {
  topic: string;
  questions: QuizQuestion[];
};

type Difficulty = "beginner" | "intermediate" | "advanced";
type FlowMode = "simple" | "structured" | "enhanced";

export default function Home() {
  const [subject, setSubject] = useState<string>("");
  const [plan, setPlan] = useState<StudyPlan | EnhancedStudyPlan | { text: string } | null>(null);
  const [quiz, setQuiz] = useState<QuizResult[] | null>(null);
  const [toolsUsed, setToolsUsed] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [model, setModel] = useState<string>("googleai/gemini-2.0-flash-exp");
  const [difficulty, setDifficulty] = useState<Difficulty>("beginner");
  const [flowMode, setFlowMode] = useState<FlowMode>("structured");
  const [enhanced, setEnhanced] = useState<boolean>(false);
  const [includeTimeEstimates, setIncludeTimeEstimates] = useState<boolean>(false);
  const [includeQuiz, setIncludeQuiz] = useState<boolean>(false);
  const [topicCount, setTopicCount] = useState<number>(5);
  const [showAnswers, setShowAnswers] = useState<Record<string, boolean>>({});

  const handleGenerate = async () => {
    const s = subject.trim();
    if (!s) {
      setError("Please enter a subject");
      return;
    }
    setError("");
    setIsLoading(true);
    setPlan(null);
    setQuiz(null);
    setToolsUsed([]);
    setShowAnswers({});
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: s,
          model,
          difficulty,
          flowMode,
          enhanced,
          includeTimeEstimates: enhanced && includeTimeEstimates,
          includeQuiz,
          topicCount,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to generate");
      setPlan(data.data);
      setQuiz(data.quiz);
      setToolsUsed(data.meta?.toolsUsed || []);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Something went wrong";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleGenerate();
  };

  const isEnhancedPlan = (
    plan: StudyPlan | EnhancedStudyPlan | { text: string } | null,
  ): plan is EnhancedStudyPlan => {
    return plan !== null &&
      "topics" in plan &&
      Array.isArray(plan.topics) &&
      plan.topics.length > 0
      ? typeof plan.topics[0] === "object"
      : false;
  };

  const isSimplePlan = (
    plan: StudyPlan | EnhancedStudyPlan | { text: string } | null,
  ): plan is { text: string } => {
    return plan !== null && "text" in plan && !("topics" in plan);
  };

  return (
    <div className="font-sans text-foreground">
      <div className="flex flex-col gap-8">
        <header className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-brand-700 dark:text-brand-300">
            Francis the StudyMate
          </h1>
          <p className="text-sm text-brand-800/80 dark:text-brand-100/80 max-w-prose">
            Your friendly study plan generator powered by Genkit. Enter a
            subject, choose your preferences, and get a personalized study plan
            with topics and resources.
          </p>
        </header>

        <section
          className="flex flex-col gap-4"
          aria-label="Study plan generator"
        >
          <div className="space-y-2">
            <label htmlFor="subject" className="text-sm font-medium opacity-80">
              Enter a subject
            </label>
            <input
              id="subject"
              aria-label="Subject"
              tabIndex={0}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g., World History, Machine Learning, or Spanish"
              className="w-full rounded-md border border-brand-600/30 bg-white/80 dark:bg-brand-900/20 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-500 placeholder:opacity-60"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label
                htmlFor="flowMode"
                className="text-sm font-medium opacity-80"
              >
                Generation Flow
              </label>
              <select
                id="flowMode"
                aria-label="Flow Mode"
                tabIndex={0}
                value={flowMode}
                onChange={(e) => setFlowMode(e.target.value as FlowMode)}
                className="w-full rounded-md border border-brand-600/30 bg-white/80 dark:bg-brand-900/20 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-500"
              >
                <option value="simple">Simple (Text Only)</option>
                <option value="structured">Structured (JSON + Tools)</option>
                <option value="enhanced">Enhanced (Advanced Tools)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="model" className="text-sm font-medium opacity-80">
                AI Model
              </label>
              <select
                id="model"
                aria-label="Model"
                tabIndex={0}
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full rounded-md border border-brand-600/30 bg-white/80 dark:bg-brand-900/20 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-500"
              >
                <option value="googleai/gemini-2.0-flash-exp">
                  Gemini 2.0 Flash
                </option>
                <option value="googleai/gemini-2.0-flash-thinking-exp">
                  Gemini 2.0 Flash Thinking
                </option>
                <option value="openai/gpt-4o-mini">GPT-4o Mini</option>
              </select>
            </div>
          </div>

          {flowMode !== "simple" && (
            <div className="space-y-2">
              <label
                htmlFor="difficulty"
                className="text-sm font-medium opacity-80"
              >
                Difficulty Level
              </label>
              <select
                id="difficulty"
                aria-label="Difficulty"
                tabIndex={0}
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                className="w-full rounded-md border border-brand-600/30 bg-white/80 dark:bg-brand-900/20 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-500"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          )}

          <div className="flex flex-col gap-2 rounded-md border border-brand-600/20 bg-brand-50/30 dark:bg-brand-900/10 p-3">
            <div className="text-sm font-medium opacity-80">
              Advanced Options
            </div>
            <div className="flex flex-col gap-2">
              {flowMode === "simple" && (
                <div className="space-y-2">
                  <label className="text-sm opacity-80" htmlFor="topicCount">
                    Number of Topics: {topicCount}
                  </label>
                  <input
                    id="topicCount"
                    type="range"
                    min="3"
                    max="10"
                    value={topicCount}
                    onChange={(e) => setTopicCount(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              )}
              
              {flowMode !== "simple" && (
                <>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enhanced}
                      onChange={(e) => setEnhanced(e.target.checked)}
                      className="rounded border-brand-600/30 text-brand-600 focus:ring-2 focus:ring-brand-400"
                    />
                    <span className="text-sm">
                      Enhanced mode (uses estimateStudyTime tool)
                    </span>
                  </label>
                  {enhanced && (
                    <label className="flex items-center gap-2 cursor-pointer ml-6">
                      <input
                        type="checkbox"
                        checked={includeTimeEstimates}
                        onChange={(e) => setIncludeTimeEstimates(e.target.checked)}
                        className="rounded border-brand-600/30 text-brand-600 focus:ring-2 focus:ring-brand-400"
                      />
                      <span className="text-sm">
                        Include time estimates for each topic
                      </span>
                    </label>
                  )}
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeQuiz}
                      onChange={(e) => setIncludeQuiz(e.target.checked)}
                      className="rounded border-brand-600/30 text-brand-600 focus:ring-2 focus:ring-brand-400"
                    />
                    <span className="text-sm">
                      Generate quiz questions (uses generateQuizQuestions tool)
                    </span>
                  </label>
                </>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            aria-label="Generate study plan"
            className="rounded-md bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-brand-foreground px-6 py-2.5 font-medium shadow-sm disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-brand-400 disabled:cursor-not-allowed transition-colors"
            disabled={isLoading}
          >
            {isLoading ? "Generating…" : "Generate Study Plan"}
          </button>

          {error && (
            <p className="text-sm text-red-500" role="alert">
              {error}
            </p>
          )}
        </section>

        <section aria-live="polite" className="space-y-4">
          {toolsUsed.length > 0 && !isLoading && (
            <div className="rounded-lg border border-blue-500/30 bg-blue-50/50 dark:bg-blue-900/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                  Genkit Tools & Prompts Used
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {toolsUsed.map((tool) => (
                  <span
                    key={tool}
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          )}

          {isLoading && (
            <div className="rounded-lg border border-brand-600/20 bg-brand-50/40 dark:bg-brand-900/20 p-5 animate-pulse">
              <div className="h-5 w-48 bg-brand-600/30 rounded mb-3" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-brand-600/20 rounded" />
                <div className="h-4 w-5/6 bg-brand-600/20 rounded" />
                <div className="h-4 w-4/5 bg-brand-600/20 rounded" />
              </div>
            </div>
          )}

          {plan && !isLoading && isSimplePlan(plan) && (
            <div className="rounded-lg border border-brand-600/20 bg-white/70 dark:bg-brand-900/20 backdrop-blur p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-brand-700 dark:text-brand-200 mb-4">
                Study Plan for {subject}
              </h2>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm">
                  {plan.text}
                </pre>
              </div>
            </div>
          )}

          {plan && !isLoading && !isSimplePlan(plan) && (
            <div className="rounded-lg border border-brand-600/20 bg-white/70 dark:bg-brand-900/20 backdrop-blur p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-brand-700 dark:text-brand-200">
                    {plan.subject}
                  </h2>
                  {plan.difficulty && (
                    <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-brand-600/20 text-brand-700 dark:text-brand-300">
                      {plan.difficulty.charAt(0).toUpperCase() +
                        plan.difficulty.slice(1)}{" "}
                      Level
                    </span>
                  )}
                </div>
                {isEnhancedPlan(plan) && plan.totalEstimatedHours && (
                  <div className="text-right">
                    <div className="text-2xl font-bold text-brand-700 dark:text-brand-200">
                      {plan.totalEstimatedHours}h
                    </div>
                    <div className="text-xs text-brand-600/70 dark:text-brand-400/70">
                      Total time
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3 mt-4">
                <h3 className="text-sm font-semibold text-brand-700/90 dark:text-brand-300/90">
                  Topics to Study
                </h3>
                {isEnhancedPlan(plan) ? (
                  <ul className="space-y-3">
                    {plan.topics.map((topic, idx) => (
                      <li
                        key={topic.name}
                        className="flex items-start gap-3 p-3 rounded-md bg-brand-50/50 dark:bg-brand-900/10 border border-brand-600/10"
                      >
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-600 text-white text-xs font-semibold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{topic.name}</p>
                          {topic.estimatedTime && (
                            <p className="text-xs text-brand-600/70 dark:text-brand-400/70 mt-1">
                              {topic.estimatedTime.hoursPerWeek}h/week for{" "}
                              {topic.estimatedTime.totalWeeks} weeks (
                              {topic.estimatedTime.hoursPerWeek *
                                topic.estimatedTime.totalWeeks}
                              h total)
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <ul className="list-disc pl-5 space-y-1.5">
                    {(plan.topics as string[]).map((topic) => (
                      <li key={topic} className="text-sm">
                        {topic}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {plan.resource?.url && (
                <div className="mt-5 pt-4 border-t border-brand-600/10">
                  <h3 className="text-sm font-semibold text-brand-700/90 dark:text-brand-300/90 mb-2">
                    Recommended Resource
                  </h3>
                  <a
                    href={plan.resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-brand-600/10 hover:bg-brand-600/20 text-brand-700 dark:text-brand-300 transition-colors"
                  >
                    <span className="text-sm font-medium">
                      {plan.resource.title || "View resource"}
                    </span>
                    {plan.resource.platform && (
                      <span className="text-xs opacity-70">
                        ({plan.resource.platform})
                      </span>
                    )}
                    <span aria-hidden className="text-lg">
                      ↗
                    </span>
                  </a>
                </div>
              )}
            </div>
          )}

          {quiz && quiz.length > 0 && !isLoading && (
            <div className="rounded-lg border border-purple-500/30 bg-purple-50/50 dark:bg-purple-900/20 backdrop-blur p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h2 className="text-xl font-semibold text-purple-700 dark:text-purple-200">
                  Quiz Questions
                </h2>
              </div>
              <div className="space-y-6">
                {quiz.map((topicQuiz, topicIdx) => (
                  <div key={topicQuiz.topic} className="space-y-3">
                    <h3 className="text-base font-semibold text-purple-700/90 dark:text-purple-300/90 flex items-center gap-2">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-semibold flex items-center justify-center">
                        {topicIdx + 1}
                      </span>
                      {topicQuiz.topic}
                    </h3>
                    <ul className="space-y-3 ml-8">
                      {topicQuiz.questions.map((q, qIdx) => {
                        const questionId = `${topicIdx}-${qIdx}`;
                        const isAnswerVisible = showAnswers[questionId] || false;
                        
                        return (
                          <li key={qIdx} className="p-4 rounded-md bg-white/70 dark:bg-purple-900/30 border border-purple-600/20">
                            <div className="space-y-3">
                              <div className="flex items-start gap-2">
                                <span className="text-xs font-medium text-purple-600/70 dark:text-purple-400/70 mt-0.5">
                                  Q{qIdx + 1}
                                </span>
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{q.question}</p>
                                  <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
                                    {q.type}
                                  </span>
                                </div>
                              </div>

                              {q.options && q.options.length > 0 && (
                                <div className="ml-7 space-y-1">
                                  {q.options.map((option, optIdx) => (
                                    <div key={optIdx} className="text-xs text-purple-700/80 dark:text-purple-300/80">
                                      {String.fromCharCode(65 + optIdx)}. {option}
                                    </div>
                                  ))}
                                </div>
                              )}

                              <div className="ml-7">
                                <button
                                  type="button"
                                  onClick={() => setShowAnswers(prev => ({ ...prev, [questionId]: !prev[questionId] }))}
                                  className="text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 underline"
                                >
                                  {isAnswerVisible ? "Hide answer" : "Show answer"}
                                </button>
                                
                                {isAnswerVisible && (
                                  <div className="mt-2 space-y-2 p-3 rounded-md bg-purple-100/50 dark:bg-purple-900/40 border border-purple-600/20">
                                    <div>
                                      <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">Answer:</span>
                                      <p className="text-sm text-purple-900 dark:text-purple-100 mt-1">{q.answer}</p>
                                    </div>
                                    {q.explanation && (
                                      <div>
                                        <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">Explanation:</span>
                                        <p className="text-xs text-purple-800/90 dark:text-purple-200/90 mt-1">{q.explanation}</p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
