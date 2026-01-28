import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals: { supabase, safeGetSession } }) => {
	const code = url.searchParams.get('code');
	const next = url.searchParams.get('next') ?? '/risks';

	if (code) {
		const { error } = await supabase.auth.exchangeCodeForSession(code);
		const { session } = await safeGetSession();

		return {
			session,
			redirectTo: error ? '/sign-in?error=auth_failed' : next
		};
	}

	return {
		session: null,
		redirectTo: '/sign-in?error=no_code'
	};
};
