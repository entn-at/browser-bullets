import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { summarize } from '$lib/server/anthropic';
import { scrapeUrl } from '$lib/server/scraper';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const { text: rawText, url } = body;

	let text = rawText;

	if (url && typeof url === 'string') {
		try {
			text = await scrapeUrl(url);
		} catch (err) {
			error(422, `Could not fetch URL: ${err instanceof Error ? err.message : err}`);
		}
	}

	if (!text || typeof text !== 'string' || text.trim().length === 0) {
		error(400, 'No readable text found. Provide "text" or a valid "url".');
	}

	try {
		const bullets = await summarize(text);
		return json({ bullets });
	} catch (err) {
		console.error('Claude API error:', err instanceof Error ? err.message : err);
		error(502, 'Failed to summarize article.');
	}
};
