import { GoogleGenerativeAI } from "@google/generative-ai";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const API_KEY = "AIzaSyDNQmRXt4HEVLemjmMEKx0wlSZbkycrjYg";
const GUIDES_DIR = "/home/camst/magic-type-quest/public/assets/guides";
const PARTICLES_DIR = "/home/camst/magic-type-quest/public/assets/particles";

const genAI = new GoogleGenerativeAI(API_KEY);
const MODEL = "gemini-2.5-flash-image";

// ============================
// GUIDES (illustrations showing hand positions / keyboard zones)
// ============================
const guides = [
  {
    filename: "left-hand.png",
    description: `A children's typing guide showing the LEFT HAND position on a colorful keyboard.
Pixar/Disney cartoon style, bright and child-friendly.
Show a cute cartoon left hand (with 5 fingers) hovering over a colorful keyboard.
The left hand fingers should rest on A, S, D, F keys which are highlighted in bright GREEN.
The thumb rests on the spacebar (highlighted in light green).
The hand should look like a friendly cartoon character hand (soft, rounded, no realistic details).
Background should be transparent (alpha channel).
The keyboard keys should be large, rounded, colorful like candy buttons.
Only show the left side of the keyboard (keys: QWERTY ASDFG ZXCVB area).
Size: 512x512 with the hand+keyboard centered. Clean edges for transparency.`,
  },
  {
    filename: "right-hand.png",
    description: `A children's typing guide showing the RIGHT HAND position on a colorful keyboard.
Pixar/Disney cartoon style, bright and child-friendly.
Show a cute cartoon right hand (with 5 fingers) hovering over a colorful keyboard.
The right hand fingers should rest on J, K, L, ; keys which are highlighted in bright BLUE.
The thumb rests on the spacebar (highlighted in light blue).
The hand should look like a friendly cartoon character hand (soft, rounded, no realistic details).
Background should be transparent (alpha channel).
The keyboard keys should be large, rounded, colorful like candy buttons.
Only show the right side of the keyboard (keys: YUIOP HJKL; NM area).
Size: 512x512 with the hand+keyboard centered. Clean edges for transparency.`,
  },
  {
    filename: "keyboard-zones.png",
    description: `A children's typing guide showing keyboard ZONES with color coding.
Pixar/Disney cartoon style, super colorful and fun for kids.
Show a full colorful cartoon keyboard with each key zone in different bright colors:
- HOME ROW keys (ASDFGHJKL;) highlighted in bright GREEN zone
- TOP ROW keys (QWERTYUIOP) highlighted in bright ORANGE zone  
- BOTTOM ROW keys (ZXCVBNM) highlighted in bright PURPLE zone
- NUMBER ROW highlighted in bright YELLOW
- Spacebar in bright CYAN

Each zone should have a soft colorful glow/aura around it.
The keyboard keys are large, rounded, colorful like candy/gumball buttons.
Background should be transparent (alpha channel).
Add a cute title banner at the top saying "Keyboard Zones" in fun kid-friendly letters.
Size: 768x512. Clean edges for transparency.`,
  },
];

// ============================
// PARTICLES (small decorative elements for game effects)
// These MUST have transparent backgrounds for overlaying on game scenes
// ============================
const particles = [
  {
    filename: "heart.png",
    description: `A cute floating HEART particle for a children's typing game.
Pixar/Disney cartoon style, soft and puffy.
A single adorable 3D cartoon heart in bright cherry RED with a soft pink highlight/glow.
The heart should look squishy and soft like a plush toy, with rounded edges and a slight bounce feel.
Add tiny sparkle highlights on the top edge.
Background MUST be completely transparent (alpha channel).
Size: 128x128. The heart should fill about 80% of the canvas. Clean edges.`,
  },
  {
    filename: "gem.png",
    description: `A sparkling MAGICAL GEM crystal particle for a children's typing game.
Pixar/Disney cartoon style, faceted and shiny but soft.
A single beautiful gemstone crystal in CYAN/TURQUOISE with light blue facets.
The gem should have 6-8 visible facets with bright highlights catching the light.
Surround with tiny magical sparkles/stars in white and light blue.
The gem should look precious and magical like from a fairy tale.
Background MUST be completely transparent (alpha channel).
Size: 128x128. The gem and sparkles should fill about 70% of the canvas. Clean edges.`,
  },
  {
    filename: "sparkle.png",
    description: `A bright SPARKLE/STARBURST particle for a children's typing game.
Pixar/Disney cartoon style, magical and glittery.
A 4-pointed cartoon sparkle star in bright GOLD/YELLOW with a soft white center glow.
The sparkle should have pointed tips with rounded edges (not sharp), and a soft glow halo.
Add 2-3 smaller secondary sparkle dots nearby.
The sparkle should look like magical fairy dust.
Background MUST be completely transparent (alpha channel).
Size: 128x128. The main sparkle fills about 60% of the canvas. Clean edges.`,
  },
  {
    filename: "cloud.png",
    description: `A cute fluffy CLOUD particle for a children's typing game.
Pixar/Disney cartoon style, puffy and soft like cotton candy.
A single adorable cartoon cloud in pure WHITE with soft light blue/gray shading on the bottom.
The cloud should have 3-4 rounded puffs that make it look like a friendly shape.
Add a very subtle warm glow around the edges.
The cloud should look light and floaty.
Background MUST be completely transparent (alpha channel).
Size: 128x128. The cloud fills about 75% of the canvas. Clean edges.`,
  },
  {
    filename: "finger-glow.png",
    description: `A soft FINGER GLOW/HIGHLIGHT ring particle for a children's typing game.
A circular soft glow ring in bright WARM GOLDEN/AMBER color.
The glow should be brightest in the center and fade softly to transparent at the edges.
It should look like a magical fingertip tap glow - like when you tap a glowing button.
Add tiny sparkle dots inside the ring.
The ring should be about 70% diameter of the canvas with a 15-20px thick band.
Background MUST be completely transparent (alpha channel).
Size: 128x128. The glow ring centered with soft fading edges.`,
  },
  {
    filename: "grass-tuft.png",
    description: `A cute GRASS TUFT particle for a children's typing game garden theme.
Pixar/Disney cartoon style, bright and playful.
A small clump of cartoon grass with 5-7 blades of grass in 2-3 shades of bright GREEN.
The grass blades should curve outward like a little tuft, with rounded tips.
The blades should have a subtle highlight on one side for depth.
At the base, a tiny bit of brown earth/dirt (small mound).
The grass should look fresh and spring-like, from a magical garden.
Background MUST be completely transparent (alpha channel).
Size: 128x128. The grass tuft fills about 70% of the canvas. Clean edges.`,
  },
];

// ============================
// GENERATION FUNCTION
// ============================
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
        text: `Generate a high-quality PNG illustration with transparent background (alpha channel): ${description}

CRITICAL: The output MUST be a PNG with transparent background. No solid background color. The image must have clean edges with proper alpha transparency. This is for game particle effects that will be overlaid on other scenes.`
      }]
    }],
    generationConfig: {
      responseModalities: ["Text", "Image"],
    }
  });

  const response = result.response;
  let imageData = null;

  if (response.candidates && response.candidates[0]) {
    const parts = response.candidates[0].content.parts;
    for (const part of parts) {
      if (part.inlineData && part.inlineData.mimeType && part.inlineData.mimeType.startsWith("image/")) {
        imageData = Buffer.from(part.inlineData.data, "base64");
        console.log(`    MIME type: ${part.inlineData.mimeType}`);
        break;
      }
    }
    // Also log text response for debugging
    const textParts = parts.filter(p => p.text);
    if (textParts.length > 0) {
      console.log(`    Gemini text: ${textParts[0].text.substring(0, 200)}`);
    }
  }

  return imageData;
}

// ============================
// MAIN
// ============================
async function main() {
  // Ensure directories
  for (const dir of [GUIDES_DIR, PARTICLES_DIR]) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  // Generate GUIDES
  console.log("🎮 ===== GENERATING GUIDES (3 assets) =====");
  for (let i = 0; i < guides.length; i++) {
    const g = guides[i];
    const filepath = join(GUIDES_DIR, g.filename);
    
    console.log(`\n[Guide ${i + 1}/${guides.length}] ${g.filename}`);
    console.log(`  Prompt: ${g.description.substring(0, 80)}...`);
    
    try {
      const imageData = await generateImage(g.description);
      if (imageData) {
        writeFileSync(filepath, imageData);
        const sizeKB = (imageData.length / 1024).toFixed(1);
        console.log(`  ✅ Saved: ${g.filename} (${sizeKB} KB)`);
      } else {
        console.log(`  ⚠️  No image data for ${g.filename}`);
      }
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}`);
    }
    
    if (i < guides.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Generate PARTICLES
  console.log("\n✨ ===== GENERATING PARTICLES (6 assets) =====");
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const filepath = join(PARTICLES_DIR, p.filename);
    
    console.log(`\n[Particle ${i + 1}/${particles.length}] ${p.filename}`);
    console.log(`  Prompt: ${p.description.substring(0, 80)}...`);
    
    try {
      const imageData = await generateImage(p.description);
      if (imageData) {
        writeFileSync(filepath, imageData);
        const sizeKB = (imageData.length / 1024).toFixed(1);
        console.log(`  ✅ Saved: ${p.filename} (${sizeKB} KB)`);
      } else {
        console.log(`  ⚠️  No image data for ${p.filename}`);
      }
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}`);
    }
    
    if (i < particles.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log("\n🎉 All guides and particles generation complete!");
}

main().catch(console.error);
