import type { StateCreator } from 'zustand';
import type { CedarStore } from '../types';

export type CallAPIRouteParams = {
	path: string;
	body: unknown;
};

export type CallAPIRouteResponse<T = any> = T;

export interface MastraAgentConfigSlice {
	callAPIRoute: <T = any>(
		params: CallAPIRouteParams
	) => Promise<CallAPIRouteResponse<T>>;
}

type StreamHandlers = {
	onMessage: (chunk: string) => void;
	onDone: () => void;
	onDebug?: (payload: unknown) => void;
};

async function handleEventStream(
	response: Response,
	handlers: StreamHandlers
): Promise<void> {
	if (!response.ok || !response.body) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}

	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let buffer = '';

	const parseEvent = (raw: string) => {
		let eventType = 'message';
		let data = '';
		for (const line of raw.split('\n')) {
			if (line.startsWith('event:')) {
				eventType = line.slice(6).trim();
			} else if (line.startsWith('data:')) {
				data +=
					eventType === 'suggestion' ? line.slice(5) + ' ' : line.slice(5);
			}
		}
		return { eventType, data } as { eventType: string; data: string };
	};

	while (true) {
		const { value, done } = await reader.read();
		if (done) break;
		buffer += decoder.decode(value, { stream: true });

		let idx: number;
		while ((idx = buffer.indexOf('\n\n')) !== -1) {
			const rawEvent = buffer.slice(0, idx);
			buffer = buffer.slice(idx + 2);
			if (!rawEvent.trim()) continue;
			const { eventType, data } = parseEvent(rawEvent);

			if (eventType === 'done') {
				await handlers.onDone();
				return;
			} else {
				handlers.onMessage(data);
			}
		}
	}
}

const MASTRA_BACKEND_URL =
	process.env.NODE_ENV === 'development'
		? 'http://localhost:4113'
		: 'https://modern-lemon-whale.mastra.cloud';

export const createMastraAgentConfigSlice: StateCreator<
	CedarStore,
	[],
	[],
	MastraAgentConfigSlice
> = (set, get) => ({
	callAPIRoute: async <T>({
		path,
		body,
	}: CallAPIRouteParams): Promise<CallAPIRouteResponse<T>> => {
		const url = `${MASTRA_BACKEND_URL}${path}`;
		try {
			const response = await fetch(url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = (await response.json()) as T;
			return data;
		} catch (error) {
			console.error('Error calling API route:', error);
			throw error;
		}
	},
});
