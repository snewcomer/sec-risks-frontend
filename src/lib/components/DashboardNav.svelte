<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { goto } from '$app/navigation';

	async function handleSignOut() {
		await supabase.auth.signOut();
		goto('/');
	}
</script>

<nav class="vane-nav">
	<div class="vane-nav-left">
		<a href="/" class="vane-nav-brand">
			<span class="vane-mono">Vane</span>
		</a>
	</div>
	<div class="vane-nav-right">
		<a href="/risks" class="vane-mono vane-nav-link">Dashboard</a>
		<a href="/settings" class="vane-mono vane-nav-link">Settings</a>
		<button onclick={handleSignOut} class="vane-mono vane-nav-link">Sign Out</button>
	</div>
</nav>

<style>
	.vane-nav-link {
		text-decoration: none;
		color: var(--vane-gray);
		text-transform: uppercase;
		letter-spacing: 0.1em;
		font-size: 12px;
		transition: color 0.15s ease;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
	}

	.vane-nav-link:hover {
		color: var(--vane-black);
	}
</style>
