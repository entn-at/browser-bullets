<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import TTSButton from '$lib/components/TTSButton.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
	<title>URLs - Rag Briefing</title>
</svelte:head>

<main>
	<form method="POST" action="?/add">
		<input type="url" name="url" placeholder="https://example.com/article" required />
		<button type="submit">Add</button>
	</form>

	{#if form?.error}
		<div class="error">{form.error}</div>
	{/if}

	{#if data.urls.length > 0}
		<ul class="url-list">
			{#each data.urls as url}
				<li><a href={url} target="_blank" rel="noopener">{url}</a></li>
			{/each}
		</ul>

		<form method="POST" action="?/generate">
			<button type="submit" class="generate">Generate Briefing</button>
		</form>
	{:else}
		<p class="empty">No URLs added yet.</p>
	{/if}

	{#if form?.results}
		{@const allText = form.results
			.filter((r) => r.summary)
			.map((r) => r.summary)
			.join(' ')}
		<div class="briefing">
			<div class="briefing-header">
				<h2>Briefing</h2>
				{#if allText}
					<TTSButton text={allText} />
				{/if}
			</div>
			{#each form.results as result}
				<div class="result">
					<h3><a href={result.url} target="_blank" rel="noopener">{result.url}</a></h3>
					{#if result.summary}
						<ul class="summary">
							{#each result.summary.split('\n\n') as bullet}
								<li>
									<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
										<circle cx="8" cy="8" r="7" stroke="#a78bfa" stroke-width="1.5"/>
										<circle cx="8" cy="8" r="3" fill="#a78bfa"/>
									</svg>
									<span>{bullet}</span>
								</li>
							{/each}
						</ul>
						<TTSButton text={result.summary} />
					{:else if result.error}
						<p class="error">{result.error}</p>
					{/if}
				</div>
			{/each}
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

	form {
		display: flex;
		gap: 0.5rem;
	}

	input {
		flex: 1;
		padding: 0.6rem 0.75rem;
		border: 1px solid #333;
		border-radius: 8px;
		background: #16162a;
		color: #e0e0e0;
		font-family: inherit;
		font-size: 14px;
	}

	button {
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

	.generate {
		margin-top: 1rem;
		width: 100%;
	}

	.error {
		margin-top: 1rem;
		color: #f87171;
	}

	.url-list {
		margin-top: 1.5rem;
		padding-left: 1.25rem;
	}

	.url-list li {
		margin-bottom: 0.5rem;
		line-height: 1.5;
	}

	.url-list a {
		color: #a78bfa;
		text-decoration: none;
	}

	.url-list a:hover {
		text-decoration: underline;
	}

	.empty {
		margin-top: 1.5rem;
		color: #a0a0b0;
	}

	.briefing {
		margin-top: 2rem;
		border-top: 1px solid #333;
		padding-top: 1.5rem;
	}

	.briefing-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.briefing-header h2 {
		color: #a78bfa;
		margin: 0;
	}

	.result {
		margin-bottom: 1.5rem;
	}

	.result h3 {
		font-size: 14px;
		margin-bottom: 0.5rem;
	}

	.result h3 a {
		color: #a78bfa;
		text-decoration: none;
	}

	.result h3 a:hover {
		text-decoration: underline;
	}

	.summary {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.summary li {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		line-height: 1.5;
	}

	.summary li svg {
		flex-shrink: 0;
		margin-top: 2px;
	}
</style>
