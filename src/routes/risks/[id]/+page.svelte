<script lang="ts">
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Computed Initials for Avatar placeholder
	const companyInitials = $derived(
		data.company?.name
			? data.company.name
					.split(' ')
					.map((n: string) => n[0])
					.join('')
					.slice(0, 2)
					.toUpperCase()
			: 'CO'
	);

	async function handleSignOut() {
		await supabase.auth.signOut();
		goto('/');
	}

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
</script>

<svelte:head>
	<title>{data.company?.name || 'Company'} Risks - Vane</title>
</svelte:head>

<div class="vane-page">
	<nav class="vane-nav">
		<div class="vane-nav-left">
			<a href="/" class="vane-nav-brand">
				<span class="vane-mono">Vane</span>
				<span class="vane-mono vane-gray">SEC Risk Intelligence</span>
			</a>
			<span class="vane-nav-divider">/</span>
			<a href="/risks" class="vane-mono vane-nav-link">Risks</a>
			<span class="vane-nav-divider">/</span>
			<span class="vane-mono vane-active">{data.company?.ticker || '...'}</span>
		</div>
		<div class="vane-nav-right">
			<a href="/settings" class="vane-mono vane-nav-link">Settings</a>
			<button onclick={handleSignOut} class="vane-btn-ghost">Sign Out</button>
		</div>
	</nav>

	<main class="vane-container">
		<div class="vane-back-nav">
			<a href="/risks" class="vane-back-link">
				<span class="vane-arrow">←</span> Back to Dashboard
			</a>
		</div>

		<header class="vane-header">
			<div class="vane-company-lockup">
				<div class="vane-company-avatar">
					<span class="vane-mono">{companyInitials}</span>
				</div>
				<div>
					<h1 class="vane-title">
						{data.company?.name}
						{#if data.company?.ticker}
							<span class="vane-ticker">{data.company.ticker}</span>
						{/if}
					</h1>
					<p class="vane-mono vane-gray">CIK: {data.company?.cik}</p>
				</div>
			</div>

			<div class="vane-actions">
				<a
					href={`https://www.sec.gov/cgi-bin/browse-edgar?CIK=${data.company?.cik}`}
					target="_blank"
					rel="noreferrer"
					class="vane-btn-secondary"
				>
					View on EDGAR ↗
				</a>
			</div>
		</header>

		<div class="vane-timeline">
			{#if data.filings.length === 0}
				<div class="vane-empty-state">
					<p class="vane-mono vane-gray">No processed filings found for this company.</p>
				</div>
			{/if}

			{#each data.filings as filing}
				<section class="vane-filing-group">
					<div class="vane-filing-header">
						<div class="vane-filing-meta">
							<span class="vane-mono vane-filing-type">{filing.form_type}</span>
							<span class="vane-filing-date">
								{new Date(filing.filing_date).toLocaleDateString('en-US', {
									year: 'numeric',
									month: 'long',
									day: 'numeric'
								})}
							</span>
						</div>
						{#if filing.sec_url}
							<a href={filing.sec_url} target="_blank" class="vane-link-sm">Source</a>
						{/if}
					</div>

					{#if filing.risks.length === 0}
						<div class="vane-risk-empty">
							<span class="vane-mono vane-gray-light">No risk factors detected in this filing.</span
							>
						</div>
					{:else}
						<div class="vane-risk-grid">
							{#each filing.risks as risk}
								<article class="vane-risk-card">
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
						</div>
					{/if}
				</section>
			{/each}
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
		max-width: 1000px;
		margin: 0 auto;
		padding: 2rem;
	}

	/* Back Link Styles */
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

	/* Nav (Reused/Adapted) */
	.vane-nav {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		height: 64px;
		background: rgba(255, 255, 255, 0.9);
		backdrop-filter: blur(8px);
		border-bottom: 1px solid #e3e8ef;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0 2rem;
		z-index: 100;
	}

	.vane-nav-left,
	.vane-nav-right {
		display: flex;
		align-items: center;
		gap: 1.5rem;
	}

	.vane-nav-brand {
		text-decoration: none;
		color: black;
		display: flex;
		gap: 0.5rem;
	}

	.vane-nav-divider {
		color: #e3e8ef;
	}

	.vane-nav-link {
		text-decoration: none;
		color: var(--vane-gray);
		font-size: 14px;
		transition: color 0.2s;
	}

	.vane-nav-link:hover {
		color: black;
	}

	.vane-active {
		color: black;
		font-size: 14px;
	}

	/* Header */
	.vane-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 3rem;
		background: white;
		padding: 2rem;
		border-radius: 12px;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
	}

	.vane-company-lockup {
		display: flex;
		gap: 1.5rem;
		align-items: center;
	}

	.vane-company-avatar {
		width: 64px;
		height: 64px;
		background: #eef2f6;
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--vane-gray);
		font-size: 1.5rem;
	}

	.vane-title {
		font-family: var(--vane-display);
		font-size: 2rem;
		margin: 0 0 0.25rem;
		font-weight: 400;
	}

	.vane-ticker {
		color: var(--vane-gray);
		font-weight: 300;
		margin-left: 0.5rem;
	}

	/* Filing Sections */
	.vane-filing-group {
		margin-bottom: 3rem;
	}

	.vane-filing-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1.5rem;
		padding-left: 0.5rem;
		border-left: 2px solid #635bff;
	}

	.vane-filing-type {
		font-weight: 600;
		font-size: 1.125rem;
	}

	.vane-filing-date {
		color: var(--vane-gray);
		font-family: var(--vane-mono);
		font-size: 0.875rem;
	}

	.vane-link-sm {
		font-family: var(--vane-mono);
		font-size: 0.75rem;
		text-transform: uppercase;
		color: #635bff;
		text-decoration: none;
		letter-spacing: 0.05em;
	}

	/* Risks Grid */
	.vane-risk-grid {
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

	.vane-risk-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.vane-risk-title {
		font-family: var(--vane-display);
		font-size: 1.125rem;
		font-weight: 500;
		margin: 0;
		line-height: 1.4;
		color: #1a1f36;
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
		flex-direction: column;
		align-items: flex-end;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.vane-badge {
		font-family: var(--vane-mono);
		font-size: 0.6875rem;
		text-transform: uppercase;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		letter-spacing: 0.05em;
		white-space: nowrap;
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

	/* Utilities */
	.vane-btn-secondary {
		padding: 0.5rem 1rem;
		background: white;
		border: 1px solid #e3e8ef;
		border-radius: 6px;
		color: #425466;
		text-decoration: none;
		font-family: var(--vane-mono);
		font-size: 0.75rem;
		transition: all 0.2s;
	}

	.vane-btn-secondary:hover {
		border-color: #b3b9c4;
		color: #1a1f36;
	}

	.vane-btn-ghost {
		background: none;
		border: none;
		font-family: var(--vane-mono);
		font-size: 0.75rem;
		text-transform: uppercase;
		cursor: pointer;
		color: var(--vane-gray);
	}

	.vane-empty-state {
		text-align: center;
		padding: 4rem;
		border: 2px dashed #e3e8ef;
		border-radius: 12px;
	}

	/* Responsive */
	@media (max-width: 640px) {
		.vane-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 1.5rem;
		}

		.vane-risk-header {
			flex-direction: column-reverse;
			align-items: flex-start;
		}

		.vane-badges {
			flex-direction: row;
			align-items: center;
			margin-bottom: 0.5rem;
		}
	}
</style>
