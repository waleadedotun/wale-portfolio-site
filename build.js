// build.js: runs automatically on Netlify every time the site is published.
// It builds the Portfolio page and the Home page "Selected work" from the files in this
// repository. There is no limit on how many you add. You do not need to edit this file.
//
// HOW TO NAME FILES (use lowercase, no spaces):
//   kitchen-01.jpg, wardrobe-07.jpg, door-3.jpg, furniture-12.png, tv-console-02.jpg,
//   sketch-01.jpg, drawing-01.jpg           -> the matching tab (see categories.txt)
//   before-kitchen-01.jpg + after-kitchen-01.jpg   -> one "Before & After" slider
//        (the two names must match after the word before/after)
//   process-kitchen-01.jpg, process-kitchen-02.jpg -> renovation process photos
//   video-01.mp4 -> Videos tab.   process-kitchen.mp4 or before-after-kitchen.mp4 -> Before & After tab
//   YouTube links go in videos.txt
//   Words after the category become the caption: kitchen-lekki-modern.jpg -> "Lekki modern"
// WHICH PHOTO REPRESENTS A CATEGORY: list file names in featured.txt (see that file).

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = __dirname;
const OUT = path.join(ROOT, "dist");

const IMG = /\.(jpe?g|png|webp)$/i;
const VID = /\.(mp4|webm|m4v)$/i;
const DOUBLE_EXT = /\.(jpe?g|png|webp|mp4|webm|m4v)\.(jpe?g|png|webp|mp4|webm|m4v)$/i;
const BA_KEY = "before-after";

const natural = (a, b) => a.localeCompare(b, "en", { numeric: true, sensitivity: "base" });
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const md5 = (file) => crypto.createHash("md5").update(fs.readFileSync(file)).digest("hex");
const readLines = (name) => {
  const p = path.join(ROOT, name);
  return fs.existsSync(p) ? fs.readFileSync(p, "utf8").split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith("#")) : [];
};

// The grey "Replace with..." sample pictures supplied with the template.
// They are skipped automatically so they never appear next to real photos.
const PLACEHOLDERS = new Set([
  "7be69aed27d20a292394a3547f248eaf", "feaa1be51a347a4534b92b2bf16271da",
  "082f55187e5b3c18f96a312ce0df56e7", "6773da365bed805d6af36e86145603aa",
  "78a080297397d1cbefd371ef2e859351", "3d5af7b3242545c44996cf3f8030535b",
  "b2f4a0b1938d42729b8f1aec153fbadf", "22212d7befa954f60fde628b53ab1bbb",
  "202ac74d2bb1b1c56cc7eafb50917c98", "09a33a581d3728c105a209b0a6aefee4",
]);

// ---------- categories.txt ----------
const DEFAULT_CATS = [
  "kitchen | Kitchens | Fitted kitchen | feature",
  "wardrobe | Wardrobes | Fitted wardrobe | feature",
  "door | Doors | Doors | feature",
  "furniture | Furniture | Furniture | feature",
  "sketch | Hand sketches | Hand sketch | contain",
  "drawing | Drawings | Design drawing | contain",
];
let catLines = readLines("categories.txt");
if (!catLines.length) catLines = DEFAULT_CATS;
let allTab = "highlights"; // "highlights" = one photo per tab, "everything" = every photo
const CATS = [];
for (const line of catLines) {
  const setting = line.match(/^all[- ]?tab\s*[:=]\s*(\w+)/i);
  if (setting) { allTab = /every/i.test(setting[1]) ? "everything" : "highlights"; continue; }
  const [pre, label, caption, opts = ""] = line.split("|").map((x) => x.trim());
  const prefixes = pre.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean).sort((a, b) => b.length - a.length);
  if (!prefixes.length) continue;
  CATS.push({
    key: prefixes[0].replace(/[^a-z0-9]+/g, "-"), label: label || prefixes[0], caption: caption || label,
    alt: (caption || label) + " by Wale Adedotun", prefixes, feature: /feature/i.test(opts), contain: /contain/i.test(opts),
  });
}
function findCat(file) {
  const f = file.toLowerCase();
  let best = null;
  for (const c of CATS) for (const pre of c.prefixes) if (f.startsWith(pre) && (!best || pre.length > best.pre.length)) best = { cat: c, pre };
  return best;
}
const startRe = (s) => new RegExp("^" + s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
function words(file, re) {
  const base = file.replace(IMG, "").replace(VID, "").replace(re, "").replace(/[-_]+/g, " ").replace(/\d+/g, "").replace(/\s+/g, " ").trim();
  return /[a-z]/i.test(base) ? base.charAt(0).toUpperCase() + base.slice(1) : "";
}

// ---------- html pieces ----------
const hlAttr = (hl) => (hl ? ' data-hl="1"' : "");
const lazy = (eager) => (eager ? "" : ' loading="lazy"');
const photoItem = (file, cat, title) => ({
  tab: cat.key, files: [file], cat,
  render: (hl, eager) => '<figure data-cat="' + cat.key + '"' + (cat.contain ? ' class="contain"' : "") + hlAttr(hl) + '><img src="' + encodeURI(file) +
    '" alt="' + esc(cat.alt) + '"' + lazy(eager) + '><figcaption><b>' + esc(title) + "</b></figcaption></figure>",
});
const processItem = (file, title) => ({
  tab: BA_KEY, files: [file],
  render: (hl, eager) => '<figure data-cat="' + BA_KEY + '"' + hlAttr(hl) + '><img src="' + encodeURI(file) + '" alt="' + esc(title) + '"' + lazy(eager) +
    '><figcaption><b>' + esc(title) + "</b></figcaption></figure>",
});
const pairItem = (before, after, title) => ({
  tab: BA_KEY, files: [before, after],
  render: (hl, eager) => '<figure class="ba" data-cat="' + BA_KEY + '"' + hlAttr(hl) + '><div class="ba-wrap"><img class="ba-after" src="' + encodeURI(after) +
    '" alt="After: ' + esc(title) + '"' + lazy(eager) + '><img class="ba-before" src="' + encodeURI(before) + '" alt="Before: ' + esc(title) + '"' + lazy(eager) +
    '><span class="ba-tag ba-tag-b">Before</span><span class="ba-tag ba-tag-a">After</span><span class="ba-line"></span>' +
    '<input type="range" min="0" max="100" value="50" aria-label="Drag to compare before and after: ' + esc(title) + '"></div>' +
    "<figcaption><b>" + esc(title) + "</b></figcaption></figure>",
});
const videoItem = (tab, v) => ({
  tab, files: v.file ? [v.file] : [],
  render: (hl) => v.id
    ? '<figure class="video" data-cat="' + tab + '"' + hlAttr(hl) + '><button type="button" class="yt" data-yt="' + v.id + '" aria-label="Play video: ' + esc(v.title) +
      '" style="background-image:url(https://i.ytimg.com/vi/' + v.id + '/hqdefault.jpg)"></button><figcaption><b>' + esc(v.title) + "</b></figcaption></figure>"
    : '<figure class="video" data-cat="' + tab + '"' + hlAttr(hl) + '><video controls playsinline preload="metadata" src="' + encodeURI(v.file) +
      '#t=0.1"></video><figcaption><b>' + esc(v.title) + "</b></figcaption></figure>",
});

// ---------- scan the repository ----------
const items = {}; // tab key -> list of items
const add = (it) => (items[it.tab] = items[it.tab] || []).push(it);
const before = {}, after = {};
const names = fs.readdirSync(ROOT).sort(natural);
for (const file of names) {
  const isImg = IMG.test(file), isVid = VID.test(file);
  if (!isImg && !isVid) continue;
  if (DOUBLE_EXT.test(file)) {
    console.log("Skipping " + file + " (two file endings. Rename it, for example to " + file.replace(DOUBLE_EXT, file.match(/\.[a-z0-9]+$/i)[0].replace(/jpeg/i, "jpg")) + ")");
    continue;
  }
  const lower = file.toLowerCase();
  if (isVid) {
    if (/^video/.test(lower)) add(videoItem("videos", { file, title: words(file, /^video/i) || "Video" }));
    else if (/^(process|before|after)/.test(lower)) add(videoItem(BA_KEY, { file, title: words(file, /^(process|before[-_ ]?after|before|after)/i) || "Renovation video" }));
    continue;
  }
  const ba = lower.match(/^(before|after)(?:[-_ ]+(.+?))?\.(?:jpe?g|png|webp)$/);
  if (ba) { (ba[1] === "before" ? before : after)[(ba[2] || "").replace(/[-_ ]+/g, "-")] = file; continue; }
  if (/^process/.test(lower)) { const w = words(file, /^process/i); add(processItem(file, w ? "Process: " + w : "Renovation process")); continue; }
  const hit = findCat(file);
  if (!hit) continue;
  if (PLACEHOLDERS.has(md5(path.join(ROOT, file)))) continue;
  add(photoItem(file, hit.cat, words(file, startRe(hit.pre)) || hit.cat.caption));
}
// before / after pairs (and lone before or after pictures)
const baKeys = [...new Set([...Object.keys(before), ...Object.keys(after)])].sort(natural);
const baPairs = [], baSingles = [];
for (const k of baKeys) {
  const title = (k.replace(/-/g, " ").replace(/\d+/g, "").replace(/\s+/g, " ").trim() || "");
  const nice = title ? title.charAt(0).toUpperCase() + title.slice(1) : "";
  if (before[k] && after[k]) baPairs.push(pairItem(before[k], after[k], nice || "Before and after"));
  else if (before[k]) baSingles.push(processItem(before[k], "Before" + (nice ? ": " + nice : "")));
  else baSingles.push(processItem(after[k], "After" + (nice ? ": " + nice : "")));
}
// keep order inside the Before & After tab: pairs, then photos, then videos
const baOther = items[BA_KEY] || [];
items[BA_KEY] = [...baPairs, ...baSingles, ...baOther.filter((i) => !VID.test(i.files[0] || "")), ...baOther.filter((i) => VID.test(i.files[0] || ""))];

// YouTube links from videos.txt   (link | title | before-after  -> put it in the Before & After tab)
function ytId(s) {
  const m = s.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:[^\s|]*&)?v=|embed\/|shorts\/|live\/))([A-Za-z0-9_-]{11})/) || s.match(/^\s*([A-Za-z0-9_-]{11})\s*(?:\||$)/);
  return m ? m[1] : null;
}
for (const line of readLines("videos.txt")) {
  const id = ytId(line);
  if (!id) { console.log("Skipping videos.txt line (no YouTube link found): " + line); continue; }
  const parts = line.split("|").map((x) => x.trim());
  const tab = /before|after|process|renovation/i.test(parts[2] || "") ? BA_KEY : "videos";
  add(videoItem(tab, { id, title: parts[1] || "Video" }));
}
for (const k of Object.keys(items)) if (!items[k].length) delete items[k];

// ---------- covers: the picture that represents each tab ----------
const pinned = new Set(readLines("featured.txt").map((l) => l.split("|")[0].trim().toLowerCase()));
const cover = {};
for (const [tab, list] of Object.entries(items)) {
  cover[tab] = list.find((it) => it.files.some((f) => pinned.has(f.toLowerCase()))) || list[0];
}

// ---------- Portfolio page ----------
const tabs = [...CATS.filter((c) => items[c.key]).map((c) => [c.key, c.label])];
if (items[BA_KEY]) tabs.push([BA_KEY, "Before & After"]);
if (items.videos) tabs.push(["videos", "Videos"]);
const filters = '<button type="button" data-filter="all" aria-pressed="true">All</button>' +
  tabs.map(([k, l]) => '<button type="button" data-filter="' + k + '" aria-pressed="false">' + esc(l) + "</button>").join("");
const ordered = tabs.flatMap(([k]) => items[k]);
const empty = '<p class="lead" style="grid-column:1/-1">New projects are being added. Please check back soon, or message me on WhatsApp to see recent work.</p>';
const gallery = ordered.length ? ordered.map((it, i) => it.render(cover[it.tab] === it, i < 3)).join("\n      ") : empty;

// ---------- Home page: one photo from each main category (max 6) ----------
const featured = CATS.filter((c) => c.feature && cover[c.key]).slice(0, 6).map((c) => cover[c.key]);
const featuredHtml = featured.length ? featured.map((it, i) => it.render(false, i < 3)).join("\n      ") : empty;

function inject(html, marker, content) {
  const re = new RegExp("<!-- " + marker + ":START -->[\\s\\S]*?<!-- " + marker + ":END -->");
  if (!re.test(html)) throw new Error("Marker " + marker + " not found");
  return html.replace(re, () => "<!-- " + marker + ":START -->\n      " + content + "\n      <!-- " + marker + ":END -->");
}

// ---------- write the finished site to dist/ ----------
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT);
const SKIP = new Set([".git", ".github", "dist", "node_modules", "build.js", "netlify.toml", "README.md", ".gitignore", "videos.txt", "categories.txt", "featured.txt"]);
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
port = port.replace(/data-all="[a-z]*"/, 'data-all="' + allTab + '"');
fs.writeFileSync(path.join(OUT, "portfolio.html"), port);

console.log("Gallery built: " + tabs.map(([k]) => k + " " + items[k].length).join(", ") + ". All tab: " + allTab + ". Home shows " + featured.length + ".");
