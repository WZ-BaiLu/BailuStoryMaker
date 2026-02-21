/**
 * StoryElement - 统一的故事元素基类
 * 支持人物、道具、地点、记忆、基础设定等元素类型
 */

class StoryElement {
  /**
   * @param {Object} data - 元素数据
   * @param {string} data.type - 元素类型: 'character'|'item'|'location'|'memory'|'base'
   * @param {string} data.name - 元素名称
   * @param {string} data.description - 元素描述
   * @param {string[]} [data.keywords=[]] - 关键词
   * @param {string|null} [data.location=null] - 所在位置 (location elementId 或 null)
   * @param {Array} [data.stateHistory=[]] - 状态变更历史
   */
  constructor(data) {
    // Validate and provide defaults for required fields
    if (!data.type) {
      throw new Error('StoryElement requires type');
    }
    if (!data.name) {
      throw new Error('StoryElement requires name');
    }
    if (data.description === null || data.description === undefined) {
      throw new Error('StoryElement requires description');
    }

    this.id = data.id || this._generateId(data.type, data.name);
    this.type = this._validateType(data.type);
    this.name = data.name;
    this.description = data.description || ''; // Allow empty string
    this.keywords = Array.isArray(data.keywords) ? data.keywords : [];
    this.location = data.location || null;
    this.stateDescription = data.stateDescription || {};
    this.stateHistory = Array.isArray(data.stateHistory) ? data.stateHistory : [];

    // 添加默认关键词
    this._addDefaultKeywords();
  }

  /**
   * 生成唯一 ID
   * @private
   */
  _generateId(type, name) {
    const sequence = Date.now();
    const cleanName = name.replace(/\s+/g, '-').toLowerCase();
    return `${type}-${cleanName}-${sequence}`;
  }

  /**
   * 验证元素类型
   * @private
   */
  _validateType(type) {
    const validTypes = ['character', 'item', 'location', 'memory', 'base'];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid element type: ${type}. Must be one of: ${validTypes.join(', ')}`);
    }
    return type;
  }

  /**
   * 添加默认关键词
   * @private
   */
  _addDefaultKeywords() {
    const typeKeywords = {
      character: ['人物'],
      item: ['道具'],
      location: ['地点'],
      memory: ['记忆'],
      base: ['设定']
    };

    const defaults = typeKeywords[this.type] || [];
    defaults.forEach(keyword => {
      if (!this.keywords.includes(keyword)) {
        this.keywords.push(keyword);
      }
    });

    // 添加名称作为关键词
    if (!this.keywords.includes(this.name)) {
      this.keywords.push(this.name);
    }
  }

  /**
   * 记录状态变更
   * @param {string} paragraphId - 段落 ID
   * @param {Object} changes - 变更内容
   */
  recordStateChange(paragraphId, changes) {
    const stateChange = {
      paragraphId,
      timestamp: new Date().toISOString(),
      changes
    };
    this.stateHistory.push(stateChange);
  }

  /**
   * 获取指定段落时的状态
   * @param {string} paragraphId - 段落 ID
   * @returns {Object} 元素在指定段落时的状态
   */
  getStateAt(paragraphId) {
    // 过滤出该段落之前的状态变更
    const relevantHistory = this.stateHistory.filter(
      sc => this._isBefore(sc, paragraphId)
    );

    // 应用所有变更
    let state = {
      location: this.location,
      description: this.description,
      stateDescription: { ...this.stateDescription },
      keywords: [...this.keywords]
    };

    relevantHistory.forEach(sc => {
      state = this._applyChange(state, sc.changes);
    });

    return state;
  }

  /**
   * 判断状态变更是否在指定段落之前
   * @private
   */
  _isBefore(stateChange, paragraphId) {
    // 简化版：假设段落 ID 包含章节和序号信息
    // 实际实现需要根据段落索引判断
    return stateChange.paragraphId <= paragraphId;
  }

  /**
   * 应用状态变更
   * @private
   */
  _applyChange(state, changes) {
    const newState = { ...state };

    if (changes.location !== undefined) {
      newState.location = changes.location;
    }
    if (changes.description !== undefined) {
      newState.description = changes.description;
    }
    if (changes.stateDescription !== undefined) {
      newState.stateDescription = {
        ...newState.stateDescription,
        ...changes.stateDescription
      };
    }
    if (changes.keywords !== undefined) {
      newState.keywords = [...changes.keywords];
    }
    if (changes.status !== undefined && !newState.keywords.includes(changes.status)) {
      newState.keywords.push(changes.status);
    }

    return newState;
  }

  /**
   * 添加关键词
   * @param {string} keyword - 关键词
   */
  addKeyword(keyword) {
    if (!this.keywords.includes(keyword)) {
      this.keywords.push(keyword);
    }
  }

  /**
   * 移除关键词
   * @param {string} keyword - 关键词
   */
  removeKeyword(keyword) {
    const index = this.keywords.indexOf(keyword);
    if (index > -1) {
      this.keywords.splice(index, 1);
    }
  }

  /**
   * 序列化为 JSON
   */
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      name: this.name,
      description: this.description,
      keywords: [...this.keywords],
      location: this.location,
      stateDescription: { ...this.stateDescription },
      stateHistory: [...this.stateHistory]
    };
  }

  /**
   * 从 JSON 创建实例
   */
  static fromJSON(json) {
    return new StoryElement(json);
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StoryElement;
}
