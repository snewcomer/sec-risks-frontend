import { error, text } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyWebhookSignature } from '$lib/server/stripe';
import { supabaseAdmin } from '$lib/server/supabase';
import { STRIPE_WEBHOOK_SECRET } from '$env/static/private';
import type Stripe from 'stripe';

export const POST: RequestHandler = async ({ request }) => {
	const signature = request.headers.get('stripe-signature');

	if (!signature) {
		throw error(400, 'Missing stripe-signature header');
	}

	try {
		// Get raw body
		const body = await request.text();

		// Verify webhook signature
		const event = verifyWebhookSignature(body, signature, STRIPE_WEBHOOK_SECRET);

		console.log('Stripe webhook event:', event.type);

		// Handle different event types
		switch (event.type) {
			case 'checkout.session.completed': {
				const session = event.data.object as Stripe.Checkout.Session;
				await handleCheckoutComplete(session);
				break;
			}

			case 'customer.subscription.updated': {
				const subscription = event.data.object as Stripe.Subscription;
				await handleSubscriptionUpdate(subscription);
				break;
			}

			case 'customer.subscription.deleted': {
				const subscription = event.data.object as Stripe.Subscription;
				await handleSubscriptionDeleted(subscription);
				break;
			}

			default:
				console.log(`Unhandled event type: ${event.type}`);
		}

		return text('Webhook received', { status: 200 });
	} catch (err: any) {
		console.error('Webhook error:', err.message);
		throw error(400, err.message);
	}
};

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
	const userId = session.metadata?.supabase_user_id;
	const plan = session.metadata?.plan || 'individual';

	if (!userId) {
		console.error('No supabase_user_id in session metadata');
		return;
	}

	// Update user's plan in Supabase
	const { error: updateError } = await supabaseAdmin
		.from('profiles')
		.update({
			plan,
			stripe_customer_id: session.customer as string,
			updated_at: new Date().toISOString()
		})
		.eq('id', userId);

	if (updateError) {
		console.error('Error updating profile:', updateError);
	} else {
		console.log(`Updated user ${userId} to plan: ${plan}`);
	}
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
	const customerId = subscription.customer as string;

	// Get profile by stripe customer ID
	const { data: profile } = await supabaseAdmin
		.from('profiles')
		.select('id')
		.eq('stripe_customer_id', customerId)
		.single();

	if (!profile) {
		console.error('No profile found for customer:', customerId);
		return;
	}

	// Determine plan based on subscription status
	let plan = 'free';
	if (subscription.status === 'active' || subscription.status === 'trialing') {
		// You could check subscription.items.data[0].price.id to determine plan
		plan = 'individual';
	}

	// Update profile
	const { error: updateError } = await supabaseAdmin
		.from('profiles')
		.update({
			plan,
			updated_at: new Date().toISOString()
		})
		.eq('id', profile.id);

	if (updateError) {
		console.error('Error updating profile:', updateError);
	} else {
		console.log(`Updated subscription for user ${profile.id} to: ${plan}`);
	}
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
	const customerId = subscription.customer as string;

	// Get profile by stripe customer ID
	const { data: profile } = await supabaseAdmin
		.from('profiles')
		.select('id')
		.eq('stripe_customer_id', customerId)
		.single();

	if (!profile) {
		console.error('No profile found for customer:', customerId);
		return;
	}

	// Downgrade to free plan
	const { error: updateError } = await supabaseAdmin
		.from('profiles')
		.update({
			plan: 'free',
			updated_at: new Date().toISOString()
		})
		.eq('id', profile.id);

	if (updateError) {
		console.error('Error updating profile:', updateError);
	} else {
		console.log(`Downgraded user ${profile.id} to free plan`);
	}
}
