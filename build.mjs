/* Tweakability — build the kit. One source (src/tweaks/ + wide-gamut.js +
 * tweaks.css), two JS outputs:
 *   • dist/tweaks/        minified, esbuild code-split chunks the browser runs
 *                         (core.js entry + a chunk per lazy control + a shared
 *                         chunk). Basic panels fetch core + shared; the colour
 *                         engine and the other heavy controls load on demand.
 *   • dist/tweaks.js      the readable single file — every control inline and
 *                         synchronous — the canonical copyable artifact,
 *                         concatenated from the modules with comments intact.
 * Plus dist/tweaks.css (minified), dist/wide-gamut.js (the readable build
 * imports it), and the demo page → dist/index.html (GitHub Pages root).
 */
import { readFile, writeFile, mkdir, rm, cp } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const p = (...s) => path.join(ROOT, ...s);
const TW_DIR = p("src/tweaks");

await rm(p("dist"), { recursive: true, force: true });
await mkdir(p("dist"), { recursive: true });

// 1) minified, code-split chunks → dist/tweaks/
try {
  const esbuild = await import("esbuild");
  await esbuild.build({
    entryPoints: [path.join(TW_DIR, "core.js")],
    outdir: p("dist/tweaks"),
    bundle: true, splitting: true, format: "esm", minify: true, target: "es2020", legalComments: "none",
  });
} catch (e) {
  await cp(TW_DIR, p("dist/tweaks"), { recursive: true }); // fallback: unminified source runs as-is
  console.warn("⚠ esbuild unavailable — shipping unminified tweaks/ source (run `npm install`):", e.message);
}

// 2) readable single file → dist/tweaks.js. Concatenate the modules in dependency
//    order, strip the intra-package import/export glue, keep the one ./wide-gamut.js
//    import, and neutralize the split-only dynamic-import map — so every control is
//    present and the panel builds synchronously, exactly like the old monolith.
{
  const TW_ORDER = ["shared.js", "controls/colour.js", "controls/gradient.js", "controls/interval.js", "controls/tabs.js", "controls/image.js", "controls/monitor.js", "controls/spring.js", "controls/bezier.js", "controls/point.js", "controls/plot.js", "core.js"];
  let wideImport = "";
  const parts = [];
  for (const f of TW_ORDER) {
    let src = await readFile(path.join(TW_DIR, f), "utf8");
    src = src.replace(/^import\s*\{[^\n]*?\}\s*from\s*["']\.\.\/\.\.\/wide-gamut\.js["'];?[ \t]*\r?\n/m, (m) => { wideImport = m.replace("../../wide-gamut.js", "./wide-gamut.js"); return ""; });
    src = src.replace(/^import\s*(?:\{[\s\S]*?\}|\*\s*as\s*\w+|\w+)\s*from\s*["']\.[^"']*["'];?[ \t]*\r?\n/gm, "");
    src = src.replace(/^export\s+(async\s+function|function|const|let|class)\b/gm, "$1");
    src = src.replace(/^export\s*\{[\s\S]*?\};?[ \t]*\r?\n/gm, "");
    src = src.replace(/\/\* @tw-split-only \*\/[\s\S]*?\/\* @tw-split-end \*\//, "{}");
    parts.push(src.trim());
  }
  const readable =
    "/* Tweakability — the readable single-file build, concatenated from src/tweaks/*.\n" +
    " * The canonical copyable artifact: every control inline and synchronous, zero\n" +
    " * runtime deps but ./wide-gamut.js. Production runs the split tweaks/ chunks; this\n" +
    " * file is for reading and copying. Edit src/tweaks/, not this. */\n\n" +
    wideImport + "\n" + parts.join("\n\n") + "\n\nexport { tweaks, enhance, compileExpr };\n";
  await writeFile(p("dist/tweaks.js"), readable);
}

// 3) minified panel CSS → dist/tweaks.css
try {
  const esbuild = await import("esbuild");
  const { code } = await esbuild.transform(await readFile(p("src/tweaks.css"), "utf8"), { minify: true, loader: "css" });
  await writeFile(p("dist/tweaks.css"), code);
} catch {
  await cp(p("src/tweaks.css"), p("dist/tweaks.css"));
}

// 4) the OKLCH colour engine — the readable build imports ./wide-gamut.js
await cp(p("src/wide-gamut.js"), p("dist/wide-gamut.js"));

// 5) demo page → dist/index.html (GitHub Pages serves dist/)
if (existsSync(p("demo/index.html"))) await cp(p("demo/index.html"), p("dist/index.html"));

console.log("Built tweakability → dist/");
