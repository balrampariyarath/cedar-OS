# Voice Setup for Product Roadmap Agent

This guide explains how to set up and use voice functionality with the Product Roadmap Agent.

## Prerequisites

1. **OpenAI API Key**: You need an OpenAI API key with access to:
   - Whisper API (for speech-to-text)
   - TTS API (for text-to-speech)

2. **Environment Setup**:

   ```bash
   # Add to your .env file
   OPENAI_API_KEY=your-openai-api-key-here
   ```

3. **Install Dependencies**:
   ```bash
   npm install
   ```

## Voice Endpoints

The agent provides two voice endpoints:

### 1. `/chat/voice` - Full Voice Experience with Transcript

- **Input**: Audio file (WebM format from browser)
- **Output**: JSON response with:
  - `transcription`: The transcribed text from the audio
  - `text`: The agent's response text
  - `usage`: Token usage information
  - `audioData`: Base64 encoded audio response (MP3 format)
  - `audioFormat`: MIME type of the audio (audio/mpeg)
- **Use case**: Complete voice interaction with both audio playback and message history

### 2. `/chat/voice-to-text` - Text Response Only

- **Input**: Audio file (WebM format from browser)
- **Output**: JSON with transcription and text response (no audio data)
- **Use case**: When you only need text output (faster, cheaper, no TTS costs)

## Frontend Integration

The Cedar ChatInput component is already configured to use voice. The mic button will:

1. Request microphone permission (first time only)
2. Record audio when clicked (button turns red)
3. Send audio to the agent when clicked again
4. Play the audio response automatically
5. Add both the user's transcribed message and the agent's response to the chat history

### Message Integration

By default, when using the `/chat/voice` endpoint:

- The user's transcribed audio is automatically added as a user message
- The agent's response is added as an assistant message
- Both messages include metadata indicating they came from voice

You can disable automatic message addition:

```typescript
voice.updateVoiceSettings({
	autoAddToMessages: false,
});
```

### Changing the Endpoint

By default, the voice endpoint is set to `http://localhost:4111/chat/voice`. To change it:

```typescript
// In your component
voice.setVoiceEndpoint('http://localhost:4111/api/chat/voice');
```

### Using Text-Only Mode

To use the text-only endpoint with browser TTS:

```typescript
// Enable browser TTS
voice.updateVoiceSettings({
	useBrowserTTS: true,
	language: 'en-US',
});

// Set the text endpoint
voice.setVoiceEndpoint('http://localhost:4111/api/chat/voice-to-text');
```

## Running the Agent

1. Start the agent:

   ```bash
   npm run dev
   ```

2. The agent will be available at `http://localhost:4111`

3. Voice endpoints:
   - Full voice with transcript: `POST http://localhost:4111/api/chat/voice`
   - Text response only: `POST http://localhost:4111/api/chat/voice-to-text`

## Testing Voice

### Using cURL

Test the voice endpoint:

```bash
# Record audio first (on macOS)
sox -d -r 16000 -c 1 -b 16 test.wav trim 0 5

# Convert to WebM (optional, WAV also works)
ffmpeg -i test.wav -c:a libopus test.webm

# Send to agent
curl -X POST http://localhost:4111/api/chat/voice \
  -F "audio=@test.webm" \
  -H "Accept: application/json"
```

### Expected Response

For `/chat/voice`:

```json
{
	"transcription": "Show me all the features in the roadmap",
	"text": "Here are all the features in the product roadmap:\n\n1. **Zustand Store Integration** (Completed)...",
	"usage": {
		"promptTokens": 123,
		"completionTokens": 456,
		"totalTokens": 579
	},
	"audioData": "SUQzAwAAAAA...", // Base64 encoded MP3 audio
	"audioFormat": "audio/mpeg"
}
```

For `/chat/voice-to-text`:

```json
{
	"transcription": "Show me all the features in the roadmap",
	"text": "Here are all the features in the product roadmap:\n\n1. **Zustand Store Integration** (Completed)...",
	"usage": {
		"promptTokens": 123,
		"completionTokens": 456,
		"totalTokens": 579
	}
}
```

## Voice Settings

The following settings can be configured:

```typescript
voice.updateVoiceSettings({
	language: 'en-US', // Language for transcription
	voiceId: 'alloy', // OpenAI voice ID (alloy, echo, fable, onyx, nova, shimmer)
	pitch: 1.0, // Browser TTS pitch (0.5-2.0)
	rate: 1.0, // Speech rate (0.5-2.0)
	volume: 1.0, // Volume (0.0-1.0)
	useBrowserTTS: false, // Use browser TTS instead of OpenAI
	autoAddToMessages: true, // Automatically add voice interactions to chat history
});
```

## Troubleshooting

### "Cannot find module '@mastra/voice-openai'"

Run `npm install` to install the voice dependencies.

### "Microphone access denied"

- Check browser permissions
- Ensure you're using HTTPS (or localhost)
- Try in an incognito window

### "Voice endpoint returned 404"

- Ensure the agent is running
- Check the endpoint URL matches your agent's port
- Verify CORS is enabled on the agent

### No audio playback

- Check browser console for errors
- Ensure your browser supports Web Audio API
- Try the text-only endpoint first

### Messages not appearing in chat

- Check that `autoAddToMessages` is set to `true` (default)
- Ensure the frontend has access to the messages store
- Check browser console for any errors

## Cost Considerations

- **Whisper API**: ~$0.006 per minute of audio
- **TTS API**: ~$0.015 per 1,000 characters
- **Alternative**: Use `/chat/voice-to-text` with browser TTS for free audio output

## Security Notes

1. Always use HTTPS in production for microphone access
2. Validate audio file size and format on the server
3. Consider rate limiting voice endpoints
4. Store API keys securely in environment variables
