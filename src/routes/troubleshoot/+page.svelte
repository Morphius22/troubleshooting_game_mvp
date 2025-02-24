<script lang="ts">
	import type { PageData } from './$types';
	import FeedbackForm from '$lib/components/FeedbackForm.svelte';
	import { browser } from '$app/environment';
	import { goto, invalidateAll } from '$app/navigation';
	import mixpanel from 'mixpanel-browser';
	import { navigating } from '$app/stores';
	import LoadingSkeleton from '$lib/components/LoadingSkeleton.svelte';

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
	let currentXP = 0;
	let currentFeedback: Feedback = null;
	let canProgress = false;
	let stepAttempts = new Set<number>();
	let loadingScenarioTitle: string | null = null;

	// Initialize audio only in browser
	let correctSound: HTMLAudioElement;
	let incorrectSound: HTMLAudioElement;
	if (browser) {
		correctSound = new Audio('/sounds/correct_answer.mp3');
		incorrectSound = new Audio('/sounds/incorrect_answer.mp3');
	}

	// Add a Map to store shuffled options for each step
	let shuffledOptionsMap = new Map<number, Option[]>();

	// Derived values
	$: currentStep = data.scenario.steps[currentStepIndex];
	$: options = currentStep ? shuffleOptions(currentStep) : [];
	$: isComplete = currentStep.correct_next === null || currentStep.correct_next === -1;

	// Utility functions
	function shuffleOptions(step: (typeof data.scenario.steps)[0]): Option[] {
		// If we already shuffled this step's options before...
		if (shuffledOptionsMap.has(step.id)) {
			// ...return those same shuffled options
			return shuffledOptionsMap.get(step.id)!;
		}

		// If we haven't shuffled this step's options yet...
		const allOptions = [
			{ text: step.correct_action, isCorrect: true },
			...step.incorrect_options.map((opt: any) => ({
				text: opt.choice,
				isCorrect: false,
				feedback: opt.feedback,
				severity: opt.severity
			}))
		];

		// Shuffle them once
		const shuffled = [...allOptions].sort(() => Math.random() - 0.5);

		// Store them for this step
		shuffledOptionsMap.set(step.id, shuffled);

		// Return the shuffled options
		return shuffled;
	}

	// Event handlers
	function handleOptionSelect(option: Option) {
		const isFirstAttempt = !stepAttempts.has(currentStep.id);
		stepAttempts.add(currentStep.id);

		if (option.isCorrect) {
			// Play sound effect when correct
			if (browser) {
				correctSound?.play().catch(() => {}); // Ignore errors if sound fails to play
			}

			if (isFirstAttempt) {
				currentXP += 10;
				currentFeedback = {
					message: "Correct! +10 XP. Click 'Continue' to proceed to the next step."
				};
			} else {
				currentFeedback = {
					message: "Correct! Click 'Continue' to proceed to the next step."
				};
			}
			canProgress = !isComplete;
		} else {
			if (browser) {
				incorrectSound?.play().catch(() => {}); // Ignore errors if sound fails to play
			}

			currentXP -= 5;
			currentFeedback = {
				message: `${option.feedback || "That's not correct. Try again!"} (-5 XP)`,
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

	async function loadNewScenario(scenarioTitle: string) {
		// Update the loading title first
		loadingScenarioTitle = scenarioTitle;

		// Reset state
		currentStepIndex = 0;
		currentFeedback = null;
		canProgress = false;
		stepAttempts = new Set<number>();

		// Preserve all existing URL parameters except 'q'
		const params = new URLSearchParams(window.location.search);
		params.set('q', encodeURIComponent(scenarioTitle));

		mixpanel.track('starting_recommended_scenario', {
			scenario_title: scenarioTitle,
			search_query: data.userParams.query
		});

		await goto(`/troubleshoot?${params.toString()}`);
		await invalidateAll();
	}
</script>

<!-- Loading State -->
{#if $navigating}
	<LoadingSkeleton scenarioTitle={loadingScenarioTitle || data.userParams.query} />
{:else}
	<div class="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50 px-3 py-4 sm:px-4 sm:py-6">
		<!-- Header Area with XP and Back Button -->
		<div class="mx-auto mb-4 flex max-w-4xl items-center justify-between sm:mb-6">
			<button
				class="flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
				on:click={goBack}
			>
				<svg class="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 20 20" fill="currentColor">
					<path
						fill-rule="evenodd"
						d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
						clip-rule="evenodd"
					/>
				</svg>
				<span class="sm:inline">Back</span>
			</button>

			<div class="flex items-center gap-3">
				<div
					class="flex items-center gap-1.5 rounded-full bg-indigo-600 px-3 py-1.5 text-white shadow-md sm:gap-2 sm:px-4 sm:py-2"
				>
					<svg
						class="h-4 w-4 sm:h-5 sm:w-5"
						viewBox="0 0 24 24"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path d="M12 16L7 13.5V8.5L12 6L17 8.5V13.5L12 16Z" fill="currentColor" />
						<path
							d="M12 16V21M7 13.5L2 11M17 13.5L22 11"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
					<span class="text-sm font-bold sm:text-base">{currentXP} XP</span>
				</div>
			</div>
		</div>

		{#if isComplete}
			<!-- Completion State -->
			<div class="mx-auto max-w-4xl overflow-hidden rounded-xl bg-white shadow-xl sm:rounded-2xl">
				<div
					class="bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-6 text-white sm:px-6 sm:py-8"
				>
					<div class="flex items-center gap-3 sm:gap-4">
						<div class="rounded-full bg-white/20 p-2 sm:p-3">
							<svg class="h-6 w-6 sm:h-8 sm:w-8" viewBox="0 0 24 24" fill="none">
								<path
									d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>
						</div>
						<div>
							<h2 class="text-xl font-bold sm:text-2xl">Scenario Complete!</h2>
							<p class="text-sm text-white/80 sm:text-base">
								Great job troubleshooting this HVAC issue
							</p>
						</div>
					</div>
				</div>

				<div class="p-4 sm:p-6">
					<div class="mb-6 rounded-lg bg-gray-50 p-4 sm:rounded-xl sm:p-5">
						<div class="mb-2 flex items-center justify-between">
							<h3 class="text-base font-semibold text-gray-700 sm:text-lg">Your Performance</h3>
							<span
								class="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 sm:px-3 sm:py-1 sm:text-sm"
								>Completed</span
							>
						</div>
						<div class="grid grid-cols-2 gap-3 sm:gap-4">
							<div class="rounded-lg bg-white p-3 shadow-sm sm:p-4">
								<p class="text-xs text-gray-500 sm:text-sm">Final Score</p>
								<p class="text-xl font-bold text-indigo-600 sm:text-2xl">{currentXP} XP</p>
							</div>
							<div class="rounded-lg bg-white p-3 shadow-sm sm:p-4">
								<p class="text-xs text-gray-500 sm:text-sm">Steps Taken</p>
								<p class="text-xl font-bold text-indigo-600 sm:text-2xl">{currentStepIndex + 1}</p>
							</div>
						</div>
					</div>

					<!-- Recommended Scenarios Section -->
					<div class="mb-6 sm:mb-8">
						<h3 class="mb-3 text-base font-semibold text-gray-800 sm:mb-4 sm:text-lg">
							Ready for your next challenge?
						</h3>
						<div class="grid gap-3 sm:grid-cols-2">
							{#each data.scenario.recommended_scenarios as scenario, i}
								<button
									class="group relative overflow-hidden rounded-lg border border-gray-100 bg-white p-4 text-left shadow-sm transition hover:shadow-md sm:rounded-xl sm:p-5"
									on:click={() => loadNewScenario(scenario.title)}
								>
									<div
										class="absolute -right-2 -top-2 rounded-full bg-indigo-100 p-2 text-indigo-600 opacity-70 transition group-hover:opacity-100 sm:p-3"
									>
										<svg class="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
											<path
												fill-rule="evenodd"
												d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
												clip-rule="evenodd"
											/>
										</svg>
									</div>
									<span
										class="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600"
										>Scenario {i + 1}</span
									>
									<p class="mt-2 text-sm font-medium text-gray-900 sm:text-base">
										{scenario.title}
									</p>
								</button>
							{/each}
						</div>
					</div>

					<FeedbackForm
						email={data.userParams.email}
						name={data.userParams.name}
						institution={data.userParams.institution}
						phone_number={data.userParams.phone_number}
						moodle_id={data.userParams.id}
						query={data.userParams.query}
					/>
				</div>
			</div>
		{:else}
			<div class="mx-auto max-w-4xl">
				<!-- Scenario Description -->
				<div class="mb-4 overflow-hidden rounded-xl bg-white shadow-lg sm:mb-6 sm:rounded-2xl">
					<div class="border-b border-gray-100 bg-gray-50 px-4 py-4 sm:px-6 sm:py-5">
						<h1 class="text-lg font-bold text-gray-800 sm:text-xl">Scenario</h1>
					</div>
					<div class="p-4 sm:p-6">
						<p class="text-sm leading-relaxed text-gray-700 sm:text-base">
							{data.scenario.scenario}
						</p>
					</div>
				</div>

				<!-- Active Step -->
				<div class="overflow-hidden rounded-xl bg-white shadow-lg sm:rounded-2xl">
					<div class="border-b border-gray-100 bg-gray-50 px-4 py-3 sm:px-6 sm:py-4">
						<div class="flex items-center justify-between">
							<h2
								class="flex items-center gap-1.5 text-base font-semibold text-gray-800 sm:gap-2 sm:text-lg"
							>
								<span
									class="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 sm:h-7 sm:w-7 sm:text-sm"
									>{currentStep.id}</span
								>
								<span>What would you do?</span>
							</h2>
							<div class="text-xs text-gray-500 sm:text-sm">
								{#if currentStepIndex + 1 < data.scenario.steps.length}
									{currentStepIndex + 1} of {data.scenario.steps.length}
								{/if}
							</div>
						</div>
					</div>

					<div class="p-4 sm:p-6">
						<div class="mb-4 rounded-lg bg-blue-50 p-3 sm:mb-6 sm:rounded-xl sm:p-4">
							<p class="text-sm leading-relaxed text-gray-700 sm:text-base">
								{currentStep.prompt}
							</p>
						</div>

						<!-- Options -->
						<div class="mb-4 space-y-2 sm:mb-6 sm:space-y-3">
							<h3 class="mb-1.5 text-xs font-medium text-gray-500 sm:mb-2 sm:text-sm">
								Select your action:
							</h3>
							{#each options as option, i}
								<button
									class="w-full rounded-lg border border-gray-200 bg-white p-3 text-left text-sm leading-relaxed shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 sm:rounded-xl sm:p-4 sm:text-base"
									on:click={() => handleOptionSelect(option)}
								>
									<div class="flex items-center gap-2 sm:gap-3">
										<div
											class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-700 sm:h-8 sm:w-8 sm:text-sm"
										>
											{String.fromCharCode(65 + i)}
										</div>
										<span>{option.text}</span>
									</div>
								</button>
							{/each}
						</div>

						<!-- Feedback -->
						{#if currentFeedback}
							<div
								class="feedback-animation mb-4 rounded-lg p-3 text-sm sm:mb-6 sm:p-4 sm:text-base"
								class:bg-green-50={!currentFeedback.severity}
								class:border-green-200={!currentFeedback.severity}
								class:text-green-800={!currentFeedback.severity}
								class:bg-yellow-50={currentFeedback.severity === 'low'}
								class:border-yellow-200={currentFeedback.severity === 'low'}
								class:text-yellow-800={currentFeedback.severity === 'low'}
								class:bg-orange-50={currentFeedback.severity === 'medium'}
								class:border-orange-200={currentFeedback.severity === 'medium'}
								class:text-orange-800={currentFeedback.severity === 'medium'}
								class:bg-red-50={currentFeedback.severity === 'high'}
								class:border-red-200={currentFeedback.severity === 'high'}
								class:text-red-800={currentFeedback.severity === 'high'}
							>
								<div class="flex items-start gap-2 sm:gap-3">
									<svg
										class="h-4 w-4 flex-shrink-0 sm:h-5 sm:w-5"
										class:text-green-500={!currentFeedback.severity}
										class:text-yellow-500={currentFeedback.severity === 'low'}
										class:text-orange-500={currentFeedback.severity === 'medium'}
										class:text-red-500={currentFeedback.severity === 'high'}
										viewBox="0 0 20 20"
										fill="currentColor"
									>
										{#if !currentFeedback.severity}
											<path
												fill-rule="evenodd"
												d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
												clip-rule="evenodd"
											/>
										{:else}
											<path
												fill-rule="evenodd"
												d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
												clip-rule="evenodd"
											/>
										{/if}
									</svg>
									<p>{currentFeedback.message}</p>
								</div>
							</div>
						{/if}

						<!-- Next Button -->
						{#if canProgress}
							<button
								class="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-3 text-sm font-medium text-white shadow-md transition hover:from-indigo-700 hover:to-blue-700 sm:px-6 sm:py-4 sm:text-base"
								on:click={nextStep}
							>
								Continue to Next Step
							</button>
						{/if}
					</div>
				</div>
			</div>
		{/if}
	</div>
{/if}

<style>
	@keyframes feedbackPop {
		0% {
			opacity: 0;
			transform: translateY(10px);
		}
		100% {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.feedback-animation {
		animation: feedbackPop 0.3s ease-out;
	}
</style>
