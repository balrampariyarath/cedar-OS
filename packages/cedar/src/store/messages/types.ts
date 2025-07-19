import type { ReactNode } from 'react';

// Base message type that all messages extend
export interface BaseMessage {
	id: string;
	role: 'user' | 'assistant' | 'system';
	timestamp: Date;
	metadata?: Record<string, unknown>;
}

// Built-in message types
export interface TextMessage extends BaseMessage {
	type: 'text';
	content: string;
}

export interface TypingMessage extends BaseMessage {
	type: 'typing';
	role: 'assistant'; // Only assistants show typing
}

// Default message types - users can extend this
export type DefaultMessageTypes = TextMessage | TypingMessage;

// Allow users to extend message types
export type Message = DefaultMessageTypes | ({ type: string } & BaseMessage);

// Message input types for each message type
export type TextMessageInput = Omit<TextMessage, 'id' | 'timestamp'>;
export type TypingMessageInput = Omit<TypingMessage, 'id' | 'timestamp'>;

// Message input type (without id and timestamp, which are auto-generated)
export type MessageInput =
	| TextMessageInput
	| TypingMessageInput
	| (Omit<BaseMessage, 'id' | 'timestamp'> & {
			type: string;
			[key: string]: unknown;
	  });

// Message renderer function type
export type MessageRenderer = (message: Message) => ReactNode;

// Registry for message renderers
export type MessageRendererRegistry = Record<string, MessageRenderer>;

// Export a type helper for creating custom message types
export type CustomMessage<
	T extends string,
	P extends Record<string, unknown> = Record<string, never>
> = BaseMessage & { type: T } & P;
