import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env file
config({ path: resolve(process.cwd(), '.env') });

// Export environment variables with validation
export const env = {
	OPENAI_API_KEY: process.env.OPENAI_API_KEY,
};

// Validate required environment variables
if (!env.OPENAI_API_KEY) {
	console.error('ERROR: OPENAI_API_KEY is not set in environment variables');
	console.error('Please create a .env file with OPENAI_API_KEY=your-key-here');
}
