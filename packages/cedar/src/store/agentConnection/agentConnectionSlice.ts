import type { StateCreator } from 'zustand';
import type { CedarStore } from '../types';
import type {
	ProviderConfig,
	LLMResponse,
	StreamResponse,
	StreamHandler,
	InferProviderParams,
	BaseParams,
	OpenAIParams,
	AnthropicParams,
	MastraParams,
	AISDKParams,
	CustomParams,
} from './types';
import { getProviderImplementation } from './providers/index';
import type { TextMessageInput } from '../messages/types';

// Parameters for sending a message
export interface SendMessageParams {
	model?: string;
	systemPrompt?: string;
	route?: string;
	temperature?: number;
	// Optional conversation/thread ID
	conversationId?: string;
}

// Helper type to get params based on provider config
type GetParamsForConfig<T> = T extends { provider: 'openai' }
	? OpenAIParams
	: T extends { provider: 'anthropic' }
	? AnthropicParams
	: T extends { provider: 'mastra' }
	? MastraParams
	: T extends { provider: 'ai-sdk' }
	? AISDKParams
	: T extends { provider: 'custom' }
	? CustomParams
	: BaseParams;

export interface AgentConnectionSlice {
	// State
	isConnected: boolean;
	isStreaming: boolean;
	providerConfig: ProviderConfig | null;
	currentAbortController: AbortController | null;

	// Core methods - properly typed based on current provider config
	callLLM: <T extends ProviderConfig = ProviderConfig>(
		params: T extends ProviderConfig
			? GetParamsForConfig<T>
			: ProviderConfig extends infer U
			? GetParamsForConfig<U>
			: never
	) => Promise<LLMResponse>;

	streamLLM: <T extends ProviderConfig = ProviderConfig>(
		params: T extends ProviderConfig
			? GetParamsForConfig<T>
			: ProviderConfig extends infer U
			? GetParamsForConfig<U>
			: never,
		handler: StreamHandler
	) => StreamResponse;

	// High-level methods that use callLLM/streamLLM
	sendMessage: (params?: SendMessageParams) => Promise<void>;

	// Configuration methods
	setProviderConfig: (config: ProviderConfig) => void;

	// Connection management
	connect: () => Promise<void>;
	disconnect: () => void;

	// Utility methods
	cancelStream: () => void;
}

// Create a typed version of the slice that knows about the provider
export type TypedAgentConnectionSlice<T extends ProviderConfig> = Omit<
	AgentConnectionSlice,
	'callLLM' | 'streamLLM'
> & {
	callLLM: (params: GetParamsForConfig<T>) => Promise<LLMResponse>;
	streamLLM: (
		params: GetParamsForConfig<T>,
		handler: StreamHandler
	) => StreamResponse;
};

export const createAgentConnectionSlice: StateCreator<
	CedarStore,
	[],
	[],
	AgentConnectionSlice
> = (set, get) => ({
	// Default state
	isConnected: false,
	isStreaming: false,
	providerConfig: null,
	currentAbortController: null,

	// Core methods with runtime type checking
	callLLM: async (params: any) => {
		const config = get().providerConfig;
		if (!config) {
			throw new Error('No LLM provider configured');
		}

		// Runtime validation based on provider type
		switch (config.provider) {
			case 'openai':
			case 'anthropic':
				if (!('model' in params)) {
					throw new Error(
						`${config.provider} provider requires 'model' parameter`
					);
				}
				break;
			case 'mastra':
				if (!('route' in params)) {
					throw new Error("Mastra provider requires 'route' parameter");
				}
				break;
			case 'ai-sdk':
				if (!('model' in params)) {
					throw new Error("AI SDK provider requires 'model' parameter");
				}
				break;
		}

		const provider = getProviderImplementation(config);
		// Type assertion is safe after runtime validation
		return provider.callLLM(params as any, config as any);
	},

	streamLLM: (params: any, handler: StreamHandler) => {
		const config = get().providerConfig;
		if (!config) {
			throw new Error('No LLM provider configured');
		}

		// Runtime validation based on provider type
		switch (config.provider) {
			case 'openai':
			case 'anthropic':
				if (!('model' in params)) {
					throw new Error(
						`${config.provider} provider requires 'model' parameter`
					);
				}
				break;
			case 'mastra':
				if (!('route' in params)) {
					throw new Error("Mastra provider requires 'route' parameter");
				}
				break;
			case 'ai-sdk':
				if (!('model' in params)) {
					throw new Error("AI SDK provider requires 'model' parameter");
				}
				break;
		}

		const provider = getProviderImplementation(config);
		const abortController = new AbortController();

		set({ currentAbortController: abortController, isStreaming: true });

		// Wrap the provider's streamLLM to handle state updates
		// Type assertion is safe after runtime validation
		const originalResponse = provider.streamLLM(
			params as any,
			config as any,
			handler
		);

		// Wrap the completion to update state when done
		const wrappedCompletion = originalResponse.completion.finally(() => {
			set({ isStreaming: false, currentAbortController: null });
		});

		return {
			abort: () => {
				originalResponse.abort();
				abortController.abort();
			},
			completion: wrappedCompletion,
		};
	},

	// High-level sendMessage method that demonstrates flexible usage
	sendMessage: async (params?: SendMessageParams) => {
		const { model, systemPrompt, route, temperature } = params || {};
		const state = get();

		// Set processing state
		state.setIsProcessing(true);

		try {
			// Step 1: Get the stringified chatInput & additionalContext
			const editorContent = state.stringifyEditor();
			const fullContext = state.stringifyInputContext();

			// Step 2: Unify it into a single string to send to the LLM
			const unifiedMessage = fullContext;

			// Step 3: Add the stringified chatInputContent as a message from the user
			state.addMessage({
				role: 'user',
				type: 'text',
				content: editorContent,
			} as TextMessageInput);

			// Clear the chat specific contextEntries (mentions)
			state.clearMentions();

			// Step 4: Build params based on provider type
			const config = state.providerConfig;
			if (!config) {
				throw new Error('No provider configured');
			}

			let llmParams: BaseParams = {
				prompt: unifiedMessage,
				systemPrompt,
				temperature,
			};

			// Add provider-specific params
			switch (config.provider) {
				case 'openai':
				case 'anthropic':
					llmParams = { ...llmParams, model: model || 'gpt-4o-mini' };
					break;
				case 'mastra':
					llmParams = { ...llmParams, route: route || '/chat' };
					break;
				case 'ai-sdk':
					llmParams = { ...llmParams, model: model || 'gpt-4' };
					break;
			}

			// Step 5: Make the LLM call
			const response = await state.callLLM(llmParams);

			// Step 6: Add the response as an assistant message
			state.addMessage({
				role: 'assistant',
				type: 'text',
				content: response.content,
			} as TextMessageInput);

			// Clear the chat input content after successful send
			state.setChatInputContent({
				type: 'doc',
				content: [{ type: 'paragraph', content: [] }],
			});
		} catch (error) {
			console.error('Error sending message:', error);
			state.addMessage({
				role: 'assistant',
				type: 'text',
				content: 'An error occurred while sending your message.',
			} as TextMessageInput);
		} finally {
			state.setIsProcessing(false);
		}
	},

	// Configuration methods
	setProviderConfig: (config) => set({ providerConfig: config }),

	// Connection management
	connect: async () => {
		// Provider-specific connection logic can be added here
		set({ isConnected: true });
	},

	disconnect: () => {
		const state = get();
		state.cancelStream();
		set({ isConnected: false });
	},

	// Utility methods
	cancelStream: () => {
		const { currentAbortController } = get();
		if (currentAbortController) {
			currentAbortController.abort();
		}
	},
});
