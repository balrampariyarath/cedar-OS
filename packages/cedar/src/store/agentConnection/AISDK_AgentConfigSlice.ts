import type { StateCreator } from 'zustand';
import { generateText, streamText } from 'ai';
import type { CedarStore } from '../types';

export type GenerateTextParams = {
	text: string;
	description?: string;
	model?: string;
	temperature?: number;
	maxTokens?: number;
};

export type GenerateTextResponse = {
	text: string;
};

export type GenerateStructuredDataParams = {
	text: string;
	description?: string;
	schema: unknown;
	model?: string;
	temperature?: number;
	maxTokens?: number;
};

// Types for streaming text
export type StreamTextParams = GenerateTextParams;
export type StreamTextResult = ReturnType<typeof streamText>;

export interface AISDKAgentConfigSlice {
	generateText: (params: GenerateTextParams) => Promise<GenerateTextResponse>;
	generateStructuredData: <T>(
		params: GenerateStructuredDataParams
	) => Promise<T>;
	streamText: (params: StreamTextParams) => StreamTextResult;
}

export const createAISDKAgentConfigSlice: StateCreator<
	CedarStore,
	[],
	[],
	AISDKAgentConfigSlice
> = (set, get) => ({
	generateText: async ({
		text,
		description,
		model = 'gpt-4o-mini',
		temperature = 0.7,
		maxTokens,
	}: GenerateTextParams): Promise<GenerateTextResponse> => {
		const result = await generateText({
			model,
			prompt: text,
			temperature,
			...(maxTokens !== undefined ? { max_tokens: maxTokens } : {}),
			...(description ? { system: description } : {}),
		});
		return { text: result.text };
	},

	generateStructuredData: async <T>({
		text,
		description,
		schema,
		model = 'gpt-4o-mini',
		temperature = 0.7,
		maxTokens,
	}: GenerateStructuredDataParams): Promise<T> => {
		const promptText = description ? `${description}\n${text}` : text;
		const prompt = `Extract and output valid JSON matching the following schema: ${JSON.stringify(
			schema
		)}\n${promptText}`;
		const result = await generateText({
			model,
			prompt,
			temperature,
			...(maxTokens !== undefined ? { max_tokens: maxTokens } : {}),
		});
		try {
			return JSON.parse(result.text) as T;
		} catch (error) {
			throw new Error(`Failed to parse JSON from AI response: ${error}`);
		}
	},

	// Wrapper to stream text
	streamText: ({
		text,
		description,
		model = 'gpt-4o-mini',
		temperature = 0.7,
		maxTokens,
	}: StreamTextParams) => {
		const options: any = {
			model,
			prompt: text,
			temperature,
			...(maxTokens !== undefined ? { max_tokens: maxTokens } : {}),
		};
		if (description) options.system = description;
		return streamText(options);
	},
});
