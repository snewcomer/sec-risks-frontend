<script lang="ts">
	import type { PageData } from './$types';
	import DashboardNav from '$lib/components/DashboardNav.svelte';
	import SearchableSelect from '$lib/components/SearchableSelect.svelte';
	import { getIndustryName } from '$lib/utils/sic-codes';

	let { data }: { data: PageData } = $props();

	let loading = $state(false);
	let selectedSic = $state('');

	function getSeverityClass(severity: string | null) {
		switch (severity?.toLowerCase()) {
			case 'high':
				return 'vane-badge-high';
			case 'medium':
				return 'vane-badge-medium';
			case 'low':
				return 'vane-badge-low';
			default:
				return 'vane-badge-neutral';
		}
	}

	const filteredRisks = $derived(
		selectedSic
			? data.risks.filter((risk) => {
					const company = (risk.filings as any)?.companies;
					return company?.sic_code && getIndustryName(company.sic_code) === selectedSic;
				})
			: data.risks
	);

	async function loadMore() {
		loading = true;
		const newLimit = data.currentLimit + 20;
		window.location.href = `?limit=${newLimit}`;
	}
</script>

<svelte:head>
	<title>{data.theme?.theme_name || 'Theme'} - Vane</title>
</svelte:head>

<div class="vane-home vane-page">
	<DashboardNav />

	<main class="vane-container">
		<div class="vane-back-nav">
			<a href="/risks" class="vane-back-link">
				<span class="vane-arrow">←</span> back
			</a>
		</div>

		<header class="vane-header">
			<div>
				<h1 class="vane-title">{data.theme?.theme_name}</h1>
				<p class="vane-mono vane-gray">
					{filteredRisks.length}{!selectedSic && data.hasMore ? '+' : ''} risks across companies
				</p>
			</div>
			{#if data.sicOptions.length > 0}
				<div class="vane-filter">
					<SearchableSelect
						options={data.sicOptions}
						bind:value={selectedSic}
						placeholder="Filter by industry..."
					/>
				</div>
			{/if}
		</header>

		<div class="vane-risks-list">
			{#if filteredRisks.length === 0}
				<div class="vane-empty-state">
					<p class="vane-mono vane-gray">
						{selectedSic ? 'No risks found for this industry.' : 'No risks found for this theme.'}
					</p>
				</div>
			{:else}
				{#each filteredRisks as risk}
					{@const filing = risk.filings as any}
					{@const company = filing?.companies}
					<article class="vane-risk-card">
						<div class="vane-risk-meta">
							{#if company}
								{#if data.watchMap[String(company.cik)]}
									<a
										href="/risks/{data.watchMap[String(company.cik)]}"
										class="vane-risk-company vane-risk-company-link"
									>
										{company.name}{company.ticker ? ` (${company.ticker})` : ''}
									</a>
								{:else}
									<span class="vane-risk-company">
										{company.name}{company.ticker ? ` (${company.ticker})` : ''}
									</span>
								{/if}
							{/if}
							<span class="vane-risk-date">
								{new Date(filing?.filing_date).toLocaleDateString('en-US', {
									year: 'numeric',
									month: 'short',
									day: 'numeric'
								})}
							</span>
						</div>
						<div class="vane-risk-header">
							<h3 class="vane-risk-title">{risk.risk_title}</h3>
							<div class="vane-badges">
								{#if risk.severity}
									<span class="vane-badge {getSeverityClass(risk.severity)}">
										{risk.severity}
									</span>
								{/if}
								{#if risk.category}
									<span class="vane-badge vane-badge-outline">
										{risk.category}
									</span>
								{/if}
							</div>
						</div>
						<p class="vane-risk-summary">{risk.risk_summary}</p>
					</article>
				{/each}

				{#if data.hasMore}
					<div class="vane-load-more">
						<button class="vane-btn vane-btn-secondary" onclick={loadMore} disabled={loading}>
							{#if loading}
								<span class="vane-spinner"></span>
								Loading...
							{:else}
								Load more
							{/if}
						</button>
					</div>
				{/if}
			{/if}
		</div>
	</main>
</div>

<style>
	/* Layout & Base */
	.vane-page {
		min-height: 100vh;
		background: #f6f9fc;
		padding-top: 5rem;
	}

	.vane-container {
		max-width: 900px;
		margin: 0 auto;
		padding: 2rem;
	}

	/* Back Link */
	.vane-back-nav {
		margin-bottom: 1.5rem;
	}

	.vane-back-link {
		font-family: var(--vane-mono);
		color: var(--vane-gray);
		text-decoration: none;
		font-size: 14px;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		transition: color 0.2s;
	}

	.vane-back-link:hover {
		color: #1a1f36;
	}

	.vane-arrow {
		font-size: 1.2em;
		line-height: 1;
		position: relative;
		top: -1px;
	}

	/* Header */
	.vane-header {
		margin-bottom: 2rem;
		background: white;
		padding: 2rem;
		border-radius: 12px;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 1.5rem;
	}

	.vane-filter {
		flex-shrink: 0;
		width: 320px;
	}

	.vane-title {
		font-family: var(--vane-display);
		font-size: 2rem;
		margin: 0 0 0.25rem;
		font-weight: 400;
	}

	/* Risks List */
	.vane-risks-list {
		display: grid;
		gap: 1rem;
	}

	.vane-risk-card {
		background: white;
		border: 1px solid #e3e8ef;
		border-radius: 8px;
		padding: 1.5rem;
		transition:
			transform 0.2s,
			box-shadow 0.2s;
	}

	.vane-risk-card:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
		border-color: #d0d5dd;
	}

	.vane-risk-meta {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
	}

	.vane-risk-company {
		font-family: var(--vane-mono);
		font-size: 0.75rem;
		font-weight: 600;
		color: #1a1f36;
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.vane-risk-company-link {
		text-decoration: none;
		color: #ff7f0e;
		transition: color 0.15s;
	}

	.vane-risk-company-link:hover {
		color: #b8860b;
	}

	.vane-risk-date {
		font-family: var(--vane-mono);
		font-size: 0.6875rem;
		color: var(--vane-gray);
	}

	.vane-risk-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.vane-risk-title {
		font-family: var(--vane-display);
		font-size: 1.125rem;
		font-weight: 500;
		margin: 0;
		line-height: 1.4;
		color: #1a1f36;
		min-width: 0;
	}

	.vane-risk-summary {
		margin: 0;
		color: #425466;
		font-size: 0.9375rem;
		line-height: 1.6;
	}

	/* Badges */
	.vane-badges {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		flex-shrink: 0;
	}

	.vane-badge {
		font-family: var(--vane-mono);
		font-size: 0.625rem;
		text-transform: uppercase;
		padding: 0.2rem 0.5rem;
		border-radius: 4px;
		letter-spacing: 0.05em;
		white-space: nowrap;
		line-height: 1.4;
	}

	.vane-badge-high {
		background: #fef2f2;
		color: #991b1b;
		border: 1px solid #fecaca;
	}

	.vane-badge-medium {
		background: #fffbea;
		color: #92400e;
		border: 1px solid #fde68a;
	}

	.vane-badge-low {
		background: #f0f9ff;
		color: #075985;
		border: 1px solid #bae6fd;
	}

	.vane-badge-neutral {
		background: #f3f4f6;
		color: #4b5563;
	}

	.vane-badge-outline {
		background: transparent;
		border: 1px solid #e3e8ef;
		color: #4b5563;
	}

	/* Load More */
	.vane-load-more {
		display: flex;
		justify-content: center;
		padding: 1rem 0;
	}

	.vane-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		text-decoration: none;
		font-family: var(--vane-mono);
		font-size: 13px;
		line-height: 1.2;
		letter-spacing: 0.02em;
		padding: 0.5rem 1rem;
		border-radius: 6px;
		border: 1px solid transparent;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.vane-btn-secondary {
		background: white;
		color: #425466;
		border: 1px solid #ddd;
	}

	.vane-btn-secondary:hover {
		background: #f6f9fc;
		border-color: #999;
	}

	.vane-btn-secondary:disabled {
		opacity: 0.6;
		cursor: default;
	}

	.vane-spinner {
		display: inline-block;
		width: 14px;
		height: 14px;
		border: 2px solid currentColor;
		border-right-color: transparent;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
		vertical-align: middle;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.vane-empty-state {
		text-align: center;
		padding: 4rem 2rem;
		border: 2px dashed #e3e8ef;
		border-radius: 12px;
		background: white;
	}

	/* Responsive */
	@media (max-width: 640px) {
		.vane-risk-header {
			flex-wrap: wrap;
		}

		.vane-risk-meta {
			flex-wrap: wrap;
			gap: 0.5rem;
		}
	}
</style>
