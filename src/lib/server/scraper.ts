import * as cheerio from 'cheerio';

const MAX_CHARS = 40_000;

export async function scrapeUrl(url: string): Promise<string> {
	const res = await fetch(url, {
		headers: {
			'User-Agent': 'Mozilla/5.0 (compatible; BrowserBullets/1.0)',
			Accept: 'text/html,application/xhtml+xml'
		},
		redirect: 'follow'
	});

	if (!res.ok) throw new Error(`HTTP ${res.status} fetching URL`);

	const html = await res.text();
	const $ = cheerio.load(html);
	$('script, style, nav, footer, header, aside, noscript, iframe').remove();

	const text =
		$('article').text().trim() ||
		$('main').text().trim() ||
		$("[role='main']").text().trim() ||
		$('body').text().trim();

	return text.replace(/\s+/g, ' ').trim().slice(0, MAX_CHARS);
}
