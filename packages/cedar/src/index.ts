// Export components
export {
	ChatInput,
	ChatInputContainer,
} from '@/components/chatInput/ChatInput';

export { useCedarStore } from '@/store/CedarStore';
export { registerState } from '@/store/CedarStore';
export { createAgentInputContextSlice } from '@/store/agentInputContext/agentInputContextSlice';
export { createChatSlice } from '@/store/chatSlice';
export { createStylingSlice } from '@/store/stylingSlice';

// Export state management
export { useCedarState } from '@/store/stateSlice/useCedarState';
export { useRegisterState } from '@/store/stateSlice/stateSlice';

// Export context management
export {
	subscribeInputContext,
	renderAdditionalContext,
} from '@/store/agentInputContext/agentInputContextSlice';

// Export mention provider functionality
export {
	useMentionProvider,
	useStateBasedMentionProvider,
	useMentionProviders,
	useMentionProvidersByTrigger,
} from '@/store/agentInputContext/mentionProviders';

// Types
export type {
	ContextEntry,
	AdditionalContext,
	MentionItem,
	MentionProvider,
	StateBasedMentionProviderConfig,
} from '@/store/agentInputContext/types';

// Export types
export type { CedarStore, StylingConfig } from '@/store/types';
export type { ChatInput as ChatInputType } from '@/store/agentInputContext/agentInputContextSlice';
export type { ChatSlice } from '@/store/chatSlice';
export type { StylingSlice } from '@/store/stylingSlice';
