<script lang="ts">
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let mode = $state<'url' | 'text'>('url');
</script>

<svelte:head>
	<title>Browser Bullets</title>
</svelte:head>

<main>
	<h1>⚡ Browser Bullets</h1>
	<p>Get 3-bullet summaries of any article, powered by Claude.</p>

	<div class="tabs">
		<button class:active={mode === 'url'} onclick={() => (mode = 'url')}>By URL</button>
		<button class:active={mode === 'text'} onclick={() => (mode = 'text')}>Paste Text</button>
	</div>

	<form method="POST">
		{#if mode === 'url'}
			<input type="hidden" name="mode" value="url" />
			<input
				type="url"
				name="url"
				placeholder="https://example.com/article"
				value={form?.url ?? ''}
				required
			/>
		{:else}
			<input type="hidden" name="mode" value="text" />
			<textarea name="text" rows="10" placeholder="Paste article text here..." required
				>{form?.text ?? ''}</textarea
			>
		{/if}
		<button type="submit">Summarize</button>
	</form>

	{#if form?.error}
		<div class="error">{form.error}</div>
	{/if}

	{#if form?.bullets}
		<div class="results">
			<h2>Summary</h2>
			<ul>
				{#each form.bullets as bullet}
					<li>{bullet}</li>
				{/each}
			</ul>
		</div>
	{/if}
</main>

<style>
	:global(body) {
		margin: 0;
		background: #1a1a2e;
	}

	main {
		max-width: 640px;
		margin: 0 auto;
		padding: 2rem 1rem;
		font-family: system-ui, sans-serif;
		color: #e0e0e0;
	}

	h1 {
		color: #a78bfa;
	}

	p {
		color: #a0a0b0;
	}

	.tabs {
		display: flex;
		gap: 8px;
		margin-bottom: 1rem;
	}

	.tabs button {
		margin-top: 0;
		background: #16162a;
		color: #a0a0b0;
		border: 1px solid #333;
	}

	.tabs button.active {
		background: #7c3aed;
		color: white;
		border-color: #7c3aed;
	}

	input[type='url'],
	textarea {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #333;
		border-radius: 8px;
		background: #16162a;
		color: #e0e0e0;
		font-family: inherit;
		font-size: 14px;
		box-sizing: border-box;
	}

	textarea {
		resize: vertical;
	}

	button {
		margin-top: 0.75rem;
		padding: 0.6rem 1.5rem;
		background: #7c3aed;
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 14px;
		cursor: pointer;
	}

	button:hover {
		background: #6d28d9;
	}

	.error {
		margin-top: 1rem;
		color: #f87171;
	}

	.results {
		margin-top: 1.5rem;
	}

	.results ul {
		padding-left: 1.25rem;
	}

	.results li {
		margin-bottom: 0.5rem;
		line-height: 1.5;
	}
</style>
