import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getIndustryName } from '$lib/utils/sic-codes';

export const load: PageServerLoad = async ({
	params,
	url,
	locals: { safeGetSession, supabase }
}) => {
	const { session, user } = await safeGetSession();

	if (!session || !user) {
		throw redirect(303, '/sign-in');
	}

	const themeId = params.theme_id;
	const limit = parseInt(url.searchParams.get('limit') || '30');

	// Get theme info and risks in parallel
	const [themeResult, risksResult, watchesResult] = await Promise.all([
		supabase.from('risk_themes').select('theme_id, theme_name').eq('theme_id', themeId).single(),
		supabase
			.from('risks')
			.select(
				`
				risk_id,
				risk_title,
				risk_summary,
				category,
				severity,
				created_at,
				filings!inner (
					filing_date,
					cik,
					companies!inner (
						name,
						ticker,
						cik,
						sic_code
					)
				)
			`
			)
			.eq('theme_id', themeId)
			.order('created_at', { ascending: false })
			.limit(limit + 1), // Fetch one extra to check if there are more
		supabase.from('user_watches').select('id, cik').eq('user_id', user.id)
	]);

	if (themeResult.error) {
		console.error('Error fetching theme:', themeResult.error);
		throw error(404, 'Theme not found');
	}

	if (risksResult.error) {
		console.error('Error fetching risks:', risksResult.error);
		throw error(500, 'Failed to load risks');
	}

	// Build watchMap for linking to watched companies
	const watchMap: Record<string, string> = {};
	for (const w of watchesResult.data || []) {
		watchMap[String(w.cik)] = w.id;
	}

	// Check if there are more results
	const hasMore = risksResult.data.length > limit;
	const risks = hasMore ? risksResult.data.slice(0, limit) : risksResult.data;

	// Build distinct SIC description options from the risks
	const sicDescriptionSet = new Map<string, string>();
	for (const risk of risks) {
		const company = (risk.filings as any)?.companies;
		if (company?.sic_code) {
			const description = getIndustryName(company.sic_code);
			if (description) {
				sicDescriptionSet.set(description, description);
			}
		}
	}
	const sicOptions = Array.from(sicDescriptionSet.keys())
		.sort()
		.map((desc) => ({ value: desc, label: desc }));

	return {
		session,
		user,
		theme: themeResult.data,
		risks,
		hasMore,
		currentLimit: limit,
		watchMap,
		sicOptions
	};
};
