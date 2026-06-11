/* Colour & gradient — color picker, gradient editor, image input. */

export const meta = {
  slug: "color-and-gradient",
  title: "Colour & gradient",
  nav: "Colour & gradient",
  description: "The wide-gamut OKLCH colour picker, the gradient editor, and the image drop zone — live.",
};

export const intro = `
<p>The colour engine is the deepest part of the kit: a wide-gamut <strong>OKLCH</strong>
picker with CSS Color 4 gamut mapping, shared by the colour control and the gradient
editor. All three controls on this page are lazy — on the code-split build their
modules load the first time a schema asks for them.</p>`;

export const examples = [
  {
    id: "color",
    title: "Colour",
    prose: `<p>Any colour string is recognised as a shorthand — hex in, but the picker
      works in OKLCH and can emit <code>oklch()</code>, hex, <code>rgb()</code> or
      <code>hsl()</code> (switch the format inside the picker). P3-only colours survive
      instead of clipping. The param is always a CSS-ready string.</p>`,
    target: `
      <div class="col-wrap">
        <svg class="col-blob" viewBox="0 0 200 200" width="170" height="170" aria-hidden="true">
          <path fill="#7C5CFF" d="M44.9,-65.9C57.5,-57.6,66.6,-43.9,71.6,-29C76.6,-14,77.4,2.4,72.8,16.7C68.2,31,58.1,43.3,45.8,52.8C33.5,62.3,18.9,69.1,2.9,65.5C-13.2,61.9,-26.4,48,-38.7,36.1C-51,24.2,-62.5,14.3,-66.4,1.6C-70.3,-11.2,-66.7,-26.7,-57.5,-37.5C-48.2,-48.2,-33.3,-54.1,-19.2,-61.5C-5,-68.9,8.4,-77.8,22.1,-77.1C35.8,-76.3,49.7,-66,44.9,-65.9Z" transform="translate(100 100)"/>
        </svg>
        <code class="col-readout">#7C5CFF</code>
      </div>`,
    css: `
      .col-wrap { display: flex; flex-direction: column; align-items: center; gap: 14px; }
      .col-blob path { transition: fill 0.1s; }
      .col-readout { font-size: 12.5px; color: #9a9a9a; background: rgba(255,255,255,0.05);
                     border: 1px solid rgba(255,255,255,0.08); border-radius: 7px; padding: 3px 10px; }`,
    run: ({ tweaks, mount, target }) => {
      const blob = target.querySelector(".col-blob path");
      const readout = target.querySelector(".col-readout");
      const panel = tweaks("Colour", {
        tint: "#7C5CFF",   // or { type: "color", value: "oklch(0.65 0.24 295)" }
      });
      mount.append(panel.el);

      const apply = (p) => {
        blob.setAttribute("fill", p.tint);
        readout.textContent = p.tint;
      };
      panel.on(apply);
      panel.ready.then(() => apply(panel.params));
    },
  },
  {
    id: "gradient",
    title: "Gradient",
    prose: `<p>A Figma-style stop editor: drag stops along the bar, click to add, select
      a stop to recolour it with the full picker. The value is
      <code>{ stops: [{ color, pos }] }</code> — ready to template into any CSS gradient.
      Stops can be authored in <code>oklch()</code> for wide-gamut ramps.</p>`,
    target: `<div class="grad-swatch"></div>`,
    css: `
      .grad-swatch { width: 100%; height: 120px; border-radius: 14px; align-self: center;
                     box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08); }`,
    run: ({ tweaks, mount, target }) => {
      const swatch = target.querySelector(".grad-swatch");
      const panel = tweaks("Gradient", {
        ramp: { type: "gradient", value: { stops: [
          { color: "oklch(0.72 0.19 25)", pos: 0 },
          { color: "oklch(0.86 0.17 95)", pos: 0.5 },
          { color: "oklch(0.72 0.16 280)", pos: 1 },
        ] } },
        angle: [90, 0, 360, 1],
      });
      mount.append(panel.el);

      const apply = (p) => {
        const stops = p.ramp.stops.map((s) => `${s.color} ${s.pos * 100}%`).join(", ");
        swatch.style.background = `linear-gradient(${p.angle}deg, ${stops})`;
      };
      panel.on(apply);
      panel.ready.then(() => apply(panel.params));
    },
  },
  {
    id: "image",
    title: "Image",
    prose: `<p><code>{ type: "image" }</code> is a drop zone and file picker in one row.
      The param is a data URL — drop a file on the control (or click it) and the tile
      picks it up as its background.</p>`,
    target: `<div class="img-tile"><span>Drop an image on the control →</span></div>`,
    css: `
      .img-tile { display: grid; place-items: center; width: 220px; height: 170px; border-radius: 16px;
                  background-color: rgba(255, 255, 255, 0.04); background-size: cover; background-position: center;
                  border: 1px solid rgba(255, 255, 255, 0.09); }
      .img-tile span { max-width: 18ch; text-align: center; font-size: 12.5px; color: #6f6f6f; }`,
    run: ({ tweaks, mount, target }) => {
      const tile = target.querySelector(".img-tile");
      const panel = tweaks("Image", {
        texture: { type: "image" },
      });
      mount.append(panel.el);

      const apply = (p) => {
        tile.style.backgroundImage = p.texture ? `url(${p.texture})` : "none";
        tile.querySelector("span").style.opacity = p.texture ? 0 : 1;
      };
      panel.on(apply);
      panel.ready.then(() => apply(panel.params));
    },
  },
];
