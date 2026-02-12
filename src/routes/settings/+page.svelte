<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';
	import DashboardNav from '$lib/components/DashboardNav.svelte';
	import ErrorBanner from '$lib/components/ErrorBanner.svelte';

	let { data }: { data: PageData } = $props();

	let loading = $state(false);
	let showDeleteConfirm = $state(false);
	let portalError = $state('');

	async function handleManageSubscription() {
		loading = true;
		portalError = '';

		try {
			const response = await fetch('/api/create-portal-session', {
				method: 'POST'
			});

			if (!response.ok) {
				throw new Error('Failed to create portal session');
			}

			const { url } = await response.json();
			if (url) {
				window.location.href = url;
			} else {
				throw new Error('No portal URL received');
			}
		} catch (err) {
			portalError =
				err instanceof Error ? err.message : 'Failed to open billing portal. Please try again.';
		} finally {
			loading = false;
		}
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Settings - Vane</title>
	<meta name="description" content="Manage your Vane account and subscription settings." />
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="vane-home">
	<DashboardNav />

	<!-- Settings -->
	<section class="vane-dashboard">
		<div class="vane-dashboard-container">
			{#if portalError}
				<ErrorBanner message={portalError} onClose={() => (portalError = '')} />
			{/if}

			<!-- Account Info -->
			<section class="vane-settings-section">
				<h2 class="vane-section-heading">Account information</h2>
				<div class="vane-settings-card">
					<div class="vane-settings-row">
						<span class="vane-mono vane-gray vane-settings-label">Name</span>
						<span class="vane-mono">{data.profile?.name || 'Not set'}</span>
					</div>
					<div class="vane-settings-row">
						<span class="vane-mono vane-gray vane-settings-label">Email</span>
						<span class="vane-mono">{data.profile?.email}</span>
					</div>
					<div class="vane-settings-row">
						<span class="vane-mono vane-gray vane-settings-label">Plan</span>
						<span class="vane-mono vane-plan-badge-{data.profile?.plan}">
							{data.profile?.plan || 'free'}
						</span>
					</div>
					<div class="vane-settings-row">
						<span class="vane-mono vane-gray vane-settings-label">Member since</span>
						<span class="vane-mono">
							{data.profile?.created_at ? formatDate(data.profile.created_at) : 'Unknown'}
						</span>
					</div>
				</div>
			</section>

			<!-- Subscription Management -->
			{#if data.subscription}
				<section class="vane-settings-section">
					<h2 class="vane-section-heading">Subscription</h2>
					<div class="vane-settings-card">
						<div class="vane-settings-row">
							<span class="vane-mono vane-gray vane-settings-label">Status</span>
							<span
								class="vane-mono vane-subscription-status vane-subscription-status-{data
									.subscription.status}"
							>
								{data.subscription.status}
							</span>
						</div>
						{#if data.subscription.items.data[0]?.current_period_end}
							<div class="vane-settings-row">
								<span class="vane-mono vane-gray vane-settings-label">
									{data.subscription.cancel_at_period_end ? 'Ends' : 'Renews'} on
								</span>
								<span class="vane-mono">
									{formatDate(
										new Date(
											data.subscription.items.data[0].current_period_end * 1000
										).toISOString()
									)}
								</span>
							</div>
						{/if}
						<div class="vane-settings-actions">
							<button class="vane-btn" onclick={handleManageSubscription} disabled={loading}>
								{loading ? 'Loading...' : 'Manage Subscription'}
							</button>
							<p class="vane-mono vane-gray vane-settings-note">
								Cancel, update payment method, or view invoices in the Stripe portal.
							</p>
						</div>
					</div>
				</section>
			{:else if data.profile?.plan === 'free'}
				<section class="vane-settings-section">
					<h2 class="vane-section-heading">Subscription</h2>
					<div class="vane-settings-card">
						<p class="vane-mono vane-gray">You're currently on the free plan.</p>
						<div class="vane-settings-actions">
							<a href="/pricing" class="vane-btn">Upgrade to Professional</a>
							<div></div>
						</div>
					</div>
				</section>
			{/if}

			<!-- Support -->
			<section class="vane-settings-section">
				<h2 class="vane-section-heading">Support</h2>
				<div class="vane-settings-card">
					<p class="vane-mono vane-gray">Have questions or need help? We're here for you.</p>
					<div class="vane-settings-actions">
						<a href="/contact" class="vane-btn">Contact Us</a>
					</div>
				</div>
			</section>

			<!-- Danger Zone -->
			<section class="vane-settings-section vane-settings-danger">
				<h2 class="vane-section-heading">Danger Zone</h2>
				<div class="vane-settings-card vane-settings-card-danger">
					<h3 class="vane-settings-danger-title">Delete Account</h3>
					<p class="vane-mono vane-gray vane-settings-danger-text">
						Permanently delete your account and all associated data. This action cannot be undone.
					</p>
					{#if !showDeleteConfirm}
						<button class="vane-btn-danger" onclick={() => (showDeleteConfirm = true)}>
							Delete account
						</button>
					{:else}
						<div class="vane-delete-confirm">
							<p class="vane-mono vane-delete-confirm-text">Are you absolutely sure?</p>
							<div class="vane-delete-confirm-actions">
								<form method="POST" action="?/deleteAccount" use:enhance>
									<button type="submit" class="vane-btn-danger">Yes, Delete my account</button>
								</form>
								<button class="vane-btn" onclick={() => (showDeleteConfirm = false)}>
									Cancel
								</button>
							</div>
						</div>
					{/if}
				</div>
			</section>
		</div>
	</section>
</div>

<style>
	.vane-dashboard {
		min-height: 100vh;
		padding: 8rem 2rem 4rem;
		background: #f6f9fc;
	}

	.vane-dashboard-container {
		max-width: 800px;
		margin: 0 auto;
	}

	.vane-dashboard-header {
		margin-bottom: 2rem;
		border-bottom: 1px solid #e5e5e5;
	}

	.vane-dashboard-headline {
		font-family: var(--vane-display);
		font-size: clamp(2rem, 4vw, 3rem);
		font-weight: 400;
		margin: 0;
	}

	.vane-settings-section {
		margin-bottom: 2rem;
	}

	.vane-section-heading {
		font-family: var(--vane-mono);
		text-transform: uppercase;
		letter-spacing: 0.1em;
		font-size: 14px;
		margin: 0 0 1rem;
		color: var(--vane-gray);
	}

	.vane-settings-card {
		border: 1px solid #e5e5e5;
		padding: 1.5rem;
		border-radius: 12px;
		background: white;
	}

	.vane-settings-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 0;
		border-bottom: 1px solid #f5f5f5;
	}

	.vane-settings-row:last-child {
		border-bottom: none;
	}

	.vane-settings-label {
		font-size: 13px;
	}

	.vane-subscription-status {
		text-transform: capitalize;
		padding: 0.25rem 0.75rem;
		border-radius: 0.25rem;
		font-size: 11px;
	}

	.vane-subscription-status-active {
		background: #e6f7e6;
		color: #0a5a0a;
	}

	.vane-subscription-status-canceled {
		background: #fee;
		color: #c00;
	}

	.vane-settings-actions {
		margin-top: 1.5rem;
		display: flex;
		gap: 1rem;
	}

	.vane-settings-note {
		font-size: 12px;
		margin: 0;
		display: flex;
		align-items: center;
	}

	.vane-settings-danger {
		margin-top: 4rem;
	}

	.vane-settings-card-danger {
		border-color: #fcc;
		background: #fef;
	}

	.vane-settings-danger-title {
		font-family: var(--vane-mono);
		text-transform: uppercase;
		letter-spacing: 0.1em;
		font-size: 14px;
		margin: 0 0 1rem;
		color: #c00;
	}

	.vane-settings-danger-text {
		font-size: 13px;
		margin: 0 0 1.5rem;
	}

	.vane-btn-danger {
		font-family: var(--vane-mono);
		text-transform: uppercase;
		letter-spacing: 0.1em;
		font-size: 12px;
		padding: 0.75rem 1.5rem;
		background: #c00;
		color: white;
		border: 1px solid #c00;
		cursor: pointer;
		transition: all 0.15s ease;
		border-radius: 6px;
	}

	.vane-btn-danger:hover {
		background: #a00;
		border-color: #a00;
	}

	.vane-delete-confirm {
		padding: 2rem;
		border: 2px solid #c00;
		background: white;
		margin-top: 1rem;
		border-radius: 8px;
	}

	.vane-delete-confirm-text {
		font-size: 14px;
		font-weight: 700;
		margin: 0 0 1.5rem;
		color: #c00;
	}

	.vane-delete-confirm-actions {
		display: flex;
		gap: 1rem;
	}

	@media (max-width: 768px) {
		.vane-dashboard {
			padding: 6rem 1rem 2rem;
		}

		.vane-settings-row {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}

		.vane-delete-confirm-actions {
			flex-direction: column;
		}
	}
</style>
