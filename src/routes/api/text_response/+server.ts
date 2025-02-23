import { json } from '@sveltejs/kit';
import { ANTHROPIC_API_KEY } from '$env/static/private';
import { error } from '@sveltejs/kit';

// Types for HVAC scenario response
interface IncorrectOption {
	choice: string;
	feedback: string;
	severity: 'low' | 'medium' | 'high';
}

interface Step {
	id: number;
	prompt: string;
	correct_next: number;
	correct_action: string;
	incorrect_options: IncorrectOption[];
}

// Add new interface for recommendations
interface RecommendedScenario {
	title: string;
}

// Update HVACScenario interface
interface HVACScenario {
	scenario: string;
	root_cause_analysis: string;
	steps: Step[];
	recommended_scenarios: RecommendedScenario[]; // New field
}

// Validation functions
function isValidSeverity(severity: string): severity is 'low' | 'medium' | 'high' {
	return ['low', 'medium', 'high'].includes(severity);
}

function validateIncorrectOption(option: unknown): option is IncorrectOption {
	const opt = option as Partial<IncorrectOption>;
	return (
		typeof option === 'object' &&
		option !== null &&
		opt.choice !== undefined &&
		opt.feedback !== undefined &&
		opt.severity !== undefined &&
		typeof opt.choice === 'string' &&
		typeof opt.feedback === 'string' &&
		isValidSeverity(opt.severity)
	);
}

function validateStep(step: unknown): step is Step {
	const s = step as Partial<Step>;
	return (
		typeof step === 'object' &&
		step !== null &&
		s.id !== undefined &&
		s.prompt !== undefined &&
		s.correct_next !== undefined &&
		s.correct_action !== undefined &&
		s.incorrect_options !== undefined &&
		typeof s.id === 'number' &&
		typeof s.prompt === 'string' &&
		(typeof s.correct_next === 'number' || s.correct_next === null) &&
		typeof s.correct_action === 'string' &&
		Array.isArray(s.incorrect_options) &&
		s.incorrect_options?.every(validateIncorrectOption)
	);
}

// Add validation function for recommendations
function validateRecommendedScenario(scenario: unknown): scenario is RecommendedScenario {
	const s = scenario as Partial<RecommendedScenario>;
	return (
		typeof scenario === 'object' &&
		scenario !== null &&
		s.title !== undefined &&
		typeof s.title === 'string'
	);
}

// Update the main validation function
function validateHVACScenario(data: unknown): data is HVACScenario {
	const d = data as Partial<HVACScenario>;
	try {
		return (
			typeof data === 'object' &&
			data !== null &&
			d.scenario !== undefined &&
			d.root_cause_analysis !== undefined &&
			d.steps !== undefined &&
			d.recommended_scenarios !== undefined &&
			typeof d.scenario === 'string' &&
			typeof d.root_cause_analysis === 'string' &&
			Array.isArray(d.steps) &&
			Array.isArray(d.recommended_scenarios) &&
			d.steps?.every(validateStep) &&
			d.recommended_scenarios?.every(validateRecommendedScenario) &&
			d.recommended_scenarios?.length === 2
		);
	} catch {
		return false;
	}
}

// Process and sanitize query
function processQuery(query: string): string {
	// Remove any special characters that might interfere with the prompt
	const sanitizedQuery = query.replace(/[^\w\s-.,?!]/g, '').trim();

	// Ensure the query ends with proper punctuation
	const punctuatedQuery = sanitizedQuery.endsWith('?') ? sanitizedQuery : `${sanitizedQuery}?`;

	return punctuatedQuery;
}

// Update system prompt
const system_prompt = `[SYSTEM]
You're an HVAC instructor creating troubleshooting simulations. The situation you are teaching is in the PROBLEM section. Follow NATE guidelines and manufacturer specs.

[PROBLEM]
{QUERY}

[REQUIREMENTS]
1. Generate the troubleshooting steps for the problem. Be as concise as possible, but don't leave our crucial information.
2. For each step, create 2 incorrect choices and 1 correct choice:
   - Correct action = Standard diagnostic procedure
   - 2 incorrect choices = Common new technician errors
   - Feedback = Technical explanation + safety implications of the incorrect choices
3. Include voltage checks and wiring analysis.
4. Generate 2 related follow-up scenarios that would help the technician build their knowledge:
   - First scenario: A more complex problem with the same component
   - Second scenario: A problem with a different component in the same type of system
   - Each title should clearly describe the problem without mentioning specific components
5. Format as valid JSON with properly escaped quotes and no line breaks within strings. The JSON should match this schema:
   {
     "scenario": string,
     "root_cause_analysis": string,
     "steps": [
       {
         "id": number,
         "prompt": string,
         "correct_next": number,
         "correct_action": string,
         "incorrect_options": [
           {
             "choice": string,
             "feedback": string,
             "severity": "low"|"medium"|"high"
           },
           {
             "choice": string,
             "feedback": string,
             "severity": "low"|"medium"|"high"
           }
         ]
       }
     ],
     "recommended_scenarios": [
       {
         "title": string
       },
       {
         "title": string
       }
     ]
   }`;

export async function POST({ request }) {
	try {
		const { query } = (await request.json()) as { query: string };

		// Process and validate the query
		if (!query || typeof query !== 'string') {
			throw error(400, 'Invalid query provided');
		}

		const processedQuery = processQuery(query);
		const customizedPrompt = system_prompt.replace('{QUERY}', `"${processedQuery}"`);

		const response = await fetch('https://api.anthropic.com/v1/messages', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'anthropic-version': '2023-06-01',
				'x-api-key': ANTHROPIC_API_KEY
			},
			body: JSON.stringify({
				model: 'claude-3-haiku-20240307',
				system: customizedPrompt,
				messages: [{ role: 'user', content: processedQuery }],
				max_tokens: 4000
			})
		});

		if (!response.ok) {
			const errorData = await response.json();
			console.error('API Error:', errorData);
			throw error(400, errorData.error?.message || 'API call failed');
		}

		const data = await response.json();
		const responseText = data.content[0].text;

		// Parse and validate the response
		let parsedResponse;
		try {
			parsedResponse = JSON.parse(responseText);
		} catch (e) {
			console.error('JSON Parse Error:', e);
			throw error(500, 'Invalid JSON response from AI');
		}

		// Validate the parsed response
		if (!validateHVACScenario(parsedResponse)) {
			console.error('Invalid scenario format:', parsedResponse);
			throw error(500, 'AI response does not match expected format');
		}
		console.log(parsedResponse);
		return json(parsedResponse);
	} catch (err) {
		console.error('Error:', err);
		return json(
			{
				error: err instanceof Error ? err.message : 'Failed to process request',
				details: err instanceof Error ? err.stack : undefined
			},
			{ status: err instanceof Error ? 500 : 400 }
		);
	}
}
