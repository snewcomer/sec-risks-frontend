import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals: { safeGetSession, supabase } }) => {
	const { session, user } = await safeGetSession();

	if (!session || !user) {
		throw redirect(303, '/sign-in');
	}

	const watchId = params.id;

	// 1. Verify the watch belongs to the user and get the CIK
	const { data: watch, error: watchError } = await supabase
		.from('user_watches')
		.select('*, companies(*)')
		.eq('id', watchId)
		.eq('user_id', user.id)
		.single();

	if (watchError || !watch) {
		throw error(404, 'Watch not found or access denied');
	}

	// 2. Fetch filings for this company with their risks
	const { data: filings, error: filingsError } = await supabase
		.from('filings')
		.select(
			`
			accession_number,
			filing_date,
			form_type,
			fiscal_period,
			sec_url,
			risks (
				risk_id,
				risk_title,
				risk_summary,
				category,
				severity,
				position
			)
		`
		)
		.eq('cik', watch.cik)
		.order('filing_date', { ascending: false })
		.limit(5);

	if (filingsError) {
		console.error('Error fetching filings:', filingsError);
		throw error(500, 'Failed to load risk data');
	}

	// 3. Client-side sorting of risks (by position)
	const processedFilings = filings?.map((filing) => ({
		...filing,
		risks: filing.risks.sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
	}));

	return {
		session,
		user,
		company: watch.companies,
		filings: processedFilings || []
	};
};
