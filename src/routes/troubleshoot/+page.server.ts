import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getScenarioById } from '$lib/supabase/scenario';
import Mixpanel from 'mixpanel';
import { PUBLIC_MIXPANEL_PROJECT_TOKEN } from '$env/static/public';

// Initialize Mixpanel for server-side tracking
const mixpanel = Mixpanel.init(PUBLIC_MIXPANEL_PROJECT_TOKEN);

interface UserParams {
	id: string | null;
	email: string | null;
	lang: string | null;
	phone_number: string | null;
	name: string | null;
	institution: string | null;
	query: string | null;
	scenario_id: number | null;
}

export const load: PageServerLoad = async ({ url, fetch }) => {
	const userParams: UserParams = {
		id: url.searchParams.get('id'),
		email: url.searchParams.get('email'),
		lang: url.searchParams.get('lang'),
		phone_number: url.searchParams.get('number'),
		name: url.searchParams.get('name'),
		institution: url.searchParams.get('institution'),
		query: url.searchParams.get('q'),
		scenario_id: url.searchParams.get('scenario_id')
			? parseInt(url.searchParams.get('scenario_id')!)
			: null
	};

	if (!userParams.query) {
		throw error(400, 'No query provided');
	}

	// Track scenario started event
	mixpanel.track('scenario_started', {
		distinct_id: userParams.id || 'anonymous',
		scenario_title: userParams.query,
		$ip: 0, // Required to enable geolocation for server-side events
		email: userParams.email,
		name: userParams.name,
		institution: userParams.institution
	});

	console.log('Fetching scenario from database for query:', userParams.query);
	// Try to get scenario by ID first (if available)
	let cachedScenario = null;
	if (userParams.scenario_id) {
		console.log('Fetching scenario from database by ID:', userParams.scenario_id);
		cachedScenario = await getScenarioById(userParams.scenario_id);
	}

	if (cachedScenario) {
		console.log('Using cached scenario', cachedScenario);
		return { scenario: cachedScenario, userParams };
	}

	// If not in database, fetch from API
	console.log('Fetching new scenario for query:', userParams.query);
	const response = await fetch('/api/text_response', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ query: userParams.query })
	});

	if (!response.ok) {
		throw error(500, 'Failed to fetch scenario');
	}

	const scenario = await response.json();
	return { scenario, userParams };
};
