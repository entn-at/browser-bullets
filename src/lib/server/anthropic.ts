import Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_API_KEY } from '$env/static/private';

const MAX_CHARS = 40_000;

const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

export async function summarize(text: string): Promise<string[]> {
	const trimmed = text.slice(0, MAX_CHARS);

	const message = await client.messages.create({
		model: 'claude-opus-4-6',
		max_tokens: 256,
		messages: [
			{
				role: 'user',
				content: `Summarize the following article in exactly 3 concise bullet points. Respond with ONLY valid JSON in this exact format — no markdown, no explanation, no extra keys:\n{"bullets":["bullet one","bullet two","bullet three"]}\n\nArticle:\n${trimmed}`
			}
		]
	});

	const raw = (message.content[0] as { type: 'text'; text: string }).text.trim();

	let parsed: { bullets: unknown };
	try {
		parsed = JSON.parse(raw);
	} catch {
		const match = raw.match(/\{[\s\S]*\}/);
		if (!match) throw new Error('No JSON found in model response.');
		parsed = JSON.parse(match[0]);
	}

	if (
		!Array.isArray(parsed.bullets) ||
		parsed.bullets.length !== 3 ||
		parsed.bullets.some((b: unknown) => typeof b !== 'string')
	) {
		throw new Error('Model returned unexpected bullet format.');
	}

	return parsed.bullets as string[];
}
