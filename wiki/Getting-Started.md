# Getting Started

This guide will walk you through setting up the SysDev Genkit Workshop on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 20+** or **Bun** (recommended for faster builds)
- **Git** for version control
- **VS Code** or your preferred code editor
- **Terminal** access (bash, zsh, fish, etc.)

### Recommended VS Code Extensions

- Biome (biomejs.biome)
- Tailwind CSS IntelliSense
- TypeScript and JavaScript Language Features

## Step 1: Clone the Repository

```bash
# Clone the repository
git clone <your-repository-url>
cd sysdev-genkit-workshop

# Or if you're forking
git clone https://github.com/<your-username>/sysdev-genkit-workshop.git
cd sysdev-genkit-workshop
```

## Step 2: Install Dependencies

Choose your preferred package manager:

### Using Bun (Recommended - Fast!)

```bash
bun install
```

### Using npm

```bash
npm install
```

### Using yarn

```bash
yarn install
```

### Using pnpm

```bash
pnpm install
```

## Step 3: Configure Environment Variables

### Get Your API Keys

You'll need API keys from at least one provider:

#### Option 1: Google AI (Recommended for beginners)

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy your API key

#### Option 2: OpenAI

1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create an account or sign in
3. Click "Create new secret key"
4. Copy your API key

### Create `.env.local` File

Create a `.env.local` file in the project root:

```bash
# Copy the example file
cp .env.example .env.local

# Or create it manually
touch .env.local
```

Add your API key(s) to `.env.local`:

```bash
# For Google Gemini models (required if using Google models)
GOOGLE_GENAI_API_KEY=your_google_api_key_here

# For OpenAI models (required if using OpenAI models)
OPENAI_API_KEY=your_openai_api_key_here
```

**Note:** You only need the key for the AI provider you plan to use. Both can be added for full functionality.

## Step 4: Run the Development Server

Start the Next.js development server:

```bash
# Using Bun
bun dev

# Using npm
npm run dev

# Using yarn
yarn dev

# Using pnpm
pnpm dev
```

You should see:

```
▲ Next.js 15.5.4
- Local:        http://localhost:3000
- Ready in 1.2s
```

## Step 5: Open the Application

Open your browser and navigate to:

```
http://localhost:3000
```

You should see **Francis the StudyMate** interface!

## Step 6: Test the Application

Let's verify everything is working:

1. **Enter a subject**: Type "World History" in the subject input
2. **Select a model**: Choose "Gemini 2.0 Flash" (default)
3. **Choose difficulty**: Select "Beginner"
4. **Click "Generate Study Plan"**

If everything is set up correctly, you should see:
- A list of study topics
- An educational resource link
- A "Genkit Tools & Prompts Used" badge

🎉 **Success!** Your development environment is ready.

## Step 7: Explore the Genkit Dev UI (Optional)

Genkit provides a powerful developer UI for testing flows:

```bash
# Using Bun
bun run genkit

# Using npm
npm run genkit
```

This will open the Genkit Developer UI at `http://localhost:4000` where you can:
- Test flows interactively
- View prompt definitions
- Debug tool calls
- Inspect generation traces

## Project Structure Overview

```
sysdev-genkit-workshop/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── generate/
│   │   │       └── route.ts       # API endpoint
│   │   ├── globals.css            # Tailwind styles
│   │   ├── layout.tsx             # Root layout
│   │   └── page.tsx               # Main UI
│   └── index.ts                   # Genkit flows & tools
├── genkit.config.ts               # Genkit configuration
├── package.json                   # Dependencies
├── .env.local                     # Your API keys (create this)
└── README.md                      # Project documentation
```

## Verify Your Setup

Run these commands to ensure everything is properly configured:

```bash
# Check for TypeScript errors
bun run lint  # or npm run lint

# Format code
bun run format  # or npm run format

# Build the project
bun run build  # or npm run build
```

All commands should complete without errors.

## Common Setup Issues

### Issue: "Module not found" errors

**Solution:**
```bash
# Delete node_modules and lockfile
rm -rf node_modules bun.lock  # or package-lock.json
# Reinstall
bun install  # or npm install
```

### Issue: "Invalid API key" or 401 errors

**Solution:**
- Verify your API key is correctly copied to `.env.local`
- Ensure no extra spaces or quotes around the key
- Check that the file is named `.env.local` (not `.env.local.txt`)
- Restart the dev server after adding the key

### Issue: Port 3000 already in use

**Solution:**
```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or run on a different port
PORT=3001 bun dev
```

### Issue: Tailwind styles not loading

**Solution:**
```bash
# Clear the Next.js cache
rm -rf .next
# Restart dev server
bun dev
```

## Next Steps

Now that your environment is set up:

1. **Understand the basics**: Read [Genkit Concepts](Genkit-Concepts) to learn core concepts
2. **Explore flows**: Check out [Flows Guide](Flows-Guide) to understand the three flow types
3. **Try exercises**: Work through [Workshop Exercises](Workshop-Exercises) for hands-on practice

## Development Workflow

### Starting a coding session

```bash
# 1. Pull latest changes (if in a team)
git pull origin main

# 2. Start dev server
bun dev

# 3. Open Genkit Dev UI (optional)
bun run genkit
```

### Ending a coding session

```bash
# 1. Format your code
bun run format

# 2. Check for errors
bun run lint

# 3. Commit your changes
git add .
git commit -m "Your descriptive message"
git push
```

## Useful Commands Reference

```bash
# Development
bun dev                # Start dev server
bun run genkit         # Open Genkit Dev UI

# Code Quality
bun run lint           # Check for errors
bun run format         # Format code

# Build & Deploy
bun run build          # Build for production
bun start              # Start production server

# Maintenance
rm -rf .next           # Clear build cache
rm -rf node_modules    # Remove dependencies
bun install            # Reinstall dependencies
```

---

**Ready to learn?** Continue to [Genkit Concepts](Genkit-Concepts) →

