/**
 * AIElementTools - AI 元素工具管理器
 * 为 AI 提供元素管理的工具接口
 */

class AIElementTools {
  constructor(elementManager, stateTimeline, storyData) {
    this.elementManager = elementManager;
    this.stateTimeline = stateTimeline;
    this.storyData = storyData;

    // 工具超时时间（毫秒）
    this.toolTimeout = 10000;
  }

  /**
   * 添加元素
   * @param {Object} params - 元素参数
   * @returns {Promise<Object>} 创建的元素
   */
  async addElement(params) {
    try {
      return this._executeWithTimeout(() => {
        return this._addElement(params);
      });
    } catch (error) {
      return this._handleError('addElement', error);
    }
  }

  /**
   * 内部添加元素实现
   * @private
   */
  _addElement(params) {
    const { type, name, description, keywords } = params;

    // 验证必需字段
    if (!type || !name || !description) {
      throw new Error('Missing required fields: type, name, description');
    }

    // 验证元素类型
    const validTypes = ['character', 'item', 'location', 'memory', 'base'];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid element type: ${type}`);
    }

    // 添加元素
    const element = this.elementManager.addElement({
      type,
      name,
      description,
      keywords
    });

    return {
      success: true,
      element: element.toJSON()
    };
  }

  /**
   * 更新元素位置
   * @param {Object} params - 更新参数
   * @returns {Promise<Object>} 更新结果
   */
  async updateElementLocation(params) {
    try {
      return this._executeWithTimeout(() => {
        return this._updateElementLocation(params);
      });
    } catch (error) {
      return this._handleError('updateElementLocation', error);
    }
  }

  /**
   * 内部更新元素位置实现
   * @private
   */
  _updateElementLocation(params) {
    const { elementId, location } = params;

    // 验证元素存在（支持通过 ID 或名称查找）
    let element = this.elementManager.getElement(elementId);
    if (!element) {
      // 尝试通过名称查找
      element = this.elementManager.findElementByName(elementId);
      if (!element) {
        throw new Error(`Element not found: ${elementId}`);
      }
    }

    // 验证位置（如果设置）
    let locationElementId = location;
    if (location !== null) {
      let locationElement = this.elementManager.getElement(location);
      if (!locationElement) {
        // 尝试通过名称查找
        locationElement = this.elementManager.findElementByName(location);
        if (!locationElement) {
          throw new Error(`Location not found: ${location}`);
        }
      }
      if (locationElement.type !== 'location') {
        throw new Error(`Element ${location} is not a location`);
      }
      locationElementId = locationElement.id;
    }

    // 更新位置
    this.elementManager.updateElementLocation(element.id, locationElementId);

    return {
      success: true,
      message: `Element "${element.name}" location updated to ${location || 'none'}`
    };
  }

  /**
   * 更新元素描述
   * @param {Object} params - 更新参数
   * @returns {Promise<Object>} 更新结果
   */
  async updateElementDescription(params) {
    try {
      return this._executeWithTimeout(() => {
        return this._updateElementDescription(params);
      });
    } catch (error) {
      return this._handleError('updateElementDescription', error);
    }
  }

  /**
   * 内部更新元素描述实现
   * @private
   */
  _updateElementDescription(params) {
    const { elementId, description, stateDescription, keywords, status } = params;

    // 验证元素存在
    const element = this.elementManager.getElement(elementId);
    if (!element) {
      throw new Error(`Element not found: ${elementId}`);
    }

    // 收集变更
    const changes = {};
    const updates = {};

    if (description !== undefined) {
      updates.description = description;
      changes.description = description;
    }

    if (stateDescription !== undefined) {
      updates.stateDescription = stateDescription;
      changes.stateDescription = stateDescription;
    }

    if (keywords !== undefined) {
      if (!Array.isArray(keywords)) {
        throw new Error('keywords must be an array');
      }
      // 验证所有关键词都是字符串
      const invalidKeywords = keywords.filter(k => typeof k !== 'string');
      if (invalidKeywords.length > 0) {
        throw new Error('All keywords must be strings');
      }
      updates.keywords = keywords;
      changes.keywords = keywords;
    }

    if (status !== undefined) {
      // 添加状态关键词
      this.elementManager.addKeyword(elementId, status);
      changes.status = status;
    }

    // 应用更新
    if (Object.keys(updates).length > 0) {
      this.elementManager.updateElement(elementId, updates);
    }

    return {
      success: true,
      message: `Element "${element.name}" description updated`,
      changes
    };
  }

  /**
   * 更新段落时间戳
   * @param {Object} params - 更新参数
   * @returns {Promise<Object>} 更新结果
   */
  async updateParagraphTimestamp(params) {
    try {
      return this._executeWithTimeout(() => {
        return this._updateParagraphTimestamp(params);
      });
    } catch (error) {
      return this._handleError('updateParagraphTimestamp', error);
    }
  }

  /**
   * 获取当前上下文信息（包括地点）
   * @param {Object} params - 参数（可选，可包含 chapterId 和 paragraphId）
   * @returns {Promise<Object>} 上下文信息
   */
  async getContextInfo(params) {
    try {
      return this._executeWithTimeout(() => {
        return this._getContextInfo(params);
      });
    } catch (error) {
      return this._handleError('getContextInfo', error);
    }
  }

  /**
   * 内部获取上下文信息实现
   * @private
   */
  _getContextInfo(params) {
    const { chapterId, paragraphId } = params || {};

    // 获取所有地点
    const locations = this.elementManager.listElements('location');
    const locationNames = locations.map(loc => loc.name);

    // 如果提供了 chapterId 和 paragraphId，尝试获取更精确的上下文
    let currentLocation = null;
    let elementsAtLocation = [];

    if (chapterId && this.storyData.chapters) {
      const chapter = this.storyData.chapters.find(c => c.id === chapterId);

      if (chapter && chapter.paragraphs) {
        // 搜索最近的地点变化
        for (let i = chapter.paragraphs.length - 1; i >= 0; i--) {
          const p = chapter.paragraphs[i];

          // 如果指定了段落ID，只搜索该段落之前的段落
          if (paragraphId && p.id === paragraphId) {
            break;
          }

          if (p.changes && p.changes.elements) {
            for (const elementChange of p.changes.elements) {
              if (elementChange.stateChanges?.location) {
                currentLocation = elementChange.stateChanges.location;

                // 获取在该地点的元素
                if (currentLocation) {
                  elementsAtLocation = this.elementManager.getElementsAtLocation(currentLocation)
                    .map(el => ({
                      id: el.id,
                      name: el.name,
                      type: el.type
                    }));
                }

                break;
              }
            }

            if (currentLocation) {
              break;
            }
          }
        }
      }
    }

    return {
      success: true,
      data: {
        currentLocation: currentLocation,
        locations: locationNames,
        elementsAtLocation: elementsAtLocation,
        totalLocations: locations.length
      }
    };
  }

  /**
   * 列出指定类型的元素
   * @param {Object} params - 参数
   * @returns {Promise<Object>} 元素列表
   */
  async listElements(params) {
    try {
      return this._executeWithTimeout(() => {
        return this._listElements(params);
      });
    } catch (error) {
      return this._handleError('listElements', error);
    }
  }

  /**
   * 内部列出元素实现
   * @private
   */
  _listElements(params) {
    const { types } = params || {};

    // 如果没有指定类型，返回所有元素
    if (!types || !Array.isArray(types) || types.length === 0) {
      const allElements = this.elementManager.listElements();
      return {
        success: true,
        data: {
          elements: allElements.map(el => ({
            id: el.id,
            type: el.type,
            name: el.name,
            description: el.description
          })),
          total: allElements.length
        }
      };
    }

    // 映射类型名称
    const typeMap = {
      'characters': 'character',
      'locations': 'location',
      'items': 'item',
      'memories': 'memory',
      'bases': 'base'
    };

    const result = {
      success: true,
      data: {
        elements: [],
        byType: {},
        total: 0
      }
    };

    // 查询每种类型
    for (const type of types) {
      const internalType = typeMap[type];
      if (!internalType) {
        console.warn(`[AIElementTools] Unknown element type: ${type}`);
        continue;
      }

      const elements = this.elementManager.listElements(internalType);
      const formattedElements = elements.map(el => ({
        id: el.id,
        type: el.type,
        name: el.name,
        description: el.description
      }));

      result.data.elements.push(...formattedElements);
      result.data.byType[type] = formattedElements.map(el => el.name);
    }

    result.data.total = result.data.elements.length;

    return result;
  }

  /**
   * 内部更新段落时间戳实现
   * @private
   */
  _updateParagraphTimestamp(params) {
    const { paragraphId, narrativeType, referenceParagraphId, timeOffset, absoluteTime, relativeTime } = params;

    // 查找段落
    const paragraph = this._findParagraphById(paragraphId);
    if (!paragraph) {
      throw new Error(`Paragraph not found: ${paragraphId}`);
    }

    // 验证叙事类型（如果提供）
    if (narrativeType) {
      const validTypes = ['linear', 'flashback', 'flashforward', 'parallel'];
      if (!validTypes.includes(narrativeType)) {
        throw new Error(`Invalid narrative type: ${narrativeType}`);
      }
    }

    // 验证参考段落（如果提供）
    if (referenceParagraphId) {
      const referenceParagraph = this._findParagraphById(referenceParagraphId);
      if (!referenceParagraph) {
        throw new Error(`Reference paragraph not found: ${referenceParagraphId}`);
      }
    }

    // 创建或更新时间戳
    let timestamp = paragraph.storyTimestamp
      ? new StoryTimestamp(paragraph.storyTimestamp)
      : new StoryTimestamp({
          chapterId: this._extractChapterId(paragraphId),
          sequence: this._extractSequence(paragraphId)
        });

    // 应用更新
    if (narrativeType) {
      // 计算自动偏移（如果未提供）
      let calculatedOffset = timeOffset;

      if (calculatedOffset === undefined && referenceParagraphId && narrativeType !== 'linear') {
        const referenceParagraph = this._findParagraphById(referenceParagraphId);
        if (referenceParagraph && referenceParagraph.storyTimestamp) {
          const refSequence = referenceParagraph.storyTimestamp.sequence;
          const currentSequence = timestamp.sequence;

          if (narrativeType === 'flashback') {
            calculatedOffset = refSequence - currentSequence - 10; // 向前偏移
          } else if (narrativeType === 'flashforward') {
            calculatedOffset = refSequence - currentSequence + 10; // 向后偏移
          } else if (narrativeType === 'parallel') {
            calculatedOffset = 0;
          }
        }
      }

      timestamp.setNarrativeType(narrativeType, referenceParagraphId, calculatedOffset);
    }

    if (absoluteTime !== undefined) {
      timestamp.setAbsoluteTime(absoluteTime);
    }

    if (relativeTime !== undefined) {
      timestamp.setRelativeTime(relativeTime);
    }

    // 更新段落
    paragraph.storyTimestamp = timestamp.toJSON();

    // 更新 StateTimeline 索引
    this.stateTimeline.indexParagraphTimestamp(paragraphId, timestamp);

    return {
      success: true,
      message: `Paragraph timestamp updated to ${timestamp.narrativeType}`,
      timestamp: timestamp.toJSON()
    };
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
   * 从段落 ID 提取章节 ID
   * @private
   */
  _extractChapterId(paragraphId) {
    const parts = paragraphId.split('-');
    if (parts.length >= 2) {
      parts.pop(); // 移除序列号
      return parts.join('-');
    }
    return paragraphId;
  }

  /**
   * 从段落 ID 提取序列号
   * @private
   */
  _extractSequence(paragraphId) {
    const parts = paragraphId.split('-');
    if (parts.length >= 1) {
      const lastPart = parts[parts.length - 1];
      const sequence = parseInt(lastPart, 10);
      return isNaN(sequence) ? 0 : sequence;
    }
    return 0;
  }

  /**
   * 带超时执行的函数
   * @private
   */
  _executeWithTimeout(fn) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Tool execution timeout'));
      }, this.toolTimeout);

      try {
        const result = fn();
        clearTimeout(timeout);
        resolve(result);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  /**
   * 处理错误
   * @private
   */
  _handleError(toolName, error) {
    console.error(`AI tool error [${toolName}]:`, error);

    return {
      success: false,
      error: error.message || 'Unknown error'
    };
  }

  /**
   * 获取所有工具定义
   * @returns {Array} 工具定义列表
   */
  getToolDefinitions() {
    return [
      {
        type: 'function',
        function: {
          name: 'listElements',
          description: '列出指定类型的元素，用于查询已存在的元素（人物、地点、道具等）',
          parameters: {
            type: 'object',
            properties: {
              types: {
                type: 'array',
                items: {
                  type: 'string',
                  enum: ['characters', 'locations', 'items', 'memories', 'bases']
                },
                description: '元素类型数组，如 ["locations", "characters"]'
              }
            }
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'getContextInfo',
          description: '获取当前上下文信息，包括当前地点、所有地点列表、在当前地点的元素等',
          parameters: {
            type: 'object',
            properties: {
              chapterId: {
                type: 'string',
                description: '章节 ID（可选）'
              },
              paragraphId: {
                type: 'string',
                description: '段落 ID（可选）'
              }
            }
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'addElement',
          description: '添加新的故事元素（人物、道具、地点等）',
          parameters: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['character', 'item', 'location', 'memory', 'base'],
                description: '元素类型'
              },
              name: {
                type: 'string',
                description: '元素名称'
              },
              description: {
                type: 'string',
                description: '元素描述'
              },
              keywords: {
                type: 'array',
                items: { type: 'string' },
                description: '关键词数组（可选）'
              }
            },
            required: ['type', 'name', 'description']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'updateElementLocation',
          description: '更新元素的位置',
          parameters: {
            type: 'object',
            properties: {
              elementId: {
                type: 'string',
                description: '元素 ID 或元素名称'
              },
              location: {
                type: 'string',
                description: '位置元素 ID 或位置名称，或 null（表示无位置）'
              }
            },
            required: ['elementId', 'location']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'updateElementDescription',
          description: '更新元素的描述和状态',
          parameters: {
            type: 'object',
            properties: {
              elementId: {
                type: 'string',
                description: '元素 ID'
              },
              description: {
                type: 'string',
                description: '元素描述（可选）'
              },
              stateDescription: {
                type: 'object',
                description: '状态描述对象（可选）'
              },
              keywords: {
                type: 'array',
                items: { type: 'string' },
                description: '关键词数组（可选）'
              },
              status: {
                type: 'string',
                description: '状态关键词，如"破损"、"被遗忘"（可选）'
              }
            },
            required: ['elementId']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'updateParagraphTimestamp',
          description: '更新段落的时间戳，支持倒叙、插叙、平行叙事',
          parameters: {
            type: 'object',
            properties: {
              paragraphId: {
                type: 'string',
                description: '段落 ID'
              },
              narrativeType: {
                type: 'string',
                enum: ['linear', 'flashback', 'flashforward', 'parallel'],
                description: '叙事类型（可选）'
              },
              referenceParagraphId: {
                type: 'string',
                description: '参考段落 ID（用于非线性叙事）'
              },
              timeOffset: {
                type: 'number',
                description: '时间偏移量（可选，未提供则自动计算）'
              },
              absoluteTime: {
                type: 'string',
                description: '绝对时间（可选）'
              },
              relativeTime: {
                type: 'string',
                description: '相对时间（可选）'
              }
            },
            required: ['paragraphId']
          }
        }
      }
    ];
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIElementTools;
}
