<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';
	import SearchableSelect from '$lib/components/SearchableSelect.svelte';
	import DashboardNav from '$lib/components/DashboardNav.svelte';

	let { data, form }: { data: PageData; form: any } = $props();

	let showAddFlyout = $state(false);
	let showDetailsFlyout = $state(false);
	let selectedWatch = $state<any>(null);
	let selectedCompany = $state('');

	const companyOptions = $derived(
		data.companies.map((company) => ({
			value: company.cik,
			label: `${company.name}${company.ticker ? ` (${company.ticker})` : ''}`
		}))
	);

	async function handleUpgrade() {
		try {
			const response = await fetch('/api/create-checkout-session', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					priceId: import.meta.env.PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID || 'price_individual'
				})
			});

			const { url } = await response.json();
			if (url) {
				window.location.href = url;
			}
		} catch (error) {
			console.error('Error creating checkout session:', error);
		}
	}

	function openAddFlyout() {
		selectedCompany = '';
		showAddFlyout = true;
	}

	function closeAddFlyout() {
		showAddFlyout = false;
		selectedCompany = '';
	}

	function openDetailsFlyout(watch: any) {
		selectedWatch = watch;
		showDetailsFlyout = true;
	}

	function closeDetailsFlyout() {
		showDetailsFlyout = false;
		selectedWatch = null;
	}

	// Helper to handle keyboard closing of modals
	function handleOverlayKeydown(e: KeyboardEvent, closeFn: () => void) {
		if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			closeFn();
		}
	}
</script>

<svelte:head>
	<title>Dashboard - Vane</title>
	<meta name="description" content="Monitor your SEC risk intelligence alerts and watchlists." />
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="vane-home">
	<DashboardNav />

	<section class="vane-dashboard">
		<div class="vane-dashboard-container">
			<header class="vane-dashboard-header">
				<div>
					<h1 class="vane-dashboard-headline">SEC Risks</h1>
					<p class="vane-mono vane-gray">
						Welcome back, {data.profile?.name || data.profile?.email}
					</p>
				</div>
				<div class="vane-plan-badge vane-plan-badge-{data.profile?.plan}">
					<span class="vane-mono">{data.profile?.plan || 'free'} plan</span>
				</div>
			</header>

			<section class="vane-dashboard-section">
				<div
					style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;"
				>
					<h2 class="vane-section-heading" style="margin: 0;">Company Watches</h2>
					{#if data.watches.length > 0}
						<button class="vane-btn" onclick={openAddFlyout}> Add Company Watch </button>
					{/if}
				</div>

				{#if form?.error}
					<div class="vane-error-banner">
						<p class="vane-mono">{form.error}</p>
					</div>
				{/if}

				{#if data.watches.length === 0}
					<div class="vane-empty-state">
						<p class="vane-mono vane-gray">
							No companies watched yet. Add your first company to start monitoring SEC filings.
						</p>
						<button class="vane-btn" onclick={openAddFlyout}> Add Company Watch </button>
					</div>
				{:else}
					<div class="vane-watches-grid">
						{#each data.watches as watch}
							<button class="vane-watch-card" onclick={() => openDetailsFlyout(watch)}>
								<h3 class="vane-watch-name">{watch.companies?.name || 'Unknown Company'}</h3>
								<p class="vane-mono vane-gray vane-watch-cik">CIK: {watch.cik}</p>
							</button>
						{/each}
						{#if data.profile?.plan === 'free' && data.watches.length > 0}
							<button class="vane-watch-card vane-upgrade-card" onclick={handleUpgrade}>
								<h3 class="vane-watch-name vane-upgrade-text">Upgrade to add more</h3>
								<p class="vane-mono vane-gray vane-watch-cik">Professional plan →</p>
							</button>
						{/if}
					</div>
				{/if}
			</section>

			<section class="vane-dashboard-section">
				<h2 class="vane-section-heading">Recent Alerts</h2>
				<div class="vane-empty-state">
					<p class="vane-mono vane-gray">
						No alerts yet. We'll notify you when we detect risk escalations in your watched
						companies.
					</p>
				</div>
			</section>
		</div>
	</section>

	{#if showAddFlyout}
		<div
			class="vane-flyout-overlay"
			onclick={closeAddFlyout}
			onkeydown={(e) => handleOverlayKeydown(e, closeAddFlyout)}
			role="button"
			tabindex="0"
		>
			<div
				class="vane-flyout"
				onclick={(e) => e.stopPropagation()}
				onkeydown={(e) => e.key === 'Escape' && closeAddFlyout()}
				role="dialog"
				aria-modal="true"
				tabindex="0"
			>
				<div class="vane-flyout-header">
					<h2 class="vane-flyout-title">Add Company Watch</h2>
					<button
						class="vane-flyout-close"
						onclick={closeAddFlyout}
						aria-label="Close"
						type="button"
					>
						×
					</button>
				</div>

				<div class="vane-flyout-content">
					<form method="POST" action="?/addWatch" use:enhance>
						<div class="vane-form-group">
							<label for="company" class="vane-mono">Select Company</label>
							<SearchableSelect
								options={companyOptions}
								bind:value={selectedCompany}
								name="cik"
								placeholder="Search for a company..."
								required
							/>
						</div>
						<div class="vane-flyout-actions">
							<button type="button" class="vane-btn vane-btn-secondary" onclick={closeAddFlyout}>
								Cancel
							</button>
							<button type="submit" class="vane-btn">Add Watch</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	{/if}

	{#if showDetailsFlyout && selectedWatch}
		<div
			class="vane-flyout-overlay"
			onclick={closeDetailsFlyout}
			onkeydown={(e) => handleOverlayKeydown(e, closeDetailsFlyout)}
			role="button"
			tabindex="0"
		>
			<div
				class="vane-flyout"
				onclick={(e) => e.stopPropagation()}
				onkeydown={(e) => e.key === 'Escape' && closeDetailsFlyout()}
				role="dialog"
				aria-modal="true"
				tabindex="0"
			>
				<div class="vane-flyout-header">
					<div>
						<h2 class="vane-flyout-title">
							{selectedWatch.companies?.name || 'Unknown Company'}
						</h2>
						{#if selectedWatch.companies?.ticker}
							<p class="vane-mono vane-gray" style="margin: 0; font-size: 12px;">
								{selectedWatch.companies.ticker}
							</p>
						{/if}
					</div>

					<div class="vane-flyout-header-actions">
						<button
							class="vane-flyout-close"
							onclick={closeDetailsFlyout}
							aria-label="Close"
							type="button"
						>
							×
						</button>
					</div>
				</div>

				<div class="vane-flyout-content">
					<div class="vane-flyout-section" style="margin-top: 0;">
						<a href="/risks/{selectedWatch.id}" class="vane-btn vane-btn-primary vane-mono">
							View risks
						</a>
					</div>
					<div class="vane-flyout-section">
						<h3 class="vane-mono vane-flyout-section-title">Company Details</h3>
						<dl class="vane-details-list">
							<dt class="vane-mono">CIK</dt>
							<dd>{selectedWatch.cik}</dd>
							<dt class="vane-mono">Watching Since</dt>
							<dd>{new Date(selectedWatch.created_at).toLocaleDateString()}</dd>
							{#if selectedWatch.filings && selectedWatch.filings.length > 0}
								<dt class="vane-mono">Last Filing</dt>
								<dd>{new Date(selectedWatch.filings[0].filing_date).toLocaleDateString()}</dd>
							{/if}
						</dl>
					</div>

					<div class="vane-flyout-section">
						<div class="vane-flyout-section-actions">
							<form method="POST" action="?/removeWatch" use:enhance>
								<input type="hidden" name="watchId" value={selectedWatch.id} />
								<button type="submit" class="vane-btn-danger-flyout" style="width: 100%;">
									Remove
								</button>
							</form>
							<div></div>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.vane-dashboard {
		min-height: 100vh;
		padding: 8rem 2rem 4rem;
		background: #f6f9fc;
	}

	.vane-dashboard-container {
		max-width: 1200px;
		margin: 0 auto;
	}

	.vane-dashboard-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 2rem;
		padding: 2rem;
		background: white;
		border-radius: 12px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
	}

	.vane-dashboard-headline {
		font-family: var(--vane-display);
		font-size: clamp(2rem, 4vw, 3rem);
		font-weight: 400;
		margin: 0 0 0.5rem;
	}

	.vane-plan-badge {
		padding: 0.5rem 1rem;
		border: 1px solid #e3e8ef;
		text-transform: uppercase;
		border-radius: 6px;
		background: #f6f9fc;
	}

	.vane-plan-badge-individual {
		border-color: #ffd966;
		background: #fffbea;
		color: #8b7000;
	}

	.vane-plan-badge-enterprise {
		border-color: #ff7f0e;
		background: #ff7f0e;
		color: white;
	}

	.vane-dashboard-section {
		margin-bottom: 4rem;
	}

	.vane-section-heading {
		font-family: var(--vane-mono);
		text-transform: uppercase;
		letter-spacing: 0.1em;
		font-size: 14px;
		margin: 0 0 2rem;
		color: var(--vane-gray);
	}

	.vane-empty-state {
		text-align: center;
		padding: 4rem 2rem;
		border: 2px dashed #e3e8ef;
		border-radius: 12px;
		background: white;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		align-items: center;
	}

	.vane-watches-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 1.25rem;
	}

	.vane-watch-card {
		padding: 1.75rem;
		border: 1px solid #e3e8ef;
		background: white;
		cursor: pointer;
		text-align: left;
		transition: all 0.2s ease;
		border-radius: 12px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
	}

	.vane-watch-card:hover {
		border-color: #ff7f0e;
		box-shadow: 0 4px 12px rgba(255, 127, 14, 0.14);
		transform: translateY(-2px);
	}

	.vane-upgrade-card {
		border-style: dashed;
		border-color: #ffd966;
		background: #fffbea;
	}

	.vane-upgrade-card:hover {
		border-color: #ffd966;
		background: #fff8d5;
		box-shadow: 0 4px 12px rgba(255, 217, 102, 0.2);
	}

	.vane-upgrade-text {
		color: #8b7000;
	}

	.vane-watch-name {
		font-family: var(--vane-display);
		font-size: 1.25rem;
		font-weight: 400;
		margin: 0 0 0.5rem;
	}

	.vane-watch-cik {
		font-size: 12px;
		margin: 0;
	}

	.vane-upgrade-banner,
	.vane-error-banner {
		padding: 1.5rem;
		margin-bottom: 2rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		border-radius: 10px;
	}

	.vane-upgrade-banner {
		border: 1px solid #ffd966;
		background: #fffbea;
	}

	.vane-error-banner {
		border: 1px solid #f5b4b4;
		background: #fef2f2;
	}

	.vane-upgrade-banner p,
	.vane-error-banner p {
		margin: 0;
	}

	.vane-modal-overlay,
	.vane-flyout-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(2px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		cursor: pointer;
	}

	.vane-flyout-overlay {
		justify-content: flex-end;
	}

	.vane-modal {
		background: white;
		padding: 2rem;
		max-width: 500px;
		width: 90%;
		border-radius: 16px;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
	}

	.vane-flyout {
		background: white;
		width: 90%;
		max-width: 480px;
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
		align-items: center;
		padding: 1.5rem;
		border-bottom: 1px solid #e3e8ef;
	}

	.vane-flyout-header-actions {
		display: flex;
		align-items: center;
		gap: 1rem;
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
		font-size: 1.5rem;
		line-height: 1;
		cursor: pointer;
		padding: 0;
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--vane-gray);
		transition: all 0.15s ease;
		border-radius: 50%;
	}

	.vane-flyout-close:hover {
		background: #e3e8ef;
		color: var(--vane-black);
		border-color: #999;
	}

	.vane-flyout-content {
		padding: 1.5rem;
	}

	.vane-flyout-section {
		margin-bottom: 2rem;
	}

	.vane-flyout-section-actions {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
		margin-top: 1rem;
	}

	.vane-flyout-section-title {
		font-size: 12px;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		margin: 0 0 1rem;
		color: var(--vane-gray);
	}

	.vane-details-list {
		margin: 0;
	}

	.vane-details-list dt {
		font-size: 12px;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		margin-top: 1rem;
		color: var(--vane-gray);
	}

	.vane-details-list dt:first-child {
		margin-top: 0;
	}

	.vane-details-list dd {
		margin: 0.25rem 0 0;
		font-size: 16px;
	}

	.vane-modal-title {
		font-family: var(--vane-display);
		font-size: 1.5rem;
		font-weight: 400;
		margin: 0 0 1.5rem;
	}

	.vane-form-group {
		margin-bottom: 1.5rem;
	}

	.vane-form-group label {
		display: block;
		margin-bottom: 0.5rem;
		font-size: 12px;
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	.vane-input {
		width: 100%;
		padding: 0.75rem 1rem;
		border: 1px solid #e3e8ef;
		font-family: var(--vane-mono);
		font-size: 14px;
		border-radius: 8px;
		transition: all 0.2s ease;
	}

	.vane-input:focus {
		outline: none;
		border-color: #ff7f0e;
		box-shadow: 0 0 0 3px rgba(255, 127, 14, 0.12);
	}

	.vane-modal-actions {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
	}

	/* Base button: compact, mono, rounded (Stripe-like) */
	.vane-btn {
		display: inline-block;
		text-decoration: none;
		font-family: var(--vane-mono);
		font-size: 13px;
		line-height: 1.2;
		letter-spacing: 0.02em;
		padding: 0.5rem 0.85rem;
		border-radius: 6px;
		border: 1px solid transparent;
		transition: all 0.15s ease;
	}

	.vane-btn-secondary {
		background: white;
		color: #425466;
		border: 1px solid #ddd;
		transition: all 0.15s ease;
		padding: 0.5rem 1rem;
		font-size: 12px;
	}

	.vane-btn-secondary:hover {
		background: #f6f9fc;
		border-color: #999;
	}

	.vane-btn-danger-flyout {
		font-family: var(--vane-mono);
		text-transform: uppercase;
		letter-spacing: 0.1em;
		font-size: 12px;
		padding: 0.75rem 1rem;
		background: white;
		color: #ef4444;
		border: 1px solid #ef4444;
		cursor: pointer;
		transition: all 0.15s ease;
		border-radius: 6px;
	}

	.vane-btn-danger-flyout:hover {
		background: #ef4444;
		color: white;
	}

	.vane-btn-ghost {
		background: transparent;
		color: var(--vane-gray);
		border: none;
		font-family: var(--vane-mono);
		text-transform: uppercase;
		letter-spacing: 0.1em;
		font-size: 12px;
		cursor: pointer;
		padding: 0.5rem 1rem;
		transition: color 0.15s ease;
		border-radius: 6px;
	}

	.vane-btn-ghost:hover {
		color: var(--vane-black);
	}

	.vane-flyout-actions {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
		margin-top: 2rem;
	}

	.vane-btn-sm {
		padding: 0.4rem 0.8rem;
		font-size: 13px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-family: var(--vane-mono);
		text-decoration: none;
		border-radius: 6px;
		transition: all 0.2s;
	}

	.vane-btn-primary {
		background: #ff7f0e;
		color: white;
		border: 1px solid #ff7f0e;
	}

	.vane-btn-primary:hover {
		background: #e46f0d;
		box-shadow: 0 2px 5px rgba(255, 127, 14, 0.3);
	}

	@media (max-width: 768px) {
		.vane-dashboard {
			padding: 6rem 1rem 2rem;
		}

		.vane-dashboard-header {
			flex-direction: column;
			gap: 1rem;
		}

		.vane-watches-grid {
			grid-template-columns: 1fr;
		}

		.vane-flyout {
			width: 100%;
			max-width: 100%;
		}
	}
</style>
