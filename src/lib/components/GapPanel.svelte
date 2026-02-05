<script lang="ts">
	import { supabase } from '$lib/supabase';

	type Gap = { theme_name: string; industry_freq: number; theme_id: string };
	type ThemeRisk = {
		company_name: string;
		ticker: string;
		cik: string;
		filing_date: string;
		risk_title: string;
		risk_summary: string;
	};

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
	const PAGE_SIZE = 5;

	let visibleGaps = $derived(showAll ? gaps : gaps.slice(0, INITIAL_COUNT));
	let hasMore = $derived(gaps.length > INITIAL_COUNT);

	// Flyout state
	let flyoutOpen = $state(false);
	let selectedTheme = $state<Gap | null>(null);
	let themeRisks = $state<ThemeRisk[]>([]);
	let loading = $state(false);
	let currentLimit = $state(PAGE_SIZE);
	let hasMoreRisks = $state(false);

	async function fetchThemeRisks(theme: Gap, limit: number) {
		loading = true;
		const { data, error } = await supabase.rpc('get_industry_risks_by_theme', {
			p_sic_code: String(sicCode),
			p_theme_id: String(theme.theme_id),
			p_limit: Number(limit)
		});
		if (error) {
			console.error('Error fetching theme risks:', error);
		} else {
			themeRisks = data || [];
			hasMoreRisks = themeRisks.length === limit;
		}
		loading = false;
	}

	function openFlyout(gap: Gap) {
		selectedTheme = gap;
		currentLimit = PAGE_SIZE;
		themeRisks = [];
		flyoutOpen = true;
		fetchThemeRisks(gap, PAGE_SIZE);
	}

	function closeFlyout() {
		flyoutOpen = false;
		selectedTheme = null;
		themeRisks = [];
	}

	function loadMore() {
		if (!selectedTheme) return;
		currentLimit += PAGE_SIZE;
		fetchThemeRisks(selectedTheme, currentLimit);
	}

	function handleOverlayKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') closeFlyout();
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

{#if flyoutOpen && selectedTheme}
	<div
		class="vane-flyout-overlay"
		onclick={closeFlyout}
		onkeydown={handleOverlayKeydown}
		role="button"
		tabindex="0"
	>
		<div
			class="vane-flyout"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.key === 'Escape' && closeFlyout()}
			role="dialog"
			aria-modal="true"
			tabindex="0"
		>
			<div class="vane-flyout-header">
				<div>
					<h2 class="vane-flyout-title">{selectedTheme.theme_name}</h2>
					<p class="vane-mono vane-gray" style="margin: 0.25rem 0 0; font-size: 12px;">
						{Math.round(selectedTheme.industry_freq)}% of peers disclose this theme
					</p>
				</div>
				<button class="vane-flyout-close" onclick={closeFlyout} aria-label="Close" type="button">
					×
				</button>
			</div>

			<div class="vane-flyout-content">
				{#if loading && themeRisks.length === 0}
					<div class="vane-flyout-loading">
						<span class="vane-spinner"></span>
						<span class="vane-mono vane-gray">Loading peer disclosures...</span>
					</div>
				{:else if themeRisks.length === 0}
					<div class="vane-flyout-empty">
						<span class="vane-mono vane-gray">No peer disclosures found for this theme.</span>
					</div>
				{:else}
					<div class="vane-flyout-risks">
						{#each themeRisks as risk}
							<article class="vane-theme-risk-card">
								<div class="vane-theme-risk-meta">
									{#if watchMap[String(risk.cik)]}
										<a
											href="/risks/{watchMap[String(risk.cik)]}"
											class="vane-theme-risk-company vane-theme-risk-link"
										>
											{risk.company_name}{risk.ticker ? ` (${risk.ticker})` : ''}
										</a>
									{:else}
										<span class="vane-theme-risk-company">
											{risk.company_name}{risk.ticker ? ` (${risk.ticker})` : ''}
										</span>
									{/if}
									<span class="vane-theme-risk-date">
										{new Date(risk.filing_date).toLocaleDateString('en-US', {
											year: 'numeric',
											month: 'short',
											day: 'numeric'
										})}
									</span>
								</div>
								<h3 class="vane-theme-risk-title">{risk.risk_title}</h3>
								<p class="vane-theme-risk-summary">{risk.risk_summary}</p>
							</article>
						{/each}
					</div>

					{#if hasMoreRisks}
						<button class="vane-gap-toggle" onclick={loadMore} disabled={loading}>
							{#if loading}
								<span class="vane-spinner"></span>
								Loading...
							{:else}
								Load more
							{/if}
						</button>
					{/if}
				{/if}
			</div>
		</div>
	</div>
{/if}

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

	/* Flyout */
	.vane-flyout-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		display: flex;
		align-items: center;
		justify-content: flex-end;
		z-index: 1000;
		cursor: pointer;
	}

	.vane-flyout {
		background: white;
		width: 90%;
		max-width: 520px;
		height: 100vh;
		overflow-y: auto;
		box-shadow: -4px 0 24px rgba(0, 0, 0, 0.1);
		animation: slideIn 0.3s cubic-bezier(0.32, 0.72, 0, 1);
		cursor: default;
	}

	@keyframes slideIn {
		from {
			transform: translateX(100%);
		}
		to {
			transform: translateX(0);
		}
	}

	.vane-flyout-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		padding: 1.5rem;
		border-bottom: 1px solid #e3e8ef;
	}

	.vane-flyout-title {
		font-family: var(--vane-display);
		font-size: 1.5rem;
		font-weight: 400;
		margin: 0;
	}

	.vane-flyout-close {
		background: #f6f9fc;
		border: 1px solid #ddd;
		font-size: 1.25rem;
		line-height: 1;
		cursor: pointer;
		padding: 0;
		padding-bottom: 2px;
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--vane-gray);
		transition: all 0.15s ease;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.vane-flyout-close:hover {
		background: #e3e8ef;
		color: var(--vane-black);
		border-color: #999;
	}

	.vane-flyout-content {
		padding: 1.5rem;
	}

	.vane-flyout-loading,
	.vane-flyout-empty {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		padding: 3rem 1rem;
		text-align: center;
	}

	.vane-flyout-risks {
		display: grid;
		gap: 1rem;
	}

	.vane-theme-risk-card {
		border: 1px solid #e3e8ef;
		border-radius: 8px;
		padding: 1.25rem;
		transition: border-color 0.2s;
	}

	.vane-theme-risk-card:hover {
		border-color: #d0d5dd;
	}

	.vane-theme-risk-meta {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
	}

	.vane-theme-risk-company {
		font-family: var(--vane-mono);
		font-size: 0.75rem;
		font-weight: 600;
		color: #1a1f36;
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.vane-theme-risk-link {
		text-decoration: none;
		color: #ff7f0e;
		transition: color 0.15s;
	}

	.vane-theme-risk-link:hover {
		color: #b8860b;
	}

	.vane-theme-risk-date {
		font-family: var(--vane-mono);
		font-size: 0.6875rem;
		color: var(--vane-gray);
	}

	.vane-theme-risk-title {
		font-family: var(--vane-display);
		font-size: 1rem;
		font-weight: 500;
		margin: 0 0 0.5rem;
		line-height: 1.4;
		color: #1a1f36;
	}

	.vane-theme-risk-summary {
		margin: 0;
		color: #425466;
		font-size: 0.875rem;
		line-height: 1.6;
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

	@media (max-width: 640px) {
		.vane-flyout {
			width: 100%;
			max-width: 100%;
		}
	}
</style>
