<script lang="ts">
	import { goto } from '$app/navigation';
	import mixpanel from 'mixpanel-browser';
	import { browser } from '$app/environment';
	import { PUBLIC_MIXPANEL_PROJECT_TOKEN } from '$env/static/public';
	import { page } from '$app/stores';
	import type { PageData } from './$types';

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
	let isSearching = false;

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
			title: 'Replace a capacitor on a residential hvac system',
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

	async function handleSearch() {
		if (searchQuery.trim()) {
			isSearching = true;
			const params = new URLSearchParams($page.url.searchParams); // Copy existing params
			params.set('q', searchQuery); // Add search query

			await goto(`/troubleshoot?${params.toString()}`, {
				invalidateAll: true
			});
		}
	}
</script>

{#if isSearching}
	<div class="flex w-full flex-col items-center pt-10">
		<div class="w-full max-w-3xl p-4">
			<div class="animate-pulse">
				<!-- Scenario box -->
				<p class="mb-3 text-lg font-bold">Loading Scenario:</p>
				<p class="mb-3 text-lg">{searchQuery}</p>
				<p class="mb-3 text-sm text-gray-500">this can take a few seconds...</p>
				<div class="mb-6 rounded-lg bg-gray-100 p-4">
					<div class="mb-3 h-6 w-32 rounded bg-gray-200"></div>
					<div class="h-20 rounded bg-gray-200"></div>
				</div>

				<!-- Step box -->
				<div class="rounded-lg bg-gray-100 p-4">
					<div class="mb-4">
						<div class="mb-3 h-6 w-24 rounded bg-gray-200"></div>
						<div class="h-16 rounded bg-gray-200"></div>
					</div>

					<!-- Option buttons -->
					<div class="mt-6 space-y-3">
						<div class="h-14 rounded bg-gray-200"></div>
						<div class="h-14 rounded bg-gray-200"></div>
						<div class="h-14 rounded bg-gray-200"></div>
					</div>
				</div>
			</div>
		</div>
	</div>
{:else}
	<div class="flex w-full flex-col items-center px-4 pb-8 pt-4">
		<div class="mb-6 w-full max-w-2xl">
			<h1 class="mb-2 text-2xl font-bold text-gray-900">HVAC Training Scenarios</h1>
			<p class="px-4 text-base text-gray-600">
				Practice real-world repairs with interactive scenarios. Tap any card to begin.
			</p>
		</div>

		<div class="w-full max-w-2xl">
			{#each Object.entries(groupedCards) as [level, levelCards]}
				<div class="mb-6">
					<div class="space-y-4">
						{#each levelCards as card}
							<button
								class="group w-full rounded-xl bg-white p-6 text-left shadow-sm transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 active:bg-gray-50"
								on:click={() => {
									searchQuery = card.title;
									handleSearch();
								}}
							>
								<div class="flex items-start gap-3">
									<div class="flex-1">
										<p class="mb-3 text-lg font-medium text-gray-900">
											{card.title}
										</p>
										<span
											class="inline-block rounded-full px-4 py-1.5 text-sm font-medium capitalize {levelColors[
												card.level as Level
											]}"
										>
											{card.level}
										</span>
									</div>
									<svg
										class="mt-1.5 h-6 w-6 flex-shrink-0 text-gray-400"
										viewBox="0 0 20 20"
										fill="currentColor"
									>
										<path
											fill-rule="evenodd"
											d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
											clip-rule="evenodd"
										/>
									</svg>
								</div>
							</button>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</div>
{/if}
