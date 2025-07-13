import { StateCreator } from 'zustand';
import { CedarStore } from '@/store/types';
import type { ZodSchema } from 'zod';
import { z } from 'zod/v4';

// Define types that our state values can be
export type BasicStateValue =
	| string
	| number
	| boolean
	| object
	| unknown[]
	| undefined
	| void;

type ValueTypeString<T> = T extends string
	? 'string'
	: T extends number
	? 'number'
	: T extends boolean
	? 'boolean'
	: T extends unknown[]
	? 'array'
	: T extends undefined
	? 'undefined'
	: T extends void
	? 'void'
	: T extends object
	? 'object'
	: 'object'; // fallback

// Setter types
export interface SetterParameter {
	name: string;
	type: string;
	description: string;
	optional?: boolean;
}

// Define a flexible type for setter functions
export type SetterFunction<T = BasicStateValue> = (newValue: T) => void;

// Setter object that includes both metadata and execution function
export interface Setter<T = BasicStateValue> {
	name: string;
	description: string;
	parameters?: SetterParameter[];
	execute: SetterFunction<T>;
}

// Interface for a single registered state object
export interface registeredState<T = BasicStateValue> {
	key: string;
	value: T;
	valueType: ValueTypeString<T>;
	displayName?: string;
	schema: ZodSchema<T>;
	setters: Record<string, Setter<T>>;
}

// Define the registered state slice
export interface StateSlice {
	// State
	registeredStates: Record<string, registeredState<any>>;

	// Actions
	registerState: <T extends BasicStateValue>(config: {
		key: string;
		initialValue: T;
		displayName?: string;
		schema: ZodSchema<T>;
		// If custom setters is not specified, and default setter is null, this state is view only.
		customSetters?: Record<string, Setter<T>>;
		defaultSetter?: SetterFunction<T> | null; // Accept a setter function directly. Set to null to have no default setter (can still use custom setters). If not set, Cedar will do state management and generate a default setter.
	}) => void;
	getState: (key: string) => registeredState<any> | undefined;

	// Method to add custom setters to an existing state
	addCustomSetters: (
		key: string,
		setters: Record<string, Setter<any>>
	) => boolean;
	/** Retrieves the stored value for a given state key */
	getCedarState: (key: string) => BasicStateValue | undefined;
}

// Create the registered state slice
export const createStateSlice: StateCreator<CedarStore, [], [], StateSlice> = (
	set,
	get
) => {
	return {
		// Default state
		registeredStates: {},

		// Register a new state or replace an existing one
		registerState: <T extends BasicStateValue>(config: {
			key: string;
			initialValue: T;
			displayName?: string;
			schema: ZodSchema<T>;
			customSetters?: Record<string, Setter<T>>;
			defaultSetter?: SetterFunction<T> | null;
		}) => {
			set((state) => {
				const valueType = inferValueType(config.initialValue);

				function inferValueType<T>(value: T): ValueTypeString<T> {
					if (value === undefined || value === null)
						return 'void' as ValueTypeString<T>;
					if (Array.isArray(value)) return 'array' as ValueTypeString<T>;
					const type = typeof value;
					if (
						type === 'string' ||
						type === 'number' ||
						type === 'boolean' ||
						type === 'object' ||
						type === 'undefined'
					)
						return type as ValueTypeString<T>;
					return 'object' as ValueTypeString<T>;
				}
				// Create the default setter
				const createDefaultSetter = (): Setter<T> => {
					return {
						name: 'setValue', // Fixed name for default setter
						description: `Set the entire value of ${
							config.displayName || config.key
						}`,
						parameters: [
							{
								name: 'newValue',
								type: valueType,
								description: `New value to set for ${
									config.displayName || config.key
								}`,
							},
						],
						execute:
							config.defaultSetter ||
							function (newValue: T) {
								// Type checking
								const newValueType = Array.isArray(newValue)
									? 'array'
									: typeof newValue;
								if (newValueType !== valueType) {
									console.error(
										`Type mismatch: Expected ${valueType}, got ${newValueType}`
									);
									return;
								}

								// Update state
								set((state) => ({
									registeredStates: {
										...state.registeredStates,
										[config.key]: {
											...state.registeredStates[config.key],
											value: newValue,
										},
									},
								}));
							},
					};
				};

				// Check if we have a placeholder state already
				const existingState = state.registeredStates[config.key];

				// Combine custom setters with default setter
				const finalSetters: Record<string, Setter<T>> = {
					...(existingState?.setters || {}), // Keep existing setters if we have a placeholder
					...(config.customSetters || {}),
				};

				// Add default setter unless explicitly set to null
				if (config.defaultSetter !== null) {
					finalSetters['setValue'] = createDefaultSetter();
				}

				// Create the state object
				const registeredState: registeredState<T> = {
					key: config.key,
					value: config.initialValue,
					valueType,
					displayName: config.displayName,
					schema: config.schema,
					setters: finalSetters,
				};

				// Return updated state with the new/replaced registered state
				return {
					registeredStates: {
						...state.registeredStates,
						[config.key]: registeredState,
					},
				};
			});
		},

		getState: (key: string): registeredState<any> | undefined => {
			return get().registeredStates[key];
		},
		/** Retrieves the stored value for a given state key */
		getCedarState: (key: string) => {
			const record = get().registeredStates[key];
			return record?.value;
		},

		// Add custom setters to an existing state
		addCustomSetters: (
			key: string,
			setters: Record<string, Setter<any>>
		): boolean => {
			const existingState = get().registeredStates[key];

			if (!existingState) {
				// Create a placeholder state with the setters
				// We use empty/default values that will be properly set when registerState is called
				console.info(
					`Creating placeholder state for "${key}" with custom setters`
				);
				set((state) => ({
					registeredStates: {
						...state.registeredStates,
						[key]: {
							key: key,
							value: '', // Default empty value
							valueType: 'string', // Default type
							schema: z.any() as unknown as ZodSchema<any>,
							setters: { ...setters },
						},
					},
				}));
				return true;
			}

			set((state) => ({
				registeredStates: {
					...state.registeredStates,
					[key]: {
						...state.registeredStates[key],
						// Merge existing setters with new ones
						setters: {
							...state.registeredStates[key].setters,
							...setters,
						},
					},
				},
			}));

			return true;
		},
	};
};

function isregisteredState<T>(value: unknown): value is registeredState<T> {
	return (
		typeof value === 'object' &&
		value !== null &&
		'value' in value &&
		'key' in value &&
		'valueType' in value &&
		'setters' in value &&
		'schema' in value
	);
}
