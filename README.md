# Browser Bullets

3-bullet article summary in the browser — Claude-powered, built with SvelteKit.

## Setup

```bash
npm install
cp .env.example .env
# Edit .env and paste your Anthropic API key
```

## Run

```bash
npm run dev
# App starts at http://localhost:5173
```

## Web UI

Visit [http://localhost:5173](http://localhost:5173) and either:
- **By URL** — paste any article URL and click Summarize (server fetches + scrapes it)
- **Paste Text** — paste raw article text directly

## Bookmarklet

1. Create a new browser bookmark.
2. Set the **URL** to the single line below (copy the entire thing):

```
javascript:(function(){const S="http://localhost:5173/api/summarize";const e=document.getElementById("__bb_overlay");if(e){e.remove();return;}const o=document.createElement("div");o.id="__bb_overlay";o.style.cssText="position:fixed;top:20px;right:20px;z-index:2147483647;background:#1a1a2e;color:#e0e0e0;font-family:system-ui,sans-serif;font-size:14px;line-height:1.5;border-radius:12px;padding:18px 20px;max-width:420px;width:calc(100vw - 48px);box-shadow:0 8px 32px rgba(0,0,0,.55);border:1px solid #333";const h=document.createElement("div");h.style.cssText="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px";const ti=document.createElement("strong");ti.textContent="\u26A1 Browser Bullets";ti.style.cssText="font-size:15px;color:#a78bfa";const cb=document.createElement("button");cb.textContent="\u2715";cb.style.cssText="background:none;border:none;color:#aaa;cursor:pointer;font-size:16px;line-height:1;padding:0";cb.onclick=function(){o.remove();};h.appendChild(ti);h.appendChild(cb);const ur=document.createElement("div");ur.style.cssText="display:flex;gap:6px;margin-bottom:12px";const ui=document.createElement("input");ui.type="text";ui.value=window.location.href;ui.style.cssText="flex:1;background:#0d0d1a;border:1px solid #444;border-radius:6px;color:#e0e0e0;font-size:12px;padding:6px 8px;outline:none;min-width:0";const gb=document.createElement("button");gb.textContent="\u2192";gb.style.cssText="background:#a78bfa;border:none;border-radius:6px;color:#1a1a2e;cursor:pointer;font-size:16px;font-weight:bold;padding:6px 10px";ur.appendChild(ui);ur.appendChild(gb);const b=document.createElement("div");b.id="__bb_body";b.style.cssText="color:#a0a0b0;font-size:13px";b.textContent="Enter a URL above and click \u2192";o.appendChild(h);o.appendChild(ur);o.appendChild(b);document.body.appendChild(o);function summarize(){const url=ui.value.trim();if(!url)return;b.innerHTML="Fetching and summarizing\u2026";b.style.color="#a0a0b0";fetch(S,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url:url})}).then(function(r){return r.json();}).then(function(d){if(d.error){b.textContent="Error: "+d.error;b.style.color="#f87171";return;}b.innerHTML="";b.style.color="";const ul=document.createElement("ul");ul.style.cssText="margin:0;padding-left:18px";d.bullets.forEach(function(x){const li=document.createElement("li");li.textContent=x;li.style.marginBottom="6px";ul.appendChild(li);});b.appendChild(ul);}).catch(function(){b.textContent="Could not reach server. Is it running?";b.style.color="#f87171";});}gb.onclick=summarize;ui.addEventListener("keydown",function(ev){if(ev.key==="Enter")summarize();});})();
```

3. Click the bookmark on any page — the overlay appears pre-filled with the current URL.
4. Change the URL if you want, then press **→** or **Enter**.
5. Click **✕** or the bookmark again to dismiss.

> **Note:** For `https://` pages with a local `http://` server, Chrome may block the fetch. Click the shield icon → "Allow unsafe scripts", or use Firefox.

## Smoke test (API)

```bash
# Summarize by URL
curl -s -X POST http://localhost:5173/api/summarize \
  -H "Content-Type: application/json" \
  -d '{"url":"https://en.wikipedia.org/wiki/Artificial_intelligence"}' \
  | jq .

# Summarize raw text
curl -s -X POST http://localhost:5173/api/summarize \
  -H "Content-Type: application/json" \
  -d '{"text":"AI is transforming industries worldwide. Companies are investing billions. The technology automates tasks and improves decision-making."}' \
  | jq .
```

## Files

| File | Purpose |
|------|---------|
| `src/routes/+page.svelte` | Web UI — URL or text input, shows bullets |
| `src/routes/+page.server.ts` | Form action — scrapes URL or uses pasted text |
| `src/routes/api/summarize/+server.ts` | JSON API endpoint (used by bookmarklet) |
| `src/lib/server/anthropic.ts` | Claude API client + summarize logic |
| `src/lib/server/scraper.ts` | Cheerio-based URL fetcher + text extractor |
| `src/hooks.server.ts` | CORS headers for bookmarklet requests |
| `bookmarklet.js` | Human-readable bookmarklet source |
