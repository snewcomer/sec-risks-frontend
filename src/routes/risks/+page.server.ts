import type { PageServerLoad } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user;

	if (!user) {
		return {
			profile: null,
			watchlists: []
		};
	}

	// Get user profile
	const { data: profile } = await supabaseAdmin
		.from('profiles')
		.select('*')
		.eq('id', user.id)
		.single();

	// Get user's watchlists
	const { data: watchlists } = await supabaseAdmin
		.from('watchlists')
		.select('*')
		.eq('user_id', user.id)
		.order('created_at', { ascending: false });

	return {
		profile,
		watchlists: watchlists || []
	};
};
