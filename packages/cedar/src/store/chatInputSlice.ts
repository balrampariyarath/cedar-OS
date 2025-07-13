import { StateCreator } from 'zustand';
import { CedarStore } from './types';
import type { JSONContent } from '@tiptap/core';

export type ChatInput = JSONContent;

// Define the chat input slice
export interface ChatInputSlice {
	// The up-to-date editor JSON content
	chatInputContent: ChatInput | null;
	// Optional manual override content for the editor
	overrideInputContent: { input: string | any[] | null };
	// Actions to update content
	setChatInputContent: (content: ChatInput) => void;
	setOverrideInputContent: (content: string | any[] | null) => void;
}

// Add context management
// Context should be a JSON object that can be used to store information
// There should be a util to format the context into a string to send to the LLM.

// Create the chat input slice
export const createChatInputSlice: StateCreator<
	CedarStore,
	[],
	[],
	ChatInputSlice
> = (set) => {
	return {
		// Default state
		chatInputContent: null,
		overrideInputContent: { input: null },

		// Actions
		setChatInputContent: (content: JSONContent) => {
			set({ chatInputContent: content });
		},

		setOverrideInputContent: (content: string | any[] | null) => {
			set({ overrideInputContent: { input: content } });
		},
	};
};
