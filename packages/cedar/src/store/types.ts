import { StateSlice } from '@/store/stateSlice/stateSlice';
import { AgentInputContextSlice } from '@/store/agentInputContext/agentInputContextSlice';
import { StylingConfig, StylingSlice } from './stylingSlice';
import { MessagesSlice } from './messages/messagesSlice';
import { AgentConnectionSlice } from './agentConnection/agentConnectionSlice';
import { VoiceSlice } from './voice/voiceSlice';

/**
 * The main Cedar store type that combines all slices
 */
export interface CedarStore
	extends StylingSlice,
		AgentInputContextSlice,
		StateSlice,
		MessagesSlice,
		AgentConnectionSlice,
		VoiceSlice {}

// Re-export StylingConfig for convenience
export { StylingConfig };
