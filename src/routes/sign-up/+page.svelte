<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { goto } from '$app/navigation';
	import { PUBLIC_APP_URL } from '$env/static/public';
	import ErrorBanner from '$lib/components/ErrorBanner.svelte';

	let email = $state('');
	let password = $state('');
	let name = $state('');
	let error = $state('');
	let loading = $state(false);
	let emailSent = $state(false);

	async function handleSignUp(e: Event) {
		e.preventDefault();
		loading = true;
		error = '';

		try {
			// Sign up with email/password
			const { data, error: signUpError } = await supabase.auth.signUp({
				email,
				password,
				options: {
					data: {
						name
					},
					emailRedirectTo: `${PUBLIC_APP_URL}/auth/callback`
				}
			});

			if (signUpError) throw signUpError;

			if (data.user && data.session) {
				// User signed in immediately (email confirmation disabled)
				goto('/risks');
			} else if (data.user && !data.session) {
				// Email confirmation required
				emailSent = true;
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create account. Please try again.';
		} finally {
			loading = false;
		}
	}

	async function handleSocialLogin(provider: 'google') {
		loading = true;
		error = '';

		try {
			const { error: signInError } = await supabase.auth.signInWithOAuth({
				provider,
				options: {
					redirectTo: `${PUBLIC_APP_URL}/auth/callback`
				}
			});

			if (signInError) throw signInError;
		} catch (err) {
			error =
				err instanceof Error ? err.message : 'Failed to sign in with Google. Please try again.';
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Sign Up - Vane</title>
	<meta
		name="description"
		content="Create your Vane account and start monitoring SEC risk factors."
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
			<a href="/" class="vane-mono vane-gray vane-nav-link">Home</a>
		</div>
	</nav>

	<!-- Sign Up Form -->
	<section class="vane-auth-section">
		<div class="vane-auth-container">
			<div class="vane-auth-header">
				<h1 class="vane-auth-headline">Get started</h1>
				<p class="vane-mono vane-gray vane-auth-subhead">
					Create your account to start monitoring SEC risk factors.
				</p>
			</div>

			{#if emailSent}
				<div class="vane-email-sent">
					<p class="vane-mono">Check your email to confirm your account.</p>
					<p class="vane-mono vane-gray">We sent a confirmation link to {email}</p>
				</div>
			{:else}
				<div class="vane-auth-form">
					{#if error}
						<ErrorBanner message={error} onClose={() => (error = '')} />
					{/if}

					<button
						type="button"
						class="vane-social-button"
						onclick={() => handleSocialLogin('google')}
						disabled={loading}
					>
						<span>Continue with Google</span>
					</button>

					<div class="vane-auth-divider">
						<span class="vane-mono vane-gray">or</span>
					</div>

					<form onsubmit={handleSignUp}>
						<div class="vane-form-group">
							<label for="name" class="vane-form-label vane-mono">Name</label>
							<input
								type="text"
								id="name"
								name="name"
								bind:value={name}
								class="vane-form-input"
								placeholder="Your name"
								required
								autocomplete="name"
							/>
						</div>

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
								placeholder="Create a password"
								required
								minlength="6"
								autocomplete="new-password"
							/>
						</div>

						<button type="submit" class="vane-auth-button" disabled={loading}>
							{loading ? 'Creating account...' : 'Create account'}
						</button>
					</form>

					<div class="vane-auth-footer">
						<span class="vane-mono vane-gray">Already have an account?</span>
						<a href="/sign-in" class="vane-form-link vane-mono">Sign in</a>
					</div>
				</div>
			{/if}
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

	.vane-email-sent {
		text-align: center;
		padding: 2rem;
		border: 1px solid #22c55e;
		background: #f0fdf4;
		border-radius: 8px;
	}

	.vane-email-sent p:first-child {
		color: #166534;
		margin: 0 0 0.5rem;
	}

	.vane-email-sent p:last-child {
		margin: 0;
		font-size: 12px;
	}
</style>
