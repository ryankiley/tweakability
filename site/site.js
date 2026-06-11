/* Docs shell runtime — copy buttons on snippets + the mobile nav drawer. */
(() => {
  document.querySelectorAll(".ex-codewrap").forEach((wrap) => {
    const code = wrap.querySelector("code");
    if (!code) return;
    const btn = document.createElement("button");
    btn.className = "ex-copy";
    btn.type = "button";
    btn.textContent = "Copy";
    btn.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(code.textContent); btn.textContent = "Copied"; }
      catch { btn.textContent = "Copy failed"; }
      setTimeout(() => (btn.textContent = "Copy"), 1200);
    });
    wrap.append(btn);
  });

  const menu = document.querySelector(".topbar-menu");
  const setOpen = (open) => {
    document.body.classList.toggle("nav-open", open);
    menu && menu.setAttribute("aria-expanded", String(open));
  };
  menu && menu.addEventListener("click", (e) => {
    e.stopPropagation();
    setOpen(!document.body.classList.contains("nav-open"));
  });
  document.addEventListener("click", (e) => {
    if (document.body.classList.contains("nav-open") && !e.target.closest(".sb")) setOpen(false);
  });
})();
