import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

// --- Config ---
const CLIENT_ID = process.env.REDDIT_CLIENT_ID || "";
const CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET || "";
const REDIRECT_URI = process.env.REDDIT_REDIRECT_URI || "http://localhost:8080/callback";
const USERNAME = process.env.REDDIT_USERNAME || "";
const OUTPUT_DIR = process.env.OUTPUT_DIR || "./reddit_saved";

// Reddit API base
const REDDIT_API = "https://oauth.reddit.com";
const REDDIT_AUTH = "https://www.reddit.com/api/v1";

// --- Types ---
interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  refresh_token?: string;
}

interface RedditPost {
  kind: string;
  data: {
    id: string;
    name: string;
    title?: string;
    selftext?: string;
    url?: string;
    permalink: string;
    subreddit: string;
    author: string;
    score: number;
    created_utc: number;
    is_self?: boolean;
    body?: string; // for comments
    link_title?: string; // for comments
    link_permalink?: string; // for comments
  };
}

interface SavedListing {
  data: {
    children: RedditPost[];
    after: string | null;
    before: string | null;
  };
}

// --- Auth: Script App (username+password) flow ---
async function getTokenPassword(): Promise<string> {
  const password = process.env.REDDIT_PASSWORD || "";
  if (!USERNAME || !password) {
    throw new Error("Set REDDIT_USERNAME and REDDIT_PASSWORD env vars for password auth.");
  }

  const body = new URLSearchParams({
    grant_type: "password",
    username: USERNAME,
    password,
  });

  const res = await fetch(`${REDDIT_AUTH}/access_token`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": `ragtag-reddit-saver/1.0 by ${USERNAME}`,
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Auth failed (${res.status}): ${text}`);
  }

  const json = (await res.json()) as TokenResponse;
  return json.access_token;
}

// --- Fetch all saved items (paginated) ---
async function fetchAllSaved(token: string): Promise<RedditPost[]> {
  const all: RedditPost[] = [];
  let after: string | null = null;
  let page = 1;

  while (true) {
    const params = new URLSearchParams({ limit: "100", type: "links,comments" });
    if (after) params.set("after", after);

    const url = `${REDDIT_API}/user/${USERNAME}/saved?${params}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": `ragtag-reddit-saver/1.0 by ${USERNAME}`,
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to fetch saved (${res.status}): ${text}`);
    }

    const listing = (await res.json()) as SavedListing;
    const items = listing.data.children;

    if (items.length === 0) break;

    all.push(...items);
    console.log(`  Page ${page}: fetched ${items.length} items (total: ${all.length})`);

    after = listing.data.after;
    if (!after) break;

    page++;
    // Rate-limit: Reddit allows ~60 req/min for OAuth apps
    await sleep(1000);
  }

  return all;
}

// --- Fetch full thread comments for a post ---
async function fetchThread(token: string, permalink: string): Promise<unknown> {
  const url = `${REDDIT_API}${permalink}.json?limit=500&depth=10`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": `ragtag-reddit-saver/1.0 by ${USERNAME}`,
    },
  });

  if (!res.ok) {
    console.warn(`  Warning: could not fetch thread ${permalink} (${res.status})`);
    return {};
  }

  return res.json();
}

// --- Save helpers ---
function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function sanitize(str: string): string {
  return str.replace(/[^a-zA-Z0-9_\-. ]/g, "_").slice(0, 80);
}

function saveJSON(filepath: string, data: unknown) {
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), "utf-8");
}

function saveMarkdown(filepath: string, post: RedditPost) {
  const d = post.data;
  const isComment = post.kind === "t1";
  const date = new Date(d.created_utc * 1000).toISOString();

  let md = "";

  if (isComment) {
    md += `# Comment by u/${d.author}\n\n`;
    md += `**In thread:** [${d.link_title}](https://reddit.com${d.link_permalink})\n\n`;
    md += `**Subreddit:** r/${d.subreddit} | **Score:** ${d.score} | **Date:** ${date}\n\n`;
    md += `---\n\n`;
    md += d.body || "";
  } else {
    md += `# ${d.title}\n\n`;
    md += `**Subreddit:** r/${d.subreddit} | **Author:** u/${d.author} | **Score:** ${d.score} | **Date:** ${date}\n\n`;
    md += `**Link:** https://reddit.com${d.permalink}\n\n`;
    if (d.url && !d.is_self) md += `**URL:** ${d.url}\n\n`;
    md += `---\n\n`;
    if (d.selftext) md += d.selftext;
  }

  fs.writeFileSync(filepath, md, "utf-8");
}

// --- Main ---
async function main() {
  if (!CLIENT_ID || !CLIENT_SECRET || !USERNAME) {
    console.error(`
Missing required environment variables. Set:
  REDDIT_CLIENT_ID      - your Reddit app client ID
  REDDIT_CLIENT_SECRET  - your Reddit app client secret
  REDDIT_USERNAME       - your Reddit username
  REDDIT_PASSWORD       - your Reddit password

Create a Reddit app at: https://www.reddit.com/prefs/apps
(Use "script" type for personal use)
`);
    process.exit(1);
  }

  ensureDir(OUTPUT_DIR);
  ensureDir(path.join(OUTPUT_DIR, "posts"));
  ensureDir(path.join(OUTPUT_DIR, "comments"));
  ensureDir(path.join(OUTPUT_DIR, "threads"));

  console.log("Authenticating with Reddit...");
  const token = await getTokenPassword();
  console.log("Auth successful.\n");

  console.log(`Fetching saved items for u/${USERNAME}...`);
  const saved = await fetchAllSaved(token);
  console.log(`\nTotal saved items: ${saved.length}\n`);

  // Save index
  saveJSON(path.join(OUTPUT_DIR, "index.json"), saved);

  const fetchThreads = process.argv.includes("--with-threads");

  let postCount = 0;
  let commentCount = 0;

  for (const item of saved) {
    const d = item.data;
    const isComment = item.kind === "t1";
    const date = new Date(d.created_utc * 1000).toISOString().split("T")[0];

    if (isComment) {
      const name = sanitize(`${date}_${d.id}_${d.link_title || "comment"}`);
      const dir = path.join(OUTPUT_DIR, "comments");
      saveJSON(path.join(dir, `${name}.json`), item);
      saveMarkdown(path.join(dir, `${name}.md`), item);
      commentCount++;
      process.stdout.write(`\r  Saved: ${postCount} posts, ${commentCount} comments`);
    } else {
      const name = sanitize(`${date}_${d.id}_${d.title || "post"}`);
      const dir = path.join(OUTPUT_DIR, "posts");
      saveJSON(path.join(dir, `${name}.json`), item);
      saveMarkdown(path.join(dir, `${name}.md`), item);
      postCount++;
      process.stdout.write(`\r  Saved: ${postCount} posts, ${commentCount} comments`);

      if (fetchThreads && d.permalink) {
        await sleep(600); // stay under rate limit
        const thread = await fetchThread(token, d.permalink);
        const threadName = sanitize(`${date}_${d.id}_${d.title || "thread"}`);
        saveJSON(path.join(OUTPUT_DIR, "threads", `${threadName}.json`), thread);
      }
    }
  }

  console.log(`\n\nDone!`);
  console.log(`  Posts:    ${postCount}`);
  console.log(`  Comments: ${commentCount}`);
  console.log(`  Output:   ${path.resolve(OUTPUT_DIR)}`);

  if (!fetchThreads) {
    console.log(`\nTip: run with --with-threads to also download full comment threads for each saved post.`);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
