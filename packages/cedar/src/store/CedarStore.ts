import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createAgentInputContextSlice } from '@/store/agentInputContext/agentInputContextSlice';
import { createStylingSlice } from './stylingSlice';
import { CedarStore } from './types';
import { createStateSlice } from '@/store/stateSlice/stateSlice';
import { createMessagesSlice } from '@/store/messages/messagesSlice';
import { createAgentConnectionSlice } from '@/store/agentConnection/agentConnectionSlice';

// Create the combined store (default for backwards compatibility)
export const useCedarStore = create<CedarStore>()(
	persist(
		(...a) => ({
			...createStylingSlice(...a),
			...createAgentInputContextSlice(...a),
			...createStateSlice(...a),
			...createMessagesSlice(...a),
			...createAgentConnectionSlice(...a),
		}),
		{
			name: 'cedar-store',
			partialize: (state) => ({
				// 	styling: state.styling,
				// 	agentInputContext: state.agentInputContext,
				// 	state: state.state,
				messages: state.messages,
				// agentConnection: state.agentConnection,
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

// Export registerState function to allow dynamic state registration
export const registerState: CedarStore['registerState'] = (config) =>
	useCedarStore.getState().registerState(config);

// Export getCedarState function for reading state values
export const getCedarState: CedarStore['getCedarState'] = (key) =>
	useCedarStore.getState().getCedarState(key);

// Export setCedarState function for updating state values
export const setCedarState: CedarStore['setCedarState'] = (key, value) =>
	useCedarStore.getState().setCedarState(key, value);

// Export the extensible store creator
export { createCedarStore } from './createCedarStore';
export type { CreateCedarStoreOptions } from './createCedarStore';

// Export the typed messages slice creator
export { createTypedMessagesSlice } from './messages/createTypedMessagesSlice';
export type { TypedMessagesSlice } from './messages/createTypedMessagesSlice';

// Export message types
export type {
	BaseMessage,
	DefaultMessage,
	TypedMessage,
	MessageByType,
	MessageRendererConfig,
} from './messages/types';
