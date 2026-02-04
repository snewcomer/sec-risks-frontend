<script lang="ts">
	let { gaps }: { gaps: { theme_name: string; industry_freq: number }[] } = $props();

	let showAll = $state(false);

	const INITIAL_COUNT = 5;

	let visibleGaps = $derived(showAll ? gaps : gaps.slice(0, INITIAL_COUNT));
	let hasMore = $derived(gaps.length > INITIAL_COUNT);
</script>

<div class="vane-gap-panel">
	<h2 class="vane-gap-title">Expected Industry Disclosures Not Found</h2>

	{#if gaps.length === 0}
		<div class="vane-gap-empty">
			<span class="vane-mono vane-gray-light">This company covers all common industry themes.</span>
		</div>
	{:else}
		<ul class="vane-gap-list">
			{#each visibleGaps as gap}
				<li class="vane-gap-row">
					<span class="vane-gap-theme">{gap.theme_name}</span>
					<span class="vane-gap-freq">{Math.round(gap.industry_freq)}% of peers</span>
				</li>
			{/each}
		</ul>

		{#if hasMore}
			<button class="vane-gap-toggle" onclick={() => (showAll = !showAll)}>
				{showAll ? 'Show less' : `Show all ${gaps.length} gaps`}
			</button>
		{/if}
	{/if}
</div>

<style>
	.vane-gap-panel {
		background: white;
		border: 1px solid #e3e8ef;
		border-radius: 12px;
		padding: 1.5rem 2rem;
	}

	.vane-gap-title {
		font-family: var(--vane-display);
		font-size: 1.25rem;
		font-weight: 500;
		margin: 0 0 1.25rem;
		color: #1a1f36;
	}

	.vane-gap-empty {
		text-align: center;
		padding: 2rem;
		border: 2px dashed #e3e8ef;
		border-radius: 8px;
	}

	.vane-gap-list {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.vane-gap-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 0;
		border-bottom: 1px solid #f0f2f5;
	}

	.vane-gap-row:last-child {
		border-bottom: none;
	}

	.vane-gap-theme {
		font-size: 0.9375rem;
		color: #1a1f36;
		font-weight: 500;
	}

	.vane-gap-freq {
		font-family: var(--vane-mono);
		font-size: 0.6875rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		background: #fef2f2;
		color: #991b1b;
		border: 1px solid #fecaca;
		white-space: nowrap;
	}

	.vane-gap-toggle {
		display: block;
		width: 100%;
		margin-top: 1rem;
		padding: 0.5rem;
		background: none;
		border: none;
		font-family: var(--vane-mono);
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #ff7f0e;
		cursor: pointer;
		transition: color 0.2s;
	}

	.vane-gap-toggle:hover {
		color: #b8860b;
	}
</style>
