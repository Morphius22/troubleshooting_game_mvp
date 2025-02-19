<script lang="ts">
	import type { PageData } from './$types';
	import FeedbackForm from '$lib/components/FeedbackForm.svelte';
	import { browser } from '$app/environment';
	import mixpanel from 'mixpanel-browser';

	if (browser) {
		mixpanel.identify('USER_ID');
		mixpanel.track('page_viewed', {
			property: 'troubleshoot'
		});
	}

	// Types
	type Feedback = { message: string; severity?: string } | null;
	type Option = {
		text: string;
		isCorrect: boolean;
		feedback?: string;
		severity?: string;
	};

	// Props
	export let data: PageData;

	// State
	let currentStepIndex = 0;
	let currentFeedback: Feedback = null;
	let canProgress = false;

	// Derived values
	$: currentStep = data.scenario.steps[currentStepIndex];
	$: options = currentStep ? shuffleOptions(currentStep) : [];
	$: isComplete = currentStep.correct_next === null || currentStep.correct_next === -1;

	// Utility functions
	function shuffleOptions(step: (typeof data.scenario.steps)[0]): Option[] {
		const allOptions = [
			{ text: step.correct_action, isCorrect: true },
			...step.incorrect_options.map((opt: any) => ({
				text: opt.choice,
				isCorrect: false,
				feedback: opt.feedback,
				severity: opt.severity
			}))
		];
		return [...allOptions].sort(() => Math.random() - 0.5);
	}

	// Event handlers
	function handleOptionSelect(option: Option) {
		if (option.isCorrect) {
			currentFeedback = { message: "Correct! Click 'Next' to continue." };
			canProgress = !isComplete;
		} else {
			currentFeedback = {
				message: option.feedback || "That's not correct. Try again.",
				severity: option.severity
			};
		}
	}

	function nextStep() {
		if (currentStep.correct_next !== null && canProgress) {
			currentStepIndex++;
			currentFeedback = null;
			canProgress = false;
		}
	}
</script>

<div class="min-h-screen bg-gray-50 px-3 py-3 sm:px-4 sm:py-4">
	{#if isComplete}
		<!-- Completion State -->
		<div class="mx-auto max-w-3xl rounded-lg bg-green-50 p-4">
			<h2 class="mb-2 text-lg font-bold sm:text-xl">Scenario Complete!</h2>
			<FeedbackForm />
		</div>
	{:else}
		<!-- Scenario Description -->
		<div class="mx-auto mb-4 max-w-3xl rounded-lg bg-blue-50 p-4 sm:mb-6">
			<h1 class="mb-2 text-lg font-bold sm:text-xl">Scenario</h1>
			<p class="text-sm leading-relaxed text-gray-700 sm:text-base">{data.scenario.scenario}</p>
		</div>

		<!-- Active Step -->
		<div class="mx-auto max-w-3xl rounded-lg bg-white p-4 shadow">
			<div class="mb-4">
				<h2 class="text-base font-semibold sm:text-lg">Step {currentStep.id}</h2>
				<p class="mt-2 text-sm leading-relaxed text-gray-700 sm:text-base">{currentStep.prompt}</p>
			</div>

			<!-- Options -->
			<div class="space-y-2 sm:space-y-3">
				{#each options as option}
					<button
						class="w-full rounded border p-3 text-left text-sm leading-relaxed transition hover:bg-gray-50 sm:text-base"
						on:click={() => handleOptionSelect(option)}
					>
						{option.text}
					</button>
				{/each}
			</div>

			<!-- Feedback -->
			{#if currentFeedback}
				<div
					class="mt-4 rounded p-3 text-sm sm:text-base"
					class:bg-green-100={!currentFeedback.severity}
					class:bg-yellow-100={currentFeedback.severity === 'low'}
					class:bg-orange-100={currentFeedback.severity === 'medium'}
					class:bg-red-100={currentFeedback.severity === 'high'}
				>
					<p>{currentFeedback.message}</p>
				</div>
			{/if}

			<!-- Next Button -->
			{#if canProgress}
				<button
					class="mt-4 w-full rounded bg-blue-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-600 sm:text-base"
					on:click={nextStep}
				>
					Next
				</button>
			{/if}
		</div>
	{/if}
</div>
