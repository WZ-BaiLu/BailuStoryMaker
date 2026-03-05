/**
 * NotificationManager
 * Manages Toast notifications for user feedback
 */
class NotificationManager {
    /**
     * Create a NotificationManager instance
     */
    constructor() {
        this.aiConfigManager = null;
    }

    /**
     * Set AI config manager reference
     * @param {AIConfigManager} aiConfigManager - AI config manager instance
     */
    setAIConfigManager(aiConfigManager) {
        this.aiConfigManager = aiConfigManager;
    }

    /**
     * Show a toast notification
     * @param {string} message - The message to display
     * @param {'success'|'error'|'warning'} type - The notification type
     */
    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        // Auto-dismiss after 3 seconds with fade-out animation
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    /**
     * Show a success notification
     * @param {string} message - The message to display
     */
    showSuccess(message) {
        this.showToast(message, 'success');
        this.sendTelegramNotification('✅ ' + message, 'success');
    }

    /**
     * Show an error notification
     * @param {string} message - The message to display
     */
    showError(message) {
        this.showToast(message, 'error');
        this.sendTelegramNotification('❌ ' + message, 'error');
    }

    /**
     * Show a warning notification
     * @param {string} message - The message to display
     */
    showWarning(message) {
        this.showToast(message, 'warning');
        this.sendTelegramNotification('⚠️ ' + message, 'warning');
    }

    /**
     * Show an info notification
     * @param {string} message - The message to display
     */
    showInfo(message) {
        this.showToast(message, 'success');
        this.sendTelegramNotification('ℹ️ ' + message, 'info');
    }

    /**
     * Send Telegram notification
     * @param {string} message - Message to send
     * @param {string} type - Notification type (for emoji)
     */
    async sendTelegramNotification(message, type = 'info') {
        if (!this.aiConfigManager) {
            return;
        }

        const config = this.aiConfigManager.getConfig();

        // Check if Telegram is enabled
        if (!config.telegramEnabled) {
            return;
        }

        // Check if credentials are configured
        if (!config.telegramBotToken || !config.telegramChatId) {
            console.warn('[NotificationManager] Telegram credentials not configured');
            return;
        }

        try {
            // Build message (truncate if too long - max 4096 chars)
            const maxMessageLength = 4000;
            let truncatedMessage = message;
            if (message.length > maxMessageLength) {
                truncatedMessage = message.substring(0, maxMessageLength) + '...';
                console.warn('[NotificationManager] Message truncated for Telegram');
            }

            // Send to Telegram API
            const url = `https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`;
            const body = {
                chat_id: config.telegramChatId,
                text: truncatedMessage,
                parse_mode: 'HTML'
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('[NotificationManager] Telegram API error:', errorData);
            }
        } catch (error) {
            console.error('[NotificationManager] Telegram send error:', error);
            // Don't show error to user as Telegram is optional
        }
    }

    /**
     * Send test Telegram message
     * @returns {Promise<boolean>} Success status
     */
    async sendTestTelegramMessage() {
        if (!this.aiConfigManager) {
            this.showError('AI配置管理器未初始化');
            return false;
        }

        const config = this.aiConfigManager.getConfig();

        // Check if credentials are configured
        if (!config.telegramBotToken || !config.telegramChatId) {
            this.showError('请先配置Telegram Bot Token和Chat ID');
            return false;
        }

        try {
            const url = `https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`;
            const body = {
                chat_id: config.telegramChatId,
                text: '✅ 测试消息 - BailuStory Telegram通知已配置成功',
                parse_mode: 'HTML'
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('[NotificationManager] Telegram test error:', errorData);

                if (errorData.description) {
                    this.showError('Telegram测试失败: ' + errorData.description);
                } else {
                    this.showError('Telegram测试失败');
                }
                return false;
            }

            this.showSuccess('测试消息已发送到Telegram');
            return true;
        } catch (error) {
            console.error('[NotificationManager] Telegram test error:', error);
            this.showError('发送测试消息失败: ' + error.message);
            return false;
        }
    }

    /**
     * Show a loading notification
     * @param {string} message - The message to display
     */
    showLoading(message) {
        const loadingToast = document.createElement('div');
        loadingToast.className = 'toast loading';
        loadingToast.id = 'loading-toast';
        loadingToast.innerHTML = `<span class="loading-spinner"></span><span class="loading-text">${message}</span>`;
        document.body.appendChild(loadingToast);
    }

    /**
     * Hide the loading notification
     */
    hideLoading() {
        const loadingToast = document.getElementById('loading-toast');
        if (loadingToast) {
            loadingToast.remove();
        }
    }
}
