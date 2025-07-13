import { StateSlice } from '@/store/stateSlice/stateSlice';
import { ChatInputSlice } from './chatInputSlice';
import { ChatSlice } from './chatSlice';
import { StylingConfig, StylingSlice } from './stylingSlice';

/**
 * The main Cedar store type that combines all slices
 */
export interface CedarStore
	extends StylingSlice,
		ChatInputSlice,
		ChatSlice,
		StateSlice {}

// Re-export StylingConfig for convenience
export { StylingConfig };
