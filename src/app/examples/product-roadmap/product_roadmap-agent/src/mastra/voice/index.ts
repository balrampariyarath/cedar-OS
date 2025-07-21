import { OpenAIVoice } from '@mastra/voice-openai';
import { Readable } from 'stream';
import type { Context } from 'hono';

// Initialize the voice provider
export const voice = new OpenAIVoice({
	speechModel: {
		apiKey: process.env.OPENAI_API_KEY,
		name: 'tts-1',
	},
	listeningModel: {
		apiKey: process.env.OPENAI_API_KEY,
		name: 'whisper-1',
	},
});

// Voice handler - for audio input/output
export async function handleVoiceMessage(c: Context) {
	try {
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
export async function handleVoiceToText(c: Context) {
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
