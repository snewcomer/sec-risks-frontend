// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { Session, SupabaseClient } from '@supabase/supabase-js';

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
		}
		// interface PageState {}
		interface Platform {
			env: {
				RATE_LIMIT_KV: KVNamespace;
			};
		}
	}
}

export {};
