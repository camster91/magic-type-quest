// Generate UI elements using Gemini image generation
import { GoogleGenerativeAI } from "@google/generative-ai";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_DIR = resolve(__dirname, "..", "public", "assets", "ui_new");

const API_KEY = process.env.GEMINI_API_KEY;

// Ensure dir exists
if (!existsSync(BASE_DIR)) mkdirSync(BASE_DIR, { recursive: true });

const genAI = new GoogleGenerativeAI(API_KEY);

// Use gemini-2.5-flash-image for native image generation
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-image",
  generationConfig: {
    temperature: 0.9,
    topP: 1,
    topK: 40,
    responseModalities: ["image", "text"],
  },
});

async function generateImage(prompt, outputPath) {
  console.log(`Generating: ${outputPath} ...`);
  try {
    const response = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{ text: prompt }]
      }]
    });
    
    const result = response.response;
    
    // Look for inline image data in the response
    for (const part of result.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const buffer = Buffer.from(part.inlineData.data, "base64");
        writeFileSync(outputPath, buffer);
        console.log(`  ✓ Saved: ${outputPath} (${buffer.length} bytes)`);
        return;
      }
    }
    
    // Also check for text
    const text = result.candidates?.[0]?.content?.parts?.map(p => p.text).filter(Boolean).join("") || "";
    if (text) console.log(`  Text response: ${text.substring(0, 100)}...`);
    console.log(`  ✗ No image data in response for: ${outputPath}`);
  } catch (err) {
    console.error(`  ✗ Error generating ${outputPath}:`, err.message);
  }
}

// ===============================================
// UI ELEMENTS (10) — Pixar/Disney game UI icons
// ===============================================

const uiPrompts = {
  "accuracy-meter": `Create a game UI element icon in Pixar/Disney 3D animation style.
A cute, colorful circular gauge/meter showing a target or bullseye with a glowing needle pointing to a green zone. Like a friendly accuracy-o-meter.
Colors: bright green for "good" zone, soft purple body, golden needle, white glow.
Cute, rounded, puffy 3D look with soft rim lighting — like something from Toy Story or Inside Out.
The background must be TRANSPARENT (no solid backdrop, no white/gray/black background).
Child-friendly, colorful, magical, whimsical vibe.
Suitable for a children's typing game called "BloomType".
Square composition 512x512, clean PNG with transparency.`,

  "badge-gold": `Create a game UI element icon in Pixar/Disney 3D animation style.
A shiny golden star-shaped badge/medal with a ribbon, like a reward icon. It should be gleaming with sparkles.
Colors: brilliant gold, warm yellow, white sparkles, rich blue or red ribbon.
Cute, rounded, puffy 3D look with soft rim lighting — like something from Toy Story or Inside Out.
The background must be TRANSPARENT (no solid backdrop, no white/gray/black background).
Child-friendly, colorful, magical, whimsical vibe.
Suitable for a children's typing game called "BloomType".
Square composition 512x512, clean PNG with transparency.`,

  "celebration-banner": `Create a game UI element icon in Pixar/Disney 3D animation style.
A festive celebration banner/ribbon stretched out horizontally, with colorful triangles/streamers hanging below. Like a "Congratulations!" banner shape (no text, just the banner itself).
Colors: festive purple, teal, pink, golden yellow, with confetti dots around it.
Cute, rounded, puffy 3D look with soft rim lighting — like something from Toy Story or Inside Out.
The background must be TRANSPARENT (no solid backdrop, no white/gray/black background).
Child-friendly, colorful, magical, whimsical vibe.
Suitable for a children's typing game called "BloomType".
Square composition 512x512, clean PNG with transparency.`,

  "completed": `Create a game UI element icon in Pixar/Disney 3D animation style.
A big, friendly green checkmark inside a rounded circle, with sparkles and a soft glow around it. Like a "level complete" icon.
Colors: bright cheerful green checkmark, soft mint/teal circle, golden sparkles, white glow.
Cute, rounded, puffy 3D look with soft rim lighting — like something from Toy Story or Inside Out.
The background must be TRANSPARENT (no solid backdrop, no white/gray/black background).
Child-friendly, colorful, magical, whimsical vibe.
Suitable for a children's typing game called "BloomType".
Square composition 512x512, clean PNG with transparency.`,

  "encouragement-bubble": `Create a game UI element icon in Pixar/Disney 3D animation style.
A cute speech bubble shape with a soft gradient, like a friendly encouragement popup. It should look puffy and soft like a cloud.
Colors: soft lavender/purple gradient, white border/highlight, tiny heart or star accent in the corner.
Cute, rounded, puffy 3D look with soft rim lighting — like something from Toy Story or Inside Out.
The background must be TRANSPARENT (no solid backdrop, no white/gray/black background).
Child-friendly, colorful, magical, whimsical vibe.
Suitable for a children's typing game called "BloomType".
Square composition 512x512, clean PNG with transparency.`,

  "locked": `Create a game UI element icon in Pixar/Disney 3D animation style.
A cute, chunky padlock icon — friendly and not scary, slightly tilted. It should clearly show it's locked but in a playful, non-intimidating way.
Colors: soft silver/gray body, golden/amber keyhole and shackle, subtle purple glow around the lock.
Cute, rounded, puffy 3D look with soft rim lighting — like something from Toy Story or Inside Out.
The background must be TRANSPARENT (no solid backdrop, no white/gray/black background).
Child-friendly, colorful, magical, whimsical vibe.
Suitable for a children's typing game called "BloomType".
Square composition 512x512, clean PNG with transparency.`,

  "pause": `Create a game UI element icon in Pixar/Disney 3D animation style.
A cute pause button — two friendly vertical rounded bars inside a soft colorful circle. Like a play/pause button for a game.
Colors: cheerful orange/coral circle, white bars, soft yellow glow around the edge.
Cute, rounded, puffy 3D look with soft rim lighting — like something from Toy Story or Inside Out.
The background must be TRANSPARENT (no solid backdrop, no white/gray/black background).
Child-friendly, colorful, magical, whimsical vibe.
Suitable for a children's typing game called "BloomType".
Square composition 512x512, clean PNG with transparency.`,

  "progress-bar": `Create a game UI element icon in Pixar/Disney 3D animation style.
A colorful horizontal progress bar, partially filled (about 60%), with a cute star marker at the current position. The bar should look like a candy or rainbow tube with rounded ends.
Colors: rainbow gradient fill (red to green), soft pastel blue unfilled portion, golden star marker, soft shadow underneath.
Cute, rounded, puffy 3D look with soft rim lighting — like something from Toy Story or Inside Out.
The background must be TRANSPARENT (no solid backdrop, no white/gray/black background).
Child-friendly, colorful, magical, whimsical vibe.
Suitable for a children's typing game called "BloomType".
Square composition 512x512, clean PNG with transparency.`,

  "speedometer": `Create a game UI element icon in Pixar/Disney 3D animation style.
A cute, colorful speedometer gauge — semi-circular with zones from green (slow) to red (fast), a friendly needle pointing toward the green zone, with a tiny flame or rocket accent.
Colors: green, yellow, orange, red zones, glossy white body, bright red needle, tiny flame accent.
Cute, rounded, puffy 3D look with soft rim lighting — like something from Toy Story or Inside Out.
The background must be TRANSPARENT (no solid backdrop, no white/gray/black background).
Child-friendly, colorful, magical, whimsical vibe.
Suitable for a children's typing game called "BloomType".
Square composition 512x512, clean PNG with transparency.`,

  "streak": `Create a game UI element icon in Pixar/Disney 3D animation style.
A fire/flame streak icon representing a "hot streak" or combo — multiple flame tongues stacked upward, with sparkles. Like a cute, magical fire.
Colors: warm gradient from red at bottom to orange to yellow at top, golden sparkles, soft glow.
Cute, rounded, puffy 3D look with soft rim lighting — like something from Toy Story or Inside Out.
The background must be TRANSPARENT (no solid backdrop, no white/gray/black background).
Child-friendly, colorful, magical, whimsical vibe.
Suitable for a children's typing game called "BloomType".
Square composition 512x512, clean PNG with transparency.`,
};

async function main() {
  console.log("=== Generating 10 UI Elements ===\n");
  
  let i = 0;
  for (const [name, prompt] of Object.entries(uiPrompts)) {
    i++;
    console.log(`\n[${i}/10] ${name}.png`);
    const outputPath = resolve(BASE_DIR, `${name}.png`);
    await generateImage(prompt, outputPath);
    // Delay to avoid rate limiting
    if (i < 10) {
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  console.log("\n=== Done! All 10 UI elements generated ===");
}

main().catch(console.error);
