import { StateSlice } from '@/store/stateSlice/stateSlice';
import { AgentInputContextSlice } from '@/store/agentInputContext/agentInputContextSlice';
import { ChatSlice } from './chatSlice';
import { StylingConfig, StylingSlice } from './stylingSlice';

/**
 * The main Cedar store type that combines all slices
 */
export interface CedarStore
	extends StylingSlice,
		AgentInputContextSlice,
		ChatSlice,
		StateSlice {}

// Re-export StylingConfig for convenience
export { StylingConfig };
