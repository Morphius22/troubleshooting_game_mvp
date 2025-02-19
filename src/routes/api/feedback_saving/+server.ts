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
}

export const POST: RequestHandler = async ({ request }: RequestEvent) => {
	try {
		const { rating, feedback_text } = (await request.json()) as FeedbackData;

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
					tool_name: 'Troubleshooting game'
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
