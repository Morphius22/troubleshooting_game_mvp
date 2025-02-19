export function parseSteps(input: string): string[] {
	return (
		input
			// Split input into lines (handles both Unix and Windows newlines)
			.split(/\r?\n/)
			// Remove extra whitespace from the start and end of each line
			.map((line) => line.trim())
			// Keep only lines that start with a number followed by a period (e.g., "1.")
			.filter((line) => line.length > 0 && /^\d+\./.test(line))
			// Remove the numbering (e.g., "1. ") from the beginning of each line
			.map((line) => line.replace(/^\d+\.\s*/, ''))
	);
}
