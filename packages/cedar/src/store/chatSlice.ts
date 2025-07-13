import { StateCreator } from 'zustand';
import { CedarStore } from './types';

export interface ChatSlice {
	// Action to send the next message text
	nextMessage: (text: string) => void;
}

export const createChatSlice: StateCreator<CedarStore, [], [], ChatSlice> = (
	set,
	get
) => ({
	nextMessage: (text: string) => {
		// Placeholder implementation; replace with actual messaging logic
		console.log('Sending message:', text);
	},
});
