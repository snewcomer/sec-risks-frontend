<script lang="ts">
	interface Props {
		message: string;
		onClose?: () => void;
	}

	let { message, onClose }: Props = $props();
</script>

<div class="error-banner">
	<div class="error-content">
		<svg
			class="error-icon"
			width="20"
			height="20"
			viewBox="0 0 20 20"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="2" />
			<path d="M10 6V10" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
			<circle cx="10" cy="14" r="1" fill="currentColor" />
		</svg>
		<p class="error-message">{message}</p>
	</div>
	{#if onClose}
		<button class="error-close" onclick={onClose} aria-label="Close">×</button>
	{/if}
</div>

<style>
	.error-banner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 1rem 1.25rem;
		background: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 8px;
		margin-bottom: 1.5rem;
	}

	.error-content {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex: 1;
	}

	.error-icon {
		color: #dc2626;
		flex-shrink: 0;
	}

	.error-message {
		font-family: var(--vane-mono);
		font-size: 13px;
		color: #991b1b;
		margin: 0;
		line-height: 1.5;
	}

	.error-close {
		background: none;
		border: none;
		color: #991b1b;
		font-size: 1.5rem;
		line-height: 1;
		cursor: pointer;
		padding: 0;
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 4px;
		transition: background-color 0.15s ease;
		flex-shrink: 0;
	}

	.error-close:hover {
		background: rgba(220, 38, 38, 0.1);
	}
</style>
