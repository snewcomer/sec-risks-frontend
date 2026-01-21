import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { safeGetSession, supabase } }) => {
	const { session, user } = await safeGetSession();

	if (!session) {
		throw redirect(303, '/sign-in');
	}

	// Get user profile
	const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

	// Get user's watchlists
	const { data: watchlists } = await supabase
		.from('watchlists')
		.select('*')
		.eq('user_id', user.id)
		.order('created_at', { ascending: false });

	return {
		session,
		user,
		profile,
		watchlists: watchlists || []
	};
};
