/**
 * ElementManager - 故事元素管理器
 * 负责元素的 CRUD 操作和状态历史管理
 */

const StoryElement = require('../models/StoryElement');

class ElementManager {
  constructor(storyData) {
    this.storyData = storyData;
    this.elements = new Map(); // Map<elementId, StoryElement>
    this.elementCounter = {}; // 每种类型的计数器

    // 初始化现有元素
    if (storyData.elements) {
      this._initializeElements(storyData.elements);
    }
  }

  /**
   * 初始化现有元素
   * @private
   */
  _initializeElements(elements) {
    elements.forEach(elementData => {
      const element = new StoryElement(elementData);
      this.elements.set(element.id, element);

      // 更新计数器
      this._updateElementCounter(element.type, element.name);
    });
  }

  /**
   * 更新元素计数器
   * @private
   */
  _updateElementCounter(type, name) {
    if (!this.elementCounter[type]) {
      this.elementCounter[type] = {};
    }
    const key = name.toLowerCase();
    this.elementCounter[type][key] = (this.elementCounter[type][key] || 0) + 1;
  }

  /**
   * 生成唯一 ID
   * @param {string} type - 元素类型
   * @param {string} name - 元素名称
   * @returns {string} 唯一 ID
   */
  _generateUniqueId(type, name) {
    const key = name.toLowerCase();
    const sequence = (this.elementCounter[type]?.[key] || 0) + 1;
    const cleanName = name.replace(/\s+/g, '-').toLowerCase();
    return `${type}-${cleanName}-${sequence}`;
  }

  /**
   * 添加元素
   * @param {Object} params - 元素参数
   * @returns {StoryElement} 创建的元素
   */
  addElement(params) {
    const { type, name, description, keywords, location, stateDescription } = params;

    // 验证必需字段
    if (!type || !name || !description) {
      throw new Error('Element requires type, name, and description');
    }

    // 生成唯一 ID（不在这里检查重名，因为 ID 是唯一的）
    const id = this._generateUniqueId(type, name);

    // 创建元素
    const element = new StoryElement({
      id,
      type,
      name,
      description,
      keywords: keywords || [],
      location: location || null,
      stateDescription: stateDescription || {}
    });

    // 保存元素
    this.elements.set(element.id, element);
    this._updateElementCounter(type, name);

    // 添加到 storyData.elements
    if (!this.storyData.elements) {
      this.storyData.elements = [];
    }
    this.storyData.elements.push(element.toJSON());

    return element;
  }

  /**
   * 更新元素
   * @param {string} elementId - 元素 ID
   * @param {Object} updates - 更新内容
   * @returns {StoryElement} 更新后的元素
   */
  updateElement(elementId, updates) {
    const element = this.elements.get(elementId);
    if (!element) {
      throw new Error(`Element not found: ${elementId}`);
    }

    // 更新字段
    if (updates.description !== undefined) {
      element.description = updates.description;
    }
    if (updates.keywords !== undefined) {
      element.keywords = updates.keywords;
    }
    if (updates.stateDescription !== undefined) {
      element.stateDescription = updates.stateDescription;
    }

    // 更新 storyData.elements
    this._updateStoryDataElements();

    return element;
  }

  /**
   * 删除元素
   * @param {string} elementId - 元素 ID
   */
  deleteElement(elementId) {
    const element = this.elements.get(elementId);
    if (!element) {
      throw new Error(`Element not found: ${elementId}`);
    }

    this.elements.delete(elementId);

    // 从 storyData.elements 删除
    this.storyData.elements = this.storyData.elements.filter(
      e => e.id !== elementId
    );
  }

  /**
   * 获取元素
   * @param {string} elementId - 元素 ID
   * @returns {StoryElement|undefined} 元素
   */
  getElement(elementId) {
    return this.elements.get(elementId);
  }

  /**
   * 根据名称查找元素
   * @param {string} name - 元素名称
   * @returns {StoryElement|undefined} 元素
   */
  findElementByName(name) {
    for (const element of this.elements.values()) {
      if (element.name === name) {
        return element;
      }
    }
    return undefined;
  }

  /**
   * 列出所有元素
   * @param {string} [type] - 按类型过滤
   * @returns {StoryElement[]} 元素列表
   */
  listElements(type) {
    let elements = Array.from(this.elements.values());

    if (type) {
      elements = elements.filter(e => e.type === type);
    }

    return elements;
  }

  /**
   * 添加关键词
   * @param {string} elementId - 元素 ID
   * @param {string} keyword - 关键词
   */
  addKeyword(elementId, keyword) {
    const element = this.elements.get(elementId);
    if (!element) {
      throw new Error(`Element not found: ${elementId}`);
    }

    element.addKeyword(keyword);
    this._updateStoryDataElements();
  }

  /**
   * 移除关键词
   * @param {string} elementId - 元素 ID
   * @param {string} keyword - 关键词
   */
  removeKeyword(elementId, keyword) {
    const element = this.elements.get(elementId);
    if (!element) {
      throw new Error(`Element not found: ${elementId}`);
    }

    element.removeKeyword(keyword);
    this._updateStoryDataElements();
  }

  /**
   * 根据关键词查询元素
   * @param {string|string[]} keywords - 关键词或关键词数组
   * @returns {StoryElement[]} 匹配的元素列表
   */
  queryByKeywords(keywords) {
    const keywordArray = Array.isArray(keywords) ? keywords : [keywords];
    const results = [];

    for (const element of this.elements.values()) {
      const matchAll = keywordArray.every(keyword =>
        element.keywords.includes(keyword)
      );
      if (matchAll) {
        results.push(element);
      }
    }

    return results;
  }

  /**
   * 更新元素位置
   * @param {string} elementId - 元素 ID
   * @param {string|null} location - 位置 ID 或 null
   */
  updateElementLocation(elementId, location) {
    const element = this.elements.get(elementId);
    if (!element) {
      throw new Error(`Element not found: ${elementId}`);
    }

    // 如果设置了位置，验证位置是否存在且为地点类型
    if (location !== null) {
      const locationElement = this.elements.get(location);
      if (!locationElement) {
        throw new Error(`Location not found: ${location}`);
      }
      if (locationElement.type !== 'location') {
        throw new Error(`Element ${location} is not a location`);
      }
    }

    element.location = location;
    this._updateStoryDataElements();
  }

  /**
   * 记录状态变更
   * @param {string} elementId - 元素 ID
   * @param {string} paragraphId - 段落 ID
   * @param {Object} changes - 变更内容
   */
  recordStateChange(elementId, paragraphId, changes) {
    const element = this.elements.get(elementId);
    if (!element) {
      throw new Error(`Element not found: ${elementId}`);
    }

    element.recordStateChange(paragraphId, changes);
    this._updateStoryDataElements();
  }

  /**
   * 获取元素在指定段落时的状态
   * @param {string} elementId - 元素 ID
   * @param {string} paragraphId - 段落 ID
   * @returns {Object} 元素状态
   */
  getElementStateAt(elementId, paragraphId) {
    const element = this.elements.get(elementId);
    if (!element) {
      throw new Error(`Element not found: ${elementId}`);
    }

    return element.getStateAt(paragraphId);
  }

  /**
   * 获取元素当前状态
   * @param {string} elementId - 元素 ID
   * @returns {Object} 元素当前状态
   */
  getElementCurrentState(elementId) {
    const element = this.elements.get(elementId);
    if (!element) {
      throw new Error(`Element not found: ${elementId}`);
    }

    return {
      location: element.location,
      description: element.description,
      stateDescription: element.stateDescription,
      keywords: [...element.keywords]
    };
  }

  /**
   * 获取元素在指定地点的所有元素
   * @param {string} locationId - 地点 ID
   * @returns {StoryElement[]} 在该地点的元素
   */
  getElementsAtLocation(locationId) {
    return this.listElements().filter(e => e.location === locationId);
  }

  /**
   * 更新 storyData.elements
   * @private
   */
  _updateStoryDataElements() {
    this.storyData.elements = Array.from(this.elements.values()).map(e => e.toJSON());
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ElementManager;
}
