#!/usr/bin/env python3
"""
Generate game guides and particles programmatically.
Creates proper RGBA PNGs with transparent backgrounds.
Pixar/Disney cartoon style, bright and child-friendly.
"""

from PIL import Image, ImageDraw, ImageFilter, ImageChops
import math, os

OUT_DIR = "/Users/biancabienaime/magic-type-quest/public/assets"
os.makedirs(OUT_DIR + "/guides", exist_ok=True)
os.makedirs(OUT_DIR + "/particles", exist_ok=True)


def circle_mask(size, center, radius, feather=0):
    """Create a circular alpha mask"""
    mask = Image.new("L", size, 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse(
        [center[0] - radius, center[1] - radius,
         center[0] + radius, center[1] + radius],
        fill=255
    )
    if feather > 0:
        mask = mask.filter(ImageFilter.GaussianBlur(feather))
    return mask


def rounded_rect_mask(size, xy, radius, feather=0):
    """Create rounded rect alpha mask"""
    mask = Image.new("L", size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle(xy, radius, fill=255)
    if feather > 0:
        mask = mask.filter(ImageFilter.GaussianBlur(feather))
    return mask


def heart_shape(cx, cy, size):
    """Generate heart polygon points centered at cx,cy"""
    points = []
    h = size * 1.15
    w = size
    # Heart shape using 2 cubic beziers per side
    # Top left curve
    steps = 40
    for i in range(steps + 1):
        t = i / steps
        # Left lobe
        x = cx - w/2 + w/2 * (1 - (1 - t)**2)  # ease out
        y = cy - h/2 + h/3 * t
        points.append((x, y))
    # Top right curve
    for i in range(steps + 1):
        t = i / steps
        x = cx + w/2 - w/2 * (1 - t**2)  # ease in
        y = cy - h/2 + h/3 * (1 - t)
        points.append((x, y))
    # Bottom point
    # Smooth curve to bottom
    for i in range(steps + 1):
        t = i / steps
        x = cx + w/2 * (1 - t)**2  # curve from right to center
        y = cy + h/6 + h/3 * t
        points.append((x, y))
    for i in range(steps + 1):
        t = i / steps
        x = cx - w/2 * t**2  # curve from center to left
        y = cy + h/6 + h/3 * (1 - t)
        points.append((x, y))

    return points


def draw_heart(size=128):
    """Draw a cute cartoon heart"""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    cx, cy = size // 2, size // 2
    s = size * 0.7
    
    # Shadow/outline
    shadow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    pts = heart_shape(cx + 2, cy + 3, s)
    sd.polygon(pts, fill=(180, 40, 40, 100))
    shadow = shadow.filter(ImageFilter.GaussianBlur(3))
    img = Image.alpha_composite(img, shadow)
    
    draw = ImageDraw.Draw(img)
    # Main heart
    pts = heart_shape(cx, cy, s)
    draw.polygon(pts, fill=(255, 70, 90, 255))
    
    # Darker edge
    inner = heart_shape(cx, cy, s * 0.85)
    draw.polygon(inner, fill=(240, 55, 75, 255))
    
    # Highlight
    hl_pts = heart_shape(cx - s * 0.08, cy - s * 0.08, s * 0.5)
    draw.polygon(hl_pts, fill=(255, 150, 160, 180))
    
    # Small sparkle
    sp_size = int(size * 0.08)
    for ox, oy in [(-10, -18), (8, -12)]:
        sx, sy = cx + int(ox * s / 70), cy + int(oy * s / 70)
        draw.ellipse([sx-sp_size, sy-sp_size, sx+sp_size, sy+sp_size], 
                     fill=(255, 255, 255, 220))
    
    # Soft glow
    glow = circle_mask((size, size), (cx, cy), int(s * 0.55), feather=8)
    glow_img = Image.new("RGBA", (size, size), (255, 150, 170, 40))
    glow_img.putalpha(glow)
    img = Image.alpha_composite(img, glow_img)
    
    return img


def draw_gem(size=128):
    """Draw a magical gem crystal"""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    cx, cy = size // 2, size // 2
    w, h = int(size * 0.7), int(size * 0.85)
    
    # Gem shape - hexagon
    top = cy - h // 2
    bottom = cy + h // 2
    mid_top = cy - h // 4
    mid_bot = cy + h // 5
    
    pts = [
        (cx, top),
        (cx + w // 2 + 5, mid_top),
        (cx + w // 2 + 5, mid_bot),
        (cx, bottom),
        (cx - w // 2 - 5, mid_bot),
        (cx - w // 2 - 5, mid_top),
    ]
    
    # Shadow
    shadow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    spts = [(x + 2, y + 3) for x, y in pts]
    sd.polygon(spts, fill=(30, 120, 140, 100))
    shadow = shadow.filter(ImageFilter.GaussianBlur(3))
    img = Image.alpha_composite(img, shadow)
    
    draw = ImageDraw.Draw(img)
    
    # Body
    draw.polygon(pts, fill=(50, 200, 220, 255))
    
    # Facets  
    # Top facet
    draw.polygon([pts[0], pts[1], (cx, mid_top - 3), pts[5]], 
                 fill=(100, 220, 235, 255))
    # Center facet
    draw.polygon([(cx, mid_top - 3), pts[1], (cx + w // 4, cy), pts[2],
                  (cx, mid_bot), (cx - w // 4, cy), pts[5]],
                 fill=(30, 170, 200, 255))
    # Bottom facet
    draw.polygon([pts[3], pts[2], (cx, mid_bot), pts[4]],
                 fill=(20, 140, 170, 255))
    
    # Edge shine
    draw.line([(cx, top), (cx, top + 20)], fill=(180, 230, 240, 200), width=3)
    
    # Sparkles
    for sx, sy in [(cx + 20, top - 5), (cx - 15, top + 10), (cx + 25, cy + 5)]:
        for r in range(3, 0, -1):
            alpha = 150 if r == 3 else 80
            draw.ellipse([sx - r, sy - r, sx + r, sy + r], 
                        fill=(255, 255, 255, alpha))
    
    # Glow
    glow = circle_mask((size, size), (cx, cy), int(size * 0.4), feather=6)
    glow_img = Image.new("RGBA", (size, size), (80, 210, 240, 30))
    glow_img.putalpha(glow)
    img = Image.alpha_composite(img, glow_img)
    
    return img


def draw_sparkle(size=128):
    """Draw a sparkle/starburst"""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    cx, cy = size // 2, size // 2
    outer = int(size * 0.42)
    inner = int(size * 0.15)
    
    # 4-pointed star
    star_pts = []
    for i in range(4):
        angle = math.pi / 2 * i - math.pi / 4
        star_pts.append((cx + int(outer * math.cos(angle)),
                        cy + int(outer * math.sin(angle))))
        angle += math.pi / 4
        star_pts.append((cx + int(inner * math.cos(angle)),
                        cy + int(inner * math.sin(angle))))
    
    # Blurred glow behind
    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.polygon(star_pts, fill=(255, 215, 0, 120))
    glow = glow.filter(ImageFilter.GaussianBlur(8))
    img = Image.alpha_composite(img, glow)
    
    draw = ImageDraw.Draw(img)
    
    # Main star
    draw.polygon(star_pts, fill=(255, 200, 30, 255))
    
    # Center bright spot
    draw.ellipse([cx - 6, cy - 6, cx + 6, cy + 6], fill=(255, 255, 255, 230))
    
    # Small companion sparkles
    for dx, dy in [(18, -15), (-16, 12), (20, 8)]:
        sx, sy = cx + dx, cy + dy
        for r in [3, 2]:
            alpha = 180 if r == 3 else 100
            draw.ellipse([sx - r, sy - r, sx + r, sy + r],
                        fill=(255, 230, 100, alpha))
    
    return img


def draw_cloud(size=128):
    """Draw a fluffy cartoon cloud"""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    cx, cy = size // 2, size // 2
    
    # Cloud made of overlapping circles
    circles = [
        (cx, cy + 5, 24),       # center
        (cx - 28, cy + 10, 20), # left
        (cx + 28, cy + 10, 20), # right
        (cx - 14, cy - 8, 22),  # top-left
        (cx + 14, cy - 8, 22),  # top-right
        (cx, cy - 15, 22),      # top
    ]
    
    # Shadow
    shadow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    for sx, sy, r in circles:
        sd.ellipse([sx - r + 2, sy - r + 3, sx + r + 2, sy + r + 3],
                   fill=(180, 200, 215, 80))
    shadow = shadow.filter(ImageFilter.GaussianBlur(3))
    img = Image.alpha_composite(img, shadow)
    
    draw = ImageDraw.Draw(img)
    
    # Main white cloud
    for sx, sy, r in circles:
        draw.ellipse([sx - r, sy - r, sx + r, sy + r],
                    fill=(245, 248, 252, 255))
    
    # Bottom shading
    for sx, sy, r in circles:
        if sy > cy:  # bottom circles
            shade_r = int(r * 0.85)
            draw.ellipse([sx - shade_r, sy - shade_r // 2,
                         sx + shade_r, sy + shade_r * 0.7],
                        fill=(225, 232, 240, 120))
    
    # Top highlight
    draw.ellipse([cx - 15, cy - 20, cx + 15, cy - 5],
                fill=(255, 255, 255, 150))
    
    return img


def draw_finger_glow(size=128):
    """Draw a finger tap glow ring"""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    cx, cy = size // 2, size // 2
    outer = int(size * 0.4)
    inner = int(size * 0.25)
    
    # Large soft background glow
    bg_glow = circle_mask((size, size), (cx, cy), outer + 5, feather=12)
    bg_img = Image.new("RGBA", (size, size), (255, 200, 60, 60))
    bg_img.putalpha(bg_glow)
    img = Image.alpha_composite(img, bg_img)
    
    draw = ImageDraw.Draw(img)
    
    # Ring
    for r in range(outer, inner, -1):
        alpha = int(150 * (1 - (outer - r) / (outer - inner) * 0.5))
        alpha = min(255, alpha)
        draw.ellipse([cx - r, cy - r, cx + r, cy + r],
                    outline=(255, 185, 30, alpha), width=2)
    
    # Bright inner ring
    draw.ellipse([cx - inner, cy - inner, cx + inner, cy + inner],
                outline=(255, 215, 60, 200), width=3)
    
    # Center bright spot
    draw.ellipse([cx - 4, cy - 4, cx + 4, cy + 4],
                fill=(255, 240, 180, 220))
    
    # Sparkle dots on ring
    for i in range(6):
        angle = math.pi * 2 * i / 6
        r_pos = (outer + inner) / 2
        sx = cx + int(r_pos * math.cos(angle))
        sy = cy + int(r_pos * math.sin(angle))
        draw.ellipse([sx - 2, sy - 2, sx + 2, sy + 2],
                    fill=(255, 255, 220, 200))
    
    return img


def draw_grass_tuft(size=128):
    """Draw a cartoon grass tuft"""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    cx, cy = size // 2, size // 2
    
    # Base dirt mound
    draw.ellipse([cx - 20, cy + 10, cx + 20, cy + 35],
                fill=(100, 70, 40, 200))
    draw.ellipse([cx - 18, cy + 12, cx + 18, cy + 32],
                fill=(130, 95, 55, 220))
    
    # Grass blades
    blades = [
        # (base_x, base_y, tip_dx, tip_dy, height)
        (cx - 12, cy + 15, -25, -55, 58),
        (cx - 4, cy + 10, -8, -62, 62),
        (cx + 5, cy + 10, 8, -60, 60),
        (cx + 13, cy + 12, 22, -50, 54),
        (cx + 0, cy + 12, 22, -48, 52),
        (cx - 8, cy + 12, -28, -45, 50),
        (cx + 8, cy + 10, -20, -52, 54),
    ]
    
    greens = [
        (85, 185, 60, 255),
        (100, 200, 65, 255),
        (70, 170, 50, 255),
        (95, 195, 55, 255),
        (110, 210, 70, 255),
        (80, 180, 55, 255),
        (105, 205, 60, 255),
    ]
    
    for i, (bx, by, tdx, tdy, h) in enumerate(blades):
        color = greens[i]
        # Draw as thick line with rounded end
        tip_x = bx + tdx
        tip_y = by + tdy
        pts = [
            (bx - 3, by),
            (bx + 3, by),
            (tip_x + 2, tip_y),
            (tip_x - 2, tip_y),
        ]
        draw.polygon(pts, fill=color)
        # rounded tip
        draw.ellipse([tip_x - 4, tip_y - 4, tip_x + 4, tip_y + 4],
                    fill=color)
        # highlight
        hl_color = (r + 20, g + 20, b + 15, 150) if (r := color[0]) and (g := color[1]) and (b := color[2]) else color
        draw.line([(bx, by), (tip_x, tip_y)], fill=(
            min(255, color[0] + 30),
            min(255, color[1] + 30),
            min(255, color[2] + 20),
            120
        ), width=1)
    
    return img


# =============================================
# GUIDES - post-process Gemini PNGs to add alpha
# =============================================

def remove_white_background(input_path, output_path, threshold=240):
    """Remove near-white background from an image, making it transparent"""
    img = Image.open(input_path).convert("RGBA")
    pixels = img.load()
    w, h = img.size
    
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if r >= threshold and g >= threshold and b >= threshold:
                # This is background, make transparent
                pixels[x, y] = (r, g, b, 0)
            elif r >= threshold - 30 and g >= threshold - 30 and b >= threshold - 30:
                # Semi-transparent edge antialiasing
                # Calculate distance from threshold
                max_val = max(r, g, b)
                alpha = int(255 * (threshold - max_val) / 30)
                alpha = max(0, min(255, alpha))
                pixels[x, y] = (r, g, b, alpha)
    
    img.save(output_path, "PNG")


# =============================================
# MAIN
# =============================================

if __name__ == "__main__":
    print("🎨 Generating particles programmatically...")
    
    particles = {
        "heart.png": draw_heart,
        "gem.png": draw_gem,
        "sparkle.png": draw_sparkle,
        "cloud.png": draw_cloud,
        "finger-glow.png": draw_finger_glow,
        "grass-tuft.png": draw_grass_tuft,
    }
    
    for filename, draw_fn in particles.items():
        path = os.path.join(OUT_DIR, "particles", filename)
        img = draw_fn(128)
        img.save(path, "PNG")
        size_kb = os.path.getsize(path) / 1024
        print(f"  ✅ {filename} ({size_kb:.1f} KB) - mode: {img.mode}")
    
    print("\n🖼️  Post-processing guides to add transparency...")
    
    guides_src = os.path.join(OUT_DIR, "guides")
    for filename in ["left-hand.png", "right-hand.png", "keyboard-zones.png"]:
        src = os.path.join(guides_src, filename)
        if os.path.exists(src):
            remove_white_background(src, src)
            size_kb = os.path.getsize(src) / 1024
            mode = Image.open(src).mode
            print(f"  ✅ {filename} ({size_kb:.1f} KB) - mode: {mode}")
        else:
            print(f"  ⚠️  {filename} not found, skipping")
    
    print("\n🎉 All done!")
