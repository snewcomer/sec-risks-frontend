import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals: { safeGetSession, supabase } }) => {
	const { session, user } = await safeGetSession();

	if (!session || !user) {
		throw redirect(303, '/sign-in');
	}

	const watchId = params.id;

	// 1. Verify the watch belongs to the user and get the CIK
	const { data: watch, error: watchError } = await supabase
		.from('user_watches')
		.select('*, companies(*)')
		.eq('id', watchId)
		.eq('user_id', user.id)
		.single();

	if (watchError || !watch) {
		throw error(404, 'Watch not found or access denied');
	}

	// 2. Fetch 10-K filings for this company with their risks
	const { data: filings, error: filingsError } = await supabase
		.from('filings')
		.select(
			`
			accession_number,
			filing_date,
			form_type,
			fiscal_period,
			sec_url,
			risks (
				risk_id,
				risk_title,
				risk_summary,
				category,
				severity,
				position
			)
		`
		)
		.eq('cik', watch.cik)
		.eq('form_type', '10-K')
		.order('filing_date', { ascending: false })
		.limit(5);

	if (filingsError) {
		console.error('Error fetching filings:', filingsError);
		throw error(500, 'Failed to load risk data');
	}

	// 3. Client-side sorting of risks (by position)
	const processedFilings = filings?.map((filing) => ({
		...filing,
		risks: filing.risks.sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
	}));

	// 4. Industry gap analysis for the most recent 10-K
	let gaps: { theme_name: string; industry_freq: number; theme_id: string }[] = [];
	let coveragePct = 0;
	let totalIndustryThemes = 0;
	let companyThemeCount = 0;

	const latestFiling = processedFilings?.[0];
	if (latestFiling?.accession_number) {
		const sicCode = (watch.companies as any)?.sic_code;

		// Run gap analysis and total theme count in parallel
		const [gapResult, benchmarkResult] = await Promise.all([
			supabase.rpc('get_dashboard_gaps', {
				target_accession: latestFiling.accession_number
			}),
			sicCode
				? supabase.from('industry_benchmarks').select('theme_id').eq('sic_code', sicCode)
				: Promise.resolve({ data: null, error: null })
		]);

		if (gapResult.data) {
			gaps = gapResult.data;
		}
		if (gapResult.error) {
			console.error('Error fetching gaps:', gapResult.error);
		}

		if (benchmarkResult.data) {
			totalIndustryThemes = benchmarkResult.data.length;
			companyThemeCount = totalIndustryThemes - gaps.length;
			coveragePct =
				totalIndustryThemes > 0 ? Math.round((companyThemeCount / totalIndustryThemes) * 100) : 0;
		}
	}

	return {
		session,
		user,
		company: watch.companies,
		filings: processedFilings || [],
		gaps,
		coveragePct,
		totalIndustryThemes,
		companyThemeCount,
		sicCode: String((watch.companies as any)?.sic_code ?? '')
	};
};
