<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	interface Plan {
		name: string;
		price: string;
		period?: string;
		features: string[];
		cta: string;
		href?: string;
		highlighted?: boolean;
		priceId?: string;
	}

	const plans: Plan[] = [
		{
			name: 'Individual',
			price: '$20',
			period: '/semi annual',
			features: [
				'SEC Risk coverage',
				'10-K & 10-Q monitoring',
				'Escalation alerts',
				'Before/after comparisons',
				'Industry benchmarking'
			],
			cta: 'Get Started',
			href: '/sign-up?plan=individual',
			priceId: 'price_individual'
		},
		{
			name: 'Enterprise',
			price: 'Custom',
			features: [
				'Everything in Individual',
				'Unlimited watchlists',
				'API access',
				'Custom integrations',
				'Dedicated support'
			],
			cta: 'Contact Us',
			href: '/contact',
			highlighted: true
		}
	];

	async function handleUpgrade() {
		try {
			const response = await fetch('/api/create-checkout-session', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					plan: 'individual'
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

	const faqs = [
		{
			question: 'How does the trial work?',
			answer:
				'Start with a 14-day free trial. No credit card required. Full access to all features in your plan.'
		},
		{
			question: 'Can I change plans?',
			answer:
				'Yes. Upgrade or downgrade at any time. Changes take effect at the next billing cycle.'
		},
		{
			question: 'What about enterprise?',
			answer:
				'Need more than 100 companies or custom integrations? <a href="/contact" class="vane-faq-link">Contact us</a> for enterprise pricing.'
		}
	];
</script>

<svelte:head>
	<title>Pricing - Vane SEC Risk Intelligence</title>
	<meta
		name="description"
		content="Simple, transparent pricing for SEC risk intelligence. Start with a free trial. Monitor 10-K and 10-Q risk factors with automated alerts."
	/>
	<meta
		name="keywords"
		content="SEC filing alerts pricing, risk intelligence pricing, 10-K monitoring cost"
	/>
	<link rel="canonical" href="https://vane.app/pricing" />

	<!-- Open Graph -->
	<meta property="og:title" content="Pricing - Vane SEC Risk Intelligence" />
	<meta
		property="og:description"
		content="Simple, transparent pricing for SEC risk intelligence. Start with a free trial."
	/>
	<meta property="og:url" content="https://vane.app/pricing" />
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
			{#if data.session}
				<a href="/risks" class="vane-btn">Home</a>
			{:else}
				<a href="/sign-in" class="vane-btn">Sign In</a>
				<a href="/comparison" class="vane-mono vane-gray vane-nav-link">Compare</a>
			{/if}
		</div>
	</nav>

	<!-- Plans Header -->
	<header class="vane-plans-header">
		<div class="vane-plans-header-content">
			<h1 class="vane-plans-headline">
				Simple pricing.<br />
				<span class="vane-yellow-text">Clear value.</span>
			</h1>
			<p class="vane-plans-subhead">
				Get started with SEC risk intelligence. Affordable for individuals, scalable for
				enterprises.
			</p>
		</div>
	</header>

	<!-- Plans Grid -->
	<section class="vane-plans-section">
		<div class="vane-plans-grid">
			{#each plans as plan}
				<article class="vane-plan-card" class:vane-plan-card-dark={plan.highlighted}>
					<header class="vane-plan-header">
						<span class="vane-plan-label">Plan</span>
						<h2 class="vane-plan-name">{plan.name}</h2>
					</header>

					<div class="vane-plan-price">
						{#if plan.price === 'Custom'}
							<span class="vane-plan-custom">Custom</span>
						{:else}
							<span class="vane-plan-currency">$</span>
							<span class="vane-plan-amount">{plan.price.replace('$', '')}</span>
							{#if plan.period}
								<span class="vane-plan-period">{plan.period}</span>
							{/if}
						{/if}
					</div>

					<ul class="vane-plan-features">
						{#each plan.features as feature}
							<li class="vane-plan-feature">
								<span class="vane-plan-check">+</span>
								<span>{feature}</span>
							</li>
						{/each}
					</ul>

					{#if data.session && plan.priceId}
						<button
							onclick={handleUpgrade}
							class="vane-plan-cta"
							class:vane-plan-cta-outline={plan.highlighted}
						>
							{plan.cta}
						</button>
					{:else}
						<a
							href={plan.href}
							class="vane-plan-cta"
							class:vane-plan-cta-outline={plan.highlighted}
						>
							{plan.cta}
						</a>
					{/if}
				</article>
			{/each}
		</div>
	</section>

	<!-- FAQ Section -->
	<section class="vane-section">
		<div class="vane-plans-faq">
			{#each faqs as faq}
				<article class="vane-faq-item">
					<h3 class="vane-faq-q">{faq.question}</h3>
					<p class="vane-faq-a">{@html faq.answer}</p>
				</article>
			{/each}
		</div>
	</section>

	<!-- CTA Section -->
	<section class="vane-section vane-section-yellow">
		<div class="vane-cta">
			<h2 class="vane-cta-headline">Ready to start?</h2>
			<p class="vane-mono vane-gray vane-cta-text">
				Join investors and analysts who trust Vane for SEC risk intelligence.
			</p>
			<div class="vane-cta-buttons">
				{#if data.session}
					<button onclick={handleUpgrade} class="vane-btn-primary"> Get Started </button>
				{:else}
					<a href="/sign-up?plan=individual" class="vane-btn-primary">Get Started</a>
				{/if}
				<a href="/comparison" class="vane-btn-secondary">See How It Works</a>
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
			<a href="/privacy" class="vane-footer-link">Privacy</a>
		</div>
	</footer>
</div>
