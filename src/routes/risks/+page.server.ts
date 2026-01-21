import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals: { safeGetSession, supabase } }) => {
	const { session, user } = await safeGetSession();

	if (!session) {
		throw redirect(303, '/sign-in');
	}

	// Get user profile
	const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

	// Get user's watches with company details
	const { data: watches } = await supabase
		.from('user_watches')
		.select('*, companies(cik, name)')
		.eq('user_id', user.id)
		.order('created_at', { ascending: false });

	// Get all available companies for the dropdown
	const { data: companies } = await supabase
		.from('companies')
		.select('cik, name, ticker')
		.order('name', { ascending: true });

	return {
		session,
		user,
		profile,
		watches: watches || [],
		companies: companies || []
	};
};

export const actions: Actions = {
	addWatch: async ({ request, locals: { safeGetSession, supabase } }) => {
		const { user } = await safeGetSession();

		if (!user) {
			return fail(401, { error: 'Not authenticated' });
		}

		const formData = await request.formData();
		const cik = formData.get('cik') as string;

		if (!cik || cik.trim().length === 0) {
			return fail(400, { error: 'Company CIK is required' });
		}

		// Get user profile to check plan
		const { data: profile } = await supabase
			.from('profiles')
			.select('plan')
			.eq('id', user.id)
			.single();

		// Get current watch count
		const { count } = await supabase
			.from('user_watches')
			.select('*', { count: 'exact', head: true })
			.eq('user_id', user.id);

		// Free plan: max 1 company watch
		if (profile?.plan === 'free' && (count || 0) >= 1) {
			return fail(403, {
				error: 'Free plan is limited to 1 company watch. Upgrade to watch more companies.',
				needsUpgrade: true
			});
		}

		// Add watch
		const { error } = await supabase.from('user_watches').insert({
			user_id: user.id,
			cik: cik.trim()
		});

		if (error) {
			if (error.code === '23505') {
				// Unique constraint violation
				return fail(400, { error: 'You are already watching this company' });
			}
			console.error('Error adding watch:', error);
			return fail(500, { error: 'Failed to add company watch' });
		}

		return { success: true };
	},

	removeWatch: async ({ request, locals: { safeGetSession, supabase } }) => {
		const { user } = await safeGetSession();

		if (!user) {
			return fail(401, { error: 'Not authenticated' });
		}

		const formData = await request.formData();
		const watchId = formData.get('watchId') as string;

		if (!watchId) {
			return fail(400, { error: 'Watch ID is required' });
		}

		// Delete watch (ensure it belongs to user)
		const { error } = await supabase
			.from('user_watches')
			.delete()
			.eq('id', watchId)
			.eq('user_id', user.id);

		if (error) {
			console.error('Error removing watch:', error);
			return fail(500, { error: 'Failed to remove watch' });
		}

		return { success: true };
	}
};
