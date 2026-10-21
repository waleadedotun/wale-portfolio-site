// build.js: runs automatically on Netlify every time the site is published.
// It builds the Portfolio page and the Home page "Selected work" from the files in this
// repository. There is no limit on how many you add. You do not need to edit this file.
//
// PHOTOS AND IMAGES: name the file so it STARTS with its category (use lowercase):
//   kitchen-01.jpg     -> Kitchens tab
//   wardrobe-07.jpg    -> Wardrobes tab
//   door-3.jpg         -> Doors tab
//   furniture-12.png   -> Furniture tab
//   sketch-01.jpg      -> Hand sketches tab
//   drawing-01.jpg     -> Drawings tab
//   Supported types: .jpg .jpeg .png .webp
//   Words after the category become the caption: kitchen-lekki-modern.jpg -> "Lekki modern"
//
// VIDEOS (two ways, both show in the Videos tab):
//   1) YouTube: add one link per line to the file videos.txt
//        https://youtu.be/xxxxxxxxxxx | Optional title
//   2) Small video files (under about 20 MB): name them video-01.mp4, video-02.mp4 ...

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = __dirname;
const OUT = path.join(ROOT, "dist");

const CATS = [
  { key: "kitchens", label: "Kitchens", caption: "Fitted kitchen", alt: "Fitted kitchen by Wale Adedotun", re: /^kitchen/i, feature: true },
  { key: "wardrobes", label: "Wardrobes", caption: "Fitted wardrobe", alt: "Fitted wardrobe by Wale Adedotun", re: /^wardrobe/i, feature: true },
  { key: "doors", label: "Doors", caption: "Doors", alt: "Door installation by Wale Adedotun", re: /^door/i, feature: true },
  { key: "furniture", label: "Furniture", caption: "Furniture", alt: "Custom furniture by Wale Adedotun", re: /^furniture/i, feature: true },
  { key: "sketches", label: "Hand sketches", caption: "Hand sketch", alt: "Hand sketch by Wale Adedotun", re: /^sketch/i, contain: true },
  { key: "drawings", label: "Drawings", caption: "Design drawing", alt: "Design drawing by Wale Adedotun", re: /^drawing/i, contain: true },
];
const VIDEO_RE = /^video/i;

// The grey "Replace with..." sample pictures supplied with the template.
// They are skipped automatically so they never appear next to real photos.
const PLACEHOLDERS = new Set([
  "7be69aed27d20a292394a3547f248eaf", "feaa1be51a347a4534b92b2bf16271da",
  "082f55187e5b3c18f96a312ce0df56e7", "6773da365bed805d6af36e86145603aa",
  "78a080297397d1cbefd371ef2e859351", "3d5af7b3242545c44996cf3f8030535b",
  "b2f4a0b1938d42729b8f1aec153fbadf", "22212d7befa954f60fde628b53ab1bbb",
  "202ac74d2bb1b1c56cc7eafb50917c98", "09a33a581d3728c105a209b0a6aefee4",
]);

const IMG = /\.(jpe?g|png|webp)$/i;
const VID = /\.(mp4|webm|m4v)$/i;
const DOUBLE_EXT = /\.(jpe?g|png|webp|mp4|webm|m4v)\.(jpe?g|png|webp|mp4|webm|m4v)$/i;

const md5 = (file) => crypto.createHash("md5").update(fs.readFileSync(file)).digest("hex");
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const natural = (a, b) => a.localeCompare(b, "en", { numeric: true, sensitivity: "base" });

function titleFrom(file, re, fallback) {
  let base = file.replace(IMG, "").replace(VID, "").replace(re, "");
  base = base.replace(/[-_]+/g, " ").replace(/\d+/g, "").replace(/\s+/g, " ").trim();
  if (/[a-z]/i.test(base)) return base.charAt(0).toUpperCase() + base.slice(1);
  return fallback;
}

// ---- collect photos and video files ----
const photos = [];
const videos = [];
for (const file of fs.readdirSync(ROOT).sort(natural)) {
  const isImg = IMG.test(file), isVid = VID.test(file);
  if (!isImg && !isVid) continue;
  const cat = isImg ? CATS.find((c) => c.re.test(file)) : null;
  if (!cat && !(isVid && VIDEO_RE.test(file))) continue;
  if (DOUBLE_EXT.test(file)) {
    console.log("Skipping " + file + " (two file endings. Rename it, for example to " + file.replace(DOUBLE_EXT, file.match(/\.[a-z0-9]+$/i)[0].replace(/jpeg/i, "jpg")) + ")");
    continue;
  }
  if (isVid) { videos.push({ kind: "file", file, title: titleFrom(file, VIDEO_RE, "Video") }); continue; }
  if (PLACEHOLDERS.has(md5(path.join(ROOT, file)))) continue;
  photos.push({ file, cat, title: titleFrom(file, cat.re, cat.caption) });
}

// Show photos grouped by category (kitchens first ... drawings last), then by file name
photos.sort((a, b) => CATS.indexOf(a.cat) - CATS.indexOf(b.cat) || natural(a.file, b.file));

// ---- YouTube links from videos.txt ----
function ytId(s) {
  const m = s.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:[^\s|]*&)?v=|embed\/|shorts\/|live\/))([A-Za-z0-9_-]{11})/) || s.match(/^\s*([A-Za-z0-9_-]{11})\s*(?:\||$)/);
  return m ? m[1] : null;
}
const vtxt = path.join(ROOT, "videos.txt");
if (fs.existsSync(vtxt)) {
  for (const raw of fs.readFileSync(vtxt, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const id = ytId(line);
    if (!id) { console.log("Skipping videos.txt line (no YouTube link found): " + line); continue; }
    const title = line.includes("|") ? line.split("|").slice(1).join("|").trim() : "";
    videos.push({ kind: "youtube", id, title: title || "Video" });
  }
}

// ---- HTML pieces ----
const figure = (p, eager) =>
  '<figure data-cat="' + p.cat.key + '"' + (p.cat.contain ? ' class="contain"' : "") + '><img src="' + encodeURI(p.file) + '" alt="' + esc(p.cat.alt) + '"' +
  (eager ? "" : ' loading="lazy"') + '><figcaption><b>' + esc(p.title) + "</b></figcaption></figure>";

const videoFigure = (v) =>
  v.kind === "youtube"
    ? '<figure class="video" data-cat="videos"><button type="button" class="yt" data-yt="' + v.id + '" aria-label="Play video: ' + esc(v.title) +
      '" style="background-image:url(https://i.ytimg.com/vi/' + v.id + '/hqdefault.jpg)"></button><figcaption><b>' + esc(v.title) + "</b></figcaption></figure>"
    : '<figure class="video" data-cat="videos"><video controls playsinline preload="metadata" src="' + encodeURI(v.file) + '#t=0.1"></video><figcaption><b>' + esc(v.title) + "</b></figcaption></figure>";

const empty = '<p class="lead" style="grid-column:1/-1">New projects are being added. Please check back soon, or message me on WhatsApp to see recent work.</p>';

// ---- Portfolio page: tabs only for sections that have content ----
const used = CATS.filter((c) => photos.some((p) => p.cat === c));
const tabs = used.map((c) => [c.key, c.label]);
if (videos.length) tabs.push(["videos", "Videos"]);
const filters =
  '<button type="button" data-filter="all" aria-pressed="true">All</button>' +
  tabs.map(([k, l]) => '<button type="button" data-filter="' + k + '" aria-pressed="false">' + l + "</button>").join("");
const items = photos.map((p, i) => figure(p, i < 3)).concat(videos.map(videoFigure));
const gallery = items.length ? items.join("\n      ") : empty;

// ---- Home page: up to 6 photos, mixed across the four main categories ----
const queues = used.filter((c) => c.feature).map((c) => photos.filter((p) => p.cat === c));
const featured = [];
for (let round = 0; featured.length < 6 && queues.some((q) => q.length > round); round++) {
  for (const q of queues) if (q[round] && featured.length < 6) featured.push(q[round]);
}
const featuredHtml = featured.length ? featured.map((p, i) => figure(p, i < 3)).join("\n      ") : empty;

function inject(html, marker, content) {
  const re = new RegExp("<!-- " + marker + ":START -->[\\s\\S]*?<!-- " + marker + ":END -->");
  if (!re.test(html)) throw new Error("Marker " + marker + " not found");
  return html.replace(re, () => "<!-- " + marker + ":START -->\n      " + content + "\n      <!-- " + marker + ":END -->");
}

// ---- write the finished site to dist/ ----
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT);
const SKIP = new Set([".git", ".github", "dist", "node_modules", "build.js", "netlify.toml", "README.md", ".gitignore", "videos.txt"]);
for (const entry of fs.readdirSync(ROOT)) {
  if (SKIP.has(entry)) continue;
  fs.cpSync(path.join(ROOT, entry), path.join(OUT, entry), { recursive: true });
}

let home = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
home = inject(home, "FEATURED", featuredHtml);
fs.writeFileSync(path.join(OUT, "index.html"), home);

let port = fs.readFileSync(path.join(ROOT, "portfolio.html"), "utf8");
port = inject(port, "FILTERS", filters);
port = inject(port, "GALLERY", gallery);
fs.writeFileSync(path.join(OUT, "portfolio.html"), port);

console.log("Gallery built: " + photos.length + " image(s) (" +
  CATS.map((c) => c.key + " " + photos.filter((p) => p.cat === c).length).join(", ") + "), " + videos.length + " video(s). Home shows " + featured.length + ".");
