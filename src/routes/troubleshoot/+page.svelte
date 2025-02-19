<script lang="ts">
	import type { PageData } from './$types';
	import FeedbackForm from '$lib/components/FeedbackForm.svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import mixpanel from 'mixpanel-browser';

	export let data: PageData;
	console.log('data', data);

	if (browser) {
		// Just track the page view, no need to initialize again
		mixpanel.track('page_viewed', {
			page_name: 'troubleshoot',
			...data.userParams
		});
	}

	// Track completion when isComplete becomes true
	$: if (browser && isComplete) {
		mixpanel.track('scenario_completed', {
			property: 'troubleshooting game',
			scenario: data.scenario.scenario,
			steps_taken: currentStepIndex + 1,
			search_query: data.userParams.query,
			...data.userParams
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

	function goBack() {
		goto('/');
	}
</script>

<div class="min-h-screen bg-gray-50 px-3 py-3 sm:px-4 sm:py-4">
	<button
		class="mb-4 inline-flex items-center gap-1 rounded-lg bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
		on:click={goBack}
	>
		<svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
			<path
				fill-rule="evenodd"
				d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
				clip-rule="evenodd"
			/>
		</svg>
		Back
	</button>

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
