<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let heroVisible = $state(false);
	let accessEmail = $state('');
	let accessLoading = $state(false);
	let accessSuccess = $state(false);
	let accessError = $state('');

	onMount(() => {
		heroVisible = true;
	});

	async function handleAccessSubmit(e: Event) {
		e.preventDefault();
		accessLoading = true;
		accessError = '';

		try {
			const response = await fetch('/api/contact', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: 'Early Access Request',
					email: accessEmail,
					message: 'Requesting early access to Vane risk alerts.'
				})
			});

			if (!response.ok) {
				if (response.status === 429) {
					throw new Error('Too many requests. Please wait a few minutes.');
				}
				throw new Error('Failed to submit. Please try again.');
			}

			accessSuccess = true;
			accessEmail = '';
		} catch (err) {
			accessError = err instanceof Error ? err.message : 'Failed to submit. Please try again.';
		} finally {
			accessLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Vane - SEC Risk Intelligence & Filing Alerts</title>
	<meta
		name="description"
		content="Detect meaningful risk escalations in SEC 10-K and 10-Q filings. Get push-based alerts when risk disclosures shift from hypothetical to factual. Know first."
	/>
	<meta
		name="keywords"
		content="SEC filings, risk factors, 10-K, 10-Q, financial risk analysis, risk intelligence, compliance alerts"
	/>

	<!-- Open Graph / Facebook -->
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://vanerisk.com/" />
	<meta property="og:title" content="Vane - SEC Risk Intelligence & Filing Alerts" />
	<meta
		property="og:description"
		content="Detect meaningful risk escalations in SEC 10-K and 10-Q filings. Get push-based alerts when risk disclosures shift."
	/>

	<!-- Twitter -->
	<meta property="twitter:card" content="summary_large_image" />
	<meta property="twitter:url" content="https://vanerisk.com/" />
	<meta property="twitter:title" content="Vane - SEC Risk Intelligence & Filing Alerts" />
	<meta
		property="twitter:description"
		content="Detect meaningful risk escalations in SEC 10-K and 10-Q filings. Get push-based alerts when risk disclosures shift."
	/>

	<!-- Canonical -->
	<link rel="canonical" href="https://vanerisk.com/" />

	<!-- Structured Data -->
	{@html `<script type="application/ld+json">
	{
		"@context": "https://schema.org",
		"@type": "SoftwareApplication",
		"name": "Vane",
		"applicationCategory": "BusinessApplication",
		"offers": {
			"@type": "Offer",
			"price": "0",
			"priceCurrency": "USD"
		},
		"description": "Detect meaningful risk escalations in SEC 10-K and 10-Q filings. Get push-based alerts when risk disclosures shift from hypothetical to factual.",
		"operatingSystem": "Web",
		"provider": {
			"@type": "Organization",
			"name": "Vane"
		}
	}
	</script>`}

	{@html `<script type="application/ld+json">
	{
		"@context": "https://schema.org",
		"@type": "Organization",
		"name": "Vane",
		"description": "SEC Risk Intelligence platform",
		"url": "https://vanerisk.com"
	}
	</script>`}
</svelte:head>

<div class="vane-home">
	<!-- Navigation -->
	<nav class="vane-nav">
		<div class="vane-nav-left">
			<span class="vane-mono">Vane</span>
			<span class="vane-mono vane-gray">SEC Risk Intelligence</span>
		</div>
		<div class="vane-nav-right">
			{#if data.session}
				<a href="/risks" class="vane-btn">Home</a>
			{:else}
				<a href="/sign-in" class="vane-btn">Sign In</a>
				<a href="/pricing" class="vane-mono vane-gray vane-nav-link">Pricing</a>
			{/if}
		</div>
	</nav>

	<!-- Hero -->
	<section class="vane-hero">
		<div class="vane-hero-content">
			<h1 class="vane-headline">Risk clarity</h1>
			<p class="vane-subhead">
				SEC filings contain critical risk signals buried in legal prose. Vane Risks detects
				meaningful escalations in 10-K and 10-Q disclosures and alerts, giving you informed decision
				making power.
			</p>
			<div class="vane-target">
				<div class="vane-target-ring"></div>
				<div class="vane-target-ring"></div>
				<div class="vane-target-ring"></div>
				<span class="vane-target-cross">+</span>
			</div>
		</div>
		<div class="vane-scroll-hint">
			<span>Scroll</span>
			<div class="vane-scroll-line"></div>
		</div>
	</section>

	<!-- Problem/Value Section -->
	<section class="vane-section vane-section-dark">
		<div class="vane-grid">
			<div class="vane-col-left">
				<span class="vane-section-label">The Problem</span>
				<h2 class="vane-section-title vane-white">
					Hours of reading.<br />
					<span class="vane-yellow">Minutes of insight.</span>
				</h2>
			</div>
			<div class="vane-col-right">
				<p class="vane-section-text">
					How do you keep up with a dynamic landscape of risks in your industry? The language shifts
					subtly and hypothetical becomes factual, generic becomes specific, contingent becomes
					realized. These shifts signal material changes, but they're invisible to keyword searches
					and impossible to track manually across hundreds of filings.
				</p>
				<div class="vane-features">
					<div class="vane-feature">
						<div class="vane-feature-num">01</div>
						<div class="vane-feature-title">Detect</div>
						<div class="vane-feature-text">
							Semantic analysis identifies escalation patterns: modal verb shifts, tense changes,
							specificity markers, new named entities, legal terminology changes.
						</div>
					</div>
					<div class="vane-feature">
						<div class="vane-feature-num">02</div>
						<div class="vane-feature-title">Score</div>
						<div class="vane-feature-text">
							Materiality scoring based on magnitude, novelty, and deviation from historical
							patterns. Normalized against industry peers.
						</div>
					</div>
					<div class="vane-feature">
						<div class="vane-feature-num">03</div>
						<div class="vane-feature-title">Alert</div>
						<div class="vane-feature-text">
							Push notifications when scores exceed threshold. Before/after excerpts, rationale, and
							recommended next sections to review.
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Before/After Section -->
	<section class="vane-section vane-section-flush">
		<div class="vane-compare">
			<div class="vane-compare-side vane-compare-before">
				<span class="vane-compare-label">Before / Q3 2024</span>
				<p class="vane-compare-quote">
					"The Company <em>may</em> face regulatory challenges in
					<em>certain</em> jurisdictions that <em>could</em> impact operations."
				</p>
			</div>
			<div class="vane-compare-side vane-section-yellow">
				<span class="vane-compare-label">After / Q4 2024</span>
				<p class="vane-compare-quote">
					"The Company <em>is</em> facing regulatory action in the
					<em>European Union</em> that <em>will</em> require operational restructuring."
				</p>
			</div>
		</div>
	</section>

	<!-- CTA Section -->
	<section class="vane-section vane-section-yellow">
		<div class="vane-cta">
			<h2 class="vane-cta-headline">Know first.</h2>
			<p class="vane-mono vane-gray vane-cta-text">
				Get early access to risk escalation alerts. Be the first to know when filings signal
				material change.
			</p>
			{#if accessSuccess}
				<p class="vane-mono vane-access-success">Thanks! We'll be in touch soon.</p>
			{:else}
				<form class="vane-form" onsubmit={handleAccessSubmit}>
					<input
						type="email"
						name="email"
						bind:value={accessEmail}
						class="vane-input"
						placeholder="Your email"
						required
						aria-label="Email address"
						disabled={accessLoading}
					/>
					<button type="submit" class="vane-submit" disabled={accessLoading}>
						{accessLoading ? 'Sending...' : 'Get access'}
					</button>
				</form>
				{#if accessError}
					<p class="vane-mono vane-access-error">{accessError}</p>
				{/if}
			{/if}
		</div>
	</section>

	<!-- Footer -->
	<footer class="vane-footer">
		<div class="vane-nav-left">
			<span class="vane-mono">© 2025 Vane</span>
		</div>
		<div class="vane-footer-links">
			<a href="/pricing" class="vane-footer-link">Plans</a>
			<a href="/comparison" class="vane-footer-link">Compare</a>
		</div>
	</footer>
</div>
