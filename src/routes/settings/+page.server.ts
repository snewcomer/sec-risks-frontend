import type { PageServerLoad, Actions } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';
import { stripe } from '$lib/server/stripe';
import { error, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals: { safeGetSession, supabase } }) => {
	const { session, user } = await safeGetSession();

	if (!session || !user) {
		throw redirect(303, '/sign-in');
	}

	// Get user profile
	const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

	// Get subscription info if user has Stripe customer ID
	let subscription = null;
	if (profile?.stripe_customer_id) {
		try {
			const subscriptions = await stripe.subscriptions.list({
				customer: profile.stripe_customer_id,
				limit: 1
			});

			if (subscriptions.data.length > 0) {
				subscription = subscriptions.data[0];
			}
		} catch (err) {
			console.error('Error fetching subscription:', err);
		}
	}

	return {
		session,
		user,
		profile,
		subscription
	};
};

export const actions: Actions = {
	deleteAccount: async ({ locals: { safeGetSession, supabase } }) => {
		const { user } = await safeGetSession();
		if (!user) throw error(401, 'Not authenticated');

		try {
			// 1. Get the Stripe Customer ID before we delete the profile
			const { data: profile } = await supabase
				.from('profiles')
				.select('stripe_customer_id')
				.eq('id', user.id)
				.single();

			// 2. Cleanup Stripe (Optional: stripe.customers.del(id) for full removal)
			if (profile?.stripe_customer_id) {
				const subscriptions = await stripe.subscriptions.list({
					customer: profile.stripe_customer_id
				});

				// Cancel all active subscriptions immediately
				for (const sub of subscriptions.data) {
					await stripe.subscriptions.cancel(sub.id);
				}
			}

			// 3. Delete from Supabase Auth (using Service Role Key)
			// This will trigger "ON DELETE CASCADE" for your profiles table
			const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

			if (deleteError) throw deleteError;
		} catch (err) {
			console.error('Delete account error:', err);
			throw error(500, 'Failed to complete account deletion');
		}

		// Redirect outside the try/catch to avoid catching the redirect 'error'
		throw redirect(303, '/');
	}
};
