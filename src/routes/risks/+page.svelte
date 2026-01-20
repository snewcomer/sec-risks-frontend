<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	async function handleSignOut() {
		await supabase.auth.signOut();
		goto('/');
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
			<a href="/settings" class="vane-mono vane-gray vane-nav-link">Settings</a>
			<button onclick={handleSignOut} class="vane-btn">Sign Out</button>
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

			<!-- Watchlists -->
			<section class="vane-dashboard-section">
				<h2 class="vane-section-heading">Your Watchlists</h2>

				{#if data.watchlists.length === 0}
					<div class="vane-empty-state">
						<p class="vane-mono vane-gray">No watchlists yet. Create your first watchlist to start monitoring companies.</p>
						<button class="vane-btn">Create Watchlist</button>
					</div>
				{:else}
					<div class="vane-watchlists-grid">
						{#each data.watchlists as watchlist}
							<article class="vane-watchlist-card">
								<h3 class="vane-watchlist-name">{watchlist.name}</h3>
								<p class="vane-mono vane-gray vane-watchlist-count">
									{watchlist.companies.length} companies
								</p>
							</article>
						{/each}
					</div>
				{/if}
			</section>

			<!-- Recent Alerts Placeholder -->
			<section class="vane-dashboard-section">
				<h2 class="vane-section-heading">Recent Alerts</h2>
				<div class="vane-empty-state">
					<p class="vane-mono vane-gray">No alerts yet. We'll notify you when we detect risk escalations in your watchlists.</p>
				</div>
			</section>
		</div>
	</section>
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

	.vane-watchlists-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 1.5rem;
	}

	.vane-watchlist-card {
		padding: 2rem;
		border: 1px solid #e5e5e5;
		transition: border-color 0.15s ease;
	}

	.vane-watchlist-card:hover {
		border-color: var(--vane-black);
	}

	.vane-watchlist-name {
		font-family: var(--vane-display);
		font-size: 1.25rem;
		font-weight: 400;
		margin: 0 0 0.5rem;
	}

	.vane-watchlist-count {
		font-size: 12px;
		margin: 0;
	}

	@media (max-width: 768px) {
		.vane-dashboard {
			padding: 6rem 1rem 2rem;
		}

		.vane-dashboard-header {
			flex-direction: column;
			gap: 1rem;
		}

		.vane-watchlists-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
