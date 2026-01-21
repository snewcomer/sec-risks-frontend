<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

	let { data, form }: { data: PageData; form: any } = $props();

	let showAddFlyout = $state(false);
	let showDetailsFlyout = $state(false);
	let selectedWatch = $state<any>(null);
	let selectedCompany = $state('');

	async function handleSignOut() {
		await supabase.auth.signOut();
		goto('/');
	}

	async function handleUpgrade() {
		try {
			const response = await fetch('/api/create-checkout-session', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					priceId: process.env.STRIPE_INDIVIDUAL_PRICE_ID || 'price_individual'
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
</script>

<svelte:head>
	<title>Risks Dashboard - Vane</title>
	<meta name="description" content="Monitor your SEC risk intelligence alerts and watchlists." />
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="vane-home">
	<!-- Navigation -->
	<nav class="vane-nav">
		<div class="vane-nav-left">
			<a href="/" class="vane-nav-brand">
				<span class="vane-mono">Vane</span>
				<span class="vane-mono vane-gray">SEC Risk Intelligence</span>
			</a>
		</div>
		<div class="vane-nav-right">
			<a href="/settings" class="vane-mono vane-nav-link">Settings</a>
			<button onclick={handleSignOut} class="vane-btn-ghost">Sign Out</button>
		</div>
	</nav>

	<!-- Dashboard -->
	<section class="vane-dashboard">
		<div class="vane-dashboard-container">
			<!-- Header -->
			<header class="vane-dashboard-header">
				<div>
					<h1 class="vane-dashboard-headline">Risk Dashboard</h1>
					<p class="vane-mono vane-gray">
						Welcome back, {data.profile?.name || data.profile?.email}
					</p>
				</div>
				<div class="vane-plan-badge vane-plan-badge-{data.profile?.plan}">
					<span class="vane-mono">{data.profile?.plan || 'free'} plan</span>
				</div>
			</header>

			<!-- Company Watches -->
			<section class="vane-dashboard-section">
				<div
					style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;"
				>
					<h2 class="vane-section-heading" style="margin: 0;">Company Watches</h2>
					{#if data.watches.length > 0}
						<button class="vane-btn" onclick={openAddFlyout}> Add Company Watch </button>
					{/if}
				</div>

				{#if form?.needsUpgrade}
					<div class="vane-upgrade-banner">
						<p class="vane-mono">Free plan is limited to 1 company watch</p>
						<button class="vane-btn" onclick={handleUpgrade}>Upgrade to Individual Plan</button>
					</div>
				{/if}

				{#if form?.error && !form?.needsUpgrade}
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
					</div>
				{/if}
			</section>

			<!-- Recent Alerts Placeholder -->
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

	<!-- Add Watch Flyout -->
	{#if showAddFlyout}
		<div class="vane-flyout-overlay" onclick={closeAddFlyout}>
			<aside
				class="vane-flyout"
				onclick={(e) => e.stopPropagation()}
				role="dialog"
				aria-modal="true"
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
							<select
								id="company"
								name="cik"
								class="vane-select"
								bind:value={selectedCompany}
								required
							>
								<option value="">Choose a company...</option>
								{#each data.companies as company}
									<option value={company.cik}>
										{company.name}{company.ticker ? ` (${company.ticker})` : ''}
									</option>
								{/each}
							</select>
							<p class="vane-mono vane-gray" style="font-size: 12px; margin-top: 0.5rem;">
								Select a company to start monitoring their SEC filings
							</p>
						</div>
						<div class="vane-flyout-actions">
							<button type="button" class="vane-btn vane-btn-secondary" onclick={closeAddFlyout}>
								Cancel
							</button>
							<button type="submit" class="vane-btn">Add Watch</button>
						</div>
					</form>
				</div>
			</aside>
		</div>
	{/if}

	<!-- Watch Details Flyout -->
	{#if showDetailsFlyout && selectedWatch}
		<div class="vane-flyout-overlay" onclick={closeDetailsFlyout}>
			<aside
				class="vane-flyout"
				onclick={(e) => e.stopPropagation()}
				role="dialog"
				aria-modal="true"
			>
				<div class="vane-flyout-header">
					<h2 class="vane-flyout-title">
						{selectedWatch.companies?.name || 'Unknown Company'}
					</h2>
					<button
						class="vane-flyout-close"
						onclick={closeDetailsFlyout}
						aria-label="Close"
						type="button"
					>
						×
					</button>
				</div>

				<div class="vane-flyout-content">
					<div class="vane-flyout-section">
						<h3 class="vane-mono vane-flyout-section-title">Company Details</h3>
						<dl class="vane-details-list">
							<dt class="vane-mono">CIK</dt>
							<dd>{selectedWatch.cik}</dd>
							<dt class="vane-mono">Watching Since</dt>
							<dd>{new Date(selectedWatch.created_at).toLocaleDateString()}</dd>
						</dl>
					</div>

					<div class="vane-flyout-section">
						<h3 class="vane-mono vane-flyout-section-title">Actions</h3>
						<form method="POST" action="?/removeWatch" use:enhance>
							<input type="hidden" name="watchId" value={selectedWatch.id} />
							<button type="submit" class="vane-btn vane-btn-danger" style="width: 100%;">
								Stop Watching Company
							</button>
						</form>
					</div>
				</div>
			</aside>
		</div>
	{/if}
</div>

<style>
	.vane-dashboard {
		min-height: 100vh;
		padding: 8rem 2rem 4rem;
	}

	.vane-dashboard-container {
		max-width: 1200px;
		margin: 0 auto;
	}

	.vane-dashboard-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 4rem;
		padding-bottom: 2rem;
		border-bottom: 1px solid #e5e5e5;
	}

	.vane-dashboard-headline {
		font-family: var(--vane-display);
		font-size: clamp(2rem, 4vw, 3rem);
		font-weight: 400;
		margin: 0 0 0.5rem;
	}

	.vane-plan-badge {
		padding: 0.5rem 1rem;
		border: 1px solid #e5e5e5;
		text-transform: uppercase;
	}

	.vane-plan-badge-individual {
		border-color: var(--vane-yellow);
		background: rgba(255, 235, 59, 0.1);
	}

	.vane-plan-badge-enterprise {
		border-color: var(--vane-black);
		background: var(--vane-black);
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
		border: 1px dashed #ddd;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		align-items: center;
	}

	.vane-watches-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 1.5rem;
	}

	.vane-watch-card {
		padding: 2rem;
		border: 1px solid #e5e5e5;
		background: white;
		cursor: pointer;
		text-align: left;
		transition: border-color 0.15s ease;
	}

	.vane-watch-card:hover {
		border-color: var(--vane-black);
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
	}

	.vane-upgrade-banner {
		border: 1px solid var(--vane-yellow);
		background: rgba(255, 235, 59, 0.05);
	}

	.vane-error-banner {
		border: 1px solid #ef4444;
		background: rgba(239, 68, 68, 0.05);
	}

	.vane-upgrade-banner p,
	.vane-error-banner p {
		margin: 0;
	}

	.vane-modal-overlay,
	.vane-flyout-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.vane-flyout-overlay {
		justify-content: flex-end;
	}

	.vane-modal {
		background: white;
		padding: 2rem;
		max-width: 500px;
		width: 90%;
		border: 1px solid var(--vane-black);
	}

	.vane-flyout {
		background: white;
		width: 90%;
		max-width: 500px;
		height: 100vh;
		overflow-y: auto;
		border-left: 1px solid var(--vane-black);
		animation: slideIn 0.2s ease-out;
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
		padding: 2rem;
		border-bottom: 1px solid #e5e5e5;
	}

	.vane-flyout-title {
		font-family: var(--vane-display);
		font-size: 1.5rem;
		font-weight: 400;
		margin: 0;
	}

	.vane-flyout-close {
		background: none;
		border: none;
		font-size: 2rem;
		line-height: 1;
		cursor: pointer;
		padding: 0;
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.vane-flyout-content {
		padding: 2rem;
	}

	.vane-flyout-section {
		margin-bottom: 2rem;
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
		padding: 0.75rem;
		border: 1px solid #e5e5e5;
		font-family: var(--vane-mono);
		font-size: 14px;
	}

	.vane-input:focus {
		outline: none;
		border-color: var(--vane-black);
	}

	.vane-modal-actions {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
	}

	.vane-btn-secondary {
		background: white;
		color: var(--vane-black);
		border: 1px solid var(--vane-black);
	}

	.vane-btn-secondary:hover {
		background: var(--vane-black);
		color: white;
	}

	.vane-btn-danger {
		background: #ef4444;
		color: white;
		border: 1px solid #ef4444;
	}

	.vane-btn-danger:hover {
		background: #dc2626;
		border-color: #dc2626;
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
	}

	.vane-btn-ghost:hover {
		color: var(--vane-black);
	}

	.vane-select {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #e5e5e5;
		font-family: var(--vane-mono);
		font-size: 14px;
		background: white;
		cursor: pointer;
	}

	.vane-select:focus {
		outline: none;
		border-color: var(--vane-black);
	}

	.vane-flyout-actions {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
		margin-top: 2rem;
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
