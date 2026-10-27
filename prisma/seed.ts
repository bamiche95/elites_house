/**
 * LushTresses seed data.
 *
 * Run with `npm run db:seed` (idempotent: resets store data first).
 * Creates the catalogue, CMS content, demo accounts, coupons and sample orders.
 */
import { PrismaClient, type Prisma, type Texture } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@lushtresses.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "LushAdmin2026!";
const CUSTOMER_EMAIL = process.env.SEED_CUSTOMER_EMAIL ?? "customer@example.com";
const CUSTOMER_PASSWORD = process.env.SEED_CUSTOMER_PASSWORD ?? "LushCustomer2026!";

const daysFromNow = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

type VariantSeed = {
  label: string;
  lengthInches?: number;
  pricePence: number;
  compareAtPricePence?: number;
  stock: number;
  sku: string;
};

type ProductSeed = {
  slug: string;
  name: string;
  subtitle: string;
  category: string;
  texture: Texture;
  description: string;
  details: string;
  images: string[];
  tags: string[];
  isFeatured?: boolean;
  isBestSeller?: boolean;
  variants: VariantSeed[];
};

const lengthPrices = (lengths: number[], base: number) => {
  const map: Record<number, number> = {};
  lengths.forEach((length, index) => {
    map[length] = base + index * 1800;
  });
  return map;
};

const bundleVariants = (
  skuBase: string,
  lengths: number[],
  base: number,
  compareAtBase?: number,
): VariantSeed[] => {
  const prices = lengthPrices(lengths, base);
  return lengths.map((length, index) => ({
    label: `${length}"`,
    lengthInches: length,
    pricePence: prices[length],
    compareAtPricePence: compareAtBase ? compareAtBase + index * 1800 : undefined,
    stock: 6 + ((length * 3) % 18),
    sku: `${skuBase}-${length}`,
  }));
};

const categories = [
  {
    slug: "bundles",
    name: "Bundles",
    tagline: "The foundation of every install",
    description:
      "Double-drawn, cuticle-aligned bundles in six signature textures. Every bundle is weighed and checked by hand in our London atelier.",
    imageUrl: "/images/collection-bundles.jpg",
    position: 1,
  },
  {
    slug: "wigs",
    name: "Wigs",
    tagline: "Glueless, HD lace, ready to wear",
    description:
      "Pre-plucked, pre-bleached and beginner-friendly. Our HD lace melts into every skin tone with no glue required.",
    imageUrl: "/images/collection-wigs.jpg",
    position: 2,
  },
  {
    slug: "closures",
    name: "Closures",
    tagline: "A flawless parting, every time",
    description:
      "5x5 HD closures with a realistic hairline and consistent density from root to tip.",
    imageUrl: "/images/collection-closures.jpg",
    position: 3,
  },
  {
    slug: "frontals",
    name: "Frontals",
    tagline: "Ear-to-ear melt",
    description:
      "13x4 and 13x6 HD frontals with invisible knots, made for effortless styling versatility.",
    imageUrl: "/images/collection-frontals.jpg",
    position: 4,
  },
  {
    slug: "accessories",
    name: "Accessories",
    tagline: "The finishing touches",
    description:
      "Satin, silk and edge essentials that protect your install and extend the life of your hair.",
    imageUrl: "/images/collection-accessories.jpg",
    position: 5,
  },
];

const products: ProductSeed[] = [
  {
    slug: "silk-press-bone-straight-bundle",
    name: "Silk Press Bone Straight Bundle",
    subtitle: "Mirror-smooth, zero shedding",
    category: "bundles",
    texture: "BONE_STRAIGHT",
    description:
      "Our best-selling bone straight is double-drawn from root to tip for a mirror-smooth finish that holds a press. Cuticles are aligned in one direction, so it stays glossy, tangle-free and true to length wash after wash.",
    details:
      "100% Remy human hair, 150g per bundle\nDouble-drawn with a full, even hem\nCan be coloured up to three shades lighter\nExpected lifespan: 12–18 months with care\nBundles are sold individually — we recommend three for a full install",
    images: ["/images/product-p1.jpg", "/images/collection-bundles.jpg"],
    tags: ["bone straight", "silk press", "bundle", "best seller"],
    isFeatured: true,
    isBestSeller: true,
    variants: bundleVariants("LT-BS", [16, 18, 20, 22, 24, 26, 28, 30], 9500, 12000),
  },
  {
    slug: "liquid-body-wave-bundle",
    name: "Liquid Body Wave Bundle",
    subtitle: "Soft, bouncy, endlessly wearable",
    category: "bundles",
    texture: "BODY_WAVE",
    description:
      "A loose, fluid wave that falls back into place with a shake. Our body wave is the most versatile texture in the atelier — wear it sleek, scrunched or wand-curled without losing the pattern.",
    details:
      "100% Remy human hair, 150g per bundle\nSteam-set wave that returns after washing\nTakes colour and heat beautifully\nExpected lifespan: 12–18 months with care\nPair with a 5x5 closure for a seamless finish",
    images: ["/images/product-p2.jpg", "/images/collection-bundles.jpg"],
    tags: ["body wave", "bundle", "versatile", "best seller"],
    isBestSeller: true,
    isFeatured: true,
    variants: bundleVariants("LT-BW", [14, 16, 18, 20, 22, 24, 26, 28, 30], 8800, 11000),
  },
  {
    slug: "atelier-kinky-curly-bundle",
    name: "Atelier Kinky Curly Bundle",
    subtitle: "Defined coils with real volume",
    category: "bundles",
    texture: "KINKY_CURLY",
    description:
      "A true 4A/4B-inspired coil with a soft, springy hand-feel. Steam-set in small batches so the curl pattern stays defined and doesn't collapse into frizz.",
    details:
      "100% Remy human hair, 150g per bundle\nCoil pattern: 4A/4B\nBest styled with a leave-in and curl cream\nExpected lifespan: 12–18 months with care\nShrinkage of up to 30% is normal for this texture",
    images: ["/images/product-p3.jpg", "/images/collection-bundles.jpg"],
    tags: ["kinky curly", "coils", "natural texture", "bundle"],
    isFeatured: true,
    variants: bundleVariants("LT-KC", [14, 16, 18, 20, 22, 24, 26, 28], 9800, 12500),
  },
  {
    slug: "sculpted-deep-wave-bundle",
    name: "Sculpted Deep Wave Bundle",
    subtitle: "High-shine, camera-ready waves",
    category: "bundles",
    texture: "DEEP_WAVE",
    description:
      "Defined, architectural waves with a glass-like shine. Deep wave holds its shape beautifully for event styling and softens into a romantic loose wave after a few washes.",
    details:
      "100% Remy human hair, 150g per bundle\nDeep, steam-set wave pattern\nLoves a mousse or foam for definition\nExpected lifespan: 12–18 months with care\nDetangle with a wide-tooth comb while damp",
    images: ["/images/product-p4.jpg", "/images/collection-bundles.jpg"],
    tags: ["deep wave", "bundle", "glam"],
    variants: bundleVariants("LT-DW", [16, 18, 20, 22, 24, 26, 28, 30], 9200, 11500),
  },
  {
    slug: "brushed-loose-wave-bundle",
    name: "Brushed Loose Wave Bundle",
    subtitle: "Undone, off-duty glamour",
    category: "bundles",
    texture: "LOOSE_WAVE",
    description:
      "The texture that looks like a very good blow-dry. Loose wave brushes out into a soft, full body with just enough movement to catch the light.",
    details:
      "100% Remy human hair, 150g per bundle\nSoft, brushed-out wave\nBlends seamlessly with relaxed hair\nExpected lifespan: 12–18 months with care\nSold per bundle — three recommended for a full head",
    images: ["/images/product-p5.jpg", "/images/collection-bundles.jpg"],
    tags: ["loose wave", "bundle", "everyday"],
    variants: bundleVariants("LT-LW", [14, 16, 18, 20, 22, 24, 26, 28], 8900, 10800),
  },
  {
    slug: "everyday-natural-wave-bundle",
    name: "Everyday Natural Wave Bundle",
    subtitle: "Beachy texture, no styling required",
    category: "bundles",
    texture: "NATURAL_WAVE",
    description:
      "A subtle, beachy wave for days when you want length without effort. Air-dries beautifully and holds a light curl when you want something softer.",
    details:
      "100% Remy human hair, 150g per bundle\nLight, natural wave pattern\nAir-dry friendly\nExpected lifespan: 12–18 months with care\nPerfect for protective styles and low-maintenance routines",
    images: ["/images/product-p5.jpg", "/images/product-p1.jpg"],
    tags: ["natural wave", "bundle", "low maintenance"],
    variants: bundleVariants("LT-NW", [14, 16, 18, 20, 22, 24, 26], 8600, 10400),
  },
  {
    slug: "signature-bundle-trio",
    name: "The Signature Trio",
    subtitle: "Three bundles, one flawless install",
    category: "bundles",
    texture: "BONE_STRAIGHT",
    description:
      "Our most-loved lengths, bundled together at a considered price. Each trio includes three full bundles of our Silk Press bone straight, hand-matched for colour and density so the install blends invisibly.",
    details:
      "Three full bundles (450g total), hand-matched\n100% Remy human hair, double-drawn\nSave up to 22% versus buying separately\nIncludes a satin scrunchie and care card\nAvailable in three length combinations",
    images: ["/images/product-p1.jpg", "/images/collection-bundles.jpg"],
    tags: ["bundle deal", "trio", "bone straight", "value"],
    isFeatured: true,
    isBestSeller: true,
    variants: [
      {
        label: '16" / 18" / 20"',
        lengthInches: 20,
        pricePence: 26900,
        compareAtPricePence: 34200,
        stock: 12,
        sku: "LT-TRIO-161820",
      },
      {
        label: '18" / 20" / 22"',
        lengthInches: 22,
        pricePence: 29900,
        compareAtPricePence: 38400,
        stock: 9,
        sku: "LT-TRIO-182022",
      },
      {
        label: '20" / 22" / 24"',
        lengthInches: 24,
        pricePence: 32900,
        compareAtPricePence: 43200,
        stock: 7,
        sku: "LT-TRIO-202224",
      },
    ],
  },
  {
    slug: "goddess-glueless-hd-lace-wig",
    name: "Goddess Glueless HD Lace Wig",
    subtitle: "Body wave, pre-plucked, ready to wear",
    category: "wigs",
    texture: "BODY_WAVE",
    description:
      "The wig our clients ask for by name. A 13x4 HD lace front with a pre-plucked, pre-bleached hairline, adjustable straps and a breathable cap — no glue, no salon appointment, no compromise.",
    details:
      "13x4 HD Swiss lace, ear-to-ear\n180% density with a natural hairline\nPre-plucked and pre-bleached knots\nAdjustable straps and elastic band included\nFits cap sizes 21.5\" – 23.5\" (medium, adjustable)\n100% Remy human hair — colour and heat safe",
    images: ["/images/product-p2.jpg", "/images/product-p6.jpg", "/images/collection-wigs.jpg"],
    tags: ["wig", "glueless", "HD lace", "body wave", "best seller"],
    isFeatured: true,
    isBestSeller: true,
    variants: [
      { label: '18" · 13x4 HD lace', lengthInches: 18, pricePence: 39900, compareAtPricePence: 47900, stock: 6, sku: "LT-WIG-GOD-18" },
      { label: '20" · 13x4 HD lace', lengthInches: 20, pricePence: 43900, compareAtPricePence: 51900, stock: 5, sku: "LT-WIG-GOD-20" },
      { label: '22" · 13x4 HD lace', lengthInches: 22, pricePence: 47900, compareAtPricePence: 56900, stock: 3, sku: "LT-WIG-GOD-22" },
      { label: '24" · 13x4 HD lace', lengthInches: 24, pricePence: 52900, compareAtPricePence: 62900, stock: 2, sku: "LT-WIG-GOD-24" },
    ],
  },
  {
    slug: "aurora-bone-straight-hd-lace-wig",
    name: "Aurora Bone Straight HD Lace Wig",
    subtitle: "Glass-sleek, glueless, zero effort",
    category: "wigs",
    texture: "BONE_STRAIGHT",
    description:
      "A mirror-finish bob-to-long wig with a 13x6 HD lace frontal for deep side partings. The cap is hand-tied and breathable, so it stays comfortable through a full day and long into the night.",
    details:
      "13x6 HD Swiss lace frontal\n200% density with a sleek, flat finish\nPre-plucked hairline and bleached knots\nBreathable hand-tied cap with adjustable straps\nFits cap sizes 21.5\" – 23.5\"\nHeat safe up to 210°C",
    images: ["/images/product-p1.jpg", "/images/product-p6.jpg", "/images/collection-wigs.jpg"],
    tags: ["wig", "bone straight", "HD lace", "sleek"],
    isFeatured: true,
    variants: [
      { label: '16" · 13x6 HD lace', lengthInches: 16, pricePence: 34900, compareAtPricePence: 41900, stock: 7, sku: "LT-WIG-AUR-16" },
      { label: '18" · 13x6 HD lace', lengthInches: 18, pricePence: 37900, compareAtPricePence: 44900, stock: 6, sku: "LT-WIG-AUR-18" },
      { label: '20" · 13x6 HD lace', lengthInches: 20, pricePence: 41900, compareAtPricePence: 49900, stock: 4, sku: "LT-WIG-AUR-20" },
      { label: '22" · 13x6 HD lace', lengthInches: 22, pricePence: 45900, compareAtPricePence: 53900, stock: 2, sku: "LT-WIG-AUR-22" },
    ],
  },
  {
    slug: "nia-kinky-curly-u-part-wig",
    name: "Nia Kinky Curly U-Part Wig",
    subtitle: "Blend-and-go curls for natural hair",
    category: "wigs",
    texture: "KINKY_CURLY",
    description:
      "A U-part wig designed to blend with your own leave-out. The coiled texture matches 4A/4B hair beautifully, with combs and adjustable straps for a secure, glueless fit.",
    details:
      "U-part construction with a 4\" x 4\" leave-out\n180% density, steam-set 4A/4B coils\nThree combs and adjustable straps\nNo glue or lace required\n100% Remy human hair\nBest styled with a curl cream for definition",
    images: ["/images/product-p3.jpg", "/images/collection-wigs.jpg"],
    tags: ["wig", "kinky curly", "u-part", "protective style"],
    isBestSeller: true,
    variants: [
      { label: '16" · U-part', lengthInches: 16, pricePence: 31900, compareAtPricePence: 38900, stock: 5, sku: "LT-WIG-NIA-16" },
      { label: '18" · U-part', lengthInches: 18, pricePence: 34900, compareAtPricePence: 41900, stock: 4, sku: "LT-WIG-NIA-18" },
      { label: '20" · U-part', lengthInches: 20, pricePence: 38900, compareAtPricePence: 45900, stock: 3, sku: "LT-WIG-NIA-20" },
    ],
  },
  {
    slug: "hd-5x5-body-wave-closure",
    name: "HD 5x5 Body Wave Closure",
    subtitle: "A parting that disappears",
    category: "closures",
    texture: "BODY_WAVE",
    description:
      "A 5x5 HD lace closure with a hand-tied, pre-plucked hairline. The larger silk-base area gives you room to part, swoop or style a deep side without exposing knots.",
    details:
      "5\" x 5\" HD Swiss lace\nPre-plucked, bleached knots\n150% density, 100% Remy human hair\nMatches our Liquid Body Wave bundles\nWe recommend a licensed stylist for install",
    images: ["/images/product-p6.jpg", "/images/collection-closures.jpg"],
    tags: ["closure", "5x5", "body wave", "HD lace"],
    isFeatured: true,
    variants: [
      { label: '14" · 5x5 HD lace', lengthInches: 14, pricePence: 12900, compareAtPricePence: 14900, stock: 9, sku: "LT-CLO-BW-14" },
      { label: '16" · 5x5 HD lace', lengthInches: 16, pricePence: 13900, compareAtPricePence: 15900, stock: 8, sku: "LT-CLO-BW-16" },
      { label: '18" · 5x5 HD lace', lengthInches: 18, pricePence: 14900, compareAtPricePence: 17900, stock: 6, sku: "LT-CLO-BW-18" },
      { label: '20" · 5x5 HD lace', lengthInches: 20, pricePence: 15900, compareAtPricePence: 18900, stock: 4, sku: "LT-CLO-BW-20" },
    ],
  },
  {
    slug: "hd-5x5-bone-straight-closure",
    name: "HD 5x5 Bone Straight Closure",
    subtitle: "Sleek, flat and undetectable",
    category: "closures",
    texture: "BONE_STRAIGHT",
    description:
      "Built to sit flush with our Silk Press bundles. This closure is bleached and plucked by hand, with a fine HD lace that takes on your skin tone in natural light.",
    details:
      "5\" x 5\" HD Swiss lace\nPre-plucked hairline, bleached knots\n150% density, 100% Remy human hair\nPairs with our Silk Press Bone Straight bundles\nHeat safe up to 200°C",
    images: ["/images/product-p1.jpg", "/images/collection-closures.jpg"],
    tags: ["closure", "5x5", "bone straight", "HD lace"],
    variants: [
      { label: '14" · 5x5 HD lace', lengthInches: 14, pricePence: 11900, compareAtPricePence: 13900, stock: 10, sku: "LT-CLO-BS-14" },
      { label: '16" · 5x5 HD lace', lengthInches: 16, pricePence: 12900, compareAtPricePence: 14900, stock: 8, sku: "LT-CLO-BS-16" },
      { label: '18" · 5x5 HD lace', lengthInches: 18, pricePence: 13900, compareAtPricePence: 16900, stock: 5, sku: "LT-CLO-BS-18" },
      { label: '20" · 5x5 HD lace', lengthInches: 20, pricePence: 14900, compareAtPricePence: 17900, stock: 3, sku: "LT-CLO-BS-20" },
    ],
  },
  {
    slug: "hd-13x4-bone-straight-frontal",
    name: "HD 13x4 Bone Straight Frontal",
    subtitle: "Ear-to-ear melt, zero glue lines",
    category: "frontals",
    texture: "BONE_STRAIGHT",
    description:
      "An ear-to-ear 13x4 frontal with a pre-plucked hairline and invisible knots. Made to be installed with an elastic band method or a light lace adhesive, with room for a middle or side part.",
    details:
      "13\" x 4\" HD Swiss lace\nPre-plucked and pre-bleached by hand\n150% density, 100% Remy human hair\nMatches our Silk Press Bone Straight bundles\nProfessional install recommended",
    images: ["/images/product-p6.jpg", "/images/collection-frontals.jpg"],
    tags: ["frontal", "13x4", "bone straight", "HD lace"],
    isFeatured: true,
    variants: [
      { label: '14" · 13x4 HD lace', lengthInches: 14, pricePence: 14900, compareAtPricePence: 17900, stock: 8, sku: "LT-FRO-BS-14" },
      { label: '16" · 13x4 HD lace', lengthInches: 16, pricePence: 15900, compareAtPricePence: 18900, stock: 7, sku: "LT-FRO-BS-16" },
      { label: '18" · 13x4 HD lace', lengthInches: 18, pricePence: 16900, compareAtPricePence: 19900, stock: 5, sku: "LT-FRO-BS-18" },
      { label: '20" · 13x4 HD lace', lengthInches: 20, pricePence: 17900, compareAtPricePence: 20900, stock: 3, sku: "LT-FRO-BS-20" },
    ],
  },
  {
    slug: "hd-13x6-body-wave-frontal",
    name: "HD 13x6 Body Wave Frontal",
    subtitle: "Deeper parting space, softer melt",
    category: "frontals",
    texture: "BODY_WAVE",
    description:
      "Extra parting space, extra versatility. The 13x6 HD lace gives you a deeper side part and a hairline that blends into the skin without a visible edge.",
    details:
      "13\" x 6\" HD Swiss lace\nPre-plucked hairline with bleached knots\n150% density, 100% Remy human hair\nMatches our Liquid Body Wave bundles\nInstall with a stylist for the cleanest melt",
    images: ["/images/product-p2.jpg", "/images/collection-frontals.jpg"],
    tags: ["frontal", "13x6", "body wave", "HD lace"],
    isBestSeller: true,
    variants: [
      { label: '16" · 13x6 HD lace', lengthInches: 16, pricePence: 18900, compareAtPricePence: 21900, stock: 6, sku: "LT-FRO-BW-16" },
      { label: '18" · 13x6 HD lace', lengthInches: 18, pricePence: 19900, compareAtPricePence: 22900, stock: 5, sku: "LT-FRO-BW-18" },
      { label: '20" · 13x6 HD lace', lengthInches: 20, pricePence: 20900, compareAtPricePence: 23900, stock: 4, sku: "LT-FRO-BW-20" },
      { label: '22" · 13x6 HD lace', lengthInches: 22, pricePence: 21900, compareAtPricePence: 24900, stock: 2, sku: "LT-FRO-BW-22" },
    ],
  },
  {
    slug: "satin-edge-scarf",
    name: "Satin Edge Scarf",
    subtitle: "Lay your edges without the frizz",
    category: "accessories",
    texture: "NATURAL_WAVE",
    description:
      "A wide satin scarf that holds edges flat while you get ready — and doubles as a protective wrap at night. The satin weave is gentle on hairlines and won't pill after washing.",
    details:
      "100% satin polyester, 90cm x 90cm\nMachine washable at 30°C\nDesigned to tie without creasing\nOne size",
    images: ["/images/collection-accessories.jpg", "/images/product-p5.jpg"],
    tags: ["accessory", "satin", "edges", "gift"],
    variants: [
      { label: "One size · Espresso", pricePence: 1800, compareAtPricePence: 2400, stock: 42, sku: "LT-ACC-SCARF-ESPRESSO" },
      { label: "One size · Champagne", pricePence: 1800, compareAtPricePence: 2400, stock: 28, sku: "LT-ACC-SCARF-CHAMPAGNE" },
    ],
  },
  {
    slug: "mulberry-silk-pillowcase",
    name: "Mulberry Silk Pillowcase",
    subtitle: "22-momme silk for hair and skin",
    category: "accessories",
    texture: "NATURAL_WAVE",
    description:
      "The single easiest upgrade for your hair's longevity. Pure 22-momme mulberry silk reduces friction, so your install keeps its moisture, shine and style overnight.",
    details:
      "100% 22-momme mulberry silk, OEKO-TEX certified\nHidden zip closure\nMachine washable on a delicate cycle\nStandard: 50cm x 75cm · King: 50cm x 90cm",
    images: ["/images/collection-accessories.jpg", "/images/product-p6.jpg"],
    tags: ["accessory", "silk", "gift", "hair care"],
    isFeatured: true,
    variants: [
      { label: "Standard · 50 × 75cm", pricePence: 4500, compareAtPricePence: 5900, stock: 24, sku: "LT-ACC-SILK-STD" },
      { label: "King · 50 × 90cm", pricePence: 5200, compareAtPricePence: 6600, stock: 16, sku: "LT-ACC-SILK-KING" },
    ],
  },
  {
    slug: "wig-grip-band",
    name: "Wig Grip Band",
    subtitle: "No glue, no slipping",
    category: "accessories",
    texture: "NATURAL_WAVE",
    description:
      "A soft, velcro-adjusted grip band that holds glueless wigs and frontals in place without tension. The silicone-backed velvet stays put through a full day.",
    details:
      "Velvet exterior, silicone grip interior\nAdjustable velcro fastening\nOne size fits most\nHand wash only",
    images: ["/images/collection-accessories.jpg", "/images/product-p1.jpg"],
    tags: ["accessory", "wig care", "glueless"],
    variants: [
      { label: "One size · Black", pricePence: 1200, compareAtPricePence: 1600, stock: 55, sku: "LT-ACC-GRIP-BLACK" },
    ],
  },
  {
    slug: "edge-control-kit",
    name: "Edge Control Kit",
    subtitle: "Strong hold, zero flaking",
    category: "accessories",
    texture: "NATURAL_WAVE",
    description:
      "Everything you need for a clean hairline: a flake-free edge control, a soft-bristle brush and a satin scarf to set it. Formulated without drying alcohols.",
    details:
      "Edge control 60ml, soft brush and mini satin scarf\nStrong, flexible hold with no white residue\nFree from drying alcohols and parabens\nMade in the UK",
    images: ["/images/collection-accessories.jpg", "/images/product-p2.jpg"],
    tags: ["accessory", "edges", "gift"],
    variants: [
      { label: "Complete kit", pricePence: 2400, compareAtPricePence: 2900, stock: 30, sku: "LT-ACC-EDGE-KIT" },
    ],
  },
];

const pages = [
  {
    slug: "about",
    title: "Our story",
    excerpt:
      "A London atelier built on a simple belief: luxury hair should behave like your own.",
    heroImage: "/images/about-atelier.jpg",
    metaTitle: "About LushTresses — A London Human Hair Atelier",
    metaDescription:
      "Meet the London atelier behind LushTresses: ethically sourced Remy human hair, hand-finished bundles and HD lace wigs.",
    position: 1,
    content: `## Hair, considered.

LushTresses began in a small studio off Portobello Road with three textures, a hand-held steamer and a stubborn belief: luxury hair should behave like your own — no shedding, no matting, no surprises.

We buy in small batches from a single, long-standing supplier and we turn most lots away. Every bundle is checked for cuticle alignment, weighed to the gram and steamed by hand. If it doesn't pass, it doesn't ship.

## What we mean by "atelier"

An atelier is a workshop, not a warehouse. That distinction shapes everything:

- **Small batches.** We restock in considered quantities so the hair you reorder matches the hair you loved.
- **Hand finishing.** Hairlines are plucked and knots bleached by hand, not by machine.
- **Real people.** Our team answers your emails, checks your order and packs it.

## Our promise

If a bundle isn't what you expected, tell us within 30 days of delivery and we'll make it right — repair, replace or refund. We'd rather have a loyal client than a quick sale.

Visit us at the studio by appointment, or write to us any time. We answer every message within one working day.`,
  },
  {
    slug: "shipping",
    title: "Shipping & delivery",
    excerpt: "Tracked UK delivery, free over £150, with international options.",
    metaTitle: "Shipping & Delivery",
    metaDescription:
      "Free tracked UK delivery on orders over £150. Express next-day options and international shipping with full tracking.",
    position: 2,
    content: `## UK delivery

- **Standard tracked delivery** — £4.95, or free on orders over £150. Royal Mail Tracked 48, arriving in 2–4 working days.
- **Express next-day delivery** — £9.95. Order before 2pm Monday–Friday for delivery the next working day (UK mainland).

All UK parcels require a signature. If you're not in, the courier will leave a card with collection details.

## International delivery

We ship worldwide with tracked services. Rates are calculated at checkout based on destination and weight. Import duties and taxes are the responsibility of the recipient.

## Dispatch times

Orders placed before 2pm are packed the same working day. Orders placed after 2pm, at weekends or on bank holidays are packed the next working day.

You'll receive a dispatch email with a tracking number as soon as your parcel leaves the atelier. You can also track every order from your account.

## Packaging

Your hair arrives wrapped in acid-free tissue inside a reusable satin pouch, with a care card and a length guide. Gift notes are complimentary — add one at checkout.`,
  },
  {
    slug: "returns",
    title: "Returns & exchanges",
    excerpt: "30 days, clear conditions, no restocking fees.",
    metaTitle: "Returns & Exchanges",
    metaDescription:
      "Our 30-day returns policy for human hair bundles, wigs, closures and frontals. Clear conditions and no restocking fees.",
    position: 3,
    content: `## 30-day returns

We accept returns within 30 days of delivery, provided the hair is unworn, unwashed and in its original packaging with the security seal intact. For hygiene reasons, we cannot accept hair that has been installed, cut, coloured or removed from its ties.

## How to start a return

1. Email hello@lushtresses.com with your order number and the reason for your return.
2. We'll send a returns authorisation and a prepaid label where applicable.
3. Pack the hair in its original packaging and drop it at your nearest Post Office.

Refunds are processed within 3–5 working days of the parcel reaching us, to the original payment method.

## Exchanges

If you'd prefer a different length or texture, tell us in your email and we'll reserve the replacement while your return is in transit. Exchanges are subject to stock availability.

## Faulty items

If your hair arrives defective, contact us within 7 days with photographs. We'll arrange a replacement or a full refund, including return postage.

## Sale items

Sale items are eligible for return unless marked "final sale" on the product page.`,
  },
  {
    slug: "payment-info",
    title: "Payment options",
    excerpt: "Card, Apple Pay, Google Pay and PayPal — all securely processed.",
    metaTitle: "Payment Options",
    metaDescription:
      "Pay by card, Apple Pay, Google Pay or PayPal. Secure, encrypted payments with 3-D Secure where required.",
    position: 4,
    content: `## How you can pay

- **Card** — Visa, Mastercard and American Express via Stripe.
- **Apple Pay and Google Pay** — available on supported devices at checkout.
- **PayPal** — pay with your PayPal balance or a linked card.

We never store card details on our servers. Payments are processed by Stripe and PayPal, both PCI-DSS Level 1 providers.

## Currency

All prices are charged in GBP. If you're shopping from outside the UK, your bank may apply a conversion fee.

## When you're charged

Your payment is captured when the order is confirmed. If a payment provider needs extra verification (3-D Secure), you'll be redirected to your bank.

## Refunds

Refunds return to the original payment method within 3–5 working days of approval. Your bank may take a little longer to display it.`,
  },
  {
    slug: "privacy",
    title: "Privacy policy",
    excerpt: "What we collect, why we collect it, and the choices you have.",
    metaTitle: "Privacy Policy",
    metaDescription:
      "How LushTresses collects, uses and protects your personal data under UK GDPR.",
    position: 5,
    content: `## Who we are

LushTresses is a UK-registered hair atelier and the data controller for information collected through this website.

## What we collect

- **Order information** — name, email, phone, delivery address and order history.
- **Account information** — name, email, hashed password and saved addresses.
- **Payment information** — handled entirely by Stripe and PayPal. We only see the last four digits and the outcome.
- **Usage information** — anonymised analytics that help us improve the store.

## Why we use it

To fulfil orders, provide customer support, prevent fraud, and — where you've opted in — send occasional emails about restocks and new arrivals. You can unsubscribe from any email in one click.

## How long we keep it

Order records are kept for six years to meet UK accounting requirements. Marketing consents are kept until you withdraw them. Accounts that haven't been used for three years are deleted.

## Your rights

You can request access, correction, export or deletion of your data at any time by emailing hello@lushtresses.com. You also have the right to complain to the Information Commissioner's Office.

## Cookies

We use strictly necessary cookies (session, basket and security) and optional analytics cookies. You can block cookies in your browser, though parts of checkout may stop working.`,
  },
  {
    slug: "terms",
    title: "Terms of service",
    excerpt: "The agreement between you and LushTresses.",
    metaTitle: "Terms of Service",
    metaDescription:
      "The terms that govern purchases from LushTresses, including pricing, delivery, returns and liability.",
    position: 6,
    content: `## Agreement

By placing an order with LushTresses you agree to these terms. If you don't agree, please don't place an order.

## Products

Our hair is a natural product. Slight variations in colour, density and curl pattern are normal and are not considered faults. Product photography is representative; screens vary.

## Pricing

Prices are in GBP and include VAT where applicable. We reserve the right to correct pricing errors before an order is dispatched. If a price changes after you've ordered, we'll contact you before charging.

## Orders and acceptance

Your order is an offer. A contract is formed when we send your confirmation email. We may decline an order if stock is unavailable, if we suspect fraud or if a pricing error has occurred — in which case you'll be refunded in full.

## Liability

Nothing in these terms excludes liability for death or personal injury caused by negligence, fraud, or any liability that cannot be excluded by law. Otherwise, our liability is limited to the value of the order.

## Governing law

These terms are governed by the laws of England and Wales.`,
  },
  {
    slug: "hair-care",
    title: "Hair care guide",
    excerpt: "How to get 12–18 months (or more) from your bundles.",
    heroImage: "/images/collection-bundles.jpg",
    metaTitle: "How to Care for Remy Human Hair Extensions",
    metaDescription:
      "A simple weekly routine for Remy human hair bundles, closures and HD lace wigs — from cleansing to night protection.",
    position: 7,
    content: `## The short version

Treat it like your own hair — only gentler. Sulphate-free products, cool rinses, heat protection and a silk wrap at night will get you a year or more of wear.

## Weekly routine

1. **Detangle dry.** Work from the ends upward with a wide-tooth comb before water touches the hair.
2. **Cleanse.** Use a sulphate-free shampoo, focusing on the wefts and scalp area. Don't scrub the ends.
3. **Mask.** Apply a moisture mask from mid-length to ends and leave for 10–15 minutes.
4. **Rinse cool.** Cool water closes the cuticle and boosts shine.
5. **Air-dry.** Blot with a microfibre towel, then air-dry on a stand. Avoid rubbing.

## Heat styling

Always use a heat protectant. Keep straighteners below 200°C on straight textures and 180°C on curly. Never apply heat to wet hair.

## Night protection

Braid loosely, then wrap in silk or satin. This single habit prevents most tangling and dryness.

## HD lace and closures

Cleanse lace gently with a soft brush, never rub. Remove adhesive with a dedicated lace remover, not acetone. Store wigs on a stand or inside a silk bag.

## When to clarify

If your hair starts feeling heavy or producty, use a clarifying shampoo once a month, then follow with a deep mask.`,
  },
  {
    slug: "gift-cards",
    title: "Gift cards",
    excerpt: "The safest way to gift hair — let them choose the texture.",
    metaTitle: "Gift Cards",
    metaDescription:
      "Give the gift of choice with a LushTresses digital gift card, delivered instantly by email.",
    position: 8,
    content: `## The gift of choice

Hair is personal. A LushTresses gift card lets them choose the texture, length and lace that suits them — delivered instantly by email.

## How it works

1. Email hello@lushtresses.com with the amount (£50–£500) and the recipient's email address.
2. We'll send a beautifully designed digital card with a unique code.
3. The code can be used at checkout against any order, and never expires.

## Good to know

- Gift cards are delivered by email, usually within one working day.
- They can be combined with promotions.
- Gift cards are non-refundable and cannot be exchanged for cash.
- Lost a code? Email us with your order reference and we'll resend it.`,
  },
];

const faqs = [
  {
    question: "How do I know which length to order?",
    answer:
      "Our lengths are measured from root to tip when the hair is stretched straight. For reference: 16\" sits around collarbone length, 20\" falls to the bust, 24\" reaches the waist and 28\"+ is hip length. If you're between lengths, go longer — it can always be trimmed.",
    category: "Hair",
    position: 1,
  },
  {
    question: "How many bundles do I need for a full install?",
    answer:
      "Most clients need three bundles for a full head: two for the back and one for the sides. If you're 20\" or longer, or you prefer a very full finish, we recommend three to four bundles. Wigs, closures and frontals are complete on their own.",
    category: "Hair",
    position: 2,
  },
  {
    question: "Is the hair 100% human?",
    answer:
      "Yes — every bundle, closure, frontal and wig is 100% Remy human hair with the cuticles aligned in one direction. That's what prevents matting and keeps the hair glossy wash after wash. We never blend synthetic fibres.",
    category: "Hair",
    position: 3,
  },
  {
    question: "Can I colour and heat style the hair?",
    answer:
      "Absolutely. Our hair can be coloured up to three shades lighter by a professional and heat styled up to 200°C (180°C on curly textures). Always use a heat protectant and book a patch test with your colourist first.",
    category: "Hair",
    position: 4,
  },
  {
    question: "How long does delivery take?",
    answer:
      "UK standard delivery arrives in 2–4 working days (£4.95, free over £150). Express next-day delivery is £9.95 when you order before 2pm on a working day. Orders are packed the same day when placed before 2pm.",
    category: "Delivery",
    position: 5,
  },
  {
    question: "Do you ship internationally?",
    answer:
      "Yes, we ship worldwide with tracked services. Shipping is calculated at checkout based on destination and weight. Any import duties or taxes are payable by the recipient.",
    category: "Delivery",
    position: 6,
  },
  {
    question: "Can I return my hair if it isn't right?",
    answer:
      "You have 30 days from delivery to return unworn hair in its original packaging with the security seal intact. Email us with your order number and we'll send a returns authorisation. Refunds are processed within 3–5 working days of receipt.",
    category: "Returns",
    position: 7,
  },
  {
    question: "How do I care for HD lace?",
    answer:
      "Cleanse lace with a soft brush and a gentle cleanser — never rub or wring it. Remove adhesive with a dedicated lace remover rather than acetone, and store your wig on a stand or in a silk bag between wears.",
    category: "Hair",
    position: 8,
  },
  {
    question: "Which payment methods do you accept?",
    answer:
      "We accept Visa, Mastercard and American Express via Stripe, plus Apple Pay, Google Pay and PayPal. All payments are encrypted and processed by PCI-DSS Level 1 providers — we never see or store your card details.",
    category: "Payments",
    position: 9,
  },
  {
    question: "How do I track my order?",
    answer:
      "Every order has a tracking number, emailed to you the moment it's dispatched. You can also view live status and tracking from your account under Orders. If you checked out as a guest, use the link in your confirmation email to set a password first.",
    category: "Orders",
    position: 10,
  },
  {
    question: "Can I change or cancel my order?",
    answer:
      "Email us as soon as possible — we can usually amend an order before it's packed. Once dispatched, our returns policy applies. Unpaid orders are automatically released after two hours.",
    category: "Orders",
    position: 11,
  },
  {
    question: "Do you offer styling consultations?",
    answer:
      "Yes. Book a free 15-minute virtual consultation and we'll help you choose texture, length and density for your install — including matching a closure or frontal to your bundles.",
    category: "Orders",
    position: 12,
  },
];

const testimonials = [
  {
    name: "Amara O.",
    location: "London",
    quote:
      "I've worn extensions for eleven years and this is the first bone straight that still looked new after four months. The wefts are so thin they disappear.",
    rating: 5,
    product: "Silk Press Bone Straight Bundle",
    position: 1,
  },
  {
    name: "Simone R.",
    location: "Manchester",
    quote:
      "The Goddess wig arrived pre-plucked and actually melted. I installed it in twenty minutes with the grip band — no glue, no headache.",
    rating: 5,
    product: "Goddess Glueless HD Lace Wig",
    position: 2,
  },
  {
    name: "Chidera N.",
    location: "Birmingham",
    quote:
      "The kinky curly blends with my natural hair so well that my stylist asked where I got it. Shrinkage is exactly as described.",
    rating: 5,
    product: "Atelier Kinky Curly Bundle",
    position: 3,
  },
  {
    name: "Leah M.",
    location: "Leeds",
    quote:
      "Free next-day delivery, a handwritten note and a satin pouch. It feels like buying from a boutique, not a website.",
    rating: 5,
    product: "The Signature Trio",
    position: 4,
  },
  {
    name: "Priya K.",
    location: "Reading",
    quote:
      "I ordered the 13x6 frontal for my wedding. The lace was invisible in photos and the parting held all day in the heat.",
    rating: 5,
    product: "HD 13x6 Body Wave Frontal",
    position: 5,
  },
  {
    name: "Naomi T.",
    location: "Bristol",
    quote:
      "The silk pillowcase was a gift to myself and now I can't sleep without it. My curls survive the night.",
    rating: 5,
    product: "Mulberry Silk Pillowcase",
    position: 6,
  },
  {
    name: "Grace A.",
    location: "Glasgow",
    quote:
      "Customer care answered on a Sunday and replaced a closure I'd ordered in the wrong length. Rare, lovely service.",
    rating: 5,
    product: "HD 5x5 Body Wave Closure",
    position: 7,
  },
  {
    name: "Tolu B.",
    location: "Nottingham",
    quote:
      "Three bundles, one price, no shedding. The trio is genuinely the best value in my bathroom cupboard.",
    rating: 5,
    product: "The Signature Trio",
    position: 8,
  },
];

const banners = [
  {
    title: "Free UK delivery over £150 · Pay in 3 with PayPal",
    subtitle: "Complimentary satin pouch with every order",
    placement: "ANNOUNCEMENT" as const,
    ctaLabel: "Shop new in",
    ctaHref: "/shop",
    position: 1,
    isActive: true,
  },
  {
    title: "Hair that behaves like your own.",
    subtitle: "100% Remy human hair, hand-finished in London",
    body: "Cuticle-aligned, double-drawn and true to length. Six signature textures, one uncompromising standard.",
    badge: "The Autumn Edit",
    ctaLabel: "Shop the collection",
    ctaHref: "/shop",
    imageUrl: "/images/hero.jpg",
    placement: "HOME_HERO" as const,
    position: 1,
    isActive: true,
  },
  {
    title: "The Signature Trio",
    subtitle: "Three bundles, one flawless install",
    body: "Our most-loved lengths hand-matched for colour and density — save up to 22% versus buying separately.",
    badge: "Bundle offer",
    ctaLabel: "Shop the trio",
    ctaHref: "/product/signature-bundle-trio",
    imageUrl: "/images/promo.jpg",
    placement: "HOME_PROMO" as const,
    position: 1,
    isActive: true,
  },
  {
    title: "The collection",
    subtitle: "Bundles, wigs, closures and frontals — made to be lived in.",
    placement: "SHOP_HERO" as const,
    position: 1,
    isActive: true,
  },
];

const emailTemplates = [
  {
    name: "welcome",
    description: "Sent when a shopper creates an account.",
    subject: "Welcome to LushTresses",
    preheader: "Your account is ready — here's where to start.",
    bodyHtml:
      '<h1 style="font-family:Georgia,serif;font-size:26px;margin:0 0 16px;">Welcome to LushTresses.</h1><p>Hi {{customer_first_name}}, we\'re so glad you\'re here. Your account is ready — save addresses, track orders and keep your wishlist in one place.</p><p><a href="{{site_url}}/shop">Explore the collection</a></p>',
  },
  {
    name: "order-confirmation",
    description: "Payment confirmed — includes the guest account setup link.",
    subject: "Order {{order_number}} confirmed — LushTresses",
    preheader: "We're preparing your order by hand.",
    bodyHtml:
      '<h1 style="font-family:Georgia,serif;font-size:26px;margin:0 0 16px;">Thank you, {{customer_first_name}}.</h1><p>Your order <strong>{{order_number}}</strong> is confirmed. Our atelier team is preparing everything by hand.</p>{{order_summary}}<p>{{guest_setup_block}}</p>',
  },
  {
    name: "order-dispatched",
    description: "Sent when the atelier marks an order as dispatched.",
    subject: "Your order is on its way — {{order_number}}",
    preheader: "Tracking details inside.",
    bodyHtml:
      '<h1 style="font-family:Georgia,serif;font-size:26px;margin:0 0 16px;">On its way</h1><p>Hi {{customer_first_name}}, your order has left the atelier. Tracking: <strong>{{tracking_number}}</strong> ({{tracking_carrier}}).</p>{{order_summary}}',
  },
  {
    name: "order-cancelled",
    description: "Sent when an order is cancelled and stock released.",
    subject: "Your order {{order_number}} has been cancelled",
    preheader: "Any captured payment is refunded automatically.",
    bodyHtml:
      '<h1 style="font-family:Georgia,serif;font-size:26px;margin:0 0 16px;">Order cancelled</h1><p>Hi {{customer_first_name}}, your order has been cancelled. Any captured payment is refunded to your original method within 3–5 working days.</p>',
  },
  {
    name: "guest-setup",
    description: "One-time password setup link for guest buyers.",
    subject: "Finish setting up your LushTresses account",
    preheader: "One click to set your password.",
    bodyHtml:
      '<h1 style="font-family:Georgia,serif;font-size:26px;margin:0 0 16px;">One last step</h1><p>Hi {{customer_first_name}}, tap below to choose a password. This link expires in 48 hours.</p><p><a href="{{setup_url}}">Set my password</a></p>',
  },
  {
    name: "restock-alert",
    description: "Use for back-in-stock campaigns.",
    subject: "Back in stock: {{product_name}}",
    preheader: "Your length is available again.",
    bodyHtml:
      '<h1 style="font-family:Georgia,serif;font-size:26px;margin:0 0 16px;">Back in the atelier</h1><p>{{product_name}} has been restocked. Small batches sell through quickly.</p><p><a href="{{product_url}}">Shop now</a></p>',
  },
  {
    name: "newsletter",
    description: "Base layout for the fortnightly Atelier Letter.",
    subject: "The Atelier Letter",
    preheader: "Restocks, styling notes and early access.",
    bodyHtml:
      '<h1 style="font-family:Georgia,serif;font-size:26px;margin:0 0 16px;">The Atelier Letter</h1><p>Write your introduction here, then add product links and styling notes.</p><p><a href="{{site_url}}/shop">Shop the collection</a></p>',
  },
];

const coupons = [
  {
    code: "WELCOME10",
    description: "10% off your first order",
    type: "PERCENT" as const,
    value: 10,
    minSpendPence: 5000,
    maxUses: 500,
    isActive: true,
  },
  {
    code: "LUSH20",
    description: "20% off orders over £200",
    type: "PERCENT" as const,
    value: 20,
    minSpendPence: 20000,
    maxUses: 100,
    startsAt: new Date(),
    expiresAt: daysFromNow(60),
    isActive: true,
  },
  {
    code: "LUXE50",
    description: "£50 off orders over £300",
    type: "FIXED" as const,
    value: 5000,
    minSpendPence: 30000,
    maxUses: 50,
    startsAt: new Date(),
    expiresAt: daysFromNow(30),
    isActive: true,
  },
];

const settings = [
  {
    key: "store",
    value: {
      freeShippingThresholdPence: 15000,
      currency: "GBP",
      supportEmail: "hello@lushtresses.com",
      dispatchCutoff: "14:00",
    },
  },
  {
    key: "shipping",
    value: {
      standardPence: 495,
      expressPence: 995,
      standardEstimate: "2 – 4 working days",
      expressEstimate: "Next working day",
      international: true,
    },
  },
];

async function resetDatabase() {
  await prisma.$transaction([
    prisma.orderEvent.deleteMany(),
    prisma.paymentTransaction.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.emailLog.deleteMany(),
    prisma.emailCampaign.deleteMany(),
    prisma.review.deleteMany(),
    prisma.productImage.deleteMany(),
    prisma.productVariant.deleteMany(),
    prisma.product.deleteMany(),
    prisma.category.deleteMany(),
    prisma.accountSetupToken.deleteMany(),
    prisma.session.deleteMany(),
    prisma.account.deleteMany(),
    prisma.address.deleteMany(),
    prisma.user.deleteMany(),
    prisma.coupon.deleteMany(),
    prisma.banner.deleteMany(),
    prisma.faq.deleteMany(),
    prisma.testimonial.deleteMany(),
    prisma.page.deleteMany(),
    prisma.emailTemplate.deleteMany(),
    prisma.contactMessage.deleteMany(),
    prisma.newsletterSubscriber.deleteMany(),
    prisma.setting.deleteMany(),
    prisma.webhookEvent.deleteMany(),
  ]);
}

async function main() {
  console.log("→ Resetting store data");
  await resetDatabase();

  console.log("→ Creating categories and products");
  const categoryIds = new Map<string, string>();
  for (const category of categories) {
    const created = await prisma.category.create({ data: category });
    categoryIds.set(category.slug, created.id);
  }

  for (const product of products) {
    const categoryId = categoryIds.get(product.category);
    if (!categoryId) throw new Error(`Unknown category: ${product.category}`);

    const prices = product.variants.map((variant) => variant.pricePence);
    const compareAt = product.variants
      .map((variant) => variant.compareAtPricePence ?? 0)
      .filter(Boolean);

    await prisma.product.create({
      data: {
        slug: product.slug,
        name: product.name,
        subtitle: product.subtitle,
        description: product.description,
        details: product.details,
        categoryId,
        texture: product.texture,
        color: "Natural Black",
        basePricePence: Math.min(...prices),
        compareAtPricePence: compareAt.length ? Math.min(...compareAt) : null,
        isActive: true,
        isFeatured: Boolean(product.isFeatured),
        isBestSeller: Boolean(product.isBestSeller),
        tags: product.tags,
        metaTitle: `${product.name} — LushTresses`,
        metaDescription: product.subtitle,
        images: {
          create: product.images.map((url, index) => ({
            url,
            alt: `${product.name} — view ${index + 1}`,
            position: index,
          })),
        },
        variants: {
          create: product.variants.map((variant) => ({
            sku: variant.sku,
            label: variant.label,
            lengthInches: variant.lengthInches ?? null,
            color: "Natural Black",
            texture: product.texture,
            pricePence: variant.pricePence,
            compareAtPricePence: variant.compareAtPricePence ?? null,
            stock: variant.stock,
            weightGrams: product.category === "accessories" ? 200 : 150,
          })),
        },
      },
    });
  }

  console.log("→ Creating demo accounts");
  const customerPasswordHash = await hash(CUSTOMER_PASSWORD, 10);
  const adminPasswordHash = await hash(ADMIN_PASSWORD, 10);

  const customer = await prisma.user.create({
    data: {
      email: CUSTOMER_EMAIL,
      name: "Amara Okafor",
      passwordHash: customerPasswordHash,
      role: "CUSTOMER",
      phone: "+44 7700 900123",
      emailVerified: new Date(),
      marketingOptIn: true,
      lastLoginAt: daysFromNow(-1),
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: ADMIN_EMAIL,
      name: "LushTresses Atelier",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      phone: "+44 20 7946 0958",
      emailVerified: new Date(),
      marketingOptIn: false,
    },
  });

  const guest = await prisma.user.create({
    data: {
      email: "guest.buyer@example.com",
      name: "Tolu Bakare",
      passwordHash: null,
      role: "CUSTOMER",
      phone: "+44 7700 900456",
      marketingOptIn: true,
    },
  });

  await prisma.address.createMany({
    data: [
      {
        userId: customer.id,
        fullName: "Amara Okafor",
        phone: "+44 7700 900123",
        line1: "42 Elgin Crescent",
        line2: "Flat 3",
        city: "London",
        county: "Greater London",
        postcode: "W11 2JL",
        country: "GB",
        isDefault: true,
      },
      {
        userId: guest.id,
        fullName: "Tolu Bakare",
        phone: "+44 7700 900456",
        line1: "18 Tib Street",
        city: "Manchester",
        county: "Greater Manchester",
        postcode: "M4 1LA",
        country: "GB",
        isDefault: true,
      },
    ],
  });

  console.log("→ Creating reviews and CMS content");
  const productRecords = await prisma.product.findMany({ select: { id: true, slug: true } });
  const productIdBySlug = new Map(productRecords.map((product) => [product.slug, product.id]));

  const reviewSeeds = [
    {
      slug: "silk-press-bone-straight-bundle",
      authorName: "Amara O.",
      rating: 5,
      title: "Still flawless after four months",
      body: "I've worn extensions for over a decade and this is the first bone straight that still looks new. The wefts are thin, the hair is true to length and there's been no shedding at all.",
      userId: customer.id,
      verifiedPurchase: true,
    },
    {
      slug: "liquid-body-wave-bundle",
      authorName: "Simone R.",
      rating: 5,
      title: "The wave comes back every wash",
      body: "I was worried the pattern would drop after the first wash but it bounces straight back. Blends perfectly with my natural hair and holds a wand curl beautifully.",
      userId: null,
      verifiedPurchase: true,
    },
    {
      slug: "atelier-kinky-curly-bundle",
      authorName: "Chidera N.",
      rating: 5,
      title: "Matches my 4B hair exactly",
      body: "Finally a kinky curly that doesn't look like a costume. My stylist blended it into my leave-out and you genuinely can't tell where the hair starts.",
      userId: null,
      verifiedPurchase: true,
    },
    {
      slug: "goddess-glueless-hd-lace-wig",
      authorName: "Leah M.",
      rating: 5,
      title: "Twenty minutes and done",
      body: "Pre-plucked, pre-bleached, and it actually melts. I installed it with the grip band for a wedding and it didn't budge all night.",
      userId: null,
      verifiedPurchase: true,
    },
    {
      slug: "signature-bundle-trio",
      authorName: "Tolu B.",
      rating: 4,
      title: "Great value, wish there were more lengths",
      body: "The trio is genuinely the best value I've found in the UK. Quality is excellent — I only wish there was a 26-inch combination option.",
      userId: null,
      verifiedPurchase: true,
    },
    {
      slug: "hd-5x5-body-wave-closure",
      authorName: "Grace A.",
      rating: 5,
      title: "Lace invisible in daylight",
      body: "The knots were already bleached and the parting space is generous. Matched my body wave bundles perfectly.",
      userId: null,
      verifiedPurchase: true,
    },
    {
      slug: "mulberry-silk-pillowcase",
      authorName: "Naomi T.",
      rating: 5,
      title: "My curls survive the night",
      body: "Bought it as a gift to myself and now I can't sleep without it. Genuinely cooler and much kinder to my hair than cotton.",
      userId: null,
      verifiedPurchase: false,
    },
    {
      slug: "sculpted-deep-wave-bundle",
      authorName: "Priya K.",
      rating: 5,
      title: "Wedding-day hair",
      body: "Wore this for my wedding and the waves held through the ceremony and the dancing. The photos look incredible.",
      userId: null,
      verifiedPurchase: true,
    },
  ];

  for (const review of reviewSeeds) {
    const productId = productIdBySlug.get(review.slug);
    if (!productId) continue;
    await prisma.review.create({
      data: {
        productId,
        userId: review.userId,
        authorName: review.authorName,
        rating: review.rating,
        title: review.title,
        body: review.body,
        status: "APPROVED",
        verifiedPurchase: review.verifiedPurchase,
        createdAt: daysFromNow(-Math.floor(Math.random() * 45) - 2),
      },
    });
  }

  const ratings = await prisma.review.groupBy({
    by: ["productId"],
    where: { status: "APPROVED" },
    _avg: { rating: true },
    _count: { _all: true },
  });

  for (const row of ratings) {
    await prisma.product.update({
      where: { id: row.productId },
      data: {
        ratingAvg: Number((row._avg.rating ?? 0).toFixed(2)),
        ratingCount: row._count._all,
      },
    });
  }

  await prisma.page.createMany({ data: pages });
  await prisma.faq.createMany({ data: faqs });
  await prisma.banner.createMany({ data: banners });
  await prisma.testimonial.createMany({ data: testimonials });
  await prisma.emailTemplate.createMany({ data: emailTemplates });
  await prisma.coupon.createMany({ data: coupons });
  for (const setting of settings) {
    await prisma.setting.create({ data: setting });
  }

  await prisma.contactMessage.create({
    data: {
      name: "Jade Wilson",
      email: "jade.wilson@example.com",
      phone: "+44 7700 900789",
      subject: "Which length for a waist-length install?",
      message:
        "Hi! I'm 5'7\" and want the hair to reach my waist. Would 24 or 26 inch be better with a 20 inch closure? Thank you!",
      isRead: false,
    },
  });

  await prisma.newsletterSubscriber.createMany({
    data: [
      { email: "jade.wilson@example.com", source: "footer" },
      { email: "leah.m@example.com", source: "homepage" },
    ],
  });

  await createSampleOrders(customer.id, admin.id, guest.id);

  console.log(
    `→ Seed complete: ${categories.length} categories · ${products.length} products · ${faqs.length} FAQs · ${pages.length} pages · 3 sample orders`,
  );

  return { customer, admin, guest };
}

async function createSampleOrders(customerId: string, adminId: string, guestId: string) {
  void adminId;

  const catalogue = await prisma.product.findMany({
    include: {
      images: { orderBy: { position: "asc" } },
      variants: { orderBy: { pricePence: "asc" } },
    },
  });
  const bySlug = new Map(catalogue.map((product) => [product.slug, product]));

  const line = (slug: string, variantIndex: number, quantity: number) => {
    const product = bySlug.get(slug);
    const variant = product?.variants[variantIndex];
    if (!product || !variant) throw new Error(`Seed variant missing for ${slug}`);
    return {
      productId: product.id,
      variantId: variant.id,
      name: product.name,
      variantLabel: variant.label,
      sku: variant.sku,
      imageUrl: product.images[0]?.url ?? null,
      unitPricePence: variant.pricePence,
      quantity,
      lineTotalPence: variant.pricePence * quantity,
    };
  };

  const london = {
    fullName: "Amara Okafor",
    phone: "+44 7700 900123",
    line1: "42 Elgin Crescent",
    line2: "Flat 3",
    city: "London",
    county: "Greater London",
    postcode: "W11 2JL",
    country: "GB",
  };

  const manchester = {
    fullName: "Tolu Bakare",
    phone: "+44 7700 900456",
    line1: "18 Tib Street",
    city: "Manchester",
    county: "Greater Manchester",
    postcode: "M4 1LA",
    country: "GB",
  };

  // 1 — Paid, dispatched, with tracking
  const shippedLines = [
    line("silk-press-bone-straight-bundle", 2, 3),
    line("hd-5x5-bone-straight-closure", 2, 1),
  ];
  const shippedSubtotal = shippedLines.reduce((total, item) => total + item.lineTotalPence, 0);
  const shipped = await prisma.order.create({
    data: {
      orderNumber: "LT-DEMO-1001",
      userId: customerId,
      status: "DISPATCHED",
      paymentStatus: "PAID",
      paymentProvider: "STRIPE",
      subtotalPence: shippedSubtotal,
      shippingPence: 995,
      discountPence: 0,
      totalPence: shippedSubtotal + 995,
      shippingMethod: "EXPRESS",
      shippingAddress: london,
      billingAddress: london,
      customerName: "Amara Okafor",
      customerEmail: CUSTOMER_EMAIL,
      customerPhone: "+44 7700 900123",
      trackingNumber: "RM884219065GB",
      trackingCarrier: "Royal Mail",
      createdAt: daysFromNow(-6),
      paidAt: daysFromNow(-6),
      dispatchedAt: daysFromNow(-4),
      items: { create: shippedLines },
      events: {
        create: [
          { type: "ORDER_CREATED", message: "Order placed and stock reserved.", actor: "CUSTOMER", createdAt: daysFromNow(-6) },
          { type: "PAYMENT_CAPTURED", message: "Payment captured via STRIPE.", actor: "SYSTEM", createdAt: daysFromNow(-6) },
          { type: "STATUS_DISPATCHED", message: "Dispatched with Royal Mail — RM884219065GB.", actor: "ADMIN", createdAt: daysFromNow(-4) },
        ],
      },
    },
  });
  await prisma.paymentTransaction.create({
    data: {
      orderId: shipped.id,
      provider: "STRIPE",
      providerRef: "pi_demo_seed_1001",
      amountPence: shipped.totalPence,
      status: "PAID",
    },
  });

  // 2 — Paid, processing
  const processingLines = [line("goddess-glueless-hd-lace-wig", 1, 1)];
  const processingSubtotal = processingLines.reduce((total, item) => total + item.lineTotalPence, 0);
  const processing = await prisma.order.create({
    data: {
      orderNumber: "LT-DEMO-1002",
      userId: customerId,
      status: "PROCESSING",
      paymentStatus: "PAID",
      paymentProvider: "PAYPAL",
      subtotalPence: processingSubtotal,
      shippingPence: 0,
      discountPence: 0,
      totalPence: processingSubtotal,
      shippingMethod: "STANDARD",
      shippingAddress: london,
      billingAddress: london,
      customerName: "Amara Okafor",
      customerEmail: CUSTOMER_EMAIL,
      customerPhone: "+44 7700 900123",
      createdAt: daysFromNow(-1),
      paidAt: daysFromNow(-1),
      items: { create: processingLines },
      events: {
        create: [
          { type: "ORDER_CREATED", message: "Order placed and stock reserved.", actor: "CUSTOMER", createdAt: daysFromNow(-1) },
          { type: "PAYMENT_CAPTURED", message: "Payment captured via PAYPAL.", actor: "SYSTEM", createdAt: daysFromNow(-1) },
        ],
      },
    },
  });
  await prisma.paymentTransaction.create({
    data: {
      orderId: processing.id,
      provider: "PAYPAL",
      providerRef: "PAYPAL-DEMO-1002",
      amountPence: processing.totalPence,
      status: "PAID",
    },
  });

  // 3 — Guest, awaiting payment (exercises the expiry cron)
  const awaitingLines = [line("signature-bundle-trio", 1, 1)];
  const awaitingSubtotal = awaitingLines.reduce((total, item) => total + item.lineTotalPence, 0);
  await prisma.order.create({
    data: {
      orderNumber: "LT-DEMO-1003",
      userId: guestId,
      status: "AWAITING_PAYMENT",
      paymentStatus: "UNPAID",
      paymentProvider: "STRIPE",
      subtotalPence: awaitingSubtotal,
      shippingPence: 0,
      discountPence: 0,
      totalPence: awaitingSubtotal,
      shippingMethod: "STANDARD",
      shippingAddress: manchester,
      billingAddress: manchester,
      customerName: "Tolu Bakare",
      customerEmail: "guest.buyer@example.com",
      customerPhone: "+44 7700 900456",
      createdAt: new Date(Date.now() - 40 * 60 * 1000),
      items: { create: awaitingLines },
      events: {
        create: [
          { type: "ORDER_CREATED", message: "Guest order placed and stock reserved.", actor: "CUSTOMER" },
          { type: "PAYMENT_INTENT_CREATED", message: "Stripe payment intent created.", actor: "SYSTEM" },
        ],
      },
    },
  });
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });









