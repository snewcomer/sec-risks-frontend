import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createCheckoutSession, stripe } from '$lib/server/stripe';
import { PUBLIC_APP_URL } from '$env/static/public';
import { STRIPE_PROFESSIONAL_PRICE_ID } from '$env/static/private';

export const POST: RequestHandler = async ({ request, locals: { safeGetSession, supabase } }) => {
	try {
		const { plan } = await request.json();

		// Use the environment variable for the actual Stripe price ID
		const actualPriceId = STRIPE_PROFESSIONAL_PRICE_ID;

		if (!actualPriceId) {
			console.error(
				'Stripe price ID not configured. Please set STRIPE_PROFESSIONAL_PRICE_ID in .env'
			);
			throw error(500, 'Stripe not configured. Please contact support.');
		}

		// Get authenticated user
		const { user } = await safeGetSession();

		if (!user) {
			throw error(401, 'Not authenticated');
		}

		// Get or create profile
		const { data: profile } = await supabase
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
			await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id);
		}

		// Create checkout session
		const session = await createCheckoutSession({
			priceId: actualPriceId,
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
