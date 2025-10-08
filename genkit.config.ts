import { openAI } from "@genkit-ai/compat-oai/openai";
import { googleAI } from "@genkit-ai/google-genai";

export default {
  plugins: [googleAI(), openAI()],
};
