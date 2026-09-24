// Generates the app icons from one SVG design. Run with: npm run icons
import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

// An "L" and a green dot (growth). Kept inside the central 80% so Android can crop it into any shape.
const mark = `<path d="M148 128h72v200h120v64H148z" fill="#fafafa"/><circle cx="324" cy="176" r="40" fill="#34d399"/>`;
const svg = (background) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${background}${mark}</svg>`;

// Rounded corners for browsers; a full square where the system applies its own shape (Android, iOS).
const rounded = svg(`<rect width="512" height="512" rx="112" fill="#18181b"/>`);
const fullBleed = svg(`<rect width="512" height="512" fill="#18181b"/>`);

await mkdir("public/icons", { recursive: true });
await writeFile("app/icon.svg", rounded); // Browser tab icon (Next.js file convention).

const pngs = [
  ["public/icons/icon-192.png", rounded, 192],
  ["public/icons/icon-512.png", rounded, 512],
  ["public/icons/maskable-512.png", fullBleed, 512],
  ["app/apple-icon.png", fullBleed, 180], // iPhone home screen (Next.js file convention).
];
for (const [path, image, size] of pngs) {
  await sharp(Buffer.from(image)).resize(size, size).png().toFile(path);
  console.log(`✓ ${path} (${size}×${size})`);
}
