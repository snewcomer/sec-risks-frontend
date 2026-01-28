<script lang="ts">
	import ErrorBanner from '$lib/components/ErrorBanner.svelte';

	let name = $state('');
	let email = $state('');
	let message = $state('');
	let website = $state(''); // Honeypot field
	let error = $state('');
	let success = $state(false);
	let loading = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		loading = true;
		error = '';
		success = false;

		// If honeypot is filled, silently "succeed" without sending
		if (website) {
			await new Promise((resolve) => setTimeout(resolve, 1000));
			success = true;
			name = '';
			email = '';
			message = '';
			website = '';
			loading = false;
			return;
		}

		try {
			const response = await fetch('/api/contact', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name, email, message, website })
			});

			if (!response.ok) {
				if (response.status === 429) {
					throw new Error('Too many requests. Please wait a few minutes and try again.');
				}
				const data = await response.json().catch(() => ({}));
				throw new Error(data.message || 'Failed to send message. Please try again.');
			}

			success = true;
			name = '';
			email = '';
			message = '';
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to send message. Please try again.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Contact - Vane</title>
	<meta name="description" content="Get in touch with the Vane team." />
</svelte:head>

<div class="vane-home vane-auth-page">
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

	<section class="vane-auth-section">
		<div class="vane-auth-container">
			<div class="vane-auth-header">
				<h1 class="vane-auth-headline">Contact us</h1>
				<p class="vane-mono vane-gray vane-auth-subhead">
					Questions, feedback, or missing a company? We'd love to hear from you.
				</p>
			</div>

			{#if success}
				<div class="vane-success-message">
					<p class="vane-mono">Message sent. We'll get back to you soon.</p>
					<button class="vane-auth-button vane-btn-secondary" onclick={() => (success = false)}>
						Send another message
					</button>
				</div>
			{:else}
				<form class="vane-auth-form" onsubmit={handleSubmit}>
					{#if error}
						<ErrorBanner message={error} onClose={() => (error = '')} />
					{/if}

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
						<label for="message" class="vane-form-label vane-mono">Message</label>
						<textarea
							id="message"
							name="message"
							bind:value={message}
							class="vane-form-input vane-form-textarea"
							placeholder="How can we help?"
							required
							rows="5"
						></textarea>
					</div>

					<!-- Honeypot field - hidden from users, visible to bots -->
					<div class="vane-form-group vane-honeypot" aria-hidden="true">
						<label for="website" class="vane-form-label vane-mono">Website</label>
						<input
							type="text"
							id="website"
							name="website"
							bind:value={website}
							class="vane-form-input"
							tabindex="-1"
							autocomplete="off"
						/>
					</div>

					<button type="submit" class="vane-auth-button" disabled={loading}>
						{loading ? 'Sending...' : 'Send message'}
					</button>
				</form>
			{/if}
		</div>
	</section>
</div>

<style>
	.vane-form-textarea {
		resize: vertical;
		min-height: 120px;
		font-family: var(--vane-mono);
	}

	.vane-honeypot {
		position: absolute;
		left: -9999px;
		opacity: 0;
		height: 0;
		overflow: hidden;
	}

	.vane-success-message {
		text-align: center;
		padding: 2rem;
		border: 1px solid #22c55e;
		background: #f0fdf4;
		border-radius: 8px;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		align-items: center;
	}

	.vane-success-message p {
		margin: 0;
		color: #166534;
	}

	.vane-btn-secondary {
		background: white;
		color: var(--vane-black);
		border: 1px solid #ddd;
	}

	.vane-btn-secondary:hover {
		border-color: var(--vane-black);
	}
</style>
