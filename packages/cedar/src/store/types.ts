import { ChatSlice } from './chatSlice';
import { StylingConfig, StylingSlice } from './stylingSlice';

/**
 * The main Cedar store type that combines all slices
 */
export interface CedarStore extends StylingSlice, ChatSlice {}

// Re-export StylingConfig for convenience
export { StylingConfig };
