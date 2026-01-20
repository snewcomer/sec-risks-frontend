import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createCheckoutSession, stripe } from '$lib/server/stripe';
import { supabaseAdmin } from '$lib/server/supabase';
import { PUBLIC_APP_URL } from '$env/static/public';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const { priceId, plan } = await request.json();

		if (!priceId) {
			throw error(400, 'Price ID is required');
		}

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

		// Get or create profile
		const { data: profile } = await supabaseAdmin
			.from('profiles')
			.select('*')
			.eq('id', user.id)
			.single();

		if (!profile) {
			throw error(404, 'Profile not found');
		}

		let customerId = profile.stripe_customer_id;

		// Create Stripe customer if doesn't exist
		if (!customerId) {
			const customer = await stripe.customers.create({
				email: user.email!,
				metadata: {
					supabase_user_id: user.id
				}
			});

			customerId = customer.id;

			// Update profile with stripe customer ID
			await supabaseAdmin
				.from('profiles')
				.update({ stripe_customer_id: customerId })
				.eq('id', user.id);
		}

		// Create checkout session
		const session = await createCheckoutSession({
			priceId,
			customerId,
			successUrl: `${PUBLIC_APP_URL}/risks?success=true`,
			cancelUrl: `${PUBLIC_APP_URL}/pricing?canceled=true`,
			metadata: {
				supabase_user_id: user.id,
				plan: plan || 'individual'
			}
		});

		return json({ url: session.url });
	} catch (err) {
		console.error('Checkout session error:', err);
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		throw error(500, 'Failed to create checkout session');
	}
};
