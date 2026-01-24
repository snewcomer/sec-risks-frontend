<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { PUBLIC_APP_URL } from '$env/static/public';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	// Check for error in URL params
	const urlError = $derived($page.url.searchParams.get('error'));
	if (urlError) {
		if (urlError === 'auth_failed') {
			error = 'Authentication failed. Please try again.';
		} else if (urlError === 'no_code') {
			error = 'No authorization code received.';
		}
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		loading = true;
		error = '';

		try {
			const { data, error: signInError } = await supabase.auth.signInWithPassword({
				email,
				password
			});

			if (signInError) throw signInError;

			if (data.session) {
				// Session is automatically stored in cookies by @supabase/ssr
				// Redirect to dashboard
				goto('/risks');
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Something went wrong';
		} finally {
			loading = false;
		}
	}

	async function handleGoogleLogin() {
		loading = true;
		error = '';

		try {
			const { error: signInError } = await supabase.auth.signInWithOAuth({
				provider: 'google',
				options: {
					redirectTo: `${PUBLIC_APP_URL}/auth/callback`,
					queryParams: {
						access_type: 'offline',
						prompt: 'consent'
					}
				}
			});

			if (signInError) {
				throw signInError;
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Something went wrong';
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Sign In - Vane</title>
	<meta
		name="description"
		content="Sign in to your Vane account to access SEC risk intelligence alerts."
	/>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="vane-home vane-auth-page">
	<!-- Navigation -->
	<nav class="vane-nav">
		<div class="vane-nav-left">
			<a href="/" class="vane-nav-brand">
				<span class="vane-mono">Vane</span>
				<span class="vane-mono vane-gray">SEC Risk Intelligence</span>
			</a>
		</div>
		<div class="vane-nav-right">
			<a href="/" class="vane-mono vane-gray vane-nav-link">← Home</a>
		</div>
	</nav>

	<!-- Sign In Form -->
	<section class="vane-auth-section">
		<div class="vane-auth-container">
			<div class="vane-auth-header">
				<h1 class="vane-auth-headline">Welcome back</h1>
				<p class="vane-mono vane-gray vane-auth-subhead">
					Sign in to access your risk intelligence dashboard.
				</p>
			</div>

			<form class="vane-auth-form" onsubmit={handleSubmit}>
				{#if error}
					<div class="vane-auth-error">
						<span class="vane-mono">{error}</span>
					</div>
				{/if}

				<div class="vane-form-group">
					<label for="email" class="vane-form-label vane-mono">Email</label>
					<input
						type="email"
						id="email"
						name="email"
						bind:value={email}
						class="vane-form-input"
						placeholder="you@company.com"
						required
						autocomplete="email"
					/>
				</div>

				<div class="vane-form-group">
					<label for="password" class="vane-form-label vane-mono">Password</label>
					<input
						type="password"
						id="password"
						name="password"
						bind:value={password}
						class="vane-form-input"
						placeholder="Enter your password"
						required
						autocomplete="current-password"
					/>
				</div>

				<div class="vane-form-actions">
					<a href="/forgot-password" class="vane-form-link vane-mono">Forgot password?</a>
				</div>

				<button type="submit" class="vane-auth-button" disabled={loading}>
					{loading ? 'Signing in...' : 'Sign In'}
				</button>

				<div class="vane-auth-divider">
					<span class="vane-mono vane-gray">or</span>
				</div>

				<button
					type="button"
					class="vane-social-button"
					onclick={handleGoogleLogin}
					disabled={loading}
				>
					<span>Continue with Google</span>
				</button>

				<div class="vane-auth-footer">
					<span class="vane-mono vane-gray">Don't have an account?</span>
					<a href="/sign-up" class="vane-form-link vane-mono">Sign up</a>
				</div>
			</form>
		</div>
	</section>
</div>

<style>
	.vane-auth-divider {
		text-align: center;
		padding: 1rem 0;
		position: relative;
	}

	.vane-auth-divider::before,
	.vane-auth-divider::after {
		content: '';
		position: absolute;
		top: 50%;
		width: 40%;
		height: 1px;
		background: #e5e5e5;
	}

	.vane-auth-divider::before {
		left: 0;
	}

	.vane-auth-divider::after {
		right: 0;
	}

	.vane-social-button {
		font-family: var(--vane-mono);
		text-transform: uppercase;
		letter-spacing: 0.1em;
		font-size: 13px;
		padding: 1.25rem;
		background: white;
		color: var(--vane-black);
		border: 1px solid #ddd;
		cursor: pointer;
		transition: all 0.15s ease;
		width: 100%;
		border-radius: 6px;
	}

	.vane-social-button:hover:not(:disabled) {
		border-color: var(--vane-black);
	}

	.vane-social-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
