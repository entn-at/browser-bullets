import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { summarize } from '$lib/server/anthropic';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const { text } = body;

	if (!text || typeof text !== 'string' || text.trim().length === 0) {
		error(400, 'Missing or empty "text" field.');
	}

	try {
		const bullets = await summarize(text);
		return json({ bullets });
	} catch (err) {
		console.error('Claude API error:', err instanceof Error ? err.message : err);
		error(502, 'Failed to summarize article.');
	}
};
