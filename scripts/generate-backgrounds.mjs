import { GoogleGenerativeAI } from "@google/generative-ai";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const API_KEY = "AIzaSyDNQmRXt4HEVLemjmMEKx0wlSZbkycrjYg";
const OUTPUT_DIR = "/home/camst/magic-type-quest/public/assets/backgrounds";
const WIDTH = 1920;
const HEIGHT = 1080;

const genAI = new GoogleGenerativeAI(API_KEY);

// Using gemini-2.5-flash-image-preview which supports image generation
const MODEL = "gemini-2.5-flash-image-preview";

// Each background specification
const backgrounds = [
  {
    filename: "menu.png",
    description: "A magical Pixar-style garden for a children's typing game main menu. Bright and inviting scene with colorful oversized flowers (purple, pink, yellow, blue), friendly butterflies, soft rolling green hills, a cute wooden signpost, fluffy clouds in a bright blue sky, warm golden sunlight rays, cartoon style with soft shading. Child-friendly, whimsical, no text. The scene should feel like a magical Storybook meadow. The lower portion should be slightly less detailed to accommodate menu buttons. 1920x1080 landscape orientation."
  },
  {
    filename: "gameplay.png",
    description: "A magical starry night sky background for a children's typing game. Deep indigo and purple sky with twinkling cartoon stars of various sizes, a friendly smiling crescent moon, floating magical glowing orbs (blue, cyan, gold), soft ethereal clouds, gentle shooting stars. Pixar/Disney animation style, soft gradient lighting, magical atmosphere. The lower portion should have soft purple fog. No text, no characters in the center. 1920x1080 landscape orientation."
  },
  {
    filename: "practice.png",
    description: "A cozy, warm classroom/library background for children's typing practice. Warm golden lighting, wooden desk surface at the bottom, a friendly cartoon-style chalkboard with soft green color, colorful alphabet letters floating gently in the air, bookshelves with colorful children's books in the background, potted plants with cute flowers, a window showing a sunny garden outside. Pixar/Disney style, soft shading, warm and inviting atmosphere, child-friendly. The chalkboard area should be central and clear for game elements. 1920x1080 landscape orientation."
  },
  {
    filename: "level-select.png",
    description: "An enchanted magical forest path for a children's game level selection screen. A winding golden path through a whimsical forest with glowing trees, colorful mushrooms in red, purple and blue, floating fairy lights, magical glowing archways/portals of different colors (bronze, silver, gold, crystal) along the path, soft magical mist, friendly forest creatures peeking out (bunny, squirrel). Pixar/Disney animation style, rich magical colors, child-friendly and enchanting. The path should wind from foreground to background with clear space at mid-ground for level selection cards. 1920x1080 landscape orientation."
  },
  {
    filename: "achievements.png",
    description: "A celebration sky background for a children's game achievement screen. Bright blue sky with fluffy white clouds, a beautiful rainbow arc across the scene, golden trophy pedestals floating on clouds, colorful confetti and sparkles, golden stars, celebratory ribbons in red, blue and gold. Festive balloons in bright colors floating up. Pixar/Disney animation style, joyful and triumphant atmosphere. The lower area should be open for achievement cards display. No text. 1920x1080 landscape orientation."
  }
];

async function generateImage(description) {
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      responseModalities: ["Text", "Image"],
    },
  });

  const result = await model.generateContent({
    contents: [{
      role: "user",
      parts: [{ 
        text: `Generate a high-quality illustration: ${description}`
      }]
    }],
    generationConfig: {
      responseModalities: ["Text", "Image"],
    }
  });

  const response = result.response;
  let imageData = null;

  // Look for image parts in the response
  if (response.candidates && response.candidates[0]) {
    const parts = response.candidates[0].content.parts;
    for (const part of parts) {
      if (part.inlineData && part.inlineData.mimeType && part.inlineData.mimeType.startsWith("image/")) {
        imageData = Buffer.from(part.inlineData.data, "base64");
        break;
      }
    }
  }

  return imageData;
}

async function main() {
  // Ensure output directory exists
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`Created directory: ${OUTPUT_DIR}`);
  }

  for (let i = 0; i < backgrounds.length; i++) {
    const bg = backgrounds[i];
    const filepath = join(OUTPUT_DIR, bg.filename);
    
    console.log(`\n[${i + 1}/${backgrounds.length}] Generating: ${bg.filename}`);
    console.log(`  Prompt: ${bg.description.substring(0, 100)}...`);
    
    try {
      const imageData = await generateImage(bg.description);
      
      if (imageData) {
        writeFileSync(filepath, imageData);
        const sizeKB = (imageData.length / 1024).toFixed(1);
        console.log(`  ✅ Saved: ${bg.filename} (${sizeKB} KB)`);
      } else {
        console.log(`  ⚠️  No image data in response for ${bg.filename}`);
      }
    } catch (error) {
      console.error(`  ❌ Error generating ${bg.filename}:`, error.message);
    }
    
    // Small delay between requests
    if (i < backgrounds.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log("\n🎨 All backgrounds generation complete!");
}

main().catch(console.error);
