import { GoogleGenerativeAI } from "@google/generative-ai";
import { getGoogleApiKey } from "./google-api-key.mjs";

const genAI = new GoogleGenerativeAI(getGoogleApiKey());

async function listModels() {
  try {
    // List models that support generateContent
    const result = await genAI.listModels();
    console.log("All available models:");
    for (const model of result.models) {
      const methods = model.supportedGenerationMethods || [];
      if (methods.includes("generateContent")) {
        console.log(`  ${model.name} - ${model.displayName || ''}`);
        console.log(`    Methods: ${methods.join(', ')}`);
        if (model.description) {
          console.log(`    Desc: ${model.description.substring(0, 120)}`);
        }
      }
    }
  } catch (e) {
    console.error("Error:", e.message);
    
    // Try with curl as fallback
    console.log("\nTrying curl...");
  }
}

listModels();
