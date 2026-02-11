import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

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
						cik
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

	return {
		session,
		user,
		theme: themeResult.data,
		risks,
		hasMore,
		currentLimit: limit,
		watchMap
	};
};
