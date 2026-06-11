/* Landing page — hero + the kitchen-sink demo panel driving a live scene. */

export const meta = {
  slug: "index",
  title: "Tweakability — a dependency-free, real-time parameter panel",
  nav: "Overview",
  hero: true,
  description: "A dependency-free, code-split, real-time parameter panel. Hand it a plain schema and it builds a live control for every value.",
};

export const intro = `
<div class="hero">
  <h1>Tweakability</h1>
  <p>A dependency-free, code-split, real-time <strong>parameter panel</strong>.
  Hand it a plain schema and it builds a live control for every value —
  sliders, toggles, dropdowns, a wide-gamut OKLCH colour picker, gradient and
  cubic-bézier editors, a spring tuner, an expression grapher, monitors, a 2D
  point pad, and more. No framework, no runtime dependencies.</p>
  <div class="hero-meta">
    <span class="hero-pill">Zero dependencies</span>
    <span class="hero-pill">No framework</span>
    <span class="hero-pill">~12 KB gzip code-split</span>
    <span class="hero-pill">TypeScript types included</span>
  </div>
</div>`;

export const examples = [
  {
    id: "kitchen-sink",
    title: "Schema in, panel out",
    prose: `<p>Everything on the left is driven by the panel on the right — and the
      whole panel came from the one schema object below. Shorthands infer the control
      (<code>[value, min, max, step]</code> → slider, <code>true</code> → checkbox, a hex
      string → colour picker); the <code>{ type }</code> forms opt into the heavy controls.
      Drag the panel by its header, scrub the sliders, open the gradient.</p>`,
    target: `
      <div class="hero-stage">
        <div class="hero-blob"></div>
        <div class="hero-card"><h3>Hello</h3><p>Drag, scrub, tweak.</p></div>
      </div>`,
    css: `
      .hero-stage { position: relative; width: 100%; min-height: 300px; display: grid; place-items: center; overflow: hidden; border-radius: 10px; }
      .hero-blob { position: absolute; inset: -25%; filter: blur(24px); }
      .hero-card { position: relative; padding: 20px 26px; text-align: center; border-radius: 16px;
                   background: rgba(18, 18, 18, 0.55); border: 1px solid rgba(255, 255, 255, 0.14); backdrop-filter: blur(8px); }
      .hero-card h3 { margin: 0 0 2px; font-size: 18px; letter-spacing: -0.01em; color: #ededed; }
      .hero-card p { margin: 0; font-size: 13px; color: #b9b9b9; }`,
    run: ({ tweaks, mount, target }) => {
      const blob = target.querySelector(".hero-blob");
      const card = target.querySelector(".hero-card");
      const panel = tweaks("Demo", {
        blur: [24, 0, 100, 1],
        scale: [1, 0.5, 2, 0.1],
        label: "Hello",
        visible: true,
        blend: ["normal", "multiply", "screen", "overlay"],
        accent: "#7C5CFF",
        ramp: { type: "gradient", value: { stops: [
          { color: "oklch(0.72 0.19 25)", pos: 0 },
          { color: "oklch(0.86 0.17 95)", pos: 0.5 },
          { color: "oklch(0.72 0.16 280)", pos: 1 },
        ] } },
        motion: { type: "spring", stiffness: 220, damping: 18, mass: 1 },
        fps: { type: "fpsgraph", label: "FPS" },
      });
      mount.append(panel.el);

      let scale = 1, vel = 0, raf = 0;
      const settle = () => {            // the spring's own physics animate the card
        cancelAnimationFrame(raf);
        const tick = () => {
          const { stiffness, damping, mass } = panel.params.motion;
          vel += ((-stiffness * (scale - panel.params.scale) - damping * vel) / mass) / 60;
          scale += vel / 60;
          card.style.transform = `scale(${scale})`;
          if (Math.abs(vel) + Math.abs(scale - panel.params.scale) > 0.001) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      };
      const apply = (p, changed) => {
        const stops = p.ramp.stops.map((s) => `${s.color} ${s.pos * 100}%`).join(", ");
        blob.style.background = `linear-gradient(120deg, ${stops})`;
        blob.style.filter = `blur(${p.blur}px)`;
        blob.style.mixBlendMode = p.blend;
        card.querySelector("h3").textContent = p.label;
        card.querySelector("h3").style.color = p.accent;
        card.style.opacity = p.visible ? 1 : 0;
        if (!changed || changed === "scale" || changed === "motion") settle();
      };
      panel.on(apply);
      panel.ready.then(() => apply(panel.params));
    },
  },
  {
    title: "Where next",
    prose: `<ul>
      <li><a href="./getting-started.html">Getting started</a> — install, import, build your first panel.</li>
      <li><a href="./quick-tour.html">Quick tour</a> — the schema shorthands in two minutes.</li>
      <li>Every control, live: <a href="./numbers.html">numbers</a>,
        <a href="./text-and-choices.html">text &amp; choices</a>,
        <a href="./color-and-gradient.html">colour &amp; gradient</a>,
        <a href="./motion.html">motion &amp; curves</a>,
        <a href="./monitors.html">monitors</a>,
        <a href="./structure.html">structure</a>.</li>
      <li><a href="./panel-api.html">The panel API</a>, <a href="./theming.html">theming</a>,
        <a href="./markup.html">markup-driven panels</a> and
        <a href="./imports.html">the two builds</a>.</li>
    </ul>
    <p>Inspired by <a href="https://tweakpane.github.io" rel="noopener">Tweakpane</a> and
    <a href="https://github.com/joshpuckett/dialkit" rel="noopener">dialkit</a>. Source on
    <a href="https://github.com/ryankiley/tweakability" rel="noopener">GitHub</a> (MIT).</p>`,
  },
];
