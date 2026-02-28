import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { summarize } from '$lib/server/anthropic';
import { scrapeUrl } from '$lib/server/scraper';

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const mode = formData.get('mode');
		const url = formData.get('url');
		const rawText = formData.get('text');

		let text: string;

		if (mode === 'url' && url && typeof url === 'string') {
			try {
				text = await scrapeUrl(url);
			} catch (err) {
				return fail(422, {
					error: `Could not fetch URL: ${err instanceof Error ? err.message : err}`,
					url: String(url)
				});
			}
		} else if (rawText && typeof rawText === 'string') {
			text = rawText;
		} else {
			return fail(400, { error: 'Please provide a URL or paste some article text.', text: '' });
		}

		if (!text.trim()) {
			return fail(400, { error: 'No readable text found at that URL.', url: String(url ?? '') });
		}

		try {
			const bullets = await summarize(text);
			return { bullets, url: String(url ?? ''), text: String(rawText ?? '') };
		} catch (err) {
			console.error('Summarize error:', err instanceof Error ? err.message : err);
			return fail(502, { error: 'Failed to summarize. Please try again.', text: String(rawText ?? '') });
		}
	}
};
