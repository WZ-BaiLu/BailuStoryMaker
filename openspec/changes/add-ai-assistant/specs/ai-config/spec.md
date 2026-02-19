## ADDED Requirements

### Requirement: Store AI Configuration

The system SHALL store AI configuration in localStorage.

#### Scenario: Save provider configuration
- **WHEN** user saves AI configuration in the settings modal
- **THEN** system SHALL save the configuration to localStorage under key "ai.config"
- **AND** configuration SHALL include provider, apiKey, endpoint, model, temperature, maxTokens

#### Scenario: Save API key securely
- **WHEN** user provides API key
- **THEN** system SHALL encode the API key using Base64 before storing
- **AND** system SHALL NOT store the API key in plain text

---

### Requirement: Load AI Configuration

The system SHALL load AI configuration from localStorage on startup.

#### Scenario: Load configuration on initialization
- **WHEN** application initializes
- **THEN** system SHALL attempt to load AI configuration from localStorage
- **AND** if configuration exists, system SHALL decode the API key

#### Scenario: Handle missing configuration
- **WHEN** no AI configuration exists in localStorage
- **THEN** system SHALL use default configuration values
- **AND** system SHALL display warning indicator on settings button

---

### Requirement: Provider Selection

The system SHALL allow users to select AI provider from available options.

#### Scenario: Select OpenAI provider
- **WHEN** user selects "OpenAI" from provider dropdown
- **THEN** system SHALL set provider to "openai"
- **AND** system SHALL pre-fill endpoint with default OpenAI URL
- **AND** system SHALL pre-fill model with "gpt-3.5-turbo"

#### Scenario: Select Anthropic provider
- **WHEN** user selects "Anthropic" from provider dropdown
- **THEN** system SHALL set provider to "anthropic"
- **AND** system SHALL pre-fill endpoint with default Anthropic URL
- **AND** system SHALL pre-fill model with "claude-3-haiku-20240307"

#### Scenario: Select custom provider
- **WHEN** user selects "Custom" from provider dropdown
- **THEN** system SHALL set provider to "custom"
- **AND** system SHALL display endpoint field for user input
- **AND** system SHALL require user to provide endpoint URL

---

### Requirement: API Key Management

The system SHALL allow users to configure and manage API keys.

#### Scenario: Input API key
- **WHEN** user enters API key in the configuration modal
- **THEN** system SHALL display the input field as password type (masked)
- **AND** system SHALL not show the actual API key characters

#### Scenario: Show/hide API key
- **WHEN** user clicks the eye icon to show API key
- **THEN** system SHALL display the API key in plain text
- **AND** user can click again to hide it

#### Scenario: Validate API key not empty
- **WHEN** user attempts to save configuration with empty API key
- **THEN** system SHALL display an error message
- **AND** system SHALL prevent saving the configuration

---

### Requirement: Endpoint Configuration

The system SHALL allow users to configure custom endpoint URL for custom providers.

#### Scenario: Configure custom endpoint
- **WHEN** user selects "Custom" provider
- **THEN** system SHALL display endpoint input field
- **AND** user SHALL enter a valid HTTP or HTTPS URL

#### Scenario: Validate endpoint URL format
- **WHEN** user enters an invalid URL format
- **THEN** system SHALL display an error message
- **AND** system SHALL prevent saving until a valid URL is entered

#### Scenario: Hide endpoint for standard providers
- **WHEN** user selects "OpenAI" or "Anthropic" provider
- **THEN** system SHALL hide the endpoint input field
- **AND** system SHALL use the default endpoint for the selected provider

---

### Requirement: Model Configuration

The system SHALL allow users to configure the AI model name.

#### Scenario: Input model name
- **WHEN** user enters model name
- **THEN** system SHALL validate that model name is not empty
- **AND** system SHALL save the model name to configuration

#### Scenario: Provide default models
- **WHEN** user selects a provider
- **THEN** system SHALL suggest common models for that provider:
  - OpenAI: gpt-3.5-turbo, gpt-4, gpt-4-turbo
  - Anthropic: claude-3-haiku-20240307, claude-3-sonnet-20240229

#### Scenario: Allow custom model name
- **WHEN** user enters a model name not in the suggested list
- **THEN** system SHALL accept the custom model name
- **AND** system SHALL validate that the model name is not empty

---

### Requirement: Temperature Configuration

The system SHALL allow users to configure the temperature parameter for AI generation.

#### Scenario: Adjust temperature slider
- **WHEN** user moves the temperature slider
- **THEN** system SHALL display the current value
- **AND** value SHALL be between 0.0 and 2.0

#### Scenario: Save temperature value
- **WHEN** user saves configuration
- **THEN** system SHALL save the temperature value
- **AND** default value SHALL be 0.7

#### Scenario: Temperature at extremes
- **WHEN** temperature is set to 0.0
- **THEN** system SHALL indicate "更确定" (more deterministic)
- **WHEN** temperature is set to 2.0
- **THEN** system SHALL indicate "更随机" (more random)

---

### Requirement: Max Tokens Configuration

The system SHALL allow users to configure the maximum tokens for AI response.

#### Scenario: Input max tokens
- **WHEN** user enters max tokens value
- **THEN** system SHALL validate that value is a positive integer
- **AND** default value SHALL be 2000

#### Scenario: Validate max tokens range
- **WHEN** user enters max tokens value
- **THEN** system SHALL ensure value is between 1 and 8000
- **AND** if value is out of range, system SHALL display error message

---

### Requirement: History Limit Configuration

The system SHALL allow users to configure the maximum number of messages to save in history.

#### Scenario: Input history limit
- **WHEN** user enters history limit value
- **THEN** system SHALL validate that value is a positive integer
- **AND** default value SHALL be 20

#### Scenario: Validate history limit range
- **WHEN** user enters history limit value
- **THEN** system SHALL ensure value is between 5 and 100
- **AND** if value is out of range, system SHALL display error message

#### Scenario: Apply history limit to storage
- **WHEN** saving chat history
- **THEN** system SHALL keep only the most recent N messages as configured

---

### Requirement: Panel State Configuration

The system SHALL persist AI panel state (width, collapsed) in configuration.

#### Scenario: Save panel width
- **WHEN** user adjusts panel width
- **THEN** system SHALL save the width value to configuration
- **AND** default width SHALL be 300

#### Scenario: Save collapsed state
- **WHEN** user collapses or expands the panel
- **THEN** system SHALL save the collapsed state to configuration
- **AND** default collapsed state SHALL be false

#### Scenario: Restore panel state on load
- **WHEN** loading AI panel
- **THEN** system SHALL restore the saved width and collapsed state

---

### Requirement: Configuration Validation

The system SHALL validate all configuration values before saving.

#### Scenario: Validate all required fields
- **WHEN** user attempts to save configuration
- **THEN** system SHALL validate that all required fields are filled:
  - provider
  - apiKey
  - model
- **AND** if any field is missing, system SHALL prevent saving and show error

#### Scenario: Validate parameter ranges
- **WHEN** user attempts to save configuration
- **THEN** system SHALL validate parameter ranges:
  - temperature: 0.0 - 2.0
  - maxTokens: 1 - 8000
  - historyLimit: 5 - 100
- **AND** if any parameter is out of range, system SHALL prevent saving and show error

#### Scenario: Validate URL format for custom provider
- **WHEN** user selects custom provider
- **THEN** system SHALL validate that endpoint URL is a valid HTTP/HTTPS URL
- **AND** system SHALL use URL parsing to validate format

---

### Requirement: Test Connection with Current Configuration

The system SHALL allow users to test the current configuration before saving.

#### Scenario: Test connection button
- **WHEN** user clicks "Test Connection" button
- **THEN** system SHALL use the current form values (not yet saved)
- **AND** system SHALL send a test request to the configured provider

#### Scenario: Successful test connection
- **WHEN** test connection succeeds
- **THEN** system SHALL display a success message
- **AND** system SHALL enable the save button

#### Scenario: Failed test connection
- **WHEN** test connection fails
- **THEN** system SHALL display the error message
- **AND** system SHALL disable the save button until configuration is corrected

---

### Requirement: Reset to Default Configuration

The system SHALL allow users to reset configuration to default values.

#### Scenario: Reset button
- **WHEN** user clicks "Reset to Defaults" button
- **THEN** system SHALL display a confirmation dialog

#### Scenario: Confirm reset
- **WHEN** user confirms reset
- **THEN** system SHALL reset all configuration fields to default values:
  - provider: openai
  - endpoint: https://api.openai.com/v1/chat/completions
  - model: gpt-3.5-turbo
  - temperature: 0.7
  - maxTokens: 2000
  - historyLimit: 20
  - panelWidth: 300
  - panelCollapsed: false

#### Scenario: Cancel reset
- **WHEN** user cancels reset
- **THEN** system SHALL close the dialog
- **AND** configuration SHALL remain unchanged

---

### Requirement: Clear API Key

The system SHALL allow users to clear the API key from configuration.

#### Scenario: Clear API key button
- **WHEN** user clicks "Clear API Key" button
- **THEN** system SHALL clear the API key input field
- **AND** system SHALL display a warning that API key is required

---

### Requirement: Configuration Change Notification

The system SHALL notify relevant components when configuration changes.

#### Scenario: Notify AI manager of configuration change
- **WHEN** user saves new configuration
- **THEN** system SHALL notify AI manager to update its internal state
- **AND** system SHALL revalidate the connection status

#### Scenario: Update warning badge on settings button
- **WHEN** configuration becomes valid (API key present)
- **THEN** system SHALL remove the warning badge from settings button

#### Scenario: Show warning badge when invalid
- **WHEN** configuration becomes invalid (API key removed)
- **THEN** system SHALL display the warning badge on settings button

---

### Requirement: Export Configuration

The system SHALL allow users to export AI configuration (excluding API key for security).

#### Scenario: Export configuration
- **WHEN** user clicks "Export Configuration" button
- **THEN** system SHALL generate a JSON file with configuration
- **AND** API key SHALL be excluded from exported file
- **AND** system SHALL download the file

---

### Requirement: Import Configuration

The system SHALL allow users to import AI configuration from a JSON file.

#### Scenario: Import configuration file
- **WHEN** user selects a configuration JSON file
- **THEN** system SHALL parse the file and validate the configuration
- **AND** system SHALL populate the configuration modal with imported values

#### Scenario: Import requires API key
- **WHEN** importing configuration that does not include API key (for security)
- **THEN** system SHALL prompt user to enter API key
- **AND** system SHALL not save configuration until API key is provided
