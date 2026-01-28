import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals: { safeGetSession, supabase } }) => {
	const { session, user } = await safeGetSession();

	if (!session || !user) {
		throw redirect(303, '/sign-in');
	}

	// Parallelize data fetching for better performance
	const [profileResult, watchesResult, companiesResult] = await Promise.all([
		supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
		supabase
			.from('user_watches')
			.select('*, companies(cik, name, ticker)')
			.eq('user_id', user.id)
			.order('created_at', { ascending: false }),
		supabase
			.from('companies')
			.select('cik, name, ticker, filings!inner(cik)')
			.order('name', { ascending: true })
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

	return {
		session,
		user,
		profile: profileResult.data || null,
		watches: watchesResult.data || [],
		companies: companiesResult.data || []
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

		if (plan === 'free' && count >= 1) {
			return fail(403, {
				error:
					'Free plan is limited to 1 company watch. Upgrade to Professional to keep an eye on more companies.',
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
