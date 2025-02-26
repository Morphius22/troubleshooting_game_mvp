import { json } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import type { RequestHandler, RequestEvent } from './$types';
import { saveFeedback, type FeedbackData } from '$lib/supabase/feedback';

export const POST: RequestHandler = async ({ request }: RequestEvent) => {
	try {
		// Parse the request body
		const feedbackData = (await request.json()) as FeedbackData;

		// Use our centralized saveFeedback function
		const result = await saveFeedback(feedbackData);

		// Handle the result
		if (!result.success) {
			// If our function returns an error, return HTTP error response
			throw error(400, result.error || 'Failed to save feedback');
		}

		// Return success response
		return json({ success: true, data: result.data });
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
