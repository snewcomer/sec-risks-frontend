<script lang="ts">
	import type { PageData } from './$types';
	import DashboardNav from '$lib/components/DashboardNav.svelte';
	import { goto } from '$app/navigation';

	let { data }: { data: PageData } = $props();

	let expandedCells = $state<Set<string>>(new Set());

	function expandCell(cellId: string) {
		expandedCells.add(cellId);
		expandedCells = new Set(expandedCells);
	}

	function addCompany(cik: string) {
		if (!cik || data.selectedCiks.includes(cik)) return;
		const newCiks = [...data.selectedCiks, cik];
		goto(`/risks/compare?companies=${newCiks.join(',')}`);
	}

	function removeCompany(cik: string) {
		const newCiks = data.selectedCiks.filter((c) => c !== cik);
		if (newCiks.length === 0) {
			goto('/risks/compare');
		} else {
			goto(`/risks/compare?companies=${newCiks.join(',')}`);
		}
	}

	function getSeverityClass(severity: string | null) {
		switch (severity?.toLowerCase()) {
			case 'high':
				return 'severity-high';
			case 'medium':
				return 'severity-medium';
			case 'low':
				return 'severity-low';
			default:
				return 'severity-unknown';
		}
	}

	function getCellSeverity(cik: string, themeId: string): string | null {
		const risks = data.companyRisks[cik]?.risks[themeId];
		if (!risks || risks.length === 0) return null;
		const hasHigh = risks.some((r) => r.severity?.toLowerCase() === 'high');
		if (hasHigh) return 'High';
		const hasMedium = risks.some((r) => r.severity?.toLowerCase() === 'medium');
		if (hasMedium) return 'Medium';
		const hasLow = risks.some((r) => r.severity?.toLowerCase() === 'low');
		if (hasLow) return 'Low';
		return 'Unknown';
	}

	// Available companies to add (not already selected)
	const availableCompanies = $derived(
		data.watches
			.filter((w) => !data.selectedCiks.includes(w.cik))
			.map((w) => ({
				cik: w.cik,
				name: (w.companies as any)?.name || 'Unknown',
				ticker: (w.companies as any)?.ticker
			}))
	);

	// Selected companies info
	const selectedCompanies = $derived(
		data.selectedCiks.map((cik) => data.companyRisks[cik]?.company).filter(Boolean)
	);
</script>

<svelte:head>
	<title>Compare Risks - Vane</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="vane-home vane-page">
	<DashboardNav />

	<main class="vane-container">
		<div class="vane-back-nav">
			<a href="/risks" class="vane-back-link">
				<span class="vane-arrow">←</span> Dashboard
			</a>
		</div>

		<header class="vane-header">
			<div>
				<h1 class="vane-title">Risk Comparison</h1>
				<p class="vane-subtitle">Compare risk disclosures across companies by theme</p>
			</div>
		</header>

		<!-- Company Selector -->
		<section class="vane-selector-section">
			<div class="vane-selected-companies">
				{#each selectedCompanies as company}
					<div class="vane-company-chip">
						<span class="vane-chip-ticker">{company.ticker || company.cik}</span>
						<span class="vane-chip-name">{company.name}</span>
						<button
							class="vane-chip-remove"
							onclick={() => removeCompany(company.cik)}
							aria-label="Remove {company.name}"
						>
							×
						</button>
					</div>
				{/each}
				{#if availableCompanies.length > 0 && data.selectedCiks.length < 4}
					<select
						class="vane-company-select"
						onchange={(e) => {
							addCompany(e.currentTarget.value);
							e.currentTarget.value = '';
						}}
					>
						<option value="">+ Add company</option>
						{#each availableCompanies as company}
							<option value={company.cik}>
								{company.ticker ? `${company.ticker} - ` : ''}{company.name}
							</option>
						{/each}
					</select>
				{/if}
			</div>
			{#if data.selectedCiks.length === 0}
				<p class="vane-selector-hint">
					Select companies from your watchlist to compare their risk disclosures
				</p>
			{/if}
		</section>

		<!-- Risk Matrix -->
		{#if data.selectedCiks.length > 0 && data.matrix.length > 0}
			<section class="vane-matrix-section">
				<div class="vane-matrix-scroll">
					<table class="vane-matrix">
						<thead>
							<tr>
								<th class="vane-matrix-corner">Risk Theme</th>
								{#each selectedCompanies as company}
									<th class="vane-matrix-company">
										<span class="vane-company-ticker">{company.ticker || 'N/A'}</span>
										<span class="vane-company-name">{company.name}</span>
									</th>
								{/each}
							</tr>
						</thead>
						<tbody>
							{#each data.matrix as group}
								<tr class="vane-matrix-category-row">
									<td colspan={selectedCompanies.length + 1} class="vane-matrix-category">
										{group.category}
									</td>
								</tr>
								{#each group.themes as theme}
									<tr class="vane-matrix-row" class:has-divergence={theme.hasDivergence}>
										<td class="vane-matrix-theme">
											<span class="vane-theme-name">{theme.theme_name}</span>
										</td>
										{#each data.selectedCiks as cik}
											{@const risks = data.companyRisks[cik]?.risks[theme.theme_id]}
											{@const cellId = `${cik}-${theme.theme_id}`}
											{@const severity = getCellSeverity(cik, theme.theme_id)}
											{@const isExpanded = expandedCells.has(cellId)}
											<td class="vane-matrix-cell {getSeverityClass(severity)}">
												{#if risks && risks.length > 0}
													<div class="vane-cell-content">
														<div class="vane-cell-header">
															{#if severity}
																<span class="vane-severity-badge {getSeverityClass(severity)}">
																	{severity}
																</span>
															{/if}
															<span class="vane-risk-count">
																{risks.length} risk{risks.length > 1 ? 's' : ''}
															</span>
														</div>
														{#if !isExpanded}
															<p class="vane-cell-summary vane-line-clamp">
																{risks[0].risk_summary}
															</p>
															<button class="vane-cell-toggle" onclick={() => expandCell(cellId)}>
																Show more
															</button>
														{:else}
															<div class="vane-cell-expanded">
																{#each risks as risk, i}
																	<div class="vane-expanded-risk">
																		{#if risks.length > 1}
																			<strong class="vane-expanded-title"
																				>{i + 1}. {risk.risk_title}</strong
																			>
																		{/if}
																		<p class="vane-expanded-summary">{risk.risk_summary}</p>
																		{#if risk.verbatim_quote}
																			<blockquote class="vane-expanded-quote">
																				{risk.verbatim_quote}
																			</blockquote>
																		{/if}
																	</div>
																{/each}
															</div>
														{/if}
													</div>
												{:else}
													<div class="vane-cell-empty">
														<span class="vane-no-disclosure">No disclosure</span>
														<span class="vane-no-disclosure-hint">Theme not addressed in 10-K</span>
													</div>
												{/if}
											</td>
										{/each}
									</tr>
								{/each}
							{/each}
						</tbody>
					</table>
				</div>
			</section>
		{:else if data.selectedCiks.length > 0}
			<div class="vane-empty-state">
				<p class="vane-mono vane-gray">No risk data found for the selected companies.</p>
			</div>
		{:else}
			<div class="vane-empty-state">
				<p class="vane-mono vane-gray">
					Select at least one company to view the risk comparison matrix.
				</p>
			</div>
		{/if}
	</main>
</div>

<style>
	.vane-page {
		min-height: 100vh;
		background: #f6f9fc;
		padding-top: 5rem;
	}

	.vane-container {
		max-width: 1400px;
		margin: 0 auto;
		padding: 2rem;
	}

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
	}

	.vane-header {
		margin-bottom: 2rem;
	}

	.vane-title {
		font-family: var(--vane-display);
		font-size: 2rem;
		margin: 0 0 0.5rem;
		font-weight: 400;
	}

	.vane-subtitle {
		color: var(--vane-gray);
		margin: 0;
	}

	/* Company Selector */
	.vane-selector-section {
		background: white;
		border: 1px solid #e3e8ef;
		border-radius: 12px;
		padding: 1.5rem;
		margin-bottom: 2rem;
	}

	.vane-selected-companies {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		align-items: center;
	}

	.vane-company-chip {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: #f6f9fc;
		border: 1px solid #e3e8ef;
		border-radius: 8px;
	}

	.vane-chip-ticker {
		font-family: var(--vane-mono);
		font-weight: 600;
		font-size: 0.875rem;
		color: #1a1f36;
	}

	.vane-chip-name {
		font-size: 0.8125rem;
		color: var(--vane-gray);
		max-width: 150px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.vane-chip-remove {
		background: none;
		border: none;
		font-size: 1.25rem;
		line-height: 1;
		color: var(--vane-gray);
		cursor: pointer;
		padding: 0 0.25rem;
		transition: color 0.15s;
	}

	.vane-chip-remove:hover {
		color: #ef4444;
	}

	.vane-company-select {
		font-family: var(--vane-mono);
		font-size: 0.8125rem;
		padding: 0.5rem 0.75rem;
		border: 1px dashed #e3e8ef;
		border-radius: 8px;
		background: white;
		color: var(--vane-gray);
		cursor: pointer;
		transition: all 0.15s;
	}

	.vane-company-select:hover {
		border-color: #ff7f0e;
		color: #ff7f0e;
	}

	.vane-selector-hint {
		margin: 1rem 0 0;
		font-family: var(--vane-mono);
		font-size: 0.8125rem;
		color: var(--vane-gray);
	}

	/* Risk Matrix */
	.vane-matrix-section {
		background: white;
		border: 1px solid #e3e8ef;
		border-radius: 12px;
		overflow: hidden;
	}

	.vane-matrix-scroll {
		overflow-x: auto;
	}

	.vane-matrix {
		width: 100%;
		border-collapse: collapse;
		min-width: 800px;
	}

	.vane-matrix th,
	.vane-matrix td {
		padding: 1rem;
		text-align: left;
		border-bottom: 1px solid #e3e8ef;
		vertical-align: top;
	}

	.vane-matrix-corner {
		font-family: var(--vane-mono);
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--vane-gray);
		background: #f6f9fc;
		position: sticky;
		left: 0;
		z-index: 2;
		min-width: 200px;
	}

	.vane-matrix-company {
		background: #f6f9fc;
		min-width: 250px;
		max-width: 300px;
	}

	.vane-company-ticker {
		font-family: var(--vane-mono);
		font-weight: 600;
		font-size: 1rem;
		display: block;
	}

	.vane-company-name {
		font-size: 0.8125rem;
		color: var(--vane-gray);
	}

	.vane-matrix-category-row td {
		background: #1a1f36;
		color: white;
		font-family: var(--vane-mono);
		font-size: 0.6875rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		padding: 0.5rem 1rem;
		position: sticky;
		left: 0;
	}

	.vane-matrix-theme {
		background: #fafbfc;
		position: sticky;
		left: 0;
		z-index: 1;
		min-width: 200px;
	}

	.vane-theme-name {
		font-size: 0.875rem;
		font-weight: 500;
		color: #1a1f36;
	}

	/* Matrix Cells */
	.vane-matrix-cell {
		min-width: 250px;
		max-width: 300px;
	}

	.vane-cell-content {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.vane-cell-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.vane-severity-badge {
		font-family: var(--vane-mono);
		font-size: 0.625rem;
		text-transform: uppercase;
		padding: 0.125rem 0.375rem;
		border-radius: 4px;
		letter-spacing: 0.05em;
	}

	.vane-severity-badge.severity-high {
		background: #fecaca;
		color: #991b1b;
	}

	.vane-severity-badge.severity-medium {
		background: #fde68a;
		color: #92400e;
	}

	.vane-severity-badge.severity-low {
		background: #bbf7d0;
		color: #166534;
	}

	.vane-risk-count {
		font-family: var(--vane-mono);
		font-size: 0.6875rem;
		color: var(--vane-gray);
	}

	.vane-cell-summary {
		font-size: 0.8125rem;
		line-height: 1.5;
		color: #475569;
		margin: 0;
	}

	.vane-line-clamp {
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.vane-cell-toggle {
		font-family: var(--vane-mono);
		font-size: 0.6875rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #ff7f0e;
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		transition: color 0.15s;
	}

	.vane-cell-toggle:hover {
		color: #c2410c;
	}

	.vane-cell-expanded {
		margin-top: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px solid #e3e8ef;
	}

	.vane-expanded-risk {
		margin-bottom: 1rem;
	}

	.vane-expanded-risk:last-child {
		margin-bottom: 0;
	}

	.vane-expanded-title {
		font-size: 0.8125rem;
		color: #1a1f36;
		display: block;
		margin-bottom: 0.375rem;
	}

	.vane-expanded-summary {
		font-size: 0.8125rem;
		line-height: 1.6;
		color: #475569;
		margin: 0 0 0.5rem;
	}

	.vane-expanded-quote {
		margin: 0.5rem 0 0;
		padding: 0.75rem 1rem;
		background: rgba(255, 255, 255, 0.7);
		border-left: 2px solid #ff7f0e;
		font-size: 0.75rem;
		line-height: 1.6;
		color: #64748b;
		font-style: italic;
	}

	/* Empty Cell */
	.vane-cell-empty {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 0.5rem;
		background: #f8fafc;
		border-radius: 6px;
		border: 1px dashed #e3e8ef;
	}

	.vane-no-disclosure {
		font-family: var(--vane-mono);
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #94a3b8;
	}

	.vane-no-disclosure-hint {
		font-size: 0.6875rem;
		color: #cbd5e1;
	}

	/* Empty State */
	.vane-empty-state {
		text-align: center;
		padding: 4rem;
		border: 2px dashed #e3e8ef;
		border-radius: 12px;
		background: white;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.vane-container {
			padding: 1rem;
		}

		.vane-matrix-company {
			min-width: 180px;
		}

		.vane-matrix-cell {
			min-width: 180px;
		}

		.vane-chip-name {
			display: none;
		}
	}
</style>
