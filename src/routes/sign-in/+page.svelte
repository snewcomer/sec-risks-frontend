<script lang="ts">
	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		loading = true;
		error = '';

		try {
			// TODO: Implement actual authentication
			const response = await fetch('/api/auth/sign-in', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password })
			});

			if (!response.ok) {
				throw new Error('Invalid credentials');
			}

			// Redirect on success
			window.location.href = '/risks';
		} catch (err) {
			error = err instanceof Error ? err.message : 'Something went wrong';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Sign In - Vane</title>
	<meta name="description" content="Sign in to your Vane account to access SEC risk intelligence alerts." />
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
			<a href="/" class="vane-mono vane-gray vane-nav-link">← Back to Home</a>
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

				<div class="vane-auth-footer">
					<span class="vane-mono vane-gray">Don't have an account?</span>
					<a href="/sign-up" class="vane-form-link vane-mono">Sign up</a>
				</div>
			</form>
		</div>
	</section>
</div>
