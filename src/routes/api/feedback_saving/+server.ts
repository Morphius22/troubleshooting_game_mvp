import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '$env/static/private';
import { error } from '@sveltejs/kit';
import type { RequestHandler, RequestEvent } from './$types';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface FeedbackData {
	rating: number;
	feedback_text: string;
	email: string | null;
	name: string | null;
	institution: string | null;
	phone_number: string | null;
	moodle_id: string | null;
	query: string | null;
}

export const POST: RequestHandler = async ({ request }: RequestEvent) => {
	try {
		const { rating, feedback_text, email, name, institution, phone_number, moodle_id, query } =
			(await request.json()) as FeedbackData;

		// Validate the rating is between 1-5
		if (rating < 1 || rating > 5) {
			throw error(400, 'Rating must be between 1 and 5');
		}

		// Insert the feedback into Supabase
		const { data, error: supabaseError } = await supabase
			.from('final_feedback')
			.insert([
				{
					rating,
					feedback_text,
					tool_name: 'Troubleshooting game',
					email,
					name,
					institution,
					phone_number,
					moodle_id,
					query
				}
			])
			.select();

		if (supabaseError) {
			console.error('Supabase Error:', supabaseError);
			throw error(500, 'Failed to save feedback');
		}

		return json({ success: true, data });
	} catch (err) {
		console.error('Error:', err);
		return json(
			{
				error: 'Failed to process feedback',
				details: err instanceof Error ? err.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
