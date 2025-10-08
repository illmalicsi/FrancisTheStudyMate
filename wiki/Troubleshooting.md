# Troubleshooting

Common issues and their solutions for the SysDev Genkit Workshop.

## Table of Contents

- [Setup Issues](#setup-issues)
- [API Key Problems](#api-key-problems)
- [Generation Errors](#generation-errors)
- [Build and Development Issues](#build-and-development-issues)
- [Genkit Dev UI Issues](#genkit-dev-ui-issues)
- [Performance Problems](#performance-problems)
- [Type Errors](#type-errors)

---

## Setup Issues

### Problem: "Module not found" errors after installation

**Symptoms:**
```
Error: Cannot find module '@genkit-ai/google-genai'
```

**Solutions:**

1. **Clear and reinstall dependencies:**
   ```bash
   rm -rf node_modules bun.lock
   bun install
   ```

2. **Check package.json:**
   ```bash
   # Verify all dependencies are listed
   cat package.json
   ```

3. **Use exact package manager:**
   ```bash
   # If project uses bun, use bun
   bun install
   
   # Not npm install
   ```

4. **Clear Next.js cache:**
   ```bash
   rm -rf .next
   bun dev
   ```

### Problem: Port 3000 already in use

**Symptoms:**
```
Error: Port 3000 is already in use
```

**Solutions:**

1. **Kill the process using port 3000:**
   ```bash
   # Find the process
   lsof -ti:3000
   
   # Kill it
   lsof -ti:3000 | xargs kill -9
   ```

2. **Or run on a different port:**
   ```bash
   PORT=3001 bun dev
   ```

3. **Check for zombie processes:**
   ```bash
   # Linux/Mac
   ps aux | grep next
   kill -9 <PID>
   ```

### Problem: "Command not found: bun"

**Symptoms:**
```
bash: bun: command not found
```

**Solutions:**

1. **Install Bun:**
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

2. **Or use npm instead:**
   ```bash
   npm install
   npm run dev
   ```

3. **Add to PATH (if installed but not found):**
   ```bash
   # Add to ~/.bashrc or ~/.zshrc
   export PATH="$HOME/.bun/bin:$PATH"
   source ~/.bashrc  # or source ~/.zshrc
   ```

---

## API Key Problems

### Problem: "Invalid API key" or 401 errors

**Symptoms:**
```
Error: Invalid API key provided
Status: 401 Unauthorized
```

**Solutions:**

1. **Verify .env.local exists:**
   ```bash
   ls -la .env.local
   ```

2. **Check for typos in key name:**
   ```bash
   # Correct (no quotes)
   GOOGLE_GENAI_API_KEY=your_key_here
   
   # Wrong
   GOOGLE_GENAI_API_KEY="your_key_here"  # Remove quotes
   GOOGLE_GENAI_KEY=your_key_here        # Wrong variable name
   ```

3. **Restart dev server after adding keys:**
   ```bash
   # Stop server (Ctrl+C)
   bun dev  # Start again
   ```

4. **Verify key is valid:**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Check if key is enabled and not expired

5. **Check file permissions:**
   ```bash
   chmod 600 .env.local
   ```

6. **Ensure .env.local is not in .gitignore (check it exists):**
   ```bash
   cat .env.local  # Should show your keys
   ```

### Problem: "API quota exceeded" or 429 errors

**Symptoms:**
```
Error: Resource has been exhausted
Status: 429 Too Many Requests
```

**Solutions:**

1. **Check quota limits:**
   - Google AI: 15 requests/minute (free tier)
   - OpenAI: Varies by tier

2. **Implement rate limiting:**
   ```typescript
   // Add delay between requests
   await new Promise(resolve => setTimeout(resolve, 5000));
   ```

3. **Switch to different model:**
   - Try `openai/gpt-4o-mini` if Gemini quota exceeded
   - Or vice versa

4. **Upgrade API tier:**
   - Consider paid tier for higher limits

### Problem: Different API key for each model

**Symptoms:**
```
Works with Gemini, fails with OpenAI
```

**Solutions:**

1. **Add both keys to .env.local:**
   ```bash
   GOOGLE_GENAI_API_KEY=your_google_key
   OPENAI_API_KEY=your_openai_key
   ```

2. **Verify provider is configured:**
   ```typescript
   // genkit.config.ts should have both
   export default {
     plugins: [googleAI(), openAI()],
   };
   ```

---

## Generation Errors

### Problem: "Generation failed" or empty responses

**Symptoms:**
- API returns 500 error
- Empty study plan
- No topics generated

**Solutions:**

1. **Check server logs:**
   ```bash
   # Look at terminal running dev server
   # Errors will show detailed messages
   ```

2. **Verify subject is not empty:**
   ```typescript
   if (!subject.trim()) {
     return { error: "Subject required" };
   }
   ```

3. **Try different model:**
   ```json
   {
     "subject": "Python",
     "model": "googleai/gemini-2.0-flash-exp"
   }
   ```

4. **Check model availability:**
   - Some models may be region-restricted
   - Verify model name is correct

5. **Simplify request:**
   ```json
   // Minimal request to test
   {
     "subject": "Math",
     "flowMode": "simple"
   }
   ```

### Problem: Malformed JSON responses

**Symptoms:**
```
SyntaxError: Unexpected token in JSON
```

**Solutions:**

1. **Use `try-catch` for JSON parsing:**
   ```typescript
   try {
     const data = await response.json();
   } catch (error) {
     console.error('Invalid JSON:', await response.text());
   }
   ```

2. **Check content-type header:**
   ```typescript
   headers: {
     'Content-Type': 'application/json',
   }
   ```

3. **Validate request body:**
   ```typescript
   console.log('Sending:', JSON.stringify(requestBody, null, 2));
   ```

### Problem: Quiz questions not generated

**Symptoms:**
- Quiz is null or empty
- Only some topics have quiz questions

**Solutions:**

1. **Ensure includeQuiz is true:**
   ```json
   {
     "subject": "Python",
     "includeQuiz": true,
     "flowMode": "structured"  // or "enhanced"
   }
   ```

2. **Note: Quiz only works with structured/enhanced modes:**
   ```typescript
   // Quiz not available in simple mode
   if (flowMode === "simple") {
     // No quiz support
   }
   ```

3. **Check for rate limiting:**
   - Quiz generation makes additional AI calls
   - May hit rate limits faster

4. **Try different model:**
   - Gemini 2.0 Flash handles structured output better
   - GPT-4o Mini may give different results

---

## Build and Development Issues

### Problem: Build fails with TypeScript errors

**Symptoms:**
```
Type error: Property 'topics' does not exist on type 'StudyPlan'
```

**Solutions:**

1. **Run type check:**
   ```bash
   bun run lint
   ```

2. **Check import paths:**
   ```typescript
   // Correct
   import { StudyPlan } from '@/index';
   
   // Wrong
   import { StudyPlan } from './index';  // May fail in build
   ```

3. **Clear TypeScript cache:**
   ```bash
   rm -rf .next
   rm -rf node_modules/.cache
   bun install
   ```

4. **Verify tsconfig.json paths:**
   ```json
   {
     "compilerOptions": {
       "paths": {
         "@/*": ["./src/*"]
       }
     }
   }
   ```

### Problem: Tailwind styles not loading

**Symptoms:**
- No styling on page
- Classes not applied

**Solutions:**

1. **Clear cache and rebuild:**
   ```bash
   rm -rf .next
   bun dev
   ```

2. **Check PostCSS config exists:**
   ```bash
   ls postcss.config.mjs
   ```

3. **Verify globals.css is imported:**
   ```typescript
   // app/layout.tsx should have:
   import './globals.css';
   ```

4. **Check Tailwind v4 setup:**
   ```css
   /* globals.css should have */
   @import "tailwindcss";
   ```

### Problem: "Hydration failed" errors

**Symptoms:**
```
Error: Hydration failed because the initial UI does not match
```

**Solutions:**

1. **Check for client-only code:**
   ```typescript
   // Ensure 'use client' is at top of file
   'use client';
   import { useState } from 'react';
   ```

2. **Avoid using window/document during render:**
   ```typescript
   // Wrong
   const userAgent = window.navigator.userAgent;
   
   // Right
   useEffect(() => {
     const userAgent = window.navigator.userAgent;
   }, []);
   ```

3. **Clear browser cache:**
   - Hard refresh: Ctrl+Shift+R (Cmd+Shift+R on Mac)

---

## Genkit Dev UI Issues

### Problem: Genkit Dev UI not starting

**Symptoms:**
```
Command not found: genkit
```

**Solutions:**

1. **Verify Genkit is installed:**
   ```bash
   bun list | grep genkit
   ```

2. **Run using package.json script:**
   ```bash
   bun run genkit
   ```

3. **Install Genkit globally (optional):**
   ```bash
   npm install -g genkit
   ```

### Problem: No flows showing in Dev UI

**Symptoms:**
- Flows list is empty
- Can't find defined flows

**Solutions:**

1. **Check genkit.config.ts exports:**
   ```typescript
   // Must have default export
   export default {
     plugins: [googleAI(), openAI()],
   };
   ```

2. **Verify flows are exported:**
   ```typescript
   // src/index.ts
   export const studyPlanGenerator = ai.defineFlow(/* ... */);
   ```

3. **Restart Genkit UI:**
   ```bash
   # Stop (Ctrl+C)
   rm -rf .genkit/
   bun run genkit
   ```

4. **Check for build errors:**
   ```bash
   bun run lint
   ```

### Problem: Port 4000 already in use

**Symptoms:**
```
Error: Port 4000 is already in use
```

**Solutions:**

1. **Kill process on port 4000:**
   ```bash
   lsof -ti:4000 | xargs kill -9
   ```

2. **Start Genkit on different port:**
   ```bash
   PORT=4001 bun run genkit
   ```

---

## Performance Problems

### Problem: Slow generation times

**Symptoms:**
- Takes >30 seconds to generate
- Timeouts

**Solutions:**

1. **Use faster model:**
   ```json
   {
     "model": "googleai/gemini-2.0-flash-exp"  // Fastest
   }
   ```

2. **Reduce complexity:**
   ```json
   {
     "flowMode": "simple",  // Faster than enhanced
     "topicCount": 3        // Fewer topics
   }
   ```

3. **Disable optional features:**
   ```json
   {
     "includeTimeEstimates": false,
     "includeQuiz": false
   }
   ```

4. **Check network connection:**
   - API calls require internet
   - VPN may slow down requests

5. **Implement timeout:**
   ```typescript
   const controller = new AbortController();
   setTimeout(() => controller.abort(), 30000);
   
   fetch('/api/generate', { signal: controller.signal });
   ```

### Problem: High memory usage

**Symptoms:**
- Dev server crashes
- System becomes slow

**Solutions:**

1. **Limit concurrent requests:**
   - Don't spam the generate button
   - Wait for previous request to complete

2. **Restart dev server:**
   ```bash
   # Stop (Ctrl+C)
   bun dev
   ```

3. **Clear Next.js cache:**
   ```bash
   rm -rf .next
   ```

4. **Check for memory leaks:**
   ```bash
   # Monitor memory
   top | grep node
   ```

---

## Type Errors

### Problem: "Type 'any' is not assignable"

**Symptoms:**
```typescript
Type 'any' is not assignable to type 'StudyPlan'
```

**Solutions:**

1. **Add proper type assertion:**
   ```typescript
   const plan = result.output as StudyPlan;
   ```

2. **Validate with Zod:**
   ```typescript
   const validated = StudyPlanSchema.parse(result.output);
   ```

3. **Check schema matches type:**
   ```typescript
   // Schema should match StudyPlan type exactly
   const schema = z.object({
     subject: z.string(),
     topics: z.array(z.string()),
     // ...
   });
   ```

### Problem: "Cannot find module '@/index'"

**Symptoms:**
```
Error: Cannot find module '@/index'
```

**Solutions:**

1. **Check tsconfig.json paths:**
   ```json
   {
     "compilerOptions": {
       "baseUrl": ".",
       "paths": {
         "@/*": ["./src/*"]
       }
     }
   }
   ```

2. **Use relative import:**
   ```typescript
   // If @ alias doesn't work
   import { StudyPlan } from '../../../index';
   ```

3. **Verify file exists:**
   ```bash
   ls src/index.ts
   ```

---

## Getting More Help

### Check Logs

**Server Logs:**
```bash
# Terminal running `bun dev`
# Shows detailed error messages
```

**Browser Console:**
```javascript
// Open DevTools (F12)
// Check Console tab for errors
console.error('Error:', error);
```

**Network Tab:**
```
# DevTools → Network
# Check failed requests
# Inspect request/response
```

### Debug Steps

1. **Simplify the problem:**
   - Remove optional parameters
   - Use simple mode
   - Test with minimal input

2. **Check each component:**
   - Test API directly with curl
   - Test flow in Genkit Dev UI
   - Test UI separately

3. **Compare with working code:**
   - Check git diff
   - Revert recent changes
   - Use example from docs

### Report Issues

When asking for help, include:

1. **Error message** (full text)
2. **What you tried** (code snippets)
3. **Environment** (OS, Node version, package manager)
4. **Steps to reproduce**
5. **Expected vs actual behavior**

**Template:**
```markdown
**Problem:** Brief description

**Error:**
```
Full error message
```

**Code:**
```typescript
// Relevant code
```

**Environment:**
- OS: macOS 13.0
- Node: 20.10.0
- Package Manager: Bun 1.0.0

**Steps to Reproduce:**
1. Run `bun dev`
2. Navigate to http://localhost:3000
3. Enter subject and click generate
4. Error occurs

**Expected:** Should generate study plan
**Actual:** Returns 500 error
```

---

**Still stuck?** Check the [FAQ](FAQ) page or review the [Getting Started](Getting-Started) guide →

