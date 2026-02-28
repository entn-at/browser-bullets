// ── Readable source ──────────────────────────────────────────────────────────
// Paste the MINIFIED version from README.md into a browser bookmark's URL field.
//
// New behaviour: shows a URL input pre-filled with the current page.
// The server fetches + scrapes the URL, so any public URL works.

(function () {
  const SERVER = "http://localhost:5173/api/summarize";

  // Toggle: remove overlay if already open
  const existing = document.getElementById("__bb_overlay");
  if (existing) { existing.remove(); return; }

  // ── Overlay shell ──
  const overlay = document.createElement("div");
  overlay.id = "__bb_overlay";
  overlay.style.cssText = [
    "position:fixed", "top:20px", "right:20px", "z-index:2147483647",
    "background:#1a1a2e", "color:#e0e0e0", "font-family:system-ui,sans-serif",
    "font-size:14px", "line-height:1.5", "border-radius:12px",
    "padding:18px 20px", "max-width:420px", "width:calc(100vw - 48px)",
    "box-shadow:0 8px 32px rgba(0,0,0,.55)", "border:1px solid #333"
  ].join(";");

  // ── Header row ──
  const header = document.createElement("div");
  header.style.cssText = "display:flex;justify-content:space-between;align-items:center;margin-bottom:10px";

  const title = document.createElement("strong");
  title.textContent = "⚡ Browser Bullets";
  title.style.cssText = "font-size:15px;color:#a78bfa";

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "✕";
  closeBtn.style.cssText = "background:none;border:none;color:#aaa;cursor:pointer;font-size:16px;line-height:1;padding:0";
  closeBtn.onclick = function () { overlay.remove(); };

  header.appendChild(title);
  header.appendChild(closeBtn);

  // ── URL input row ──
  const urlRow = document.createElement("div");
  urlRow.style.cssText = "display:flex;gap:6px;margin-bottom:12px";

  const urlInput = document.createElement("input");
  urlInput.type = "text";
  urlInput.value = window.location.href;
  urlInput.style.cssText = [
    "flex:1", "background:#0d0d1a", "border:1px solid #444",
    "border-radius:6px", "color:#e0e0e0", "font-size:12px",
    "padding:6px 8px", "outline:none", "min-width:0"
  ].join(";");

  const goBtn = document.createElement("button");
  goBtn.textContent = "→";
  goBtn.style.cssText = "background:#a78bfa;border:none;border-radius:6px;color:#1a1a2e;cursor:pointer;font-size:16px;font-weight:bold;padding:6px 10px";

  urlRow.appendChild(urlInput);
  urlRow.appendChild(goBtn);

  // ── Status / results area ──
  const body = document.createElement("div");
  body.id = "__bb_body";
  body.style.cssText = "color:#a0a0b0;font-size:13px";
  body.textContent = "Enter a URL above and click →";

  overlay.appendChild(header);
  overlay.appendChild(urlRow);
  overlay.appendChild(body);
  document.body.appendChild(overlay);

  // ── Summarize action ──
  function summarize() {
    const url = urlInput.value.trim();
    if (!url) return;
    body.innerHTML = "Fetching and summarizing\u2026";
    body.style.color = "#a0a0b0";

    fetch(SERVER, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: url }),
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.error) {
          body.textContent = "Error: " + data.error;
          body.style.color = "#f87171";
          return;
        }
        body.innerHTML = "";
        body.style.color = "";
        const ul = document.createElement("ul");
        ul.style.cssText = "margin:0;padding-left:18px";
        data.bullets.forEach(function (b) {
          const li = document.createElement("li");
          li.textContent = b;
          li.style.marginBottom = "6px";
          ul.appendChild(li);
        });
        body.appendChild(ul);
      })
      .catch(function () {
        body.textContent = "Could not reach server. Is it running?";
        body.style.color = "#f87171";
      });
  }

  goBtn.onclick = summarize;
  urlInput.addEventListener("keydown", function (ev) {
    if (ev.key === "Enter") summarize();
  });
})();
