import { supabase } from './index';

// Define what feedback data looks like
export interface FeedbackData {
	rating: number;
	feedback_text: string;
	email: string | null;
	name: string | null;
	institution: string | null;
	phone_number: string | null;
	moodle_id: string | null;
	query: string | null;
}

// Save feedback to the database
export async function saveFeedback(feedbackData: FeedbackData) {
	// Check if rating is valid
	if (feedbackData.rating < 1 || feedbackData.rating > 5) {
		return {
			success: false,
			error: 'Rating must be between 1 and 5'
		};
	}

	try {
		// Try to save to Supabase
		const result = await supabase
			.from('final_feedback')
			.insert([
				{
					rating: feedbackData.rating,
					feedback_text: feedbackData.feedback_text,
					tool_name: 'Troubleshooting game',
					email: feedbackData.email,
					name: feedbackData.name,
					institution: feedbackData.institution,
					phone_number: feedbackData.phone_number,
					moodle_id: feedbackData.moodle_id,
					query: feedbackData.query
				}
			])
			.select();

		// If there was an error with Supabase
		if (result.error) {
			console.error('Error saving feedback:', result.error);
			return {
				success: false,
				error: 'Failed to save feedback'
			};
		}

		// If everything worked
		return {
			success: true,
			data: result.data
		};
	} catch (err) {
		// If something unexpected happened
		console.error('Unexpected error:', err);
		return {
			success: false,
			error: 'An unexpected error occurred'
		};
	}
}
