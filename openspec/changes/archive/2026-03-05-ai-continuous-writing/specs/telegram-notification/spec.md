# Spec: Telegram Notification

## ADDED Requirements

### Requirement: Configure Telegram Bot token
The system SHALL allow users to configure their Telegram Bot token.

#### Scenario: Save Bot token to storage
- **WHEN** user enters Bot token in settings
- **AND** user saves settings
- **THEN** system stores token in localStorage with key 'telegram.bot.token'
- **AND** system validates token format (basic format check)
- **AND** system does not display token in plain text (password field)

#### Scenario: Validate Bot token format
- **WHEN** user enters Bot token
- **AND** token format is invalid (not matching pattern)
- **THEN** system displays validation error
- **AND** system prevents saving invalid token
- **AND** system shows example format: "123456789:ABCdefGHIjklMNOpqrsTUVwxyz"

#### Scenario: Clear Bot token
- **WHEN** user clears Bot token field
- **AND** user saves settings
- **THEN** system removes token from localStorage
- **AND** system disables Telegram notifications

### Requirement: Configure Telegram Chat ID
The system SHALL allow users to configure their Telegram Chat ID.

#### Scenario: Save Chat ID to storage
- **WHEN** user enters Chat ID in settings
- **AND** user saves settings
- **THEN** system stores Chat ID in localStorage with key 'telegram.chat.id'
- **AND** system validates Chat ID is numeric
- **AND** system does not display Chat ID in plain text (password field)

#### Scenario: Validate Chat ID format
- **WHEN** user enters Chat ID
- **AND** Chat ID is not a valid number
- **THEN** system displays validation error
- **AND** system prevents saving invalid Chat ID
- **AND** system shows example: "123456789"

#### Scenario: Clear Chat ID
- **WHEN** user clears Chat ID field
- **AND** user saves settings
- **THEN** system removes Chat ID from localStorage
- **AND** system disables Telegram notifications

### Requirement: Enable/disable Telegram notifications
The system SHALL allow users to enable or disable Telegram notifications.

#### Scenario: Enable Telegram notifications
- **WHEN** user checks "启用Telegram通知" checkbox
- **AND** user saves settings
- **THEN** system stores enabled state in localStorage with key 'telegram.enabled'
- **AND** system enables Telegram notifications for all future notifications
- **AND** system shows notification count increase in settings

#### Scenario: Disable Telegram notifications
- **WHEN** user unchecks "启用Telegram通知" checkbox
- **AND** user saves settings
- **THEN** system stores disabled state in localStorage
- **AND** system disables Telegram notifications
- **AND** system continues to show in-app toast notifications

#### Scenario: Require both token and Chat ID to enable
- **WHEN** user checks "启用Telegram通知" checkbox
- **AND** Bot token is not configured
- **OR** Chat ID is not configured
- **THEN** system displays warning message
- **AND** system prevents enabling Telegram notifications
- **AND** system prompts user to configure both fields

### Requirement: Send Telegram message
The system SHALL send messages to Telegram Bot API when notifications are enabled.

#### Scenario: Send success notification
- **WHEN** continuous writing completes successfully
- **AND** Telegram notifications are enabled
- **AND** both Bot token and Chat ID are configured
- **THEN** system sends HTTP POST to `https://api.telegram.org/bot{TOKEN}/sendMessage`
- **AND** request body includes chat_id, text, and parse_mode
- **AND** message text includes success emoji (✅)
- **AND** message includes completion details (paragraph count, time)

#### Scenario: Send error notification
- **WHEN** continuous writing encounters an error
- **AND** Telegram notifications are enabled
- **THEN** system sends error message to Telegram
- **AND** message includes error emoji (❌)
- **AND** message includes error description

#### Scenario: Send warning notification
- **WHEN** continuous writing sends a warning
- **AND** Telegram notifications are enabled
- **THEN** system sends warning message to Telegram
- **AND** message includes warning emoji (⚠️)
- **AND** message includes warning details

#### Scenario: Do not send when disabled
- **WHEN** notification is triggered
- **AND** Telegram notifications are disabled
- **THEN** system does NOT send to Telegram API
- **AND** system only shows in-app toast notification

### Requirement: Handle Telegram API errors
The system SHALL handle Telegram API errors gracefully.

#### Scenario: Invalid Bot token
- **WHEN** Telegram API returns 401 Unauthorized
- **THEN** system logs error to console
- **AND** system displays warning to user
- **AND** system disables Telegram notifications
- **AND** system suggests user verify Bot token

#### Scenario: Invalid Chat ID
- **WHEN** Telegram API returns 400 Bad Request with "chat not found"
- **THEN** system logs error to console
- **AND** system displays warning to user
- **AND** system disables Telegram notifications
- **AND** system suggests user verify Chat ID

#### Scenario: Network error
- **WHEN** Telegram API request fails due to network error
- **THEN** system logs error to console
- **AND** system continues without Telegram notification
- **AND** system shows in-app toast notification
- **AND** system does NOT disable Telegram notifications (may be temporary)

#### Scenario: API rate limit exceeded
- **WHEN** Telegram API returns 429 Too Many Requests
- **THEN** system logs error to console
- **AND** system waits before retry (if applicable)
- **AND** system shows in-app toast notification
- **AND** system does NOT disable Telegram notifications

### Requirement: Test Telegram configuration
The system SHALL provide a way for users to test their Telegram configuration.

#### Scenario: Send test message
- **WHEN** user clicks "发送测试消息" button
- **AND** Bot token and Chat ID are configured
- **THEN** system sends test message to Telegram
- **AND** test message content: "✅ 测试消息 - BailuStory Telegram通知已配置成功"
- **AND** system displays success toast if message sent
- **AND** system displays error toast if message failed

#### Scenario: Test message failure
- **WHEN** user clicks "发送测试消息" button
- **AND** Bot token or Chat ID is invalid
- **THEN** system displays error toast with failure reason
- **AND** system provides guidance to fix configuration
- **AND** system does NOT enable Telegram notifications

#### Scenario: Test before enabling
- **WHEN** user clicks "发送测试消息" button
- **AND** test message is successful
- **THEN** system suggests enabling Telegram notifications
- **AND** system pre-checks "启用Telegram通知" checkbox

### Requirement: Telegram notification settings UI
The system SHALL provide user interface for configuring Telegram notifications.

#### Scenario: Display Telegram settings section
- **WHEN** user opens settings
- **THEN** system displays "Telegram 通知" section
- **AND** section includes:
  - "启用Telegram通知" checkbox
  - "Bot Token" input field (password type)
  - "Chat ID" input field (password type)
  - "发送测试消息" button
  - Configuration help text with links to @BotFather and @userinfobot

#### Scenario: Display configuration help
- **WHEN** user views Telegram settings
- **THEN** system displays help text
- **AND** help text explains how to get Bot Token from @BotFather
- **AND** help text explains how to get Chat ID from @userinfobot
- **AND** system provides clickable links or search terms

#### Scenario: Mask sensitive fields
- **WHEN** Telegram settings are displayed
- **THEN** Bot Token input field uses password type
- **AND** Chat ID input field uses password type
- **AND** system provides "显示/隐藏" toggle for each field

### Requirement: Integrate with existing notification system
The system SHALL integrate Telegram notifications seamlessly with existing NotificationManager.

#### Scenario: Extend showSuccess method
- **WHEN** NotificationManager.showSuccess(message) is called
- **AND** Telegram notifications are enabled
- **THEN** system sends success message to Telegram
- **AND** system also shows in-app toast
- **AND** both notifications contain same message content

#### Scenario: Extend showError method
- **WHEN** NotificationManager.showError(message) is called
- **AND** Telegram notifications are enabled
- **THEN** system sends error message to Telegram
- **AND** system also shows in-app toast
- **AND** both notifications contain same message content

#### Scenario: Extend showWarning method
- **WHEN** NotificationManager.showWarning(message) is called
- **AND** Telegram notifications are enabled
- **THEN** system sends warning message to Telegram
- **AND** system also shows in-app toast
- **AND** both notifications contain same message content

#### Scenario: Telegram sending failure does not block toast
- **WHEN** NotificationManager sends notification
- **AND** Telegram API request fails
- **THEN** in-app toast is still displayed
- **AND** system continues normally
- **AND** system logs error for debugging

### Requirement: Message formatting
The system SHALL format Telegram messages appropriately.

#### Scenario: Add emoji based on notification type
- **WHEN** sending success notification
- **THEN** system prepends ✅ emoji to message
- **WHEN** sending error notification
- **THEN** system prepends ❌ emoji to message
- **WHEN** sending warning notification
- **THEN** system prepends ⚠️ emoji to message

#### Scenario: Use HTML parse mode
- **WHEN** sending message to Telegram
- **THEN** system sets parse_mode to 'HTML'
- **AND** system can use HTML tags for formatting (if needed)
- **AND** system escapes HTML special characters in user content

#### Scenario: Truncate long messages
- **WHEN** message length exceeds 4096 characters (Telegram limit)
- **THEN** system truncates message to 4000 characters
- **AND** system appends "..." to indicate truncation
- **AND** system logs truncation for debugging

### Requirement: Telegram notification completion summary
The system SHALL include detailed summary in Telegram notifications for continuous writing.

#### Scenario: Success completion notification
- **WHEN** continuous writing completes successfully
- **THEN** Telegram message includes:
  - Success emoji (✅)
  - Title: "连续写作完成"
  - Paragraph count: "已生成 X 个段落"
  - Total time: "总耗时：X分X秒"
  - Analysis summary (if applicable): "检测到 X 个状态变化"

#### Scenario: Partial completion notification
- **WHEN** continuous writing is interrupted
- **THEN** Telegram message includes:
  - Warning emoji (⚠️)
  - Title: "连续写作已中断"
  - Generated paragraphs: "已生成 X 个段落"
  - Remaining: "剩余 Y 个段落未完成"

#### Scenario: Error notification with details
- **WHEN** continuous writing encounters error
- **THEN** Telegram message includes:
  - Error emoji (❌)
  - Title: "连续写作出错"
  - Error description
  - Generated paragraphs before error: "已生成 X 个段落"

### Requirement: Privacy and security
The system SHALL handle Telegram configuration securely.

#### Scenario: Store configuration locally
- **WHEN** user saves Telegram configuration
- **THEN** system stores in localStorage (client-side only)
- **AND** system does NOT send configuration to any server
- **AND** configuration stays on user's device

#### Scenario: Mask sensitive data in UI
- **WHEN** displaying Telegram configuration
- **THEN** system uses password input fields
- **AND** system provides show/hide toggle
- **AND** system does NOT expose sensitive data in logs

#### Scenario: Clear configuration on demand
- **WHEN** user wants to remove Telegram configuration
- **THEN** system provides "清除Telegram配置" button
- **AND** button clears all Telegram-related localStorage keys
- **AND** system disables Telegram notifications
- **AND** system requests confirmation before clearing

### Requirement: Telegram API request timeout
The system SHALL implement timeout for Telegram API requests.

#### Scenario: Timeout after reasonable duration
- **WHEN** Telegram API request takes longer than 10 seconds
- **THEN** system aborts the request
- **AND** system logs timeout error
- **AND** system shows in-app toast notification
- **AND** system does NOT disable Telegram notifications (may be temporary)

#### Scenario: Retry on timeout
- **WHEN** Telegram API request times out
- **AND** notification is critical (e.g., completion)
- **THEN** system automatically retries once
- **AND** system uses exponential backoff (2 seconds delay)
- **AND** system does not retry more than once

### Requirement: Handle missing configuration gracefully
The system SHALL handle cases where Telegram configuration is incomplete.

#### Scenario: Missing Bot token
- **WHEN** system attempts to send Telegram notification
- **AND** Bot token is not configured
- **THEN** system skips Telegram notification
- **AND** system shows in-app toast notification
- **AND** system logs warning (not error)

#### Scenario: Missing Chat ID
- **WHEN** system attempts to send Telegram notification
- **AND** Chat ID is not configured
- **THEN** system skips Telegram notification
- **AND** system shows in-app toast notification
- **AND** system logs warning (not error)

#### Scenario: Both missing
- **WHEN** system attempts to send Telegram notification
- **AND** neither Bot token nor Chat ID is configured
- **THEN** system skips Telegram notification
- **AND** system shows in-app toast notification
- **AND** system does not display warning (user has not enabled Telegram)

### Requirement: Multiple notification channels support
The system SHALL support sending notifications to multiple channels simultaneously.

#### Scenario: Send to both Telegram and in-app toast
- **WHEN** notification is triggered
- **AND** Telegram notifications are enabled
- **THEN** system sends message to Telegram API
- **AND** system displays in-app toast
- **AND** both notifications are independent (failure of one does not affect other)

#### Scenario: Browser notification + Telegram
- **WHEN** notification is triggered
- **AND** browser notifications are enabled
- **AND** Telegram notifications are enabled
- **THEN** system sends all three notifications
- **AND** each notification channel works independently
