/* eslint-disable @typescript-eslint/no-explicit-any */
import { createStore } from 'zustand/vanilla';
import {
	createBackendConnectionSlice,
	BackendConnectionSlice,
} from '../store/backendConnectionSlice';

// Helper to create a minimal store with the backend slice only
function createTestStore() {
	const store = createStore<BackendConnectionSlice>()((set, get, _store) => ({
		userId: 'testUser',
		productId: 'testProduct',
		currentThreadId: 'thread1',
		// dummy context functions expected by backend slice
		formatStateForCopilot: () => ({}),
		formatStateFunctionsForCopilot: () => ({}),
		// merge backend slice

		...createBackendConnectionSlice(set as any, get as any, _store as any),
	}));
	return store;
}

describe('backendConnectionSlice', () => {
	it('defaults agentType to execution', () => {
		const store = createTestStore();
		expect(store.getState().agentType).toBe('execution');
	});

	it('setAgentType updates the agentType', () => {
		const store = createTestStore();
		store.getState().setAgentType('conversion');
		expect(store.getState().agentType).toBe('conversion');
	});

	it('sendMessage includes agentRequested in body', async () => {
		const store = createTestStore();
		store.getState().setAgentType('conversion');

		global.fetch = jest.fn().mockResolvedValue({
			ok: true,
			json: async () => ({}),
		});

		await store.getState().sendMessage('hello');

		expect(global.fetch).toHaveBeenCalled();
		const callArgs = (global.fetch as jest.Mock).mock.calls[0];
		const body = JSON.parse(callArgs[1].body);
		expect(body.agentRequested).toBe('conversion');
	});
});
