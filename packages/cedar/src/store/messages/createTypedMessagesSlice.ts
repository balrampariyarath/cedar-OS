import { StateCreator } from 'zustand';
import type {
	BaseMessage,
	DefaultMessage,
	MessageByType,
	MessageRendererConfig,
	MessageRole,
} from './types';

// Typed messages slice interface
export interface TypedMessagesSlice<M extends BaseMessage = DefaultMessage> {
	// State
	messages: M[];
	isProcessing: boolean;
	showChat: boolean;

	// Message renderer registry
	messageRenderers: Map<string, MessageRendererConfig<any>>;

	// Fully typed actions
	addMessage: <T extends M['type']>(
		message: Omit<MessageByType<T, M>, 'id'> & { type: T }
	) => MessageByType<T, M>;

	addMessages: (messages: Array<Omit<M, 'id'>>) => M[];

	updateMessage: <T extends M['type']>(
		id: string,
		updates: Partial<MessageByType<T, M>>
	) => void;

	deleteMessage: (id: string) => void;
	clearMessages: () => void;
	setIsProcessing: (isProcessing: boolean) => void;
	setShowChat: (showChat: boolean) => void;
	setMessages: (messages: M[]) => void;

	// Renderer management
	registerMessageRenderer: <T extends M['type']>(
		config: MessageRendererConfig<MessageByType<T, M>>
	) => void;

	unregisterMessageRenderer: (type: string) => void;
	getMessageRenderer: (type: string) => MessageRendererConfig | undefined;

	// Utility methods
	getMessageById: (id: string) => M | undefined;
	getMessagesByRole: (role: MessageRole) => M[];
}

// Generic typed message slice creator
export function createTypedMessagesSlice<
	M extends BaseMessage = DefaultMessage
>(): StateCreator<any, [], [], TypedMessagesSlice<M>> {
	return (set, get) => ({
		messages: [],
		isProcessing: false,
		showChat: false,
		messageRenderers: new Map(),

		setMessages: (messages: M[]) => set({ messages }),

		setShowChat: (showChat: boolean) => set({ showChat }),

		addMessage: (messageData) => {
			const newMessage = {
				...messageData,
				id: `message-${Date.now()}-${Math.random()
					.toString(36)
					.substring(2, 9)}`,
				createdAt: new Date().toISOString(),
			} as unknown as M;

			set((state: any) => ({
				messages: [...state.messages, newMessage],
			}));

			return newMessage as any;
		},

		addMessages: (messagesData: Array<Omit<M, 'id'>>) => {
			const newMessages = messagesData.map(
				(messageData) =>
					({
						...messageData,
						id: `message-${Date.now()}-${Math.random()
							.toString(36)
							.substring(2, 9)}`,
						createdAt: new Date().toISOString(),
					} as unknown as M)
			);

			set((state: any) => ({
				messages: [...state.messages, ...newMessages],
			}));

			return newMessages;
		},

		updateMessage: (id, updates) => {
			set((state: any) => ({
				messages: state.messages.map((msg: M) =>
					msg.id === id ? { ...msg, ...updates } : msg
				),
			}));
		},

		deleteMessage: (id: string) => {
			set((state: any) => ({
				messages: state.messages.filter((msg: M) => msg.id !== id),
			}));
		},

		clearMessages: () => set({ messages: [] }),

		setIsProcessing: (isProcessing: boolean) => set({ isProcessing }),

		// Renderer management
		registerMessageRenderer: (config) => {
			set((state: any) => {
				const newRenderers = new Map(state.messageRenderers);
				newRenderers.set(config.type, config);
				return { messageRenderers: newRenderers };
			});
		},

		unregisterMessageRenderer: (type: string) => {
			set((state: any) => {
				const newRenderers = new Map(state.messageRenderers);
				newRenderers.delete(type);
				return { messageRenderers: newRenderers };
			});
		},

		getMessageRenderer: (type: string) => {
			return get().messageRenderers.get(type);
		},

		// Utility methods
		getMessageById: (id: string) => {
			return get().messages.find((msg: M) => msg.id === id);
		},

		getMessagesByRole: (role: MessageRole) => {
			return get().messages.filter((msg: M) => msg.role === role);
		},
	});
}
