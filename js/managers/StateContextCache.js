/**
 * StateContextCache - 状态上下文缓存管理器
 * 章节级状态上下文缓存，提升性能
 */

class StateContextCache {
  constructor(stateTimeline, storyViewManager) {
    this.stateTimeline = stateTimeline;
    this.storyViewManager = storyViewManager;

    // 章节级缓存: Map<chapterId, StoryContext>
    this.chapterCache = new Map();

    // 段落级缓存: Map<paragraphId, StoryContext>
    this.paragraphCache = new Map();

    // 缓存有效期（毫秒）
    this.cacheTTL = 5 * 60 * 1000; // 5 分钟

    // 缓存时间戳
    this.cacheTimestamps = new Map();

    // 当前活动章节
    this.activeChapter = null;
  }

  /**
   * 获取段落上下文
   * @param {string} paragraphId - 段落 ID
   * @param {Object} options - 选项
   * @param {boolean} [options.useCache=true] - 是否使用缓存
   * @param {boolean} [options.useViewLocation=true] - 是否使用视角位置过滤
   * @returns {Object} 故事上下文
   */
  getContext(paragraphId, options = {}) {
    const {
      useCache = true,
      useViewLocation = true
    } = options;

    // 尝试从缓存获取
    if (useCache) {
      const cached = this._getFromCache(paragraphId);
      if (cached) {
        return cached;
      }
    }

    // 计算上下文
    const context = this._calculateContext(paragraphId, useViewLocation);

    // 缓存结果
    if (useCache) {
      this._setCache(paragraphId, context);
    }

    return context;
  }

  /**
   * 从缓存获取
   * @private
   */
  _getFromCache(paragraphId) {
    // 检查段落缓存
    if (this.paragraphCache.has(paragraphId)) {
      const timestamp = this.cacheTimestamps.get(paragraphId);
      if (this._isCacheValid(timestamp)) {
        return this.paragraphCache.get(paragraphId);
      }
    }

    return null;
  }

  /**
   * 检查缓存是否有效
   * @private
   */
  _isCacheValid(timestamp) {
    if (!timestamp) {
      return false;
    }
    const now = Date.now();
    return (now - timestamp) < this.cacheTTL;
  }

  /**
   * 设置缓存
   * @private
   */
  _setCache(paragraphId, context) {
    const now = Date.now();

    // 设置段落缓存
    this.paragraphCache.set(paragraphId, context);
    this.cacheTimestamps.set(paragraphId, now);

    // 设置章节缓存（基于段落 ID 推断章节）
    const chapterId = this._extractChapterId(paragraphId);
    if (chapterId) {
      this.chapterCache.set(chapterId, context);
      this.cacheTimestamps.set(chapterId, now);
    }
  }

  /**
   * 从段落 ID 提取章节 ID
   * @private
   */
  _extractChapterId(paragraphId) {
    // 假设段落 ID 格式为 "chapterId-sequence"
    const parts = paragraphId.split('-');
    if (parts.length >= 2) {
      // 最后一段是序列号，其余是章节 ID
      parts.pop();
      return parts.join('-');
    }
    return null;
  }

  /**
   * 计算上下文
   * @private
   */
  _calculateContext(paragraphId, useViewLocation) {
    // 获取叙事上下文（考虑叙事类型）
    const narrativeContext = this.stateTimeline.getNarrativeContext(paragraphId);

    // 构建故事上下文
    const storyContext = {
      paragraphId,
      timestamp: new Date().toISOString(),
      elements: [],
      presentElements: [],
      elementStates: new Map()
    };

    // 构建元素状态映射
    narrativeContext.elementStates.forEach((state, elementId) => {
      storyContext.elementStates.set(elementId, {
        id: elementId,
        state: state
      });
    });

    // 构建元素列表
    const allElements = this.stateTimeline.elementManager.listElements();
    storyContext.elements = allElements.map(element => ({
      id: element.id,
      type: element.type,
      name: element.name,
      description: element.description,
      keywords: element.keywords,
      location: element.location
    }));

    // 构建在场元素列表
    if (useViewLocation && this.storyViewManager.getViewLocation()) {
      const presentElements = this.storyViewManager.getPresentElements();
      storyContext.presentElements = presentElements.map(element => ({
        id: element.id,
        type: element.type,
        name: element.name
      }));
    }

    return storyContext;
  }

  /**
   * 格式化上下文供 AI 使用
   * @param {Object} context - 故事上下文
   * @returns {string} 格式化的上下文字符串
   */
  formatContextForAI(context) {
    let output = '';

    output += `## 当前故事上下文\n\n`;
    output += `段落 ID: ${context.paragraphId}\n`;
    output += `时间: ${context.timestamp}\n\n`;

    output += `### 在场元素\n`;
    if (context.presentElements.length === 0) {
      output += `（无在场元素）\n`;
    } else {
      context.presentElements.forEach(element => {
        const typeLabel = this._getTypeLabel(element.type);
        output += `- ${typeLabel}: ${element.name}\n`;
      });
    }

    output += `\n### 所有元素\n`;
    context.elements.forEach(element => {
      const typeLabel = this._getTypeLabel(element.type);
      output += `\n${typeLabel}: ${element.name}\n`;
      output += `  描述: ${element.description}\n`;
      output += `  关键词: ${element.keywords.join(', ')}\n`;
      if (element.location) {
        output += `  位置: ${element.location}\n`;
      }
    });

    return output;
  }

  /**
   * 获取类型标签
   * @private
   */
  _getTypeLabel(type) {
    const labels = {
      character: '人物',
      item: '道具',
      location: '地点',
      memory: '记忆',
      base: '设定'
    };
    return labels[type] || type;
  }

  /**
   * 设置活动章节
   * @param {string} chapterId - 章节 ID
   */
  setActiveChapter(chapterId) {
    this.activeChapter = chapterId;
  }

  /**
   * 清除指定段落的缓存
   * @param {string} paragraphId - 段落 ID
   */
  invalidateParagraph(paragraphId) {
    this.paragraphCache.delete(paragraphId);
    this.cacheTimestamps.delete(paragraphId);
  }

  /**
   * 清除指定章节的缓存
   * @param {string} chapterId - 章节 ID
   */
  invalidateChapter(chapterId) {
    this.chapterCache.delete(chapterId);
    this.cacheTimestamps.delete(chapterId);

    // 清除该章节下所有段落缓存
    for (const [key, value] of this.paragraphCache) {
      if (key.startsWith(chapterId)) {
        this.paragraphCache.delete(key);
        this.cacheTimestamps.delete(key);
      }
    }
  }

  /**
   * 清除所有缓存
   */
  clearAll() {
    this.chapterCache.clear();
    this.paragraphCache.clear();
    this.cacheTimestamps.clear();
  }

  /**
   * 清除过期缓存
   */
  clearExpired() {
    const now = Date.now();

    // 清除过期的段落缓存
    for (const [key, timestamp] of this.cacheTimestamps) {
      if (!this._isCacheValid(timestamp)) {
        this.paragraphCache.delete(key);
        this.chapterCache.delete(key);
        this.cacheTimestamps.delete(key);
      }
    }
  }

  /**
   * 获取缓存统计信息
   * @returns {Object} 缓存统计
   */
  getCacheStats() {
    return {
      chapterCacheSize: this.chapterCache.size,
      paragraphCacheSize: this.paragraphCache.size,
      totalCacheSize: this.chapterCache.size + this.paragraphCache.size,
      cacheTTL: this.cacheTTL,
      activeChapter: this.activeChapter
    };
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StateContextCache;
}
