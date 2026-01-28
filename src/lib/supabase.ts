import { createBrowserClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

export const supabase = createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

export type Profile = {
	id: string;
	email: string;
	name: string | null;
	stripe_customer_id: string | null;
	plan: 'free' | 'professional' | 'enterprise';
	created_at: string;
	updated_at: string;
};

export type UserWatch = {
	id: string;
	user_id: string;
	cik: string;
	created_at: string;
};

export type Company = {
	cik: string;
	name: string;
	// Add other company fields as needed
};
