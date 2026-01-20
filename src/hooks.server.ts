import { supabaseAdmin } from '$lib/server/supabase';
import { redirect, type Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	// Get session token from cookie
	const sessionToken = event.cookies.get('sb-access-token');

	if (sessionToken) {
		// Verify and set user in locals
		const {
			data: { user },
			error
		} = await supabaseAdmin.auth.getUser(sessionToken);

		if (!error && user) {
			event.locals.user = user;
		}
	}

	// Protect routes
	const protectedRoutes = ['/risks', '/settings'];
	const isProtectedRoute = protectedRoutes.some((route) => event.url.pathname.startsWith(route));

	if (isProtectedRoute && !event.locals.user) {
		throw redirect(303, `/sign-in?redirectTo=${encodeURIComponent(event.url.pathname)}`);
	}

	return resolve(event);
};
