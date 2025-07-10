import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createChatSlice } from './chatSlice';
import { createStylingSlice } from './stylingSlice';
import { CedarStore } from './types';

// Create the combined store
export const useCedarStore = create<CedarStore>()(
	persist(
		(...a) => ({
			...createStylingSlice(...a),
			...createChatSlice(...a),
		}),
		{
			name: 'cedar-store',
			partialize: (state) => ({
				styling: state.styling,
				// Don't persist messages for now
			}),
		}
	)
);

// Export the set function directly
export const setCedarStore = useCedarStore.setState;

// Export a hook for styling config
export const useStyling = () => ({
	styling: useCedarStore((state) => state.styling),
	setStyling: useCedarStore((state) => state.setStyling),
	toggleDarkMode: useCedarStore((state) => state.toggleDarkMode),
});

// Export a hook for chat input
export const useChatInput = () => ({
	chatInputContent: useCedarStore((state) => state.chatInputContent),
	setChatInputContent: useCedarStore((state) => state.setChatInputContent),
	overrideInputContent: useCedarStore((state) => state.overrideInputContent),
	setOverrideInputContent: useCedarStore(
		(state) => state.setOverrideInputContent
	),
});
