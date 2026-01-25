import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { stripe } from '$lib/server/stripe';
import { STRIPE_WEBHOOK_SECRET } from '$env/static/private';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

// Use service role client for webhook operations (bypasses RLS)
const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.text();
	const signature = request.headers.get('stripe-signature');

	if (!signature) {
		throw error(400, 'Missing Stripe signature');
	}

	let event;

	try {
		event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
	} catch (err) {
		console.error('Webhook signature verification failed:', err);
		throw error(400, 'Invalid signature');
	}

	try {
		switch (event.type) {
			case 'checkout.session.completed': {
				const session = event.data.object;
				const userId = session.metadata?.supabase_user_id;
				const plan = session.metadata?.plan || 'professional';

				if (!userId) {
					console.error('No user ID in checkout session metadata');
					break;
				}

				// Update user's plan and store customer ID
				const { error: updateError } = await supabaseAdmin
					.from('profiles')
					.update({
						plan: plan,
						stripe_customer_id: session.customer as string,
						stripe_subscription_id: session.subscription as string
					})
					.eq('id', userId);

				if (updateError) {
					console.error('Error updating user plan:', updateError);
				} else {
					console.log(`User ${userId} upgraded to ${plan} plan`);
				}

				break;
			}

			case 'customer.subscription.updated': {
				const subscription = event.data.object;
				const customerId = subscription.customer as string;

				// Get user by customer ID
				const { data: profile } = await supabaseAdmin
					.from('profiles')
					.select('id, plan')
					.eq('stripe_customer_id', customerId)
					.single();

				if (!profile) {
					console.error('No user found for customer:', customerId);
					break;
				}

				// Check subscription status
				let newPlan = profile.plan;
				if (subscription.status === 'active') {
					// Subscription is active, ensure they have the paid plan
					newPlan = 'professional';
				} else if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
					// Subscription canceled or payment failed, downgrade to free
					newPlan = 'free';
				}

				// Update plan if changed
				if (newPlan !== profile.plan) {
					const { error: updateError } = await supabaseAdmin
						.from('profiles')
						.update({ plan: newPlan })
						.eq('id', profile.id);

					if (updateError) {
						console.error('Error updating user plan:', updateError);
					} else {
						console.log(`User ${profile.id} plan updated to ${newPlan}`);
					}
				}

				break;
			}

			case 'customer.subscription.deleted': {
				const subscription = event.data.object;
				const customerId = subscription.customer as string;

				// Get user by customer ID
				const { data: profile } = await supabaseAdmin
					.from('profiles')
					.select('id')
					.eq('stripe_customer_id', customerId)
					.single();

				if (!profile) {
					console.error('No user found for customer:', customerId);
					break;
				}

				// Downgrade to free plan
				const { error: updateError } = await supabaseAdmin
					.from('profiles')
					.update({
						plan: 'free',
						stripe_subscription_id: null
					})
					.eq('id', profile.id);

				if (updateError) {
					console.error('Error downgrading user:', updateError);
				} else {
					console.log(`User ${profile.id} downgraded to free plan`);
				}

				break;
			}

			case 'invoice.payment_succeeded': {
				const invoice = event.data.object;
				console.log('Payment succeeded for invoice:', invoice.id);
				// Optional: Update last payment date, send receipt, etc.
				break;
			}

			case 'invoice.payment_failed': {
				const invoice = event.data.object;
				const customerId = invoice.customer as string;

				console.error('Payment failed for customer:', customerId);

				// Optional: Send email notification to user about failed payment
				// You could also implement a grace period before downgrading

				break;
			}

			default:
				console.log('Unhandled event type:', event.type);
		}

		return json({ received: true });
	} catch (err) {
		console.error('Error processing webhook:', err);
		throw error(500, 'Webhook processing failed');
	}
};
