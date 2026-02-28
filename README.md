# Browser Bullets

3-bullet article summary in the browser — Claude-powered hackathon demo.

## Setup

```bash
npm install
cp .env.example .env
# Edit .env and paste your Anthropic API key
```

## Run

```bash
npm start
# Server starts at http://localhost:3000
```

For auto-reload during development:

```bash
npm run dev
```

## Smoke test

Summarize by URL (server fetches + scrapes):

```bash
curl -s -X POST http://localhost:3000/summarize \
  -H "Content-Type: application/json" \
  -d '{"url":"https://en.wikipedia.org/wiki/Artificial_intelligence"}' \
  | jq .
```

Or pass raw text directly:

```bash
curl -s -X POST http://localhost:3000/summarize \
  -H "Content-Type: application/json" \
  -d '{"text":"Artificial intelligence is transforming industries worldwide. Companies are investing billions in AI research and development. The technology promises to automate repetitive tasks, improve decision-making, and create new economic opportunities, though it also raises concerns about job displacement and ethical governance."}' \
  | jq .
```

Expected response:

```json
{
  "bullets": [
    "...",
    "...",
    "..."
  ]
}
```

## Bookmarklet

1. Create a new browser bookmark.
2. Set the **URL** to the single line below (copy the entire thing):

```
javascript:(function(){const S="http://localhost:3000/summarize";const e=document.getElementById("__bb_overlay");if(e){e.remove();return;}const o=document.createElement("div");o.id="__bb_overlay";o.style.cssText="position:fixed;top:20px;right:20px;z-index:2147483647;background:#1a1a2e;color:#e0e0e0;font-family:system-ui,sans-serif;font-size:14px;line-height:1.5;border-radius:12px;padding:18px 20px;max-width:420px;width:calc(100vw - 48px);box-shadow:0 8px 32px rgba(0,0,0,.55);border:1px solid #333";const h=document.createElement("div");h.style.cssText="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px";const ti=document.createElement("strong");ti.textContent="\u26A1 Browser Bullets";ti.style.cssText="font-size:15px;color:#a78bfa";const cb=document.createElement("button");cb.textContent="\u2715";cb.style.cssText="background:none;border:none;color:#aaa;cursor:pointer;font-size:16px;line-height:1;padding:0";cb.onclick=function(){o.remove();};h.appendChild(ti);h.appendChild(cb);const ur=document.createElement("div");ur.style.cssText="display:flex;gap:6px;margin-bottom:12px";const ui=document.createElement("input");ui.type="text";ui.value=window.location.href;ui.style.cssText="flex:1;background:#0d0d1a;border:1px solid #444;border-radius:6px;color:#e0e0e0;font-size:12px;padding:6px 8px;outline:none;min-width:0";const gb=document.createElement("button");gb.textContent="\u2192";gb.style.cssText="background:#a78bfa;border:none;border-radius:6px;color:#1a1a2e;cursor:pointer;font-size:16px;font-weight:bold;padding:6px 10px";ur.appendChild(ui);ur.appendChild(gb);const b=document.createElement("div");b.id="__bb_body";b.style.cssText="color:#a0a0b0;font-size:13px";b.textContent="Enter a URL above and click \u2192";o.appendChild(h);o.appendChild(ur);o.appendChild(b);document.body.appendChild(o);function summarize(){const url=ui.value.trim();if(!url)return;b.innerHTML="Fetching and summarizing\u2026";b.style.color="#a0a0b0";fetch(S,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url:url})}).then(function(r){return r.json();}).then(function(d){if(d.error){b.textContent="Error: "+d.error;b.style.color="#f87171";return;}b.innerHTML="";b.style.color="";const ul=document.createElement("ul");ul.style.cssText="margin:0;padding-left:18px";d.bullets.forEach(function(x){const li=document.createElement("li");li.textContent=x;li.style.marginBottom="6px";ul.appendChild(li);});b.appendChild(ul);}).catch(function(){b.textContent="Could not reach server. Is it running?";b.style.color="#f87171";});}gb.onclick=summarize;ui.addEventListener("keydown",function(ev){if(ev.key==="Enter")summarize();});})();
```

3. Click the bookmark on any page.
4. The overlay appears pre-filled with the current URL — change it to any URL you want, then press **→** or hit **Enter**.
5. Click **✕** or click the bookmark again to dismiss.

> **Note:** The server fetches the target URL server-side, so it works on any public URL regardless of what page you're currently on. For `https://` pages with a local `http://` server, Chrome may block the fetch — click the shield icon → "Allow unsafe scripts", or use Firefox.

## Files

| File | Purpose |
|------|---------|
| `server.js` | Express API — accepts `{ url }` or `{ text }`, scrapes with cheerio, summarizes with Claude |
| `bookmarklet.js` | Human-readable bookmarklet source |
| `.env.example` | Environment variable template |
