import { useEffect, useCallback } from 'react';
import type { ZodSchema } from 'zod';
import { z } from 'zod/v4';
import { useCedarStore } from '@/store/CedarStore';
import type { BasicStateValue } from '@/store/stateSlice/stateSlice';

/**
 * Hook that registers and returns a piece of state from the Cedar store,
 * working like React's useState but persisting to the global state slice.
 *
 * @param key Unique key for the state in the store.
 * @param initialValue Initial value for the state.
 * @param displayName Optional human-readable name for debugging.
 * @param schema Optional Zod schema for validating the state.
 * @returns [state, setState] tuple.
 */
export function useCedarState<T extends BasicStateValue>(
	key: string,
	initialValue: T,
	displayName?: string,
	schema?: ZodSchema<T>
): [T, (newValue: T) => void] {
	// Register state on first render
	useEffect(() => {
		useCedarStore.getState().registerState({
			key,
			initialValue,
			displayName,
			schema: schema ?? (z.any() as unknown as ZodSchema<T>),
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [key]);

	// Selector for the state value
	const stateValue = useCedarStore(
		(state) => state.registeredStates[key]?.value as T | undefined
	);
	// Fallback to initialValue if for some reason undefined
	const value = stateValue !== undefined ? stateValue : initialValue;

	// Selector for the setter function
	const setState = useCedarStore(
		(state) =>
			state.registeredStates[key]?.setters.setValue.execute as
				| ((newValue: T) => void)
				| undefined
	);

	// Provide a no-op fallback setter if it doesn't exist yet
	const stableSetState = useCallback(
		(newValue: T) => {
			if (setState) {
				setState(newValue);
			}
		},
		[setState]
	);

	return [value, stableSetState];
}
