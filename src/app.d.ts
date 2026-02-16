// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';

// Cloudflare Workers KV type
interface KVNamespace {
	get(key: string): Promise<string | null>;
	put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
	delete(key: string): Promise<void>;
}

// Subscription type for settings page
type Subscription = Stripe.Subscription;

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			supabase: SupabaseClient;
			safeGetSession(): Promise<{ session: Session | null; user: Session['user'] | null }>;
		}
		interface PageData {
			session: Session | null;
			user?: Session['user'] | null;
			subscription?: Subscription | null;
		}
		// interface PageState {}
		interface Platform {
			env: {
				RATE_LIMITS: KVNamespace;
			};
		}
	}
}

export {};
