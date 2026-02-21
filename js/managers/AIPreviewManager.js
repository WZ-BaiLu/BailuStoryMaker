/**
 * AIPreviewManager - AI 预览管理器
 * 管理 AI 建议的预览和确认工作流
 */

class AIPreviewManager {
  constructor(storyData, elementManager, stateTimeline, stateContextCache, aiElementTools) {
    this.storyData = storyData;
    this.elementManager = elementManager;
    this.stateTimeline = stateTimeline;
    this.stateContextCache = stateContextCache;
    this.aiElementTools = aiElementTools;

    // 当前建议
    this.currentSuggestion = null;

    // 待应用的变更
    this.pendingChanges = [];
  }

  /**
   * 生成段落建议（由 AI 调用）
   * @param {string} context - 故事上下文
   * @returns {Object} 段落建议
   */
  generateParagraph(context) {
    // 这个方法通常由 AI 服务调用
    // 这里返回建议的结构定义
    return {
      content: '',
      elementChanges: [],
      storyTimestamp: null
    };
  }

  /**
   * 设置当前建议
   * @param {Object} suggestion - 段落建议
   */
  setSuggestion(suggestion) {
    this.currentSuggestion = suggestion;
    this.pendingChanges = suggestion.elementChanges || [];
  }

  /**
   * 获取当前建议
   * @returns {Object|null} 当前建议
   */
  getSuggestion() {
    return this.currentSuggestion;
  }

  /**
   * 显示预览（返回预览数据供 UI 显示）
   * @returns {Object} 预览数据
   */
  showPreview() {
    if (!this.currentSuggestion) {
      return null;
    }

    const preview = {
      content: this.currentSuggestion.content,
      changes: this._formatChanges(this.currentSuggestion.elementChanges || []),
      storyTimestamp: this.currentSuggestion.storyTimestamp,
      canApply: this._canApplyChanges()
    };

    return preview;
  }

  /**
   * 格式化变更列表
   * @private
   */
  _formatChanges(elementChanges) {
    return elementChanges.map(change => {
      const formatted = {
        tool: change.tool,
        description: change.description || change.tool,
        params: change.params,
        before: null,
        after: null
      };

      // 获取变更前的值
      if (change.tool === 'addElement') {
        formatted.before = null;
        formatted.after = {
          name: change.params.name,
          type: change.params.type,
          description: change.params.description
        };
      } else if (change.tool === 'updateElementLocation') {
        const element = this.elementManager.getElement(change.params.elementId);
        if (element) {
          formatted.before = {
            element: element.name,
            location: element.location
          };
          formatted.after = {
            element: element.name,
            location: change.params.location
          };
        }
      } else if (change.tool === 'updateElementDescription') {
        const element = this.elementManager.getElement(change.params.elementId);
        if (element) {
          formatted.before = {
            element: element.name,
            description: element.description,
            keywords: element.keywords
          };
          const afterChanges = {};
          if (change.params.description !== undefined) {
            afterChanges.description = change.params.description;
          }
          if (change.params.keywords !== undefined) {
            afterChanges.keywords = change.params.keywords;
          }
          if (change.params.status !== undefined) {
            afterChanges.status = change.params.status;
          }
          formatted.after = afterChanges;
        }
      } else if (change.tool === 'updateParagraphTimestamp') {
        const paragraph = this._findParagraphById(change.params.paragraphId);
        if (paragraph) {
          formatted.before = paragraph.storyTimestamp || { narrativeType: 'linear' };
          const afterTimestamp = {};
          if (change.params.narrativeType) {
            afterTimestamp.narrativeType = change.params.narrativeType;
          }
          if (change.params.referenceParagraphId) {
            afterTimestamp.referenceParagraphId = change.params.referenceParagraphId;
          }
          if (change.params.timeOffset !== undefined) {
            afterTimestamp.timeOffset = change.params.timeOffset;
          }
          if (change.params.absoluteTime) {
            afterTimestamp.absoluteTime = change.params.absoluteTime;
          }
          if (change.params.relativeTime) {
            afterTimestamp.relativeTime = change.params.relativeTime;
          }
          formatted.after = afterTimestamp;
        }
      }

      return formatted;
    });
  }

  /**
   * 检查是否可以应用变更
   * @private
   */
  _canApplyChanges() {
    if (!this.pendingChanges || this.pendingChanges.length === 0) {
      return true;
    }

    // 检查每个变更是否有效
    for (const change of this.pendingChanges) {
      try {
        this._validateChange(change);
      } catch (error) {
        return false;
      }
    }

    return true;
  }

  /**
   * 验证变更
   * @private
   */
  _validateChange(change) {
    if (change.tool === 'addElement') {
      if (!change.params.name || !change.params.type) {
        throw new Error('addElement requires name and type');
      }
    } else if (change.tool === 'updateElementLocation') {
      if (!change.params.elementId) {
        throw new Error('updateElementLocation requires elementId');
      }
      const element = this.elementManager.getElement(change.params.elementId);
      if (!element) {
        throw new Error(`Element not found: ${change.params.elementId}`);
      }
    } else if (change.tool === 'updateElementDescription') {
      if (!change.params.elementId) {
        throw new Error('updateElementDescription requires elementId');
      }
      const element = this.elementManager.getElement(change.params.elementId);
      if (!element) {
        throw new Error(`Element not found: ${change.params.elementId}`);
      }
    } else if (change.tool === 'updateParagraphTimestamp') {
      if (!change.params.paragraphId) {
        throw new Error('updateParagraphTimestamp requires paragraphId');
      }
      const paragraph = this._findParagraphById(change.params.paragraphId);
      if (!paragraph) {
        throw new Error(`Paragraph not found: ${change.params.paragraphId}`);
      }
    }
  }

  /**
   * 应用建议（确认变更）
   * @param {Object} options - 选项
   * @param {Object} [options.modifications] - 用户修改的内容
   * @returns {Promise<Object>} 应用结果
   */
  async applyChanges(options = {}) {
    if (!this.currentSuggestion) {
      return {
        success: false,
        error: 'No suggestion to apply'
      };
    }

    const { modifications = {} } = options;

    // 如果有用户修改，应用修改
    if (modifications.content) {
      this.currentSuggestion.content = modifications.content;
    }
    if (modifications.elementChanges) {
      this.currentSuggestion.elementChanges = modifications.elementChanges;
      this.pendingChanges = modifications.elementChanges;
    }
    if (modifications.storyTimestamp) {
      this.currentSuggestion.storyTimestamp = modifications.storyTimestamp;
    }

    try {
      // 应用所有变更
      const results = [];

      for (const change of this.pendingChanges) {
        const result = await this._applyChange(change);
        results.push(result);
      }

      // 插入段落到故事
      const paragraphInserted = await this._insertParagraph();

      // 更新 StateTimeline
      this.stateTimeline.reindex();

      // 清除相关缓存
      this._invalidateAffectedCache();

      // 清除当前建议
      this.currentSuggestion = null;
      this.pendingChanges = [];

      return {
        success: true,
        results,
        paragraphInserted
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 应用单个变更
   * @private
   */
  async _applyChange(change) {
    switch (change.tool) {
      case 'addElement':
        return await this.aiElementTools.addElement(change.params);

      case 'updateElementLocation':
        return await this.aiElementTools.updateElementLocation(change.params);

      case 'updateElementDescription':
        return await this.aiElementTools.updateElementDescription(change.params);

      case 'updateParagraphTimestamp':
        return await this.aiElementTools.updateParagraphTimestamp(change.params);

      default:
        throw new Error(`Unknown tool: ${change.tool}`);
    }
  }

  /**
   * 插入段落到故事
   * @private
   */
  async _insertParagraph() {
    if (!this.currentSuggestion.content) {
      return false;
    }

    // 这里需要实现段落插入逻辑
    // 简化版：返回 true 表示成功插入
    // 实际实现需要根据故事数据结构调整
    return true;
  }

  /**
   * 清除受影响的缓存
   * @private
   */
  _invalidateAffectedCache() {
    // 清除所有段落缓存（简化版）
    // 实际实现应该只清除受影响的段落缓存
    // this.stateContextCache.clearAll();
  }

  /**
   * 拒绝建议
   */
  reject() {
    this.currentSuggestion = null;
    this.pendingChanges = [];
  }

  /**
   * 修改建议
   * @param {Object} modifications - 修改内容
   */
  modifySuggestion(modifications) {
    if (!this.currentSuggestion) {
      return;
    }

    if (modifications.content !== undefined) {
      this.currentSuggestion.content = modifications.content;
    }
    if (modifications.elementChanges !== undefined) {
      this.currentSuggestion.elementChanges = modifications.elementChanges;
      this.pendingChanges = modifications.elementChanges;
    }
    if (modifications.storyTimestamp !== undefined) {
      this.currentSuggestion.storyTimestamp = modifications.storyTimestamp;
    }
  }

  /**
   * 根据 ID 查找段落
   * @private
   */
  _findParagraphById(paragraphId) {
    if (!this.storyData.chapters) {
      return undefined;
    }

    for (const chapter of this.storyData.chapters) {
      if (chapter.paragraphs) {
        const paragraph = chapter.paragraphs.find(p => p.id === paragraphId);
        if (paragraph) {
          return paragraph;
        }
      }
    }

    return undefined;
  }

  /**
   * 获取建议摘要
   * @returns {Object} 建议摘要
   */
  getSuggestionSummary() {
    if (!this.currentSuggestion) {
      return null;
    }

    return {
      contentLength: this.currentSuggestion.content.length,
      changeCount: this.pendingChanges.length,
      hasTimestamp: !!this.currentSuggestion.storyTimestamp,
      narrativeType: this.currentSuggestion.storyTimestamp?.narrativeType || 'linear'
    };
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIPreviewManager;
}
