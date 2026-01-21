import type { PageServerLoad, Actions } from './$types';
import { stripe } from '$lib/server/stripe';
import { error, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals: { safeGetSession, supabase } }) => {
	const { session, user } = await safeGetSession();

	if (!session) {
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

		if (!user) {
			throw error(401, 'Not authenticated');
		}

		try {
			// Delete user's profile and auth account
			const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);

			if (deleteError) {
				throw deleteError;
			}

			// Redirect to homepage
			throw redirect(303, '/');
		} catch (err) {
			console.error('Delete account error:', err);
			throw error(500, 'Failed to delete account');
		}
	}
};
