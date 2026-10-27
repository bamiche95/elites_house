/**
 * Generates the brand's raster assets (PWA icons, collection art, product art,
 * hero/promo/OG images) from hand-built SVG compositions using sharp.
 *
 * Run with `npm run icons`. Output lives in /public so the app never depends on
 * external image hosts.
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const iconDir = path.join(root, "public", "icons");
const imageDir = path.join(root, "public", "images");

const palettes = {
  bundles: { from: "#241a15", to: "#5c4130", accent: "#d3ac74", label: "Bundles" },
  wigs: { from: "#1a1210", to: "#3d2a23", accent: "#e2c49b", label: "Wigs" },
  closures: { from: "#2b1e18", to: "#513a2c", accent: "#c9a679", label: "Closures" },
  frontals: { from: "#14100e", to: "#352520", accent: "#eed6b3", label: "Frontals" },
  accessories: { from: "#3a2a22", to: "#7a5c46", accent: "#f0dcbd", label: "Accessories" },
  hero: { from: "#171110", to: "#3a2a22", accent: "#d9b98b", label: "Human Hair Atelier" },
  promo: { from: "#2a201a", to: "#6c5140", accent: "#e3c69b", label: "The Bundle Edit" },
  p1: { from: "#201713", to: "#4a3325", accent: "#d7b184", label: "Bone Straight" },
  p2: { from: "#1d1512", to: "#463026", accent: "#e0bd93", label: "Body Wave" },
  p3: { from: "#221814", to: "#4f3629", accent: "#c9a276", label: "Kinky Curly" },
  p4: { from: "#191210", to: "#3c2a21", accent: "#e6c9a2", label: "Deep Wave" },
  p5: { from: "#241b16", to: "#57402f", accent: "#d3ad7c", label: "Loose Wave" },
  p6: { from: "#1b1411", to: "#41302a", accent: "#ecd0a8", label: "HD Lace" },
};

const strands = (accent, seed = 1) => {
  const lines = [];
  for (let i = 0; i < 16; i += 1) {
    const offset = 40 + i * 68 + ((seed * 17) % 40);
    const sway = 120 + ((i * seed * 37) % 220);
    const opacity = 0.1 + (i % 5) * 0.055;
    lines.push(
      `<path d="M ${-80 + i * 62} 1700 C ${sway} ${1280 - i * 22}, ${sway + 180} ${
        900 - i * 14
      }, ${offset} ${520 - i * 12} S ${sway - 90} 180, ${offset + 120} -80" fill="none" stroke="${accent}" stroke-width="${
        1 + (i % 3)
      }" stroke-linecap="round" opacity="${opacity.toFixed(3)}" />`,
    );
  }
  return lines.join("");
};

function artSvg({ id, width, height, from, to, accent, label = "", compact = false }) {
  const gradId = `bg-${id}`;
  const glowId = `glow-${id}`;
  const noiseId = `noise-${id}`;
  const type = compact ? Math.round(width * 0.2) : Math.round(width * 0.075);
  const eyebrow = compact ? 0 : Math.round(width * 0.017);
  const pad = Math.round(width * 0.07);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="${gradId}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${from}" />
      <stop offset="55%" stop-color="${to}" />
      <stop offset="100%" stop-color="${from}" />
    </linearGradient>
    <radialGradient id="${glowId}" cx="50%" cy="42%" r="60%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.42" />
      <stop offset="60%" stop-color="${accent}" stop-opacity="0.08" />
      <stop offset="100%" stop-color="${accent}" stop-opacity="0" />
    </radialGradient>
    <filter id="${noiseId}" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch" />
      <feColorMatrix type="saturate" values="0" />
    </filter>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#${gradId})" />
  <rect width="${width}" height="${height}" fill="url(#${glowId})" />
  <g opacity="0.95">${strands(accent, id.length + 3)}</g>
  <rect width="${width}" height="${height}" filter="url(#${noiseId})" opacity="0.06" />
  <rect x="${pad / 2}" y="${pad / 2}" width="${width - pad}" height="${height - pad}" fill="none" stroke="${accent}" stroke-opacity="0.28" />
  ${
    compact
      ? `<text x="50%" y="53%" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="${type}" fill="${accent}" letter-spacing="${Math.round(width * 0.02)}">LT</text>`
      : `<text x="${pad}" y="${height - pad - type * 1.6}" font-family="ui-sans-serif, 'Segoe UI', Arial, sans-serif" font-size="${eyebrow}" letter-spacing="${Math.round(eyebrow * 0.42)}" fill="${accent}" opacity="0.85">LUSH TRESSES</text>
  <text x="${pad}" y="${height - pad - type * 0.35}" font-family="Georgia, 'Times New Roman', serif" font-size="${type}" fill="#fbf7f1">${label}</text>`
  }
</svg>`;
}


async function render(name, dir, svgOpts) {
  const file = path.join(dir, name);
  const pipeline = sharp(Buffer.from(artSvg(svgOpts)), { density: 144 });
  if (name.endsWith(".jpg")) {
    // Photography-style art compresses far better as JPEG than as noisy PNG.
    await pipeline.jpeg({ quality: 82, mozjpeg: true, progressive: true }).toFile(file);
  } else {
    await pipeline.png({ quality: 92 }).toFile(file);
  }
  return file;
}

async function main() {
  await mkdir(iconDir, { recursive: true });
  await mkdir(imageDir, { recursive: true });

  const p = palettes;

  const iconBase = {
    id: "icon",
    width: 512,
    height: 512,
    ...p.bundles,
    label: "",
    compact: true,
  };
  await render("icon-512.png", iconDir, iconBase);
  await render("icon-192.png", iconDir, { ...iconBase, width: 192, height: 192 });
  await render("icon-maskable-512.png", iconDir, {
    ...iconBase,
    id: "maskable",
    from: "#17110e",
    to: "#2a1f18",
  });
  await render("apple-touch-icon.png", iconDir, {
    ...iconBase,
    id: "apple",
    width: 180,
    height: 180,
  });
  await render("favicon-32.png", iconDir, { ...iconBase, id: "favicon", width: 32, height: 32 });

  for (const key of ["bundles", "wigs", "closures", "frontals", "accessories"]) {
    await render(`collection-${key}.jpg`, imageDir, {
      id: key,
      width: 1200,
      height: 1500,
      ...p[key],
    });
  }

  for (const key of ["p1", "p2", "p3", "p4", "p5", "p6"]) {
    await render(`product-${key}.jpg`, imageDir, {
      id: key,
      width: 1200,
      height: 1500,
      ...p[key],
    });
  }

  await render("hero.jpg", imageDir, { id: "hero", width: 1600, height: 1200, ...p.hero });
  await render("promo.jpg", imageDir, { id: "promo", width: 1600, height: 1000, ...p.promo });
  await render("og-default.jpg", imageDir, {
    id: "og",
    width: 1200,
    height: 630,
    ...p.hero,
    label: "Luxury Human Hair",
  });
  await render("about-atelier.jpg", imageDir, {
    id: "about",
    width: 1400,
    height: 1000,
    ...p.accessories,
    label: "The Atelier",
  });

  console.log("✓ Generated PWA icons and editorial placeholder art in /public");
}

main().catch((error) => {
  console.error("Failed to generate assets:", error);
  process.exit(1);
});
