import { supabase } from './index';

// Type for the HVAC scenario response
export interface IncorrectOption {
	choice: string;
	feedback: string;
	severity: 'low' | 'medium' | 'high';
}

export interface Step {
	id: number;
	prompt: string;
	correct_next: number | null;
	correct_action: string;
	incorrect_options: IncorrectOption[];
}

export interface RecommendedScenario {
	title: string;
}

export interface HVACScenario {
	scenario: string;
	root_cause_analysis: string;
	steps: Step[];
	recommended_scenarios: RecommendedScenario[];
}

// Get a scenario by its query string
export async function getScenarioByQuery(query: string): Promise<HVACScenario | null> {
	try {
		console.log('Fetching scenario from Supabase for query:', query);

		const { data, error } = await supabase
			.from('scenarios')
			.select('*')
			.eq('scenario_title', query)
			.single();

		// Handle "not found" error separately from other errors
		if (error) {
			if (error.code === 'PGRST116') {
				// This is the "not found" error code from PostgREST
				console.log(`No cached scenario found for query: "${query}"`);
				return null;
			}

			// Log other database errors
			console.error('Supabase error when fetching scenario:', error);
			throw new Error(`Database error: ${error.message}`);
		}

		if (!data) {
			console.log(`No data returned for query: "${query}"`);
			return null;
		}

		return data.scenario as HVACScenario;
	} catch (err) {
		// Catch any other unexpected errors
		console.error('Unexpected error fetching scenario from Supabase:', err);
		throw err; // Re-throw to be handled by the caller
	}
}
