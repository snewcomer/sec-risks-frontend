<script lang="ts">
	import { supabase } from '$lib/supabase';

	type ThemeRisk = {
		company_name: string;
		ticker: string;
		cik: string;
		filing_date: string;
		risk_title: string;
		risk_summary: string;
	};

	let {
		sicCode = '',
		watchMap = {}
	}: {
		sicCode: string;
		watchMap?: Record<string, string>;
	} = $props();

	const PAGE_SIZE = 5;

	let flyoutOpen = $state(false);
	let themeName = $state('');
	let themeId = $state('');
	let industryFreq = $state(0);
	let themeRisks = $state<ThemeRisk[]>([]);
	let loading = $state(false);
	let currentLimit = $state(PAGE_SIZE);
	let hasMoreRisks = $state(false);

	async function fetchThemeRisks(id: string, limit: number) {
		if (!id || !sicCode) return;
		loading = true;
		const { data, error } = await supabase.rpc('get_industry_risks_by_theme', {
			p_sic_code: String(sicCode),
			p_theme_id: String(id),
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

	export function open(name: string, id: string, freq: number = 0) {
		themeName = name;
		themeId = id;
		industryFreq = freq;
		currentLimit = PAGE_SIZE;
		themeRisks = [];
		flyoutOpen = true;
		fetchThemeRisks(id, PAGE_SIZE);
	}

	function close() {
		flyoutOpen = false;
		themeRisks = [];
	}

	function loadMore() {
		currentLimit += PAGE_SIZE;
		fetchThemeRisks(themeId, currentLimit);
	}

	function handleOverlayKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') close();
	}
</script>

{#if flyoutOpen}
	<div
		class="vane-flyout-overlay"
		onclick={close}
		onkeydown={handleOverlayKeydown}
		role="button"
		tabindex="0"
	>
		<div
			class="vane-flyout"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.key === 'Escape' && close()}
			role="dialog"
			aria-modal="true"
			tabindex="0"
		>
			<div class="vane-flyout-header">
				<div>
					<h2 class="vane-flyout-title">{themeName}</h2>
					{#if industryFreq > 0}
						<p class="vane-mono vane-gray" style="margin: 0.25rem 0 0; font-size: 12px;">
							{Math.round(industryFreq)}% of peers disclose this theme
						</p>
					{/if}
				</div>
				<button class="vane-flyout-close" onclick={close} aria-label="Close" type="button">
					&times;
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
