import Stripe from 'stripe';
import { STRIPE_SECRET_KEY } from '$env/static/private';

export const stripe = new Stripe(STRIPE_SECRET_KEY, {
	apiVersion: '2024-12-18.acacia'
});

export async function createCheckoutSession(params: {
	priceId: string;
	customerId?: string;
	customerEmail?: string;
	successUrl: string;
	cancelUrl: string;
	metadata?: Record<string, string>;
}): Promise<Stripe.Checkout.Session> {
	const session = await stripe.checkout.sessions.create({
		mode: 'subscription',
		payment_method_types: ['card'],
		line_items: [
			{
				price: params.priceId,
				quantity: 1
			}
		],
		customer: params.customerId,
		customer_email: params.customerEmail,
		success_url: params.successUrl,
		cancel_url: params.cancelUrl,
		metadata: params.metadata,
		subscription_data: {
			metadata: params.metadata
		}
	});

	return session;
}

export async function createCustomerPortalSession(params: {
	customerId: string;
	returnUrl: string;
}): Promise<Stripe.BillingPortal.Session> {
	const session = await stripe.billingPortal.sessions.create({
		customer: params.customerId,
		return_url: params.returnUrl
	});

	return session;
}

export async function cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
	return await stripe.subscriptions.cancel(subscriptionId);
}

export function verifyWebhookSignature(
	payload: string | Buffer,
	signature: string,
	secret: string
): Stripe.Event {
	return stripe.webhooks.constructEvent(payload, signature, secret);
}
