<script lang="ts">
	let { percent, disclosed, total }: { percent: number; disclosed: number; total: number } =
		$props();
</script>

<div class="vane-coverage">
	<div class="vane-coverage-header">
		<h2 class="vane-coverage-title">Risk Coverage</h2>
		<span class="vane-coverage-stat">
			{percent}%
			<span class="vane-coverage-detail">({disclosed} of {total} industry themes)</span>
		</span>
	</div>
	<div class="vane-coverage-track">
		<div class="vane-coverage-fill" style="width: {percent}%"></div>
	</div>
</div>

<style>
	.vane-coverage {
		background: white;
		border: 1px solid #e3e8ef;
		border-radius: 12px;
		padding: 1.5rem 2rem;
	}

	.vane-coverage-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		margin-bottom: 1rem;
	}

	.vane-coverage-title {
		font-family: var(--vane-display);
		font-size: 1.25rem;
		font-weight: 500;
		margin: 0;
		color: #1a1f36;
	}

	.vane-coverage-stat {
		font-family: var(--vane-mono);
		font-size: 1.125rem;
		font-weight: 600;
		color: #1a1f36;
	}

	.vane-coverage-detail {
		font-weight: 400;
		font-size: 0.8125rem;
		color: var(--vane-gray);
	}

	.vane-coverage-track {
		height: 10px;
		background: #eef2f6;
		border-radius: 6px;
		overflow: hidden;
	}

	.vane-coverage-fill {
		height: 100%;
		background: #ff7f0e;
		border-radius: 6px;
		transition: width 0.6s ease;
		min-width: 0;
	}
</style>
