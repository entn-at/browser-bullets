// ── Readable source ──────────────────────────────────────────────────────────
// Paste the MINIFIED version below into a browser bookmark's URL field.

(function () {
  const SERVER = "http://localhost:5173/api/summarize";

  // Remove any existing overlay
  const existing = document.getElementById("__bb_overlay");
  if (existing) { existing.remove(); return; }

  // Extract page text: prefer <article>, fall back to <body>
  const articleEl = document.querySelector("article");
  const text = (articleEl ? articleEl : document.body).innerText;

  // Build overlay
  const overlay = document.createElement("div");
  overlay.id = "__bb_overlay";
  overlay.style.cssText = [
    "position:fixed", "top:20px", "right:20px", "z-index:2147483647",
    "background:#1a1a2e", "color:#e0e0e0", "font-family:system-ui,sans-serif",
    "font-size:14px", "line-height:1.5", "border-radius:12px",
    "padding:18px 20px", "max-width:380px", "width:calc(100vw - 48px)",
    "box-shadow:0 8px 32px rgba(0,0,0,.55)", "border:1px solid #333"
  ].join(";");

  const header = document.createElement("div");
  header.style.cssText = "display:flex;justify-content:space-between;align-items:center;margin-bottom:12px";

  const title = document.createElement("strong");
  title.textContent = "⚡ Browser Bullets";
  title.style.cssText = "font-size:15px;color:#a78bfa";

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "✕";
  closeBtn.style.cssText = [
    "background:none", "border:none", "color:#aaa", "cursor:pointer",
    "font-size:16px", "line-height:1", "padding:0"
  ].join(";");
  closeBtn.onclick = function () { overlay.remove(); };

  header.appendChild(title);
  header.appendChild(closeBtn);

  const body = document.createElement("div");
  body.id = "__bb_body";
  body.textContent = "Summarizing…";
  body.style.cssText = "color:#a0a0b0";

  overlay.appendChild(header);
  overlay.appendChild(body);
  document.body.appendChild(overlay);

  // POST to local server
  fetch(SERVER, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
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
    .catch(function (err) {
      body.textContent = "Could not reach server. Is it running?";
      body.style.color = "#f87171";
    });
})();
