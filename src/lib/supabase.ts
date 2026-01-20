import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

export const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

export type Profile = {
	id: string;
	email: string;
	name: string | null;
	stripe_customer_id: string | null;
	plan: 'free' | 'individual' | 'enterprise';
	created_at: string;
	updated_at: string;
};

export type Watchlist = {
	id: string;
	user_id: string;
	name: string;
	companies: string[];
	created_at: string;
	updated_at: string;
};
