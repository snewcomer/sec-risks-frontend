<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';
	import SearchableSelect from '$lib/components/SearchableSelect.svelte';
	import DashboardNav from '$lib/components/DashboardNav.svelte';
	import ErrorBanner from '$lib/components/ErrorBanner.svelte';

	let { data, form }: { data: PageData; form: any } = $props();

	let showAddFlyout = $state(false);
	let showDetailsFlyout = $state(false);
	let selectedWatch = $state<any>(null);
	let selectedCompany = $state('');
	let upgradeError = $state('');
	let addingWatch = $state(false);
	let addWatchSuccess = $state(false);
	let removingWatch = $state(false);

	const companyOptions = $derived(
		data.companies.map((company) => ({
			value: company.cik,
			label: `${company.name}${company.ticker ? ` (${company.ticker})` : ''}`,
			searchValue: [company.name, company.ticker].filter(Boolean).join(' ')
		}))
	);

	async function handleUpgrade() {
		upgradeError = '';
		try {
			const response = await fetch('/api/create-checkout-session', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					priceId: import.meta.env.PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID || 'price_professional'
				})
			});

			if (!response.ok) {
				throw new Error('Failed to create checkout session');
			}

			const { url } = await response.json();
			if (url) {
				window.location.href = url;
			} else {
				throw new Error('No checkout URL received');
			}
		} catch (error) {
			upgradeError =
				error instanceof Error
					? error.message
					: 'Failed to start upgrade process. Please try again.';
		}
	}

	function openAddFlyout() {
		selectedCompany = '';
		addWatchSuccess = false;
		showAddFlyout = true;
	}

	function closeAddFlyout() {
		showAddFlyout = false;
		selectedCompany = '';
		addWatchSuccess = false;
	}

	function handleAddWatchSubmit() {
		return async ({ result, update }: { result: any; update: () => Promise<void> }) => {
			addingWatch = false;
			if (result.type === 'success') {
				addWatchSuccess = true;
				selectedCompany = '';
				await update();
				setTimeout(() => {
					closeAddFlyout();
				}, 1500);
			} else {
				await update();
			}
		};
	}

	function handleRemoveWatchSubmit() {
		return async ({ result, update }: { result: any; update: () => Promise<void> }) => {
			removingWatch = false;
			if (result.type === 'success') {
				closeDetailsFlyout();
			}
			await update();
		};
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
					<h1 class="vane-dashboard-headline">SEC Risk Monitor</h1>
					<p class="vane-mono vane-gray">
						Welcome back, {data.profile?.name || data.profile?.email}
					</p>
				</div>
				<div class="vane-plan-badge vane-plan-badge-{data.profile?.plan}">
					<span class="vane-mono">{data.profile?.plan || 'free'} plan</span>
				</div>
			</header>

			{#if data.trendingThemes && data.trendingThemes.length > 0}
				<section class="vane-dashboard-section">
					<h2 class="vane-section-heading">Trending themes</h2>
					<div class="vane-trending-pills">
						{#each data.trendingThemes as theme}
							<a href="/risks/theme/{theme.theme_id}" class="vane-trending-pill">
								<span class="vane-pill-name">{theme.theme_name}</span>
								<span class="vane-pill-count">{theme.company_reach}</span>
							</a>
						{/each}
					</div>
				</section>
			{/if}

			<section class="vane-dashboard-section">
				<div
					style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;"
				>
					<h2 class="vane-section-heading" style="margin: 0;">Companies</h2>
					{#if data.watches.length > 0}
						<button class="vane-btn" onclick={openAddFlyout}> Track Company </button>
					{/if}
				</div>

				{#if form?.error}
					<ErrorBanner message={form.error} />
				{/if}

				{#if upgradeError}
					<ErrorBanner message={upgradeError} onClose={() => (upgradeError = '')} />
				{/if}

				{#if data.watches.length === 0}
					<div class="vane-empty-state">
						<p class="vane-mono vane-gray">
							No companies tracked yet. Add your first company to start monitoring SEC filings.
						</p>
						<button class="vane-btn" onclick={openAddFlyout}> Track Company </button>
					</div>
				{:else}
					<div class="vane-watches-grid">
						{#each data.watches as watch}
							<button class="vane-watch-card" onclick={() => openDetailsFlyout(watch)}>
								<h3 class="vane-watch-name">{watch.companies?.name || 'Unknown Company'}</h3>
								<p class="vane-mono vane-gray vane-watch-cik">
									{#if watch.filings && watch.filings.length > 0}
										Latest filing: {new Date(watch.filings[0].filing_date).toLocaleDateString(
											'en-US',
											{ year: 'numeric', month: 'short', day: 'numeric' }
										)}
									{:else}
										No filings
									{/if}
								</p>
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
					<h2 class="vane-flyout-title">Track Company</h2>
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
					{#if addWatchSuccess}
						<div class="vane-flyout-success">
							<svg
								class="vane-success-icon"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
								<polyline points="22 4 12 14.01 9 11.01" />
							</svg>
							<p class="vane-mono">Company added</p>
						</div>
					{:else}
						<form
							method="POST"
							action="?/addWatch"
							use:enhance={() => {
								addingWatch = true;
								return handleAddWatchSubmit();
							}}
						>
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
								<button
									type="button"
									class="vane-btn vane-btn-secondary"
									onclick={closeAddFlyout}
									disabled={addingWatch}
								>
									Cancel
								</button>
								<button type="submit" class="vane-btn" disabled={addingWatch}>
									{#if addingWatch}
										<span class="vane-spinner"></span>
										Adding...
									{:else}
										Add
									{/if}
								</button>
							</div>
						</form>
					{/if}

					{#if data.trendingThemes && data.trendingThemes.length > 0}
						<div class="vane-flyout-trending">
							<h3 class="vane-mono vane-flyout-section-title">Trending themes</h3>
							<div class="vane-flyout-pills">
								{#each data.trendingThemes.slice(0, 5) as theme}
									<a href="/risks/theme/{theme.theme_id}" class="vane-flyout-pill">
										{theme.theme_name}
									</a>
								{/each}
							</div>
						</div>
					{/if}

					<div class="vane-flyout-footer">
						<a href="/contact" class="vane-mono vane-flyout-contact-link">
							Missing risks? Contact us
						</a>
					</div>
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
							<dt class="vane-mono">SIC</dt>
							<dd>{selectedWatch.companies.sic_code}</dd>
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
							<form
								method="POST"
								action="?/removeWatch"
								use:enhance={() => {
									removingWatch = true;
									return handleRemoveWatchSubmit();
								}}
							>
								<input type="hidden" name="watchId" value={selectedWatch.id} />
								<button
									type="submit"
									class="vane-btn-danger-flyout"
									style="width: 100%;"
									disabled={removingWatch}
								>
									{#if removingWatch}
										<span class="vane-spinner"></span>
										Removing...
									{:else}
										Remove
									{/if}
								</button>
							</form>
							<div></div>
						</div>
					</div>

					{#if data.trendingThemes && data.trendingThemes.length > 0}
						<div class="vane-flyout-trending">
							<h3 class="vane-mono vane-flyout-section-title">Trending themes</h3>
							<div class="vane-flyout-pills">
								{#each data.trendingThemes.slice(0, 5) as theme}
									<a href="/risks/theme/{theme.theme_id}" class="vane-flyout-pill">
										{theme.theme_name}
									</a>
								{/each}
							</div>
						</div>
					{/if}

					<div class="vane-flyout-footer">
						<a href="/contact" class="vane-mono vane-flyout-contact-link">
							Missing risks? Contact us
						</a>
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

	.vane-plan-badge-professional {
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
		margin: 0 0 1rem;
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
		padding: 1.25rem;
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

	.vane-modal-overlay,
	.vane-flyout-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
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
		margin-bottom: 1rem;
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
		padding: 0.5rem 0.5rem;
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

	.vane-flyout-footer {
		margin-top: 2rem;
		padding-top: 1.5rem;
		border-top: 1px solid #e3e8ef;
		text-align: center;
	}

	.vane-flyout-contact-link {
		font-size: 12px;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--vane-gray);
		text-decoration: none;
		transition: color 0.15s ease;
	}

	.vane-flyout-contact-link:hover {
		color: #ff7f0e;
	}

	.vane-spinner {
		display: inline-block;
		width: 14px;
		height: 14px;
		border: 2px solid currentColor;
		border-right-color: transparent;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
		margin-right: 0.5rem;
		vertical-align: middle;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.vane-flyout-success {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem 2rem;
		text-align: center;
		gap: 1rem;
	}

	.vane-success-icon {
		width: 48px;
		height: 48px;
		color: #22c55e;
	}

	.vane-flyout-success p {
		margin: 0;
		color: #166534;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		font-size: 14px;
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

	/* Trending Pills */
	.vane-trending-pills {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
	}

	.vane-trending-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.875rem;
		background: white;
		border: 1px solid #e3e8ef;
		border-radius: 20px;
		text-decoration: none;
		transition: all 0.15s ease;
	}

	.vane-trending-pill:hover {
		border-color: #ff7f0e;
		background: #fff7ed;
		transform: translateY(-1px);
		box-shadow: 0 2px 8px rgba(255, 127, 14, 0.12);
	}

	.vane-pill-name {
		font-size: 0.875rem;
		color: #1a1f36;
	}

	.vane-pill-count {
		font-family: var(--vane-mono);
		font-size: 0.6875rem;
		padding: 0.125rem 0.375rem;
		background: #f0f2f5;
		border-radius: 10px;
		color: var(--vane-gray);
	}

	.vane-trending-pill:hover .vane-pill-count {
		background: #ffe4c9;
		color: #b8520e;
	}

	/* Flyout Trending */
	.vane-flyout-trending {
		margin-top: 1.5rem;
		padding-top: 1.5rem;
		border-top: 1px solid #e3e8ef;
	}

	.vane-flyout-pills {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.vane-flyout-pill {
		display: inline-block;
		padding: 0.375rem 0.75rem;
		background: #f6f9fc;
		border: 1px solid #e3e8ef;
		border-radius: 16px;
		font-size: 0.8125rem;
		color: #425466;
		text-decoration: none;
		transition: all 0.15s ease;
	}

	.vane-flyout-pill:hover {
		border-color: #ff7f0e;
		background: #fff7ed;
		color: #b8520e;
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

		.vane-trending-pills {
			overflow-x: auto;
			flex-wrap: nowrap;
			padding-bottom: 0.5rem;
			-webkit-overflow-scrolling: touch;
		}

		.vane-trending-pill {
			flex-shrink: 0;
		}
	}
</style>
