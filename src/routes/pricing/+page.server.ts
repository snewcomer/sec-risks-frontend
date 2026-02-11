import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { safeGetSession, supabase } }) => {
	const { session, user } = await safeGetSession();

	let profile = null;
	if (user) {
		const { data } = await supabase.from('profiles').select('plan').eq('id', user.id).maybeSingle();
		profile = data;
	}

	return {
		session,
		profile
	};
};
