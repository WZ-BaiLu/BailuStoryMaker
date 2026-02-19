## ADDED Requirements

### Requirement: Support Multiple AI Providers

The system SHALL support multiple AI providers through a unified interface.

#### Scenario: Use OpenAI provider
- **WHEN** user configures AI with provider "openai"
- **THEN** system SHALL use OpenAI API endpoint
- **AND** system SHALL send requests in OpenAI chat completions format

#### Scenario: Use Anthropic provider
- **WHEN** user configures AI with provider "anthropic"
- **THEN** system SHALL use Anthropic API endpoint
- **AND** system SHALL send requests in Anthropic messages format

#### Scenario: Use custom provider
- **WHEN** user configures AI with provider "custom"
- **THEN** system SHALL use the custom endpoint URL provided by user
- **AND** system SHALL send requests in OpenAI-compatible format

---

### Requirement: Send Chat Completion Request

The system SHALL send chat completion requests to the configured AI provider.

#### Scenario: Send request with user message
- **WHEN** user sends a message to AI
- **THEN** system SHALL construct a request with the user message
- **AND** system SHALL include conversation history if available
- **AND** system SHALL send the request to the AI provider endpoint

#### Scenario: Send request with custom parameters
- **WHEN** user sends a message with custom parameters (temperature, maxTokens)
- **THEN** system SHALL include those parameters in the request

#### Scenario: Include context in request
- **WHEN** user sends a message and context is available (current chapter content)
- **THEN** system SHALL include the context in the request as a system message or part of the conversation

---

### Requirement: Handle AI Response

The system SHALL process and return the AI response in a standardized format.

#### Scenario: Parse successful response
- **WHEN** AI provider returns a successful response
- **THEN** system SHALL extract the message content
- **AND** system SHALL return the content in a standardized format

#### Scenario: Handle streaming response (future)
- **WHEN** AI provider returns streaming response (if implemented in future)
- **THEN** system SHALL accumulate the stream chunks
- **AND** system SHALL return the complete content when stream ends

#### Scenario: Return error on failed response
- **WHEN** AI provider returns an error response
- **THEN** system SHALL extract the error information
- **AND** system SHALL return an error object with status code and message

---

### Requirement: Validate AI Configuration

The system SHALL validate the AI configuration before sending requests.

#### Scenario: Validate API key presence
- **WHEN** user attempts to send a message without API key configured
- **THEN** system SHALL reject the request
- **AND** system SHALL return an error indicating API key is required

#### Scenario: Validate endpoint format
- **WHEN** user provides an invalid endpoint URL
- **THEN** system SHALL reject the configuration
- **AND** system SHALL return an error indicating invalid URL format

#### Scenario: Validate parameter ranges
- **WHEN** user provides invalid parameters (e.g., temperature > 2)
- **THEN** system SHALL reject the configuration
- **AND** system SHALL return an error indicating invalid parameter range

---

### Requirement: Test Connection

The system SHALL provide a method to test the AI connection before using it.

#### Scenario: Successful connection test
- **WHEN** user clicks "Test Connection" in configuration modal
- **THEN** system SHALL send a simple test request to the AI provider
- **AND** system SHALL display a success message if the request succeeds

#### Scenario: Failed connection test
- **WHEN** the test request fails
- **THEN** system SHALL display the error message
- **AND** system SHALL indicate what went wrong (e.g., invalid API key, network error)

---

### Requirement: Request Timeout

The system SHALL implement a timeout for AI requests to prevent indefinite waiting.

#### Scenario: Timeout after 30 seconds
- **WHEN** AI request does not receive a response within 30 seconds
- **THEN** system SHALL cancel the request
- **AND** system SHALL return a timeout error to the user

---

### Requirement: Error Handling

The system SHALL handle various error scenarios and provide meaningful error messages.

#### Scenario: Handle unauthorized error (401)
- **WHEN** API returns 401 Unauthorized
- **THEN** system SHALL return an error indicating invalid API key
- **AND** error message SHALL suggest checking the API Key configuration

#### Scenario: Handle rate limit error (429)
- **WHEN** API returns 429 Too Many Requests
- **THEN** system SHALL return an error indicating rate limit exceeded
- **AND** error message SHALL suggest trying again later

#### Scenario: Handle server error (5xx)
- **WHEN** API returns a server error (500, 502, 503, etc.)
- **THEN** system SHALL return an error indicating server is unavailable
- **AND** error message SHALL suggest retrying later

#### Scenario: Handle network error
- **WHEN** network request fails (e.g., no internet, DNS error)
- **THEN** system SHALL return an error indicating network connection failed
- **AND** error message SHALL suggest checking network connection

---

### Requirement: Request Retry Logic

The system SHALL provide retry capability for transient errors.

#### Scenario: Retry network error
- **WHEN** request fails with network error and user clicks "Retry"
- **THEN** system SHALL resend the request with the same parameters

#### Scenario: Retry timeout error
- **WHEN** request times out and user clicks "Retry"
- **THEN** system SHALL resend the request

#### Scenario: No retry for client errors
- **WHEN** request fails with client error (4xx)
- **THEN** system SHALL NOT offer retry option
- **AND** user SHALL fix the configuration issue before retrying

---

### Requirement: Build Request for OpenAI Provider

The system SHALL build requests in the correct format for OpenAI API.

#### Scenario: Build OpenAI chat completion request
- **WHEN** using OpenAI provider
- **THEN** system SHALL build request with fields:
  - `model`: configured model name
  - `messages`: array of message objects with role and content
  - `temperature`: configured temperature (0-2)
  - `max_tokens`: configured max tokens

#### Scenario: Add authorization header
- **WHEN** sending request to OpenAI
- **THEN** system SHALL add Authorization header with "Bearer {apiKey}"

---

### Requirement: Build Request for Anthropic Provider

The system SHALL build requests in the correct format for Anthropic API.

#### Scenario: Build Anthropic messages request
- **WHEN** using Anthropic provider
- **THEN** system SHALL build request with fields:
  - `model`: configured model name
  - `messages`: array of message objects with role and content
  - `max_tokens`: configured max tokens (required)
  - `temperature`: configured temperature (optional)

#### Scenario: Add Anthropic API key header
- **WHEN** sending request to Anthropic
- **THEN** system SHALL add x-api-key header with the API key

---

### Requirement: Parse OpenAI Response

The system SHALL correctly parse responses from OpenAI API.

#### Scenario: Parse successful OpenAI response
- **WHEN** OpenAI returns a successful response
- **THEN** system SHALL extract content from response.choices[0].message.content
- **AND** system SHALL return the extracted content

#### Scenario: Parse OpenAI error response
- **WHEN** OpenAI returns an error
- **THEN** system SHALL extract error from response.error
- **AND** system SHALL return the error with type and message

---

### Requirement: Parse Anthropic Response

The system SHALL correctly parse responses from Anthropic API.

#### Scenario: Parse successful Anthropic response
- **WHEN** Anthropic returns a successful response
- **THEN** system SHALL extract content from response.content[0].text
- **AND** system SHALL return the extracted content

#### Scenario: Parse Anthropic error response
- **WHEN** Anthropic returns an error
- **THEN** system SHALL extract error from response.error
- **AND** system SHALL return the error with type and message

---

### Requirement: Message History Management

The system SHALL manage message history for context in AI requests.

#### Scenario: Include recent messages in request
- **WHEN** sending a request
- **THEN** system SHALL include recent messages from the conversation history
- **AND** system SHALL limit the number of messages based on configuration (default 20)

#### Scenario: Add system message for context
- **WHEN** context is available (e.g., current chapter content)
- **THEN** system SHALL add a system message to provide context to the AI
- **AND** system SHALL format the context in a helpful way

#### Scenario: Respect token limits
- **WHEN** message history would exceed token limits
- **THEN** system SHALL truncate older messages to fit within limits
- **AND** system SHALL always include the most recent messages

---

### Requirement: Provider-Specific Configuration Validation

The system SHALL validate configuration based on the selected provider.

#### Scenario: Validate OpenAI configuration
- **WHEN** user saves OpenAI provider configuration
- **THEN** system SHALL validate that API key is present
- **AND** system SHALL validate that model name is not empty

#### Scenario: Validate Anthropic configuration
- **WHEN** user saves Anthropic provider configuration
- **THEN** system SHALL validate that API key is present
- **AND** system SHALL validate that model name is not empty

#### Scenario: Validate custom provider configuration
- **WHEN** user saves custom provider configuration
- **THEN** system SHALL validate that API key is present
- **AND** system SHALL validate that endpoint URL is a valid HTTP/HTTPS URL
