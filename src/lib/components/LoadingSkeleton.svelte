<script lang="ts">
	export let scenarioTitle: string | null = null;
</script>

<div class="flex w-full flex-col items-center pt-10">
	<div class="w-full max-w-3xl p-4">
		<div class="animate-pulse">
			<!-- Scenario box -->
			<p class="mb-3 text-lg font-bold">Loading Scenario:</p>
			<p class="mb-3 text-lg">{scenarioTitle}</p>
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
