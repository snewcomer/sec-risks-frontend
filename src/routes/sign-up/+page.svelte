<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { PUBLIC_APP_URL } from '$env/static/public';
	import ErrorBanner from '$lib/components/ErrorBanner.svelte';

	let email = $state('');
	let password = $state('');
	let name = $state('');
	let error = $state('');
	let loading = $state(false);
	let mode = $state<'signup' | 'social'>('signup');

	// Get plan from URL params
	const selectedPlan = $derived($page.url.searchParams.get('plan') || 'professional');

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

			if (data.user) {
				// Redirect to checkout
				await initiateCheckout();
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
					redirectTo: `${PUBLIC_APP_URL}/auth/callback?plan=${selectedPlan}`
				}
			});

			if (signInError) throw signInError;
		} catch (err) {
			error =
				err instanceof Error ? err.message : 'Failed to sign in with Google. Please try again.';
			loading = false;
		}
	}

	async function initiateCheckout() {
		try {
			const priceId =
				selectedPlan === 'professional'
					? import.meta.env.PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID
					: null;

			if (!priceId) {
				// For enterprise, go to contact page
				goto('/contact');
				return;
			}

			// Create checkout session
			const response = await fetch('/api/create-checkout-session', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ priceId, plan: selectedPlan })
			});

			if (!response.ok) {
				throw new Error('Failed to create checkout session');
			}

			const { url } = await response.json();
			if (url) {
				window.location.href = url;
			} else {
				throw new Error('No checkout URL received');
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to start checkout. Please try again.';
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
					Create your account for the {selectedPlan} plan.
				</p>
			</div>

			{#if mode === 'signup'}
				<form class="vane-auth-form" onsubmit={handleSignUp}>
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
						{loading ? 'Creating account...' : 'Continue to payment'}
					</button>

					<div class="vane-auth-footer">
						<span class="vane-mono vane-gray">Already have an account?</span>
						<a href="/sign-in" class="vane-form-link vane-mono">Sign in</a>
					</div>
				</form>
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
</style>
