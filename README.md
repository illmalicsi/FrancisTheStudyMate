# SysDev Genkit Workshop | SYSDEV BUILD FORWARD 2025

A minimal Next.js (App Router) app demonstrating Google Genkit flows and tools to generate personalized study plans via an API route, featuring "Francis the StudyMate" - a friendly AI-powered study plan generator.

## Tech Stack
- Next.js 15.5.4 (App Router)
- React 19.1.0
- TypeScript
- Tailwind CSS v4 (via @tailwindcss/postcss)
- Genkit ^1.21.0 with `@genkit-ai/google-genai` and `@genkit-ai/compat-oai`
- Biome 2.2.0 for linting/formatting
- Support for multiple AI models (Google Gemini 2.0 & OpenAI GPT-4o)

## Project Structure
```
src/
  app/
    api/
      generate/
        route.ts       # POST /api/generate → calls Genkit flow
    globals.css         # Tailwind base
    layout.tsx
    page.tsx            # Simple UI to call the API
  index.ts              # Genkit flows/tools exported for server usage

genkit.config.ts        # Genkit plugin configuration (googleAI)
next.config.ts
postcss.config.mjs
package.json
```

## Getting Started
1) Install dependencies
```bash
bun install
# or
npm install
# or
yarn
# or
pnpm i
```

2) Configure environment
- Set API credentials for your chosen AI providers:
  - `GOOGLE_GENAI_API_KEY` (for Google Gemini models via AI Studio)
  - `OPENAI_API_KEY` (for OpenAI GPT models)
  - Or authenticate with Google Cloud if using Vertex AI models

For local development, create a `.env.local` file:
```bash
# .env.local
GOOGLE_GENAI_API_KEY=your_google_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

**Note:** You only need the API key for the model provider you plan to use. The app supports:
- Google Gemini 2.0 Flash (default)
- Google Gemini 2.0 Flash Thinking
- OpenAI GPT-4o Mini

3) Run the development server
```bash
bun dev
# or
npm run dev
# or
yarn dev
# or
pnpm dev
```
Open `http://localhost:3000` to view the UI.

## Available Scripts
```bash
bun dev            # next dev --turbopack
bun run build      # next build --turbopack
bun start          # next start
bun run genkit     # genkit start (local Genkit tools console)
bun run lint       # biome check
bun run format     # biome format --write
```
(Use your chosen package manager equivalents.)

## Core Concepts
This project demonstrates comprehensive usage of Genkit's core features:

### Prompts (ai.definePrompt)
Reusable prompt templates defined for Dev UI visibility:
- **`studyTopicsPromptDef`**: Generates study topics with customizable topic count (3-10)
- **`structuredStudyPlanPromptDef`**: Creates detailed study plans with difficulty-based guidance
- Both prompts use variable interpolation with `{{variable}}` syntax
- Helper functions (`studyTopicsPrompt`, `structuredStudyPlanPrompt`) for direct flow usage

### Tools (ai.defineTool)
Modular tool definitions with Zod schema validation:
- **`findEducationalLink`**: Platform-specific resource discovery
  - Supports YouTube, Khan Academy, Coursera, or any platform
  - Returns title, URL, and platform information
- **`estimateStudyTime`**: Difficulty-based time calculations
  - Returns hours/week and total weeks needed
  - Adjusts for beginner/intermediate/advanced levels
- **`generateQuizQuestions`**: Assessment question generation
  - Creates multiple-choice, true-false, and short-answer questions
  - Includes answers and explanations
  - Configurable question count (1-10 per topic)

### Flows (ai.defineFlow)
Three production-ready flows with typed schemas:
- **`studyPlanGenerator`**: Simple text-based topic list
  - Input: subject, model (optional), topicCount (3-10)
  - Output: Plain text bullet list
- **`studyPlanGeneratorStructured`**: Structured JSON output
  - Input: subject, model (optional), difficulty
  - Output: JSON with topics array and educational resource
  - Uses: `findEducationalLink` tool
- **`enhancedStudyPlanGenerator`**: Advanced flow with time estimates
  - Input: subject, difficulty, model (optional), includeTimeEstimates
  - Output: Enhanced JSON with per-topic time estimates and totals
  - Uses: `findEducationalLink`, `estimateStudyTime` tools

### API & UI
- **`src/app/api/generate/route.ts`**: REST endpoint with intelligent flow routing
  - Supports all three flow modes
  - Optional quiz generation via `generateQuizQuestions` tool
  - Returns metadata about tools/prompts used
- **`src/app/page.tsx`**: "Francis the StudyMate" - Interactive UI with:
  - Flow mode selection (Simple/Structured/Enhanced)
  - Multi-provider model selection (Google Gemini & OpenAI)
  - Difficulty level selection
  - Topic count slider (for simple mode)
  - Advanced options: time estimates, quiz generation
  - Real-time tool usage display
  - Beautiful quiz UI with show/hide answers

## API Documentation

### POST /api/generate

**Endpoint**: `/api/generate`

**Request Parameters**:
```typescript
{
  subject: string;              // Required: The subject to study
  model?: string;               // Optional: AI model to use (default: "googleai/gemini-2.0-flash-exp")
  difficulty?: "beginner" | "intermediate" | "advanced"; // Default: "beginner"
  flowMode?: "simple" | "structured" | "enhanced"; // Default: "structured"
  enhanced?: boolean;           // Enable enhanced mode (uses estimateStudyTime)
  includeTimeEstimates?: boolean; // Include time estimates per topic
  includeQuiz?: boolean;        // Generate quiz questions
  topicCount?: number;          // Topic count for simple mode (3-10, default: 5)
}
```

**Supported Models**:
- `googleai/gemini-2.0-flash-exp` (default)
- `googleai/gemini-2.0-flash-thinking-exp`
- `openai/gpt-4o-mini`

**Example Request**:
```json
{
  "subject": "World History",
  "difficulty": "beginner",
  "model": "googleai/gemini-2.0-flash-exp",
  "flowMode": "enhanced",
  "enhanced": true,
  "includeTimeEstimates": true,
  "includeQuiz": true,
  "topicCount": 5
}
```

**Response Structure**:
All responses include:
- `data`: The study plan (format depends on flow mode)
- `quiz`: Array of quiz questions (if `includeQuiz: true`)
- `meta`: Metadata about the generation
  - `flowMode`: Which flow was used
  - `toolsUsed`: Array of Genkit tools/prompts used

**Response Examples**:

**1. Simple Mode** (`flowMode: "simple"`):
```json
{
  "data": {
    "text": "• Ancient Civilizations - Mesopotamia, Egypt, and early societies\n• Classical Antiquity - Greece and Rome\n• Medieval Period - Feudalism and the Middle Ages\n• Renaissance and Reformation\n• Modern Era - Industrial Revolution to present"
  },
  "quiz": null,
  "meta": {
    "flowMode": "simple",
    "toolsUsed": ["studyTopicsPrompt"]
  }
}
```

**2. Structured Mode** (`flowMode: "structured"`):
```json
{
  "data": {
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
  },
  "quiz": null,
  "meta": {
    "flowMode": "structured",
    "toolsUsed": ["structuredStudyPlanPrompt", "findEducationalLink"]
  }
}
```

**3. Enhanced Mode with Time Estimates & Quiz** (`flowMode: "enhanced"`, `includeTimeEstimates: true`, `includeQuiz: true`):
```json
{
  "data": {
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
  },
  "quiz": [
    {
      "topic": "Ancient Civilizations",
      "questions": [
        {
          "question": "What were the main characteristics of Mesopotamian civilization?",
          "type": "short-answer",
          "answer": "Writing systems (cuneiform), irrigation, city-states, and polytheistic religion",
          "explanation": "Mesopotamia developed key innovations including writing and complex irrigation systems."
        },
        {
          "question": "The Great Pyramid of Giza was built during which Egyptian kingdom?",
          "type": "multiple-choice",
          "answer": "Old Kingdom",
          "options": ["Old Kingdom", "Middle Kingdom", "New Kingdom", "Ptolemaic Period"],
          "explanation": "The Great Pyramid was built during the Old Kingdom (c. 2580-2560 BCE) under Pharaoh Khufu."
        }
      ]
    }
  ],
  "meta": {
    "flowMode": "enhanced",
    "toolsUsed": [
      "structuredStudyPlanPrompt",
      "findEducationalLink",
      "estimateStudyTime",
      "generateQuizQuestions"
    ]
  }
}
```

**Error Responses**:
```json
{ "error": "Missing subject" }       // 400 Bad Request
{ "error": "Internal Server Error" } // 500 Server Error
```

## Genkit Features Demonstrated

This project showcases all major Genkit capabilities in a production-ready application:

### 1. Multi-Provider Support
✅ **Plugin Configuration** (genkit.config.ts):
- `@genkit-ai/google-genai`: Google Gemini models
- `@genkit-ai/compat-oai`: OpenAI models
- Seamless model switching in UI

### 2. Prompts (ai.definePrompt)
✅ **Two reusable prompts with Dev UI integration**:
- **`studyTopicsPromptDef`**: Topic generation prompt
  - Variable interpolation: `{{subject}}`, `{{topicCount}}`
  - Typed Zod schema for inputs
  - Used in simple flow
- **`structuredStudyPlanPromptDef`**: Structured plan creation
  - Variables: `{{subject}}`, `{{difficulty}}`
  - Difficulty-aware guidance
  - Used in structured & enhanced flows

### 3. Tools (ai.defineTool)
✅ **Three production tools with full Zod validation**:
- **`findEducationalLink`**: Educational resource finder
  - Input: topic, preferredPlatform (enum)
  - Output: title, URL, platform
  - Supports YouTube, Khan Academy, Coursera
- **`estimateStudyTime`**: Time estimation calculator
  - Input: topic, difficulty level
  - Output: hours/week, total weeks, description
  - Returns realistic study time estimates
- **`generateQuizQuestions`**: AI-powered quiz generator
  - Input: topic, count (1-10), difficulty
  - Output: array of questions with answers & explanations
  - Supports multiple question types
  - Uses nested AI generation

### 4. Flows (ai.defineFlow)
✅ **Three flows demonstrating progressive complexity**:

**Simple Flow** (`studyPlanGenerator`):
- Clean text output
- Configurable topic count
- Fast generation
- Perfect for brainstorming

**Structured Flow** (`studyPlanGeneratorStructured`):
- JSON output with typed schema
- Tool integration (`findEducationalLink`)
- Difficulty-based content
- Educational resource included

**Enhanced Flow** (`enhancedStudyPlanGenerator`):
- Advanced tool composition
- Multiple tool calls (`findEducationalLink`, `estimateStudyTime`)
- Conditional logic (time estimates on/off)
- Rich metadata output

### 5. UI Features
✅ **Interactive "Francis the StudyMate" interface**:
- **Flow Mode Selection**: Switch between Simple/Structured/Enhanced
- **Model Selection**: Choose from 3 AI models (Google & OpenAI)
- **Difficulty Levels**: Beginner/Intermediate/Advanced
- **Topic Count Slider**: 3-10 topics (simple mode)
- **Advanced Options Panel**:
  - Enhanced mode toggle
  - Time estimates toggle
  - Quiz generation toggle
- **Real-time Tool Display**: Shows which Genkit tools/prompts were used
- **Beautiful Quiz UI**:
  - Purple-themed design
  - Show/hide answers per question
  - Question type badges
  - Explanations included

### 6. Type Safety
✅ **Full TypeScript integration**:
- Zod schemas for all inputs/outputs
- Type inference from flows
- Shared types between client and server
- Runtime validation

## Development Notes

### Architecture
- **API Route**: `src/app/api/generate/route.ts` imports `genkit.config.ts` to register plugins (googleAI, openAI) before calling flows
- **Genkit Instance**: Single shared instance in `src/index.ts` with both providers configured
- **Type Safety**: Shared types exported from `src/index.ts` and used in both API and UI
- **Flow Selection**: Intelligent routing based on `flowMode` parameter

### Styling
- **Tailwind CSS v4**: Configured via `@tailwindcss/postcss` in `postcss.config.mjs`
- **Global Styles**: Custom theme variables in `src/app/globals.css`
- **Dark Mode**: Full dark mode support with CSS variables
- **Custom Classes**: Blue textile background pattern, brand color system

### Code Quality
- **Biome**: Used for linting and formatting (see `biome.json`)
- **TypeScript**: Strict mode enabled with Next.js 15 config
- **Early Returns**: Used throughout for better readability
- **No any types**: All code fully typed with Zod schemas

### Genkit Dev Tools
Run `bun run genkit` (or `npm run genkit`) to launch the Genkit Developer UI:
- Test flows interactively
- View prompt definitions
- Debug tool calls
- Inspect generation traces

## Troubleshooting

### API Key Issues
**Problem**: 401/403 errors or "Invalid API key"
- **For Google models**: Verify `GOOGLE_GENAI_API_KEY` is set in `.env.local`
  - Get your key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- **For OpenAI models**: Verify `OPENAI_API_KEY` is set in `.env.local`
  - Get your key from [OpenAI Platform](https://platform.openai.com/api-keys)
- **Check**: Ensure the selected model is accessible with your API key
- **Note**: You only need the key for the provider you're using

### Generation Failures
**Problem**: `/api/generate` returns 500 error
- **Check server logs**: Look at terminal running `bun dev` for detailed errors
- **Verify request**: Ensure `subject` field is non-empty string
- **Model availability**: Some models may have rate limits or regional restrictions
- **Try different model**: Switch between Gemini and GPT models to isolate issues

### Type Errors
**Problem**: TypeScript errors after updates
```bash
# Clean install and rebuild
rm -rf node_modules bun.lock
bun install
bun run lint
bun run format
```

### Build Issues
**Problem**: `next build` fails
- **Clear cache**: `rm -rf .next`
- **Check Turbopack**: Try without `--turbopack` flag if issues persist
- **Verify imports**: Ensure all imports resolve correctly

### Quiz Generation Issues
**Problem**: Quiz questions not appearing or malformed
- **Check model**: Some models handle structured output better (try Gemini 2.0 Flash)
- **Verify topic**: Ensure topics are specific enough for meaningful questions
- **Logs**: Check browser console and server logs for generation errors

### UI Not Updating
**Problem**: Changes not reflected in browser
- **Hard refresh**: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
- **Clear cache**: Browser dev tools > Network > Disable cache
- **Restart dev server**: Stop and restart `bun dev`

### Genkit Dev UI Issues
**Problem**: `bun run genkit` fails or shows no flows
- **Check config**: Ensure `genkit.config.ts` exports default config
- **Port conflicts**: Default port 4000 might be in use
- **Rebuild**: Stop dev server, clear `.genkit/` folder, restart

## Additional Resources
- [Genkit Documentation](https://firebase.google.com/docs/genkit)
- [Next.js 15 Docs](https://nextjs.org/docs)
- [Tailwind CSS v4](https://tailwindcss.com/blog/tailwindcss-v4)
- [Biome Linter](https://biomejs.dev/)
- [Google AI Studio](https://makersuite.google.com/)
- [OpenAI Platform](https://platform.openai.com/)
