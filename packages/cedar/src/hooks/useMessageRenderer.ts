import React, { useEffect } from 'react';
import { useCedarStore } from '@/store/CedarStore';
import type {
	BaseMessage,
	MessageRendererConfig,
} from '@/store/messages/types';

/**
 * Hook to register a message renderer with the Cedar store
 * @param config - The message renderer configuration
 */
export function useMessageRenderer<T extends BaseMessage = BaseMessage>(
	config: MessageRendererConfig<T>
) {
	const registerMessageRenderer = useCedarStore(
		(s) => s.registerMessageRenderer
	);
	const unregisterMessageRenderer = useCedarStore(
		(s) => s.unregisterMessageRenderer
	);

	useEffect(() => {
		// Register the renderer
		// Wrap the component to match the MessageRenderer signature
		const renderer = (message: any) => {
			const Component = config.renderer;
			return React.createElement(Component, { message });
		};
		registerMessageRenderer(config.type, renderer);

		// Cleanup on unmount
		return () => {
			unregisterMessageRenderer(config.type);
		};
	}, [
		config.type,
		config.renderer,
		registerMessageRenderer,
		unregisterMessageRenderer,
	]);
}

/**
 * Hook to register multiple message renderers at once
 * @param configs - Array of message renderer configurations
 */
export function useMessageRenderers(configs: MessageRendererConfig<any>[]) {
	const registerMessageRenderer = useCedarStore(
		(s) => s.registerMessageRenderer
	);
	const unregisterMessageRenderer = useCedarStore(
		(s) => s.unregisterMessageRenderer
	);

	useEffect(() => {
		// Register all renderers
		configs.forEach((config) => {
			// Wrap the component to match the MessageRenderer signature
			const renderer = (message: any) => {
				const Component = config.renderer;
				return React.createElement(Component, { message });
			};
			registerMessageRenderer(config.type, renderer);
		});

		// Cleanup on unmount
		return () => {
			configs.forEach((config) => {
				unregisterMessageRenderer(config.type);
			});
		};
	}, [configs, registerMessageRenderer, unregisterMessageRenderer]);
}
