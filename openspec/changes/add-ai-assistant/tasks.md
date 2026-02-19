## 1. Project Setup

- [x] 1.1 Create CSS file `css/ai-assistant.css` for AI assistant panel styling
- [x] 1.2 Create directory structure for AI components if needed
- [x] 1.3 Add CSS import to `index.html` for AI assistant stylesheet

## 2. AI Configuration Manager

- [x] 2.1 Create `js/managers/AIConfigManager.js` class
- [x] 2.2 Implement `loadConfig()` method to load from localStorage
- [x] 2.3 Implement `saveConfig(config)` method to save to localStorage
- [x] 2.4 Implement `validateConfig(config)` method to validate all fields
- [x] 2.5 Implement `encodeApiKey(apiKey)` method for Base64 encoding
- [x] 2.6 Implement `decodeApiKey(encodedKey)` method for Base64 decoding
- [x] 2.7 Implement `getDefaultConfig()` method returning default values
- [x] 2.8 Add configuration change event notification support
- [ ] 2.9 Create `tests/managers/AIConfigManager.test.js` with unit tests
- [ ] 2.10 Ensure test coverage ≥ 80% for AIConfigManager

## 3. AI Service

- [x] 3.1 Create `js/services/AIService.js` class
- [x] 3.2 Implement `chat(config, messages)` method for sending requests
- [x] 3.3 Create `OpenAIAdapter` class with `buildRequest()` and `parseResponse()`
- [x] 3.4 Create `AnthropicAdapter` class with `buildRequest()` and `parseResponse()`
- [x] 3.5 Create `CustomAdapter` class with `buildRequest()` and `parseResponse()`
- [x] 3.6 Implement adapter factory method `getAdapter(provider)`
- [x] 3.7 Implement `validateConfig(config)` method for service-level validation
- [x] 3.8 Implement `testConnection(config)` method for connection testing
- [x] 3.9 Implement timeout handling (30 seconds default)
- [x] 3.10 Implement error handling for 401, 429, 5xx, network errors
- [ ] 3.11 Implement retry logic for transient errors
- [x] 3.12 Implement message history management with context inclusion
- [ ] 3.13 Create `tests/services/AIService.test.js` with unit tests
- [ ] 3.14 Mock fetch API in tests for each adapter
- [ ] 3.15 Ensure test coverage ≥ 80% for AIService

## 4. AI Manager

- [x] 4.1 Create `js/managers/AIManager.js` class
- [x] 4.2 Implement `initialize()` method to load config and bind events
- [x] 4.3 Implement `showPanel()` method to display AI panel
- [x] 4.4 Implement `hidePanel()` method to hide AI panel
- [x] 4.5 Implement `togglePanel()` method to toggle panel visibility
- [x] 4.6 Implement `sendMessage(message)` method to send user message
- [x] 4.7 Implement `displayMessage(message, role)` method to render messages
- [x] 4.8 Implement `showLoadingIndicator()` method
- [x] 4.9 Implement `hideLoadingIndicator()` method
- [x] 4.10 Implement `showError(error)` method to display errors in chat
- [x] 4.11 Implement `insertToEditor(content)` method for inserting AI content
- [x] 4.12 Implement `loadHistory(chapterId)` method to load chat history
- [x] 4.13 Implement `saveHistory(chapterId, messages)` method to save chat history
- [x] 4.14 Implement `clearHistory()` method to clear current chapter history
- [x] 4.15 Implement `adjustPanelWidth(width)` method for resize handling
- [x] 4.16 Implement `collapsePanel()` method
- [x] 4.17 Implement `expandPanel()` method
- [x] 4.18 Implement `copyToClipboard(text)` method for copying AI responses
- [x] 4.19 Implement `autoScrollToBottom()` method
- [x] 4.20 Implement `updateCharacterCounter()` method
- [ ] 4.21 Create `tests/managers/AIManager.test.js` with unit tests
- [ ] 4.22 Mock DOM elements and event listeners in tests
- [ ] 4.23 Ensure test coverage ≥ 80% for AIManager

## 5. HTML Structure

- [x] 5.1 Add AI assistant panel HTML structure to `index.html` in chapter editor section
- [x] 5.2 Add AI configuration modal HTML structure to `index.html`
- [x] 5.3 Add mobile bottom button for AI panel to `index.html`
- [x] 5.4 Add drawer overlay and backdrop elements for mobile mode
- [x] 5.5 Add template elements for AI messages (user and assistant)
- [x] 5.6 Add template elements for loading indicator
- [x] 5.7 Add template elements for error messages
- [x] 5.8 Add template elements for action buttons (insert, copy, retry)

## 6. CSS Styling

- [x] 6.1 Create base styles for AI assistant panel in `css/ai-assistant.css`
- [x] 6.2 Implement responsive panel width (200-600px) with drag handle
- [x] 6.3 Implement collapsed/expanded states with CSS transitions
- [x] 6.4 Implement chat message styles (user vs assistant differentiation)
- [x] 6.5 Implement loading indicator animation styles
- [x] 6.6 Implement error message styling
- [x] 6.7 Implement input field and send button styles
- [x] 6.8 Implement action button styles (insert, copy, retry)
- [x] 6.9 Implement settings button with warning badge styling
- [x] 6.10 Implement mobile drawer styles for screens < 768px
- [x] 6.11 Implement mobile bottom button styles
- [x] 6.12 Implement backdrop and overlay styles for mobile drawer
- [x] 6.13 Implement character counter styling
- [x] 6.14 Add dark theme support for all AI panel styles
- [ ] 6.15 Test responsive behavior with CSS media queries

## 7. Configuration Modal

- [x] 7.1 Implement provider selection dropdown (OpenAI/Anthropic/Custom)
- [x] 7.2 Implement API key input field with password masking
- [x] 7.3 Implement show/hide API key toggle functionality
- [x] 7.4 Implement custom endpoint input field (conditional display)
- [x] 7.5 Implement model name input field with default suggestions
- [x] 7.6 Implement temperature slider (0.0-2.0) with value display
- [x] 7.7 Implement max tokens input field (1-8000)
- [x] 7.8 Implement history limit input field (5-100)
- [x] 7.9 Implement "Test Connection" button with loading state
- [x] 7.10 Implement test connection success/error feedback
- [x] 7.11 Implement "Save" button with validation
- [x] 7.12 Implement "Cancel" button functionality
- [x] 7.13 Implement "Reset to Defaults" button with confirmation
- [x] 7.14 Implement "Clear API Key" button
- [x] 7.15 Implement form validation for all fields
- [x] 7.16 Implement error message display for validation failures
- [x] 7.17 Bind configuration modal to AIConfigManager

## 8. View Manager Integration

- [x] 8.1 Add `showAIAssistantPanel()` method to `ViewManager`
- [x] 8.2 Add `hideAIAssistantPanel()` method to `ViewManager`
- [x] 8.3 Add `toggleAIAssistantPanel()` method to `ViewManager`
- [x] 8.4 Modify `switchView()` to handle AI panel visibility based on view
- [ ] 8.5 Implement AI panel state persistence (width, collapsed)
- [ ] 8.6 Restore AI panel state on application load
- [ ] 8.7 Update `loadViewFromStorage()` to restore AI panel state
- [ ] 8.8 Update `saveViewToStorage()` to save AI panel state
- [ ] 8.9 Add mobile/desktop layout switching logic
- [ ] 10.0 Test view switching with AI panel visibility
- [ ] 10.1 Update existing ViewManager tests to cover AI panel behavior

## 9. App Integration

- [x] 9.1 Initialize AIConfigManager in `App` constructor
- [x] 9.2 Initialize AIService in `App` constructor
- [x] 9.3 Initialize AIManager in `App` constructor
- [x] 9.4 Call AIManager.initialize() in App.init()
- [ ] 9.5 Bind AI panel toggle event to appropriate UI element
- [x] 9.6 Update `onStoryLoaded()` to initialize AI panel if needed
- [x] 9.7 Update `onStateRestored()` to refresh AI panel
- [ ] 9.8 Add keyboard shortcuts for AI panel if needed (optional)
- [ ] 9.9 Ensure AI managers are properly cleaned up on app unload

## 10. Event Handling

- [x] 10.1 Bind send button click event to AIManager.sendMessage()
- [x] 10.2 Bind Enter key in input field to sendMessage()
- [x] 10.3 Bind panel resize handle drag events
- [x] 10.4 Bind panel collapse/expand button events
- [x] 10.5 Bind settings button click to open configuration modal
- [x] 10.6 Bind mobile bottom button click to open drawer
- [x] 10.7 Bind drawer close button and backdrop click events
- [x] 10.8 Bind clear history button click to AIManager.clearHistory()
- [x] 10.9 Bind insert button clicks to AIManager.insertToEditor()
- [x] 10.10 Bind copy button clicks to AIManager.copyToClipboard()
- [x] 10.11 Bind retry button clicks for error messages
- [x] 10.12 Bind window resize event for responsive layout handling
- [ ] 10.13 Implement input field auto-resize if using textarea

## 11. Context Building

- [x] 11.1 Implement function to get current chapter content
- [ ] 11.2 Implement function to get selected text from editor
- [ ] 11.3 Implement function to get cursor position in editor
- [x] 11.4 Build context message with chapter title and content
- [x] 11.5 Include character information in context if available
- [x] 11.6 Format context message for AI consumption
- [x] 11.7 Implement context length management to avoid token limits

## 12. Error Handling and User Feedback

- [x] 12.1 Implement specific error messages for 401 Unauthorized
- [x] 12.2 Implement specific error messages for 429 Rate Limit
- [x] 12.3 Implement specific error messages for 5xx Server Errors
- [x] 12.4 Implement specific error messages for network failures
- [x] 12.5 Implement specific error messages for timeouts
- [x] 12.6 Show error messages in chat area with retry option (if applicable)
- [x] 12.7 Use NotificationManager for critical errors
- [x] 12.8 Implement warning badge display on settings button when config invalid
- [x] 12.9 Implement loading state indicators for all async operations
- [ ] 12.10 Add tooltip/help text for error messages with actionable guidance

## 13. Internationalization

- [x] 13.1 Add AI assistant related keys to `locales/zh-CN.json`
- [x] 13.2 Add AI assistant related keys to `locales/en-US.json`
- [x] 13.3 Translate all UI labels (buttons, placeholders, messages)
- [x] 13.4 Translate error messages for all error scenarios
- [x] 13.5 Translate loading indicator text
- [x] 13.6 Translate configuration modal labels and descriptions
- [ ] 13.7 Ensure RTL language support if applicable (future)
- [ ] 13.8 Test language switching for all AI panel elements

## 14. Testing

- [ ] 14.1 Run all unit tests and ensure they pass
- [ ] 14.2 Check test coverage for all new code (target ≥ 80%)
- [ ] 14.3 Perform manual testing of AI panel display and hide
- [ ] 14.4 Test panel resize functionality
- [ ] 14.5 Test panel collapse/expand functionality
- [ ] 14.6 Test mobile drawer open/close functionality
- [ ] 14.7 Test AI message sending and receiving
- [ ] 14.8 Test error scenarios (invalid API key, network error, etc.)
- [ ] 14.9 Test configuration save and load
- [ ] 14.10 Test connection validation
- [ ] 14.11 Test chat history persistence across page reloads
- [ ] 14.12 Test chat history when switching chapters
- [ ] 14.13 Test content insertion into editor (selected, cursor, end)
- [ ] 14.14 Test copy to clipboard functionality
- [ ] 14.15 Test clear history functionality
- [ ] 14.16 Test multi-provider configuration (OpenAI, Anthropic, Custom)
- [ ] 14.17 Test responsive layout on different screen sizes
- [ ] 14.18 Test dark theme for AI panel
- [ ] 14.19 Test language switching for AI panel
- [ ] 14.20 Fix any bugs or issues found during testing

## 15. Documentation

- [ ] 15.1 Update README.md with AI assistant feature description
- [ ] 15.2 Add AI assistant setup instructions to documentation
- [ ] 15.3 Document supported AI providers and their endpoints
- [ ] 15.4 Document configuration options and their effects
- [ ] 15.5 Add code comments for complex logic in AI managers
- [ ] 15.6 Update QUICK_START_TESTING.md if needed
- [ ] 15.7 Add API key security best practices to documentation
- [ ] 15.8 Create user guide for AI assistant features (optional)

## 16. Final Polish

- [ ] 16.1 Review all code for consistency with project style
- [ ] 16.2 Ensure all TODO comments are addressed or documented
- [ ] 16.3 Remove any console.log statements used for debugging
- [ ] 16.4 Optimize CSS for performance (minimize repaints/reflows)
- [ ] 16.5 Verify accessibility (ARIA labels, keyboard navigation)
- [ ] 16.6 Test for memory leaks (especially with chat history)
- [ ] 16.7 Run linter and fix any warnings
- [ ] 16.8 Verify all tests pass
- [ ] 16.9 Final end-to-end test of AI assistant workflow
- [ ] 16.10 Commit changes with clear commit message
