import type {
	AISDKParams,
	ProviderImplementation,
	InferProviderConfig,
} from '../types';
import { generateText, streamText, type LanguageModel } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createMistral } from '@ai-sdk/mistral';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createGroq } from '@ai-sdk/groq';

type AISDKConfig = InferProviderConfig<'ai-sdk'>;

// Direct mapping of provider names to their implementations
const providerImplementations = {
	openai: (apiKey: string) => createOpenAI({ apiKey }),
	anthropic: (apiKey: string) => createAnthropic({ apiKey }),
	google: (apiKey: string) => createGoogleGenerativeAI({ apiKey }),
	mistral: (apiKey: string) => createMistral({ apiKey }),
	groq: (apiKey: string) => createGroq({ apiKey }),
} as const;

export const aiSDKProvider: ProviderImplementation<AISDKParams, AISDKConfig> = {
	callLLM: async (params, config) => {
		const { model, prompt, systemPrompt, temperature, ...rest } = params;

		const modelConfig = config.models[model];
		if (!modelConfig) {
			throw new Error(`Model ${model} not configured`);
		}

		// Get the provider implementation directly from the map
		const getProvider =
			providerImplementations[
				modelConfig.provider as keyof typeof providerImplementations
			];
		if (!getProvider) {
			throw new Error(`Provider ${modelConfig.provider} not supported`);
		}

		const provider = getProvider(modelConfig.apiKey);

		// For Google, we need to handle the model name differently
		const modelName =
			modelConfig.provider === 'google'
				? model.replace('gemini-', '') // Google SDK expects model without 'gemini-' prefix
				: model;

		// Get the model instance - cast to LanguageModel (V2)
		const modelInstance = provider(modelName) as LanguageModel;

		const result = await generateText({
			model: modelInstance,
			prompt,
			system: systemPrompt,
			temperature,
			maxRetries: 3,
			...rest,
		});

		return {
			content: result.text,
			usage: result.usage
				? {
						promptTokens:
							(result.usage as { promptTokens?: number }).promptTokens || 0,
						completionTokens:
							(result.usage as { completionTokens?: number })
								.completionTokens || 0,
						totalTokens: result.usage.totalTokens || 0,
				  }
				: undefined,
			metadata: {
				model,
				finishReason: result.finishReason,
			},
		};
	},

	streamLLM: (params, config, handler) => {
		const abortController = new AbortController();

		const completion = (async () => {
			try {
				const { model, prompt, systemPrompt, temperature, ...rest } = params;

				const modelConfig = config.models[model];
				if (!modelConfig) {
					throw new Error(`Model ${model} not configured`);
				}

				// Get the provider implementation directly from the map
				const getProvider =
					providerImplementations[
						modelConfig.provider as keyof typeof providerImplementations
					];
				if (!getProvider) {
					throw new Error(`Provider ${modelConfig.provider} not supported`);
				}

				const provider = getProvider(modelConfig.apiKey);

				// For Google, we need to handle the model name differently
				const modelName =
					modelConfig.provider === 'google'
						? model.replace('gemini-', '') // Google SDK expects model without 'gemini-' prefix
						: model;

				// Get the model instance - cast to LanguageModel (V2)
				const modelInstance = provider(modelName) as LanguageModel;

				const result = await streamText({
					model: modelInstance,
					prompt,
					system: systemPrompt,
					temperature,
					maxRetries: 3,
					abortSignal: abortController.signal,
					...rest,
				});

				for await (const chunk of result.textStream) {
					handler({ type: 'chunk', content: chunk });
				}

				handler({ type: 'done' });
			} catch (error) {
				if (error instanceof Error && error.name !== 'AbortError') {
					handler({ type: 'error', error });
				}
			}
		})();

		return {
			abort: () => abortController.abort(),
			completion,
		};
	},

	handleResponse: async (response) => {
		// AI SDK handles responses internally, this is for custom implementations
		const data = await response.json();
		return {
			content: data.text || '',
			usage: data.usage,
			metadata: data.metadata,
		};
	},

	handleStreamResponse: (chunk) => {
		// AI SDK handles streaming internally
		return { type: 'chunk', content: chunk };
	},
};
