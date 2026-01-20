import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const code = url.searchParams.get('code');
	const plan = url.searchParams.get('plan');

	if (code) {
		// Exchange code for session
		// This will be handled by Supabase client automatically
		const redirectTo = plan ? `/sign-up?plan=${plan}&code=${code}` : '/risks';
		throw redirect(303, redirectTo);
	}

	throw redirect(303, '/sign-in');
};
