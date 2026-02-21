/**
 * StateChange - 状态变更记录
 * 记录元素在特定段落的状态变更
 */

class StateChange {
  /**
   * @param {Object} data - 状态变更数据
   * @param {string} data.paragraphId - 段落 ID
   * @param {string} [data.timestamp] - 变更时间戳
   * @param {Object} data.changes - 变更内容
   */
  constructor(data) {
    if (!data.paragraphId || !data.changes) {
      throw new Error('StateChange requires paragraphId and changes');
    }

    this.paragraphId = data.paragraphId;
    this.timestamp = data.timestamp || new Date().toISOString();
    this.changes = this._validateChanges(data.changes);
  }

  /**
   * 验证变更内容
   * @private
   */
  _validateChanges(changes) {
    const validChangeTypes = [
      'location',
      'description',
      'stateDescription',
      'keywords',
      'status'
    ];

    const validated = {};

    Object.keys(changes).forEach(key => {
      if (validChangeTypes.includes(key)) {
        validated[key] = changes[key];
      } else {
        console.warn(`Invalid change type: ${key}`);
      }
    });

    if (Object.keys(validated).length === 0) {
      throw new Error('No valid changes provided');
    }

    return validated;
  }

  /**
   * 创建位置变更
   */
  static locationChange(paragraphId, newLocation, owner = null) {
    const changes = { location: newLocation };
    if (owner !== null) {
      changes.owner = owner;
    }
    return new StateChange({
      paragraphId,
      changes
    });
  }

  /**
   * 创建描述变更
   */
  static descriptionChange(paragraphId, description) {
    return new StateChange({
      paragraphId,
      changes: { description }
    });
  }

  /**
   * 创建状态描述变更
   */
  static stateDescriptionChange(paragraphId, stateDescription) {
    return new StateChange({
      paragraphId,
      changes: { stateDescription }
    });
  }

  /**
   * 创建关键词变更
   */
  static keywordsChange(paragraphId, keywords) {
    return new StateChange({
      paragraphId,
      changes: { keywords }
    });
  }

  /**
   * 创建状态变更
   */
  static statusChange(paragraphId, status) {
    return new StateChange({
      paragraphId,
      changes: { status }
    });
  }

  /**
   * 序列化为 JSON
   */
  toJSON() {
    return {
      paragraphId: this.paragraphId,
      timestamp: this.timestamp,
      changes: { ...this.changes }
    };
  }

  /**
   * 从 JSON 创建实例
   */
  static fromJSON(json) {
    return new StateChange(json);
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StateChange;
}
