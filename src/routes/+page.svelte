<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let heroVisible = $state(false);
	let accessEmail = $state('');
	let accessLoading = $state(false);
	let accessSuccess = $state(false);
	let accessError = $state('');

	// Ticker rotation data
	const tickers = [
		{ ticker: 'WMT', date: 'Dec 2, 2025' },
		{ ticker: 'NOW', date: 'Oct 30, 2025' },
		{ ticker: 'DOW', date: 'Feb 3, 2026' },
		{ ticker: 'NVDA', date: 'Nov 11, 2025' },
		{ ticker: 'MU', date: 'Dec 18, 2025' },
		{ ticker: 'XOM', date: 'Nov 3, 2025' },
		{ ticker: 'AAPL', date: 'Jan 30, 2026' },
		{ ticker: 'MSFT', date: 'Oct 29, 2025' },
		{ ticker: 'TSLA', date: 'Jan 29, 2026' }
	];

	let currentTickerIndex = $state(0);
	let showMessage = $state(true);

	onMount(() => {
		heroVisible = true;

		// Rotate between message and tickers
		const interval = setInterval(() => {
			if (showMessage) {
				// Switch to ticker
				showMessage = false;
			} else {
				// Move to next ticker or back to message
				currentTickerIndex = (currentTickerIndex + 1) % tickers.length;
				if (currentTickerIndex === 0) {
					showMessage = true;
				}
			}
		}, 2500);

		return () => clearInterval(interval);
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
	<title>Vane - 2026 10-Ks Are In. Track SEC Risk Changes for Free</title>
	<link rel="icon" href="/favicon.png" />
	<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
	<meta
		name="description"
		content="2026 10-K season is here! Vane automatically detects when risk disclosures shift from 'might happen' to 'is happening' in SEC filings. Try free, know first."
	/>
	<meta
		name="keywords"
		content="SEC filings, 2026 10-K, risk factors, 10-Q, financial risk analysis, risk intelligence, compliance alerts, SEC monitoring"
	/>

	<!-- Open Graph / Facebook -->
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://vanerisk.com/" />
	<meta property="og:title" content="Vane - 2026 10-Ks Are In. Track SEC Risk Changes for Free" />
	<meta
		property="og:description"
		content="2026 10-K season is here! Automatically detect when risk disclosures shift from hypothetical to factual. Try free."
	/>

	<!-- Twitter -->
	<meta property="twitter:card" content="summary_large_image" />
	<meta property="twitter:url" content="https://vanerisk.com/" />
	<meta property="twitter:title" content="Vane - 2026 10-Ks Are In. Track SEC Risk Changes" />
	<meta
		property="twitter:description"
		content="2026 10-K season is here! Automatically detect when risk disclosures shift from hypothetical to factual. Try free."
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
		"description": "Track SEC risk disclosures automatically. Vane detects when companies shift from hypothetical risks to factual events in 10-K and 10-Q filings. Free plan available.",
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
			<div class="vane-hero-badge">
				{#if showMessage}
					<span class="vane-mono" key="message">2026 10-Ks are in — Try Vane for free</span>
				{:else}
					<span class="vane-mono" key={tickers[currentTickerIndex].ticker}>
						<span style="color: var(--vane-yellow); font-weight: 700;"
							>{tickers[currentTickerIndex].ticker}</span
						>
						— {tickers[currentTickerIndex].date}
					</span>
				{/if}
			</div>
			<h1 class="vane-headline">Risk clarity</h1>
			<p class="vane-subhead">
				Track when companies shift from "might happen" to "is happening" in their SEC filings. Free
				to start, alerts when it matters.
			</p>
			<div class="vane-cta-buttons">
				<a href="/sign-in" class="vane-btn-primary">Try Vane Free</a>
				<a href="/pricing" class="vane-btn-secondary">See Plans</a>
			</div>
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
	<section class="vane-section vane-section-cta">
		<div class="vane-cta">
			<h2 class="vane-cta-headline">Start tracking risks today</h2>
			<p class="vane-mono vane-gray vane-cta-text">
				Free plan includes tracking up to 3 companies. Upgrade anytime to track your entire
				portfolio. No credit card required to start.
			</p>
			<div class="vane-cta-buttons">
				<a href="/sign-in" class="vane-btn-primary">Start Free</a>
				<a href="/pricing" class="vane-btn-secondary">View Pricing</a>
			</div>
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
