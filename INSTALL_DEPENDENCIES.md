# Install Required Dependencies

Run these commands to install all necessary packages:

```bash
# Core dependencies
pnpm add @supabase/supabase-js @supabase/ssr
pnpm add stripe @stripe/stripe-js

# Development dependencies
pnpm add -D @sveltejs/adapter-cloudflare
```

## Update svelte.config.js

Make sure your `svelte.config.js` uses the Cloudflare adapter:

```javascript
import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter()
	}
};

export default config;
```

## Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Then fill in all the values following the SETUP.md guide.

## Next Steps

1. Follow SETUP.md for Supabase and Stripe configuration
2. Run `pnpm run dev` to start development server
3. Test authentication flow
4. Test payment flow with Stripe test cards
