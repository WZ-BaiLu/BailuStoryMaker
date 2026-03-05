/**
 * ContinuousWritingManager
 *
 * Manages continuous writing functionality by calling ParagraphGenerator
 * multiple times. Automatically inserts generated content to the story.
 */
class ContinuousWritingManager {
    /**
     * Create a new ContinuousWritingManager instance
     * @param {Object} state - Application state
     * @param {AIManager} aiManager - AI manager instance
     * @param {NotificationManager} notificationManager - Notification manager instance
     * @param {UIRenderer} uiRenderer - UI renderer instance
     */
    constructor(state, aiManager, notificationManager, uiRenderer) {
        this.state = state;
        this.aiManager = aiManager;
        this.notificationManager = notificationManager;
        this.uiRenderer = uiRenderer;

        // State
        this.isRunning = false;
        this.abortController = null;
        this.startTime = null;

        // Settings (will be loaded from AIConfigManager)
        this.waitTime = 5;
        this.skipAnalysis = false;
    }

    /**
     * Start continuous writing session
     * @param {number} paragraphCount - Number of paragraphs to generate
     * @param {boolean} includeAnalysis - Whether to include analysis for each paragraph
     * @returns {Promise<boolean>} Success status
     */
    async startContinuousWriting(paragraphCount, includeAnalysis = true) {
        // Validate paragraph count
        if (typeof paragraphCount !== 'number' || paragraphCount < 1 || paragraphCount > 20) {
            this.notificationManager.showError('段落数量必须在1-20之间');
            return false;
        }

        // Check if already running
        if (this.isRunning) {
            this.notificationManager.showWarning('连续写作正在进行中');
            return false;
        }

        // Validate story and chapter
        if (!this.state.currentStory) {
            this.notificationManager.showError('请先加载故事');
            return false;
        }

        const chapter = this.state.currentStory.chapters.find(c => c.id === this.state.selectedChapter);
        if (!chapter) {
            this.notificationManager.showError('请先选择章节');
            return false;
        }

        console.log('[ContinuousWriting] Starting continuous writing:', paragraphCount, 'paragraphs');

        // Set analysis option
        this.skipAnalysis = !includeAnalysis;

        // Load current settings from AIConfigManager
        const config = this.aiManager.configManager.getConfig();
        this.waitTime = config.continuousWritingWaitTime || 5;
        console.log('[ContinuousWriting] Settings - Wait time:', this.waitTime, 'Include analysis:', includeAnalysis);

        // Show start notification
        const analysisMode = this.skipAnalysis ? '（不分析）' : '（每段分析）';
        this.notificationManager.showSuccess(`开始连续写作 ${paragraphCount} 个段落${analysisMode}`);

        // Initialize state
        this.isRunning = true;
        this.abortController = new AbortController();
        this.startTime = Date.now();

        // Store initial paragraph count
        const initialParagraphCount = chapter.paragraphs.length;

        try {
            // Main generation loop
            for (let i = 0; i < paragraphCount; i++) {
                // Check if aborted
                if (this.abortController.signal.aborted) {
                    console.log('[ContinuousWriting] Aborted by user');
                    break;
                }

                console.log(`[ContinuousWriting] Generating paragraph ${i + 1}/${paragraphCount}`);

                // Update progress
                this.updateProgress(i + 1, paragraphCount);

                // Generate single paragraph (includes analysis and auto-insert)
                const success = await this.generateSingleParagraph();
                if (!success) {
                    console.log('[ContinuousWriting] Paragraph generation failed, stopping');
                    break;
                }

                // Wait before next paragraph (if not last)
                if (i < paragraphCount - 1) {
                    try {
                        await this.waitForInterruptibleDelay(this.waitTime * 1000);
                    } catch (abortError) {
                        console.log('[ContinuousWriting] Wait aborted by user');
                        this.notificationManager.showWarning(`已中断，共生成 ${i + 1} 个段落`);
                        return true;
                    }
                }
            }

            // Completion
            const totalTime = ((Date.now() - this.startTime) / 1000).toFixed(1);
            const finalParagraphCount = this.state.currentStory.chapters.find(c => c.id === this.state.selectedChapter).paragraphs.length;
            const generatedCount = finalParagraphCount - initialParagraphCount;
            const message = `连续写作完成！已生成 ${generatedCount} 个段落，总耗时 ${totalTime} 秒`;
            this.notificationManager.showSuccess(message);

            return true;

        } catch (error) {
            console.error('[ContinuousWriting] Error during continuous writing:', error);
            this.notificationManager.showError(`连续写作出错: ${error.message}`);
            return false;
        } finally {
            // Clean up
            this.isRunning = false;
            this.hideWaitOverlay();
            this.uiRenderer.enableContinuousWritingButton();
        }
    }

    /**
     * Generate a single paragraph using ParagraphGenerator
     * Automatically inserts content to story and applies analysis
     * @returns {Promise<boolean>} Success status
     */
    async generateSingleParagraph() {
        try {
            if (!this.aiManager.paragraphGenerator) {
                throw new Error('段落生成器未初始化');
            }

            // Get user input from AI input field (if any)
            const userMessage = this.aiManager.elements.inputField?.value?.trim() || '';

            // Generate paragraph with analysis
            const result = await this.aiManager.paragraphGenerator.generateParagraph(userMessage, {
                includeAnalysis: !this.skipAnalysis,
                selectedParagraphId: this.state.selectedParagraph
            });

            // Insert paragraph to story
            const paragraph = this.aiManager.paragraphGenerator.insertParagraphToStory(
                result.content,
                this.state.selectedParagraph || null
            );

            // Apply analysis if available
            if (result.analysis && !this.skipAnalysis) {
                await this.aiManager.paragraphGenerator.applyAnalysisToParagraph(paragraph.id, result.analysis);
            }

            // Update UI
            this.aiManager.app.uiRenderer.renderParagraphs();
            this.aiManager.app.updateSaveStatus();

            console.log('[ContinuousWriting] Generated paragraph:', paragraph.id);
            return true;

        } catch (error) {
            console.error('[ContinuousWriting] Generate paragraph error:', error);

            // Show error dialog to user
            const shouldContinue = await this.promptUserOnError(error);
            if (!shouldContinue) {
                this.abort();
                return false;
            }

            return false; // Skip this paragraph but continue
        }
    }

    /**
     * Wait for interruptible delay
     * @param {number} ms - Delay in milliseconds
     * @returns {Promise<void>}
     */
    waitForInterruptibleDelay(ms) {
        return new Promise((resolve, reject) => {
            let timeout;
            let remainingTime = ms;

            const onAbort = () => {
                if (timeout) {
                    clearInterval(interval);
                    clearTimeout(timeout);
                }
                reject(new Error('Interrupted'));
            };

            // Countdown timer
            const interval = setInterval(() => {
                remainingTime -= 1000;
                this.updateWaitOverlay(Math.ceil(remainingTime / 1000));
            }, 1000);

            // Main timeout
            timeout = setTimeout(() => {
                clearInterval(interval);
                this.abortController.signal.removeEventListener('abort', onAbort);
                resolve();
            }, ms);

            // Listen for abort
            this.abortController.signal.addEventListener('abort', onAbort);
        });
    }

    /**
     * Abort continuous writing
     */
    abort() {
        if (this.abortController) {
            console.log('[ContinuousWriting] Aborting');
            this.abortController.abort();
        }
        this.isRunning = false;
    }

    /**
     * Update progress indicator
     * @param {number} current - Current paragraph number
     * @param {number} total - Total paragraphs
     */
    updateProgress(current, total) {
        this.uiRenderer.updateProgressIndicator(current, total);
    }

    /**
     * Update wait overlay countdown
     * @param {number} remainingSeconds - Remaining seconds
     */
    updateWaitOverlay(remainingSeconds) {
        this.uiRenderer.updateWaitOverlay(remainingSeconds);
    }

    /**
     * Hide wait overlay
     */
    hideWaitOverlay() {
        this.uiRenderer.hideWaitOverlay();
    }

    /**
     * Check if continuous writing is running
     * @returns {boolean} Is running
     */
    isContinuousWritingRunning() {
        return this.isRunning;
    }

    /**
     * Prompt user on error
     * @param {Error} error - Error object
     * @returns {Promise<boolean>} Whether to continue
     */
    async promptUserOnError(error) {
        return new Promise((resolve) => {
            const shouldContinue = confirm(
                `生成段落时出错：${error.message}\n\n是否继续生成下一段落？\n\n点击"确定"继续，点击"取消"中止连续写作。`
            );
            resolve(shouldContinue);
        });
    }
}
