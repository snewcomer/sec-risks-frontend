<script lang="ts">
	interface ComparisonRow {
		label: string;
		vane: string;
		competitor: string;
	}

	const comparisonData: ComparisonRow[] = [
		{
			label: 'Source material',
			vane: 'SEC filings, parsed & normalized',
			competitor: 'General internet corpus'
		},
		{
			label: 'Analysis type',
			vane: 'Semantic shift detection',
			competitor: 'Summary generation'
		},
		{
			label: 'Output',
			vane: 'Actionable escalation alerts',
			competitor: 'Generic descriptions'
		},
		{
			label: 'Temporal context',
			vane: 'Before/after comparisons',
			competitor: 'Point-in-time snapshot'
		},
		{
			label: 'Industry benchmarks',
			vane: 'Peer-normalized scoring',
			competitor: 'No context'
		}
	];

	interface Pillar {
		number: string;
		title: string;
		description: string;
	}

	const pillars: Pillar[] = [
		{
			number: '01',
			title: 'Longitudinal tracking',
			description:
				"We maintain a corpus of each company's Risk Factors across every filing period. This lets us detect changes that point-in-time analysis misses entirely."
		},
		{
			number: '02',
			title: 'Semantic classification',
			description:
				'Our models identify specific escalation patterns: modal verb shifts, tense changes, specificity markers, new named entities, legal terminology.'
		},
		{
			number: '03',
			title: 'Industry normalization',
			description:
				'Every score is normalized against industry peers. Know if a company is early, in-line, or lagging in disclosing risks others have already flagged.'
		}
	];
</script>

<svelte:head>
	<title>Compare - Vane vs Generic AI | SEC Risk Intelligence</title>
	<meta
		name="description"
		content="See how Vane's specialized SEC risk analysis compares to generic AI tools. Semantic shift detection vs summary generation. Signal vs noise."
	/>
	<meta
		name="keywords"
		content="SEC filing analysis, AI comparison, risk intelligence, financial analysis tools"
	/>
	<link rel="canonical" href="https://vane.app/comparison" />

	<!-- Open Graph -->
	<meta property="og:title" content="Compare - Vane vs Generic AI" />
	<meta
		property="og:description"
		content="See how Vane's specialized SEC risk analysis compares to generic AI tools. Signal vs noise."
	/>
	<meta property="og:url" content="https://vane.app/comparison" />
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
		<div class="vane-nav-center">
			<span class="vane-mono vane-gray">The Difference</span>
		</div>
		<div class="vane-nav-right">
			<a href="/sign-in" class="vane-btn">Sign In</a>
		</div>
	</nav>

	<!-- Hero -->
	<section class="vane-compare-hero">
		<div class="vane-compare-hero-content">
			<h1 class="vane-compare-headline">
				Signal,<br /><span class="vane-compare-headline-accent">not noise.</span>
			</h1>
			<p class="vane-compare-subhead">Vane detects what matters.<br />The difference is alpha.</p>
		</div>
	</section>

	<!-- The Problem with AI -->
	<section class="vane-section vane-section-dark">
		<div class="vane-diff-grid">
			<div class="vane-diff-left">
				<span class="vane-section-label">The Problem</span>
				<h2 class="vane-section-title vane-white">
					AI reads everything.<br />
					<span class="vane-yellow">It understands nothing.</span>
				</h2>
			</div>
			<div class="vane-diff-right">
				<p class="vane-section-text">
					Large language models are trained on the entire internet. They produce fluent summaries
					that sound authoritative but miss the specific, actionable signals that drive decisions.
					They can't distinguish between boilerplate risk language and genuine escalation.
				</p>
			</div>
		</div>
	</section>

	<!-- Comparison Table -->
	<section class="vane-section vane-section-flush">
		<div class="vane-table-wrapper">
			<table class="vane-table">
				<thead>
					<tr>
						<th class="vane-table-header"></th>
						<th class="vane-table-header vane-table-header-vane">Vane</th>
						<th class="vane-table-header vane-table-header-other">Off-the-shelf AI</th>
					</tr>
				</thead>
				<tbody>
					{#each comparisonData as row}
						<tr class="vane-table-row">
							<td class="vane-table-label">{row.label}</td>
							<td class="vane-table-cell vane-table-cell-vane">{row.vane}</td>
							<td class="vane-table-cell vane-table-cell-other">{row.competitor}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>

	<!-- Side by Side Example -->
	<section class="vane-section">
		<div class="vane-example-header">
			<h2 class="vane-section-title">Same filing.<br />Different insight.</h2>
		</div>

		<div class="vane-example-grid">
			<!-- Vane Output -->
			<article class="vane-example-card vane-example-card-vane">
				<div class="vane-example-badge">
					<span class="vane-example-badge-dot vane-example-badge-dot-vane"></span>
					<span>Vane Output</span>
				</div>
				<div class="vane-example-content">
					<p class="vane-example-highlight">
						<strong>Escalation detected:</strong>
						Regulatory risk shifted from hypothetical to realized.
					</p>
					<p class="vane-example-text">
						Q3 → Q4 change: "may face challenges" became "is facing regulatory action." Jurisdiction
						specified (EU). Timeline added (restructuring required by Q2).
					</p>
					<span class="vane-example-tag">Confidence: High</span>
					<p class="vane-example-action">
						<strong>Recommended:</strong> Review MD&A section 4.2, Legal Proceedings.
					</p>
				</div>
			</article>

			<!-- LLM Output -->
			<article class="vane-example-card vane-example-card-other">
				<div class="vane-example-badge">
					<span class="vane-example-badge-dot vane-example-badge-dot-other"></span>
					<span>Generic AI Output</span>
				</div>
				<div class="vane-example-content">
					<p class="vane-example-text">
						The company faces regulatory challenges in certain jurisdictions that could impact
						operations. Management is monitoring the situation and will take appropriate actions as
						needed. Investors should consider regulatory risk as part of their investment decision.
					</p>
					<p class="vane-example-faded">
						No escalation detected. No temporal comparison. No specific action.
					</p>
				</div>
			</article>
		</div>
	</section>

	<!-- Three Pillars -->
	<section class="vane-section vane-section-dark">
		<div class="vane-pillars-header">
			<span class="vane-section-label">The Vane Approach</span>
			<h2 class="vane-section-title vane-white">Three things we do differently.</h2>
		</div>

		<div class="vane-pillars-grid">
			{#each pillars as pillar}
				<article class="vane-pillar">
					<div class="vane-pillar-num">{pillar.number}</div>
					<h3 class="vane-pillar-title">{pillar.title}</h3>
					<p class="vane-pillar-text">{pillar.description}</p>
				</article>
			{/each}
		</div>
	</section>

	<!-- CTA -->
	<section class="vane-section vane-section-yellow">
		<div class="vane-cta">
			<h2 class="vane-cta-headline">See it yourself.</h2>
			<div class="vane-cta-buttons">
				<a href="mailto:info@vanerisk.com?subject=Vane%20Demo%20Request" class="vane-btn-primary">
					Let's chat →
				</a>
				<a href="/pricing" class="vane-btn-secondary">View pricing</a>
			</div>
		</div>
	</section>

	<!-- Footer -->
	<footer class="vane-footer">
		<div class="vane-nav-left">
			<span class="vane-mono">© 2025 Vane</span>
		</div>
		<div class="vane-footer-links">
			<a href="/" class="vane-footer-link">Home</a>
			<a href="/pricing" class="vane-footer-link">Plans</a>
			<a href="/privacy" class="vane-footer-link">Privacy</a>
		</div>
	</footer>
</div>
