export async function fetchClaudeResponse(query: string, type: string, instruction?: string) {
	const payload: { query: string; type: string; instruction?: string } = { query, type };
	if (instruction) {
		payload.instruction = instruction;
	}

	const response = await fetch('/api/text_response', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(payload)
	});
	return await response.json();
}

interface ImageResponse {
	images: Array<{
		url: string;
		thumbnail: string;
		title: string;
	}>;
}

export async function fetchGoogleImages(
	query: string,
	instruction?: string
): Promise<ImageResponse> {
	const response = await fetch('/api/image_response', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ query, instruction })
	});
	return await response.json();
}

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

export async function saveFeedback(feedbackData: FeedbackData) {
	const response = await fetch('/api/feedback_saving', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(feedbackData)
	});

	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.details || 'Failed to save feedback');
	}

	return await response.json();
}
