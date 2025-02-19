import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url, fetch }) => {
	const query = url.searchParams.get('q');

	if (!query) {
		throw error(400, 'No query provided');
	}

	const response = await fetch('/api/text_response', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ query })
	});

	if (!response.ok) {
		throw error(500, 'Failed to fetch scenario');
	}

	const scenario = await response.json();
	return { scenario };
};
