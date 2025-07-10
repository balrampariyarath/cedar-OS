import { StateCreator } from 'zustand';
import { CedarStore } from './types';

// Define the editor content type
export interface EditorContent {
	type: string;
	content: Array<{
		type: string;
		content?: Array<{
			type: string;
			text?: string;
			marks?: Array<{ type: string }>;
		}>;
	}>;
}

export interface ChatState {
	messages: Array<{ role: 'user' | 'system' | 'assistant'; content: string }>;
	chatInputContent: EditorContent;
	overrideInputContent: { input: string | null } | null;
}

export interface ChatActions {
	nextMessage: (text: string) => void;
	setChatInputContent: (content: EditorContent) => void;
	setOverrideInputContent: (input: string | null) => void;
}

export type ChatSlice = ChatState & ChatActions;

export const createChatSlice: StateCreator<CedarStore, [], [], ChatSlice> = (
	set
) => ({
	// Initial state
	messages: [],
	chatInputContent: {
		type: 'doc',
		content: [{ type: 'paragraph', content: [] }],
	},
	overrideInputContent: null,

	// Actions
	nextMessage: (text: string) =>
		set((state) => ({
			messages: [...state.messages, { role: 'user', content: text }],
		})),

	setChatInputContent: (content: EditorContent) =>
		set(() => ({
			chatInputContent: content,
		})),

	setOverrideInputContent: (input: string | null) =>
		set(() => ({
			overrideInputContent: input ? { input } : null,
		})),
});
