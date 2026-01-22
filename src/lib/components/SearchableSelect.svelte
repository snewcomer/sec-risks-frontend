<script lang="ts">
	type Option = {
		value: string;
		label: string;
	};

	let {
		options = [],
		value = $bindable(''),
		placeholder = 'Select an option...',
		name = '',
		required = false
	}: {
		options: Option[];
		value?: string;
		placeholder?: string;
		name?: string;
		required?: boolean;
	} = $props();

	let isOpen = $state(false);
	let searchQuery = $state('');
	let highlightedIndex = $state(-1);

	// FIX: DOM references should be $state in Svelte 5 to handle binding updates correctly
	let inputRef = $state<HTMLInputElement>();
	let dropdownRef = $state<HTMLDivElement>();

	const filteredOptions = $derived(
		searchQuery.trim() === ''
			? options
			: options.filter((option) => option.label.toLowerCase().includes(searchQuery.toLowerCase()))
	);

	const selectedOption = $derived(options.find((opt) => opt.value === value));

	function handleInputFocus() {
		isOpen = true;
		highlightedIndex = -1;
	}

	function handleInputBlur(e: FocusEvent) {
		// Don't close if clicking within the dropdown
		// We use optional chaining here in case dropdownRef is undefined
		if (dropdownRef?.contains(e.relatedTarget as Node)) {
			return;
		}
		setTimeout(() => {
			isOpen = false;
			searchQuery = '';
		}, 200);
	}

	function handleOptionClick(option: Option) {
		value = option.value;
		searchQuery = '';
		isOpen = false;
		inputRef?.blur();
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (!isOpen) {
			if (e.key === 'ArrowDown' || e.key === 'Enter') {
				e.preventDefault();
				isOpen = true;
				return;
			}
		}

		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				highlightedIndex = Math.min(highlightedIndex + 1, filteredOptions.length - 1);
				break;
			case 'ArrowUp':
				e.preventDefault();
				highlightedIndex = Math.max(highlightedIndex - 1, -1);
				break;
			case 'Enter':
				e.preventDefault();
				if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
					handleOptionClick(filteredOptions[highlightedIndex]);
				}
				break;
			case 'Escape':
				e.preventDefault();
				isOpen = false;
				searchQuery = '';
				inputRef?.blur();
				break;
		}
	}

	function handleClear(e: MouseEvent) {
		e.stopPropagation();
		value = '';
		searchQuery = '';
		inputRef?.focus();
	}
</script>

<input type="hidden" {name} {value} {required} />

<div class="searchable-select">
	<div class="searchable-select-input-wrapper">
		<input
			bind:this={inputRef}
			type="text"
			class="searchable-select-input"
			bind:value={searchQuery}
			onfocus={handleInputFocus}
			onblur={handleInputBlur}
			onkeydown={handleKeyDown}
			placeholder={selectedOption ? selectedOption.label : placeholder}
			autocomplete="off"
			role="combobox"
			aria-expanded={isOpen}
			aria-haspopup="listbox"
			aria-controls="searchable-select-dropdown"
		/>
		{#if value}
			<button
				type="button"
				class="searchable-select-clear"
				onclick={handleClear}
				aria-label="Clear selection"
			>
				×
			</button>
		{/if}
		<svg
			class="searchable-select-chevron"
			class:is-open={isOpen}
			width="12"
			height="8"
			viewBox="0 0 12 8"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M1 1.5L6 6.5L11 1.5"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	</div>

	{#if isOpen}
		<div
			bind:this={dropdownRef}
			class="searchable-select-dropdown"
			id="searchable-select-dropdown"
			role="listbox"
		>
			{#if filteredOptions.length === 0}
				<div class="searchable-select-empty">No results found</div>
			{:else}
				{#each filteredOptions as option, index}
					<button
						type="button"
						class="searchable-select-option"
						class:is-highlighted={index === highlightedIndex}
						class:is-selected={option.value === value}
						onclick={() => handleOptionClick(option)}
						role="option"
						aria-selected={option.value === value}
					>
						{option.label}
					</button>
				{/each}
			{/if}
		</div>
	{/if}
</div>

<style>
	.searchable-select {
		position: relative;
		width: 100%;
	}

	.searchable-select-input-wrapper {
		position: relative;
		display: flex;
		align-items: center;
	}

	.searchable-select-input {
		width: 100%;
		padding: 0.75rem 3rem 0.75rem 1rem;
		border: 1px solid #e3e8ef;
		font-family: var(--vane-mono);
		font-size: 14px;
		background: white;
		cursor: text;
		border-radius: 8px;
		transition: all 0.2s ease;
	}

	.searchable-select-input:focus {
		outline: none;
		border-color: #635bff;
		box-shadow: 0 0 0 3px rgba(99, 91, 255, 0.1);
	}

	.searchable-select-clear {
		position: absolute;
		right: 2.5rem;
		background: none;
		border: none;
		font-size: 1.5rem;
		line-height: 1;
		cursor: pointer;
		color: var(--vane-gray);
		padding: 0;
		width: 1.5rem;
		height: 1.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: color 0.15s ease;
	}

	.searchable-select-clear:hover {
		color: var(--vane-black);
	}

	.searchable-select-chevron {
		position: absolute;
		right: 1rem;
		pointer-events: none;
		color: var(--vane-gray);
		transition: transform 0.2s ease;
	}

	.searchable-select-chevron.is-open {
		transform: rotate(180deg);
	}

	.searchable-select-dropdown {
		position: absolute;
		top: calc(100% + 0.5rem);
		left: 0;
		right: 0;
		background: white;
		border: 1px solid #e3e8ef;
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
		max-height: 240px;
		overflow-y: auto;
		z-index: 100;
		animation: dropdownFadeIn 0.15s ease;
	}

	@keyframes dropdownFadeIn {
		from {
			opacity: 0;
			transform: translateY(-4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.searchable-select-option {
		width: 100%;
		padding: 0.75rem 1rem;
		border: none;
		background: white;
		text-align: left;
		cursor: pointer;
		font-family: var(--vane-mono);
		font-size: 14px;
		color: var(--vane-black);
		transition: background-color 0.15s ease;
		border-bottom: 1px solid #f6f9fc;
	}

	.searchable-select-option:last-child {
		border-bottom: none;
	}

	.searchable-select-option:hover,
	.searchable-select-option.is-highlighted {
		background: #f6f9fc;
	}

	.searchable-select-option.is-selected {
		background: #ede7fe;
		color: #635bff;
		font-weight: 500;
	}

	.searchable-select-empty {
		padding: 1rem;
		text-align: center;
		color: var(--vane-gray);
		font-family: var(--vane-mono);
		font-size: 14px;
	}

	/* Custom scrollbar for dropdown */
	.searchable-select-dropdown::-webkit-scrollbar {
		width: 8px;
	}

	.searchable-select-dropdown::-webkit-scrollbar-track {
		background: #f6f9fc;
		border-radius: 0 8px 8px 0;
	}

	.searchable-select-dropdown::-webkit-scrollbar-thumb {
		background: #c1c9d2;
		border-radius: 4px;
	}

	.searchable-select-dropdown::-webkit-scrollbar-thumb:hover {
		background: #a8b3c1;
	}
</style>
