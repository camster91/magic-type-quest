// Generate badges & achievements using Gemini image generation
import { GoogleGenerativeAI } from "@google/generative-ai";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_DIR = resolve(__dirname, "..", "public", "assets");

const API_KEY = "AIzaSyDNQmRXt4HEVLemjmMEKx0wlSZbkycrjYg";

// Ensure dirs exist
const dirs = ["badges", "achievements"];
dirs.forEach(d => {
  const p = resolve(BASE_DIR, d);
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
});

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
    
    // Also check top-level for text (sometimes the model returns text descriptions)
    const text = result.candidates?.[0]?.content?.parts?.map(p => p.text).filter(Boolean).join("") || "";
    if (text) console.log(`  Text response: ${text.substring(0, 100)}...`);
    console.log(`  ✗ No image data in response for: ${outputPath}`);
  } catch (err) {
    console.error(`  ✗ Error generating ${outputPath}:`, err.message);
  }
}

// ========================================
// BADGES (4) — medal-style, Pixar/Disney
// ========================================

const badgePrompts = {
  bronze: `Create a single game achievement badge icon in Pixar/Disney 3D animation style.
The badge should be a shiny bronze-colored shield/medal shape (copper-brown metallic gradient).
It should have a cute, rounded, puffy 3D look with soft rim lighting and subtle reflections — like something from Toy Story or Inside Out.
The badge should have a star or gem embedded in the center.
Colors: warm bronze, copper, amber, metallic brown.
The background must be TRANSPARENT (no solid backdrop, no white/gray/black background).
Child-friendly, colorful, magical, whimsical vibe.
The badge should be a centered icon suitable for a children's typing game called "BloomType".
Square composition 512x512, clean PNG with transparency.`,

  silver: `Create a single game achievement badge icon in Pixar/Disney 3D animation style.
The badge should be a shiny silver-colored shield/medal shape (cool silver-gray metallic gradient).
It should have a cute, rounded, puffy 3D look with soft rim lighting and subtle reflections — like something from Toy Story or Inside Out.
The badge should have a star or gem embedded in the center.
Colors: bright silver, pearl white, ice blue, metallic gray.
The background must be TRANSPARENT (no solid backdrop, no white/gray/black background).
Child-friendly, colorful, magical, whimsical vibe.
The badge should be a centered icon suitable for a children's typing game called "BloomType".
Square composition 512x512, clean PNG with transparency.`,

  gold: `Create a single game achievement badge icon in Pixar/Disney 3D animation style.
The badge should be a shiny gold-colored shield/medal shape (warm yellow-gold metallic gradient with sparkles).
It should have a cute, rounded, puffy 3D look with soft rim lighting and subtle reflections — like something from Toy Story or Inside Out.
The badge should have a star or gem embedded in the center.
Colors: brilliant gold, sunshine yellow, warm orange highlights, metallic gleam.
The background must be TRANSPARENT (no solid backdrop, no white/gray/black background).
Child-friendly, colorful, magical, whimsical vibe.
The badge should be a centered icon suitable for a children's typing game called "BloomType".
Square composition 512x512, clean PNG with transparency.`,

  platinum: `Create a single game achievement badge icon in Pixar/Disney 3D animation style.
The badge should be a shiny platinum/diamond-colored shield/medal shape (icy blue-white metallic gradient with rainbow sparkles).
It should have a cute, rounded, puffy 3D look with soft rim lighting and subtle reflections — like something from Toy Story or Inside Out.
The badge should have a star or gem embedded in the center.
Colors: platinum white, diamond blue, rainbow prismatic highlights, icy metallic gleam.
The background must be TRANSPARENT (no solid backdrop, no white/gray/black background).
Child-friendly, colorful, magical, whimsical vibe.
The badge should be a centered icon suitable for a children's typing game called "BloomType".
Square composition 512x512, clear PNG with transparency.`,
};

// =============================================
// ACHIEVEMENTS (5) — colorful icons
// =============================================

const achievementPrompts = {
  combo: `Create a single achievement icon in Pixar/Disney 3D animation style.
The icon should represent a "combo streak" — a chain of 3 linked colorful rings/links (like a chain combo) with sparkles around them.
Colors: bright pink, orange, and purple rings, golden sparkles.
Cute, rounded, puffy 3D look with soft lighting — like something from Toy Story or Inside Out.
The background must be TRANSPARENT (no solid backdrop, no white/gray/black background).
Child-friendly, colorful, magical, whimsical vibe.
The icon should be suitable for a children's typing game called "BloomType".
Square composition 512x512, clean PNG with transparency.`,

  perfect: `Create a single achievement icon in Pixar/Disney 3D animation style.
The icon should represent "perfect accuracy" — a large glowing golden star with a 100% symbol or checkmark in the center, surrounded by smaller sparkle stars.
Colors: brilliant gold, warm yellow, soft orange glow, white sparkles.
Cute, rounded, puffy 3D look with soft lighting — like something from Toy Story or Inside Out.
The background must be TRANSPARENT (no solid backdrop, no white/gray/black background).
Child-friendly, colorful, magical, whimsical vibe.
The icon should be suitable for a children's typing game called "BloomType".
Square composition 512x512, clean PNG with transparency.`,

  "speed-10": `Create a single achievement icon in Pixar/Disney 3D animation style.
The icon should represent typing speed of "10 WPM" — a cute little rocket ship or speedometer with the number 10 on it, with motion lines behind it.
Colors: bright red rocket/speedometer, yellow flame/exhaust, blue motion lines.
Cute, rounded, puffy 3D look with soft lighting — like something from Toy Story or Inside Out.
The background must be TRANSPARENT (no solid backdrop, no white/gray/black background).
Child-friendly, colorful, magical, whimsical vibe.
The icon should be suitable for a children's typing game called "BloomType".
Square composition 512x512, clean PNG with transparency.`,

  "speed-30": `Create a single achievement icon in Pixar/Disney 3D animation style.
The icon should represent typing speed of "30 WPM" — a cute rocket ship or speedometer with the number 30 on it, with stronger motion lines and a small flame.
Colors: bright orange rocket/speedometer, golden flame, purple motion lines.
Cute, rounded, puffy 3D look with soft lighting — like something from Toy Story or Inside Out.
The background must be TRANSPARENT (no solid backdrop, no white/gray/black background).
Child-friendly, colorful, magical, whimsical vibe.
The icon should be suitable for a children's typing game called "BloomType".
Square composition 512x512, clean PNG with transparency.`,

  "speed-50": `Create a single achievement icon in Pixar/Disney 3D animation style.
The icon should represent typing speed of "50 WPM" — a cute rocket ship or speedometer with the number 50 on it, with dramatic motion lines, flames, and sparkle trails.
Colors: bright magenta/purple rocket, rainbow flames, golden sparkle trails.
Cute, rounded, puffy 3D look with soft lighting — like something from Toy Story or Inside Out.
The background must be TRANSPARENT (no solid backdrop, no white/gray/black background).
Child-friendly, colorful, magical, whimsical vibe.
The icon should be suitable for a children's typing game called "BloomType".
Square composition 512x512, clean PNG with transparency.`,
};

async function main() {
  console.log("=== Generating 4 Badges ===\n");
  for (const [name, prompt] of Object.entries(badgePrompts)) {
    const outputPath = resolve(BASE_DIR, "badges", `${name}.png`);
    await generateImage(prompt, outputPath);
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log("\n=== Generating 5 Achievements ===\n");
  for (const [name, prompt] of Object.entries(achievementPrompts)) {
    const outputPath = resolve(BASE_DIR, "achievements", `${name}.png`);
    await generateImage(prompt, outputPath);
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log("\n=== Done! ===");
}

main().catch(console.error);
