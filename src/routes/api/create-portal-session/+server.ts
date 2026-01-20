import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createCustomerPortalSession } from '$lib/server/stripe';
import { supabaseAdmin } from '$lib/server/supabase';
import { PUBLIC_APP_URL } from '$env/static/public';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		// Get session token from cookie
		const sessionToken = cookies.get('sb-access-token');
		if (!sessionToken) {
			throw error(401, 'Not authenticated');
		}

		// Get user from Supabase
		const {
			data: { user },
			error: authError
		} = await supabaseAdmin.auth.getUser(sessionToken);

		if (authError || !user) {
			throw error(401, 'Invalid session');
		}

		// Get profile with stripe customer ID
		const { data: profile } = await supabaseAdmin
			.from('profiles')
			.select('stripe_customer_id')
			.eq('id', user.id)
			.single();

		if (!profile?.stripe_customer_id) {
			throw error(400, 'No active subscription');
		}

		// Create portal session
		const session = await createCustomerPortalSession({
			customerId: profile.stripe_customer_id,
			returnUrl: `${PUBLIC_APP_URL}/settings`
		});

		return json({ url: session.url });
	} catch (err) {
		console.error('Portal session error:', err);
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		throw error(500, 'Failed to create portal session');
	}
};
