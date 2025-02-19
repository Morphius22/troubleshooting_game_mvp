import type { PageServerLoad } from './$types';

interface UserParams {
	id: string | null;
	email: string | null;
	lang: string | null;
	phone_number: string | null;
	name: string | null;
	institution: string | null;
}

export const load: PageServerLoad = async ({ url }) => {
	const userParams: UserParams = {
		id: url.searchParams.get('id'),
		email: url.searchParams.get('email'),
		lang: url.searchParams.get('lang'),
		phone_number: url.searchParams.get('number'),
		name: url.searchParams.get('name'),
		institution: url.searchParams.get('institution')
	};

	return {
		userParams
	};
};
