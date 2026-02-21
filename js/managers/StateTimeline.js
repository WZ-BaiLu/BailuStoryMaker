/**
 * StateTimeline - 状态时间线管理器
 * 提供全局状态索引和时光回溯查询功能
 */

class StateTimeline {
  constructor(elementManager, storyData) {
    this.elementManager = elementManager;
    this.storyData = storyData;

    // 段落级索引: Map<paragraphId, Array<ElementChange>>
    this.changesByParagraph = new Map();

    // 时间线索引: Map<storyTimeKey, paragraphId>
    this.timestampIndex = new Map();

    // 初始化索引
    this.indexChanges();
  }

  /**
   * 索引所有段落的状态变更
   */
  indexChanges() {
    this.changesByParagraph.clear();
    this.timestampIndex.clear();

    if (!this.storyData.chapters) {
      return;
    }

    // 遍历所有章节和段落
    this.storyData.chapters.forEach(chapter => {
      if (chapter.paragraphs) {
        chapter.paragraphs.forEach(paragraph => {
          if (paragraph.changes) {
            this.changesByParagraph.set(paragraph.id, paragraph.changes);
          }

          // 索引段落时间戳
          if (paragraph.storyTimestamp) {
            const timeKey = this._makeTimeKey(paragraph.storyTimestamp);
            this.timestampIndex.set(timeKey, paragraph.id);
          }
        });
      }
    });
  }

  /**
   * 创建时间键
   * @private
   */
  _makeTimeKey(storyTimestamp) {
    return `${storyTimestamp.chapterId}:${storyTimestamp.sequence}`;
  }

  /**
   * 索引段落时间戳
   * @param {string} paragraphId - 段落 ID
   * @param {Object} timestamp - 故事时间戳
   */
  indexParagraphTimestamp(paragraphId, timestamp) {
    const timeKey = this._makeTimeKey(timestamp);
    this.timestampIndex.set(timeKey, paragraphId);
  }

  /**
   * 根据时间查找段落
   * @param {Object} storyTime - 故事时间戳
   * @returns {Object|undefined} 段落
   */
  findParagraphByTime(storyTime) {
    const timeKey = this._makeTimeKey(storyTime);
    const paragraphId = this.timestampIndex.get(timeKey);

    if (!paragraphId) {
      return undefined;
    }

    return this._findParagraphById(paragraphId);
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
   * 获取段落的所有状态变更
   * @param {string} paragraphId - 段落 ID
   * @returns {Array} 状态变更列表
   */
  getParagraphChanges(paragraphId) {
    return this.changesByParagraph.get(paragraphId) || [];
  }

  /**
   * 获取元素在指定段落时的状态
   * @param {string} paragraphId - 段落 ID
   * @param {string} elementId - 元素 ID
   * @returns {Object} 元素状态
   */
  getElementStateAt(paragraphId, elementId) {
    return this.elementManager.getElementStateAt(elementId, paragraphId);
  }

  /**
   * 获取元素状态轨迹
   * @param {string} elementId - 元素 ID
   * @returns {Array} 状态轨迹 [{paragraphId, state}]
   */
  getElementStateTrajectory(elementId) {
    const trajectory = [];
    const element = this.elementManager.getElement(elementId);

    if (!element || !element.stateHistory) {
      return trajectory;
    }

    // 按段落 ID 排序
    const sortedHistory = [...element.stateHistory].sort((a, b) => {
      return a.paragraphId.localeCompare(b.paragraphId);
    });

    // 构建轨迹
    sortedHistory.forEach((stateChange, index) => {
      const state = element.getStateAt(stateChange.paragraphId);
      trajectory.push({
        paragraphId: stateChange.paragraphId,
        state: state,
        change: stateChange
      });
    });

    return trajectory;
  }

  /**
   * 获取元素状态历史
   * @param {string} elementId - 元素 ID
   * @returns {Array} 状态变更历史
   */
  getElementStateHistory(elementId) {
    const element = this.elementManager.getElement(elementId);

    if (!element) {
      throw new Error(`Element not found: ${elementId}`);
    }

    return [...element.stateHistory];
  }

  /**
   * 获取当前故事上下文
   * @param {string} paragraphId - 段落 ID
   * @returns {Object} 故事上下文
   */
  getCurrentContext(paragraphId) {
    const elements = this.elementManager.listElements();

    // 构建元素状态映射
    const elementStates = new Map();

    elements.forEach(element => {
      const state = element.getStateAt(paragraphId);
      elementStates.set(element.id, state);
    });

    return {
      paragraphId,
      elementStates,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 获取叙事类型感知的上下文
   * @param {string} paragraphId - 段落 ID
   * @returns {Object} 叙事上下文
   */
  getNarrativeContext(paragraphId) {
    const paragraph = this._findParagraphById(paragraphId);

    if (!paragraph || !paragraph.storyTimestamp) {
      return this.getCurrentContext(paragraphId);
    }

    const timestamp = paragraph.storyTimestamp;

    // 根据叙事类型调整查询
    if (timestamp.narrativeType === 'flashback') {
      // 倒叙：使用历史状态
      return this._getHistoricalContext(timestamp);
    } else if (timestamp.narrativeType === 'flashforward') {
      // 插叙：使用未来状态
      return this._getFutureContext(timestamp);
    } else if (timestamp.narrativeType === 'parallel') {
      // 平行叙事：使用绝对时间
      return this._getAbsoluteTimeContext(timestamp);
    }

    // 线性叙事：默认行为
    return this.getCurrentContext(paragraphId);
  }

  /**
   * 获取历史上下文（倒叙）
   * @private
   */
  _getHistoricalContext(timestamp) {
    const referenceParagraph = timestamp.referenceParagraphId
      ? this._findParagraphById(timestamp.referenceParagraphId)
      : null;

    if (!referenceParagraph) {
      return this.getCurrentContext('');
    }

    // 计算历史段落位置
    const historicalSequence = referenceParagraph.storyTimestamp.sequence + timestamp.timeOffset;
    const historicalParagraphId = this._findParagraphIdBySequence(
      timestamp.chapterId,
      historicalSequence
    );

    if (historicalParagraphId) {
      return this.getCurrentContext(historicalParagraphId);
    }

    return this.getCurrentContext('');
  }

  /**
   * 获取未来上下文（插叙）
   * @private
   */
  _getFutureContext(timestamp) {
    const referenceParagraph = timestamp.referenceParagraphId
      ? this._findParagraphById(timestamp.referenceParagraphId)
      : null;

    if (!referenceParagraph) {
      return this.getCurrentContext('999999'); // 使用最后一个段落
    }

    // 计算未来段落位置
    const futureSequence = referenceParagraph.storyTimestamp.sequence + timestamp.timeOffset;
    const futureParagraphId = this._findParagraphIdBySequence(
      timestamp.chapterId,
      futureSequence
    );

    if (futureParagraphId) {
      return this.getCurrentContext(futureParagraphId);
    }

    return this.getCurrentContext('999999');
  }

  /**
   * 获取绝对时间上下文（平行叙事）
   * @private
   */
  _getAbsoluteTimeContext(timestamp) {
    // 如果有 absoluteTime，基于绝对时间查找
    if (timestamp.absoluteTime) {
      // 简化版：当前只返回当前上下文
      // 实际实现需要基于 absoluteTime 查找
      return this.getCurrentContext('');
    }

    return this.getCurrentContext('');
  }

  /**
   * 根据章节和序号查找段落 ID
   * @private
   */
  _findParagraphIdBySequence(chapterId, sequence) {
    if (!this.storyData.chapters) {
      return null;
    }

    const chapter = this.storyData.chapters.find(c => c.id === chapterId);
    if (!chapter || !chapter.paragraphs) {
      return null;
    }

    const paragraph = chapter.paragraphs.find(p => p.storyTimestamp.sequence === sequence);
    return paragraph ? paragraph.id : null;
  }

  /**
   * 应用时间偏移
   * @param {Object} anchorParagraph - 锚点段落
   * @param {Object} storyTime - 故事时间
   * @returns {Object} 应用偏移后的时间
   */
  applyTimeOffset(anchorParagraph, storyTime) {
    if (!anchorParagraph.storyTimestamp) {
      return storyTime;
    }

    const anchorSequence = anchorParagraph.storyTimestamp.sequence;
    const newSequence = anchorSequence + (storyTime.timeOffset || 0);

    return {
      ...storyTime,
      sequence: newSequence
    };
  }

  /**
   * 根据故事时间查询元素状态
   * @param {Object} storyTime - 故事时间
   * @param {string} elementId - 元素 ID
   * @returns {Object} 元素状态
   */
  getStateAtStoryTime(storyTime, elementId) {
    const paragraphId = this.timestampIndex.get(this._makeTimeKey(storyTime));

    if (paragraphId) {
      return this.getElementStateAt(paragraphId, elementId);
    }

    throw new Error(`Paragraph not found for story time: ${JSON.stringify(storyTime)}`);
  }

  /**
   * 重新索引（当故事数据更新时调用）
   */
  reindex() {
    this.indexChanges();
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StateTimeline;
}
