<script lang="ts">
	import type { ActionData } from './$types';
	import TTSButton from '$lib/components/TTSButton.svelte';

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
	<title>Rag Briefing</title>
</svelte:head>

<main>
	<p>Paste an article below to get 3 concise bullet-point summaries powered by Claude.</p>

	<form method="POST">
		<textarea name="text" rows="10" placeholder="Paste article text here..." required
			>{form?.text ?? ''}</textarea
		>
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
			<TTSButton text={form.bullets.join(' ')} />
		</div>
	{/if}
</main>

<style>
	main {
		max-width: 640px;
		margin: 0 auto;
		padding: 2rem 1rem;
		color: #e0e0e0;
	}

	p {
		color: #a0a0b0;
	}

	textarea {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #333;
		border-radius: 8px;
		background: #16162a;
		color: #e0e0e0;
		font-family: inherit;
		font-size: 14px;
		resize: vertical;
		box-sizing: border-box;
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
