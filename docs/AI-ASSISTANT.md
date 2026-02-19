# AI Assistant Feature

## Overview

BailuStory includes an integrated AI assistant that helps with novel writing by providing AI-generated content suggestions, character development help, and creative writing assistance. The AI assistant supports multiple AI providers and can be configured to suit your writing style.

## Supported AI Providers

The AI assistant supports the following providers:

### 1. OpenAI
- **Endpoint**: `https://api.openai.com/v1/chat/completions`
- **Default Model**: `gpt-3.5-turbo`
- **Other Models**: `gpt-4`, `gpt-4-turbo`, `gpt-4o`, etc.

### 2. Anthropic (Claude)
- **Endpoint**: `https://api.anthropic.com/v1/messages`
- **Default Model**: `claude-3-sonnet`
- **Other Models**: `claude-3-opus`, `claude-3-haiku`, etc.

### 3. DeepSeek
- **Endpoint**: `https://api.deepseek.com/v1/chat/completions`
- **Default Model**: `deepseek-chat`
- **Other Models**: `deepseek-coder`, etc.
- **Note**: Maximum tokens limited to 8192

### 4. Grok (xAI)
- **Endpoint**: `https://api.x.ai/v1/chat/completions`
- **Default Model**: `grok-beta`
- **Other Models**: Check xAI documentation for available models

### 5. Custom Provider
You can use any OpenAI-compatible API by configuring:
- **Endpoint**: Your custom API endpoint
- **Model Name**: The model name supported by your API
- **API Key**: Your API key

## Configuration Options

### Required Settings
- **Provider**: Choose from OpenAI, Anthropic, DeepSeek, Grok, or Custom
- **API Key**: Your API key from the chosen provider
- **Model Name**: The specific model to use

### Optional Settings
- **Temperature** (0.0 - 2.0, default 0.7)
  - Lower values (0.0 - 0.3): More focused, deterministic responses
  - Higher values (0.7 - 2.0): More creative, diverse responses

- **Max Tokens** (1 - 8000, default 2000)
  - Controls the maximum length of AI responses
  - DeepSeek maximum: 8192 tokens

- **History Limit** (5 - 100, default 20)
  - Number of past messages to include in conversation context
  - More history = better context but higher token usage

## Setup Instructions

### Step 1: Get an API Key

1. Visit your chosen provider's website:
   - OpenAI: https://platform.openai.com/api-keys
   - Anthropic: https://console.anthropic.com/
   - DeepSeek: https://platform.deepseek.com/
   - xAI (Grok): https://console.x.ai/

2. Create an account if needed
3. Generate a new API key
4. Copy the key - you'll need it for configuration

### Step 2: Configure AI Assistant in BailuStory

1. Open BailuStory
2. Click on the AI panel settings button (gear icon)
3. Configure the following:
   - **Provider**: Select your AI provider
   - **API Key**: Paste your API key
   - **Model Name**: Enter the model name (e.g., `gpt-3.5-turbo`)
   - **Temperature**: Adjust as desired (0.7 is recommended)
   - **Max Tokens**: Set maximum response length
   - **History Limit**: Set conversation context size

4. Click "Test Connection" to verify your settings
5. Click "Save" to save your configuration

### Step 3: Start Using AI Assistant

1. Select a chapter in the story view
2. The AI assistant panel will appear on the right side
3. Type your request in the input field
4. Press Enter or click Send
5. Review the AI response
6. Click "插入到编辑器" (Insert to Editor) to add content to your chapter

## Using AI Assistant Effectively

### Writing Prompts

Good prompts for novel writing:

**Character Development:**
```
Help me develop a new character for my story. The character should be mysterious and have a hidden past.
```

**Plot Ideas:**
```
Suggest three plot twists for a mystery novel set in 19th-century London.
```

**Scene Expansion:**
```
Expand this scene with more sensory details and emotional depth: [paste scene text]
```

**Dialogue Improvement:**
```
Improve this dialogue to sound more natural: [paste dialogue]
```

### Best Practices

1. **Be Specific**: The more specific your prompt, the better the response
2. **Provide Context**: Select relevant text before asking the AI for help
3. **Iterate**: Refine your prompts based on previous responses
4. **Review Carefully**: Always review AI-generated content before using it
5. **Use Your Voice**: Edit AI content to match your writing style

### Features

- **Chat History**: Conversation history is saved per chapter
- **Copy to Clipboard**: Copy AI responses for use elsewhere
- **Insert to Editor**: Insert AI content directly into your chapter
- **Retry Failed Requests**: Click retry on error messages
- **Multiple Languages**: AI assistant supports multilingual input/output
- **Dark Theme**: Matches your application theme

## Security Best Practices

1. **Keep API Keys Private**: Never share your API keys
2. **Use Environment Variables**: In production, store keys securely
3. **Rotate Keys Regularly**: Update API keys periodically
4. **Monitor Usage**: Check your provider's dashboard for usage stats
5. **Secure Storage**: API keys are Base64 encoded in localStorage

## Troubleshooting

### Connection Issues

**Problem**: "Connection failed" error
- **Solution**: Check your internet connection
- **Solution**: Verify your API key is correct
- **Solution**: Ensure you have sufficient API quota/credits

### Invalid API Key

**Problem**: "401 Unauthorized" error
- **Solution**: Verify your API key is correct
- **Solution**: Check if the key has been revoked or expired

### Rate Limit

**Problem**: "429 Rate Limit" error
- **Solution**: Wait a few minutes before trying again
- **Solution**: Consider upgrading your API plan

### Timeout

**Problem**: Request times out after 30 seconds
- **Solution**: Try a shorter request
- **Solution**: Reduce max tokens or history limit

### API Key Not Saving

**Problem**: Configuration not saving
- **Solution**: Ensure all required fields are filled
- **Solution**: Check browser localStorage is enabled

## Tips and Tricks

1. **Use Temperature Settings**:
   - Use lower temperature (0.3-0.5) for factual content
   - Use higher temperature (0.8-1.2) for creative writing

2. **Manage History**:
   - Increase history limit for long, complex conversations
   - Decrease history limit to save tokens and reduce costs

3. **Context Awareness**:
   - Select specific paragraphs before asking for help
   - AI assistant will use selected text as context

4. **Multi-language Support**:
   - Write prompts in your preferred language
   - AI will respond in the same language

5. **Cost Management**:
   - Monitor token usage in your provider dashboard
   - Use smaller models for simple tasks
   - Limit history to reduce token consumption

## Advanced Usage

### Custom API Endpoints

For OpenAI-compatible APIs (like local LLMs or other providers):

1. Select "Custom" as the provider
2. Enter your API endpoint URL
3. Enter the model name
4. Provide your API key
5. Test connection

### Integration with Writing Workflow

The AI assistant is most effective when:

- Planning plot structure and character arcs
- Generating ideas when you're stuck
- Expanding scenes with details
- Improving dialogue flow
- Creating descriptive passages

## Limitations

1. **Token Limits**: Each provider has different token limits
2. **Response Quality**: AI responses may need editing
3. **No Internet Search**: AI cannot access current information
4. **Cost**: API usage may incur charges
5. **Availability**: Dependent on provider uptime

## Support

For issues or questions:
- Check the [Troubleshooting](#troubleshooting) section
- Review your provider's documentation
- Check API status pages for service disruptions
- Ensure your browser supports modern features

## Future Enhancements

Planned features for future versions:
- Streaming responses for real-time generation
- Custom prompt templates
- AI-powered style matching
- Integration with character profiles
- Automatic plot consistency checking
