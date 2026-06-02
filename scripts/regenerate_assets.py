#!/usr/bin/env python3
"""
BloomType Asset Regeneration Pipeline
=====================================

Generates the full 50+ asset set in the unified "3D Pixar / mobile gacha" style
(matching the visual bar of the existing public/assets/pets/flower.png).

Style brief (master suffix applied to every prompt):
  - Pixar-quality 3D render
  - soft volumetric lighting from upper left
  - subsurface scattering on organic surfaces
  - rounded child-safe forms, no sharp edges
  - octane/cycles render aesthetic
  - high production value
  - big expressive eyes (kawaii)
  - soft pastel palette
  - gentle depth-of-field
  - consistent character rig (this is the bar)

Required environment:
  GOOGLE_IMAGEN_API_KEY  -- Imagen 4 access (preferred; matches original pipeline)
       OR
  FAL_KEY               -- FAL.ai access (fallback)

Usage:
  export GOOGLE_IMAGEN_API_KEY=...
  python3 scripts/regenerate_assets.py           # full set
  python3 scripts/regenerate_assets.py --only pet # only the hero pet frames
  python3 scripts/regenerate_assets.py --dry-run # print plan, no API calls

Idempotent: re-running overwrites existing PNGs. Safe to resume.
"""

import argparse
import base64
import json
import os
import sys
import time
import urllib.request
import urllib.error
from pathlib import Path
from PIL import Image
import io

# --- Configuration ---------------------------------------------------------

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "public" / "assets"

# Master style suffix applied to every prompt.
# Tuned to match public/assets/pets/flower.png (the gold-standard asset in the set).
STYLE_SUFFIX = (
    "Pixar-quality 3D render, soft volumetric lighting from upper left, "
    "subsurface scattering on organic surfaces, octane render aesthetic, "
    "rounded child-safe forms, no sharp edges, soft pastel palette, "
    "gentle depth-of-field, high production value, mobile game asset, "
    "kawaii proportions, big expressive eyes with sparkle highlights"
)

# Per-asset transparent-background suffix
SPRITE_SUFFIX = "transparent background, centered subject, isolated on white, no shadows on ground"

IMAGEN_MODEL = "imagen-4.0-generate-001"
IMAGEN_ENDPOINT = f"https://generativelanguage.googleapis.com/v1beta/models/{IMAGEN_MODEL}:predict"

# --- Asset catalog ---------------------------------------------------------

# Each entry: (relative_path, prompt_core, aspect_ratio, resolution)
# aspect_ratio: "1:1" (square), "16:9" (landscape), "9:16" (portrait)
# resolution: "512x512", "1024x1024", "1920x1080"

HERO_PET = "Bloom"  # the main character (pink flower from flower.png)

ASSET_CATALOG = {
    # ===== HERO PET (used in-game, replaces pro/pet/*) =====
    "pro/pet/idle.png": (
        f"Pixar-quality 3D render of {HERO_PET}, a kawaii pink flower character with big glossy blue eyes and sparkle highlights, soft pink plush petals with subsurface scattering, tiny green leaf body and feet, calm neutral idle pose, soft volumetric lighting from upper left, octane render, soft pastel palette, transparent background, centered, 512x512, mobile game pet sprite",
        "1:1", "512x512"
    ),
    "pro/pet/happy.png": (
        f"Pixar-quality 3D render of {HERO_PET}, a kawaii pink flower character with big glossy blue eyes, wide joyful open-mouth smile, eyes closed in delight with curved happy lines, soft pink plush petals bouncing with energy, soft volumetric lighting from upper left, octane render, transparent background, centered, 512x512",
        "1:1", "512x512"
    ),
    "pro/pet/hurt.png": (
        f"Pixar-quality 3D render of {HERO_PET}, a kawaii pink flower character with big glossy blue eyes showing concern, eyebrows raised worriedly, small wince, soft pink petals slightly drooping, soft volumetric lighting from upper left, octane render, transparent background, centered, 512x512",
        "1:1", "512x512"
    ),
    "pro/pet/celebrate.png": (
        f"Pixar-quality 3D render of {HERO_PET}, a kawaii pink flower character celebrating victory, big glossy eyes shining with joy, fists raised triumphantly with little leaf hands, soft pink petals flared outward, gold sparkle particles around, soft volumetric lighting from upper left, octane render, transparent background, centered, 512x512",
        "1:1", "512x512"
    ),
    "pro/pet/fire.png": (
        f"Pixar-quality 3D render of {HERO_PET}, a kawaii pink flower character in determined battle mode, big glossy eyes focused and intense, eyebrows furrowed with concentration, soft pink petals with subtle warm glow, soft volumetric lighting from upper left, octane render, transparent background, centered, 512x512",
        "1:1", "512x512"
    ),

    # ===== PARALLAX BACKGROUND LAYERS (in-game) =====
    "pro/bg/sky.png": (
        "Pixar-quality 3D rendered magical twilight sky for a children's typing game, dreamy gradient from deep purple at top to soft pink-orange at horizon, scattered twinkling stars and a glowing crescent moon, soft volumetric clouds with subsurface lighting, gentle aurora-like wisps, atmospheric perspective, 16:9 wide landscape, 1920x1080",
        "16:9", "1920x1080"
    ),
    "pro/bg/trees.png": (
        "Pixar-quality 3D rendered silhouette layer of stylized magical forest trees, dark purple silhouettes with subtle rim lighting from behind, soft fairy lights scattered between trunks, atmospheric haze, 16:9 wide landscape, 1920x1080, transparent silhouette suitable for parallax",
        "16:9", "1920x1080"
    ),
    "pro/bg/hills.png": (
        "Pixar-quality 3D rendered rolling green hills in soft twilight, layered depth with atmospheric perspective, gentle warm highlights on hill tops, soft purple shadows in valleys, scattered wildflowers, 16:9 wide landscape, 1920x1080",
        "16:9", "1920x1080"
    ),
    "pro/bg/grass.png": (
        "Pixar-quality 3D rendered foreground grass tuft layer, lush stylized green grass blades with soft volumetric lighting, glistening water droplets, scattered glowing firefly particles, soft bokeh in background, 16:9 wide landscape bottom-anchored, 1920x1080, transparent background at top",
        "16:9", "1920x1080"
    ),

    # ===== FLOWERS + PARTICLES (in-game) =====
    "pro/flowers/bud.png": (
        "Pixar-quality 3D render of a closed flower bud about to bloom, soft pink petals tightly wrapped, dewy green sepals, soft volumetric lighting from upper left, transparent background, centered, 512x512",
        "1:1", "512x512"
    ),
    "pro/flowers/sprout.png": (
        "Pixar-quality 3D render of a small magical sprout pushing up from soil, two tiny green leaves, soft glow around it, dewy, soft volumetric lighting from upper left, transparent background, centered, 512x512",
        "1:1", "512x512"
    ),
    "pro/particles/sparkle.png": (
        "Pixar-quality 3D render of a magical 4-point sparkle star with bright center and soft golden rays, glowing, transparent background, centered, 256x256",
        "1:1", "256x256"
    ),

    # ===== PET GALLERY (selection screen, profile) =====
    "pets/flower.png": (
        "Pixar-quality 3D render of a kawaii anthropomorphic pink daisy flower character with big glossy blue eyes and sparkle highlights, plush rounded petals with subsurface scattering, green stem body with two small leaves, smiling, soft volumetric lighting from upper left, octane render, rounded square mobile app icon format, 512x512",
        "1:1", "512x512"
    ),
    "pets/sunflower.png": (
        "Pixar-quality 3D render of a kawaii anthropomorphic sunflower character with big glossy blue eyes and sparkle highlights, bright yellow petals with subsurface scattering, brown smiling face center, green stem body, soft volumetric lighting from upper left, octane render, rounded square mobile app icon format, 512x512",
        "1:1", "512x512"
    ),
    "pets/dragon.png": (
        "Pixar-quality 3D render of a kawaii baby purple dragon character with big glossy blue eyes and sparkle highlights, soft scales with subsurface scattering, tiny wings, smiling, soft volumetric lighting from upper left, octane render, rounded square mobile app icon format, 512x512",
        "1:1", "512x512"
    ),
    "pets/cat.png": (
        "Pixar-quality 3D render of a kawaii orange tabby kitten character with big glossy blue eyes and sparkle highlights, soft fluffy fur with subsurface scattering, sitting pose, soft volumetric lighting from upper left, octane render, rounded square mobile app icon format, 512x512",
        "1:1", "512x512"
    ),
    "pets/robot.png": (
        "Pixar-quality 3D render of a kawaii friendly robot character with big glossy blue screen-eyes and sparkle highlights, soft rounded white and teal chassis with subtle glow, antenna with star, smiling, soft volumetric lighting from upper left, octane render, rounded square mobile app icon format, 512x512",
        "1:1", "512x512"
    ),
    "pets/bunny.png": (
        "Pixar-quality 3D render of a kawaii white bunny character with big glossy blue eyes and sparkle highlights, soft fluffy fur with subsurface scattering on pink inner ears, sitting pose, soft volumetric lighting from upper left, octane render, rounded square mobile app icon format, 512x512",
        "1:1", "512x512"
    ),
    "pets/panda.png": (
        "Pixar-quality 3D render of a kawaii baby panda character with big glossy blue eyes and sparkle highlights, soft fluffy black and white fur with subsurface scattering, sitting pose holding a bamboo shoot, soft volumetric lighting from upper left, octane render, rounded square mobile app icon format, 512x512",
        "1:1", "512x512"
    ),
    "pets/fox.png": (
        "Pixar-quality 3D render of a kawaii baby orange fox character with big glossy blue eyes and sparkle highlights, soft fluffy fur with subsurface scattering on white belly, bushy tail, sitting pose, soft volumetric lighting from upper left, octane render, rounded square mobile app icon format, 512x512",
        "1:1", "512x512"
    ),
    "pets/owl.png": (
        "Pixar-quality 3D render of a kawaii baby owl character with big glossy blue eyes and sparkle highlights, soft feather texture with subsurface scattering, brown and cream plumage, soft volumetric lighting from upper left, octane render, rounded square mobile app icon format, 512x512",
        "1:1", "512x512"
    ),
    "pets/puppy.png": (
        "Pixar-quality 3D render of a kawaii golden retriever puppy character with big glossy blue eyes and sparkle highlights, soft fluffy fur with subsurface scattering, floppy ears, tongue out, sitting pose, soft volumetric lighting from upper left, octane render, rounded square mobile app icon format, 512x512",
        "1:1", "512x512"
    ),

    # ===== MENU / PRACTICE / PARENTS BACKGROUNDS =====
    "backgrounds/menu.png": (
        "Pixar-quality 3D rendered magical garden main menu background for a children's typing game, dreamy twilight sky with twinkling stars, glowing fireflies, soft purple-pink gradient, large stylized glowing mushrooms framing the sides, soft volumetric lighting, 16:9 wide landscape, 1920x1080",
        "16:9", "1920x1080"
    ),
    "backgrounds/gameplay.png": (
        "Pixar-quality 3D rendered in-game magical garden background for a children's typing game, layered parallax scene with twilight sky, soft distant purple trees, rolling green hills, soft grass foreground, fireflies, 16:9 wide landscape, 1920x1080",
        "16:9", "1920x1080"
    ),
    "backgrounds/practice.png": (
        "Pixar-quality 3D rendered calm practice mode background for a children's typing game, soft pastel sky, gentle rolling green hills, single stylized tree, scattered wildflowers, peaceful mood, 16:9 wide landscape, 1920x1080",
        "16:9", "1920x1080"
    ),
    "backgrounds/new-theme-bg.png": (
        "Pixar-quality 3D rendered enchanted forest background for a children's typing game, soft moonlight filtering through stylized purple trees, glowing mushrooms, firefly particles, magical mist, 16:9 wide landscape, 1920x1080",
        "16:9", "1920x1080"
    ),
    "backgrounds/realistic-garden.png": (
        "Pixar-quality 3D rendered realistic-style sunny garden background for a children's typing game, bright blue sky with soft clouds, lush green grass, colorful flower bed in foreground, soft sunlight, warm mood, 16:9 wide landscape, 1920x1080",
        "16:9", "1920x1080"
    ),

    # ===== LEVEL ICONS =====
    "levels/home-row.png": (
        "Pixar-quality 3D render of a stylized home row keyboard section, soft rounded colorful keys (A S D F) glowing with a green home-row indicator, soft volumetric lighting from upper left, transparent background, 512x512",
        "1:1", "512x512"
    ),
    "levels/top-row.png": (
        "Pixar-quality 3D render of a stylized top row keyboard section, soft rounded colorful keys (Q W E R T Y) with blue glow, soft volumetric lighting from upper left, transparent background, 512x512",
        "1:1", "512x512"
    ),
    "levels/bottom-row.png": (
        "Pixar-quality 3D render of a stylized bottom row keyboard section, soft rounded colorful keys (Z X C V B) with purple glow, soft volumetric lighting from upper left, transparent background, 512x512",
        "1:1", "512x512"
    ),
    "levels/capitals.png": (
        "Pixar-quality 3D render of uppercase letter blocks A B C in soft pastel colors with golden glow, decorative, child-friendly, soft volumetric lighting from upper left, transparent background, 512x512",
        "1:1", "512x512"
    ),
    "levels/numbers.png": (
        "Pixar-quality 3D render of colorful number blocks 1 2 3 in soft pastel pinks and yellows, decorative, child-friendly, soft volumetric lighting from upper left, transparent background, 512x512",
        "1:1", "512x512"
    ),
    "levels/master.png": (
        "Pixar-quality 3D render of a golden keyboard with a star above it, glowing with rainbow aura, celebratory feel, child-friendly, soft volumetric lighting from upper left, transparent background, 512x512",
        "1:1", "512x512"
    ),

    # ===== BADGES =====
    "badges/bronze.png": (
        "Pixar-quality 3D render of a bronze medal with a ribbon, soft metallic sheen, gentle patina, child-friendly, soft volumetric lighting from upper left, transparent background, centered, 256x256",
        "1:1", "256x256"
    ),
    "badges/silver.png": (
        "Pixar-quality 3D render of a silver medal with a ribbon, polished metallic sheen, child-friendly, soft volumetric lighting from upper left, transparent background, centered, 256x256",
        "1:1", "256x256"
    ),
    "badges/gold.png": (
        "Pixar-quality 3D render of a gold medal with a ribbon, polished metallic sheen, subtle glow, child-friendly, soft volumetric lighting from upper left, transparent background, centered, 256x256",
        "1:1", "256x256"
    ),
    "badges/platinum.png": (
        "Pixar-quality 3D render of a platinum medal with a ribbon, iridescent metallic sheen, sparkle highlights, child-friendly, soft volumetric lighting from upper left, transparent background, centered, 256x256",
        "1:1", "256x256"
    ),

    # ===== ACHIEVEMENTS =====
    "achievements/combo.png": (
        "Pixar-quality 3D render of a glowing combo flame icon, three orange-yellow flames rising, child-friendly, soft volumetric lighting from upper left, transparent background, 512x512",
        "1:1", "512x512"
    ),
    "achievements/perfect.png": (
        "Pixar-quality 3D render of a perfect-score target icon, bullseye with golden star at center, glowing, child-friendly, soft volumetric lighting from upper left, transparent background, 512x512",
        "1:1", "512x512"
    ),
    "achievements/speed-10.png": (
        "Pixar-quality 3D render of a small blue lightning bolt icon with 10 WPM label, glowing, child-friendly, soft volumetric lighting from upper left, transparent background, 512x512",
        "1:1", "512x512"
    ),
    "achievements/speed-30.png": (
        "Pixar-quality 3D render of a medium purple lightning bolt icon with 30 WPM label, glowing, child-friendly, soft volumetric lighting from upper left, transparent background, 512x512",
        "1:1", "512x512"
    ),
    "achievements/speed-50.png": (
        "Pixar-quality 3D render of a large gold lightning bolt icon with 50 WPM label, glowing, child-friendly, soft volumetric lighting from upper left, transparent background, 512x512",
        "1:1", "512x512"
    ),

    # ===== HAND GUIDES =====
    "guides/left-hand.png": (
        "Pixar-quality 3D render of a cartoon left hand with finger color-coding, soft skin with subsurface scattering, fingers highlighted in pink and blue tones, soft volumetric lighting from upper left, transparent background, 512x512",
        "1:1", "512x512"
    ),
    "guides/right-hand.png": (
        "Pixar-quality 3D render of a cartoon right hand with finger color-coding, soft skin with subsurface scattering, fingers highlighted in green and yellow tones, soft volumetric lighting from upper left, transparent background, 512x512",
        "1:1", "512x512"
    ),
    "guides/keyboard-zones.png": (
        "Pixar-quality 3D render of a top-down keyboard with color-coded hand zones (left hand pink, right hand green), soft pastel keys, child-friendly, soft volumetric lighting, transparent background, 512x512",
        "1:1", "512x512"
    ),

    # ===== PARTICLES =====
    "particles/cloud.png": (
        "Pixar-quality 3D render of a small soft white-pink cloud, fluffy with soft volumetric edges, transparent background, centered, 256x256",
        "1:1", "256x256"
    ),
    "particles/finger-glow.png": (
        "Pixar-quality 3D render of a glowing fingertip with soft golden light radiating outward, magical feel, transparent background, centered, 256x256",
        "1:1", "256x256"
    ),
    "particles/gem.png": (
        "Pixar-quality 3D render of a faceted magical gem in soft pink-purple, sparkling with internal light, transparent background, centered, 256x256",
        "1:1", "256x256"
    ),
    "particles/grass-tuft.png": (
        "Pixar-quality 3D render of a small tuft of stylized green grass, soft volumetric lighting, transparent background, centered, 256x256",
        "1:1", "256x256"
    ),
    "particles/heart.png": (
        "Pixar-quality 3D render of a glossy pink heart with sparkle highlight, soft volumetric lighting, transparent background, centered, 256x256",
        "1:1", "256x256"
    ),
    "particles/sparkle.png": (
        "Pixar-quality 3D render of a magical 4-point sparkle star, bright center, soft golden rays, transparent background, centered, 256x256",
        "1:1", "256x256"
    ),

    # ===== UI ELEMENTS =====
    "ui/pause.png": (
        "Pixar-quality 3D render of a circular pause button with two rounded vertical bars, soft purple glass with white icon, soft volumetric lighting, transparent background, 512x512",
        "1:1", "512x512"
    ),
    "ui/completed.png": (
        "Pixar-quality 3D render of a large green check mark inside a soft circle, glowing with completion rays, child-friendly, transparent background, 512x512",
        "1:1", "512x512"
    ),
    "ui/locked.png": (
        "Pixar-quality 3D render of a soft padlock icon in muted gray-purple, child-friendly, soft volumetric lighting, transparent background, 512x512",
        "1:1", "512x512"
    ),
    "ui/encouragement-bubble.png": (
        "Pixar-quality 3D render of a soft pastel speech bubble with a heart inside, glassmorphism feel, child-friendly, transparent background, 512x512",
        "1:1", "512x512"
    ),
    "ui/badge-gold.png": (
        "Pixar-quality 3D render of a small gold star badge, polished with sparkle highlights, child-friendly, transparent background, 512x512",
        "1:1", "512x512"
    ),
    "ui/accuracy-meter.png": (
        "Pixar-quality 3D render of a circular accuracy meter dial, soft pastel gradient ring with indicator needle pointing up, glassmorphism, transparent background, 512x512",
        "1:1", "512x512"
    ),
    "ui/celebration-banner.png": (
        "Pixar-quality 3D render of a celebratory banner ribbon in soft pink-purple with gold trim, child-friendly, transparent background, 512x512",
        "1:1", "512x512"
    ),
    "ui/speedometer.png": (
        "Pixar-quality 3D render of a circular speedometer dial with WPM needle, soft pastel blue-purple ring, glassmorphism, transparent background, 512x512",
        "1:1", "512x512"
    ),
    "ui/streak.png": (
        "Pixar-quality 3D render of a stylized flame streak in pink-orange with spark trail, child-friendly, transparent background, 512x512",
        "1:1", "512x512"
    ),
    "ui/progress-bar.png": (
        "Pixar-quality 3D render of a horizontal progress bar, soft glass track with a glowing purple-pink fill, rounded ends, transparent background, 512x512",
        "1:1", "512x512"
    ),
}


# --- API client -------------------------------------------------------------

def call_imagen(prompt: str, aspect: str, resolution: str, key: str) -> bytes:
    """Call Imagen 4 and return the raw PNG bytes."""
    payload = {
        "instances": [{"prompt": prompt}],
        "parameters": {
            "sampleCount": 1,
            "aspectRatio": aspect,
        },
    }
    url = f"{IMAGEN_ENDPOINT}?key={key}"
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    b64 = data["predictions"][0]["bytesBase64Encoded"]
    return base64.b64decode(b64)


# --- Background removal (simple dark-corner detection) --------------------

def remove_background_if_sprite(filepath: Path, threshold: int = 50) -> None:
    """For sprite assets, knock out near-white pixels to transparent.

    Imagen 4 with 'transparent background' prompts usually returns the subject
    on a near-white background; this is a fast PIL pass that turns those
    pixels into alpha=0 so the asset composites cleanly in canvas.
    """
    if not filepath.exists():
        return
    img = Image.open(filepath).convert("RGBA")
    pixels = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            # Near-white: turn transparent
            if r > 240 and g > 240 and b > 240:
                pixels[x, y] = (255, 255, 255, 0)
            # Off-white/light gray fringe
            elif r > threshold * 4 and g > threshold * 4 and b > threshold * 4 and abs(r - g) < 15 and abs(g - b) < 15:
                pixels[x, y] = (r, g, b, max(0, a - 80))
    img.save(filepath, "PNG", optimize=True)


# --- Main ------------------------------------------------------------------

def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--only", choices=["hero", "bg", "pets", "ui", "all"], default="all")
    parser.add_argument("--dry-run", action="store_true", help="Print plan, no API calls")
    parser.add_argument("--no-bg-removal", action="store_true", help="Skip PIL background pass")
    args = parser.parse_args()

    key = os.environ.get("GOOGLE_IMAGEN_API_KEY") or os.environ.get("FAL_KEY")
    if not key and not args.dry_run:
        print("ERROR: Set GOOGLE_IMAGEN_API_KEY or FAL_KEY.", file=sys.stderr)
        print("  Get an Imagen key: https://aistudio.google.com/apikey", file=sys.stderr)
        print("  Or run with --dry-run to print the plan.", file=sys.stderr)
        return 1

    # Filter catalog by --only
    if args.only == "hero":
        catalog = {k: v for k, v in ASSET_CATALOG.items() if k.startswith("pro/pet/")}
    elif args.only == "bg":
        catalog = {k: v for k, v in ASSET_CATALOG.items() if k.startswith("pro/bg/") or k.startswith("backgrounds/")}
    elif args.only == "pets":
        catalog = {k: v for k, v in ASSET_CATALOG.items() if k.startswith("pets/")}
    elif args.only == "ui":
        catalog = {k: v for k, v in ASSET_CATALOG.items() if k.startswith(("ui/", "particles/", "badges/", "achievements/", "levels/", "guides/"))}
    else:
        catalog = ASSET_CATALOG

    print(f"Plan: {len(catalog)} assets")
    for relpath, (prompt, aspect, res) in catalog.items():
        target = ASSETS / relpath
        size_kb = target.stat().st_size // 1024 if target.exists() else 0
        print(f"  {relpath:40s} {res:10s}  ({size_kb} KB current)")

    if args.dry_run:
        print("\n--dry-run: no API calls made.")
        return 0

    # Generate
    succeeded, failed = [], []
    total = len(catalog)
    for i, (relpath, (prompt, aspect, res)) in enumerate(catalog.items(), 1):
        target = ASSETS / relpath
        target.parent.mkdir(parents=True, exist_ok=True)
        print(f"\n[{i}/{total}] {relpath}")
        try:
            png_bytes = call_imagen(prompt, aspect, res, key)
            target.write_bytes(png_bytes)
            print(f"  wrote {len(png_bytes) // 1024} KB")

            if not args.no_bg_removal and not relpath.startswith(("pro/bg/", "backgrounds/")):
                remove_background_if_sprite(target)
                print(f"  bg-removed")

            succeeded.append(relpath)
        except urllib.error.HTTPError as e:
            print(f"  HTTP {e.code}: {e.reason}", file=sys.stderr)
            try:
                print(f"  body: {e.read().decode('utf-8', 'ignore')[:200]}", file=sys.stderr)
            except Exception:
                pass
            failed.append(relpath)
        except Exception as e:
            print(f"  error: {e}", file=sys.stderr)
            failed.append(relpath)

        # Gentle throttle to be a good API citizen
        time.sleep(0.5)

    print(f"\n=== Summary ===")
    print(f"Succeeded: {len(succeeded)}/{total}")
    print(f"Failed:    {len(failed)}/{total}")
    if failed:
        print("\nFailed (retry these individually with --only or by editing the catalog):")
        for f in failed:
            print(f"  - {f}")
    return 0 if not failed else 2


if __name__ == "__main__":
    sys.exit(main())
