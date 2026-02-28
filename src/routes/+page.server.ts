import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { summarize } from '$lib/server/anthropic';

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const text = formData.get('text');

		if (!text || typeof text !== 'string' || text.trim().length === 0) {
			return fail(400, { error: 'Please paste some article text.', text: '' });
		}

		try {
			const bullets = await summarize(text);
			return { bullets, text };
		} catch (err) {
			console.error('Summarize error:', err instanceof Error ? err.message : err);
			return fail(502, { error: 'Failed to summarize. Please try again.', text });
		}
	}
};
