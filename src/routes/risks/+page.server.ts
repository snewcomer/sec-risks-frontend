import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { getIndustryName } from '$lib/utils/sic-codes';

export const load: PageServerLoad = async ({ locals: { safeGetSession, supabase } }) => {
	const { session, user } = await safeGetSession();

	if (!session || !user) {
		throw redirect(303, '/sign-in');
	}

	// Calculate 30 days ago for HUD metrics
	const thirtyDaysAgo = new Date();
	thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
	const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

	// Parallelize data fetching for better performance
	const [
		profileResult,
		watchesResult,
		companiesResult,
		trendingResult,
		newRisksResult,
		highSeverityResult,
		sectorHeatResult
	] = await Promise.all([
		supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
		supabase
			.from('user_watches')
			.select('*, companies(cik, sic_code, name, ticker)')
			.eq('user_id', user.id)
			.order('created_at', { ascending: false }),
		supabase
			.from('companies')
			.select('cik, sic_code, name, ticker, filings!inner(cik)')
			.order('name', { ascending: true }),
		supabase
			.from('mv_trending_pills')
			.select('theme_id, theme_name, company_reach')
			.order('company_reach', { ascending: false })
			.limit(20),
		// HUD: New risks in last 30 days
		supabase
			.from('risks')
			.select('*', { count: 'exact', head: true })
			.gte('created_at', thirtyDaysAgoISO),
		// HUD: High severity risks count
		supabase.from('risks').select('*', { count: 'exact', head: true }).eq('severity', 'High'),
		// HUD: Sector heat - most frequent SIC in last 30 days
		supabase
			.from('risks')
			.select('filings!inner(companies!inner(sic_code))')
			.gte('created_at', thirtyDaysAgoISO)
			.limit(1000)
	]);

	// Fetch filings separately for each watch
	if (watchesResult.data && watchesResult.data.length > 0) {
		const watchesWithFilings = await Promise.all(
			watchesResult.data.map(async (watch) => {
				const { data: filings } = await supabase
					.from('filings')
					.select('filing_date')
					.eq('cik', watch.cik)
					.order('filing_date', { ascending: false })
					.limit(1);
				return { ...watch, filings: filings || [] };
			})
		);
		watchesResult.data = watchesWithFilings;
	}

	// Log actual DB errors for monitoring, but don't crash the UI
	if (profileResult.error) console.error('Load Error (Profile):', profileResult.error);
	if (watchesResult.error) console.error('Load Error (Watches):', watchesResult.error);
	if (companiesResult.error) console.error('Load Error (Companies):', companiesResult.error);
	if (trendingResult.error) console.error('Load Error (Trending):', trendingResult.error);
	if (newRisksResult.error) console.error('Load Error (New Risks):', newRisksResult.error);
	if (highSeverityResult.error)
		console.error('Load Error (High Severity):', highSeverityResult.error);
	if (sectorHeatResult.error) console.error('Load Error (Sector Heat):', sectorHeatResult.error);

	// Calculate sector heat - top 3 most frequent SIC codes in last 30 days
	let sectorHeat: { sic_code: string; count: number; industry: string }[] = [];
	if (sectorHeatResult.data && sectorHeatResult.data.length > 0) {
		const sicCounts: Record<string, number> = {};
		for (const risk of sectorHeatResult.data as any[]) {
			const sicCode = risk.filings?.companies?.sic_code;
			if (sicCode) {
				sicCounts[sicCode] = (sicCounts[sicCode] || 0) + 1;
			}
		}
		// Get top 3 SIC codes
		const topSics = Object.entries(sicCounts)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 3);

		sectorHeat = topSics.map(([sicCode, count]) => ({
			sic_code: sicCode,
			count,
			industry: getIndustryName(sicCode)
		}));
	}

	return {
		session,
		user,
		profile: profileResult.data || null,
		watches: watchesResult.data || [],
		companies: companiesResult.data || [],
		trendingThemes: trendingResult.data || [],
		hud: {
			newRisks: newRisksResult.count || 0,
			highSeverity: highSeverityResult.count || 0,
			sectorHeat
		}
	};
};

export const actions: Actions = {
	addWatch: async ({ request, locals: { safeGetSession, supabase } }) => {
		const { user } = await safeGetSession();
		if (!user) return fail(401, { error: 'Not authenticated' });

		const formData = await request.formData();
		const cik = formData.get('cik') as string;

		if (!cik || cik.trim().length === 0) {
			return fail(400, { error: 'Company CIK is required' });
		}

		// Parallelize checks for plan limits
		const [profileRes, countRes] = await Promise.all([
			supabase.from('profiles').select('plan').eq('id', user.id).single(),
			supabase
				.from('user_watches')
				.select('*', { count: 'exact', head: true })
				.eq('user_id', user.id)
		]);

		const plan = profileRes.data?.plan || 'free';
		const count = countRes.count || 0;

		if (plan === 'free' && count >= 3) {
			return fail(403, {
				error:
					'Free plan is limited to 3 company watches. Upgrade to Professional to keep an eye on more companies.',
				needsUpgrade: true
			});
		}

		const { error } = await supabase.from('user_watches').insert({
			user_id: user.id,
			cik: cik.trim()
		});

		if (error) {
			if (error.code === '23505') {
				return fail(400, { error: 'You are already watching this company' });
			}
			console.error('Action Error (addWatch):', error);
			return fail(500, { error: 'Failed to Track Company' });
		}

		return { success: true };
	},

	removeWatch: async ({ request, locals: { safeGetSession, supabase } }) => {
		const { user } = await safeGetSession();
		if (!user) return fail(401, { error: 'Not authenticated' });

		const formData = await request.formData();
		const watchId = formData.get('watchId') as string;

		if (!watchId) return fail(400, { error: 'Watch ID is required' });

		const { error } = await supabase
			.from('user_watches')
			.delete()
			.eq('id', watchId)
			.eq('user_id', user.id);

		if (error) {
			console.error('Action Error (removeWatch):', error);
			return fail(500, { error: 'Failed to remove watch' });
		}

		return { success: true };
	}
};
