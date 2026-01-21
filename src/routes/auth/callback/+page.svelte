<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let { data } = $props();

	onMount(() => {
		goto(data.redirectTo, { replaceState: true });
	});
</script>

<svelte:head>
	<title>Authenticating...</title>
</svelte:head>

<p>Redirecting...</p>
