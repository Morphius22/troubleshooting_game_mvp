import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

interface UserParams {
	id: string | null;
	email: string | null;
	lang: string | null;
	phone_number: string | null;
	name: string | null;
	institution: string | null;
	query: string | null;
}

export const load: PageServerLoad = async ({ url, fetch }) => {
	const userParams: UserParams = {
		id: url.searchParams.get('id'),
		email: url.searchParams.get('email'),
		lang: url.searchParams.get('lang'),
		phone_number: url.searchParams.get('number'),
		name: url.searchParams.get('name'),
		institution: url.searchParams.get('institution'),
		query: url.searchParams.get('q')
	};

	if (!userParams.query) {
		throw error(400, 'No query provided');
	}

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
