import { Mastra } from '@mastra/core/mastra';
import { LibSQLStore } from '@mastra/libsql';
import { PinoLogger } from '@mastra/loggers';
import { productRoadmapAgent } from './agents/product-roadmap-agent';
import { registerApiRoute } from '@mastra/core/server';
import { z } from 'zod';
import type { Context } from 'hono';
import { OpenAIVoice } from '@mastra/voice-openai';
import { Readable } from 'stream';

// Define the chat request schema for Cedar compatibility
const ChatRequestSchema = z.object({
	prompt: z.string(), // Cedar sends 'prompt' not 'messages'
	model: z.string().optional(),
	temperature: z.number().optional(),
	maxTokens: z.number().optional(),
	systemPrompt: z.string().optional(),
	// For structured output
	output: z.any().optional(),
});

// Initialize the voice provider
const voice = new OpenAIVoice({
	speechModel: {
		apiKey: process.env.OPENAI_API_KEY,
		name: 'tts-1',
	},
	listeningModel: {
		apiKey: process.env.OPENAI_API_KEY,
		name: 'whisper-1',
	},
});

// Chat handler - regular text generation
async function handleChatMessage(c: Context) {
	try {
		const body = await c.req.json();
		const { prompt, temperature, maxTokens, systemPrompt } =
			ChatRequestSchema.parse(body);

		const agent = c.get('mastra').getAgent('productRoadmapAgent');
		if (!agent) {
			return c.json({ error: 'Agent not found' }, 404);
		}

		// Convert prompt to messages format for the agent
		const messages = [
			...(systemPrompt
				? [{ role: 'system' as const, content: systemPrompt }]
				: []),
			{ role: 'user' as const, content: prompt },
		];

		const response = await agent.generate(messages, {
			temperature,
			maxTokens,
		});

		// Return in Cedar's expected format
		return c.json({
			text: response.text, // Cedar expects 'text' field
			usage: response.usage,
		});
	} catch (error) {
		console.error('Chat error:', error);
		return c.json(
			{
				error: error instanceof Error ? error.message : 'Internal server error',
			},
			500
		);
	}
}

// Streaming handler - for real-time responses
async function handleChatMessageStream(c: Context) {
	try {
		const body = await c.req.json();
		const { prompt, temperature, maxTokens, systemPrompt } =
			ChatRequestSchema.parse(body);

		const agent = c.get('mastra').getAgent('productRoadmapAgent');
		if (!agent) {
			return c.json({ error: 'Agent not found' }, 404);
		}

		// Convert prompt to messages format for the agent
		const messages = [
			...(systemPrompt
				? [{ role: 'system' as const, content: systemPrompt }]
				: []),
			{ role: 'user' as const, content: prompt },
		];

		const stream = await agent.stream(messages, {
			temperature,
			maxTokens,
		});

		// Create a TransformStream to convert the agent's stream to SSE format
		const encoder = new TextEncoder();
		const transformStream = new TransformStream({
			async transform(chunk, controller) {
				// Format as Server-Sent Events
				controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
			},
			flush(controller) {
				// Send the done event
				controller.enqueue(encoder.encode(`event: done\ndata: \n\n`));
			},
		});

		// Pipe the text stream through our transform
		const reader = stream.textStream.getReader();
		const writer = transformStream.writable.getWriter();

		(async () => {
			try {
				while (true) {
					const { done, value } = await reader.read();
					if (done) break;
					await writer.write(value);
				}
			} finally {
				await writer.close();
			}
		})();

		return new Response(transformStream.readable, {
			status: 200,
			headers: {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				Connection: 'keep-alive',
			},
		});
	} catch (error) {
		console.error('Stream error:', error);
		return c.json(
			{
				error: error instanceof Error ? error.message : 'Internal server error',
			},
			500
		);
	}
}

// Structured output handler - for JSON responses
async function handleStructuredOutput(c: Context) {
	try {
		const body = await c.req.json();
		const { prompt, temperature, maxTokens, systemPrompt, output } =
			ChatRequestSchema.parse(body);

		const agent = c.get('mastra').getAgent('productRoadmapAgent');
		if (!agent) {
			return c.json({ error: 'Agent not found' }, 404);
		}

		// If no output schema is provided, return an error
		if (!output) {
			return c.json(
				{ error: 'Output schema is required for structured output' },
				400
			);
		}

		// Convert prompt to messages format for the agent
		const messages = [
			...(systemPrompt
				? [{ role: 'system' as const, content: systemPrompt }]
				: []),
			{ role: 'user' as const, content: prompt },
		];

		const response = await agent.generate(messages, {
			temperature,
			maxTokens,
			output, // Pass the schema for structured output
		});

		// The structured output is in response.object when using output schema
		return c.json({
			object: response.object,
			text: response.text, // Also include text for compatibility
			usage: response.usage,
		});
	} catch (error) {
		console.error('Structured output error:', error);
		return c.json(
			{
				error: error instanceof Error ? error.message : 'Internal server error',
			},
			500
		);
	}
}

// Voice handler - for audio input/output
async function handleVoiceMessage(c: Context) {
	try {
		console.log('audioFile', process.env.OPENAI_API_KEY);

		// Parse multipart form data
		const formData = await c.req.formData();
		const audioFile = formData.get('audio') as File;
		const settingsStr = formData.get('settings') as string;

		if (!audioFile) {
			return c.json({ error: 'No audio file provided' }, 400);
		}

		const agent = c.get('mastra').getAgent('productRoadmapAgent');
		if (!agent) {
			return c.json({ error: 'Agent not found' }, 404);
		}

		// Parse voice settings
		const settings = settingsStr ? JSON.parse(settingsStr) : {};

		// Convert audio file to buffer
		const audioBuffer = await audioFile.arrayBuffer();
		const buffer = Buffer.from(audioBuffer);

		// Create a readable stream from the buffer
		const audioStream = Readable.from(buffer);

		// Transcribe audio using OpenAI Whisper
		const transcribedText = await voice.listen(audioStream, {
			filetype: 'webm', // The browser sends WebM format
		});

		console.log('Transcribed text:', transcribedText);

		// Process the text through the agent
		const messages = [{ role: 'user' as const, content: transcribedText }];

		const response = await agent.generate(messages, {
			temperature: 0.7,
			maxTokens: 500,
		});

		console.log('response', response.text);

		// Convert response to speech using OpenAI TTS
		const speechStream = await voice.speak(response.text, {
			voice: settings.voiceId || 'alloy', // Default to 'alloy' voice
			speed: settings.rate || 1.0,
		});

		// Convert stream to buffer for response
		const chunks: Buffer[] = [];
		for await (const chunk of speechStream) {
			chunks.push(Buffer.from(chunk));
		}
		const audioResponse = Buffer.concat(chunks);

		// Return JSON response with audio data, transcription, and text
		return c.json({
			transcription: transcribedText,
			text: response.text,
			usage: response.usage,
			audioData: audioResponse.toString('base64'),
			audioFormat: 'audio/mpeg',
		});
	} catch (error) {
		console.error('Voice error:', error);
		return c.json(
			{
				error: error instanceof Error ? error.message : 'Internal server error',
			},
			500
		);
	}
}

// Voice-to-text handler - returns text response instead of audio
async function handleVoiceToText(c: Context) {
	try {
		// Parse multipart form data
		const formData = await c.req.formData();
		const audioFile = formData.get('audio') as File;

		if (!audioFile) {
			return c.json({ error: 'No audio file provided' }, 400);
		}

		const agent = c.get('mastra').getAgent('productRoadmapAgent');
		if (!agent) {
			return c.json({ error: 'Agent not found' }, 404);
		}

		// Convert audio file to buffer
		const audioBuffer = await audioFile.arrayBuffer();
		const buffer = Buffer.from(audioBuffer);

		// Create a readable stream from the buffer
		const audioStream = Readable.from(buffer);

		// Transcribe audio using OpenAI Whisper
		const transcribedText = await voice.listen(audioStream, {
			filetype: 'webm', // The browser sends WebM format
		});

		console.log('Transcribed text:', transcribedText);

		// Process the text through the agent
		const messages = [{ role: 'user' as const, content: transcribedText }];

		const response = await agent.generate(messages, {
			temperature: 0.7,
			maxTokens: 500,
		});

		console.log('response', response);

		// Return text response
		return c.json({
			transcription: transcribedText,
			text: response.text,
			usage: response.usage,
		});
	} catch (error) {
		console.error('Voice-to-text error:', error);
		return c.json(
			{
				error: error instanceof Error ? error.message : 'Internal server error',
			},
			500
		);
	}
}

// Define API routes before using them
const apiRoutes = [
	registerApiRoute('/chat', {
		method: 'POST',
		handler: handleChatMessage,
		openapi: {
			requestBody: {
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								prompt: {
									type: 'string',
									description: 'The prompt to send to the agent',
								},
								model: {
									type: 'string',
								},
								temperature: {
									type: 'number',
								},
								maxTokens: {
									type: 'number',
								},
								systemPrompt: {
									type: 'string',
								},
								output: {
									type: 'object',
								},
							},
							required: ['prompt'],
						},
					},
				},
			},
		},
	}),
	registerApiRoute('/chat/stream', {
		method: 'POST',
		handler: handleChatMessageStream,
		openapi: {
			requestBody: {
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								prompt: {
									type: 'string',
									description: 'The prompt to send to the agent',
								},
								model: {
									type: 'string',
								},
								temperature: {
									type: 'number',
								},
								maxTokens: {
									type: 'number',
								},
								systemPrompt: {
									type: 'string',
								},
							},
							required: ['prompt'],
						},
					},
				},
			},
		},
	}),
	registerApiRoute('/chat/structured', {
		method: 'POST',
		handler: handleStructuredOutput,
		openapi: {
			requestBody: {
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								prompt: {
									type: 'string',
									description: 'The prompt to send to the agent',
								},
								model: {
									type: 'string',
								},
								temperature: {
									type: 'number',
								},
								maxTokens: {
									type: 'number',
								},
								systemPrompt: {
									type: 'string',
								},
								output: {
									type: 'object',
									description:
										'JSON Schema or Zod schema for structured output',
								},
							},
							required: ['prompt'],
						},
					},
				},
			},
		},
	}),
	registerApiRoute('/chat/voice', {
		method: 'POST',
		handler: handleVoiceMessage,
		openapi: {
			requestBody: {
				content: {
					'multipart/form-data': {
						schema: {
							type: 'object',
							properties: {
								audio: {
									type: 'string',
									format: 'binary',
									description: 'Audio file (WebM, MP3, etc.)',
								},
								settings: {
									type: 'string',
									description: 'JSON string of voice settings',
								},
							},
							required: ['audio'],
						},
					},
				},
			},
			responses: {
				'200': {
					description: 'JSON response with transcription, text, and audio data',
					content: {
						'application/json': {
							schema: {
								type: 'object',
								properties: {
									transcription: {
										type: 'string',
										description: 'The transcribed text from the audio',
									},
									text: {
										type: 'string',
										description: 'The agent response',
									},
									usage: {
										type: 'object',
										description: 'Token usage information',
									},
									audioData: {
										type: 'string',
										description: 'Base64 encoded audio response',
									},
									audioFormat: {
										type: 'string',
										description: 'MIME type of the audio data',
									},
								},
							},
						},
					},
				},
			},
		},
	}),
	registerApiRoute('/chat/voice-to-text', {
		method: 'POST',
		handler: handleVoiceToText,
		openapi: {
			requestBody: {
				content: {
					'multipart/form-data': {
						schema: {
							type: 'object',
							properties: {
								audio: {
									type: 'string',
									format: 'binary',
									description: 'Audio file (WebM, MP3, etc.)',
								},
							},
							required: ['audio'],
						},
					},
				},
			},
			responses: {
				'200': {
					description: 'Text response with transcription',
					content: {
						'application/json': {
							schema: {
								type: 'object',
								properties: {
									transcription: {
										type: 'string',
										description: 'The transcribed text from the audio',
									},
									text: {
										type: 'string',
										description: 'The agent response',
									},
									usage: {
										type: 'object',
										description: 'Token usage information',
									},
								},
							},
						},
					},
				},
			},
		},
	}),
];

export const mastra = new Mastra({
	// workflows: { productRoadmapWorkflow },
	agents: { productRoadmapAgent },
	storage: new LibSQLStore({
		// stores telemetry, evals, ... into memory storage, if it needs to persist, change to file:../mastra.db
		url: ':memory:',
	}),
	server: {
		apiRoutes,
		cors: {
			origin: '*',
			credentials: true,
		},
	},
	logger: new PinoLogger({
		name: 'Mastra',
		level: 'info',
	}),
});
