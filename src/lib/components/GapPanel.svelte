<script lang="ts">
	import ThemeRisksFlyout from './ThemeRisksFlyout.svelte';

	type Gap = { theme_name: string; industry_freq: number; theme_id: string };

	let {
		gaps,
		sicCode,
		percent,
		disclosed,
		total,
		watchMap = {}
	}: {
		gaps: Gap[];
		sicCode: string;
		percent: number;
		disclosed: number;
		total: number;
		watchMap?: Record<string, string>;
	} = $props();

	let showAll = $state(false);

	const INITIAL_COUNT = 5;

	let visibleGaps = $derived(showAll ? gaps : gaps.slice(0, INITIAL_COUNT));
	let hasMore = $derived(gaps.length > INITIAL_COUNT);

	let flyoutRef: ThemeRisksFlyout;

	function openFlyout(gap: Gap) {
		flyoutRef?.open(gap.theme_name, gap.theme_id, gap.industry_freq);
	}
</script>

<div class="vane-benchmark-card">
	<div class="vane-coverage">
		<div class="vane-coverage-header">
			<h2 class="vane-coverage-title">Risk coverage vs. industry</h2>
			<span class="vane-coverage-stat">
				{percent}%
				<span class="vane-coverage-detail">({disclosed} of {total} themes)</span>
			</span>
		</div>
		<div class="vane-coverage-track">
			<div class="vane-coverage-fill" style="width: {percent}%"></div>
		</div>
	</div>

	{#if gaps.length > 0}
		<div class="vane-divider"></div>

		<div class="vane-gaps">
			<h3 class="vane-gaps-label">Peer themes</h3>
			<ul class="vane-gap-list">
				{#each visibleGaps as gap}
					<li>
						<button class="vane-gap-row" onclick={() => openFlyout(gap)}>
							<span class="vane-gap-theme">{gap.theme_name}</span>
							<span class="vane-gap-freq">{Math.round(gap.industry_freq)}% of peers</span>
						</button>
					</li>
				{/each}
			</ul>

			{#if hasMore}
				<button class="vane-gap-toggle" onclick={() => (showAll = !showAll)}>
					{showAll ? 'Show less' : `Show all ${gaps.length} gaps`}
				</button>
			{/if}
		</div>
	{:else}
		<div class="vane-divider"></div>
		<p class="vane-gap-empty">This company covers all common industry themes.</p>
	{/if}
</div>

<ThemeRisksFlyout bind:this={flyoutRef} {sicCode} {watchMap} />

<style>
	/* Combined card */
	.vane-benchmark-card {
		background: white;
		border: 1px solid #e3e8ef;
		border-radius: 12px;
		padding: 1.25rem 1.5rem;
	}

	.vane-divider {
		height: 1px;
		background: #e3e8ef;
		margin: 1rem 0;
	}

	/* Coverage section */
	.vane-coverage-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		margin-bottom: 0.625rem;
	}

	.vane-coverage-title {
		font-family: var(--vane-display);
		font-size: 1rem;
		font-weight: 500;
		margin: 0;
		color: #1a1f36;
	}

	.vane-coverage-stat {
		font-family: var(--vane-mono);
		font-size: 0.9375rem;
		font-weight: 600;
		color: #1a1f36;
	}

	.vane-coverage-detail {
		font-weight: 400;
		font-size: 0.75rem;
		color: var(--vane-gray);
	}

	.vane-coverage-track {
		height: 6px;
		background: #eef2f6;
		border-radius: 3px;
		overflow: hidden;
	}

	.vane-coverage-fill {
		height: 100%;
		background: #ff7f0e;
		border-radius: 3px;
		transition: width 0.6s ease;
		min-width: 0;
	}

	/* Gaps section */
	.vane-gaps-label {
		font-family: var(--vane-mono);
		font-size: 0.6875rem;
		font-weight: 400;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		margin: 0 0 0.375rem;
		color: var(--vane-gray);
	}

	.vane-gap-empty {
		margin: 0;
		font-family: var(--vane-mono);
		font-size: 0.8125rem;
		color: var(--vane-gray);
		text-align: center;
		padding: 0.5rem 0;
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
		padding: 0.5rem 0;
		border-bottom: 1px solid #f0f2f5;
		width: 100%;
		background: none;
		border-left: none;
		border-right: none;
		border-top: none;
		cursor: pointer;
		transition: background-color 0.15s;
	}

	.vane-gap-row:hover {
		background: #f6f9fc;
	}

	li:last-child .vane-gap-row {
		border-bottom: none;
	}

	.vane-gap-theme {
		font-size: 0.875rem;
		color: #1a1f36;
		font-weight: 500;
		text-align: left;
	}

	.vane-gap-freq {
		font-family: var(--vane-mono);
		font-size: 0.625rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 0.2rem 0.4rem;
		border-radius: 4px;
		background: #fef2f2;
		color: #991b1b;
		border: 1px solid #fecaca;
		white-space: nowrap;
	}

	.vane-gap-toggle {
		display: block;
		width: 100%;
		margin-top: 0.5rem;
		padding: 0.375rem;
		background: none;
		border: none;
		font-family: var(--vane-mono);
		font-size: 0.6875rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #ff7f0e;
		cursor: pointer;
		transition: color 0.2s;
	}

	.vane-gap-toggle:hover {
		color: #b8860b;
	}

	.vane-gap-toggle:disabled {
		opacity: 0.6;
		cursor: default;
	}
</style>
