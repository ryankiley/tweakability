// ── Gradient — a wide-gamut OKLCH gradient editor. Lazy; depends on the colour
// module (reuses its picker, parseColor, and oklchStr).
import { el, dragGesture, clamp, registerControl } from "../shared.js";
import { createColor, parseColor, oklchStr } from "./colour.js";

const ICON_PLUS = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>`;

// ── Gradient — a wide-gamut gradient editor. A bar of colour stops, each a full
// OKLCH colour (edited by the reused picker below). Drag a stop to move it, click
// the bar to add one, double-click to remove (min 2). The bar blends in OKLCH (CSS
// `linear-gradient(in oklch …)`) — a true wide-gamut gradient no sRGB picker makes.
// Value: { stops: [{ color, pos }] }. ──
function normalizeStops(value) {
  const DEF = [{ color: "oklch(0.72 0.19 25)", pos: 0 }, { color: "oklch(0.72 0.16 280)", pos: 1 }];
  const arr = Array.isArray(value) ? value : (value && Array.isArray(value.stops) ? value.stops : null);
  // Map each entry defensively — a [color, pos] tuple or a { color, pos } object — and
  // drop anything else (a null / garbage element would throw on `.color`); coerce a
  // non-finite pos to 0. Fewer than two usable stops falls back to the default pair.
  const out = (arr || []).map((s) => {
    if (Array.isArray(s)) return { color: String(s[0]), pos: +s[1] || 0 };
    if (s && typeof s === "object") return { color: String(s.color), pos: +s.pos || 0 };
    return null;
  }).filter(Boolean);
  return out.length >= 2 ? out : DEF;
}
function createGradient(meta, onChange) {
  let stops = normalizeStops(meta.value);
  let selStop = stops[0];
  const root = el("div", "tw-gradient");
  const bar = el("div", "tw-gradient-bar");
  const grad = el("div", "tw-gradient-grad");
  const rail = el("div", "tw-gradient-rail");
  bar.append(grad, rail); root.append(bar);

  const sorted = () => [...stops].sort((a, b) => a.pos - b.pos);
  const cssStops = () => sorted().map((s) => `${s.color} ${(s.pos * 100).toFixed(1)}%`).join(", ");
  const paint = () => { grad.style.background = `linear-gradient(in oklch to right, ${cssStops()})`; };
  const value = () => ({ stops: sorted().map((s) => ({ color: s.color, pos: +s.pos.toFixed(4) })) });
  const emit = () => onChange(value());

  // The picker (a reused colour row) edits whichever stop is selected.
  const picker = createColor({ value: selStop.color, label: "Stop" }, (c) => {
    selStop.color = c;
    const h = [...rail.children].find((x) => x._stop === selStop); if (h) h.style.setProperty("--stop", c);
    paint(); emit();
  });
  // The selected stop's swatch + value sit in a field; the + (add stop) lives in
  // that field beside it, so there's one place to read, edit, and add a stop.
  const pickerRow = el("div", "tw-gradient-picker");
  pickerRow.append(picker.el);
  root.append(pickerRow);

  const reflectSel = () => { for (const h of rail.children) h.dataset.sel = String(h._stop === selStop); };
  const renderHandles = () => {
    rail.replaceChildren();
    for (const s of stops) {
      const h = el("button", "tw-gradient-stop"); h.type = "button"; h._stop = s;
      h.style.left = s.pos * 100 + "%"; h.style.setProperty("--stop", s.color);
      h.dataset.sel = String(s === selStop); h.setAttribute("aria-label", "Colour stop");
      let offBar = false;
      dragGesture(h, {
        onDown: (e) => { e.preventDefault(); e.stopPropagation(); select(s, false); offBar = false; },
        onMove: (e) => {
          s.pos = posFromX(e.clientX); h.style.left = s.pos * 100 + "%"; paint(); emit();
          // Drag a stop clear of the bar (past ~24px above/below) to remove it — the
          // touch-friendly removal path; floored at two stops. The stop fades as a cue.
          const r = rail.getBoundingClientRect();
          offBar = stops.length > 2 && (e.clientY < r.top - 24 || e.clientY > r.bottom + 24);
          h.dataset.removing = String(offBar);
        },
        onEnd: () => { if (offBar) removeStop(s); else h.dataset.removing = "false"; },
      });
      h.addEventListener("dblclick", (e) => { e.preventDefault(); removeStop(s); });
      rail.append(h);
    }
  };
  // During a drag we only flip the selected flag (no re-render), so the dragged
  // handle element stays live; full re-render happens on add / remove / external set.
  const select = (s, rerender) => { selStop = s; picker.set(s.color); rerender ? renderHandles() : reflectSel(); };

  // Stop drag rides the shared dragGesture (pointer capture + automatic pointercancel
  // cleanup), wired per handle in renderHandles — so a touch-drag the browser interrupts
  // with a scroll can't leak a document listener or strand the drag. (.tw-gradient-stop is
  // touch-action:none now, like every other drag surface, so it drags cleanly on touch.)
  const posFromX = (x) => { const r = rail.getBoundingClientRect(); return clamp((x - r.left) / (r.width || 1), 0, 1); };

  // Colour for a new stop: interpolate the two bracketing stops in OKLCH (short-way hue).
  const colorAt = (pos) => {
    const ss = sorted(); let lo = ss[0], hi = ss[ss.length - 1];
    for (let k = 0; k < ss.length - 1; k++) if (pos >= ss[k].pos && pos <= ss[k + 1].pos) { lo = ss[k]; hi = ss[k + 1]; break; }
    const t = hi.pos > lo.pos ? (pos - lo.pos) / (hi.pos - lo.pos) : 0;
    const a = parseColor(lo.color), b = parseColor(hi.color);
    let dh = b[2] - a[2]; if (dh > 180) dh -= 360; else if (dh < -180) dh += 360;
    const H = (((a[2] + dh * t) % 360) + 360) % 360; // normalise to [0,360) so the picker reads it cleanly
    return oklchStr(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, H, a[3] + (b[3] - a[3]) * t);
  };
  const removeStop = (s) => {
    if (stops.length <= 2) return;
    const i = stops.indexOf(s); stops.splice(i, 1);
    if (selStop === s) selStop = stops[Math.max(0, i - 1)];
    paint(); select(selStop, true); emit();
    const h = [...rail.children].find((x) => x._stop === selStop); if (h) h.focus(); // keep focus on a handle so Delete can chain
  };
  // Add a stop next to the SELECTED one, so where it lands is predictable: midway toward
  // the next stop on its right — or, when the selected stop is the last, midway toward the
  // one on its left. (Was the widest gap, which felt arbitrary — you couldn't tell where
  // the new stop would appear.) It samples the gradient there; drag it to taste. No
  // click-to-add on the bar: that fought with grabbing a stop to reposition it.
  const addBtn = el("button", "tw-gradient-add", ICON_PLUS); addBtn.type = "button"; addBtn.title = "Add a stop after the selected one"; addBtn.setAttribute("aria-label", "Add a colour stop after the selected one");
  pickerRow.append(addBtn);
  const addStop = () => {
    const ss = sorted();
    let i = ss.indexOf(selStop); if (i < 0) i = 0;
    const at = i < ss.length - 1 ? (ss[i].pos + ss[i + 1].pos) / 2   // midway toward the next stop
             : i > 0             ? (ss[i - 1].pos + ss[i].pos) / 2   // selected is last → midway toward the previous
             : clamp(ss[i].pos + 0.1, 0, 1);                         // lone stop (floor is 2, so a safety net)
    const s = { color: colorAt(at), pos: at };
    stops.push(s); paint(); select(s, true); emit();
  };
  addBtn.addEventListener("click", (e) => { e.stopPropagation(); addStop(); });

  // Delete / Backspace removes the selected stop (min 2). Ignored while typing in a field.
  root.tabIndex = -1;
  root.addEventListener("keydown", (e) => {
    if ((e.key === "Delete" || e.key === "Backspace") && !/^(input|textarea|select)$/i.test(e.target.tagName) && stops.length > 2) { e.preventDefault(); removeStop(selStop); }
  });

  renderHandles(); paint();
  return {
    el: root,
    set: (v) => { stops = normalizeStops(v); selStop = stops[0]; renderHandles(); paint(); picker.set(selStop.color); },
    get: () => value(),
  };
}

registerControl("gradient", createGradient);

