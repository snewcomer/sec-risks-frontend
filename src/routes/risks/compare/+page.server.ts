import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// Theme categories for grouping
const THEME_CATEGORIES: Record<string, string[]> = {
	'Operational Risk': [
		'op-key-personnel',
		'op-business-continuity',
		'op-quality-control',
		'op-capacity-constraints',
		'geo-concentration',
		'sales-complexity',
		'clinical-dev-risk'
	],
	'Financial Risk': [
		'fin-liquidity',
		'fin-debt-leverage',
		'fin-currency',
		'fin-interest-rate',
		'fin-credit-access',
		'asset-impairment',
		'rev-rec-timing',
		'shareholder-dilution',
		'asset-valuation-risk',
		'counterparty-risk'
	],
	'Market Risk': [
		'mkt-demand-decline',
		'mkt-pricing-pressure',
		'mkt-concentration-customer',
		'mkt-economic-downturn',
		'equity-market-volatility'
	],
	'Supply Chain Risk': [
		'mkt-concentration-supplier',
		'sc-disruption',
		'sc-cost-inflation',
		'sc-logistics'
	],
	'Strategic Risk': [
		'str-acquisition-integration',
		'str-international-expansion',
		'str-brand-reputation',
		'product-concentration',
		'divestiture-risk',
		'corporate-restructuring'
	],
	'Competitive Landscape': [
		'comp-new-entrants',
		'comp-technology-disruption',
		'comp-market-share-loss'
	],
	'Cybersecurity Risk': ['cyber-breach', 'cyber-privacy'],
	'Technological Risk': [
		'cyber-system-failure',
		'comp-ai-disruption',
		'platform-dependency',
		'digital-asset-volatility'
	],
	'Regulatory & Legal Risk': [
		'reg-compliance-burden',
		'reg-policy-change',
		'reg-litigation',
		'reg-environmental',
		'reg-tax',
		'ip-protection'
	],
	'Geopolitical Risk': ['geo-trade-policy', 'geo-political-instability', 'geo-sanctions']
};

// Reverse lookup: theme_id -> category
const THEME_TO_CATEGORY: Record<string, string> = {};
for (const [category, themes] of Object.entries(THEME_CATEGORIES)) {
	for (const themeId of themes) {
		THEME_TO_CATEGORY[themeId] = category;
	}
}

export const load: PageServerLoad = async ({ url, locals: { safeGetSession, supabase } }) => {
	const { session, user } = await safeGetSession();

	if (!session || !user) {
		throw redirect(303, '/sign-in');
	}

	// Get selected companies from query params (comma-separated CIKs)
	const selectedCiks = url.searchParams.get('companies')?.split(',').filter(Boolean) || [];

	// Fetch user's watched companies for the selector
	const { data: watches } = await supabase
		.from('user_watches')
		.select('id, cik, companies(cik, name, ticker)')
		.eq('user_id', user.id)
		.order('created_at', { ascending: false });

	// Fetch all themes for reference
	const { data: themes } = await supabase.from('risk_themes').select('theme_id, theme_name');

	const themeMap: Record<string, string> = {};
	for (const t of themes || []) {
		themeMap[t.theme_id] = t.theme_name;
	}

	// If companies are selected, fetch their risks
	let companyRisks: Record<
		string,
		{
			company: { cik: string; name: string; ticker: string | null };
			risks: Record<
				string,
				{
					risk_id: string;
					risk_title: string;
					risk_summary: string;
					verbatim_quote: string | null;
					severity: string | null;
					theme_id: string;
				}[]
			>;
		}
	> = {};
	let activeThemes: Set<string> = new Set();

	if (selectedCiks.length > 0) {
		// Fetch companies info
		const { data: companies } = await supabase
			.from('companies')
			.select('cik, name, ticker')
			.in('cik', selectedCiks);

		// For each company, get their most recent 10-K filing's risks
		for (const company of companies || []) {
			// Get the most recent 10-K filing
			const { data: filings } = await supabase
				.from('filings')
				.select('accession_number')
				.eq('cik', company.cik)
				.eq('form_type', '10-K')
				.order('filing_date', { ascending: false })
				.limit(1);

			if (filings && filings.length > 0) {
				const { data: risks } = await supabase
					.from('risks')
					.select('risk_id, risk_title, risk_summary, verbatim_quote, severity, theme_id')
					.eq('accession_number', filings[0].accession_number);

				// Group risks by theme_id
				type RiskItem = {
					risk_id: string;
					risk_title: string;
					risk_summary: string;
					verbatim_quote: string | null;
					severity: string | null;
					theme_id: string;
				};
				const risksByTheme: Record<string, RiskItem[]> = {};
				for (const risk of risks || []) {
					if (risk.theme_id) {
						activeThemes.add(risk.theme_id);
						if (!risksByTheme[risk.theme_id]) {
							risksByTheme[risk.theme_id] = [];
						}
						risksByTheme[risk.theme_id].push(risk as RiskItem);
					}
				}

				companyRisks[company.cik] = {
					company: { cik: company.cik, name: company.name, ticker: company.ticker },
					risks: risksByTheme
				};
			} else {
				companyRisks[company.cik] = {
					company: { cik: company.cik, name: company.name, ticker: company.ticker },
					risks: {}
				};
			}
		}
	}

	// Build the matrix structure grouped by category
	const matrix: {
		category: string;
		themes: {
			theme_id: string;
			theme_name: string;
			hasDivergence: boolean;
		}[];
	}[] = [];

	// Only include categories that have at least one active theme
	for (const [category, themeIds] of Object.entries(THEME_CATEGORIES)) {
		const activeInCategory = themeIds.filter((id) => activeThemes.has(id));
		if (activeInCategory.length > 0) {
			matrix.push({
				category,
				themes: activeInCategory.map((themeId) => {
					// Check for severity divergence
					const severities = selectedCiks
						.map((cik) => {
							const risks = companyRisks[cik]?.risks[themeId];
							if (!risks || risks.length === 0) return null;
							// Take highest severity if multiple risks
							const hasSeverity = risks.some((r) => r.severity);
							if (!hasSeverity) return 'Unknown';
							const hasHigh = risks.some((r) => r.severity?.toLowerCase() === 'high');
							if (hasHigh) return 'High';
							const hasMedium = risks.some((r) => r.severity?.toLowerCase() === 'medium');
							if (hasMedium) return 'Medium';
							return 'Low';
						})
						.filter(Boolean);

					// Divergence if: one has High and another has Low, or one discloses and another doesn't
					const hasHigh = severities.includes('High');
					const hasLow = severities.includes('Low');
					const someDisclosed = severities.length > 0;
					const someNotDisclosed = severities.length < selectedCiks.length;
					const hasDivergence =
						(hasHigh && hasLow) || (someDisclosed && someNotDisclosed && selectedCiks.length > 1);

					return {
						theme_id: themeId,
						theme_name: themeMap[themeId] || themeId,
						hasDivergence
					};
				})
			});
		}
	}

	return {
		session,
		user,
		watches: watches || [],
		selectedCiks,
		companyRisks,
		matrix,
		themeMap
	};
};
