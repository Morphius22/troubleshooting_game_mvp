<script lang="ts">
	import { saveFeedback } from '$lib/services/api';
	import { goto } from '$app/navigation';

	let rating = 0;
	let feedbackText = '';
	let isSubmitting = false;
	let error: string | null = null;

	//props
	export let email: string | null = null;
	export let name: string | null = null;
	export let institution: string | null = null;
	export let phone_number: string | null = null;
	export let moodle_id: string | null = null;
	export let query: string | null = null;

	async function handleSubmit() {
		if (rating === 0) {
			error = 'Please select a rating';
			return;
		}

		isSubmitting = true;
		error = null;

		try {
			await saveFeedback({
				rating,
				feedback_text: feedbackText,
				email,
				name,
				institution,
				phone_number,
				moodle_id,
				query
			});
			goto('/'); // SvelteKit navigation
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to submit feedback';
			isSubmitting = false;
		}
	}
</script>

<div class="space-y-4 rounded-lg border bg-white p-4 shadow-sm">
	<h2 class="text-xl font-semibold">How was your experience?</h2>

	<form on:submit|preventDefault={handleSubmit} class="space-y-4">
		<div class="space-y-2">
			<label for="rating-group" class="block text-sm font-medium">Rating</label>
			<div id="rating-group" role="group" aria-label="Rating" class="flex gap-2">
				{#each Array(5) as _, i}
					<button
						type="button"
						on:click={() => (rating = i + 1)}
						class="rounded text-2xl transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500"
						class:text-yellow-400={i < rating}
						class:text-gray-300={i >= rating}
						aria-label={`Rate ${i + 1} stars`}
					>
						★
					</button>
				{/each}
			</div>
		</div>

		<div class="space-y-2">
			<label for="feedback" class="block text-sm font-medium"
				>Can you tell us more? Your feedback is super helpful! (optional)</label
			>
			<textarea
				id="feedback"
				bind:value={feedbackText}
				rows="4"
				class="w-full rounded-md border p-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
				placeholder="Tell us about your experience..."
			></textarea>
		</div>

		{#if error}
			<p class="text-sm text-red-500">{error}</p>
		{/if}

		<button
			type="submit"
			class="w-full rounded-md bg-blue-600 px-4 py-2 text-white transition-colors duration-150 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
			disabled={isSubmitting}
		>
			{#if isSubmitting}
				Submitting...
			{:else}
				Submit Feedback
			{/if}
		</button>
	</form>
</div>
