/**
 * StoryTimestamp - 段落时间戳
 * 支持线性叙事、倒叙、插叙、平行叙事等叙事类型
 */

class StoryTimestamp {
  /**
   * @param {Object} data - 时间戳数据
   * @param {string} data.chapterId - 章节 ID
   * @param {number} data.sequence - 段落序号
   * @param {string} [data.absoluteTime] - 绝对时间 (如 "2023-06-15")
   * @param {string} [data.relativeTime] - 相对时间 (如 "三天前")
   * @param {'linear'|'flashback'|'flashforward'|'parallel'} [data.narrativeType='linear'] - 叙事类型
   * @param {string} [data.referenceParagraphId] - 参考段落 ID (用于非线性叙事)
   * @param {number} [data.timeOffset=0] - 时间偏移量 (单位：段落数)
   */
  constructor(data) {
    if (!data.chapterId || data.sequence === undefined) {
      throw new Error('StoryTimestamp requires chapterId and sequence');
    }

    this.chapterId = data.chapterId;
    this.sequence = data.sequence;
    this.absoluteTime = data.absoluteTime || null;
    this.relativeTime = data.relativeTime || null;
    this.narrativeType = this._validateNarrativeType(data.narrativeType || 'linear');
    this.referenceParagraphId = data.referenceParagraphId || null;
    this.timeOffset = data.timeOffset !== undefined ? data.timeOffset : 0;

    // 如果是线性叙事，清除引用段落和偏移
    if (this.narrativeType === 'linear') {
      this.referenceParagraphId = null;
      this.timeOffset = 0;
    }
  }

  /**
   * 验证叙事类型
   * @private
   */
  _validateNarrativeType(type) {
    const validTypes = ['linear', 'flashback', 'flashforward', 'parallel'];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid narrative type: ${type}. Must be one of: ${validTypes.join(', ')}`);
    }
    return type;
  }

  /**
   * 设置叙事类型
   * @param {string} type - 叙事类型
   * @param {string} [referenceParagraphId] - 参考段落 ID
   * @param {number} [timeOffset] - 时间偏移量
   */
  setNarrativeType(type, referenceParagraphId = null, timeOffset = null) {
    this.narrativeType = this._validateNarrativeType(type);

    if (type === 'linear') {
      this.referenceParagraphId = null;
      this.timeOffset = 0;
    } else {
      if (referenceParagraphId) {
        this.referenceParagraphId = referenceParagraphId;
      }
      if (timeOffset !== null) {
        this.timeOffset = timeOffset;
      }
    }
  }

  /**
   * 设置绝对时间
   * @param {string} absoluteTime - 绝对时间
   */
  setAbsoluteTime(absoluteTime) {
    this.absoluteTime = absoluteTime;
  }

  /**
   * 设置相对时间
   * @param {string} relativeTime - 相对时间
   */
  setRelativeTime(relativeTime) {
    this.relativeTime = relativeTime;
  }

  /**
   * 检查是否为线性叙事
   */
  isLinear() {
    return this.narrativeType === 'linear';
  }

  /**
   * 检查是否为倒叙
   */
  isFlashback() {
    return this.narrativeType === 'flashback';
  }

  /**
   * 检查是否为插叙
   */
  isFlashforward() {
    return this.narrativeType === 'flashforward';
  }

  /**
   * 检查是否为平行叙事
   */
  isParallel() {
    return this.narrativeType === 'parallel';
  }

  /**
   * 计算实际故事时间
   * @returns {Object} {chapterId, sequence} 实际故事位置
   */
  getStoryPosition() {
    if (this.isLinear()) {
      return { chapterId: this.chapterId, sequence: this.sequence };
    }

    // 对于非线性叙事，基于参考段落和偏移量计算
    // 注意：这里返回的是故事时间中的实际位置
    return {
      chapterId: this.chapterId,
      sequence: this.sequence + this.timeOffset
    };
  }

  /**
   * 比较两个时间戳
   * @param {StoryTimestamp} other - 另一个时间戳
   * @returns {number} -1 (this < other), 0 (equal), 1 (this > other)
   */
  compareTo(other) {
    if (this.chapterId !== other.chapterId) {
      return this.chapterId < other.chapterId ? -1 : 1;
    }
    return this.sequence - other.sequence;
  }

  /**
   * 创建线性叙事时间戳
   */
  static linear(chapterId, sequence) {
    return new StoryTimestamp({ chapterId, sequence });
  }

  /**
   * 创建倒叙时间戳
   */
  static flashback(chapterId, sequence, referenceParagraphId, timeOffset) {
    return new StoryTimestamp({
      chapterId,
      sequence,
      narrativeType: 'flashback',
      referenceParagraphId,
      timeOffset: timeOffset || -10 // 默认向前偏移10个段落
    });
  }

  /**
   * 创建插叙时间戳
   */
  static flashforward(chapterId, sequence, referenceParagraphId, timeOffset) {
    return new StoryTimestamp({
      chapterId,
      sequence,
      narrativeType: 'flashforward',
      referenceParagraphId,
      timeOffset: timeOffset || 10 // 默认向后偏移10个段落
    });
  }

  /**
   * 创建平行叙事时间戳
   */
  static parallel(chapterId, sequence, referenceParagraphId) {
    return new StoryTimestamp({
      chapterId,
      sequence,
      narrativeType: 'parallel',
      referenceParagraphId,
      timeOffset: 0
    });
  }

  /**
   * 序列化为 JSON
   */
  toJSON() {
    return {
      chapterId: this.chapterId,
      sequence: this.sequence,
      absoluteTime: this.absoluteTime,
      relativeTime: this.relativeTime,
      narrativeType: this.narrativeType,
      referenceParagraphId: this.referenceParagraphId,
      timeOffset: this.timeOffset
    };
  }

  /**
   * 从 JSON 创建实例
   */
  static fromJSON(json) {
    return new StoryTimestamp(json);
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StoryTimestamp;
}
