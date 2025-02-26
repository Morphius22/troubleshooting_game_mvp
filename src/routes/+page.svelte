<script lang="ts">
	import { goto } from '$app/navigation';
	import mixpanel from 'mixpanel-browser';
	import { browser } from '$app/environment';
	import { PUBLIC_MIXPANEL_PROJECT_TOKEN } from '$env/static/public';
	import { page } from '$app/stores';
	import { navigating } from '$app/stores';
	import type { PageData } from './$types';
	import LoadingSkeleton from '$lib/components/LoadingSkeleton.svelte';
	export let data: PageData;

	type Level = 'beginner' | 'medium' | 'challenging';

	interface Card {
		title: string;
		level: Level;
	}

	interface GroupedCards {
		beginner?: Card[];
		medium?: Card[];
		challenging?: Card[];
	}

	let searchQuery = '';

	if (browser) {
		// Near entry of your product, init Mixpanel
		mixpanel.init(PUBLIC_MIXPANEL_PROJECT_TOKEN, {
			debug: true,
			persistence: 'localStorage',
			ignore_dnt: true
		});

		mixpanel.identify(data.userParams.id ?? '');

		mixpanel.people.set({
			name: data.userParams.name ?? '',
			email: data.userParams.email ?? '',
			institution: data.userParams.institution ?? '',
			phone_number: data.userParams.phone_number ?? ''
		});

		mixpanel.track('page_viewed', {
			page_name: 'home',
			...data.userParams
		});
	}

	const cards: Card[] = [
		{
			title: 'replace a capacitor on a residential hvac system',
			level: 'beginner'
		},
		{
			title:
				'The screen on a residential thermostat is not working. Diagnose what is wrong and fix it.',
			level: 'challenging'
		},
		{
			title: 'Do a preventative maintenance on an air sourced residential heat pump',
			level: 'beginner'
		},
		{
			title:
				'The condensate drain line on a residential heat pump is clogged. Diagnose what is wrong and fix it.',
			level: 'beginner'
		},
		{
			title:
				'A low voltage fault is detected on a residential heat pump. The unit is unresponsive. Diagnose what is wrong and fix it.',
			level: 'challenging'
		},
		{
			title:
				'A residential heat pump might be low on refrigerant. Check the refrigerant level and add if necessary.',
			level: 'medium'
		},
		{
			title:
				'The contactor on a residential heat pump is stuck. Diagnose what is wrong and fix it.',
			level: 'medium'
		},
		{
			title: 'A residential heat pumps outdoor unit is frozen up.',
			level: 'medium'
		},
		{
			title:
				'The reversing valve on a residential heat pump is stuck in one mode. Diagnose what is wrong and fix it.',
			level: 'challenging'
		},
		{
			title:
				'A residential heat pump is not blowing air. The outdoor unit is running but the indoor unit is not. Diagnose what is wrong and fix it.',
			level: 'challenging'
		}
	];

	const groupedCards = cards.reduce<GroupedCards>((acc, card) => {
		if (!acc[card.level]) {
			acc[card.level] = [];
		}
		acc[card.level]?.push(card);
		return acc;
	}, {});

	const levelColors: Record<Level, string> = {
		beginner: 'bg-emerald-50 text-emerald-700',
		medium: 'bg-amber-50 text-amber-700',
		challenging: 'bg-rose-50 text-rose-700'
	};

	const levelIcons: Record<Level, string> = {
		beginner: `<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<path stroke-linecap="round" stroke-linejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
		</svg>`,
		medium: `<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
		</svg>`,
		challenging: `<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
		</svg>`
	};

	async function handleSearch() {
		if (searchQuery.trim()) {
			const params = new URLSearchParams($page.url.searchParams);
			params.set('q', searchQuery);

			await goto(`/troubleshoot?${params.toString()}`, {
				invalidateAll: true
			});
		}
	}
</script>

{#if $navigating}
	<LoadingSkeleton scenarioTitle={searchQuery} />
{:else}
	<div class="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50 px-3 py-4 sm:px-4 sm:py-6">
		<div class="mx-auto max-w-4xl">
			<!-- Header -->
			<div class="mb-8 sm:mb-10">
				<h1 class="text-xl font-bold text-gray-900 sm:text-2xl">HVAC Troubleshooting Scenarios</h1>
				<p class="mt-2 text-sm text-gray-600 sm:text-base">
					Practice diagnosing and fixing common HVAC issues with interactive scenarios.
				</p>
			</div>

			<!-- Difficulty Levels -->
			{#each Object.entries(groupedCards) as [level, levelCards]}
				<div class="mb-8">
					<div class="mb-3 flex items-center gap-2">
						<h2 class="text-lg font-semibold capitalize text-gray-800 sm:text-xl">{level}</h2>
						<div class="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100">
							{@html levelIcons[level as Level]}
						</div>
					</div>

					<div class="space-y-3">
						{#each levelCards as card}
							<button
								class="group w-full overflow-hidden rounded-xl bg-white p-4 text-left shadow-sm transition hover:shadow-md sm:p-5"
								on:click={() => {
									searchQuery = card.title;
									handleSearch();
								}}
							>
								<div class="flex items-start justify-between gap-4">
									<div class="flex-1">
										<p class="text-sm font-medium text-gray-900 sm:text-base">
											{card.title}
										</p>
										<div class="mt-2 flex items-center gap-2">
											<span
												class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium sm:text-sm {levelColors[
													card.level as Level
												]}"
											>
												{@html levelIcons[card.level as Level]}
												{card.level}
											</span>
										</div>
									</div>
									<div
										class="rounded-full bg-indigo-50 p-2 text-indigo-600 opacity-70 transition group-hover:bg-indigo-100 group-hover:opacity-100"
									>
										<svg class="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
											<path
												fill-rule="evenodd"
												d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
												clip-rule="evenodd"
											/>
										</svg>
									</div>
								</div>
							</button>
						{/each}
					</div>
				</div>
			{/each}

			<!-- Footer -->
			<div
				class="mt-8 rounded-lg bg-white p-4 text-center text-sm text-gray-500 shadow-sm sm:p-5 sm:text-base"
			>
				<p>Select a scenario above to start troubleshooting.</p>
			</div>
		</div>
	</div>
{/if}
