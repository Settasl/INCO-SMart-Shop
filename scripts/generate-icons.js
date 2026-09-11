import sharp from "sharp";
import fs from "fs";
import path from "path";

// Signature INCO brand palette from user specification
const BG_YELLOW = "#E2F800"; // Vibrant neon/chartreuse lime-yellow
const CHARCOAL = "#1F2126"; // Deep rich dark charcoal/black
const WHITE = "#FFFFFF";

// SVG representing the official INCO App Icon (as in user uploaded image)
const incoAppIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Filter for slight crispness and depth -->
    <filter id="incoCubeShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.12" />
    </filter>
  </defs>

  <!-- Electric Lime-Yellow Rounded App Icon Squircle Tile -->
  <rect width="512" height="512" rx="116" fill="${BG_YELLOW}" />

  <!-- Center Group: Mathematically and Optically Centered (offset x-6, y+16) -->
  <g transform="translate(-4, 18)">
    <!-- 3D Isometric Cube perched above 'i' -->
    <g filter="url(#incoCubeShadow)">
      <!-- Top Face (Bright Yellow with Charcoal Border) -->
      <polygon
        points="108,124 144,144 108,164 72,144"
        fill="${BG_YELLOW}"
        stroke="${CHARCOAL}"
        stroke-width="4.5"
        stroke-linejoin="round"
      />
      <!-- Left Charcoal Face -->
      <polygon
        points="72,144 108,164 108,210 72,190"
        fill="${CHARCOAL}"
        stroke="${CHARCOAL}"
        stroke-width="2"
        stroke-linejoin="round"
      />
      <!-- Right Charcoal Face -->
      <polygon
        points="108,164 144,144 144,190 108,210"
        fill="${CHARCOAL}"
        stroke="${CHARCOAL}"
        stroke-width="2"
        stroke-linejoin="round"
      />
      <!-- Signature Electric Yellow Checkmark on Right Face -->
      <path
        d="M 115 186 L 125 196 L 138 170"
        fill="none"
        stroke="${BG_YELLOW}"
        stroke-width="6.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </g>

    <!-- Letter 'i' Stem -->
    <rect
      x="93"
      y="226"
      width="30"
      height="114"
      rx="12"
      fill="${CHARCOAL}"
    />

    <!-- Letter 'n' -->
    <path
      d="M 152 340 L 152 238 M 152 266 C 152 236 172 224 196 224 C 220 224 240 238 240 268 L 240 340"
      fill="none"
      stroke="${CHARCOAL}"
      stroke-width="30"
      stroke-linecap="round"
      stroke-linejoin="round"
    />

    <!-- Letter 'c' -->
    <path
      d="M 344 254 C 331 236 313 224 288 224 C 253 224 233 252 233 282 C 233 314 253 340 288 340 C 313 340 331 328 344 310"
      fill="none"
      stroke="${CHARCOAL}"
      stroke-width="30"
      stroke-linecap="round"
      stroke-linejoin="round"
    />

    <!-- Letter 'o' -->
    <circle
      cx="410"
      cy="282"
      r="44"
      fill="none"
      stroke="${CHARCOAL}"
      stroke-width="30"
    />
  </g>
</svg>`;

async function generateAllIcons() {
  const publicDir = path.resolve("public");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // 1. Write public/icon.svg
  fs.writeFileSync(path.join(publicDir, "icon.svg"), incoAppIconSvg.trim());
  console.log("Saved public/icon.svg");

  const svgBuffer = Buffer.from(incoAppIconSvg);

  // 2. Generate 512x512 PNG
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, "icon-512.png"));
  console.log("Saved public/icon-512.png");

  // 3. Generate 192x192 PNG
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, "icon-192.png"));
  console.log("Saved public/icon-192.png");

  // 4. Generate 180x180 Apple Touch Icon
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, "apple-touch-icon.png"));
  console.log("Saved public/apple-touch-icon.png");

  // Also copy to dist if dist exists
  const distDir = path.resolve("dist");
  if (fs.existsSync(distDir)) {
    fs.writeFileSync(path.join(distDir, "icon.svg"), incoAppIconSvg.trim());
    await sharp(svgBuffer).resize(512, 512).png().toFile(path.join(distDir, "icon-512.png"));
    await sharp(svgBuffer).resize(192, 192).png().toFile(path.join(distDir, "icon-192.png"));
    await sharp(svgBuffer).resize(180, 180).png().toFile(path.join(distDir, "apple-touch-icon.png"));
    console.log("Updated dist icons");
  }

  console.log("All INCO App Icons generated successfully!");
}

generateAllIcons().catch((err) => {
  console.error("Error generating icons:", err);
  process.exit(1);
});
